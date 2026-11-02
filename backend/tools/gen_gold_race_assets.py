# -*- coding: utf-8 -*-
"""《国际金价排行榜》竖屏版资产生成器：
1. 从曲库 online_bgm（Inspire Action – Yuri Megis, CC BY 4.0）裁出最佳 76s 段 → public/bgm/gold_race_use.mp3
2. 提取真实节拍网格 → src/gold-race/beats.ts（含每个事件年吸附到最近节拍的音效帧）
3. edge-tts 生成 13 句事件配音（zh-CN-YunjianNeural）→ public/voice/gold-race/
   实测时长后防重叠排布 → src/gold-race/narration.ts
"""
import asyncio
import json
import os
import subprocess
import wave

import edge_tts
import numpy as np

try:
    import mutagen
except ImportError:
    os.system(f"{os.sys.executable} -m pip install mutagen --quiet")
    import mutagen
from mutagen.mp3 import MP3

SR = 22050
WINDOW = 78.0
NOMINAL_START = 8.0  # pick_gold_bgm.py 给出的最佳窗口起点

REMOTION = r"D:\Work\remotion-life-sim"
FF = os.path.join(REMOTION, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe")
BGM_SRC = os.path.join(REMOTION, "public", "bgm", "online_bgm.mp3")
BGM_OUT = os.path.join(REMOTION, "public", "bgm", "gold_race_use.mp3")
VOICE_DIR = os.path.join(REMOTION, "public", "voice", "gold-race")
TMP = r"D:\Work\video-workflow\.qa"
FPS = 30

# ---------------- 配音台本（对应事件） ----------------
# (文件名, 目标起始秒, 台词, 金色强调词, 超长时的备用短句)
LINES = [
    ("v00", 0.5, "一张榜单，带你看完黄金的三十年。", ["黄金的三十年"], None),
    ("v01", 8.0, "九十年代末，亚洲金融危机，金价连年走低。", ["亚洲金融危机"], None),
    ("v02", 16.0, "2001年，金价二次探底，255美元。", ["二次探底", "255美元"], None),
    ("v03", 26.0, "2006年，牛市正式启动。", ["牛市"], None),
    ("v04", 30.0, "2008年，雷曼倒闭，金价闪崩，随后V型反转。", ["闪崩", "V型反转"], None),
    ("v05", 36.0, "2011年，金价冲上1921美元。", ["1921美元"], None),
    ("v06", 40.0, "2013年，黄金大劫案，单日暴跌9%。", ["大劫案", "暴跌9%"], None),
    ("v07", 44.0, "2015年，1046美元，六年大底。", ["六年大底"], None),
    ("v08", 54.0, "2020年，疫情冲开2000美元。", ["2000美元"], None),
    ("v09", 58.0, "2022年，俄乌冲突，冲高回落。", ["冲高回落"], None),
    ("v10", 64.0, "2025年，史诗级暴涨，一年上涨70%。", ["史诗级暴涨", "70%"], None),
    ("v11", 68.4, "2026年初，金价突破5000美元大关。", ["5000美元"], None),
    ("v12", 72.9, "三十一年，整整十一倍。", ["十一倍"], "三十一年，十一倍。"),
]

# 事件卡点（秒）：竞速开始 + 爆增/爆跌年（与 data.ts 事件一致；2015 用低音量）
EVENTS = [
    (6.0, 0.55), (26.0, 0.5), (30.0, 0.6), (36.0, 0.55), (40.0, 0.55),
    (44.0, 0.3), (54.0, 0.5), (62.0, 0.5), (64.0, 0.65), (66.0, 0.6),
    (68.0, 0.5),
]


def decode_mono(path: str) -> np.ndarray:
    wav = os.path.join(TMP, "_gold_bgm_work.wav")
    subprocess.run(
        [FF, "-y", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR),
         "-acodec", "pcm_s16le", wav],
        check=True,
    )
    with wave.open(wav, "rb") as w:
        d = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32767
    os.remove(wav)
    return d


def onset_flux(x: np.ndarray):
    hop, nfft = 512, 1024
    n = (len(x) - nfft) // hop
    win = np.hanning(nfft)
    prev = np.zeros(nfft // 2 + 1)
    flux = np.zeros(n)
    for i in range(n):
        spec = np.abs(np.fft.rfft(x[i * hop: i * hop + nfft] * win))
        flux[i] = np.sum(np.maximum(spec - prev, 0))
        prev = spec
    if flux.max() > 0:
        flux /= flux.max()
    return flux, hop / SR


def beat_grid(x: np.ndarray, bpm_hint: float):
    """在 bpm_hint 附近搜 BPM 与相位，返回 (bpm, 相位秒, hop_s)。"""
    flux, hop_s = onset_flux(x)
    f = flux - flux.mean()
    best = (None, -1, None)
    for bpm in np.arange(bpm_hint - 6, bpm_hint + 6, 0.25):
        lag = 60.0 / bpm
        lag_n = int(round(lag / hop_s))
        if lag_n < 8:
            continue
        score = np.zeros(lag_n)
        for k in range(lag_n):
            score[k] = f[k::lag_n].sum()
        k0 = int(np.argmax(score))
        sc = float(score[k0] / (np.sqrt(np.sum(f ** 2)) + 1e-9))
        if sc > best[1]:
            best = (float(bpm), sc, k0 * hop_s)
    return best[0], best[2], hop_s


def decode_full(path: str) -> np.ndarray:
    """44.1k 立体声解码，返回 (N,2)。"""
    wav = os.path.join(TMP, "_gold_bgm_full.wav")
    subprocess.run(
        [FF, "-y", "-v", "error", "-i", path, "-ar", "44100", "-ac", "2",
         "-acodec", "pcm_s16le", wav],
        check=True,
    )
    with wave.open(wav, "rb") as w:
        d = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
    os.remove(wav)
    return d.reshape(-1, 2).astype(np.float64) / 32767


def main():
    os.makedirs(TMP, exist_ok=True)
    os.makedirs(VOICE_DIR, exist_ok=True)

    # ---------- 1) 裁剪 BGM（节拍分析用 22k 单声道，输出用 44.1k 立体声） ----------
    print("[bgm] 裁剪最佳窗口 ...", flush=True)
    x_mono = decode_mono(BGM_SRC)
    t0 = NOMINAL_START
    m0, m1 = int(t0 * SR), int(min((t0 + WINDOW + 1.2) * SR, len(x_mono)))
    bpm, phase, hop_s = beat_grid(x_mono[m0:m1], 123.0)
    print(f"  精估 BPM={bpm:.2f} 相位={phase:.3f}s", flush=True)

    full = decode_full(BGM_SRC)
    s0, s1 = int(t0 * 44100), int(min((t0 + WINDOW + 1.2) * 44100, len(full)))
    seg = full[s0:s1].copy()
    # 响度归一（RMS → -18 dB 附近）+ 峰值保护
    rms = float(np.sqrt(np.mean(seg ** 2)))
    seg *= 0.126 / max(rms, 1e-9)
    peak = float(np.max(np.abs(seg)))
    if peak > 0.92:
        seg *= 0.92 / peak
    nf_in = int(0.08 * 44100)
    seg[:nf_in] *= np.linspace(0, 1, nf_in)[:, None]
    nf_out = int(1.2 * 44100)
    seg[-nf_out:] *= np.linspace(1, 0, nf_out)[:, None]

    wav_tmp = os.path.join(TMP, "_gold_bgm_trim.wav")
    pcm = (np.clip(seg, -1, 1) * 32767).astype(np.int16)
    with wave.open(wav_tmp, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(44100)
        w.writeframes(pcm.tobytes())
    subprocess.run(
        [FF, "-y", "-v", "error", "-i", wav_tmp,
         "-ar", "44100", "-ac", "2", "-codec:a", "libmp3lame", "-b:a", "192k", BGM_OUT],
        check=True,
    )
    os.remove(wav_tmp)
    print(f"  → {BGM_OUT}", flush=True)

    # ---------- 2) 节拍网格 + 事件吸附 ----------
    beats = []
    t = float(phase)
    while t < WINDOW:
        beats.append(t)
        t += 60.0 / bpm
    sfx = []
    for ev_t, vol in EVENTS:
        if ev_t >= WINDOW:
            continue
        nearest = min(beats, key=lambda b: abs(b - ev_t))
        sfx.append({"frame": round(nearest * FPS), "vol": vol})
    beats_ts = (
        "// 由 backend/tools/gen_gold_race_assets.py 自动生成：gold_race_use.mp3 的真实节拍（帧）\n"
        f"export const BEATS: number[] = {json.dumps([round(b * FPS) for b in beats])};\n\n"
        "// 事件音效（已吸附到最近节拍）：impact.wav 的落帧与音量\n"
        f"export const EVENT_SFX: {{ frame: number; vol: number }}[] = {json.dumps(sfx)};\n"
    )
    with open(os.path.join(REMOTION, "src", "gold-race", "beats.ts"), "w", encoding="utf-8") as f:
        f.write(beats_ts)
    print(f"  节拍 {len(beats)} 个 | 事件音效吸附帧: {[s['frame'] for s in sfx]}", flush=True)

    # ---------- 3) 配音 ----------
    async def tts(name: str, text: str):
        out = os.path.join(VOICE_DIR, f"{name}.mp3")
        c = edge_tts.Communicate(text, "zh-CN-YunjianNeural", rate="+8%")
        await c.save(out)
        return out

    async def gen_all():
        outs = {}
        for name, _, text, _, alt in LINES:
            outs[name] = await tts(name, text)
            if alt:
                await tts(f"{name}_short", alt)
        return outs

    print("[voice] edge-tts 生成中 ...", flush=True)
    asyncio.run(gen_all())

    placed = []
    prev_end = 0.0
    report = []
    for name, target, text, hot, alt in LINES:
        f = os.path.join(VOICE_DIR, f"{name}.mp3")
        dur = MP3(f).info.length
        start = max(target, prev_end + 0.25)
        # 结尾越界则换短句
        if alt and start + dur > 76.9:
            fs = os.path.join(VOICE_DIR, f"{name}_short.mp3")
            dur_s = MP3(fs).info.length
            if start + dur_s <= 77.3:
                f, dur, text = fs, dur_s, alt
        start_f = round(start * FPS)
        placed.append({
            "file": f"voice/gold-race/{os.path.basename(f)}",
            "text": text,
            "hot": hot,
            "startFrame": start_f,
            "durFrames": int(round(dur * FPS)) + 6,
        })
        prev_end = start + dur
        flag = "" if abs(start - target) < 0.05 else f" (移位 {start - target:+.2f}s)"
        report.append(f"  {name} @{start:6.2f}s len {dur:4.2f}s{flag}  {text}")
    narr_ts = (
        "// 由 backend/tools/gen_gold_race_assets.py 自动生成：事件配音清单（实测时长、防重叠排布）\n"
        "export interface NarrationLine {\n  file: string;\n  text: string;\n  hot: string[];\n  startFrame: number;\n  durFrames: number;\n}\n\n"
        f"export const NARRATION: NarrationLine[] = {json.dumps(placed, ensure_ascii=False, indent=2)};\n"
    )
    with open(os.path.join(REMOTION, "src", "gold-race", "narration.ts"), "w", encoding="utf-8") as f:
        f.write(narr_ts)
    print("\n".join(report))
    print("[done] beats.ts / narration.ts 已生成")


if __name__ == "__main__":
    main()
