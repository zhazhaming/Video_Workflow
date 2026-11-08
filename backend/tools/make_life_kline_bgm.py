# -*- coding: utf-8 -*-
"""《你的一生，就是一支K线》事件卡点 BGM。

基底：public/bgm/gold_race_bgm.mp3（120.2 BPM，项目内无版权合成曲）
重音：backend/storage/_life_kline_design.json 卡点表——
  - 9 个事件 impact（T1=0.72/暴跌+0.06/T2=0.55/age78 收官=1.0 全曲最强）+ 9 个镜切 impact
  - age30/35/60/78 前 1.5s riser；行军段每 5 岁轻 tick
输出：public/bgm/life_kline_bgm.mp3
"""
import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

sys.path.insert(0, r"D:\Work\video-workflow\backend")
from app.config import FFMPEG_BIN  # noqa: E402

SR = 44100
ROOT = Path(r"D:\Work\video-workflow\backend")
DESIGN = ROOT / "storage" / "_life_kline_design.json"
BGM_DIR = Path(r"D:\Work\remotion-life-sim\public\bgm")
SFX_DIR = Path(r"D:\Work\remotion-life-sim\public\sfx")
SRC = BGM_DIR / "gold_race_bgm.mp3"
OUT_WAV = BGM_DIR / "_life_kline_bgm.wav"
OUT_MP3 = BGM_DIR / "life_kline_bgm.mp3"


def decode(path: Path) -> np.ndarray:
    tmp = BGM_DIR / "_decode_tmp.wav"
    subprocess.run(
        [str(FFMPEG_BIN), "-y", "-v", "error", "-i", str(path),
         "-ac", "2", "-ar", str(SR), "-f", "wav", str(tmp)],
        check=True, capture_output=True,
    )
    with wave.open(str(tmp), "rb") as w:
        data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
        data = data.reshape(-1, 2).astype(np.float64) / 32768.0
    tmp.unlink(missing_ok=True)
    return data


def add(buf: np.ndarray, sig: np.ndarray, at: float, gain: float = 1.0) -> None:
    i = int(round(at * SR))
    if i < 0 or i >= len(buf):
        return
    n = min(len(sig), len(buf) - i)
    buf[i:i + n] += sig[:n] * gain


def tick(dur: float = 0.09) -> np.ndarray:
    n = int(SR * dur)
    t = np.arange(n) / SR
    env = np.exp(-t / 0.022)
    mono = (
        np.sin(2 * np.pi * 1568 * t) * 0.55
        + np.sin(2 * np.pi * 2637 * t) * 0.3
        + np.sin(2 * np.pi * 3920 * t) * 0.15
    ) * env
    return np.stack([mono, mono * 0.92], axis=1)


def main() -> None:
    design = json.loads(DESIGN.read_text(encoding="utf-8"))
    bgm_plan = design["bgm"]
    total = float(bgm_plan["total"])

    base = decode(SRC)
    n = int(total * SR)
    mix = np.zeros((n, 2), dtype=np.float64)
    take = min(n, len(base))
    # 音乐床压低（×0.55），给 impact 重音留出头位空间
    mix[:take] = base[:take] * 0.55

    impacts = {name: decode(SFX_DIR / f"{name}.wav") for name in ("impact", "riser")}
    for h in bgm_plan["hits"]:
        add(mix, impacts["impact"], float(h["t"]), float(h["gain"]))
    for r in bgm_plan["risers"]:
        add(mix, impacts["riser"], float(r["t"]), float(r["gain"]))
    for tk in bgm_plan["ticks"]:
        add(mix, tick(), float(tk["t"]), float(tk["gain"]))

    fade = int(1.1 * SR)
    mix[-fade:] *= np.linspace(1.0, 0.0, fade)[:, None]
    mix = np.tanh(mix * 1.06) * 0.9
    peak = float(np.max(np.abs(mix)))
    if peak > 0:
        mix *= 0.9 / peak

    pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(OUT_WAV), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    subprocess.run(
        [str(FFMPEG_BIN), "-y", "-v", "error", "-i", str(OUT_WAV),
         "-codec:a", "libmp3lame", "-b:a", "192k", str(OUT_MP3)],
        check=True,
    )
    OUT_WAV.unlink(missing_ok=True)

    hits = bgm_plan["hits"]
    print(f"wrote {OUT_MP3} | {total:.2f}s | hits={len(hits)} risers={len(bgm_plan['risers'])} ticks={len(bgm_plan['ticks'])}")
    print("top hits:", [(h["id"], h["t"], h["gain"]) for h in hits if h["gain"] >= 0.72])


if __name__ == "__main__":
    sys.exit(main())
