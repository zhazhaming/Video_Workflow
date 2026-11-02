# -*- coding: utf-8 -*-
"""第二轮探测：补充源。"""
import asyncio
import sys

import httpx

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"

SOURCES = {
    "weibo_m_hot": ("https://m.weibo.cn/api/container/getIndex", {"containerid": "106003type=25&t=3&disable_hot=1&filter_type=realtimehot"}),
    "weibo_m_hot2": ("https://m.weibo.cn/api/container/getIndex", {"containerid": "100103type=25&t=3&disable_hot=1&filter_type=realtimehot"}),
    "bili_popular": ("https://api.bilibili.com/x/web-interface/popular?ps=20&pn=1", {}),
    "bili_search_hot": ("https://s.search.bilibili.com/main/hotword?main_ver=v1&limit=10", {}),
    "qq_news": ("https://i.news.qq.com/gw/pc_search/rank/hot_list", {}),
    "kuaishou": ("https://www.kuaishou.com/?isHome=1", {}),
}

JSON = "application/json"


async def probe(name: str, url: str, params: dict, client: httpx.AsyncClient) -> None:
    try:
        r = await client.get(url, params=params or None, timeout=10)
        ct = r.headers.get("content-type", "")
        print(f"=== {name} | {r.status_code} | {ct[:40]} | len={len(r.text)}")
        print(f"    {r.text[:400]}".replace("\n", " "))
    except Exception as e:  # noqa: BLE001
        print(f"=== {name} | ERROR | {type(e).__name__}: {e}")
    sys.stdout.flush()


async def main() -> None:
    headers = {
        "User-Agent": UA,
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Referer": "https://m.weibo.cn/",
    }
    async with httpx.AsyncClient(headers=headers, follow_redirects=True, trust_env=False) as client:
        try:
            await client.get("https://m.weibo.cn/", timeout=10)
        except Exception as e:  # noqa: BLE001
            print(f"(m.weibo.cn prewarm failed: {e})")
        for name, (url, params) in SOURCES.items():
            await probe(name, url, params, client)


if __name__ == "__main__":
    asyncio.run(main())
    print("DONE")
