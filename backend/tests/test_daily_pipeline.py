# -*- coding: utf-8 -*-
"""每日流水线测试：调度 tick、方向候选、任务书与风格硬约束、亮度闸门、
中午推送 → 确认排产/立即制作 → 凌晨生产的完整链路、心跳自愈、路由。

dsh 会话本身不真跑（_agent_session 被 fake），只验证编排与落库逻辑。
"""
import io
import json
import os
import re
import time
from datetime import datetime, timedelta
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routers import pipeline as pipeline_router
from app.services import daily as dl
from app.services import hotspot as hs


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


@pytest.fixture
def svc(pipe_env):
    return dl.DailyPipelineService()


def _hot_item(title, platform="douyin", burst=90, hot=90, tag="", summary=""):
    return hs.HotItem(
        id=hs.item_id(platform, title), platform=platform, title=title,
        url="", hot=hot, burst=burst, tag=tag, summary=summary,
    )


def _fake_agent(monkeypatch, target: object):
    def fake(prompt, log_path, timeout, agent_cmd, agent_profile, append=False):
        pid = re.search(r"pid 固定为 ([\w-]+)", prompt).group(1)
        projects: Path = dl.PROJECTS_DIR
        renders: Path = dl.RENDERS_DIR
        (projects / pid).mkdir(parents=True, exist_ok=True)
        (projects / pid / "meta.json").write_text("{}", encoding="utf-8")
        (projects / pid / "script.json").write_text(json.dumps(
            {"title": "测试", "shots": [{"lines": [{"text": "一句话台词"}]}]}, ensure_ascii=False),
            encoding="utf-8")
        (projects / pid / "research.json").write_text(json.dumps(
            {"topic": "测试", "nodes": []}, ensure_ascii=False), encoding="utf-8")
        (renders / pid).mkdir(parents=True, exist_ok=True)
        (renders / pid / "final.mp4").write_bytes(b"x" * 200_000)
        Path(log_path).parent.mkdir(parents=True, exist_ok=True)
        marker = '===DAILY_RESULT{"pid":"' + pid + '","title":"测试标题","duration_seconds":58}'
        Path(log_path).write_text(
            json.dumps({"type": "final", "text": "完成\n" + marker}, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        return 0, "完成\n" + marker, ""

    monkeypatch.setattr(target, "_agent_session", fake)
    # 建议级验收不真跑 qa_report/ffmpeg：测试只关心编排逻辑
    monkeypatch.setattr(dl, "collect_advisory", lambda pid: {
        "qa": {"verdict": "pass", "issues": []},
        "acceptance": {"verdict": "pass", "issues": [], "notes": "", "stale": False},
    })


def _wait_terminal(svc, run_id: str, timeout: float = 8.0) -> dict:
    deadline = time.time() + timeout
    while time.time() < deadline:
        run = svc.get_run(run_id)
        if run and run.get("status") in ("done", "partial", "failed", "skipped"):
            return run
        time.sleep(0.1)
    raise AssertionError("批次未在时限内收敛")


def test_next_run_at_future_today():
    now = datetime(2026, 11, 8, 9, 0)
    assert dl.next_run_at(12, 0, now) == datetime(2026, 11, 8, 12, 0)


def test_next_run_at_past_tomorrow():
    now = datetime(2026, 11, 8, 13, 0)
    assert dl.next_run_at(12, 0, now) == datetime(2026, 11, 9, 12, 0)


def test_build_agent_prompt_contract(svc):
    brief = {"title": "AI 眼镜发布", "platform": "douyin", "platform_name": "抖音",
             "tag": "科技", "summary": "某厂发布新品", "hot": 95, "burst": 92, "url": ""}
    p = dl.build_agent_prompt("hot-20261108-1", brief, 60,
                              theme={"name": "电竞", "keywords": ["英雄联盟"]},
                              style_prompt="结尾引导关注")
    assert "hot-20261108-1" in p
    assert "AGENTS.md" in p and "video-producer" in p
    assert "from_scratch" in p
    assert "===DAILY_RESULT" in p
    assert "绝对不要" in p
    assert "曲库选曲" in p
    assert "深色 AI 味" in p and "浅色明亮" in p
    assert "互动引导" in p and "钩子" in p
    assert "1080×1920" in p and "抖音" in p
    assert "可溯源" in p
    assert "事实审计" in p and "facts_audit.py" in p
    assert "acceptance_frames.py" in p and "视觉自查" in p
    assert "research.json" in p
    assert "电竞" in p and "英雄联盟" in p
    assert "结尾引导关注" in p


def test_parse_daily_result():
    ok = 'done\n===DAILY_RESULT{"pid":"hot-1","title":"标题","duration_seconds":58}'
    assert dl._parse_daily_result(ok) == {"pid": "hot-1", "title": "标题", "duration_seconds": 58}
    assert dl._parse_daily_result("no marker") == {}


def test_is_retryable_error():
    assert dl._is_retryable_error("RATE_LIMIT: 429: overloaded")
    assert not dl._is_retryable_error("RENDER: 退出码 2")


def _png(lum: float) -> bytes:
    from PIL import Image

    img = Image.new("L", (64, 64), int(lum * 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_frame_luminance():
    assert dl._frame_luminance(_png(0.9)) > 0.85
    assert dl._frame_luminance(_png(0.1)) < 0.15


def test_verify_render_brightness_gate(pipe_env, monkeypatch):
    pid = "hot-test-1"
    (dl.PROJECTS_DIR / pid).mkdir(parents=True)
    (dl.PROJECTS_DIR / pid / "meta.json").write_text("{}", encoding="utf-8")
    (dl.RENDERS_DIR / pid).mkdir(parents=True)
    (dl.RENDERS_DIR / pid / "final.mp4").write_bytes(b"x" * 200_000)
    monkeypatch.setattr(dl, "_mp4_duration", lambda p: 60.0)
    monkeypatch.setattr(dl, "_extract_frame", lambda mp4, t: _png(0.15))
    ok, reason = dl.verify_render(pid, 0.45)
    assert not ok and "过暗" in reason
    monkeypatch.setattr(dl, "_extract_frame", lambda mp4, t: _png(0.85))
    assert dl.verify_render(pid, 0.45) == (True, "")


def _write_project_files(pid: str, script_text: str, research: dict) -> None:
    pdir = dl.PROJECTS_DIR / pid
    pdir.mkdir(parents=True, exist_ok=True)
    (pdir / "meta.json").write_text("{}", encoding="utf-8")
    (pdir / "script.json").write_text(json.dumps(
        {"title": "t", "shots": [{"lines": [{"text": script_text}]}]}, ensure_ascii=False),
        encoding="utf-8")
    if research is not None:
        (pdir / "research.json").write_text(json.dumps(research, ensure_ascii=False), encoding="utf-8")


def test_verify_facts_gate(pipe_env):
    pid = "hot-facts-1"
    _write_project_files(pid, "市场规模 4500 亿美元", None)
    # research.json 缺失 → 闸门失败
    ok, reason, items = dl.verify_facts(pid)
    assert not ok and "research.json 缺失" in reason and not items
    # research 无该数字 → unverifiable 且带明细
    _write_project_files(pid, "市场规模 4500 亿美元", {
        "topic": "t", "nodes": [{"year": "", "title": "", "what": "市场规模很大",
                                 "sources": [{"title": "s", "url": "https://e.com"}]}]})
    ok, reason, items = dl.verify_facts(pid)
    assert not ok and items and "4500亿" in reason
    # 补上含数字的来源事实 → 过关并落 facts_audit.json
    _write_project_files(pid, "市场规模 4500 亿美元", {
        "topic": "t", "nodes": [{"year": "", "title": "", "what": "市场规模 4500 亿美元",
                                 "sources": [{"title": "s", "url": "https://e.com"}]}]})
    ok, reason, items = dl.verify_facts(pid)
    assert ok and reason == "" and not items
    audit = json.loads((dl.PROJECTS_DIR / pid / "facts_audit.json").read_text(encoding="utf-8"))
    assert audit["summary"]["unverifiable"] == 0
    assert audit["items"][0]["source_url"] == "https://e.com"


def _facts_agent_factory(calls: dict, good_after: int):
    """facts 场景的假 agent：前 good_after-1 轮 research 缺数字，之后补上。"""

    def agent(prompt, log_path, timeout, agent_cmd, agent_profile, append=False):
        calls["n"] += 1
        pid = re.search(r"pid 固定为 ([\w-]+)", prompt).group(1)
        research = (
            {"topic": "t", "nodes": [{"year": "", "title": "", "what": "销量 9999 万台",
                                      "sources": [{"title": "s", "url": "https://e.com"}]}]}
            if calls["n"] >= good_after
            else {"topic": "t", "nodes": [{"year": "", "title": "", "what": "销量很高",
                                           "sources": [{"title": "s", "url": "https://e.com"}]}]}
        )
        _write_project_files(pid, "销量 9999 万台", research)
        (dl.RENDERS_DIR / pid).mkdir(parents=True, exist_ok=True)
        (dl.RENDERS_DIR / pid / "final.mp4").write_bytes(b"x" * 200_000)
        if calls["n"] > 1:
            assert "返修说明" in prompt  # 返修任务书必须带失败明细
        marker = '===DAILY_RESULT{"pid":"' + pid + '","title":"t","duration_seconds":58}'
        Path(log_path).parent.mkdir(parents=True, exist_ok=True)
        with open(log_path, "a" if append else "w", encoding="utf-8") as f:
            f.write(json.dumps({"type": "final", "text": "done\n" + marker}, ensure_ascii=False) + "\n")
        return 0, "done\n" + marker, ""

    return agent


_ADVISORY_OK = lambda pid: {  # noqa: E731
    "qa": {"verdict": "pass", "issues": []},
    "acceptance": {"verdict": "missing", "issues": [], "notes": "", "stale": False},
}


def test_facts_gate_retries_then_fails(svc, monkeypatch):
    monkeypatch.setattr(hs.service, "_latest", [_hot_item("热点甲")])
    svc.update_config(facts_retries=1)  # 最多 1 次返修 = 共 2 轮
    calls = {"n": 0}
    monkeypatch.setattr(svc, "_agent_session", _facts_agent_factory(calls, good_after=99))
    monkeypatch.setattr(dl, "collect_advisory", _ADVISORY_OK)
    run = svc.prepare_batch("manual")
    svc.confirm_batch(run["id"], [1], schedule=False)
    final = _wait_terminal(svc, run["id"])
    assert final["status"] == "failed"
    v = final["videos"][0]
    assert v["facts"] == {"attempts": 2, "ok": False}
    assert "事实审计未通过" in v["error"] and "9999" in v["error"]
    assert calls["n"] == 2


def test_facts_gate_pass_after_repair(svc, monkeypatch):
    monkeypatch.setattr(hs.service, "_latest", [_hot_item("热点甲")])
    svc.update_config(facts_retries=3)
    calls = {"n": 0}
    monkeypatch.setattr(svc, "_agent_session", _facts_agent_factory(calls, good_after=2))
    monkeypatch.setattr(dl, "collect_advisory", _ADVISORY_OK)
    run = svc.prepare_batch("manual")
    svc.confirm_batch(run["id"], [1], schedule=False)
    final = _wait_terminal(svc, run["id"])
    assert final["status"] == "done"
    v = final["videos"][0]
    assert v["facts"] == {"attempts": 2, "ok": True}
    assert calls["n"] == 2


def test_visual_advisory_not_gating(svc, monkeypatch):
    """机检 fail + 视觉自查 fail 只记录不拦截（用户决策：视觉为建议级）。"""
    monkeypatch.setattr(hs.service, "_latest", [_hot_item("热点甲")])
    _fake_agent(monkeypatch, svc)
    monkeypatch.setattr(dl, "collect_advisory", lambda pid: {
        "qa": {"verdict": "fail", "issues": ["黑帧累计 2.00s"]},
        "acceptance": {"verdict": "fail", "issues": ["字幕贴边被裁"], "notes": "", "stale": False},
    })
    run = svc.prepare_batch("manual")
    svc.confirm_batch(run["id"], [1], schedule=False)
    final = _wait_terminal(svc, run["id"])
    assert final["status"] == "done"
    assert final["videos"][0]["qa"]["verdict"] == "fail"
    assert final["videos"][0]["acceptance"]["verdict"] == "fail"


def test_feishu_result_notify(svc, monkeypatch):
    monkeypatch.setattr(hs.service, "_latest", [_hot_item("热点甲")])
    _fake_agent(monkeypatch, svc)
    sent = []

    class _Resp:
        status_code = 200
        text = "{}"

        @staticmethod
        def json():
            return {"code": 0}

    def fake_post(url, json=None, timeout=0):
        sent.append(json)
        return _Resp()

    monkeypatch.setattr(dl.httpx, "post", fake_post)
    svc.update_config(feishu_webhook="https://open.feishu.cn/open-apis/bot/v2/hook/x")
    run = svc.prepare_batch("manual")
    svc.confirm_batch(run["id"], [1], schedule=False)
    final = _wait_terminal(svc, run["id"])
    texts = [s for s in sent if s.get("msg_type") == "text"]
    assert texts and "制作结果" in texts[-1]["content"]["text"]
    assert "✅" in texts[-1]["content"]["text"]


def test_pick_candidates_theme_priority(svc, monkeypatch):
    items = [
        _hot_item("无关大热点", burst=99),
        _hot_item("英雄联盟S15决赛", burst=70),
        _hot_item("新能源车销量", burst=60),
    ]
    monkeypatch.setattr(hs.service, "_latest", items)
    themes = [{"name": "电竞", "keywords": ["英雄联盟"]},
              {"name": "汽车", "keywords": ["车"]}]
    picked = svc._pick_candidates(3, [], themes)
    assert picked[0]["title"] == "英雄联盟S15决赛"
    assert picked[1]["title"] == "新能源车销量" and picked[1]["theme_name"] == "汽车"


def test_pick_candidates_search_fill(svc, monkeypatch):
    monkeypatch.setattr(hs.service, "_latest", [_hot_item("英雄联盟S15决赛", burst=70)])
    searched = [
        {"title": "虎扑电竞 - 最电竞的世界", "url": "u0", "snippet": "门户站", "provider": "bing"},
        {"title": "S16赛程公布", "url": "u1", "snippet": "拳头公布赛程", "provider": "bing"},
    ]
    monkeypatch.setattr(dl, "_theme_search", lambda q, max_results=6: searched)
    themes = [{"name": "电竞", "keywords": ["英雄联盟"]}]
    picked = svc._pick_candidates(2, [], themes, theme_search_fill=True)
    assert picked[0]["source"] == "hot"
    assert picked[1]["title"] == "S16赛程公布" and picked[1]["source"] == "search"


def test_pick_candidates_no_theme_pure_burst(svc, monkeypatch):
    monkeypatch.setattr(hs.service, "_latest", [_hot_item("热点甲", burst=80), _hot_item("热点乙", burst=60)])
    called = {"n": 0}
    monkeypatch.setattr(dl, "_theme_search", lambda *a, **k: called.__setitem__("n", called["n"] + 1) or [])
    picked = svc._pick_candidates(2, [], [])
    assert [t["title"] for t in picked] == ["热点甲", "热点乙"]
    assert called["n"] == 0


def test_pick_dedup_used(svc, monkeypatch):
    monkeypatch.setattr(hs.service, "_latest", [_hot_item("热点甲"), _hot_item("热点乙", burst=80)])
    svc._mark_used("热点甲")
    picked = svc._pick_candidates(5, [], [])
    assert [t["title"] for t in picked] == ["热点乙"]


def test_prepare_batch_awaiting(svc, monkeypatch):
    monkeypatch.setattr(hs.service, "_latest", [_hot_item(f"热点{i}", burst=90 - i) for i in range(12)])
    run = svc.prepare_batch("auto")
    assert run["status"] == "awaiting_confirm"
    assert len(run["candidates"]) == 10
    assert "未确认" in run["confirm_deadline"]
    assert run["notify"]["ok"] is False and "webhook" in run["notify"]["error"]
    assert svc._awaiting_run_id == run["id"]


def test_feishu_push_card(svc, monkeypatch):
    monkeypatch.setattr(hs.service, "_latest", [_hot_item(f"热点{i}", burst=90 - i) for i in range(12)])
    sent = {}

    class _Resp:
        status_code = 200
        text = "{}"

        @staticmethod
        def json():
            return {"code": 0}

    def fake_post(url, json=None, timeout=0):
        sent["url"] = url
        sent["json"] = json
        return _Resp()

    monkeypatch.setattr(dl.httpx, "post", fake_post)
    svc.update_config(feishu_webhook="https://open.feishu.cn/open-apis/bot/v2/hook/x",
                      feishu_secret="sig-secret", page_url="http://192.168.1.5:5173")
    run = svc.prepare_batch("manual")
    assert run["notify"]["ok"] is True
    body = json.dumps(sent["json"]["card"], ensure_ascii=False)
    assert "确认并排产" in body and "未确认则不做" in body
    assert "http://192.168.1.5:5173/?tab=pipeline&run=" in body
    assert sent["json"]["timestamp"] and sent["json"]["sign"]


def test_confirm_schedule_then_produce(svc, monkeypatch):
    monkeypatch.setattr(hs.service, "_latest", [_hot_item(f"热点{i}", burst=90 - i) for i in range(12)])
    _fake_agent(monkeypatch, svc)
    run = svc.prepare_batch("manual")
    out = svc.confirm_batch(run["id"], [2, 5], schedule=True)
    assert out["status"] == "scheduled"
    assert out["confirmed"]["indices"] == [2, 5]
    assert out["produce_at"]
    assert [r["id"] for r in svc._scheduled_runs_due()] == [run["id"]]
    assert svc.get_run(run["id"])["status"] == "scheduled"  # 未到点不生产
    svc.produce_now(run["id"])
    final = _wait_terminal(svc, run["id"])
    assert final["status"] == "done"
    assert [v["topic_title"] for v in final["videos"]] == ["热点1", "热点4"]
    assert final["videos"][0]["has_video"]


def test_confirm_immediate_produces(svc, monkeypatch):
    monkeypatch.setattr(hs.service, "_latest", [_hot_item(f"热点{i}", burst=90 - i) for i in range(12)])
    _fake_agent(monkeypatch, svc)
    run = svc.prepare_batch("manual")
    svc.confirm_batch(run["id"], [1, 3], schedule=False)
    final = _wait_terminal(svc, run["id"])
    assert final["status"] == "done"
    assert [v["topic_title"] for v in final["videos"]] == ["热点0", "热点2"]
    used = svc._load_state()["used"]
    assert hs.normalize_title("热点0") in used


def test_confirm_requires_selection(svc, monkeypatch):
    monkeypatch.setattr(hs.service, "_latest", [_hot_item("热点甲")])
    run = svc.prepare_batch("manual")
    with pytest.raises(ValueError):
        svc.confirm_batch(run["id"], [])


def test_begin_production_mutex(svc, monkeypatch):
    monkeypatch.setattr(hs.service, "_latest", [_hot_item("热点甲")])
    run = svc.prepare_batch("manual")
    assert svc._run_lock.acquire()
    try:
        svc._begin_production(run, [run["candidates"][0]])
        healed = svc.get_run(run["id"])
        assert healed["status"] == "failed" and "另一批次" in healed["error"]
    finally:
        svc._run_lock.release()


def test_produce_no_topics(svc):
    run = {"id": "t-empty", "trigger": "manual", "count": 3, "target_seconds": 60,
           "status": "running", "videos": [], "confirmed": None}
    svc._produce(run, None)
    assert run["status"] == "failed" and "没有已确认的选题" in run["error"]


def test_produce_failure_isolated(svc, monkeypatch):
    monkeypatch.setattr(hs.service, "_latest", [_hot_item("热点甲"), _hot_item("热点乙")])
    calls = {"n": 0}

    def flaky(prompt, log_path, timeout, agent_cmd, agent_profile, append=False):
        calls["n"] += 1
        if calls["n"] == 1:
            return 1, "", "RENDER: 模拟失败"
        return _fake_ok_simple(prompt, log_path, dl.PROJECTS_DIR, dl.RENDERS_DIR)

    monkeypatch.setattr(svc, "_agent_session", flaky)
    briefs = [
        {"title": "热点甲", "platform": "douyin", "platform_name": "抖音", "tag": "",
         "summary": "", "hot": 90, "burst": 90, "url": "", "theme_name": ""},
        {"title": "热点乙", "platform": "douyin", "platform_name": "抖音", "tag": "",
         "summary": "", "hot": 80, "burst": 80, "url": "", "theme_name": ""},
    ]
    run = {"id": "t-fail", "trigger": "manual", "count": 2, "target_seconds": 60,
           "status": "running", "videos": [], "candidates": briefs,
           "confirmed": {"indices": [1, 2], "source": "user", "at": "t"}}
    svc._produce(run, None)
    assert run["status"] == "partial"
    assert run["videos"][0]["status"] == "failed"
    assert run["videos"][1]["status"] == "done"


def _fake_ok_simple(prompt, log_path, projects, renders):
    pid = re.search(r"pid 固定为 ([\w-]+)", prompt).group(1)
    (Path(projects) / pid).mkdir(parents=True, exist_ok=True)
    (Path(projects) / pid / "meta.json").write_text("{}", encoding="utf-8")
    (Path(projects) / pid / "script.json").write_text(json.dumps(
        {"title": "t", "shots": [{"lines": [{"text": "一句话台词"}]}]}, ensure_ascii=False),
        encoding="utf-8")
    (Path(projects) / pid / "research.json").write_text(json.dumps(
        {"topic": "t", "nodes": []}, ensure_ascii=False), encoding="utf-8")
    (Path(renders) / pid).mkdir(parents=True, exist_ok=True)
    (Path(renders) / pid / "final.mp4").write_bytes(b"x" * 200_000)
    marker = '===DAILY_RESULT{"pid":"' + pid + '","title":"t"}'
    return 0, "ok\n" + marker, ""


def test_tick_pushes_once_daily(svc, monkeypatch):
    monkeypatch.setattr(hs.service, "_latest", [_hot_item(f"热点{i}", burst=90 - i) for i in range(12)])
    svc.update_config(push_hour=0, push_minute=0)  # 00:00 之后任何时刻都到点
    svc._tick()
    assert svc._load_state().get("last_push_date") == datetime.now().strftime("%Y-%m-%d")
    runs = svc.list_runs()
    assert len(runs) == 1 and runs[0]["status"] == "awaiting_confirm"
    svc._tick()
    assert len(svc.list_runs()) == 1  # 一天只推一次


def test_tick_produces_scheduled(svc, monkeypatch):
    monkeypatch.setattr(hs.service, "_latest", [_hot_item("热点甲")])
    _fake_agent(monkeypatch, svc)
    svc.update_config(produce_hour=0, produce_minute=0)
    run = svc.prepare_batch("manual")
    svc.confirm_batch(run["id"], [1], schedule=True)
    st = svc._load_state()
    st["last_push_date"] = datetime.now().strftime("%Y-%m-%d")
    svc._save_state(st)
    svc._tick()
    final = _wait_terminal(svc, run["id"])
    assert final["status"] == "done"


def test_sweep_expires_yesterdays_awaiting(svc, monkeypatch):
    monkeypatch.setattr(hs.service, "_latest", [_hot_item("热点甲")])
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y%m%d")
    run = svc.prepare_batch("manual")
    old = svc.get_run(run["id"])
    old["id"] = f"{yesterday}-120000"
    dl.PIPELINE_RUNS_DIR.mkdir(parents=True, exist_ok=True)
    (dl.PIPELINE_RUNS_DIR / f"{old['id']}.json").write_text(
        json.dumps(old, ensure_ascii=False), encoding="utf-8")
    (dl.PIPELINE_RUNS_DIR / f"{run['id']}.json").unlink()
    if svc._awaiting_run_id == run["id"]:
        svc._awaiting_run_id = old["id"]
    svc._sweep_expired_awaiting()
    assert svc.get_run(old["id"])["status"] == "skipped"


def test_startup_heals_stranded_runs(svc):
    dl.PIPELINE_RUNS_DIR.mkdir(parents=True)
    old = time.time() - 3600
    p1 = dl.PIPELINE_RUNS_DIR / "20261107-100000.json"
    p1.write_text(json.dumps({
        "id": "20261107-100000", "trigger": "auto", "started_at": "2026-11-07T10:00:00",
        "finished_at": None, "status": "running", "target_seconds": 60,
        "videos": [{"pid": "hot-20261107-1", "status": "running"}],
    }, ensure_ascii=False), encoding="utf-8")
    os.utime(p1, (old, old))
    p2 = dl.PIPELINE_RUNS_DIR / "20261107-100100.json"
    p2.write_text(json.dumps({
        "id": "20261107-100100", "trigger": "manual", "started_at": "2026-11-07T10:00:00",
        "finished_at": None, "status": "awaiting_confirm", "count": 3,
        "candidates": [], "confirm_deadline": "2026-11-07 24:00", "videos": [],
    }, ensure_ascii=False), encoding="utf-8")

    svc.startup()
    svc.shutdown()
    assert svc.get_run("20261107-100000")["status"] == "failed"
    assert svc.get_run("20261107-100100")["status"] == "awaiting_confirm"


def test_touch_run_keeps_window_alive(svc, monkeypatch):
    monkeypatch.setattr(hs.service, "_latest", [_hot_item("热点甲")])
    run = svc.prepare_batch("manual")
    path = dl.PIPELINE_RUNS_DIR / f"{run['id']}.json"
    old = time.time() - 3600
    os.utime(path, (old, old))
    svc._touch_run(run["id"])
    svc.status()
    assert svc.get_run(run["id"])["status"] == "awaiting_confirm"


@pytest.fixture
def client(pipe_env, monkeypatch):
    app = FastAPI()
    app.include_router(pipeline_router.router)
    return TestClient(app)


def test_route_status_and_config(client):
    body = client.get("/api/pipeline/status").json()
    assert body["push_hour"] == 12 and body["produce_hour"] == 3 and "next_push_at" in body
    r = client.put("/api/pipeline/config", json={
        "push_hour": 12, "push_minute": 30, "produce_hour": 4,
        "count": 2, "enabled": False,
        "themes": [{"name": "电竞", "keywords": ["英雄联盟", "BLG"]}],
    })
    assert r.status_code == 200
    body = r.json()
    assert body["push_hour"] == 12 and body["push_minute"] == 30
    assert body["produce_hour"] == 4 and body["count"] == 2 and body["enabled"] is False
    assert body["themes"] == [{"name": "电竞", "keywords": ["英雄联盟", "BLG"]}]
    r = client.put("/api/pipeline/config", json={"push_hour": 99, "count": 99})
    assert r.status_code == 422


def test_route_confirm_and_produce(client, monkeypatch):
    monkeypatch.setattr(hs.service, "_latest", [_hot_item(f"热点{i}", burst=90 - i) for i in range(12)])
    _fake_agent(monkeypatch, dl.service)
    svc = dl.service
    run = svc.prepare_batch("manual")
    r = client.post(f"/api/pipeline/runs/{run['id']}/confirm",
                    json={"indices": [2], "schedule": True})
    assert r.status_code == 200 and r.json()["status"] == "scheduled"
    r = client.post(f"/api/pipeline/runs/{run['id']}/produce")
    assert r.status_code == 200
    final = _wait_terminal(svc, run["id"])
    assert final["status"] == "done"
    r = client.post(f"/api/pipeline/runs/{run['id']}/produce")
    assert r.status_code == 409


def test_route_log_tail(client, tmp_path):
    log = tmp_path / "session.log"
    log.write_text(
        '{"type":"tool_call","tool":"write","input":{"file_path":"a/b.ts"}}\n'
        '{"type":"final","text":"完成"}\n',
        encoding="utf-8",
    )
    run = {"id": "r1", "videos": [{"pid": "hot-x-1", "log": str(log)}]}
    original = dl.service.get_run
    dl.service.get_run = lambda rid: run if rid == "r1" else None
    try:
        r = client.get("/api/pipeline/runs/r1/log", params={"pid": "hot-x-1"})
        assert r.status_code == 200
        lines = r.json()["lines"]
        assert any("write" in l for l in lines) and any("最终回答" in l for l in lines)
        r = client.get("/api/pipeline/runs/nope/log", params={"pid": "hot-x-1"})
        assert r.status_code == 404
    finally:
        dl.service.get_run = original
