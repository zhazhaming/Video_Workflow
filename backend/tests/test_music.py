# -*- coding: utf-8 -*-
"""BGM 自动匹配测试。"""
from app.schemas import Line, ScriptDraft, Shot
from app.services.music import pick_track

AVAILABLE = ["warm_piano", "tense_pad", "uplifting"]


def make_script(lines: list[str], title: str = "测试") -> ScriptDraft:
    return ScriptDraft(title=title, shots=[Shot(lines=[Line(text=t) for t in lines])])


def test_picks_uplifting_for_positive():
    s = make_script(["我坚持了下来，终于看到了希望。", "未来会更好，一起努力。"])
    assert pick_track(s, AVAILABLE) == "uplifting"


def test_picks_tense_for_negative():
    s = make_script(["我失业了，压力压得我崩溃。", "深夜里我哭到绝望，感觉自己输了。"])
    assert pick_track(s, AVAILABLE) == "tense_pad"


def test_picks_warm_for_neutral_or_mixed_ending():
    s = make_script(["今天天气不错，我出门散步。", "评论区说说你的想法。"])
    assert pick_track(s, AVAILABLE) == "warm_piano"


def test_fallback_when_library_missing():
    s = make_script(["随便什么内容。"])
    assert pick_track(s, ["other_track"]) == "other_track"
    assert pick_track(s, []) == ""
