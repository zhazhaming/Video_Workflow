// Scene05 · 导火索：中期选举，民主党横扫国会（席位示意）
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, Stamp, exitStyle, mk,
  INK, INK_SOFT, INK_FAINT, RED, BLUE,
  seg, eo, pop,
} from "./ui";

const SENATE_N = 20;
const HOUSE_N = 24;
const SENATE_BLUE = 12;
const HOUSE_BLUE = 14;

const Scene05: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.1);
  const m1 = mk(marks, 1, 0.53);
  const stampT = pop(seg(p, m1 + 0.14, m1 + 0.3));

  const dots: React.ReactElement[] = [];
  const rows: { n: number; blue: number; y: number; gap: number; r: number; x0: number }[] = [
    { n: SENATE_N, blue: SENATE_BLUE, y: 560, gap: 32, r: 14, x0: 300 },
    { n: HOUSE_N, blue: HOUSE_BLUE, y: 790, gap: 28, r: 12, x0: 300 },
  ];
  rows.forEach((row, ri) => {
    for (let i = 0; i < row.n; i++) {
      const born = eo(seg(p, 0.08 + i * 0.012 + ri * 0.05, 0.18 + i * 0.012 + ri * 0.05));
      const flip = eo(seg(p, m1 + 0.02 + i * 0.014, m1 + 0.14 + i * 0.014));
      const isBlue = i < row.blue;
      dots.push(
        <div
          key={`${ri}-${i}`}
          style={{
            position: "absolute",
            left: row.x0 + i * row.gap - row.r,
            top: row.y - row.r,
            width: row.r * 2,
            height: row.r * 2,
            borderRadius: "50%",
            background: isBlue ? BLUE : INK,
            opacity: born * (isBlue ? 0.92 : 0.25),
            transform: `scale(${born * (1 + 0.3 * (1 - pop(flip)))})`,
          }}
        />,
      );
    }
  });

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={exitStyle(p)}>
        <Cap text="2026 · 11 · 03 中期选举" y={310} opacity={seg(p, 0.03, 0.12)} />
        <Stamp text="横扫" x={830} y={430} size={72} rotate={-9} t={stampT} />
        {/* 参议院 */}
        <Cap text="参议院 · 席位示意" x={96} y={490} color={INK_SOFT} accent={BLUE} opacity={seg(p, 0.06, 0.14)} />
        <Hair x={96} y={524} w={888} progress={seg(p, 0.06, 0.18)} opacity={0.15} />
        {/* 众议院 */}
        <Cap text="众议院 · 席位示意" x={96} y={720} color={INK_SOFT} accent={BLUE} opacity={seg(p, 0.1, 0.18)} />
        <Hair x={96} y={754} w={888} progress={seg(p, 0.1, 0.22)} opacity={0.15} />
        {dots}
        {/* 图例 */}
        <div style={{ position: "absolute", left: 300, top: 640, opacity: seg(p, m1 + 0.2, m1 + 0.32), fontFamily: "inherit", fontSize: 26, color: INK_SOFT, letterSpacing: 2 }}>
          <span style={{ display: "inline-block", width: 18, height: 18, borderRadius: "50%", background: BLUE, marginRight: 10, verticalAlign: "-2px" }} />
          民主党过半
          <span style={{ display: "inline-block", width: 18, height: 18, borderRadius: "50%", background: INK, opacity: 0.25, margin: "0 10px 0 28px", verticalAlign: "-2px" }} />
          其他
        </div>
        <Cap
          text="民主党拿下参众两院 · 席位示意"
          y={1240}
          opacity={0.85 * seg(p, 0.7, 0.82)}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene05;
