# -*- coding: utf-8 -*-
"""模板相关性判定（工作区规则 AGENTS.md）：阶段0判定 + from_scratch 强制清洗 + 提示词包。"""
import pytest

from app.schemas import ScriptDraft
from app.services import brief, director


@pytest.fixture
def proj_env(monkeypatch, tmp_path):
    """导演方案与简报存储指到 tmp。"""
    monkeypatch.setattr(director, "PROJECTS_DIR", tmp_path / "projects")
    monkeypatch.setattr(brief, "PROJECTS_DIR", tmp_path / "projects")
    monkeypatch.setattr(brief, "RENDERS_DIR", tmp_path / "renders")
    return tmp_path


SCRIPT = ScriptDraft.model_validate(
    {
        "title": "测试片",
        "shots": [
            {
                "year": "2008",
                "label": "低谷",
                "colors": ["#1a1a2e", "#16213e"],
                "lines": [{"text": "那年我失去了工作。"}, {"text": "天塌了！"}],
            },
            {
                "year": "",
                "label": "反击",
                "colors": ["#2e1a1a", "#3e1622"],
                "lines": [{"text": "我没有认输，重新开始。"}],
            },
        ],
    }
)


# ---------- validate_template_info ----------

def test_validate_template_info_invalid_defaults_to_from_scratch():
    for bad in (None, {}, "reuse", {"mode": "auto"}, {"mode": 42}):
        out = director.validate_template_info(bad)
        assert out["mode"] == "from_scratch"
        assert out["reusable"] == []
        assert out["reason"]


def test_validate_template_info_valid_cleaning():
    out = director.validate_template_info(
        {"mode": "reuse", "reason": "x" * 200, "reusable": ["ocean 场景", "", 42, "通用词表"]}
    )
    assert out == {"mode": "reuse", "reason": "x" * 120, "reusable": ["ocean 场景", "通用词表"]}


# ---------- sanitize_plan_for_mode ----------

def test_sanitize_from_scratch_strips_template_only_parts():
    look = {"accent": "#fff", "atmosphere": {"kind": "stars", "opacity": 0.5}}
    shots = [
        {
            "scene": {"kind": "solar", "speed": 1.2},
            "atmosphere": {"kind": "stars", "opacity": 0.4},
            "camera": "push",
            "overlay": {"kind": "counter", "value": 20, "unit": "页"},
        },
        {"scene": None, "atmosphere": {"kind": "rain", "opacity": 0.5}, "camera": None},
    ]
    n = director.sanitize_plan_for_mode(look, shots, "from_scratch")
    assert n == 3  # look 星空 + 镜1 scene + 镜1 星空
    assert look["atmosphere"] is None
    assert shots[0]["scene"] is None and shots[0]["atmosphere"] is None
    assert shots[0]["camera"] == "push"  # 通用词表保留
    assert shots[0]["overlay"]["kind"] == "counter"
    assert shots[1]["atmosphere"]["kind"] == "rain"  # 非模板专属氛围保留


def test_sanitize_reuse_mode_is_noop():
    look = {"atmosphere": {"kind": "stars"}}
    shots = [{"scene": {"kind": "solar"}}]
    assert director.sanitize_plan_for_mode(look, shots, "reuse") == 0
    assert look["atmosphere"] == {"kind": "stars"}
    assert shots[0]["scene"] == {"kind": "solar"}


# ---------- create_plan 阶段 0 ----------

def _fns(judge_raw=None, fail_judge=False, calls=None):
    calls = calls if calls is not None else {"judge": 0, "style": 0, "batch": 0}

    def judge():
        calls["judge"] += 1
        if fail_judge:
            raise RuntimeError("judge down")
        return judge_raw

    def gen_style():
        calls["style"] += 1
        return {
            "look": {"accent": "#58a6ff", "atmosphere": {"kind": "stars", "opacity": 0.5}},
            "kicker": "测试片",
            "bgm": {"track": "uplifting", "volume": 0.7},
        }

    def gen_batch(start, end, tail):
        calls["batch"] += 1
        return {
            "shots": [
                {"camera": "push", "transition": "dissolve",
                 "scene": {"kind": "solar", "speed": 1.2}},
                {"camera": "pull", "transition": "glitch",
                 "atmosphere": {"kind": "stars", "opacity": 0.4}},
            ]
        }

    return judge, gen_style, gen_batch, calls


def test_create_plan_from_scratch_strips_template(proj_env):
    msgs = []
    judge, gen_style, gen_batch, calls = _fns(
        judge_raw={"mode": "from_scratch", "reason": "办公工具选题，与行星无关"}
    )
    mode_box = {}
    plan = director.create_plan(
        "p1", SCRIPT, "", "", [], gen_style, gen_batch, None,
        progress=msgs.append, judge_fn=judge, mode_box=mode_box,
    )
    assert calls["judge"] == 1
    assert mode_box["mode"] == "from_scratch"
    assert plan["template"]["mode"] == "from_scratch"
    assert plan["_stats"]["template_mode"] == "from_scratch"
    # 模板专属元素全部剥离，通用词表保留
    assert plan["look"]["atmosphere"] is None
    assert plan["shots"][0]["plan"]["scene"] is None
    assert plan["shots"][0]["plan"]["camera"] == "push"
    assert plan["shots"][1]["plan"]["atmosphere"] is None
    assert plan["shots"][1]["plan"]["camera"] == "pull"
    assert any("模板相关性" in m for m in msgs)
    assert any("from_scratch 清洗" in m for m in msgs)


def test_create_plan_reuse_keeps_scenes_and_persists_info(proj_env):
    judge, gen_style, gen_batch, calls = _fns(
        judge_raw={"mode": "reuse", "reason": "地球演化选题",
                   "reusable": ["ocean 场景", "通用运镜词表", ""]}
    )
    plan = director.create_plan(
        "p2", SCRIPT, "", "", [], gen_style, gen_batch, None, judge_fn=judge,
    )
    assert plan["template"]["mode"] == "reuse"
    assert plan["template"]["reusable"] == ["ocean 场景", "通用运镜词表"]
    assert plan["shots"][0]["plan"]["scene"]["kind"] == "solar"  # 复用模式不清洗
    assert plan["look"]["atmosphere"]["kind"] == "stars"


def test_create_plan_judge_failure_is_conservative(proj_env):
    msgs = []
    judge, gen_style, gen_batch, calls = _fns(fail_judge=True)
    plan = director.create_plan(
        "p3", SCRIPT, "", "", [], gen_style, gen_batch, None,
        progress=msgs.append, judge_fn=judge,
    )
    assert plan["template"]["mode"] == "from_scratch"
    assert "判定调用失败" in plan["template"]["reason"]
    assert plan["shots"][0]["plan"]["scene"] is None  # 宁可清洗，不许误注入


def test_create_plan_without_judge_keeps_legacy_reuse(proj_env):
    judge, gen_style, gen_batch, calls = _fns()
    plan = director.create_plan("p4", SCRIPT, "", "", [], gen_style, gen_batch, None)
    assert plan["template"]["mode"] == "reuse"
    assert calls["judge"] == 0
    assert plan["shots"][0]["plan"]["scene"]["kind"] == "solar"  # 旧行为不变


def test_judge_cached_with_same_script(proj_env):
    judge, gen_style, gen_batch, calls = _fns(
        judge_raw={"mode": "from_scratch", "reason": "办公工具"}
    )
    director.create_plan("p5", SCRIPT, "", "", [], gen_style, gen_batch, None, judge_fn=judge)
    msgs = []
    director.create_plan("p5", SCRIPT, "", "", [], gen_style, gen_batch, None,
                         progress=msgs.append, judge_fn=judge)
    assert calls["judge"] == 1  # 脚本未变 → 复用上次判定
    assert any("命中缓存" in m for m in msgs)


# ---------- 提示词包 ----------

def _plan_for_pack() -> dict:
    return {
        "template": {"mode": "from_scratch", "reason": "办公工具选题", "reusable": []},
        "look": {"accent": "#4ADE80", "palette": ["#0d1424", "#1b2a4a"], "vignette": 0.8,
                 "subtitleStyle": "pill", "atmosphere": None},
        "kicker": "3分钟做出20页",
        "bgm": {"track": "uplifting", "volume": 0.7},
        "shots": [
            {"hash": "a", "plan": {"camera": "push", "intensity": 1.1, "transition": "cut"}},
            {"hash": "b", "plan": {}},
        ],
    }


def test_build_prompt_pack_contents():
    md = brief.build_prompt_pack(SCRIPT, _plan_for_pack(), durations={"s01_0": 2.5})
    assert "《测试片》从零制作提示词包" in md
    assert "from_scratch" in md and "办公工具选题" in md
    assert "禁止行星" in md  # 硬性禁令写进包
    assert "镜1 · 低谷" in md and "镜2 · 反击" in md
    assert "(2.50s) 那年我失去了工作。" in md  # 实测时长优先
    assert "**天塌了！**" in md or "重音" in md  # 台词与重音呈现
    assert "1080×1920" in md and "30fps" in md


def test_build_prompt_pack_reuse_mode_lists_reusable():
    plan = _plan_for_pack()
    plan["template"] = {"mode": "reuse", "reason": "地球演化", "reusable": ["ocean 场景"]}
    md = brief.build_prompt_pack(SCRIPT, plan, durations={})
    assert "ocean 场景" in md
    assert "禁止行星" not in md  # 复用模式不写禁令


def test_write_prompt_pack_file(proj_env):
    p = brief.write_prompt_pack("p1", SCRIPT, _plan_for_pack(), durations={})
    assert p.exists() and p.read_text(encoding="utf-8").startswith("# 《测试片》")


def test_pack_endpoint_rebuilds(proj_env, monkeypatch):
    """接口按当前脚本+方案重建，无需依赖 tasks 落库。"""
    from fastapi.testclient import TestClient
    from app.main import app
    from app.routers import projects as projects_mod

    monkeypatch.setattr(projects_mod, "PROJECTS_DIR", proj_env / "projects")
    monkeypatch.setattr(projects_mod, "RENDERS_DIR", proj_env / "renders")
    from app.services import tasks as tasks_mod
    monkeypatch.setattr(tasks_mod, "PROJECTS_DIR", proj_env / "projects")
    monkeypatch.setattr(director, "PROJECTS_DIR", proj_env / "projects")
    monkeypatch.setattr(brief, "PROJECTS_DIR", proj_env / "projects")
    monkeypatch.setattr(brief, "RENDERS_DIR", proj_env / "renders")
    client = TestClient(app)
    r = client.post("/api/projects", json={})
    assert r.status_code == 200
    pid = r.json()["id"]
    r = client.get(f"/api/projects/{pid}/prompt-pack")
    assert r.status_code == 200
    assert "text/markdown" in r.headers["content-type"]
    assert "从零制作提示词包" in r.text
    assert client.get("/api/projects/nope/prompt-pack").status_code == 404
