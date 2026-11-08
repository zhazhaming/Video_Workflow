# -*- coding: utf-8 -*-
"""六步视频流水线路由：搜索 → 编排 → 找图 → 定样式 → 检查 → 直出。

所有重活（联网搜索 / LLM / 搜图 / 样图渲染 / 分镜 / 审查 / 渲染）走任务线程，
返回 {task_id} 供前端轮询；轻量操作（确认门 / 选择 / 上传）同步完成。
门禁在后端强制：上一步未确认时下一步返回 400。
"""
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel

from ..config import REMOTION_PUBLIC, RENDERS_DIR
from ..services import flow
from ..services.tasks import task_manager

router = APIRouter(prefix="/api/projects/{pid}/flow", tags=["flow"])


class ResearchIn(BaseModel):
    topic: str
    model_id: str | None = None


class ResearchEdit(BaseModel):
    topic: str
    nodes: list[dict]


class ModelIn(BaseModel):
    model_id: str | None = None


class AudioModeIn(BaseModel):
    mode: str


class AudioDeleteIn(BaseModel):
    kind: str
    index: int | None = None


class ImageSelectIn(BaseModel):
    scene_idx: int
    candidate_id: str | None = None


class StyleSelectIn(BaseModel):
    index: int


def _load_meta(pid: str) -> None:
    """项目存在性校验（与 projects 路由一致）。"""
    from .projects import _load_meta as projects_load_meta

    projects_load_meta(pid)


def _start_task(pid: str, kind: str, fn):
    _load_meta(pid)
    try:
        task_id = task_manager.start_task(pid, kind, fn)
    except RuntimeError as e:
        raise HTTPException(409, str(e))
    return {"task_id": task_id}


def _sync(call):
    """把同步操作的 RuntimeError 映射为 400。"""
    try:
        return call()
    except RuntimeError as e:
        raise HTTPException(400, str(e))


# ---------- 流程状态 ----------

@router.get("/state")
def get_state(pid: str):
    _load_meta(pid)
    return flow.flow_state(pid)


# ---------- 第 1 步：搜索 ----------

@router.get("/research")
def get_research(pid: str):
    _load_meta(pid)
    return flow.load_research(pid) or {"topic": "", "nodes": []}


@router.put("/research")
def edit_research(pid: str, req: ResearchEdit):
    _load_meta(pid)
    return _sync(lambda: flow.save_research(pid, req.topic, req.nodes))


@router.post("/research")
def start_research(pid: str, req: ResearchIn):
    def _run(update):
        flow.run_research(pid, req.topic.strip(), req.model_id, update)

    return _start_task(pid, "research", _run)


@router.post("/research/approve")
def approve_research(pid: str):
    _load_meta(pid)
    flow.load_research(pid) or _not_found("还没有搜索结果，请先执行第 1 步搜索")
    return {"gates": flow.approve_gate(pid, "research")["gates"]}


# ---------- 第 2 步：编排 ----------

@router.post("/copy")
def start_copy(pid: str, req: ModelIn):
    _gate(pid, "research")
    return _start_task(pid, "copy", lambda update: flow.run_copy(pid, req.model_id, update))


@router.post("/copy/approve")
def approve_copy(pid: str):
    _load_meta(pid)
    flow._try_script(pid) or _not_found("还没有文案，请先生成或手动编辑脚本")
    return {"gates": flow.approve_gate(pid, "copy")["gates"]}


@router.post("/audio-mode")
def set_audio_mode(pid: str, req: AudioModeIn):
    _load_meta(pid)
    _sync(lambda: flow.set_audio_mode(pid, req.mode))
    return flow.flow_state(pid)


@router.post("/audio/upload")
async def upload_audio(pid: str, request: Request):
    _load_meta(pid)
    form = await request.form()
    file = form.get("file")
    kind = str(form.get("kind") or "")
    index_raw = form.get("index")
    index = int(index_raw) if index_raw not in (None, "") else None
    if file is None or not hasattr(file, "read"):
        raise HTTPException(400, "缺少音频文件")
    content = await file.read()
    out = _sync(lambda: flow.upload_audio(pid, kind, index, getattr(file, "filename", ""), content))
    return out


@router.get("/audio")
def get_audio(pid: str):
    _load_meta(pid)
    return flow.load_flow(pid).get("custom_audio") or {}


@router.delete("/audio")
def delete_audio(pid: str, req: AudioDeleteIn):
    _load_meta(pid)
    _sync(lambda: flow.delete_audio(pid, req.kind, req.index))
    return flow.flow_state(pid)


@router.get("/audio-file")
def audio_file(pid: str, path: str):
    """自带配音试听（仅允许项目 custom 目录内的文件）。"""
    _load_meta(pid)
    base = (REMOTION_PUBLIC / "voice" / "projects" / pid / "custom").resolve()
    target = (REMOTION_PUBLIC / path).resolve()
    if base not in target.parents or not target.exists():
        raise HTTPException(404, "音频不存在")
    return FileResponse(target, media_type="audio/mpeg")


# ---------- 第 3 步：找图 ----------

@router.get("/images")
def get_images(pid: str):
    _load_meta(pid)
    return flow.load_images(pid)


@router.post("/images/search")
def start_images(pid: str, req: ModelIn):
    _gate(pid, "copy")
    return _start_task(pid, "images", lambda update: flow.run_images(pid, req.model_id, update))


@router.post("/images/select")
def select_image(pid: str, req: ImageSelectIn):
    _load_meta(pid)
    return _sync(lambda: flow.select_image(pid, req.scene_idx, req.candidate_id))


@router.post("/images/upload")
async def upload_scene_image(pid: str, request: Request):
    _load_meta(pid)
    form = await request.form()
    file = form.get("file")
    scene_idx_raw = form.get("scene_idx")
    if file is None or not hasattr(file, "read"):
        raise HTTPException(400, "缺少图片文件")
    try:
        scene_idx = int(scene_idx_raw)
    except (TypeError, ValueError):
        raise HTTPException(400, "scene_idx 必须是整数")
    content = await file.read()
    return _sync(lambda: flow.upload_scene_image(pid, scene_idx, getattr(file, "filename", ""), content))


@router.post("/images/approve")
def approve_images(pid: str):
    _load_meta(pid)
    return {"gates": flow.approve_gate(pid, "images")["gates"]}


# ---------- 第 3 步补充：ComfyUI AI 生图 ----------


class AiImagesIn(BaseModel):
    model_id: str | None = None
    scenes: list[int] | None = None  # 空=全部幕


@router.post("/images/ai")
def start_ai_images(pid: str, req: AiImagesIn):
    _gate(pid, "copy")
    return _start_task(
        pid,
        "images_ai",
        lambda update: flow.run_ai_images(pid, req.model_id, update, req.scenes),
    )


@router.get("/images/ai/{name}")
def ai_candidate_file(pid: str, name: str):
    """AI 生成的候选原图（前端缩略图/选用前预览）。"""
    _load_meta(pid)
    if "/" in name or "\\" in name or ".." in name or not name.endswith(".png"):
        raise HTTPException(400, "非法文件名")
    path = flow.ai_candidate_dir(pid) / name
    if not path.exists():
        raise HTTPException(404, "候选图不存在（可能已重新生成）")
    return FileResponse(path, media_type="image/png", filename=name)


# ---------- 第 4 步：定样式 + 分镜 ----------

@router.get("/styles")
def get_styles(pid: str):
    _load_meta(pid)
    return flow.load_styles(pid)


@router.post("/styles")
def start_styles(pid: str, req: ModelIn):
    _gate(pid, "images")
    return _start_task(pid, "styles", lambda update: flow.run_styles(pid, req.model_id, update))


@router.get("/style-sample/{i}")
def style_sample(pid: str, i: int):
    _load_meta(pid)
    if i not in (1, 2, 3):
        raise HTTPException(404, "样图序号必须是 1~3")
    path = RENDERS_DIR / pid / f"style_sample_{i}.png"
    if not path.exists():
        raise HTTPException(404, "样图尚未生成")
    return FileResponse(path, media_type="image/png")


@router.post("/styles/select")
def select_style(pid: str, req: StyleSelectIn):
    """选定风格 → 同步记录，然后自动开跑分镜任务（写分镜卡拍子 + 解析 BGM）。"""
    _load_meta(pid)
    _sync(lambda: flow.select_style(pid, req.index))

    def _run(update):
        flow.run_storyboard(pid, update)

    return _start_task(pid, "storyboard", _run)


@router.get("/storyboard")
def get_storyboard(pid: str):
    _load_meta(pid)
    from ..services import director as director_svc
    from ..services.tasks import load_script

    plan = director_svc.load_cached_plan(pid)
    script = load_script(pid)
    shots = []
    for i, item in enumerate((plan or {}).get("shots") or []):
        p = item.get("plan") or {} if isinstance(item, dict) else {}
        s = script.shots[i] if i < len(script.shots) else None
        shots.append(
            {
                "index": i + 1,
                "label": s.label if s else "",
                "year": s.year if s else "",
                "camera": p.get("camera"),
                "transition": p.get("transition"),
                "scene": (p.get("scene") or {}).get("kind"),
                "overlay": (p.get("overlay") or {}).get("kind"),
                "has_image": bool(flow.image_rels_for(pid, len(script.shots))[i]) if s else False,
            }
        )
    return {"shot_count": len(shots), "shots": shots}


@router.post("/styles/approve")
def approve_styles(pid: str):
    _load_meta(pid)
    from ..services import director as director_svc

    if not director_svc.load_cached_plan(pid):
        _not_found("分镜还没生成，请先选择一个风格")
    return {"gates": flow.approve_gate(pid, "styles")["gates"]}


# ---------- 第 5 步：检查 ----------

@router.get("/review")
def get_review(pid: str):
    _load_meta(pid)
    return flow.load_review(pid)


@router.post("/review")
def start_review(pid: str, req: ModelIn):
    _gate(pid, "styles")
    return _start_task(pid, "review", lambda update: flow.run_review(pid, req.model_id, update))


@router.post("/review/confirm")
def confirm_review(pid: str):
    _load_meta(pid)
    report = flow.load_review(pid)
    if not report:
        _not_found("还没有审查报告，请先执行审查")
    return {"gates": flow.approve_gate(pid, "review")["gates"]}


# ---------- 第 6 步：直出 ----------

@router.post("/render/preview")
def render_preview(pid: str):
    _gate(pid, "review")
    return _start_task(pid, "preview", lambda update: flow.run_render(pid, "preview", update))


@router.post("/render/preview/approve")
def approve_preview(pid: str):
    """用户看过 10 秒预览并满意 → 解锁整片渲染（第 6 步内部门）。"""
    _load_meta(pid)
    if not (RENDERS_DIR / pid / "preview.mp4").exists():
        _not_found("预览还没有渲染")
    return {"gates": flow.approve_gate(pid, "preview")["gates"]}


@router.post("/render/full")
def render_full(pid: str):
    _gate(pid, "preview")
    if not (RENDERS_DIR / pid / "preview.mp4").exists():
        raise HTTPException(400, "请先渲染前 10 秒预览")
    return _start_task(pid, "full", lambda update: flow.run_render(pid, "full", update))


@router.get("/video-preview")
def video_preview(pid: str):
    _load_meta(pid)
    path = RENDERS_DIR / pid / "preview.mp4"
    if not path.exists():
        raise HTTPException(404, "预览还没有渲染")
    return FileResponse(path, media_type="video/mp4")


# ---------- 通用 ----------

def _gate(pid: str, gate: str) -> None:
    """门禁校验（后端强制步骤顺序）。"""
    _load_meta(pid)
    try:
        flow.require_gate(pid, gate)
    except RuntimeError as e:
        raise HTTPException(400, str(e))


def _not_found(msg: str):
    raise HTTPException(400, msg)
