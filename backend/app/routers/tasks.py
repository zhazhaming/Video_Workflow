# -*- coding: utf-8 -*-
"""任务路由：查询渲染任务状态。"""
from fastapi import APIRouter, HTTPException

from ..schemas import TaskStatus
from ..services.tasks import task_manager

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("/{task_id}", response_model=TaskStatus)
def get_task(task_id: str):
    t = task_manager.get(task_id)
    if not t:
        raise HTTPException(404, "任务不存在")
    return TaskStatus(**t)
