# -*- coding: utf-8 -*-
"""video-workflow 后端入口。

启动：cd backend && uvicorn app.main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import ensure_dirs
from .routers import bgm, flow, hotspot, projects, publish, scripts, tasks
from .services import hotspot as hotspot_service

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
app.include_router(hotspot.router)
app.include_router(publish.router)
app.include_router(flow.router)


@app.on_event("startup")
def _startup():
    ensure_dirs()
    hotspot_service.service.startup()


@app.on_event("shutdown")
def _shutdown():
    hotspot_service.service.shutdown()


@app.get("/api/health")
def health():
    return {"ok": True}
