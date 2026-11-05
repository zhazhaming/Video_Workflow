# -*- coding: utf-8 -*-
"""热点源抓取器：多平台热榜 → 统一原始条目。

每个源一个 fetch_<platform> 函数，返回 list[dict]（原始热度、标签、链接），
归一化（去重 / 稳定 id / 热度归一）在 hotspot.py 里统一做。

抓取原则：单个源失败只影响自己（上层逐源捕获），带浏览器 UA 与对应 Referer，
超时从 config 读取，整体在 ThreadPoolExecutor 中并发执行。
"""
import html as _html
import json
import logging
import re
from datetime import date, timedelta
from urllib.parse import quote

import httpx

from ..config import HOTSPOT_TIMEOUT_SECONDS

log = logging.getLogger("hotspot")

_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)
_HEADERS = {
    "User-Agent": _UA,
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh;q=0.9",
}

# 各平台站内搜索直达链接（创作者点过去看真实内容）
SEARCH_URLS = {
    "douyin": "https://www.douyin.com/search/{}",
    "baidu": "https://www.baidu.com/s?wd={}",
    "toutiao": "https://so.toutiao.com/search?keyword={}",
    "zhihu": "https://www.zhihu.com/search?type=content&q={}",
    "bilibili": "https://search.bilibili.com/all?keyword={}",
    "weibo": "https://s.weibo.com/weibo?q={}",
    "xiaohongshu": "https://www.xiaohongshu.com/search_result?keyword={}",
    "github": "https://github.com/search?q={}",
}

# 已接入的热榜源（platform id → 展示名）
PLATFORM_NAMES = {
    "douyin": "抖音",
    "toutiao": "头条",
    "baidu": "百度",
    "zhihu": "知乎",
    "bilibili": "B站",
    "github": "GitHub",
}
# 反爬受限、待接入（前端展示"暂不可用"）
PENDING_PLATFORMS = {"weibo": "微博"}


def search_url(platform: str, keyword: str) -> str:
    tpl = SEARCH_URLS.get(platform)
    return tpl.format(quote(keyword)) if tpl else ""


# ---- 抖音热榜 ----

# label 数字 → 文案（未知数字显示空）
_DOUYIN_LABELS = {"0": "", "1": "热", "2": "新", "3": "热", "4": "爆", "5": "爆", "6": "火", "7": "荐", "8": "独家"}


def fetch_douyin(client: httpx.Client) -> list[dict]:
    url = "https://www.iesdouyin.com/web/api/v2/hotsearch/billboard/word/"
    r = client.get(url, headers={**_HEADERS, "Referer": "https://www.douyin.com/"})
    r.raise_for_status()
    words = r.json().get("word_list") or []
    items = []
    for i, w in enumerate(words):
        word = (w.get("word") or "").strip()
        if not word:
            continue
        hot = _to_float(w.get("hot_value"))
        items.append(
            {
                "title": word,
                "url": "",
                "hot": hot,
                "raw_hot": _fmt_hot(hot),
                "tag": _DOUYIN_LABELS.get(str(w.get("label", "")), ""),
                "summary": "",
            }
        )
    return items


# ---- 头条热榜 ----


def fetch_toutiao(client: httpx.Client) -> list[dict]:
    url = "https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc"
    r = client.get(url, headers={**_HEADERS, "Referer": "https://www.toutiao.com/"})
    r.raise_for_status()
    data = r.json().get("data") or []
    items = []
    for d in data:
        title = (d.get("Title") or "").strip()
        if not title:
            continue
        hot = _to_float(d.get("HotValue"))
        items.append(
            {
                "title": title,
                "url": d.get("Url") or "",
                "hot": hot,
                "raw_hot": _fmt_hot(hot),
                "tag": str(d.get("LabelDesc") or d.get("Label") or "").strip(),
                "summary": "",
            }
        )
    return items


# ---- 百度热搜 ----

_BAIDU_TAGS = {"1": "热", "2": "新", "3": "沸", "4": "爆", "5": "爆"}


def _baidu_walk(node, out: list):
    """百度返回嵌套 cards/content 结构，递归收集带 word 的条目。"""
    if isinstance(node, dict):
        word = (node.get("word") or "").strip()
        if word and "index" in node:
            out.append(node)
            return
        for v in node.values():
            _baidu_walk(v, out)
    elif isinstance(node, list):
        for v in node:
            _baidu_walk(v, out)


def fetch_baidu(client: httpx.Client) -> list[dict]:
    url = "https://top.baidu.com/api/board?platform=wise&tab=realtime"
    r = client.get(url, headers={**_HEADERS, "Referer": "https://top.baidu.com/board"})
    r.raise_for_status()
    out: list = []
    _baidu_walk(r.json().get("data", {}), out)
    seen: set[str] = set()
    items = []
    for d in out:
        word = d["word"]
        if word in seen:
            continue
        seen.add(word)
        items.append(
            {
                "title": word,
                "url": d.get("url") or "",
                "hot": None,  # 移动端接口无热度数值，用排名代理
                "raw_hot": "",
                "tag": _BAIDU_TAGS.get(str(d.get("hotTag", "")), ""),
                "summary": "",
            }
        )
    return items


# ---- 知乎热榜 ----


def fetch_zhihu(client: httpx.Client) -> list[dict]:
    url = "https://api.zhihu.com/topstory/hot-list?limit=50"
    r = client.get(url, headers={**_HEADERS, "Referer": "https://www.zhihu.com/hot"})
    r.raise_for_status()
    data = r.json().get("data") or []
    items = []
    for d in data:
        t = d.get("target") or {}
        title = (t.get("title") or "").strip()
        if not title:
            continue
        # api.zhihu.com/questions/xxx → www.zhihu.com/question/xxx
        qurl = str(t.get("url") or "")
        m = re.search(r"questions/(\d+)", qurl)
        link = f"https://www.zhihu.com/question/{m.group(1)}" if m else ""
        hot = _parse_wan(d.get("detail_text"))
        excerpt = re.sub(r"\s+", " ", str(t.get("excerpt") or "")).strip()[:120]
        items.append(
            {
                "title": title,
                "url": link,
                "hot": hot,
                "raw_hot": str(d.get("detail_text") or "").strip(),
                "tag": "",
                "summary": excerpt,
            }
        )
    return items


# ---- B站搜索热词 ----


def fetch_bilibili(client: httpx.Client) -> list[dict]:
    url = "https://s.search.bilibili.com/main/hotword?main_ver=v1&limit=50"
    r = client.get(url, headers={**_HEADERS, "Referer": "https://www.bilibili.com/"})
    r.raise_for_status()
    lst = r.json().get("list") or []
    items = []
    for w in lst:
        word = (w.get("show_name") or w.get("keyword") or "").strip()
        if not word:
            continue
        hot = _to_float(w.get("score"))
        items.append(
            {
                "title": word,
                "url": "",
                "hot": hot if hot and hot > 1 else None,
                "raw_hot": "",
                "tag": "",
                "summary": "",
            }
        )
    return items


# ---- GitHub Trending（工具分享栏目源）----


def _fmt_stars(v: float | int | None) -> str:
    """12345 → 12.3k；1234567 → 1.2M。"""
    if not v:
        return "0"
    if v >= 1e6:
        return f"{v / 1e6:.1f}M"
    if v >= 1e3:
        return f"{v / 1e3:.1f}k"
    return str(int(v))


def _parse_trending_html(html_text: str) -> list[dict]:
    """解析 github.com/trending 页的 Box-row 结构；解析不出条目返回空（上层回退 API）。"""
    items = []
    for m in re.finditer(r'<article class="Box-row">(.*?)</article>', html_text, re.S):
        block = m.group(1)
        hm = re.search(r'<h2[^>]*>\s*<a[^>]+href="/([^"]+)"', block)
        if not hm:
            continue
        full = hm.group(1).strip().strip("/")
        dm = re.search(r'<p class="col-9[^"]*"[^>]*>(.*?)</p>', block, re.S)
        desc = _html.unescape(re.sub(r"<[^>]+>", "", dm.group(1))).strip() if dm else ""
        sm = re.search(r'stargazers".*?([\d][\d,\s]*)\s*<', block, re.S)
        stars = int(sm.group(1).replace(",", "").replace(" ", "")) if sm else None
        tm = re.search(r"([\d,]+)\s*stars?\s+(?:today|this week|this month)", block)
        today = int(tm.group(1).replace(",", "")) if tm else None
        lm = re.search(r'itemprop="programmingLanguage">([^<]+)<', block)
        lang = lm.group(1).strip() if lm else ""
        # 归一热度用「今日新增星」；没有则退回总星数
        hot = float(today) if today else (float(stars) if stars else None)
        parts = []
        if stars:
            parts.append(f"⭐{_fmt_stars(stars)}")
        if today is not None:
            parts.append(f"今日+{_fmt_stars(today)}")
        items.append(
            {
                "title": full,
                "url": f"https://github.com/{full}",
                "hot": hot,
                "raw_hot": " · ".join(parts),
                "tag": lang,
                "summary": desc,
            }
        )
    return items


def _github_api_fallback(client: httpx.Client) -> list[dict]:
    """trending 页不可用时的兜底：近 7 天新建仓库按 star 排序（官方 Search API）。"""
    since = (date.today() - timedelta(days=7)).isoformat()
    url = (
        "https://api.github.com/search/repositories"
        f"?q=created%3A%3E{since}&sort=stars&order=desc&per_page=25"
    )
    r = client.get(url, headers={**_HEADERS, "Accept": "application/vnd.github+json"})
    r.raise_for_status()
    items = []
    for it in r.json().get("items") or []:
        full = (it.get("full_name") or "").strip()
        if not full:
            continue
        stars = it.get("stargazers_count") or 0
        items.append(
            {
                "title": full,
                "url": it.get("html_url") or f"https://github.com/{full}",
                "hot": None,  # 排名代理归一，避免与 trending 口径混算
                "raw_hot": f"⭐{_fmt_stars(stars)}（近7天新建）",
                "tag": str(it.get("language") or ""),
                "summary": re.sub(r"\s+", " ", str(it.get("description") or "")),
            }
        )
    return items


def fetch_github(client: httpx.Client) -> list[dict]:
    """GitHub 每日热门仓库：先解析 trending 页，解析不出再回退官方 Search API。"""
    try:
        r = client.get(
            "https://github.com/trending",
            headers={**_HEADERS, "Accept": "text/html", "Referer": "https://github.com/"},
        )
        r.raise_for_status()
        items = _parse_trending_html(r.text)
        if items:
            return items
        log.warning("github trending 页解析为空，回退 Search API")
    except Exception as e:  # noqa: BLE001
        log.warning("github trending 页抓取失败，回退 Search API: %s", e)
    return _github_api_fallback(client)


FETCHERS = {
    "douyin": fetch_douyin,
    "toutiao": fetch_toutiao,
    "baidu": fetch_baidu,
    "zhihu": fetch_zhihu,
    "bilibili": fetch_bilibili,
    "github": fetch_github,
}


def _to_float(v) -> float | None:
    try:
        f = float(v)
        return f if f > 0 else None
    except (TypeError, ValueError):
        return None


def _parse_wan(text: str) -> float | None:
    """'432 万热度' → 4320000；解析失败返回 None。"""
    m = re.search(r"([\d.]+)\s*万", text or "")
    if m:
        return float(m.group(1)) * 10000
    m = re.search(r"([\d.]+)", text or "")
    return float(m.group(1)) if m else None


def _fmt_hot(v: float | None) -> str:
    if v is None:
        return ""
    if v >= 1e8:
        return f"{v / 1e8:.1f}亿"
    if v >= 1e4:
        return f"{v / 1e4:.0f}万"
    return str(int(v))


def fetch_all(platforms: list[str] | None = None) -> dict[str, list[dict]]:
    """并发抓取指定平台（默认全部），返回 {platform: [raw_item, ...]}。

    单源异常被吞掉并返回空列表——热点聚合不能被一个平台拖死。
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed

    wanted = [p for p in (platforms or list(FETCHERS)) if p in FETCHERS]
    results: dict[str, list[dict]] = {}
    with ThreadPoolExecutor(max_workers=len(wanted) or 1) as pool:
        futures = {pool.submit(_fetch_one, p): p for p in wanted}
        for fut in as_completed(futures):
            p = futures[fut]
            try:
                results[p] = fut.result()
            except Exception as e:  # noqa: BLE001
                log.warning("热点源 %s 抓取失败: %s", p, e)
                results[p] = []
    return results


def _fetch_one(platform: str) -> list[dict]:
    # github 允许走系统代理（国内直连不稳定），国内平台保持不走代理
    with httpx.Client(
        timeout=HOTSPOT_TIMEOUT_SECONDS,
        follow_redirects=True,
        trust_env=platform == "github",
    ) as client:
        raw = FETCHERS[platform](client)
    # 通用清洗：截断超长标题/摘要、过滤空串
    cleaned = []
    for it in raw:
        title = str(it.get("title", "")).strip()
        if not title:
            continue
        it["title"] = title[:80]
        if it.get("summary"):
            it["summary"] = str(it["summary"]).strip()[:200]
        cleaned.append(it)
    return cleaned


def dump_sample(platform: str) -> str:
    """调试工具：打印某平台原始条目（开发期用）。"""
    return json.dumps(fetch_all([platform]), ensure_ascii=False, indent=1)[:3000]
