// Scene07 · 500 格（全片的小机关）
// 500 枚小方格像日历一样逐格亮起，一格代表一年；亮满后整面墙退成底纹，浮出「五百年」。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, INK, INK_SOFT, FAINT, RED, seg, eo, eoq, pop, lerp } from "./ui";

const COLS = 25;
const ROWS = 20;
const STEP = 32;
const CELL = 26;
const GX = 143;
const GY = 416;

const Scene07: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.1));
  const fill = eoq(seg(p, 0.06, 0.54));
  const fade = eo(seg(p, 0.58, 0.7));
  const bigO = eo(seg(p, 0.62, 0.72));
  const bigS = 0.94 + 0.06 * pop(seg(p, 0.62, 0.8));
  const sub = eo(seg(p, 0.7, 0.84));
  const halo = "0 0 26px #F5F0E7, 0 0 46px #F5F0E7, 0 0 70px #F5F0E7";

  const litCount = Math.floor(fill * 500);
  const gridH = ROWS * STEP - (STEP - CELL);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="估值 / 500 倍" x={96} y={318} size={20} />
        <Cap text="一格 = 一年" x={984} y={318} size={18} align="right" color={FAINT} />

        <div style={{ opacity: 1 - 0.9 * fade }}>
          {Array.from({ length: 500 }).map((_, i) => {
            const c = i % COLS;
            const r = Math.floor(i / COLS);
            const lit = i < litCount;
            const last = i >= 495;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: GX + c * STEP,
                  top: GY + r * STEP,
                  width: CELL,
                  height: CELL,
                  background: lit ? (last ? RED : INK) : "transparent",
                  border: lit ? "none" : `1px solid ${INK}22`,
                  opacity: lit ? (last ? 0.95 : 0.78) : 0.5,
                  transform: `scale(${lit ? 1 : 0.86})`,
                }}
              />
            );
          })}
          {/* 已亮的行尾游标 */}
          <div
            style={{
              position: "absolute", left: GX - 14, top: GY + lerp(0, gridH, fill),
              width: COLS * STEP - (STEP - CELL), height: 2, background: RED, opacity: 0.5 * (1 - fade),
            }}
          />
        </div>

        {/* 文字后面的纸色柔光，把 500 格压成纹理，保证「五百年」清楚 */}
        <div
          style={{
            position: "absolute", left: 150, top: 486, width: 780, height: 420,
            background: `radial-gradient(ellipse at center, ${c1} 0%, ${c1} 52%, ${c1}00 78%)`,
            opacity: bigO * 0.92,
          }}
        />
        <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", opacity: bigO, transform: `scale(${bigS})` }}>
          <div style={{ fontFamily: '"Songti SC", serif', fontSize: 176, fontWeight: 700, color: INK, letterSpacing: 8, lineHeight: 1, textShadow: halo }}>五百年</div>
          <div style={{ fontFamily: '"SF Mono", monospace', fontSize: 26, letterSpacing: 10, color: RED, marginTop: 12, textShadow: halo }}>才回本</div>
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 900, textAlign: "center", opacity: sub }}>
          <span style={{ fontFamily: '"Songti SC", serif', fontSize: 34, color: INK_SOFT }}>
            你买的不是今年，是它很久以后的样子。
          </span>
        </div>

        <Hair x={96} y={1000} w={888} color={INK} thickness={1} progress={sub} opacity={0.18} />
        <div style={{ position: "absolute", left: 96, top: 1030, opacity: sub, fontFamily: '"SF Mono", monospace', fontSize: 18, color: FAINT, letterSpacing: 3 }}>
          1 : 500
        </div>
        <div style={{ position: "absolute", left: 784, top: 1030, width: 200, textAlign: "right", opacity: sub, fontFamily: '"SF Mono", monospace', fontSize: 18, color: FAINT, letterSpacing: 3 }}>
          利润 : 市值
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene07;
