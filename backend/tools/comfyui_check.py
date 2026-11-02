#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""ComfyUI 生成节点自检：连通性、GPU/显存、版本、可用模型。

用法（本机）：
    python backend/tools/comfyui_check.py
    set COMFYUI_URL=http://192.168.1.50:8188   # Windows
    python backend/tools/comfyui_check.py

退出码：0=可用；1=能连上但缺模型/节点；2=连不上。
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

DEFAULT_URL = "http://127.0.0.1:8188"


def _get(base: str, path: str, timeout: float = 8.0):
    req = urllib.request.Request(base + path, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _input_options(info: dict, node: str, key: str) -> list[str]:
    """从 /object_info 里取某个节点的下拉选项（ComfyUI 的 required 结构是 [list, opts]）。"""
    try:
        spec = info[node]["input"]["required"][key]
        values = spec[0]
        return [str(v) for v in values] if isinstance(values, list) else []
    except (KeyError, TypeError, IndexError):
        return []


def main() -> int:
    base = (os.getenv("COMFYUI_URL") or DEFAULT_URL).rstrip("/")
    print(f"检查 ComfyUI：{base}")

    try:
        stats = _get(base, "/system_stats", timeout=6)
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        print(f"✗ 连不上：{e}")
        print("  1) 3060 上是否运行 start-comfyui.ps1")
        print("  2) 防火墙是否放行 TCP 8188（Private 网络）")
        print("  3) backend/.env 的 COMFYUI_URL 是否是 3060 的局域网 IP")
        return 2
    except json.JSONDecodeError as e:
        print(f"✗ 返回的不是 JSON：{e}")
        return 2

    system = stats.get("system") or {}
    devices = stats.get("devices") or []
    ok = True

    if devices:
        for d in devices:
            name = d.get("name") or "unknown GPU"
            total = (d.get("vram_total") or 0) / 1024**3
            free = (d.get("vram_free") or 0) / 1024**3
            print(f"✓ GPU：{name}  VRAM {total:.1f} GB（空闲 {free:.1f} GB）")
    else:
        print("⚠ 没有检测到 GPU（可能在用 CPU 模式）")
        ok = False

    version = system.get("comfyui_version") or "?"
    python_version = system.get("python_version") or "?"
    print(f"✓ ComfyUI {version} / Python {python_version}")

    try:
        info = _get(base, "/object_info", timeout=15)
    except Exception as e:  # noqa: BLE001
        print(f"⚠ /object_info 读取失败：{e}")
        return 1

    needed = [
        "CheckpointLoaderSimple", "KSampler", "EmptyLatentImage",
        "VAEDecode", "SaveImage", "CLIPTextEncode",
    ]
    missing = [n for n in needed if n not in info]
    if missing:
        print("⚠ 缺少基础节点：" + ", ".join(missing))
        ok = False
    else:
        print("✓ 基础节点齐全（txt2img 可用）")

    checkpoints = _input_options(info, "CheckpointLoaderSimple", "ckpt_name")
    print("✓ checkpoints：" + (", ".join(checkpoints) if checkpoints else "（空，先跑 download-models.ps1 -Sdxl）"))
    if not checkpoints:
        ok = False

    diffusion = _input_options(info, "UNETLoader", "unet_name")
    if diffusion:
        print("✓ diffusion_models：" + ", ".join(diffusion))

    # /models 是较新版本才有的；失败不影响结论
    try:
        folders = _get(base, "/models", timeout=6)
        if isinstance(folders, list):
            for folder in ("vae", "text_encoders", "loras", "upscale_models"):
                if folder not in folders:
                    continue
                files = _get(base, f"/models/{folder}", timeout=6)
                if isinstance(files, list) and files:
                    print(f"✓ {folder}：" + ", ".join(str(f) for f in files[:8]))
    except Exception:  # noqa: BLE001
        pass

    print("")
    if ok:
        print("结论：可用。后端设置 COMFYUI_URL 后即可接入生成。")
        return 0
    print("结论：能连上，但还缺模型或节点，按上面的提示补齐。")
    return 1


if __name__ == "__main__":
    sys.exit(main())
