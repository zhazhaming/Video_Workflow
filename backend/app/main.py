# -*- coding: utf-8 -*-
"""video-workflow 后端入口。

启动：cd backend && uvicorn app.main:app --reload --port 8000
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import ensure_dirs
from .routers import bgm, comfy, flow, hotspot, model_settings, music_chart, pipeline, projects, publish, scripts, tasks
from .services import daily as daily_pipeline
from .services import hotspot as hotspot_service
from .services import music_chart as music_chart_service
from .services import publish_scheduler as publish_scheduler_service

app = FastAPI(title="video-workflow", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scripts.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(bgm.router)
app.include_router(comfy.router)
app.include_router(model_settings.router)
app.include_router(hotspot.router)
app.include_router(music_chart.router)
app.include_router(pipeline.router)
app.include_router(publish.router)
app.include_router(flow.router)

# ---- 访问口令校验（远程部署/隧道暴露时防止信息泄露）----
# .env 的 ACCESS_TOKEN 非空时启用：除 health/login 外所有 /api 请求须携带口令，
# 方式为 Header「X-Access-Token」、URL 参数「?token=」或 Cookie「vw_token」三者之一。

_AUTH_EXEMPT = {"/api/health", "/api/access/login"}


@app.middleware("http")
async def _access_token_guard(request, call_next):
    token = (os.getenv("ACCESS_TOKEN") or "").strip()
    path = request.url.path
    if token and path.startswith("/api/") and path not in _AUTH_EXEMPT:
        supplied = (
            request.headers.get("X-Access-Token")
            or request.query_params.get("token")
            or request.cookies.get("vw_token")
        )
        if supplied != token:
            return JSONResponse({"detail": "未授权：请输入访问口令"}, status_code=401)
    return await call_next(request)


@app.post("/api/access/login")
def access_login(payload: dict):
    """校验口令；成功时种下 Cookie（<img>/<video> 等标签请求自动携带）。"""
    token = (os.getenv("ACCESS_TOKEN") or "").strip()
    supplied = str((payload or {}).get("token") or "")
    if not token:
        return {"ok": True, "message": "未设置口令，访问无需认证"}  # 本地开发模式
    if supplied != token:
        return JSONResponse({"detail": "口令错误"}, status_code=401)
    resp = JSONResponse({"ok": True})
    resp.set_cookie(
        "vw_token", token, max_age=365 * 24 * 3600,
        samesite="lax", path="/",  # 不加 HttpOnly：前端也要读它给媒体 URL 带参
    )
    return resp


@app.on_event("startup")
def _startup():
    ensure_dirs()
    hotspot_service.service.startup()
    music_chart_service.service.startup()
    daily_pipeline.service.startup()
    publish_scheduler_service.service.startup()


@app.on_event("shutdown")
def _shutdown():
    hotspot_service.service.shutdown()
    music_chart_service.service.shutdown()
    daily_pipeline.service.shutdown()
    publish_scheduler_service.service.shutdown()


@app.get("/api/health")
def health():
    return {"ok": True}
