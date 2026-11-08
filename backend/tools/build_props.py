# -*- coding: utf-8 -*-
"""通用 props 构建工具：script + plan + 配音实测时长 + 项目配置 → props.json + BGM 事件时刻。

配置驱动（替代各项目目录里的专用脚本）。项目配置文件示例（storage/projects/<pid>/build_config.json）：
{
  "pid": "ashare-2026",
  "bpm": 110.0,
  "end_cap": 0.87,
  "windows": {"1": [0, 250, "sweep"], "7": [0, 250, "final"], "...": [a, b, "window"]},
  "bgm_events": [{"shot": 3, "day": 100, "strength": 1.0, "kind": "hit"}],
  "sweep_shot": 1
}
时间轴数学与 remotion-engine/src/dv/timeline.ts 常量一致（改动需同步，见 pipeline-contracts.md）。
切镜吸附为「全局拍域」：offset 与切镜都落在 60/BPM 的拍网格上。

用法:
    cd backend && python tools/build_props.py --project ashare-2026
输出: storage/renders/<pid>/props.json，stdout 打印 BGM events 参数（可直接喂 gen_event_bgm.py）。
"""
import argparse
import json
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
FPS = 30
TRACK_LEAD, TRACK_TAIL, TRACK_PAUSE_BONUS = 0.45, 0.4, 0.12
TRACK_GAP = 0.22
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


def pause_after(text: str) -> float:
    """按句尾标点给真实停顿（不再所有句都 0.4s）。

    voice.py / timeline.ts 会再加 TRACK_PAUSE_BONUS；这里给的是“语义停顿”。
    """
    t = (text or "").strip()
    if not t:
        return 0.30
    if t[-1] in "？！?!":
        return 0.50
    if t[-1] in "…":
        return 0.55
    if t[-1] in "。":
        return 0.38
    if t[-1] in "，、；;,":
        return 0.20
    if t[-1].isdigit() or t[-1] == "%":
        return 0.40  # 让数字落地再走
    return 0.30


def main() -> int:
    ap = argparse.ArgumentParser(description="通用 props 构建工具")
    ap.add_argument("--project", required=True, help="项目 id（读 storage/projects/<pid>/）")
    ap.add_argument("--emit-events", action="store_true", help="额外输出 gen_event_bgm 的 --events 参数串")
    args = ap.parse_args()

    proj = BACKEND / "storage" / "projects" / args.project
    script = json.loads((proj / "script.json").read_text(encoding="utf-8"))
    plan = json.loads((proj / "plan.json").read_text(encoding="utf-8"))
    cfg = json.loads((proj / "build_config.json").read_text(encoding="utf-8"))
    dur_file = proj / "durations.json"
    durations = json.loads(dur_file.read_text(encoding="utf-8")) if dur_file.exists() else {}

    pid = cfg.get("pid") or args.project
    bpm = float(cfg.get("bpm", 110.0))
    fps = int(cfg.get("fps", FPS))
    intro_frames = int(cfg.get("intro_frames", 48))
    end_cap = float(cfg.get("end_cap", 0.87))
    windows = {int(k): tuple(v) for k, v in (cfg.get("windows") or {}).items()}
    sweep_shot = int(cfg.get("sweep_shot", 1))
    bgm_events_cfg = cfg.get("bgm_events") or []
    safe_scale = cfg.get("safe_scale", plan.get("safeScale"))  # 抖音安全画幅：config 优先，缺省回落 plan.safeScale
    plan_shots = [it.get("plan") or {} for it in plan.get("shots", [])]

    beats_grid = [round(k * (60.0 / bpm), 4) for k in range(600)]
    raw_off = max(0.0, (intro_frames - 15) / fps)
    # offset 必须与 timeline.ts 完全一致：先 max(2.0,...)，再吸附到拍（不是“取下一个拍”）
    offset = snap(max(2.0, raw_off), beats_grid, 0.45)

    shots, scenes_meta = [], []
    cursor = 0.0
    for si, shot in enumerate(script["shots"], start=1):
        p = plan_shots[si - 1] if si - 1 < len(plan_shots) else {}
        lines, t = [], TRACK_LEAD
        line_starts: list[float] = []
        for li, line in enumerate(shot["lines"]):
            lid = f"s{si:02d}_{li}"
            dur = durations.get(lid) or max(0.8, len(line["text"]) / 4.5)
            is_last = li == len(shot["lines"]) - 1
            pa = pause_after(line["text"])
            pause = 0.0 if is_last else pa + TRACK_PAUSE_BONUS
            emp = [w for w in (p.get("emphasis") or []) if w and w in line["text"]][:4]
            lines.append({
                "id": lid, "text": line["text"], "durationSec": round(dur, 3),
                "audio": f"voice/projects/{pid}/{lid}.wav",
                "pauseAfter": pa, "emphasis": emp or None,
            })
            line_starts.append(round(t, 3))
            t += dur + (0.0 if is_last else pause)
        dur_s = t + TRACK_TAIL
        scenes_meta.append({"shot": si, "unsnapped": cursor, "dur": dur_s, "line_starts": line_starts})
        shots.append({
            "year": shot.get("year", ""), "label": shot.get("label", ""), "colors": shot["colors"],
            "tail": TRACK_TAIL, "lines": lines,
            "camera": p.get("camera"), "camIntensity": p.get("intensity"),
            "cameraPerLine": p.get("cameraPerLine"),
            "enterTransition": p.get("transition"),
            "grade": p.get("grade"), "overlay": p.get("overlay"),
            "scene": p.get("scene"),
            "sfxMoment": p.get("sfxMoment"), "atmosphere": p.get("atmosphere"),
        })
        cursor += dur_s

    # 切镜起点：全局拍域吸附（offset 也落在拍网格上），保底→吸附→保底后下一拍
    starts = [0.0]
    for i in range(1, len(scenes_meta)):
        enter = shots[i].get("enterTransition") or "dissolve"
        ov = OVERLAP.get(enter, 16) / fps
        guard = offset + starts[i - 1] + scenes_meta[i - 1]["dur"] - ov + 0.3
        raw = max(offset + scenes_meta[i]["unsnapped"], guard, offset + starts[i - 1] + 0.6)
        snapped = snap(raw, beats_grid)
        if snapped < guard:
            later = [b for b in beats_grid if b >= guard]
            snapped = later[0] if later else raw
        starts.append(snapped - offset)
    for i, sm in enumerate(scenes_meta):
        sm["start"] = round(starts[i], 3)
        sm["global_start"] = round(offset + starts[i], 3)

    total = offset + sum(sm["dur"] for sm in scenes_meta) + 1.0
    bars = int(total / (4 * 60.0 / bpm)) + 2

    # 事件揭晓时刻（window 含 end_cap；sweep 用 day/(窗口末端)），吸附到全局拍
    # 同拍碰撞时顺延到下一拍（如暴跌 hit 与其 subdrop 不得同刻）
    events_out = []
    taken: set[float] = set()
    step = 60.0 / bpm
    for ev in sorted(bgm_events_cfg, key=lambda e: (int(e["shot"]), float(e.get("order", 0)), int(e["day"]))):
        shot_no, day = int(ev["shot"]), int(ev["day"])
        a, b, mode = windows[shot_no]
        sm = scenes_meta[shot_no - 1]
        line_no = ev.get("line")
        if line_no is not None and int(line_no) < len(sm["line_starts"]):
            # 叙事事件：直接用“那一句台词”的起点，和画面里的游标驻留同一时刻
            t_ev = sm["global_start"] + sm["line_starts"][int(line_no)]
        elif mode == "window":
            frac = min(1.0, (day - a) / max(1, b - a)) * end_cap
            t_ev = sm["global_start"] + frac * sm["dur"]
        else:
            frac = day / max(1, b)
            t_ev = sm["global_start"] + frac * sm["dur"]
        t_snapped = round(round(t_ev / step) * step, 4)
        while t_snapped in taken:
            t_snapped = round(t_snapped + step, 4)
        taken.add(t_snapped)
        events_out.append({"shot": shot_no, "day": day, "kind": ev.get("kind", "hit"),
                           "strength": float(ev.get("strength", 1.0)), "t": t_snapped,
                           "t_raw": round(t_ev, 3)})

    props = {
        "title": script.get("title", ""),
        "kicker": plan.get("kicker"),
        "titleCard": True,
        "grainOpacity": plan.get("grain", 0.05),
        "shots": shots,
        "bgm": {"src": f"bgm/{cfg.get('bgm_out', pid + '_bgm')}.mp3", "volume": cfg.get("bgm_volume", 0.72),
                "bpm": bpm, "beats": beats_grid[: int(total / (60.0 / bpm)) + 16]},
        "look": plan["look"],
        "safeScale": safe_scale,
        "sceneStarts": [round(offset + sm["start"], 3) for sm in scenes_meta],
        "sfx": bool(cfg.get("sfx", True)),
    }
    out = BACKEND / "storage" / "renders" / pid / "props.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(props, ensure_ascii=False, indent=1), encoding="utf-8")

    result = {
        "props": str(out),
        "offset": round(offset, 3),
        "total_est": round(total, 2),
        "bars": bars,
        "scenes": [{"shot": s["shot"], "start": s["global_start"], "dur": round(s["dur"], 3)} for s in scenes_meta],
        "bgm_events": events_out,
    }
    if args.emit_events:
        result["events_arg"] = ",".join(
            f"{e['t']}:{e['strength']}" + ("sub" if e["kind"] == "sub" else "") for e in events_out
        )
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass
    print(json.dumps(result, ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
