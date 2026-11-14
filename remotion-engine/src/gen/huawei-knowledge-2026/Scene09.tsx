// Scene09 · 收入结构：通信 3699 亿、消费者 3390 亿、汽车一年 4.7 倍
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Signature, exitFade, mk, seg, easeOut, easeInOut, pop, clamp01,
  RED, INK, MUTED, LINE, MONO, SANS, SERIF,
} from "./ui";

const ROWS = [
  { name: "通信设备", value: 3699, pct: "42.9%", color: INK },
  { name: "消费者业务", value: 3390, pct: "39.3%", color: RED },
  { name: "智能汽车", value: 264, pct: "3.1%", color: "#B7802A" },
];

const Scene09: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m2 = mk(marks, 2, 0.66);
  const stack = easeInOut(seg(p, 0.02, 0.26));
  const rows = seg(p, 0.16, 0.42);
  const auto = pop(seg(p, m2 - 0.04, m2 + 0.12));
  const maxW = 380;

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <Signature />
        <Cap text="收入结构 · 2024" x={150} y={330} opacity={seg(p, 0.02, 0.1)} />
        <div style={{ position: "absolute", left: 150, top: 372, fontFamily: SERIF, fontSize: 44, color: INK, opacity: seg(p, 0.02, 0.1) }}>
          钱，从三个方向来
        </div>

        <div style={{ position: "absolute", right: 150, top: 372, textAlign: "right", opacity: seg(p, 0.04, 0.14) }}>
          <div style={{ fontFamily: SANS, fontSize: 17, color: MUTED, letterSpacing: 3 }}>2024 总营收</div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 5 }}>
            <span style={{ fontFamily: MONO, fontSize: 56, fontWeight: 700, color: INK, letterSpacing: -3 }}>8621</span>
            <span style={{ fontFamily: SERIF, fontSize: 24, color: INK }}>亿元</span>
          </div>
        </div>

        {/* 100% 堆叠条 */}
        <div style={{ position: "absolute", left: 150, top: 500, width: 760, height: 64, display: "flex", overflow: "hidden", opacity: seg(p, 0.02, 0.1), background: "rgba(16,24,32,0.06)" }}>
          {[
            { w: 0.429, color: INK, label: "通信 43%" },
            { w: 0.393, color: RED, label: "消费者 39%" },
            { w: 0.178, color: "#8FA6B4", label: "其他 18%" },
          ].map((s, i) => {
            const t = clamp01(stack * 1.6 - i * 0.22);
            return (
              <div key={i} style={{ width: `${760 * s.w * t}px`, height: 64, background: s.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: SANS, fontSize: 16, letterSpacing: 2, whiteSpace: "nowrap", overflow: "hidden" }}>
                {s.label}
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 150, top: 580, fontFamily: MONO, fontSize: 12, color: MUTED, letterSpacing: 2, opacity: seg(p, 0.22, 0.3) }}>
          TOTAL REVENUE · CNY 862.1 BILLION
        </div>

        {/* 三行拆解 */}
        {ROWS.map((r, i) => {
          const t = clamp01(rows * 3 - i);
          const w = (r.value / 3699) * maxW * easeOut(seg(t, 0, 0.7));
          const count = r.value * easeOut(seg(t, 0, 0.7));
          return (
            <div key={r.name} style={{ position: "absolute", left: 150, top: 700 + i * 128, width: 780, opacity: 0.22 + 0.78 * t }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                <span style={{ fontFamily: SANS, fontSize: 25, color: INK, letterSpacing: 2, width: 150 }}>{r.name}</span>
                <span style={{ fontFamily: MONO, fontSize: 50, fontWeight: 700, color: r.color, letterSpacing: -2 }}>{Math.round(count)}</span>
                <span style={{ fontFamily: SERIF, fontSize: 22, color: INK }}>亿元</span>
                <span style={{ fontFamily: MONO, fontSize: 14, color: MUTED, letterSpacing: 1 }}>{r.pct}</span>
              </div>
              <div style={{ marginTop: 12, marginLeft: 164, width: maxW, height: 14, background: "rgba(16,24,32,0.07)" }}>
                <div style={{ width: w, height: 14, background: r.color }} />
              </div>
            </div>
          );
        })}

        {/* 汽车增速 */}
        <div style={{ position: "absolute", left: 560, top: 946, opacity: auto, transform: `translateY(${(1 - auto) * 12}px) scale(${0.9 + 0.1 * auto})` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 0, height: 0, borderLeft: "12px solid transparent", borderRight: "12px solid transparent", borderBottom: `19px solid ${RED}` }} />
            <span style={{ fontFamily: MONO, fontSize: 60, fontWeight: 700, color: RED, letterSpacing: -3 }}>4.7×</span>
          </div>
          <div style={{ fontFamily: SANS, fontSize: 16, color: MUTED, letterSpacing: 2, marginLeft: 34 }}>一年增长</div>
        </div>

        <div style={{ position: "absolute", left: 150, top: 1130, opacity: 0.95 * seg(p, 0.58, 0.7) }}>
          <div style={{ height: 1, width: 740, background: LINE, marginBottom: 14 }} />
          <div style={{ fontFamily: SANS, fontSize: 17, color: MUTED, letterSpacing: 1, lineHeight: 1.7 }}>
            智能汽车解决方案 2024 年首次盈利
            <span style={{ marginLeft: 16, fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: 2 }}>AUTO · FIRST PROFIT</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene09;
