# -*- coding: utf-8 -*-
"""在线曲库搜索测试：结果归一化 / SSRF 拦截 / 单源失败降级（全部 mock，不打真实网络）。"""
import httpx
import pytest

from app.services import music_search


# ---------- URL 安全防护 ----------

@pytest.mark.parametrize("bad", [
    "http://localhost/a.mp3",
    "http://127.0.0.1/a.mp3",
    "http://192.168.1.5/a.mp3",
    "http://10.0.0.2/a.mp3",
    "http://169.254.169.254/latest/meta-data",
    "ftp://example.com/a.mp3",
    "file:///C:/x.mp3",
])
def test_assert_public_url_rejects_private_and_bad_scheme(bad):
    with pytest.raises(ValueError):
        music_search._assert_public_url(bad)


def test_assert_public_url_rejects_unresolvable(monkeypatch):
    def boom(*a, **k):
        raise OSError("no dns")
    monkeypatch.setattr(music_search.socket, "getaddrinfo", boom)
    with pytest.raises(ValueError):
        music_search._assert_public_url("https://no-such-host.invalid/a.mp3")


def test_assert_public_url_accepts_public(monkeypatch):
    monkeypatch.setattr(
        music_search.socket,
        "getaddrinfo",
        lambda host, port: [(2, 1, 6, "", ("93.184.216.34", 0))],
    )
    music_search._assert_public_url("https://example.com/audio/a.mp3")  # 不抛即通过


# ---------- 结果归一化 ----------

def test_norm_openverse():
    n = music_search._norm_openverse(
        {
            "id": "abc",
            "title": "Calm Piano",
            "creator": "Someone",
            "url": "https://cdn.example.com/calm.mp3",
            "foreign_landing_url": "https://openverse.org/x",
            "duration": 90500,
            "license": "by",
            "license_version": "4.0",
        }
    )
    assert n["title"] == "Calm Piano"
    assert n["duration"] == 90.5
    assert "CC BY" in n["license"]
    assert n["provider"] == "openverse"


def test_norm_openverse_requires_url():
    assert music_search._norm_openverse({"title": "x"}) is None


def test_norm_jamendo():
    n = music_search._norm_jamendo(
        {"id": "42", "name": "Rise", "artist_name": "A", "duration": 120, "audio": "https://x/42.mp3"}
    )
    assert n["title"] == "Rise"
    assert n["duration"] == 120.0
    assert n["url"].endswith("42.mp3")


def _commons_page(license_name="CC BY-SA 4.0"):
    return {
        "pageid": 7,
        "title": "File:Upbeat Theme.ogg",
        "imageinfo": [
            {
                "url": "https://upload.wikimedia.org/x/Upbeat_Theme.ogg",
                "extmetadata": {
                    "LicenseShortName": {"value": license_name},
                    "Artist": {"value": "<a href='x'>Some Author</a>"},
                },
            }
        ],
    }


def test_norm_commons_keeps_by_license_and_strips_html():
    n = music_search._norm_commons(_commons_page("CC BY 4.0"))
    assert n["title"] == "Upbeat Theme"
    assert n["creator"] == "Some Author"
    assert n["license"].startswith("CC BY")
    assert n["provider"] == "commons"


@pytest.mark.parametrize("lic", ["CC BY-NC 3.0", "CC BY-NC-ND 4.0", "Fair use"])
def test_norm_commons_filters_unsafe_licenses(lic):
    assert music_search._norm_commons(_commons_page(lic)) is None


def test_norm_commons_requires_url():
    assert music_search._norm_commons({"title": "File:x.ogg", "imageinfo": [{}]}) is None


# ---------- 聚合降级（mock httpx.get）----------

class _FakeResp:
    def __init__(self, payload, status=200):
        self._payload = payload
        self.status_code = status

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError("err", request=None, response=None)

    def json(self):
        return self._payload


def test_search_aggregates_and_degrades(monkeypatch):
    monkeypatch.setattr(music_search, "_curl_json", lambda url: {})  # commons 隔离

    def fake_get(url, **kwargs):
        if "openverse" in url:
            return _FakeResp({"results": [{"title": "A", "url": "https://cdn/a.mp3", "duration": 1000, "license": "cc0"}]})
        # jamendo 未配置 client_id → 服务内抛 RuntimeError
        raise RuntimeError("未配置 JAMENDO_CLIENT_ID")

    monkeypatch.setattr(music_search.httpx, "get", fake_get)
    r = music_search.search("piano")
    assert len(r["results"]) == 1
    assert r["providers"]["openverse"] is None
    assert "JAMENDO_CLIENT_ID" in (r["providers"]["jamendo"] or "")


def test_search_dedupes_by_url(monkeypatch):
    payload = {
        "results": [
            {"title": "A", "url": "https://cdn/same.mp3", "duration": 1000, "license": "cc0"},
            {"title": "A2", "url": "https://cdn/same.mp3", "duration": 1000, "license": "cc0"},
        ]
    }
    monkeypatch.setattr(music_search, "_curl_json", lambda url: {})  # commons 隔离
    monkeypatch.setattr(music_search.httpx, "get", lambda url, **k: _FakeResp(payload))
    monkeypatch.setattr(music_search, "_jamendo_client_id", lambda: "")
    r = music_search.search("x")
    assert len(r["results"]) == 1
