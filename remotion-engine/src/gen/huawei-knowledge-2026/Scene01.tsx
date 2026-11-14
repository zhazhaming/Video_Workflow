// Scene01 · 开场：营收 8621 亿，利润却少了 28%
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Counter, Petal, Signature, Rule, exitFade, mk, seg, easeOut, easeInOut,
  RED, INK, MUTED, LINE, MONO, SANS, SERIF,
} from "./ui";

const Scene01: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m2 = mk(marks, 2, 0.3);
  const m3 = mk(marks, 3, 0.62);
  const intro = seg(p, 0.02, 0.1);
  const petal = easeInOut(seg(p, 0.03, 0.42));
  const reveal = seg(p, 0.08, 0.16);
  const count = 8621 * easeOut(seg(p, 0.12, 0.42));
  const profit = easeOut(seg(p, 0.4, 0.54));
  const q = seg(p, m3 + 0.14, m3 + 0.3);
  const ringRot = p * 24;
  const bars = [0.42, 0.6, 0.78, 0.55, 0.9, 0.66, 0.48];

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <Signature />
        <div style={{ position: "absolute", left: 150, top: 268, opacity: intro }}>
          <div style={{ fontFamily: SANS, fontSize: 26, color: RED, letterSpacing: 7, fontWeight: 600 }}>
            我是阿扎
          </div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontFamily: SERIF, fontSize: 34, color: MUTED, letterSpacing: 3 }}>本期介绍</span>
            <span style={{ fontFamily: SERIF, fontSize: 68, fontWeight: 700, color: RED, letterSpacing: 3 }}>华为</span>
          </div>
        </div>

        <div style={{ opacity: reveal }}>
          <Cap text="2024 年营收" x={150} y={470} opacity={1} size={25} />
          <Counter value={count} x={142} y={500} size={206} suffix="亿元" suffixSize={62} color={RED} />
          <Rule x={150} y={742} w={520 * easeOut(seg(p, m2, m2 + 0.22))} color={INK} opacity={0.28} />
          <div style={{ position: "absolute", left: 150, top: 762, fontFamily: SANS, fontSize: 20, color: MUTED, letterSpacing: 3, opacity: seg(p, m2, m2 + 0.12) }}>
            同比增长 22.4%
          </div>
        </div>

        <div style={{ position: "absolute", left: 150, top: 850, opacity: 0.28 + 0.72 * profit }}>
          <div style={{ fontFamily: SANS, fontSize: 24, color: MUTED, letterSpacing: 2 }}>净利润</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 6 }}>
            <span style={{ fontFamily: MONO, fontSize: 118, fontWeight: 700, color: INK, letterSpacing: -5 }}>626</span>
            <span style={{ fontFamily: '"Songti SC",serif', fontSize: 38, color: INK }}>亿元</span>
            <span
              style={{
                fontFamily: MONO, fontSize: 84, fontWeight: 700, color: RED, marginLeft: 6,
                transform: `translateY(${(1 - profit) * 16}px)`,
              }}
            >
              −28%
            </span>
          </div>
          <div style={{ marginTop: 12, width: 300, height: 4, background: RED, opacity: 0.75 * profit }} />
        </div>

        <div
          style={{
            position: "absolute", left: 150, top: 1120,
            fontFamily: '"Songti SC",serif', fontSize: 54, color: INK, letterSpacing: 2,
            opacity: q, transform: `translateY(${(1 - q) * 14}px)`,
          }}
        >
          它凭什么<span style={{ color: RED }}>？</span>
        </div>

        {/* 右侧：八瓣标记与信号环 */}
        <div style={{ position: "absolute", left: 690, top: 556, width: 340, height: 340, opacity: 0.95 }}>
          <div style={{ position: "absolute", left: -70, top: -70, width: 480, height: 480, borderRadius: "50%", border: `1px dashed ${LINE}`, transform: `rotate(${ringRot}deg)` }} />
          <div style={{ position: "absolute", left: -10, top: -10, width: 360, height: 360, borderRadius: "50%", border: `1px solid ${LINE}` }} />
          <Petal x={0} y={0} size={340} color={RED} draw={petal} fillOpacity={0.05} rotate={ringRot * 0.3} />
        </div>
        {bars.map((b, i) => {
          const h = 40 + 130 * b * (0.65 + 0.35 * Math.sin(p * 5 + i * 0.7));
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: 862 + i * 15, bottom: 700,
                width: 8, height: h,
                background: i === 4 ? RED : "rgba(16,24,32,0.22)",
                borderRadius: 2,
              }}
            />
          );
        })}
        <div style={{ position: "absolute", left: 690, top: 1200, fontFamily: MONO, fontSize: 12, color: MUTED, letterSpacing: 2, opacity: 0.55 }}>
          SIGNAL / 1987—2024
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene01;
