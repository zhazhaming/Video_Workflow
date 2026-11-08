# -*- coding: utf-8 -*-
"""《油车真的输了吗？》数据取证脚本（可重跑，带原始摘句缓存）。

用途：为项目 auto-market-trend 采集「中国乘用车 燃油 vs 新能源」真实数据，
      把原始搜索条目 / 正文摘句缓存到 storage/projects/auto-market-trend/_raw/，
      便于人工复核（facts.md 里每条数字都应能在这里找到原始出处）。

子命令：
    python -X utf8 tools/fetch_auto_trend_data.py bing "关键词" [N]      # Bing 网页搜索（真实 URL）
    python -X utf8 tools/fetch_auto_trend_data.py so   "关键词" [N]      # 360 搜索（标题/摘要，链接多为跳转）
    python -X utf8 tools/fetch_auto_trend_data.py em   "关键词" [N]      # 东方财富资讯搜索（仅近约 1 个月窗口）
    python -X utf8 tools/fetch_auto_trend_data.py fetch <url> [max_chars] # 抓正文并落原文缓存
    python -X utf8 tools/fetch_auto_trend_data.py run                    # 按内置清单批量取证

注意：web_search 工具在本环境不可用（无 API key）；百度 / 乘联会官网 403 或超时。
"""
from __future__ import annotations

import html as H
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

ROOT = Path(__file__).resolve().parents[1]  # backend/
RAW_DIR = ROOT / "storage" / "projects" / "auto-market-trend" / "_raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)


def get(url: str, timeout: int = 25, maxb: int = 4_000_000) -> tuple[str, str]:
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
    s = re.sub(r"</(p|div|li|tr|h[1-6]|td)>", "\n", s, flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = H.unescape(s)
    s = re.sub(r"[ \t\u3000]+", " ", s)
    s = re.sub(r"\n\s*\n+", "\n", s)
    return s.strip()


def save(kind: str, key: str, text: str) -> Path:
    slug = re.sub(r"[^0-9A-Za-z\u4e00-\u9fa5]+", "_", key)[:80]
    p = RAW_DIR / f"{kind}_{slug}_{int(time.time())}.txt"
    p.write_text(text, encoding="utf-8")
    return p


# ---------------------------------------------------------------- Bing
def bing(q: str, n: int = 10, do_fetch: bool = False) -> list[dict]:
    url = "https://cn.bing.com/search?q=" + urllib.parse.quote(q) + "&setlang=zh-CN"
    h, _ = get(url)
    out: list[dict] = []
    for blk in re.findall(r'<li class="b_algo".*?</li>', h, re.S)[: n * 2]:
        a = re.search(r'<h2[^>]*>.*?<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', blk, re.S)
        if not a:
            continue
        title = strip_tags(H.unescape(a.group(2)))
        link = a.group(1).replace("&amp;", "&")
        p = re.search(r'<p[^>]*>(.*?)</p>', blk, re.S)
        snippet = strip_tags(H.unescape(p.group(1))) if p else ""
        out.append({"title": title, "url": link, "snippet": snippet})
        if len(out) >= n:
            break
    print(f"# BING: {q}  ({len(out)} results)")
    for it in out:
        print("---")
        print("T:", it["title"][:140])
        print("U:", it["url"][:240])
        print("S:", it["snippet"][:400])
    print()
    save("bing", q, json.dumps({"query": q, "engine": "bing", "results": out}, ensure_ascii=False, indent=2))
    if do_fetch:
        for it in out:
            try:
                body, final = get(it["url"])
                it["quote"] = strip_tags(body)[:1800]
                it["final_url"] = final
                print("B:", it["quote"][:600])
                print()
            except Exception as e:  # noqa: BLE001
                print("B: FAIL", type(e).__name__, str(e)[:100])
    return out


# ---------------------------------------------------------------- 360
def so(q: str, n: int = 10) -> list[dict]:
    url = "https://www.so.com/s?q=" + urllib.parse.quote(q)
    h, _ = get(url)
    out = []
    for blk in re.findall(r'<li class="res-list".*?(?=<li class="res-list"|</ul>)', h, re.S)[:n]:
        ht = re.search(r"<h3[^>]*>(.*?)</h3>", blk, re.S)
        if not ht:
            continue
        a = re.search(r'<a[^>]+href="(https?://[^"]+)"[^>]*>(.*?)</a>', ht.group(1), re.S)
        if not a:
            continue
        # PC 版 so.com 在 <a> 上带 data-mdurl = 真实 URL（so.com/link 无法解析）
        md = re.search(r'data-mdurl="([^"]+)"', ht.group(1))
        desc = re.search(r'class="res-desc"[^>]*>(.*?)</p>', blk, re.S) or re.search(
            r'class="res-rich[^"]*"[^>]*>(.*?)</div>', blk, re.S
        )
        out.append(
            {
                "title": strip_tags(a.group(2)),
                "url": H.unescape(md.group(1)) if md else a.group(1).replace("&amp;", "&"),
                "snippet": strip_tags(desc.group(1)) if desc else "",
            }
        )
    print(f"# SO360: {q}  ({len(out)} results)")
    for it in out:
        print("---")
        print("T:", it["title"][:150])
        print("U:", it["url"][:200])
        print("S:", it["snippet"][:400])
    print()
    save("so360", q, json.dumps({"query": q, "engine": "so360", "results": out}, ensure_ascii=False, indent=2))
    return out


def digest(q: str, n: int = 5, pattern: str = r"万辆|渗透率|保有量|%|亿辆|元/升|保值率|万辆") -> list[dict]:
    """360 搜索 → 取真实 URL → 抓正文 → 只回显含数字的句子。最省时的取证路径。"""
    items = so(q, n)
    for it in items:
        it["url"] = it["url"].strip()
        if it["url"].startswith("https://www.so.com/link"):
            it["note"] = "unresolved-360-link"
            continue
        try:
            body, final = get(it["url"], timeout=30)
            txt = strip_tags(body)
            it["final_url"] = final
            it["full_text_len"] = len(txt)
            sents = [s.strip() for s in re.split(r"(?<=[。！；])", txt) if re.search(pattern, s) and len(s.strip()) > 8]
            it["hits"] = sents[:25]
            print(f"\n>>> [{final[:90]}]  hits={len(sents)}")
            for s in sents[:25]:
                print("   >", s[:260])
            save("digest", final, txt)
        except Exception as e:  # noqa: BLE001
            it["error"] = f"{type(e).__name__}: {str(e)[:80]}"
            print(f"\n>>> [{it['url'][:90]}] FETCH FAIL {it['error']}")
    save("digest_json", q, json.dumps({"query": q, "items": items}, ensure_ascii=False, indent=2))
    return items


# ---------------------------------------------------------------- 360 移动版（真实 URL 在 data-pcurl）
def mso(q: str, n: int = 10, do_fetch: bool = False, chars: int = 1200) -> list[dict]:
    """360 移动搜索。结果块带 data-pcurl = 真实 URL，比 PC 版 so.com/link 可解析。"""
    url = "https://m.so.com/s?q=" + urllib.parse.quote(q)
    h, _ = get(url)
    blocks = re.findall(
        r'<div[^>]*class="[^"]*res-list[^"]*"[^>]*data-pcurl="([^"]+)".*?(?=<div[^>]*class="[^"]*res-list[^"]*"[^>]*data-pcurl="|$)',
        h,
        re.S,
    )
    full = re.findall(
        r'<div[^>]*class="[^"]*res-list[^"]*"[^>]*data-pcurl="[^"]+".*?(?=<div[^>]*class="[^"]*res-list[^"]*"[^>]*data-pcurl="|</body)',
        h,
        re.S,
    )
    out: list[dict] = []
    for blk in full:
        pu = re.search(r'data-pcurl="([^"]+)"', blk)
        ti = re.search(r'<h3[^>]*class="res-title"[^>]*>(.*?)</h3>', blk, re.S)
        sm = re.search(r'class="summary[^"]*"[^>]*>(.*?)</div>', blk, re.S)
        tm = re.search(r"<time>(.*?)</time>", blk, re.S)
        site = re.search(r"class='res-site-name'>(.*?)</", blk, re.S)
        if not (pu and ti):
            continue
        item = {
            "url": H.unescape(pu.group(1)).replace("&amp;", "&"),
            "title": strip_tags(ti.group(1)),
            "snippet": strip_tags(sm.group(1)) if sm else "",
            "date_hint": strip_tags(tm.group(1)) if tm else "",
            "site": strip_tags(site.group(1)) if site else "",
        }
        out.append(item)
        if len(out) >= n:
            break
    print(f"# MSO360: {q}  ({len(out)} results)")
    for it in out:
        print("---")
        print("T:", it["title"][:140])
        print("U:", it["url"][:220])
        print("S:", it["snippet"][:400])
        if it["date_hint"] or it["site"]:
            print("M:", it["site"], "|", it["date_hint"])
    print()
    save("mso360", q, json.dumps({"query": q, "engine": "m.so360", "results": out}, ensure_ascii=False, indent=2))
    if do_fetch:
        for it in out:
            try:
                body, final = get(it["url"], timeout=30)
                txt = strip_tags(body)
                it["quote"] = txt[: chars * 4]
                print(f"B[{it['url'][:60]}]:", txt[:chars].replace("\n", " "))
                print()
            except Exception as e:  # noqa: BLE001
                print("B: FAIL", type(e).__name__, str(e)[:100])
    return out


# ---------------------------------------------------------------- 搜狗移动（可抽出真实 URL）
def sogou(q: str, n: int = 8, do_fetch: bool = False) -> list[dict]:
    """m.sogou.com 搜索。页面里的跳转参数内含真实 URL（url= / pcurl=），可解出。"""
    url = "https://m.sogou.com/web/searchList.jsp?keyword=" + urllib.parse.quote(q)
    h, _ = get(url)
    # 结果块：标题 + 内含 url= / pcurl= 的真实地址
    out: list[dict] = []
    blocks = re.findall(r'<div class="vrwrap.*?(?=<div class="vrwrap|$)', h, re.S)
    if not blocks:
        blocks = re.findall(r'<div[^>]*class="[^"]*result[^"]*".*?(?=<div[^>]*class="[^"]*result|$)', h, re.S)
    for blk in blocks:
        ti = re.search(r'<h3[^>]*>(.*?)</h3>', blk, re.S)
        real = None
        for pat in (r"(?:pcurl|url)=((?:https?%3A%2F%2F|https?://)[^&\"]+)", r'data-url="([^"]+)"'):
            m = re.search(pat, blk)
            if m:
                real = urllib.parse.unquote(H.unescape(m.group(1)))
                break
        if not (ti and real):
            continue
        out.append({"title": strip_tags(ti.group(1)), "url": real, "snippet": ""})
        if len(out) >= n:
            break
    print(f"# SOGOU: {q}  ({len(out)} results)")
    for it in out:
        print("---")
        print("T:", it["title"][:140])
        print("U:", it["url"][:220])
    print()
    save("sogou", q, json.dumps({"query": q, "engine": "sogou", "results": out}, ensure_ascii=False, indent=2))
    if do_fetch:
        for it in out:
            try:
                body, final = get(it["url"], timeout=30)
                txt = strip_tags(body)
                it["quote"] = txt[:5000]
                print(f"B[{it['url'][:60]}]:", txt[:900].replace("\n", " "))
                print()
            except Exception as e:  # noqa: BLE001
                print("B: FAIL", type(e).__name__, str(e)[:100])
    return out


# ---------------------------------------------------------------- 东方财富
def em(q: str, n: int = 10) -> list[dict]:
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
        + urllib.parse.quote(json.dumps(param, ensure_ascii=False))
    )
    raw, _ = get(url)
    body = raw[raw.find("(") + 1 : raw.rfind(")")]
    data = json.loads(body)
    items = (data.get("result") or {}).get("cmsArticleWebOld") or []
    print(f"# EM: {q}  (hits={data.get('hitsTotal')}, {len(items)} items)  注：EM 只覆盖近期窗口")
    for it in items:
        print("---")
        print("D:", it.get("date"), "|", it.get("mediaName"))
        print("T:", (it.get("title") or "").replace("\u200b", "")[:150])
        print("U:", it.get("url"))
        print("C:", (it.get("content") or "").replace("\u200b", "")[:420])
    print()
    save("em", q, json.dumps(items, ensure_ascii=False, indent=2))
    return items


# ---------------------------------------------------------------- 正文
def fetch(url: str, max_chars: int = 12000) -> str:
    h, final = get(url)
    txt = strip_tags(h)
    print(f"# {final}\n# chars={len(txt)}\n")
    print(txt[:max_chars])
    save("page", final, txt)
    return txt


# ---------------------------------------------------------------- 正文按关键词抽取
def grab(url: str, pattern: str = r"万辆|渗透率|保有量|%|亿辆") -> str:
    """抓正文后只打印命中关键词的句子，便于从长页面里精准取数。"""
    h, final = get(url, timeout=30)
    txt = strip_tags(h)
    sents = re.split(r"(?<=[。！；])", txt)
    hits = [s.strip() for s in sents if re.search(pattern, s) and len(s.strip()) > 8]
    print(f"# {final}\n# chars={len(txt)}  hits={len(hits)}\n")
    for s in hits[:80]:
        print(">", s[:300])
    save("page", final, txt)
    return txt


# ---------------------------------------------------------------- 批量清单
BATCH: list[tuple[str, str]] = [
    # (引擎, 查询)
    ("bing", "乘联会 2025年全年 新能源乘用车零售 渗透率 乘用车零售"),
    ("bing", "乘联分会 2025年12月 新能源车 零售渗透率 59.1%"),
    ("bing", "2024年7月 新能源乘用车 零售渗透率 51.1% 首次突破50%"),
    ("bing", "公安部 截至2025年底 全国汽车保有量 新能源汽车保有量"),
    ("bing", "2021年 新能源乘用车 零售渗透率 14.8%"),
    ("bing", "2022年 新能源乘用车 零售渗透率 27.6%"),
    ("bing", "2023年 新能源乘用车 零售渗透率 35.7%"),
    ("bing", "中汽协 2025年 汽车产销 新能源 占比"),
    ("bing", "中国充电联盟 2026年 充电桩 保有量 万个"),
    ("bing", "新能源汽车 三年保值率 中国汽车流通协会"),
    ("bing", "92号汽油 价格 2026年 元/升"),
    ("bing", "新能源汽车购置税 2026年 减半 政策"),
]


def run() -> None:
    for engine, q in BATCH:
        print("=" * 100)
        try:
            if engine == "bing":
                bing(q, 8)
            elif engine == "so":
                so(q, 8)
            else:
                em(q, 10)
        except Exception as e:  # noqa: BLE001
            print(f"!! {engine} {q} FAIL {type(e).__name__}: {str(e)[:120]}")
        time.sleep(1.0)


if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "run"
    if action == "bing":
        bing(sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 10, "--fetch" in sys.argv)
    elif action == "mso":
        mso(sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 10, "--fetch" in sys.argv)
    elif action == "sogou":
        sogou(sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 8, "--fetch" in sys.argv)
    elif action == "so":
        so(sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 10)
    elif action == "digest":
        digest(sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 4)
    elif action == "em":
        em(sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 10)
    elif action == "fetch":
        fetch(sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 12000)
    elif action == "grab":
        grab(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else r"万辆|渗透率|保有量|%|亿辆")
    else:
        run()
