// Scene02 · 粗笔写小字：同一层图形曝光四次，每次偏一点
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Dot, MONO, INK, MUTED, seg, easeOut, mk, clamp01 } from "./ui";

const SQ = { x: 380, y: 500, s: 300 };

/** 沿着正方形周长取点，t: 0~1 */
const onSquare = (t: number) => {
  const per = SQ.s * 4;
  const d = clamp01(t) * per;
  if (d < SQ.s) return { x: SQ.x + d, y: SQ.y };
  if (d < SQ.s * 2) return { x: SQ.x + SQ.s, y: SQ.y + (d - SQ.s) };
  if (d < SQ.s * 3) return { x: SQ.x + SQ.s - (d - SQ.s * 2), y: SQ.y + SQ.s };
  return { x: SQ.x, y: SQ.y + SQ.s - (d - SQ.s * 3) };
};

const Scene02: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m3 = mk(marks, 3, 0.78);
  const pass = [0, 1, 2, 3].map((k) => easeOut(seg(p, 0.06 + k * 0.12, 0.24 + k * 0.12)));
  const now = Math.min(3, Math.floor(seg(p, 0.06, 0.6) * 4));
  const brush = onSquare(pass[now]);
  const drift = Math.sin(p * Math.PI * 2) * 4;
  const misaligned = easeOut(seg(p, m3 - 0.1, m3 + 0.1));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />

      <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1080 1920">
        {/* 底稿：让第一帧就有图形，不是空白 */}
        <rect x={SQ.x} y={SQ.y} width={SQ.s} height={SQ.s} fill="none" stroke="rgba(16,24,32,0.14)" strokeWidth={2} />
        {[0, 1, 2, 3].map((k) => (
          <rect
            key={k}
            x={SQ.x + k * 7 * drift}
            y={SQ.y + k * 5}
            width={SQ.s}
            height={SQ.s}
            fill="none"
            stroke={k === 3 ? accent : "rgba(16,24,32,0.8)"}
            strokeWidth={k === 3 ? 4 : 3}
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset={100 * (1 - pass[k])}
            opacity={0.25 + 0.2 * pass[k]}
          />
        ))}

        <circle cx={brush.x} cy={brush.y} r={16} fill={accent} opacity={0.9} />
        <circle cx={brush.x} cy={brush.y} r={30} fill={accent} opacity={0.12} />

        <g opacity={misaligned}>
          <line x1={SQ.x + SQ.s + 14} y1={SQ.y} x2={SQ.x + SQ.s + 14} y2={SQ.y + SQ.s} stroke={accent} strokeWidth={1.5} strokeDasharray="5 5" />
          <line x1={SQ.x + SQ.s + 2} y1={SQ.y} x2={SQ.x + SQ.s + 26} y2={SQ.y} stroke={accent} strokeWidth={2} />
          <line x1={SQ.x + SQ.s + 2} y1={SQ.y + 28} x2={SQ.x + SQ.s + 26} y2={SQ.y + 28} stroke={accent} strokeWidth={2} />
        </g>
      </svg>

      <div style={{ position: "absolute", left: 380, top: 880 }}>
        <div style={{ fontFamily: MONO, fontSize: 18, color: MUTED, letterSpacing: 3 }}>SAME LAYER / 4 PASSES</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 8 }}>
          <span style={{ fontFamily: MONO, fontSize: 104, fontWeight: 700, color: INK, letterSpacing: -4 }}>
            ×{Math.min(4, 1 + Math.floor(seg(p, 0.06, 0.58) * 4))}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 22, color: MUTED, letterSpacing: 2 }}>EXPOSURES</span>
        </div>
      </div>

      <div style={{ position: "absolute", left: 380, top: 1040, opacity: misaligned }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: MONO, fontSize: 20, color: accent, letterSpacing: 2 }}>
          <span style={{ width: 40, height: 2, background: accent, display: "inline-block" }} />
          SHIFT ACCUMULATES
        </div>
      </div>

      <Dot x={SQ.x + SQ.s + 14} y={SQ.y + SQ.s / 2} r={5} color={accent} halo opacity={misaligned} />
    </AbsoluteFill>
  );
};

export default Scene02;
