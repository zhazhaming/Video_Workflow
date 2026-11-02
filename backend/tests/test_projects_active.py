# -*- coding: utf-8 -*-
"""项目活跃渲染任务查询端点测试（前端刷新后恢复进度轮询依赖它）。"""


import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers import projects as projects_mod
from app.services import tasks as tasks_mod


@pytest.fixture
def proj_env(monkeypatch, tmp_path):
    """把项目存储指到 tmp，避免污染真实 storage。"""
    monkeypatch.setattr(projects_mod, "PROJECTS_DIR", tmp_path / "projects")
    monkeypatch.setattr(projects_mod, "RENDERS_DIR", tmp_path / "renders")
    return tmp_path


client = TestClient(app)


def _mk_project() -> str:
    r = client.post("/api/projects", json={})
    assert r.status_code == 200
    return r.json()["id"]


def test_active_task_none(proj_env):
    pid = _mk_project()
    r = client.get(f"/api/projects/{pid}/task/active")
    assert r.status_code == 200
    assert r.json()["task"] is None


def test_active_task_running(proj_env, monkeypatch):
    pid = _mk_project()
    fake = {"id": "t1", "project_id": pid, "stage": "rendering", "message": "x", "video_url": None,
            "error": None, "log_tail": None, "started_at": "", "finished_at": None}
    monkeypatch.setattr(tasks_mod.task_manager, "active_task_of", lambda p: "t1")
    monkeypatch.setattr(tasks_mod.task_manager, "get", lambda t: fake)
    r = client.get(f"/api/projects/{pid}/task/active")
    assert r.json()["task"]["stage"] == "rendering"
    # 不存在的项目 → 404
    assert client.get("/api/projects/nope/task/active").status_code == 404
