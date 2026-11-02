# -*- coding: utf-8 -*-
"""BGM 路由：曲库清单 / 自定义导入（上传或本地路径）/ 在线免版权曲库搜索 / 节拍分析 / 试听。"""
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from ..services import bgm as bgm_svc
from ..services import music_search

router = APIRouter(prefix="/api/bgm", tags=["bgm"])

_UPLOAD_EXTS = {".mp3", ".wav", ".m4a", ".mp4", ".mov", ".mkv", ".webm", ".flv", ".avi", ".ts"}


class BgmImportPathRequest(BaseModel):
    path: str = Field(min_length=1, max_length=1000)
    name: str | None = Field(default=None, max_length=80)
    title: str | None = Field(default=None, max_length=120)
    tags: list[str] = Field(default_factory=list, max_length=8)


class BgmSearchRequest(BaseModel):
    q: str = Field(min_length=1, max_length=120)
    limit: int = Field(default=20, ge=1, le=50)


class BgmOnlineImportRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2000)
    name: str | None = Field(default=None, max_length=80)
    title: str | None = Field(default=None, max_length=200)
    creator: str | None = Field(default=None, max_length=120)
    license: str | None = Field(default=None, max_length=120)
    provider: str | None = Field(default=None, max_length=40)
    landing_url: str | None = Field(default=None, max_length=2000)


@router.get("/tracks")
def tracks():
    """曲库清单（含标题/标签/时长/已缓存的 BPM）。"""
    return {"tracks": bgm_svc.list_tracks()}


@router.post("/import")
async def import_upload(file: UploadFile = File(...)):
    """上传音频或视频文件导入曲库；视频自动抽取音轨。"""
    raw_name = Path(file.filename or "").name
    ext = Path(raw_name).suffix.lower()
    if ext not in _UPLOAD_EXTS:
        raise HTTPException(400, f"仅支持这些格式：{'、'.join(sorted(_UPLOAD_EXTS))}")

    data = await file.read()
    if len(data) > bgm_svc.MAX_SOURCE_BYTES:
        raise HTTPException(400, f"文件超过 {bgm_svc.MAX_SOURCE_BYTES // (1024 * 1024)}MB 限制")

    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td) / f"upload{ext or '.mp3'}"
        tmp.write_bytes(data)
        try:
            track = bgm_svc.import_track(tmp, name=Path(raw_name).stem)
        except ValueError as e:
            raise HTTPException(400, str(e))
        except FileNotFoundError as e:
            raise HTTPException(404, str(e))
        except RuntimeError as e:
            raise HTTPException(502, f"导入失败：{e}")
    return track


@router.post("/import-path")
def import_from_path(req: BgmImportPathRequest):
    """从本机路径导入（例如渲染引擎目录下的参考片）。仅限本机工具场景。"""
    try:
        track = bgm_svc.import_track(
            Path(req.path), name=req.name, title=req.title, tags=req.tags
        )
    except ValueError as e:
        raise HTTPException(400, str(e))
    except FileNotFoundError as e:
        raise HTTPException(404, str(e))
    except RuntimeError as e:
        raise HTTPException(502, f"导入失败：{e}")
    return track


@router.post("/analyze/{name}")
def analyze(name: str):
    """强制重新分析某曲目的节拍。"""
    try:
        info = bgm_svc.force_reanalyze(name)
    except FileNotFoundError as e:
        raise HTTPException(404, str(e))
    return {"name": name, "bpm": info.get("bpm") or 0, "beat_count": len(info.get("beats") or [])}


# ---- 在线免版权曲库（Openverse / Jamendo，结果自带许可证）----


@router.get("/online-search")
def online_search(q: str, limit: int = 20):
    """搜索免版权曲库（CC 许可，可安全用于发布）。单源失败不影响整体。"""
    try:
        return music_search.search(q.strip()[:120], limit)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(502, f"搜索失败：{e}")


@router.post("/online-import")
def online_import(req: BgmOnlineImportRequest):
    """下载在线曲库曲目并导入本地曲库（响度归一 + 节拍分析），来源与许可写入元数据。"""
    with tempfile.TemporaryDirectory() as td:
        try:
            tmp, _ext = music_search.download_to_temp(req.url, td)
        except ValueError as e:
            raise HTTPException(400, str(e))
        except Exception as e:  # noqa: BLE001 — 网络类错误统一 502
            raise HTTPException(502, f"下载失败：{e}")

        title = (req.title or "").strip() or "在线曲目"
        name = bgm_svc._sanitize_name(req.name or title)[:80]
        tags = [t for t in (req.provider, "在线曲库", req.license) if t]
        try:
            track = bgm_svc.import_track(tmp, name=name, title=title, tags=tags[:8])
        except (ValueError, RuntimeError) as e:
            raise HTTPException(502, f"导入失败：{e}")

    bgm_svc.save_meta(
        track["name"],
        source={
            "provider": req.provider or "online",
            "url": str(req.url),
            "landing_url": req.landing_url or "",
            "creator": req.creator or "",
            "license": req.license or "",
        },
    )
    track["source"] = bgm_svc._load_meta_all().get(track["name"], {}).get("source")
    return track


@router.get("/audio/{name}")
def audio(name: str):
    """试听。"""
    try:
        path = bgm_svc.track_file(name)
    except FileNotFoundError as e:
        raise HTTPException(404, str(e))
    media = "audio/mpeg" if path.suffix.lower() == ".mp3" else "audio/wav"
    return FileResponse(path, media_type=media)
