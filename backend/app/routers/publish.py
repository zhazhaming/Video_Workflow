# -*- coding: utf-8 -*-
"""发布路由：AI 文案 / 发布打包 / 抖音 OAuth 与推送 / 小红书半自动。"""
import random

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional

from ..config import RENDERS_DIR
from ..services import publish as pub
from .projects import _load_meta, load_script

router = APIRouter(prefix="/api")


class CopyRequest(BaseModel):
    platform: str = Field(pattern="^(douyin|xhs)$")
    model_id: Optional[str] = None


class DouyinExchangeRequest(BaseModel):
    code: str = Field(min_length=1, max_length=200)


class DouyinPublishRequest(BaseModel):
    title: str = Field(min_length=1, max_length=60)
    desc: str = Field(default="", max_length=1000)
    tags: list[str] = []


@router.get("/projects/{pid}/publish/package")
def publish_package(pid: str):
    """发布打包：成片/封面地址 + 双平台文案 + 创作者上传页链接。"""
    _load_meta(pid)
    video = RENDERS_DIR / pid / "final.mp4"
    cover = pub.extract_cover(pid) if video.exists() else None
    return {
        "has_video": video.exists(),
        "video_url": f"/api/projects/{pid}/video" if video.exists() else None,
        "cover_url": f"/api/projects/{pid}/publish/cover" if cover else None,
        "copies": pub.load_all_copies(pid),
        "upload_pages": pub.UPLOAD_PAGES,
    }


@router.get("/projects/{pid}/publish/cover")
def publish_cover(pid: str):
    _load_meta(pid)
    cover = RENDERS_DIR / pid / "cover.jpg"
    if not cover.exists():
        cover = pub.extract_cover(pid)
    if not cover or not cover.exists():
        raise HTTPException(404, "封面不存在（先渲染成片）")
    return FileResponse(cover, media_type="image/jpeg")


@router.post("/projects/{pid}/publish/copy")
def publish_copy(pid: str, req: CopyRequest):
    """AI 生成指定平台的发布文案（脚本不变则命中缓存）。"""
    _load_meta(pid)
    script = load_script(pid)
    try:
        return pub.get_or_create_copy(pid, script, req.platform, req.model_id)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(502, f"文案生成失败：{e}")


@router.get("/publish/douyin/status")
def douyin_status():
    return {"configured": pub.douyin_configured(), "authorized": pub.douyin_authorized()}


@router.post("/publish/douyin/authorize-url")
def douyin_authorize():
    try:
        return pub.douyin_authorize_url(state=random.randbytes(6).hex())
    except RuntimeError as e:
        raise HTTPException(400, str(e))


@router.post("/publish/douyin/exchange")
def douyin_exchange(req: DouyinExchangeRequest):
    """OAuth 回调页把 code 发到这里换 token。"""
    try:
        token = pub.douyin_exchange(req.code)
        return {"authorized": True, "open_id": token.get("open_id", "")}
    except RuntimeError as e:
        raise HTTPException(502, str(e))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(502, f"抖音授权失败：{e}")


@router.post("/projects/{pid}/publish/douyin")
def publish_douyin(pid: str, req: DouyinPublishRequest):
    """推送到抖音（官方 API）。大文件上传可能耗时数分钟。"""
    _load_meta(pid)
    text = " ".join(filter(None, [req.title.strip(), req.desc.strip()]))
    try:
        return pub.douyin_publish(pid, req.title, req.desc, req.tags)
    except RuntimeError as e:
        raise HTTPException(400, str(e))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(502, f"抖音推送失败：{e}")
