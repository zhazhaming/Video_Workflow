// Scene03 · 从代理到自研：卖别人的交换机，随时会被卡住
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Stamp, Signature, GhostYear, exitFade, seg, easeOut, easeInOut, easeBack, pop,
  RED, INK, MUTED, LINE, STEEL, MONO, SANS, SERIF,
} from "./ui";

const Scene03: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = marks && marks[1] ? marks[1].start : 0.52;
  const boxes = easeOut(seg(p, 0.02, 0.12));
  const run = seg(p, 0.02, m1 - 0.02);
  const board = easeInOut(seg(p, m1 - 0.04, m1 + 0.34));
  const lock = pop(seg(p, 0.22, 0.34));
  const arrow = easeOut(seg(p, m1 - 0.1, m1 + 0.06));
  const stamp = pop(seg(p, m1 + 0.24, m1 + 0.34));
  const fadeTop = 1 - 0.55 * seg(p, m1, m1 + 0.2);

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <Signature />
        <GhostYear text="代理" x={640} y={390} size={190} opacity={0.05} />

        <Cap text="起初 · 代理" x={150} y={330} opacity={seg(p, 0.02, 0.1)} />
        <div style={{ position: "absolute", left: 150, top: 372, fontFamily: SERIF, fontSize: 44, color: INK, opacity: seg(p, 0.02, 0.1) }}>
          卖别人的交换机
        </div>

        {/* 传送带 */}
        <div style={{ position: "absolute", left: 150, top: 800, width: 760, opacity: boxes * fadeTop }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 8, background: "rgba(16,24,32,0.22)" }} />
          <div
            style={{
              position: "absolute", left: 0, top: 8, width: 760, height: 14,
              backgroundImage: `repeating-linear-gradient(90deg, ${INK} 0 10px, transparent 10px 26px)`,
              opacity: 0.3, backgroundPositionX: -run * 120,
            }}
          />
          {[0, 1, 2, 3, 4].map((i) => {
            const x = 20 + i * 150 - (1 - boxes) * 80 - run * 34;
            const y = -136 - (i % 2) * 12;
            const tagRot = i % 2 === 0 ? -3 : 2;
            return (
              <div key={i} style={{ position: "absolute", left: x, top: y, width: 140, height: 112, opacity: boxes }}>
                <div style={{ position: "absolute", inset: 0, background: "#EFE6D4", border: `2.5px solid ${INK}`, boxSizing: "border-box", boxShadow: "0 10px 20px rgba(60,52,36,0.12)" }} />
                <div style={{ position: "absolute", left: 0, top: 30, width: "100%", height: 2, background: INK, opacity: 0.22 }} />
                <div style={{ position: "absolute", left: 12, top: 42, fontFamily: SANS, fontSize: 17, color: INK, fontWeight: 700, letterSpacing: 2 }}>交换机</div>
                <div style={{ position: "absolute", left: 12, top: 68, fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: 1 }}>IMPORTED</div>
                <div style={{ position: "absolute", right: -16, top: -14, transform: `rotate(${tagRot}deg)`, background: "#FBF7EC", border: `1.5px solid ${RED}`, color: RED, fontFamily: SANS, fontSize: 12, padding: "3px 7px", letterSpacing: 1 }}>
                  利润薄
                </div>
              </div>
            );
          })}
        </div>

        {/* 锁 */}
        <div style={{ position: "absolute", left: 798, top: 536, opacity: lock, transform: `scale(${0.8 + 0.2 * lock})` }}>
          <svg width="96" height="118" viewBox="0 0 74 92">
            <path d="M18 40 L18 26 Q18 6 37 6 Q56 6 56 26 L56 40" fill="none" stroke={INK} strokeWidth="6" />
            <rect x="8" y="40" width="58" height="44" rx="6" fill={RED} />
            <circle cx="37" cy="60" r="4.5" fill="#FBF7EC" />
            <rect x="34.5" y="62" width="5" height="12" fill="#FBF7EC" />
          </svg>
          <div style={{ position: "absolute", left: -178, top: 24, width: 170, fontFamily: SANS, fontSize: 19, color: RED, letterSpacing: 2, textAlign: "right", fontWeight: 700 }}>
            受制于人
          </div>
          <div style={{ position: "absolute", left: -8, top: 34, width: 8, height: 1, background: RED }} />
        </div>

        {/* 转折箭头 */}
        <div style={{ position: "absolute", left: 510, top: 842, opacity: arrow, transform: `translateY(${(1 - arrow) * 14}px)` }}>
          <div style={{ width: 3, height: 84, background: RED, margin: "0 auto" }} />
          <div style={{ width: 0, height: 0, borderLeft: "11px solid transparent", borderRight: "11px solid transparent", borderTop: `16px solid ${RED}`, margin: "0 auto" }} />
          <div style={{ marginTop: 8, fontFamily: SANS, fontSize: 17, color: RED, letterSpacing: 3, whiteSpace: "nowrap" }}>自己造</div>
        </div>

        {/* 自研主板 */}
        <div style={{ position: "absolute", left: 150, top: 946, width: 760, opacity: 0.1 + 0.9 * seg(p, m1 - 0.04, m1 + 0.06) }}>
          <div style={{ fontFamily: SANS, fontSize: 20, color: MUTED, letterSpacing: 3, marginBottom: 14 }}>
            自研主板 · 从设计到量产
          </div>
          <div style={{ position: "relative", width: 760, height: 260, background: "rgba(16,24,32,0.035)", border: `1.5px solid ${LINE}`, boxSizing: "border-box" }}>
            <svg width="760" height="260" viewBox="0 0 760 260">
              <g fill="none" stroke={STEEL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {[
                  "M40 60 L160 60 L200 100 L340 100",
                  "M40 96 L120 96 L150 126 L300 126",
                  "M720 60 L600 60 L560 100 L430 100",
                  "M720 96 L640 96 L610 126 L470 126",
                  "M40 200 L180 200 L210 170 L300 170",
                  "M720 200 L580 200 L550 170 L470 170",
                ].map((d, i) => (
                  <path key={i} d={d} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - easeInOut(seg(board, i * 0.06, 0.6 + i * 0.06))} opacity={0.75} />
                ))}
                <rect x="300" y="66" width="150" height="112" rx="4" stroke={INK} strokeWidth="2.6" fill="rgba(207,10,44,0.04)" />
                <rect x="330" y="94" width="90" height="56" rx="3" stroke={RED} strokeWidth="1.6" fill="none" />
                <text x="375" y="128" textAnchor="middle" fontFamily={MONO} fontSize="17" fill={INK} opacity="0.8">SoC</text>
                {Array.from({ length: 6 }, (_, i) => (
                  <g key={i}>
                    <line x1={318 + i * 22} y1="66" x2={318 + i * 22} y2="50" stroke={INK} strokeWidth="2" />
                    <line x1={318 + i * 22} y1="178" x2={318 + i * 22} y2="194" stroke={INK} strokeWidth="2" />
                  </g>
                ))}
                {[
                  [220, 176], [250, 176], [490, 176], [520, 176],
                ].map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r="7" fill="none" stroke={RED} strokeWidth="2" opacity="0.7" />
                ))}
                <rect x="40" y="150" width="70" height="26" rx="3" stroke={STEEL} strokeWidth="2" />
                <rect x="650" y="150" width="70" height="26" rx="3" stroke={STEEL} strokeWidth="2" />
              </g>
            </svg>
            <div style={{ position: "absolute", left: 20, bottom: 12, fontFamily: MONO, fontSize: 12, color: MUTED, letterSpacing: 2, opacity: 0.8 }}>
              R&D BOARD / REV.01
            </div>
          </div>
        </div>

        <Stamp text="自己造" x={720} y={1010} size={44} rotate={-8} t={stamp} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene03;
