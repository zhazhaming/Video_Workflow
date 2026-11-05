# -*- coding: utf-8 -*-
"""程序化生成无版权 BGM（钢琴感琶音 + 氛围铺底），输出到 remotion public/bgm/。

生成的是可循环的纯合成曲：无版权风险、可随时用真实曲目替换。
用法：python tools/gen_bgm.py
"""
import math
import os
import struct
import subprocess
import sys
import wave

import numpy as np

SR = 44100


def note_freq(name: str) -> float:
    """音名 → 频率，如 'C4' 'F#3'。"""
    names = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6,
             "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    pitch, octave = name[:-1], int(name[-1])
    semitone = names[pitch] + (octave - 4) * 12
    return 440.0 * (2 ** ((semitone - 9) / 12))


def piano_tone(freq: float, dur: float, amp: float = 1.0) -> np.ndarray:
    """柔和的钢琴感单音：谐波叠加 + 指数衰减 + 轻微失谐。"""
    n = int(SR * dur)
    t = np.arange(n) / SR
    # 谐波幅度递减，稍带非谐性
    harmonics = [(1.0, 1.0), (2.0, 0.45), (3.0, 0.22), (4.0, 0.12), (5.0, 0.06), (6.0, 0.03)]
    out = np.zeros(n)
    for mult, a in harmonics:
        detune = 1.0 + (mult * 0.0004)  # 非谐性
        out += a * np.sin(2 * np.pi * freq * mult * detune * t)
    # 拨弦式包络：快速起音 + 指数衰减
    attack = np.minimum(t / 0.008, 1.0)
    decay = np.exp(-t / (0.55 + 0.15 * np.log1p(freq / 200)))
    out *= attack * decay * amp
    return out


def pad_chord(freqs: list[float], dur: float, amp: float = 0.25, phase_offset: float = 0.0) -> np.ndarray:
    """氛围铺底：多个正弦微失谐 + 慢起音慢释放 + 低频起伏。"""
    n = int(SR * dur)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for i, f in enumerate(freqs):
        for d in (-0.0012, 0.0, 0.0012):
            out += 0.33 * np.sin(2 * np.pi * f * (1 + d) * t + phase_offset + i * 0.7)
    # 慢起音 / 释放，加一点呼吸感
    attack = np.minimum(t / 2.0, 1.0)
    release = np.minimum((dur - t) / 2.0, 1.0)
    lfo = 0.85 + 0.15 * np.sin(2 * np.pi * 0.07 * t + phase_offset)
    return out * attack * release * lfo * amp / max(1, len(freqs))


def lowpass(x: np.ndarray, alpha: float = 0.25) -> np.ndarray:
    """一阶低通，柔化高频。"""
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += alpha * (x[i] - acc)
        y[i] = acc
    return y


def make_track(chords: list[list[str]], bpm: float, bars_per_chord: int, seed: int,
               style: str) -> np.ndarray:
    """按和弦进行生成一条曲子（和弦循环 2 轮）。"""
    rng = np.random.default_rng(seed)
    beat = 60.0 / bpm
    chord_dur = beat * 4 * bars_per_chord
    total = chord_dur * len(chords) * 2
    buf = np.zeros((int(SR * total) + 3 * SR, 2))

    def add(sig: np.ndarray, at: int, l: float, r: float) -> None:
        end = min(at + len(sig), len(buf))
        seg = sig[: end - at]
        buf[at:end, 0] += seg * l
        buf[at:end, 1] += seg * r

    t0 = 0.0
    for loop in range(2):
        for chord in chords:
            chord_freqs = [note_freq(n[:-1] + str(int(n[-1]) + 0)) for n in chord]  # 保持原八度
            # 铺底（更低的八度）
            pad_freqs = [note_freq(n[:-1] + str(int(n[-1]) - 1)) for n in chord]
            pad = pad_chord(pad_freqs, chord_dur + 2.0, amp=0.22, phase_offset=rng.uniform(0, 6))
            start = int(t0 * SR)
            add(pad, at=start, l=0.9, r=0.75)

            # 琶音（八分音符），上行/波浪排列
            step = beat / 2
            n_steps = int(chord_dur / step)
            pattern = [0, 1, 2, 3, 2, 1] if style != "tense" else [0, 2, 1, 2]
            for s in range(n_steps):
                note = chord_freqs[pattern[s % len(pattern)] % len(chord_freqs)]
                gain = (1.0 if s % 4 == 0 else 0.62) * (0.8 + 0.2 * rng.random())
                tone = piano_tone(note * 2, min(2.4, chord_dur / 2), amp=gain)
                at = int((t0 + s * step) * SR)
                add(tone, at=at, l=0.32, r=0.28)
            t0 += chord_dur

    # 柔化 + 轻微立体声宽度（Haas 效应）
    for c in range(2):
        buf[:, c] = lowpass(buf[:, c], 0.35)
    delay = int(0.008 * SR)
    right = np.roll(buf[:, 1], delay)
    right[:delay] = 0
    buf[:, 1] = 0.6 * buf[:, 1] + 0.4 * right

    # 归一化到 -6 dBFS 峰值
    peak = np.max(np.abs(buf)) or 1.0
    buf *= (10 ** (-6 / 20)) / peak
    # 首尾微淡入淡出 0.3s，避免循环爆音
    fade = int(0.3 * SR)
    ramp = np.linspace(0, 1, fade)[:, None]
    buf[:fade] *= ramp
    buf[-fade:] *= ramp[::-1]
    return buf


TRACKS = {
    "warm_piano": dict(
        chords=[["A3", "C4", "E4"], ["F3", "A3", "C4"], ["C4", "E4", "G4"], ["G3", "B3", "D4"]],
        bpm=66, bars_per_chord=1, seed=7, style="warm",
    ),
    "tense_pad": dict(
        chords=[["D3", "F3", "A3"], ["A#2", "D3", "F3"], ["G2", "A#2", "D3"], ["A2", "C#3", "E3"]],
        bpm=58, bars_per_chord=2, seed=11, style="tense",
    ),
    "uplifting": dict(
        chords=[["C4", "E4", "G4"], ["G3", "B3", "D4"], ["A3", "C4", "E4"], ["F3", "A3", "C4"]],
        bpm=82, bars_per_chord=1, seed=23, style="uplift",
    ),
}


def write_wav(path: str, data: np.ndarray) -> None:
    pcm = (np.clip(data, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main():
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    remotion_dir = os.environ.get("REMOTION_DIR", r"D:/work/Video_Workflow/remotion-engine")
    out_dir = os.path.join(remotion_dir, "public", "bgm")
    os.makedirs(out_dir, exist_ok=True)

    ffmpeg = os.path.join(
        remotion_dir, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe"
    )

    for name, cfg in TRACKS.items():
        print(f"[bgm] 生成 {name} ...", flush=True)
        data = make_track(**cfg)
        wav_path = os.path.join(out_dir, f"{name}.wav")
        write_wav(wav_path, data)
        mp3_path = os.path.join(out_dir, f"{name}.mp3")
        if os.path.exists(ffmpeg):
            subprocess.run(
                [ffmpeg, "-y", "-v", "error", "-i", wav_path, "-codec:a", "libmp3lame", "-b:a", "192k", mp3_path],
                check=True,
            )
            os.remove(wav_path)
        else:
            print("  [warn] 未找到 ffmpeg，保留 wav（Remotion 也支持 wav）")
        dur = len(data) / SR
        rms = float(np.sqrt(np.mean(data ** 2)))
        print(f"  时长 {dur:.1f}s | RMS {rms:.3f}", flush=True)


if __name__ == "__main__":
    main()
