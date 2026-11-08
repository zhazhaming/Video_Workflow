# -*- coding: utf-8 -*-
"""props.json 时间轴核算（精确复刻 remotion-engine/src/dv/timeline.ts 的 buildDataVideoTimeline）。

用途：
  1) 把 BGM 实测节拍写回 props（--patch-bgm-beats），保证切镜吸附到真实鼓点；
  2) 打印每镜在成片中的起止/帧数、每句落点、镜内归一化 marks —— 供写 gen 场景与抽帧验收用。

用法:
    cd backend && python tools/timeline_check.py --props storage/renders/<pid>/props.json \
        [--patch-bgm-beats storage/_vibe_bgm_meta.json] [--json-out path.json]
"""
import argparse
import json
import sys
from pathlib import Path

FPS = 30
INTRO_FRAMES = 48
TRACK_LEAD, TRACK_TAIL, TRACK_GAP, TRACK_PAUSE_BONUS = 0.45, 0.4, 0.22, 0.12
OVERLAP = {"whip": 11, "zoom": 13, "flash": 7, "cut": 3, "glitch": 10, "slide": 12, "dissolve": 16}


def snap(t, beats, tol=0.35):
    if not beats:
        return t
    best, bd = t, 1e9
    for b in beats:
        d = abs(b - t)
        if d < bd:
            bd, best = d, b
    return best if bd <= tol else t


def build(props):
    beats = (props.get("bgm") or {}).get("beats") or []
    intro_frames = 0 if props.get("titleCard") is False else INTRO_FRAMES
    offset = snap(max(2.0, max(0.0, (intro_frames - 15) / FPS)), beats, 0.45)

    unsnapped, durs, scene_lines = [], [], []
    cursor = 0.0
    for shot in props["shots"]:
        lines, t = [], TRACK_LEAD
        for li, line in enumerate(shot["lines"]):
            dur = max(0.3, line.get("durationSec") or 1.5)
            is_last = li == len(shot["lines"]) - 1
            pause = 0.0 if is_last else (line.get("pauseAfter") or TRACK_GAP) + TRACK_PAUSE_BONUS
            lines.append({"id": line["id"], "start": t, "dur": dur})
            t += dur + pause
        d = t + (shot.get("tail") or TRACK_TAIL)
        unsnapped.append(cursor)
        scene_lines.append(lines)
        durs.append(d)
        cursor += d

    starts = [0.0]
    for i in range(1, len(durs)):
        enter = props["shots"][i].get("enterTransition") or "dissolve"
        ov = (OVERLAP.get(enter, 16)) / FPS
        guard = starts[i - 1] + durs[i - 1] - ov + 0.3
        raw = max(unsnapped[i], guard, starts[i - 1] + 0.6)
        snapped = snap(raw, beats)
        if snapped < guard:
            later = next((b for b in beats if b >= guard), None)
            snapped = later if later is not None else raw
        starts.append(snapped)

    body = starts[-1] + durs[-1]
    duration = max(2.0, offset + body + 1.0)
    return {
        "offset": round(offset, 3),
        "duration_sec": round(duration, 3),
        "total_frames": int(-(-duration * FPS // 1)),
        "scenes": [
            {
                "shot": i + 1,
                "label": props["shots"][i].get("label"),
                "start": round(offset + starts[i], 3),
                "dur": round(durs[i], 3),
                "frames": int(round(durs[i] * FPS)),
                "scene": (props["shots"][i].get("scene") or {}).get("kind"),
                "lines": [
                    {
                        "id": ln["id"],
                        "global": round(offset + starts[i] + ln["start"], 3),
                        "start": round(ln["start"] / max(1e-6, durs[i]), 4),
                        "dur": round(ln["dur"] / max(1e-6, durs[i]), 4),
                    }
                    for ln in scene_lines[i]
                ],
            }
            for i in range(len(durs))
        ],
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--props", required=True, type=Path)
    ap.add_argument("--patch-bgm-beats", type=Path, default=None,
                    help="含 beats 数组的 json（如 storage/_vibe_bgm_meta.json），写回 props.bgm")
    ap.add_argument("--json-out", type=Path, default=None)
    args = ap.parse_args()

    props = json.loads(args.props.read_text(encoding="utf-8"))
    if args.patch_bgm_beats:
        meta = json.loads(args.patch_bgm_beats.read_text(encoding="utf-8-sig"))
        props.setdefault("bgm", {})["beats"] = meta["beats"]
        props["bgm"]["bpm"] = meta.get("bpm", props["bgm"].get("bpm", 0))
        args.props.write_text(json.dumps(props, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"[patch] {args.props}  beats={len(meta['beats'])} bpm={props['bgm']['bpm']}")

    info = build(props)
    print(json.dumps(info, ensure_ascii=False, indent=1))
    if args.json_out:
        args.json_out.write_text(json.dumps(info, ensure_ascii=False, indent=1), encoding="utf-8")
    return 0


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass
    sys.exit(main())
