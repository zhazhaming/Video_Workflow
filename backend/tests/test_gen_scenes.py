# -*- coding: utf-8 -*-
"""AI 现场编写场景（v1）测试：节拍挑选、提示词合同、注册表、闸门、方案落库、编排降级。"""
import json

import pytest

from app.schemas import ScriptDraft
from app.services import director, gen_scenes

SCRIPT = ScriptDraft.model_validate(
    {
        "title": "人工智能发展简史",
        "shots": [
            {"year": "1950", "label": "图灵之问", "lines": [{"text": "机器会思考吗？"}]},
            {"year": "1956", "label": "达特茅斯", "lines": [{"text": "AI 诞生了"}]},
            {"year": "1997", "label": "深蓝", "lines": [{"text": "2亿每秒"}]},
            {"year": "2016", "label": "AlphaGo", "lines": [{"text": "4比1"}]},
            {"year": "2022", "label": "ChatGPT", "lines": [{"text": "走向大众"}]},
        ],
    }
)
LOOK = {"accent": "#8C3B2E", "palette": ["#f6f0e4", "#e9ddc6"], "bg": "paper"}


@pytest.fixture
def gen_env(tmp_path, monkeypatch):
    monkeypatch.setattr(gen_scenes, "REMOTION_DIR", tmp_path / "remotion")
    monkeypatch.setattr(gen_scenes, "GEN_DIR", tmp_path / "remotion" / "src" / "gen")
    monkeypatch.setattr(gen_scenes, "RENDERS_DIR", tmp_path / "renders")
    monkeypatch.setattr(director, "PROJECTS_DIR", tmp_path / "projects")
    return tmp_path


# ---------- 节拍挑选 ----------

def test_pick_beats_bounds_and_dedupe(monkeypatch):
    monkeypatch.setattr(gen_scenes.llm, "_chat_json", lambda *a, **k: {
        "beats": [
            {"shot_index": 1, "title": "钩子", "idea": "问号粒子", "motion": "汇聚"},
            {"shot_index": 9, "title": "越界", "idea": "x", "motion": "y"},  # 越界剔除
            {"shot_index": 1, "title": "重复", "idea": "x", "motion": "y"},  # 去重剔除
            {"shot_index": "bad", "title": "脏", "idea": "x", "motion": "y"},  # 非法剔除
            {"shot_index": 5, "title": "落点", "idea": "灯泡亮起", "motion": "发光"},
        ]})
    beats = gen_scenes.pick_beats(SCRIPT, LOOK, None, 3)
    assert [b["shot_index"] for b in beats] == [1, 5, 2]  # LLM 少报时用剩余幕补齐到 count
    assert beats[0]["title"] == "钩子"


def test_pick_beats_fill_respects_exclude(monkeypatch):
    monkeypatch.setattr(gen_scenes.llm, "_chat_json", lambda *a, **k: {
        "beats": [{"shot_index": 3, "title": "x", "idea": "y", "motion": "z"}]})
    beats = gen_scenes.pick_beats(SCRIPT, LOOK, None, 4, exclude_indices={1, 2})
    got = [b["shot_index"] for b in beats]
    assert got == [3, 4, 5]  # 剩余幕只有 3 个：补齐上限受可用幕约束


def test_pick_beats_empty(monkeypatch):
    monkeypatch.setattr(gen_scenes.llm, "_chat_json", lambda *a, **k: {"beats": []})
    assert gen_scenes.pick_beats(SCRIPT, LOOK, None, 3) == []


# ---------- 提示词合同 ----------

def test_agent_prompt_contains_contract(gen_env):
    beats = [{"shot_index": 2, "title": "考试", "idea": "打字机吐出试卷", "motion": "线条生长"}]
    prompt = gen_scenes.build_agent_prompt("p1", beats, LOOK, "AI 简史")
    assert "src/gen/p1/Scene01.tsx" in prompt
    assert "GenSceneProps" in prompt and 'import { rand } from "../../dv/atmosphere"' in prompt
    assert "Math.random" in prompt and "禁止运行" in prompt  # 自跑校验已禁止（外部统一校验）
    assert "打字机吐出试卷" in prompt and "#8C3B2E" in prompt.replace(" ", "") or "#8C3B2E" in prompt
    # 修复轮附加错误上下文
    prompt2 = gen_scenes.build_agent_prompt("p1", beats, LOOK, "t", errors="Scene01.tsx(3): error TS2304")
    assert "上一轮的问题" in prompt2 and "TS2304" in prompt2


# ---------- 注册表 ----------

def test_write_registry_content(gen_env):
    slugs = ["gen:p1:01", "gen:p1:02"]
    gen_scenes.write_registry("p1", slugs)
    text = (gen_env / "remotion" / "src" / "gen" / "registry.ts").read_text(encoding="utf-8")
    assert 'import Scene_p1_01 from "./p1/Scene01";' in text
    assert '"gen:p1:01": Scene_p1_01,' in text and '"gen:p1:02": Scene_p1_02,' in text
    gen_scenes.write_registry("p1", [])
    empty = (gen_env / "remotion" / "src" / "gen" / "registry.ts").read_text(encoding="utf-8")
    assert "GEN_SCENES: Record<string, GenSceneComponent> = {" in empty and "Scene_p1_01" not in empty


def test_write_registry_merges_other_projects(gen_env):
    d = gen_env / "remotion" / "src" / "gen" / "p0"
    d.mkdir(parents=True)
    (d / "Scene03.tsx").write_text("export default () => null;", encoding="utf-8")
    gen_scenes.write_registry("p1", ["gen:p1:01"])
    text = (gen_env / "remotion" / "src" / "gen" / "registry.ts").read_text(encoding="utf-8")
    assert '"gen:p0:03"' in text and '"gen:p1:01"' in text  # 别的项目不被抹掉
    assert 'from "./p0/Scene03"' in text
    # 失败清空本项目场景时，其他项目依然保留
    gen_scenes.write_registry("p1", [])
    text2 = (gen_env / "remotion" / "src" / "gen" / "registry.ts").read_text(encoding="utf-8")
    assert '"gen:p0:03"' in text2 and "gen:p1" not in text2


# ---------- 校验闸门 ----------

def test_validate_scenes_mixed(gen_env, monkeypatch):
    monkeypatch.setattr(gen_scenes, "_tsc_check", lambda: (True, ""))
    calls = []

    def fake_still(pid, slug, look):
        calls.append(slug)
        return (slug != "gen:p1:02", "" if slug != "gen:p1:02" else "still 帧渲染失败")

    monkeypatch.setattr(gen_scenes, "_still_check", fake_still)
    ok, errors = gen_scenes.validate_scenes("p1", ["gen:p1:01", "gen:p1:02"], LOOK)
    assert ok == ["gen:p1:01"] and "gen:p1:02" in errors and len(calls) == 2


def test_validate_scenes_tsc_fail_blocks_all(gen_env, monkeypatch):
    monkeypatch.setattr(gen_scenes, "_tsc_check", lambda: (False, "error TS2304"))
    stills = []
    monkeypatch.setattr(gen_scenes, "_still_check", lambda *a: stills.append(a) or (True, ""))
    ok, errors = gen_scenes.validate_scenes("p1", ["gen:p1:01"], LOOK)
    assert ok == [] and "TS2304" in errors["gen:p1:01"] and not stills  # tsc 挂则不渲染


# ---------- 方案落库 ----------

def test_patch_plan_writes_gen_scene(gen_env):
    (gen_env / "projects" / "p1").mkdir(parents=True)
    plan = {
        "v": 2, "script_hash": "x", "style_key": "y", "style_ok": True, "critic_used": False,
        "template": {"mode": "from_scratch", "reason": "", "reusable": []},
        "look": dict(LOOK), "kicker": "", "bgm": {"track": "", "volume": 0.7},
        "shots": [{"hash": f"h{i}", "plan": {"camera": "push"}} for i in range(5)],
    }
    director.save_plan("p1", plan)
    beats = [{"shot_index": 2, "title": "考试", "idea": "", "motion": ""}]
    patched = gen_scenes.patch_plan("p1", beats, ["gen:p1:01"], LOOK)
    assert patched == 1
    saved = director.load_cached_plan("p1")
    scene = saved["shots"][1]["plan"]["scene"]
    assert scene["kind"] == "gen:p1:01" and scene["accent"] == "#8C3B2E"
    assert saved["shots"][0]["plan"].get("scene") is None  # 其它镜不动


# ---------- director 侧：gen 白名单与 from_scratch 豁免 ----------

def test_validate_scene_accepts_gen():
    ok = director.validate_scene({"kind": "gen:p1:01", "palette": ["#111", "#222"], "accent": "#abc"})
    assert ok and ok["kind"] == "gen:p1:01"
    assert director.validate_scene({"kind": "gen:bad kind!"}) is None
    assert director.validate_scene({"kind": "nebula"}) is not None
    assert director.validate_scene({"kind": "nope"}) is None


def test_sanitize_keeps_gen_scenes_in_from_scratch():
    plans = [{"scene": {"kind": "gen:p1:01"}}, {"scene": {"kind": "nebula"}}, {"scene": None}]
    stripped = director.sanitize_plan_for_mode(dict(LOOK), plans, "from_scratch")
    assert stripped == 1  # 只剥 nebula；gen 保留
    assert plans[0]["scene"]["kind"] == "gen:p1:01" and plans[1]["scene"] is None


# ---------- 编排入口降级 ----------

def test_generate_for_project_agent_missing_falls_back(gen_env, monkeypatch):
    monkeypatch.setattr(gen_scenes.llm, "_chat_json", lambda *a, **k: {
        "beats": [{"shot_index": 1, "title": "钩子", "idea": "x", "motion": "y"}]})
    monkeypatch.delenv("GEN_AGENT_CMD", raising=False)
    monkeypatch.setattr(gen_scenes.shutil, "which", lambda name: None)
    msgs = []
    out = gen_scenes.generate_for_project("p1", SCRIPT, LOOK, None, lambda **kw: msgs.append(kw))
    assert out["ok"] is False and "agent" in out["reason"]


def test_generate_for_project_success_first_round(gen_env, monkeypatch):
    (gen_env / "projects" / "p1").mkdir(parents=True)
    plan = {
        "v": 2, "script_hash": "x", "style_key": "y", "style_ok": True, "critic_used": False,
        "template": {"mode": "reuse", "reason": "", "reusable": []},
        "look": dict(LOOK), "kicker": "", "bgm": {"track": "", "volume": 0.7},
        "shots": [{"hash": f"h{i}", "plan": {"camera": "push"}} for i in range(5)],
    }
    director.save_plan("p1", plan)
    monkeypatch.setenv("GEN_AGENT_CMD", "claude")
    monkeypatch.setattr(gen_scenes.llm, "_chat_json", lambda *a, **k: {
        "beats": [{"shot_index": 1, "title": "钩子", "idea": "x", "motion": "y"},
                  {"shot_index": 3, "title": "深蓝", "idea": "y", "motion": "z"}]})
    prompts = []

    def fake_agent(prompt, update):
        prompts.append(prompt)

    monkeypatch.setattr(gen_scenes, "_run_agent", fake_agent)
    monkeypatch.setattr(gen_scenes, "_tsc_check", lambda: (True, ""))
    monkeypatch.setattr(gen_scenes, "_still_check", lambda pid, slug, look: (True, ""))
    msgs = []
    out = gen_scenes.generate_for_project("p1", SCRIPT, LOOK, None, lambda **kw: msgs.append(kw))
    assert out["ok"] is True and len(out["scenes"]) == 3 and out["patched"] == 3  # LLM 少报 2 个 → 补齐到 3
    assert len(prompts) == 1
    saved = director.load_cached_plan("p1")
    assert saved["shots"][0]["plan"]["scene"]["kind"] == "gen:p1:01"
    # 注册表最终只含通过的场景
    reg = (gen_env / "remotion" / "src" / "gen" / "registry.ts").read_text(encoding="utf-8")
    assert "gen:p1:01" in reg and "gen:p1:02" in reg


def test_generate_for_project_repair_round(gen_env, monkeypatch):
    (gen_env / "projects" / "p1").mkdir(parents=True)
    monkeypatch.setenv("GEN_AGENT_CMD", "claude")
    monkeypatch.setattr(gen_scenes.llm, "_chat_json", lambda *a, **k: {
        "beats": [{"shot_index": 1, "title": "钩子", "idea": "x", "motion": "y"}]})
    rounds = {"n": 0}

    def fake_validate(pid, slugs, look):
        rounds["n"] += 1
        if rounds["n"] == 1:
            return [], {"gen:p1:01": "tsc 失败：error TS2345"}
        return slugs, {}

    monkeypatch.setattr(gen_scenes, "_run_agent", lambda prompt, update: None)
    monkeypatch.setattr(gen_scenes, "validate_scenes", fake_validate)
    out = gen_scenes.generate_for_project("p1", SCRIPT, LOOK, None, lambda **kw: None)
    assert out["ok"] is True and rounds["n"] == 2  # 第 1 轮失败进入修复轮


def test_detect_agent_forced_and_modes(monkeypatch):
    monkeypatch.setenv("GEN_AGENT_CMD", "claude")
    assert gen_scenes._detect_agent() == ("claude", "acceptEdits")
    monkeypatch.setenv("GEN_AGENT_CMD", "command-code")
    assert gen_scenes._detect_agent() == ("command-code", "acceptEdits")
    monkeypatch.delenv("GEN_AGENT_CMD")
    monkeypatch.setattr(gen_scenes.shutil, "which", lambda name: "/x" if name == "zcode" else None)
    assert gen_scenes._detect_agent() == ("zcode", "yolo")


def test_run_agent_timeout_maps_to_error(gen_env, monkeypatch):
    import subprocess as sp

    class FakeProc:
        pid = 4242

        def communicate(self, input=None, timeout=None):
            if timeout:
                raise sp.TimeoutExpired(cmd="agent", timeout=timeout)
            return "", None

        def kill(self):
            pass

    def fake_popen(*a, **k):
        return FakeProc()

    monkeypatch.setattr(gen_scenes.subprocess, "Popen", fake_popen)
    monkeypatch.setattr(gen_scenes.subprocess, "run", lambda *a, **k: None)  # taskkill
    with pytest.raises(RuntimeError, match="超时"):
        gen_scenes._run_agent("prompt", lambda **kw: None)
