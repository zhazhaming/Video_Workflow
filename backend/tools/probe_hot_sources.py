# -*- coding: utf-8 -*-
"""探测各平台热点榜单接口的真实可用性（开发期工具，不进服务）。"""
import asyncio
import json
import sys

import httpx

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"

SOURCES = {
    "weibo_hot": ("https://weibo.com/ajax/side/hotSearch", {}),
    "weibo_m_search": ("https://m.weibo.cn/api/container/getIndex", {"containerid": "100103type=1&q=AI"}),
    "baidu": ("https://top.baidu.com/api/board?platform=wise&tab=realtime", {}),
    "zhihu_v3": ("https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=50", {}),
    "zhihu_api": ("https://api.zhihu.com/topstory/hot-list?limit=10", {}),
    "bili_square": ("https://api.bilibili.com/x/web-interface/search/square?limit=10", {}),
    "bili_rank": ("https://api.bilibili.com/x/web-interface/ranking/v2?rid=0&type=all", {}),
    "toutiao": ("https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc", {}),
    "douyin_oldsdk": ("https://www.iesdouyin.com/web/api/v2/hotsearch/billboard/word/", {}),
}


async def probe(name: str, url: str, params: dict, client: httpx.AsyncClient) -> None:
    try:
        r = await client.get(url, params=params or None, timeout=10)
        ct = r.headers.get("content-type", "")
        body = r.text[:600].replace("\n", " ")
        print(f"=== {name} | {r.status_code} | {ct[:40]} | len={len(r.text)}")
        print(f"    {body[:500]}")
    except Exception as e:  # noqa: BLE001
        print(f"=== {name} | ERROR | {type(e).__name__}: {e}")
    sys.stdout.flush()


async def main() -> None:
    headers = {
        "User-Agent": UA,
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Referer": "https://www.baidu.com/",
    }
    async with httpx.AsyncClient(headers=headers, follow_redirects=True, trust_env=False) as client:
        # B站接口需要先拿 buvid cookie，否则 412；先访问主页种 cookie
        try:
            await client.get("https://www.bilibili.com/", timeout=10)
        except Exception as e:  # noqa: BLE001
            print(f"(bilibili home prewarm failed: {e})")
        try:
            await client.get("https://www.zhihu.com/hot", timeout=10)
        except Exception as e:  # noqa: BLE001
            print(f"(zhihu home prewarm failed: {e})")
        for name, (url, params) in SOURCES.items():
            await probe(name, url, params, client)


if __name__ == "__main__":
    asyncio.run(main())
    print("DONE")
