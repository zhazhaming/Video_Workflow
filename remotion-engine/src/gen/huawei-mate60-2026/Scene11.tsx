// Scene11 · 股权：不上市，100% 由员工持有，任正非不到 1%
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Stamp, Signature, seg, easeOut, pop, mk, clamp01,
  RED, INK, MUTED, LINE, STEEL, MONO, SANS, SERIF,
} from "./ui";

const Scene11: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.1);
  const m1 = mk(marks, 1, 0.34);
  const m2 = mk(marks, 2, 0.58);
  const m3 = mk(marks, 3, 0.8);
  const head = seg(p, 0.03, 0.12);
  const grid = seg(p, 0.06, 0.4);
  const red = pop(seg(p, m2 - 0.03, m2 + 0.12));
  const cross = pop(seg(p, m0 + 0.04, m0 + 0.18));
  const hundred = easeOut(seg(p, m1 - 0.04, m1 + 0.16));
  const bottom = seg(p, m3, m3 + 0.14);
  const stamp = pop(seg(p, m0 + 0.16, m0 + 0.28));

  const COLS = 21;
  const ROWS = 13;
  const RED_INDEX = 6 * COLS + 13;

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} warm />
      <Signature opacity={0.4} />
      <Cap text="股权 · OWNERSHIP" x={150} y={310} opacity={head} size={22} />

      <div style={{ position: "absolute", left: 150, top: 352, opacity: head }}>
        <div style={{ fontFamily: SERIF, fontSize: 66, fontWeight: 700, color: INK, letterSpacing: 3 }}>华为不上市<span style={{ color: RED }}>。</span></div>
      </div>

      {/* 员工持股点阵 */}
      <div style={{ position: "absolute", left: 146, top: 500, width: 500, height: 330 }}>
        <div style={{ fontFamily: SANS, fontSize: 15, color: MUTED, letterSpacing: 2, opacity: grid }}>每一个点，是一名持股员工</div>
        <div style={{ position: "absolute", left: 0, top: 34, width: 490, height: 286 }}>
          {Array.from({ length: COLS * ROWS }, (_, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const t = clamp01(grid * 1.4 - (col + row) * 0.018);
            const isRed = i === RED_INDEX;
            return (
              <div
                key={i}
                style={{
                  position: "absolute", left: col * 23, top: row * 22,
                  width: isRed ? 18 : 11, height: isRed ? 18 : 11,
                  marginLeft: isRed ? -3 : 0, marginTop: isRed ? -3 : 0,
                  borderRadius: "50%",
                  background: isRed ? RED : "rgba(16,24,32,0.42)",
                  opacity: isRed ? (0.25 + 0.75 * red) : 0.35 + 0.55 * t,
                  transform: isRed ? `scale(${0.7 + 0.3 * red})` : "none",
                  boxShadow: isRed ? "0 0 0 7px rgba(207,10,44,0.16)" : "none",
                }}
              />
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 299, top: 176, width: 1, height: 162, background: RED, opacity: 0.7 * red }} />
        <div style={{ position: "absolute", left: 312, top: 334, opacity: red }}>
          <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, color: RED }}>0.65%</div>
          <div style={{ fontFamily: SANS, fontSize: 13, color: MUTED, letterSpacing: 1 }}>任正非 · 不到 1%</div>
        </div>
      </div>

      {/* 100% */}
      <div style={{ position: "absolute", left: 650, top: 520, opacity: seg(p, m1 - 0.06, m1 + 0.06) }}>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontFamily: MONO, fontSize: 150 * (0.8 + 0.2 * hundred), fontWeight: 700, color: RED, letterSpacing: -8, lineHeight: 0.9 }}>100</span>
          <span style={{ fontFamily: MONO, fontSize: 72, fontWeight: 700, color: RED }}>%</span>
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 30, color: INK, letterSpacing: 2 }}>由员工持有</div>
        <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: 2 }}>PRIVATELY OWNED BY EMPLOYEES</div>
      </div>

      {/* 不上市 / IPO 牌 */}
      <div style={{ position: "absolute", left: 650, top: 760, width: 300, height: 200, opacity: seg(p, m0, m0 + 0.12) }}>
        <div style={{ position: "absolute", inset: 0, border: `1.5px solid ${INK}`, background: "rgba(248,250,251,0.55)" }} />
        <div style={{ position: "absolute", left: 16, top: 12, fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: 2 }}>STOCK EXCHANGE / NONE</div>
        <div style={{ position: "absolute", left: 16, top: 44, fontFamily: MONO, fontSize: 82, fontWeight: 700, color: "rgba(16,24,32,0.16)", letterSpacing: -2 }}>IPO</div>
        <svg width="300" height="200" viewBox="0 0 300 200" style={{ position: "absolute", inset: 0 }}>
          <line x1="24" y1="60" x2="150" y2="150" stroke={RED} strokeWidth="4" opacity={cross} />
          <line x1="150" y1="60" x2="24" y2="150" stroke={RED} strokeWidth="4" opacity={cross} />
        </svg>
        <div style={{ position: "absolute", right: 14, bottom: 12, fontFamily: SERIF, fontSize: 22, color: MUTED, letterSpacing: 2 }}>没有季度财报</div>
      </div>
      <Stamp text="不上市" x={940} y={790} size={30} rotate={11} t={stamp} />

      <div style={{ position: "absolute", left: 150, top: 1000, width: 800, opacity: bottom }}>
        <div style={{ height: 1, background: LINE }} />
        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ fontFamily: SERIF, fontSize: 44, color: INK, letterSpacing: 2 }}>才敢把利润，一年一年投进研发</span>
          <span style={{ fontFamily: MONO, fontSize: 34, color: RED }}>→</span>
        </div>
        <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: 2 }}>NO QUARTERLY PRESSURE · LONG-TERM R&amp;D</div>
      </div>

      <div style={{ position: "absolute", left: 150, top: 1136, fontFamily: SERIF, fontSize: 26, color: MUTED, letterSpacing: 2, opacity: 0.8 * bottom }}>
        股权结构，决定了耐心有多长。
      </div>
    </AbsoluteFill>
  );
};

export default Scene11;
