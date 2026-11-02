# -*- coding: utf-8 -*-
"""节拍检测：解码 BGM，估计 BPM 与节拍时间点，用于卡点切镜。

方法：短时傅里叶谱通量（spectral flux）得到 onset 包络 →
自相关估计节拍周期 → 相位搜索对齐第一拍。结果按文件 mtime 缓存。
"""
import json
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np

from ..config import FFMPEG_BIN, STORAGE_DIR

HOP = 512
WIN = 1024
CACHE_PATH = STORAGE_DIR / "bgm_meta.json"


def _decode(path: Path, max_seconds: float) -> tuple[np.ndarray, int]:
    """用 ffmpeg 解码成单声道 44.1k 浮点样本。"""
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_path = Path(tmp.name)
    try:
        subprocess.run(
            [
                str(FFMPEG_BIN),
                "-y",
                "-v",
                "error",
                "-t",
                f"{max_seconds:.0f}",
                "-i",
                str(path),
                "-ac",
                "1",
                "-ar",
                "44100",
                "-f",
                "wav",
                str(tmp_path),
            ],
            capture_output=True,
            timeout=120,
            check=True,
        )
        with wave.open(str(tmp_path), "rb") as w:
            sr = w.getframerate()
            data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
        return data.astype(np.float32) / 32768.0, sr
    finally:
        tmp_path.unlink(missing_ok=True)


def _onset_envelope(samples: np.ndarray) -> np.ndarray:
    n = 1 + max(0, (len(samples) - WIN) // HOP)
    if n < 8:
        return np.zeros(0)
    window = np.hanning(WIN).astype(np.float32)
    prev = None
    flux = np.zeros(n, dtype=np.float32)
    for i in range(n):
        seg = samples[i * HOP : i * HOP + WIN] * window
        mag = np.abs(np.fft.rfft(seg))
        if prev is not None:
            flux[i] = float(np.maximum(mag - prev, 0).sum())
        prev = mag
    flux -= flux.mean()
    np.maximum(flux, 0, out=flux)
    peak = flux.max()
    if peak <= 1e-8:
        return np.zeros(0)
    return flux / peak


def _detect(samples: np.ndarray, sr: int) -> tuple[float, list[float]]:
    flux = _onset_envelope(samples)
    if len(flux) < 16:
        return 0.0, []
    hop_s = HOP / sr
    ac = np.correlate(flux, flux, "full")[len(flux) - 1 :]
    ac /= ac[0] if ac[0] > 0 else 1.0

    lag_min = max(2, int(60 / 180 / hop_s))
    lag_max = min(int(60 / 60 / hop_s), len(ac) - 1)
    if lag_max <= lag_min:
        return 0.0, []

    # 自相关 × 节拍先验（避免把 8 分音符当成 2 倍速、或把二分音符当选错拍）
    lags = np.arange(lag_min, lag_max + 1)
    bpms = 60.0 / (lags * hop_s)
    prior = np.exp(-0.5 * (np.log2(bpms / 110.0) / 0.65) ** 2)
    scores = ac[lags] * prior
    best_lag = int(lags[int(np.argmax(scores))])

    # 相位搜索：让节拍点落在 onset 能量最强的位置
    best_off, best_score = 0, -1.0
    for off in range(best_lag):
        score = float(flux[off::best_lag].sum())
        if score > best_score:
            best_score, best_off = score, off

    lag_s = best_lag * hop_s
    bpm = 60.0 / lag_s
    duration = len(samples) / sr
    beats: list[float] = []
    t = best_off * hop_s
    while t < duration:
        beats.append(round(t, 3))
        t += lag_s
    return round(bpm, 1), beats


def analyze(path: Path, max_seconds: float = 240.0) -> dict:
    """返回 {"bpm": float, "beats": [秒...]}，按文件 mtime 缓存。"""
    if not path.exists() or not FFMPEG_BIN.exists():
        return {"bpm": 0.0, "beats": []}
    try:
        mtime = path.stat().st_mtime
        cache = _load_cache()
        hit = cache.get(path.name)
        if hit and abs(float(hit.get("mtime", 0)) - mtime) < 1.0:
            return {"bpm": float(hit.get("bpm", 0.0)), "beats": list(hit.get("beats", []))}
        samples, sr = _decode(path, max_seconds)
        bpm, beats = _detect(samples, sr)
        cache[path.name] = {"mtime": mtime, "bpm": bpm, "beats": beats}
        _save_cache(cache)
        return {"bpm": bpm, "beats": beats}
    except Exception:  # noqa: BLE001 — 分析失败不影响渲染
        return {"bpm": 0.0, "beats": []}


def _load_cache() -> dict:
    if not CACHE_PATH.exists():
        return {}
    try:
        return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def _save_cache(cache: dict) -> None:
    try:
        CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
    except OSError:
        pass
