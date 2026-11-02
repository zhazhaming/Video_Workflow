# -*- coding: utf-8 -*-
"""pipeline 纯逻辑测试：行 ID、props 组装、缺时长回退、时长估算。"""
import pytest

from app.schemas import Line, MarketData, ScriptDraft, Shot
from app.services.pipeline import (
    assemble_props,
    bind_project,
    estimate_total_seconds,
    line_id,
    pause_after,
)


def make_script() -> ScriptDraft:
    return ScriptDraft(
        title="测试片",
        shots=[
            Shot(year="2020", label="开场", colors=("#111111", "#222222"),
                 lines=[Line(text="第一句台词"), Line(text="第二句台词")]),
            Shot(year="", label="结尾", lines=[Line(text="最后一句")]),
        ],
    )


def test_line_id_format():
    assert line_id(0, 0) == "s01_0"
    assert line_id(0, 1) == "s01_1"
    assert line_id(11, 3) == "s12_3"


def test_assemble_props_basic():
    script = make_script()
    durations = {"s01_0": 2.0, "s01_1": 2.5, "s02_0": 1.8}
    props = assemble_props(script, durations, [None, None])
    assert props.title == "测试片"
    assert len(props.shots) == 2
    assert props.shots[0].lines[0].duration_sec == 2.0
    assert props.shots[0].lines[1].id == "s01_1"
    assert props.shots[1].lines[0].id == "s02_0"
    # 音频路径先带占位符
    assert "{pid}" in props.shots[0].lines[0].audio


def test_assemble_props_fallback_duration():
    """缺时长时按字数估算（4.5字/秒），不为 0。"""
    script = make_script()
    props = assemble_props(script, {}, [None] * 2)
    for shot in props.shots:
        for line in shot.lines:
            assert line.duration_sec > 0


def test_bind_project_replaces_pid():
    script = make_script()
    props = assemble_props(script, {"s01_0": 2.0, "s01_1": 2.0, "s02_0": 2.0}, [None] * 2)
    bind_project(props, "abc123")
    assert props.shots[0].lines[0].audio == "voice/projects/abc123/s01_0.wav"
    assert props.shots[1].lines[0].audio == "voice/projects/abc123/s02_0.wav"


def test_image_rels_alignment():
    script = make_script()
    props = assemble_props(script, {}, ["pic/projects/x/shot_01.png", None])
    assert props.shots[0].image == "pic/projects/x/shot_01.png"
    assert props.shots[1].image is None


def test_estimate_total_positive():
    script = make_script()
    est = estimate_total_seconds(script)
    assert est > 5


def test_pause_after_by_punctuation():
    assert pause_after("这是一句问句？") == 0.6
    assert pause_after("感叹！") == 0.6
    assert pause_after("陈述。" ) == 0.5
    assert pause_after("半句，") == 0.25
    assert pause_after("没有标点") == 0.4
    assert pause_after("未完…") == 0.65


def test_assemble_props_includes_pause_and_tail():
    script = make_script()
    durations = {"s01_0": 2.0, "s01_1": 2.5, "s02_0": 1.8}
    props = assemble_props(script, durations, [None, None])
    assert props.shots[0].lines[0].pause_after == 0.4  # "第一句台词" 无标点
    assert props.shots[0].tail == 0.6
    assert props.title_card is True
    assert props.bgm is None


def test_props_json_uses_camel_case():
    """Remotion（TS 端）读 camelCase 字段，回归：不能再输出 duration_sec。"""
    script = make_script()
    durations = {"s01_0": 2.0, "s01_1": 2.5, "s02_0": 1.8}
    props = assemble_props(script, durations, [None, None])
    js = props.to_props_json()
    assert "durationSec" in js
    assert "duration_sec" not in js


def test_assemble_props_passes_tool_card():
    """MotionShow tools 版式的数据契约：plan.tool 必须原样进入 RenderShot。"""
    script = make_script()
    plan = {
        "shots": [
            {
                "plan": {
                    "layout": "tools",
                    "tool": {
                        "index": 1,
                        "name": "PowerToys",
                        "repo": "microsoft/PowerToys",
                        "stars": 140399,
                        "license": "MIT",
                        "category": "窗口与批量操作",
                        "tagline": "微软官方开源，窗口分屏、批量重命名。",
                        "platform": "Windows",
                        "icon": "windows",
                    },
                }
            },
            {"plan": {}},
        ]
    }
    props = assemble_props(script, {}, [None, None], plan=plan)
    assert props.shots[0].layout == "tools"
    assert props.shots[0].tool is not None
    assert props.shots[0].tool.name == "PowerToys"
    assert props.shots[0].tool.stars == 140399
    assert props.shots[1].tool is None
    assert '"tool"' in props.to_props_json()


def test_assemble_props_market_payload_and_beat_duration():
    script = make_script()
    plan = {
        "shots": [
            {
                "plan": {
                    "layout": "market",
                    "durationSec": 9.5,
                    "market": {
                        "mode": "overview",
                        "markers": [{"year": 2008, "text": "-72%", "side": "down"}],
                    },
                }
            },
            {"plan": {}},
        ]
    }
    market = MarketData.model_validate(
        {
            "meta": {
                "start": "2005-12-31",
                "end": "2025-12-31",
                "source": "Yahoo Finance",
                "note": "月末收盘",
            },
            "points": [
                {"date": "2005-12-31", "sse": 1161.06, "spx": 1248.29, "sseN": 100.0, "spxN": 100.0},
                {"date": "2025-12-31", "sse": 3968.84, "spx": 6845.5, "sseN": 341.8, "spxN": 548.4},
            ],
            "annual": [{"year": 2006, "sseRet": 130.4, "spxRet": 13.6}],
            "events": [
                {
                    "id": "gfc",
                    "year": 2008,
                    "date": "2008-10-28",
                    "title": "全球金融危机",
                    "short": "危机",
                    "cause": "次贷危机 → 全球去杠杆",
                    "sse": "-72%",
                    "spx": "-57%",
                }
            ],
        }
    )
    props = assemble_props(script, {}, [None, None], plan=plan, market=market)
    assert props.shots[0].duration_sec == 9.5
    assert props.shots[0].market is not None
    assert props.shots[0].market.mode == "overview"
    assert props.shots[0].market.markers[0].text == "-72%"
    assert props.market is not None
    assert props.market.points[0].sse_n == 100.0
    js = props.to_props_json()
    assert '"durationSec": 9.5' in js
    assert '"market"' in js
    assert '"sseN": 100.0' in js
