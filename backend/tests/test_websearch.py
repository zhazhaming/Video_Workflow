# -*- coding: utf-8 -*-
"""网页搜索测试：RSS/DDG 解析、SSRF 拦截、正文清洗与研究资料聚合（全部 mock，不打真实网络）。"""
from contextlib import contextmanager

import httpx
import pytest

from app.services import websearch


class _FakeGetResp:
    """httpx.get 的替身：只需要 .text / .status_code / .raise_for_status。"""

    def __init__(self, text="", status=200):
        self.text = text
        self.status_code = status

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError("err", request=None, response=None)


@pytest.fixture
def public_dns(monkeypatch):
    """把 DNS 解析指到公网 IP，避免单测触网。"""
    monkeypatch.setattr(
        websearch.socket, "getaddrinfo",
        lambda host, port: [(2, 1, 6, "", ("93.184.216.34", 0))],
    )


# ---------- search_web：Bing RSS 主源 ----------

RSS_XML = """<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"><channel><title>Bing</title>
<item>
  <title>热泵原理详解</title>
  <link>https://energy.example.com/heat-pump</link>
  <description>热泵是一种高效的制热设备</description>
</item>
<item>
  <title><![CDATA[Bing 官方导航页]]></title>
  <link>https://www.bing.com/search?q=%E7%83%AD%E6%B3%B5</link>
  <description><![CDATA[Bing 内部聚合 &amp; 跳转页]]></description>
</item>
<item>
  <title>储能市场 &quot;年度报告&quot;</title>
  <link>https://news.example.org/storage-2026</link>
  <description><![CDATA[报告称 <i>储能</i> 装机增长 30%]]></description>
</item>
</channel></rss>"""


def test_search_web_parses_bing_rss(monkeypatch):
    monkeypatch.setattr(websearch.httpx, "get", lambda url, **k: _FakeGetResp(RSS_XML))
    results = websearch.search_web("热泵")
    assert len(results) == 2  # bing.com 内部链接被跳过
    assert results[0]["title"] == "热泵原理详解"
    assert results[0]["url"] == "https://energy.example.com/heat-pump"
    assert results[0]["snippet"] == "热泵是一种高效的制热设备"
    assert results[0]["provider"] == "bing"
    assert results[1]["title"] == "储能市场 \"年度报告\""  # 实体反转义
    assert results[1]["snippet"] == "报告称 储能 装机增长 30%"  # CDATA + 内部标签剥离
    for r in results:
        assert set(r) == {"title", "url", "snippet", "provider"}


def test_search_web_caps_results(monkeypatch):
    monkeypatch.setattr(websearch.httpx, "get", lambda url, **k: _FakeGetResp(RSS_XML))
    assert len(websearch.search_web("热泵", max_results=1)) == 1


def test_search_web_empty_query(monkeypatch):
    monkeypatch.setattr(
        websearch.httpx, "get",
        lambda url, **k: (_ for _ in ()).throw(AssertionError("不应发请求")),
    )
    assert websearch.search_web("   ") == []


# ---------- search_web：DuckDuckGo 兜底 ----------

EMPTY_RSS = '<rss version="2.0"><channel></channel></rss>'

DDG_HTML = """
<div class="result">
  <h2><a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fenergy.example.com%2Fhp&amp;rut=ab">热泵 <b>原理</b></a></h2>
  <a class="result__snippet" href="#">热泵是高效设备</a>
</div>
<div class="result">
  <a class="result__a" href="https://direct.example.com/page">直连结果</a>
  <a class="result__snippet">直接摘要</a>
</div>
"""


def test_search_web_falls_back_to_ddg(monkeypatch):
    calls = []

    def fake_get(url, **kwargs):
        calls.append(url)
        if "cn.bing.com" in url:
            return _FakeGetResp(EMPTY_RSS)  # bing 正常应答但没有结果
        return _FakeGetResp(DDG_HTML)

    monkeypatch.setattr(websearch.httpx, "get", fake_get)
    results = websearch.search_web("热泵")
    assert any("duckduckgo" in c for c in calls)  # 确实触发了兜底
    assert len(results) == 2
    assert results[0]["provider"] == "ddg"
    assert results[0]["url"] == "https://energy.example.com/hp"  # uddg 跳转壳已解码
    assert results[0]["title"] == "热泵 原理"
    assert results[0]["snippet"] == "热泵是高效设备"
    assert results[1]["url"] == "https://direct.example.com/page"


def test_search_web_both_fail_raises(monkeypatch):
    def boom(url, **kwargs):
        raise httpx.ConnectError("网络不可达")

    monkeypatch.setattr(websearch.httpx, "get", boom)
    with pytest.raises(RuntimeError, match="搜索服务不可用"):
        websearch.search_web("anything")


# ---------- fetch_page_text：正文清洗 ----------

PAGE_HTML = """<html><head>
<style>body { color: red; }</style>
<title>页面标题</title>
</head><body>
<!-- 这是一段注释 var secret = 1; -->
<h1>第一章 标题</h1>
<script>var token = "abc";</script>
<p>正文   多  空格</p>
<noscript><p>无脚本内容</p></noscript>
<p>结尾段落 &amp; 符号</p><br/>下一行
</body></html>"""


def _install_page_stream(monkeypatch, data: bytes, status: int = 200, ctype: str = "text/html; charset=utf-8"):
    class _Resp:
        def __init__(self):
            self.status_code = status
            self.headers = {"content-type": ctype}

        def raise_for_status(self):
            if self.status_code >= 400:
                raise httpx.HTTPStatusError("err", request=None, response=None)

        def iter_bytes(self, n):
            for i in range(0, len(data), n):
                yield data[i:i + n]

    @contextmanager
    def _ctx(method, url, **kwargs):
        yield _Resp()

    monkeypatch.setattr(websearch.httpx, "stream", _ctx)


def test_fetch_page_text_cleans_html(monkeypatch, public_dns):
    _install_page_stream(monkeypatch, PAGE_HTML.encode("utf-8"))
    text = websearch.fetch_page_text("https://docs.example.com/article")
    assert "第一章 标题" in text
    assert "正文 多 空格" in text  # 连续空白折叠
    assert "结尾段落 & 符号" in text  # 实体反转义
    assert "下一行" in text
    assert "var token" not in text and "color: red" not in text
    assert "这是一段注释" not in text and "无脚本内容" not in text
    assert "<" not in text  # 标签剥干净


def test_fetch_page_text_caps_chars(monkeypatch, public_dns):
    _install_page_stream(monkeypatch, PAGE_HTML.encode("utf-8"))
    text = websearch.fetch_page_text("https://docs.example.com/article", max_chars=12)
    assert 0 < len(text) <= 12
    assert "第一章" in websearch.fetch_page_text("https://docs.example.com/article", max_chars=40)


def test_fetch_page_text_non_2xx_returns_empty(monkeypatch, public_dns):
    _install_page_stream(monkeypatch, b"<html>blocked</html>", status=403)
    assert websearch.fetch_page_text("https://docs.example.com/x") == ""


def test_fetch_page_text_rejects_binary_content_type(monkeypatch, public_dns):
    _install_page_stream(monkeypatch, b"\x00\x01\x02binary", ctype="application/octet-stream")
    assert websearch.fetch_page_text("https://docs.example.com/file") == ""


def test_fetch_page_text_exception_returns_empty(monkeypatch, public_dns):
    @contextmanager
    def boom(method, url, **kwargs):
        raise RuntimeError("连接失败")
        yield  # pragma: no cover

    monkeypatch.setattr(websearch.httpx, "stream", boom)
    assert websearch.fetch_page_text("https://docs.example.com/x") == ""


# ---------- SSRF 防护 ----------


@pytest.mark.parametrize("bad", [
    "http://localhost/a.html",
    "http://127.0.0.1/a.html",
    "http://192.168.1.5/a.html",
    "http://10.0.0.2/a.html",
    "http://169.254.169.254/latest/meta-data",
    "ftp://example.com/a.html",
    "file:///C:/x.html",
])
def test_assert_public_url_blocks_private_and_bad_scheme(bad):
    with pytest.raises(ValueError):
        websearch._assert_public_url(bad)


def test_assert_public_url_blocks_resolved_private_ip(monkeypatch):
    monkeypatch.setattr(
        websearch.socket, "getaddrinfo",
        lambda host, port: [(2, 1, 6, "", ("10.0.0.9", 0))],
    )
    with pytest.raises(ValueError):
        websearch._assert_public_url("https://internal.example.com/admin")


def test_assert_public_url_accepts_public(monkeypatch):
    monkeypatch.setattr(
        websearch.socket, "getaddrinfo",
        lambda host, port: [(2, 1, 6, "", ("93.184.216.34", 0))],
    )
    websearch._assert_public_url("https://docs.example.com/article")  # 不抛即通过


def test_fetch_page_text_blocks_ssrf_targets(monkeypatch):
    # 无任何 mock：SSRF 目标必须在出网之前被拦截，且 fetch 尽力而为返回空串
    assert websearch.fetch_page_text("http://127.0.0.1/admin") == ""
    assert websearch.fetch_page_text("http://192.168.1.5/admin") == ""
    assert websearch.fetch_page_text("ftp://example.com/x") == ""


# ---------- gather_research_context ----------


def test_gather_research_context(monkeypatch, public_dns):
    monkeypatch.setattr(websearch.httpx, "get", lambda url, **k: _FakeGetResp(RSS_XML))
    pages = {
        "https://energy.example.com/heat-pump": PAGE_HTML,
        "https://news.example.org/storage-2026": "",  # 第二页抓不到正文
    }

    @contextmanager
    def fake_stream(method, url, **kwargs):
        data = pages[url].encode("utf-8")

        class _Resp:
            status_code = 200
            headers = {"content-type": "text/html; charset=utf-8"}

            def raise_for_status(self):
                return None

            def iter_bytes(self, n):
                for i in range(0, len(data), n):
                    yield data[i:i + n]

        yield _Resp()

    monkeypatch.setattr(websearch.httpx, "stream", fake_stream)
    context, sources = websearch.gather_research_context("热泵", page_count=2)

    assert [s["url"] for s in sources] == list(pages)
    assert sources[0]["provider"] == "bing"
    assert sources[0]["fetched"] is True and sources[0]["text_len"] > 0
    assert sources[1]["fetched"] is False and sources[1]["text_len"] == 0
    assert "[#1]" in context and "[#2]" in context
    assert "URL: https://energy.example.com/heat-pump" in context
    assert context.strip().endswith("以上为网络检索资料，仅供撰写时引用出处。")
