# -*- coding: utf-8 -*-
"""获取并处理 Lenoxi《HOVE》作为曲库 BGM（用户点名曲）。

目标：给 remotion-engine 曲库加一首高能 funk 电子 BGM
  - 44.1kHz 立体声 mp3，约 -18 LUFS（两遍 loudnorm）
  - 开头一刀切在 drop 起拍（9.66s，切后 0.05s 内即起音），90s，结尾 1.5s 淡出
  - 覆盖「主段(10-56s) → 中段(56-76s) → build(76-90s) → 二段开头」完整能量弧线

来源与合规说明
--------------
曲目：Lenoxi - HOVE（同名单曲，约 2:13，电子/funk）
来源：YouTube 官方曲目 https://www.youtube.com/watch?v=doQwQ7VMoqQ （133s）
用途：用户本人在站内发布视频的 BGM；**仅下载音轨用于剪辑**，不对外分发原曲。
授权：非无版权曲目；**站外/商用发布需自行确认版权方授权**，
      本脚本不声明该曲"无版权/可免费商用"。

处理步骤（可复现，结构与 fetch_vibe_bgm.py 同构）
------------------
1. yt-dlp 下载音轨（bestaudio，webm/opus）。
2. ffmpeg 截取 9.66s 起 90.0s：drop 起音（10ms 窗 RMS 从 -27dB 在 9.67-9.78s
   爬升到 -5dB），切掉前奏与短 break，保证开头即入主段。
3. loudnorm 两遍（第一遍测量，第二遍线性归一）到 -18 LUFS，真峰 -2 dBTP。
4. aresample 44.1k、立体声、结尾 1.5s 淡出（remotion 最小 ffmpeg 无 afade，
   用 volume 的 eval=frame 时间表达式），libmp3lame 192k 编码。
5. backend/app/services/beat.py analyze() 测 BPM/节拍，
   写 remotion-engine/public/bgm/hove.beats.json（{audio,bpm,beats,n_beats}）。

用法：
    python backend/tools/fetch_hove_bgm.py                 # 下载 + 处理 + 写 beats/meta
    python backend/tools/fetch_hove_bgm.py --source X.webm # 复用已下载的音源
"""
from __future__ import annotations

import argparse
import array
import json
import math
import os
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(r"D:\Work\video-workflow")
load_dotenv(ROOT / "backend" / ".env")
sys.path.insert(0, str(ROOT / "backend"))

PYTHON = Path(sys.executable)
FFMPEG = Path(
    os.getenv("FFMPEG_BIN")
    or r"D:\Work\remotion-life-sim\node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe"
)
FFMPEG = FFMPEG if FFMPEG.exists() else Path("ffmpeg")

BGM_DIR = ROOT / "remotion-engine" / "public" / "bgm"
OUT_MP3 = BGM_DIR / "hove.mp3"
OUT_BEATS = BGM_DIR / "hove.beats.json"
META_PATH = ROOT / "backend" / "storage" / "_hove_bgm_meta.json"

SOURCE_URL = "https://www.youtube.com/watch?v=doQwQ7VMoqQ"
TMP_DIR = Path(tempfile.gettempdir()) / "hove_bgm"

# 9.66s：drop 起音前一刻（9.67s 起能量爬坡，9.78s 到峰），90s 覆盖完整能量弧线
CUT_START = 9.66
CUT_DUR = 90.0
FADE_OUT = 1.5
TARGET_LUFS = -18.0
TARGET_TP = -2.0
TARGET_LRA = 11.0

TITLE = "HOVE"
ARTIST = "Lenoxi"
LICENSE_NOTE = (
    "来源 YouTube 官方曲目 doQwQ7VMoqQ（Lenoxi - HOVE）。仅下载音轨用于本机剪辑，"
    "不对外分发原曲。发布视频请遵循平台音乐授权范围；站外/商用使用需自行向版权方"
    "确认授权，本文件不声明无版权或可免费商用。"
)


def run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    print("+", " ".join(str(c) for c in cmd[:6]), "..." if len(cmd) > 6 else "")
    return subprocess.run([str(c) for c in cmd], capture_output=True, text=True, encoding="utf-8", errors="replace", **kw)


def download(url: str, dest: Path) -> Path:
    """yt-dlp 只下音轨；已有缓存则复用。"""
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    out = TMP_DIR / "hove_source.webm"
    if out.exists() and out.stat().st_size > 100_000:
        print(f"[download] reuse {out}")
        return out
    r = run(
        [
            PYTHON, "-m", "yt_dlp",
            "--no-warnings", "--no-playlist",
            "--socket-timeout", "20", "--retries", "2",
            "-f", "bestaudio/ba",
            "-o", str(out),
            url,
        ]
    )
    if out.exists() and out.stat().st_size > 100_000:
        print(f"[download] ok -> {out} ({out.stat().st_size} bytes)")
        return out
    print(f"[download] FAILED: {(r.stderr or '').strip().splitlines()[-1:]}")
    raise SystemExit("下载失败；请检查网络或手动下载后用 --source")


def duration_of(path: Path) -> float:
    """没有 ffprobe，用 ffmpeg -i 解析 Duration。"""
    r = subprocess.run([str(FFMPEG), "-hide_banner", "-i", str(path)], capture_output=True, text=True, encoding="utf-8", errors="replace")
    for line in (r.stderr or "").splitlines():
        if "Duration:" in line:
            hms = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = hms.split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    raise SystemExit(f"无法解析时长: {path}")


def measure_loudness(src: Path, probe: bool = True) -> dict:
    af = (
        f"loudnorm=I={TARGET_LUFS}:TP={TARGET_TP}:LRA={TARGET_LRA}:print_format=json"
        if probe else f"loudnorm=I={TARGET_LUFS}:TP={TARGET_TP}:LRA={TARGET_LRA}"
    )
    r = subprocess.run(
        [str(FFMPEG), "-hide_banner", "-nostats", "-i", str(src), "-af", af, "-f", "null", "-"],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    txt = r.stderr or ""
    if probe:
        start = txt.rfind("{")
        end = txt.rfind("}")
        if start == -1 or end <= start:
            raise SystemExit(f"loudnorm 测量失败: {txt[-800:]}")
        return json.loads(txt[start : end + 1])
    return {"raw": txt}


def trim_norm_fade(src: Path, dst_mp3: Path) -> dict:
    """截取 → 1.5s 淡出 → loudnorm 两遍 → 44.1k 立体声 → mp3。"""
    dst_mp3.parent.mkdir(parents=True, exist_ok=True)
    tmp_wav = TMP_DIR / "trimmed.wav"
    fade_start = CUT_DUR - FADE_OUT
    fade_expr = (
        f"volume=volume='if(gte(t,{fade_start:.3f}),max(0,({CUT_DUR:.3f}-t)/{FADE_OUT:.3f}),1)':eval=frame"
    )
    r = run([
        FFMPEG, "-y", "-hide_banner", "-v", "error",
        "-i", src,
        "-af", f"atrim=start={CUT_START}:end={CUT_START + CUT_DUR},asetpts=PTS-STARTPTS,{fade_expr}",
        "-ac", "2", "-ar", "44100", "-c:a", "pcm_s16le", tmp_wav,
    ])
    if r.returncode != 0:
        raise SystemExit(f"截取失败: {r.stderr[-800:]}")
    if CUT_START + CUT_DUR > duration_of(src) + 0.5:
        raise SystemExit("剪切区间超出源时长")

    m = measure_loudness(tmp_wav)
    print("[loudnorm] measured:", {k: m.get(k) for k in ("input_i", "input_tp", "input_lra", "input_thresh", "target_offset")})

    af = (
        f"loudnorm=I={TARGET_LUFS}:TP={TARGET_TP}:LRA={TARGET_LRA}"
        f":measured_I={m['input_i']}:measured_TP={m['input_tp']}"
        f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}"
        f":offset={m['target_offset']}:linear=true"
        f",aresample=44100"
    )
    r = run([
        FFMPEG, "-y", "-hide_banner", "-v", "error",
        "-i", tmp_wav, "-af", af,
        "-ac", "2", "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "192k",
        dst_mp3,
    ])
    if r.returncode != 0:
        raise SystemExit(f"编码失败: {r.stderr[-800:]}")
    return m


def _decode_wav(path: Path, seconds: float | None = None) -> tuple[int, int, "array.array"]:
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    wav = TMP_DIR / "_decode_tmp.wav"
    cmd = [str(FFMPEG), "-y", "-hide_banner", "-v", "error"]
    if seconds is not None:
        cmd += ["-t", f"{seconds:.3f}"]
    cmd += ["-i", str(path), "-f", "wav", str(wav)]
    subprocess.run(cmd, check=True, capture_output=True)
    with wave.open(str(wav), "rb") as w:
        sr, ch = w.getframerate(), w.getnchannels()
        raw = w.readframes(w.getnframes())
    samples = array.array("h")
    samples.frombytes(raw)
    return sr, ch, samples


def _sample_stats(samples: "array.array") -> dict:
    n = len(samples)
    if not n:
        return {"peak_dbfs": -120.0, "rms_dbfs": -120.0}
    mx = max(abs(min(samples)), abs(max(samples)))
    rms = math.sqrt(sum(s * s for s in samples) / n)
    return {
        "peak_dbfs": round(20 * math.log10(mx / 32768.0 + 1e-12), 2),
        "rms_dbfs": round(20 * math.log10(rms / 32768.0 + 1e-12), 2),
    }


def volume_stats(path: Path) -> dict:
    sr, ch, samples = _decode_wav(path)
    out = _sample_stats(samples)
    out["duration_sec"] = round(len(samples) / (sr * ch), 2)
    out["sample_rate"] = sr
    out["channels"] = ch
    m = measure_loudness(path)
    out["integrated_lufs"] = float(m.get("input_i", 0))
    out["true_peak_db"] = float(m.get("input_tp", 0))
    return out


def analyze_beats(path: Path) -> dict:
    """beat.analyze() 实测 BPM/节拍；缓存重定向到临时文件，避免污染 storage/bgm_meta.json。"""
    from app.services import beat as beatmod

    beatmod.CACHE_PATH = TMP_DIR / "_beat_cache_tmp.json"
    info = beatmod.analyze(path)
    return {"bpm": float(info.get("bpm", 0.0)), "beats": [float(b) for b in info.get("beats", [])][:600]}


def sample_check(path: Path, seconds: float = 10.0) -> dict:
    sr, ch, samples = _decode_wav(path, seconds)
    st = _sample_stats(samples)
    st["ok"] = st["peak_dbfs"] > -40.0 and st["rms_dbfs"] > -60.0
    return st


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", type=Path, default=None, help="已下载的音源文件（离线复用）")
    ap.add_argument("--skip-download", action="store_true")
    ap.add_argument("--download-only", action="store_true")
    args = ap.parse_args()

    if not FFMPEG.exists():
        raise SystemExit(f"找不到 ffmpeg: {FFMPEG}")

    if args.skip_download and not (args.source and args.source.exists()):
        raise SystemExit("--skip-download 需要同时提供已存在的 --source")
    if args.source and args.source.exists():
        src = args.source
    else:
        src = download(SOURCE_URL, TMP_DIR / "hove_source.webm")
    src_dur = duration_of(src)
    print(f"[source] {src}  duration={src_dur:.2f}s")
    if args.download_only:
        return 0

    trim_norm_fade(src, OUT_MP3)
    stats = volume_stats(OUT_MP3)
    smp = sample_check(OUT_MP3)
    info = analyze_beats(OUT_MP3)
    out_dur = duration_of(OUT_MP3)

    if info["bpm"] <= 0 or not info["beats"]:
        raise SystemExit("节拍分析失败（BPM=0），beats.json 不写")
    if not smp["ok"]:
        raise SystemExit(f"10s 小样静音，处理失败: {smp}")
    if not (80.0 <= out_dur <= 95.0):
        raise SystemExit(f"时长 {out_dur} 不在 80~95s")

    OUT_BEATS.write_text(
        json.dumps(
            {
                "audio": str(OUT_MP3),
                "bpm": info["bpm"],
                "beats": [round(b, 3) for b in info["beats"]],
                "n_beats": len(info["beats"]),
            },
            ensure_ascii=False,
            indent=1,
        ),
        encoding="utf-8",
    )

    meta = {
        "source_url": SOURCE_URL,
        "title": TITLE,
        "artist_if_known": ARTIST,
        "license_note": LICENSE_NOTE,
        "duration_sec": round(out_dur, 2),
        "bpm": info["bpm"],
        "beats_json": str(OUT_BEATS),
        "processed": True,
        "notes": (
            f"源：YouTube doQwQ7VMoqQ（{src_dur:.1f}s，opus bestaudio）；"
            f"剪辑区间 {CUT_START:.2f}s ~ {CUT_START + CUT_DUR:.2f}s（drop 起音对齐，"
            f"覆盖 主段→中段→build→二段开头）；"
            f"loudnorm 两遍 → 目标 {TARGET_LUFS:.0f} LUFS / TP {TARGET_TP:.0f} dBTP，"
            f"实测 integrated={stats.get('integrated_lufs')} LUFS, true_peak={stats.get('true_peak_db')} dBTP, "
            f"peak={stats.get('peak_dbfs')} dBFS, rms={stats.get('rms_dbfs')} dBFS；"
            f"44.1kHz 立体声 192k mp3，结尾 {FADE_OUT}s 淡出；节拍实测。"
        ),
        "processing": {
            "cut_start_sec": CUT_START,
            "fade_out_sec": FADE_OUT,
            "target_lufs": TARGET_LUFS,
            "sample_rate": 44100,
            "channels": 2,
            "codec": "libmp3lame 192k",
        },
    }
    META_PATH.parent.mkdir(parents=True, exist_ok=True)
    META_PATH.write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"[done] {OUT_MP3}  dur={out_dur:.2f}s bpm={info['bpm']} beats={len(info['beats'])}")
    print(f"[done] {OUT_BEATS}")
    print(f"[done] {META_PATH}")
    print(f"[stats] {json.dumps(stats, ensure_ascii=False)}")
    return 0


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass
    raise SystemExit(main())
