# -*- coding: utf-8 -*-
"""热点雷达路由：状态/热点列表/手动刷新/自定义搜索方向/AI 选题。"""
import csv
import io
import uuid

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel, Field

from ..services import hotspot as hs
from ..services import hotspot_sources
from ..services import llm

router = APIRouter(prefix="/api/hotspot", tags=["hotspot"])

# 早报 AI 点评缓存（key = generated_at；热点刷新前复用，省 token）
_ai_briefing_cache: dict = {}


class DirectionUpsert(BaseModel):
    name: str = Field(min_length=1, max_length=30)
    keywords: list[str] = Field(default_factory=list, max_length=30)
    exclude: list[str] = Field(default_factory=list, max_length=30)
    enabled: bool = True


class RefreshRequest(BaseModel):
    sources: list[str] = Field(default_factory=list, max_length=10)


class AiTopicsRequest(BaseModel):
    item_ids: list[str] = Field(default_factory=list, max_length=10)
    direction_id: str | None = None
    count: int = Field(default=4, ge=1, le=8)
    model_id: str | None = None


class TopicStatusRequest(BaseModel):
    status: str | None = Field(default=None, pattern="^(todo|doing|done|dropped)$")
    project_id: str | None = Field(default=None, max_length=20)
    note: str | None = Field(default=None, max_length=300)


class TopicClearRequest(BaseModel):
    statuses: list[str] = Field(min_length=1, max_length=4)


@router.get("/status")
def status():
    return hs.service.status()


@router.get("/briefing")
def briefing(top_n: int = Query(default=5, ge=1, le=10)):
    """今日早报：Top N 值得马上拍的热点 + 理由（打开页面 10 秒做决定）。"""
    return hs.service.briefing(top_n)


@router.post("/ai-briefing")
def ai_briefing(top_n: int = Query(default=5, ge=1, le=10)):
    """早报 AI 深度点评：每条热点给「适合形式/拍摄角度/风险提示」。

    以最近一次早报的 generated_at 为缓存键，热点未刷新前重复请求直接返回。
    """
    brief = hs.service.briefing(top_n)
    cache = _ai_briefing_cache
    if cache.get("key") == brief["generated_at"]:
        return {**brief, "comments": cache["comments"]}
    try:
        comments = llm.generate_briefing_commentary(brief["items"], None)
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(502, f"AI 点评生成失败：{e}")
    cache.clear()
    cache["key"] = brief["generated_at"]
    cache["comments"] = comments
    return {**brief, "comments": comments}


@router.get("/items", response_model=list[hs.HotItem])
def items(
    direction_id: str = Query(default="", max_length=40),
    platform: str = Query(default="", max_length=20),
    q: str = Query(default="", max_length=100),
    sort: str = Query(default="burst", pattern="^(burst|hot|fresh)$"),
    limit: int = Query(default=100, ge=1, le=300),
):
    return hs.service.get_items(
        direction_id=direction_id, platform=platform, q=q, sort=sort, limit=limit
    )


@router.post("/refresh")
def refresh(req: RefreshRequest):
    return hs.service.refresh(req.sources or None)


@router.get("/export.csv")
def export_csv():
    """导出当前热点为 CSV（UTF-8 BOM，Excel 直接打开不乱码）。"""
    items = hs.service.get_items(limit=300)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        ["平台", "排名", "标题", "热度", "原始热度", "趋势", "变化率%", "第一波指数", "首见时间", "命中方向"]
    )
    dir_names = {d.id: d.name for d in hs.service.store.load_directions()}
    for it in items:
        writer.writerow(
            [
                hotspot_sources.PLATFORM_NAMES.get(it.platform, it.platform),
                it.rank,
                it.title,
                round(it.hot, 1),
                it.raw_hot,
                it.trend,
                it.trend_delta,
                it.burst,
                it.first_seen,
                "、".join(dir_names.get(d, d) for d in it.direction_ids),
            ]
        )
    content = "\ufeff" + buf.getvalue()  # BOM
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=hotspot.csv"},
    )


@router.get("/directions", response_model=list[hs.HotDirection])
def list_directions():
    return hs.service.store.load_directions()


@router.post("/directions", response_model=hs.HotDirection)
def create_direction(req: DirectionUpsert):
    directions = hs.service.store.load_directions()
    if any(d.name == req.name for d in directions):
        raise HTTPException(409, f"方向「{req.name}」已存在")
    d = hs.HotDirection(id=uuid.uuid4().hex[:8], **req.model_dump())
    directions.append(d)
    hs.service.store.save_directions(directions)
    return d


@router.put("/directions/{did}", response_model=hs.HotDirection)
def update_direction(did: str, req: DirectionUpsert):
    directions = hs.service.store.load_directions()
    for i, d in enumerate(directions):
        if d.id == did:
            new = hs.HotDirection(id=did, **req.model_dump())
            directions[i] = new
            hs.service.store.save_directions(directions)
            return new
    raise HTTPException(404, "方向不存在")


@router.delete("/directions/{did}")
def delete_direction(did: str):
    directions = hs.service.store.load_directions()
    rest = [d for d in directions if d.id != did]
    if len(rest) == len(directions):
        raise HTTPException(404, "方向不存在")
    hs.service.store.save_directions(rest)
    return {"ok": True}


@router.post("/ai-topics")
def ai_topics(req: AiTopicsRequest):
    """选中热点 → AI 生成蹭热点的选题建议（可一键带入脚本生成）。"""
    picked = hs.service.get_items_by_ids(req.item_ids)
    if not picked:
        raise HTTPException(400, "请先在热点列表勾选至少一条（或热点已过期，请刷新后重选）")

    direction_hint = ""
    if req.direction_id:
        for d in hs.service.store.load_directions():
            if d.id == req.direction_id:
                direction_hint = f"{d.name}（关键词：{'、'.join(d.keywords[:10])}）"
                break

    hot_items = [
        {
            "title": p.title,
            "platform": hotspot_sources.PLATFORM_NAMES.get(p.platform, p.platform),
            "tag": p.tag,
            "summary": p.summary,
        }
        for p in picked
    ]
    try:
        topics = llm.generate_hotspot_topics(
            hot_items, req.count, req.model_id, direction_hint
        )
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(502, f"AI 选题生成失败：{e}")

    # 生成即落库（今日选题工作台），并把来源热点标题映射到平台列表
    ref_platforms = {hs.normalize_title(p.title): [hotspot_sources.PLATFORM_NAMES.get(x, x) for x in p.platforms] for p in picked}
    saved = hs.service.add_topics(topics, ref_platforms)
    return {
        "topics": topics,
        "saved": [s.model_dump() for s in saved],
        "ref_counts": hs.service.ref_counts(),
        "source_titles": [p.title for p in picked],
    }


# ---- 今日选题工作台 ----


@router.get("/topics", response_model=list[hs.SavedTopic])
def list_topics():
    return hs.service.store.load_topics()


@router.put("/topics/{tid}", response_model=hs.SavedTopic)
def update_topic(tid: str, req: TopicStatusRequest):
    t = hs.service.update_topic(tid, req.status, req.project_id, req.note)
    if not t:
        raise HTTPException(404, "选题不存在")
    return t


@router.delete("/topics/{tid}")
def delete_topic(tid: str):
    if not hs.service.delete_topic(tid):
        raise HTTPException(404, "选题不存在")
    return {"ok": True}


@router.post("/topics/clear")
def clear_topics(req: TopicClearRequest):
    allowed = {"todo", "doing", "done", "dropped"}
    statuses = [s for s in req.statuses if s in allowed]
    if not statuses:
        raise HTTPException(400, "无效的状态")
    removed = hs.service.clear_topics(statuses)
    return {"removed": removed}
