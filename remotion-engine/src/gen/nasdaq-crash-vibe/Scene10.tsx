// Scene10 · 传染亚太：KOSPI 熔断 / 日经破 6 万 / 台股重挫
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, Stamp, Num, Polyline, exitStyle, mk,
  INK, INK_SOFT, INK_FAINT, RED,
  seg, eo, eoq, lerp, pop,
} from "./ui";

const CARDS: { name: string; v: number; dec: number; y: number; tag: string }[] = [
  { name: "韩国 KOSPI", v: 8.5, dec: 1, y: 430, tag: "熔断" },
  { name: "日经 225", v: 6, dec: 0, y: 690, tag: "破 6 万点" },
  { name: "台股加权", v: 9, dec: 0, y: 950, tag: "盘中" },
];
const CW = 554;
const CH = 190;
const ORIGIN: [number, number] = [350, 458];

const Scene10: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.08);
  const m1 = mk(marks, 1, 0.51);
  const cardBorn = eo(seg(p, 0.05, 0.16));
  const pulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 8);
  const stampT = pop(seg(p, m1 + 0.08, m1 + 0.24));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={exitStyle(p)}>
        <Cap text="11·06 · 恐慌传到亚太" y={310} opacity={seg(p, 0.02, 0.1)} />
        {/* 源头卡 */}
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 400,
            width: 254,
            height: 116,
            border: `2px solid ${RED}`,
            borderRadius: 14,
            background: "rgba(251,246,236,0.6)",
            opacity: cardBorn,
            transform: `translateX(${(1 - cardBorn) * -40}px)`,
          }}
        >
          <div style={{ position: "absolute", left: 22, top: 20, fontSize: 30, fontWeight: 900, color: INK, letterSpacing: 2 }}>
            美股
          </div>
          <div style={{ position: "absolute", left: 22, top: 62, fontSize: 24, fontWeight: 700, color: RED, letterSpacing: 2 }}>
            AI抛售风暴
          </div>
          <div
            style={{
              position: "absolute",
              right: 18,
              top: 22,
              width: 14 + pulse * 8,
              height: 14 + pulse * 8,
              borderRadius: "50%",
              background: RED,
              opacity: 0.85,
            }}
          />
        </div>
        {/* 传染弧线 */}
        {CARDS.map((c, i) => {
          const cy = c.y + CH / 2;
          const pts: [number, number][] = [
            ORIGIN,
            [390, lerp(ORIGIN[1], cy, 0.45) - 26],
            [414, cy],
            [430, cy],
          ];
          return (
            <Polyline
              key={c.name}
              points={pts}
              p={seg(p, m0 + 0.04 + i * 0.08, m0 + 0.2 + i * 0.08)}
              color={INK}
              thickness={3}
              opacity={0.45}
              dot={false}
            />
          );
        })}
        {/* 目标卡 */}
        {CARDS.map((c, i) => {
          const born = eo(seg(p, 0.1 + i * 0.07, 0.22 + i * 0.07));
          const val = lerp(0, c.v, eoq(seg(p, m1 + 0.02 + i * 0.05, m1 + 0.26 + i * 0.05)));
          const tagT = pop(seg(p, m1 + 0.14 + i * 0.06, m1 + 0.28 + i * 0.06));
          return (
            <div
              key={c.name}
              style={{
                position: "absolute",
                left: 430,
                top: c.y,
                width: CW,
                height: CH,
                border: `2px solid ${INK}`,
                borderRadius: 16,
                background: "rgba(251,246,236,0.55)",
                opacity: born,
                transform: `translateX(${(1 - born) * 60}px)`,
              }}
            >
              <div style={{ position: "absolute", left: 26, top: 20, fontFamily: "inherit", fontSize: 28, fontWeight: 800, letterSpacing: 3, color: INK_SOFT }}>
                {c.name}
              </div>
              <Num value={-val} decimals={c.dec} x={26} y={66} size={78} color={RED} suffix="%" suffixSize={44} suffixColor={RED} opacity={born} />
              <div
                style={{
                  position: "absolute",
                  right: 24,
                  bottom: 20,
                  fontFamily: "inherit",
                  fontSize: 26,
                  fontWeight: 800,
                  color: INK_SOFT,
                  border: `2px solid ${INK_FAINT}`,
                  borderRadius: 999,
                  padding: "4px 18px",
                  opacity: tagT,
                  transform: `scale(${0.8 + 0.2 * tagT})`,
                }}
              >
                {c.tag}
              </div>
            </div>
          );
        })}
        <Stamp text="熔断" x={902} y={470} size={52} rotate={-11} t={stampT} />
        <Hair x={430} y={1196} w={554} progress={seg(p, 0.72, 0.84)} opacity={0.2} />
        <Cap
          text="盘中最大跌幅 · 席卷日韩台"
          x={430}
          y={1216}
          opacity={0.85 * seg(p, 0.74, 0.86)}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene10;
