# -*- coding: utf-8 -*-
"""第三轮探测：候选补充热点源（网易/澎湃/搜狗/IT之家/虎扑/少数派）。"""
import asyncio
import sys

import httpx

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"

SOURCES = {
    "netease_hot": ("https://c.m.163.com/redis/hot-list-v2?size=10", {}),
    "netease_v2": ("https://gw.m.163.com/touch/recommend/article/getHotList?size=10", {}),
    "thepaper": ("https://api.thepaper.cn/search/web/news?word=热点", {}),
    "sogou_hot": ("https://top.sogou.com/", {}),
    "ithome": ("https://m.ithome.com/api/news/newslistpage?type=0&page=1", {}),
    "36kr": ("https://gateway.36kr.com/api/mis/nav/home/nav/rank/hot", {}),
    "baidu_hotword": ("https://top.baidu.com/board?tab=realtime", {}),
    "douyin_billboard": ("https://www.iesdouyin.com/web/api/v2/hotsearch/billboard/word/", {}),
}


async def probe(name: str, url: str, client: httpx.AsyncClient) -> None:
    try:
        r = await client.get(url, timeout=10)
        ct = r.headers.get("content-type", "")
        print(f"=== {name} | {r.status_code} | {ct[:36]} | len={len(r.text)}")
        print(f"    {r.text[:260]}".replace("\n", " "))
    except Exception as e:  # noqa: BLE001
        print(f"=== {name} | ERROR | {type(e).__name__}: {e}")
    sys.stdout.flush()


async def main() -> None:
    headers = {"User-Agent": UA, "Accept": "application/json, text/html, */*"}
    async with httpx.AsyncClient(headers=headers, follow_redirects=True, trust_env=False) as client:
        for name, (url, _) in SOURCES.items():
            await probe(name, url, client)


if __name__ == "__main__":
    asyncio.run(main())
    print("DONE")
