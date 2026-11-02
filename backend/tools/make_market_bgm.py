# -*- coding: utf-8 -*-
"""《20 年，谁跑赢了？》卡点 BGM：选曲 + 精确重音。

基底：public/bgm/gold_race_bgm.mp3（120 BPM，项目内无版权合成曲，76.8s）
剪辑：取前 60.2s，在 6/19/25/31/37/43/49/55s 八个硬切点叠加 impact，
     在 19/31/43/55s 前 1.5s 叠 riser；6.7–18.3s 的图表事件点叠轻 tick。
输出：public/bgm/market_race_bgm.mp3
"""
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

sys.path.insert(0, r"D:\Work\video-workflow\backend")
from app.config import FFMPEG_BIN
from app.services import beat

SR = 44100
TOTAL = 60.2
BGM_DIR = Path(r"D:\Work\remotion-life-sim\public\bgm")
SFX_DIR = Path(r"D:\Work\remotion-life-sim\public\sfx")
SRC = BGM_DIR / "gold_race_bgm.mp3"
OUT_WAV = BGM_DIR / "_market_race_bgm.wav"
OUT_MP3 = BGM_DIR / "market_race_bgm.mp3"

HITS = [6.0, 19.0, 25.0, 31.0, 37.0, 43.0, 49.0, 55.0]
RISERS = [6.0, 19.0, 31.0, 43.0, 55.0]
TICKS = [7.1, 10.0, 12.1, 14.1]


def decode(path: Path) -> np.ndarray:
    tmp = BGM_DIR / "_decode.wav"
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
    if i >= len(buf):
        return
    n = min(len(sig), len(buf) - i)
    buf[i:i + n] += sig[:n] * gain


def tick(dur: float = 0.09, gain: float = 0.14) -> np.ndarray:
    n = int(SR * dur)
    t = np.arange(n) / SR
    env = np.exp(-t / 0.022)
    mono = (
        np.sin(2 * np.pi * 1568 * t) * 0.55
        + np.sin(2 * np.pi * 2637 * t) * 0.3
        + np.sin(2 * np.pi * 3920 * t) * 0.15
    ) * env
    return np.stack([mono * gain, mono * gain * 0.92], axis=1)


def main() -> None:
    base = decode(SRC)
    n = int(TOTAL * SR)
    mix = np.zeros((n, 2), dtype=np.float64)
    take = min(n, len(base))
    mix[:take] = base[:take]

    impacts = {name: decode(SFX_DIR / f"{name}.wav") for name in ("impact", "riser")}
    for t in HITS:
        strength = 0.62 if t not in (6.0, 55.0) else 0.78
        add(mix, impacts["impact"], t, strength)
    for t in RISERS:
        add(mix, impacts["riser"], max(0.0, t - 1.5), 0.34)
    for t in TICKS:
        add(mix, tick(), t, 1.0)

    # 尾部收束 + 软限幅
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

    meta = beat.analyze(OUT_MP3)
    print(f"wrote {OUT_MP3} | {TOTAL:.1f}s | bpm={meta['bpm']} | beats={len(meta['beats'])}")
    print("hits:", HITS)
    print("risers:", RISERS)
    print("ticks:", TICKS)


if __name__ == "__main__":
    main()
