# -*- coding: utf-8 -*-
"""模型 API 配置测试：保存/读取往返、id 校验、.bak 备份、路由。"""
import json

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routers import model_settings as router_mod
from app.services import llm


def _entry(eid, base="https://api.example.com", key="sk-test", model="test-model", default=False, extra_headers=None):
    return llm.ModelEntryIO(
        id=eid,
        name=eid,
        base_url=base,
        api_key=key,
        model=model,
        default=default,
        extra_headers=extra_headers or {},
    )


@pytest.fixture
def models_file(monkeypatch, tmp_path):
    """把 MODELS_CONFIG 指到 tmp，预置一个带 ${ENV} 占位的旧注册表。"""
    p = tmp_path / "models.json"
    p.write_text(
        json.dumps(
            {
                "models": [
                    {
                        "id": "old-model",
                        "name": "旧模型",
                        "base_url": "${OLD_BASE_URL}",
                        "api_key": "${OLD_API_KEY}",
                        "model": "old-v1",
                        "default": True,
                    }
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr(llm, "MODELS_CONFIG", p)
    return p


# ---- 服务层 ----


def test_save_then_load_roundtrip(models_file):
    out = llm.save_model_configs(
        [
            _entry("a", default=True, extra_headers={"X-Session": "s-1", "  ": "drop-me"}),
            _entry("b", base="", key=""),
        ]
    )
    assert [m["id"] for m in out] == ["a", "b"]
    assert out[0]["default"] and out[0]["available"]
    assert out[0]["extra_headers"] == {"X-Session": "s-1"}  # 空键被剔除
    assert not out[1]["available"]  # base_url 为空 → 不可用

    # load_models 走同一个文件，解析结果与落盘一致
    models = llm.load_models()
    assert models[0].id == "a" and models[0].is_default and models[0].api_key == "sk-test"
    assert models[0].extra_headers == {"X-Session": "s-1"}
    assert models[1].extra_headers == {}


def test_save_overrides_env_placeholder_entries(models_file, monkeypatch):
    monkeypatch.setenv("OLD_BASE_URL", "https://old.example.com")
    monkeypatch.setenv("OLD_API_KEY", "sk-old")
    assert llm.load_models()[0].base_url == "https://old.example.com"

    llm.save_model_configs([_entry("old-model", base="https://new.example.com", default=True)])
    m = llm.load_models()[0]
    assert m.base_url == "https://new.example.com"  # 字面量覆盖 ${ENV} 占位


def test_save_rejects_empty_and_duplicate_ids(models_file):
    with pytest.raises(ValueError, match="不能为空"):
        llm.save_model_configs([_entry("  ")])
    with pytest.raises(ValueError, match="重复"):
        llm.save_model_configs([_entry("a"), _entry("a")])


def test_save_backs_up_previous_file(models_file):
    llm.save_model_configs([_entry("a")])
    bak = models_file.parent / "models.json.bak"
    assert bak.exists()
    assert json.loads(bak.read_text(encoding="utf-8"))["models"][0]["id"] == "old-model"


def test_pick_falls_back_for_unknown_id(models_file):
    """失效的 model_id（如 vibe 项目遗留的 "agent"）回退默认可用模型，不再抛「未知模型」。"""
    llm.save_model_configs([_entry("a", default=True), _entry("b", base="", key="")])
    assert llm._pick("agent").id == "a"
    assert llm._pick(None).id == "a"
    # 已知但未配齐仍报错（提示去设置里补齐）
    with pytest.raises(RuntimeError, match="未配置完整"):
        llm._pick("b")
    # 全部不可用才报"没有可用模型"
    llm.save_model_configs([_entry("a", base="", key="")])
    with pytest.raises(RuntimeError, match="没有可用的模型"):
        llm._pick(None)


# ---- 路由 ----


@pytest.fixture
def client(models_file, monkeypatch):
    app = FastAPI()
    app.include_router(router_mod.router)
    return TestClient(app)


def test_get_and_put_config(client):
    r = client.get("/api/models/config")
    assert r.status_code == 200
    assert r.json()["models"][0]["id"] == "old-model"

    r = client.put(
        "/api/models/config",
        json={
            "models": [
                {"id": "x", "name": "X", "base_url": "https://x", "api_key": "k", "model": "m", "default": True}
            ]
        },
    )
    assert r.status_code == 200
    assert r.json()["models"][0]["id"] == "x"
    assert llm.load_models()[0].id == "x"  # 已落盘、立即生效


def test_put_config_rejects_duplicate(client):
    r = client.put(
        "/api/models/config",
        json={"models": [{"id": "a"}, {"id": "a"}]},
    )
    assert r.status_code == 422
    assert "重复" in r.json()["detail"]


def test_test_endpoint_returns_service_result(client, monkeypatch):
    captured = {}

    def fake_test(base_url, api_key, model, timeout=20.0, extra_headers=None):
        captured.update(extra_headers=extra_headers)
        return {"ok": True, "latency_ms": 12, "reply": "OK"}

    monkeypatch.setattr(llm, "test_model", fake_test)
    r = client.post(
        "/api/models/test",
        json={
            "base_url": "https://api.example.com",
            "api_key": "sk",
            "model": "m",
            "extra_headers": {"x-opencode-session": "s-1"},
        },
    )
    assert r.status_code == 200
    assert r.json() == {"ok": True, "latency_ms": 12, "reply": "OK"}
    assert captured["extra_headers"] == {"x-opencode-session": "s-1"}
