# -*- coding: utf-8 -*-
"""AI 导演 v2：多阶段 Agent 编排（风格定调 → 分批逐镜 → 节奏审查）+ 分级缓存。

流程（每次渲染约 5~7 次 LLM 调用）：
0. 模板相关性判定（1 次）：选题与模板库（行星/宇宙域场景）是否相关；
   无关 → from_scratch，强制剥离 scene/星空氛围（工作区规则，见 AGENTS.md）
1. 风格圣经（1 次）：look/kicker/BGM 选曲/节奏基调；缓存键 = md5(用户风格+提示词)
2. 分批逐镜（ceil(N/6) 次）：每批携带上一批尾部决策保证连续性；
   每镜方案按「镜头内容+风格」哈希缓存——改一镜只重导该镜所在批
3. 节奏审查（1 次，仅在有新编排时）：只对违规镜头输出最小 patch

缓存 storage/projects/<pid>/director.json v2：
{"v": 2, "script_hash": ..., "style_key": ..., "look": {...}, "kicker": ...,
 "bgm": {...}, "shots": [{"hash": ..., "plan": {...}}, ...]}

降级链（全部通过 progress 上报原因，不再静默）：
- 风格阶段失败 → 默认 look，继续逐镜编排
- 某批编排失败 → 该批镜头走模板内置规则（camera=None 语义不变）
- 审查失败 → 直接采用编排结果

枚举与 DataVideo.tsx 严格对齐：
- camera → camFor/CAM_INDEX 的 11 种运镜
- transition → TransitionKind 7 类转场（进入该镜）
- overlay → dv/overlays.tsx 的 6 种浮层
- atmosphere → dv/atmosphere.tsx 的 5 种氛围层
"""
import hashlib
import json
import logging
import math
import re
from pathlib import Path
from typing import Callable

from ..config import PROJECTS_DIR
from ..schemas import ScriptDraft
from . import palette

log = logging.getLogger("director")

CAMERAS = {
    "push", "pull", "pan_left", "pan_right", "tilt_up", "tilt_down",
    "diag_in", "diag_out", "dolly_zoom", "handheld", "still",
}
TRANSITIONS = {"dissolve", "whip", "zoom", "flash", "cut", "glitch", "slide"}
ATMOS_KINDS = {"none", "stars", "rain", "dust", "embers"}
SFX_MOMENTS = {"impact", "riser", "whoosh"}
OVERLAY_KINDS = {"counter", "typewriter", "chat", "stat", "toast", "terminal"}
# 代码绘制动画场景（与 remotion-life-sim/src/dv/scenes.tsx 的 SCENE_KINDS 对齐）
SCENE_KINDS = {
    "nebula", "accretion", "impact", "moonform", "solar",
    "ocean", "volcano", "ice", "meteor", "life", "city",
}

# 每批编排的镜头数（每次 LLM 调用负责的镜头数）
BATCH_SIZE = 6

_INTENSITY = (0.6, 1.6, 1.0)
_CONTRAST = (0.9, 1.3, 1.05)
_SATURATE = (0.6, 1.5, 1.1)
_BRIGHTNESS = (0.9, 1.15, 1.03)
_TINT_OPACITY = (0.0, 0.4, 0.2)
_GRAIN = (0.0, 0.12, 0.06)
_BGM_VOLUME = (0.2, 1.0, 0.72)
_VIGNETTE = (0.0, 1.5, 1.0)
_ATMO_OPACITY = (0.0, 1.0, 0.8)

# 设计令牌 v2（与 Remotion 端 src/system/tokens.ts 对齐）
LOOK_PRESETS = set(palette.LOOK_PRESETS)
LAYOUTS = {
    "cover", "statement", "quote", "list", "data", "photo-full",
    "photo-inset", "comparison", "caption-bottom", "chapter", "tools",
}
ALIGNS = {"left", "center", "right"}
TEXT_STYLES = {"display", "body", "mono"}
EASINGS = {"editorial", "snappy", "soft", "linear"}
SCENE3D_KINDS = {"type-orbit", "grid-field", "card-stack", "orbit-object", "none"}

# 默认风格：浅色纸感（去 AI 味），深色只作为显式选择
DEFAULT_LOOK: dict = {
    **palette.preset_look(palette.DEFAULT_PRESET),
    "subtitleStyle": "bold",
    "atmosphere": None,
}


def _default_look() -> dict:
    """DEFAULT_LOOK 的深拷贝，避免调用方原地修改污染默认值。"""
    return json.loads(json.dumps(DEFAULT_LOOK))


def _clamp(v, lo, hi, default):
    try:
        f = float(v)
    except (TypeError, ValueError):
        return default
    return round(min(hi, max(lo, f)), 3)


def _grade(s: dict) -> dict:
    g = s.get("grade") or {}
    return {
        "contrast": _clamp(g.get("contrast"), *_CONTRAST),
        "saturate": _clamp(g.get("saturate"), *_SATURATE),
        "brightness": _clamp(g.get("brightness"), *_BRIGHTNESS),
        "tintOpacity": _clamp(g.get("tintOpacity", g.get("tint_opacity")), *_TINT_OPACITY),
    }


def _hex_color(v, default=None):
    if not isinstance(v, str):
        return default
    v = v.strip()
    if re.fullmatch(r"#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})", v):
        return v
    return default


def _clean_text(v, max_len: int) -> str | None:
    if not isinstance(v, str):
        return None
    v = v.strip()
    return v[:max_len] if v else None


def validate_overlay(raw) -> dict | None:
    """清洗浮层：kind 白名单 + 按 kind 校验必填字段；非法返回 None（本镜无浮层）。"""
    if not isinstance(raw, dict) or raw.get("kind") not in OVERLAY_KINDS:
        return None
    kind = raw["kind"]
    out: dict = {"kind": kind}
    if kind == "counter":
        try:
            out["value"] = round(float(raw.get("value")), 3)
        except (TypeError, ValueError):
            return None
        label = _clean_text(raw.get("label"), 24)
        unit = _clean_text(raw.get("unit"), 8)
        if label:
            out["label"] = label
        if unit:
            out["unit"] = unit
    elif kind == "typewriter":
        text = _clean_text(raw.get("text"), 40)
        if not text:
            return None
        out["text"] = text
    elif kind == "chat":
        text = _clean_text(raw.get("text"), 60)
        if not text:
            return None
        out["text"] = text
        out["side"] = "right" if raw.get("side") == "right" else "left"
        name = _clean_text(raw.get("name"), 12)
        if name:
            out["name"] = name
    elif kind == "stat":
        label = _clean_text(raw.get("label"), 16)
        if not label:
            return None
        try:
            out["from"] = round(float(raw.get("from")), 3)
            out["to"] = round(float(raw.get("to")), 3)
        except (TypeError, ValueError):
            return None
        out["label"] = label
        unit = _clean_text(raw.get("unit"), 8)
        if unit:
            out["unit"] = unit
    elif kind == "toast":
        text = _clean_text(raw.get("text"), 40)
        if not text:
            return None
        out["text"] = text
        out["tone"] = raw.get("tone") if raw.get("tone") in ("error", "info", "success") else "info"
    else:  # terminal
        lines_raw = raw.get("lines") if isinstance(raw.get("lines"), list) else []
        cleaned = [t for t in (_clean_text(x, 30) for x in lines_raw) if t]
        if not cleaned:
            return None
        out["lines"] = cleaned[:4]
    return out


def validate_atmosphere(raw) -> dict | None:
    """清洗氛围层；kind 非法返回 None（不指定，沿用全局）。"""
    if not isinstance(raw, dict):
        return None
    kind = raw.get("kind")
    if kind not in ATMOS_KINDS:
        return None
    out = {"kind": kind}
    if kind != "none":
        out["opacity"] = _clamp(raw.get("opacity"), *_ATMO_OPACITY)
    return out


def _validate_type(raw) -> dict | None:
    if not isinstance(raw, dict):
        return None
    out = {k: v for k in ("display", "body", "mono") if (v := _clean_text(raw.get(k), 32))}
    return out or None


def _validate_grid(raw) -> dict | None:
    if not isinstance(raw, dict):
        return None
    out: dict = {}
    if raw.get("margin") is not None:
        out["margin"] = int(_clamp(raw.get("margin"), 0, 240, 96))
    if raw.get("columns") is not None:
        out["columns"] = int(_clamp(raw.get("columns"), 2, 12, 6))
    if raw.get("baseline") is not None:
        out["baseline"] = int(_clamp(raw.get("baseline"), 4, 48, 12))
    return out or None


def _validate_texture(raw) -> dict | None:
    if not isinstance(raw, dict):
        return None
    out: dict = {}
    for k in ("grain", "paper", "halftone", "vignette"):
        if raw.get(k) is not None:
            out[k] = _clamp(raw.get(k), 0.0, 1.0, 0.0)
    return out or None


def _validate_motion(raw) -> dict | None:
    if not isinstance(raw, dict):
        return None
    out: dict = {}
    if raw.get("tempo") is not None:
        out["tempo"] = _clamp(raw.get("tempo"), 0.5, 2.0, 1.0)
    if raw.get("easing") in EASINGS:
        out["easing"] = raw["easing"]
    if raw.get("stagger") is not None:
        out["stagger"] = int(_clamp(raw.get("stagger"), 0, 12, 2))
    return out or None


def validate_look(raw) -> dict:
    """清洗风格圣经的 look 段；非法字段逐项回退默认，并做可访问性/去 AI 味体检。

    显式给出的合法颜色不会被审美性改写，只有对比度低于 3:1 时才兜底修正。
    """
    look = _default_look()
    if not isinstance(raw, dict):
        return look
    preset = raw.get("preset")
    if preset in LOOK_PRESETS:
        look.update(palette.preset_look(preset))
        look["subtitleStyle"] = "bold"
        look["atmosphere"] = None
    accent = _hex_color(raw.get("accent"))
    if accent:
        look["accent"] = accent
    pal = raw.get("palette")
    if isinstance(pal, (list, tuple)) and len(pal) >= 2:
        c1, c2 = _hex_color(pal[0]), _hex_color(pal[1])
        if c1 and c2:
            look["palette"] = [c1, c2]
            if "bg" not in raw and "mode" not in raw:
                bg = palette.infer_bg([c1, c2])
                look["bg"] = bg
                look["mode"] = "light" if bg == "paper" else "dark"
                if preset not in LOOK_PRESETS:
                    look["preset"] = "paper" if bg == "paper" else "dark"
    if raw.get("vignette") is not None:
        look["vignette"] = _clamp(raw.get("vignette"), *_VIGNETTE)
    if raw.get("subtitleStyle") in ("bold", "pill"):
        look["subtitleStyle"] = raw["subtitleStyle"]
    if raw.get("bg") in ("dark", "paper"):
        look["bg"] = raw["bg"]
        look["mode"] = "light" if raw["bg"] == "paper" else "dark"
    if raw.get("mode") in ("light", "dark"):
        look["mode"] = raw["mode"]
        look["bg"] = "paper" if raw["mode"] == "light" else "dark"
    ink = _hex_color(raw.get("ink"))
    if ink:
        look["ink"] = ink
    support = _hex_color(raw.get("support"))
    if support:
        look["support"] = support
    for key, fn in (
        ("type", _validate_type),
        ("grid", _validate_grid),
        ("texture", _validate_texture),
        ("motion", _validate_motion),
    ):
        parsed = fn(raw.get(key))
        if parsed:
            look[key] = parsed
    repaired = palette.repair_contrast(look)
    for warning in palette.look_warnings(repaired):
        log.info("look 告警：%s", warning)
    atmo = validate_atmosphere(raw.get("atmosphere"))
    if atmo and atmo["kind"] != "none":
        look["atmosphere"] = atmo
    return repaired


def validate_scene(raw) -> dict | None:
    """清洗代码绘制场景：kind 白名单（含 agent 现写的 gen: 场景）+ 可选配色/速度；非法返回 None。"""
    if not isinstance(raw, dict):
        return None
    kind = raw.get("kind")
    if kind not in SCENE_KINDS:
        # 六步流程"现场编写"的定制场景：gen:<pid>:<NN>
        if not (isinstance(kind, str) and re.fullmatch(r"gen:[A-Za-z0-9_:\-]{1,60}", kind)):
            return None
    out: dict = {"kind": kind}
    pal = raw.get("palette")
    if isinstance(pal, (list, tuple)) and len(pal) >= 2:
        c1, c2 = _hex_color(pal[0]), _hex_color(pal[1])
        if c1 and c2:
            out["palette"] = [c1, c2]
    accent = _hex_color(raw.get("accent"))
    if accent:
        out["accent"] = accent
    if raw.get("speed") is not None:
        out["speed"] = _clamp(raw.get("speed"), 0.5, 2.0, 1.0)
    return out


def validate_shot_plan(raw, line_count: int) -> dict:
    """清洗单镜编排：非法枚举置 None（回退模板规则）、数值 clamp、浮层/氛围/场景逐项校验。"""
    s = raw if isinstance(raw, dict) else {}
    camera_per_line = None
    cpl_raw = s.get("cameraPerLine", s.get("camera_per_line"))
    if isinstance(cpl_raw, list):
        mapped = [c if c in CAMERAS else None for c in cpl_raw[: max(1, line_count)]]
        if any(mapped):
            # 契约要求 list[str] 无 None：非法句延续上一个合法运镜（保持节奏连贯），
            # 开头不足处用首个合法值兜底；长度补齐到句数
            out = []
            last = None
            for c in mapped:
                if c:
                    last = c
                out.append(c if c else last)
            first = next((c for c in out if c), None)
            out = [c if c else first for c in out]
            while len(out) < line_count and out:
                out.append(out[-1])
            if len(out) == line_count and all(out):
                camera_per_line = out
    emphasis = None
    emp_raw = s.get("emphasis")
    if isinstance(emp_raw, list):
        words = [w for w in (_clean_text(x, 12) for x in emp_raw) if w][:4]
        if words:
            emphasis = words
    focal = None
    focal_raw = s.get("focal")
    if isinstance(focal_raw, (list, tuple)) and len(focal_raw) == 2:
        try:
            fx, fy = float(focal_raw[0]), float(focal_raw[1])
            if 0.0 <= fx <= 1.0 and 0.0 <= fy <= 1.0:
                focal = [round(fx, 3), round(fy, 3)]
        except (TypeError, ValueError):
            pass
    text_style = s.get("textStyle", s.get("text_style"))
    scene3d = None
    s3 = s.get("scene3d", s.get("scene_3d"))
    if isinstance(s3, dict) and s3.get("kind") in SCENE3D_KINDS and s3.get("kind") != "none":
        scene3d = {
            "kind": s3["kind"],
            "intensity": _clamp(s3.get("intensity"), 0.0, 1.0, 0.5),
        }
    return {
        "camera": s.get("camera") if s.get("camera") in CAMERAS else None,
        "cameraPerLine": camera_per_line,
        "intensity": _clamp(s.get("intensity"), *_INTENSITY),
        "transition": s.get("transition") if s.get("transition") in TRANSITIONS else None,
        "grade": _grade(s),
        "grain": _clamp(s.get("grain", s.get("grain_opacity")), *_GRAIN),
        "overlay": validate_overlay(s.get("overlay")),
        "sfxMoment": s.get("sfxMoment", s.get("sfx_moment")) if s.get("sfxMoment", s.get("sfx_moment")) in SFX_MOMENTS else None,
        "atmosphere": validate_atmosphere(s.get("atmosphere")),
        "scene": validate_scene(s.get("scene")),
        "emphasis": emphasis,
        # ---- 版式系统 v2 ----
        "layout": s.get("layout") if s.get("layout") in LAYOUTS else None,
        "align": s.get("align") if s.get("align") in ALIGNS else None,
        "focal": focal,
        "textStyle": text_style if text_style in TEXT_STYLES else None,
        "scene3d": scene3d,
    }


def validate_bgm(raw) -> dict:
    bgm_raw = raw if isinstance(raw, dict) else {}
    track = str(bgm_raw.get("track") or "").strip()
    out = {
        "track": track,
        "volume": _clamp(bgm_raw.get("volume"), *_BGM_VOLUME),
        "query": "",
    }
    if track == "__search__":
        out["query"] = str(_clean_text(bgm_raw.get("query"), 80) or "")
    return out


# ---- 模板相关性（工作区规则 AGENTS.md：无关内容禁止注入模板场景）----
TEMPLATE_MODES = {"reuse", "from_scratch"}
# from_scratch 只剥离模板专属意象；通用词表（运镜/转场/调色/浮层）保留
_TEMPLATE_ONLY_ATMOS = {"stars"}


def validate_template_info(raw) -> dict:
    """清洗相关性判定结果；非法/缺失输入保守按 from_scratch（宁可不复用，不许误注入）。"""
    if not isinstance(raw, dict) or raw.get("mode") not in TEMPLATE_MODES:
        return {
            "mode": "from_scratch",
            "reason": "判定输出缺失或非法，保守走从零创作",
            "reusable": [],
        }
    reusable = [r for r in (raw.get("reusable") or []) if isinstance(r, str) and r.strip()][:6]
    reason = _clean_text(raw.get("reason"), 120) or ""
    return {"mode": raw["mode"], "reason": reason, "reusable": reusable}


def sanitize_plan_for_mode(look: dict, shots_plans: list[dict], mode: str) -> int:
    """mode=from_scratch 时剥离模板专属元素（代码场景 / 星空氛围），原地修改。

    通用词表（camera/transition/grade/overlay）不是模板专属，全部保留。
    返回剥离次数（日志与测试用）。
    """
    if mode != "from_scratch":
        return 0
    stripped = 0

    def _strip(obj: dict) -> int:
        n = 0
        scene = obj.get("scene")
        # gen: 场景是本片现场编写的定制内容，不属于模板词库，from_scratch 也不剥离
        if isinstance(scene, dict) and not str(scene.get("kind") or "").startswith("gen:"):
            obj["scene"] = None
            n += 1
        atmo = obj.get("atmosphere")
        if isinstance(atmo, dict) and atmo.get("kind") in _TEMPLATE_ONLY_ATMOS:
            obj["atmosphere"] = None
            n += 1
        return n

    if isinstance(look, dict):
        stripped += _strip(look)
    for p in shots_plans:
        if isinstance(p, dict):
            stripped += _strip(p)
    return stripped


def script_fingerprint(script: ScriptDraft) -> str:
    """脚本内容指纹：变了才需要重新生成导演方案。"""
    return hashlib.md5(script.model_dump_json().encode("utf-8")).hexdigest()[:12]


def style_key(style_hint: str, prompt_hint: str) -> str:
    """风格缓存键：用户风格/提示词变了才重定风格圣经。"""
    return hashlib.md5(f"{style_hint}|{prompt_hint}".encode("utf-8")).hexdigest()[:12]


def shot_hash(shot, style_k: str) -> str:
    """单镜缓存键：台词/标签/配色 + 风格键。风格变了全部镜头需要重导。"""
    payload = json.dumps(
        {
            "style": style_k,
            "year": shot.year,
            "label": shot.label,
            "colors": list(shot.colors),
            "lines": [l.text for l in shot.lines],
        },
        ensure_ascii=False,
    )
    return hashlib.md5(payload.encode("utf-8")).hexdigest()[:12]


def _plan_path(project_id: str) -> Path:
    return PROJECTS_DIR / project_id / "director.json"


def load_cached_plan(project_id: str) -> dict | None:
    """读取 v2 缓存；结构不符/版本不符返回 None。"""
    p = _plan_path(project_id)
    if not p.exists():
        return None
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
        if data.get("v") == 2 and isinstance(data.get("shots"), list):
            return data
        log.info("director.json 为旧版格式，忽略")
    except Exception as e:  # noqa: BLE001
        log.warning("director.json 读取失败，忽略: %s", e)
    return None


def save_plan(project_id: str, plan: dict) -> None:
    p = _plan_path(project_id)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(plan, ensure_ascii=False, indent=1), encoding="utf-8")


def _tail_context(shots_plans: list[dict]) -> list[dict]:
    """上一批末尾 2 镜的紧凑决策（连续性上下文）。"""
    out = []
    for p in shots_plans[-2:]:
        item = {
            k: p.get(k)
            for k in ("camera", "transition", "intensity", "sfxMoment")
            if p.get(k) is not None
        }
        if p.get("overlay"):
            item["overlayKind"] = p["overlay"].get("kind")
        out.append(item)
    return out


def _apply_patch(plan: dict, patch: dict) -> None:
    """把审查 patch 覆盖到单镜方案（字段级，非法字段忽略）。"""
    if not isinstance(patch, dict):
        return
    if patch.get("camera") in CAMERAS:
        plan["camera"] = patch["camera"]
    if patch.get("transition") in TRANSITIONS:
        plan["transition"] = patch["transition"]
    if patch.get("intensity") is not None:
        plan["intensity"] = _clamp(patch["intensity"], *_INTENSITY)
    if patch.get("grain") is not None:
        plan["grain"] = _clamp(patch["grain"], *_GRAIN)
    if "overlay" in patch:
        plan["overlay"] = validate_overlay(patch["overlay"])
    if "atmosphere" in patch:
        plan["atmosphere"] = validate_atmosphere(patch["atmosphere"])
    if patch.get("sfxMoment") in SFX_MOMENTS or patch.get("sfxMoment") is None:
        plan["sfxMoment"] = patch.get("sfxMoment")
    if patch.get("layout") in LAYOUTS:
        plan["layout"] = patch["layout"]
    if patch.get("align") in ALIGNS:
        plan["align"] = patch["align"]
    if patch.get("textStyle") in TEXT_STYLES:
        plan["textStyle"] = patch["textStyle"]


def _directed_shot_count(shots_plans: list[dict]) -> int:
    """有多少镜真正由 AI 指定了运镜（用于决定是否跑审查）。"""
    return sum(1 for p in shots_plans if p.get("camera"))


def create_plan(
    project_id: str,
    script: ScriptDraft,
    style_hint: str,
    prompt_hint: str,
    bgm_tracks: list[dict],
    generate_style_fn: Callable[[], dict],
    generate_batch_fn: Callable[[int, int, list[dict]], dict],
    critic_fn: Callable[[list[dict]], dict] | None,
    progress: Callable[[str], None] | None = None,
    judge_fn: Callable[[], dict] | None = None,
    mode_box: dict | None = None,
    preset_look: dict | None = None,
) -> dict:
    """多阶段导演编排（LLM 调用由注入函数承担，便于测试与解耦）。

    judge_fn: () -> dict              阶段 0 模板相关性判定原始输出（None=跳过判定，
                                      按 reuse 处理，兼容旧调用方/测试）
    mode_box: dict | None             回传盒：判定结束后写入 mode，供调用方闭包
                                      （generate_*_fn）把 from_scratch 禁令注入提示词
    generate_style_fn: () -> dict           阶段 1 原始输出
    generate_batch_fn: (start, end, tail) -> dict   阶段 2 单批原始输出
    critic_fn: (plan_shots) -> dict | None  阶段 3；None 表示跳过审查
    progress: 消息回调（阶段进度/降级原因实时上报，不再静默）
    preset_look: 六步流程"定样式"用户选定的方案 {name, why, kicker, look}；
                                      提供时跳过阶段 1 的 LLM，直接注入该风格

    返回 v2 plan（含 template 相关性结论/look/kicker/bgm/shots[*] 与 _stats 统计）。
    """

    def _msg(text: str) -> None:
        log.info("[director] %s", text)
        if progress:
            try:
                progress(text)
            except Exception:  # noqa: BLE001 — 回调异常不阻断
                pass

    sk = style_key(style_hint, prompt_hint)
    n = len(script.shots)
    fp = script_fingerprint(script)
    cached = load_cached_plan(project_id)
    cached_shot_plans: dict[str, dict] = {}
    if cached:
        for item in cached.get("shots", []):
            if isinstance(item, dict) and item.get("hash") and isinstance(item.get("plan"), dict):
                cached_shot_plans[item["hash"]] = item["plan"]

    # ---- 阶段 0：模板相关性判定（AGENTS.md 工作区规则；脚本未变则复用上次判定）----
    template_info: dict | None = None
    if cached and cached.get("script_hash") == fp and isinstance(cached.get("template"), dict):
        template_info = validate_template_info(cached["template"])
        _msg(f"模板相关性命中缓存：{template_info['mode']}")
    elif judge_fn is not None:
        try:
            _msg("AI 导演(1/4)：模板相关性判定…")
            template_info = validate_template_info(judge_fn())
        except Exception as e:  # noqa: BLE001 — 判定失败保守从零，不阻断
            template_info = validate_template_info(None)
            template_info["reason"] = f"判定调用失败: {e}"[:120]
        _msg(
            f"模板相关性：{template_info['mode']}"
            + (f"（{template_info['reason']}）" if template_info["reason"] else "")
        )
    if template_info is None:
        # 旧调用方/测试未提供 judge_fn → 维持既有复用行为
        template_info = {"mode": "reuse", "reason": "未判定（未提供判定函数）", "reusable": []}
    if mode_box is not None:
        mode_box["mode"] = template_info["mode"]

    # ---- 阶段 1：风格圣经（缓存键=风格+提示词；六步流程可注入用户选定风格）----
    look: dict | None = None
    kicker = ""
    bgm: dict | None = None
    if preset_look:
        raw_look = preset_look.get("look") if isinstance(preset_look, dict) else None
        look = validate_look(raw_look or {}) or dict(DEFAULT_LOOK)
        kicker = str(_clean_text(preset_look.get("kicker"), 16) or "")
        style_ok = True
        _msg(
            f"使用用户选定风格「{preset_look.get('name') or '自定义'}」："
            f"强调色 {look['accent']} / 底色 {look.get('bg') or 'dark'}"
        )
    elif cached and cached.get("style_key") == sk and cached.get("look"):
        look = cached["look"]
        kicker = str(cached.get("kicker") or "")
        bgm = cached.get("bgm") if isinstance(cached.get("bgm"), dict) else None
        _msg("风格圣经命中缓存，直接复用")
    else:
        try:
            _msg("AI 导演(2/4)：视觉风格定调…")
            raw = generate_style_fn()
            look = validate_look(raw.get("look") or raw)
            kicker = str(_clean_text(raw.get("kicker"), 12) or "")
            bgm = validate_bgm(raw.get("bgm") or {})
            _msg(f"风格定调完成：强调色 {look['accent']} / 氛围 {(look.get('atmosphere') or {}).get('kind', 'none')}")
        except Exception as e:  # noqa: BLE001 — 风格失败不阻断
            look = None
            _msg(f"风格定调失败，使用默认风格继续: {e}")
    style_ok = look is not None

    # ---- 阶段 2：分批逐镜（单镜哈希缓存：命中即复用）----
    hashes = [shot_hash(s, sk) for s in script.shots]
    shots_plans: list[dict | None] = [None] * n
    reused = 0
    for i, h in enumerate(hashes):
        if h in cached_shot_plans:
            shots_plans[i] = cached_shot_plans[h]
            reused += 1

    batches = math.ceil(n / BATCH_SIZE)
    for b in range(batches):
        start, end = b * BATCH_SIZE, min((b + 1) * BATCH_SIZE, n)
        idxs = [i for i in range(start, end) if shots_plans[i] is None]
        if not idxs:
            _msg(f"逐镜编排 批次 {b + 1}/{batches}：全部命中缓存")
            continue
        tail = _tail_context([p for p in shots_plans[:start] if p])
        try:
            _msg(f"AI 导演(3/4)：逐镜编排 批次 {b + 1}/{batches}（镜头 {start + 1}~{end}）…")
            raw = generate_batch_fn(start, end, tail)
            raw_shots = raw.get("shots") if isinstance(raw.get("shots"), list) else []
            for k, i in enumerate(idxs):
                # LLM 输出按批内相对位置对齐（也可能按全片 index，两种都兼容）
                s_raw = raw_shots[k] if k < len(raw_shots) else (
                    raw_shots[i - start] if i - start < len(raw_shots) else {}
                )
                shots_plans[i] = validate_shot_plan(s_raw, len(script.shots[i].lines))
        except Exception as e:  # noqa: BLE001 — 该批走模板规则
            _msg(f"批次 {b + 1}/{batches} 编排失败，这些镜头回退模板规则: {e}")
            for i in idxs:
                shots_plans[i] = validate_shot_plan({}, len(script.shots[i].lines))

    # ---- from_scratch 强制清洗：剥离模板专属元素（scene/星空），通用词表保留 ----
    stripped = sanitize_plan_for_mode(look, [p for p in shots_plans if p], template_info["mode"])
    if stripped:
        _msg(f"from_scratch 清洗：剥离模板专属元素 {stripped} 处")

    # ---- 阶段 3：节奏审查（有新编排时才跑；全量缓存命中则跳过）----
    critic_used = False
    has_new = reused < n
    if critic_fn is not None and has_new and _directed_shot_count(shots_plans) > 0:
        try:
            _msg("AI 导演(4/4)：节奏审查…")
            result = critic_fn(shots_plans)
            patches = result.get("patches") if isinstance(result, dict) else None
            if isinstance(patches, list):
                applied = 0
                for p in patches:
                    if isinstance(p, dict):
                        i = p.get("index")
                        if isinstance(i, int) and 0 <= i < n and shots_plans[i] is not None:
                            _apply_patch(shots_plans[i], p)
                            applied += 1
                critic_used = applied > 0
                _msg(f"节奏审查完成：修正 {applied} 处")
        except Exception as e:  # noqa: BLE001 — 审查失败直接采用编排结果
            _msg(f"节奏审查失败，直接采用编排结果: {e}")

    # ---- 落库（单镜哈希表 + 全局段）----
    plan = {
        "v": 2,
        "script_hash": fp,
        "style_key": sk,
        "style_ok": style_ok,
        "critic_used": critic_used,
        "template": template_info,
        "look": look or dict(DEFAULT_LOOK),
        "kicker": kicker,
        "bgm": bgm or {"track": "", "volume": 0.72},
        "shots": [
            {"hash": hashes[i], "plan": shots_plans[i] or validate_shot_plan({}, len(script.shots[i].lines))}
            for i in range(n)
        ],
    }
    save_plan(project_id, plan)
    plan["_stats"] = {
        "shots_total": n,
        "shots_reused": reused,
        "batches": batches,
        "style_ok": style_ok,
        "critic_used": critic_used,
        "template_mode": template_info["mode"],
    }
    return plan


def get_or_create_plan(
    project_id: str,
    script: ScriptDraft,
    bgm_tracks: list[dict],
    generate_fn,
) -> dict:
    """旧版单调用接口（v1 兼容保留，新流程请用 create_plan）。"""
    cached = load_cached_plan(project_id)
    if cached and cached.get("script_hash") == script_fingerprint(script):
        plans = [item.get("plan") for item in cached.get("shots", [])]
        return {
            "shots": [p for p in plans if p],
            "bgm": cached.get("bgm") or {"track": "", "volume": 0.72},
        }
    raw = generate_fn()
    sk = style_key("", "")
    plan = {
        "v": 2,
        "script_hash": script_fingerprint(script),
        "style_key": sk,
        "look": dict(DEFAULT_LOOK),
        "kicker": "",
        "bgm": validate_bgm(raw.get("bgm") or {}),
        "shots": [
            {
                "hash": shot_hash(s, sk),
                "plan": validate_shot_plan(
                    (raw.get("shots") or [])[i] if i < len(raw.get("shots") or []) else {},
                    len(s.lines),
                ),
            }
            for i, s in enumerate(script.shots)
        ],
    }
    save_plan(project_id, plan)
    return {
        "shots": [item["plan"] for item in plan["shots"]],
        "bgm": plan["bgm"],
    }
