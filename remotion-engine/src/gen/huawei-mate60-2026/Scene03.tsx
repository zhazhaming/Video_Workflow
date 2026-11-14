// Scene03 · 拆解：剖开芯片，逐个亮起三处结论
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Dot, MONO, SANS, INK, MUTED, seg, easeOut, mk, clamp01 } from "./ui";

const Scene03: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = mk(marks, 1, 0.36);
  const m2 = mk(marks, 2, 0.68);

  const chipIn = easeOut(seg(p, 0.02, 0.2));
  const cut = easeOut(seg(p, 0.16, 0.5));
  const die = easeOut(seg(p, Math.max(0, m1 - 0.12), m1 + 0.14));
  const labels = [m1, (m1 + m2) / 2, m2].map((t) => easeOut(seg(p, t, t + 0.14)));

  const cx = 300;
  const cy = 520;
  const size = 400;
  const cutY = cy + 40 + (size - 80) * cut;

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />

      <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1080 1920" opacity={0.3 + 0.7 * chipIn}>
        {/* 封装 */}
        <rect x={cx} y={cy} width={size} height={size} rx={12} fill="rgba(16,24,32,0.04)" stroke={INK} strokeWidth={2.5} />
        {/* 引脚 */}
        {Array.from({ length: 7 }, (_, i) => {
          const step = size / 8;
          return (
            <g key={i} stroke={INK} strokeWidth={3} opacity={0.75}>
              <line x1={cx + step * (i + 1)} y1={cy - 16} x2={cx + step * (i + 1)} y2={cy} />
              <line x1={cx + step * (i + 1)} y1={cy + size} x2={cx + step * (i + 1)} y2={cy + size + 16} />
              <line x1={cx - 16} y1={cy + step * (i + 1)} x2={cx} y2={cy + step * (i + 1)} />
              <line x1={cx + size} y1={cy + step * (i + 1)} x2={cx + size + 16} y2={cy + step * (i + 1)} />
            </g>
          );
        })}

        {/* 内部 die：切开后自上而下显现 */}
        <rect
          x={cx + 40}
          y={cy + 40}
          width={size - 80}
          height={(size - 80) * die}
          fill="rgba(207,10,44,0.10)"
          stroke={accent}
          strokeWidth={2}
          clipPath="none"
        />
        {Array.from({ length: 6 }, (_, i) => (
          <line
            key={i}
            x1={cx + 56}
            y1={cy + 66 + i * 46}
            x2={cx + 56 + (size - 112) * clamp01(die * 6 - i)}
            y2={cy + 66 + i * 46}
            stroke="rgba(207,10,44,0.38)"
            strokeWidth={1.4}
          />
        ))}

        {/* 切割线 */}
        <line
          x1={cx - 20}
          y1={cutY}
          x2={cx + size + 20}
          y2={cutY}
          stroke={accent}
          strokeWidth={2}
          opacity={cut > 0 && cut < 1 ? 1 : 0.3}
        />
      </svg>

      {/* 三处结论 */}
      {[
        { y: 560, text: "7 nm", sub: "DIE" },
        { y: 700, text: "SMIC", sub: "FAB / TEARDOWN" },
        { y: 840, text: "?", sub: "UNCONFIRMED" },
      ].map((it, i) => (
        <div
          key={it.text}
          style={{
            position: "absolute",
            left: 760,
            top: it.y,
            opacity: labels[i],
            transform: `translateX(${(1 - labels[i]) * 18}px)`,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div style={{ width: 30, height: 1, background: accent, opacity: 0.7 }} />
          <div>
            <div style={{ fontFamily: MONO, fontSize: 40, fontWeight: 700, color: i === 2 ? MUTED : INK, letterSpacing: -1 }}>{it.text}</div>
            <div style={{ fontFamily: SANS, fontSize: 16, color: MUTED, letterSpacing: 1 }}>{it.sub}</div>
          </div>
        </div>
      ))}

      <Dot x={cx + size / 2} y={cutY} r={5} color={accent} halo opacity={cut > 0 && cut < 1 ? 1 : 0} />
      <div style={{ position: "absolute", left: 300, top: 980, fontFamily: MONO, fontSize: 16, color: MUTED, letterSpacing: 3, opacity: 0.7 }}>
        TEARDOWN / 2023.09
      </div>
    </AbsoluteFill>
  );
};

export default Scene03;
