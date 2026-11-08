# -*- coding: utf-8 -*-
"""《两个账户·明亮账本版》BGM（同一合成引擎，按新 8 镜切点重烘焙）。

深色行情终端风：126 BPM 暗色电子 —— 4/4 底鼓 + sub 八分脉冲 + 反拍 hat + 暗pad，
终局段加 16 分琶音；按 8 镜新切点烘焙 impact / riser / hook 段数据 tick。
输出：public/bgm/terminal_780_bgm.mp3
"""
import math
import wave
from pathlib import Path

import numpy as np

sys_path = Path(r"D:\Work\video-workflow\backend")
import sys  # noqa: E402

sys.path.insert(0, str(sys_path))
from app.config import FFMPEG_BIN  # noqa: E402

SR = 44100
BPM = 126.0
BEAT = 60.0 / BPM  # 0.4762s
TOTAL = 60.2
BGM_DIR = Path(r"D:\Work\remotion-life-sim\public\bgm")
SFX_DIR = Path(r"D:\Work\remotion-life-sim\public\sfx")
OUT_WAV = BGM_DIR / "_two_accounts_bgm.wav"
OUT_MP3 = BGM_DIR / "two_accounts_bgm.mp3"

# 镜切点（与 director.json durationSec 对齐：6/13/19/26/32/38/44，终局 44-60）
CUTS = [7.0, 15.0, 21.5, 28.0, 34.5, 41.0, 47.5]
FINALE_SLAM = 49.5
RISERS = [15.0, 28.0, 34.5, 47.5]          # 前 1.5s 上扬
HOOK_TICKS = [1.5, 3.0, 4.5, 6.0]          # 钩子段数据喂送 tick

# 段落和弦根音（A 小调进行：Am-F-G-Am-F-C-G，终局 Am-G）
SECTIONS = [
    (7.0, 15.0, "A1"), (15.0, 21.5, "F1"), (21.5, 28.0, "G1"),
    (28.0, 34.5, "A1"), (34.5, 41.0, "F1"), (41.0, 47.5, "C2"),
    (49.5, 56.0, "A1"), (56.0, 58.0, "G1"),
]
NOTE = {"A1": 55.0, "F1": 43.65, "G1": 49.0, "C2": 65.41}
CHORD_TONES = {  # pad 用（音名: 频率）
    "A1": [220.0, 261.63, 329.63],      # A3 C4 E4
    "F1": [174.61, 220.0, 261.63],      # F3 A3 C4
    "G1": [196.0, 246.94, 293.66],      # G3 B3 D4
    "C2": [261.63, 329.63, 392.0],      # C4 E4 G4
}
ARP_TONES = {
    "A1": [440.0, 523.25, 659.26, 880.0],
    "G1": [392.0, 493.88, 587.33, 784.0],
}


def kick(t0: float, amp: float = 0.9) -> tuple[float, np.ndarray]:
    dur = 0.16
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = 42 + 130 * np.exp(-t / 0.025)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.055)
    click = np.random.default_rng(7).uniform(-1, 1, n) * np.exp(-t / 0.004) * 0.25
    return t0, (body + click) * amp


def sub_note(t0: float, freq: float, amp: float = 0.34) -> tuple[float, np.ndarray]:
    dur = BEAT * 0.46
    n = int(SR * dur)
    t = np.arange(n) / SR
    saw = 2 * ((freq * t) % 1.0) - 1.0
    # 一阶低通近似：滑动均值
    k = 24
    saw = np.convolve(saw, np.ones(k) / k, mode="same")
    env = np.minimum(t / 0.008, 1.0) * np.exp(-t / (dur * 0.7))
    return t0, saw * env * amp


def hat(t0: float, amp: float = 0.12) -> tuple[float, np.ndarray]:
    dur = 0.035
    n = int(SR * dur)
    t = np.arange(n) / SR
    rng = np.random.default_rng(int(t0 * 1000) % 9999)
    x = rng.uniform(-1, 1, n)
    x = np.diff(x, prepend=0.0)  # 高通
    return t0, x * np.exp(-t / 0.012) * amp


def pad_chord(t0: float, tones: list[float], dur: float, amp: float = 0.1) -> tuple[float, np.ndarray]:
    n = int(SR * dur)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for i, f in enumerate(tones):
        for d in (-0.0015, 0.0, 0.0015):
            out += 0.31 * np.sign(np.sin(2 * np.pi * f * (1 + d) * t + i)) * 0.4  # 软方波感
            out += 0.12 * np.sin(2 * np.pi * f * (1 + d) * t + i * 0.9)
    attack = np.minimum(t / 1.2, 1.0)
    release = np.minimum((dur - t) / 1.0, 1.0)
    lfo = 0.88 + 0.12 * np.sin(2 * np.pi * 0.09 * t + i)
    # 低通
    k = 12
    out = np.convolve(out, np.ones(k) / k, mode="same")
    return t0, out * attack * release * lfo * amp


def arp_note(t0: float, freq: float, amp: float = 0.09) -> tuple[float, np.ndarray]:
    dur = 0.14
    n = int(SR * dur)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2 * t)
    return t0, x * np.exp(-t / 0.05) * amp


def tick(t0: float, amp: float = 0.14) -> tuple[float, np.ndarray]:
    dur = 0.05
    n = int(SR * dur)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 2100 * t) * np.exp(-t / 0.008)
    return t0, x * amp


def load_sfx(path: Path) -> np.ndarray:
    import wave as _w
    with _w.open(str(path), "rb") as f:
        n = f.getnframes()
        ch = f.getnchannels()
        sw = f.getsampwidth()
        raw = f.readframes(n)
    if sw == 2:
        x = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768
    else:
        raise RuntimeError(f"unsupported sfx sample width {sw}")
    return x.reshape(-1, ch).mean(axis=1)


def mix_into(buf: np.ndarray, t0: float, x: np.ndarray, gain: float = 1.0) -> None:
    i = int(t0 * SR)
    j = min(len(buf), i + len(x))
    if i < 0 or j <= i:
        return
    buf[i:j] += x[: j - i] * gain


def main() -> None:
    total_n = int(SR * TOTAL)
    buf = np.zeros(total_n)

    # 1) pad：钩子段(0-6) Am 长铺底 + 各段落
    mix_into(buf, 0.0, pad_chord(0.0, CHORD_TONES["A1"], 7.4, amp=0.115)[1])
    for a, b, root in SECTIONS:
        mix_into(buf, a, pad_chord(a, CHORD_TONES[root], b - a + 0.3, amp=0.1)[1])
    mix_into(buf, 47.5, pad_chord(47.5, CHORD_TONES["A1"], 2.2, amp=0.13)[1])  # breakdown

    # 2) 底鼓 4/4：7s 起，48-50 breakdown 停两拍，57.5 停
    t = 7.0
    while t < 57.5:
        if not (47.5 <= t < 49.7):
            mix_into(buf, *kick(t, amp=0.88 if t < 44 else 0.95))
        t += BEAT

    # 3) sub 八分脉冲（各段根音），钩子段只有 0-7 的稀疏 A1
    t = 0.0
    while t < 6.6:
        mix_into(buf, *sub_note(t, 55.0, amp=0.22))
        t += BEAT
    for a, b, root in SECTIONS:
        t = a
        while t < b - 0.05:
            mix_into(buf, *sub_note(t, NOTE[root], amp=0.32))
            t += BEAT / 2
    t = 46.0
    while t < 57.5:
        mix_into(buf, *sub_note(t, 55.0 if t < 52 else 49.0, amp=0.34))
        t += BEAT / 2

    # 4) 反拍 hat：7s 起
    t = 7.0 + BEAT / 2
    while t < 57.5:
        amp = 0.09 if t < 15 else 0.13
        if not (47.5 <= t < 49.5):
            mix_into(buf, *hat(t, amp=amp))
        t += BEAT

    # 5) 终局琶音（50-57.5）
    t = 49.5
    step = 0
    while t < 57.5:
        tones = ARP_TONES["A1"] if t < 52 else ARP_TONES["G1"]
        mix_into(buf, *arp_note(t, tones[step % 4], amp=0.1))
        step += 1
        t += BEAT / 4

    # 6) hook 段数据 tick
    for tt in HOOK_TICKS:
        mix_into(buf, *tick(tt, amp=0.13))

    # 7) riser（切点前 1.5s）与 impact（切点 + 终局 slam）
    riser = load_sfx(SFX_DIR / "riser.wav")
    impact = load_sfx(SFX_DIR / "impact.wav")
    for c in RISERS:
        mix_into(buf, c - 1.5, riser, gain=0.4)
    for c in CUTS:
        mix_into(buf, c, impact, gain=0.6 if c != 44.0 else 0.72)
    mix_into(buf, FINALE_SLAM, impact, gain=0.85)

    # 8) 母带：tanh 软限幅 → 归一化 → 尾部淡出
    buf = np.tanh(buf * 1.25)
    peak = np.max(np.abs(buf))
    buf = buf / peak * 0.92
    fade = int(SR * 1.3)
    buf[-fade:] *= np.linspace(1, 0, fade)

    # 写 WAV → ffmpeg 转 MP3
    pcm = (buf * 32767).astype(np.int16)
    with wave.open(str(OUT_WAV), "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(pcm.tobytes())
    import subprocess
    subprocess.run(
        [FFMPEG_BIN, "-y", "-loglevel", "error", "-i", str(OUT_WAV),
         "-codec:a", "libmp3lame", "-b:a", "192k", str(OUT_MP3)],
        check=True,
    )
    OUT_WAV.unlink(missing_ok=True)
    print(f"written: {OUT_MP3}  ({TOTAL}s @ {BPM} BPM, cuts={CUTS}+slam@{FINALE_SLAM})")


if __name__ == "__main__":
    main()
