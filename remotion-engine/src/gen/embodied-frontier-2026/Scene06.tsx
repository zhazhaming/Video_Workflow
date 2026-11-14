// Scene06 · 物理边界与安全：杯子、手、反光，以及一条被挡住的攻击路径。
import React from "react";
import type { GenSceneProps } from "../types";
import {
  Callout, Card, Chip, Cup, GREEN, INK, MUTED, PAPER, SceneShell, Shield, Stamp,
  clamp01, easeInOut, easeOut, mono, rand,
} from "./ui";

const Hand: React.FC<{ p: number; accent: string }> = ({ p, accent }) => {
  const t = easeOut(clamp01((p - 0.28) / 0.22));
  return (
    <svg width={150} height={150} viewBox="0 0 150 150" style={{ position: "absolute", left: 690 + (1 - t) * 90, top: 706, opacity: t, overflow: "visible" }}>
      <path d="M 52 144 L 52 76 Q 52 62 64 62 Q 76 62 76 76 L 76 48 Q 76 34 88 34 Q 100 34 100 48 L 100 68 L 108 60 Q 120 50 128 60 Q 136 70 126 80 L 100 106 L 102 144 Z" fill={PAPER} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M 64 92 L 64 112 M 78 96 L 78 116 M 92 92 L 92 112" stroke={`${INK}45`} strokeWidth="2" />
      <path d="M 52 124 L 32 138" stroke={accent} strokeWidth="2" strokeDasharray="4 5" />
    </svg>
  );
};

const Gripper: React.FC<{ p: number; accent: string }> = ({ p, accent }) => {
  const close = easeInOut(clamp01((p - 0.16) / 0.2));
  return (
    <svg width={210} height={150} viewBox="0 0 210 150" style={{ position: "absolute", left: 284, top: 716, overflow: "visible" }}>
      <rect x="0" y="54" width="94" height="34" rx="8" fill={PAPER} stroke={INK} strokeWidth="3" />
      <rect x="82" y="62" width="34" height="18" rx="4" fill={accent} opacity="0.25" stroke={INK} strokeWidth="2" />
      <g transform={`translate(116 70) rotate(${close * -4})`}>
        <path d="M 0 0 L 34 -20 L 58 -12 L 58 -4 L 34 3 L 4 8 Z" fill={PAPER} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      </g>
      <g transform={`translate(116 70) rotate(${close * 4})`}>
        <path d="M 0 0 L 34 20 L 58 12 L 58 4 L 34 -3 L 4 -8 Z" fill={PAPER} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      </g>
      <path d="M 4 44 L 4 30 M 4 96 L 4 110" stroke={accent} strokeWidth="2" strokeDasharray="4 5" />
    </svg>
  );
};

const Scene06: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const sceneIn = easeOut(clamp01((p - 0.02) / 0.16));
  const cupX = 632 + 18 * easeInOut(clamp01((p - 0.22) / 0.2));
  const sweep = easeInOut(clamp01((p - 0.12) / 0.25));
  const netIn = clamp01((p - 0.32) / 0.14);
  const attack = easeInOut(clamp01((p - 0.4) / 0.2));
  const shield = clamp01((p - 0.44) / 0.14);
  const label = clamp01((p - 0.62) / 0.12);
  const warn1 = clamp01((p - 0.22) / 0.12);
  const warn2 = clamp01((p - 0.3) / 0.12);
  const warn3 = clamp01((p - 0.36) / 0.12);

  return (
    <SceneShell c1={c1} c2={c2} accent={accent} index={6} kicker="PHYSICAL AI / SAFETY" tag="EDGE CASES">
      <div style={{ position: "absolute", left: 190, top: 350, ...mono(12, `${INK}55`, 700), opacity: sceneIn }}>
        PHYSICAL LAYER
      </div>

      {/* 台面与杯子 */}
      <div style={{ position: "absolute", left: 150, top: 900, width: 780, height: 3, background: `${INK}55`, opacity: sceneIn }} />
      <div style={{ position: "absolute", left: 350, top: 910, width: 420, height: 14, background: `${INK}10`, borderRadius: "50%", opacity: sceneIn }} />
      <div style={{ position: "absolute", left: cupX, top: 760, opacity: sceneIn }}>
        <Cup x={0} y={0} s={0.86} tint={INK} rotate={3} />
      </div>

      {/* 窗光扫过 */}
      <div
        style={{
          position: "absolute", left: 520 + sweep * 110, top: 700, width: 46, height: 240,
          background: "linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.7), rgba(255,255,255,0))",
          transform: "rotate(18deg)", opacity: sceneIn * (0.25 + 0.4 * sweep), filter: "blur(2px)",
        }}
      />
      {/* 水渍 */}
      <div
        style={{
          position: "absolute", left: 570, top: 892, width: 150, height: 18, borderRadius: "50%",
          background: `linear-gradient(90deg, ${INK}0D, ${accent}22, ${INK}0D)`, transform: "skewX(-16deg)",
          opacity: sceneIn,
        }}
      />

      {/* 机械臂导轨：让夹爪读起来像“手臂”，而不是插座 */}
      <div style={{ position: "absolute", left: 150, top: 782, width: 150, height: 9, background: `${INK}22`, opacity: sceneIn }} />
      <div style={{ position: "absolute", left: 286, top: 764, width: 26, height: 26, borderRadius: "50%", border: `2.5px solid ${INK}`, background: PAPER, opacity: sceneIn }} />
      <Gripper p={p} accent={accent} />
      <Hand p={p} accent={accent} />

      {/* 物理风险标注 */}
      <Callout x={190} y={470} w={250} text="SLIP" sub="杯子在台面边缘" progress={warn1} color={accent} />
      <Callout x={190} y={552} w={250} text="GLARE" sub="反光让深度估计失真" progress={warn2} color={accent} />
      <Callout x={190} y={634} w={250} text="HUMAN" sub="人会突然进入工作空间" progress={warn3} color={accent} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <path d="M 440 492 C 520 510 570 540 620 600" stroke={`${accent}55`} strokeWidth="1.5" strokeDasharray="5 6" fill="none" opacity={warn1} />
        <path d="M 440 574 C 510 590 540 620 560 690" stroke={`${accent}55`} strokeWidth="1.5" strokeDasharray="5 6" fill="none" opacity={warn2} />
        <path d="M 440 656 C 560 680 680 700 790 750" stroke={`${accent}55`} strokeWidth="1.5" strokeDasharray="5 6" fill="none" opacity={warn3} />
      </svg>

      {/* 网络层 */}
      <div
        style={{
          position: "absolute", left: 626, top: 342, width: 270, height: 258,
          border: `1.5px dashed ${INK}44`, background: "rgba(255,253,246,0.5)",
          opacity: netIn, transform: `translateY(${(1 - netIn) * 10}px)`,
        }}
      >
        <div style={{ position: "absolute", left: 12, top: 10, ...mono(11, `${INK}66`, 700) }}>NETWORK LAYER</div>
        {[
          [36, 62], [108, 48], [198, 70], [72, 128], [166, 140], [222, 196], [52, 204],
        ].map(([x, y], i) => (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: x, top: y, width: 12, height: 12, borderRadius: "50%", border: `2px solid ${i === 5 ? accent : `${INK}55`}`, background: i === 5 ? `${accent}22` : PAPER }} />
            <div style={{ position: "absolute", left: x + 6, top: y + 6, width: 2, height: 2, borderRadius: "50%", background: INK }} />
          </React.Fragment>
        ))}
        <svg width={270} height={258} viewBox="0 0 270 258" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <path d="M 42 68 L 108 54 L 198 76 L 78 134 L 166 146 L 222 202 L 58 210 L 78 134 M 166 146 L 198 76" stroke={`${INK}30`} strokeWidth="1.2" fill="none" />
        </svg>
      </div>

      {/* 攻击路径：从网络层到物理层，被盾挡住 */}
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <path
          d="M 760 560 C 740 640 690 700 620 756"
          stroke={accent}
          strokeWidth="3"
          strokeDasharray="8 8"
          fill="none"
          opacity={attack * 0.9}
          strokeDashoffset={-attack * 40}
        />
        <circle cx="760" cy="560" r="6" fill={accent} opacity={attack} />
        <path d="M 620 756 L 636 744 M 620 756 L 632 770" stroke={accent} strokeWidth="2.5" opacity={attack} />
      </svg>

      <div style={{ position: "absolute", left: 438, top: 714, opacity: shield }}>
        <Shield x={0} y={0} s={1.1} color={GREEN} progress={shield} />
      </div>

      <Chip text="ATTACK SURFACE ≠ BENCHMARK" color={accent} size={12} style={{ position: "absolute", left: 636, top: 612, opacity: netIn }} />
      <Stamp text="CYBER = PHYSICAL" x={420} y={1038} progress={label} rotate={-3} size={18} />
      <div style={{ position: "absolute", left: 190, top: 1138, width: 700, ...mono(12, MUTED, 600), opacity: label, lineHeight: 1.8 }}>
        机器人不是一台会走的手机：控制链路被攻破，后果会落在人身上。
      </div>

      {Array.from({ length: 8 }, (_, k) => (
        <div
          key={k}
          style={{
            position: "absolute", left: 210 + rand(seed + k * 5) * 660,
            top: 380 + rand(seed + k * 5 + 1) * 650 - p * 16,
            width: 2 + rand(seed + k * 5 + 2) * 3,
            height: 2 + rand(seed + k * 5 + 2) * 3,
            borderRadius: "50%", background: accent, opacity: 0.12,
          }}
        />
      ))}
    </SceneShell>
  );
};

export default Scene06;
