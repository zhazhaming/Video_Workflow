# -*- coding: utf-8 -*-
"""免版权图片搜索测试：归一化 / NC-ND 过滤 / 合并去重 / 下载校验（全部 mock，不打真实网络）。"""
import io
import os
from contextlib import contextmanager

import httpx
import pytest
from PIL import Image

from app.services import pic_search

CONTRACT_KEYS = {
    "id", "provider", "title", "creator", "license",
    "page_url", "image_url", "thumb_url", "width", "height",
}


class _FakeResp:
    def __init__(self, payload, status=200):
        self._payload = payload
        self.status_code = status

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError("err", request=None, response=None)

    def json(self):
        return self._payload


@pytest.fixture
def public_dns(monkeypatch):
    """把 DNS 解析指到公网 IP，避免单测触网。"""
    monkeypatch.setattr(
        pic_search.socket, "getaddrinfo",
        lambda host, port: [(2, 1, 6, "", ("93.184.216.34", 0))],
    )


def _isolated_commons(monkeypatch, payload=None):
    """把 Commons 的 curl 子进程请求隔离掉，可注入假响应。"""
    monkeypatch.setattr(pic_search, "_curl_json", lambda url: payload if payload is not None else {"query": {}})


# ---------- 命名/后缀清洗 ----------


def test_sanitize_slug():
    assert pic_search._sanitize_slug("深蓝 Sky/01") == "sky-01"
    assert pic_search._sanitize_slug("My_Cool-Photo 2") == "my_cool-photo-2"
    assert pic_search._sanitize_slug("!!!") == "img"
    assert pic_search._sanitize_slug("") == "img"
    assert pic_search._sanitize_slug("x" * 100) == "x" * 48


def test_ext_from_url_whitelist():
    assert pic_search._ext_from_url("https://a.example/x/pic.webp") == ".webp"
    assert pic_search._ext_from_url("https://a.example/x/pic.jpeg") == ".jpeg"
    assert pic_search._ext_from_url("https://a.example/x/pic") == ".jpg"
    assert pic_search._ext_from_url("https://a.example/x/pic.gif?w=1") == ".jpg"  # 白名单外兜底


# ---------- SSRF 防护 ----------


@pytest.mark.parametrize("bad", [
    "http://localhost/a.png",
    "http://127.0.0.1/a.png",
    "http://192.168.1.5/a.png",
    "http://169.254.169.254/latest/meta-data",
    "ftp://example.com/a.png",
    "file:///C:/x.png",
])
def test_assert_public_url_blocks_private_and_bad_scheme(bad):
    with pytest.raises(ValueError):
        pic_search._assert_public_url(bad)


def test_assert_public_url_accepts_public(monkeypatch):
    monkeypatch.setattr(
        pic_search.socket, "getaddrinfo",
        lambda host, port: [(2, 1, 6, "", ("93.184.216.34", 0))],
    )
    pic_search._assert_public_url("https://cdn.example.com/pic.png")  # 不抛即通过


# ---------- Openverse 归一化 ----------

OV_ITEM = {
    "id": "1",
    "title": "Blue Sky",
    "creator": "Ann",
    "url": "https://cdn.example.com/1.jpg",
    "thumbnail": "https://cdn.example.com/1_thumb.jpg",
    "foreign_landing_url": "https://ov.example.com/1",
    "license": "by",
    "license_version": "4.0",
    "width": 800,
    "height": 600,
}


def test_openverse_normalization_contract(monkeypatch):
    monkeypatch.setattr(pic_search.httpx, "get", lambda url, **k: _FakeResp({"results": [OV_ITEM]}))
    _isolated_commons(monkeypatch)
    results = pic_search.search_images("sky")
    assert len(results) == 1
    n = results[0]
    assert set(n) == CONTRACT_KEYS  # 契约键一个不多一个不少
    assert n["id"] == "openverse:1"
    assert n["provider"] == "openverse"
    assert n["title"] == "Blue Sky"
    assert n["creator"] == "Ann"
    assert n["license"].startswith("CC BY")
    assert n["page_url"] == "https://ov.example.com/1"
    assert n["image_url"] == "https://cdn.example.com/1.jpg"
    assert n["thumb_url"] == "https://cdn.example.com/1_thumb.jpg"
    assert (n["width"], n["height"]) == (800, 600)


OV_PAYLOAD = {
    "results": [
        OV_ITEM,
        {"id": "2", "title": "NC Photo", "url": "https://cdn.example.com/2.jpg",
         "license": "by-nc", "license_version": "4.0", "width": 800, "height": 600},
        {"id": "3", "title": "NC-ND Photo", "url": "https://cdn.example.com/3.jpg",
         "license": "by-nc-nd", "license_version": "4.0"},
        {"id": "4", "title": "CC0 Photo", "url": "https://cdn.example.com/4.jpg", "license": "cc0"},
        {"id": "5", "title": "No url", "license": "cc0"},  # 无直链，丢弃
    ]
}


def test_openverse_filters_nc_nd(monkeypatch):
    monkeypatch.setattr(pic_search.httpx, "get", lambda url, **k: _FakeResp(OV_PAYLOAD))
    _isolated_commons(monkeypatch)
    results = pic_search.search_images("sky", per_provider=10)
    assert [r["id"] for r in results] == ["openverse:1", "openverse:4"]  # NC/ND/无 url 全部过滤


def test_openverse_token_header(monkeypatch):
    captured = {}

    def fake_get(url, **kwargs):
        captured.update(kwargs)
        return _FakeResp({"results": [{"id": "1", "url": "https://cdn.example.com/1.jpg", "license": "cc0"}]})

    monkeypatch.setattr(pic_search.httpx, "get", fake_get)
    _isolated_commons(monkeypatch)
    monkeypatch.delenv("OPENVERSE_TOKEN", raising=False)
    pic_search.search_images("sky")
    assert "Authorization" not in (captured.get("headers") or {})
    monkeypatch.setenv("OPENVERSE_TOKEN", "tok-123")
    pic_search.search_images("sky")
    assert captured["headers"]["Authorization"] == "Bearer tok-123"


# ---------- Commons 归一化 ----------


def _commons_page(pageid, title, url, license_name="CC BY-SA 4.0", width=1024, height=768):
    return {
        "pageid": pageid,
        "title": title,
        "imageinfo": [
            {
                "url": url,
                "thumburl": url.replace(".jpg", "_thumb.jpg").replace(".png", "_thumb.png"),
                "descriptionurl": f"https://commons.wikimedia.org/wiki/{title.replace(' ', '_')}",
                "width": width,
                "height": height,
                "extmetadata": {
                    "LicenseShortName": {"value": license_name},
                    "Artist": {"value": "<a href='x'>Authors</a>"},
                },
            }
        ],
    }


def _commons_payload(*pages):
    return {"query": {"pages": {str(p["pageid"]): p for p in pages}}}


def test_commons_normalization(monkeypatch):
    payload = _commons_payload(_commons_page(7, "File:Sky line.jpg", "https://upload.example.org/7.jpg"))
    monkeypatch.setattr(pic_search.httpx, "get", lambda url, **k: _FakeResp({"results": []}))
    _isolated_commons(monkeypatch, payload)
    results = pic_search.search_images("sky")
    assert len(results) == 1
    n = results[0]
    assert set(n) == CONTRACT_KEYS
    assert n["id"] == "commons:7"
    assert n["provider"] == "commons"
    assert n["title"] == "Sky line"  # File: 前缀与扩展名已剥掉
    assert n["creator"] == "Authors"  # extmetadata 的 html 已剥
    assert n["license"].startswith("CC BY")
    assert n["thumb_url"] == "https://upload.example.org/7_thumb.jpg"
    assert n["page_url"] == "https://commons.wikimedia.org/wiki/File:Sky_line.jpg"
    assert n["image_url"] == "https://upload.example.org/7.jpg"
    assert (n["width"], n["height"]) == (1024, 768)


@pytest.mark.parametrize("lic", ["CC BY-NC 3.0", "CC BY-NC-ND 4.0", "Fair use"])
def test_commons_filters_unsafe_licenses(lic):
    page = _commons_page(7, "File:x.jpg", "https://upload.example.org/x.jpg", license_name=lic)
    assert pic_search._norm_commons(page) is None


# ---------- 聚合：合并 / 去重 / 上限 / 降级 ----------


def test_search_images_merges_and_dedupes(monkeypatch):
    ov = {"results": [
        {"id": "a", "title": "A", "url": "https://cdn.example.com/a.jpg", "license": "cc0"},
        {"id": "b", "title": "B", "url": "https://cdn.example.com/b.jpg", "license": "by"},
    ]}
    monkeypatch.setattr(pic_search.httpx, "get", lambda url, **k: _FakeResp(ov))
    _isolated_commons(
        monkeypatch,
        _commons_payload(
            _commons_page(7, "File:A.jpg", "https://cdn.example.com/a.jpg"),  # 与 openverse 重复
            _commons_page(9, "File:C.png", "https://upload.example.org/c.png", license_name="CC0 1.0"),
        ),
    )
    results = pic_search.search_images("sky")
    assert [r["id"] for r in results] == ["openverse:a", "openverse:b", "commons:9"]


def test_search_images_caps_per_provider(monkeypatch):
    ov = {"results": [
        {"id": str(i), "title": f"T{i}", "url": f"https://cdn.example.com/{i}.jpg", "license": "cc0"}
        for i in range(6)
    ]}
    monkeypatch.setattr(pic_search.httpx, "get", lambda url, **k: _FakeResp(ov))
    _isolated_commons(monkeypatch)
    results = pic_search.search_images("sky", per_provider=2)
    assert len(results) == 2
    assert all(r["provider"] == "openverse" for r in results)


def test_search_images_degrades_to_commons(monkeypatch):
    def boom(url, **k):
        raise httpx.ConnectError("openverse 不可达")

    monkeypatch.setattr(pic_search.httpx, "get", boom)
    _isolated_commons(
        monkeypatch,
        _commons_payload(_commons_page(7, "File:Sky.jpg", "https://upload.example.org/7.jpg")),
    )
    results = pic_search.search_images("sky")
    assert [r["provider"] for r in results] == ["commons"]


def test_search_images_zero_results_raises(monkeypatch):
    monkeypatch.setattr(pic_search.httpx, "get", lambda url, **k: _FakeResp({"results": []}))
    _isolated_commons(monkeypatch)
    with pytest.raises(RuntimeError, match="图片搜索无结果"):
        pic_search.search_images("nothing-matches")


def test_search_images_both_providers_error_raises(monkeypatch):
    def boom(url, **k):
        raise httpx.ConnectError("网络不可达")

    def boom_json(url):
        raise RuntimeError("curl 失败")

    monkeypatch.setattr(pic_search.httpx, "get", boom)
    monkeypatch.setattr(pic_search, "_curl_json", boom_json)
    with pytest.raises(RuntimeError, match="图片搜索无结果"):
        pic_search.search_images("sky")


# ---------- download_image：下载 + 校验 ----------


def _png_bytes(width, height, noise=False):
    buf = io.BytesIO()
    if noise:
        Image.frombytes("RGB", (width, height), os.urandom(width * height * 3)).save(buf, format="PNG")
    else:
        Image.new("RGB", (width, height), (30, 60, 200)).save(buf, format="PNG")
    return buf.getvalue()


def _install_stream(monkeypatch, data: bytes, status: int = 200):
    """用假流替代 httpx.stream，按 64KB 分块喂字节。"""

    class _Resp:
        def __init__(self):
            self.status_code = status
            self.headers = {"content-type": "image/png"}

        def raise_for_status(self):
            if self.status_code >= 400:
                raise httpx.HTTPStatusError("err", request=None, response=None)

        def iter_bytes(self, n):
            for i in range(0, len(data), n):
                yield data[i:i + n]

    @contextmanager
    def _ctx(method, url, **kwargs):
        yield _Resp()

    monkeypatch.setattr(pic_search.httpx, "stream", _ctx)


def test_download_image_valid_png(public_dns, monkeypatch, tmp_path):
    _install_stream(monkeypatch, _png_bytes(640, 600))
    out = pic_search.download_image("https://cdn.example.com/pics/sky-01.png", tmp_path, "深蓝 Sky/01")
    assert out == tmp_path / "sky-01.png"  # slug 清洗 + 白名单后缀
    assert out.exists()
    with Image.open(out) as im:
        assert im.size == (640, 600)
        assert im.mode == "RGB"  # 已转 RGB 重存


def test_download_image_jpg(public_dns, monkeypatch, tmp_path):
    buf = io.BytesIO()
    Image.new("RGB", (512, 512), (10, 10, 10)).save(buf, format="JPEG")
    _install_stream(monkeypatch, buf.getvalue())
    out = pic_search.download_image("https://cdn.example.com/p/dark.jpg", tmp_path, "Dark Night")
    assert out.name == "dark-night.jpg"
    with Image.open(out) as im:
        assert im.size == (512, 512)
        assert im.mode == "RGB"


def test_download_image_rejects_low_resolution(public_dns, monkeypatch, tmp_path):
    _install_stream(monkeypatch, _png_bytes(320, 240))
    with pytest.raises(ValueError, match="分辨率过低"):
        pic_search.download_image("https://cdn.example.com/small.png", tmp_path, "small")
    assert list(tmp_path.iterdir()) == []  # 不保留不合格文件


def test_download_image_size_cap(public_dns, monkeypatch, tmp_path):
    monkeypatch.setattr(pic_search, "MAX_DOWNLOAD_BYTES", 1024)
    _install_stream(monkeypatch, _png_bytes(600, 400, noise=True))  # 不可压缩噪声图，必超限
    with pytest.raises(ValueError, match="下载上限"):
        pic_search.download_image("https://cdn.example.com/big.png", tmp_path, "big")
    assert list(tmp_path.iterdir()) == []  # 半成品也被清理


def test_download_image_blocks_ssrf(monkeypatch, tmp_path):
    with pytest.raises(ValueError):
        pic_search.download_image("http://127.0.0.1/pic.png", tmp_path, "x")
