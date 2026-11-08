# -*- coding: utf-8 -*-
"""《你的一生，就是一支K线》时间轴设计。

输入：projects/life-kline/market_base.json（蜡烛/事件/章节）+ durations.json（实测配音）
输出：
- projects/life-kline/market.json   渲染契约（meta/daily/events/stages + anchors/segments 供工具链）
- storage/_life_kline_design.json   BGM 卡点表（hits/risers/ticks + 镜头切点 + 各章 dayTimes）

设计规则（briefs/life-kline-brief.md §4）：
- 普通岁 6~51 帧/根行军；事件岁进入慢放窗口（T1=105 / T2=75 / 收官 age78=120 帧）；
- 事件起始帧吸附 0.5s 网格（15 帧倍数），修正量摊到其前 ≤5 根普通蜡烛；
- 章末若为事件蜡烛：E 章（封板）钉在章尾（climax at cut）；G 章（退市）窗口后保留
  收尾留白（台词 l2/l3 与"下一支重生"特效），无行军帧也能静置；
- 镜头总帧 = durationSec*30（0.5s 倍数，按配音实测自动上调）。
"""
import json
import math
import sys
from pathlib import Path

ROOT = Path(r"D:\Work\video-workflow\backend")
PID = "life-kline"
FPS = 30
BEAT = 15  # 0.5s @30fps

SHOTS = [
    {"key": "hook", "dur": 6.0},
    {"key": "chA", "dur": 12.0, "seg": "A", "ev_target": 4.5},   # 窗口居中，留台词尾
    {"key": "chB", "dur": 10.0, "seg": "B"},
    {"key": "chC", "dur": 16.0, "seg": "C"},
    {"key": "chD", "dur": 15.0, "seg": "D"},
    {"key": "chE", "dur": 11.0, "seg": "E", "pin": True},   # 封板钉在章尾
    {"key": "chF", "dur": 10.0, "seg": "F"},
    {"key": "chG", "dur": 14.0, "seg": "G", "ev_target": 8.0},  # 退市窗口 8s 起，尾部留白收尾
    {"key": "outro", "dur": 6.0},
]
LEAD = 15
SLOW_T1 = 105
SLOW_T2 = 75
SLOW_FINALE = 120

GAIN_CUT = {"hook": 0.80, "chA": 0.55, "chB": 0.55, "chC": 0.55, "chD": 0.55,
            "chE": 0.60, "chF": 0.55, "chG": 0.60, "outro": 0.50}
GAIN_T1, GAIN_T2, GAIN_FINALE = 0.72, 0.55, 1.0
CRASH_BOOST = 0.06
RISER_BEFORE = {"age30", "age35", "age60", "age78"}


def slow_frames_for(ev: dict) -> int:
    if ev["id"] == "age78":
        return SLOW_FINALE
    return SLOW_T1 if ev.get("tier") == 1 else SLOW_T2


def allocate(day_count: int, ev_days: list[int], ev_slow: list[int], total: int,
             pin_last: bool, ev_target: int | None = None) -> tuple[list[int], int]:
    """行军帧分配（最大余数法）。返回 (每天起始帧, 章尾留白帧 idle)。

    pin_last=True 且末位为事件：目标钉在 total-slow（climax at cut，无留白）；
    ev_target：显式指定末位事件窗口起始帧（网格倍数），其后的剩余帧作为留白 idle；
    否则按理想位置吸附网格；与前窗重叠时钳制到 prev_end+BEAT（保持网格）。
    """
    ev_at = dict(zip(ev_days, ev_slow))
    normal = [i for i in range(day_count) if i not in ev_at]
    fast_total = total - LEAD - sum(ev_slow)
    pace = fast_total / max(1, len(normal))

    targets: list[int] = []
    for k, (ei, sl) in enumerate(zip(ev_days, ev_slow)):
        prev_end = targets[-1] + ev_slow[len(targets) - 1] if targets else LEAD
        if ev_target is not None and (k == 0 or ei == day_count - 1):
            tgt = round(ev_target / BEAT) * BEAT
        elif pin_last and ei == day_count - 1:
            tgt = total - sl
            assert tgt % BEAT == 0, f"pinned target {tgt} off grid"
        else:
            n_before = sum(1 for j in normal if j < ei)
            ideal = LEAD + n_before * pace + sum(ev_slow[:k])
            tgt = round(ideal / BEAT) * BEAT
        if k > 0 and tgt < prev_end + BEAT:  # 与前窗重叠 → 钳制（网格不变：prev_end 与 sl 均为 BEAT 倍数）
            tgt = prev_end + BEAT
        assert tgt + sl <= total, f"event target {tgt}+{sl} exceeds shot {total}"
        targets.append(tgt)

    p: dict[int, int] = {}
    prev_end = LEAD
    for k, (ei, sl) in enumerate(zip(ev_days, ev_slow)):
        gap_days = [j for j in normal if (ev_days[k - 1] if k > 0 else -1) < j < ei]
        _spread(p, gap_days, targets[k] - prev_end)
        prev_end = targets[k] + sl
    tail_days = [j for j in normal if j > ev_days[-1]]
    idle = 0
    if tail_days:
        _spread(p, tail_days, total - prev_end)
    else:
        idle = total - prev_end
        assert idle >= 0, f"negative idle {idle}"

    starts = [0] * day_count
    cur = LEAD
    for i in range(day_count):
        starts[i] = cur
        cur += ev_at.get(i, p.get(i, 0))
    end = starts[-1] + ev_at.get(day_count - 1, p.get(day_count - 1, 0))
    assert end == total - idle, f"allocation drift: end={end} total-idle={total - idle}"
    for ei, st in zip(ev_days, [starts[e] for e in ev_days]):
        assert st % BEAT == 0, f"event at age {ei} not on grid: {st}"
    return starts, idle


def _spread(p: dict, days: list[int], budget: int) -> None:
    if not days:
        assert budget == 0, f"gap budget {budget} with no days"
        return
    base, rem = divmod(budget, len(days))
    assert base >= 1, f"gap too tight: budget {budget} for {len(days)} days"
    for k, j in enumerate(days):
        p[j] = base + (1 if k < rem else 0)


def main() -> None:
    base = json.loads((ROOT / "storage" / "projects" / PID / "market_base.json").read_text(encoding="utf-8"))
    durations = json.loads((ROOT / "storage" / "projects" / PID / "durations.json").read_text(encoding="utf-8"))
    script = json.loads((ROOT / "storage" / "projects" / PID / "script.json").read_text(encoding="utf-8"))
    daily, events, segs = base["daily"], base["events"], base["segments"]
    by_id = {e["id"]: e for e in events}
    age_of = {d["date"][:4]: int(d["date"][:4]) for d in daily}
    daily_by_age = {int(d["date"][:4]): d for d in daily}

    # ---- 台词排布校验（MotionShow 公式：round(dur*30)+11f 间距，镜尾 18f）----
    def shot_lines_frames(shot_idx: int) -> int:
        lines = script["shots"][shot_idx]["lines"]
        off = 0
        for li, ln in enumerate(lines):
            dur = durations.get(f"s{shot_idx + 1:02d}_{li}") or durations.get(ln.get("id") or "") or max(0.8, len(ln["text"]) / 4.5)
            off += max(1, round(dur * FPS)) + 11
        return off

    min_frames = []
    for si, sh in enumerate(SHOTS):
        need = shot_lines_frames(si) + 18
        want = max(sh["dur"] * FPS, need)
        sh["dur"] = math.ceil(want / FPS * 2) / 2
        min_frames.append(need)

    # ---- 逐章分配 ----
    march_out = {}
    hits, risers, ticks = [], [], []
    cursor_f = 0
    cut_times = []
    for sh in SHOTS:
        f0 = round(sh["dur"] * FPS)
        cut_times.append(cursor_f / FPS)
        key = sh["key"]
        if "seg" in sh:
            seg = segs[sh["seg"]]
            win = [d for a in range(seg["start"], seg["end"] + 1) for d in [daily_by_age[a]]]
            ev_ids = seg["events"]
            ev_days = [next(i for i, d in enumerate(win) if int(d["date"][:4]) == by_id[eid]["year"]) for eid in ev_ids]
            ev_slow = [slow_frames_for(by_id[eid]) for eid in ev_ids]
            ev_t = sh.get("ev_target")
            if sh["key"] == "chG":
                # 退市窗口动态前置：dur 增长时保持尾部 ~4.5s 收尾（l3 + 幽灵蜡烛 + 淡出）
                ev_t = max(6.0, sh["dur"] - SLOW_FINALE / FPS - 4.5)
            starts, idle = allocate(
                len(win), ev_days, ev_slow, f0, bool(sh.get("pin")),
                ev_t * FPS if ev_t else None,
            )
            day_times = [round(s / FPS, 4) for s in starts]
            ev_out = []
            for eid, di, sl in zip(ev_ids, ev_days, ev_slow):
                at_local = starts[di] / FPS
                at_global = (cursor_f + starts[di]) / FPS
                ev_out.append({"id": eid, "local": round(at_local, 3), "global": round(at_global, 3), "frames": sl})
                ev = by_id[eid]
                gain = GAIN_FINALE if eid == "age78" else (
                    (GAIN_T1 + (CRASH_BOOST if ev["kind"] == "down" else 0)) if ev["tier"] == 1 else GAIN_T2
                )
                hits.append({"t": round(at_global, 3), "gain": gain, "kind": ev["kind"], "id": eid})
                if eid in RISER_BEFORE:
                    risers.append({"t": round(max(0.0, at_global - 1.5), 3), "gain": 0.34})
            march_out[key] = {
                "start": f"{seg['start']:04d}-01-01", "end": f"{seg['end']:04d}-12-31",
                "count": len(win), "dayTimes": day_times, "events": ev_out,
                "slowFrames": {eid: sl for eid, sl in zip(ev_ids, ev_slow)},
                "idle": round(idle / FPS, 3),
            }
            # 每 5 岁轻 tick（行军段内，非事件蜡烛）
            for i, d in enumerate(win):
                a = int(d["date"][:4])
                if a > 0 and a % 5 == 0 and i not in ev_days:
                    ticks.append({"t": round((cursor_f + starts[i]) / FPS, 3), "gain": 0.12})
        cursor_f += f0
    total_sec = cursor_f / FPS

    # ---- BGM 卡点表 ----
    for i, sh in enumerate(SHOTS):
        hits.append({"t": round(cut_times[i], 3), "gain": GAIN_CUT[sh["key"]], "kind": "cut", "id": sh["key"]})
    hits.sort(key=lambda h: h["t"])

    design = {
        "pid": PID, "fps": FPS, "total_sec": round(total_sec, 3),
        "shots": [
            {**sh, "frames": round(sh["dur"] * FPS), "start_sec": round(cut_times[i], 3), "min_frames": min_frames[i]}
            for i, sh in enumerate(SHOTS)
        ],
        "march": march_out,
        "bgm": {"hits": hits, "risers": risers, "ticks": ticks, "total": round(total_sec + 1.1, 2)},
    }
    (ROOT / "storage" / "_life_kline_design.json").write_text(
        json.dumps(design, ensure_ascii=False, indent=1), encoding="utf-8"
    )

    # ---- market.json（渲染契约）----
    market = {
        "meta": base["meta"],
        "points": [],
        "annual": [],
        "events": events,
        "daily": daily,
        "stages": base["stages"],
        "anchors": base["anchors"],
        "segments": segs,
    }
    (ROOT / "storage" / "projects" / PID / "market.json").write_text(
        json.dumps(market, ensure_ascii=False, indent=1), encoding="utf-8"
    )

    print(f"total {total_sec:.2f}s ({cursor_f} frames)")
    for sh in design["shots"]:
        print(f"  {sh['key']:6s} {sh['start_sec']:6.2f}s +{sh['dur']}s (min {sh['min_frames']}f)")
    for k, m in march_out.items():
        evs = ", ".join(f"{e['id']}@{e['local']:.2f}(l)/{e['global']:.2f}(g) {e['frames']}f" for e in m["events"])
        print(f"  {k}: {m['count']} candles, events: {evs}, idle {m['idle']}s")
    print(f"bgm: {len(hits)} hits, {len(risers)} risers, {len(ticks)} ticks")


if __name__ == "__main__":
    sys.exit(main())
