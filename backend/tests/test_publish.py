# -*- coding: utf-8 -*-
"""发布模块测试：AI 文案生成与缓存、封面跳过、抖音状态/发布（mock 网络）。"""
import json

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers import projects as projects_router
from app.services import publish as pub
from app.schemas import ScriptDraft

client = TestClient(app)


def _fake_project(monkeypatch, tmp_path, pid: str) -> None:
    """在路由层与发布服务两侧都指到 tmp，并造一个最小项目。"""
    projs = tmp_path / "projects"
    monkeypatch.setattr(projects_router, "PROJECTS_DIR", projs)
    d = projs / pid
    d.mkdir(parents=True, exist_ok=True)
    (d / "meta.json").write_text(
        json.dumps({"id": pid, "title": "测试", "created_at": "2026-01-01 00:00:00",
                    "updated_at": "2026-01-01 00:00:00"}),
        encoding="utf-8",
    )


SCRIPT = ScriptDraft.model_validate(
    {
        "title": "46亿年地球简史",
        "shots": [
            {"year": "46亿年前", "label": "星云", "lines": [{"text": "四十六亿年前，这里什么都没有。"}]},
            {"year": "今天", "label": "蓝色星球", "lines": [{"text": "你脚下的这颗球，活了很多轮大灭绝。"}]},
        ],
    }
)


@pytest.fixture
def proj_env(monkeypatch, tmp_path):
    monkeypatch.setattr(pub, "PROJECTS_DIR", tmp_path / "projects")
    monkeypatch.setattr(pub, "RENDERS_DIR", tmp_path / "renders")
    monkeypatch.setattr(pub, "STORAGE_DIR", tmp_path / "storage")
    monkeypatch.setattr(pub, "TOKENS_DIR", tmp_path / "storage" / "tokens")
    return tmp_path


# ---------- AI 文案 ----------

def test_copy_generation_and_cache(proj_env, monkeypatch):
    calls = {"n": 0}

    def fake_chat(model_id, user, temperature, system_prompt):
        calls["n"] += 1
        assert "小红书" in system_prompt or "抖音" in system_prompt
        assert "46亿年地球简史" in user
        return '{"title": "地球活过5次大灭绝", "desc": "看完你会爱上它", "tags": ["#地球", "#科普", "#"]}'

    monkeypatch.setattr(pub, "_chat", fake_chat)
    c1 = pub.get_or_create_copy("p1", SCRIPT, "xhs", None)
    assert c1["title"] == "地球活过5次大灭绝"
    assert c1["tags"] == ["地球", "科普"]  # 空话题被清洗、# 号剥离
    c2 = pub.get_or_create_copy("p1", SCRIPT, "xhs", None)
    assert calls["n"] == 1  # 缓存命中
    assert c1 == c2
    # 不同平台各自缓存
    pub.get_or_create_copy("p1", SCRIPT, "douyin", None)
    assert calls["n"] == 2


def test_copy_invalid_platform(proj_env):
    with pytest.raises(ValueError):
        pub.get_or_create_copy("p1", SCRIPT, "weibo", None)


def test_copy_script_change_invalidates(proj_env, monkeypatch):
    monkeypatch.setattr(pub, "_chat", lambda *a, **k: '{"title": "t", "desc": "d", "tags": []}')
    pub.get_or_create_copy("p1", SCRIPT, "douyin", None)
    s2 = SCRIPT.model_copy(deep=True)
    s2.title = "改过的标题"
    pub.get_or_create_copy("p1", s2, "douyin", None)  # 不抛错即重新生成
    data = json.loads((proj_env / "projects" / "p1" / "publish_copy.json").read_text(encoding="utf-8"))
    assert data["script_hash"] == pub._script_fingerprint(s2)


# ---------- 封面 ----------

def test_extract_cover_no_video(proj_env):
    (proj_env / "renders" / "p1").mkdir(parents=True)
    assert pub.extract_cover("p1") is None


def test_extract_cover_success(proj_env, monkeypatch):
    rdir = proj_env / "renders" / "p1"
    rdir.mkdir(parents=True)
    (rdir / "final.mp4").write_bytes(b"fake")
    fake_ff = proj_env / "fake-ffmpeg.exe"
    fake_ff.write_bytes(b"x")
    monkeypatch.setattr(pub, "FFMPEG_BIN", fake_ff)
    monkeypatch.setattr(pub, "_video_duration", lambda v: 100.0)

    def fake_run(cmd, timeout, check, stdout, stderr):
        open(cmd[-1], "wb").write(b"jpeg")

    monkeypatch.setattr(pub.subprocess, "run", fake_run)
    cover = pub.extract_cover("p1", at_ratio=0.1)
    assert cover is not None and cover.name == "cover.jpg"


# ---------- 抖音 OAuth / 发布 ----------

def test_douyin_status_not_configured(monkeypatch):
    monkeypatch.delenv("DOUYIN_CLIENT_KEY", raising=False)
    monkeypatch.delenv("DOUYIN_CLIENT_SECRET", raising=False)
    st = client.get("/api/publish/douyin/status").json()
    assert st["configured"] is False and st["authorized"] is False


def test_douyin_authorize_url_requires_config(monkeypatch):
    monkeypatch.delenv("DOUYIN_CLIENT_KEY", raising=False)
    r = client.post("/api/publish/douyin/authorize-url")
    assert r.status_code == 400


def test_douyin_authorize_url_ok(monkeypatch):
    monkeypatch.setenv("DOUYIN_CLIENT_KEY", "k1")
    monkeypatch.setenv("DOUYIN_REDIRECT_URI", "http://localhost:8000/api/publish/douyin/callback")
    r = client.post("/api/publish/douyin/authorize-url").json()
    assert r["url"].startswith("https://open.douyin.com/platform/oauth/connect/")
    assert "client_key=k1" in r["url"] and "state=" in r["url"]


def test_douyin_exchange_success(proj_env, monkeypatch):
    monkeypatch.setenv("DOUYIN_CLIENT_KEY", "k1")
    monkeypatch.setenv("DOUYIN_CLIENT_SECRET", "s1")

    class FakeResp:
        def raise_for_status(self): pass
        def json(self):
            return {"code": 0, "data": {"access_token": "at", "refresh_token": "rt",
                                        "open_id": "oid", "expires_in": 86400}}

    monkeypatch.setattr(pub.httpx, "post", lambda *a, **k: FakeResp())
    out = client.post("/api/publish/douyin/exchange", json={"code": "abc"})
    assert out.json()["authorized"] is True
    token = pub._douyin_load_token()
    assert token["access_token"] == "at" and token["open_id"] == "oid"
    assert pub.douyin_authorized() is True


def test_douyin_publish_flow(proj_env, monkeypatch):
    monkeypatch.setenv("DOUYIN_CLIENT_KEY", "k1")
    monkeypatch.setenv("DOUYIN_CLIENT_SECRET", "s1")
    _fake_project(monkeypatch, proj_env, "p9")
    rdir = proj_env / "renders" / "p9"
    rdir.mkdir(parents=True)
    (rdir / "final.mp4").write_bytes(b"v")
    pub.TOKENS_DIR.mkdir(parents=True, exist_ok=True)
    (pub.TOKENS_DIR / "douyin.json").write_text(json.dumps(
        {"access_token": "at", "expires_at": pub.time.time() + 999}), encoding="utf-8")

    calls = []

    class FakeResp:
        def __init__(self, body):
            self.body = body
        def raise_for_status(self): pass
        def json(self): return self.body

    def fake_post(url, **kw):
        calls.append(url)
        if "/video/upload/" in url:
            assert "video" in kw["files"]
            return FakeResp({"code": 0, "data": {"video": {"video_id": "vid1"}}})
        assert kw["json"] == {"video_id": "vid1", "text": "标题 描述 #地球"}
        return FakeResp({"code": 0, "data": {"item_id": "item9"}})

    monkeypatch.setattr(pub.httpx, "post", fake_post)
    out = client.post("/api/projects/p9/publish/douyin",
                      json={"title": "标题", "desc": "描述", "tags": ["地球"]})
    assert out.status_code == 200, out.text
    assert out.json()["item_id"] == "item9"
    assert any("/video/upload/" in u for u in calls)
    assert any("/video/create/" in u for u in calls)


def test_douyin_publish_without_token(proj_env, monkeypatch):
    _fake_project(monkeypatch, proj_env, "p10")
    rdir = proj_env / "renders" / "p10"
    rdir.mkdir(parents=True)
    (rdir / "final.mp4").write_bytes(b"v")
    r = client.post("/api/projects/p10/publish/douyin", json={"title": "t"})
    assert r.status_code == 400 and "授权" in r.json()["detail"]


# ---------- 路由：打包 ----------

def test_publish_package_route(tmp_path, monkeypatch):
    # 走真实 app 但项目不存在 → 404
    r = client.get("/api/projects/nonexistent00/publish/package")
    assert r.status_code == 404
