# -*- coding: utf-8 -*-
"""网页搜索与正文抓取：Bing CN RSS（主，免密钥且国内可达）+ DuckDuckGo HTML（备）。

面向"六步流程"第 1 步"搜索"：为撰写环节提供可引用的网络检索资料（标题/链接/
摘要/正文节选）。选型只取免密钥、可直连的来源；页面正文抓取是尽力而为——
任何失败都降级为只用搜索摘要，绝不抛错阻断流程；抓取前做 SSRF 防护，
只允许公网 http/https 页面。
"""
import html
import ipaddress
import re
import socket
from urllib.parse import parse_qs, quote, urlparse

import httpx

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) video-workflow/0.1"
FETCH_TIMEOUT = 20
MAX_PAGE_BYTES = 2 * 1024 * 1024  # 正文最多读 2MB，防止超大页面占满内存

BING_RSS_URL = "https://cn.bing.com/search"
DDG_HTML_URL = "https://html.duckduckgo.com/html/"

_ITEM_RE = re.compile(r"<item[^>]*>(.*?)</item\s*>", re.S | re.I)
_ANCHOR_RE = re.compile(r"<a\b([^>]*)>(.*?)</a\s*>", re.S | re.I)
_HREF_RE = re.compile(r"""href\s*=\s*["']([^"']+)["']""", re.I)
_SNIPPET_RE = re.compile(r"<a\b[^>]*result__snippet[^>]*>(.*?)</a\s*>", re.S | re.I)

# Bing 自家的导航/聚合/翻译页不算有效检索结果
_JUNK_HOSTS = ("bing.com", "microsoft.com", "microsofttranslator.com", "msn.com")


# ---------- SSRF 防护（与 music_search 同一规则：只允许公网 http/https）----------


def _assert_public_url(url: str) -> None:
    p = urlparse(url)
    if p.scheme not in ("http", "https"):
        raise ValueError("仅支持 http/https 链接")
    host = p.hostname or ""
    if not host or host in ("localhost",) or host.endswith((".local", ".internal")):
        raise ValueError("不允许本地/内网地址")
    try:
        infos = socket.getaddrinfo(host, None)
    except OSError as e:
        raise ValueError(f"无法解析主机：{host}") from e
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
            or ip.is_unspecified
        ):
            raise ValueError("不允许内网/保留地址")


# ---------- 文本清洗工具 ----------


def _tag_text(fragment: str) -> str:
    """RSS/HTML 片段 → 纯文本：解 CDATA、反转义实体、剥内部标签、折叠空白。"""
    s = re.sub(r"<!\[CDATA\[(.*?)\]\]>", r"\1", fragment, flags=re.S)
    s = html.unescape(s)
    s = re.sub(r"<[^>]+>", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def _extract_text(raw_html: str, max_chars: int = 6000) -> str:
    """网页 HTML → 正文纯文本：先去脚本/样式/注释，再剥标签、反转义、折叠空白。"""
    s = re.sub(r"<!--.*?-->", " ", raw_html, flags=re.S)
    s = re.sub(r"(?is)<(script|style|noscript|iframe|svg|template)\b[^>]*>.*?</\1\s*>", " ", s)
    s = re.sub(r"(?is)<(?:script|style|noscript)\b[^>]*/?>", " ", s)  # 未闭合的残缺标签
    s = re.sub(r"(?i)<br\s*/?>", "\n", s)
    s = re.sub(r"(?i)</(p|div|li|tr|h[1-6]|section|article|blockquote|table)>", "\n", s)
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s)
    s = re.sub(r"[ \t\r\f\v]+", " ", s)
    s = re.sub(r"\n\s*\n+", "\n", s)
    return s.strip()[:max_chars]


# ---------- 搜索源 ----------


def _field(block: str, tag: str) -> str:
    m = re.search(rf"<{tag}\b[^>]*>(.*?)</{tag}\s*>", block, re.S | re.I)
    return _tag_text(m.group(1)) if m else ""


def _is_junk_host(url: str) -> bool:
    host = (urlparse(url).hostname or "").lower()
    return any(host == h or host.endswith("." + h) for h in _JUNK_HOSTS)


def _search_bing(query: str, max_results: int) -> list[dict]:
    """Bing 中国站 RSS 检索（免密钥、国内可达）：解析 item 的 title/link/description。"""
    url = f"{BING_RSS_URL}?q={quote(query)}&format=rss&count={max_results + 4}"
    r = httpx.get(url, headers={"User-Agent": UA}, timeout=FETCH_TIMEOUT, follow_redirects=True)
    r.raise_for_status()
    out: list[dict] = []
    for block in _ITEM_RE.findall(r.text):
        link = _field(block, "link")
        if not link.startswith("http") or _is_junk_host(link):
            continue  # 非直链 / Bing 内部聚合页
        out.append(
            {
                "title": _field(block, "title") or link,
                "url": link,
                "snippet": _field(block, "description"),
                "provider": "bing",
            }
        )
    return out


def _unwrap_ddg_href(href: str) -> str:
    """DDG 结果链接常是 /l/?uddg=<urlencoded> 跳转壳，解出真实地址。"""
    href = html.unescape((href or "").strip())
    if href.startswith("//"):
        href = "https:" + href
    p = urlparse(href)
    if p.path.startswith("/l/"):
        real = (parse_qs(p.query).get("uddg") or [""])[0]
        if real:
            return real
    return href


def _search_ddg(query: str, max_results: int) -> list[dict]:
    """DuckDuckGo HTML 检索（免密钥兜底）：正则抽 result__a 锚点与 result__snippet。"""
    r = httpx.get(
        DDG_HTML_URL, params={"q": query}, headers={"User-Agent": UA},
        timeout=FETCH_TIMEOUT, follow_redirects=True,
    )
    r.raise_for_status()
    anchors = [(m, m.group(2)) for m in _ANCHOR_RE.finditer(r.text) if "result__a" in m.group(1)]
    out: list[dict] = []
    for i, (m, inner) in enumerate(anchors):
        href_m = _HREF_RE.search(m.group(1))
        if not href_m:
            continue
        real = _unwrap_ddg_href(href_m.group(1))
        if not real.startswith("http"):
            continue
        region_end = anchors[i + 1][0].start() if i + 1 < len(anchors) else len(r.text)
        snippet_m = _SNIPPET_RE.search(r.text, m.end(), region_end)
        snippet = _tag_text(snippet_m.group(1)) if snippet_m else ""
        out.append({"title": _tag_text(inner) or real, "url": real, "snippet": snippet, "provider": "ddg"})
        if len(out) >= max_results:
            break
    return out


_STOPWORDS_RE = re.compile(r"[的地了吗呢吧啊与和及]")
_HISTORY_SUFFIXES = ("简史", "发展史", "演变史")


def _query_variants(query: str) -> list[str]:
    """生成查询变体：Bing 对长中文连句分词易失败（"人工智能的发展简史"会退化成
    匹配"人工"），拆成空格分隔的变体稳定命中；"发展简史"类复合词再拆一层。"""
    base = query.strip()
    variants = [base]
    relaxed = re.sub(r"\s+", " ", _STOPWORDS_RE.sub(" ", base)).strip()
    if relaxed and relaxed != base:
        variants.append(relaxed)
    tokens = relaxed.split() or base.split()
    split = []
    for t in tokens:
        rep = next((s for s in _HISTORY_SUFFIXES if t.endswith(s) and len(t) > len(s)), None)
        split.append(f"{t[: len(t) - len(rep)]} 历史" if rep else t)
    joined = " ".join(split)
    if joined and joined not in variants:
        variants.append(joined)
    return variants


def _lcs_len(a: str, b: str) -> int:
    """最长公共子串长度（标题与查询核心词的重合度，用于把跑题结果排后）。"""
    if not a or not b:
        return 0
    prev = [0] * (len(b) + 1)
    best = 0
    for ca in a:
        cur = [0] * (len(b) + 1)
        for j, cb in enumerate(b, 1):
            if ca == cb:
                cur[j] = prev[j - 1] + 1
                if cur[j] > best:
                    best = cur[j]
        prev = cur
    return best


def search_web(query: str, max_results: int = 8) -> list[dict]:
    """网页搜索：Bing CN RSS 优先（多查询变体合并），无结果/失败时降级 DuckDuckGo。

    返回 [{"title", "url", "snippet", "provider"}]，按与查询核心词的标题重合度排序，
    最多 max_results 条；两个源对所有变体都失败才抛 RuntimeError。
    """
    query = (query or "").strip()
    if not query:
        return []
    core = _STOPWORDS_RE.sub("", query) or query
    merged: list[dict] = []
    seen: set[str] = set()
    errors: list[str] = []
    for v in _query_variants(query):
        items: list[dict] = []
        try:
            items = _search_bing(v, max_results)
        except Exception as e:  # noqa: BLE001 — 主源失败降级
            errors.append(f"bing: {e}")
        if not items:
            try:
                items = _search_ddg(v, max_results)
            except Exception as e:  # noqa: BLE001 — 兜底源也失败
                errors.append(f"ddg: {e}")
        for it in items:
            u = it.get("url") or ""
            if u and u not in seen:
                seen.add(u)
                merged.append(it)
    if not merged:
        if len(errors) >= 2:  # 至少一个变体上两个源都不可用
            raise RuntimeError("搜索服务不可用（Bing 与 DuckDuckGo 均失败）")
        return []  # 有源正常应答但确实搜不到
    merged.sort(key=lambda it: _lcs_len(it.get("title") or "", core), reverse=True)
    return merged[:max_results]


# ---------- 正文抓取（尽力而为，永不抛错）----------


def fetch_page_text(url: str, max_chars: int = 6000) -> str:
    """抓取网页正文：SSRF 防护 → 流式读取（≤2MB）→ 清洗为纯文本并截断。

    仅接受 2xx 与文本类 content-type（text/* 或 html/xml/json）；
    任何异常一律返回空串，由调用方降级为只用搜索摘要。
    """
    try:
        _assert_public_url(url)
        headers = {
            "User-Agent": UA,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.5",
        }
        with httpx.stream(
            "GET", url, headers=headers, timeout=FETCH_TIMEOUT, follow_redirects=True
        ) as r:
            if not (200 <= r.status_code < 300):
                return ""
            ctype_header = r.headers.get("content-type") or ""
            ctype = ctype_header.split(";")[0].strip().lower()
            if ctype and not (ctype.startswith("text/") or re.search(r"html|xml|json", ctype)):
                return ""  # 二进制等非文本内容不抓
            chunks: list[bytes] = []
            total = 0
            for chunk in r.iter_bytes(64 * 1024):
                chunks.append(chunk)
                total += len(chunk)
                if total >= MAX_PAGE_BYTES:
                    break
        charset_m = re.search(r"charset=([\w-]+)", ctype_header, re.I)
        raw = b"".join(chunks)
        try:
            text = raw.decode(charset_m.group(1) if charset_m else "utf-8", "replace")
        except (LookupError, ValueError):
            text = raw.decode("utf-8", "replace")
        return _extract_text(text, max_chars)
    except Exception:  # noqa: BLE001 — 页面抓取尽力而为，失败一律降级
        return ""


# ---------- 研究资料聚合 ----------


def _alt_query(query: str) -> str:
    """生成备用检索词：优先取括注里的英文标识（GitHub 仓库名/产品名命中率高），
    否则去掉标点压缩成关键词串。返回空串表示没有可用的备用词。"""
    m = re.search(r"[（(]([^（）()]{2,40})[）)]", query)
    if m:
        alt = m.group(1).strip()
        if alt and alt != query.strip():
            return alt
    simplified = re.sub(r"[^\w\u4e00-\u9fff]+", " ", query).strip()
    simplified = re.sub(r"\s+", " ", simplified)
    if simplified and simplified != query.strip():
        return simplified[:24]
    return ""


def _tokens(s: str) -> set[str]:
    """检索词/结果的特征 token：拉丁词（≥2 字符，小写）+ 中文二元组。"""
    out = {m.group(0).lower() for m in re.finditer(r"[A-Za-z0-9]{2,}", s or "")}
    for seg in re.findall(r"[\u4e00-\u9fff]+", s or ""):
        out.add(seg) if len(seg) <= 2 else out.update(seg[i:i + 2] for i in range(len(seg) - 1))
    return out


def _rank_by_overlap(items: list[dict], queries: list[str]) -> list[dict]:
    """按「结果与任一检索词的 token 重合数」降序稳定排序。

    多查询合并后用于把真正贴题的结果排到抓取队列前面（标题含 GitHub 仓库名/
    产品名的条目优先于同字偶合的跑题结果）。
    """
    qtoks: set[str] = set()
    for q in queries:
        qtoks |= _tokens(q)

    def score(item: dict) -> int:
        hay = _tokens(
            f"{item.get('title') or ''} {item.get('snippet') or ''} {item.get('url') or ''}"
        )
        return len(hay & qtoks)

    return sorted(items, key=score, reverse=True)


def gather_research_context(query: str, page_count: int = 4) -> tuple[str, list[dict]]:
    """搜索并抓取正文，产出撰写用上下文。

    返回 (context, sources)：sources 在搜索结果上补充 fetched（正文是否抓到）与
    text_len；context 用 [#N] 编号引用各来源（标题 + URL + 摘要 + 正文节选），
    结尾附一行出处提醒，供撰写时引用、不把网络内容当作已核实事实。

    检索词双路并行：原句（口语长句易被搜索引擎带跑，如"解放双手，AI帮我投简历"
    命中电视剧《解放》）+ 备用词（括注英文名/去标点关键词），两路结果合并去重、
    按与检索词的 token 重合度重排后再抓正文——保证精确命中的结果（GitHub 仓库/
    知乎专栏）稳定排在前面。
    """

    def _build(results: list[dict], limit: int) -> tuple[str, list[dict]]:
        parts: list[str] = []
        sources: list[dict] = []
        for i, item in enumerate(results[: max(1, limit)], start=1):
            text = fetch_page_text(item["url"])
            src = dict(item)
            src["fetched"] = bool(text)
            src["text_len"] = len(text)
            sources.append(src)
            body = (item.get("snippet") or "").strip()
            if text:  # 抓到正文则正文节选优先，否则只用搜索摘要
                body = (body + "\n" + text[:4000]).strip()
            parts.append(f"[#{i}] {src.get('title') or ''}\nURL: {src['url']}\n摘要+正文节选: {body}")
        context = "\n\n".join(parts) + "\n\n以上为网络检索资料，仅供撰写时引用出处。"
        return context, sources

    results = search_web(query, max_results=max(6, page_count + 2))
    alt = _alt_query(query)
    extra: list[dict] = []
    if alt:
        try:
            extra = search_web(alt, max_results=max(6, page_count + 2))
        except Exception:  # noqa: BLE001 — 备用词失败不阻断
            extra = []
    seen = {r.get("url") for r in results}
    merged = list(results) + [r for r in extra if r.get("url") and r["url"] not in seen]
    if extra and merged:
        merged = _rank_by_overlap(merged, [query, alt])
    context, sources = _build(merged, page_count + (2 if extra else 0))
    return context, sources
