# -*- coding: utf-8 -*-
"""脚本提示词模板测试：加载、组装用户消息。"""
import json

from app.schemas import GenRequest
from app.services.llm import build_generate_user_prompt, load_prompt_templates


def test_load_prompt_templates_from_file(tmp_path):
    cfg = tmp_path / "prompts.json"
    cfg.write_text(
        json.dumps(
            {
                "templates": [
                    {"id": "a", "name": "模板A", "description": "说明A", "content": "内容A"},
                ]
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    templates = load_prompt_templates(cfg)
    assert templates[0]["id"] == "a"
    assert templates[0]["content"] == "内容A"


def test_build_prompt_includes_custom_prompt():
    req = GenRequest(topic="测试选题", target_seconds=30, prompt="开头必须用疑问句，结尾必须反转")
    text = build_generate_user_prompt(req)
    assert "测试选题" in text
    assert "开头必须用疑问句，结尾必须反转" in text
    assert "创作提示词" in text


def test_build_prompt_includes_opening_and_duration_rules():
    req = GenRequest(topic="测试选题", target_seconds=45)
    text = build_generate_user_prompt(req)
    assert "数字 → 反差 → 代价" in text
    assert "45" in text
    assert "15 秒" in text
    # 人设开场/结束语已移除：提示词里不得再出现
    assert "我是阿扎" not in text
    assert "带你领略科普知识" not in text


def test_build_prompt_without_custom_prompt():
    req = GenRequest(topic="测试选题", target_seconds=30)
    text = build_generate_user_prompt(req)
    assert "创作提示词" not in text
    assert "请输出完整分镜脚本 JSON" in text


def test_prompt_whitespace_only_ignored():
    req = GenRequest(topic="测试选题", target_seconds=30, prompt="   \n  ")
    text = build_generate_user_prompt(req)
    assert "创作提示词" not in text
