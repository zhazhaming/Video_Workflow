# -*- coding: utf-8 -*-
"""热点雷达（媒体搜索引擎）核心服务。

职责：
1. 把各平台原始条目归一化成 HotItem（稳定 id / 热度归一 / 搜索直达链接）
2. 快照落盘 + 跨快照对比 → 趋势（new/up/flat/down）与「第一波指数」burst
3. 自定义搜索方向（关键词规则）→ 热点自动归类打标
4. 自动刷新后台线程 + 最近一次快照内存缓存

「第一波流量」判断逻辑：
- 新上榜（trend=new）且热度高 → 最高优先级：热点刚起量，抢首发窗口
- 上升（up）次之；长期霸榜且走平/下滑 → 优先级降低（红利期已过）
- 首次发现时间越近加成越高；跨平台同时出现（共振）额外加权
"""
import hashlib
import json
import logging
import math
import re
import shutil
import threading
import time
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from pydantic import BaseModel, Field

from ..config import (
    HOTSPOT_DIR,
    HOTSPOT_REFRESH_MINUTES,
    HOTSPOT_SNAPSHOTS_DIR,
    HOTSPOT_SNAPSHOT_KEEP_HOURS,
    ensure_dirs,
)
from . import hotspot_sources as sources

log = logging.getLogger("hotspot")

CROSS_PLATFORM_BONUS = 8.0  # 同标题跨平台共振加成
_HISTORY_KEEP = 40  # 每条热点保留的最近热度点数
# 今日早报每个栏目的展示条数（15 行，方便逐条筛选做内容）；也是路由层允许的上限
BRIEF_TOP_N = 15

PRESET_DIRECTIONS = [
    {"name": "AI科技", "keywords": ["AI", "人工智能", "大模型", "机器人", "芯片", "手机", "互联网", "程序员"], "exclude": []},
    {"name": "影视娱乐", "keywords": ["电影", "电视剧", "综艺", "明星", "演唱会", "导演", "票房", "主播"], "exclude": []},
    {"name": "社会民生", "keywords": ["养老", "房价", "生育", "工资", "就业", "医院", "学校", "食品安全", "天气", "假期"], "exclude": []},
    {"name": "游戏电竞", "keywords": ["游戏", "电竞", "王者荣耀", "原神", "主机", "主播"], "exclude": []},
]

# 内置科普频道（早报「科普知识」栏目）：子话题 → 关键词。
# 命中任一子话题词表即视为科普/知识内容，与用户自定义方向（directions）互不影响。
SCIENCE_TOPICS: list[tuple[str, list[str]]] = [
    ("宇宙地球", ["地球", "宇宙", "太空", "天文", "NASA", "黑洞", "火星", "月球", "太阳系", "陨石",
                  "火箭", "登月", "航天", "卫星", "引力", "星系", "恒星", "行星", "恐龙", "灭绝",
                  "化石", "起源", "寒武纪", "侏罗纪", "大陆", "海洋", "深海", "地震", "火山",
                  "冰河", "冰川", "气候", "全球变暖", "进化", "演化"]),
    ("AI科技", ["AI", "人工智能", "大模型", "GPT", "OpenAI", "芯片", "半导体", "机器人", "量子",
                "算法", "自动驾驶", "脑机", "核聚变", "深度学习", "神经网络", "算力"]),
    ("财经知识", ["黄金", "金价", "股票", "股市", "A股", "美股", "港股", "基金", "理财", "央行",
                  "利率", "降息", "加息", "汇率", "通胀", "通货膨胀", "美联储", "货币", "存款",
                  "银行", "楼市", "房贷", "经济周期", "货币政策"]),
    ("健康心理", ["健康", "医学", "医生", "癌症", "病毒", "疫苗", "睡眠", "抑郁", "焦虑", "心理",
                  "心理学", "大脑", "记忆", "衰老", "免疫", "营养", "减肥", "久坐", "体检"]),
    ("历史人文", ["历史", "考古", "文物", "出土", "遗址", "古墓", "三国", "秦朝", "汉朝", "唐朝",
                  "宋朝", "明朝", "清朝", "皇帝", "王朝", "文明", "古籍", "甲骨", "敦煌", "兵马俑"]),
    ("生活百科", ["科普", "冷知识", "为什么", "原理", "常识", "数学", "物理", "化学", "生物",
                  "动物", "植物", "昆虫", "宇宙未知"]),
]


# ---- 数据模型 ----


class HotItem(BaseModel):
    id: str
    platform: str
    title: str
    url: str = ""
    search_url: str = ""
    hot: float = 0.0  # 归一化热度 0~100（同平台内）
    raw_hot: str = ""
    rank: int = 0
    tag: str = ""
    summary: str = ""
    first_seen: str = ""
    last_seen: str = ""
    trend: str = "new"  # new | up | flat | down
    trend_delta: float = 0.0  # 与上次抓取相比的相对变化率（%）
    history: list[float] = []  # 最近若干轮的归一化热度（含本轮），用于前端 sparkline
    burst: float = 0.0  # 第一波指数 0~100
    cross_platform: bool = False
    platforms: list[str] = []  # 同标题出现的所有平台
    direction_ids: list[str] = []
    match_keywords: list[str] = []
    subtopics: list[str] = []  # 内置科普频道命中的子话题（宇宙地球/AI科技/…）


class HotDirection(BaseModel):
    id: str
    name: str = Field(min_length=1, max_length=30)
    keywords: list[str] = Field(default_factory=list, max_length=30)
    exclude: list[str] = Field(default_factory=list, max_length=30)
    enabled: bool = True


class SavedTopic(BaseModel):
    """AI 选题落库：今日选题工作台的条目。"""

    id: str
    title: str = Field(min_length=1, max_length=60)
    angle: str = ""
    hook: str = ""
    why: str = ""
    ref: str = ""  # 来源热点标题
    ref_platforms: list[str] = []
    created_at: str = ""
    status: str = "todo"  # todo | doing | done | dropped
    project_id: str = ""  # 一键建项目后回填，可从热点雷达直达项目
    note: str = ""  # 创作者备注（如：已联系出镜、素材在某文件夹）


TOPIC_STATUS_FLOW = {"todo": "doing", "doing": "done", "done": "todo", "dropped": "todo"}


class SourceStatus(BaseModel):
    platform: str
    name: str
    ok: bool = False
    count: int = 0
    error: str = ""
    fetched_at: str = ""


# 工具仓库受众启发式（AI 解读前的兜底标签，AI 结果会覆盖它）
TOOL_AUDIENCE_RULES: list[tuple[str, list[str]]] = [
    ("程序员", ["cli", "terminal", "framework", "library", "sdk", "开发", "代码", "编译", "docker", "kubernetes", "rust", "python", "typescript", "golang", "debug"]),
    ("硬件工程师", ["embedded", "固件", "单片机", "mcu", "arduino", "raspberry", "pcb", "firmware", "iot", "esp32"]),
    ("产品经理", ["low-code", "nocode", "原型", "prototype", "dashboard", "看板", "图表", "报表", "需求", "diagram", "白板", "流程图", "flow"]),
    ("运营·自媒体", ["seo", "marketing", "营销", "写作", "文案", "运营", "自媒体", "短视频", "小红书", "公众号", "content", "social", "直播"]),
    ("行政·办公", ["excel", "办公", "文档", "office", "notion", "日历", "日程", "审批", "报销", "发票", "workflow", "自动化", "ocr", "pdf", "翻译"]),
    ("设计师", ["design", "figma", " ui ", "uikit", "ui kit", "icon", "插画", "illustration", "photoshop", "渲染", "配色", "font", "字体", "3d"]),
]


def guess_audience(summary: str, lang: str) -> list[str]:
    """AI 解读前按描述/语言猜受众标签，保证工具栏目开箱即有内容。"""
    text = f" {summary} {lang} ".lower()  # 前后补空格，避免 ui/design 等短词误命中子串
    hits = [aud for aud, kws in TOOL_AUDIENCE_RULES if any(k in text for k in kws)]
    return hits[:3] or ["全员通用"]


# ---- 工具 ----


def _now() -> datetime:
    return datetime.now(timezone.utc).astimezone()


def _iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def _parse_iso(s: str) -> datetime | None:
    try:
        return datetime.strptime(s, "%Y-%m-%d %H:%M:%S").astimezone()
    except (ValueError, TypeError):
        return None


def normalize_title(title: str) -> str:
    """标题标准化：去空白、全角转半角、小写——用于稳定 id 与跨平台对齐。"""
    t = re.sub(r"\s+", "", title or "").lower()
    return t.translate(str.maketrans("，。！？：；、（）【】《》", ",.!??:;()[]<>"))


def item_id(platform: str, title: str) -> str:
    norm = normalize_title(title)
    return hashlib.md5(f"{platform}|{norm}".encode("utf-8")).hexdigest()[:12]


def normalize_hot(raw: float | None, rank: int, total: int) -> float:
    """无数值榜单的排名代理热度：榜首 100，末位趋近 30。"""
    if total <= 1:
        return 100.0
    return round(30.0 + 70.0 * (total - rank) / max(1, total - 1), 2)


def _scale_platform(raws: list[float | None]) -> list[float]:
    """同平台内对数归一：max → 100。无数值的条目记 0。"""
    vals = [r if (r and r > 0) else 0.0 for r in raws]
    mx = max(vals) if vals else 0.0
    if mx <= 0:
        return [0.0] * len(vals)
    denom = math.log10(mx + 1)
    return [round(math.log10(v + 1) / denom * 100, 2) for v in vals]


# ---- 趋势与第一波指数 ----


def compute_trend(prev_value: float | None, cur_value: float) -> tuple[str, float]:
    """对比上次抓取：(trend, delta)。

    delta 为相对变化率（%），阈值 6%：过滤榜单抖动，只认真涨真跌。
    首次出现 → new。
    """
    if prev_value is None or prev_value <= 0:
        return "new", 0.0
    delta = round((cur_value - prev_value) / prev_value * 100, 1)
    threshold = max(2.0, prev_value * 0.06)
    if cur_value - prev_value > threshold:
        return "up", delta
    if cur_value - prev_value < -threshold:
        return "down", delta
    return "flat", delta


_TREND_BASE = {"new": 58.0, "up": 48.0, "flat": 30.0, "down": 16.0}


def compute_burst(trend: str, hot: float, first_seen: str, cross: bool) -> float:
    """第一波指数 0~100：趋势基础分 + 热度 + 新鲜度，共振热点越过普通上限。

    普通热点封顶 97，跨平台共振额外 +8 可到 100 —— 保证共振大热点永远排在前面。
    """
    base = _TREND_BASE.get(trend, 30.0)
    dt = _parse_iso(first_seen)
    if dt is None:
        fresh = 0.0
    else:
        age_h = (_now() - dt).total_seconds() / 3600
        if age_h <= 0.5:
            fresh = 15.0
        elif age_h <= 2:
            fresh = 10.0
        elif age_h <= 6:
            fresh = 5.0
        elif age_h <= 24:
            fresh = 0.0
        else:
            fresh = -10.0  # 超过一天的霸榜热点，首发窗口基本关闭
    score = min(97.0, base + hot * 0.35 + fresh)
    if cross:
        score += CROSS_PLATFORM_BONUS
    return round(max(0.0, min(100.0, score)), 1)


# ---- 方向匹配 ----


def match_directions(item: HotItem, directions: list[HotDirection]) -> None:
    """按关键词规则把热点归类到自定义搜索方向。"""
    title = item.title.lower()
    item.direction_ids = []
    item.match_keywords = []
    for d in directions:
        if not d.enabled:
            continue
        if any(x and x.lower() in title for x in d.exclude):
            continue
        hits = [k for k in d.keywords if k and k.lower() in title]
        if hits:
            item.direction_ids.append(d.id)
            item.match_keywords.extend(hits)


def match_channels(item: HotItem) -> None:
    """内置科普频道匹配：标题命中任一子话题词表即视为科普/知识内容。

    GitHub 仓库属于工具栏目，不参与科普归类。
    """
    item.subtopics = []
    if item.platform == "github":
        return
    title = item.title.lower()
    for name, kws in SCIENCE_TOPICS:
        if any(k.lower() in title for k in kws):
            item.subtopics.append(name)


# ---- 存储层 ----


class HotspotStore:
    """state.json（热度历史/源状态）+ directions.json + 快照文件。"""

    def __init__(self):
        self._lock = threading.Lock()

    @staticmethod
    def _state_path() -> Path:
        return HOTSPOT_DIR / "state.json"

    @staticmethod
    def _directions_path() -> Path:
        return HOTSPOT_DIR / "directions.json"

    def load_state(self) -> dict:
        p = self._state_path()
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except FileNotFoundError:
            return {}
        except Exception as e:  # noqa: BLE001
            log.warning("state.json 损坏（%s），尝试回退备份", e)
            bak = p.with_suffix(".json.bak")
            try:
                data = json.loads(bak.read_text(encoding="utf-8"))
                log.warning("已从 state.json.bak 恢复热度历史")
                return data
            except Exception:  # noqa: BLE001
                log.warning("state.json 备份也不可用，使用全新状态")
                return {}

    def save_state(self, state: dict) -> None:
        HOTSPOT_DIR.mkdir(parents=True, exist_ok=True)
        p = self._state_path()
        # 覆盖前备份上一份，写坏可回退（趋势历史不可再生）
        try:
            if p.exists():
                shutil.copyfile(p, p.with_suffix(".json.bak"))
        except OSError as e:  # noqa: BLE001
            log.warning("state.json 备份失败（不影响主写入）: %s", e)
        with self._lock:
            p.write_text(
                json.dumps(state, ensure_ascii=False, indent=1), encoding="utf-8"
            )

    def load_directions(self) -> list[HotDirection]:
        p = self._directions_path()
        if not p.exists():
            seeded = [
                HotDirection(id=uuid.uuid4().hex[:8], **d) for d in PRESET_DIRECTIONS
            ]
            self.save_directions(seeded)
            return seeded
        raw = json.loads(p.read_text(encoding="utf-8"))
        return [HotDirection.model_validate(d) for d in raw.get("directions", [])]

    def save_directions(self, directions: list[HotDirection]) -> None:
        HOTSPOT_DIR.mkdir(parents=True, exist_ok=True)
        payload = {"directions": [d.model_dump() for d in directions]}
        with self._lock:
            self._directions_path().write_text(
                json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8"
            )

    def save_snapshot(self, items: list[HotItem]) -> Path:
        HOTSPOT_SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)
        now_dt = _now()
        # 毫秒精度：手动刷新与自动刷新同秒不互相覆盖
        ts = now_dt.strftime("%Y%m%d_%H%M%S") + f"_{now_dt.microsecond // 1000:03d}"
        path = HOTSPOT_SNAPSHOTS_DIR / f"snap_{ts}.json"
        payload = {
            "fetched_at": _iso(now_dt),
            "items": [i.model_dump() for i in items],
        }
        path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        self._cleanup_snapshots()
        return path

    def load_latest_snapshot(self) -> list[HotItem] | None:
        if not HOTSPOT_SNAPSHOTS_DIR.exists():
            return None
        snaps = sorted(HOTSPOT_SNAPSHOTS_DIR.glob("snap_*.json"))
        if not snaps:
            return None
        try:
            data = json.loads(snaps[-1].read_text(encoding="utf-8"))
            return [HotItem.model_validate(i) for i in data.get("items", [])]
        except Exception as e:  # noqa: BLE001
            log.warning("快照加载失败: %s", e)
            return None

    def load_prev_snapshot_ids(self) -> set[str] | None:
        """上一轮快照（倒数第二份）的在榜条目 id 集合；不足两份返回 None。"""
        if not HOTSPOT_SNAPSHOTS_DIR.exists():
            return None
        snaps = sorted(HOTSPOT_SNAPSHOTS_DIR.glob("snap_*.json"))
        if len(snaps) < 2:
            return None
        try:
            data = json.loads(snaps[-2].read_text(encoding="utf-8"))
            return {i.get("id") for i in data.get("items", []) if i.get("id")}
        except Exception as e:  # noqa: BLE001
            log.warning("上一份快照加载失败: %s", e)
            return None

    def _cleanup_snapshots(self) -> None:
        cutoff = time.time() - HOTSPOT_SNAPSHOT_KEEP_HOURS * 3600
        for f in HOTSPOT_SNAPSHOTS_DIR.glob("snap_*.json"):
            try:
                if f.stat().st_mtime < cutoff:
                    f.unlink(missing_ok=True)
            except OSError:
                pass

    # -- 选题工作台 --

    @staticmethod
    def _topics_path() -> Path:
        return HOTSPOT_DIR / "topics.json"

    def load_topics(self) -> list[SavedTopic]:
        p = self._topics_path()
        if not p.exists():
            return []
        try:
            raw = json.loads(p.read_text(encoding="utf-8"))
            return [SavedTopic.model_validate(t) for t in raw.get("topics", [])]
        except Exception as e:  # noqa: BLE001
            log.warning("topics.json 损坏，忽略： %s", e)
            return []

    def save_topics(self, topics: list[SavedTopic]) -> None:
        HOTSPOT_DIR.mkdir(parents=True, exist_ok=True)
        payload = {"topics": [t.model_dump() for t in topics]}
        with self._lock:
            self._topics_path().write_text(
                json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8"
            )

    # -- 工具解读缓存（按仓库名，跨轮次/重启复用，省 token） --

    @staticmethod
    def _tools_meta_path() -> Path:
        return HOTSPOT_DIR / "tools_meta.json"

    def load_tools_meta(self) -> dict[str, dict]:
        p = self._tools_meta_path()
        if not p.exists():
            return {}
        try:
            return json.loads(p.read_text(encoding="utf-8")).get("tools", {})
        except Exception as e:  # noqa: BLE001
            log.warning("tools_meta.json 损坏，忽略： %s", e)
            return {}

    def save_tools_meta(self, meta: dict[str, dict]) -> None:
        HOTSPOT_DIR.mkdir(parents=True, exist_ok=True)
        payload = {"updated_at": _iso(_now()), "tools": meta}
        with self._lock:
            self._tools_meta_path().write_text(
                json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8"
            )


# ---- 服务层 ----


class HotspotService:
    """聚合编排：抓取 → 归一 → 趋势 → 方向 → 缓存 + 后台自动刷新。"""

    def __init__(self):
        self.store = HotspotStore()
        self._lock = threading.RLock()
        self._latest: list[HotItem] = []
        self._state: dict = {}
        self._refreshing = False
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None

    # -- 生命周期 --

    def startup(self) -> None:
        ensure_dirs()
        with self._lock:
            self._state = self.store.load_state()
            self._latest = self.store.load_latest_snapshot() or []
        self._start_loop()

    def shutdown(self) -> None:
        self._stop.set()

    def _start_loop(self) -> None:
        self._thread = threading.Thread(target=self._loop, daemon=True, name="hotspot-refresh")
        self._thread.start()

    def _loop(self) -> None:
        # 启动先等 20s（不阻塞服务起来），然后周期抓取
        if self._stop.wait(20):
            return
        self.refresh()
        interval = HOTSPOT_REFRESH_MINUTES * 60
        while not self._stop.wait(interval):
            try:
                self.refresh()
            except Exception as e:  # noqa: BLE001
                log.warning("热点自动刷新异常: %s", e)

    # -- 抓取与构建 --

    def refresh(self, platforms: list[str] | None = None) -> dict:
        """立即抓取（手动/自动共用）。返回源状态摘要。"""
        with self._lock:
            if self._refreshing:
                return {"skipped": True, "reason": "上一次抓取尚未结束"}
            self._refreshing = True
        try:
            return self._do_refresh(platforms)
        finally:
            with self._lock:
                self._refreshing = False

    def _do_refresh(self, platforms: list[str] | None) -> dict:
        now_dt = _now()
        now_s = _iso(now_dt)
        raw_map = sources.fetch_all(platforms)

        directions = self.store.load_directions()
        state = self.store.load_state()
        state_items: dict[str, dict] = state.get("items", {})
        title_seen: dict[str, dict] = state.get("title_seen", {})

        all_items: list[HotItem] = []
        src_status: dict[str, dict] = {}
        for pid in sources.FETCHERS:
            name = sources.PLATFORM_NAMES.get(pid, pid)
            if pid in raw_map:
                raws = raw_map[pid]
                ok = bool(raws)
                src_status[pid] = {
                    "platform": pid,
                    "name": name,
                    "ok": ok,
                    "count": len(raws),
                    "error": "" if ok else "未返回数据",
                    "fetched_at": now_s,
                }
            else:
                raws = []
                # 本次未抓取的源保留上次状态
                prev = (state.get("sources") or {}).get(pid) or {}
                src_status[pid] = {**prev, "platform": pid, "name": name} if prev else {
                    "platform": pid, "name": name, "ok": False, "count": 0,
                    "error": "本次未抓取", "fetched_at": "",
                }

            if not raws:
                continue

            # 同平台归一热度：有数值用对数缩放，无数值用排名代理
            numeric = [_raw_hot(r) for r in raws]
            if any(n is not None for n in numeric):
                heats = _scale_platform(numeric)
            else:
                total0 = len(numeric)
                heats = [normalize_hot(None, i, total0) for i in range(1, total0 + 1)]
            total = len(raws)
            for rank, (r, h) in enumerate(zip(raws, heats), start=1):
                title = r["title"]
                iid = item_id(pid, title)
                norm = normalize_title(title)
                raw = _raw_hot(r)
                prev = state_items.get(iid)
                prev_hist = (prev or {}).get("heat_history") or []
                prev_raw = prev_hist[-1].get("raw") if prev_hist else None
                prev_hot = prev_hist[-1].get("hot") if prev_hist else None
                # 趋势基于原始热度（归一化后榜首恒为 100，会抹掉涨跌）
                if raw is not None:
                    trend, delta = compute_trend(prev_raw, raw)
                else:
                    trend, delta = compute_trend(prev_hot, h)

                seen = title_seen.get(norm)
                if seen is None:
                    title_seen[norm] = {
                        "platforms": [pid],
                        "first_seen": now_s,
                    }
                    seen = title_seen[norm]
                elif pid not in seen["platforms"]:
                    seen["platforms"] = seen.get("platforms", []) + [pid]

                item = HotItem(
                    id=iid,
                    platform=pid,
                    title=title,
                    url=r.get("url") or "",
                    search_url=sources.search_url(pid, title),
                    hot=h,
                    raw_hot=r.get("raw_hot") or "",
                    rank=rank,
                    tag=str(r.get("tag") or ""),
                    summary=str(r.get("summary") or ""),
                    first_seen=(prev or {}).get("first_seen") or now_s,
                    last_seen=now_s,
                    trend=trend,
                    trend_delta=delta,
                    history=[x.get("hot") or 0.0 for x in prev_hist] + [h],
                )
                # 历史热度记录（raw 用于下一轮趋势对比）
                hist = (prev or {}).get("heat_history") or []
                hist.append({"t": now_s, "hot": h, "raw": raw})
                state_items[iid] = {
                    "first_seen": item.first_seen,
                    "last_seen": now_s,
                    "peak": max((prev or {}).get("peak") or 0, h),
                    "heat_history": hist[-_HISTORY_KEEP:],
                }
                all_items.append(item)

        # 跨平台共振 + 方向匹配 + burst
        current_norms = {normalize_title(i.title) for i in all_items}
        for item in all_items:
            norm = normalize_title(item.title)
            plats = title_seen.get(norm, {}).get("platforms", [item.platform])
            item.platforms = plats
            item.cross_platform = len(set(plats)) >= 2
            match_directions(item, directions)
            match_channels(item)
            item.burst = compute_burst(item.trend, item.hot, item.first_seen, item.cross_platform)

        # 状态瘦身：超过 7 天且本轮没再出现的热点不再保留历史
        stale_cutoff = _iso(now_dt - timedelta(days=7))
        state_items = {
            k: v for k, v in state_items.items()
            if v.get("last_seen", "") >= stale_cutoff or k in {i.id for i in all_items}
        }
        title_seen = {
            k: v for k, v in title_seen.items()
            if v.get("first_seen", "") >= stale_cutoff or k in current_norms
        }

        # 排序：第一波指数 → 热度
        all_items.sort(key=lambda x: (-x.burst, -x.hot))

        state.update(
            {
                "last_refresh": now_s,
                "last_error": "",
                "sources": src_status,
                "items": state_items,
                "title_seen": title_seen,
            }
        )
        self.store.save_state(state)
        self.store.save_snapshot(all_items)
        with self._lock:
            self._state = state
            self._latest = all_items
        log.info("热点刷新完成： %d 条 / %d 源", len(all_items), len(raw_map))
        return {"refreshed_at": now_s, "items": len(all_items), "sources": src_status}

    # -- 查询 --

    def status(self) -> dict:
        with self._lock:
            state = self._state
            latest = self._latest
            srcs = [
                s
                for s in (state.get("sources") or {}).values()
                if isinstance(s, dict)
            ]
            pending = [
                {"platform": pid, "name": name}
                for pid, name in sources.PENDING_PLATFORMS.items()
            ]
            return {
                "last_refresh": state.get("last_refresh", ""),
                "last_error": state.get("last_error", ""),
                "refresh_minutes": HOTSPOT_REFRESH_MINUTES,
                "item_count": len(latest),
                "sources": srcs,
                "pending_platforms": pending,
            }

    def get_items(
        self,
        direction_id: str = "",
        platform: str = "",
        q: str = "",
        sort: str = "burst",
        limit: int = 100,
    ) -> list[HotItem]:
        with self._lock:
            items = list(self._latest)
        if direction_id:
            if direction_id == "__none__":
                items = [i for i in items if not i.direction_ids]
            else:
                items = [i for i in items if direction_id in i.direction_ids]
        if platform:
            items = [i for i in items if i.platform == platform]
        if q:
            kws = [k.strip().lower() for k in q.split() if k.strip()]
            items = [
                i
                for i in items
                if any(k in i.title.lower() for k in kws)
            ]
        if sort == "hot":
            items.sort(key=lambda x: (-x.hot, -x.burst))
        elif sort == "fresh":
            items.sort(key=lambda x: x.first_seen or "", reverse=True)
        else:  # burst（默认，第一波优先）
            items.sort(key=lambda x: (-x.burst, -x.hot))
        return items[: max(1, min(300, limit))]

    def get_items_by_ids(self, ids: list[str]) -> list[HotItem]:
        with self._lock:
            latest = {i.id: i for i in self._latest}
        return [latest[i] for i in ids if i in latest]

    # -- 选题工作台 --

    def add_topics(self, raw_topics: list[dict], ref_platforms: dict[str, list[str]] | None = None) -> list[SavedTopic]:
        """AI 生成的选题落库（补 id/时间/来源平台）。"""
        now_s = _iso(_now())
        ref_platforms = ref_platforms or {}
        existing = self.store.load_topics()
        saved = []
        for t in raw_topics:
            title = str(t.get("title") or "").strip()[:60]
            if not title:
                continue
            ref = str(t.get("ref") or "").strip()
            saved.append(
                SavedTopic(
                    id=uuid.uuid4().hex[:8],
                    title=title,
                    angle=str(t.get("angle") or "")[:200],
                    hook=str(t.get("hook") or "")[:120],
                    why=str(t.get("why") or "")[:200],
                    ref=ref[:80],
                    ref_platforms=ref_platforms.get(normalize_title(ref), []),
                    created_at=now_s,
                )
            )
        self.store.save_topics(existing + saved)
        return saved

    def ref_counts(self) -> dict[str, int]:
        """来源热点标题 → 已生成选题数（前端用于去重提示）。"""
        counts: dict[str, int] = {}
        for t in self.store.load_topics():
            if t.ref:
                key = normalize_title(t.ref)
                counts[key] = counts.get(key, 0) + 1
        return counts

    def update_topic(
        self,
        topic_id: str,
        status: str | None = None,
        project_id: str | None = None,
        note: str | None = None,
    ) -> SavedTopic | None:
        topics = self.store.load_topics()
        for i, t in enumerate(topics):
            if t.id == topic_id:
                if status is not None:
                    t.status = status
                if project_id is not None:
                    t.project_id = project_id
                if note is not None:
                    t.note = note[:300]
                topics[i] = t
                self.store.save_topics(topics)
                return t
        return None

    def delete_topic(self, topic_id: str) -> bool:
        topics = self.store.load_topics()
        rest = [t for t in topics if t.id != topic_id]
        if len(rest) == len(topics):
            return False
        self.store.save_topics(rest)
        return True

    def clear_topics(self, statuses: list[str]) -> int:
        """批量删除指定状态的选题，返回删除数。"""
        topics = self.store.load_topics()
        keep = [t for t in topics if t.status not in statuses]
        removed = len(topics) - len(keep)
        if removed:
            self.store.save_topics(keep)
        return removed

    # -- 每日早报 --

    def briefing(self, top_n: int = BRIEF_TOP_N) -> dict:
        """今日早报：三个栏目（实时热点 / 科普知识 / 工具分享），规则生成、不依赖 LLM。"""
        with self._lock:
            items = list(self._latest)
        items.sort(key=lambda x: (-x.burst, -x.hot))
        now_dt = _now()

        # 实时热点：国内平台热点（GitHub 仓库归工具栏目）
        hot_pool = [i for i in items if i.platform != "github"]
        fresh_24h = sum(
            1
            for i in hot_pool
            if (dt := _parse_iso(i.first_seen)) and (now_dt - dt).total_seconds() < 86400
        )
        top = []
        for i in hot_pool[: max(1, min(BRIEF_TOP_N, top_n))]:
            top.append(
                {
                    "id": i.id,
                    "title": i.title,
                    "platform": sources.PLATFORM_NAMES.get(i.platform, i.platform),
                    "burst": i.burst,
                    "trend": i.trend,
                    "trend_delta": i.trend_delta,
                    "raw_hot": i.raw_hot or str(int(i.hot)),
                    "first_seen": i.first_seen,
                    "cross": i.cross_platform,
                    "platforms": [sources.PLATFORM_NAMES.get(p, p) for p in i.platforms],
                    "search_url": i.search_url,
                    "reason": _hot_reason(i, now_dt),
                }
            )
        science = self._science_section(hot_pool, top_n, now_dt)
        tools = self.tools_section(top_n)
        src_ok = [
            s
            for s in (self._state.get("sources") or {}).values()
            if isinstance(s, dict) and s.get("ok")
        ]
        # 洞察：方向命中分布 + 平台在榜分布
        dir_counts: dict[str, int] = {}
        plat_counts: dict[str, int] = {}
        for i in items:
            for d in i.direction_ids:
                dir_counts[d] = dir_counts.get(d, 0) + 1
            plat_counts[i.platform] = plat_counts.get(i.platform, 0) + 1
        directions = self.store.load_directions()
        dir_name_map = {d.id: d.name for d in directions}
        avg_burst = round(sum(i.burst for i in items) / len(items), 1) if items else 0.0
        # 早报环比：与上一份快照的在榜重合率（低=榜单大换血，新热点多）
        overlap_pct: float | None = None
        prev_ids = self.store.load_prev_snapshot_ids()
        if prev_ids is not None and items:
            cur_ids = {i.id for i in items}
            overlap_pct = round(len(cur_ids & prev_ids) / len(cur_ids) * 100, 1)
        return {
            "generated_at": _iso(now_dt),
            "items": top,
            "science": science,
            "tools": tools,
            "stats": {
                "total": len(items),
                "fresh_24h": fresh_24h,
                "sources_ok": len(src_ok),
                "sources_total": len(sources.FETCHERS),
                "avg_burst": avg_burst,
                "science_total": science["total"],
                "tools_total": tools["total"],
                **({"overlap_pct": overlap_pct} if overlap_pct is not None else {}),
                "directions": [
                    {"id": k, "name": dir_name_map.get(k, k), "count": v}
                    for k, v in sorted(dir_counts.items(), key=lambda x: -x[1])[:6]
                ],
                "platforms": [
                    {
                        "platform": k,
                        "name": sources.PLATFORM_NAMES.get(k, k),
                        "count": v,
                    }
                    for k, v in sorted(plat_counts.items(), key=lambda x: -x[1])
                ],
            },
        }

    def _science_section(self, pool: list[HotItem], top_n: int, now_dt: datetime) -> dict:
        """科普栏目：命中内置科普子话题的热点，按第一波指数排序。"""
        science = [i for i in pool if i.subtopics]
        science.sort(key=lambda x: (-x.burst, -x.hot))
        sub_counts: dict[str, int] = {}
        for i in science:
            for s in i.subtopics:
                sub_counts[s] = sub_counts.get(s, 0) + 1
        out = []
        for i in science[: max(1, min(BRIEF_TOP_N, top_n))]:
            out.append(
                {
                    "id": i.id,
                    "title": i.title,
                    "platform": sources.PLATFORM_NAMES.get(i.platform, i.platform),
                    "burst": i.burst,
                    "trend": i.trend,
                    "trend_delta": i.trend_delta,
                    "raw_hot": i.raw_hot or str(int(i.hot)),
                    "cross": i.cross_platform,
                    "platforms": [sources.PLATFORM_NAMES.get(p, p) for p in i.platforms],
                    "search_url": i.search_url,
                    "subtopics": i.subtopics,
                    "reason": f"「{'、'.join(i.subtopics[:2])}」知识方向；{_hot_reason(i, now_dt)}",
                }
            )
        return {
            "generated_at": _iso(now_dt),
            "total": len(science),
            "subtopics": [
                {"name": k, "count": v}
                for k, v in sorted(sub_counts.items(), key=lambda x: -x[1])[:6]
            ],
            "items": out,
        }

    def tools_section(self, top_n: int = BRIEF_TOP_N) -> dict:
        """工具栏目：GitHub 热门仓库 + 受众/用途解读（AI 缓存优先，启发式兜底）。"""
        with self._lock:
            items = [i for i in self._latest if i.platform == "github"]
        items.sort(key=lambda x: (-x.hot, -x.burst))
        meta = self.store.load_tools_meta()
        out = []
        for i in items[: max(1, min(20, top_n))]:
            m = meta.get(normalize_title(i.title)) or {}
            out.append(
                {
                    "id": i.id,
                    "title": i.title,
                    "url": i.url or f"https://github.com/{i.title}",
                    "summary": i.summary,
                    "language": i.tag,
                    "stars": i.raw_hot,
                    "burst": i.burst,
                    "trend": i.trend,
                    "audience": m.get("audience") or guess_audience(i.summary, i.tag),
                    "use": str(m.get("use") or ""),
                    "why": str(m.get("why") or ""),
                    "ai_done": bool(m.get("use")),
                }
            )
        src_ok = any(
            isinstance(s, dict) and s.get("platform") == "github" and s.get("ok")
            for s in (self._state.get("sources") or {}).values()
        )
        return {
            "generated_at": self._state.get("last_refresh", ""),
            "total": len(items),
            "source_ok": src_ok,
            "items": out,
        }

    def merge_tools_meta(self, results: list[dict]) -> int:
        """AI 解读结果按仓库名落盘缓存（只认当前在榜仓库，防幻觉）；返回新缓存数。"""
        with self._lock:
            known = {
                normalize_title(i.title)
                for i in self._latest
                if i.platform == "github"
            }
        meta = self.store.load_tools_meta()
        now_s = _iso(_now())
        added = 0
        for r in results:
            if not isinstance(r, dict):
                continue
            key = normalize_title(str(r.get("ref") or ""))
            if not key or key not in known:
                continue
            audience = [
                str(a).strip()[:12]
                for a in (r.get("audience") or [])
                if str(a).strip()
            ][:4]
            meta[key] = {
                "audience": audience or ["全员通用"],
                "use": str(r.get("use") or "").strip()[:80],
                "why": str(r.get("why") or "").strip()[:80],
                "at": now_s,
            }
            added += 1
        if added:
            self.store.save_tools_meta(meta)
        return added


def _raw_hot(r: dict) -> float | None:
    v = r.get("hot")
    if isinstance(v, (int, float)) and v > 0:
        return float(v)
    return None


def _hot_reason(i: HotItem, now_dt: datetime) -> str:
    """早报条目的入选理由（实时热点/科普栏目共用）。"""
    parts = []
    plats = [sources.PLATFORM_NAMES.get(p, p) for p in set(i.platforms)]
    if len(plats) >= 2:
        parts.append(f"{'、'.join(plats[:3])}多平台同时上榜，大事件信号")
    dt = _parse_iso(i.first_seen)
    if dt:
        age_min = (now_dt - dt).total_seconds() / 60
        if i.trend == "new":
            parts.append(f"刚上榜（{int(age_min)} 分钟前首见），首发窗口正开")
        elif i.trend == "up":
            parts.append(f"热度还在涨（+{i.trend_delta}%），跟进入场不晚")
    if i.tag and i.tag not in ("", "新"):
        parts.append(f"平台标记「{i.tag}」")
    if not parts:
        parts.append("持续霸榜，可做长尾解读")
    return "；".join(parts[:2])


# 模块级单例（routers 引用）
service = HotspotService()
