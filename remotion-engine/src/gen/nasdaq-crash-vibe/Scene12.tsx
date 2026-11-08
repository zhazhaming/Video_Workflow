// Scene12 · 结语：危机还是机会？VIBE 知识大赏
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, Stamp, exitStyle, mk,
  INK, INK_SOFT, INK_FAINT, RED, GOLD, SERIF_STACK, FONT_STACK, MONO_STACK,
  seg, eo, pop,
} from "./ui";

const Scene12: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.13);
  const wT = pop(seg(p, 0.05, 0.18));
  const jT = pop(seg(p, 0.13, 0.26));
  const qT = pop(seg(p, 0.24, 0.38));
  const brandT = eo(seg(p, 0.4, 0.56));
  const stampT = pop(seg(p, m0 + 0.1, m0 + 0.3));
  const ctaT = pop(seg(p, m0 + 0.02, m0 + 0.18));
  const seesaw = Math.sin(p * Math.PI * 2) * 1.6;

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={exitStyle(p)}>
        {/* 危机 / 机会 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 470,
            textAlign: "center",
          }}
        >
          <span
            style={{
              display: "inline-block",
              fontFamily: SERIF_STACK,
              fontSize: 150,
              fontWeight: 700,
              color: INK,
              transform: `scale(${0.7 + 0.3 * wT}) rotate(${seesaw}deg)`,
              opacity: wT,
              letterSpacing: 8,
            }}
          >
            危机
          </span>
          <span
            style={{
              display: "inline-block",
              fontFamily: SERIF_STACK,
              fontSize: 110,
              color: INK_FAINT,
              margin: "0 30px",
              opacity: Math.max(wT, jT) * 0.8,
            }}
          >
            ／
          </span>
          <span
            style={{
              display: "inline-block",
              fontFamily: SERIF_STACK,
              fontSize: 150,
              fontWeight: 700,
              color: RED,
              transform: `scale(${0.7 + 0.3 * jT}) rotate(${-seesaw}deg)`,
              opacity: jT,
              letterSpacing: 8,
            }}
          >
            机会
          </span>
        </div>
        {/* 大问号 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 700,
            textAlign: "center",
            transform: `scale(${0.6 + 0.4 * qT})`,
            opacity: qT,
          }}
        >
          <span style={{ fontFamily: SERIF_STACK, fontSize: 120, fontWeight: 700, color: GOLD }}>？</span>
        </div>
        {/* 品牌字标 */}
        <Hair x={250} y={952} w={580} progress={brandT} from="center" opacity={0.3} thickness={2} />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 986,
            textAlign: "center",
            fontFamily: FONT_STACK,
            fontSize: 64,
            fontWeight: 900,
            color: INK,
            letterSpacing: 14,
            opacity: brandT,
            transform: `translateY(${(1 - brandT) * 26}px)`,
          }}
        >
          VIBE 知识大赏
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1082,
            textAlign: "center",
            fontFamily: MONO_STACK,
            fontSize: 22,
            letterSpacing: 5,
            color: INK_FAINT,
            opacity: brandT * 0.95,
          }}
        >
          MARKET LAB · NASDAQ SPECIAL · 2026.11
        </div>
        {/* CTA + 免责 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1136,
            textAlign: "center",
            fontSize: 38,
            fontWeight: 900,
            color: INK,
            letterSpacing: 4,
            opacity: ctaT,
          }}
        >
          评论区聊聊<span style={{ color: RED }}> ↓</span>
        </div>
        <Stamp text="不构成投资建议" x={540} y={1244} size={36} rotate={-4} t={stampT} color={INK_SOFT} border={3} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene12;
