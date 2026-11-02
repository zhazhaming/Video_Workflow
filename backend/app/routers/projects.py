# -*- coding: utf-8 -*-
"""项目路由：CRUD + 触发渲染 + 取成片 + 自定义分镜图管理。"""
import io
import json
import shutil
import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, PlainTextResponse
from PIL import Image

from ..config import (
    PIC_PUBLIC_SUBDIR,
    PROJECTS_DIR,
    REMOTION_DIR,
    REMOTION_PUBLIC,
    RENDERS_DIR,
    VOICE_PUBLIC_SUBDIR,
    ensure_dirs,
)
from ..schemas import (
    ImagePromptRequest,
    ProjectCreate,
    ProjectDetail,
    ProjectMeta,
    ProjectSettings,
    ScriptDraft,
    ScriptUpdate,
    now_iso,
)
from ..services import brief as brief_svc
from ..services import director as director_svc
from ..services import image_prompts as img_prompts_svc
from ..services import images as images_svc
from ..services.pipeline import estimate_total_seconds
from ..services.tasks import load_script, task_manager

router = APIRouter(prefix="/api/projects", tags=["projects"])

_CUSTOM_EXT_BY_CONTENT_TYPE = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
}

DEFAULT_SCRIPT = ScriptDraft.model_validate(
    {
        "title": "未命名视频",
        "shots": [
            {
                "year": "2026",
                "label": "第一幕",
                "colors": ["#1a1a2e", "#16213e"],
                "lines": [{"text": "在这里写下第一句台词。"}],
            }
        ],
    }
)


def _paths(pid: str):
    pdir = PROJECTS_DIR / pid
    return pdir, pdir / "script.json", pdir / "meta.json"


def _load_meta(pid: str) -> dict:
    _, _, meta_path = _paths(pid)
    if not meta_path.exists():
        raise HTTPException(404, "项目不存在")
    return json.loads(meta_path.read_text(encoding="utf-8"))


@router.get("", response_model=list[ProjectMeta])
def list_projects():
    ensure_dirs()
    items = []
    if PROJECTS_DIR.exists():
        for p in sorted(PROJECTS_DIR.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True):
            meta_path = p / "meta.json"
            if meta_path.exists():
                meta = json.loads(meta_path.read_text(encoding="utf-8"))
                # 轻量统计：分镜/台词数 + 是否已出片（列表页卡片直接展示）
                try:
                    script = json.loads((p / "script.json").read_text(encoding="utf-8"))
                    shots = script.get("shots", [])
                    meta["shot_count"] = len(shots)
                    meta["line_count"] = sum(len(s.get("lines", [])) for s in shots)
                except Exception:  # noqa: BLE001
                    pass
                meta["has_video"] = (RENDERS_DIR / p.name / "final.mp4").exists()
                items.append(ProjectMeta.model_validate(meta))
    return items


@router.post("", response_model=ProjectDetail)
def create_project(req: ProjectCreate):
    ensure_dirs()
    pid = uuid.uuid4().hex[:12]
    topic = (req.topic or "").strip()
    script = req.script or DEFAULT_SCRIPT
    if topic and req.script is None:
        script = script.model_copy(update={"title": topic})
    pdir, script_path, meta_path = _paths(pid)
    pdir.mkdir(parents=True, exist_ok=True)
    script_path.write_text(script.model_dump_json(indent=1), encoding="utf-8")
    if topic:
        (pdir / "settings.json").write_text(
            ProjectSettings(topic=topic).model_dump_json(indent=1), encoding="utf-8"
        )
    meta = {
        "id": pid,
        "title": script.title,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
    return ProjectDetail(**meta, script=script)


@router.get("/{pid}", response_model=ProjectDetail)
def get_project(pid: str):
    meta = _load_meta(pid)
    script = load_script(pid)
    return ProjectDetail(**meta, script=script)


@router.put("/{pid}/script", response_model=ProjectDetail)
def update_script(pid: str, req: ScriptUpdate):
    meta = _load_meta(pid)
    _, script_path, _ = _paths(pid)
    script_path.write_text(req.script.model_dump_json(indent=1), encoding="utf-8")
    meta["title"] = req.script.title
    meta["updated_at"] = now_iso()
    _, _, meta_path = _paths(pid)
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
    return ProjectDetail(**meta, script=req.script)


@router.post("/{pid}/render")
def start_render(pid: str):
    _load_meta(pid)
    script = load_script(pid)
    try:
        task_id = task_manager.start_render(pid, script)
    except RuntimeError as e:
        raise HTTPException(409, str(e))
    return {"task_id": task_id}


@router.get("/{pid}/task/active")
def active_task(pid: str):
    """当前进行中的渲染任务（前端刷新后据此恢复进度轮询）。"""
    _load_meta(pid)
    tid = task_manager.active_task_of(pid)
    if not tid:
        return {"task": None}
    t = task_manager.get(tid)
    return {"task": t}


@router.get("/{pid}/estimate")
def estimate(pid: str):
    script = load_script(pid)
    return {
        "estimated_seconds": estimate_total_seconds(script),
        "shot_count": len(script.shots),
        "line_count": sum(len(s.lines) for s in script.shots),
    }


@router.get("/{pid}/video")
def get_video(pid: str):
    _load_meta(pid)
    path = RENDERS_DIR / pid / "final.mp4"
    if not path.exists():
        raise HTTPException(404, "还没有渲染完成的视频")
    return FileResponse(path, media_type="video/mp4", filename=f"{pid}.mp4")


# ---- 项目级 AI 设置（模型/风格/提示词/时长，落库）----


def _settings_path(pid: str):
    return PROJECTS_DIR / pid / "settings.json"


@router.get("/{pid}/settings", response_model=ProjectSettings)
def get_settings(pid: str):
    _load_meta(pid)
    path = _settings_path(pid)
    if not path.exists():
        return ProjectSettings()
    return ProjectSettings.model_validate_json(path.read_text(encoding="utf-8"))


@router.put("/{pid}/settings", response_model=ProjectSettings)
def put_settings(pid: str, req: ProjectSettings):
    """合并写入：只覆盖请求里显式给出的字段，避免整份覆盖把未提交的开关重置。"""
    _load_meta(pid)
    path = _settings_path(pid)
    current = (
        ProjectSettings.model_validate_json(path.read_text(encoding="utf-8"))
        if path.exists()
        else ProjectSettings()
    )
    merged = current.model_copy(update=req.model_dump(exclude_unset=True))
    path.write_text(merged.model_dump_json(indent=1), encoding="utf-8")
    return merged


# ---- 分镜图片提示词（供豆包等工具出图使用）----


@router.get("/{pid}/image-prompts")
def get_image_prompts(pid: str):
    _load_meta(pid)
    return {"prompts": img_prompts_svc.load_stored(pid)}

@router.post("/{pid}/image-prompts")
def generate_image_prompts(pid: str, req: ImagePromptRequest):
    _load_meta(pid)
    script = load_script(pid)
    try:
        prompts = img_prompts_svc.generate_and_store(pid, script, req.model_id)
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(502, f"图片提示词生成失败：{e}")
    return {"prompts": prompts}


# ---- 从零创作提示词包（模板无关选题，工作区规则 AGENTS.md）----


@router.get("/{pid}/prompt-pack", response_class=PlainTextResponse)
def get_prompt_pack(pid: str):
    """按当前脚本 + 导演方案重建并返回 prompt_pack.md（文本/markdown）。"""
    _load_meta(pid)
    script = load_script(pid)
    plan = director_svc.load_cached_plan(pid) or {}
    return PlainTextResponse(
        brief_svc.build_prompt_pack(script, plan, brief_svc._durations_from_props(pid)),
        media_type="text/markdown; charset=utf-8",
    )


# ---- 自定义分镜图 ----


def _shot_count(pid: str) -> int:
    return len(load_script(pid).shots)


def _custom_item(pid: str, idx: int, out_dir) -> dict:
    c = images_svc.find_custom(out_dir, idx + 1)
    return {
        "shot_index": idx,
        "custom": c.name if c else None,
        "url": f"/api/projects/{pid}/images/{idx}/file" if c else None,
    }


@router.get("/{pid}/images")
def list_images(pid: str):
    """每个分镜的自定义图状态 + 手动放置目录提示。"""
    _load_meta(pid)
    out_dir = images_svc.project_pic_dir(pid)
    n = _shot_count(pid)
    return {
        "manual_dir": str(out_dir),
        "items": [_custom_item(pid, i, out_dir) for i in range(n)],
    }


@router.post("/{pid}/images/{idx}")
async def upload_image(pid: str, idx: int, file: UploadFile = File(...)):
    """上传某分镜的自定义图，覆盖同序号旧图。"""
    _load_meta(pid)
    n = _shot_count(pid)
    if not (0 <= idx < n):
        raise HTTPException(400, f"分镜序号超出范围（0~{n - 1}）")

    data = await file.read()
    if len(data) > 15 * 1024 * 1024:
        raise HTTPException(400, "图片超过 15MB")
    try:
        img = Image.open(io.BytesIO(data))
        img.verify()
    except Exception as e:  # noqa: BLE001
        raise HTTPException(400, f"不是有效的图片文件：{e}")

    ext = _CUSTOM_EXT_BY_CONTENT_TYPE.get(file.content_type or "")
    if ext is None:
        name = (file.filename or "").lower()
        ext = next((e for e in (".png", ".jpg", ".jpeg", ".webp") if name.endswith(e)), None)
    if ext is None:
        raise HTTPException(400, "仅支持 png / jpg / webp")

    out_dir = images_svc.project_pic_dir(pid)
    out_dir.mkdir(parents=True, exist_ok=True)
    images_svc.remove_custom(out_dir, idx + 1)  # remove_custom 用 1 基序号
    (out_dir / f"custom_{idx + 1:02d}{ext}").write_bytes(data)
    return _custom_item(pid, idx, out_dir)


@router.delete("/{pid}/images/{idx}")
def delete_image(pid: str, idx: int):
    _load_meta(pid)
    out_dir = images_svc.project_pic_dir(pid)
    images_svc.remove_custom(out_dir, idx + 1)  # remove_custom 用 1 基序号
    return _custom_item(pid, idx, out_dir)


@router.get("/{pid}/images/{idx}/file")
def get_image_file(pid: str, idx: int):
    _load_meta(pid)
    c = images_svc.find_custom(images_svc.project_pic_dir(pid), idx + 1)
    if not c:
        raise HTTPException(404, "该分镜没有自定义图")
    media = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
    }.get(c.suffix.lower(), "application/octet-stream")
    return FileResponse(c, media_type=media)


# ---- 删除项目（脚本/设置 + 渲染产物 + 配音 + 画面素材）----


@router.delete("/{pid}")
def delete_project(pid: str):
    _load_meta(pid)  # 不存在 → 404
    if task_manager.active_task_of(pid):
        raise HTTPException(409, "该项目有渲染任务进行中，请等任务结束或失败后再删除")
    targets = [
        PROJECTS_DIR / pid,
        RENDERS_DIR / pid,
        REMOTION_PUBLIC / VOICE_PUBLIC_SUBDIR / pid,
        REMOTION_PUBLIC / PIC_PUBLIC_SUBDIR / pid,
        REMOTION_DIR / "src" / "gen" / pid,  # AI 现场编写的定制场景组件
    ]
    removed = []
    for d in targets:
        if d.exists():
            shutil.rmtree(d, ignore_errors=True)
            if not d.exists():
                removed.append(d.name)
            else:
                raise HTTPException(500, f"删除失败（目录被占用？）：{d}")
    return {"deleted": pid, "removed": removed}
