// Scene08 · 伤亡榜：英伟达 / AMD / 费城半导体
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, Num, Bar, exitStyle, mk,
  INK, INK_SOFT, INK_FAINT, RED, GOLD,
  seg, eo, eoq, lerp,
} from "./ui";

const BX = 330; // 条基线
const PX = 33; // px per 1%
const ROWS: { name: string; v: number; y: number; op: number }[] = [
  { name: "英伟达", v: 9.26, y: 470, op: 1 },
  { name: "AMD", v: 17, y: 690, op: 0.88 },
  { name: "费半指数", v: 12.2, y: 910, op: 0.94 },
];

const Scene08: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m = (i: number) => mk(marks, i, 0.1 + i * 0.28);
  const footT = eo(seg(p, 0.8, 0.92));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={exitStyle(p)}>
        <Cap text="单日跌幅 · 2026-11-05" y={310} opacity={seg(p, 0.02, 0.1)} />
        <Hair x={96} y={356} w={888} progress={seg(p, 0.04, 0.16)} opacity={0.25} thickness={2} />
        {ROWS.map((r, i) => {
          const grow = eoq(seg(p, m(i) + 0.02, m(i) + 0.22));
          const labelT = eo(seg(p, m(i) - 0.02, m(i) + 0.08));
          return (
            <div key={r.name}>
              <div
                style={{
                  position: "absolute",
                  left: 96,
                  top: r.y + 12,
                  opacity: labelT,
                  fontSize: 42,
                  fontWeight: 900,
                  color: INK,
                  letterSpacing: 3,
                }}
              >
                {r.name}
              </div>
              <Hair x={BX} y={r.y + 6} w={17.5 * PX} opacity={0.14} progress={grow} />
              <Bar x={BX} y={r.y} w={r.v * PX} h={66} p={grow} color={RED} opacity={r.op} radius={8} />
              <Num
                value={lerp(0, r.v, grow)}
                decimals={r.v % 1 === 0 ? 0 : 2}
                x={BX + r.v * PX + 22}
                y={r.y + 4}
                size={48}
                color={RED}
                suffix="%"
                suffixSize={30}
                suffixColor={RED}
                opacity={labelT}
              />
            </div>
          );
        })}
        {/* 脚注 */}
        <Hair x={96} y={1150} w={888} progress={footT} opacity={0.2} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 1172,
            opacity: footT,
            fontSize: 32,
            fontWeight: 700,
            color: INK_SOFT,
            letterSpacing: 2,
          }}
        >
          英伟达单日市值蒸发 ≈ <span style={{ color: RED, fontVariantNumeric: "tabular-nums" }}>$4,466 亿</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene08;
