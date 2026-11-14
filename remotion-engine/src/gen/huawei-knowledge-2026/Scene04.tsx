// Scene04 · 1993：自研交换机接通，利润回流研发
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Stamp, Signature, GhostYear, exitFade, mk, seg, easeOut, easeInOut, pop, qPoint, clamp01,
  RED, INK, MUTED, LINE, STEEL, MONO, SANS, SERIF,
} from "./ui";

const BUILDINGS = [
  { x: 590, w: 54, h: 150 },
  { x: 650, w: 44, h: 210 },
  { x: 700, w: 62, h: 120 },
  { x: 768, w: 40, h: 260 },
  { x: 814, w: 58, h: 170 },
  { x: 878, w: 46, h: 220 },
];

const Scene04: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = mk(marks, 1, 0.35);
  const m2 = mk(marks, 2, 0.68);
  const rack = easeOut(seg(p, 0.02, 0.16));
  const slots = seg(p, 0.08, 0.34);
  const city = easeInOut(seg(p, m1 - 0.04, m1 + 0.22));
  const pulses = seg(p, m1, m1 + 0.2);
  const coins = easeInOut(seg(p, m2 - 0.06, m2 + 0.24));
  const barFill = easeOut(seg(p, m2, m2 + 0.26));
  const stamp = pop(seg(p, m1 + 0.16, m1 + 0.28));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <Signature />
        <GhostYear text="1993" x={470} y={640} size={300} opacity={0.05} />

        <Cap text="1993 · 第一台自研交换机" x={150} y={330} opacity={seg(p, 0.02, 0.1)} />
        <div style={{ position: "absolute", left: 150, top: 372, fontFamily: SERIF, fontSize: 42, color: INK, opacity: seg(p, 0.02, 0.1) }}>
          从机柜，到一座城
        </div>

        {/* 机柜 */}
        <div style={{ position: "absolute", left: 150, top: 462, width: 300, height: 620, opacity: rack, transform: `translateY(${(1 - rack) * 26}px)` }}>
          <div style={{ position: "absolute", left: 14, top: 0, width: 272, height: 36, background: RED, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: MONO, fontSize: 21, fontWeight: 700, letterSpacing: 4 }}>
            C&amp;C08
          </div>
          <div style={{ position: "absolute", left: 0, top: 36, width: 300, height: 584, background: "rgba(242,246,248,0.94)", border: `3px solid ${INK}`, boxSizing: "border-box", boxShadow: "0 20px 40px rgba(16,24,32,0.14)" }} />
          <div style={{ position: "absolute", left: 0, top: 36, width: 6, height: 584, background: RED, opacity: 0.8 }} />
          {Array.from({ length: 8 }, (_, i) => {
            const on = clamp01(seg(slots, i * 0.05, i * 0.05 + 0.12));
            const blink = 0.45 + 0.55 * Math.abs(Math.sin(p * 26 + i * 1.7));
            return (
              <div key={i} style={{ position: "absolute", left: 16, top: 54 + i * 68, width: 268, height: 56, background: "rgba(16,24,32,0.07)", border: `1.5px solid rgba(16,24,32,0.22)`, boxSizing: "border-box", opacity: on }}>
                <div style={{ position: "absolute", left: 14, top: 10, fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: 1 }}>SLOT {String(i + 1).padStart(2, "0")}</div>
                <div style={{ position: "absolute", left: 14, top: 29, width: 130, height: 5, backgroundImage: `repeating-linear-gradient(90deg, ${INK} 0 3px, transparent 3px 9px)`, opacity: 0.35 }} />
                <div style={{ position: "absolute", right: 18, top: 16, width: 9, height: 9, borderRadius: "50%", background: blink > 0.55 ? RED : "rgba(207,10,44,0.25)" }} />
                <div style={{ position: "absolute", right: 18, top: 33, width: 9, height: 9, borderRadius: "50%", background: blink < 0.5 ? STEEL : "rgba(62,90,107,0.2)" }} />
              </div>
            );
          })}
          <div style={{ position: "absolute", left: 20, bottom: 20, fontFamily: SANS, fontSize: 14, color: MUTED, letterSpacing: 2 }}>数字程控交换机</div>
        </div>

        {/* 城市 */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: city }}>
          <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
            <line x1="540" y1="1128" x2="960" y2="1128" stroke={INK} strokeWidth="2" opacity="0.45" />
            {BUILDINGS.map((b, i) => {
              const y = 1128 - b.h;
              const reveal = easeInOut(seg(city, i * 0.05, 0.4 + i * 0.05));
              return (
                <g key={i} opacity={reveal}>
                  <rect x={b.x} y={y} width={b.w} height={b.h} fill="rgba(62,90,107,0.13)" stroke={STEEL} strokeWidth="2.2" />
                  {Array.from({ length: Math.floor(b.h / 34) }, (_, r) =>
                    Array.from({ length: 2 }, (_, c) => (
                      <rect
                        key={`${r}-${c}`}
                        x={b.x + 10 + c * 22}
                        y={y + 18 + r * 34}
                        width="10"
                        height="12"
                        fill={((i + r + c) % 4 === 0) ? RED : "rgba(16,24,32,0.18)"}
                        opacity={0.75 + 0.25 * Math.sin(p * 6 + i + r)}
                      />
                    )),
                  )}
                  <line x1={b.x + b.w / 2} y1={y} x2={b.x + b.w / 2} y2={y - 16} stroke={STEEL} strokeWidth="1.4" />
                  <circle cx={b.x + b.w / 2} cy={y - 18} r="3" fill={RED} opacity="0.7" />
                </g>
              );
            })}
            {/* 从机柜到城市的信号线 */}
            {[0, 1, 2].map((k) => {
              const x2 = 600 + k * 130;
              const y2 = 1128 - BUILDINGS[k * 2 + 1].h;
              const d = `M 428 ${760 + k * 40} Q ${500 + k * 30} ${620 - k * 20} ${x2} ${y2}`;
              const tt = ((p * 1.6 + k * 0.33) % 1);
              const pt = qPoint(428, 760 + k * 40, x2, y2, 150, tt);
              return (
                <g key={k} opacity={pulses}>
                  <path d={d} fill="none" stroke={RED} strokeWidth="1.6" strokeDasharray="4 7" opacity="0.4" />
                  <circle cx={pt.x} cy={pt.y} r="5" fill={RED} opacity="0.9" />
                  <circle cx={pt.x} cy={pt.y} r="12" fill="none" stroke={RED} strokeWidth="1" opacity="0.35" />
                </g>
              );
            })}
          </svg>
        </div>

        {/* 利润 → 研发 */}
        <div style={{ position: "absolute", left: 596, top: 356, width: 382, padding: "20px 22px", background: "rgba(248,250,251,0.9)", border: `1.5px solid rgba(16,24,32,0.25)`, boxShadow: "0 16px 34px rgba(16,24,32,0.10)", opacity: seg(p, m2 - 0.1, m2), boxSizing: "border-box" }}>
          <div style={{ fontFamily: SANS, fontSize: 19, color: MUTED, letterSpacing: 3 }}>利润的去向</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <span style={{ fontFamily: SERIF, fontSize: 34, color: INK, fontWeight: 700, letterSpacing: 2 }}>研发</span>
            <span style={{ fontFamily: MONO, fontSize: 16, color: RED, letterSpacing: 1 }}>R&amp;D</span>
          </div>
          <div style={{ marginTop: 12, width: 336, height: 28, border: `2px solid ${INK}`, background: "rgba(248,250,251,0.7)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${barFill * 100}%`, background: `linear-gradient(90deg, ${RED}, ${RED}CC)` }} />
            <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(90deg, transparent 0 28px, rgba(248,250,251,0.35) 28px 30px)` }} />
          </div>
          <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 13, color: MUTED, letterSpacing: 1 }}>每年 &gt;10% 营收投入研发</div>
        </div>

        {/* 硬币流 */}
        {[0, 1, 2, 3].map((k) => {
          const tt = clamp01(coins * 1.35 - k * 0.16);
          const pt = qPoint(470, 980, 720, 520, 150, tt);
          return (
            <div
              key={k}
              style={{
                position: "absolute", left: pt.x - 9, top: pt.y - 9, width: 18, height: 18, borderRadius: "50%",
                background: "#F2C14E", border: `1.5px solid ${INK}`, opacity: tt > 0.02 && tt < 0.99 ? 1 : 0,
                boxShadow: "0 4px 10px rgba(60,52,36,0.18)",
              }}
            />
          );
        })}

        <Stamp text="接通" x={430} y={1020} size={44} rotate={-10} t={stamp} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene04;
