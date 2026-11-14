// Scene05 · 供血：汽车一年 +72% → 不上市 / 100% 员工持有
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Dot, MONO, INK, MUTED, seg, easeOut, mk, clamp01 } from "./ui";

const Scene05: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = mk(marks, 1, 0.46);
  const grow = easeOut(seg(p, 0.06, 0.4));
  const pct = Math.round(72 * clamp01(seg(p, 0.1, 0.42)));
  const own = easeOut(seg(p, 0.5, 0.74));
  const fadeOld = 1 - own;

  const baseX = 300;
  const baseY = 980;
  const barW = 210;
  const maxH = 430;
  const h = maxH * (0.18 + 0.82 * grow);

  const cx = 540;
  const cy = 780;
  const r = 170;
  const C = 2 * Math.PI * r;
  const dash = (own > 0 ? 1 : 0) * C * own;

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />

      {/* 第一阶段：汽车 +72% */}
      <div style={{ opacity: fadeOld }}>
        <div style={{ position: "absolute", left: baseX, top: 430, fontFamily: MONO, fontSize: 18, color: MUTED, letterSpacing: 3 }}>
          AUTO / 2025 · CNY 100M
        </div>

        <div style={{ position: "absolute", left: baseX, top: baseY - maxH - 40, width: barW, height: maxH + 40, borderBottom: `2px solid rgba(16,24,32,0.3)` }}>
          <div style={{ position: "absolute", left: 0, bottom: 0, width: barW, height: h, background: accent, opacity: 0.92 }} />
          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: h + 18,
              fontFamily: MONO,
              fontSize: 54,
              fontWeight: 700,
              color: INK,
              letterSpacing: -2,
              opacity: easeOut(seg(p, 0.2, 0.42)),
            }}
          >
            {Math.round(450 * grow)}
          </div>
        </div>

        <div style={{ position: "absolute", left: baseX + barW + 70, top: 560, opacity: easeOut(seg(p, 0.12, 0.36)) }}>
          <div style={{ fontFamily: MONO, fontSize: 20, color: MUTED, letterSpacing: 3 }}>YOY</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
            <span style={{ fontFamily: MONO, fontSize: 116, fontWeight: 700, color: accent, letterSpacing: -5 }}>+{pct}</span>
            <span style={{ fontFamily: MONO, fontSize: 46, fontWeight: 700, color: accent }}>%</span>
          </div>
          <div style={{ marginTop: 16, width: 160, height: 1, background: "rgba(16,24,32,0.25)" }} />
          <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 16, color: MUTED, letterSpacing: 2 }}>NOT PHONE ONLY</div>
        </div>

        <div style={{ position: "absolute", left: baseX - 40, top: baseY, width: 620, height: 1, background: "rgba(16,24,32,0.3)" }} />
        <div style={{ position: "absolute", left: baseX - 40, top: baseY + 14, fontFamily: MONO, fontSize: 14, color: MUTED, letterSpacing: 2, opacity: 0.8 }}>
          0
        </div>
        <Dot x={baseX + barW / 2} y={baseY - h} r={6} color={accent} halo opacity={grow} />
      </div>

      {/* 第二阶段：100% 员工持有 */}
      <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1080 1920" opacity={own}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(16,24,32,0.12)" strokeWidth={26} />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth={26}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: cy - 62, textAlign: "center", opacity: own }}>
        <span style={{ fontFamily: MONO, fontSize: 118, fontWeight: 700, color: INK, letterSpacing: -4 }}>100</span>
        <span style={{ fontFamily: MONO, fontSize: 44, fontWeight: 700, color: INK }}>%</span>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: cy + 70, textAlign: "center", fontFamily: MONO, fontSize: 20, color: MUTED, letterSpacing: 4, opacity: own }}>
        EMPLOYEE OWNED
      </div>

      <div style={{ position: "absolute", left: 300, top: 1080, opacity: easeOut(seg(p, m1, m1 + 0.16)) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: MONO, fontSize: 20, color: accent, letterSpacing: 2 }}>
          <span style={{ width: 40, height: 2, background: accent, display: "inline-block" }} />
          NO IPO / NO QUARTERLY
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene05;
