# -*- coding: utf-8 -*-
"""每日一家公司：候选库 + 待排产计划 + 一键排进每日流水线。

定位：给「每日一家公司」系列提供一个可查、可改、可排产的档期板。
- 候选库：backend/app/services/company_pool.json（国内外知名公司，含内容初稿素材）
- 档期：backend/storage/company/plan.json（一天一期；初稿可编辑）
- 排产：调 daily.service.enqueue_company 生成一个 kind=company 的批次，
  到流水线的凌晨制作时间自动由 dsh agent 出片；也可「立即制作」。
"""
from __future__ import annotations

import json
import threading
from datetime import date, datetime, timedelta
from pathlib import Path

from ..config import STORAGE_DIR
from . import daily

POOL_PATH = Path(__file__).with_name("company_pool.json")
COMPANY_DIR = STORAGE_DIR / "company"
PLAN_PATH = COMPANY_DIR / "plan.json"

MAX_DAYS = 60          # 最多提前排多少天
SUGGEST_WINDOW = 30    # 推荐公司时避开前后多少天已用过的
_LOCK = threading.Lock()

_RUN_STATUS = {
    "scheduled": "scheduled",
    "running": "producing",
    "done": "done",
    "partial": "partial",
    "failed": "failed",
    "skipped": "failed",
    "awaiting_confirm": "planned",
}

STATUS_LABELS = {
    "empty": "未选公司",
    "planned": "待排产",
    "scheduled": "已排产",
    "producing": "制作中",
    "done": "已出片",
    "partial": "部分完成",
    "failed": "制作失败",
}


# ---------- 基础 ----------

def _now() -> str:
    return datetime.now().isoformat(timespec="seconds")


def _load_pool() -> dict:
    try:
        data = json.loads(POOL_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        raise RuntimeError(f"公司候选库读取失败：{e}") from e
    companies = [c for c in (data.get("companies") or []) if isinstance(c, dict) and c.get("id")]
    if not companies:
        raise RuntimeError("公司候选库为空")
    return {"version": data.get("version", 1), "updated_at": data.get("updated_at", ""),
            "companies": companies}


def _profile(c: dict) -> dict:
    """对外暴露的公司档案（不含 story 正文，初稿单独返回）。"""
    keys = ("id", "name", "name_en", "country", "region", "track", "sector",
            "founded", "founder", "hq", "one_liner", "hook", "tags")
    return {k: c.get(k) for k in keys}


def _company_index() -> dict[str, dict]:
    return {c["id"]: c for c in _load_pool()["companies"]}


def pool() -> dict:
    p = _load_pool()
    companies = [_profile(c) for c in p["companies"]]
    tracks = sorted({c.get("track") or "其他" for c in companies})
    countries = sorted({c.get("country") or "其他" for c in companies})
    return {
        "companies": companies,
        "tracks": tracks,
        "countries": countries,
        "updated_at": p.get("updated_at", ""),
        "count": len(companies),
    }


def _empty_plan() -> dict:
    return {"version": 1, "days": {}}


def _load_plan() -> dict:
    if not PLAN_PATH.exists():
        return _empty_plan()
    try:
        data = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return _empty_plan()
    if not isinstance(data, dict) or not isinstance(data.get("days"), dict):
        return _empty_plan()
    return data


def _save_plan(plan: dict) -> None:
    COMPANY_DIR.mkdir(parents=True, exist_ok=True)
    tmp = PLAN_PATH.with_suffix(".tmp")
    tmp.write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(PLAN_PATH)


def _parse_day(day: str) -> date:
    try:
        d = date.fromisoformat(str(day))
    except ValueError as e:
        raise ValueError("日期格式应为 YYYY-MM-DD") from e
    today = date.today()
    if d < today:
        raise ValueError("不能排到过去的日期")
    if d > today + timedelta(days=MAX_DAYS):
        raise ValueError(f"最多只能排到 {MAX_DAYS} 天后")
    return d


def _get_run(run_id: str | None) -> dict | None:
    """读流水线运行记录（测试可 monkeypatch 此函数，避免依赖真实 storage）。"""
    if not run_id:
        return None
    try:
        return daily.service.get_run(run_id)
    except Exception:  # noqa: BLE001 — 记录损坏不影响档期展示
        return None


def _clean_draft(raw: dict | None) -> dict:
    if not isinstance(raw, dict):
        raise ValueError("初稿格式不正确")
    beats = []
    for b in (raw.get("beats") or [])[:8]:
        if not isinstance(b, dict):
            continue
        text = str(b.get("text") or "").strip()[:500]
        if not text:
            continue
        beats.append({
            "label": str(b.get("label") or "").strip()[:12],
            "sec": str(b.get("sec") or "").strip()[:12],
            "text": text,
        })
    if not beats:
        raise ValueError("初稿至少要保留一段内容")
    return {
        "title": str(raw.get("title") or "").strip()[:120],
        "angle": str(raw.get("angle") or "").strip()[:200],
        "beats": beats,
        "cta": str(raw.get("cta") or "").strip()[:200],
        "notes": str(raw.get("notes") or "").strip()[:600],
    }


# ---------- 初稿 ----------

def build_draft(company: dict) -> dict:
    """按三段台阶，把公司档案拼成一份可改的初稿（提纲级，不是最终口播稿）。"""
    st = company.get("story") or {}
    name = str(company.get("name") or "")
    origin = str(st.get("origin") or "").strip()
    if not origin:
        origin = (f"{company.get('founded') or ''} 年，{company.get('founder') or ''}"
                  f"在{company.get('hq') or ''}创办了{name}。")
    beats = [
        {"label": "开场", "sec": "0-5s",
         "text": str(company.get("hook") or company.get("one_liner") or "")},
        {"label": "台阶1 起家", "sec": "5-20s", "text": origin},
        {"label": "台阶2 转折", "sec": "20-35s", "text": str(st.get("turn") or "")},
        {"label": "台阶3 怎么赚钱", "sec": "35-50s", "text": str(st.get("model") or "")},
        {"label": "记忆点", "sec": "50-60s", "text": str(st.get("memory") or "")},
    ]
    return {
        "title": f"{name}：{company.get('one_liner') or ''}".rstrip("：。"),
        "angle": str(company.get("one_liner") or ""),
        "beats": [b for b in beats if b["text"].strip()],
        "cta": str(st.get("cta") or "评论区聊聊：你第一次见它是什么时候？"),
        "notes": "开场硬规则：0–5 秒 = 数字 → 反差 → 代价，禁止自我介绍、「本期/今天」、栏目名；"
                 "片长 45~60 秒，3 台阶 × 15 秒，第 10 秒前必须交付第一个完整价值；"
                 "全片不写固定开场白/结束语，不出现「我是阿扎」。"
                 "初稿只定结构与记忆点，正式口播稿按每句 ≤20 字重写；"
                 "所有数字与事件在制作期核验并写入 research.json，查不到出处就不上屏。",
    }


# ---------- 档期视图 ----------

def _view(entry: dict, companies: dict[str, dict]) -> dict:
    c = companies.get(entry.get("company_id") or "")
    run = _get_run(entry.get("run_id"))
    status = str(entry.get("status") or "planned")
    pid = None
    if run:
        status = _RUN_STATUS.get(str(run.get("status")), status)
        videos = run.get("videos") or []
        if videos:
            pid = videos[0].get("pid")
    return {
        "date": entry.get("date"),
        "status": status,
        "status_label": STATUS_LABELS.get(status, status),
        "company": _profile(c) if c else None,
        "draft": entry.get("draft"),
        "run_id": entry.get("run_id"),
        "run_status": (run or {}).get("status"),
        "pid": pid,
        "produce_at": (run or {}).get("produce_at") or entry.get("produce_at"),
        "created_at": entry.get("created_at"),
        "updated_at": entry.get("updated_at"),
    }


def _suggest(plan: dict, target: date, companies: list[dict],
             exclude: set[str] | None = None) -> dict | None:
    """给空档期推荐一家最近没用过的公司（确定性轮转，不用随机数）。

    exclude 用于同一次列表里避免多天推荐同一家。
    """
    recent: set[str] = set(exclude or ())
    lo, hi = target - timedelta(days=SUGGEST_WINDOW), target + timedelta(days=SUGGEST_WINDOW)
    for raw_day, entry in (plan.get("days") or {}).items():
        try:
            d = date.fromisoformat(raw_day)
        except ValueError:
            continue
        if lo <= d <= hi:
            recent.add(str(entry.get("company_id") or ""))
    for c in companies:
        if c["id"] not in recent:
            return _profile(c)
    if not companies:
        return None
    return _profile(companies[target.toordinal() % len(companies)])


def get_plan(days: int = 7) -> dict:
    days = max(1, min(30, int(days)))
    plan = _load_plan()
    idx = _company_index()
    companies = [c for c in idx.values() if c["id"] in idx]
    today = date.today()
    entries = []
    suggested: set[str] = set()
    for i in range(days):
        d = today + timedelta(days=i)
        key = d.isoformat()
        entry = (plan.get("days") or {}).get(key)
        if entry:
            item = _view(entry, idx)
        else:
            item = {
                "date": key, "status": "empty", "status_label": STATUS_LABELS["empty"],
                "company": None, "draft": None, "run_id": None, "run_status": None,
                "pid": None, "produce_at": None, "created_at": None, "updated_at": None,
            }
        item["weekday"] = "一二三四五六日"[d.weekday()]
        item["is_today"] = i == 0
        if not entry:
            s = _suggest(plan, d, companies, suggested)
            if s:
                suggested.add(s["id"])
            item["suggestion"] = s
        entries.append(item)
    return {"today": today.isoformat(), "days": days, "entries": entries}


def _find(plan: dict, key: str) -> dict | None:
    return (plan.get("days") or {}).get(key)


def pick_company(day: str, company_id: str, draft: dict | None = None) -> dict:
    """为某一天选一家公司；若该日还没排产，可反复更换。"""
    d = _parse_day(day)
    key = d.isoformat()
    idx = _company_index()
    company = idx.get(str(company_id))
    if not company:
        raise LookupError("候选库里没有这家公司")
    with _LOCK:
        plan = _load_plan()
        old = _find(plan, key)
        if old:
            status = _view(old, idx)["status"]
            if status not in ("planned", "failed"):
                raise ValueError(f"该日期已{STATUS_LABELS.get(status, status)}，不能再换公司")
        now = _now()
        entry = {
            "date": key,
            "company_id": company["id"],
            "status": "planned",
            "draft": _clean_draft(draft) if draft else build_draft(company),
            "run_id": None,
            "produce_at": None,
            "created_at": (old or {}).get("created_at") or now,
            "updated_at": now,
        }
        plan.setdefault("days", {})[key] = entry
        _save_plan(plan)
    return _view(entry, idx)


def update_draft(day: str, draft: dict) -> dict:
    """编辑初稿：只允许改「待排产」的期数（排产后任务书已生成，改动不再生效）。"""
    d = _parse_day(day)
    key = d.isoformat()
    idx = _company_index()
    with _LOCK:
        plan = _load_plan()
        entry = _find(plan, key)
        if not entry:
            raise LookupError("该日期还没有选公司")
        status = _view(entry, idx)["status"]
        if status != "planned":
            raise ValueError(f"该日期已{STATUS_LABELS.get(status, status)}，初稿已锁定")
        entry["draft"] = _clean_draft(draft)
        entry["updated_at"] = _now()
        _save_plan(plan)
    return _view(entry, idx)


def regenerate_draft(day: str) -> dict:
    d = _parse_day(day)
    key = d.isoformat()
    idx = _company_index()
    with _LOCK:
        plan = _load_plan()
        entry = _find(plan, key)
        if not entry:
            raise LookupError("该日期还没有选公司")
        company = idx.get(str(entry.get("company_id")))
        if not company:
            raise LookupError("候选库里没有这家公司")
        status = _view(entry, idx)["status"]
        if status != "planned":
            raise ValueError(f"该日期已{STATUS_LABELS.get(status, status)}，初稿已锁定")
        entry["draft"] = build_draft(company)
        entry["updated_at"] = _now()
        _save_plan(plan)
    return _view(entry, idx)


def remove_plan(day: str) -> dict:
    """撤下待排产的计划；已排产/已出片的期数不允许直接删（避免留下孤儿批次）。"""
    d = _parse_day(day)
    key = d.isoformat()
    idx = _company_index()
    with _LOCK:
        plan = _load_plan()
        entry = _find(plan, key)
        if not entry:
            raise LookupError("该日期没有计划")
        status = _view(entry, idx)["status"]
        if status not in ("planned", "failed"):
            raise ValueError(f"该日期已{STATUS_LABELS.get(status, status)}，不能撤销")
        (plan.get("days") or {}).pop(key, None)
        _save_plan(plan)
    return {"ok": True, "date": key}


def _enqueue(entry: dict, company: dict, now: bool) -> dict:
    """测试可替换的排产入口。"""
    return daily.service.enqueue_company(entry, company, now=now)


def schedule(day: str, now: bool = False) -> dict:
    """把该日计划排进流水线：默认下一个凌晨制作；now=True 立刻开始。"""
    d = _parse_day(day)
    key = d.isoformat()
    idx = _company_index()
    with _LOCK:
        plan = _load_plan()
        entry = _find(plan, key)
        if not entry:
            raise LookupError("该日期还没有选公司")
        status = _view(entry, idx)["status"]
        if status == "scheduled":
            raise ValueError("该日期已经排产了")
        if status not in ("planned", "failed"):
            raise ValueError(f"该日期已{STATUS_LABELS.get(status, status)}，无需重复排产")
        company = idx.get(str(entry.get("company_id")))
        if not company:
            raise LookupError("候选库里没有这家公司")
        run = _enqueue(entry, company, now)
        entry["run_id"] = run.get("id")
        entry["status"] = _RUN_STATUS.get(str(run.get("status")), "scheduled")
        entry["produce_at"] = run.get("produce_at")
        entry["updated_at"] = _now()
        _save_plan(plan)
    return _view(entry, idx)
