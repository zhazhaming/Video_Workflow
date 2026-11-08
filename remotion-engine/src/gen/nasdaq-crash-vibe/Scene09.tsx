// Scene09 · 七巨头：无一幸免
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, exitStyle, mk,
  INK, INK_SOFT, INK_FAINT, RED,
  seg, eo, pop,
} from "./ui";

type Tile = { t: string; v: string; x: number; y: number };
const TILES: Tile[] = [
  { t: "MSFT", v: "-3%", x: 96, y: 470 },
  { t: "AAPL", v: "▼", x: 314, y: 470 },
  { t: "NVDA", v: "-9.26%", x: 532, y: 470 },
  { t: "AMZN", v: "-2%", x: 750, y: 470 },
  { t: "GOOGL", v: "-2%", x: 205, y: 664 },
  { t: "META", v: "-3%", x: 423, y: 664 },
  { t: "TSLA", v: "-10%", x: 641, y: 664 },
];
const TW = 196;
const TH = 168;

const Scene09: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.1);
  const m1 = mk(marks, 1, 0.53);
  const capT = pop(seg(p, m1 + 0.16, m1 + 0.3));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={exitStyle(p)}>
        <Cap text="七巨头 · 2026-11-05" y={310} opacity={seg(p, 0.02, 0.1)} />
        {TILES.map((tile, i) => {
          const born = pop(seg(p, 0.04 + i * 0.032, 0.16 + i * 0.032));
          const isTsla = tile.t === "TSLA";
          const hot = isTsla ? eo(seg(p, m0, m0 + 0.12)) : 0;
          const wash = eo(seg(p, m1 + 0.02 + i * 0.02, m1 + 0.14 + i * 0.02));
          const valColor = isTsla && hot > 0.5 ? RED : INK;
          return (
            <div
              key={tile.t}
              style={{
                position: "absolute",
                left: tile.x,
                top: tile.y,
                width: TW,
                height: TH,
                borderRadius: 16,
                border: `${isTsla && hot > 0.5 ? 3 : 2}px solid ${isTsla && hot > 0.5 ? RED : INK}`,
                borderColor: isTsla && hot > 0.5 ? RED : INK,
                opacity: born,
                transform: `scale(${0.7 + 0.3 * born}) translateY(${(1 - born) * 30}px)`,
                background: `rgba(251,246,236,${0.55})`,
                boxShadow: "none",
              }}
            >
              {/* 红洗层 */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 16,
                  background: RED,
                  opacity: (isTsla ? Math.max(wash * 0.12, hot * 0.12) : wash * 0.1),
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 18,
                  top: 16,
                  fontFamily: "inherit",
                  fontSize: 30,
                  fontWeight: 800,
                  letterSpacing: 3,
                  color: INK_SOFT,
                  opacity: 1 - wash * 0.25,
                }}
              >
                {tile.t}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 18,
                  bottom: 18,
                  fontSize: 46,
                  fontWeight: 900,
                  color: valColor,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: 0,
                  transform: `scale(${1 + hot * 0.08})`,
                  transformOrigin: "0 100%",
                }}
              >
                {tile.v}
              </div>
            </div>
          );
        })}
        <Cap
          text="七巨头 · 无一幸免"
          y={920}
          align="center"
          color={RED}
          accent={RED}
          size={34}
          opacity={capT}
        />
        <Cap
          text="特斯拉领跌 · 芯片与平台全线下挫"
          y={1216}
          align="center"
          color={INK_SOFT}
          opacity={0.85 * seg(p, 0.78, 0.9)}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene09;
