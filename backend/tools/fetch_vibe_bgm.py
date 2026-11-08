# -*- coding: utf-8 -*-
"""获取并处理「Vibe知识大赏」同款 BGM：《We Never (Remix)》0.9x。

目标：给 remotion-life-sim 渲染用的 90 秒 BGM
  - 44.1kHz 立体声 mp3，约 -18 LUFS（两遍 loudnorm）
  - 开头一刀切在 drop 起拍（无空白/报幕前奏），结尾 1.5s 淡出

来源与合规说明
--------------
曲目：We Never (Remix) 0.9x（抖音「vibe知识大赏」热门 BGM，别名
      「Claude 开智小曲 / vibe知识大赏の小曲」）
来源：B 站 BV1YMnM6aEFE  https://www.bilibili.com/video/BV1YMnM6aEFE/
      （UP 主 phonk小茶，标题「电子音乐 | vibe知识大赏の小曲 | We Never (Remix)」，
      上传 2026-10-18，时长 189.8s，音频流 30280 / AAC 238kbps 48kHz stereo）
备选：BV1mLWw6VEux（本次其媒体 CDN 反复超时，仅作备用）
用途：用户本人在抖音/站内发布视频的 BGM；**仅下载音轨用于剪辑**，不对外分发原曲。
授权：抖音站内热门 BGM，站内使用请遵循平台音乐授权范围；**站外/商用使用需自行确认
      版权方授权**，本脚本不声明该曲“无版权/可免费商用”。

处理步骤（可复现）
------------------
1. yt-dlp 下载 B 站音轨（30280 = 最佳纯音频流，m4a）。
2. ffmpeg 截取 17.45s 起 90.0s：该点是最响的 drop 起音（起音前 4 拍内 RMS 从
   -22dB 跳到 -4.8dB），切掉 0~17s 的铺垫/前奏，保证开头 0.05s 内就有声音。
3. loudnorm 两遍（第一遍测量，第二遍按测量值线性归一）到 -18 LUFS，真峰 -2 dBTP。
4. aresample 44.1k、保持立体声、结尾 1.5s 淡出（ffmpeg 最小构建无 afade，
   用 volume 的 t 表达式逐帧衰减），libmp3lame 192k 编码。
5. 用后台 beat.analyze() 测 BPM/节拍点（缓存重定向到临时文件，避免污染
   backend/storage/bgm_meta.json），写入 meta JSON。

用法：
    python backend/tools/fetch_vibe_bgm.py                # 下载 + 处理 + 写 meta
    python backend/tools/fetch_vibe_bgm.py --source X.m4a # 复用已下载的音源
    python backend/tools/fetch_vibe_bgm.py --skip-download --source X.m4a
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

PYTHON = Path(sys.executable)
FFMPEG = Path(
    os.getenv("FFMPEG_BIN")
    or r"D:\Work\remotion-life-sim\node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe"
)
FFMPEG = FFMPEG if FFMPEG.exists() else Path("ffmpeg")

ROOT = Path(r"D:\Work\video-workflow")
OUT_MP3 = Path(r"D:\Work\remotion-life-sim\public\bgm\vibe_we_never.mp3")
META_PATH = ROOT / "backend" / "storage" / "_vibe_bgm_meta.json"

SOURCE_URL = "https://www.bilibili.com/video/BV1YMnM6aEFE/"
FALLBACK_URLS = ["https://www.bilibili.com/video/BV1mLWw6VEux/"]
SOURCE_FORMAT = "30280"  # 最佳纯音频流（AAC 238k）
TMP_DIR = Path(tempfile.gettempdir()) / "vibe_bgm"

# 剪辑点：17.45s 是 drop 的第一个强起音（前 0.05s 内即起音），90s 长度落在 80~95s 区间
CUT_START = 17.45
CUT_DUR = 90.0
FADE_OUT = 1.5
TARGET_LUFS = -18.0
TARGET_TP = -2.0
TARGET_LRA = 11.0

TITLE = "We Never (Remix) 0.9x（vibe知识大赏の小曲 / Claude 开智小曲）"
ARTIST = "phonk小茶（B站搬运/remix 版本）"
LICENSE_NOTE = (
    "抖音「vibe知识大赏」热门 BGM；来源 B 站 BV1YMnM6aEFE（UP: phonk小茶）。"
    "仅下载音轨用于本机剪辑，不对外分发原曲。站内发布请遵循抖音音乐授权范围；"
    "站外/商用使用需自行向版权方确认授权，本文件不声明无版权或可免费商用。"
)


def run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    print("+", " ".join(str(c) for c in cmd[:6]), "..." if len(cmd) > 6 else "")
    return subprocess.run([str(c) for c in cmd], capture_output=True, text=True, encoding="utf-8", errors="replace", **kw)


def download(url: str, dest: Path) -> Path:
    """用 yt-dlp 只下音轨（不合成视频）。失败则尝试备选源。"""
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    for u in [url, *FALLBACK_URLS]:
        out = dest.with_suffix(".m4a")
        if out.exists() and out.stat().st_size > 100_000:
            print(f"[download] reuse {out}")
            return out
        r = run(
            [
                PYTHON, "-m", "yt_dlp",
                "--no-warnings", "--no-playlist",
                "--socket-timeout", "20", "--retries", "2", "--fragment-retries", "2",
                "--referer", "https://www.bilibili.com/",
                "-f", SOURCE_FORMAT,
                "-o", str(out),
                u,
            ]
        )
        if out.exists() and out.stat().st_size > 100_000:
            print(f"[download] ok {u} -> {out} ({out.stat().st_size} bytes)")
            return out
        print(f"[download] FAILED {u}: {(r.stderr or '').strip().splitlines()[-1:]}")
    raise SystemExit("所有源下载失败；请检查网络/换源（可先手动下载再用 --source）")


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
    """返回 ffmpeg loudnorm 的测量 JSON（第一遍）。"""
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
    """截取 → 1.5s 淡出 → loudnorm 两遍 → 44.1k 立体声 → mp3。返回测量值。

    注意：Remotion 自带的最小 ffmpeg 构建没有 afade 滤镜，淡出改用 volume 的
    eval=frame 时间表达式（t 为该输出帧时间）：t>=90-1.5 后线性降到 0。
    """
    dst_mp3.parent.mkdir(parents=True, exist_ok=True)
    tmp_wav = TMP_DIR / "trimmed.wav"
    fade_start = CUT_DUR - FADE_OUT
    fade_expr = (
        f"volume=volume='if(gte(t,{fade_start:.3f}),max(0,({CUT_DUR:.3f}-t)/{FADE_OUT:.3f}),1)':eval=frame"
    )
    # 1) 截取 + 淡出（先解码成 wav，方便两遍 loudnorm 复用同一段）
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

    # 2) 第一遍测量
    m = measure_loudness(tmp_wav)
    print("[loudnorm] measured:", {k: m.get(k) for k in ("input_i", "input_tp", "input_lra", "input_thresh", "target_offset")})

    # 3) 第二遍：按测量值线性归一 + mp3 编码
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
    """用 ffmpeg 解码成 16bit wav 再读成 array('h')（该构建没有 volumedetect/astats，自己算）。"""
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
        return {"peak_dbfs": -120.0, "rms_dbfs": -120.0, "max_sample": 0, "rms_sample": 0}
    mx = max(abs(min(samples)), abs(max(samples)))
    rms = math.sqrt(sum(s * s for s in samples) / n)
    return {
        "max_sample": int(mx),
        "rms_sample": int(rms),
        "peak_dbfs": round(20 * math.log10(mx / 32768.0 + 1e-12), 2),
        "rms_dbfs": round(20 * math.log10(rms / 32768.0 + 1e-12), 2),
    }


def volume_stats(path: Path) -> dict:
    """峰值/RMS（解码自算）+ 整体 LUFS/真峰（loudnorm 测量）。"""
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
    """用后台 beat.analyze() 测 BPM/节拍；缓存重定向到临时文件，不改 backend/storage/bgm_meta.json。"""
    sys.path.insert(0, str(ROOT / "backend"))
    from app.services import beat as beatmod  # noqa: E402

    beatmod.CACHE_PATH = TMP_DIR / "_beat_cache_tmp.json"
    info = beatmod.analyze(path)
    return {"bpm": float(info.get("bpm", 0.0)), "beats": [float(b) for b in info.get("beats", [])][:200]}


def sample_check(path: Path, seconds: float = 10.0) -> dict:
    """截 10s 小样确认有声音。"""
    sr, ch, samples = _decode_wav(path, seconds)
    st = _sample_stats(samples)
    st.update({"seconds": seconds, "sr": sr, "channels": ch})
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
        src = download(SOURCE_URL, TMP_DIR / "source.m4a")
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
        raise SystemExit("节拍分析失败（BPM=0），meta 不写")
    if not smp["ok"]:
        raise SystemExit(f"10s 小样静音，处理失败: {smp}")
    if not (80.0 <= out_dur <= 95.0):
        raise SystemExit(f"时长 {out_dur} 不在 80~95s")

    meta = {
        "source_url": SOURCE_URL,
        "title": TITLE,
        "artist_if_known": ARTIST,
        "license_note": LICENSE_NOTE,
        "duration_sec": round(out_dur, 2),
        "bpm": info["bpm"],
        "beats": info["beats"],
        "processed": True,
        "notes": (
            f"源：BV1YMnM6aEFE（{src_dur:.1f}s，AAC 30280 238k/48k stereo）；"
            f"剪辑区间 {CUT_START:.2f}s ~ {CUT_START + CUT_DUR:.2f}s（drop 起音对齐，切掉 17s 前奏）；"
            f"loudnorm 两遍 → 目标 {TARGET_LUFS:.0f} LUFS / TP {TARGET_TP:.0f} dBTP，"
            f"实测 integrated={stats.get('integrated_lufs')} LUFS, true_peak={stats.get('true_peak_db')} dBTP, "
            f"peak={stats.get('peak_dbfs')} dBFS, rms={stats.get('rms_dbfs')} dBFS；"
            f"44.1kHz 立体声 192k mp3，结尾 {FADE_OUT}s 淡出（volume 时间表达式，ffmpeg 最小构建无 afade）；"
            f"节拍用 backend/app/services/beat.py analyze() 实测。"
            f"10s 小样校验 peak={smp['peak_dbfs']} dBFS / rms={smp['rms_dbfs']} dBFS（有声音）。"
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
    print(f"[done] {META_PATH}")
    print(f"[stats] {json.dumps({k: v for k, v in stats.items()}, ensure_ascii=False)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
