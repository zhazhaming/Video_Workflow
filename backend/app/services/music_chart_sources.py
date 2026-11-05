# -*- coding: utf-8 -*-
"""热门歌曲榜单源抓取器（抖音热歌 / 音乐榜聚合）。

数据源（2026-11 实测可用）：
1. QQ 音乐官方榜单接口（u.y.qq.com/musicu.fcg，免签名）：
   - topId=60「抖音热歌榜」：QQ音乐×抖音官方合作榜，抖音热门歌曲 TOP100，每周四更新
   - 飙升/热歌/新歌/听歌识曲（每日）、说唱/电音/国风/DJ/网络歌曲（每周）等官方子榜
   注：抖音官方网页端音乐榜（iesdouyin billboard/music）已停更（active_time 冻结、
   榜单歌曲为旧数据），故主源采用 QQ 音乐官方合作的「抖音热歌榜」。
2. 抖音音乐人平台首页 hot-content（musician.douyin.com，抖音站内第一方热歌数据）。

每个源一个 fetch 函数，返回 (songs, meta)：
songs 为原始歌曲条目 list[dict]，meta 为榜单元信息（period/updateTime/updateTips…），
归一化（稳定 id / 排名代理热度 / 趋势）在 music_chart.py 里统一做。

抓取原则：单个源失败只影响自己（上层逐源捕获），带浏览器 UA 与对应 Referer，
超时从 config 读取，整体在 ThreadPoolExecutor 中并发执行。
"""
import json
import logging
from urllib.parse import quote

import httpx

from ..config import MUSIC_CHART_TIMEOUT_SECONDS

log = logging.getLogger("music-chart")

_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)
_HEADERS = {
    "User-Agent": _UA,
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh;q=0.9",
}

_QQ_FCG = "https://u.y.qq.com/cgi-bin/musicu.fcg"

# QQ 音乐官方榜单（topId → 展示信息），group 用于前端分组
QQ_BOARDS = {
    "dy_hot": {"top_id": 60, "name": "抖音热歌榜", "group": "抖音", "desc": "QQ音乐×抖音官方合作榜：抖音热门歌曲 TOP100"},
    "musician": {"top_id": 0, "name": "抖音音乐人·热门歌曲", "group": "抖音", "desc": "抖音音乐人平台站内热歌（第一方数据）"},
    "rise": {"top_id": 62, "name": "飙升榜", "group": "实时", "desc": "播放量上升最快的歌曲"},
    "hot_song": {"top_id": 26, "name": "热歌榜", "group": "实时", "desc": "全平台最热歌曲"},
    "new_song": {"top_id": 27, "name": "新歌榜", "group": "实时", "desc": "最新发行上升最快的歌曲"},
    "song_recog": {"top_id": 67, "name": "听歌识曲榜", "group": "实时", "desc": "被识别最多的歌曲（短视频 BGM 风向标）"},
    "rap": {"top_id": 58, "name": "说唱榜", "group": "流派", "desc": "说唱/嘻哈"},
    "edm": {"top_id": 57, "name": "电音榜", "group": "流派", "desc": "电子音乐"},
    "guofeng": {"top_id": 65, "name": "国风热歌榜", "group": "流派", "desc": "国风/古风"},
    "dj": {"top_id": 63, "name": "DJ舞曲榜", "group": "流派", "desc": "DJ/舞曲remix"},
    "net_song": {"top_id": 28, "name": "网络歌曲榜", "group": "流派", "desc": "短视频平台病毒式传播的网络歌曲"},
}

# 抖音站内搜索（创作者找到 BGM 对应的视频玩法）
DOUYIN_SEARCH_URL = "https://www.douyin.com/search/{}"


def douyin_search_url(title: str, artist: str = "") -> str:
    q = f"{title} {artist}".strip()
    return DOUYIN_SEARCH_URL.format(quote(q)) if q else ""


# ---- QQ 音乐官方榜单 ----


def _qq_request(client: httpx.Client, payload: dict) -> dict:
    r = client.get(
        _QQ_FCG,
        params={"format": "json", "data": json.dumps(payload, separators=(",", ":"))},
        headers={**_HEADERS, "Referer": "https://y.qq.com/"},
    )
    r.raise_for_status()
    body = r.json()
    code = (body.get("detail") or {}).get("code")
    if code not in (0, None):
        raise RuntimeError(f"QQ 榜单接口返回 code={code}")
    return body


def _album_cover(song: dict) -> str:
    album = song.get("album") or {}
    mid = album.get("mid") or song.get("albumMid") or ""
    return f"https://y.gtimg.cn/music/photo_new/T002R300x300M000{mid}_1.jpg" if mid else ""


def fetch_qq_board(client: httpx.Client, board_id: str) -> tuple[list[dict], dict]:
    """抓取 QQ 音乐官方榜单完整榜单（默认最新一期，约 100 首）。"""
    top_id = QQ_BOARDS[board_id]["top_id"]
    payload = {
        "detail": {
            "module": "musicToplist.ToplistInfoServer",
            "method": "GetDetail",
            "param": {"topId": top_id, "offset": 0, "num": 100},
        }
    }
    body = _qq_request(client, payload)
    data = (body.get("detail") or {}).get("data") or {}
    inner = data.get("data") or {}
    meta = {
        "name": inner.get("title") or QQ_BOARDS[board_id]["name"],
        "period": str(inner.get("period") or ""),
        "update_time": str(inner.get("updateTime") or ""),
        "update_tips": str(inner.get("updateTips") or ""),
        "intro": str(inner.get("intro") or ""),
        "listen_num": int(inner.get("listenNum") or 0),
        "cover": inner.get("headPicUrl") or "",
        "source": "QQ音乐",
    }
    songs = []
    for s in data.get("songInfoList") or []:
        title = (s.get("name") or "").strip()
        if not title:
            continue
        singers = "/".join(
            (x.get("name") or "").strip() for x in (s.get("singer") or []) if (x.get("name") or "").strip()
        )
        album = (s.get("album") or {}).get("name") or ""
        mid = s.get("mid") or ""
        songs.append(
            {
                "title": title,
                "artist": singers,
                "album": album,
                "duration": int(s.get("interval") or 0),
                "cover": _album_cover(s),
                "url": f"https://y.qq.com/n/ryqq/songDetail/{mid}" if mid else "",
                "raw_hot": "",
                "time_public": str((s.get("album") or {}).get("time_public") or ""),
            }
        )
    return songs, meta


# ---- 抖音音乐人平台（站内第一方热歌）----


def fetch_musician(client: httpx.Client) -> tuple[list[dict], dict]:
    """抖音音乐人平台首页「热门歌曲」（hotSongs，含收藏/评论量级）。"""
    r = client.get(
        "https://musician.douyin.com/api/home/hot-content",
        headers={**_HEADERS, "Referer": "https://musician.douyin.com/"},
    )
    r.raise_for_status()
    body = r.json()
    if (body.get("baseResp") or {}).get("errorCode") not in (0, None):
        raise RuntimeError("抖音音乐人接口返回异常")
    data = body.get("data") or {}
    songs = []
    for s in data.get("hotSongs") or []:
        title = (s.get("title") or "").strip()
        if not title:
            continue
        song_id = str(s.get("songId") or "")
        songs.append(
            {
                "title": title,
                "artist": (s.get("artist") or "").strip(),
                "album": "",
                "duration": 0,
                "cover": s.get("coverUrl") or "",
                # 抖音站内音乐页（可在抖音网页版直接听/看使用该 BGM 的视频）
                "url": f"https://www.douyin.com/music/{song_id}" if song_id else "",
                # 收藏量级（如 600w+）作为展示热度
                "raw_hot": (s.get("favoriteCountText") or "").strip(),
                "time_public": "",
            }
        )
    meta = {
        "name": "抖音音乐人·热门歌曲",
        "period": "",
        "update_time": "",
        "update_tips": "抖音音乐人平台官方数据",
        "intro": "抖音音乐人平台首页展示的站内热门歌曲（含收藏量级）",
        "listen_num": 0,
        "cover": "",
        "source": "抖音音乐人",
    }
    return songs, meta


def _fetch_one(board_id: str) -> tuple[list[dict], dict]:
    with httpx.Client(timeout=MUSIC_CHART_TIMEOUT_SECONDS, follow_redirects=True, trust_env=False) as client:
        if board_id == "musician":
            return fetch_musician(client)
        return fetch_qq_board(client, board_id)


def fetch_all(boards: list[str] | None = None) -> dict[str, tuple[list[dict], dict]]:
    """并发抓取指定榜单（默认全部），返回 {board_id: (songs, meta)}。

    单榜异常被吞掉并返回空列表——榜单聚合不能被一个源拖死。
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed

    wanted = [b for b in (boards or list(QQ_BOARDS)) if b in QQ_BOARDS]
    results: dict[str, tuple[list[dict], dict]] = {}
    with ThreadPoolExecutor(max_workers=min(6, len(wanted) or 1)) as pool:
        futures = {pool.submit(_fetch_one, b): b for b in wanted}
        for fut in as_completed(futures):
            b = futures[fut]
            try:
                results[b] = fut.result()
            except Exception as e:  # noqa: BLE001
                log.warning("榜单 %s 抓取失败: %s", b, e)
                results[b] = ([], {})
    return results
