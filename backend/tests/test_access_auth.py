# -*- coding: utf-8 -*-
"""访问口令认证测试：未启用时全放行；启用后 401/三种携带方式/login 种 Cookie。"""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    # 独立 TestClient（不动真实数据；middleware 只读 env）
    return TestClient(app)


def test_auth_disabled_when_no_token(client, monkeypatch):
    monkeypatch.setenv("ACCESS_TOKEN", "")
    assert client.get("/api/health").status_code == 200
    r = client.get("/api/projects")
    assert r.status_code in (200, 500)  # 无 token 也放行（业务结果取决于环境）


def test_auth_enabled_401_without_token(client, monkeypatch):
    monkeypatch.setenv("ACCESS_TOKEN", "sec1")
    r = client.get("/api/pipeline/status")
    assert r.status_code == 401
    assert "未授权" in r.json()["detail"]


def test_auth_header_and_query_and_cookie(client, monkeypatch):
    monkeypatch.setenv("ACCESS_TOKEN", "sec1")
    assert client.get("/api/pipeline/status", headers={"X-Access-Token": "sec1"}).status_code == 200
    assert client.get("/api/pipeline/status?token=sec1").status_code == 200
    assert client.get("/api/pipeline/status", cookies={"vw_token": "sec1"}).status_code == 200
    assert client.get("/api/pipeline/status", headers={"X-Access-Token": "wrong"}).status_code == 401


def test_health_and_login_exempt(client, monkeypatch):
    monkeypatch.setenv("ACCESS_TOKEN", "sec1")
    assert client.get("/api/health").status_code == 200
    r = client.post("/api/access/login", json={"token": "wrong"})
    assert r.status_code == 401
    r = client.post("/api/access/login", json={"token": "sec1"})
    assert r.status_code == 200 and r.json()["ok"] is True
    assert "vw_token" in r.cookies  # 登录种 Cookie（媒体标签自动携带）


def test_non_api_paths_exempt(client, monkeypatch):
    monkeypatch.setenv("ACCESS_TOKEN", "sec1")
    assert client.get("/").status_code in (200, 404)  # 非 /api 不拦
