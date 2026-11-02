# -*- coding: utf-8 -*-
"""对比曲库候选 BGM：估计 BPM、节奏脉冲强度、能量曲线，为《金价排行榜》选曲。
输出各曲：时长 / BPM 置信度 / 打击感(谱通量尖峰密度) / 最佳 76s 窗口起点。
"""
import os
import subprocess

import numpy as np

FF = os.path.join(
    r"D:\Work\remotion-life-sim", "node_modules", "@remotion",
    "compositor-win32-x64-msvc", "ffmpeg.exe",
)
BGMDIR = r"D:\Work\remotion-life-sim\public\bgm"
TMP = r"D:\Work\video-workflow\.qa"
CANDS = ["llm_race_bgm", "auto_48ddb11c", "online_bgm", "BARRETE_3", "earth_birth_bgm"]
SR = 22050
WINDOW = 76.0


def decode(name: str) -> np.ndarray:
    os.makedirs(TMP, exist_ok=True)
    wav = os.path.join(TMP, f"_bgm_{name}.wav")
    subprocess.run(
        [FF, "-y", "-v", "error", "-i", os.path.join(BGMDIR, f"{name}.mp3"),
         "-ac", "1", "-ar", str(SR), "-acodec", "pcm_s16le", wav],
        check=True,
    )
    import wave
    with wave.open(wav, "rb") as w:
        d = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32767
    os.remove(wav)
    return d


def envelope(x: np.ndarray):
    """谱通量（onset strength），hop=512。"""
    hop, nfft = 512, 1024
    n = (len(x) - nfft) // hop
    win = np.hanning(nfft)
    prev = np.zeros(nfft // 2 + 1)
    flux = np.zeros(n)
    rms = np.zeros(n)
    for i in range(n):
        seg = x[i * hop: i * hop + nfft] * win
        spec = np.abs(np.fft.rfft(seg))
        flux[i] = np.sum(np.maximum(spec - prev, 0))
        prev = spec
        rms[i] = np.sqrt(np.mean(seg ** 2))
    if flux.max() > 0:
        flux /= flux.max()
    return flux, rms, hop / SR


def tempo_of(flux: np.ndarray, hop_s: float):
    f = flux - np.mean(flux)
    ac = np.correlate(f, f, "full")[len(f):]
    lags = np.arange(len(ac)) * hop_s
    mask = (lags >= 0.32) & (lags <= 1.1)  # 55~190 BPM
    best = np.argmax(ac[mask] * (1 - 0.25 * (lags[mask] - 0.5)))
    lag = lags[mask][best]
    bpm = 60.0 / lag
    while bpm < 70:
        bpm *= 2
    while bpm > 180:
        bpm /= 2
    strength = float(ac[mask][best] / (np.sum(f ** 2) + 1e-9) * 100)
    return bpm, strength


def punch_of(flux: np.ndarray):
    """打击感：谱通量尖峰（前 5% 分位以上）的平均密度/尖锐度。"""
    thr = np.quantile(flux, 0.97)
    peaks = flux[flux > thr]
    return float(np.mean(peaks)) if len(peaks) else 0.0


def best_window(rms: np.ndarray, hop_s: float) -> float:
    step = int(1.0 / hop_s)
    w = int(WINDOW / hop_s)
    if len(rms) <= w:
        return 0.0
    cs = np.concatenate([[0], np.cumsum(rms ** 2)])
    scores = (cs[w::step] - cs[:-w:step])[: len(rms) // step - w // step]
    k = int(np.argmax(scores))
    return float(k * step * hop_s)


for name in CANDS:
    try:
        x = decode(name)
    except Exception as e:
        print(f"{name}: DECODE FAIL {e}")
        continue
    flux, rms, hop_s = envelope(x)
    bpm, conf = tempo_of(flux, hop_s)
    punch = punch_of(flux)
    t0 = best_window(rms, hop_s)
    dyn = float(np.quantile(rms, 0.95) / (np.quantile(rms, 0.25) + 1e-9))
    print(
        f"{name:16s} 时长{len(x)/SR:6.1f}s | BPM≈{bpm:6.1f} (节拍感{conf:4.1f}) "
        f"| 打击感{punch:.3f} | 动态{dyn:4.1f} | 最佳76s窗起点 {t0:5.1f}s"
    )
