# -*- coding: utf-8 -*-
"""分镜图片提示词测试：本地兜底、对齐、持久化、LLM 失败回退。"""
from app.schemas import Line, ScriptDraft, Shot
from app.services import image_prompts, llm


def make_script(n=3) -> ScriptDraft:
    return ScriptDraft(
        title="程序员的一生",
        shots=[
            Shot(year=f"20{10 + i}", label=f"场景{i}", lines=[Line(text=f"台词{i}")])
            for i in range(n)
        ],
    )


def test_local_prompt_contains_context():
    script = make_script()
    p = image_prompts.build_local_prompt(script.title, script.shots[0])
    assert "场景0" in p
    assert "台词0" in p
    assert "2010" in p
    assert "9:16" in p


def test_align_pads_and_trims():
    script = make_script(3)
    assert len(image_prompts.align_prompts(["a", "b"], script)) == 3  # 缺 1 个补齐
    assert len(image_prompts.align_prompts(["a", "b", "c", "d"], script)) == 3  # 多 1 个截断
    out = image_prompts.align_prompts(["a", "", "c"], script)
    assert out[0] == "a" and out[2] == "c"
    assert "场景1" in out[1]  # 空串用本地兜底


def test_generate_and_store_roundtrip(monkeypatch, tmp_path):
    monkeypatch.setattr(image_prompts, "PROJECTS_DIR", tmp_path)
    monkeypatch.setattr(
        llm, "generate_image_prompts", lambda script, model_id: ["提示1", "提示2", "提示3"]
    )
    script = make_script(3)
    prompts = image_prompts.generate_and_store("p1", script, None)
    assert prompts == ["提示1", "提示2", "提示3"]
    assert image_prompts.load_stored("p1") == prompts


def test_llm_failure_falls_back_to_local(monkeypatch, tmp_path):
    monkeypatch.setattr(image_prompts, "PROJECTS_DIR", tmp_path)

    def boom(script, model_id):
        raise ValueError("LLM 挂了")

    monkeypatch.setattr(llm, "generate_image_prompts", boom)
    script = make_script(2)
    prompts = image_prompts.generate_and_store("p2", script, None)
    assert len(prompts) == 2
    assert all("场景" in p for p in prompts)  # 本地兜底提示词
