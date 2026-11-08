// Scene01 · 钩子：两万三千亿美元，一夜蒸发
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Stamp, Num, Polyline, SectionNum, exitStyle, mk,
  INK, INK_SOFT, INK_FAINT, RED, GOLD, SERIF_STACK, CONTENT_TOP,
  seg, eo, eoq, lerp, pop, clamp01,
} from "./ui";

// 示意行情线：爬升 → 悬崖
const RISE: [number, number][] = [
  [96, 950], [220, 905], [340, 850], [450, 815], [545, 775], [620, 625],
];
const CLIFF: [number, number][] = [[620, 625], [690, 850], [780, 1010], [870, 1130]];

const Scene01: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.09);
  const m1 = mk(marks, 1, 0.65);
  const cnt = lerp(0, 2.3, eoq(seg(p, m0 + 0.02, m0 + 0.34)));
  const stampT = pop(seg(p, m0 + 0.3, m0 + 0.44));
  const qT = pop(seg(p, m1 + 0.02, m1 + 0.16));
  const pulse = 0.5 + 0.5 * Math.sin(clamp01(p) * Math.PI * 6);

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <SectionNum n={1} t={seg(p, 0.02, 0.12)} />
      <AbsoluteFill style={exitStyle(p)}>
        {/* 眉标 */}
        <Cap text="2026 · 11 · 美股" y={CONTENT_TOP + 14} opacity={seg(p, 0.02, 0.1)} />
        {/* 行情线：爬升段（墨） */}
        <div style={{ position: "absolute", inset: 0, opacity: seg(p, 0.06, 0.12) }}>
          <Polyline points={RISE} p={seg(p, 0.08, 0.42)} color={INK} thickness={5} opacity={0.85} dot dotColor={GOLD} />
        </div>
        {/* 悬崖段（朱红，更粗） */}
        <Polyline points={CLIFF} p={seg(p, 0.4, 0.56)} color={RED} thickness={8} opacity={0.95} dot dotColor={RED} />
        {/* 悬崖口脉冲 */}
        <div
          style={{
            position: "absolute",
            left: 620 - 12 - pulse * 6,
            top: 625 - 12 - pulse * 6,
            width: 24 + pulse * 12,
            height: 24 + pulse * 12,
            borderRadius: "50%",
            border: `3px solid ${RED}`,
            opacity: 0.4 - pulse * 0.2,
          }}
        />
        {/* 巨型数字 */}
        <Cap text="$2.3 TRILLION · 单日蒸发" x={96} y={470} color={INK_SOFT} opacity={eo(seg(p, m0, m0 + 0.1))} />
        <Num
          value={cnt}
          decimals={1}
          x={96}
          y={508}
          size={250}
          color={RED}
          suffix="万亿"
          suffixSize={84}
          suffixColor={INK}
          opacity={eo(seg(p, m0 - 0.02, m0 + 0.06))}
        />
        {/* 印章 */}
        <Stamp text="一夜蒸发" x={790} y={520} size={62} rotate={-9} t={stampT} />
        {/* 大问号 */}
        <div
          style={{
            position: "absolute",
            left: 820,
            top: 860,
            transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * qT}) rotate(${(1 - qT) * -14}deg)`,
            opacity: qT,
            fontFamily: SERIF_STACK,
            fontSize: 230,
            fontWeight: 700,
            color: RED,
            lineHeight: 1,
          }}
        >
          ？
        </div>
        {[0, 1].map((i) => {
          const r = 70 + i * 46 + pulse * 8;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 820 - r,
                top: 960 - r,
                width: r * 2,
                height: r * 2,
                borderRadius: "50%",
                border: `2px solid ${INK}`,
                opacity: qT * (0.16 - i * 0.06),
              }}
            />
          );
        })}
        {/* 底注 */}
        <Cap
          text="NASDAQ COMPOSITE · 2026-11-05"
          y={1240}
          opacity={0.8 * seg(p, 0.2, 0.32)}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene01;
