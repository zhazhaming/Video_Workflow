# -*- coding: utf-8 -*-
"""临时侦察工具：中文搜索 + 网页正文抓取，用于核对「中国乘用车 燃油 vs 新能源」真实数据。

搜索走 360（www.so.com，结果含真实新闻标题与摘要），链接经 so.com/link 解析为真实 URL。
用法：
    python -X utf8 tools/probe_auto_data.py so "2025年新能源乘用车零售渗透率 乘联会"
    python -X utf8 tools/probe_auto_data.py so "..." --fetch        # 逐个抓正文前 3000 字
    python -X utf8 tools/probe_auto_data.py fetch https://xxx [max_chars]
仅用于数据取证，不参与成片渲染。
"""
import html
import re
import sys
import urllib.parse
import urllib.request

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


def get(url: str, timeout: int = 20, maxb: int = 3_000_000) -> tuple[str, str]:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": UA,
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        final = r.geturl()
        raw = r.read(maxb)
    for enc in ("utf-8", "gb18030", "gbk"):
        try:
            return raw.decode(enc), final
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", "replace"), final


def strip_tags(s: str) -> str:
    s = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", s, flags=re.S | re.I)
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.I)
    s = re.sub(r"</(p|div|li|tr|h[1-6])>", "\n", s, flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s)
    s = re.sub(r"[ \t\u3000]+", " ", s)
    s = re.sub(r"\n\s*\n+", "\n", s)
    return s.strip()


def so(q: str, do_fetch: bool = False, n: int = 10) -> None:
    url = "https://www.so.com/s?q=" + urllib.parse.quote(q)
    h, _ = get(url)
    items = []
    for blk in re.findall(r'<li class="res-list".*?(?=<li class="res-list"|</ul>)', h, re.S):
        ht = re.search(r"<h3[^>]*>(.*?)</h3>", blk, re.S)
        if not ht:
            continue
        a = re.search(r'<a[^>]+href="(https?://[^"]+)"[^>]*>(.*?)</a>', ht.group(1), re.S)
        if not a:
            continue
        title = strip_tags(a.group(2))
        href = a.group(1).replace("&amp;", "&")
        desc = re.search(r'class="res-desc"[^>]*>(.*?)</p>', blk, re.S) or re.search(
            r'class="res-rich[^"]*"[^>]*>(.*?)</div>', blk, re.S
        )
        sn = strip_tags(desc.group(1)) if desc else ""
        items.append((title, href, sn))
    print(f"# query: {q}\n# {len(items)} results\n")
    seen = set()
    for title, href, sn in items[:n]:
        try:
            _, real = get(href, timeout=15, maxb=2000)
        except Exception:
            real = href
        if real in seen:
            continue
        seen.add(real)
        print("---")
        print("T:", title[:160])
        print("U:", real[:240])
        print("S:", sn[:400])
        if do_fetch:
            try:
                body, final = get(real)
                txt = strip_tags(body)
                print("B:", txt[:2600])
            except Exception as e:
                print("B: FAIL", type(e).__name__, str(e)[:80])
        print()


def fetch(url: str, max_chars: int = 12000) -> None:
    h, final = get(url)
    txt = strip_tags(h)
    print(f"# {final}\n# chars={len(txt)}\n")
    print(txt[:max_chars])


def em(q: str, n: int = 10) -> list[dict]:
    """东方财富资讯搜索（JSON，含日期/来源/URL），返回条目列表。"""
    import json as _json

    param = {
        "uid": "",
        "keyword": q,
        "type": ["cmsArticleWebOld"],
        "client": "web",
        "clientType": "web",
        "clientVersion": "curr",
        "param": {
            "cmsArticleWebOld": {
                "searchScope": "default",
                "sort": "default",
                "pageIndex": 1,
                "pageSize": n,
                "preTag": "",
                "postTag": "",
            }
        },
    }
    url = (
        "https://search-api-web.eastmoney.com/search/jsonp?cb=cb&param="
        + urllib.parse.quote(_json.dumps(param, ensure_ascii=False))
    )
    raw, _ = get(url)
    body = raw[raw.find("(") + 1 : raw.rfind(")")]
    data = _json.loads(body)
    items = (data.get("result") or {}).get("cmsArticleWebOld") or []
    print(f"# EM query: {q}  (hits={data.get('hitsTotal')}, {len(items)} items)\n")
    for it in items:
        print("---")
        print("D:", it.get("date"), "|", it.get("mediaName"))
        print("T:", (it.get("title") or "").replace("\u200b", "")[:150])
        print("U:", it.get("url"))
        print("C:", (it.get("content") or "").replace("\u200b", "")[:420])
    print()
    return items


if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "so"
    if action == "so":
        do_fetch = "--fetch" in sys.argv
        for q in [a for a in sys.argv[2:] if not a.startswith("--")]:
            so(q, do_fetch=do_fetch)
            print()
    elif action == "em":
        for q in sys.argv[2:]:
            em(q)
    elif action == "fetch":
        fetch(sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 12000)
