# -*- coding: utf-8 -*-
"""热门歌曲路由：榜单列表 / 歌曲查询 / 手动刷新 / CSV 导出 / 自定义策展榜。"""
import csv
import io

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel, Field

from ..services import music_chart as mc

router = APIRouter(prefix="/api/music-chart", tags=["music-chart"])


class RefreshRequest(BaseModel):
    boards: list[str] = Field(default_factory=list, max_length=12)


class CustomBoardCreate(BaseModel):
    name: str = Field(min_length=1, max_length=30)
    desc: str = Field(default="", max_length=120)


class CustomItemAdd(BaseModel):
    title: str = Field(min_length=1, max_length=80)
    artist: str = Field(default="", max_length=60)
    album: str = Field(default="", max_length=80)
    cover: str = Field(default="", max_length=500)
    url: str = Field(default="", max_length=500)
    note: str = Field(default="", max_length=200)


@router.get("/status")
def status():
    return mc.service.status()


@router.get("/boards")
def boards():
    """全部榜单元信息（含更新时间/期号/在榜数，前端榜单切换器用）。"""
    return mc.service.boards()


@router.get("/items", response_model=list[mc.MusicItem])
def items(
    board: str = Query(default="", max_length=30),
    q: str = Query(default="", max_length=100),
    sort: str = Query(default="rank", pattern="^(rank|trend|fresh)$"),
    limit: int = Query(default=200, ge=1, le=1200),
):
    return mc.service.get_items(board=board, q=q, sort=sort, limit=limit)


@router.post("/refresh")
def refresh(req: RefreshRequest):
    return mc.service.refresh(req.boards or None)


@router.get("/export.csv")
def export_csv(board: str = Query(default="", max_length=30)):
    """导出榜单为 CSV（UTF-8 BOM，Excel 直接打开不乱码）。"""
    items = mc.service.get_items(board=board, limit=1200)
    board_names = {b.id: b.name for b in mc.service.boards()}
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["榜单", "名次", "歌曲", "歌手", "专辑", "时长", "趋势", "名次变化", "热度", "首见时间"])
    for it in items:
        writer.writerow(
            [
                board_names.get(it.board, it.board),
                it.rank,
                it.title,
                it.artist,
                it.album,
                it.duration_text,
                it.trend,
                it.rank_diff,
                it.raw_hot or int(it.hot),
                it.first_seen,
            ]
        )
    content = "\ufeff" + buf.getvalue()  # BOM
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=music-chart.csv"},
    )


# ---- 自定义策展榜（我的榜单） ----


@router.get("/custom-boards")
def list_custom_boards():
    return mc.service.custom_boards()


@router.post("/custom-boards")
def create_custom_board(req: CustomBoardCreate):
    try:
        return mc.service.create_custom_board(req.name.strip(), req.desc.strip())
    except ValueError as e:
        raise HTTPException(409, str(e))


@router.delete("/custom-boards/{bid}")
def delete_custom_board(bid: str):
    if not mc.service.delete_custom_board(bid):
        raise HTTPException(404, "榜单不存在")
    return {"ok": True}


@router.post("/custom-boards/{bid}/items")
def add_custom_item(bid: str, req: CustomItemAdd):
    try:
        board, added = mc.service.add_custom_item(
            bid, {**req.model_dump(), "title": req.title.strip()}
        )
    except KeyError as e:
        raise HTTPException(404, str(e).strip("'"))
    except ValueError as e:
        raise HTTPException(400, str(e))
    return {"board": board, "added": added}


@router.delete("/custom-boards/{bid}/items")
def remove_custom_item(bid: str, title: str = Query(max_length=80), artist: str = Query(default="", max_length=60)):
    if not mc.service.remove_custom_item(bid, title, artist):
        raise HTTPException(404, "未找到该歌曲（可能已移除）")
    return {"ok": True}
