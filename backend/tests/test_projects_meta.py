# -*- coding: utf-8 -*-
"""项目 meta.json 兼容性测试：缺字段的老数据不能把项目列表打成 500。"""
import json

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
    monkeypatch.setattr(tasks_mod, "PROJECTS_DIR", tmp_path / "projects")
    return tmp_path


client = TestClient(app)


def _mk_legacy_project(root, pid: str, meta: dict) -> None:
    d = root / "projects" / pid
    d.mkdir(parents=True)
    (d / "meta.json").write_text(json.dumps(meta, ensure_ascii=False), encoding="utf-8")
    (d / "script.json").write_text(
        projects_mod.DEFAULT_SCRIPT.model_dump_json(), encoding="utf-8"
    )


def test_list_projects_fills_missing_meta_fields(proj_env):
    """skill/早期版本落盘的 meta.json 可能没有 id/updated_at，列表按目录名/mtime 补齐。"""
    _mk_legacy_project(proj_env, "legacy-proj", {"title": "老项目", "created_at": "2026-11-01"})
    _mk_legacy_project(proj_env, "only-topic", {"topic": "只有选题"})

    r = client.get("/api/projects")
    assert r.status_code == 200
    items = {i["id"]: i for i in r.json()}
    assert set(items) >= {"legacy-proj", "only-topic"}
    assert items["legacy-proj"]["title"] == "老项目"
    assert items["legacy-proj"]["updated_at"]  # 用 mtime 兜底
    assert items["only-topic"]["title"] == "只有选题"
    assert items["only-topic"]["created_at"] and items["only-topic"]["updated_at"]

    # 详情接口同样不能被脏 meta 打断
    detail = client.get("/api/projects/legacy-proj")
    assert detail.status_code == 200
    assert detail.json()["id"] == "legacy-proj"


def test_list_projects_skips_unparsable_meta(proj_env):
    """真·坏 JSON 只跳过该条，其余项目照常返回。"""
    _mk_legacy_project(proj_env, "good", {"id": "good", "title": "好项目",
                                          "created_at": "2026-11-01", "updated_at": "2026-11-01"})
    bad = proj_env / "projects" / "bad"
    bad.mkdir(parents=True)
    (bad / "meta.json").write_text("{not json", encoding="utf-8")

    r = client.get("/api/projects")
    assert r.status_code == 200
    assert [i["id"] for i in r.json()] == ["good"]
