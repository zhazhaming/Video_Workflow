# -*- coding: utf-8 -*-
"""开场 5 秒闸门：校验 script.json 的前几句是否「数字 → 反差 → 代价」。

为什么存在：本账号 26 条作品实测 2s 跳出中位 43%、平均播放 9.7 秒，绝大多数流失
发生在开场。规则写在 AGENTS.md / video-script skill 里，但模型会自我感觉良好，
所以这里用退出码兜底：不通过就不许交付。

用法：
    python -X utf8 backend/tools/check_opening.py --script backend/storage/projects/<pid>/script.json
    python -X utf8 backend/tools/check_opening.py --script ... --json
    python -X utf8 backend/tools/check_opening.py --script ... --lines 3

退出码：0 通过 ｜ 1 不通过 ｜ 2 输入错误
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

# 前 5 秒禁止出现的元话语（自我介绍 / 栏目宣告 / 空寒暄）
BANNED_PHRASES = [
    "我是",
    "本期",
    "今天",
    "大家好",
    "这期",
    "哈喽",
    "欢迎收看",
    "欢迎来到",
    "咱们聊",
    "我们聊",
]

# 反差（把结论拧一下）
CONTRAST_WORDS = ["但", "却", "偏偏", "结果", "反而", "其实", "原来", "问题是", "然而"]
# 代价（说明为什么重要）
COST_WORDS = [
    "代价",
    "贵",
    "损失",
    "罚",
    "关厂",
    "退出",
    "停产",
    "裁员",
    "亏",
    "成本",
    "多花",
    "少赚",
    "错过",
    "撑不住",
    "扛不住",
    "没有",
]

DIGIT_RE = re.compile(r"\d")


def load_lines(script_path: Path, limit: int) -> list[str]:
    """取出首镜前 limit 句台词（跨镜补足，保证至少拿到 limit 句）。"""
    raw = json.loads(script_path.read_text(encoding="utf-8-sig"))
    shots = raw.get("shots") or []
    if not shots:
        raise ValueError("script.json 里没有 shots")
    lines: list[str] = []
    for shot in shots:
        for line in shot.get("lines") or []:
            text = ""
            if isinstance(line, dict):
                text = str(line.get("text") or "").strip()
            elif isinstance(line, str):
                text = line.strip()
            if text:
                lines.append(text)
            if len(lines) >= limit:
                return lines
    return lines


def check(lines: list[str], window: int = 3) -> dict:
    """对开场句做三项硬校验 + 两项软提示。"""
    head = lines[:window]
    joined = "".join(head)
    second = "".join(lines[1 : window + 1]) or joined  # 反差/代价允许落在第 2~4 句

    issues: list[dict] = []
    warnings: list[dict] = []

    # 1) 数字：前 window 句里必须有一个具体数字
    if not any(DIGIT_RE.search(t) for t in head):
        issues.append(
            {
                "code": "no_number",
                "msg": "前 3 句没有具体数字",
                "hint": "开场第一句给数字或事实，例如「7 纳米，是头发丝的万分之一」。",
            }
        )

    # 2) 禁用词：介绍自己 / 宣告栏目 / 空寒暄
    hit = [w for w in BANNED_PHRASES if w in joined]
    if hit:
        issues.append(
            {
                "code": "banned_phrase",
                "msg": f"开场出现元话语：{'、'.join(hit)}",
                "hint": "把「我是/本期/今天/大家好」删掉，换成具体数字或事实。",
            }
        )

    # 3) 反差/代价：第 2~4 句必须拧一下
    if not any(w in second for w in CONTRAST_WORDS + COST_WORDS):
        issues.append(
            {
                "code": "no_contrast",
                "msg": "第 2~4 句没有反差或代价",
                "hint": "补一句「但是/偏偏/代价是……」，让观众知道为什么要看下去。",
            }
        )

    # 软提示：单句过长（渲染会拆行，但开场越短越好）
    if head and len(head[0]) > 24:
        warnings.append(
            {
                "code": "first_line_long",
                "msg": f"首句 {len(head[0])} 字，偏长",
                "hint": "首句压到 20 字内，先给最硬的那个数字。",
            }
        )

    return {
        "pass": not issues,
        "opening": head,
        "issues": issues,
        "warnings": warnings,
    }


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:  # noqa: BLE001 — 老终端不支持时忽略
        pass

    ap = argparse.ArgumentParser(description="校验视频开场 5 秒（数字 → 反差 → 代价）")
    ap.add_argument("--script", required=True, help="script.json 路径")
    ap.add_argument("--lines", type=int, default=3, help="校验前几句（默认 3）")
    ap.add_argument("--json", action="store_true", help="输出 JSON")
    args = ap.parse_args()

    path = Path(args.script)
    if not path.exists():
        print(f"[check_opening] 找不到脚本：{path}")
        return 2
    try:
        lines = load_lines(path, max(args.lines, 4))
    except Exception as e:  # noqa: BLE001
        print(f"[check_opening] 读取失败：{e}")
        return 2

    result = check(lines, window=max(1, args.lines))
    result["script"] = str(path)

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"[check_opening] {path.name}")
        for i, line in enumerate(result["opening"], start=1):
            print(f"  {i}. {line}")
        for item in result["issues"]:
            print(f"  ✗ {item['msg']}  → {item['hint']}")
        for item in result["warnings"]:
            print(f"  ! {item['msg']}  → {item['hint']}")
        print("  结果：" + ("通过" if result["pass"] else "不通过"))

    return 0 if result["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
