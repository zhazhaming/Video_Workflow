// Scene02 · 暴跌日：11月5日，纳指 -5.52%
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, Stamp, Num, Polyline, Chip, exitStyle, mk,
  INK, INK_SOFT, INK_FAINT, RED, GOLD,
  seg, eo, eoq, lerp, pop,
} from "./ui";

// 日内示意曲线：震荡 → 跳水
const DAY: [number, number][] = [
  [96, 700], [200, 685], [310, 705], [420, 675], [520, 700], [600, 715],
];
const DIVE: [number, number][] = [[600, 715], [700, 880], [800, 1010], [900, 1100], [962, 1130]];

const STATS: [string, string][] = [
  ["标普500", "-4.4%"],
  ["道琼斯", "-3.44%"],
  ["VIX 恐慌指数", "+70%"],
];

const Scene02: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.07);
  const m1 = mk(marks, 1, 0.57);
  const val = lerp(0, 5.52, eoq(seg(p, m0 + 0.02, m0 + 0.3)));
  const stampT = pop(seg(p, m1 + 0.04, m1 + 0.18));
  const chipT = pop(seg(p, 0.5, 0.62));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={exitStyle(p)}>
        <Cap text="11·05 · 纳斯达克综合指数" y={310} opacity={seg(p, 0.02, 0.1)} />
        {/* 大数字 */}
        <Num
          value={-val}
          decimals={2}
          x={96}
          y={372}
          size={252}
          color={RED}
          suffix="%"
          suffixSize={130}
          suffixColor={RED}
          opacity={eo(seg(p, m0, m0 + 0.08))}
        />
        <Hair x={96} y={652} w={380} progress={seg(p, m0 + 0.26, m0 + 0.38)} color={INK} opacity={0.35} thickness={2} />
        <Chip text="收于 24,315.00" x={96} y={744} t={chipT} color={INK_SOFT} size={26} />
        {/* 日内曲线 */}
        <div style={{ position: "absolute", inset: 0, opacity: seg(p, 0.08, 0.14) }}>
          <Polyline points={DAY} p={seg(p, 0.1, 0.42)} color={INK} thickness={5} opacity={0.8} dot={false} />
        </div>
        <Polyline points={DIVE} p={seg(p, 0.4, 0.58)} color={RED} thickness={8} opacity={0.95} dot dotColor={RED} />
        <Stamp text="19个月最惨" x={770} y={420} size={58} rotate={-10} t={stampT} />
        {/* 三行小账 */}
        {STATS.map(([k, v], i) => {
          const t = eo(seg(p, m1 + 0.02 + i * 0.055, m1 + 0.14 + i * 0.055));
          return (
            <div
              key={k}
              style={{
                position: "absolute",
                left: 96,
                top: 1128 + i * 58,
                width: 888,
                transform: `translateX(${(1 - t) * 180}px)`,
                opacity: t,
              }}
            >
              <Hair y={-8} x={96} w={888} progress={t} opacity={0.18} />
              <div
                style={{
                  fontFamily: "inherit",
                  fontSize: 30,
                  fontWeight: 700,
                  color: INK_SOFT,
                  letterSpacing: 2,
                }}
              >
                {k}
                <span
                  style={{
                    float: "right",
                    fontFamily: "inherit",
                    fontSize: 34,
                    fontWeight: 800,
                    color: v.startsWith("+") ? GOLD : RED,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {v}
                </span>
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene02;
