# -*- coding: utf-8 -*-
"""成片自动验收报告（visual-judge 不可用时的机检底线 + 人工抽帧的前置过滤）。

检查项：时长/分辨率/帧率、黑帧占比、静音段、整体 RMS（响度）、
切镜落拍偏差（需 --props，读 props 的 bpm/beats 与 scenes）、场景切换数。
输出 JSON+人读文本；--strict 时任一硬项不过退出码 1。

用法:
    cd backend && python tools/qa_report.py --video storage/renders/<pid>/final.mp4 [--props .../props.json]
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path


def run(args):
    return subprocess.run(args, capture_output=True, text=True)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--props", default=None, help="props.json（提供则做切镜落拍检查）")
    ap.add_argument("--est-seconds", type=float, default=None, help="估算时长（±10%% 检查）")
    ap.add_argument("--strict", action="store_true")
    args = ap.parse_args()
    video = Path(args.video)
    issues, report = [], {}

    probe = json.loads(run(["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", str(video)]).stdout)
    v = next(s for s in probe["streams"] if s["codec_type"] == "video")
    a = next(s for s in probe["streams"] if s["codec_type"] == "audio")
    dur = float(probe["format"]["duration"])
    report["container"] = {"duration": round(dur, 2), "size": v["width"], "height": v["height"],
                           "fps": v["r_frame_rate"], "audio": a["codec_name"]}
    if args.est_seconds and abs(dur - args.est_seconds) / args.est_seconds > 0.10:
        issues.append(f"时长 {dur:.1f}s 偏离估算 {args.est_seconds}s 超 ±10%")

    # 黑帧（可跳过）与场景切换
    bd = run(["ffmpeg", "-v", "info", "-i", str(video), "-vf", "blackdetect=d=0.2:pix_th=0.03", "-f", "null", "-"]).stderr
    black = re.findall(r"black_start:([\d.]+).*black_end:([\d.]+)", bd)
    black_total = sum(float(e) - float(s) for s, e in black)
    report["black_frames"] = {"segments": len(black), "total_s": round(black_total, 2)}
    if black_total > 1.0:
        issues.append(f"黑帧累计 {black_total:.2f}s（>1s）")

    sc = run(["ffmpeg", "-v", "error", "-i", str(video), "-vf", "select='gt(scene,0.15)',showinfo", "-f", "null", "-"]).stderr
    cut_times = [round(float(x), 3) for x in re.findall(r"pts_time:([\d.]+)", sc)]
    report["hard_cuts"] = len(cut_times)
    report["actual_cuts"] = cut_times[:20]

    # 静音段与响度
    vd = run(["ffmpeg", "-i", str(video), "-af", "silencedetect=n=-45dB:d=0.6", "-f", "null", "-"]).stderr
    sils = re.findall(r"silence_duration: ([\d.]+)", vd)
    report["silence_over_0.6s"] = len(sils)
    if len(sils) > 6:
        issues.append(f"≥0.6s 静音段 {len(sils)} 个（人声/音乐可能断流）")
    vd2 = run(["ffmpeg", "-i", str(video), "-af", "volumedetect", "-f", "null", "-"]).stderr
    m = re.search(r"mean_volume: (-?[\d.]+) dB", vd2)
    mx = re.search(r"max_volume: (-?[\d.]+) dB", vd2)
    if m:
        mean_db = float(m.group(1))
        report["loudness"] = {"mean_db": mean_db, "max_db": float(mx.group(1)) if mx else None}
        if mean_db < -22:
            issues.append(f"整体响度偏低（mean {mean_db}dB < -22dB）")

    # 切镜落拍（需 props）
    if args.props:
        props = json.loads(Path(args.props).read_text(encoding="utf-8"))
        bpm = float(props["bgm"]["bpm"])
        beat = 60.0 / bpm
        beats = props["bgm"]["beats"]

        def nearest(t):
            return min(beats, key=lambda b: abs(b - t))

        def snap(t, tol=0.35):
            b = nearest(t)
            return b if abs(b - t) <= tol else t

        LEAD, TAIL, BONUS = 0.45, 0.4, 0.12
        OFFMAP = {"whip": 11, "zoom": 13, "flash": 7, "cut": 3, "glitch": 10, "slide": 12, "dissolve": 16}
        if props.get("sceneStarts"):
            starts = [float(x) for x in props["sceneStarts"]]  # 全局时刻（与 timeline.ts 同式）
        else:
            raw_off = max(0.0, (48 - 15) / 30) if props.get("titleCard", True) else 0.0
            offset = snap(max(2.0, raw_off), 0.45)
            cursor, durs, unsnapped = 0.0, [], []
            for sh in props["shots"]:
                t = LEAD
                for li, ln in enumerate(sh["lines"]):
                    t += ln["durationSec"]
                    if li < len(sh["lines"]) - 1:
                        t += (ln.get("pauseAfter") or 0.3) + BONUS
                durs.append(t + TAIL)
                unsnapped.append(cursor)
                cursor += durs[-1]
            starts = [0.0]
            for i in range(1, len(durs)):
                ov = OFFMAP.get(props["shots"][i].get("enterTransition") or "dissolve", 16) / 30
                guard = starts[i - 1] + durs[i - 1] - ov + 0.3
                raw = max(unsnapped[i], guard, starts[i - 1] + 0.6)
                s = snap(raw)
                if s < guard:
                    later = next((b for b in beats if b >= guard), None)
                    s = later if later is not None else raw
                starts.append(s)
            starts = [offset + x for x in starts]

        on, total = 0, 0
        for i, g in enumerate(starts):
            if i == 0:
                continue
            total += 1
            if abs(nearest(g) - g) <= 2.0 / 30:
                on += 1
        report["beat_sync"] = {"cuts_on_beat": on, "cuts_total": total}
        if total and on / total < 0.8:
            issues.append(f"落拍切镜 {on}/{total} < 80%")

        # 实际帧差切点 vs props 场景起点：防止“props 自证卡点”再次发生
        if cut_times and len(starts) > 1:
            matches = []
            for ct in cut_times[:12]:
                near = min(starts[1:], key=lambda g: abs(g - ct))
                matches.append(round(near - ct, 3))
            report["cut_positions"] = {
                "actual_cuts": cut_times[:12],
                "delta_to_scene_start": matches,
                "matched_2f": sum(1 for d in matches if abs(d) <= 2.0 / 30),
            }
            if matches and sum(1 for d in matches if abs(d) <= 2.0 / 30) / len(matches) < 0.6:
                issues.append("实际切点与 sceneStarts 偏差 >2 帧（props 时间轴可能又漂了）")

    ok = not issues
    report["issues"] = issues
    report["verdict"] = "pass" if ok else "fail"
    out = json.dumps(report, ensure_ascii=False, indent=1)
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass
    print(out)
    rep_path = video.parent / "qa_report.json"
    rep_path.write_text(out, encoding="utf-8")
    if args.strict and not ok:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
