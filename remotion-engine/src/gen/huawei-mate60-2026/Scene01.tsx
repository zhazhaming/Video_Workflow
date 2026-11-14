// Scene01 · 墙：7 纳米尺度 → 一道叫 EUV 的墙 → 华为从缺口绕过去
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Dot, MONO, SANS, INK, MUTED, LINE, seg, easeOut, mk } from "./ui";

const Scene01: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = mk(marks, 1, 0.34);
  const m3 = mk(marks, 3, 0.7);

  const lens = easeOut(seg(p, 0.02, 0.2));
  const wall = easeOut(seg(p, m1 - 0.04, m1 + 0.12));
  // 缺口在「直接上架」那句才打开：买不到 ≠ 已经绕过去
  const gap = easeOut(seg(p, m3 - 0.06, m3 + 0.12));
  const beam = easeOut(seg(p, m3, m3 + 0.2));

  const cx = 330;
  const cy = 720;
  const r = 196;
  const wallX = 636;
  const wallW = 150;
  const gapTop = 616;
  const gapH = 190;

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />

      {/* 发丝 */}
      <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1080 1920">
        <path
          d="M 110 420 Q 360 350 620 410 T 1000 380"
          fill="none"
          stroke="rgba(16,24,32,0.45)"
          strokeWidth={4}
          opacity={0.9}
        />
        {Array.from({ length: 24 }, (_, i) => (
          <line
            key={i}
            x1={130 + i * 34}
            y1={392 - (i % 3) * 3}
            x2={130 + i * 34}
            y2={452 + (i % 4) * 4}
            stroke="rgba(16,24,32,0.15)"
            strokeWidth={1.3}
          />
        ))}
      </svg>

      {/* 放大镜 + 7 nm 标尺 */}
      <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1080 1920">
        <circle cx={cx} cy={cy} r={r} fill="rgba(248,250,251,0.7)" stroke={INK} strokeWidth={2} opacity={0.4 * lens} />
      </svg>
      <div style={{ position: "absolute", left: cx - r + 30, top: cy - 40, width: (r - 30) * 2, opacity: lens }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              style={{
                width: 1.5,
                height: i === 0 || i === 4 ? 30 : 18,
                background: i === 3 ? accent : "rgba(16,24,32,0.5)",
                transform: `scaleY(${easeOut(seg(p, 0.06, 0.28))})`,
                transformOrigin: "bottom",
              }}
            />
          ))}
        </div>
        <div style={{ height: 2, background: INK, opacity: 0.55 }} />
        <div style={{ marginTop: 14, display: "flex", alignItems: "baseline", gap: 8, fontFamily: MONO, color: accent, opacity: easeOut(seg(p, 0.12, 0.32)) }}>
          <span style={{ fontSize: 88, fontWeight: 700, letterSpacing: -3 }}>7</span>
          <span style={{ fontSize: 28, fontWeight: 700 }}>nm</span>
        </div>
      </div>

      {/* 墙：从上落下 */}
      <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1080 1920" opacity={wall}>
        <g transform={`translate(0 ${(1 - wall) * -120})`}>
          <rect x={wallX} y={-200} width={wallW} height={gapTop + 200} fill="rgba(16,24,32,0.82)" />
          <rect
            x={wallX}
            y={gapTop + gapH * gap}
            width={wallW}
            height={Math.max(0, 1216 - (gapTop + gapH * gap))}
            fill="rgba(16,24,32,0.82)"
          />
          <text x={wallX + wallW / 2} y={gapTop - 96} textAnchor="middle" fontFamily={SANS} fontSize={30} fill="#F8FAFB" letterSpacing={4}>
            光刻机
          </text>
          <text x={wallX + wallW / 2} y={gapTop - 62} textAnchor="middle" fontFamily={MONO} fontSize={16} fill="rgba(248,250,251,0.6)" letterSpacing={4}>
            EUV
          </text>
        </g>
      </svg>

      {/* 缺口：光穿过 */}
      <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1080 1920">
        <defs>
          <linearGradient id="beamGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={accent} stopOpacity="0.5" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x={wallX + wallW} y={gapTop} width={520 * beam} height={gapH} fill="url(#beamGrad)" opacity={0.9} />
        <line x1={wallX} y1={gapTop} x2={wallX + wallW} y2={gapTop} stroke={accent} strokeWidth={3} opacity={gap} />
        <line x1={wallX} y1={gapTop + gapH} x2={wallX + wallW} y2={gapTop + gapH} stroke={accent} strokeWidth={3} opacity={gap} />
      </svg>

      {/* 绕过缺口的箭头 */}
      <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1080 1920" opacity={gap}>
        <path
          d={`M 120 ${gapTop + gapH / 2} C 380 ${gapTop + gapH / 2 - 30}, 520 ${gapTop + gapH / 2 - 30}, ${wallX - 20} ${gapTop + gapH / 2}`}
          fill="none"
          stroke={accent}
          strokeWidth={3}
          strokeDasharray="10 8"
        />
        <path d={`M ${wallX - 30} ${gapTop + gapH / 2 - 9} L ${wallX - 10} ${gapTop + gapH / 2} L ${wallX - 30} ${gapTop + gapH / 2 + 9}`} fill="none" stroke={accent} strokeWidth={3} />
      </svg>

      <div style={{ position: "absolute", left: 120, top: 1010, width: 300, height: 1, background: LINE, opacity: lens }} />
      <div style={{ position: "absolute", left: 120, top: 1040, fontFamily: MONO, fontSize: 15, color: MUTED, letterSpacing: 3, opacity: 0.8 * lens }}>
        SCALE / 7 nm
      </div>

      <Dot x={wallX + wallW / 2} y={gapTop + gapH / 2} r={5} color={accent} halo opacity={gap} />
    </AbsoluteFill>
  );
};

export default Scene01;
