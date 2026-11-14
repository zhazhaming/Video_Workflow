# -*- coding: utf-8 -*-
"""每日一家公司：候选库 / 档期板 / 初稿 / 排产。"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from ..services import company

router = APIRouter(prefix="/api/company", tags=["company"])


class DraftBeat(BaseModel):
    label: str = Field(default="", max_length=12)
    sec: str = Field(default="", max_length=12)
    text: str = Field(default="", max_length=500)


class DraftIn(BaseModel):
    title: str = Field(default="", max_length=120)
    angle: str = Field(default="", max_length=200)
    beats: list[DraftBeat] = Field(default_factory=list, max_length=8)
    cta: str = Field(default="", max_length=200)
    notes: str = Field(default="", max_length=600)


class PickIn(BaseModel):
    date: str
    company_id: str
    draft: DraftIn | None = None


class DraftUpdate(BaseModel):
    draft: DraftIn


class ScheduleIn(BaseModel):
    now: bool = False


def _raise(e: Exception) -> None:
    """服务层异常 → HTTP 状态码（404 找不到 / 400 参数 / 409 状态冲突）。"""
    if isinstance(e, LookupError):
        raise HTTPException(404, str(e)) from e
    if isinstance(e, ValueError):
        raise HTTPException(400, str(e)) from e
    if isinstance(e, RuntimeError):
        raise HTTPException(409, str(e)) from e
    raise e


@router.get("/pool")
def get_pool():
    """候选公司库（含赛道/国家筛选项）。"""
    try:
        return company.pool()
    except RuntimeError as e:
        raise HTTPException(500, str(e)) from e


@router.get("/plan")
def get_plan(days: int = Query(default=7, ge=1, le=30)):
    """未来 N 天的档期（空档期带一家推荐公司）。"""
    return company.get_plan(days)


@router.post("/plan")
def pick(req: PickIn):
    """为某一天选一家公司（未排产前可反复更换）。"""
    try:
        return company.pick_company(
            req.date, req.company_id,
            req.draft.model_dump() if req.draft else None,
        )
    except (LookupError, ValueError, RuntimeError) as e:
        _raise(e)


@router.put("/plan/{day}")
def save_draft(day: str, req: DraftUpdate):
    """保存该期内容初稿（仅待排产状态可改）。"""
    try:
        return company.update_draft(day, req.draft.model_dump())
    except (LookupError, ValueError, RuntimeError) as e:
        _raise(e)


@router.delete("/plan/{day}")
def remove(day: str):
    """撤下待排产的计划。"""
    try:
        return company.remove_plan(day)
    except (LookupError, ValueError, RuntimeError) as e:
        _raise(e)


@router.post("/plan/{day}/draft")
def regenerate(day: str):
    """按候选库素材重新生成初稿。"""
    try:
        return company.regenerate_draft(day)
    except (LookupError, ValueError, RuntimeError) as e:
        _raise(e)


@router.post("/plan/{day}/schedule")
def schedule(day: str, req: ScheduleIn | None = None):
    """排进视频流水线：默认下一个凌晨制作；now=true 立即制作。"""
    try:
        return company.schedule(day, now=bool(req and req.now))
    except (LookupError, ValueError, RuntimeError) as e:
        _raise(e)
