# -*- coding: utf-8 -*-
"""发布中心测试：任务 CRUD/状态机、tick 调度（补发与 overdue）、执行器参数传递、登录端点。"""
import json
import time
from datetime import datetime, timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers import projects as projects_router
from app.services import creator_douyin as cd
from app.services import publish_scheduler as sched
from app.services.publish_scheduler import service

client = TestClient(app)


@pytest.fixture
def env(monkeypatch, tmp_path):
    """存储/配置全部指到 tmp；把 threading.Thread 换成同步执行保证确定性。"""
    monkeypatch.setattr(projects_router, "PROJECTS_DIR", tmp_path / "projects")
    monkeypatch.setattr(sched.config, "PROJECTS_DIR", tmp_path / "projects")
    monkeypatch.setattr(sched.config, "RENDERS_DIR", tmp_path / "renders")
    monkeypatch.setattr(sched.config, "PUBLISH_TASKS_FILE", tmp_path / "publish" / "tasks.json")
    monkeypatch.setattr(sched.config, "PUBLISH_SCREENSHOTS_DIR", tmp_path / "publish" / "screenshots")
    monkeypatch.setattr(sched.config, "DOUYIN_COLLECTION", "默认合集")
    monkeypatch.setattr(sched.config, "DOUYIN_DECLARATIONS", ["内容由AI生成"])
    monkeypatch.setattr(sched.config, "PUBLISH_MIN_INTERVAL_MINUTES", 0)
    monkeypatch.setattr(sched.config, "PUBLISH_MISSED_GRACE_HOURS", 24.0)
    service._account_cache = {"ts": 0.0, "data": {"logged_in": False, "message": "尚未检查"}}

    class SyncThread:
        def __init__(self, target=None, args=(), daemon=None, name=None):
            self._target, self._args = target, args

        def start(self):
            if self._target:
                self._target(*self._args)

    monkeypatch.setattr(sched.threading, "Thread", SyncThread)
    return tmp_path


def make_project(tmp: Path, pid: str, with_video: bool = True) -> None:
    d = tmp / "projects" / pid
    d.mkdir(parents=True, exist_ok=True)
    (d / "meta.json").write_text(
        json.dumps({"id": pid, "title": f"项目{pid}"}, ensure_ascii=False), encoding="utf-8")
    if with_video:
        r = tmp / "renders" / pid
        r.mkdir(parents=True, exist_ok=True)
        (r / "final.mp4").write_bytes(b"v")


@pytest.fixture
def fake_publish(monkeypatch):
    calls = {"n": 0, "kw": {}}

    def fake(**kw):
        calls["n"] += 1
        calls["kw"] = kw
        return {"item_id": "itm1", "warnings": ["自主声明「内容由AI生成」未在页面找到，已跳过"]}

    monkeypatch.setattr(cd, "publish", fake)
    return calls


@pytest.fixture
def fake_covers(monkeypatch):
    monkeypatch.setattr(sched, "extract_covers", lambda pid, at_ratio=0.08: {
        "cover": Path(f"C:/fake/{pid}/cover.jpg"),
        "vertical": Path(f"C:/fake/{pid}/cover_v.jpg"),
        "horizontal": Path(f"C:/fake/{pid}/cover_h.jpg"),
    })


# ---------- 创建 ----------

def test_create_task_defaults(env):
    make_project(env, "p1")
    t = client.post("/api/publish/center/tasks", json={
        "pid": "p1", "title": "测试标题", "desc": "简介", "tags": ["#话题1", " "]})
    assert t.status_code == 200, t.text
    data = t.json()
    assert data["status"] == "scheduled"
    assert data["collection"] == "默认合集"  # 全局默认
    assert data["declarations"] == ["内容由AI生成"]
    assert data["tags"] == ["话题1"]  # # 号剥离、空值清洗
    assert data["scheduled_at"]  # 立即发布 = 排期为当前时刻


def test_create_task_explicit_overrides(env):
    make_project(env, "p1")
    t = client.post("/api/publish/center/tasks", json={
        "pid": "p1", "title": "t", "collection": "", "declarations": [],
        "scheduled_at": "2030-01-01 08:30"})
    assert t.status_code == 200
    data = t.json()
    assert data["collection"] == ""  # 显式空 = 不设合集
    assert data["declarations"] == []
    assert data["scheduled_at"] == "2030-01-01 08:30:00"


def test_create_task_requires_video(env):
    make_project(env, "p2", with_video=False)
    r = client.post("/api/publish/center/tasks", json={"pid": "p2", "title": "t"})
    assert r.status_code == 400 and "成片" in r.json()["detail"]


def test_create_task_bad_time(env):
    make_project(env, "p1")
    r = client.post("/api/publish/center/tasks", json={
        "pid": "p1", "title": "t", "scheduled_at": "不是时间"})
    assert r.status_code == 400


# ---------- tick 调度 ----------

def test_tick_executes_due_task(env, fake_publish, fake_covers):
    make_project(env, "p1")
    t = service.create_task(pid="p1", title="标题", desc="简介", tags=["a"],
                            collection="我的合集", declarations=["内容由AI生成"])
    service._tick()
    task = service._get(t["id"])
    assert task["status"] == "published"
    assert task["published_at"] and task["item_id"] == "itm1"
    assert "未在页面找到" in task["warnings"][0]
    # 执行器收到完整发布参数（合集/声明/双封面）
    kw = fake_publish["kw"]
    assert kw["collection"] == "我的合集"
    assert kw["declarations"] == ["内容由AI生成"]
    assert kw["cover_v"].name == "cover_v.jpg" and kw["cover_h"].name == "cover_h.jpg"
    assert kw["title"] == "标题" and kw["tags"] == ["a"]
    assert any(h["action"] == "published" for h in task["history"])


def test_tick_failure_marks_failed(env, monkeypatch, fake_covers):
    make_project(env, "p1")
    monkeypatch.setattr(cd, "publish", lambda **kw: (_ for _ in ()).throw(RuntimeError("页面改版")))
    t = service.create_task(pid="p1", title="t")
    service._tick()
    task = service._get(t["id"])
    assert task["status"] == "failed"
    assert "页面改版" in task["error"] and task["attempts"] == 1


def test_missed_beyond_grace_becomes_overdue(env, monkeypatch, fake_covers):
    make_project(env, "p1")
    monkeypatch.setattr(sched.config, "PUBLISH_MISSED_GRACE_HOURS", 0.01)
    past = (datetime.now() - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S")
    t = service.create_task(pid="p1", title="t", scheduled_at=past)
    service._tick()
    task = service._get(t["id"])
    assert task["status"] == "overdue"
    assert "宽限" in task["error"]


def test_catchup_within_grace(env, fake_publish, fake_covers):
    make_project(env, "p1")
    past = (datetime.now() - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S")
    t = service.create_task(pid="p1", title="t", scheduled_at=past)
    service._tick()
    assert service._get(t["id"])["status"] == "published"  # 宽限期内启动即补发


def test_publish_now_flow(env, fake_publish, fake_covers):
    make_project(env, "p1")
    t = service.create_task(pid="p1", title="t", scheduled_at="2030-01-01 00:00:00")
    out = service.publish_now(t["id"])
    assert out["status"] == "published"  # SyncThread：立即同步执行


# ---------- 编辑 / 取消 / 重试 / 再发布 ----------

def test_update_constraints(env, fake_publish, fake_covers):
    make_project(env, "p1")
    t = service.create_task(pid="p1", title="旧标题")
    service._tick()  # → published
    with pytest.raises(ValueError):
        service.update_task(t["id"], title="新标题")
    u = client.patch(f"/api/publish/center/tasks/{t['id']}", json={"title": "x"})
    assert u.status_code == 400


def test_update_scheduled_ok(env):
    make_project(env, "p1")
    t = service.create_task(pid="p1", title="旧标题", tags=["a"])
    u = client.patch(f"/api/publish/center/tasks/{t['id']}", json={
        "title": "新标题", "tags": ["b", "c"], "scheduled_at": "2031-02-03T04:05",
        "collection": "新合集"})
    assert u.status_code == 200
    d = u.json()
    assert d["title"] == "新标题" and d["tags"] == ["b", "c"]
    assert d["scheduled_at"] == "2031-02-03 04:05:00" and d["collection"] == "新合集"


def test_cancel_and_delete(env):
    make_project(env, "p1")
    t = service.create_task(pid="p1", title="t")
    c = client.post(f"/api/publish/center/tasks/{t['id']}/cancel")
    assert c.json()["status"] == "cancelled"
    with pytest.raises(ValueError):
        service.cancel_task(t["id"])  # cancelled 不能再取消
    d = client.delete(f"/api/publish/center/tasks/{t['id']}")
    assert d.json()["ok"] is True
    assert service._get(t["id"]) is None


def test_delete_uploading_forbidden(env):
    make_project(env, "p1")
    t = service.create_task(pid="p1", title="t")
    service._set(t["id"], status="uploading")
    with pytest.raises(ValueError):
        service.delete_task(t["id"])  # 执行中的任务不能删除


def test_retry_failed(env, monkeypatch, fake_covers):
    make_project(env, "p1")
    monkeypatch.setattr(cd, "publish", lambda **kw: (_ for _ in ()).throw(RuntimeError("x")))
    t = service.create_task(pid="p1", title="t")
    service._tick()
    assert service._get(t["id"])["status"] == "failed"
    r = client.post(f"/api/publish/center/tasks/{t['id']}/retry")
    assert r.json()["status"] == "scheduled"


def test_republish_copies_task(env, fake_publish, fake_covers):
    make_project(env, "p1")
    t = service.create_task(pid="p1", title="t", desc="d", tags=["a"],
                            collection="合集A", declarations=["内容由AI生成"])
    service._tick()  # published
    r = client.post(f"/api/publish/center/tasks/{t['id']}/republish")
    assert r.status_code == 200
    n = r.json()
    assert n["id"] != t["id"] and n["source_task_id"] == t["id"]
    assert n["status"] == "scheduled"
    assert n["collection"] == "合集A" and n["title"] == "t"


# ---------- 总览 ----------

def test_overview_join_account(env, monkeypatch):
    make_project(env, "p1")
    service.create_task(pid="p1", title="t")
    monkeypatch.setattr(cd, "check_status", lambda: {"logged_in": True, "message": "登录态有效"})
    o = client.get("/api/publish/center/overview").json()
    assert o["account"]["logged_in"] is True
    assert o["tasks"][0]["project_title"] == "项目p1"
    assert o["defaults"]["collection"] == "默认合集"


# ---------- 登录端点 ----------

def test_login_endpoints(env, monkeypatch):
    monkeypatch.setattr(cd, "login_start", lambda: {"state": "ok", "message": "二维码已生成"})
    monkeypatch.setattr(cd, "login_qr", lambda: b"png")
    monkeypatch.setattr(cd, "login_poll", lambda: {"state": "success", "message": "ok"})
    assert client.post("/api/publish/creator/login/start").json()["state"] == "ok"
    qr = client.get("/api/publish/creator/qr")
    assert qr.status_code == 200 and qr.headers["content-type"] == "image/png"
    service._account_cache = {"ts": time.time(), "data": {"logged_in": True}}
    assert client.get("/api/publish/creator/login/poll").json()["state"] == "success"
    assert service._account_cache["ts"] == 0.0  # 登录成功后账号缓存失效


def test_login_cancel_and_logout(env, monkeypatch):
    monkeypatch.setattr(cd, "login_cancel", lambda: None)
    monkeypatch.setattr(cd, "logout", lambda: None)
    assert client.post("/api/publish/creator/login/cancel").json()["ok"]
    assert client.post("/api/publish/creator/logout").json()["ok"]


# ---------- 截图端点 ----------

def test_screenshot_route(env, monkeypatch):
    d = sched.config.PUBLISH_SCREENSHOTS_DIR
    monkeypatch.setattr("app.routers.publish.PUBLISH_SCREENSHOTS_DIR", d)  # 路由侧为模块级导入
    d.mkdir(parents=True, exist_ok=True)
    (d / "pub-x-fail.png").write_bytes(b"png")
    ok = client.get("/api/publish/screenshots/pub-x-fail.png")
    assert ok.status_code == 200 and ok.headers["content-type"] == "image/png"
    assert client.get("/api/publish/screenshots/..%2Fetc.png").status_code == 404
    assert client.get("/api/publish/screenshots/none.png").status_code == 404


# ---------- 项目封面路由（双封面） ----------

def test_cover_routes_generate(env, monkeypatch):
    make_project(env, "p1")
    rdir = env / "renders" / "p1"

    def fake_extract(pid, at_ratio=0.08):
        out = {"cover": rdir / "cover.jpg", "vertical": rdir / "cover_v.jpg",
               "horizontal": rdir / "cover_h.jpg"}
        for p in out.values():
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(b"jpeg")
        return out

    monkeypatch.setattr("app.routers.publish.extract_covers", fake_extract)
    monkeypatch.setattr("app.routers.publish.RENDERS_DIR", env / "renders")  # 路由侧为导入时绑定
    assert client.get("/api/projects/p1/publish/cover_v").status_code == 200
    assert client.get("/api/projects/p1/publish/cover_h").status_code == 200
    pkg = client.get("/api/projects/p1/publish/package").json()
    assert pkg["cover_v_url"] and pkg["cover_h_url"]
