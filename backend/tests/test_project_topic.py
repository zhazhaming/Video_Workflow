# -*- coding: utf-8 -*-
"""建项目带入选题：项目标题、设置、流程状态都要带上，供第 1 步研究主题预填。"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers import projects as projects_mod
from app.services import flow as flow_mod

TOPIC = "A股几次奇迹日之后，都发生了什么"

client = TestClient(app)


@pytest.fixture
def proj_env(monkeypatch, tmp_path):
    monkeypatch.setattr(projects_mod, "PROJECTS_DIR", tmp_path / "projects")
    monkeypatch.setattr(projects_mod, "RENDERS_DIR", tmp_path / "renders")
    monkeypatch.setattr(flow_mod, "PROJECTS_DIR", tmp_path / "projects")
    monkeypatch.setattr(flow_mod, "RENDERS_DIR", tmp_path / "renders")
    return tmp_path


def test_create_project_with_topic(proj_env):
    r = client.post("/api/projects", json={"topic": TOPIC})
    assert r.status_code == 200
    body = r.json()
    assert body["title"] == TOPIC
    assert body["script"]["title"] == TOPIC
    pid = body["id"]

    assert client.get(f"/api/projects/{pid}/settings").json()["topic"] == TOPIC
    assert client.get(f"/api/projects/{pid}/flow/state").json()["topic"] == TOPIC


def test_create_project_without_topic_keeps_default(proj_env):
    body = client.post("/api/projects", json={}).json()
    assert body["title"] == "未命名视频"
    assert client.get(f"/api/projects/{body['id']}/flow/state").json()["topic"] == ""


def test_saving_other_settings_keeps_topic(proj_env):
    pid = client.post("/api/projects", json={"topic": TOPIC}).json()["id"]
    r = client.put(f"/api/projects/{pid}/settings", json={"style": "新风格"})
    assert r.status_code == 200
    assert client.get(f"/api/projects/{pid}/settings").json()["topic"] == TOPIC


def test_research_topic_wins_over_saved_topic(proj_env):
    pid = client.post("/api/projects", json={"topic": TOPIC}).json()["id"]
    r = client.put(f"/api/projects/{pid}/flow/research", json={"topic": "改过的主题", "nodes": []})
    assert r.status_code == 200
    assert client.get(f"/api/projects/{pid}/flow/state").json()["topic"] == "改过的主题"
