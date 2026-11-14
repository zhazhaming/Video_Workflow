// Scene06 · 研发强度：1797 亿、20.8%、十年 1.249 万亿
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Stamp, Signature, exitFade, mk, seg, easeOut, easeInOut, pop, clamp01,
  RED, INK, MUTED, LINE, STEEL, MONO, SANS, SERIF,
} from "./ui";

const Scene06: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = mk(marks, 1, 0.42);
  const m2 = mk(marks, 2, 0.66);
  const sweep = 0.208 * easeOut(seg(p, 0.06, 0.42));
  const count = 1797 * easeOut(seg(p, 0.06, 0.42));
  const pct = 20.8 * easeOut(seg(p, m1 - 0.04, m1 + 0.18));
  const blocks = seg(p, 0.4, 0.8);
  const total = 1.249 * easeOut(seg(p, m2, m2 + 0.22));
  const totalIn = seg(p, m2 - 0.06, m2 + 0.06);
  const stamp = pop(seg(p, 0.86, 0.95));

  const R = 200;
  const C = 2 * Math.PI * R;

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <Signature />
        <Cap text="研发强度 · 2024" x={150} y={330} opacity={seg(p, 0.02, 0.1)} />
        <div style={{ position: "absolute", left: 150, top: 372, fontFamily: SERIF, fontSize: 44, color: INK, opacity: seg(p, 0.02, 0.1) }}>
          把钱，投进未来
        </div>

        <div style={{ position: "absolute", left: 596, top: 470, width: 1, height: 640, background: "rgba(16,24,32,0.10)" }} />

        {/* 环形图 */}
        <svg width="600" height="600" viewBox="0 0 600 600" style={{ position: "absolute", left: 50, top: 500 }}>
          <g transform="translate(300,300)">
            <circle r={R} fill="none" stroke="rgba(16,24,32,0.10)" strokeWidth="38" />
            <circle
              r={R} fill="none" stroke={RED} strokeWidth="38" strokeLinecap="butt"
              pathLength={1} strokeDasharray="1" strokeDashoffset={1 - clamp01(sweep)}
              transform="rotate(-90)"
              opacity="0.94"
            />
            <circle r={R - 30} fill="none" stroke="rgba(16,24,32,0.14)" strokeWidth="1" />
            {Array.from({ length: 40 }, (_, i) => {
              const a = (i / 40) * Math.PI * 2 - Math.PI / 2;
              const r1 = R + 26;
              const r2 = i % 4 === 0 ? R + 42 : R + 34;
              const on = i / 40 <= sweep;
              return (
                <line key={i} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2} stroke={on ? RED : "rgba(16,24,32,0.22)"} strokeWidth="1.5" opacity={on ? 0.85 : 0.4} />
              );
            })}
          </g>
        </svg>

        <div style={{ position: "absolute", left: 150, top: 700, width: 400, textAlign: "center", opacity: seg(p, 0.05, 0.14) }}>
          <div style={{ fontFamily: SANS, fontSize: 20, color: MUTED, letterSpacing: 4 }}>研发投入</div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6, marginTop: 0 }}>
            <span style={{ fontFamily: MONO, fontSize: 100, fontWeight: 700, color: INK, letterSpacing: -6 }}>{Math.round(count)}</span>
            <span style={{ fontFamily: SERIF, fontSize: 32, color: INK }}>亿元</span>
          </div>
          <div style={{ marginTop: 4, fontFamily: MONO, fontSize: 12, color: MUTED, letterSpacing: 2 }}>CNY 179.7 BILLION</div>
        </div>

        <div style={{ position: "absolute", left: 150, top: 1030, opacity: seg(p, m1 - 0.06, m1 + 0.04) }}>
          <div style={{ fontFamily: SANS, fontSize: 20, color: MUTED, letterSpacing: 3 }}>占全年营收</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
            <span style={{ fontFamily: MONO, fontSize: 132, fontWeight: 700, color: RED, letterSpacing: -8, lineHeight: 0.95 }}>{pct.toFixed(1)}</span>
            <span style={{ fontFamily: MONO, fontSize: 56, fontWeight: 700, color: RED }}>%</span>
          </div>
        </div>

        {/* 十年十块 */}
        <div style={{ position: "absolute", left: 620, top: 500, width: 360, opacity: seg(p, 0.36, 0.46) }}>
          <div style={{ fontFamily: SANS, fontSize: 19, color: MUTED, letterSpacing: 3 }}>十年研发投入 · 一年一块</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 66px)", gap: 8, marginTop: 18 }}>
            {Array.from({ length: 10 }, (_, i) => {
              const t = clamp01(blocks * 10 - i);
              return (
                <div
                  key={i}
                  style={{
                    width: 66, height: 66, background: i === 9 ? RED : "rgba(62,90,107,0.26)",
                    border: `1.5px solid ${i === 9 ? RED : "rgba(16,24,32,0.38)"}`, boxSizing: "border-box",
                    opacity: 0.2 + 0.8 * t, transform: `scale(${0.72 + 0.28 * t})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: MONO, fontSize: 15, color: i === 9 ? "#fff" : INK,
                  }}
                >
                  {2015 + i}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 26, opacity: totalIn, transform: `translateY(${(1 - totalIn) * 10}px)` }}>
            <div style={{ fontFamily: SANS, fontSize: 19, color: MUTED, letterSpacing: 2 }}>十年累计</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontFamily: MONO, fontSize: 96, fontWeight: 700, color: RED, letterSpacing: -5 }}>{total.toFixed(3)}</span>
              <span style={{ fontFamily: SERIF, fontSize: 32, color: INK }}>万亿</span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: MUTED, letterSpacing: 1 }}>CNY 1.249 TRILLION</div>
          </div>
        </div>

        <div style={{ position: "absolute", left: 620, top: 1000, width: 320, opacity: 0.9 * seg(p, 0.55, 0.7) }}>
          <div style={{ height: 1, background: LINE, marginBottom: 14 }} />
          <div style={{ fontFamily: SANS, fontSize: 17, color: MUTED, lineHeight: 1.8, letterSpacing: 1 }}>
            每年把超过 10% 的营收
            <br />
            重新投进研发
          </div>
          <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: 2 }}>R&amp;D / REVENUE &gt; 10%</div>
        </div>

        <Stamp text="20.8%" x={372} y={470} size={42} rotate={-8} t={stamp} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene06;
