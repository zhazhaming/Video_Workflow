# -*- coding: utf-8 -*-
"""模型注册表测试：${VAR} 解析、可用性判断、默认模型选择。"""
import json

from app.services.llm import _pick, _resolve, list_model_infos, load_models


def test_resolve_env_placeholder():
    env = {"KEY": "sk-abc", "URL": "https://api.example.com"}
    assert _resolve("${KEY}", env) == "sk-abc"
    assert _resolve("https://plain", env) == "https://plain"
    assert _resolve("${MISSING}", env) == ""
    assert _resolve("", env) == ""


def test_load_models_from_file(tmp_path):
    cfg = tmp_path / "models.json"
    cfg.write_text(
        json.dumps(
            {
                "models": [
                    {
                        "id": "m1",
                        "name": "模型一",
                        "base_url": "${BASE}",
                        "api_key": "${KEY}",
                        "model": "m1-model",
                        "default": True,
                    },
                    {"id": "m2", "name": "模型二", "base_url": "", "api_key": "", "model": "x"},
                ]
            }
        ),
        encoding="utf-8",
    )
    env = {"BASE": "https://api.foo.com/", "KEY": "sk-1"}
    models = load_models(cfg, env)
    assert models[0].base_url == "https://api.foo.com"  # 尾斜杠已去掉
    assert models[0].available
    assert models[0].is_default
    assert not models[1].available


def test_pick_default_and_by_id(tmp_path, monkeypatch):
    cfg = tmp_path / "models.json"
    cfg.write_text(
        json.dumps(
            {
                "models": [
                    {"id": "a", "base_url": "${B}", "api_key": "${K}", "model": "ma", "default": True},
                    {"id": "b", "base_url": "${B}", "api_key": "${K}", "model": "mb"},
                ]
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr("app.services.llm.MODELS_CONFIG", cfg)
    monkeypatch.setenv("B", "https://x")
    monkeypatch.setenv("K", "sk")
    assert _pick(None).id == "a"
    assert _pick("b").id == "b"
