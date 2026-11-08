# -*- coding: utf-8 -*-
"""事实审计工具测试：数字提取、匹配放宽链（原文→裸值→数值等值）、
制作参数噪音过滤、strict 退出码、script_hash 与审计落盘。
"""
import importlib.util
import json
import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]

_SPEC = importlib.util.spec_from_file_location(
    "facts_audit", BACKEND / "tools" / "facts_audit.py")
fa = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(fa)


def _write(tmp_path, script, research):
    s = tmp_path / "script.json"
    r = tmp_path / "research.json"
    s.write_text(json.dumps(script, ensure_ascii=False), encoding="utf-8")
    r.write_text(json.dumps(research, ensure_ascii=False), encoding="utf-8")
    return s, r


SCRIPT = {"title": "t", "shots": [{"lines": [
    {"text": "全球市场规模达到 4500 亿美元，同比增长 1.08%。"},
    {"text": "用户突破 3 亿，等了 5 秒就能上手，每句不超过 20 字。"},
    {"text": "本地有 1.2万人到场。"},
]}]}

RESEARCH = {"topic": "AI 市场", "nodes": [
    {"year": "2026", "title": "市场规模创新高",
     "what": "2026 年全球市场规模达到 4500 亿美元，同比增长 1.08%。",
     "sources": [{"title": "权威媒体", "url": "https://example.com/a"}]},
    {"year": "2026", "title": "大会盛况",
     "what": "现场统计有 12000 人参与。",
     "sources": [{"title": "主办方", "url": "https://example.com/b"}]},
]}


def test_extract_numbers_skips_production_params():
    toks = fa.extract_numbers("等了 5 秒就能上手，每句不超过 20 字，1080px 宽。")
    assert toks == []


def test_extract_numbers_keeps_facts():
    toks = fa.extract_numbers("增长 1.08%，规模 4500 亿美元，突破 3 亿。")
    assert "1.08%" in toks and "4500亿" in toks and "3亿" in toks


def test_audit_verified_and_unverifiable(tmp_path):
    s, r = _write(tmp_path, SCRIPT, RESEARCH)
    result = fa.audit(s, r)
    by_value = {it["value"]: it for it in result["items"]}
    assert by_value["1.08%"]["status"] == "verified"
    assert by_value["1.08%"]["source_url"] == "https://example.com/a"
    assert by_value["4500亿"]["status"] == "verified"
    assert by_value["3亿"]["status"] == "unverifiable"  # research 里没有
    # 制作参数数字不进审计项
    assert all(it["value"] != "5" for it in result["items"])
    # 数值等值匹配：「1.2万」↔ 正文「12000」
    assert by_value["1.2万"]["status"] == "verified"
    assert by_value["1.2万"]["source_url"] == "https://example.com/b"
    assert result["summary"]["total"] == len(result["items"])
    assert result["summary"]["unverifiable"] == 1
    assert len(result["script_hash"]) == 40


def test_numeric_value_units():
    assert fa.numeric_value("1.2万") == 12_000
    assert fa.numeric_value("3亿") == 300_000_000
    assert fa.numeric_value("1,234") == 1234
    assert fa.numeric_value("1.08%") == 1.08


def test_cli_writes_audit_and_strict_exit(tmp_path):
    s, r = _write(tmp_path, SCRIPT, RESEARCH)
    p = subprocess.run(
        [sys.executable, "-X", "utf8", str(BACKEND / "tools" / "facts_audit.py"),
         "--script", str(s), "--research", str(r), "--strict"],
        capture_output=True, text=True, encoding="utf-8", timeout=60,
    )
    assert p.returncode == 1  # 有 unverifiable（3亿）
    out = tmp_path / "facts_audit.json"
    assert out.exists()
    data = json.loads(out.read_text(encoding="utf-8"))
    assert data["summary"]["unverifiable"] == 1

    # 补上来源后 strict 通过
    RESEARCH2 = {"topic": "AI 市场", "nodes": RESEARCH["nodes"] + [
        {"year": "2026", "title": "用户规模",
         "what": "用户突破 3 亿。",
         "sources": [{"title": "快讯", "url": "https://example.com/c"}]}]}
    _, r2 = _write(tmp_path, SCRIPT, RESEARCH2)
    p2 = subprocess.run(
        [sys.executable, "-X", "utf8", str(BACKEND / "tools" / "facts_audit.py"),
         "--script", str(s), "--research", str(r2), "--strict"],
        capture_output=True, text=True, encoding="utf-8", timeout=60,
    )
    assert p2.returncode == 0


def test_cli_missing_input_reports_error(tmp_path):
    p = subprocess.run(
        [sys.executable, "-X", "utf8", str(BACKEND / "tools" / "facts_audit.py"),
         "--script", str(tmp_path / "nope.json"), "--research", str(tmp_path / "nope2.json")],
        capture_output=True, text=True, encoding="utf-8", timeout=60,
    )
    assert p.returncode == 2 and "缺失" in p.stdout
