// Scene02 · 仿真考场：42 个任务格 + 三根分数柱。
import React from "react";
import type { GenSceneProps } from "../types";
import {
  BLUE, Chip, INK, MUTED, ORANGE, PAPER, SceneShell, Stamp,
  clamp01, easeBack, easeOut, mono, rand, sans, stagger,
} from "./ui";

const Scene02: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const tilesIn = clamp01((p - 0.02) / 0.22);
  const grow = easeBack(clamp01((p - 0.22) / 0.24));
  const vF = 64.9 * easeOut(clamp01((p - 0.13) / 0.15));
  const vP = 27.6 * easeOut(clamp01((p - 0.19) / 0.15));
  const vA = 29.8 * easeOut(clamp01((p - 0.25) / 0.15));
  const scan = ((p - 0.08) / 0.24) % 1;
  const note = clamp01((p - 0.76) / 0.12);

  const baseline = 1010;
  const unit = 6;
  const barW = 156;

  const bars = [
    { x: 224, value: 64.9, color: accent, name: "FABLE 5.2", tag: "NEW", v: vF },
    { x: 468, value: 27.6, color: `${INK}55`, name: "FABLE 5.1", tag: "PREV", v: vP },
    { x: 712, value: 29.8, color: BLUE, name: "GPT-6 ASTRA", tag: "RIVAL", v: vA },
  ];

  return (
    <SceneShell c1={c1} c2={c2} accent={accent} index={2} kicker="ROBODOJO / SIM" tag="SCOREBOARD">
      <div style={{ position: "absolute", left: 190, top: 344, display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={mono(19, INK, 900)}>42 TASKS</span>
        <span style={mono(14, MUTED, 600)}>GENERALIZATION / MEMORY / PRECISION / LONG-HORIZON / OPEN VOCAB</span>
      </div>

      {/* 42 个任务格 */}
      {Array.from({ length: 42 }, (_, k) => {
        const c = k % 14;
        const r = Math.floor(k / 14);
        const t = stagger(tilesIn, 0, 0.012, k, 0.18);
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: 190 + c * 32,
              top: 382 + r * 32,
              width: 25,
              height: 25,
              boxSizing: "border-box",
              border: `1.5px solid ${t < 0.5 ? `${INK}28` : `${accent}AA`}`,
              background: t < 0.5 ? "transparent" : `${accent}12`,
              opacity: t,
              transform: `scale(${0.65 + 0.35 * t})`,
            }}
          />
        );
      })}
      {/* 扫描线 */}
      <div
        style={{
          position: "absolute", left: 190 + scan * 434, top: 376, width: 2, height: 104,
          background: accent, opacity: tilesIn * (1 - clamp01((p - 0.3) / 0.1)) * 0.7,
          boxShadow: `0 0 12px ${accent}88`,
        }}
      />

      <Chip text="SIMULATED" color={accent} size={14} style={{ position: "absolute", left: 646, top: 392 }} />
      <div style={{ position: "absolute", left: 646, top: 438, width: 220, ...mono(13, MUTED, 600), lineHeight: 1.7 }}>
        <div>42 SIM TASKS</div>
        <div>18 REAL TASKS</div>
        <div style={{ color: accent }}>NOT THE SAME THING</div>
      </div>

      {/* 坐标网格 */}
      {[25, 50, 75].map((v) => (
        <React.Fragment key={v}>
          <div style={{ position: "absolute", left: 190, top: baseline - v * unit, width: 700, height: 1.5, background: `${INK}12` }} />
          <div style={{ position: "absolute", left: 900, top: baseline - v * unit - 9, ...mono(12, `${INK}55`, 600) }}>{v}</div>
        </React.Fragment>
      ))}
      <div style={{ position: "absolute", left: 190, top: baseline, width: 700, height: 2.5, background: `${INK}55` }} />

      {bars.map((b, i) => {
        const h = b.v * unit * grow;
        return (
          <React.Fragment key={b.name}>
            <div
              style={{
                position: "absolute", left: b.x, top: baseline - h, width: barW, height: Math.max(2, h),
                background: b.color, opacity: i === 1 ? 0.75 : 1, borderRadius: "3px 3px 0 0",
                boxShadow: i === 0 ? `7px 0 0 ${accent}22` : "none",
              }}
            />
            <div style={{ position: "absolute", left: b.x, top: baseline - h - 54, width: barW, textAlign: "center", ...mono(42, INK, 900) }}>
              {b.v.toFixed(1)}
            </div>
            <div style={{ position: "absolute", left: b.x, top: baseline + 14, width: barW, textAlign: "center", ...mono(16, INK, 800) }}>
              {b.name}
            </div>
            <div style={{ position: "absolute", left: b.x, top: baseline + 38, width: barW, textAlign: "center", ...mono(12, MUTED, 600) }}>
              {b.tag}
            </div>
          </React.Fragment>
        );
      })}

      <Stamp text="64.9" x={700} y={642} progress={clamp01((p - 0.58) / 0.12)} color={accent} rotate={-6} size={22} />
      <div style={{ position: "absolute", left: 190, top: 1120, width: 700, ...mono(14, MUTED, 600), opacity: note, lineHeight: 1.7 }}>
        ANTHROPIC INTERNAL RUN / SIMULATION ONLY<br />
        <span style={{ color: INK }}>最高可用 effort，不等于真机成功率。</span>
      </div>

      <div
        style={{
          position: "absolute", left: 178, top: 330, width: 10, height: 690,
          background: `linear-gradient(${accent}, ${accent}00)`, opacity: 0.18,
        }}
      />
      <div style={{ position: "absolute", right: 170, top: 1140, ...mono(11, `${INK}44`, 600), writingMode: "vertical-rl" }}>
        FIG.02 / SIM-REAL GAP
      </div>
      <DustSeed seed={seed} p={p} accent={accent} />
    </SceneShell>
  );
};

const DustSeed: React.FC<{ seed: number; p: number; accent: string }> = ({ seed, p, accent }) => (
  <>
    {Array.from({ length: 10 }, (_, k) => (
      <div
        key={k}
        style={{
          position: "absolute",
          left: 200 + rand(seed + k * 3) * 680,
          top: 320 + rand(seed + k * 3 + 1) * 780 - p * 22,
          width: 2 + rand(seed + k * 3 + 2) * 3,
          height: 2 + rand(seed + k * 3 + 2) * 3,
          borderRadius: "50%",
          background: accent,
          opacity: 0.12,
        }}
      />
    ))}
  </>
);

export default Scene02;
