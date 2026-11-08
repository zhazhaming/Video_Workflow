# -*- coding: utf-8 -*-
"""《你的一生，就是一支K线》成片 QA：时长/音轨 + 事件卡点对齐（重音秒 RMS 峰）+ 抽帧。"""
import json
import re
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

sys.path.insert(0, r"D:\Work\video-workflow\backend")
from app.config import FFMPEG_BIN  # noqa: E402

RENDER = Path(r"D:\Work\video-workflow\backend\storage\renders\life-kline")
FINAL = RENDER / "final.mp4"
DESIGN = Path(r"D:\Work\video-workflow\backend\storage\_life_kline_design.json")
SR = 44100


def probe() -> dict:
    out = subprocess.run(
        [str(FFMPEG_BIN), "-i", str(FINAL), "-f", "null", "-"],
        capture_output=True, text=True,
    )
    info = out.stderr
    dur = re.search(r"Duration: (\d+):(\d+):([\d.]+)", info)
    fps = re.search(r"([\d.]+) fps", info)
    audio = "Audio" in info
    size = FINAL.stat().st_size / 1e6
    t = int(dur.group(1)) * 3600 + int(dur.group(2)) * 60 + float(dur.group(3))
    return {"dur": t, "audio": audio, "size_mb": round(size, 2), "fps": fps.group(1) if fps else None}


def audio_track() -> np.ndarray:
    tmp = RENDER / "_qa_audio.wav"
    subprocess.run(
        [str(FFMPEG_BIN), "-y", "-v", "error", "-i", str(FINAL), "-ac", "1", "-ar", str(SR), "-f", "wav", str(tmp)],
        check=True, capture_output=True,
    )
    with wave.open(str(tmp), "rb") as w:
        data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768.0
    tmp.unlink(missing_ok=True)
    return data


def rms_at(y: np.ndarray, t: float, win: float = 0.12) -> float:
    i = int(t * SR)
    seg = y[max(0, i - int(win * SR)): i + int(win * SR)]
    return float(np.sqrt(np.mean(seg ** 2))) if len(seg) else 0.0


def rms_baseline(y: np.ndarray, t: float, win: float = 0.35) -> float:
    i = int((t - 0.45) * SR)
    seg = y[max(0, i - int(win * SR)): max(1, i)]
    return float(np.sqrt(np.mean(seg ** 2))) if len(seg) else 0.0


def extract_frames(times: list[float]) -> list[Path]:
    out = []
    for t in times:
        p = RENDER / f"qa_{t:.1f}.jpg"
        subprocess.run(
            [str(FFMPEG_BIN), "-y", "-v", "error", "-ss", str(t), "-i", str(FINAL),
             "-frames:v", "1", "-q:v", "3", str(p)],
            check=True, capture_output=True,
        )
        out.append(p)
    return out


def main() -> None:
    design = json.loads(DESIGN.read_text(encoding="utf-8"))
    total = design["total_sec"]
    info = probe()
    print("== container ==")
    print(info)
    assert total - 1.0 <= info["dur"] <= total + 1.0, f"duration off: {info['dur']} vs design {total}"
    assert info["audio"], "no audio track"

    y = audio_track()
    print("== beat alignment (hits) ==")
    worst = 0.0
    for h in design["bgm"]["hits"]:
        t, g, kid = h["t"], h["gain"], h["id"]
        peak = rms_at(y, t)
        base = rms_baseline(y, t)
        ratio = peak / max(base, 1e-4)
        flag = "OK " if ratio > 1.25 or g < 0.6 else "LOW"
        if g >= 0.6:
            worst = max(worst, 0 if ratio > 1.25 else 1)
        print(f"  {t:7.2f}s  {kid:8s} gain={g:.2f}  peak={peak:.3f} base={base:.3f} x{ratio:4.2f} {flag}")
    print("worst:", "FAIL" if worst else "all strong hits spike")

    # 抽帧：hook 两帧 + 10 个事件窗口中点 + 收尾
    frames = extract_frames([
        0.4, 5.0,                       # hook 盖章 / 打码
        12.5, 20.8,                     # age18 / age22 上市
        30.6, 36.2,                     # age28 婚礼 / age30 首付
        47.0,                           # age35 闪崩
        63.6, 69.0,                     # age52 / age60 封板
        72.6, 78.8,                     # age61 退休 / age70 住院
        92.0, 96.5, 101.0,              # age78 清盘 / 幽灵蜡烛 / 收尾
    ])
    print("== frames ==")
    for p in frames:
        print(" ", p.name, p.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    sys.exit(main())
