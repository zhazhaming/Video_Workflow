// Scene03 · 三大指数：三根温度计逐个亮起
// 数字随台词从 0 数到目标值，横条同步生长；所有数值来自当日开盘数据。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, INK, INK_SOFT, FAINT, RED, SERIF_STACK, MONO_STACK, seg, eo, eio, pop, clamp01 } from "./ui";

const ROWS = [
  { label: "上证指数", value: 0.58, note: "沪指" },
  { label: "深证成指", value: 1.51, note: "深市" },
  { label: "创业板指", value: 2.44, note: "成长" },
];
const MAX = 2.44;
const BAR_X = 560;
const BAR_MAX = 410;

const Scene03: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const enter = eo(seg(p, 0, 0.1));
  const note = eo(seg(p, 0.78, 0.9));
  const ex = seg(p, 0.9, 1);
  const main = accent || RED;

  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} />

      <div style={{ opacity: enter }}>
        <Cap text="03 / NUMBERS" x={110} y={300} color={main} />
        <Cap text="高开幅度" x={962} y={300} align="right" color={FAINT} />
        <Hair x={110} y={338} w={852} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 110, top: 388, opacity: enter }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 18, letterSpacing: 4, color: FAINT }}>OPENING GAP</div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 56, fontWeight: 700, color: INK, letterSpacing: 2, marginTop: 4 }}>
          三个数字，三种温度。
        </div>
      </div>

      {/* 刻度底板 */}
      <div style={{ position: "absolute", left: BAR_X, top: 1046, width: BAR_MAX, height: 1, background: INK, opacity: 0.16 }} />
      {[0, 1, 2].map((v) => (
        <div key={v} style={{ position: "absolute", left: BAR_X + (v / MAX) * BAR_MAX, top: 1050, width: 1, height: 8, background: INK, opacity: 0.24 }}>
          <div style={{ position: "absolute", left: -10, top: 12, width: 30, textAlign: "center", fontFamily: MONO_STACK, fontSize: 13, color: FAINT }}>
            {v}%
          </div>
        </div>
      ))}
      <div style={{ position: "absolute", left: BAR_X + BAR_MAX, top: 1046, width: 1, height: 8, background: INK, opacity: 0.24 }}>
        <div style={{ position: "absolute", left: -16, top: 12, width: 44, textAlign: "center", fontFamily: MONO_STACK, fontSize: 13, color: main }}>
          2.44
        </div>
      </div>

      {ROWS.map((r, i) => {
        const m = marks?.[i];
        const start = m ? m.start : 0.08 + i * 0.24;
        const dur = m ? Math.max(0.16, m.dur * 0.55) : 0.28;
        const q = eio(seg(p, start, start + dur));
        const rowY = 560 + i * 172;
        const w = (r.value / MAX) * BAR_MAX * q;
        const shown = r.value.toFixed(2);
        const lead = i === 2 ? pop(seg(p, start + dur * 0.55, start + dur)) : 0;

        return (
          <React.Fragment key={r.label}>
            <div style={{ position: "absolute", left: 110, top: rowY, width: 190, opacity: enter * (0.3 + 0.7 * q) }}>
              <div style={{ fontFamily: SERIF_STACK, fontSize: 31, fontWeight: 700, color: INK, letterSpacing: 1 }}>{r.label}</div>
              <div style={{ fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 2, color: FAINT, marginTop: 4 }}>{r.note}</div>
            </div>

            <div style={{ position: "absolute", left: 330, top: rowY - 18, display: "flex", alignItems: "baseline", opacity: q }}>
              <div style={{ fontFamily: MONO_STACK, fontSize: 62, fontWeight: 700, color: main, letterSpacing: -1 }}>{shown}</div>
              <div style={{ fontFamily: MONO_STACK, fontSize: 26, color: main, marginLeft: 4 }}>%</div>
            </div>

            <div style={{ position: "absolute", left: BAR_X, top: rowY + 30, width: BAR_MAX, height: 12, background: "rgba(27,24,21,0.07)", borderRadius: 6, opacity: enter }} />
            <div
              style={{
                position: "absolute",
                left: BAR_X,
                top: rowY + 30,
                width: Math.max(2, w),
                height: 12,
                borderRadius: 6,
                background: `linear-gradient(90deg, ${main}AA, ${main})`,
                opacity: q,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: BAR_X + Math.max(0, w) - 6,
                top: rowY + 26,
                width: 20,
                height: 20,
                borderRadius: 10,
                background: main,
                opacity: q * 0.9,
                boxShadow: `0 0 0 ${5 + 6 * lead}px ${main}18`,
              }}
            />
            {r.value > 2 ? (
              <div style={{ position: "absolute", left: BAR_X + BAR_MAX + 16, top: rowY + 18, opacity: lead * 0.9, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 2, color: main }}>
                领涨
              </div>
            ) : null}
          </React.Fragment>
        );
      })}

      <div style={{ position: "absolute", left: 110, top: 1138, opacity: note }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 29, color: INK_SOFT }}>
          越往成长走，开盘的情绪越满。
        </div>
      </div>

      <div style={{ position: "absolute", right: 110, top: 1150, opacity: note * 0.85, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 3, color: FAINT }}>
        数据 · 2026.11.10 开盘
      </div>
    </AbsoluteFill>
  );
};

export default Scene03;
