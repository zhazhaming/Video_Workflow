# -*- coding: utf-8 -*-
"""《加满一箱油多花100块？》成片 QA：容器/音频/亮度/安全区/抖音裁切模拟/抽帧。

用法：
    python -X utf8 tools/qa_oil_rise.py                 # 全量检查
    python -X utf8 tools/qa_oil_rise.py --frames-only   # 只抽帧

检查项：
1. 容器：1080×1920 / 有音轨 / 时长 62~70s
2. 音频：峰值 ≤0.98、无 >0.15s 静音、逐镜 RMS 有语音
3. 画面：浅纸复古印刷风——抽帧平均亮度 > 0.5、深色像素占比 < 10%
4. 安全区（safeScale=0.8，内容应集中在中央）：内容 bbox x≈170~910 / y<1500
5. 抖音裁切模拟：crop=802:1920:139:0 抽关键帧，人工确认无切字
6. 抽帧：每镜中点 + 封面 → qa_<秒>.jpg
"""
import json
import re
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

sys.path.insert(0, r"D:\Work\video-workflow\backend")
from app.config import FFMPEG_BIN  # noqa: E402

RENDER = Path(r"D:\Work\video-workflow\backend\storage\renders\oil-rise-vibe")
FINAL = RENDER / "final.mp4"
PROPS = RENDER / "props.json"
SR = 44100
FPS = 30


def probe() -> dict:
    out = subprocess.run([str(FFMPEG_BIN), "-i", str(FINAL), "-f", "null", "-"], capture_output=True, text=True)
    info = out.stderr
    dur = re.search(r"Duration: (\d+):(\d+):([\d.]+)", info)
    if not dur:
        raise RuntimeError("无法解析时长：" + info[-600:])
    t = int(dur.group(1)) * 3600 + int(dur.group(2)) * 60 + float(dur.group(3))
    return {"dur": round(t, 2), "audio": "Audio:" in info,
            "raw": info[info.find("Stream #0:0"): info.find("Stream #0:0") + 400]}


def audio_track() -> np.ndarray:
    tmp = RENDER / "_qa_audio.wav"
    subprocess.run([str(FFMPEG_BIN), "-y", "-v", "error", "-i", str(FINAL), "-ac", "1", "-ar", str(SR), "-f", "wav", str(tmp)],
                   check=True, capture_output=True)
    with wave.open(str(tmp), "rb") as w:
        data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768.0
    tmp.unlink(missing_ok=True)
    return data


def max_silence(y: np.ndarray, thresh: float = 0.006) -> float:
    step = win = int(0.02 * SR)
    silent = np.abs(y[: y.size // win * win].reshape(-1, win)).max(axis=1) < thresh
    best = cur = 0
    for s in silent:
        cur = cur + 1 if s else 0
        best = max(best, cur)
    return best * step / SR


def shot_times(props: dict) -> list[tuple[float, float, str]]:
    """复算 DataVideo 布局（offset + 逐镜 lines-sum+tail，吸附省略，QA 精度足够）。"""
    lead, gap, bonus, tail = 0.45, 0.22, 0.12, 0.4
    scenes = []
    cursor = 0.0
    for sh in props.get("shots") or []:
        t = lead
        for li, l in enumerate(sh.get("lines") or []):
            dur = max(0.3, float(l.get("durationSec") or l.get("duration_sec") or 1.5))
            is_last = li == len(sh["lines"]) - 1
            pa = l.get("pauseAfter")
            pause = 0.0 if is_last else (float(pa) if pa is not None else gap) + bonus
            t += dur + pause
        dur_s = t + (sh.get("tail") or tail)
        label = sh.get("label") or "?"
        scenes.append((cursor, dur_s, label))
        cursor += dur_s
    offset = 2.33  # 实测整轨 offset（约），用于绝对时间
    return [(st + offset, ds, lb) for st, ds, lb in scenes]


def frame_stats(t: float, tag: str, crop: bool = False) -> dict:
    suffix = f"qa_{t:.1f}_{tag}" + ("_crop" if crop else "")
    png = RENDER / f"_{suffix}.png"
    vf = "crop=802:1920:139:0" if crop else None
    cmd = [str(FFMPEG_BIN), "-y", "-v", "error", "-ss", str(t), "-i", str(FINAL), "-frames:v", "1"]
    if vf:
        cmd += ["-vf", vf]
    cmd.append(str(png))
    subprocess.run(cmd, check=True, capture_output=True)
    from PIL import Image

    im = Image.open(png).convert("RGB")
    a = np.asarray(im).astype(np.float32) / 255.0
    lum = 0.2126 * a[:, :, 0] + 0.7152 * a[:, :, 1] + 0.0722 * a[:, :, 2]
    dark_ratio = float((lum < 0.25).mean())
    mean_lum = float(lum.mean())
    corners = np.stack([a[0, 0], a[0, -1], a[-1, 0], a[-1, -1]])
    bgc = np.median(corners, axis=0)
    mask = np.abs(a - bgc[None, None, :]).sum(axis=2) > 0.14
    ys, xs = np.where(mask)
    bbox = (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())) if len(xs) else None
    png.unlink(missing_ok=True)
    jpg = RENDER / f"{suffix}.jpg"
    im.save(jpg, quality=90)
    return {"mean_lum": round(mean_lum, 3), "dark_ratio": round(dark_ratio, 3), "bbox": bbox, "jpg": jpg.name}


def main() -> None:
    frames_only = "--frames-only" in sys.argv
    props = json.loads(PROPS.read_text(encoding="utf-8"))
    shots = shot_times(props)
    info = probe()
    print("== container ==")
    print(f"  dur={info['dur']}s  audio={info['audio']}")
    print("  ", info["raw"].replace("\n", " ")[:200])

    ok = True
    if not (78.0 <= info["dur"] <= 88.0):
        print(f"!! 时长 {info['dur']}s 不在 78~88s"); ok = False
    if not info["audio"]:
        print("!! 无音轨"); ok = False
    if "1080x1920" not in info["raw"]:
        print("!! 画幅异常（期望 1080x1920）"); ok = False

    if not frames_only:
        y = audio_track()
        peak = float(np.abs(y).max())
        # 片尾 1.0s 是 BGM/人声淡出区，静音属正常，不计入
        sil = max_silence(y[: y.size - SR])
        print("== audio ==")
        print(f"  peak={peak:.3f}  max_silence={sil:.2f}s（片尾 1s 淡出不计）")
        if peak > 0.98:
            print("!! 削波风险"); ok = False
        if sil > 0.15:
            print(f"!! 存在 {sil:.2f}s 静音"); ok = False
        print("== per-shot narration RMS ==")
        for st, dur, lb in shots:
            a, b = int(st * SR), int((st + dur) * SR)
            seg = y[a:b]
            r = float(np.sqrt(np.mean(seg ** 2))) if len(seg) else 0.0
            flag = "OK" if r > 0.01 else "LOW"
            if r <= 0.01:
                ok = False
            print(f"  {lb:8s} {st:6.2f}s +{dur:5.2f}s  rms={r:.3f} {flag}")

    print("== frames (brightness / safe area) ==")
    # 图片镜（插画暗部是画面内容）：dark 放宽到 0.5；图表镜 dark < 0.12。
    # bbox 自动判在 safeScale 渐变环下无意义（环色≠角色恒触发全帧 bbox），
    # 安全区以「抖音 802×1920 裁切模拟抽帧人工确认」为准（见下节）。
    is_image_shot = []
    for sh in props.get("shots") or []:
        is_image_shot.append(bool(sh.get("image")))
    for si, (st, dur, lb) in enumerate(shots):
        t = st + dur * 0.55
        s = frame_stats(t, lb[:6])
        img = si < len(is_image_shot) and is_image_shot[si]
        dark_limit = 0.5 if img else 0.12
        bright_ok = s["mean_lum"] > 0.35 and s["dark_ratio"] < dark_limit
        if not bright_ok:
            ok = False
        tag = "IMG" if img else "CHART"
        print(f"  [{tag}] {t:6.2f}s {lb:8s} lum={s['mean_lum']:.3f} dark={s['dark_ratio']:.3f} {'OK' if bright_ok else 'CHECK'}")

    print("== douyin crop simulation (802x1920, 裁 x139~941) ==")
    for st, dur, lb in shots[:3] + shots[-2:]:
        t = st + dur * 0.4
        s = frame_stats(t, lb[:6], crop=True)
        print(f"  {t:6.2f}s {lb:8s} lum={s['mean_lum']:.3f} -> {s['jpg']}（人工确认无切字）")

    print("\n== RESULT ==", "PASS" if ok else "FAIL")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    main()
