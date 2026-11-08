# -*- coding: utf-8 -*-
"""发布路由：AI 文案 / 发布打包 / 抖音 OAuth 与推送 / 小红书半自动 / 发布中心（预约发布）。"""
import random
import re

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, Field
from typing import Optional

from ..config import PUBLISH_SCREENSHOTS_DIR, RENDERS_DIR
from ..services import creator_douyin as cd
from ..services import publish as pub
from ..services import publish_scheduler as sched
from ..services.publish import extract_covers
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
    """发布打包：成片/封面地址（含竖横双封面）+ 双平台文案 + 创作者上传页链接。"""
    _load_meta(pid)
    video = RENDERS_DIR / pid / "final.mp4"
    covers = extract_covers(pid) if video.exists() else {}
    cover = covers.get("cover") or (RENDERS_DIR / pid / "cover.jpg")
    return {
        "has_video": video.exists(),
        "video_url": f"/api/projects/{pid}/video" if video.exists() else None,
        "cover_url": f"/api/projects/{pid}/publish/cover" if cover.exists() else None,
        "cover_v_url": f"/api/projects/{pid}/publish/cover_v" if covers.get("vertical") else None,
        "cover_h_url": f"/api/projects/{pid}/publish/cover_h" if covers.get("horizontal") else None,
        "copies": pub.load_all_copies(pid),
        "upload_pages": pub.UPLOAD_PAGES,
    }


def _cover_file(pid: str, name: str):
    """取封面文件（extract_covers 内部带新鲜度检查：成片重渲过会自动重新生成）。"""
    _load_meta(pid)
    key = {"cover.jpg": "cover", "cover_v.jpg": "vertical", "cover_h.jpg": "horizontal"}.get(name, "cover")
    p = extract_covers(pid).get(key)
    if not p or not p.exists():
        raise HTTPException(404, "封面不存在（先渲染成片）")
    return p


@router.get("/projects/{pid}/publish/cover")
def publish_cover(pid: str):
    return FileResponse(_cover_file(pid, "cover.jpg"), media_type="image/jpeg")


@router.get("/projects/{pid}/publish/cover_v")
def publish_cover_v(pid: str):
    return FileResponse(_cover_file(pid, "cover_v.jpg"), media_type="image/jpeg")


@router.get("/projects/{pid}/publish/cover_h")
def publish_cover_h(pid: str):
    return FileResponse(_cover_file(pid, "cover_h.jpg"), media_type="image/jpeg")


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


# ---------- 发布中心（创作者中心自动化：扫码登录 + 预约发布） ----------

class PublishTaskCreate(BaseModel):
    pid: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=60)
    scheduled_at: Optional[str] = None  # "YYYY-MM-DD HH:MM:SS"；空 = 立即发布
    desc: str = Field(default="", max_length=1000)
    tags: list[str] = []
    collection: Optional[str] = None   # None = 用全局默认；"" = 不设合集
    declarations: Optional[list[str]] = None


class PublishTaskUpdate(BaseModel):
    title: Optional[str] = None
    desc: Optional[str] = None
    tags: Optional[list[str]] = None
    collection: Optional[str] = None
    declarations: Optional[list[str]] = None
    scheduled_at: Optional[str] = None


def _task_op(task_id: str, fn, *args, **kwargs):
    """调度器操作统一包装：任务不存在→404，状态冲突→400。"""
    try:
        return fn(task_id, *args, **kwargs)
    except ValueError as e:
        msg = str(e)
        if "不存在" in msg:
            raise HTTPException(404, msg)
        raise HTTPException(400, msg)


@router.get("/publish/center/overview")
def publish_center_overview(refresh: int = 0):
    """账号登录态（带缓存）+ 全部发布任务 + 新建任务默认值。"""
    return sched.service.overview(refresh_account=bool(refresh))


@router.post("/publish/center/tasks")
def publish_center_create(req: PublishTaskCreate):
    _load_meta(req.pid)
    try:
        return sched.service.create_task(
            pid=req.pid, title=req.title, desc=req.desc, tags=req.tags,
            collection=req.collection, declarations=req.declarations,
            scheduled_at=req.scheduled_at,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.patch("/publish/center/tasks/{task_id}")
def publish_center_update(task_id: str, req: PublishTaskUpdate):
    return _task_op(task_id, sched.service.update_task, **req.model_dump(exclude_none=True))


@router.post("/publish/center/tasks/{task_id}/publish-now")
def publish_center_publish_now(task_id: str):
    return _task_op(task_id, sched.service.publish_now)


@router.post("/publish/center/tasks/{task_id}/retry")
def publish_center_retry(task_id: str):
    return _task_op(task_id, sched.service.retry_task)


@router.post("/publish/center/tasks/{task_id}/cancel")
def publish_center_cancel(task_id: str):
    return _task_op(task_id, sched.service.cancel_task)


@router.post("/publish/center/tasks/{task_id}/republish")
def publish_center_republish(task_id: str):
    return _task_op(task_id, sched.service.republish_task)


@router.delete("/publish/center/tasks/{task_id}")
def publish_center_delete(task_id: str):
    _task_op(task_id, sched.service.delete_task)
    return {"ok": True}


@router.get("/publish/screenshots/{name}")
def publish_screenshot(name: str):
    """自动化失败截图（排障用）。"""
    if not re.fullmatch(r"[\w.\-]+\.png", name):
        raise HTTPException(404, "截图不存在")
    p = PUBLISH_SCREENSHOTS_DIR / name
    if not p.exists():
        raise HTTPException(404, "截图不存在")
    return FileResponse(p, media_type="image/png")


@router.post("/publish/stats/sync")
def publish_stats_sync():
    """手动触发一次作品表现数据回流（创作者中心抓取→台账回填，后台执行）。"""
    try:
        return sched.service.sync_stats_now()
    except ValueError as e:
        raise HTTPException(409, str(e))


@router.post("/publish/creator/login/start")
def creator_login_start():
    try:
        out = cd.login_start()
        if out.get("state") == "already_logged_in":
            sched.service.invalidate_account()
        return out
    except RuntimeError as e:
        raise HTTPException(400, str(e))


@router.get("/publish/creator/qr")
def creator_qr():
    png = cd.login_qr()
    if png is None:
        raise HTTPException(404, "当前没有进行中的扫码登录，请先点「扫码登录」")
    return Response(content=png, media_type="image/png")


@router.get("/publish/creator/login/poll")
def creator_login_poll():
    out = cd.login_poll()
    if out.get("state") in ("success", "expired"):
        sched.service.invalidate_account()
    return out


@router.post("/publish/creator/login/cancel")
def creator_login_cancel():
    cd.login_cancel()
    return {"ok": True}


@router.post("/publish/creator/logout")
def creator_logout():
    cd.logout()
    sched.service.invalidate_account()
    return {"ok": True}
