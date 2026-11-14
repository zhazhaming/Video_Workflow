// Scene08 · 源头：柠檬与茶叶的合作种植基地
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, LemonSlice, Signature, exitFade, seg, easeOut, clamp01,
  INK, LINE, GREEN, LEMON, CREAM,
} from "./ui";

const Tree: React.FC<{ x: number; y: number; s: number; sway: number; opacity: number }> = ({ x, y, s, sway, opacity }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 130 * s, height: 190 * s, opacity }}>
    <div style={{ position: "absolute", left: 58 * s, top: 92 * s, width: 14 * s, height: 100 * s, background: "#8B5E3C", borderRadius: 4 }} />
    <div style={{ position: "absolute", left: 8 * s, top: 34 * s, width: 112 * s, height: 90 * s, borderRadius: "50%", background: GREEN, opacity: 0.9, transform: `scaleY(${0.9 + sway * 0.03})` }} />
    <div style={{ position: "absolute", left: 26 * s, top: 8 * s, width: 76 * s, height: 76 * s, borderRadius: "50%", background: "#5E7D59", opacity: 0.95 }} />
    <div style={{ position: "absolute", left: 38 * s, top: 26 * s, width: 12 * s, height: 12 * s, borderRadius: "50%", background: LEMON }} />
    <div style={{ position: "absolute", left: 76 * s, top: 46 * s, width: 11 * s, height: 11 * s, borderRadius: "50%", background: LEMON }} />
    <div style={{ position: "absolute", left: 60 * s, top: 66 * s, width: 10 * s, height: 10 * s, borderRadius: "50%", background: LEMON }} />
  </div>
);

const Scene08: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const sun = easeOut(seg(p, 0.02, 0.28));
  const rows = [0, 1, 2].map((i) => easeOut(seg(p, 0.05 + i * 0.08, 0.24 + i * 0.08)));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <Signature />
        <div
          style={{
            position: "absolute", right: 110, top: 350 - (1 - sun) * 40,
            width: 150, height: 150, borderRadius: "50%", background: LEMON,
            opacity: 0.85 * sun, boxShadow: "0 0 0 26px rgba(240,195,60,0.12)",
          }}
        />
        <Cap text="源头" x={96} y={330} opacity={seg(p, 0.02, 0.1)} />
        <div style={{ position: "absolute", left: 96, top: 368, fontFamily: '"Songti SC",serif', fontSize: 40, color: INK, opacity: seg(p, 0.05, 0.15) }}>
          便宜，不等于将就
        </div>
        {[0, 1, 2].map((row) => {
          const y = 690 + row * 120;
          const dir = row % 2 === 0 ? -1 : 1;
          return (
            <div
              key={row}
              style={{
                position: "absolute", left: 0, top: 0, width: 1080, height: 400,
                transform: `translateX(${(1 - rows[row]) * dir * 60}px)`,
                opacity: rows[row],
              }}
            >
              {[0, 1, 2, 3].map((i) => (
                <Tree
                  key={i}
                  x={60 + i * 250 + (row % 2) * 40}
                  y={y}
                  s={1 - row * 0.12}
                  sway={Math.sin(p * Math.PI * 2 + i)}
                  opacity={0.95 - row * 0.12}
                />
              ))}
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 0, top: 1080, width: 1080, height: 140, background: `linear-gradient(180deg, transparent, ${GREEN}22)` }} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute", left: 70 + i * 135, top: 1120 - (i % 2) * 10,
              width: 116, height: 64, borderRadius: "60% 60% 0 0",
              background: GREEN, opacity: 0.35 + (i % 3) * 0.08,
            }}
          />
        ))}
        <div style={{ position: "absolute", left: 120, top: 620, padding: "8px 14px", background: CREAM, border: `2px solid ${INK}`, borderRadius: 4, fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 22, color: INK, letterSpacing: 2, opacity: seg(p, 0.35, 0.5) }}>
          约 5 万亩柠檬基地
        </div>
        <div style={{ position: "absolute", left: 620, top: 1010, padding: "8px 14px", background: CREAM, border: `2px solid ${INK}`, borderRadius: 4, fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 22, color: INK, letterSpacing: 2, opacity: seg(p, 0.5, 0.65) }}>
          约 2 万亩茶叶基地
        </div>
        <LemonSlice size={78} x={880} y={700} rotate={p * 10} opacity={0.8} />
        <div style={{ position: "absolute", left: 96, top: 1190, width: 300, height: 2, background: LINE, opacity: clamp01(seg(p, 0.6, 0.8)) }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene08;
