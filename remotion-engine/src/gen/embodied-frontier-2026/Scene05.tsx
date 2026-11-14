// Scene05 · 30 个没见过的家：一条路径，两根成功率柱。
import React from "react";
import type { GenSceneProps } from "../types";
import {
  Chip, House, INK, MUTED, PAPER, SceneShell, Stamp,
  clamp01, easeOut, mono, rand, stagger,
} from "./ui";

const COLS = 6;
const ROWS = 5;
const CELL_X = 112;
const CELL_Y = 88;
const ORIGIN_X = 190;
const ORIGIN_Y = 384;

const housePt = (k: number): [number, number] => {
  const r = Math.floor(k / COLS);
  const c0 = k % COLS;
  const c = r % 2 === 0 ? c0 : COLS - 1 - c0;
  return [ORIGIN_X + c * CELL_X + 26, ORIGIN_Y + r * CELL_Y + 28];
};

const Scene05: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const gridIn = clamp01((p - 0.02) / 0.2);
  const pathT = easeOut(clamp01((p - 0.16) / 0.38));
  const barT = easeOut(clamp01((p - 0.1) / 0.22));
  const valT = 1;
  const stamp = clamp01((p - 0.76) / 0.12);
  const note = clamp01((p - 0.7) / 0.12);

  const pts = Array.from({ length: 30 }, (_, k) => housePt(k));
  const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
  const travel = clamp01((p - 0.22) / 0.46) * 29;
  const idx = Math.min(28, Math.floor(travel));
  const frac = travel - idx;
  const dotX = pts[idx][0] + (pts[idx + 1][0] - pts[idx][0]) * frac;
  const dotY = pts[idx][1] + (pts[idx + 1][1] - pts[idx][1]) * frac;

  const bars = [
    { y: 960, value: 9, color: `${INK}55`, label: "FROM SCRATCH", sub: "9%" },
    { y: 1082, value: 56, color: accent, label: "INDEX PRETRAIN", sub: "56%" },
  ];

  return (
    <SceneShell c1={c1} c2={c2} accent={accent} index={5} kicker="HELIX 2.5 / ZERO-SHOT" tag="30 HOMES">
      <div style={{ position: "absolute", left: 190, top: 342, display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontFamily: "sans-serif", fontSize: 34, fontWeight: 900, color: INK, letterSpacing: 0.5 }}>30 个没见过的家</span>
      </div>

      {Array.from({ length: 30 }, (_, k) => {
        const [x, y] = housePt(k);
        const t = stagger(gridIn, 0, 0.018, k, 0.2);
        const near = Math.abs(k - Math.floor(travel)) < 1.2;
        return (
          <React.Fragment key={k}>
            <House x={x} y={y} s={0.62} opacity={t * (near ? 0.98 : 0.55)} color={near ? accent : INK} />
            <div
              style={{
                position: "absolute", left: x + 8, top: y + 60, ...mono(9, `${INK}55`, 600),
                opacity: t * 0.8,
              }}
            >
              {String(k + 1).padStart(2, "0")}
            </div>
          </React.Fragment>
        );
      })}

      {/* 路径 */}
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <path
          d={path}
          fill="none"
          stroke={accent}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="8 9"
          strokeDashoffset={680 * (1 - pathT)}
          opacity={0.75}
        />
        <circle cx={dotX} cy={dotY} r="8" fill={accent} opacity={0.95} />
        <circle cx={dotX} cy={dotY} r="16" fill="none" stroke={accent} strokeWidth="1.5" opacity={0.35} />
      </svg>

      <Chip text="3 TASKS / NO FINE-TUNING" color={accent} size={13} style={{ position: "absolute", left: 642, top: 342 }} />

      {/* 成功率柱 */}
      <div style={{ position: "absolute", left: 190, top: 866, ...mono(13, INK, 800) }}>FULL-TASK SUCCESS</div>
      {bars.map((b) => (
        <React.Fragment key={b.label}>
          <div style={{ position: "absolute", left: 190, top: b.y + 6, ...mono(13, MUTED, 700) }}>{b.label}</div>
          <div style={{ position: "absolute", left: 190, top: b.y + 28, width: 500, height: 32, background: `${INK}0D`, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${b.value * barT}%`, height: "100%", background: b.color, borderRadius: 2 }} />
          </div>
          <div style={{ position: "absolute", left: 710, top: b.y + 18, ...mono(34, b.color, 900), opacity: 0.3 + 0.7 * valT }}>
            {Math.round(b.value * valT)}%
          </div>
        </React.Fragment>
      ))}

      <div style={{ position: "absolute", left: 190, top: 1158, ...mono(12, MUTED, 600), opacity: note, lineHeight: 1.8 }}>
        56% = 全部玩具收进篮子 / 全部毛巾叠好 / 整张床铺完<br />
        <span style={{ color: INK }}>没有部分分，也没有在评测家庭微调。</span>
      </div>

      <Stamp text="ZERO-SHOT" x={666} y={852} progress={stamp} rotate={-4} size={19} />
      <div style={{ position: "absolute", left: 190, top: 810, width: 80, height: 2, background: `${INK}30` }} />
      <div style={{ position: "absolute", left: 190, top: 822, ...mono(11, `${INK}55`, 600) }}>FIG.05 / HELIX DATA SCALING</div>
    </SceneShell>
  );
};

const Callout30: React.FC<{ p: number; accent: string }> = ({ p, accent }) => {
  const t = clamp01((p - 0.58) / 0.14);
  if (t <= 0) return null;
  return (
    <div
      style={{
        position: "absolute", left: 600, top: 666, width: 270, padding: "12px 14px",
        background: "rgba(255,253,246,0.82)", border: `1.5px solid ${accent}66`,
        opacity: t, transform: `translateY(${(1 - t) * 8}px)`,
      }}
    >
      <div style={mono(12, accent, 800)}>INDEX / HUMAN EXPERIENCE</div>
      <div style={{ ...mono(11, MUTED, 600), marginTop: 6, lineHeight: 1.7 }}>
        Figure 的预训练数据来自人类行为视频，<br />
        不是这 30 个家的机器人数据。
      </div>
    </div>
  );
};

export default Scene05;
