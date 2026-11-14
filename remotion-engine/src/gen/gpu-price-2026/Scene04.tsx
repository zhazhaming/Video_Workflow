// Scene04 · 首发价坐标：14000 仍然比 8299 贵 69%
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, TopBar, Heading, Source, Stamp, Barcode, SERIF, MONO, SANS, INK, RED, MUTED, FAINT, LINE, easeOut, seg, mk, exitFade } from "./ui";

const Scene04: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.05);
  const m1 = mk(marks, 1, 0.3);
  const m2 = mk(marks, 2, 0.65);
  const paper = easeOut(seg(p, m0, m0 + 0.18));
  const stamp = easeOut(seg(p, m2, m2 + 0.22));
  const bar = easeOut(seg(p, m1 + 0.08, m2 + 0.05));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <TopBar label="坐标 / 首发价" right="MSRP" />
        <Heading kicker="把 14000 放回 2025 年" title="它真的便宜了吗？" y={354} size={62} opacity={seg(p, 0, 0.2)} />

        <div
          style={{
            position: "absolute", left: 120, top: 500, width: 560, background: "#FFF9ED",
            border: `3px solid ${INK}`, padding: "28px 32px 26px", boxSizing: "border-box",
            transform: `translateY(${(1 - paper) * 36}px) rotate(-1.6deg)`, opacity: paper,
            boxShadow: "0 18px 38px rgba(70,48,28,0.14)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 17, letterSpacing: 1, color: MUTED }}>
            <span>NVIDIA / 国行</span>
            <span>2025.01</span>
          </div>
          <div style={{ marginTop: 18, fontFamily: SERIF, fontSize: 44, fontWeight: 700, color: INK }}>RTX 5080 首发</div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontFamily: MONO, fontSize: 92, lineHeight: 0.95, fontWeight: 800, color: INK, letterSpacing: -4 }}>8,299</span>
            <span style={{ fontFamily: SANS, fontSize: 24, color: MUTED }}>元</span>
          </div>
          <div style={{ marginTop: 18, borderTop: `1px dashed ${LINE}`, paddingTop: 16, display: "flex", justifyContent: "space-between", fontFamily: SANS, fontSize: 21, color: MUTED }}>
            <span>11.10 华强北</span>
            <span style={{ fontFamily: MONO, color: RED, fontWeight: 800 }}>14,000</span>
          </div>
          <div style={{ marginTop: 18, height: 14, background: "rgba(27,23,20,0.08)", position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: 14, width: `${(8299 / 14000) * 100}%`, background: INK, opacity: 0.8 }} />
            <div style={{ position: "absolute", left: `${(8299 / 14000) * 100}%`, top: -8, bottom: -8, width: 4, background: RED, opacity: bar }} />
          </div>
          <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 16, color: FAINT }}>
            <span>0</span>
            <span>现在的 59%</span>
            <span>14,000</span>
          </div>
          <div style={{ position: "absolute", right: 24, bottom: 20, fontFamily: MONO, fontSize: 12, color: FAINT, letterSpacing: 1 }}>NO. 8299 / 2025</div>
        </div>

        <div style={{ position: "absolute", left: 678, top: 548, opacity: stamp, transform: `rotate(-8deg) scale(${0.8 + 0.2 * stamp})` }}>
          <div style={{ fontFamily: SANS, fontSize: 23, color: RED, letterSpacing: 3 }}>按首发价算</div>
          <div style={{ fontFamily: SERIF, fontSize: 96, lineHeight: 1, fontWeight: 700, color: RED, letterSpacing: -5 }}>+69%</div>
          <div style={{ fontFamily: SANS, fontSize: 22, color: MUTED, marginTop: 6 }}>降完，仍比原价贵</div>
        </div>
        <Stamp text="仍贵 69%" x={806} y={850} size={42} rotate={7} t={stamp} color={RED} />
        <div style={{ position: "absolute", left: 742, top: 1000, opacity: seg(p, m2 + 0.1, m2 + 0.3), fontFamily: SANS, fontSize: 23, color: MUTED, lineHeight: 1.6 }}>
          降价是相对 18000 的高点，
          <br />
          不是相对 8299 的首发。
        </div>
        <Source text="首发价：NVIDIA 国行建议零售价 8299 元；现货：华强北渠道价。69% 为 14000÷8299 的近似值。" y={1248} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene04;
