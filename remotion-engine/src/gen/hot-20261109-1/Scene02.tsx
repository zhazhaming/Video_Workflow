// Scene02 · 开盘那根直线（数据折线）
// 一条几乎贴地的线，在开盘后突然抬头；峰值处落一枚 +15% 的红签，旁边标出当天最高价。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, INK, INK_SOFT, FAINT, RED, seg, eo, eoq, lerp, clamp01 } from "./ui";

const X0 = 96;
const X1 = 984;
const Y0 = 1150; // 基线
const H = 650;

const V = [0.05, 0.06, 0.055, 0.07, 0.065, 0.08, 0.1, 0.16, 0.3, 0.46, 0.62, 0.74, 0.82, 0.94];
const pt = (i: number) => ({
  x: X0 + ((X1 - X0) * i) / (V.length - 1),
  y: Y0 - V[i] * H,
});

const Scene02: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.1));
  const draw = eo(seg(p, 0.05, 0.62));
  const peakT = eo(seg(p, 0.58, 0.72));
  const tag = eo(seg(p, 0.64, 0.76));
  const note = eo(seg(p, 0.72, 0.86));
  const last = pt(V.length - 1);
  const peak = pt(V.length - 2);

  const pts = V.map((_, i) => pt(i));
  const line = pts.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ");
  const area = `${X0},${Y0} ${line} ${X1},${Y0}`;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="688836 · 分时" x={96} y={318} size={21} />
        <Cap text="3000 亿" x={984} y={318} size={21} align="right" color={RED} />
        <Hair x={96} y={406} w={888} color={INK} thickness={1} opacity={0.16} />

        {/* 网格与基线 */}
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <div key={g} style={{ position: "absolute", left: X0, top: Y0 - H * g, width: 888, height: 1, background: INK, opacity: 0.06 }} />
        ))}
        <Hair x={96} y={Y0} w={888} color={INK} thickness={2} opacity={0.3} progress={enter} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} style={{ position: "absolute", left: X0 + (888 * i) / 7, top: Y0, width: 1, height: 8, background: INK, opacity: 0.16 }} />
        ))}

        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            <linearGradient id="s2fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={RED} stopOpacity="0.16" />
              <stop offset="100%" stopColor={RED} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={area} fill="url(#s2fill)" opacity={draw} />
          <polyline
            points={line}
            fill="none"
            stroke={INK}
            strokeWidth={6}
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - draw}
          />
        </svg>

        {/* 峰值标记 */}
        <div style={{ position: "absolute", left: peak.x - 11, top: peak.y - 11, width: 22, height: 22, borderRadius: 11, border: `5px solid ${RED}`, opacity: peakT, transform: `scale(${0.5 + 0.5 * peakT})` }} />
        <div style={{ position: "absolute", left: peak.x - 196, top: peak.y - 104, width: 180, textAlign: "right", opacity: tag, transform: `translateY(${(1 - tag) * 12}px)` }}>
          <div style={{ display: "inline-block", background: RED, color: "#FBF6EC", fontFamily: '"SF Mono", monospace', fontSize: 34, fontWeight: 700, padding: "8px 16px", letterSpacing: 1 }}>+15%</div>
          <div style={{ fontFamily: '"SF Mono", monospace', fontSize: 18, color: INK_SOFT, marginTop: 10, letterSpacing: 2 }}>最高 759.99 元</div>
        </div>
        <div style={{ position: "absolute", left: last.x - 8, top: last.y - 8, width: 16, height: 16, borderRadius: 8, background: RED, opacity: tag }} />
        <div style={{ position: "absolute", left: 96, top: 960, opacity: note, transform: `translateY(${(1 - note) * 10}px)` }}>
          <div style={{ fontFamily: '"Songti SC", serif', fontSize: 30, color: INK_SOFT }}>一条线，把一天的情绪画完了</div>
        </div>
        <div style={{ position: "absolute", left: 96, top: 1190, fontFamily: '"SF Mono", monospace', fontSize: 18, color: FAINT, letterSpacing: 3, opacity: note }}>
          09:30 — 15:00
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene02;
