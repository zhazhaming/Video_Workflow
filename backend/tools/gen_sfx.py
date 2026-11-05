# -*- coding: utf-8 -*-
"""程序化生成无版权转场音效，输出到 remotion public/sfx/。

用法：python tools/gen_sfx.py
"""
import os
import wave

import numpy as np

SR = 44100


def _env(n: int, attack: float, decay: float) -> np.ndarray:
    t = np.arange(n) / SR
    a = np.minimum(t / max(attack, 1e-4), 1.0)
    d = np.exp(-np.maximum(t - attack, 0) / max(decay, 1e-4))
    return a * d


def _norm(x: np.ndarray, peak: float = 0.85) -> np.ndarray:
    m = float(np.max(np.abs(x))) or 1.0
    return x * (peak / m)


def _stereo(mono: np.ndarray, width: float = 0.006) -> np.ndarray:
    delay = int(width * SR)
    right = np.roll(mono, delay)
    right[:delay] = 0
    out = np.stack([mono, 0.72 * mono + 0.28 * right], axis=1)
    return _norm(out)


def _onepole_lp(x: np.ndarray, alpha: float) -> np.ndarray:
    y = np.empty_like(x)
    acc = 0.0
    a = alpha
    for i in range(len(x)):
        acc += a * (x[i] - acc)
        y[i] = acc
    return y


def whoosh(duration: float = 0.55, seed: int = 3) -> np.ndarray:
    """噪声扫频：低频→高频再收住，做成"呼"的过场。"""
    rng = np.random.default_rng(seed)
    n = int(SR * duration)
    noise = rng.standard_normal(n)
    # 两段不同 alpha 的低通交叉淡化，模拟带宽先开后合
    low = _onepole_lp(noise, 0.08)
    high = _onepole_lp(noise, 0.42)
    t = np.linspace(0, 1, n)
    mix = np.clip((t - 0.15) / 0.7, 0, 1) ** 1.6
    band = low * (1 - mix) + (noise - low) * mix
    shape = np.sin(np.pi * np.clip(t / 0.92, 0, 1)) ** 2.2
    body = band * shape * 0.55
    # 低频冲击让转场更"实"
    thump = np.sin(2 * np.pi * (70 - 26 * t) * np.arange(n) / SR) * _env(n, 0.01, 0.18) * 0.35
    return _stereo(body + thump)


def impact(duration: float = 0.9, seed: int = 7) -> np.ndarray:
    """低沉冲击 + 短噪声，用于标题落版 / 强调闪白。"""
    rng = np.random.default_rng(seed)
    n = int(SR * duration)
    t = np.arange(n) / SR
    freq = 92 * np.exp(-t * 4.2) + 34
    phase = 2 * np.pi * np.cumsum(freq) / SR
    sub = np.sin(phase) * _env(n, 0.004, 0.22) * 0.9
    click = rng.standard_normal(n) * _env(n, 0.001, 0.03) * 0.22
    click = _onepole_lp(click, 0.5)
    return _stereo(_norm(sub + click, 0.8))


def riser(duration: float = 1.5, seed: int = 11) -> np.ndarray:
    """上行噪声，开场结尾把观众推到第一镜。"""
    rng = np.random.default_rng(seed)
    n = int(SR * duration)
    t = np.linspace(0, 1, n)
    noise = rng.standard_normal(n)
    # 用移动平均长度变化制造带宽上行感
    out = np.empty(n)
    acc = 0.0
    alpha = 0.02
    for i in range(n):
        a = 0.012 + 0.25 * (i / n) ** 2
        acc += a * (noise[i] - acc)
        out[i] = noise[i] - acc
    amp = (t ** 2.2) * np.clip((1 - t) / 0.12, 0, 1)
    sweep = np.sin(2 * np.pi * (180 + 900 * t**2) * np.arange(n) / SR) * 0.08
    return _stereo(_norm(out * amp * 0.5 + sweep * amp, 0.55))


def write(path: str, data: np.ndarray) -> None:
    pcm = (np.clip(data, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"[sfx] {os.path.basename(path)}  {len(data)/SR:.2f}s")


def main() -> None:
    remotion_dir = os.environ.get("REMOTION_DIR", r"D:/work/Video_Workflow/remotion-engine")
    out_dir = os.path.join(remotion_dir, "public", "sfx")
    os.makedirs(out_dir, exist_ok=True)
    write(os.path.join(out_dir, "whoosh.wav"), whoosh())
    write(os.path.join(out_dir, "impact.wav"), impact())
    write(os.path.join(out_dir, "riser.wav"), riser())


if __name__ == "__main__":
    main()
