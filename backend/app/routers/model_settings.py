# -*- coding: utf-8 -*-
"""模型 API 配置路由：读写 models.json（前端设置弹窗）与连通性测试。"""
from fastapi import APIRouter, HTTPException

from ..schemas import ModelTestReq, ModelsSave
from ..services import llm

router = APIRouter(prefix="/api/models", tags=["models"])


@router.get("/config")
def get_config():
    """当前模型配置（完整字段，供设置弹窗编辑）。"""
    return {"models": llm.get_model_configs()}


@router.put("/config")
def save_config(req: ModelsSave):
    """保存模型列表到 models.json（旧文件备份 .bak），立即生效。"""
    try:
        models = llm.save_model_configs(req.models)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return {"models": models}


@router.post("/test")
def test_conn(req: ModelTestReq):
    """测试一个 OpenAI 兼容端点的连通性（支持未保存的草稿值）。"""
    return llm.test_model(req.base_url, req.api_key, req.model, extra_headers=req.extra_headers)
