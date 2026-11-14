# -*- coding: utf-8 -*-
"""热点栏目闸门 + 开场闸门测试。

覆盖两件事：
1. `hotspot.classify_column`：行情/八卦类必须淘汰，AI 工具/公司必须归栏目，并抠出开场数字；
2. `tools/check_opening.py`：合规开场退出码 0，元话语/无数字/无反差退出码 1。
"""
import json
import subprocess
import sys
from pathlib import Path

import pytest

from app.services import hotspot as hs

TOOL = Path(__file__).resolve().parents[1] / "tools" / "check_opening.py"


# ---------- 1. 栏目归属 ----------

@pytest.mark.parametrize(
    "title,summary",
    [
        ("纳指一夜蒸发 2.3 万亿，这次到底怎么了？", ""),
        ("A股集体高开，今天能高走吗？", ""),
        ("宇树科技盘中涨超 15%，市值重回 3000 亿", ""),
        ("某明星塌房，工作室深夜发文", ""),
        # 2026-11-13 决策：硬科普不再是栏目，纯科普选题一律淘汰
        ("宇宙最冷的地方，居然在中国空间站", ""),
        ("地球 46 亿年，是被撞出来的", ""),
    ],
)
def test_market_and_gossip_are_rejected(title, summary):
    column, _, reason = hs.classify_column(title, summary)
    assert column == hs.COLUMN_REJECT
    assert reason  # 必须给出可读原因


@pytest.mark.parametrize(
    "title,expected",
    [
        ("开源 AI 编程工具一夜 3 万星", hs.COLUMN_AI),
        ("Claude 新模型上下文翻倍到 100 万", hs.COLUMN_AI),
        ("某公司门店突破 5 万家，单店日均卖 200 杯", hs.COLUMN_COMPANY),
        ("工厂关掉 3 家，营收却涨了 12%", hs.COLUMN_COMPANY),
    ],
)
def test_columns_are_classified(title, expected):
    column, number, reason = hs.classify_column(title, "")
    assert column == expected
    assert reason == ""
    assert number  # 每条都要能抠出开场数字


def test_unknown_topic_is_rejected():
    column, _, reason = hs.classify_column("今天天气不错，适合出门", "")
    assert column == hs.COLUMN_REJECT
    assert "不属于" in reason


def test_opening_number_extraction():
    assert hs.extract_opening_number("7 纳米，是头发丝的万分之一") == "7 纳米"
    assert hs.extract_opening_number("330 块差价就在这") == "330 块"
    assert hs.extract_opening_number("没有数字的标题") == ""


# ---------- 2. 开场闸门 CLI ----------

def _run_tool(tmp_path: Path, lines: list[str]) -> tuple[int, dict]:
    script = {
        "title": "t",
        "shots": [
            {
                "year": "",
                "label": "",
                "colors": ["#F2F5F8", "#DCE5EC"],
                "lines": [{"text": t} for t in lines],
            }
        ],
    }
    path = tmp_path / "script.json"
    path.write_text(json.dumps(script, ensure_ascii=False), encoding="utf-8")
    proc = subprocess.run(
        [sys.executable, "-X", "utf8", str(TOOL), "--script", str(path), "--json"],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return proc.returncode, json.loads(proc.stdout)


def test_opening_gate_passes_good_opening(tmp_path):
    code, out = _run_tool(
        tmp_path,
        ["7 纳米，是头发丝的万分之一。", "但华为手上没有 EUV。", "只能一遍遍曝光。"],
    )
    assert code == 0
    assert out["pass"] is True


def test_opening_gate_blocks_persona_opening(tmp_path):
    code, out = _run_tool(tmp_path, ["我是阿扎，本期介绍华为。", "美国商务部长访华当天，", "华为悄悄上架一台手机。"])
    assert code == 1
    codes = {i["code"] for i in out["issues"]}
    assert "banned_phrase" in codes


def test_opening_gate_blocks_no_number(tmp_path):
    code, out = _run_tool(tmp_path, ["显卡终于降价了。", "有型号直降。", "但经销商在亏钱卖。"])
    assert code == 1
    assert "no_number" in {i["code"] for i in out["issues"]}


def test_opening_gate_blocks_no_contrast(tmp_path):
    code, out = _run_tool(tmp_path, ["2024 年营收 8621 亿。", "研发投入 1923 亿。", "占营收 21.8%。"])
    assert code == 1
    assert "no_contrast" in {i["code"] for i in out["issues"]}
