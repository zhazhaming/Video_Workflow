# -*- coding: utf-8 -*-
"""发布登记表（B7 数据回流的最小实现）：记录每条成片的发布信息，
后续与选题/卡点决策关联，反哺选题策略。存储 storage/publish_log.json。

用法:
    cd backend && python tools/publish_log.py add --pid ashare-2026 --platform douyin \
        --url "https://www.douyin.com/video/xxx" --note "V3 对标版 A/B"
    cd backend && python tools/publish_log.py list [--pid ashare-2026]
    cd backend && python tools/publish_log.py stats --pid ashare-2026 \
        --likes 6100 --collects 1300 --comments 340   # 回填表现数据（发布 24/72h 各记一次）
"""
import argparse
import json
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
LOG = BACKEND / "storage" / "publish_log.json"


def _load() -> list:
    if not LOG.exists():
        return []
    try:
        return json.loads(LOG.read_text(encoding="utf-8")).get("entries", [])
    except Exception:
        return []


def _save(entries: list) -> None:
    LOG.parent.mkdir(parents=True, exist_ok=True)
    LOG.write_text(json.dumps({"entries": entries}, ensure_ascii=False, indent=1), encoding="utf-8")


def _now() -> str:
    return datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d %H:%M:%S")


def main() -> int:
    ap = argparse.ArgumentParser(description="发布登记表")
    sub = ap.add_subparsers(dest="cmd", required=True)
    p_add = sub.add_parser("add")
    p_add.add_argument("--pid", required=True)
    p_add.add_argument("--platform", required=True, choices=["douyin", "xhs", "bilibili", "xigua", "other"])
    p_add.add_argument("--url", default="")
    p_add.add_argument("--title", default="")
    p_add.add_argument("--note", default="")
    p_list = sub.add_parser("list")
    p_list.add_argument("--pid", default=None)
    p_stat = sub.add_parser("stats")
    p_stat.add_argument("--pid", required=True)
    p_stat.add_argument("--likes", type=int, default=0)
    p_stat.add_argument("--collects", type=int, default=0)
    p_stat.add_argument("--comments", type=int, default=0)
    p_stat.add_argument("--entry", default=None, help="登记条目 id（缺省取该 pid 最新一条）")
    args = ap.parse_args()
    entries = _load()

    if args.cmd == "add":
        e = {"id": uuid.uuid4().hex[:8], "pid": args.pid, "platform": args.platform,
             "url": args.url, "title": args.title, "note": args.note,
             "published_at": _now(), "stats": []}
        entries.append(e)
        _save(entries)
        print(json.dumps({"added": e["id"]}, ensure_ascii=False))
    elif args.cmd == "list":
        rows = [e for e in entries if args.pid is None or e["pid"] == args.pid]
        print(json.dumps(rows, ensure_ascii=False, indent=1))
    elif args.cmd == "stats":
        cand = [e for e in entries if e["pid"] == args.pid]
        if args.entry:
            cand = [e for e in cand if e["id"] == args.entry]
        if not cand:
            print(json.dumps({"error": "no entry"}, ensure_ascii=False))
            return 1
        e = cand[-1]
        e["stats"].append({"at": _now(), "likes": args.likes, "collects": args.collects, "comments": args.comments})
        _save(entries)
        print(json.dumps({"updated": e["id"], "n_stats": len(e["stats"])}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass
    sys.exit(main())
