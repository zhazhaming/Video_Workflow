# -*- coding: utf-8 -*-
"""项目删除接口测试：目录级联清理 / 404 / 渲染进行中 409。"""
from fastapi.testclient import TestClient

from app.main import app
from app.routers import projects as projects_router

client = TestClient(app)


def _seed_project(pid: str, monkeypatch, tmp_path) -> None:
    """把删除目标目录全部指到 tmp 并放入假项目文件。"""
    projects_dir = tmp_path / "storage" / "projects"
    renders_dir = tmp_path / "storage" / "renders"
    public = tmp_path / "public"
    monkeypatch.setattr(projects_router, "PROJECTS_DIR", projects_dir)
    monkeypatch.setattr(projects_router, "RENDERS_DIR", renders_dir)
    monkeypatch.setattr(projects_router, "REMOTION_PUBLIC", public)

    (projects_dir / pid).mkdir(parents=True)
    (projects_dir / pid / "meta.json").write_text('{"id": "%s", "title": "t"}' % pid, encoding="utf-8")
    (projects_dir / pid / "script.json").write_text("{}", encoding="utf-8")
    (renders_dir / pid).mkdir(parents=True)
    (renders_dir / pid / "final.mp4").write_bytes(b"x")
    voice_dir = public / "voice" / "projects" / pid
    voice_dir.mkdir(parents=True)
    (voice_dir / "s01_0.mp3").write_bytes(b"x")
    pic_dir = public / "pic" / "projects" / pid
    pic_dir.mkdir(parents=True)
    (pic_dir / "custom_01.png").write_bytes(b"x")


def test_delete_project_removes_all_artifacts(monkeypatch, tmp_path):
    pid = "abc123"
    _seed_project(pid, monkeypatch, tmp_path)

    r = client.delete(f"/api/projects/{pid}")
    assert r.status_code == 200
    assert r.json()["deleted"] == pid

    # 四处产物全部清理
    assert not (tmp_path / "storage" / "projects" / pid).exists()
    assert not (tmp_path / "storage" / "renders" / pid).exists()
    assert not (tmp_path / "public" / "voice" / "projects" / pid).exists()
    assert not (tmp_path / "public" / "pic" / "projects" / pid).exists()


def test_delete_missing_project_returns_404(monkeypatch, tmp_path):
    _seed_project("exists", monkeypatch, tmp_path)
    r = client.delete("/api/projects/no_such_pid")
    assert r.status_code == 404


def test_delete_blocked_while_rendering(monkeypatch, tmp_path):
    pid = "busy01"
    _seed_project(pid, monkeypatch, tmp_path)

    class BusyManager:
        def active_task_of(self, project_id: str):
            return "some-task-id"

    monkeypatch.setattr(projects_router, "task_manager", BusyManager())
    r = client.delete(f"/api/projects/{pid}")
    assert r.status_code == 409
    # 目录保持原样
    assert (tmp_path / "storage" / "projects" / pid).exists()
