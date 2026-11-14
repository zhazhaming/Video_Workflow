// Scene01 · 钩子：直降 4000，但先别急着喊真香
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, TopBar, PriceTag, BigNum, Chip, GpuLine, Source, Stamp, SERIF, SANS, INK, RED, MUTED, easeOut, seg, mk, exitFade, clamp01 } from "./ui";

const Scene01: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.06);
  const m1 = mk(marks, 1, 0.3);
  const m2 = mk(marks, 2, 0.56);
  const m3 = mk(marks, 3, 0.8);
  const card = easeOut(seg(p, 0, 0.06));
  const tag = easeOut(seg(p, m1, m1 + 0.08));
  const head = easeOut(seg(p, m2, m2 + 0.1));
  const line = easeOut(seg(p, m2 + 0.12, m2 + 0.22));
  const drift = Math.sin(p * Math.PI * 2) * 5;

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <GpuLine x={600} y={720 + drift} w={380} opacity={0.1} rotate={-8} />
        <TopBar label="显卡价格 / 2026.11" right="NO. 001" opacity={seg(p, 0, 0.12)} />
        <PriceTag
          x={96} y={356} w={556} kicker="RTX 5080 · 华强北渠道"
          value="¥14,000" old="¥18,000" sub="10.23 → 11.10，十几天"
          rotate={-2.5} t={card} accent={accent}
        />
        <div
          style={{
            position: "absolute", left: 660, top: 338,
            transform: `rotate(7deg) scale(${0.8 + 0.2 * tag})`, opacity: clamp01(tag * 1.4),
            background: RED, color: "#FFF9ED", padding: "18px 24px 16px",
            boxShadow: "0 12px 24px rgba(120,40,24,0.24)",
          }}
        >
          <div style={{ fontFamily: SANS, fontSize: 18, letterSpacing: 3, opacity: 0.9 }}>直降</div>
          <div style={{ fontFamily: SERIF, fontSize: 58, lineHeight: 1, fontWeight: 700, letterSpacing: -2 }}>−4,000</div>
        </div>
        <Chip text="有型号" x={96} y={650} rotate={-1} opacity={seg(p, m2, m2 + 0.15)} size={20} />

        <div style={{ position: "absolute", left: 96, top: 735, opacity: head, transform: `translateY(${(1 - head) * 26}px)` }}>
          <div style={{ fontFamily: SERIF, fontSize: 92, lineHeight: 1.08, fontWeight: 700, color: INK, letterSpacing: 2 }}>
            先别急着
            <br />
            喊<span style={{ color: RED }}>真香</span>。
          </div>
        </div>
        <div style={{ position: "absolute", left: 96, top: 1012, width: 600 * line, height: 5, background: accent }} />
        <div style={{ position: "absolute", left: 96, top: 1038, opacity: seg(p, m3, m3 + 0.12), fontFamily: SANS, fontSize: 24, color: MUTED, letterSpacing: 1 }}>
          降完，可能还是比你印象里贵。
        </div>
        <Stamp text="先看价" x={790} y={1010} size={38} rotate={8} t={seg(p, m3, m3 + 0.12)} />
        <Source text="口径：深圳华强北渠道现货价，不同商家有差异。" y={1268} />
        <BigNum text="01" x={900} y={1190} size={30} color="rgba(27,23,20,0.18)" mono />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene01;
