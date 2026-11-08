# -*- coding: utf-8 -*-
"""《A股这一年：242 个交易日》时间轴设计。

输入：market_base.json（日线/事件/统计）+ durations.json（实测配音时长）
输出：
- projects/<pid>/market.json   完整行情契约（daily/events/summary + 各 march 镜 dayTimes）
- backend/storage/_ashare_design.json  BGM 卡点表（hits/risers/ticks + 镜头切点）

设计规则（见 briefs/a-share-year-242d-brief.md）：
- 普通交易日 2~3 帧行军；事件交易日进入慢放窗口（T1=108/T2=78/today=126 帧）；
- 事件起始帧吸附 0.5s 网格（15 帧倍数），修正量摊到其前 ≤5 个交易日（每日 ≤3 帧）；
- 镜头总帧 = durationSec*30，全部 0.5s 倍数 → 硬切点天然落在节拍网格上。
"""
import json
import math
import sys
from pathlib import Path

ROOT = Path(r"D:\Work\video-workflow\backend")
PID = "ashare-year-242d"
FPS = 30
BEAT = 15  # 0.5s @30fps

# 镜头表：durationSec 全部 0.5s 倍数
SHOTS = [
    {"key": "hook", "dur": 5.5},
    {"key": "marchA", "dur": 14.5, "seg": "A"},
    {"key": "marchB", "dur": 16.5, "seg": "B"},
    {"key": "marchC", "dur": 23.0, "seg": "C"},
    {"key": "recap", "dur": 10.5},
    {"key": "outro", "dur": 5.5},
]
LEAD = 15          # 行军镜开头（图表入场）预留帧（0.5s 网格）
SLOW_T1 = 105      # 大事件慢放（3.5s，15 帧倍数）
SLOW_T2 = 75       # 次级事件（2.5s）
SLOW_TODAY = 120   # 收官（4.0s，全片最强卡点）

# BGM 重音强度（impact.wav 叠加增益）
GAIN_CUT = {"hook": 0.80, "marchA": 0.55, "marchB": 0.55, "marchC": 0.55, "recap": 0.60, "outro": 0.50}
GAIN_T1, GAIN_T2, GAIN_TODAY = 0.72, 0.55, 1.0  # today 全曲最强（渲染时 BGM 音量 0.6）
CRASH_BOOST = 0.06
RISER_BEFORE = {"mar23", "jul17", "today"}  # 大事件前 1.5s riser


def slow_frames_for(ev: dict) -> int:
    if ev["id"] == "today":
        return SLOW_TODAY
    return SLOW_T1 if ev.get("tier") == 1 else SLOW_T2


def allocate(day_count: int, ev_days: list[int], ev_slow: list[int], total: int) -> list[int]:
    """先定事件目标帧（0.5s 网格），再在事件间隙用最大余数法分配行军帧。

    total = LEAD + fast + Σslow；末位事件若落在最后一天，目标钉在 total-slow（必为网格点）。
    返回每天的起始帧。
    """
    ev_at = dict(zip(ev_days, ev_slow))
    normal = [i for i in range(day_count) if i not in ev_at]
    fast_total = total - LEAD - sum(ev_slow)
    pace = fast_total / len(normal)

    # 事件目标帧：均匀行军假设下的理想时刻 → 吸附 0.5s 网格；末位钉在 total-slow
    targets: list[int] = []
    for k, (ei, sl) in enumerate(zip(ev_days, ev_slow)):
        n_before = sum(1 for j in normal if j < ei)
        ideal = LEAD + n_before * pace + sum(ev_slow[:k])
        if ei == day_count - 1:
            tgt = total - sl
            assert tgt % BEAT == 0, f"pinned last-event target {tgt} off grid"
        else:
            tgt = round(ideal / BEAT) * BEAT
        prev_end = targets[-1] + ev_slow[len(targets) - 1] if targets else LEAD
        assert tgt >= prev_end, f"event target {tgt} overlaps previous window end {prev_end}"
        targets.append(tgt)

    # 间隙分配：头段 [LEAD→t0]、中段 [t(k)+slow(k)→t(k+1)]、尾段 [tN+slowN→total]
    p: dict[int, int] = {}
    prev_end = LEAD
    for k, (ei, sl) in enumerate(zip(ev_days, ev_slow)):
        gap_days = [j for j in normal if (ev_days[k - 1] if k > 0 else -1) < j < ei]
        _spread(p, gap_days, targets[k] - prev_end)
        prev_end = targets[k] + sl
    tail_days = [j for j in normal if j > ev_days[-1]]
    _spread(p, tail_days, total - prev_end) if tail_days else _spread(p, [], total - prev_end)

    # 重算全部起始帧
    starts = [0] * day_count
    cur = LEAD
    for i in range(day_count):
        starts[i] = cur
        cur += ev_at.get(i, p.get(i, 0))
    end = starts[-1] + ev_at.get(day_count - 1, p.get(day_count - 1, 0))
    assert end == total, f"allocation drift: end={end} total={total}"
    for ei, st in zip(ev_days, [starts[e] for e in ev_days]):
        assert st % BEAT == 0, f"event at day {ei} not on grid: {st}"
    return starts


def _spread(p: dict, days: list[int], budget: int) -> None:
    """把 budget 帧均匀分给 days（最大余数法，每日 ≥1 帧）。"""
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
    daily, events, segs, summary = base["daily"], base["events"], base["segments"], base["summary"]
    by_id = {e["id"]: e for e in events}

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
        # 镜长下限：台词条排布；按 0.5s 上取整（切点始终在节拍网格上）
        want = max(sh["dur"] * FPS, need)
        sh["dur"] = math.ceil(want / FPS * 2) / 2
        min_frames.append(need)

    # ---- 逐镜分配 ----
    march_out = {}   # key -> {dayTimes, events:[{id,local,global,frames}]}
    hits, risers, ticks = [], [], []
    cursor_f = 0
    cut_times = []
    for sh in SHOTS:
        f0 = round(sh["dur"] * FPS)
        cut_times.append(cursor_f / FPS)
        key = sh["key"]
        if "seg" in sh:
            seg = segs[sh["seg"]]
            win = [d for d in daily if seg["start"] <= d["date"] <= seg["end"]]
            ev_ids = seg["events"]
            ev_days = [next(i for i, d in enumerate(win) if d["date"] == by_id[eid]["date"]) for eid in ev_ids]
            ev_slow = [slow_frames_for(by_id[eid]) for eid in ev_ids]
            starts = allocate(len(win), ev_days, ev_slow, f0)
            day_times = [round(s / FPS, 4) for s in starts]
            ev_out = []
            for eid, di, sl in zip(ev_ids, ev_days, ev_slow):
                at_local = starts[di] / FPS
                at_global = (cursor_f + starts[di]) / FPS
                ev_out.append({"id": eid, "local": at_local, "global": round(at_global, 3), "frames": sl})
                gain = GAIN_TODAY if eid == "today" else (GAIN_T1 + (CRASH_BOOST if by_id[eid]["kind"] == "down" else 0)) if by_id[eid]["tier"] == 1 else GAIN_T2
                hits.append({"t": round(at_global, 3), "gain": gain, "kind": by_id[eid]["kind"], "id": eid})
                if eid in RISER_BEFORE:
                    risers.append({"t": round(max(0.0, at_global - 1.5), 3), "gain": 0.34})
            march_out[key] = {
                "start": seg["start"], "end": seg["end"], "count": len(win),
                "dayTimes": day_times, "events": ev_out,
                "slowFrames": {eid: sl for eid, sl in zip(ev_ids, ev_slow)},
            }
            # 月份首个交易日轻 tick（行军段内）
            last_m = ""
            for i, d in enumerate(win):
                m = d["date"][:7]
                if m != last_m:
                    last_m = m
                    if i > 0:
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
    (ROOT / "storage" / "_ashare_design.json").write_text(
        json.dumps(design, ensure_ascii=False, indent=1), encoding="utf-8"
    )

    # ---- market.json（完整契约）----
    market = {
        "meta": base["meta"],
        "points": [],
        "annual": [],
        "events": events,
        "daily": daily,
        "summary": summary,
    }
    (ROOT / "storage" / "projects" / PID / "market.json").write_text(
        json.dumps(market, ensure_ascii=False, indent=1), encoding="utf-8"
    )

    print(f"total {total_sec:.2f}s ({cursor_f} frames)")
    for sh in design["shots"]:
        print(f"  {sh['key']:8s} {sh['start_sec']:6.2f}s +{sh['dur']}s (min {sh['min_frames']}f)")
    for k, m in march_out.items():
        evs = ", ".join(f"{e['id']}@{e['local']:.2f}s(local)/{e['global']:.2f}s(global) {e['frames']}f" for e in m["events"])
        print(f"  {k}: {m['count']} days, events: {evs}")
    print(f"bgm: {len(hits)} hits, {len(risers)} risers, {len(ticks)} ticks")


if __name__ == "__main__":
    sys.exit(main())
