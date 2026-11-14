// Scene14 · 37 年：从 1989 堪培拉到 2026 深圳，一条被关键年份点亮的时间轴
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, exitFade, mk, seg, easeOut, pop, clamp01, lerp,
  INK, INK_SOFT, OCEAN, CORAL, GOLD, CREAM, SERIF, SANS, MONO,
} from "./ui";

const START = 1989;
const END = 2026;
const X0 = 112;
const X1 = 968;
const Y = 870;
const YEARS = [
  { y: 1989, label: "堪培拉", above: true, color: OCEAN },
  { y: 1995, label: "茂物/大阪", above: false, color: OCEAN },
  { y: 2001, label: "上海", above: true, color: CORAL },
  { y: 2014, label: "北京", above: false, color: CORAL },
  { y: 2020, label: "2040愿景", above: true, color: OCEAN },
  { y: 2026, label: "深圳", above: false, color: CORAL },
];
const xOf = (year: number) => X0 + ((year - START) / (END - START)) * (X1 - X0);

const Scene14: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.02);
  const m1 = mk(marks, 1, 0.34);
  const m2 = mk(marks, 2, 0.66);
  const ex = exitFade(p);
  const axisT = easeOut(seg(p, 0.02, 0.3));
  const tickT = (i: number) => easeOut(seg(p, 0.05 + i * 0.01, 0.12 + i * 0.01));
  const nodeT = (i: number) => pop(seg(p, 0.16 + i * 0.06, 0.3 + i * 0.06));
  const spanT = easeOut(seg(p, 0.26, 0.64));
  const bigT = pop(seg(p, 0.34, 0.6));
  const labelT = seg(p, m1, m1 + 0.24);
  const endT = seg(p, m2, m2 + 0.24);

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: SANS }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ position: "absolute", inset: 0, opacity: ex, transform: `translateY(${(1 - ex) * 6}px)` }}>
        <Cap text="1989 — 2026 / 37 YEARS" x={96} y={306} mono opacity={seg(p, 0.02, 0.1)} accent={accent} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 344,
            fontFamily: SERIF,
            fontSize: 43,
            color: INK,
            letterSpacing: 3,
            opacity: seg(p, 0.05, 0.16),
          }}
        >
          37 年，一条没有走完的时间轴
        </div>

        {/* 大 37 */}
        <div
          style={{
            position: "absolute",
            left: 800,
            top: 470,
            fontFamily: SERIF,
            fontSize: 260,
            fontWeight: 700,
            color: CORAL,
            opacity: 0.09 * bigT,
            lineHeight: 0.8,
            letterSpacing: -12,
          }}
        >
          37
        </div>

        {/* 轴线 */}
        <div style={{ position: "absolute", left: X0, top: Y, width: (X1 - X0) * axisT, height: 2, background: INK, opacity: 0.35 }} />
        <div style={{ position: "absolute", left: X0, top: Y + 24, width: (X1 - X0) * spanT, height: 6, background: CORAL, opacity: 0.45 }} />
        <div style={{ position: "absolute", left: X0, top: Y + 21, width: 2, height: 12, background: CORAL, opacity: 0.6 }} />
        <div style={{ position: "absolute", left: X0 + (X1 - X0) * spanT, top: Y + 21, width: 2, height: 12, background: CORAL, opacity: 0.6 }} />

        {/* 37 根年刻度 */}
        {Array.from({ length: 38 }, (_, i) => {
          const year = START + i;
          const x = xOf(year);
          const t = tickT(i);
          const key = YEARS.some((y) => y.y === year);
          return (
            <div
              key={year}
              style={{
                position: "absolute",
                left: x,
                top: Y - (key ? 14 : 7),
                width: key ? 2 : 1,
                height: (key ? 28 : 14) * t,
                background: key ? (year === END ? CORAL : OCEAN) : INK,
                opacity: key ? 0.7 : 0.22,
                transformOrigin: "bottom center",
              }}
            />
          );
        })}

        {/* 关键节点 */}
        {YEARS.map((item, i) => {
          const t = nodeT(i);
          const x = xOf(item.y);
          const isEnd = item.y === 2026;
          const isStart = item.y === 1989;
          return (
            <div key={item.y} style={{ position: "absolute", left: x, top: Y, opacity: clamp01(t) }}>
              <div
                style={{
                  position: "absolute",
                  left: -8,
                  top: -8,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: isEnd || isStart ? CORAL : item.color,
                  border: `2px solid ${CREAM}`,
                  transform: `scale(${0.6 + 0.4 * t})`,
                  boxShadow: isEnd ? `0 0 0 ${8 + 5 * Math.sin(p * Math.PI * 4)}px ${CORAL}16` : "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: -58,
                  top: item.above ? -58 : 28,
                  width: 116,
                  textAlign: "center",
                  transform: `translateY(${(1 - t) * (item.above ? 10 : -10)}px)`,
                }}
              >
                <div style={{ fontFamily: SERIF, fontSize: isEnd ? 30 : 25, fontWeight: 700, color: isEnd ? CORAL : INK }}>{item.y}</div>
                <div style={{ fontFamily: SANS, fontSize: 14, color: INK_SOFT, letterSpacing: 1.5, marginTop: 3 }}>{item.label}</div>
              </div>
            </div>
          );
        })}

        <Hair x={96} y={1100} w={888} progress={seg(p, 0.5, 0.8)} color={INK} opacity={0.13} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 1122,
            fontFamily: SANS,
            fontSize: 19,
            color: INK_SOFT,
            letterSpacing: 2,
            opacity: seg(p, 0.56, 0.8),
          }}
        >
          它不完美，却一直在解题：让货物、资金、人，跨过太平洋更顺一点
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene14;
