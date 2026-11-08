# -*- coding: utf-8 -*-
"""oil-rise-vibe：ComfyUI 批量生成全片插画（复古工业印刷风）。

- 直调 app.services.comfy.txt2img（同步、Lightning 4 步快出图）
- 统一风格后缀锁全片画风；主体按镜（s02/s10 为图表 gen 场景，不生图）
- 候选落 storage/projects/oil-rise-vibe/ai/<NN>-<seed>.png，每镜 2 个确定性 seed 供选优
- 选优后由人（agent 抽检）拷贝到 remotion-engine/public/pic/projects/oil-rise-vibe/<NN>-ai.png
  （--promote 时直接按选优表复制）

用法：
    python tools/gen_oil_vibe_images.py                 # 生成全部缺省候选
    python tools/gen_oil_vibe_images.py --shots 1,7     # 只补指定镜
    python tools/gen_oil_vibe_images.py --promote 1:a1b2,3:c3d4
"""
from __future__ import annotations

import argparse
import os
import shutil
import sys
import time
import urllib.request
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(BACKEND / ".env")

from app.services import comfy  # noqa: E402

PDIR = BACKEND / "storage" / "projects" / "oil-rise-vibe"
AI_DIR = PDIR / "ai"
PUB_DIR = BACKEND.parent / "remotion-engine" / "public" / "pic" / "projects" / "oil-rise-vibe"

# 单张超时（Lightning 4 步在 3060 上远低于此值；防止单张挂死拖垮整批）
PER_IMAGE_TIMEOUT = 180
RETRIES = 3


def probe() -> bool:
    """轻量探活：区分「服务挂了」和「单张超时」。"""
    url = f"{comfy.COMFYUI_URL}/system_stats"
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            return r.status == 200
    except Exception:  # noqa: BLE001
        return False

# 统一风格后缀（全片画风锁死；上屏数字一律由 Remotion 叠加，图内禁文字）
STYLE = (
    "vintage industrial print poster illustration, bold ink linework, "
    "aged paper texture, warm sepia and cream palette with vermilion red accents, "
    "1950s advertisement style, dramatic vertical composition, "
    "no text, no letters, no numbers, no watermark"
)

# 每镜主体（S03=调价计数板、S11=五年曲线 为代码图表 gen 场景，不生图；
# 0=开场主持台，15=结语点赞）
SUBJECTS: dict[int, str] = {
    0: "a vintage broadcast studio, a friendly host silhouette at a wooden desk with a large retro microphone and a film reel, warm stage light",
    1: "close-up of a fuel pump nozzle plugged into a car fuel tank, a few banknotes flying away from the filler",
    3: "flip-style wall calendar with pages turning in motion, an oil barrel standing beside it",
    4: "old brass balance scale, a heavy oil barrel on one pan and a small globe on the other pan",
    5: "an oil barrel standing firmly on a thick concrete floor plate, a protective metal shield arching above",
    6: "lone pumpjack silhouette on a barren desert slope under a low sun, long shadows",
    7: "an oil barrel tipping over the edge into a deep red pit, downward spiral motion, alarm atmosphere",
    8: "an oil tanker ship on a rough dark sea, smoke plume rising on the horizon",
    9: "three pipelines descending a barren hillside like a staircase, muted tones, fading into distance",
    11: "vintage nautical map with a route line rerouting around a crisis zone, an oil tanker following the detour",
    12: "a worn leather wallet with only a few banknotes left, next to a car fuel gauge needle pointing to empty",
    13: "a person at a harbor lighthouse holding binoculars, watching a stock-style price board across the water",
    15: "a retro television set surrounded by floating hearts and stars, a hand pressing a big round red button",
}


def gen_one(shot: int, seed: int) -> Path:
    prompt = f"{SUBJECTS[shot]}, {STYLE}"
    blob, out_seed, ck = comfy.txt2img(
        prompt, variant="scene", seed=seed, width=768, height=1344, timeout=PER_IMAGE_TIMEOUT
    )
    AI_DIR.mkdir(parents=True, exist_ok=True)
    out = AI_DIR / f"{shot:02d}-{out_seed}.png"
    out.write_bytes(blob)
    print(f"[ok] shot{shot:02d} seed={out_seed} ckpt={ck} -> {out.name} ({len(blob)} bytes)", flush=True)
    return out


def gen_with_retry(shot: int, seed: int) -> Path | None:
    """逐张重试；服务探活失败直接判服务级故障，避免把超时浪费在挂掉的服务上。"""
    for attempt in range(1, RETRIES + 1):
        try:
            return gen_one(shot, seed)
        except Exception as e:  # noqa: BLE001
            alive = probe()
            tag = "服务不可达" if not alive else "单张失败"
            print(f"[retry {attempt}/{RETRIES}] shot{shot:02d} seed={seed} {tag}: {type(e).__name__}: {str(e)[:100]}", flush=True)
            if not alive:
                return None
            if attempt < RETRIES:
                time.sleep(3 * attempt)
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--shots", default=None, help="逗号分隔镜号，缺省全部")
    ap.add_argument("--seeds-per-shot", type=int, default=2)
    ap.add_argument("--seed-base", type=int, default=20261107)
    ap.add_argument("--promote", default=None, help="选优表 1:seed,3:seed → 复制到 public")
    args = ap.parse_args()

    if args.promote:
        PUB_DIR.mkdir(parents=True, exist_ok=True)
        for pair in args.promote.split(","):
            shot_s, seed_s = pair.strip().split(":")
            shot, seed = int(shot_s), int(seed_s)
            src = AI_DIR / f"{shot:02d}-{seed}.png"
            if not src.exists():
                raise SystemExit(f"候选不存在: {src}")
            dst = PUB_DIR / f"{shot:02d}-ai.png"
            shutil.copyfile(src, dst)
            print(f"[promote] {src.name} -> {dst}")
        return 0

    shots = [int(s) for s in args.shots.split(",")] if args.shots else sorted(SUBJECTS)
    missing = [s for s in shots if s not in SUBJECTS]
    if missing:
        raise SystemExit(f"未知镜号（图表镜不生图）: {missing}")
    if not probe():
        raise SystemExit(
            f"ComfyUI 探活失败（{comfy.COMFYUI_URL}/system_stats 10s 无响应）——服务未运行，先到 3060 机器上启动 ComfyUI 再跑"
        )
    print(f"[probe] ComfyUI 在线：{comfy.COMFYUI_URL}", flush=True)
    failed: list[str] = []
    for shot in shots:
        for i in range(args.seeds_per_shot):
            seed = args.seed_base + shot * 1000 + i
            out = AI_DIR / f"{shot:02d}-{seed}.png"
            if out.exists() and out.stat().st_size > 50_000:
                print(f"[skip] {out.name} 已存在", flush=True)
                continue
            r = gen_with_retry(shot, seed)
            if r is None:
                failed.append(f"{shot:02d}-{seed}")
    if failed:
        print(f"[summary] {len(failed)} 张未成：{', '.join(failed)}（可 --shots 单独补跑）", flush=True)
    return 0


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass
    sys.exit(main())
