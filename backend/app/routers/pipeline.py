# -*- coding: utf-8 -*-
"""视频流水线路由：每日热点自动出片的推送 / 排产 / 运行记录 / 日志。"""
import json

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from ..services import daily

router = APIRouter(prefix="/api/pipeline", tags=["pipeline"])


class ThemeItem(BaseModel):
    name: str = Field(default="", max_length=20)
    keywords: list[str] = Field(default_factory=list, max_length=12)


class PipelineConfigUpdate(BaseModel):
    enabled: bool | None = None
    # 推送时间（每日一次推候选）与排产制作时间（凌晨自动制作）
    push_hour: int | None = Field(default=None, ge=0, le=23)
    push_minute: int | None = Field(default=None, ge=0, le=59)
    produce_hour: int | None = Field(default=None, ge=0, le=23)
    produce_minute: int | None = Field(default=None, ge=0, le=59)
    count: int | None = Field(default=None, ge=1, le=5)
    target_seconds: int | None = Field(default=None, ge=15, le=240)
    exclude_platforms: list[str] | None = None
    agent_cmd: str | None = None
    agent_profile: str | None = None
    agent_timeout: int | None = Field(default=None, ge=600, le=14400)
    feishu_webhook: str | None = None
    feishu_secret: str | None = None
    page_url: str | None = None
    themes: list[ThemeItem] | None = None
    style_prompt: str | None = None
    min_brightness: float | None = Field(default=None, ge=0.0, le=1.0)
    theme_search_fill: bool | None = None


class ConfirmRequest(BaseModel):
    """确认勾选的候选：schedule=True 排产到凌晨制作时间；False 立即开始制作。"""

    indices: list[int] = Field(max_length=5)
    schedule: bool = True


@router.get("/status")
def status():
    return daily.service.status()


@router.put("/config")
def update_config(req: PipelineConfigUpdate):
    payload = req.model_dump(exclude_none=True)
    if payload.get("themes") is not None:
        payload["themes"] = [t.model_dump() for t in req.themes or []]
    return daily.service.update_config(**payload)


@router.post("/run")
def run_now(count: int | None = Query(default=None, ge=1, le=5)):
    """立即推送一批候选（一天一次的自动推送之外的主动触发；冲突则 409）。"""
    try:
        daily.service.trigger_manual(count)
    except RuntimeError as e:
        raise HTTPException(409, str(e)) from e
    return {"ok": True, "message": "候选生成中，请稍候刷新勾选"}


@router.post("/runs/{run_id}/confirm")
def confirm_run(run_id: str, req: ConfirmRequest):
    """确认勾选的候选：排产到凌晨制作时间（schedule=true）或立即制作（false）。"""
    try:
        return daily.service.confirm_batch(run_id, req.indices, req.schedule)
    except LookupError as e:
        raise HTTPException(404, str(e)) from e
    except (RuntimeError, ValueError) as e:
        raise HTTPException(409, str(e)) from e


@router.post("/runs/{run_id}/produce")
def produce_run(run_id: str):
    """已排产批次立即开始制作（不必等凌晨）。"""
    try:
        return daily.service.produce_now(run_id)
    except LookupError as e:
        raise HTTPException(404, str(e)) from e
    except (RuntimeError, ValueError) as e:
        raise HTTPException(409, str(e)) from e


@router.get("/runs")
def runs(limit: int = Query(default=20, ge=1, le=100)):
    return daily.service.list_runs(limit)


@router.get("/runs/{run_id}")
def get_run(run_id: str):
    run = daily.service.get_run(run_id)
    if not run:
        raise HTTPException(404, "运行记录不存在")
    return run


@router.get("/runs/{run_id}/log")
def run_log(run_id: str, pid: str = Query(...), tail: int = Query(default=40, ge=1, le=200)):
    """tail 某视频的 dsh 会话事件日志（解析为可读行，前端实时展示）。"""
    run = daily.service.get_run(run_id)
    if not run:
        raise HTTPException(404, "运行记录不存在")
    video = next((v for v in run.get("videos", []) if v.get("pid") == pid), None)
    if not video or not video.get("log"):
        raise HTTPException(404, "该视频没有日志")
    return _tail_log(video["log"], tail)


def _tail_log(log_path: str, tail: int) -> dict:
    """读日志尾部并把 NDJSON 事件投影成可读行。"""
    try:
        with open(log_path, encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
    except OSError:
        return {"lines": ["（日志文件尚未生成）"]}
    out: list[str] = []
    for raw in lines[-tail * 4 :]:  # 事件行与诊断行混合，放大窗口再过滤
        s = raw.strip()
        if not s or s.startswith("====="):
            continue
        if s.startswith("{"):
            try:
                ev = _project_event(json.loads(s))
            except Exception:  # noqa: BLE001 — 单行解析失败不影响整体
                ev = None
            if ev:
                out.append(ev)
        else:
            out.append(s)  # dsh: 诊断行
    return {"lines": out[-tail:]}


def _project_event(ev: dict | None) -> str | None:
    """事件 → 单行可读文本（前端日志视图）。"""
    if not isinstance(ev, dict):
        return None
    t = ev.get("type")
    if t == "status":
        phase = ev.get("phase")
        if phase == "turn_end":
            reason = ev.get("reason") or {}
            if reason.get("kind") == "error":
                e = reason.get("error") or {}
                return f"❌ 出错 {e.get('code', '')}: {str(e.get('message', ''))[:160]}"
            return f"—— 回合结束（{reason.get('kind', '')}）——"
        return None  # turn/step_start 噪音不展示
    if t == "tool_call":
        tool = ev.get("tool", "?")
        inp = ev.get("input") or {}
        if tool == "write" or "file_path" in inp:
            detail = str(inp.get("file_path", ""))[-80:]
        elif "command" in inp:
            detail = str(inp.get("command", ""))[:120]
        else:
            detail = str(inp)[:120]
        return f"🔧 {tool}: {detail}"
    if t == "text":
        return str(ev.get("text", ""))[:200]
    if t == "final":
        return f"✅ 最终回答: {str(ev.get('text', ''))[:200]}"
    return None
