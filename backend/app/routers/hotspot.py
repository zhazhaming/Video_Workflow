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

# 早报 AI 点评缓存（key = (generated_at, 栏目)；热点刷新前复用，省 token）
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
def briefing(top_n: int = Query(default=hs.BRIEF_TOP_N, ge=1, le=hs.BRIEF_TOP_N)):
    """今日早报：实时热点 + 科普知识 + 工具分享 三个栏目（规则生成，快、稳）。"""
    return hs.service.briefing(top_n)


@router.post("/ai-briefing")
def ai_briefing(
    top_n: int = Query(default=hs.BRIEF_TOP_N, ge=1, le=hs.BRIEF_TOP_N),
    section: str = Query(default="hot", pattern="^(hot|science)$"),
):
    """早报 AI 深度点评：每条热点给「适合形式/拍摄角度/风险提示」。

    section=hot 实时热点栏目；section=science 科普知识栏目。
    以最近一次早报的 generated_at + 栏目为缓存键，热点未刷新前重复请求直接返回。
    """
    brief = hs.service.briefing(top_n)
    if section == "science":
        sec_items = brief.get("science", {}).get("items", [])
        if not sec_items:
            raise HTTPException(400, "当前没有命中科普频道的热点，稍后再试")
    else:
        sec_items = brief["items"]
    cache_key = (brief["generated_at"], section)
    cache = _ai_briefing_cache
    if cache.get("key") == cache_key:
        return {**brief, "comments": cache["comments"]}
    try:
        comments = llm.generate_briefing_commentary(sec_items, None)
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(502, f"AI 点评生成失败：{e}")
    cache.clear()
    cache["key"] = cache_key
    cache["comments"] = comments
    return {**brief, "comments": comments}


class AiToolsRequest(BaseModel):
    model_id: str | None = None


@router.post("/ai-tools")
def ai_tools(req: AiToolsRequest):
    """工具栏目 AI 解读：给 GitHub 热门仓库标注职场受众/用途/提效点。

    结果按仓库名落盘缓存（tools_meta.json），同一仓库只花一次 token。
    """
    section = hs.service.tools_section(top_n=12)
    pending = [t for t in section["items"] if not t.get("ai_done")]
    if pending:
        payload = [
            {
                "name": t["title"],
                "language": t.get("language") or "",
                "stars": t.get("stars") or "",
                "description": t.get("summary") or "",
            }
            for t in pending
        ]
        try:
            results = llm.generate_tool_meta(payload, req.model_id)
        except RuntimeError as e:
            raise HTTPException(503, str(e))
        except Exception as e:  # noqa: BLE001
            raise HTTPException(502, f"AI 工具解读失败：{e}")
        hs.service.merge_tools_meta(results)
    return {"tools": hs.service.tools_section(top_n=10), "classified": len(pending)}


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

    # 规则兜底：模型自评的栏目不可靠。命中黑名单 / 归不到栏目 / 没开场数字的，
    # 在这里统一定性（与 add_topics 同源规则），前端据此禁用「生成脚本」。
    column_counts = {hs.COLUMN_AI: 0, hs.COLUMN_COMPANY: 0, hs.COLUMN_REJECT: 0}
    for t in topics:
        rule_col, rule_num, rule_reason = hs.classify_column(
            str(t.get("title") or ""),
            f"{t.get('angle') or ''} {t.get('why') or ''}",
        )
        if rule_col == hs.COLUMN_REJECT:
            t["column"] = hs.COLUMN_REJECT
            t["reject_reason"] = rule_reason
        else:
            col = str(t.get("column") or "").strip()
            t["column"] = col if col in hs.COLUMN_CHOICES else rule_col
            if t["column"] == hs.COLUMN_REJECT and not str(t.get("reject_reason") or "").strip():
                t["reject_reason"] = "不属于 ai干活 / 公司大赏"
        t["opening_number"] = str(t.get("opening_number") or "").strip() or rule_num
        column_counts[t["column"]] = column_counts.get(t["column"], 0) + 1

    # 生成即落库（今日选题工作台），并把来源热点标题映射到平台列表
    ref_platforms = {hs.normalize_title(p.title): [hotspot_sources.PLATFORM_NAMES.get(x, x) for x in p.platforms] for p in picked}
    saved = hs.service.add_topics(topics, ref_platforms)
    return {
        "topics": topics,
        "saved": [s.model_dump() for s in saved],
        "ref_counts": hs.service.ref_counts(),
        "source_titles": [p.title for p in picked],
        "column_counts": column_counts,
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


@router.post("/topics/{tid}/brief")
def topic_brief(tid: str):
    """选题 → 视频制作简报：喂给 video-producer skill（topic 阶段输入）的 JSON 契约。"""
    t = next((x for x in hs.service.store.load_topics() if x.id == tid), None)
    if not t:
        raise HTTPException(404, "选题不存在")
    return {
        "topic": t.title,
        "angle": t.angle,
        "hook": t.hook,
        "why": t.why,
        "ref": t.ref,
        "ref_platforms": t.ref_platforms,
        "target_seconds": 60,
        "tone": "按题材自选（tone-recipes）",
        "facts_rule": "数字/年份/人名必须先取数（API 优先）；没有可靠来源的知识点直接弃用",
        "next": "把本 JSON 发给 ZCode：按 .agents/skills/video-producer 六阶段流程制作",
    }


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
