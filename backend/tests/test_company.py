# -*- coding: utf-8 -*-
"""每日一家公司：候选库、初稿、档期 CRUD、排产接入流水线。"""
import json
from datetime import date, datetime, timedelta

import pytest

from app.services import company as co
from app.services import daily as dl


@pytest.fixture
def co_env(monkeypatch, tmp_path):
    monkeypatch.setattr(co, "COMPANY_DIR", tmp_path / "company")
    monkeypatch.setattr(co, "PLAN_PATH", tmp_path / "company" / "plan.json")
    return tmp_path


def _first_company():
    return co._load_pool()["companies"][0]


def _fake_run(status="scheduled", pid=None, produce_at="2026-11-11T03:30:00"):
    return {
        "id": "20261110-120000-c",
        "status": status,
        "produce_at": produce_at,
        "videos": [{"pid": pid}] if pid else [],
    }


def test_pool_has_domestic_and_overseas():
    p = co.pool()
    assert p["count"] >= 20
    assert "国内" in {c["region"] for c in p["companies"]}
    assert "海外" in {c["region"] for c in p["companies"]}
    assert p["tracks"] and p["countries"]
    c = p["companies"][0]
    for k in ("id", "name", "country", "sector", "founded", "founder", "hq", "hook"):
        assert c[k], k


def test_build_draft_series_beats(co_env):
    c = _first_company()
    d = co.build_draft(c)
    assert len(d["beats"]) == 5
    assert d["beats"][0]["label"] == "开场"
    assert d["beats"][0]["sec"] == "0-5s"
    assert d["beats"][1]["label"] == "台阶1 起家"
    assert d["beats"][-1]["label"] == "记忆点"
    # 人设开场/结束语已移除：初稿不得再出现
    joined = "".join(b["text"] for b in d["beats"])
    assert "我是阿扎" not in joined
    assert "每日一家公司，我们下期见" not in joined
    assert c["name"] in d["title"]
    assert d["cta"] and "research.json" in d["notes"]
    assert "数字 → 反差 → 代价" in d["notes"]


def test_pick_edit_and_remove(co_env):
    day = date.today().isoformat()
    c = _first_company()
    e = co.pick_company(day, c["id"])
    assert e["status"] == "planned"
    assert e["company"]["name"] == c["name"]
    assert e["draft"]["beats"]

    edited = {**e["draft"], "title": "改过的标题", "cta": "评论区点名下一家"}
    e2 = co.update_draft(day, edited)
    assert e2["draft"]["title"] == "改过的标题"

    plan = co.get_plan(1)
    assert plan["entries"][0]["status"] == "planned"
    assert plan["entries"][0]["draft"]["title"] == "改过的标题"

    assert co.remove_plan(day)["ok"] is True
    assert co.get_plan(1)["entries"][0]["status"] == "empty"
    assert co.get_plan(1)["entries"][0]["suggestion"]


def test_pick_validations(co_env):
    day = date.today().isoformat()
    with pytest.raises(LookupError):
        co.pick_company(day, "no-such-company")
    with pytest.raises(ValueError):
        co.pick_company("2000-01-01", _first_company()["id"])
    co.pick_company(day, _first_company()["id"])
    with pytest.raises(ValueError):
        co.update_draft(day, {"beats": []})


def test_schedule_and_status_sync(co_env, monkeypatch):
    day = date.today().isoformat()
    c = _first_company()
    co.pick_company(day, c["id"])
    monkeypatch.setattr(co, "_enqueue", lambda entry, company, now: _fake_run())
    e = co.schedule(day, now=False)
    assert e["status"] == "scheduled"
    assert e["run_id"] == "20261110-120000-c"
    assert e["produce_at"] == "2026-11-11T03:30:00"

    # 排产后初稿锁定、不能换公司、不能重复排产
    with pytest.raises(ValueError):
        co.update_draft(day, {**e["draft"], "title": "x"})
    with pytest.raises(ValueError):
        co.pick_company(day, co._load_pool()["companies"][1]["id"])
    with pytest.raises(ValueError):
        co.schedule(day)

    # 运行记录完成后，档期视图自动变成已出片并带 pid
    monkeypatch.setattr(co, "_get_run", lambda run_id: _fake_run("done", pid="co-20261110-1"))
    e2 = co.get_plan(1)["entries"][0]
    assert e2["status"] == "done"
    assert e2["pid"] == "co-20261110-1"

    with pytest.raises(ValueError):
        co.remove_plan(day)


def test_schedule_now_passes_flag(co_env, monkeypatch):
    day = date.today().isoformat()
    co.pick_company(day, _first_company()["id"])
    seen = {}

    def fake(entry, company, now):
        seen["now"] = now
        return _fake_run("running")

    monkeypatch.setattr(co, "_enqueue", fake)
    e = co.schedule(day, now=True)
    assert seen["now"] is True
    assert e["status"] == "producing"


@pytest.fixture
def pipe_env(monkeypatch, tmp_path):
    pipe = tmp_path / "pipeline"
    monkeypatch.setattr(dl, "PIPELINE_DIR", pipe)
    monkeypatch.setattr(dl, "PIPELINE_RUNS_DIR", pipe / "runs")
    monkeypatch.setattr(dl, "PIPELINE_LOGS_DIR", pipe / "logs")
    monkeypatch.setattr(dl, "CONFIG_PATH", pipe / "config.json")
    monkeypatch.setattr(dl, "STATE_PATH", pipe / "state.json")
    monkeypatch.setattr(dl, "PROJECTS_DIR", tmp_path / "projects")
    monkeypatch.setattr(dl, "RENDERS_DIR", tmp_path / "renders")
    return tmp_path


def test_enqueue_company_creates_scheduled_run(pipe_env):
    svc = dl.DailyPipelineService()
    c = _first_company()
    entry = {"date": date.today().isoformat(), "draft": co.build_draft(c)}
    run = svc.enqueue_company(entry, c, now=False)
    assert run["kind"] == "company"
    assert run["status"] == "scheduled"
    assert run["produce_at"]
    brief = run["candidates"][0]
    assert brief["source"] == "company" and brief["pid_prefix"] == "co"
    assert brief["company"]["name"] == c["name"]
    saved = json.loads((dl.PIPELINE_RUNS_DIR / f"{run['id']}.json").read_text(encoding="utf-8"))
    assert saved["company_date"] == date.today().isoformat()

    # 一天一期：已有排产中的公司批次时拒绝再排
    with pytest.raises(RuntimeError):
        svc.enqueue_company(entry, c, now=False)


def test_company_prompt_contract():
    c = _first_company()
    brief = {
        "title": f"{c['name']}：测试",
        "platform": "company",
        "platform_name": "每日公司",
        "hot": 0,
        "burst": 0,
        "source": "company",
        "company": c,
        "draft": co.build_draft(c),
        "series_date": date.today().isoformat(),
    }
    p = dl.build_agent_prompt("co-20261110-1", brief, 75)
    assert "每日一家公司" in p
    assert c["name"] in p and c["founder"] in p
    assert "pid 固定为 co-20261110-1" in p
    assert "from_scratch" in p
    assert "research.json" in p
    assert "===DAILY_RESULT" in p
    assert c["story"]["turn"][:10] in p
    # 公司提示词不应再出现热点题面
    assert "第一波指数" not in p
