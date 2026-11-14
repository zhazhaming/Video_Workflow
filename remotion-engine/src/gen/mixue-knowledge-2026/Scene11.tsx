// Scene11 · 收束：低价不是亏本，是把供应链做成了护城河
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Stamp, Cup, Signature, exitFade, seg, easeOut, pop,
  RED, INK, MUTED, LINE, CREAM, LEMON,
} from "./ui";

const ROWS = [
  { label: "门店规模", value: "5 万+ 家" },
  { label: "原料供应", value: "自建工厂" },
  { label: "单杯价格", value: "几块钱" },
  { label: "真正壁垒", value: "供应链效率" },
];

const ZIG = Array.from({ length: 20 }, (_, i) => {
  const x0 = i * 5;
  return `${x0}% 0, ${x0 + 2.5}% 100%, ${x0 + 5}% 0`;
}).join(", ");

const Scene11: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const unroll = easeOut(seg(p, 0.02, 0.34));
  const stamp = pop(seg(p, 0.52, 0.72));
  const line = easeOut(seg(p, 0.7, 0.9));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <Signature />
        <Cap text="所以，低价是什么" x={96} y={330} opacity={seg(p, 0.02, 0.1)} />
        <div
          style={{
            position: "absolute", left: 250, top: 380, width: 580, height: 760,
            clipPath: `inset(0 0 ${(1 - unroll) * 100}% 0)`,
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: CREAM, boxShadow: "0 22px 48px rgba(76,50,20,0.16)" }} />
          <div style={{ position: "absolute", left: 34, top: 40, fontFamily: '"Songti SC",serif', fontSize: 38, fontWeight: 700, color: INK, letterSpacing: 6 }}>
            一杯柠檬水的账
          </div>
          <div style={{ position: "absolute", left: 34, top: 100, width: 512, height: 2, background: INK, opacity: 0.3 }} />
          {ROWS.map((r, i) => {
            const t = seg(p, 0.1 + i * 0.08, 0.24 + i * 0.08);
            return (
              <React.Fragment key={i}>
                <div style={{ position: "absolute", left: 34, top: 140 + i * 96, fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 22, color: MUTED, letterSpacing: 2, opacity: t }}>
                  {r.label}
                </div>
                <div style={{ position: "absolute", left: 34, top: 176 + i * 96, fontFamily: '"Songti SC",serif', fontSize: 34, color: INK, opacity: t }}>
                  {r.value}
                </div>
                <div style={{ position: "absolute", left: 34, top: 224 + i * 96, width: 512, height: 1, background: LINE, opacity: t }} />
              </React.Fragment>
            );
          })}
          <Stamp text="低价 = 效率" x={290} y={600} size={38} rotate={-7} t={stamp} />
          <div style={{ position: "absolute", left: 34, top: 540, width: 512, borderTop: `2px dashed ${INK}`, opacity: 0.3 }} />
          <div style={{ position: "absolute", left: 34, top: 660, display: "flex", alignItems: "flex-end", gap: 4 }}>
            {Array.from({ length: 42 }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 3 + (i % 3),
                  height: 38 + Math.abs(Math.sin(i * 1.7)) * 34,
                  background: INK,
                  opacity: 0.72,
                }}
              />
            ))}
          </div>
          <div style={{ position: "absolute", left: 34, top: 738, fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 15, color: MUTED, letterSpacing: 2 }}>
            NO. 1997 · ZHENGZHOU → WORLD
          </div>
          <div style={{ position: "absolute", left: 0, bottom: -18, width: "100%", height: 20, background: CREAM, clipPath: `polygon(${ZIG})` }} />
        </div>
        <div style={{ position: "absolute", left: 300, top: 1180, width: 480 * line, height: 4, background: RED }} />
        <div style={{ position: "absolute", left: 300, top: 1200, fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 20, color: MUTED, letterSpacing: 2, opacity: line }}>
          便宜，是结果，不是原因
        </div>
        <div style={{ position: "absolute", left: 860, top: 900, opacity: seg(p, 0.5, 0.7) }}>
          <Cup x={0} y={0} w={110} h={150} straw={false} />
        </div>
        <div style={{ position: "absolute", left: 96, top: 700, width: 80, height: 80, borderRadius: "50%", border: `2px dashed ${LEMON}`, opacity: 0.7, transform: `rotate(${p * 30}deg)` }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene11;
