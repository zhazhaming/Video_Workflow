// Scene01 · 开场：开盘前的一条线
// 纸面行情线从左向右画出，终点亮起；背景是极淡的 K 线天际线。片头标题由引擎压在上面。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { rand } from "../../dv/atmosphere";
import { Paper, Cap, Hair, INK, INK_SOFT, FAINT, RED, GREEN, SERIF_STACK, MONO_STACK, seg, eo, eio, clamp01 } from "./ui";

const X0 = 110;
const X1 = 962;
const BASE = 1160;

const Scene01: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const enter = eo(seg(p, 0, 0.12));
  const draw = eio(seg(p, 0.06, 0.52));
  const glow = eo(seg(p, 0.44, 0.62));
  const note = eo(seg(p, 0.62, 0.76));
  const ex = seg(p, 0.9, 1);
  const main = accent || RED;

  const pts = React.useMemo(
    () =>
      Array.from({ length: 52 }, (_, k) => {
        const t = k / 51;
        return {
          x: X0 + (X1 - X0) * t,
          y: 1110 - 500 * Math.pow(t, 0.86) + Math.sin(k * 0.62 + 1.1) * 24 + (rand(seed + k * 3) - 0.5) * 26,
        };
      }),
    [seed],
  );

  const linePath = pts.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${X1} ${BASE} L ${X0} ${BASE} Z`;
  const cursor = Math.min(pts.length - 1, Math.max(0, Math.round(draw * (pts.length - 1))));
  const head = pts[cursor];

  const candles = React.useMemo(
    () =>
      Array.from({ length: 17 }, (_, k) => {
        const x = X0 + 28 + k * 50;
        const h = 26 + rand(seed + k * 7 + 3) * 86;
        return { x, h, up: rand(seed + k * 7 + 4) > 0.38, w: 14 };
      }),
    [seed],
  );

  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} />

      <div style={{ opacity: enter }}>
        <Cap text="01 / OPEN" x={110} y={300} color={main} />
        <Cap text="A股 · 2026.11.10" x={962} y={300} align="right" color={FAINT} />
        <Hair x={110} y={338} w={852} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 110, top: 388, opacity: enter }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 18, letterSpacing: 4, color: FAINT }}>开盘前 / 09:30</div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 58, fontWeight: 700, color: INK, letterSpacing: 2, marginTop: 6 }}>
          新的一天，从一根线开始。
        </div>
      </div>

      {/* 背景 K 线天际线 */}
      {candles.map((c, k) => (
        <div key={k} style={{ position: "absolute", left: c.x, top: BASE - c.h, width: c.w, height: c.h, opacity: enter * 0.16 }}>
          <div style={{ position: "absolute", left: c.w / 2 - 1, top: -16, width: 2, height: c.h + 32, background: c.up ? RED : GREEN }} />
          <div style={{ position: "absolute", inset: 0, background: c.up ? RED : GREEN }} />
        </div>
      ))}

      {/* 网格与基线 */}
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ position: "absolute", left: X0, top: 620 + i * 180, width: X1 - X0, height: 1, background: INK, opacity: 0.055 * enter }} />
      ))}
      <div style={{ position: "absolute", left: X0, top: BASE, width: (X1 - X0) * enter, height: 1.5, background: INK, opacity: 0.3 }} />

      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="s1-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={main} stopOpacity="0.16" />
            <stop offset="100%" stopColor={main} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#s1-area)" opacity={draw} />
        <path
          d={linePath}
          fill="none"
          stroke={main}
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1500"
          strokeDashoffset={1500 * (1 - draw)}
        />
        <circle cx={head.x} cy={head.y} r={7} fill={main} opacity={glow} />
        <circle cx={head.x} cy={head.y} r={20 + 12 * Math.sin(p * 16)} fill="none" stroke={main} strokeWidth={1.4} opacity={glow * 0.5} />
      </svg>

      <div style={{ position: "absolute", left: 110, top: 1222, opacity: note }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 16, letterSpacing: 2.5, color: FAINT }}>
          09:15—09:25 集合竞价 · 09:30 开盘
        </div>
        <div style={{ marginTop: 8, fontFamily: SERIF_STACK, fontSize: 30, color: INK_SOFT }}>
          今天的高开，先从昨天的情绪里长出来。
        </div>
      </div>

      <div style={{ position: "absolute", right: 110, top: 1236, opacity: note * 0.9, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 3, color: FAINT }}>
        PAGE 01
      </div>

      <div style={{ position: "absolute", left: X0, top: 548, opacity: clamp01(note) * 0.9 }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 3, color: main }}>OPEN</div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene01;
