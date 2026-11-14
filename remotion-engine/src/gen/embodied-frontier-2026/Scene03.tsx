// Scene03 · 仿真与真机之间：一座会断的桥。
import React from "react";
import type { GenSceneProps } from "../types";
import {
  BLUE, Callout, Card, Chip, Cup, INK, MUTED, ORANGE, PAPER, SceneShell, Stamp,
  clamp01, easeInOut, easeOut, mono, sans,
} from "./ui";

const SimCube: React.FC<{ p: number; accent: string }> = ({ p, accent }) => {
  const a = 18 + Math.sin(p * Math.PI * 2) * 6;
  return (
    <svg width={250} height={240} viewBox="0 0 250 240" style={{ position: "absolute", left: 44, top: 104, overflow: "visible" }}>
      <g transform={`rotate(${a} 125 120)`}>
        <path d="M 125 22 L 218 74 L 218 168 L 125 220 L 32 168 L 32 74 Z" fill={`${accent}08`} stroke={INK} strokeWidth="2.2" />
        <path d="M 32 74 L 125 126 L 218 74 M 125 126 L 125 220" fill="none" stroke={`${INK}88`} strokeWidth="2" />
        <path d="M 52 86 L 52 156 M 78 100 L 78 170 M 104 114 L 104 184" stroke={`${accent}70`} strokeWidth="1.5" strokeDasharray="5 7" />
        <path d="M 168 86 L 168 156 M 194 100 L 194 170" stroke={`${INK}44`} strokeWidth="1.5" strokeDasharray="5 7" />
        <circle cx="125" cy="126" r="5" fill={accent} />
        <path d="M 125 126 L 125 42" stroke={accent} strokeWidth="2" strokeDasharray="4 6" />
        <path d="M 125 42 L 118 54 M 125 42 L 132 54" stroke={accent} strokeWidth="2" fill="none" />
      </g>
      <text x="14" y="232" fontFamily="monospace" fontSize="12" fill={`${INK}66`} letterSpacing="1">RIGID BODY / NO FRICTION</text>
    </svg>
  );
};

const RealHand: React.FC<{ p: number; accent: string }> = ({ p, accent }) => {
  const t = easeOut(clamp01((p - 0.3) / 0.2));
  return (
    <svg width={180} height={170} viewBox="0 0 180 170" style={{ position: "absolute", left: 206 + (1 - t) * 80, top: 128, opacity: t, overflow: "visible" }}>
      <path d="M 66 164 L 66 82 Q 66 66 80 66 Q 94 66 94 82 L 94 46 Q 94 30 108 30 Q 122 30 122 46 L 122 66 L 130 58 Q 142 46 152 58 Q 162 70 150 82 L 120 112 L 122 164 Z" fill={PAPER} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M 80 98 L 80 122 M 96 104 L 96 128 M 112 100 L 112 126" stroke={`${INK}45`} strokeWidth="2" />
      <path d="M 66 140 L 44 154" stroke={accent} strokeWidth="2" strokeDasharray="4 5" />
    </svg>
  );
};

const Scene03: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const leftIn = easeOut(clamp01((p - 0.02) / 0.18));
  const rightIn = easeOut(clamp01((p - 0.08) / 0.18));
  const bridge = easeInOut(clamp01((p - 0.28) / 0.28));
  const fall = clamp01((p - 0.56) / 0.22);
  const stamp = clamp01((p - 0.68) / 0.12);
  const cupX = 112 + 20 * easeInOut(clamp01((p - 0.4) / 0.3));
  const robot = easeOut(clamp01((p - 0.52) / 0.18));

  return (
    <SceneShell c1={c1} c2={c2} accent={accent} index={3} kicker="SIM ≠ REAL" tag="THE GAP">
      {/* 左：仿真窗口 */}
      <Card x={150} y={382} w={340} h={472} opacity={leftIn} scale={0.96 + 0.04 * leftIn} bg="#F7FAF8">
        <div style={{ position: "absolute", left: 18, top: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, background: accent }} />
          <span style={mono(17, INK, 900)}>SIM</span>
          <span style={mono(11, MUTED, 600)}>42 TASKS</span>
        </div>
        <SimCube p={p} accent={accent} />
        <div style={{ position: "absolute", left: cupX, top: 250 }}>
          <Cup x={0} y={0} s={0.78} tint={`${INK}AA`} />
        </div>
        <div style={{ position: "absolute", left: 22, bottom: 16, ...mono(11, `${INK}55`, 600) }}>ISAAC SIM / PARALLEL</div>
      </Card>

      {/* 右：真实厨房窗口 */}
      <Card x={590} y={382} w={340} h={472} opacity={rightIn} scale={0.96 + 0.04 * rightIn} bg="#FBF5E9">
        <div style={{ position: "absolute", left: 18, top: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, background: BLUE }} />
          <span style={mono(17, INK, 900)}>REAL</span>
          <span style={mono(11, MUTED, 600)}>18 TASKS</span>
        </div>
        {/* 窗光 */}
        <div
          style={{
            position: "absolute", left: 30, top: 48, width: 280, height: 220,
            background: "linear-gradient(118deg, rgba(255,255,255,0.8), rgba(255,255,255,0) 62%)",
            clipPath: "polygon(0 0, 100% 0, 62% 100%, 18% 100%)", opacity: 0.72,
          }}
        />
        <div style={{ position: "absolute", left: 26, top: 342, width: 288, height: 3, background: `${INK}55` }} />
        <div style={{ position: "absolute", left: 70, top: 350, width: 200, height: 8, background: `${INK}12`, borderRadius: "50%" }} />
        {/* 杯子靠近台面边缘 */}
        <div style={{ position: "absolute", left: 132, top: 246 }}>
          <Cup x={0} y={0} s={0.86} tint={INK} rotate={4} />
        </div>
        {/* 水渍反光 */}
        <div
          style={{
            position: "absolute", left: 188, top: 322, width: 92, height: 20, borderRadius: "50%",
            background: `linear-gradient(90deg, ${BLUE}20, ${accent}22)`, transform: "skewX(-18deg)",
          }}
        />
        <RealHand p={p} accent={accent} />
        <div style={{ position: "absolute", left: 22, bottom: 16, ...mono(11, `${INK}55`, 600) }}>BAY AREA HOME / UNSEEN</div>
      </Card>

      {/* 桥 */}
      <div style={{ position: "absolute", left: 150, top: 872, width: 780, height: 2, background: `${INK}18` }} />
      {Array.from({ length: 9 }, (_, k) => {
        if (k === 4) return null;
        const x = 320 + k * 54;
        const side = k < 4 ? -1 : 1;
        const f = clamp01((fall - Math.abs(k - 4) * 0.018) / 0.3);
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: x,
              top: 862 + f * f * 84,
              width: 48,
              height: 18,
              border: `2px solid ${k < 4 ? accent : BLUE}`,
              background: PAPER,
              opacity: 0.25 + 0.75 * bridge,
              transform: `rotate(${side * f * 24}deg) translateX(${side * f * 8}px)`,
            }}
          />
        );
      })}
      {/* 断口 */}
      <div style={{ position: "absolute", left: 508, top: 850, width: 2, height: 42, background: `${INK}25` }} />
      <div style={{ position: "absolute", left: 500, top: 824, ...mono(11, MUTED, 700) }}>GAP</div>

      {/* 桥上的小机器人 */}
      <div
        style={{
          position: "absolute", left: 500, top: 806,
          opacity: robot, transform: `translateY(${(1 - robot) * 14}px)`,
        }}
      >
        <div style={{ width: 34, height: 30, borderRadius: 9, background: PAPER, border: `2.5px solid ${INK}`, position: "relative" }}>
          <span style={{ position: "absolute", left: 7, top: 10, width: 5, height: 5, background: accent }} />
          <span style={{ position: "absolute", right: 7, top: 10, width: 5, height: 5, background: accent }} />
        </div>
        <div style={{ width: 22, height: 24, margin: "4px auto 0", border: `2.5px solid ${INK}`, borderRadius: 5, background: PAPER }} />
      </div>

      <Stamp text="SIM ≠ REAL" x={462} y={722} progress={stamp} rotate={-5} size={22} />
      <Callout x={196} y={920} w={300} text="42 SIM TASKS" sub="可并行、可重跑、可作弊" progress={clamp01((p - 0.32) / 0.14)} color={accent} />
      <Callout x={610} y={920} w={280} text="18 REAL TASKS" sub="会滑、会反光、会有人" progress={clamp01((p - 0.32) / 0.14)} color={BLUE} align="right" />
      <div style={{ position: "absolute", left: 190, top: 1130, ...mono(13, MUTED, 700), opacity: clamp01((p - 0.7) / 0.12) }}>
        ROBODOJO / ARXIV 2607.04434
      </div>
    </SceneShell>
  );
};

export default Scene03;
