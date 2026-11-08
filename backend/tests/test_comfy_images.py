# -*- coding: utf-8 -*-
"""ComfyUI AI 生图测试：工作流构建、checkpoint 解析、翻译、run_ai_images→select_image 全链、路由。"""
import json

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routers import comfy as comfy_router
from app.routers import flow as flow_router
from app.routers import projects as projects_router
from app.services import comfy, flow, llm
from app.schemas import ScriptDraft


def _script(n_shots: int = 2) -> ScriptDraft:
    return ScriptDraft.model_validate(
        {
            "title": "测试",
            "shots": [
                {"label": f"第{i}镜", "colors": ["#1a1a2e", "#16213e"], "lines": [{"text": f"台词{i}"}]}
                for i in range(1, n_shots + 1)
            ],
        }
    )


@pytest.fixture
def proj_env(monkeypatch, tmp_path):
    """把项目存储与 public 目录都指到 tmp，预置一个带 script/meta 的项目。"""
    storage = tmp_path / "storage"
    public = tmp_path / "public"
    pid = "p1"
    pdir = storage / "projects" / pid
    pdir.mkdir(parents=True)
    (pdir / "script.json").write_text(_script().model_dump_json(), encoding="utf-8")
    (pdir / "meta.json").write_text(json.dumps({"title": "测试", "created_at": "", "updated_at": ""}), encoding="utf-8")
    monkeypatch.setattr(flow, "PROJECTS_DIR", storage / "projects")
    monkeypatch.setattr(flow, "REMOTION_PUBLIC", public)
    monkeypatch.setattr(projects_router, "PROJECTS_DIR", storage / "projects")
    monkeypatch.setattr(comfy, "COMFYUI_URL", "http://comfy.test:8188")
    return {"pid": pid, "storage": storage, "public": public, "pdir": pdir}


# ---- comfy 服务层 ----


def test_resolve_checkpoint_priority(monkeypatch):
    cks = ["sd_xl_base_1.0.safetensors", "juggernautXL_v9.safetensors", "dreamshaperXL.safetensors"]
    assert comfy._resolve_checkpoint(cks, "dreamshaperXL.safetensors") == "dreamshaperXL.safetensors"
    monkeypatch.setattr(comfy, "COMFYUI_CHECKPOINT", "juggernautXL_v9.safetensors")
    assert comfy._resolve_checkpoint(cks) == "juggernautXL_v9.safetensors"
    monkeypatch.setattr(comfy, "COMFYUI_CHECKPOINT", "")
    assert comfy._resolve_checkpoint(cks) == "juggernautXL_v9.safetensors"  # 自动挑 juggernaut
    assert comfy._resolve_checkpoint(["sd_xl_base_1.0.safetensors"]) == "sd_xl_base_1.0.safetensors"
    assert comfy._resolve_checkpoint([], "whatever") == "whatever"  # 空列表透传，由 ComfyUI 报具体错


def test_pick_variant_routing():
    both = ["Juggernaut_RunDiffusionPhoto2_Lightning_4Steps.safetensors", "Juggernaut-XL_v9_RunDiffusionPhoto2.safetensors"]
    # 人像 → Lightning 快枪手；场景 → 完整版 v9
    assert comfy.pick_variant(both, "portrait") == both[0]
    assert comfy.pick_variant(both, "scene") == both[1]
    assert comfy.pick_variant(both, "auto") == both[1]
    # 只有 Lightning 时场景也回退 Lightning（采样参数按实际模型自动适配）
    only_light = both[:1]
    assert comfy.pick_variant(only_light, "scene") == only_light[0]
    assert comfy.pick_variant(only_light, "portrait") == only_light[0]
    # 只有完整版时人像回退完整版
    only_full = both[1:]
    assert comfy.pick_variant(only_full, "portrait") == only_full[0]


def test_sampling_lightning_vs_full():
    assert comfy._sampling_for("Juggernaut_RunDiffusionPhoto2_Lightning_4Steps.safetensors")[0] == 4
    assert comfy._sampling_for("Juggernaut_RunDiffusionPhoto2_Lightning_4Steps.safetensors")[1] == 1.8
    assert comfy._sampling_for("Juggernaut-XL_v9.safetensors") == (comfy.STEPS, comfy.CFG, comfy.SAMPLER, comfy.SCHEDULER)


def test_build_graph_structure():
    g = comfy._build_graph("a cat", "ck.safetensors", seed=42, negative="blurry")
    assert g["1"]["inputs"]["ckpt_name"] == "ck.safetensors"
    assert g["2"]["inputs"]["text"] == "a cat" and g["2"]["inputs"]["clip"] == ["1", 1]
    assert g["3"]["inputs"]["text"] == "blurry"
    assert g["4"]["inputs"]["width"] == comfy.WIDTH and g["4"]["inputs"]["height"] == comfy.HEIGHT
    assert g["5"]["inputs"]["seed"] == 42 and g["5"]["inputs"]["steps"] == comfy.STEPS
    assert g["7"]["class_type"] == "SaveImage"


def test_txt2img_requires_config(monkeypatch):
    monkeypatch.setattr(comfy, "COMFYUI_URL", "")
    with pytest.raises(RuntimeError, match="COMFYUI_URL"):
        comfy.txt2img("a cat")


# ---- 翻译 ----


def test_translate_ascii_passthrough():
    assert llm.translate_image_prompt("a red fox in snow, cinematic", None) == ("a red fox in snow, cinematic", False)


def test_translate_via_llm(monkeypatch):
    monkeypatch.setattr(
        llm,
        "_chat_json",
        lambda *a, **k: {"prompt_en": "a snowy street at dusk, cinematic photo", "portrait": False},
    )
    out, portrait = llm.translate_image_prompt("黄昏雪夜的街道，电影感", None)
    assert out == "a snowy street at dusk, cinematic photo" and portrait is False
    monkeypatch.setattr(
        llm,
        "_chat_json",
        lambda *a, **k: {"prompt_en": "close-up portrait of a woman, soft light", "portrait": True},
    )
    _, portrait = llm.translate_image_prompt("女子特写，柔光", None)
    assert portrait is True
    with pytest.raises(ValueError):
        llm.translate_image_prompt("  ", None)


# ---- flow 全链（mock 掉 ComfyUI 与 LLM） ----


def test_run_ai_images_then_select(proj_env, monkeypatch):
    pid = proj_env["pid"]
    prompts = {1: "人物特写：少女回眸", 2: "雪夜街道全景"}
    monkeypatch.setattr(llm, "generate_image_prompts", lambda script, mid: [prompts[i] for i in range(1, len(script.shots) + 1)])
    monkeypatch.setattr(llm, "translate_image_prompt", lambda cn, mid: (f"en-({cn})", "特写" in cn))

    png = b"\x89PNG-fake-bytes"
    seen_variants: list[str] = []

    def fake_txt2img(prompt_en, checkpoint="", **kw):
        assert prompt_en.startswith("en-(人物特写") or prompt_en.startswith("en-(雪夜街道")
        seen_variants.append(kw.get("variant"))
        return png, 12345, "juggernautXL_v9.safetensors"

    monkeypatch.setattr(comfy, "txt2img", fake_txt2img)

    msgs: list[str] = []
    flow.run_ai_images(pid, None, lambda **kw: msgs.append(kw.get("message", "")))

    data = flow.load_images(pid)
    scenes = data["scenes"]
    assert len(scenes) == 2
    assert seen_variants == ["portrait", "scene"]  # 人像走快枪手，场景走完整版
    sc1 = scenes[0]
    assert sc1["prompt_cn"] == "人物特写：少女回眸" and sc1["prompt_en_ai"] == "en-(人物特写：少女回眸)"
    assert sc1["portrait"] is True
    cand = sc1["candidates"][0]
    assert cand["id"] == "ai-12345" and cand["provider"] == "comfy"
    assert cand["local_path"] and (proj_env["pdir"] / "ai" / "01-12345.png").exists()
    assert not sc1.get("ai_error")

    # 选用 AI 候选 → 复制进 public 配图契约
    flow.select_image(pid, 1, "ai-12345")
    sc_after = flow.load_images(pid)["scenes"][0]
    assert sc_after["downloaded"] == f"pic/projects/{pid}/01-ai.png"
    assert (proj_env["public"] / "pic" / "projects" / pid / "01-ai.png").read_bytes() == png


def test_run_ai_images_single_scene_error_isolated(proj_env, monkeypatch):
    pid = proj_env["pid"]
    monkeypatch.setattr(llm, "generate_image_prompts", lambda script, mid: ["中文1", "中文2"])

    def flaky(prompt_en, checkpoint="", **kw):
        if "中文1" in prompt_en:
            raise RuntimeError("boom")
        return b"\x89PNG", 7, "ck"

    monkeypatch.setattr(llm, "translate_image_prompt", lambda cn, mid: (f"en-({cn})", False))
    monkeypatch.setattr(comfy, "txt2img", flaky)
    flow.run_ai_images(pid, None, lambda **kw: None, scene_indexes=[1, 2])
    scenes = flow.load_images(pid)["scenes"]
    assert "boom" in scenes[0]["ai_error"]
    assert scenes[1]["candidates"][0]["id"] == "ai-7"


# ---- 路由 ----


@pytest.fixture
def client(proj_env):
    app = FastAPI()
    app.include_router(flow_router.router)
    app.include_router(comfy_router.router)
    return TestClient(app)


def test_ai_candidate_file_route(client, proj_env):
    pid = proj_env["pid"]
    (proj_env["pdir"] / "ai").mkdir(exist_ok=True)
    (proj_env["pdir"] / "ai" / "01-9.png").write_bytes(b"\x89PNG-data")

    r = client.get(f"/api/projects/{pid}/flow/images/ai/01-9.png")
    assert r.status_code == 200 and r.content == b"\x89PNG-data"

    assert client.get(f"/api/projects/{pid}/flow/images/ai/../secret.png").status_code in (400, 404)
    assert client.get(f"/api/projects/{pid}/flow/images/ai/nope.png").status_code == 404
    assert client.get(f"/api/projects/{pid}/flow/images/ai/01-9.txt").status_code == 400


def test_comfy_status_route(client, monkeypatch):
    monkeypatch.setattr(comfy, "COMFYUI_URL", "http://comfy.test:8188")
    monkeypatch.setattr(
        comfy, "status", lambda: {"reachable": True, "url": "http://comfy.test:8188", "checkpoints": ["a"], "checkpoint": "a"}
    )
    r = client.get("/api/comfy/status")
    assert r.status_code == 200 and r.json()["reachable"] is True
