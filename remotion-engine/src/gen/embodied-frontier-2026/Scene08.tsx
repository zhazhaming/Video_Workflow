// Scene08 · 结尾：摔倒、撑地、站起。给具身智能的成年礼。
import React from "react";
import type { GenSceneProps } from "../types";
import {
  Chip, Cup, Dust, INK, PAPER, SceneShell, Stamp,
  clamp01, easeInOut, easeOut, lerp, mono, rand,
} from "./ui";

type Pt = [number, number];

const A: Record<string, Pt> = {
  hip: [250, 430], shoulder: [300, 310], head: [330, 250],
  lElbow: [235, 455], lHand: [190, 545],
  rElbow: [330, 375], rHand: [350, 445],
  lKnee: [286, 525], lFoot: [244, 600],
  rKnee: [224, 508], rFoot: [204, 600],
};
const B: Record<string, Pt> = {
  hip: [230, 340], shoulder: [230, 200], head: [230, 140],
  lElbow: [195, 260], lHand: [180, 335],
  rElbow: [265, 260], rHand: [280, 335],
  lKnee: [210, 470], lFoot: [200, 600],
  rKnee: [250, 470], rFoot: [260, 600],
};

const Bone: React.FC<{ a: Pt; b: Pt; w: number; color?: string }> = ({ a, b, w, color = INK }) => (
  <>
    <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeWidth={w + 6} strokeLinecap="round" />
    <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={PAPER} strokeWidth={w} strokeLinecap="round" />
  </>
);

const KneelBot: React.FC<{ pose: number; accent: string; opacity: number }> = ({ pose, accent, opacity }) => {
  const t = easeInOut(clamp01(pose));
  const P: Record<string, Pt> = {};
  (Object.keys(A) as string[]).forEach((k) => {
    P[k] = [lerp(A[k][0], B[k][0], t), lerp(A[k][1], B[k][1], t)];
  });
  const { hip, shoulder, head, lElbow, lHand, rElbow, rHand, lKnee, lFoot, rKnee, rFoot } = P;
  const headTilt = lerp(16, 0, t);
  const chest: Pt = [lerp(hip[0], shoulder[0], 0.45), lerp(hip[1], shoulder[1], 0.45)];
  return (
    <svg width={400} height={650} viewBox="0 0 400 650" style={{ position: "absolute", left: 330, top: 500, opacity, overflow: "visible" }}>
      <ellipse cx={hip[0]} cy={608} rx={lerp(120, 90, t)} ry={lerp(15, 11, t)} fill={`${INK}20`} />
      {/* 后腿 */}
      <Bone a={hip} b={lKnee} w={20} />
      <Bone a={lKnee} b={lFoot} w={17} />
      <circle cx={lKnee[0]} cy={lKnee[1]} r="11" fill={PAPER} stroke={INK} strokeWidth="2.5" />
      {/* 躯干 */}
      <Bone a={hip} b={shoulder} w={44} />
      <rect x={chest[0] - 17} y={chest[1] - 21} width="34" height="42" rx="8" fill={`${accent}12`} stroke={`${accent}88`} strokeWidth="2" transform={`rotate(${headTilt} ${chest[0]} ${chest[1]})`} />
      <circle cx={chest[0]} cy={chest[1]} r="5" fill={accent} opacity="0.8" />
      {/* 前腿 */}
      <Bone a={hip} b={rKnee} w={20} />
      <Bone a={rKnee} b={rFoot} w={17} />
      <circle cx={rKnee[0]} cy={rKnee[1]} r="11" fill={PAPER} stroke={INK} strokeWidth="2.5" />
      <circle cx={hip[0]} cy={hip[1]} r="13" fill={PAPER} stroke={INK} strokeWidth="3" />
      {/* 手臂 */}
      <Bone a={shoulder} b={lElbow} w={14} />
      <Bone a={lElbow} b={lHand} w={12} />
      <circle cx={lElbow[0]} cy={lElbow[1]} r="8" fill={PAPER} stroke={INK} strokeWidth="2.5" />
      <circle cx={lHand[0]} cy={lHand[1]} r="6" fill={PAPER} stroke={INK} strokeWidth="2.5" />
      <Bone a={shoulder} b={rElbow} w={14} />
      <Bone a={rElbow} b={rHand} w={12} />
      <circle cx={rElbow[0]} cy={rElbow[1]} r="8" fill={PAPER} stroke={INK} strokeWidth="2.5" />
      <circle cx={rHand[0]} cy={rHand[1]} r="6" fill={PAPER} stroke={INK} strokeWidth="2.5" />
      {/* 头 */}
      <g transform={`rotate(${headTilt} ${head[0]} ${head[1]})`}>
        <rect x={head[0] - 38} y={head[1] - 42} width="76" height="84" rx="26" fill={PAPER} stroke={INK} strokeWidth="3.2" />
        <rect x={head[0] - 27} y={head[1] - 20} width="54" height="30" rx="15" fill={INK} />
        <circle cx={head[0] - 12} cy={head[1] - 5} r="5" fill={PAPER} />
        <circle cx={head[0] + 12} cy={head[1] - 5} r="5" fill={PAPER} />
        <path d={`M ${head[0] - 10} ${head[1] + 22} L ${head[0] + 10} ${head[1] + 22}`} stroke={accent} strokeWidth="4" strokeLinecap="round" />
        <path d={`M ${head[0] - 38} ${head[1] - 22} L ${head[0] - 52} ${head[1] - 34} M ${head[0] + 38} ${head[1] - 22} L ${head[0] + 52} ${head[1] - 34}`} stroke={INK} strokeWidth="3" strokeLinecap="round" />
        <circle cx={head[0] - 53} cy={head[1] - 35} r="4" fill={accent} />
        <circle cx={head[0] + 53} cy={head[1] - 35} r="4" fill={accent} />
      </g>
      {/* 手撑地的接触点 */}
      <circle cx={lHand[0]} cy={lHand[1] + 4} r={lerp(18, 0, t)} fill="none" stroke={accent} strokeWidth="1.5" opacity={0.5 * (1 - t)} />
    </svg>
  );
};

const Scene08: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const doorIn = easeOut(clamp01((p - 0.02) / 0.2));
  const base = easeInOut(clamp01((p - 0.2) / 0.58));
  const dip = 0.06 * Math.sin(clamp01((p - 0.46) / 0.22) * Math.PI);
  const pose = clamp01(base - dip);
  const look = clamp01((p - 0.66) / 0.2);
  const light = 0.24 + 0.26 * easeOut(clamp01((p - 0.2) / 0.6));
  const path = easeOut(clamp01((p - 0.18) / 0.55));
  const tag = clamp01((p - 0.78) / 0.1);
  const stumble = clamp01((p - 0.2) / 0.12);
  const recover = clamp01((p - 0.5) / 0.14);
  const rays = clamp01((p - 0.1) / 0.4);

  return (
    <SceneShell c1={c1} c2={c2} accent={accent} index={8} kicker="LONG TERM / THE FIRST STEP" tag="COMING OF AGE">
      {/* 门框与晨光 */}
      <div
        style={{
          position: "absolute", left: 180, top: 320, width: 720, height: 812,
          border: `2.5px solid ${INK}66`, opacity: doorIn,
        }}
      />
      <div
        style={{
          position: "absolute", left: 246, top: 384, width: 588, height: 684,
          background: `linear-gradient(160deg, ${PAPER} 0%, #F5DFC0 58%, #E9C79C 100%)`,
          opacity: doorIn, overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(118deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 56%)",
            opacity: light,
          }}
        />
        {/* 斜向光带 */}
        <div
          style={{
            position: "absolute", left: -80, top: -120, width: 260, height: 900,
            background: "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))",
            transform: "rotate(24deg)", opacity: rays * 0.55,
          }}
        />
        <div
          style={{
            position: "absolute", left: 290, top: -120, width: 120, height: 900,
            background: "linear-gradient(180deg, rgba(255,255,255,0.38), rgba(255,255,255,0))",
            transform: "rotate(24deg)", opacity: rays * 0.42,
          }}
        />
      </div>

      {/* 地面 */}
      <div style={{ position: "absolute", left: 150, top: 1120, width: 780, height: 3, background: `${INK}55`, opacity: doorIn }} />
      <div style={{ position: "absolute", left: 270, top: 1132, width: 540, height: 18, background: `${INK}12`, borderRadius: "50%", opacity: doorIn }} />

      {/* 摔倒的杯子 */}
      <div style={{ position: "absolute", left: 252, top: 1038, opacity: doorIn * (1 - 0.15 * pose) }}>
        <Cup x={0} y={0} s={0.6} tint={`${INK}88`} rotate={74} />
      </div>

      {/* 支撑轨迹 */}
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <path
          d="M 438 1052 C 410 952 458 856 548 790"
          stroke={accent}
          strokeWidth="2.2"
          strokeDasharray="7 10"
          fill="none"
          opacity={0.25 + 0.55 * path}
          strokeDashoffset={360 * (1 - path)}
        />
        <circle cx="548" cy="790" r="5" fill={accent} opacity={path} />
      </svg>

      <KneelBot pose={pose} accent={accent} opacity={doorIn} />

      <Chip text="2026 → ?" color={INK} size={14} style={{ position: "absolute", left: 190, top: 1170, opacity: tag }} />
      <Stamp text="COMING OF AGE" x={600} y={1000} progress={tag} rotate={-4} size={17} />
      <div style={{ position: "absolute", left: 190, top: 1236, ...mono(11, `${INK}55`, 700), opacity: tag }}>
        NOT A PRODUCT LAUNCH / A CAPABILITY MILESTONE
      </div>

      <Dust seed={seed + 12} p={p} color={accent} count={24} opacity={0.34} />
      {Array.from({ length: 5 }, (_, k) => (
        <span
          key={k}
          style={{
            position: "absolute", left: 500 + rand(seed + k * 7) * 300,
            top: 800 + rand(seed + k * 7 + 1) * 260,
            width: 2 + rand(seed + k * 7 + 2) * 3,
            height: 2 + rand(seed + k * 7 + 2) * 3,
            borderRadius: "50%", background: acentSafe(accent), opacity: 0.2,
          }}
        />
      ))}
    </SceneShell>
  );
};

const acentSafe = (a: string) => a;

export default Scene08;
