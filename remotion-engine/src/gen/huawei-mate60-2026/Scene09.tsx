// Scene09 · 研发：2025 年 1923 亿、占营收 21.8%、十年 1.382 万亿
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Stamp, Signature, seg, easeOut, easeInOut, pop, mk, clamp01,
  RED, INK, MUTED, LINE, STEEL, MONO, SANS, SERIF,
} from "./ui";

const Scene09: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = mk(marks, 1, 0.4);
  const m2 = mk(marks, 2, 0.64);
  const head = seg(p, 0.03, 0.12);
  const count = 1923 * easeOut(seg(p, 0.06, 0.4));
  const sweep = 0.218 * easeOut(seg(p, m1 - 0.04, m1 + 0.2));
  const pct = 21.8 * easeOut(seg(p, m1 - 0.02, m1 + 0.18));
  const total = 1.382 * easeOut(seg(p, m2 - 0.02, m2 + 0.2));
  const bars = seg(p, 0.36, 0.78);

  const R = 118;
  const heights = [40, 48, 56, 64, 72, 84, 94, 106, 118, 132];

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <Signature opacity={0.38} />
      <Cap text="2025 · 研发" x={150} y={310} opacity={head} size={23} />
      <div style={{ position: "absolute", left: 150, top: 350, opacity: head }}>
        <div style={{ fontFamily: SERIF, fontSize: 46, color: INK, letterSpacing: 3 }}>钱没有消失，只是换了地方</div>
      </div>

      <div style={{ position: "absolute", left: 146, top: 452, opacity: seg(p, 0.04, 0.12) }}>
        <div style={{ fontFamily: SANS, fontSize: 18, color: MUTED, letterSpacing: 3 }}>2025 年研发投入</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
          <span style={{ fontFamily: MONO, fontSize: 172, fontWeight: 700, color: RED, letterSpacing: -8, lineHeight: 0.95 }}>{Math.round(count)}</span>
          <span style={{ fontFamily: SERIF, fontSize: 40, color: INK }}>亿元</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: 2 }}>CNY 192.3 BILLION</div>
      </div>

      {/* 21.8% 环形 */}
      <div style={{ position: "absolute", left: 672, top: 430, width: 300, height: 300, opacity: seg(p, m1 - 0.08, m1 + 0.04) }}>
        <svg width="300" height="300" viewBox="0 0 300 300">
          <g transform="translate(150,150)">
            <circle r={R} fill="none" stroke="rgba(16,24,32,0.1)" strokeWidth="26" />
            <circle r={R} fill="none" stroke={RED} strokeWidth="26" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - clamp01(sweep)} transform="rotate(-90)" />
            <circle r={R - 26} fill="none" stroke="rgba(16,24,32,0.14)" strokeWidth="1" />
            {Array.from({ length: 36 }, (_, i) => {
              const a = (i / 36) * Math.PI * 2 - Math.PI / 2;
              const on = i / 36 <= sweep;
              return <line key={i} x1={Math.cos(a) * (R + 22)} y1={Math.sin(a) * (R + 22)} x2={Math.cos(a) * (R + (i % 3 === 0 ? 34 : 28))} y2={Math.sin(a) * (R + (i % 3 === 0 ? 34 : 28))} stroke={on ? RED : "rgba(16,24,32,0.2)"} strokeWidth="1.3" opacity={on ? 0.9 : 0.4} />;
            })}
          </g>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontFamily: MONO, fontSize: 78, fontWeight: 700, color: INK, letterSpacing: -4 }}>{pct.toFixed(1)}</span>
            <span style={{ fontFamily: MONO, fontSize: 34, fontWeight: 700, color: RED }}>%</span>
          </div>
          <div style={{ fontFamily: SANS, fontSize: 14, color: MUTED, letterSpacing: 2 }}>占营收</div>
        </div>
      </div>

      <div style={{ position: "absolute", left: 680, top: 742, fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: 2, opacity: seg(p, m1, m1 + 0.12) }}>
        R&amp;D / REVENUE · 10 YEARS &gt; 10%
      </div>

      {/* 十年累计 */}
      <div style={{ position: "absolute", left: 150, top: 800, opacity: seg(p, m2 - 0.04, m2 + 0.08) }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontFamily: SANS, fontSize: 20, color: MUTED, letterSpacing: 2 }}>十年累计</span>
          <span style={{ fontFamily: MONO, fontSize: 94, fontWeight: 700, color: INK, letterSpacing: -5 }}>{total.toFixed(3)}</span>
          <span style={{ fontFamily: SERIF, fontSize: 36, color: INK }}>万亿</span>
        </div>
      </div>

      {/* 十年柱 */}
      <div style={{ position: "absolute", left: 150, top: 1010, width: 780, height: 170, opacity: seg(p, 0.3, 0.42) }}>
        <div style={{ position: "absolute", left: 0, bottom: 28, width: 780, height: 1, background: LINE }} />
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 140 }}>
          {heights.map((h, i) => {
            const t = clamp01(bars * 10 - i);
            return (
              <div key={i} style={{ width: 58, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 40, height: h * t, background: i === 9 ? RED : "rgba(62,90,107,0.3)", border: `1px solid ${i === 9 ? RED : "rgba(16,24,32,0.22)"}` }} />
                <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 9, color: MUTED, letterSpacing: 0 }}>{2016 + i}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene09;
