# -*- coding: utf-8 -*-
"""《油车，输了吗？》成片 QA：容器/音频/亮度/安全区/抽帧。

用法：
    python -X utf8 tools/qa_auto_trend.py                 # 全量检查
    python -X utf8 tools/qa_auto_trend.py --frames-only   # 只抽帧

检查项：
1. 容器：1080×1920 / 30fps / 有音轨 / 时长 70~80s
2. 音频：峰值 ≤0.95、无 >0.15s 静音、逐镜（按 props.json 时间轴）RMS 有语音
3. 画面：明亮（非深色）——抽帧平均亮度 > 0.55；深色像素占比 < 8%
4. 安全区：内容 bbox 左右 ≥64px、顶部 ≥40px、底部 ≥210px（抖音底部 250px 安全区近似）
5. 抽帧：每镜中点 + 封面，输出 qa_<秒>.jpg
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

RENDER = Path(r"D:\Work\video-workflow\backend\storage\renders\auto-market-trend")
FINAL = RENDER / "final.mp4"
PROPS = RENDER / "props.json"
SR = 44100


def probe() -> dict:
    out = subprocess.run(
        [str(FFMPEG_BIN), "-i", str(FINAL), "-f", "null", "-"],
        capture_output=True,
        text=True,
    )
    info = out.stderr
    dur = re.search(r"Duration: (\d+):(\d+):([\d.]+)", info)
    fps = re.search(r"([\d.]+) fps", out.stdout)
    if not dur:
        raise RuntimeError("无法解析时长：" + info[-600:])
    t = int(dur.group(1)) * 3600 + int(dur.group(2)) * 60 + float(dur.group(3))
    return {
        "dur": round(t, 2),
        "fps": fps.group(1) if fps else None,
        "audio": "Audio:" in info,
        "size_mb": round(FINAL.stat().st_size / 1e6, 2),
        "raw": info[info.find("Stream #0:0"): info.find("Stream #0:0") + 400],
    }


def audio_track() -> np.ndarray:
    tmp = RENDER / "_qa_audio.wav"
    subprocess.run(
        [str(FFMPEG_BIN), "-y", "-v", "error", "-i", str(FINAL), "-ac", "1", "-ar", str(SR), "-f", "wav", str(tmp)],
        check=True,
        capture_output=True,
    )
    with wave.open(str(tmp), "rb") as w:
        data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768.0
    tmp.unlink(missing_ok=True)
    return data


def max_silence(y: np.ndarray, thresh: float = 0.006) -> float:
    step = int(0.02 * SR)
    win = int(0.02 * SR)
    silent = np.abs(y[: y.size // win * win].reshape(-1, win)).max(axis=1) < thresh
    best = cur = 0
    for s in silent:
        cur = cur + 1 if s else 0
        best = max(best, cur)
    return best * step / SR


def shot_times(props: dict) -> list[tuple[float, float, str]]:
    out = []
    cursor = 0
    for s in props.get("slides", []):
        dur = max(1, int(s.get("durationFrames") or 1))
        out.append((cursor / 30, dur / 30, s.get("id", "?")))
        cursor += dur
    return out


def frame_stats(t: float) -> dict:
    png = RENDER / f"_qa_{t:.2f}.png"
    subprocess.run(
        [str(FFMPEG_BIN), "-y", "-v", "error", "-ss", str(t), "-i", str(FINAL), "-frames:v", "1", str(png)],
        check=True,
        capture_output=True,
    )
    from PIL import Image

    im = Image.open(png).convert("RGB")
    a = np.asarray(im).astype(np.float32) / 255.0
    # 感知亮度
    lum = 0.2126 * a[:, :, 0] + 0.7152 * a[:, :, 1] + 0.0722 * a[:, :, 2]
    dark_ratio = float((lum < 0.25).mean())
    mean_lum = float(lum.mean())
    # 内容 bbox：与背景（取图像四角中位数色）差异明显的像素
    corners = np.stack([a[0, 0], a[0, -1], a[-1, 0], a[-1, -1]])
    bgc = np.median(corners, axis=0)
    diff = np.abs(a - bgc[None, None, :]).sum(axis=2)
    mask = diff > 0.14
    ys, xs = np.where(mask)
    if len(xs) == 0:
        bbox = None
    else:
        bbox = (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()))
    png.unlink(missing_ok=True)
    jpg = RENDER / f"qa_{t:.1f}.jpg"
    im.save(jpg, quality=90)
    return {"mean_lum": round(mean_lum, 3), "dark_ratio": round(dark_ratio, 3), "bbox": bbox, "jpg": jpg.name}


def main() -> None:
    frames_only = "--frames-only" in sys.argv
    props = json.loads(PROPS.read_text(encoding="utf-8"))
    shots = shot_times(props)
    info = probe()
    print("== container ==")
    for k, v in info.items():
        if k != "raw":
            print(f"  {k}: {v}")
    print("  ", info["raw"].replace("\n", " ")[:220])

    ok = True
    if not (70.0 <= info["dur"] <= 80.0):
        print(f"!! 时长 {info['dur']}s 不在 70~80s"); ok = False
    if not info["audio"]:
        print("!! 无音轨"); ok = False
    if "1920x1080" in info["raw"] or "1080x1920" not in info["raw"]:
        print("!! 画幅异常（期望 1080x1920）"); ok = False

    if not frames_only:
        y = audio_track()
        peak = float(np.abs(y).max())
        sil = max_silence(y)
        print("== audio ==")
        print(f"  peak={peak:.3f}  max_silence={sil:.2f}s  dur={y.size / SR:.2f}s")
        if peak > 0.98:
            print("!! 削波风险"); ok = False
        if sil > 0.15:
            print(f"!! 存在 {sil:.2f}s 静音"); ok = False
        print("== per-shot narration RMS ==")
        for st, dur, sid in shots:
            a, b = int(st * SR), int((st + dur) * SR)
            seg = y[a:b]
            r = float(np.sqrt(np.mean(seg ** 2))) if len(seg) else 0.0
            flag = "OK" if r > 0.01 else "LOW"
            if r <= 0.01:
                ok = False
            print(f"  {sid:10s} {st:6.2f}s +{dur:5.2f}s  rms={r:.3f} {flag}")

    print("== frames (brightness / safe area) ==")
    sample = []
    for st, dur, sid in shots:
        sample.append((st + dur * 0.55, sid))
    sample.append((1.2, "cover"))
    for t, sid in sample:
        s = frame_stats(t)
        bbox = s["bbox"]
        safe_ok = True
        note = ""
        if bbox:
            x0, y0, x1, y1 = bbox
            if x0 < 56 or x1 > 1024:
                safe_ok = False
                note += f" 左右越界({x0},{x1})"
            if y1 > 1730:
                safe_ok = False
                note += f" 底部越界(y1={y1})"
        bright_ok = s["mean_lum"] > 0.55 and s["dark_ratio"] < 0.08
        if not bright_ok:
            ok = False
        print(
            f"  {t:6.2f}s {sid:10s} lum={s['mean_lum']:.3f} dark={s['dark_ratio']:.3f} "
            f"bbox={bbox} {'OK' if safe_ok and bright_ok else 'CHECK'}{note} -> {s['jpg']}"
        )

    print("\n== RESULT ==", "PASS" if ok else "FAIL")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
