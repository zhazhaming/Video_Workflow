// Scene01 · 钩子：一年 10 亿杯，几块钱的柠檬水
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Counter, Cup, LemonSlice, Signature, exitFade, mk, seg, easeOut, clamp01,
  RED, INK, MUTED, LEMON, SERIF,
} from "./ui";

const Scene01: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = mk(marks, 3, 0.5);
  const count = 10 * easeOut(seg(p, 0.22, m1 + 0.14));
  const cupIn = easeOut(seg(p, 0.1, 0.3));
  const float = Math.sin(clamp01(p) * Math.PI * 2) * 7;
  const line = easeOut(seg(p, m1 + 0.08, m1 + 0.3));
  const intro = seg(p, 0.02, 0.1) * (1 - 0.55 * seg(p, 0.34, 0.48));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <Signature />
        <div style={{ position: "absolute", left: 96, top: 250, opacity: intro }}>
          <div style={{ fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 22, color: RED, letterSpacing: 6 }}>
            每日介绍一家公司
          </div>
          <div style={{ marginTop: 10, fontFamily: SERIF, fontSize: 56, fontWeight: 700, color: INK, letterSpacing: 2 }}>
            之 <span style={{ color: RED }}>蜜雪冰城</span>
          </div>
        </div>
        <Cap text="一年卖出" x={96} y={430} opacity={seg(p, 0.2, 0.3)} />
        <Counter value={count} x={90} y={470} size={196} suffix="亿杯" suffixSize={64} color={RED} opacity={seg(p, m1 - 0.08, m1)} />
        <div style={{ position: "absolute", left: 96, top: 700, width: 420 * line, height: 5, background: accent, opacity: 0.9 }} />
        <Cap text="冰鲜柠檬水 · 高频低价" x={96} y={724} opacity={0.8 * seg(p, 0.2, 0.32)} />
        <div
          style={{
            position: "absolute", left: 96, top: 820, width: 360,
            fontFamily: '"Songti SC",serif', fontSize: 46, lineHeight: 1.5, color: INK,
            opacity: seg(p, 0.3, 0.42),
          }}
        >
          它到底
          <br />
          怎么赚钱？
        </div>
        <div style={{ position: "absolute", left: 610, top: 500 + (1 - cupIn) * 70, opacity: cupIn, transform: `translateY(${float}px)` }}>
          <Cup x={0} y={0} w={250} h={350} fill="#FFFDF6" accent={accent} />
        </div>
        <LemonSlice size={96} x={560} y={430} rotate={12 + p * 16} opacity={0.9} />
        <LemonSlice size={64} x={880} y={760} rotate={-18 - p * 12} opacity={0.7} />
        <div
          style={{
            position: "absolute", right: 96, top: 560, width: 120, height: 120, borderRadius: "50%",
            border: `2px dashed ${MUTED}`, opacity: 0.6,
            transform: `rotate(${p * 40}deg)`,
          }}
        />
        <div style={{ position: "absolute", left: 610, top: 880, width: 250, height: 3, background: LEMON, opacity: 0.8 }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene01;
