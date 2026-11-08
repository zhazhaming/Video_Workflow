# -*- coding: utf-8 -*-
"""ComfyUI 文生图客户端：对接局域网 ComfyUI 原生 API（/prompt + /history + /view）。

不走第三方封装层，直连 8188；工作流为 SDXL txt2img 竖屏（768×1344）。
中文提示词由 llm.translate_image_prompt 翻成英文后再提交（SDXL 文本编码器英文主导）。
"""
import json
import random
import time
import uuid

import httpx

from ..config import COMFYUI_CHECKPOINT, COMFYUI_NEGATIVE, COMFYUI_TIMEOUT, COMFYUI_URL

# SDXL 竖屏桶：768×1344 最接近 9:16
WIDTH = 768
HEIGHT = 1344
STEPS = 25  # 完整版 Juggernaut XL v9 推荐步数
CFG = 6.5
SAMPLER = "dpmpp_2m"
SCHEDULER = "karras"


def is_configured() -> bool:
    return bool(COMFYUI_URL)


def _resolve_checkpoint(checkpoints: list[str], requested: str = "") -> str:
    """checkpoint 选择：显式指定 > .env 配置 > 含 juggernaut 的微调模型 > 第一个可用。"""
    for want in (requested.strip(), COMFYUI_CHECKPOINT.strip()):
        if want and want in checkpoints:
            return want
    for ck in checkpoints:
        if "juggernaut" in ck.lower():
            return ck
    return checkpoints[0] if checkpoints else (requested or COMFYUI_CHECKPOINT)


def pick_variant(checkpoints: list[str], variant: str = "auto") -> str:
    """按内容类型挑模型：portrait=人像写真（Lightning 快枪手），scene=环境分镜（完整版 v9）。

    缺对应模型时优雅回退（scene 找不到完整版就用 Lightning）。
    """
    if not checkpoints:
        return ""
    light = next((c for c in checkpoints if "lightning" in c.lower()), None)
    full = next((c for c in checkpoints if "juggernaut" in c.lower() and "lightning" not in c.lower()), None)
    if variant == "portrait" and light:
        return light
    if variant == "scene":
        if full:
            return full
        if light:
            return light
    # auto / 回退：完整版优先，其次 Lightning
    return full or light or checkpoints[0]


def _sampling_for(checkpoint: str) -> tuple[int, float, str, str]:
    """Lightning/Turbo/Hyper 蒸馏模型必须少步数+低 CFG，普通微调模型用默认质量参数。"""
    name = checkpoint.lower()
    if "lightning" in name or "turbo" in name or "hyper" in name:
        return 4, 1.8, "euler", "sgm_uniform"
    return STEPS, CFG, SAMPLER, SCHEDULER


def _build_graph(
    prompt_en: str,
    checkpoint: str,
    seed: int,
    negative: str,
    width: int = WIDTH,
    height: int = HEIGHT,
    steps: int = STEPS,
    cfg: float = CFG,
    sampler: str = SAMPLER,
    scheduler: str = SCHEDULER,
) -> dict:
    """SDXL txt2img 的 API 格式工作流（SaveImage 进临时目录，图片经 /view 取回）。"""
    return {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": checkpoint}},
        "2": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt_en, "clip": ["1", 1]}},
        "3": {"class_type": "CLIPTextEncode", "inputs": {"text": negative, "clip": ["1", 1]}},
        "4": {
            "class_type": "EmptyLatentImage",
            "inputs": {"width": width, "height": height, "batch_size": 1},
        },
        "5": {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed,
                "steps": steps,
                "cfg": cfg,
                "sampler_name": sampler,
                "scheduler": scheduler,
                "denoise": 1.0,
                "model": ["1", 0],
                "positive": ["2", 0],
                "negative": ["3", 0],
                "latent_image": ["4", 0],
            },
        },
        "6": {"class_type": "VAEDecode", "inputs": {"samples": ["5", 0], "vae": ["1", 2]}},
        "7": {
            "class_type": "SaveImage",
            "inputs": {"filename_prefix": "video-workflow/tmp", "images": ["6", 0]},
        },
    }


def status(timeout: float = 8.0) -> dict:
    """连通性与可用模型（前端按钮可用性、checkpoint 展示）。"""
    if not is_configured():
        return {"reachable": False, "reason": "backend/.env 未配置 COMFYUI_URL"}
    try:
        r = httpx.get(f"{COMFYUI_URL}/system_stats", timeout=timeout)
        r.raise_for_status()
        stats = r.json()
    except Exception as e:  # noqa: BLE001
        return {"reachable": False, "reason": f"连不上 {COMFYUI_URL}：{e}"}
    devices = stats.get("devices") or []
    gpu = devices[0].get("name") if devices else ""
    checkpoints: list[str] = []
    try:
        info = httpx.get(f"{COMFYUI_URL}/object_info/CheckpointLoaderSimple", timeout=timeout).json()
        checkpoints = [
            str(v)
            for v in info["CheckpointLoaderSimple"]["input"]["required"]["ckpt_name"][0]
        ]
    except Exception:  # noqa: BLE001 — 版本差异下不阻断状态展示
        pass
    return {
        "reachable": True,
        "url": COMFYUI_URL,
        "gpu": gpu,
        "version": stats.get("system", {}).get("comfyui_version") or "",
        "checkpoints": checkpoints,
        "checkpoint": _resolve_checkpoint(checkpoints),
        # 双模型路由展示：人像快枪手 / 环境分镜完整版（缺哪个就回退）
        "portrait_checkpoint": pick_variant(checkpoints, "portrait"),
        "scene_checkpoint": pick_variant(checkpoints, "scene"),
    }


def txt2img(
    prompt_en: str,
    checkpoint: str = "",
    *,
    variant: str = "auto",
    negative: str = "",
    seed: int | None = None,
    width: int = WIDTH,
    height: int = HEIGHT,
    steps: int | None = None,
    cfg: float | None = None,
    timeout: float | None = None,
) -> tuple[bytes, int, str]:
    """提交一张竖屏文生图，阻塞到出图，返回 (图片字节, seed, 实际使用的 checkpoint)。

    variant：portrait=人像快枪手（Lightning），scene=环境分镜（完整版 v9），auto=完整版优先。
    """
    if not is_configured():
        raise RuntimeError("backend/.env 未配置 COMFYUI_URL，无法 AI 生图")
    timeout = timeout or COMFYUI_TIMEOUT
    seed = random.randint(0, 2**48) if seed is None else seed

    # 取可用 checkpoint（拿不到列表时直接用解析值，让 ComfyUI 报具体错）
    checkpoints: list[str] = []
    try:
        info = httpx.get(
            f"{COMFYUI_URL}/object_info/CheckpointLoaderSimple", timeout=10
        ).json()
        checkpoints = [
            str(v)
            for v in info["CheckpointLoaderSimple"]["input"]["required"]["ckpt_name"][0]
        ]
    except Exception as e:  # noqa: BLE001
        raise RuntimeError(f"连不上 ComfyUI（{COMFYUI_URL}）：{e}") from e
    ck = _resolve_checkpoint(checkpoints, checkpoint) if checkpoint else pick_variant(checkpoints, variant)
    if checkpoints and ck not in checkpoints:
        raise RuntimeError(
            f"checkpoint「{ck}」不存在；可用：{', '.join(checkpoints) or '（空）'}"
        )
    auto_steps, auto_cfg, sampler, scheduler = _sampling_for(ck)
    steps = auto_steps if steps is None else steps
    cfg = auto_cfg if cfg is None else cfg

    client_id = f"video-workflow-{uuid.uuid4().hex[:8]}"
    graph = _build_graph(
        prompt_en, ck, seed, negative or COMFYUI_NEGATIVE,
        width, height, steps, cfg, sampler, scheduler,
    )
    try:
        r = httpx.post(
            f"{COMFYUI_URL}/prompt",
            json={"prompt": graph, "client_id": client_id},
            timeout=30,
        )
        r.raise_for_status()
        prompt_id = r.json()["prompt_id"]
    except Exception as e:  # noqa: BLE001
        raise RuntimeError(f"提交生图任务失败：{e}") from e

    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        time.sleep(1.5)
        try:
            hist = httpx.get(f"{COMFYUI_URL}/history/{prompt_id}", timeout=15).json()
        except Exception:  # noqa: BLE001 — 轮询抖动重试
            continue
        entry = hist.get(prompt_id)
        if not entry:
            continue
        status_info = entry.get("status") or {}
        if status_info.get("status_str") == "error":
            msgs = []
            for m in status_info.get("messages") or []:
                if isinstance(m, list) and len(m) >= 2 and isinstance(m[1], dict):
                    d = m[1]
                    msgs.append(
                        str(
                            d.get("exception_message")
                            or d.get("message")
                            or d.get("node_type")
                            or d
                        )
                    )
            raise RuntimeError(f"ComfyUI 出图失败：{'；'.join(filter(None, msgs))[:300]}")
        outputs = entry.get("outputs") or {}
        for node_out in outputs.values():
            images = node_out.get("images") or []
            if images:
                img = images[0]
                view = httpx.get(
                    f"{COMFYUI_URL}/view",
                    params={
                        "filename": img["filename"],
                        "subfolder": img.get("subfolder", ""),
                        "type": img.get("type", "output"),
                    },
                    timeout=60,
                )
                view.raise_for_status()
                return view.content, seed, ck
    raise RuntimeError(f"生图超时（{int(timeout)}s），可在 .env 调大 COMFYUI_TIMEOUT")


def _demo() -> None:  # pragma: no cover - 手动自检用
    data, seed, ck = txt2img("a cinematic photo of a red fox in snow, 9:16")
    print(f"seed={seed} ck={ck} bytes={len(data)}")
    json.dump({"seed": seed, "ckpt": ck}, open("comfy_demo.json", "w"))


if __name__ == "__main__":  # pragma: no cover
    _demo()
