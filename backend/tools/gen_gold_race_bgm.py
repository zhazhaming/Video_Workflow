# -*- coding: utf-8 -*-
"""《国际金价排行榜 1996-2026》专用卡点 BGM（程序化合成 · 无版权）。

BPM=120：拍=0.5s，小节=2s，1 小节=1 年。
结构（38 小节 = 76s + 0.8s 尾巴）：
  bar 0-2    片头：暗 pad + 老虎机式 hats + riser，6.0s 重击进竞速
  bar 3-33   竞速：1996+i 年 = bar 3+i；爆增/爆跌事件在小节线烘焙 impact
             bar15（2008 重击后）张力留白；bar22（2015 大底）静场下潜；
             bar28-33（2021-2026）全能量高潮；bar32（2025）全曲最强重音
  bar 34-37  片尾：领奖台重击 + 金色钟琴 + 收束
卡点表（秒，与 src/gold-race/data.ts 的 MUSIC_HITS 一致）：
  6, 26, 30, 36, 40, 44, 54, 62, 64, 66, 68, 74
输出：remotion-life-sim/public/bgm/gold_race_bgm.mp3
"""
import os
import subprocess
import wave

import numpy as np

SR = 44100
BPM = 120.0
BEAT = 60.0 / BPM          # 0.5s
BAR = BEAT * 4             # 2.0s
N_BARS = 38
TOTAL = N_BARS * BAR + 0.8
N = int(SR * TOTAL)

rng = np.random.default_rng(2026)

bed = np.zeros((N, 2))      # 侧链压制的旋律床（pad/bass/arp/stab/chime）
drum = np.zeros((N, 2))     # 鼓组
fx = np.zeros((N, 2))       # impact/riser/subdrop
kick_times: list[float] = []


def add(buf_, sig, at, l=1.0, r=1.0):
    i = int(round(at * SR))
    if i >= N:
        return
    end = min(i + len(sig), N)
    seg = sig[: end - i]
    buf_[i:end, 0] += seg * l
    buf_[i:end, 1] += seg * r


def note_freq(name: str) -> float:
    names = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5,
             "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    pitch = name[:-1]
    octave = int(name[-1])
    return 440.0 * (2 ** ((names[pitch] + (octave - 4) * 12 - 9) / 12))


# ---------------- 音色预生成 ----------------
def make_kick() -> np.ndarray:
    n = int(SR * 0.42)
    t = np.arange(n) / SR
    f = 42 + 110 * np.exp(-t / 0.032)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.15)
    nc = int(SR * 0.014)
    click = np.zeros(n)
    click[:nc] = rng.uniform(-1, 1, nc) * np.exp(-np.arange(nc) / (SR * 0.0035)) * 0.65
    return np.tanh((body + click) * 1.25)


def make_hat(dur=0.055, decay=0.011) -> np.ndarray:
    n = int(SR * dur)
    hp = np.diff(rng.uniform(-1, 1, n), prepend=0.0)
    return hp * np.exp(-np.arange(n) / (SR * decay))


def make_snare() -> np.ndarray:
    n = int(SR * 0.3)
    t = np.arange(n) / SR
    d = np.diff(rng.uniform(-1, 1, n), prepend=0.0)
    lp = np.convolve(d, np.ones(6) / 6, mode="same")
    body = np.sin(2 * np.pi * 196 * t) * np.exp(-t / 0.055)
    return lp * np.exp(-t / 0.085) * 0.85 + body * 0.45


def make_crash(dur=1.3) -> np.ndarray:
    n = int(SR * dur)
    t = np.arange(n) / SR
    d = np.diff(rng.uniform(-1, 1, n), prepend=0.0)
    return d * np.exp(-t / 0.3) * 0.6


def make_impact(strength=1.0) -> np.ndarray:
    n = int(SR * 1.6)
    t = np.arange(n) / SR
    f = 30 + 92 * np.exp(-t / 0.05)
    ph = 2 * np.pi * np.cumsum(f) / SR
    sub = np.sin(ph) * np.exp(-t / 0.34)
    lp = np.convolve(rng.uniform(-1, 1, n), np.ones(48) / 48, mode="same")
    boom = lp * np.exp(-t / 0.2) * 0.9
    ping = np.sin(2 * np.pi * 1568 * t) * np.exp(-t / 0.08) * 0.1
    return np.tanh((sub * 1.15 + boom + ping) * strength * 1.1)


def make_subdrop(dur=1.5) -> np.ndarray:
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = 26 + 52 * np.exp(-t / 0.12)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / 0.5) * 0.9


def make_riser(dur=2.0) -> np.ndarray:
    n = int(SR * dur)
    t = np.arange(n) / SR
    lp = np.convolve(rng.uniform(-1, 1, n), np.ones(20) / 20, mode="same")
    sweep = 170 * (2 ** ((t / dur) * 2.3))
    tone = np.sin(2 * np.pi * np.cumsum(sweep) / SR)
    return (lp * 0.55 + tone * 0.45) * (t / dur) ** 2.4


def make_chime(freq: float, dur=1.6) -> np.ndarray:
    n = int(SR * dur)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for mult, a in [(1.0, 1.0), (2.76, 0.42), (5.40, 0.2), (8.93, 0.09)]:
        out += a * np.sin(2 * np.pi * freq * mult * t) * np.exp(-t / (0.55 / (mult ** 0.35)))
    return out * 0.32


def saw_note(freq: float, dur: float, amp=1.0, bright=1.0, detune=0.0045) -> np.ndarray:
    """加性带限锯齿（三 voice 微失谐），谐波按频率自然滚降。"""
    n = int(SR * dur)
    t = np.arange(n) / SR
    out = np.zeros(n)
    kmax = max(8, min(36, int(16000 * bright / freq)))
    for v, d in enumerate((-detune, 0.0, detune)):
        fv = freq * (1 + d)
        for k in range(1, kmax + 1):
            if fv * k > 17500:
                break
            out += (1.0 / k) * np.sin(2 * np.pi * fv * k * t + v * 1.3 + k * 0.37)
    out /= 3 * max(1, kmax ** 0.5)
    att = np.minimum(t / 0.012, 1.0)
    rel = np.minimum((dur - t) / 0.06 + 1.0, 1.0)
    return out * att * rel * amp


PLUCK_CACHE: dict[str, np.ndarray] = {}


def pluck(name: str, amp=1.0) -> np.ndarray:
    """明亮的拨弦感琶音音色（带缓存）。"""
    key = f"{name}:{amp:.2f}"
    if key not in PLUCK_CACHE:
        freq = note_freq(name)
        n = int(SR * 0.34)
        t = np.arange(n) / SR
        out = np.zeros(n)
        for mult, a in [(1, 1.0), (2, 0.5), (3, 0.28), (4, 0.14), (5, 0.07)]:
            out += a * np.sin(2 * np.pi * freq * mult * t)
        att = np.minimum(t / 0.004, 1.0)
        out *= att * np.exp(-t / 0.09)
        PLUCK_CACHE[key] = out * amp * 0.5
    return PLUCK_CACHE[key]


BASS_CACHE: dict[str, np.ndarray] = {}


def bass_note(name: str, dur=0.24, amp=1.0) -> np.ndarray:
    key = f"{name}:{dur:.2f}:{amp:.2f}"
    if key not in BASS_CACHE:
        freq = note_freq(name)
        n = int(SR * dur)
        t = np.arange(n) / SR
        saw = saw_note(freq, dur, amp=0.55, bright=0.5)
        sub = np.sin(2 * np.pi * freq * 0.5 * t) * np.exp(-t / (dur * 1.4)) * 0.7
        att = np.minimum(t / 0.006, 1.0)
        rel = np.minimum((dur - t) / 0.03 + 0.6, 1.0)
        BASS_CACHE[key] = np.tanh((saw * att * rel + sub * att) * amp)
    return BASS_CACHE[key]


KICK = make_kick()
HAT_C = make_hat()
HAT_O = make_hat(dur=0.2, decay=0.06)
SNARE = make_snare()
CRASH = make_crash()
IMPACTS = {s: make_impact(s) for s in (0.45, 0.8, 0.9, 0.95, 1.0, 1.1, 1.25)}
SUBDROP = make_subdrop()
RISER = make_riser(2.0)
RISER_S = make_riser(1.0)
CHIME = {nm: make_chime(note_freq(nm)) for nm in ("D5", "F5", "A5", "D6", "C6")}

CHORDS: dict[str, list[str]] = {
    "Dm": ["D3", "F3", "A3", "D4"],
    "Bb": ["A#2", "D3", "F3", "A#3"],
    "F":  ["F3", "A3", "C4", "F4"],
    "C":  ["C3", "E3", "G3", "C4"],
    "A":  ["A2", "C#3", "E3", "A3"],
}
BASS_ROOT = {"Dm": "D2", "Bb": "A#1", "F": "F2", "C": "C2", "A": "A1"}
ARP_SCALE = {
    "Dm": ["D4", "F4", "A4", "D5", "F5", "A5"],
    "Bb": ["A#3", "D4", "F4", "A#4", "D5", "F5"],
    "F":  ["F4", "A4", "C5", "F5", "A5", "C6"],
    "C":  ["C4", "E4", "G4", "C5", "E5", "G5"],
    "A":  ["A3", "C#4", "E4", "A4", "C#5", "E5"],
}


def chord_at(bar: int) -> str:
    if bar == 33:
        return "A"
    if bar == 34:
        return "Dm"
    if bar == 35:
        return "Bb"
    if bar == 36:
        return "F"
    if bar == 37:
        return "Dm"
    prog = ["Dm", "Bb", "F", "C"]
    return prog[(bar - 3) % 4]


def phase_of(bar: int) -> str:
    """intro / A(1996-2005) / B(2006-2015) / C(2016-2020) / X(高潮 2021-2026) / outro"""
    if bar < 3:
        return "intro"
    if bar <= 12:
        return "A"
    if bar <= 22:
        return "B"
    if bar <= 30:
        return "C"
    if bar <= 33:
        return "X"
    return "outro"


PAD_AMP = {"intro": 0.3, "A": 0.22, "B": 0.26, "C": 0.28, "X": 0.3, "outro": 0.3}
PAD_CACHE: dict[tuple[str, float], np.ndarray] = {}


def pad_chord(chord: str, amp: float, oct_up=False, dark=False) -> np.ndarray:
    key = (chord, round(amp, 2) + (0.01 if oct_up else 0) + (0.02 if dark else 0))
    if key not in PAD_CACHE:
        dur = BAR + 0.15
        tones = CHORDS[chord]
        s = np.zeros(int(SR * dur))
        for i, nm in enumerate(tones):
            f = note_freq(nm)
            s += saw_note(f, dur, amp=0.8 - i * 0.06, bright=0.55 if dark else 0.85)
        if oct_up:
            for nm in tones:
                s += saw_note(note_freq(nm) * 2, dur, amp=0.28, bright=0.9)
        t = np.arange(len(s)) / SR
        att = np.minimum(t / 0.25, 1.0)
        rel = np.minimum((dur - t) / 0.4 + 0.5, 1.0)
        lfo = 0.9 + 0.1 * np.sin(2 * np.pi * 0.09 * t)
        PAD_CACHE[key] = s * att * rel * lfo * amp / len(tones)
    return PAD_CACHE[key]


# ---------------- 排布 ----------------
for b in range(N_BARS):
    t0 = b * BAR
    ph = phase_of(b)
    chord = chord_at(b)
    trough = b == 22          # 2015 大底：静场
    gap = b == 15             # 2008 重击后的张力留白
    gap_until = 30.75 - t0 if gap else 0.0  # bar 内秒数

    # ---- pad ----
    if not (gap and False):
        oct_up = b == 18
        dark = b in (15, 20, 22)
        p = pad_chord(chord, PAD_AMP[ph] * (0.7 if dark else 1.0), oct_up=oct_up, dark=dark)
        add(bed, p, t0, 0.95, 0.75)
        add(bed, p, t0 + 0.011, 0.7, 0.9)  # 哈斯展宽

    # ---- 鼓 ----
    if ph == "intro":
        for i in range(16):  # 老虎机式 16 分 tick
            tt = t0 + i * BEAT / 2 / 2
            ampv = 0.2 if i % 4 == 0 else 0.1
            add(drum, HAT_C, tt, ampv * 1.1, ampv * 0.9)
    elif b == 34:
        add(drum, KICK, t0, 0.9, 0.9)
    elif b < 34 and not trough:
        kv = {"A": 0.8, "B": 0.9, "C": 0.95, "X": 1.0}[ph]
        beats = [0, 1, 2, 3]
        if gap:
            beats = [3]
            add(drum, KICK, t0 + 0.75, 0.42, 0.42)  # 心跳
            add(drum, KICK, t0 + 1.25, 0.4, 0.4)
        if b in (31, 32, 33):
            beats = [0, 1, 1.5, 2, 3, 3.5]
        for bt in beats:
            tt = t0 + bt * BEAT
            if gap and tt < t0 + gap_until:
                continue
            add(drum, KICK, tt, kv, kv)
            kick_times.append(tt)

    # ---- bass ----
    if b <= 34 and not trough:
        ampv = {"A": 0.5, "B": 0.55, "C": 0.6, "X": 0.68, "outro": 0.3, "intro": 0.0}[ph]
        root = BASS_ROOT[chord]
        steps = 8
        if ph == "X":
            steps = 16
        for i in range(steps):
            tt = t0 + i * (BAR / steps)
            if gap and tt < t0 + gap_until:
                continue
            if b == 34 and i > 3:
                break
            acc = 1.0 if i % 4 == 0 else (0.75 if ph == "X" else 0.62)
            add(bed, bass_note(root, amp=ampv * acc), tt, 0.9, 0.85)

    # ---- hats ----
    if b <= 34 and not trough:
        steps = {"intro": 16, "A": 4, "B": 8, "C": 8, "X": 16, "outro": 0}[ph]
        for i in range(steps):
            tt = t0 + i * (BAR / steps)
            if gap and tt < t0 + gap_until:
                continue
            if ph == "A" and i % 2 == 0:
                continue  # 反拍
            openh = ph in ("B", "X") and i % 4 == 2
            hv = {"A": 0.18, "B": 0.24, "C": 0.28, "X": 0.3, "intro": 0.16}[ph]
            s = HAT_O if openh else HAT_C
            add(drum, s, tt, hv * 0.9, hv * 1.1)

    # ---- snare（2/4 拍）+ 军鼓滚奏 ----
    if ph in ("C", "X") and not trough:
        for bt in (1, 3):
            add(drum, SNARE, t0 + bt * BEAT, 0.8, 0.72)
    if b in (12, 14, 17, 26, 30, 31, 32, 33):
        for i in range(8):  # 后半小节 16 分滚奏渐强
            tt = t0 + BAR / 2 + i * (BAR / 8)
            ampv = 0.18 + i * 0.055
            add(drum, SNARE, tt, ampv, ampv * 0.9)

    # ---- arp ----
    if b >= 3 and b <= 33 and not trough:
        av = {"A": 0.11, "B": 0.16, "C": 0.2, "X": 0.24}[ph]
        seq = ARP_SCALE[chord]
        steps = 8 if ph == "A" else 16
        pattern = [0, 2, 4, 5, 4, 2, 3, 5] if steps == 8 else [0, 2, 4, 5, 4, 2, 1, 2, 4, 5, 4, 2, 3, 5, 4, 2]
        for i in range(steps):
            tt = t0 + i * (BAR / steps)
            if gap and tt < t0 + gap_until:
                continue
            nm = seq[pattern[i % len(pattern)] % len(seq)]
            pv = av * (1.0 if i % 4 == 0 else 0.72)
            pan = 0.55 if i % 2 == 0 else 0.8
            add(bed, pluck(nm, pv), tt, pan, 1.35 - pan + 0.2)

    # ---- stab（高潮每拍亮和弦）----
    if ph == "X":
        tones = CHORDS[chord]
        for bt in range(4):
            tt = t0 + bt * BEAT
            for j, nm in enumerate(tones):
                add(bed, pluck(nm, 0.09), tt, 0.7 if j % 2 else 1.0, 0.7 if j % 2 else 1.0)

    # ---- 片尾钟琴 ----
    if b == 34:
        for i, nm in enumerate(("D5", "F5", "A5", "D6")):
            add(bed, CHIME[nm], t0 + 0.5 + i * 0.5, 0.85, 0.75)
    if b == 36:
        add(bed, CHIME["C6"], t0 + 1.0, 0.7, 0.7)
    if b == 0:
        add(bed, CHIME["D5"], t0, 0.5, 0.5)

# ---------------- 卡点 FX（与 data.ts MUSIC_HITS 一致） ----------------
HITS = [
    (6.0, 1.0, True),   # 进竞速
    (26.0, 0.8, True),  # 2006 爆增
    (30.0, 1.05, True), # 2008 爆跌（重击 + crash）
    (36.0, 0.95, True), # 2011 冲顶
    (40.0, 0.9, True),  # 2013 崩盘
    (44.0, 0.45, False),# 2015 大底（sub 下潜）
    (54.0, 0.9, True),  # 2020
    (62.0, 0.95, True), # 2024
    (64.0, 1.25, True), # 2025 史诗暴涨（全曲最强）
    (66.0, 1.1, True),  # 2026
    (68.0, 1.0, True),  # 片尾领奖台
    (74.0, 0.45, False),# 收束
]
for t, s, crash in HITS:
    key = min(IMPACTS.keys(), key=lambda k: abs(k - s))
    add(fx, IMPACTS[key], t, 1.0, 0.95)
    if crash:
        add(fx, CRASH, t, 0.5 * s, 0.42 * s)
add(fx, SUBDROP, 44.0, 0.9, 0.9)
for t_end, dur in [(6.0, 2.0), (26.0, 2.0), (36.0, 2.0), (54.0, 2.0), (62.0, 2.0), (64.0, 1.0), (68.0, 2.0)]:
    add(fx, RISER if dur == 2.0 else RISER_S, t_end - dur, 0.4, 0.38)

# ---------------- 侧链 + 总线 ----------------
duck = np.zeros(N)
for tk in kick_times:
    i0 = int(tk * SR)
    seg = np.exp(-np.arange(min(int(0.3 * SR), N - i0)) / (SR * 0.085))
    duck[i0: i0 + len(seg)] += seg
duck = np.clip(duck, 0, 1)
depth = 0.4
duck_env = 1 - depth * duck
bed *= duck_env[:, None]

mix = bed + drum + fx
mix = np.tanh(mix * 1.2) * 0.82
peak = float(np.max(np.abs(mix)))
if peak > 0:
    mix *= 0.88 / peak
nf_in = int(0.03 * SR)
mix[:nf_in] *= np.linspace(0, 1, nf_in)[:, None]
nf_out = int(1.6 * SR)
mix[-nf_out:] *= np.linspace(1, 0, nf_out)[:, None]

# ---------------- 输出 ----------------
def write_wav(path: str, data: np.ndarray) -> None:
    pcm = (np.clip(data, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    remotion_dir = os.environ.get("REMOTION_DIR", r"D:\Work\remotion-life-sim")
    out_dir = os.path.join(remotion_dir, "public", "bgm")
    os.makedirs(out_dir, exist_ok=True)
    wav_path = os.path.join(out_dir, "gold_race_bgm.wav")
    mp3_path = os.path.join(out_dir, "gold_race_bgm.mp3")

    print("[gold-race-bgm] 合成中 ...", flush=True)
    write_wav(wav_path, mix)
    ffmpeg = os.path.join(
        remotion_dir, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe"
    )
    if os.path.exists(ffmpeg):
        subprocess.run(
            [ffmpeg, "-y", "-v", "error", "-i", wav_path,
             "-codec:a", "libmp3lame", "-b:a", "192k", mp3_path],
            check=True,
        )
        os.remove(wav_path)
    else:
        print("  [warn] 未找到 ffmpeg，保留 wav", flush=True)

    rms = float(np.sqrt(np.mean(mix ** 2)))
    print(f"  时长 {len(mix)/SR:.2f}s | peak {float(np.max(np.abs(mix))):.3f} | RMS {rms:.3f}")
    print(f"  卡点重音(秒): {[t for t, _, _ in HITS]}")


if __name__ == "__main__":
    main()
