# -*- coding: utf-8 -*-
"""脚本路由：模型列表 / 提示词模板 / BGM 列表 / 音色试听 / AI 生成 / 优化。"""
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from ..config import BGM_PUBLIC_SUBDIR, REMOTION_PUBLIC
from ..schemas import GenRequest, OptimizeRequest, ScriptDraft
from ..services import llm, voice

router = APIRouter(prefix="/api/scripts", tags=["scripts"])


@router.get("/models")
def models():
    return {"models": llm.list_model_infos()}


@router.get("/bgm")
def bgm_tracks():
    """可用 BGM 曲库（public/bgm/*.mp3|wav），附带检测到的 BPM。"""
    from ..services import beat

    d = REMOTION_PUBLIC / BGM_PUBLIC_SUBDIR
    tracks = []
    if d.exists():
        for f in sorted(d.iterdir()):
            if f.suffix.lower() in (".mp3", ".wav"):
                meta = beat.analyze(f)
                tracks.append(
                    {
                        "name": f.stem,
                        "file": f"{BGM_PUBLIC_SUBDIR}/{f.name}",
                        "bpm": meta["bpm"],
                    }
                )
    return {"tracks": tracks}


@router.get("/tts-sample")
def tts_sample(voice_name: str = Query("zh-CN-YunjianNeural", alias="voice")):
    """音色试听样本（首次请求生成并缓存）。"""
    try:
        path = voice.sample_voice(voice_name)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(502, f"试听生成失败：{e}")
    return FileResponse(path, media_type="audio/mpeg", filename=f"{voice_name}-sample.mp3")


@router.get("/prompts")
def prompts():
    return {"templates": llm.load_prompt_templates()}


@router.post("/generate", response_model=ScriptDraft)
def generate(req: GenRequest):
    try:
        return llm.generate_script(req)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"LLM 生成失败：{e}")


@router.post("/optimize", response_model=ScriptDraft)
def optimize(req: OptimizeRequest):
    try:
        return llm.optimize_script(req)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"LLM 优化失败：{e}")
