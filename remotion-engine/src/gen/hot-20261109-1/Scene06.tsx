// Scene06 · 剪刀差（三季报）
// 营收线向上、扣非线向下，两条线在画面中央交叉；红叉落点，盖一枚「剪刀差」。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Stamp, INK, INK_SOFT, FAINT, RED, seg, eo, lerp } from "./ui";

const A = { x: 180, y: 960 };
const B = { x: 900, y: 560 };
const C = { x: 180, y: 620 };
const D = { x: 900, y: 880 };

const Scene06: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.1));
  const r1 = eo(seg(p, 0.06, 0.46));
  const r2 = eo(seg(p, 0.18, 0.58));
  const cross = seg(p, 0.6, 0.72);
  const num = eo(seg(p, 0.66, 0.82));

  // 两条线的交点（解线性方程）
  const den = (B.x - A.x) * (D.y - C.y) - (B.y - A.y) * (D.x - C.x);
  const t = ((C.x - A.x) * (D.y - C.y) - (C.y - A.y) * (D.x - C.x)) / den;
  const X = { x: lerp(A.x, B.x, t), y: lerp(A.y, B.y, t) };

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="营收 / 利润" x={96} y={318} size={20} />

        {/* 参考线 */}
        {[700, 820, 940, 1060].map((y) => (
          <div key={y} style={{ position: "absolute", left: 96, top: y, width: 888, height: 1, background: INK, opacity: 0.055 }} />
        ))}

        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={INK} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - r1} />
          <line x1={C.x} y1={C.y} x2={D.x} y2={D.y} stroke={RED} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - r2} />
          <circle cx={X.x} cy={X.y} r={11 + 8 * cross} fill="none" stroke={RED} strokeWidth={3} opacity={cross} />
          <line x1={X.x - 22} y1={X.y - 22} x2={X.x + 22} y2={X.y + 22} stroke={RED} strokeWidth={4} opacity={cross} />
          <line x1={X.x + 22} y1={X.y - 22} x2={X.x - 22} y2={X.y + 22} stroke={RED} strokeWidth={4} opacity={cross} />
        </svg>

        <div style={{ position: "absolute", left: 640, top: 428, opacity: r1, fontFamily: '"SF Mono", monospace', fontSize: 34, color: INK, fontWeight: 700 }}>+55.7%</div>
        <div style={{ position: "absolute", left: 640, top: 480, opacity: r1, fontFamily: '"Songti SC", serif', fontSize: 26, color: INK_SOFT }}>营收 18.17 亿</div>
        <div style={{ position: "absolute", left: 984, top: 896, textAlign: "right", opacity: r2, fontFamily: '"SF Mono", monospace', fontSize: 34, color: RED, fontWeight: 700 }}>-18.8%</div>
        <div style={{ position: "absolute", left: 700, top: 948, width: 284, textAlign: "right", opacity: r2, fontFamily: '"Songti SC", serif', fontSize: 26, color: INK_SOFT }}>扣非净利 3.49 亿</div>

        <Stamp text="剪刀差" x={540} y={1080} size={54} rotate={-6} t={num} />
        <div style={{ position: "absolute", left: 96, top: 1150, opacity: num, fontFamily: '"Songti SC", serif', fontSize: 28, color: INK_SOFT }}>
          收入在涨，利润在退。
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene06;
