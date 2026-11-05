# -*- coding: utf-8 -*-
"""热门歌曲（抖音热歌 / 音乐榜单聚合）核心服务。

职责：
1. 把各榜单原始歌曲归一化成 MusicItem（稳定 id / 排名代理热度 / 抖音搜索直达链接）
2. 快照落盘 + 跨快照对比 → 榜内名次趋势（new/up/flat/down）
3. 自动刷新后台线程 + 最近一次快照内存缓存

趋势判断与热点雷达不同：榜单以「名次」为准（QQ 榜单无逐首播放量），
名次上升 ≥3 位视为 up，下降 ≥3 位视为 down，其余持平；首次在榜记 new。

「最热BGM榜」为合成榜：跨榜共鸣（抖音热歌榜/听歌识曲榜/飙升榜等按权重加权），
命中榜越多、名次越靠前综合分越高，实时随各榜刷新重算。

「我的榜单」为自定义策展榜（如 Vibe 知识大赏 BGM）：用户从任意榜单一键收藏，
落盘 custom_boards.json，可手动添加/移除，不参与抓取。
"""
import hashlib
import json
import logging
import re
import shutil
import threading
import time
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from pydantic import BaseModel, Field

from ..config import (
    MUSIC_CHART_DIR,
    MUSIC_CHART_REFRESH_MINUTES,
    MUSIC_CHART_SNAPSHOTS_DIR,
    MUSIC_CHART_SNAPSHOT_KEEP_HOURS,
    ensure_dirs,
)
from . import music_chart_sources as sources

log = logging.getLogger("music-chart")

_HISTORY_KEEP = 40  # 每首歌保留的最近名次点数
_RANK_TREND_THRESHOLD = 3  # 名次变化阈值（位），过滤榜单边缘抖动

# 「最热BGM榜」合成权重：抖音系来源权重更高，命中的榜越多分越高
_BGM_BOARD_WEIGHTS = {
    "dy_hot": 1.0,  # 抖音热歌榜（官方合作榜）
    "musician": 1.0,  # 抖音音乐人（站内第一方）
    "song_recog": 0.9,  # 听歌识曲（BGM 风向标）
    "rise": 0.8,  # 飙升榜
    "net_song": 0.7,  # 网络歌曲（病毒传播）
    "hot_song": 0.7,  # 热歌榜
    "new_song": 0.6,  # 新歌榜
}
# 「抖音热门BGM」合成权重：仅聚合抖音生态来源
_DY_BGM_BOARD_WEIGHTS = {
    "musician": 1.0,  # 抖音音乐人（站内第一方）
    "dy_hot": 1.0,  # 抖音热歌榜（官方合作榜）
    "song_recog": 0.9,  # 听歌识曲（用户在抖音听到 BGM 后识别，风向标）
}
_COMPOSITE_KEEP = 100  # 合成榜保留前 100

# 合成榜注册表（非抓取源，由其他榜单加权合成）
COMPOSITE_BOARDS = {
    "bgm_hot": {
        "name": "最热BGM榜",
        "group": "推荐",
        "weights": _BGM_BOARD_WEIGHTS,
        "desc": "综合抖音热歌榜/听歌识曲榜/飙升榜等多榜共鸣实时计算",
        "intro": "按 命中榜权重×榜内名次 加权合成，命中榜越多、名次越靠前越热；抖音系来源权重最高",
    },
    "dy_bgm": {
        "name": "抖音热门BGM",
        "group": "抖音",
        "weights": _DY_BGM_BOARD_WEIGHTS,
        "desc": "综合抖音音乐人平台+官方合作热歌榜+听歌识曲（BGM风向标）实时合成",
        "intro": "仅聚合抖音生态来源：抖音音乐人站内热歌、QQ音乐×抖音官方合作热歌榜、听歌识曲榜（用户在抖音听到 BGM 后识别）",
    },
}


# ---- 数据模型 ----


class MusicItem(BaseModel):
    id: str
    board: str
    rank: int
    title: str
    artist: str = ""
    album: str = ""
    duration: int = 0  # 秒
    cover: str = ""
    url: str = ""  # QQ 音乐 / 抖音站内歌曲页
    search_url: str = ""  # 抖音站内搜索（看该 BGM 的视频玩法）
    raw_hot: str = ""  # 展示用热度文本（如收藏量级 600w+）
    hot: float = 0.0  # 榜内排名代理热度（榜首 100 → 榜尾 30）
    first_seen: str = ""
    last_seen: str = ""
    trend: str = "new"  # new | up | flat | down
    rank_diff: int = 0  # 与上轮相比的名次变化（正=上升）
    history: list[int] = []  # 最近若干轮名次（含本轮，用于走势）
    from_boards: list[str] = []  # 合成榜专用：命中的来源榜 id 列表

    @property
    def duration_text(self) -> str:
        if self.duration <= 0:
            return ""
        return f"{self.duration // 60}:{self.duration % 60:02d}"


class MusicBoardInfo(BaseModel):
    id: str
    name: str
    group: str = ""  # 抖音 | 实时 | 流派
    desc: str = ""
    source: str = ""
    period: str = ""  # 榜单期号（周榜 2026_44 / 日榜日期）
    update_time: str = ""  # 榜单数据自身的更新时间
    update_tips: str = ""
    intro: str = ""
    listen_num: int = 0
    count: int = 0
    ok: bool = False
    error: str = ""
    fetched_at: str = ""


# ---- 自定义策展榜（我的榜单）----


class CustomItem(BaseModel):
    title: str = Field(min_length=1, max_length=80)
    artist: str = Field(default="", max_length=60)
    album: str = Field(default="", max_length=80)
    cover: str = Field(default="", max_length=500)
    url: str = Field(default="", max_length=500)
    note: str = Field(default="", max_length=200)
    added_at: str = ""


class CustomBoard(BaseModel):
    id: str
    name: str = Field(min_length=1, max_length=30)
    desc: str = Field(default="", max_length=120)
    created_at: str = ""
    items: list[CustomItem] = []


# 预置榜单（首次使用时自动创建）
SEED_CUSTOM_BOARD = {
    "id": "vibe",
    "name": "Vibe 知识大赏 BGM",
    "desc": "Vibe 知识大赏（沉浸式知识科普）专用 BGM 收藏：氛围感/轻快叙事向，可从任意榜单一键收藏",
}


# ---- 工具 ----


def _now() -> datetime:
    return datetime.now(timezone.utc).astimezone()


def _iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def normalize_text(text: str) -> str:
    """歌名/歌手标准化：去空白、小写——用于稳定 id 与跨榜对齐。"""
    return re.sub(r"\s+", "", (text or "").replace("（", "(").replace("）", ")")).lower()


def item_id(board: str, title: str, artist: str = "") -> str:
    key = f"{board}|{normalize_text(title)}|{normalize_text(artist)}"
    return hashlib.md5(key.encode("utf-8")).hexdigest()[:12]


def rank_hot(rank: int, total: int) -> float:
    """排名代理热度：榜首 100，榜尾趋近 30。"""
    if total <= 1:
        return 100.0
    return round(100.0 - 70.0 * (rank - 1) / max(1, total - 1), 2)


def compute_rank_trend(prev_rank: int | None, cur_rank: int) -> tuple[str, int]:
    """对比上次抓取的榜内名次：(trend, rank_diff)。diff 正值=名次上升。"""
    if prev_rank is None or prev_rank <= 0:
        return "new", 0
    diff = prev_rank - cur_rank
    if diff >= _RANK_TREND_THRESHOLD:
        return "up", diff
    if diff <= -_RANK_TREND_THRESHOLD:
        return "down", diff
    return "flat", diff


def build_composite(board_id: str, raw_map: dict, state_items: dict, now_s: str) -> tuple[list[MusicItem], MusicBoardInfo]:
    """跨榜共鸣合成榜（最热BGM榜 / 抖音热门BGM）。

    每首歌按 命中榜权重 × 榜内名次位置 累加综合分，命中榜越多、名次越靠前越热。
    名次趋势与普通榜一致（走 state_items 历史）。
    """
    spec = COMPOSITE_BOARDS[board_id]
    weights: dict[str, float] = spec["weights"]
    agg: dict[str, dict] = {}
    for bid, weight in weights.items():
        songs, _meta = raw_map.get(bid, ([], {}))
        n = len(songs)
        if not n:
            continue
        for rank, r in enumerate(songs, start=1):
            title = str(r.get("title") or "").strip()
            if not title:
                continue
            artist = str(r.get("artist") or "").strip()
            key = f"{normalize_text(title)}|{normalize_text(artist)}"
            a = agg.setdefault(
                key,
                {
                    "title": title[:80],
                    "artist": artist[:60],
                    "album": "",
                    "cover": "",
                    "url": "",
                    "raw_hot": "",
                    "score": 0.0,
                    "boards": [],
                },
            )
            # 源榜内部可能有同名重复条目：每榜只计一次（取最优名次）
            if bid in a["boards"]:
                continue
            a["score"] += weight * (n - rank + 1) / n
            a["boards"].append(bid)
            # 字段补全：抖音站内链接最优先（musician），封面/专辑取首个非空
            if bid == "musician":
                a["url"] = r.get("url") or a["url"]
                a["raw_hot"] = str(r.get("raw_hot") or "") or a["raw_hot"]
            if not a["cover"]:
                a["cover"] = r.get("cover") or ""
            if not a["album"]:
                a["album"] = str(r.get("album") or "")[:80]
            if not a["url"]:
                a["url"] = r.get("url") or ""

    ranked = sorted(agg.values(), key=lambda a: -a["score"])[:_COMPOSITE_KEEP]
    total = len(ranked)
    items: list[MusicItem] = []
    for rank, a in enumerate(ranked, start=1):
        iid = item_id(board_id, a["title"], a["artist"])
        prev = state_items.get(iid)
        prev_hist = (prev or {}).get("rank_history") or []
        prev_rank = prev_hist[-1].get("rank") if prev_hist else None
        trend, diff = compute_rank_trend(prev_rank, rank)
        items.append(
            MusicItem(
                id=iid,
                board=board_id,
                rank=rank,
                title=a["title"],
                artist=a["artist"],
                album=a["album"],
                cover=a["cover"],
                url=a["url"],
                search_url=sources.douyin_search_url(a["title"], a["artist"]),
                raw_hot=a["raw_hot"],
                hot=rank_hot(rank, total),
                first_seen=(prev or {}).get("first_seen") or now_s,
                last_seen=now_s,
                trend=trend,
                rank_diff=diff,
                history=[x.get("rank") for x in prev_hist] + [rank],
                from_boards=a["boards"],
            )
        )
        hist = (prev or {}).get("rank_history") or []
        hist.append({"t": now_s, "rank": rank})
        state_items[iid] = {
            "first_seen": items[-1].first_seen,
            "last_seen": now_s,
            "best_rank": min((prev or {}).get("best_rank") or 9999, rank),
            "rank_history": hist[-_HISTORY_KEEP:],
        }
    info = MusicBoardInfo(
        id=board_id,
        name=spec["name"],
        group=spec["group"],
        desc=spec["desc"],
        source="综合",
        period="",
        update_time=now_s,
        update_tips="随各榜刷新实时重算",
        intro=spec["intro"],
        listen_num=0,
        count=total,
        ok=bool(items),
        error="" if items else "暂无数据",
        fetched_at=now_s,
    )
    log.info("合成榜 %s 完成： %d 首", board_id, total)
    return items, info


# ---- 存储层 ----


class MusicChartStore:
    """state.json（名次历史/源状态）+ 快照文件。"""

    def __init__(self):
        self._lock = threading.Lock()

    @staticmethod
    def _state_path() -> Path:
        return MUSIC_CHART_DIR / "state.json"

    def load_state(self) -> dict:
        p = self._state_path()
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except FileNotFoundError:
            return {}
        except Exception as e:  # noqa: BLE001
            log.warning("music_chart state.json 损坏（%s），使用全新状态", e)
            bak = p.with_suffix(".json.bak")
            try:
                return json.loads(bak.read_text(encoding="utf-8"))
            except Exception:  # noqa: BLE001
                return {}

    def save_state(self, state: dict) -> None:
        MUSIC_CHART_DIR.mkdir(parents=True, exist_ok=True)
        p = self._state_path()
        try:
            if p.exists():
                shutil.copyfile(p, p.with_suffix(".json.bak"))
        except OSError as e:  # noqa: BLE001
            log.warning("state.json 备份失败（不影响主写入）: %s", e)
        with self._lock:
            p.write_text(json.dumps(state, ensure_ascii=False, indent=1), encoding="utf-8")

    def save_snapshot(self, boards: list[MusicBoardInfo], items: list[MusicItem]) -> Path:
        MUSIC_CHART_SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)
        now_dt = _now()
        ts = now_dt.strftime("%Y%m%d_%H%M%S") + f"_{now_dt.microsecond // 1000:03d}"
        path = MUSIC_CHART_SNAPSHOTS_DIR / f"snap_{ts}.json"
        payload = {
            "fetched_at": _iso(now_dt),
            "boards": [b.model_dump() for b in boards],
            "items": [i.model_dump() for i in items],
        }
        path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        self._cleanup_snapshots()
        return path

    def load_latest_snapshot(self) -> tuple[list[MusicBoardInfo], list[MusicItem]] | None:
        if not MUSIC_CHART_SNAPSHOTS_DIR.exists():
            return None
        snaps = sorted(MUSIC_CHART_SNAPSHOTS_DIR.glob("snap_*.json"))
        if not snaps:
            return None
        try:
            data = json.loads(snaps[-1].read_text(encoding="utf-8"))
            boards = [MusicBoardInfo.model_validate(b) for b in data.get("boards", [])]
            items = [MusicItem.model_validate(i) for i in data.get("items", [])]
            return boards, items
        except Exception as e:  # noqa: BLE001
            log.warning("榜单快照加载失败: %s", e)
            return None

    def _cleanup_snapshots(self) -> None:
        cutoff = time.time() - MUSIC_CHART_SNAPSHOT_KEEP_HOURS * 3600
        for f in MUSIC_CHART_SNAPSHOTS_DIR.glob("snap_*.json"):
            try:
                if f.stat().st_mtime < cutoff:
                    f.unlink(missing_ok=True)
            except OSError:
                pass

    # -- 自定义策展榜（我的榜单） --

    @staticmethod
    def _custom_path() -> Path:
        return MUSIC_CHART_DIR / "custom_boards.json"

    def load_custom_boards(self) -> list[CustomBoard]:
        p = self._custom_path()
        if not p.exists():
            seeded = [
                CustomBoard(id=SEED_CUSTOM_BOARD["id"], **{k: v for k, v in SEED_CUSTOM_BOARD.items() if k != "id"})
            ]
            self.save_custom_boards(seeded)
            return seeded
        try:
            raw = json.loads(p.read_text(encoding="utf-8"))
            return [CustomBoard.model_validate(b) for b in raw.get("boards", [])]
        except Exception as e:  # noqa: BLE001
            log.warning("custom_boards.json 损坏，忽略： %s", e)
            return []

    def save_custom_boards(self, boards: list[CustomBoard]) -> None:
        MUSIC_CHART_DIR.mkdir(parents=True, exist_ok=True)
        payload = {"boards": [b.model_dump() for b in boards]}
        with self._lock:
            self._custom_path().write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")


# ---- 服务层 ----


class MusicChartService:
    """聚合编排：抓取 → 归一 → 名次趋势 → 缓存 + 后台自动刷新。"""

    def __init__(self):
        self.store = MusicChartStore()
        self._lock = threading.RLock()
        self._boards: list[MusicBoardInfo] = []
        self._latest: list[MusicItem] = []
        self._last_refresh = ""
        self._last_error = ""
        self._refreshing = False
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None

    # -- 生命周期 --

    def startup(self) -> None:
        ensure_dirs()
        with self._lock:
            snap = self.store.load_latest_snapshot()
            if snap:
                self._boards, self._latest = snap
                self._last_refresh = snap[1][0].last_seen if snap[1] else ""
            # 快照里的自定义榜可能已过期（用户中途增删），以磁盘为准重建
            self._refresh_custom_in_memory()
        self._start_loop()

    def shutdown(self) -> None:
        self._stop.set()

    def _start_loop(self) -> None:
        self._thread = threading.Thread(target=self._loop, daemon=True, name="music-chart-refresh")
        self._thread.start()

    def _loop(self) -> None:
        # 启动先等 30s（不阻塞服务起来，且排在热点雷达首轮之后）
        if self._stop.wait(30):
            return
        try:
            self.refresh()
        except Exception as e:  # noqa: BLE001
            log.warning("榜单首轮自动刷新异常: %s", e)
        interval = MUSIC_CHART_REFRESH_MINUTES * 60
        while not self._stop.wait(interval):
            try:
                self.refresh()
            except Exception as e:  # noqa: BLE001
                log.warning("榜单自动刷新异常: %s", e)

    # -- 抓取与构建 --

    def refresh(self, boards: list[str] | None = None) -> dict:
        """立即抓取（手动/自动共用）。返回源状态摘要。"""
        with self._lock:
            if self._refreshing:
                return {"skipped": True, "reason": "上一次抓取尚未结束"}
            self._refreshing = True
        try:
            return self._do_refresh(boards)
        finally:
            with self._lock:
                self._refreshing = False

    def _do_refresh(self, boards: list[str] | None) -> dict:
        now_dt = _now()
        now_s = _iso(now_dt)
        raw_map = sources.fetch_all(boards)

        state = self.store.load_state()
        state_items: dict[str, dict] = state.get("items", {})

        all_items: list[MusicItem] = []
        board_infos: list[MusicBoardInfo] = []

        for bid, info in sources.QQ_BOARDS.items():
            raw_songs, meta = raw_map.get(bid, ([], {}))
            ok = bool(raw_songs)
            board_infos.append(
                MusicBoardInfo(
                    id=bid,
                    name=info["name"],
                    group=info["group"],
                    desc=info["desc"],
                    source=meta.get("source") or ("抖音音乐人" if bid == "musician" else "QQ音乐"),
                    period=meta.get("period", ""),
                    update_time=meta.get("update_time", ""),
                    update_tips=meta.get("update_tips", ""),
                    intro=meta.get("intro", ""),
                    listen_num=int(meta.get("listen_num") or 0),
                    count=len(raw_songs),
                    ok=ok,
                    error="" if ok else ("未返回数据" if bid in (raw_map or {}) else "本次未抓取"),
                    fetched_at=now_s if ok else "",
                )
            )
            if not raw_songs:
                continue

            total = len(raw_songs)
            for rank, r in enumerate(raw_songs, start=1):
                title = str(r.get("title", "")).strip()
                if not title:
                    continue
                title = title[:80]
                artist = str(r.get("artist", "")).strip()[:60]
                iid = item_id(bid, title, artist)
                prev = state_items.get(iid)
                prev_hist = (prev or {}).get("rank_history") or []
                prev_rank = prev_hist[-1].get("rank") if prev_hist else None
                trend, diff = compute_rank_trend(prev_rank, rank)

                item = MusicItem(
                    id=iid,
                    board=bid,
                    rank=rank,
                    title=title,
                    artist=artist,
                    album=str(r.get("album") or "")[:80],
                    duration=int(r.get("duration") or 0),
                    cover=r.get("cover") or "",
                    url=r.get("url") or "",
                    search_url=sources.douyin_search_url(title, artist),
                    raw_hot=str(r.get("raw_hot") or ""),
                    hot=rank_hot(rank, total),
                    first_seen=(prev or {}).get("first_seen") or now_s,
                    last_seen=now_s,
                    trend=trend,
                    rank_diff=diff,
                    history=[x.get("rank") for x in prev_hist] + [rank],
                )
                hist = (prev or {}).get("rank_history") or []
                hist.append({"t": now_s, "rank": rank})
                state_items[iid] = {
                    "first_seen": item.first_seen,
                    "last_seen": now_s,
                    "best_rank": min((prev or {}).get("best_rank") or 9999, rank),
                    "rank_history": hist[-_HISTORY_KEEP:],
                }
                all_items.append(item)

        # 合成榜：最热BGM（多榜共鸣）+ 抖音热门BGM（抖音生态），随各榜实时重算
        for cid in COMPOSITE_BOARDS:
            comp_items, comp_info = build_composite(cid, raw_map, state_items, now_s)
            all_items.extend(comp_items)
            # bgm_hot 置顶（推荐组），dy_bgm 紧随其后（抖音官方组内靠前）
            board_infos.insert(1 if cid == "dy_bgm" else 0, comp_info)

        # 自定义策展榜（我的榜单）：不参与抓取，仅并入查询视图
        custom_boards = self.store.load_custom_boards()
        custom_items = self._custom_items_to_music_items(custom_boards, now_s)
        all_items.extend(custom_items)
        for cb in custom_boards:
            board_infos.append(self._custom_board_info(cb))

        # 状态瘦身：90 天未在榜的歌曲不再保留名次历史
        stale_cutoff = _iso(now_dt - timedelta(days=90))
        current_ids = {i.id for i in all_items}
        state_items = {
            k: v
            for k, v in state_items.items()
            if v.get("last_seen", "") >= stale_cutoff or k in current_ids
        }

        all_items.sort(key=lambda x: (x.board, x.rank))

        state.update(
            {
                "last_refresh": now_s,
                "last_error": "",
                "items": state_items,
            }
        )
        self.store.save_state(state)
        self.store.save_snapshot(board_infos, all_items)
        with self._lock:
            self._boards = board_infos
            self._latest = all_items
            self._last_refresh = now_s
            self._last_error = ""
        log.info("榜单刷新完成： %d 首 / %d 榜", len(all_items), len(board_infos))
        return {"refreshed_at": now_s, "items": len(all_items), "boards": [b.model_dump() for b in board_infos]}

    # -- 查询 --

    def status(self) -> dict:
        with self._lock:
            return {
                "last_refresh": self._last_refresh,
                "last_error": self._last_error,
                "refresh_minutes": MUSIC_CHART_REFRESH_MINUTES,
                "board_count": len(self._boards),
                "song_count": len(self._latest),
                "boards_ok": sum(1 for b in self._boards if b.ok),
            }

    def boards(self) -> list[MusicBoardInfo]:
        with self._lock:
            return list(self._boards)

    def get_items(
        self,
        board: str = "",
        q: str = "",
        sort: str = "rank",
        limit: int = 200,
    ) -> list[MusicItem]:
        with self._lock:
            items = list(self._latest)
        if board:
            items = [i for i in items if i.board == board]
        if q:
            kws = [k.strip().lower() for k in q.split() if k.strip()]
            items = [
                i
                for i in items
                if any(k in i.title.lower() or k in i.artist.lower() for k in kws)
            ]
        if sort == "fresh":
            items.sort(key=lambda x: x.first_seen or "", reverse=True)
        elif sort == "trend":
            # 新上榜/上升优先，其次名次变化幅度
            order = {"new": 0, "up": 1, "flat": 2, "down": 3}
            items.sort(key=lambda x: (order.get(x.trend, 2), -abs(x.rank_diff), x.rank))
        else:  # rank（默认：榜单原生顺序，按榜分块）
            items.sort(key=lambda x: (x.board, x.rank))
        return items[: max(1, min(1200, limit))]

    def get_boards_summary(self) -> list[dict]:
        """前端榜单切换器：每榜的元信息 + 在榜数。"""
        infos = self.boards()
        return [b.model_dump() for b in infos]

    # -- 自定义策展榜（我的榜单） --

    @staticmethod
    def _custom_board_info(cb: CustomBoard) -> MusicBoardInfo:
        last_added = max((i.added_at for i in cb.items), default="")
        return MusicBoardInfo(
            id=cb.id,
            name=cb.name,
            group="我的榜单",
            desc=cb.desc,
            source="自定义",
            period="",
            update_time=last_added[:10],
            update_tips="自定义收藏榜",
            intro=cb.desc,
            listen_num=0,
            count=len(cb.items),
            ok=True,
            fetched_at=last_added,
        )

    @staticmethod
    def _custom_items_to_music_items(boards: list[CustomBoard], now_s: str = "") -> list[MusicItem]:
        items: list[MusicItem] = []
        for cb in boards:
            for rank, it in enumerate(cb.items, start=1):
                items.append(
                    MusicItem(
                        id=item_id(cb.id, it.title, it.artist),
                        board=cb.id,
                        rank=rank,
                        title=it.title,
                        artist=it.artist,
                        album=it.album,
                        cover=it.cover,
                        url=it.url,
                        search_url=sources.douyin_search_url(it.title, it.artist),
                        raw_hot="",
                        hot=rank_hot(rank, max(1, len(cb.items))),
                        first_seen=it.added_at or now_s,
                        last_seen=it.added_at or now_s,
                        trend="flat",
                        history=[rank],
                    )
                )
        return items

    def _refresh_custom_in_memory(self) -> None:
        """以磁盘上的 custom_boards.json 为准，重建内存中的自定义榜视图。"""
        known = set(sources.QQ_BOARDS) | set(COMPOSITE_BOARDS)
        now_s = _iso(_now())
        with self._lock:
            self._latest = [i for i in self._latest if i.board in known]
            self._boards = [b for b in self._boards if b.id in known]
            cbs = self.store.load_custom_boards()
            self._latest.extend(self._custom_items_to_music_items(cbs, now_s))
            self._latest.sort(key=lambda x: (x.board, x.rank))
            for cb in cbs:
                self._boards.append(self._custom_board_info(cb))

    def custom_boards(self) -> list[CustomBoard]:
        return self.store.load_custom_boards()

    def create_custom_board(self, name: str, desc: str = "") -> CustomBoard:
        boards = self.store.load_custom_boards()
        if any(b.name == name for b in boards):
            raise ValueError(f"榜单「{name}」已存在")
        cb = CustomBoard(id=uuid.uuid4().hex[:8], name=name, desc=desc, created_at=_iso(_now()))
        boards.append(cb)
        self.store.save_custom_boards(boards)
        self._refresh_custom_in_memory()
        return cb

    def delete_custom_board(self, board_id: str) -> bool:
        boards = self.store.load_custom_boards()
        rest = [b for b in boards if b.id != board_id]
        if len(rest) == len(boards):
            return False
        self.store.save_custom_boards(rest)
        self._refresh_custom_in_memory()
        return True

    def add_custom_item(self, board_id: str, data: dict) -> tuple[CustomBoard, bool]:
        """收藏一首歌到自定义榜（同榜同歌名+歌手去重）。返回 (榜单, 是否新加入)。"""
        title = str(data.get("title") or "").strip()
        if not title:
            raise ValueError("歌名不能为空")
        artist = str(data.get("artist") or "").strip()
        boards = self.store.load_custom_boards()
        for b in boards:
            if b.id == board_id:
                if any(
                    normalize_text(i.title) == normalize_text(title)
                    and normalize_text(i.artist) == normalize_text(artist)
                    for i in b.items
                ):
                    return b, False
                b.items.append(
                    CustomItem(
                        title=title[:80],
                        artist=artist[:60],
                        album=str(data.get("album") or "")[:80],
                        cover=str(data.get("cover") or "")[:500],
                        url=str(data.get("url") or "")[:500],
                        note=str(data.get("note") or "")[:200],
                        added_at=_iso(_now()),
                    )
                )
                self.store.save_custom_boards(boards)
                self._refresh_custom_in_memory()
                return b, True
        raise KeyError(f"榜单 {board_id} 不存在")

    def remove_custom_item(self, board_id: str, title: str, artist: str = "") -> bool:
        boards = self.store.load_custom_boards()
        for b in boards:
            if b.id == board_id:
                keep = [
                    i
                    for i in b.items
                    if not (
                        normalize_text(i.title) == normalize_text(title)
                        and normalize_text(i.artist) == normalize_text(artist)
                    )
                ]
                if len(keep) == len(b.items):
                    return False
                b.items = keep
                self.store.save_custom_boards(boards)
                self._refresh_custom_in_memory()
                return True
        return False


# 模块级单例（routers 引用）
service = MusicChartService()
