# -*- coding: utf-8 -*-
"""有界抽帧（视觉验收 Tier1，确定性、零 token）：按 props 时间轴选 ≤N 帧缩略图。

确定性选帧（每张 540×960 JPEG ≈ 几百 token，供制作 agent 在会话内 Read 一次判定）：
  片头中点（有 titleCard 时）+ 每镜中点 + 成片末帧（CTA/尾版）；
  超上限按均匀抽样裁剪，永远保留「首镜中点」与「末帧」。
前 2 张镜内帧额外输出抖音裁切模拟版（crop=802:1920:139:0 → 402×960），专查贴边切字。
时间轴数学来自 shot_timeline.build（与 remotion-engine/src/dv/timeline.ts 对齐）。

用法:
    cd backend && python -X utf8 tools/acceptance_frames.py \\
        --video storage/renders/<pid>/final.mp4 \\
        --props storage/renders/<pid>/props.json \\
        --out storage/renders/<pid>/acceptance [--max 6] [--ffmpeg <ffmpeg路径>]
stdout 输出 manifest JSON，同时落 <out>/manifest.json。
"""
import argparse
import json
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from shot_timeline import build  # noqa: E402  复用同一份时间轴数学

CROP_FILTER = "crop=802:1920:139:0,scale=402:960"
FULL_FILTER = "scale=540:960"
CROP_SHOTS = 2  # 前 2 张镜内帧出裁切模拟版


def pick_frames(timeline: list[dict], offset: float, end: float, max_n: int) -> list[dict]:
    """确定性选帧：片头中点 + 每镜中点 + 末帧，超上限均匀抽样（保首尾）。"""
    cands = []
    if offset > 0:
        cands.append({"t": round(offset / 2, 2), "kind": "title"})
    for s in timeline:
        cands.append({"t": round(s["mid"], 2), "kind": "shot"})
    cands.append({"t": round(max(0.0, end - 0.4), 2), "kind": "end"})
    if len(cands) <= max_n:
        return cands
    middle = cands[1:-1]
    need = max(0, max_n - 2)
    step = len(middle) / need if need else 1
    picked = [cands[0]] + [middle[int(i * step)] for i in range(need)] + [cands[-1]]
    seen: set[float] = set()
    out = []
    for c in picked:
        if c["t"] in seen:
            continue
        seen.add(c["t"])
        out.append(c)
    return sorted(out, key=lambda c: c["t"])


def extract(ff: str, video: Path, t: float, out_path: Path, crop: bool) -> None:
    cmd = [
        ff, "-y", "-ss", f"{t:.2f}", "-i", str(video),
        "-frames:v", "1", "-vf", CROP_FILTER if crop else FULL_FILTER,
        "-q:v", "5", str(out_path),
    ]
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    except (subprocess.TimeoutExpired, OSError) as e:
        raise RuntimeError(f"ffmpeg 抽帧失败（t={t}s）：{e}") from e
    if p.returncode != 0:
        raise RuntimeError(f"ffmpeg 抽帧失败（t={t}s）：{(p.stderr or '')[-200:]}")


def find_ffmpeg() -> str | None:
    """--ffmpeg 未指定时：PATH → app.config 的 FFMPEG_BIN（Remotion 自带）。"""
    p = shutil.which("ffmpeg")
    if p:
        return p
    try:
        sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
        from app.config import FFMPEG_BIN  # noqa: PLC0415

        if Path(FFMPEG_BIN).exists():
            return str(FFMPEG_BIN)
    except Exception:  # noqa: BLE001 — 回退失败交给调用方报错
        pass
    return None


def main() -> int:
    ap = argparse.ArgumentParser(description="视觉验收有界抽帧")
    ap.add_argument("--video", required=True, help="final.mp4 路径")
    ap.add_argument("--props", required=True, help="props.json 路径")
    ap.add_argument("--out", required=True, help="输出目录（建议 renders/<pid>/acceptance/）")
    ap.add_argument("--max", type=int, default=6, help="最多抽帧数（默认 6，含片头与末帧）")
    ap.add_argument("--ffmpeg", default=None, help="ffmpeg 路径（缺省 PATH → Remotion 自带）")
    args = ap.parse_args()
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

    ff = args.ffmpeg or find_ffmpeg()
    if not ff:
        print(json.dumps({"error": "找不到 ffmpeg（PATH 与 Remotion 自带都没有），请用 --ffmpeg 指定"},
                         ensure_ascii=False))
        return 2
    video = Path(args.video)
    if not video.exists():
        print(json.dumps({"error": f"成片不存在：{video}"}, ensure_ascii=False))
        return 2
    props = json.loads(Path(args.props).read_text(encoding="utf-8"))
    timeline, offset, end = build(props)
    frames = pick_frames(timeline, offset, end, max(2, args.max))

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    manifest = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "video": str(video),
        "max_frames": args.max,
        "crop_note": f"前 {CROP_SHOTS} 张镜内帧带 _crop 抖音裁切模拟版（802×1920 → 402×960）",
        "frames": [],
    }
    cropped = 0
    for i, fr in enumerate(frames, 1):
        f = out / f"f{i:02d}.jpg"
        extract(ff, video, fr["t"], f, crop=False)
        entry = {**fr, "file": str(f)}
        if fr["kind"] == "shot" and cropped < CROP_SHOTS:
            cf = out / f"f{i:02d}_crop.jpg"
            extract(ff, video, fr["t"], cf, crop=True)
            entry["crop_file"] = str(cf)
            cropped += 1
        manifest["frames"].append(entry)

    (out / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
