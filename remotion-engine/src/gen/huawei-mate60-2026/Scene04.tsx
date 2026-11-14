// Scene04 · 研发 1923 亿 / 占营收 21.8%（环形进度）
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Counter, MONO, SANS, INK, MUTED, seg, easeOut, easeInOut } from "./ui";

const Scene04: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const grow = easeInOut(seg(p, 0.06, 0.72));
  const money = easeOut(seg(p, 0.08, 0.7));
  const ringIn = easeOut(seg(p, 0.02, 0.18));

  const cx = 540;
  const cy = 700;
  const r = 212;
  const w = 26;
  const C = 2 * Math.PI * r;
  const pct = 21.8;
  const dash = (pct / 100) * C * grow;

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />

      <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1080 1920">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(16,24,32,0.10)" strokeWidth={w} opacity={ringIn} />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth={w}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          opacity={ringIn}
        />
        {/* 刻度：每 10% 一格 */}
        {Array.from({ length: 36 }, (_, i) => {
          const a = (i / 36) * Math.PI * 2 - Math.PI / 2;
          const r1 = r + w / 2 + 12;
          const r2 = r1 + (i % 9 === 0 ? 16 : 8);
          return (
            <line
              key={i}
              x1={cx + Math.cos(a) * r1}
              y1={cy + Math.sin(a) * r1}
              x2={cx + Math.cos(a) * r2}
              y2={cy + Math.sin(a) * r2}
              stroke="rgba(16,24,32,0.28)"
              strokeWidth={i % 9 === 0 ? 2 : 1}
              opacity={ringIn}
            />
          );
        })}
      </svg>

      <div style={{ position: "absolute", left: 0, right: 0, top: cy - 78, display: "flex", justifyContent: "center" }}>
        <Counter value={1923 * money} x={0} y={0} size={128} suffix="亿" suffixSize={40} color={INK} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: cy + 78, textAlign: "center", fontFamily: MONO, fontSize: 22, color: MUTED, letterSpacing: 3 }}>
        R&amp;D / 2025
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 1010, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 14 }}>
        <span style={{ fontFamily: MONO, fontSize: 96, fontWeight: 700, color: accent, letterSpacing: -3 }}>{(pct * grow).toFixed(1)}</span>
        <span style={{ fontFamily: MONO, fontSize: 34, fontWeight: 700, color: accent }}>%</span>
        <span style={{ fontFamily: SANS, fontSize: 24, color: MUTED }}>of revenue</span>
      </div>
    </AbsoluteFill>
  );
};

export default Scene04;
