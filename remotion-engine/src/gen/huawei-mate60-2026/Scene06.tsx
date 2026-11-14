// Scene06 · 收尾：一条供应链在试着自己转（闭环 + 一个出口）
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Dot, MONO, INK, MUTED, seg, easeOut, clamp01 } from "./ui";

const NODES = [
  { x: 370, y: 480 },
  { x: 640, y: 480 },
  { x: 830, y: 650 },
  { x: 830, y: 850 },
  { x: 640, y: 980 },
  { x: 370, y: 980 },
  { x: 250, y: 850 },
  { x: 250, y: 650 },
];

const Scene06: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const draw = easeOut(seg(p, 0.04, 0.55));
  const loopPulse = 0.55 + 0.45 * Math.sin(p * Math.PI * 2);
  const exit = easeOut(seg(p, 0.62, 0.82));
  const q = easeOut(seg(p, 0.8, 0.94));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />

      <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1080 1920">
        {/* 底环：第一帧就有结构 */}
        <rect x={250} y={480} width={580} height={500} rx={120} fill="none" stroke="rgba(16,24,32,0.12)" strokeWidth={2} />
        {/* 闭环 */}
        <rect
          x={250}
          y={480}
          width={580}
          height={500}
          rx={120}
          fill="none"
          stroke={INK}
          strokeWidth={3}
          pathLength={100}
          strokeDasharray="100"
          strokeDashoffset={100 * (1 - draw)}
          opacity={0.5}
        />
        {/* 流光：一小段沿闭环走 */}
        <rect
          x={250}
          y={480}
          width={580}
          height={500}
          rx={120}
          fill="none"
          stroke={accent}
          strokeWidth={4}
          pathLength={100}
          strokeDasharray="12 88"
          strokeDashoffset={-100 * ((p * 0.8) % 1)}
          opacity={0.9 * draw}
          strokeLinecap="round"
        />

        {/* 节点 */}
        {NODES.map((n, i) => {
          const t = easeOut(seg(p, 0.1 + i * 0.045, 0.24 + i * 0.045));
          return <circle key={i} cx={n.x} cy={n.y} r={7 + 2 * loopPulse * t} fill={i % 2 === 0 ? accent : INK} opacity={0.25 + 0.7 * t} />;
        })}

        {/* 出口 */}
        <g opacity={exit}>
          <line x1={830} y1={730} x2={830 + 190 * exit} y2={730} stroke={accent} strokeWidth={3} strokeDasharray="9 7" />
          <path
            d={`M ${830 + 190 * exit - 18} ${730 - 12} L ${830 + 190 * exit + 4} ${730} L ${830 + 190 * exit - 18} ${730 + 12}`}
            fill="none"
            stroke={accent}
            strokeWidth={3}
          />
        </g>

        {/* 问号 */}
        <text
          x={1040}
          y={760}
          textAnchor="middle"
          fontFamily={MONO}
          fontSize={56}
          fontWeight={700}
          fill={accent}
          opacity={q}
        >
          ?
        </text>
      </svg>

      <div style={{ position: "absolute", left: 250, top: 1040, fontFamily: MONO, fontSize: 18, color: MUTED, letterSpacing: 4, opacity: clamp01(draw) }}>
        SUPPLY CHAIN / SELF-LOOP
      </div>

      <div style={{ position: "absolute", left: 250, top: 1090, opacity: exit, transform: `translateX(${(1 - exit) * 16}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: MONO, fontSize: 20, color: accent, letterSpacing: 2 }}>
          <span style={{ width: 40, height: 2, background: accent, display: "inline-block" }} />
          EXIT ?
        </div>
      </div>

      <Dot x={830} y={730} r={6} color={accent} halo opacity={exit} />
    </AbsoluteFill>
  );
};

export default Scene06;
