// Scene11 · 历史视角：2022 跌过三分之一，照样创新高
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, Chip, Stamp, Polyline, exitStyle, mk,
  INK, INK_SOFT, INK_FAINT, RED, GOLD,
  seg, eo, pop,
} from "./ui";

// 十年示意曲线（纵轴示意点位）：2016 → 2026 新高后小幅回撤
const PATH: [number, number][] = [
  [96, 1000], [190, 945], [290, 890], [390, 835], [480, 795], [560, 750],
  [610, 800], [655, 950], [695, 1090], [720, 1128], [760, 1080],
  [820, 970], [880, 860], [930, 760], [958, 700], [984, 748],
];

const Scene11: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.09);
  const m1 = mk(marks, 1, 0.55);
  const bandT = eo(seg(p, 0.3, 0.44));
  const nowT = pop(seg(p, 0.62, 0.74));
  const highT = pop(seg(p, m1 + 0.02, m1 + 0.18));
  const stampT = pop(seg(p, 0.72, 0.88));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={exitStyle(p)}>
        <Cap text="纳指 · 过去十年（示意）" y={310} opacity={seg(p, 0.02, 0.1)} />
        {/* 2022 深谷区带 */}
        <div
          style={{
            position: "absolute",
            left: 650,
            top: 620,
            width: 145,
            height: 520,
            background: RED,
            opacity: 0.06 * bandT,
          }}
        />
        <div style={{ position: "absolute", left: 648, top: 836, opacity: bandT, fontSize: 30, fontWeight: 900, color: RED, letterSpacing: 2, whiteSpace: "nowrap" }}>
          2022 · -36%
        </div>
        {/* 主曲线 */}
        <Polyline
          points={PATH}
          p={seg(p, 0.06, 0.6)}
          color={INK}
          thickness={5}
          opacity={0.85}
          dot
          dotColor={GOLD}
        />
        {/* 现在的位置 */}
        <div
          style={{
            position: "absolute",
            left: 984 - 11,
            top: 748 - 11,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: RED,
            opacity: nowT,
            transform: `scale(${0.6 + 0.4 * nowT})`,
          }}
        />
        <Chip text="本次 -12%" x={796} y={640} t={nowT} color={RED} bg="rgba(200,69,45,0.08)" size={30} />
        {/* 新高 */}
        <div
          style={{
            position: "absolute",
            left: 958 - 9,
            top: 700 - 9,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: GOLD,
            opacity: highT,
          }}
        />
        <Chip text="随后创出新高" x={700} y={540} t={highT} color={GOLD} bg="rgba(169,124,51,0.10)" size={30} />
        <Stamp text="回调 ≠ 崩盘" x={330} y={505} size={58} rotate={-7} t={stampT} />
        {/* 时间轴 */}
        <Hair x={96} y={1148} w={888} progress={seg(p, 0.1, 0.3)} opacity={0.25} />
        {["2016", "2020", "2022", "2024", "2026"].map((yr, i) => (
          <div
            key={yr}
            style={{
              position: "absolute",
              left: 96 + i * 222 - 24,
              top: 1164,
              fontFamily: "inherit",
              fontSize: 26,
              color: INK_FAINT,
              opacity: seg(p, 0.14 + i * 0.03, 0.24 + i * 0.03),
            }}
          >
            {yr}
          </div>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene11;
