# -*- coding: utf-8 -*-
"""调色板度量与「去 AI 味」校验。

只做确定性计算与告警，不随意改写创作者显式给出的合法颜色；
自动修正仅用于可访问性底线（正文/背景对比度低于 3:1 时提升对比）。

设计预设与 Remotion 端 src/system/tokens.ts 保持同一组数值。
"""
from __future__ import annotations

import colorsys
import re

_HEX_RE = re.compile(r"#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})")

# 默认纸感、编辑、电影、图形、深色五套预设；dark 必须显式选择，不再是默认
LOOK_PRESETS: dict[str, dict] = {
    "paper": {
        "mode": "light",
        "bg_color": "#F2EDE4",
        "ink": "#14110F",
        "accent": "#C8452D",
        "support": "#6B6459",
        "palette": ["#F2EDE4", "#E6DCCB"],
        "vignette": 0.3,
        "type": {"display": "NotoSerifSC", "body": "NotoSansSC", "mono": "JetBrainsMono"},
        "texture": {"grain": 0.05, "paper": 0.35, "halftone": 0.0, "vignette": 0.12},
    },
    "editorial": {
        "mode": "light",
        "bg_color": "#FAF6EE",
        "ink": "#1B1A17",
        "accent": "#1F5C4A",
        "support": "#8A8275",
        "palette": ["#FAF6EE", "#EDE4D3"],
        "vignette": 0.2,
        "type": {"display": "NotoSerifSC", "body": "NotoSansSC", "mono": "JetBrainsMono"},
        "texture": {"grain": 0.04, "paper": 0.25, "halftone": 0.08, "vignette": 0.08},
    },
    "cinema": {
        "mode": "dark",
        "bg_color": "#101214",
        "ink": "#F2F0EA",
        "accent": "#D9A441",
        "support": "#6E7B86",
        "palette": ["#101214", "#1B2024"],
        "vignette": 1.1,
        "type": {"display": "NotoSerifSC", "body": "NotoSansSC", "mono": "JetBrainsMono"},
        "texture": {"grain": 0.09, "paper": 0.0, "halftone": 0.0, "vignette": 0.35},
    },
    "graphic": {
        "mode": "light",
        "bg_color": "#F4F1EA",
        "ink": "#111111",
        "accent": "#E4572E",
        "support": "#4A4A4A",
        "palette": ["#F4F1EA", "#E9E2D0"],
        "vignette": 0.15,
        "type": {"display": "SmileySans", "body": "NotoSansSC", "mono": "JetBrainsMono"},
        "texture": {"grain": 0.03, "paper": 0.1, "halftone": 0.18, "vignette": 0.05},
    },
    "dark": {
        "mode": "dark",
        "bg_color": "#0E0F12",
        "ink": "#EDEDED",
        "accent": "#C9A227",
        "support": "#7A7F87",
        "palette": ["#0E0F12", "#191B20"],
        "vignette": 1.0,
        "type": {"display": "NotoSansSC", "body": "NotoSansSC", "mono": "JetBrainsMono"},
        "texture": {"grain": 0.07, "paper": 0.0, "halftone": 0.0, "vignette": 0.3},
    },
}

DEFAULT_PRESET = "paper"


def normalize_hex(value) -> str | None:
    """把 3/6 位 hex 统一成小写 6 位；非法返回 None。"""
    if not isinstance(value, str):
        return None
    v = value.strip()
    if not _HEX_RE.fullmatch(v):
        return None
    if len(v) == 4:
        v = "#" + "".join(ch * 2 for ch in v[1:])
    return v.lower()


def hex_to_rgb(value) -> tuple[float, float, float] | None:
    v = normalize_hex(value)
    if not v:
        return None
    return tuple(int(v[i : i + 2], 16) / 255.0 for i in (1, 3, 5))


def _channel(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def relative_luminance(value) -> float:
    """WCAG 相对亮度 0~1。"""
    rgb = hex_to_rgb(value)
    if not rgb:
        return 0.0
    r, g, b = (_channel(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(a, b) -> float:
    """WCAG 对比度 1~21。"""
    la, lb = relative_luminance(a), relative_luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return round((hi + 0.05) / (lo + 0.05), 2)


def hsl(value) -> tuple[float, float, float] | None:
    """返回 (hue 0~360, saturation 0~1, lightness 0~1)。"""
    rgb = hex_to_rgb(value)
    if not rgb:
        return None
    h, l, s = colorsys.rgb_to_hls(*rgb)
    return (h * 360.0, s, l)


def saturation(value) -> float:
    h = hsl(value)
    return h[1] if h else 0.0


def is_near_black(value) -> bool:
    return relative_luminance(value) <= 0.02


def is_neon(value) -> bool:
    """高饱和 + 中高明度：霓虹/荧光色的典型特征。"""
    h = hsl(value)
    if not h:
        return False
    _, s, l = h
    return s >= 0.68 and 0.35 <= l <= 0.82


def is_purple_hue(value) -> bool:
    """紫→靛蓝区间（含常见的 indigo/紫蓝渐变两端）。"""
    h = hsl(value)
    return bool(h and 235.0 <= h[0] <= 305.0)


def preset_look(preset: str) -> dict:
    """把预设展开成 look 字段（含 bg），非法 preset 回退默认。"""
    p = LOOK_PRESETS.get(preset) or LOOK_PRESETS[DEFAULT_PRESET]
    return {
        "preset": preset if preset in LOOK_PRESETS else DEFAULT_PRESET,
        "mode": p["mode"],
        "bg": "paper" if p["mode"] == "light" else "dark",
        "accent": p["accent"],
        "palette": list(p["palette"]),
        "ink": p["ink"],
        "support": p["support"],
        "vignette": p["vignette"],
        "type": dict(p["type"]),
        "texture": dict(p["texture"]),
    }


def infer_bg(palette: list[str] | None) -> str:
    """根据背景色亮度推断 paper/dark。"""
    if not palette:
        return "paper"
    return "paper" if relative_luminance(palette[0]) >= 0.5 else "dark"


def look_warnings(look: dict) -> list[str]:
    """对一套 look 做「AI 味」体检，返回人类可读的告警（不修改输入）。"""
    if not isinstance(look, dict):
        return []
    warnings: list[str] = []
    bg = look.get("bg") or ("paper" if look.get("mode") == "light" else "dark")
    palette = look.get("palette") or []
    bg_color = palette[0] if palette else None
    ink = look.get("ink")
    accent = look.get("accent")

    if bg_color and is_near_black(bg_color) and accent and is_neon(accent):
        warnings.append("深色近黑背景 + 霓虹强调色，是典型 AI 味组合")
    if accent and is_neon(accent):
        warnings.append(f"强调色 {accent} 饱和度过高，接近荧光色")
    if len(palette) >= 2 and all(is_purple_hue(c) for c in palette[:2]):
        warnings.append("紫蓝色渐变背景，是典型 AI 味组合")
    if bg_color and ink:
        ratio = contrast_ratio(bg_color, ink)
        if ratio < 4.5:
            warnings.append(f"正文与背景对比度仅 {ratio}:1（建议 ≥4.5:1）")
    if bg == "paper" and bg_color and relative_luminance(bg_color) < 0.5:
        warnings.append("标记为 paper 但背景色偏暗，浅色纸感会失效")
    return warnings


def repair_contrast(look: dict) -> dict:
    """可访问性兜底：对比度低于 3:1 时把 ink 改成黑/白（原地修改并返回）。"""
    if not isinstance(look, dict):
        return look
    palette = look.get("palette") or []
    bg_color = palette[0] if palette else None
    ink = look.get("ink")
    if not bg_color:
        return look
    if ink and contrast_ratio(bg_color, ink) >= 3.0:
        return look
    look["ink"] = "#111111" if relative_luminance(bg_color) >= 0.5 else "#F5F2EA"
    return look
