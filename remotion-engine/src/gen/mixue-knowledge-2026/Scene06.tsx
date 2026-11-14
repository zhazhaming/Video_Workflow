// Scene06 · 工厂：五大生产基地，年产能 143 万吨
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Counter, Signature, exitFade, mk, seg, easeOut, clamp01,
  RED, INK, MUTED, LINE, CREAM, LEMON,
} from "./ui";

const BLOCKS = [0, 1, 2, 3, 4].map((i) => ({
  x: 92 + i * 176,
  h: 170 + (i % 3) * 40,
  delay: 0.06 + i * 0.06,
}));

const Scene06: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m2 = mk(marks, 2, 0.62);
  const gauge = easeOut(seg(p, m2 - 0.1, m2 + 0.2));
  const count = 143 * gauge;

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <Signature />
        <Cap text="自建工厂" x={96} y={330} opacity={seg(p, 0.02, 0.1)} />
        <div style={{ position: "absolute", left: 96, top: 368, fontFamily: '"Songti SC",serif', fontSize: 40, color: INK, opacity: seg(p, 0.05, 0.14) }}>
          把原料握在自己手里
        </div>
        {BLOCKS.map((b, i) => {
          const inn = easeOut(seg(p, b.delay, b.delay + 0.28));
          return (
            <div key={i} style={{ position: "absolute", left: b.x, top: 940 - b.h * inn, width: 146, height: b.h * inn, opacity: 0.4 + 0.6 * inn }}>
              <div style={{ position: "absolute", inset: 0, background: CREAM, border: `3px solid ${INK}`, boxSizing: "border-box", boxShadow: "0 14px 30px rgba(76,50,20,0.10)" }} />
              <div style={{ position: "absolute", left: -8, top: -18, width: 162, height: 18, background: INK, opacity: 0.8, clipPath: "polygon(0 100%, 50% 0, 100% 100%)" }} />
              <div style={{ position: "absolute", left: 16, top: 24, width: 114, height: 6, background: RED, opacity: 0.8 }} />
              <div style={{ position: "absolute", left: 16, top: 42, width: 70, height: 6, background: LINE }} />
              <div style={{ position: "absolute", left: 16, top: 64, width: 46, height: 46, border: `2px dashed ${LINE}` }} />
              <div style={{ position: "absolute", left: 74, top: 64, width: 56, height: 46, border: `2px dashed ${LINE}` }} />
              <div style={{ position: "absolute", left: 20, top: b.h - 30, fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 18, color: MUTED, letterSpacing: 2 }}>
                基地 0{i + 1}
              </div>
            </div>
          );
        })}
        {[0, 1, 2].map((i) => {
          const rise = clamp01((p * 600 + i * 180) % 300) / 300;
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: 150 + i * 176, top: 700 - rise * 150,
                width: 26, height: 26, borderRadius: "50%", background: "#FFFDF7",
                border: `2px solid ${LINE}`, opacity: (1 - rise) * 0.5,
              }}
            />
          );
        })}
        <div style={{ position: "absolute", left: 96, top: 1010, fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 22, color: MUTED, letterSpacing: 2, opacity: seg(p, 0.2, 0.34) }}>
          覆盖糖、奶、茶、咖、果、粮、料
        </div>
        <div style={{ position: "absolute", left: 96, top: 1060, width: 760, height: 18, background: "rgba(27,23,20,0.08)", borderRadius: 10 }} />
        <div style={{ position: "absolute", left: 96, top: 1060, width: 760 * gauge, height: 18, background: accent, borderRadius: 10 }} />
        <Counter value={count} x={700} y={960} size={84} suffix="万吨" suffixSize={24} color={RED} opacity={seg(p, m2 - 0.12, m2 - 0.02)} />
        <div style={{ position: "absolute", left: 96, top: 1090, fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 18, color: MUTED, letterSpacing: 2, opacity: seg(p, 0.4, 0.55) }}>
          年综合产能 · 截至 2023-09-30
        </div>
        <div style={{ position: "absolute", left: 700, top: 420, width: 200, height: 200, borderRadius: "50%", background: LEMON, opacity: 0.18 * seg(p, 0.2, 0.5) }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene06;
