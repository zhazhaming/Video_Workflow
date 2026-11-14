// Scene05 · 高开不等于高走：跳空之后，价格没有继续向上
// 一根跳空高开的蜡烛，长长的上影线；随后价格沿着虚线回落，穿过开盘价。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, INK, INK_SOFT, FAINT, RED, GREEN, SERIF_STACK, MONO_STACK, seg, eo, pop, clamp01 } from "./ui";

const OPEN_Y = 596;
const LAST_Y = 1046;
const X0 = 470;
const X1 = 940;

const Scene05: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.14));
  const gap = pop(seg(p, 0.04, 0.24));
  const drop = eo(seg(p, 0.22, 0.78));
  const neq = pop(seg(p, 0.54, 0.7));
  const ex = seg(p, 0.88, 1);
  const main = accent || RED;

  const path = `M ${X0} ${OPEN_Y - 20} C ${X0 + 150} ${OPEN_Y + 60}, ${X0 + 230} ${LAST_Y - 160}, ${X1} ${LAST_Y}`;

  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} />

      <div style={{ opacity: enter }}>
        <Cap text="05 / GAP" x={110} y={300} color={main} />
        <Cap text="高开之后" x={962} y={300} align="right" color={FAINT} />
        <Hair x={110} y={338} w={852} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 110, top: 392, opacity: enter }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 18, letterSpacing: 4, color: FAINT }}>OPEN ≠ CLOSE</div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 58, fontWeight: 700, color: INK, letterSpacing: 2, marginTop: 4 }}>
          开盘价，不是终点。
        </div>
      </div>

      {/* 昨收蜡烛 */}
      <div style={{ position: "absolute", left: 212, top: 820, width: 56, height: 190, background: GREEN, opacity: enter * 0.55, borderRadius: 4 }} />
      <div style={{ position: "absolute", left: 239, top: 790, width: 2, height: 250, background: GREEN, opacity: enter * 0.55 }} />

      {/* 跳空高开蜡烛 */}
      <div style={{ position: "absolute", left: 352, top: OPEN_Y, width: 66, height: 200 * gap, background: main, opacity: gap, borderRadius: 4 }} />
      <div style={{ position: "absolute", left: 384, top: OPEN_Y - 110 * gap, width: 2, height: (200 + 110) * gap, background: main, opacity: gap * 0.8 }} />
      <div style={{ position: "absolute", left: 324, top: OPEN_Y - 4, width: 142, height: 2, background: main, opacity: 0.35 * gap, borderTop: "2px dashed" }} />

      {/* 开盘价虚线 */}
      <div style={{ position: "absolute", left: 110, top: OPEN_Y, width: 852 * enter, height: 1.5, background: main, opacity: 0.45 }} />
      <div style={{ position: "absolute", left: 110, top: OPEN_Y - 38, opacity: enter, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 3, color: main }}>
        开盘价 / OPEN
      </div>

      {/* 回落路径 */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={path} fill="none" stroke={GREEN} strokeWidth={3} strokeLinecap="round" strokeDasharray="900" strokeDashoffset={900 * (1 - drop)} />
        <circle cx={X1} cy={LAST_Y} r={7} fill={GREEN} opacity={drop} />
        <circle cx={X1} cy={LAST_Y} r={16} fill="none" stroke={GREEN} strokeWidth={1.4} opacity={drop * 0.5} />
      </svg>

      <div style={{ position: "absolute", left: 760, top: 1060, opacity: drop, fontFamily: SERIF_STACK, fontSize: 34, color: GREEN }}>
        回落
      </div>

      <div style={{ position: "absolute", left: 610, top: 640, opacity: neq, fontFamily: SERIF_STACK, fontSize: 150, fontWeight: 700, color: main, transform: `rotate(-6deg)` }}>
        ≠
      </div>

      <div style={{ position: "absolute", left: 110, top: 1222, opacity: eo(seg(p, 0.6, 0.8)) }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 29, color: INK_SOFT }}>
          高开只是起点，能不能高走，要看后面。
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene05;
