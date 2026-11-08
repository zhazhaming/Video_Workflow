// Scene07 · 担忧二：AI 烧了这么多钱，回报在哪？
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, exitStyle, mk,
  INK, INK_SOFT, INK_FAINT, RED, SERIF_STACK,
  seg, eo, pop,
} from "./ui";

const Scene07: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.12);
  const m1 = mk(marks, 1, 0.56);
  const arrowT = eo(seg(p, 0.06, 0.26));
  const boxT = pop(seg(p, 0.24, 0.38));
  const qT = pop(seg(p, m1 + 0.02, m1 + 0.18));
  const pulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 6);

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={exitStyle(p)}>
        <Cap text="资本开支 → 回报" y={310} opacity={seg(p, 0.03, 0.12)} />
        {/* 资金流箭头 */}
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 676,
            width: 400,
            height: 16,
            background: INK,
            opacity: 0.85,
            transform: `scaleX(${arrowT})`,
            transformOrigin: "0 50%",
            borderRadius: 8,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 480,
            top: 648,
            width: 0,
            height: 0,
            borderTop: "36px solid transparent",
            borderBottom: "36px solid transparent",
            borderLeft: `52px solid ${INK}`,
            opacity: arrowT * 0.85,
          }}
        />
        <Cap
          text="千亿级 $ · 资本开支"
          x={96}
          y={622}
          color={INK_SOFT}
          opacity={eo(seg(p, m0, m0 + 0.12))}
        />
        {/* AI 方块 */}
        <div
          style={{
            position: "absolute",
            left: 556,
            top: 548,
            width: 260,
            height: 260,
            border: `5px solid ${INK}`,
            borderRadius: 18,
            background: "rgba(251,246,236,0.55)",
            transform: `scale(${0.7 + 0.3 * boxT}) rotate(${(1 - boxT) * -6}deg)`,
            opacity: boxT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontFamily: SERIF_STACK, fontSize: 140, fontWeight: 700, color: INK, letterSpacing: 4 }}>AI</span>
        </div>
        <Cap text="烧钱建 AI" x={600} y={836} color={INK_FAINT} opacity={boxT * 0.95} />
        {/* 输出端的问号 */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 840 + i * 26,
              top: 664 - 8,
              width: 12,
              height: 16,
              borderRadius: 4,
              background: INK,
              opacity: qT * (0.5 - i * 0.12),
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: 872,
            top: 812,
            transform: `translate(-50%, -50%) scale(${0.55 + 0.45 * qT})`,
            opacity: qT,
            fontFamily: SERIF_STACK,
            fontSize: 300,
            fontWeight: 700,
            color: RED,
            lineHeight: 1,
          }}
        >
          ？
        </div>
        <div
          style={{
            position: "absolute",
            left: 872 - (90 + pulse * 10),
            top: 690 - (90 + pulse * 10),
            width: (90 + pulse * 10) * 2,
            height: (90 + pulse * 10) * 2,
            borderRadius: "50%",
            border: `2px solid ${RED}`,
            opacity: qT * 0.14,
          }}
        />
        <Cap text="ROI = ?" x={96} y={1240} opacity={0.8 * seg(p, 0.5, 0.62)} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene07;
