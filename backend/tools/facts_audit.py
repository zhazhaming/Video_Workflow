# -*- coding: utf-8 -*-
"""事实审计：script.json 数字断言 ↔ research.json 来源匹配（确定性、零 LLM）。

daily 流水线的硬闸门（app/services/daily.py::verify_facts）会 import 本模块按当前
script/research **重算**——facts_audit.json 只是落库快照，以服务端重算为准，手改它无效。

数字断言的提取范围：阿拉伯数字 + 常用计量/比较单位（%、倍、万、亿、年、美元、人…）。
制作参数类数字（等 3 秒、每句 20 字、1080px）不是事实断言，自动跳过。

匹配规则（逐条放宽，命中即 verified 并回填来源 URL）：
1. 「数值+单位」原文在研究节点正文/来源标题里出现（归一化后子串匹配）
2. 裸数值（≥2 位）在研究正文里出现
3. 数值等值：万/亿换算后与正文任一数字相等（如「1.2万」↔「12000」）

用法:
    cd backend && python -X utf8 tools/facts_audit.py \\
        --script storage/projects/<pid>/script.json \\
        --research storage/projects/<pid>/research.json \\
        [--out storage/projects/<pid>/facts_audit.json] [--strict]
--strict 时存在 unverifiable 数字退出码 1（agent 自检循环用）。
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime
from pathlib import Path

# 数值 + 可选单位（含制作参数单位，提取后统一过滤）
_NUM_RE = re.compile(
    r"(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)"
    r"\s*(%|％|倍|万亿|万|亿|年|美元|美分|元|角|分|人|口|台|辆|次|名|款|家|只|座|度|岁|"
    r"枚|间|场|票|单|件|条|篇|部|集|期|位|公里|千米|米|吨|公斤|千克|克|升|毫升|瓦|时|天|月|"
    r"秒|字|帧|[pP][xX]|[pP])?"
)
# 制作参数单位（非事实断言）：提取后跳过
_SKIP_UNITS = {"秒", "字", "帧", "px", "PX", "Px", "pX", "P", "p"}
# 无单位的纯小整数多为序数/枚举噪音（第一个、两类…），跳过
_TRIVIAL_BARE = {"0", "1", "2"}

# 全角 → 半角（归一化匹配用；两表必须等长）
_FW = "，。！？：；（）【】《》％"
_HD = ",.!?:;()[]<>%"


def _is_ascii_letter(ch: str) -> bool:
    return ("a" <= ch <= "z") or ("A" <= ch <= "Z")


def _norm(s: str) -> str:
    s = (s or "").translate(str.maketrans(_FW, _HD))
    return re.sub(r"[\s,]+", "", s).lower()


def extract_numbers(text: str) -> list[str]:
    """从口播文本提取「数值+单位」事实断言 token（如 1.08%、4500亿美元、2026年）。"""
    out = []
    s = text or ""
    for m in _NUM_RE.finditer(s):
        value, unit = m.group(1), m.group(2) or ""
        # 数字后紧跟英文字母（5G、K70 Pro 等型号/规格）不是事实断言
        nxt = s[m.end()] if m.end() < len(s) else ""
        if _is_ascii_letter(nxt):
            continue
        if unit in _SKIP_UNITS:
            continue
        if not unit and value in _TRIVIAL_BARE:
            continue
        out.append(value + unit)
    return out


def numeric_value(token: str) -> float | None:
    """token → 数值（万/亿/万亿换算；% 取原值；解析失败返回 None）。"""
    m = re.match(r"^([\d.,]+)(.*)$", token)
    if not m:
        return None
    try:
        num = float(m.group(1).replace(",", ""))
    except ValueError:
        return None
    unit = m.group(2)
    if unit == "万":
        num *= 10_000
    elif unit == "亿":
        num *= 100_000_000
    elif unit == "万亿":
        num *= 1_000_000_000_000
    return num


def _close(a: float, b: float) -> bool:
    return abs(a - b) <= max(abs(a), abs(b)) * 1e-9 + 1e-9


def _corpus(research: dict) -> tuple[list[str], list[str]]:
    """每个知识节点归一化成一段文本；同时返回每节点第一个来源 URL。"""
    texts: list[str] = []
    urls: list[str] = []
    for node in research.get("nodes") or []:
        if not isinstance(node, dict):
            continue
        parts = [str(node.get(k) or "") for k in ("year", "title", "what", "why")]
        srcs = [s for s in (node.get("sources") or []) if isinstance(s, dict)]
        parts += [str(s.get("title") or "") for s in srcs]
        urls.append(str(srcs[0].get("url") or "") if srcs else "")
        texts.append(_norm(" ".join(parts)))
    return texts, urls


def _match(token: str, texts: list[str], urls: list[str],
           corpus_nums: list[float]) -> tuple[str, str]:
    """token ↔ 研究正文匹配；返回 (status, source_url)。"""
    ntok = _norm(token)
    for i, t in enumerate(texts):
        if ntok and ntok in t:
            return "verified", urls[i] if i < len(urls) else ""
    m = re.match(r"^[\d.,]+", token)
    bare = _norm(m.group(0)) if m else ""
    if len(bare) >= 2:  # 裸数值子串（限 ≥2 位，避免个位数误命中）
        for i, t in enumerate(texts):
            if bare in t:
                return "verified", urls[i] if i < len(urls) else ""
    v = numeric_value(token)
    if v is not None and any(_close(v, w) for w in corpus_nums):
        for i, t in enumerate(texts):
            vals = [numeric_value(x) for x in extract_numbers(t)]
            if any(x is not None and _close(v, x) for x in vals):
                return "verified", urls[i] if i < len(urls) else ""
    return "unverifiable", ""


def audit(script_path: str | Path, research_path: str | Path) -> dict:
    """执行审计并返回结果 dict（daily 硬闸门直接 import 复用）。"""
    script_path = Path(script_path)
    research_path = Path(research_path)
    raw = script_path.read_bytes()
    script = json.loads(raw.decode("utf-8"))
    research = json.loads(research_path.read_text(encoding="utf-8"))
    texts, urls = _corpus(research)
    corpus_nums = [
        v for t in texts for tok in extract_numbers(t) if (v := numeric_value(tok)) is not None
    ]
    items: list[dict] = []
    for si, shot in enumerate(script.get("shots") or [], 1):
        for li, line in enumerate(shot.get("lines") or []):
            text = line.get("text") if isinstance(line, dict) else str(line or "")
            if not text:
                continue
            for tok in extract_numbers(text):
                status, url = _match(tok, texts, urls, corpus_nums)
                items.append({
                    "line_id": f"s{si:02d}_{li}",
                    "text": text[:40],
                    "value": tok,
                    "status": status,
                    "source_url": url,
                })
    unver = [it for it in items if it["status"] == "unverifiable"]
    return {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "script_hash": hashlib.sha1(raw).hexdigest(),
        "research_topic": str(research.get("topic") or ""),
        "items": items,
        "summary": {
            "total": len(items),
            "verified": len(items) - len(unver),
            "unverifiable": len(unver),
        },
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="事实审计：script 数字 ↔ research 来源")
    ap.add_argument("--script", required=True, help="script.json 路径")
    ap.add_argument("--research", required=True, help="research.json 路径")
    ap.add_argument("--out", default=None, help="输出路径（缺省与 script.json 同目录 facts_audit.json）")
    ap.add_argument("--strict", action="store_true", help="存在 unverifiable 时退出码 1")
    args = ap.parse_args()
    try:
        result = audit(args.script, args.research)
    except FileNotFoundError as e:
        print(json.dumps({"error": f"输入文件缺失：{e.filename}"}, ensure_ascii=False))
        return 2
    except (ValueError, KeyError) as e:
        print(json.dumps({"error": f"JSON 解析失败：{e}"}, ensure_ascii=False))
        return 2
    out_path = Path(args.out) if args.out else Path(args.script).parent / "facts_audit.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass
    print(json.dumps({
        **result["summary"],
        "out": str(out_path),
        "unverified_values": [f"{it['value']}@{it['line_id']}" for it in result["items"]
                              if it["status"] == "unverifiable"][:20],
    }, ensure_ascii=False))
    if args.strict and result["summary"]["unverifiable"]:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
