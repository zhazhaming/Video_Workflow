// Scene10 · 布伦特五年月线：2020 崩 → 2022 冲顶 → 三连跌 → 2026 重上 98
// 数据：东方财富 112.B00Y 月线收盘（market.json，2020-01 → 2026-11，83 点），口径见 facts.md N1/N3/N4/N5。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Num, Stamp, Polyline, Hair, exitStyle, mk,
  INK, INK_SOFT, INK_FAINT, RED,
  seg, eo, eio, pop,
} from "./ui";

// 月线收盘（美元/桶），20/01 → 26/11
const SERIES: number[] = [
  56.66, 50.09, 25.92, 26.66, 37.61, 41.63, 43.71, 45.57, 42.12, 37.86, 47.76, 51.72,
  55.1, 64.63, 63.07, 66.44, 69.46, 74.67, 75.22, 71.7, 78.36, 83.53, 70.22, 77.94,
  89.31, 98.12, 105.65, 106.08, 116.27, 109.2, 104.0, 94.96, 85.57, 92.85, 86.64, 85.99,
  85.53, 83.11, 79.93, 80.26, 72.13, 75.19, 85.23, 86.82, 92.11, 85.62, 80.35, 77.08,
  80.69, 82.02, 87.07, 85.92, 81.37, 84.84, 81.51, 77.05, 72.0, 74.06, 72.09, 74.83,
  76.5, 73.08, 74.71, 61.04, 62.61, 66.63, 71.78, 67.46, 66.15, 64.58, 62.32, 60.91,
  69.83, 73.21, 103.53, 110.86, 91.89, 73.43, 91.04, 90.67, 97.88, 113.4, 97.97,
];

const N = SERIES.length; // 83
const X0 = 96;
const X1 = 984;
const YB = 1120; // 底（VMIN）
const YT = 500; // 顶（VMAX）
const VMIN = 20;
const VMAX = 120;

const xAt = (i: number) => X0 + (i / (N - 1)) * (X1 - X0);
const yAt = (v: number) => YB - ((v - VMIN) / (VMAX - VMIN)) * (YB - YT);

// 注记锚点：五年最低 / 2022 最高 / 三连跌终点 / 最新
const MARKS: { i: number; label: string; dx: number; dy: number }[] = [
  { i: 2, label: "25.9", dx: 10, dy: -46 },
  { i: 28, label: "116", dx: -34, dy: -44 },
  { i: 71, label: "60.9", dx: -6, dy: 48 },
];

// 年份刻度（每年 1 月）
const YEAR_TICKS = [
  { i: 0, y: "2020" }, { i: 12, y: "2021" }, { i: 24, y: "2022" }, { i: 36, y: "2023" },
  { i: 48, y: "2024" }, { i: 60, y: "2025" }, { i: 72, y: "2026" },
];

const Scene10: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.05);
  const r = eio(seg(p, m0, m0 + 0.58));
  const frontier = r * (N - 1);
  const cur = SERIES[Math.min(N - 1, Math.max(0, Math.round(frontier)))];
  const endT = seg(p, m0 + 0.6, m0 + 0.72);

  const points: [number, number][] = SERIES.map((v, i) => [xAt(i), yAt(v)]);

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={exitStyle(p)}>
        <Cap text="布伦特原油 · 月线收盘 · 美元/桶" y={310} opacity={seg(p, 0.02, 0.1)} />
        {/* 滚动现价（跟随揭示前沿） */}
        <Num
          value={cur}
          decimals={1}
          x={96}
          y={356}
          size={140}
          color={cur < 60 ? INK_SOFT : RED}
          opacity={eo(seg(p, m0, m0 + 0.06))}
        />
        {/* 横向参考线 40/60/80/100/120 */}
        {[40, 60, 80, 100, 120].map((v) => (
          <div key={v}>
            <Hair x={X0} y={yAt(v)} w={X1 - X0} progress={seg(p, 0.04, 0.12)} opacity={0.1} thickness={1} />
            <div
              style={{
                position: "absolute",
                left: X1 - 60,
                top: yAt(v) - 18,
                fontFamily: "inherit",
                fontSize: 20,
                color: INK_FAINT,
                opacity: seg(p, 0.06, 0.14),
              }}
            >
              {v}
            </div>
          </div>
        ))}
        {/* 基线 + 年份刻度 */}
        <Hair x={X0} y={YB} w={X1 - X0} progress={seg(p, 0.02, 0.1)} opacity={0.3} thickness={2} />
        {YEAR_TICKS.map((t) => (
          <div
            key={t.y}
            style={{
              position: "absolute",
              left: xAt(t.i) - 24,
              top: YB + 16,
              width: 60,
              textAlign: "center",
              fontFamily: "inherit",
              fontSize: 22,
              letterSpacing: 2,
              color: INK_FAINT,
              opacity: seg(p, 0.06, 0.16),
            }}
          >
            {t.y}
          </div>
        ))}
        {/* 主曲线（月线揭示） */}
        <Polyline points={points} p={r} color={RED} thickness={6} opacity={0.92} dot dotColor={RED} />
        {/* 事件注记点 */}
        {MARKS.map((m) => {
          const t = pop(frontier >= m.i + 0.5 ? 1 : 0);
          return (
            <div
              key={m.label}
              style={{
                position: "absolute",
                left: xAt(m.i) + m.dx,
                top: yAt(SERIES[m.i]) + m.dy,
                transform: `scale(${t})`,
                opacity: t,
                fontFamily: "inherit",
                fontSize: 30,
                fontWeight: 800,
                color: INK,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {m.label}
            </div>
          );
        })}
        {/* 收尾印章 */}
        <Stamp text="重上98" x={770} y={430} size={56} rotate={-8} t={endT} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene10;
