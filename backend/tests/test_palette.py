# -*- coding: utf-8 -*-
"""调色板度量与去 AI 味告警测试。"""
from app.services import palette


def test_hex_helpers():
    assert palette.normalize_hex("#FFF") == "#ffffff"
    assert palette.normalize_hex("#A1b2C3") == "#a1b2c3"
    assert palette.normalize_hex("red") is None
    assert palette.relative_luminance("#000000") == 0.0
    assert palette.relative_luminance("#ffffff") == 1.0


def test_contrast_ratio():
    assert palette.contrast_ratio("#000000", "#ffffff") == 21.0
    assert palette.contrast_ratio("#F2EDE4", "#14110F") > 4.5
    assert palette.contrast_ratio("#101214", "#0E0F12") < 1.5


def test_neon_and_purple_detection():
    assert palette.is_neon("#22d3ee") is True
    assert palette.is_neon("#C8452D") is False
    assert palette.is_purple_hue("#7c3aed") is True
    assert palette.is_purple_hue("#C8452D") is False


def test_preset_look_is_light_by_default():
    look = palette.preset_look(palette.DEFAULT_PRESET)
    assert look["preset"] == "paper"
    assert look["mode"] == "light"
    assert look["bg"] == "paper"
    assert palette.relative_luminance(look["palette"][0]) > 0.5


def test_look_warnings_dark_neon():
    warnings = palette.look_warnings(
        {
            "bg": "dark",
            "palette": ["#05070d", "#16213e"],
            "ink": "#ffffff",
            "accent": "#22d3ee",
        }
    )
    assert any("霓虹" in w for w in warnings)
    assert any("深色近黑" in w for w in warnings)


def test_look_warnings_purple_gradient():
    warnings = palette.look_warnings(
        {"palette": ["#3b0764", "#1e1b4b"], "ink": "#f5f5f5", "accent": "#c084fc"}
    )
    assert any("紫蓝" in w for w in warnings)


def test_paper_look_has_no_warnings():
    look = palette.preset_look("paper")
    assert palette.look_warnings(look) == []


def test_repair_contrast_lifts_ink():
    look = {"palette": ["#0d1117", "#161b22"], "ink": "#14110F"}
    repaired = palette.repair_contrast(look)
    assert palette.contrast_ratio(repaired["palette"][0], repaired["ink"]) >= 3.0


def test_infer_bg():
    assert palette.infer_bg(["#F2EDE4", "#E6DCCB"]) == "paper"
    assert palette.infer_bg(["#05070d", "#16213e"]) == "dark"
