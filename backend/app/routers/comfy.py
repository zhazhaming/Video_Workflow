# -*- coding: utf-8 -*-
"""ComfyUI 文生图服务状态（连通性 / 可用 checkpoint），供前端 AI 生图按钮可用性判断。"""
from fastapi import APIRouter

from ..services import comfy

router = APIRouter(prefix="/api/comfy", tags=["comfy"])


@router.get("/status")
def status():
    return comfy.status()
