# -*- coding: utf-8 -*-
"""纯逻辑：把脚本草稿 + 配音时长 + 图片路径组装成 DataVideo 的渲染 props。"""
import re
from typing import Optional

from ..schemas import (
    AtmosphereSpec,
    BgmSpec,
    GradeSpec,
    LookSpec,
    MarketData,
    MarketMarker,
    MarketShot,
    OverlaySpec,
    RenderProps,
    RenderShot,
    Scene3DSpec,
    SceneSpec,
    ScriptDraft,
    TimedLine,
    ToolSpec,
)

DEFAULT_TAIL = 0.6
LINE_GAP = 0.35
LEAD = 0.7

# emphasis 兜底提取：数字（带可选量词）与书名号/引号引语，与 Remotion 端 EMPHASIS_RE 同族
_EMPHASIS_RE = re.compile(
    r"[0-9]+(?:\.[0-9]+)?(?:%|万|亿|千|百|十|岁|年|个|天|次|块|元)?|「[^」]{1,12}」|“[^”]{1,12}”"
)


def _default_emphasis(text: str) -> list[str] | None:
    """AI 未给强调词时，自动提取数字/引语（渲染端金色高亮）。"""
    words = []
    for m in _EMPHASIS_RE.findall(text):
        if m and m not in words:
            words.append(m)
    return words[:4] or None


def pause_after(text: str) -> float:
    """按句尾标点决定停顿，模拟人说话的呼吸节奏。"""
    t = text.rstrip()
    if not t:
        return 0.4
    if t.endswith(("？", "?", "！", "!")):
        return 0.6
    if t.endswith(("…", "...")):
        return 0.65
    if t.endswith(("。", ".")):
        return 0.5
    if t.endswith(("，", ",", "、", "；", ";")):
        return 0.25
    return 0.4


def line_id(shot_idx: int, line_idx: int) -> str:
    """与既有 gen_voice.py 命名风格一致：s01_0, s01_1, s02_0 ..."""
    return f"s{shot_idx + 1:02d}_{line_idx}"


def _grade_spec(p: dict) -> Optional[GradeSpec]:
    grade = p.get("grade") or {}
    if not any(v is not None for v in grade.values()):
        return None
    return GradeSpec(
        contrast=grade.get("contrast"),
        saturate=grade.get("saturate"),
        brightness=grade.get("brightness"),
        tint_opacity=grade.get("tintOpacity", grade.get("tint_opacity")),
    )


def _overlay_spec(p: dict) -> Optional[OverlaySpec]:
    o = p.get("overlay")
    if not isinstance(o, dict):
        return None
    return OverlaySpec(**{k: v for k, v in o.items() if v is not None})


def _atmosphere_spec(a) -> Optional[AtmosphereSpec]:
    if not isinstance(a, dict):
        return None
    return AtmosphereSpec(**{k: v for k, v in a.items() if v is not None})


def _scene_spec(s) -> Optional[SceneSpec]:
    if not isinstance(s, dict):
        return None
    return SceneSpec(**{k: v for k, v in s.items() if v is not None})


def _scene3d_spec(s) -> Optional[Scene3DSpec]:
    if not isinstance(s, dict):
        return None
    payload = {k: v for k, v in s.items() if v is not None}
    return Scene3DSpec(**payload) if payload else None


def _tool_spec(s) -> Optional[ToolSpec]:
    if not isinstance(s, dict):
        return None
    return ToolSpec(**{k: v for k, v in s.items() if v is not None})


def _market_shot_spec(s) -> Optional[MarketShot]:
    if not isinstance(s, dict):
        return None
    payload = {k: v for k, v in s.items() if v is not None}
    markers = payload.get("markers")
    if isinstance(markers, list):
        payload["markers"] = [
            MarketMarker(**m) for m in markers if isinstance(m, dict)
        ] or None
    return MarketShot(**payload) if payload else None


def _look_spec(plan: dict) -> Optional[LookSpec]:
    look = plan.get("look")
    if not isinstance(look, dict):
        return None
    payload = {k: v for k, v in look.items() if v is not None}
    if not payload:
        return None
    return LookSpec(**payload)


def text_line_duration(text: str) -> float:
    """无配音模式的屏显时长：按阅读速度估算（约 3.6 字/秒，最短 1.4 秒）。"""
    chars = len((text or "").strip())
    return round(max(1.4, 0.35 + chars / 3.6), 3)


def text_durations(script: ScriptDraft) -> dict[str, float]:
    """无配音模式：全部台词按屏显阅读速度估算时长。"""
    out: dict[str, float] = {}
    for si, shot in enumerate(script.shots):
        for li, line in enumerate(shot.lines):
            out[line_id(si, li)] = text_line_duration(line.text)
    return out


def assemble_props(
    script: ScriptDraft,
    durations: dict[str, float],
    image_rels: list[str | None],
    bgm: Optional[BgmSpec] = None,
    title_card: bool = True,
    plan: Optional[dict] = None,
    grain_opacity: Optional[float] = None,
    prefer_images: bool = False,
    with_line_audio: bool = True,
    market: Optional[MarketData] = None,
    safe_scale: Optional[float] = None,
) -> RenderProps:
    """durations: {line_id: 秒}；image_rels: 与 shots 对齐的 public 相对路径（可为 None）。

    plan: AI 导演 v2 方案（director.create_plan 的输出，shots 为 [{hash, plan}]）；
    缺省/缺镜时全部走模板内置规则。若某句缺时长，回退为按字数估算（约 4.5 字/秒，
    中文口播），保证渲染不中断。
    prefer_images: 六步流程用——该幕已选定真实图片时 scene=None（图优先于代码场景）。
    with_line_audio: 无配音/自带配音模式置 False（逐句 TTS 音频路径不再写入）。
    """
    plan_items = (plan or {}).get("shots") or []
    plan_shots = [it.get("plan") or {} for it in plan_items if isinstance(it, dict)]
    shots: list[RenderShot] = []
    for si, shot in enumerate(script.shots):
        timed: list[TimedLine] = []
        for li, line in enumerate(shot.lines):
            lid = line_id(si, li)
            dur = durations.get(lid)
            if not dur or dur <= 0:
                est = max(0.8, len(line.text) / 4.5)
                dur = round(est, 3)
            p = plan_shots[si] if si < len(plan_shots) else {}
            # 强调词按句过滤（只保留本句台词的子串），AI 未给/全不匹配时正则兜底
            emp = [
                w for w in (p.get("emphasis") or []) if w and w in line.text
            ]
            emphasis = emp[:4] or _default_emphasis(line.text)
            timed.append(
                TimedLine(
                    id=lid,
                    text=line.text,
                    duration_sec=round(dur, 3),
                    audio=(
                        f"voice/projects/{_PID_PLACEHOLDER}/{lid}.wav"
                        if with_line_audio
                        else None
                    ),
                    pause_after=pause_after(line.text),
                    emphasis=emphasis,
                )
            )
        p = plan_shots[si] if si < len(plan_shots) else {}
        shots.append(
            RenderShot(
                year=shot.year,
                label=shot.label,
                image=image_rels[si] if si < len(image_rels) else None,
                colors=shot.colors,
                lines=timed,
                tail=DEFAULT_TAIL,
                duration_sec=p.get("durationSec") or p.get("duration_sec"),
                camera=p.get("camera"),
                cam_intensity=p.get("intensity"),
                enter_transition=p.get("transition"),
                # 逐句运镜必须与句数对齐且全为合法字符串，否则整表回退模板规则
                camera_per_line=(
                    cpl
                    if isinstance((cpl := p.get("cameraPerLine")), list)
                    and len(cpl) == len(timed)
                    and all(isinstance(c, str) and c for c in cpl)
                    else None
                ),
                grade=_grade_spec(p),
                overlay=_overlay_spec(p),
                sfx_moment=p.get("sfxMoment"),
                atmosphere=_atmosphere_spec(p.get("atmosphere")),
                # 选定了真实图片的幕：图优先，代码场景让位（Remotion 端 scene 优先级更高）
                scene=(
                    None
                    if (prefer_images and si < len(image_rels) and image_rels[si])
                    else _scene_spec(p.get("scene"))
                ),
                layout=p.get("layout"),
                align=p.get("align"),
                focal=tuple(p["focal"]) if isinstance(p.get("focal"), (list, tuple)) else None,
                text_style=p.get("textStyle"),
                scene3d=_scene3d_spec(p.get("scene3d")),
                tool=_tool_spec(p.get("tool")),
                market=_market_shot_spec(p.get("market")),
            )
        )
    plan_dict = plan or {}
    return RenderProps(
        title=script.title,
        shots=shots,
        bgm=bgm,
        title_card=title_card,
        grain_opacity=grain_opacity,
        look=_look_spec(plan_dict),
        kicker=str(plan_dict.get("kicker") or "") or None,
        # 抖音竖屏安全画幅（平台全屏会裁左右 ~13%）；由调用方传默认 0.8，plan.safeScale 可覆盖，1=满屏
        safe_scale=safe_scale if safe_scale is not None else plan_dict.get("safeScale"),
        market=market,
    )


_PID_PLACEHOLDER = "{pid}"


def bind_project(props: RenderProps, project_id: str) -> RenderProps:
    """把音频路径里的占位符替换成真实 project_id。"""
    for shot in props.shots:
        for line in shot.lines:
            if line.audio:
                line.audio = line.audio.replace(_PID_PLACEHOLDER, project_id)
    return props


def estimate_total_seconds(script: ScriptDraft) -> int:
    """粗估成片时长（含句间/场景留白），用于前端提示。"""
    total = LEAD
    for shot in script.shots:
        for line in shot.lines:
            total += max(0.8, len(line.text) / 4.5) + LINE_GAP
        total += DEFAULT_TAIL
    return round(total)
