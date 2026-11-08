# -*- coding: utf-8 -*-
"""精确复刻 remotion-engine/src/DataVideo.tsx 的 buildTimeline 时间轴（含节拍吸附），
输出每镜在成片中的 [start,end] 秒区间，供抽帧验收使用。
用法: python tools/shot_timeline.py <props.json>
"""
import json
import sys

FPS = 30
LEAD, GAP, DEFAULT_TAIL = 0.7, 0.35, 0.6
INTRO_SEC, INTRO_FADE, END_HOLD = 2.2, 15, 15
VALID = {"dissolve", "whip", "zoom", "flash", "cut", "glitch", "slide"}
OVERLAP = {"whip": 11, "zoom": 13, "flash": 7, "cut": 3, "glitch": 10, "slide": 12}


def snap(t, beats, tol=0.35):
    if not beats:
        return t
    best, bd = t, tol
    for b in beats:
        d = abs(b - t)
        if d < bd:
            bd, best = d, b
    return best


def overlap_for(k):
    return OVERLAP.get(k, 16)


def build(props):
    """计算每镜全局秒区间（与 DataVideo.tsx buildTimeline 对齐）。

    返回 (shots, offset_sec, end_sec)：
    shots = [{"start","end","mid","kind"}]（含片头 offset 的全局秒）；
    end_sec ≈ 最后一镜结束 + 尾部停留（video_end 参考值）。
    """
    shots = props["shots"]
    beats = (props.get("bgm") or {}).get("beats") or []

    # buildLayout
    layout, cursor = [], 0.0
    for s in shots:
        t = LEAD
        spans = []
        for i, l in enumerate(s["lines"]):
            st = t
            dur = max(0.3, l.get("durationSec") or 1.5)
            pause = 0 if i == len(s["lines"]) - 1 else l.get("pauseAfter", GAP)
            t += dur + pause
            spans.append((st, st + dur))
        durs = t + (s.get("tail") or DEFAULT_TAIL)
        layout.append({"start": cursor, "dur": durs, "spans": spans})
        cursor += durs

    intro_frames = INTRO_SEC * FPS if props.get("titleCard") is not False else 0
    base_off = max(0.0, intro_frames - INTRO_FADE) / FPS
    offset = round(max(2.0, snap(base_off, beats, 0.45)) * FPS)

    starts = [0.0] + [snap(l["start"], beats) for l in layout[1:]]
    for i in range(1, len(starts)):
        starts[i] = max(starts[i], starts[i - 1] + 0.6)

    # enters：显式指定优先，否则按下一镜台词语气（与 TS pickTransition 一致）
    enters = ["dissolve"]
    for i in range(1, len(shots)):
        d = shots[i].get("enterTransition")
        if d in VALID:
            enters.append(d)
            continue
        text = "".join(l["text"] for l in shots[i]["lines"])
        if "！" in text or "!" in text:
            t = "whip"
        elif "？" in text or "?" in text:
            t = "zoom"
        elif i % 7 == 3:
            t = "flash"
        elif i % 4 == 2:
            t = "cut"
        else:
            t = "dissolve"
        if t == enters[i - 1] and t != "dissolve":
            t = "dissolve"
        enters.append(t)

    n = len(layout)
    durs = []
    for i, l in enumerate(layout):
        content_end = l["spans"][-1][1] if l["spans"] else 0
        if i == n - 1:
            durs.append(l["dur"])
        else:
            durs.append(max(content_end + 0.12, starts[i + 1] - starts[i] + overlap_for(enters[i + 1]) / FPS))

    out = []
    total = None
    for i in range(n):
        frm = offset + round(starts[i] * FPS)
        dur = round(durs[i] * FPS)
        kind = (shots[i].get("scene") or {}).get("kind")
        out.append({
            "start": frm / FPS,
            "end": (frm + dur) / FPS,
            "mid": (frm + dur / 2) / FPS,
            "kind": kind,
        })
        total = frm + dur
    return out, offset / FPS, (total + END_HOLD) / FPS


def main(path):
    props = json.load(open(path, encoding="utf-8"))
    shots, offset, end = build(props)
    print(f"offset={offset:.2f}s  total_shots={len(shots)}")
    for i, s in enumerate(shots):
        print(f"shot{i+1:02d}  [{s['start']:7.2f} ~ {s['end']:7.2f}]s  mid={s['mid']:6.2f}  scene={s['kind']}")
    print(f"video_end~{end:.2f}s")


if __name__ == "__main__":
    main(sys.argv[1])
