// Scene03 · 低价：别人往上走，它把价格压在几块钱
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Stamp, Arrow, Signature, exitFade, mk, seg, easeOut, pop, clamp01,
  RED, INK, MUTED, LINE, CREAM,
} from "./ui";

const TAGS = [
  { x: 170, y: 380, label: "高端", delay: 0.05, accent: false },
  { x: 380, y: 450, label: "高端", delay: 0.12, accent: false },
  { x: 640, y: 640, label: "几块钱", delay: 0.3, accent: true },
];

const Scene03: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = mk(marks, 1, 0.5);
  const stamp = pop(seg(p, m1 + 0.16, m1 + 0.34));
  const arrow = easeOut(seg(p, 0.2, 0.65));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <Signature />
        <Cap text="价格带" x={96} y={330} opacity={seg(p, 0.02, 0.1)} />
        <div style={{ position: "absolute", left: 120, top: 720, fontFamily: '"Songti SC",serif', fontSize: 240, color: RED, opacity: 0.06 }}>
          ¥
        </div>
        {TAGS.map((t, i) => (
          <div key={`string-${i}`} style={{ position: "absolute", left: t.x, top: 300, width: 2, height: 90, background: MUTED, opacity: 0.5 }} />
        ))}
        {TAGS.map((t, i) => {
          const inn = pop(seg(p, t.delay, t.delay + 0.18));
          const swing = Math.sin(p * Math.PI * 5 + i) * 1.6;
          return (
            <div
              key={`tag-${i}`}
              style={{
                position: "absolute", left: t.x - 70, top: t.y, width: 140, height: 96,
                background: t.accent ? RED : CREAM,
                border: `4px solid ${INK}`,
                borderRadius: 6,
                boxShadow: "0 12px 26px rgba(76,50,20,0.16)",
                transform: `translateY(${(1 - inn) * -24}px) rotate(${swing}deg) scale(${0.86 + 0.14 * inn})`,
                opacity: clamp01(inn),
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: '"Songti SC",serif', fontSize: t.accent ? 34 : 30,
                fontWeight: 700, color: t.accent ? CREAM : INK, letterSpacing: 4,
              }}
            >
              {t.label}
            </div>
          );
        })}
        <Arrow x={350} y={560} w={210} progress={arrow} color={RED} />
        <div style={{ position: "absolute", left: 350, top: 590, fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 20, color: MUTED, letterSpacing: 3, opacity: seg(p, 0.3, 0.5) }}>
          同样的解渴，不同的价格
        </div>
        <Stamp text="低价" x={800} y={860} size={64} rotate={-9} t={stamp} />
        <div
          style={{
            position: "absolute", left: 640, top: 960, width: 260, height: 3,
            background: INK, opacity: 0.2 * seg(p, 0.6, 0.8),
          }}
        />
        <div style={{ position: "absolute", left: 640, top: 988, fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 22, color: MUTED, letterSpacing: 3, opacity: seg(p, 0.6, 0.8) }}>
          便宜，反而成了招牌
        </div>
        <div style={{ position: "absolute", left: 120, top: 900, width: 240, height: 240, borderRadius: "50%", border: `2px dashed ${LINE}`, opacity: 0.5, transform: `rotate(${p * 30}deg)` }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene03;
