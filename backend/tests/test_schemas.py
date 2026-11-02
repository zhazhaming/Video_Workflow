# -*- coding: utf-8 -*-
"""schemas 校验测试。"""
import pytest
from pydantic import ValidationError

from app.schemas import Line, ProjectSettings, ScriptDraft, Shot


def test_script_requires_shots():
    with pytest.raises(ValidationError):
        ScriptDraft(title="x", shots=[])


def test_shot_requires_lines():
    with pytest.raises(ValidationError):
        Shot(lines=[])


def test_line_text_nonempty():
    with pytest.raises(ValidationError):
        Line(text="")


def test_colors_default():
    s = Shot(lines=[Line(text="你好")])
    assert len(s.colors) == 2
    assert s.colors[0].startswith("#")


def test_lines_accepts_bare_strings():
    """LLM 常把 lines 返回成字符串数组，应自动包装。"""
    s = Shot.model_validate({"lines": ["第一句", {"text": "第二句"}]})
    assert [l.text for l in s.lines] == ["第一句", "第二句"]


def test_script_from_llm_style_payload():
    payload = {
        "title": "测试",
        "shots": [{"year": "2026", "label": "开场", "lines": ["台词甲", "台词乙"]}],
    }
    s = ScriptDraft.model_validate(payload)
    assert s.shots[0].lines[1].text == "台词乙"


def test_project_settings_defaults():
    st = ProjectSettings()
    assert st.target_seconds == 180
    assert st.model_id is None
    assert st.prompt == ""
