// Scene03 · 市场：纳斯达克单日跌超 5%，AI 股两天蒸发 2 万亿美元
// 大字 + 下跌折线 + 阴线柱；红色只给“跌幅”，其余保持墨色档案感。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Stamp, RED, INK, INK_SOFT, FAINT, MONO_STACK, SERIF_STACK, seg, eo, pop, lerp, clamp01 } from "./ui";

const W = 800;
const H = 380;
const X0 = 140;
const Y0 = 830;

// 归一化收盘价（0~1，越高越靠上）
const SERIES = [0.92, 0.88, 0.9, 0.84, 0.86, 0.79, 0.82, 0.73, 0.68, 0.7, 0.58, 0.6, 0.46, 0.42, 0.38, 0.29, 0.31, 0.22, 0.18, 0.12];

const Scene03: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const draw = eo(seg(p, 0.15, 0.72));
  const num = lerp(0, 5, eo(seg(p, 0.08, 0.3)));
  const stampT = pop(seg(p, 0.62, 0.74));
  const note = eo(seg(p, 0.5, 0.7));

  const pts = SERIES.map((v, i) => {
    const x = X0 + (W * i) / (SERIES.length - 1);
    const y = Y0 + H * (1 - v);
    return `${x},${y}`;
  }).join(" ");

  const pathLen = 1500;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="CASE 03 / 11 · 市场" x={108} y={300} color={RED} />
        <Cap text="NASDAQ / 2026.11.05" x={972} y={300} align="right" color={FAINT} />
        <Hair x={108} y={338} w={864} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 108, top: 392, opacity: enter }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 52, fontWeight: 700, color: INK, letterSpacing: 2 }}>
          一天，跌掉 5%。
        </div>
      </div>

      <div style={{ position: "absolute", left: 104, top: 500, opacity: enter }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontFamily: SERIF_STACK, fontSize: 190, fontWeight: 700, color: RED, letterSpacing: -6, lineHeight: 1 }}>
            -{num.toFixed(1)}
          </span>
          <span style={{ fontFamily: MONO_STACK, fontSize: 52, color: RED }}>%</span>
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 22, letterSpacing: 2, color: INK_SOFT, marginTop: 2 }}>
          AI 股两天蒸发 2 万亿美元
        </div>
      </div>

      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <line
            key={g}
            x1={X0}
            y1={Y0 + H * g}
            x2={X0 + W}
            y2={Y0 + H * g}
            stroke={INK}
            strokeOpacity={0.09}
            strokeWidth={1}
          />
        ))}
        <line x1={X0} y1={Y0 + H} x2={X0 + W} y2={Y0 + H} stroke={INK} strokeOpacity={0.24} strokeWidth={1.4} />
        <line x1={X0} y1={Y0 - 20} x2={X0} y2={Y0 + H} stroke={INK} strokeOpacity={0.24} strokeWidth={1.4} />

        <polyline
          points={pts}
          fill="none"
          stroke={RED}
          strokeWidth={5}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={pathLen}
          strokeDashoffset={pathLen * (1 - draw)}
        />

        {SERIES.map((v, i) => {
          const t = clamp01((draw * SERIES.length - i) * 2.2);
          if (t <= 0) return null;
          const x = X0 + (W * i) / (SERIES.length - 1);
          const y = Y0 + H * (1 - v);
          return <circle key={i} cx={x} cy={y} r={i === SERIES.length - 1 ? 7 : 3.2} fill={i === SERIES.length - 1 ? RED : INK} opacity={t * (i === SERIES.length - 1 ? 0.9 : 0.45)} />;
        })}

        <line x1={X0} y1={Y0 + H * 0.18} x2={X0 + W} y2={Y0 + H * 0.18} stroke={RED} strokeOpacity={0.32} strokeWidth={1.4} strokeDasharray="8 8" />
      </svg>

      <div style={{ position: "absolute", left: X0, top: Y0 - 58, fontFamily: MONO_STACK, fontSize: 16, letterSpacing: 2, color: FAINT }}>
        高点
      </div>
      <div style={{ position: "absolute", left: 108, top: 1240, opacity: note }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 30, color: INK_SOFT }}>
          科技股进入回调区间，AI 交易第一次被政治风险正面击中。
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 17, letterSpacing: 2, color: FAINT, marginTop: 12 }}>
          SOURCE: NPR / CNBC · 2026.11.05
        </div>
      </div>

      <Stamp text="CORRECTION" sub="回调区" x={850} y={1190} size={26} rotate={-6} t={stampT} w={230} color={RED} />
    </AbsoluteFill>
  );
};

export default Scene03;
