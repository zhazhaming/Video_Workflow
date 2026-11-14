// Scene07 · 多重曝光：像用粗笔写小字，分几次描，多一次就多一次对不准
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Signature, seg, easeOut, pop, mk, clamp01,
  RED, INK, MUTED, LINE, STEEL, MONO, SANS, SERIF,
} from "./ui";

const Scene07: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m2 = mk(marks, 2, 0.66);
  const head = seg(p, 0.03, 0.12);
  const step = seg(p, 0.06, 0.58);
  const target = easeOut(seg(p, 0.18, 0.4));
  const drift = easeOut(seg(p, 0.3, m2 + 0.12));
  const warn = pop(seg(p, m2 - 0.02, m2 + 0.12));
  const combined = seg(p, 0.4, 0.72);

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <Signature opacity={0.34} />
      <Cap text="多重曝光 · MULTI-PATTERNING" x={150} y={310} opacity={head} size={21} />
      <div style={{ position: "absolute", left: 150, top: 348, opacity: head }}>
        <div style={{ fontFamily: SERIF, fontSize: 54, fontWeight: 700, color: INK, letterSpacing: 2 }}>一层图形，分几次描</div>
      </div>

      {/* 四张掩膜 */}
      <div style={{ position: "absolute", left: 150, top: 462, width: 360 }}>
        {Array.from({ length: 4 }, (_, i) => {
          const t = clamp01(step * 4 - i);
          const off = i * 9;
          return (
            <div key={i} style={{ position: "absolute", left: 0, top: i * 118, width: 360, height: 100, opacity: 0.25 + 0.75 * t, transform: `translateX(${(1 - t) * 18}px)` }}>
              <div style={{ position: "absolute", inset: 0, background: "rgba(248,250,251,0.7)", border: `1px solid ${i === 3 ? RED : "rgba(16,24,32,0.4)"}`, boxSizing: "border-box" }} />
              <div style={{ position: "absolute", left: 14, top: 12, fontFamily: MONO, fontSize: 10, color: i === 3 ? RED : MUTED, letterSpacing: 2 }}>MASK 0{i + 1}</div>
              <svg width="360" height="100" viewBox="0 0 360 100" style={{ position: "absolute", inset: 0 }}>
                {Array.from({ length: 13 }, (_, k) => (
                  <line key={k} x1={64 + k * 22 + off} y1="18" x2={64 + k * 22 + off} y2="84" stroke={i === 3 ? RED : STEEL} strokeWidth="4" opacity={0.55} />
                ))}
              </svg>
              <div style={{ position: "absolute", right: 12, top: 12, fontFamily: SANS, fontSize: 12, color: MUTED, letterSpacing: 2 }}>曝光 {i + 1}</div>
            </div>
          );
        })}
      </div>

      {/* 对准靶 */}
      <div style={{ position: "absolute", left: 596, top: 430, width: 340, height: 340, opacity: target }}>
        <svg width="340" height="340" viewBox="0 0 340 340" style={{ position: "absolute", inset: 0 }}>
          <circle cx="170" cy="170" r="140" fill="none" stroke="rgba(16,24,32,0.12)" strokeWidth="1" />
          <circle cx="170" cy="170" r="96" fill="none" stroke="rgba(16,24,32,0.2)" strokeWidth="1" strokeDasharray="4 7" />
          <line x1="10" y1="170" x2="330" y2="170" stroke="rgba(16,24,32,0.18)" strokeWidth="1" strokeDasharray="3 6" />
          <line x1="170" y1="10" x2="170" y2="330" stroke="rgba(16,24,32,0.18)" strokeWidth="1" strokeDasharray="3 6" />
          {Array.from({ length: 4 }, (_, i) => {
            const d = (i * 4 + 4) * drift;
            return (
              <g key={i} opacity={0.4 + 0.2 * i}>
                <line x1={170 - 70 + d} y1={170 - 70} x2={170 + 70 + d} y2={170 - 70} stroke={i === 3 ? RED : INK} strokeWidth="2" />
                <line x1={170 - 70} y1={170 - 70 + d} x2={170 - 70} y2={170 + 70 + d} stroke={i === 3 ? RED : INK} strokeWidth="2" />
                <line x1={170 - 70} y1={170 - 26 + d} x2={170 - 26} y2={170 - 26 + d} stroke={i === 3 ? RED : INK} strokeWidth="2" />
              </g>
            );
          })}
          <circle cx="170" cy="170" r="5" fill={RED} />
        </svg>
        <div style={{ position: "absolute", left: 18, bottom: -6, fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: 2 }}>ALIGNMENT / IDEAL vs ACTUAL</div>
        <div style={{ position: "absolute", right: -30, top: 60, opacity: warn, transform: `scale(${0.8 + 0.2 * warn}) rotate(-6deg)` }}>
          <div style={{ border: `2px solid ${RED}`, padding: "4px 10px", color: RED, fontFamily: SERIF, fontSize: 24, letterSpacing: 3 }}>对不准</div>
        </div>
      </div>

      {/* 叠加后的图形 */}
      <div style={{ position: "absolute", left: 150, top: 1010, width: 780, opacity: combined }}>
        <div style={{ fontFamily: SANS, fontSize: 15, color: MUTED, letterSpacing: 2 }}>四次曝光叠加后，线宽才够细</div>
        <div style={{ position: "absolute", left: 0, top: 34, width: 780, height: 64, background: "rgba(248,250,251,0.6)", border: `1px solid ${LINE}`, overflow: "hidden" }}>
          {Array.from({ length: 38 }, (_, i) => (
            <div key={i} style={{ position: "absolute", left: 8 + i * 20 + (i % 3) * 2, top: 8, width: 3, height: 48, background: i % 7 === 0 ? RED : "rgba(16,24,32,0.55)" }} />
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", left: 150, top: 1160, fontFamily: SERIF, fontSize: 30, color: INK, letterSpacing: 2, opacity: seg(p, m2 + 0.08, m2 + 0.22) }}>
        每多一次，就多一次误差<span style={{ color: RED }}>。</span>
      </div>
    </AbsoluteFill>
  );
};

export default Scene07;
