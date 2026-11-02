# -*- coding: utf-8 -*-
"""AI 导演 v2 测试：多阶段编排、清洗校验、分级缓存、降级链、props 合并。"""
import pytest

from app.services import director
from app.services.pipeline import assemble_props
from app.services.llm import generate_style_bible, generate_shot_plans, critic_rhythm
from app.schemas import ScriptDraft


@pytest.fixture
def proj_env(monkeypatch, tmp_path):
    """把导演方案存储指到 tmp。"""
    monkeypatch.setattr(director, "PROJECTS_DIR", tmp_path / "projects")
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


# ---------- 清洗校验 ----------

def test_validate_shot_plan_cleaning():
    raw = {
        "camera": "super_zoom",  # 非法枚举 → None
        "cameraPerLine": ["push", "super_zoom", "pull"],  # 非法项延续上一个合法运镜
        "intensity": 9.9,  # clamp 到 1.6
        "transition": "whip",
        "grade": {"contrast": 99, "saturate": -3, "tintOpacity": 0.3},
        "grain": 0.5,  # clamp 到 0.12
        "overlay": {"kind": "magic"},  # 非法 kind → None
        "sfxMoment": "boom",  # 非法 → None
        "atmosphere": {"kind": "storm"},  # 非法 → None
        "emphasis": ["工作", "x" * 40, "", 42],  # 清洗后保留合法词
    }
    p = director.validate_shot_plan(raw, 3)
    assert p["camera"] is None
    # 契约要求 list[str] 无 None：非法句延续上一合法运镜（push → push）
    assert p["cameraPerLine"] == ["push", "push", "pull"]
    assert p["intensity"] == 1.6
    assert p["transition"] == "whip"
    assert p["grade"] == {"contrast": 1.3, "saturate": 0.6, "brightness": 1.03, "tintOpacity": 0.3}
    assert p["grain"] == 0.12
    assert p["overlay"] is None
    assert p["sfxMoment"] is None
    assert p["atmosphere"] is None
    assert p["emphasis"] == ["工作", "x" * 12]  # 超长词截断到 12 字


def test_validate_shot_plan_tolerates_garbage():
    p = director.validate_shot_plan("not-a-dict", 2)
    assert p["camera"] is None
    assert p["intensity"] == 1.0
    assert p["overlay"] is None


def test_validate_overlay_kinds():
    assert director.validate_overlay({"kind": "counter", "value": "12.5", "unit": "万"}) == {
        "kind": "counter", "value": 12.5, "unit": "万",
    }
    assert director.validate_overlay({"kind": "counter"}) is None  # 缺 value
    chat = director.validate_overlay({"kind": "chat", "text": "需求又改了", "side": "r", "name": "产品"})
    assert chat["side"] == "left" and chat["name"] == "产品"  # side 非法回退 left
    stat = director.validate_overlay({"kind": "stat", "label": "血条", "from": "100", "to": "20"})
    assert stat == {"kind": "stat", "label": "血条", "from": 100.0, "to": 20.0}
    term = director.validate_overlay({"kind": "terminal", "lines": ["a", 1, "", "b", "c", "d", "e"]})
    assert term["lines"] == ["a", "b", "c", "d"]  # 截断到 4 行、丢弃非法项


def test_validate_look():
    look = director.validate_look(
        {
            "accent": "red",  # 非法 hex → 默认
            "palette": ["#112233", "zzz"],  # 第二色非法 → 整组丢弃
            "vignette": 9,  # clamp 1.5
            "subtitleStyle": "fancy",  # 非法 → 默认 bold
            "atmosphere": {"kind": "rain", "opacity": 5},
        }
    )
    assert look["accent"] == director.DEFAULT_LOOK["accent"]  # 非法 hex → 默认（纸感强调色）
    assert look["palette"] == list(director.DEFAULT_LOOK["palette"])  # 整组丢弃 → 预设色板
    assert look["vignette"] == 1.5
    assert look["subtitleStyle"] == "bold"
    assert look["atmosphere"] == {"kind": "rain", "opacity": 1.0}
    assert look["preset"] == "paper"
    good = director.validate_look({"accent": "#58a6ff", "palette": ["#0d1117", "#161b22"]})
    assert good["accent"] == "#58a6ff" and good["palette"] == ["#0d1117", "#161b22"]


# ---------- 多阶段编排与降级 ----------

def _fns(style_raw=None, batch_raw=None, critic_raw=None, fail_style=False,
         fail_batch=False, fail_critic=False, calls=None):
    calls = calls if calls is not None else {"style": 0, "batch": 0, "critic": 0}
    style_raw = style_raw if style_raw is not None else {
        "look": {"accent": "#58a6ff", "atmosphere": {"kind": "stars", "opacity": 0.5}},
        "kicker": "程序员的一天",
        "bgm": {"track": "uplifting", "volume": 0.7},
    }
    batch_raw = batch_raw if batch_raw is not None else {
        "shots": [
            {"camera": "push", "transition": "dissolve", "emphasis": ["工作"],
             "overlay": {"kind": "counter", "value": 30, "unit": "万"}},
            {"camera": "pull", "transition": "glitch", "sfxMoment": "impact"},
        ]
    }

    def gen_style():
        calls["style"] += 1
        if fail_style:
            raise RuntimeError("style down")
        return style_raw

    def gen_batch(start, end, tail):
        calls["batch"] += 1
        if fail_batch:
            raise RuntimeError("batch down")
        assert isinstance(tail, list)
        return batch_raw

    def critic(shots):
        calls["critic"] += 1
        if fail_critic:
            raise RuntimeError("critic down")
        return critic_raw if critic_raw is not None else {"patches": []}

    return gen_style, gen_batch, critic, calls


def test_create_plan_full_flow(proj_env):
    msgs = []
    gen_style, gen_batch, critic, calls = _fns()
    plan = director.create_plan(
        "p1", SCRIPT, "风格", "提示", [], gen_style, gen_batch, critic,
        progress=msgs.append,
    )
    assert calls == {"style": 1, "batch": 1, "critic": 1}
    assert plan["v"] == 2
    assert plan["look"]["accent"] == "#58a6ff"
    assert plan["kicker"] == "程序员的一天"
    assert plan["bgm"]["track"] == "uplifting"
    assert plan["shots"][0]["plan"]["camera"] == "push"
    assert plan["shots"][0]["plan"]["overlay"]["kind"] == "counter"
    assert plan["shots"][1]["plan"]["transition"] == "glitch"
    st = plan["_stats"]
    assert st["shots_total"] == 2 and st["shots_reused"] == 0
    # 阶段进度可见
    assert any("风格定调" in m for m in msgs)
    assert any("批次 1/1" in m for m in msgs)
    assert any("节奏审查" in m for m in msgs)


def test_create_plan_style_failure_degrades(proj_env):
    msgs = []
    gen_style, gen_batch, critic, calls = _fns(fail_style=True)
    plan = director.create_plan("p2", SCRIPT, "风格", "", [], gen_style, gen_batch, critic,
                                progress=msgs.append)
    assert plan["look"] == director.DEFAULT_LOOK  # 默认风格兜底
    assert plan["style_ok"] is False
    assert plan["shots"][0]["plan"]["camera"] == "push"  # 逐镜编排照常
    assert any("风格定调失败" in m for m in msgs)


def test_create_plan_batch_failure_falls_back_to_template(proj_env):
    msgs = []
    gen_style, gen_batch, critic, calls = _fns(fail_batch=True)
    plan = director.create_plan("p3", SCRIPT, "", "", [], gen_style, gen_batch, critic,
                                progress=msgs.append)
    assert plan["shots"][0]["plan"]["camera"] is None  # 模板规则
    assert plan["shots"][1]["plan"]["camera"] is None
    assert any("回退模板规则" in m for m in msgs)


def test_create_plan_critic_patches_applied(proj_env):
    gen_style, gen_batch, critic, _ = _fns(
        critic_raw={"patches": [{"index": 1, "camera": "dolly_zoom", "overlay": None, "intensity": 2.2}]},
    )
    plan = director.create_plan("p4", SCRIPT, "", "", [], gen_style, gen_batch, critic)
    p1 = plan["shots"][1]["plan"]
    assert p1["camera"] == "dolly_zoom"
    assert p1["overlay"] is None  # patch 删除浮层
    assert p1["intensity"] == 1.6  # clamp
    assert plan["critic_used"] is True


def test_create_plan_critic_failure_keeps_plan(proj_env):
    msgs = []
    gen_style, gen_batch, critic, calls = _fns(fail_critic=True)
    plan = director.create_plan("p5", SCRIPT, "", "", [], gen_style, gen_batch, critic,
                                progress=msgs.append)
    assert plan["critic_used"] is False
    assert plan["shots"][0]["plan"]["camera"] == "push"
    assert any("节奏审查失败" in m for m in msgs)


# ---------- 分级缓存 ----------

def test_cache_reuse_by_shot_hash(proj_env):
    calls = {"style": 0, "batch": 0, "critic": 0}
    gen_style, gen_batch, critic, calls = _fns(calls=calls)
    director.create_plan("p6", SCRIPT, "风格A", "", [], gen_style, gen_batch, critic)
    assert calls == {"style": 1, "batch": 1, "critic": 1}
    # 同脚本同风格：全命中，零调用
    plan2 = director.create_plan("p6", SCRIPT, "风格A", "", [], gen_style, gen_batch, critic)
    assert calls == {"style": 1, "batch": 1, "critic": 1}  # 无新增调用
    assert plan2["_stats"]["shots_reused"] == 2
    # 改一镜台词：只有该批重跑（两镜同批 → 批次重跑 1 次），风格复用
    script2 = SCRIPT.model_copy(deep=True)
    script2.shots[1].lines[0].text = "我改了这句台词。"
    plan3 = director.create_plan("p6", script2, "风格A", "", [], gen_style, gen_batch, critic)
    assert calls["style"] == 1  # 风格圣经仍复用
    assert calls["batch"] == 2  # 编排批重跑一次
    assert plan3["_stats"]["shots_reused"] == 1
    # 改风格提示词：风格重定 + 镜头全重导
    director.create_plan("p6", SCRIPT, "风格B", "", [], gen_style, gen_batch, critic)
    assert calls["style"] == 2
    assert calls["batch"] == 3


def test_save_and_load_v2_roundtrip(proj_env):
    gen_style, gen_batch, critic, _ = _fns()
    director.create_plan("p7", SCRIPT, "", "", [], gen_style, gen_batch, critic)
    cached = director.load_cached_plan("p7")
    assert cached is not None and cached["v"] == 2
    assert len(cached["shots"]) == 2
    assert director.load_cached_plan("missing-project") is None


# ---------- props 合并 ----------

def test_assemble_props_with_v2_plan():
    durations = {"s01_0": 2.0, "s01_1": 1.5, "s02_0": 2.0}
    plan = {
        "v": 2,
        "look": {"accent": "#58a6ff", "subtitleStyle": "pill", "vignette": 1.2,
                 "atmosphere": {"kind": "stars", "opacity": 0.5}},
        "kicker": "程序员的一天",
        "bgm": {"track": "uplifting", "volume": 0.7},
        "shots": [
            {"hash": "a", "plan": {
                "camera": "push", "cameraPerLine": ["push", "pan_left"], "intensity": 1.3,
                "transition": "dissolve",
                "grade": {"contrast": 1.2, "saturate": 0.8, "brightness": 1.0, "tintOpacity": 0.3},
                "grain": 0.1,
                "overlay": {"kind": "counter", "value": 30, "unit": "万", "label": "欠款"},
                "sfxMoment": "impact", "atmosphere": {"kind": "embers", "opacity": 0.4},
                "emphasis": ["工作"],
            }},
            {"hash": "b", "plan": {"camera": "pull"}},
        ],
    }
    props = assemble_props(SCRIPT, durations, [None, None], plan=plan, grain_opacity=0.08)
    s0, s1 = props.shots
    assert s0.camera == "push"
    assert s0.cam_intensity == 1.3
    assert s0.camera_per_line == ["push", "pan_left"]
    assert s0.grade is not None and s0.grade.contrast == 1.2
    assert s0.overlay is not None and s0.overlay.kind == "counter" and s0.overlay.value == 30
    assert s0.sfx_moment == "impact"
    assert s0.atmosphere is not None and s0.atmosphere.kind == "embers"
    assert s0.lines[0].emphasis == ["工作"]  # AI 强调词按句过滤（"工作"在第 1 句）
    assert s0.lines[1].emphasis is None  # 第 2 句无匹配词且无数字/引语 → 不强调
    assert s1.camera == "pull"
    assert s1.overlay is None
    assert props.look is not None and props.look.accent == "#58a6ff"
    assert props.look.subtitle_style == "pill"
    assert props.kicker == "程序员的一天"
    js = props.to_props_json()
    # camelCase 序列化回归
    assert '"camIntensity"' in js and '"enterTransition"' in js
    assert '"cameraPerLine"' in js and '"sfxMoment"' in js
    assert '"subtitleStyle"' in js
    assert "null" not in js


def test_assemble_props_without_plan_still_works():
    durations = {"s01_0": 2.0, "s01_1": 1.5, "s02_0": 2.0}
    props = assemble_props(SCRIPT, durations, [None, None])
    assert props.look is None and props.kicker is None
    assert props.shots[0].camera is None
    js = props.to_props_json()
    assert "null" not in js


# ---------- LLM 三阶段提示词 ----------

def test_generate_style_bible_prompt(monkeypatch):
    from app.services import llm as llm_mod
    captured = {}

    def fake_chat(model_id, user, temperature, system_prompt):
        captured["user"] = user
        return '{"look": {"accent": "#58a6ff"}, "bgm": {"track": "uplifting"}}'

    monkeypatch.setattr(llm_mod, "_chat", fake_chat)
    raw = generate_style_bible(
        SCRIPT, "故事向", "黄金3秒钩子",
        [{"name": "uplifting", "title": "明亮励志", "tags": ["励志"], "bpm": 100}],
        None,
    )
    assert raw["bgm"]["track"] == "uplifting"
    assert "uplifting" in captured["user"]
    assert "故事向" in captured["user"]
    assert "黄金3秒钩子" in captured["user"]


def test_generate_shot_plans_batch_context(monkeypatch):
    from app.services import llm as llm_mod
    captured = {}

    def fake_chat(model_id, user, temperature, system_prompt):
        captured["user"] = user
        return '{"shots": [{"camera": "push"}]}'

    monkeypatch.setattr(llm_mod, "_chat", fake_chat)
    tail = [{"camera": "still", "transition": "cut"}]
    raw = generate_shot_plans(SCRIPT, {"look": {"accent": "#fff"}}, 0, 1, tail, None)
    assert raw["shots"][0]["camera"] == "push"
    assert "镜头1~1" in captured["user"]
    assert "still" in captured["user"]  # 尾部上下文注入
    assert "#fff" in captured["user"]  # 风格注入


def test_critic_rhythm_compact_plan(monkeypatch):
    from app.services import llm as llm_mod
    captured = {}

    def fake_chat(model_id, user, temperature, system_prompt):
        captured["user"] = user
        return '{"patches": [{"index": 0, "camera": "pull"}]}'

    monkeypatch.setattr(llm_mod, "_chat", fake_chat)
    plans = [director.validate_shot_plan({"camera": "push", "intensity": 1.2}, 2)] * 2
    out = critic_rhythm(SCRIPT, plans, None)
    assert out["patches"][0]["index"] == 0
    assert "镜头方案" in captured["user"] or "台词" in captured["user"]


# ---------- 代码绘制场景 ----------

def test_validate_scene():
    assert director.validate_scene({"kind": "impact"}) == {"kind": "impact"}
    s = director.validate_scene({"kind": "solar", "palette": ["#0b0f1a", "bad"], "accent": "#4DE1FF", "speed": 9})
    assert s["kind"] == "solar" and s["accent"] == "#4DE1FF" and s["speed"] == 2.0
    assert "palette" not in s  # 任一色非法整组丢弃
    assert director.validate_scene({"kind": "black_hole"}) is None
    assert director.validate_scene("nope") is None


def test_validate_bgm_search():
    b = director.validate_bgm({"track": "__search__", "query": "documentary ambient", "volume": 0.6})
    assert b == {"track": "__search__", "volume": 0.6, "query": "documentary ambient"}
    b2 = director.validate_bgm({"track": "__search__"})  # 无 query 允许，走题材兜底
    assert b2["query"] == ""
    b3 = director.validate_bgm({"track": "uplifting", "query": "ignored"})
    assert b3["query"] == ""  # 非搜曲模式不带 query


def test_assemble_props_scene():
    durations = {"s01_0": 2.0, "s01_1": 1.5, "s02_0": 2.0}
    plan = {
        "v": 2,
        "shots": [
            {"hash": "a", "plan": {"camera": "push", "scene": {"kind": "accretion", "accent": "#ff9a3d", "speed": 1.2}}},
            {"hash": "b", "plan": {"camera": "pull"}},
        ],
    }
    props = assemble_props(SCRIPT, durations, [None, None], plan=plan)
    assert props.shots[0].scene is not None
    assert props.shots[0].scene.kind == "accretion"
    assert props.shots[0].scene.accent == "#ff9a3d"
    assert props.shots[1].scene is None
    js = props.to_props_json()
    assert '"scene"' in js and '"accretion"' in js
    assert "null" not in js
