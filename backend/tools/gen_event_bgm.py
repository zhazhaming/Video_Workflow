# -*- coding: utf-8 -*-
"""程序化事件卡点 BGM 生成（无版权，泛化自 gen_gold_race_bgm.py 的合成引擎）。

按 BPM 节拍网格生成鼓组/和声垫/贝斯/琶音的完整伴奏，并在指定秒数烘焙事件重音
（impact 重锤 + crash 镲；可指定 sub 下潜），重大事件前自动铺 riser 蓄力。
输出 mp3 + beats.json（节拍网格与事件表，直接填 props.bgm）。

用法:
    python tools/gen_event_bgm.py --out ashare_bgm --bpm 120 --bars 30 \
        [--events "12.5:1.0,27.0:0.8,44.5:1.2sub"] [--prog "Dm,Bb,F,C"] [--seed 2026]

事件格式 "秒:强度"（强度 0.4~1.3；后缀 sub = 底部事件用 subdrop 不锤）。
结构：bar0-1 intro 蓄势（无鼓）→ bar2..N-3 主段（能量随进度爬升）→ barN-2..N-1 outro 收束。
"""
import argparse
import json
import os
import subprocess
import sys
import wave

import numpy as np

SR = 44100


def note_freq(name: str) -> float:
    names = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5,
             "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    return 440.0 * (2 ** ((names[name[:-1]] + (int(name[-1]) - 4) * 12 - 9) / 12))


def make_kick(rng) -> np.ndarray:
    n = int(SR * 0.42)
    t = np.arange(n) / SR
    f = 42 + 110 * np.exp(-t / 0.032)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.15)
    nc = int(SR * 0.014)
    click = np.zeros(n)
    click[:nc] = rng.uniform(-1, 1, nc) * np.exp(-np.arange(nc) / (SR * 0.0035)) * 0.65
    return np.tanh((body + click) * 1.25)


def make_hat(rng, dur=0.055, decay=0.011) -> np.ndarray:
    n = int(SR * dur)
    hp = np.diff(rng.uniform(-1, 1, n), prepend=0.0)
    return hp * np.exp(-np.arange(n) / (SR * decay))


def make_snare(rng) -> np.ndarray:
    n = int(SR * 0.3)
    t = np.arange(n) / SR
    d = np.diff(rng.uniform(-1, 1, n), prepend=0.0)
    lp = np.convolve(d, np.ones(6) / 6, mode="same")
    body = np.sin(2 * np.pi * 196 * t) * np.exp(-t / 0.055)
    return lp * np.exp(-t / 0.085) * 0.85 + body * 0.45


def make_crash(rng, dur=1.3) -> np.ndarray:
    n = int(SR * dur)
    t = np.arange(n) / SR
    return np.diff(rng.uniform(-1, 1, n), prepend=0.0) * np.exp(-t / 0.3) * 0.6


def make_impact(rng, strength=1.0) -> np.ndarray:
    n = int(SR * 1.6)
    t = np.arange(n) / SR
    f = 30 + 92 * np.exp(-t / 0.05)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.34)
    lp = np.convolve(rng.uniform(-1, 1, n), np.ones(48) / 48, mode="same")
    boom = lp * np.exp(-t / 0.2) * 0.9
    ping = np.sin(2 * np.pi * 1568 * t) * np.exp(-t / 0.08) * 0.1
    return np.tanh((sub * 1.15 + boom + ping) * strength * 1.1)


def make_subdrop(dur=1.5) -> np.ndarray:
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = 26 + 52 * np.exp(-t / 0.12)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.5) * 0.9


def make_riser(rng, dur=2.0) -> np.ndarray:
    n = int(SR * dur)
    t = np.arange(n) / SR
    lp = np.convolve(rng.uniform(-1, 1, n), np.ones(20) / 20, mode="same")
    sweep = 170 * (2 ** ((t / dur) * 2.3))
    return (lp * 0.55 + np.sin(2 * np.pi * np.cumsum(sweep) / SR) * 0.45) * (t / dur) ** 2.4


def make_chime(freq: float, dur=1.6) -> np.ndarray:
    n = int(SR * dur)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for mult, a in [(1.0, 1.0), (2.76, 0.42), (5.40, 0.2), (8.93, 0.09)]:
        out += a * np.sin(2 * np.pi * freq * mult * t) * np.exp(-t / (0.55 / (mult ** 0.35)))
    return out * 0.32


def saw_note(freq: float, dur: float, amp=1.0, bright=1.0, detune=0.0045) -> np.ndarray:
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


def pluck(freq: float, amp=1.0) -> np.ndarray:
    n = int(SR * 0.34)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for mult, a in [(1, 1.0), (2, 0.5), (3, 0.28), (4, 0.14), (5, 0.07)]:
        out += a * np.sin(2 * np.pi * freq * mult * t)
    return out * np.minimum(t / 0.004, 1.0) * np.exp(-t / 0.09) * amp * 0.5


def bass_note(freq: float, dur=0.24, amp=1.0) -> np.ndarray:
    n = int(SR * dur)
    t = np.arange(n) / SR
    saw = saw_note(freq, dur, amp=0.55, bright=0.5)
    sub = np.sin(2 * np.pi * freq * 0.5 * t) * np.exp(-t / (dur * 1.4)) * 0.7
    att = np.minimum(t / 0.006, 1.0)
    rel = np.minimum((dur - t) / 0.03 + 0.6, 1.0)
    return np.tanh((saw * att * rel + sub * att) * amp)


CHORD_TONES = {
    "Dm": ["D3", "F3", "A3", "D4"], "Bb": ["A#2", "D3", "F3", "A#3"],
    "F": ["F3", "A3", "C4", "F4"], "C": ["C3", "E3", "G3", "C4"],
    "Am": ["A2", "C3", "E3", "A3"], "G": ["G2", "B2", "D3", "G3"],
    "Em": ["E3", "G3", "B3", "E4"], "F2m": ["F3", "G#3", "C4", "F4"],
}
ARP_NOTES = {
    "Dm": ["D4", "F4", "A4", "D5", "F5", "A5"], "Bb": ["A#3", "D4", "F4", "A#4", "D5", "F5"],
    "F": ["F4", "A4", "C5", "F5", "A5", "C6"], "C": ["C4", "E4", "G4", "C5", "E5", "G5"],
    "Am": ["A3", "C4", "E4", "A4", "C5", "E5"], "G": ["G3", "B3", "D4", "G4", "B4", "D5"],
    "Em": ["E4", "G4", "B4", "E5", "G5", "B5"], "F2m": ["F4", "G#4", "C5", "F5", "G#5", "C6"],
}


def main() -> int:
    ap = argparse.ArgumentParser(description="程序化事件卡点 BGM 生成")
    ap.add_argument("--out", required=True, help="输出名（public/bgm/<out>.mp3 / <out>.beats.json）")
    ap.add_argument("--bpm", type=float, default=110.0)
    ap.add_argument("--bars", type=int, default=30)
    ap.add_argument("--events", default="", help='"秒:强度[,秒:强度sub...]"，强度 0.4~1.3')
    ap.add_argument("--prog", default="Dm,Bb,F,C", help="和弦进行（每小节一个，循环）")
    ap.add_argument("--seed", type=int, default=2026)
    args = ap.parse_args()

    rng = np.random.default_rng(args.seed)
    beat = 60.0 / args.bpm
    bar = beat * 4
    n_bars = max(8, args.bars)
    total = n_bars * bar + 0.8
    n = int(SR * total)
    prog = [p.strip() for p in args.prog.split(",") if p.strip()]

    events = []
    for part in (args.events or "").split(","):
        part = part.strip()
        if not part:
            continue
        t_s, rest = (part.split(":", 1) + ["1.0"])[:2]
        kind = "sub" if rest.endswith("sub") else "hit"
        strength = float(rest[:-3] if kind == "sub" else rest)
        events.append((float(t_s), max(0.3, min(1.4, strength)), kind))
    events.sort()

    bed = np.zeros((n, 2))
    drum = np.zeros((n, 2))
    fx = np.zeros((n, 2))
    kick_times: list[float] = []

    def add(buf, sig, at, l=1.0, r=1.0):
        i = int(round(at * SR))
        if i < 0 or i >= n:
            return
        end = min(i + len(sig), n)
        buf[i:end, 0] += sig[: end - i] * l
        buf[i:end, 1] += sig[: end - i] * r

    KICK, HAT_C = make_kick(rng), make_hat(rng)
    HAT_O, SNARE = make_hat(rng, 0.2, 0.06), make_snare(rng)
    CRASH, SUBDROP = make_crash(rng), make_subdrop()
    RISER = make_riser(rng, 2.0)
    CHIMES = [make_chime(note_freq(nm)) for nm in ("D5", "F5", "A5", "D6")]

    # -- 808 sub：和弦根音低八度滑音长音（"激起感"的低频地毯） --
    def make_sub(freq, dur):
        n_ = int(SR * dur)
        t = np.arange(n_) / SR
        env = np.minimum(t / 0.015, 1.0) * (np.exp(-t * 1.4) + 0.3 * np.exp(-t * 0.45))
        env = np.minimum(env, 1.0)
        f = freq * (1 - 0.05 * np.minimum(t / dur, 1.0))  # 轻微下滑（808 特征）
        ph = 2 * np.pi * np.cumsum(f) / SR
        return np.tanh(np.sin(ph) * env * 1.5) * 0.85

    # -- 主旋律动机：Dm 五声，4 短句循环（A / A'+八度 / B / A''收束），
    #    32 拍可被哼出来的记忆点；(拍位, 音名, 强度) --
    MOTIF_A = [
        (0.0, "D4", 1.0), (2.0, "F4", 0.8), (2.5, "G4", 0.85),
        (4.0, "A4", 1.0), (6.0, "G4", 0.8), (7.0, "F4", 0.8),
        (8.0, "G4", 0.9), (10.0, "F4", 0.75), (10.5, "D4", 0.9),
        (12.0, "C4", 0.85), (14.0, "D4", 0.95),
    ]
    MOTIF_B = [
        (0.0, "F4", 0.9), (1.0, "G4", 0.9), (2.0, "A4", 1.0),
        (4.0, "C5", 1.0), (6.0, "A4", 0.85), (7.0, "G4", 0.8),
        (8.0, "A4", 0.95), (10.0, "G4", 0.8), (10.5, "F4", 0.85),
        (12.0, "E4", 0.8), (13.0, "G4", 0.85), (14.0, "A4", 1.0),
    ]

    def place_motif(buf, bar_idx, ch_root_freq):
        """在第 bar_idx 小节放当前短句的对应拍位音符。"""
        if bar_idx < 2:
            return
        body_i = bar_idx - 2
        phrase = (body_i // 4) % 4          # 0:A 1:A' 2:B 3:A''
        beat_in_phrase = (body_i % 4) * 4   # 4 拍/小节
        events = MOTIF_B if phrase == 2 else MOTIF_A
        oct_shift = 1 if phrase == 1 else 0
        lift = phrase == 3
        for (bt, nm, amp) in events:
            if int(bt) // 4 != body_i % 4:
                continue
            local = bt - (body_i % 4) * 4
            t_at = (bar_idx * 4 + local) * beat
            if t_at >= total - 0.6:
                continue
            f = note_freq(nm) * (2 ** oct_shift)
            if lift and local >= 14:
                f = note_freq("D5")
            vel = amp * (0.55 + 0.45 * energy_of(bar_idx)) * (1.08 if phrase == 3 else 1.0)
            add(buf, pluck(f, 0.2 + 0.22 * vel), t_at, 0.62, 0.78)
            if phrase == 3 and local == 0:
                add(buf, CHIMES[0], t_at, 0.3, 0.26)


    def chord_of(b: int) -> str:
        return prog[(b - 2) % len(prog)] if b >= 2 else prog[0]

    def energy_of(b: int) -> float:
        intro_ = b < 2
        outro_ = b >= n_bars - 2
        pos = min(1.0, max(0.0, (b - 2) / max(1, n_bars - 5)))
        return 0.0 if intro_ else (1.0 if outro_ else 0.45 + 0.55 * pos)

    def pad_chord(ch: str, amp: float) -> np.ndarray:
        dur = bar + 0.15
        tones = CHORD_TONES[ch]
        s = np.zeros(int(SR * dur))
        for i, nm in enumerate(tones):
            s += saw_note(note_freq(nm), dur, amp=0.8 - i * 0.06, bright=0.85)
        t = np.arange(len(s)) / SR
        att = np.minimum(t / 0.25, 1.0)
        rel = np.minimum((dur - t) / 0.4 + 0.5, 1.0)
        lfo = 0.9 + 0.1 * np.sin(2 * np.pi * 0.09 * t)
        return s * att * rel * lfo * amp / len(tones)

    for b in range(n_bars):
        t0 = b * bar
        intro = b < 2
        outro = b >= n_bars - 2
        ch = chord_of(b)
        body_bars = n_bars - 4  # 主段长度
        pos = min(1.0, max(0.0, (b - 2) / max(1, body_bars - 1)))  # 主段内进度
        energy = 0.0 if intro else (1.0 if outro else 0.45 + 0.55 * pos)

        # pad（全曲铺底）
        p = pad_chord(ch, 0.26 if not intro else 0.2)
        add(bed, p, t0, 0.95, 0.75)
        add(bed, p, t0 + 0.011, 0.7, 0.9)

        if intro:  # 蓄势：tick hats + 低 pad + sub 长音
            for i in range(8):
                add(drum, HAT_C, t0 + i * bar / 8, 0.14, 0.12)
            add(bed, make_sub(note_freq(CHORD_TONES[ch][0]) / 2, bar), t0, 0.8, 0.8)
            continue
        if outro:  # 收束：重音一记 + 钟琴 + sub（能量保持到最后）
            add(drum, KICK, t0, 0.9, 0.9)
            add(bed, make_sub(note_freq(CHORD_TONES[ch][0]) / 2, bar * 1.5), t0, 0.9, 0.9)
            for i, c in enumerate(CHIMES):
                add(bed, c, t0 + 0.5 + i * 0.5, 0.8, 0.7)
            continue

        # 鼓：四踩 kick（能量低时减半）+ 2/4 snare（后半段）+ hats
        beats = [0, 2] if energy < 0.6 else [0, 1, 2, 3]
        for bt in beats:
            tt = t0 + bt * beat
            add(drum, KICK, tt, 0.55 + 0.45 * energy, 0.55 + 0.45 * energy)
            kick_times.append(tt)
        if energy >= 0.6:
            for bt in (1, 3):
                add(drum, SNARE, t0 + bt * beat, 0.75, 0.68)
        steps = 4 if energy < 0.6 else (8 if energy < 0.9 else 16)
        for i in range(steps):
            tt = t0 + i * (bar / steps)
            openh = steps >= 8 and i % 4 == 2
            hv = 0.16 + 0.16 * energy
            add(drum, HAT_O if openh else HAT_C, tt, hv * 0.9, hv * 1.1)

        # 808 sub 长音（和弦根音低八度）
        add(bed, make_sub(note_freq(CHORD_TONES[ch][0]) / 2, bar * 1.05), t0, 0.95, 0.9)
        # 主旋律动机
        place_motif(bed, b, note_freq(CHORD_TONES[ch][0]))
        # bass 8 分
        root = CHORD_TONES[ch][0]
        for i in range(8):
            tt = t0 + i * (bar / 8)
            acc = 1.0 if i % 4 == 0 else 0.62
            add(bed, bass_note(note_freq(root) * 0.5, amp=(0.3 + 0.38 * energy) * acc), tt, 0.9, 0.85)

        # 琶音（能量高时 16 分）
        if energy >= 0.6:
            seq = ARP_NOTES[ch]
            steps_a = 8 if energy < 0.9 else 16
            pattern = [0, 2, 4, 5, 4, 2, 3, 5] if steps_a == 8 else [0, 2, 4, 5, 4, 2, 1, 2, 4, 5, 4, 2, 3, 5, 4, 2]
            for i in range(steps_a):
                tt = t0 + i * (bar / steps_a)
                nm = seq[pattern[i % len(pattern)] % len(seq)]
                pv = (0.1 + 0.14 * energy) * (1.0 if i % 4 == 0 else 0.72)
                pan = 0.55 if i % 2 == 0 else 0.8
                add(bed, pluck(note_freq(nm), pv), tt, pan, 1.35 - pan + 0.2)

        # 主段后 1/3 的每小节末尾 16 分军鼓滚奏（推向下一个能量台阶）
        if pos > 0.6:
            for i in range(8):
                tt = t0 + bar / 2 + i * (bar / 8)
                add(drum, SNARE, tt, 0.12 + i * 0.045, 0.12 * 0.9 + i * 0.04)

    # 事件重音 + 前置 riser
    for t, s, kind in events:
        if kind == "sub":
            add(fx, SUBDROP, t, 0.9, 0.9)
        else:
            add(fx, make_impact(rng, s), t, 1.0, 0.95)
            add(fx, CRASH, t, 0.5 * s, 0.42 * s)
    for t, s, kind in events:
        if kind != "sub" and s >= 0.85:
            add(fx, RISER, max(0.0, t - 2.0), 0.4, 0.38)

    # 侧链闪避 + 总线
    duck = np.zeros(n)
    for tk in kick_times:
        i0 = int(tk * SR)
        seg = np.exp(-np.arange(min(int(0.3 * SR), n - i0)) / (SR * 0.085))
        duck[i0: i0 + len(seg)] += seg
    duck = np.clip(duck, 0, 1)
    bed *= (1 - 0.4 * duck)[:, None]

    mix = bed + drum + fx
    mix = np.tanh(mix * 1.38) * 0.9
    peak = float(np.max(np.abs(mix)))
    if peak > 0:
        mix *= 0.9 / peak
    nf = int(0.03 * SR)
    mix[:nf] *= np.linspace(0, 1, nf)[:, None]
    nf2 = int(0.8 * SR)
    mix[-nf2:] *= np.linspace(1, 0, nf2)[:, None]

    here = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(here)
    try:
        from dotenv import load_dotenv

        load_dotenv(os.path.join(backend_dir, ".env"))
    except ImportError:
        pass
    remotion_dir = os.environ.get("REMOTION_DIR") or os.path.join(
        os.path.dirname(backend_dir), "remotion-engine"
    )
    out_dir = os.path.join(remotion_dir, "public", "bgm")
    os.makedirs(out_dir, exist_ok=True)
    wav_path = os.path.join(out_dir, args.out + ".wav")
    mp3_path = os.path.join(out_dir, args.out + ".mp3")
    pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
    with wave.open(wav_path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    ffmpeg = os.path.join(remotion_dir, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe")
    if os.path.exists(ffmpeg):
        subprocess.run([ffmpeg, "-y", "-v", "error", "-i", wav_path, "-codec:a", "libmp3lame", "-b:a", "192k", mp3_path], check=True)
        os.remove(wav_path)
    else:
        print("  [warn] 未找到 ffmpeg，保留 wav")

    beats = [round(k * beat, 3) for k in range(int(total / beat) + 1)]
    meta = {"out": f"bgm/{args.out}.mp3", "bpm": args.bpm, "beats": beats,
            "events": [{"t": t, "strength": s, "kind": k} for t, s, k in events],
            "duration": round(total, 3)}
    with open(os.path.join(out_dir, args.out + ".beats.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
    print(json.dumps({"out": meta["out"], "bpm": args.bpm, "duration": meta["duration"],
                      "n_beats": len(beats), "events": meta["events"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass
    sys.exit(main())
