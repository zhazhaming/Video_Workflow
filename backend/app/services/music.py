# -*- coding: utf-8 -*-
"""BGM 自动匹配：按剧本情绪（关键词加权）从曲库中挑选合适的曲子。

规则简单但可解释：负面/低谷词多 → 低沉悬疑；正向/励志词多 → 明亮励志；
结尾转向温暖 → 温暖钢琴；无法判断 → 温暖钢琴。

另提供在线自动搜曲（auto_search_track）：AI 导演在风格圣经里指定 "__search__"
+ 英文关键词时，从 CC 授权曲库（Jamendo/Openverse/Commons）搜索并导入本地，
导入名 auto_<md5(query)> 幂等——同一关键词只搜一次，之后直接复用。
"""
import hashlib
import tempfile

from ..schemas import ScriptDraft

NEG_WORDS = [
    "崩溃", "哭", "失业", "裁员", "离开", "病", "痛", "绝望", "沉默", "雨夜",
    "遗憾", "孤独", "熬夜", "深夜", "凌晨", "失败", "欠", "房贷", "压力",
    "告别", "错过", "倒下", "心酸", "委屈", "冷", "黑", "输",
]
POS_WORDS = [
    "希望", "坚持", "重新", "站起来", "光", "温暖", "笑", "未来", "梦想",
    "努力", "赢", "成功", "爱", "家", "重逢", "春天", "值得", "开始", "改变",
]
WARM_END_WORDS = ["评论", "点单", "你想", "下一个", "一起", "明天", "晚安", "记住"]


def _count(text: str, words: list[str]) -> int:
    return sum(text.count(w) for w in words)


def pick_track(script: ScriptDraft, available: list[str]) -> str:
    """从可用曲库中选择一首；曲库缺失时尽量回退。"""
    if not available:
        return ""
    text = script.title + "".join(l.text for s in script.shots for l in s.lines)
    neg = _count(text, NEG_WORDS)
    pos = _count(text, POS_WORDS)
    end_text = "".join(l.text for l in script.shots[-1].lines) if script.shots else ""

    pick = ""
    if pos >= neg * 1.5 and pos > 0:
        pick = "uplifting"
    elif neg >= pos * 1.5 and neg > 0:
        pick = "tense_pad"
    elif _count(end_text, WARM_END_WORDS) > 0 or pos > 0:
        pick = "warm_piano"
    else:
        pick = "warm_piano"

    if pick in available:
        return pick
    if "warm_piano" in available:
        return "warm_piano"
    return available[0]


# ---------- 在线自动搜曲 ----------

def bgm_query_for(script: ScriptDraft, style_hint: str) -> str:
    """兜底英文搜曲关键词（AI 未给 query 时按题材映射）。"""
    text = f"{script.title} {style_hint}"
    if any(k in text for k in ("科普", "知识", "宇宙", "地球", "纪录片", "历史", "天文")):
        return "documentary cinematic ambient space"
    if any(k in text for k in ("励志", "希望", "热血", "成长")):
        return "uplifting inspiring cinematic"
    if any(k in text for k in ("悬疑", "紧张", "惊悚", "恐怖", "危机")):
        return "tense dark cinematic ambient"
    if any(k in text for k in ("轻松", "搞笑", "日常", "生活")):
        return "light upbeat acoustic"
    return "cinematic emotional documentary"


def auto_search_track(query: str, available: list[str]) -> str | None:
    """按英文关键词在线搜索 CC 曲目并导入本地曲库；返回曲名，失败返回 None。

    幂等：同一 query 的导入名固定为 auto_<md5>，曲库里已存在则直接复用。
    """
    from . import bgm as bgm_svc, music_search  # 局部导入避免环

    query = (query or "").strip()[:80]
    if not query:
        return None
    key = "auto_" + hashlib.md5(query.encode("utf-8")).hexdigest()[:8]
    if key in available:
        return key  # 之前搜过，直接复用
    try:
        res = music_search.search(query, limit=6)
    except Exception:  # noqa: BLE001 — 在线搜曲失败不影响出片
        return None
    for t in res.get("results", []):
        url = t.get("url") or ""
        try:
            dur = float(t.get("duration") or 0)
        except (TypeError, ValueError):
            dur = 0
        if not url or (dur and dur < 45):  # 太短的片段用不了
            continue
        try:
            with tempfile.TemporaryDirectory() as td:
                tmp, _ext = music_search.download_to_temp(url, td)
                track = bgm_svc.import_track(
                    tmp,
                    name=key,
                    title=(t.get("title") or "在线曲目")[:60],
                    tags=[str(t.get("provider") or "online")[:20], "自动搜索"],
                )
            bgm_svc.save_meta(
                track["name"],
                source={
                    "provider": t.get("provider") or "online",
                    "url": url,
                    "landing_url": str(t.get("landing_url") or "")[:200],
                    "creator": str(t.get("creator") or "")[:60],
                    "license": str(t.get("license") or "")[:40],
                },
            )
            return track["name"]
        except Exception:  # noqa: BLE001 — 单个候选失败换下一个
            continue
    return None
