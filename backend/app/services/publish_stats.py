# -*- coding: utf-8 -*-
"""发布数据回流：发布台账（storage/publish_log.json）的自动登记与表现数据回填。

台账格式与 tools/publish_log.py CLI 共用（{"entries": [...]}），条目字段：
  {id, pid, platform, url, title, note, task_id?, published_at,
   stats: [{at, plays, likes, collects, comments, shares, source}]}

两条自动通道（都由 publish_scheduler 驱动，浏览器任务与其互斥）：
1. 发布成功即登记：执行成功后调 register_published（按 task_id 去重）；
2. 表现数据回填：每日一次（或路由/CLI 手动）用创作者中心会话抓「内容管理」页，
   backfill 按标题匹配台账条目追加 stats（同一台账条目一天最多记一条）。
"""
import json
import re
import uuid
from datetime import datetime, timezone

from .. import config

LOG_PATH = config.STORAGE_DIR / "publish_log.json"


def _now() -> str:
    return datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d %H:%M:%S")


def _norm_title(s: str) -> str:
    return re.sub(r"[\s#＃]+", "", s or "").lower()


def load_entries() -> list[dict]:
    if not LOG_PATH.exists():
        return []
    try:
        data = json.loads(LOG_PATH.read_text(encoding="utf-8"))
        return data.get("entries", []) if isinstance(data, dict) else []
    except (ValueError, OSError):
        return []


def save_entries(entries: list[dict]) -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    LOG_PATH.write_text(
        json.dumps({"entries": entries}, ensure_ascii=False, indent=1), encoding="utf-8")


def register_published(pid: str, platform: str, title: str,
                       task_id: str = "", url: str = "") -> dict | None:
    """发布成功自动登记。返回新条目；已登记过（task_id 重复）返回 None。"""
    entries = load_entries()
    if task_id and any(e.get("task_id") == task_id for e in entries):
        return None
    entry = {
        "id": uuid.uuid4().hex[:8],
        "pid": pid,
        "platform": platform,
        "url": url,
        "title": title,
        "note": f"自动登记（发布任务 {task_id}）" if task_id else "自动登记",
        "task_id": task_id,
        "published_at": _now(),
        "stats": [],
    }
    entries.append(entry)
    save_entries(entries)
    return entry


def backfill(rows: list[dict], source: str = "creator") -> dict:
    """作品表现数据按标题匹配追加进台账 stats；返回 {matched, appended, unmatched}。"""
    entries = load_entries()
    by_title: dict[str, dict] = {}
    for e in entries:
        by_title.setdefault(_norm_title(e.get("title") or ""), e)
    today = _now()[:10]
    matched = appended = 0
    unmatched: list[str] = []
    for r in rows or []:
        key = _norm_title(r.get("title") or "")
        entry = by_title.get(key)
        if entry is None and key:
            # 前缀兜底：管理页标题可能被截断，取前 12 字互相比对
            for k, cand in by_title.items():
                if not k:
                    continue
                if key.startswith(k[:12]) or k.startswith(key[:12]):
                    entry = cand
                    break
        if entry is None:
            unmatched.append((r.get("title") or "")[:40])
            continue
        matched += 1
        stats = entry.setdefault("stats", [])
        if stats and str(stats[-1].get("at", ""))[:10] == today:
            continue  # 当天已记录过（24h/72h 检查点节奏）
        stats.append({
            "at": _now(),
            "plays": int(r.get("plays") or 0),
            "likes": int(r.get("likes") or 0),
            "collects": int(r.get("collects") or 0),
            "comments": int(r.get("comments") or 0),
            "shares": int(r.get("shares") or 0),
            "source": source,
        })
        appended += 1
    if appended:
        save_entries(entries)
    return {"matched": matched, "appended": appended, "unmatched": unmatched[:10]}
