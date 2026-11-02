# -*- coding: utf-8 -*-
"""从零创作提示词包（prompt pack）：模板无关选题的 AI 制作简报。

工作区规则（AGENTS.md「模板相关性检查」）：选题与模板库（行星/宇宙域）无关 →
禁止注入模板场景，画面与动效通过提示词 + AI 从零创作。本模块把脚本 + 导演
方案编译成一份自足的 markdown 简报，供 agent 用 remotion skill 从零实现，
不依赖 DataVideo.tsx 模板。
"""
import json
import logging
from pathlib import Path

from ..config import PROJECTS_DIR, RENDERS_DIR, PIC_PUBLIC_SUBDIR, VOICE_PUBLIC_SUBDIR
from ..schemas import ScriptDraft
from .pipeline import line_id

log = logging.getLogger("brief")

FPS, W, H = 30, 1080, 1920


def pack_path(project_id: str) -> Path:
    return PROJECTS_DIR / project_id / "prompt_pack.md"


def _durations_from_props(project_id: str) -> dict[str, float]:
    """渲染过则复用 props.json 里的实测句时长；否则空表（按字数估算）。"""
    p = RENDERS_DIR / project_id / "props.json"
    if not p.exists():
        return {}
    try:
        props = json.loads(p.read_text(encoding="utf-8"))
        return {
            l["id"]: l["durationSec"]
            for s in props.get("shots", [])
            for l in s.get("lines", [])
            if l.get("id") and l.get("durationSec")
        }
    except Exception as e:  # noqa: BLE001 — 简报容错
        log.warning("props.json 读取失败，句时长按估算: %s", e)
        return {}


def _est(text: str) -> float:
    return round(max(0.8, len(text) / 4.5), 2)


def _look_block(plan: dict) -> str:
    look = plan.get("look") or {}
    if not look:
        return "（导演方案缺失：请自行定调整体风格，建议深色底 + 单强调色）"
    lines = [
        f"- 强调色 accent：`{look.get('accent')}`（重音词/关键数字高亮用）",
        f"- 基调色板 palette：`{json.dumps(look.get('palette'), ensure_ascii=False)}`",
        f"- 暗角 vignette：{look.get('vignette')}；字幕风格 subtitleStyle：{look.get('subtitleStyle')}",
        f"- kicker（开场小字）：{plan.get('kicker') or '（无）'}",
        f"- 全片氛围 atmosphere：`{json.dumps(look.get('atmosphere'), ensure_ascii=False)}`"
        "（from_scratch 模式下不含星空）",
    ]
    bgm = plan.get("bgm") or {}
    if bgm.get("track"):
        lines.append(f"- BGM：{bgm['track']}（音量 {bgm.get('volume')}）")
    return "\n".join(lines)


def _shot_block(si: int, shot, plan_shot: dict, durations: dict[str, float]) -> str:
    lines = [f"### 镜{si + 1} · {shot.label or '（无标签）'}", ""]
    for li, ln in enumerate(shot.lines):
        dur = durations.get(line_id(si, li)) or _est(ln.text)
        # 重音词来自导演方案（按句过滤，只保留本句台词的子串）
        emps = [w for w in (plan_shot.get("emphasis") or []) if w and w in ln.text]
        emp = "、".join(f"**{w}**" for w in emps[:3])
        lines.append(f"- ({dur:.2f}s) {ln.text}" + (f"　重音：{emp}" if emp else ""))
    lines.append("")
    motion = []
    if plan_shot.get("camera"):
        motion.append(
            f"运镜 {plan_shot['camera']}×{plan_shot.get('intensity') or 1.0}"
            + (f"，逐句 {'→'.join(plan_shot['cameraPerLine'])}" if plan_shot.get("cameraPerLine") else "")
        )
    if plan_shot.get("transition"):
        motion.append(f"入场转场 {plan_shot['transition']}")
    if plan_shot.get("overlay"):
        motion.append(f"浮层建议 `{json.dumps(plan_shot['overlay'], ensure_ascii=False)}`")
    if plan_shot.get("grade"):
        motion.append(f"调色建议 `{json.dumps(plan_shot['grade'], ensure_ascii=False)}`")
    if plan_shot.get("sfxMoment"):
        motion.append(f"音效点 {plan_shot['sfxMoment']}")
    lines.append(
        "  动效意图建议（通用手段，AI 可自由发挥实现）："
        + ("；".join(motion) if motion else "按台词情绪自行设计")
    )
    return "\n".join(lines)


def build_prompt_pack(
    script: ScriptDraft,
    plan: dict,
    durations: dict[str, float] | None = None,
) -> str:
    """把脚本 + 导演方案编译成从零制作简报（markdown 文本）。"""
    plan = plan or {}
    tpl = plan.get("template") or {}
    mode = tpl.get("mode") or "unknown"
    durations = durations if durations is not None else {}
    n_lines = sum(len(s.lines) for s in script.shots)
    est_total = round(sum(
        sum(_est(l.text) + 0.4 for l in s.lines) + 0.6 for s in script.shots
    ))

    parts = [
        f"# 《{script.title}》从零制作提示词包",
        "",
        "> 用途：把本文件整段交给 agent 的 **remotion skill**，由 AI 从零编写全部画面与动效。",
        "> 本简报不依赖现有模板（不使用 DataVideo.tsx / dv/*）；规则出处：AGENTS.md「模板相关性检查」。",
        "",
        "## 1. 项目概览",
        "",
        f"- 标题：{script.title}；{len(script.shots)} 镜 / {n_lines} 句旁白，估算时长 ≈ {est_total}s",
        f"- 画幅：{W}×{H} 竖屏 @ {FPS}fps（Remotion Composition 固定）",
        f"- 旁白音频：`public/{VOICE_PUBLIC_SUBDIR}/<pid>/sNN_M.mp3`（NN=镜号, M=句号，从 0 起）",
        f"- 项目图片目录：`public/{PIC_PUBLIC_SUBDIR}/<pid>/`（custom_NN 对应镜 N；缺失画面由 AI 生图或代码绘制）",
        "",
        "## 2. 模板相关性判定",
        "",
        f"- 判定结论：**{mode}**"
        + (f" —— {tpl.get('reason')}" if tpl.get("reason") else ""),
        (
            f"- 可复用项：{('、'.join(tpl['reusable'])) if tpl.get('reusable') else '无（全部从零创作）'}"
            if mode == "reuse"
            else "- 硬性禁令：禁止行星/太阳系/星云等模板代码场景，禁止星空氛围；画面与动效全部由 AI 原创实现"
        ),
        "",
        "## 3. 全局风格",
        "",
        _look_block(plan),
        "",
        "## 4. 逐镜脚本（台词 / 时长 / 重音 / 动效意图）",
        "",
        "> 时长优先用实测值（渲染过）否则按字数估算；实现时以实际音频文件时长为准逐句对齐。",
        "",
    ]
    plan_shots = [it.get("plan") or {} for it in plan.get("shots", []) if isinstance(it, dict)]
    for si, shot in enumerate(script.shots):
        parts.append(_shot_block(si, shot, plan_shots[si] if si < len(plan_shots) else {}, durations))
        parts.append("")

    parts += [
        "## 5. 画面与生图",
        "",
        "- 缺图的镜头：用文生图提示词生成（可调 `POST /api/projects/<pid>/image-prompts` 让 AI 按脚本生成提示词），"
        "命名 custom_NN 放入项目图片目录；或由 AI 直接用代码绘制画面。",
        "- 禁止复用行星/宇宙类旧占位图（shot_*.png 为通用占位，检查内容后再用）。",
        "",
        "## 6. 验收标准",
        "",
        "- [ ] 音画同步：每句字幕/动画与对应 mp3 起止误差 ≤ 2 帧",
        "- [ ] 无模板无关元素：成片中不出现行星/太阳系/星空等模板专属意象（from_scratch 时）",
        "- [ ] 重音词有可见强调且落在对应台词时间窗内",
        "- [ ] 成片时长与旁白总和一致（±2s），BGM 音量不压旁白",
        "",
    ]
    return "\n".join(parts)


def write_prompt_pack(
    project_id: str,
    script: ScriptDraft,
    plan: dict,
    durations: dict[str, float] | None = None,
) -> Path:
    """生成并落库 prompt_pack.md（ directing 完成后调用 / 接口按需重建）。"""
    out = build_prompt_pack(script, plan, durations)
    p = pack_path(project_id)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(out, encoding="utf-8")
    log.info("[brief] prompt_pack.md written: %s (%d chars)", p, len(out))
    return p
