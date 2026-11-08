// Scene04 · 份额腰斩（主视觉：日系在华零售份额走势，2020/2024/2025 实测节点）
// 折线生长 + 节点弹出 + 10% 生死线 + 「腰斩」印章。数据来自 research.json（乘联会/Yahoo财经口径）。
// 动画只由 p 驱动，只用 transform / opacity；数值标注 ≤64px。
import React from "react";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Num, Stamp, INK, INK_SOFT, INK_FAINT, RED, MARGIN, MONO_STACK, seg, eo, pop, clamp01, lerp } from "./ui";

// 图区几何
const AX_X = 180;
const AX_Y = 1150; // 0% 基线
const TOP = 500; // 26% 顶
const v2y = (v: number) => AX_Y - (v / 26) * (AX_Y - TOP);
const P2020 = { x: 200, y: v2y(24.1) };
const P2024 = { x: 660, y: v2y(11.2) };
const P2025 = { x: 880, y: v2y(9.7) };

const segLenAngle = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return { len: Math.sqrt(dx * dx + dy * dy), ang: (Math.atan2(dy, dx) * 180) / Math.PI };
};
const S1 = segLenAngle(P2020, P2024);
const S2 = segLenAngle(P2024, P2025);

const Scene04: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const main = accent || RED;
  const mm = (i: number, fb: number) => marks?.[i]?.start ?? fb;
  const ex = seg(p, 0.88, 1);

  const axT = eo(seg(p, 0, 0.1));
  const t1 = mm(0, 0.16); // 24% 节点
  const t2 = mm(1, 0.5); // 跌破 10%
  const t3 = mm(2, 0.78); // 腰斩

  const s1p = eo(seg(p, t1 + 0.04, t1 + 0.24));
  const s2p = eo(seg(p, t2, t2 + 0.14));
  const dot1 = pop(seg(p, t1, t1 + 0.08));
  const dot2 = pop(seg(p, t1 + 0.22, t1 + 0.3));
  const dot3 = pop(seg(p, t2 + 0.1, t2 + 0.18));

  const line10T = eo(seg(p, t2 - 0.06, t2 + 0.06));
  const stampT = seg(p, t3, t3 + 0.14);

  // 折线下方柔光（示意填充，低透明）
  const glowT = clamp01(s1p * 0.6 + s2p * 0.4);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} />

      <Cap text="日系在华零售份额" x={MARGIN} y={360} size={26} color={INK_SOFT} accent={main} />
      <Cap text="实测节点连线" x={984} y={360} align="right" size={22} color={INK_FAINT} opacity={0.8} />

      {/* 横向网格 + 刻度 */}
      {[0, 10, 20, 25].map((v) => (
        <div key={v}>
          <Hair x={AX_X} y={v2y(v)} w={760} color={INK} opacity={v === 0 ? 0.3 : 0.08} thickness={v === 0 ? 1.5 : 1} progress={axT} />
          <div style={{ position: "absolute", left: AX_X - 64, top: v2y(v) - 14, fontFamily: MONO_STACK, fontSize: 22, color: INK_FAINT, opacity: 0.8 * axT, fontVariantNumeric: "tabular-nums" }}>
            {v}%
          </div>
        </div>
      ))}

      {/* 10% 生死线 */}
      <div
        style={{
          position: "absolute",
          left: AX_X,
          top: v2y(10),
          width: 760,
          height: 2,
          background: `repeating-linear-gradient(90deg, ${main} 0 14px, transparent 14px 28px)`,
          opacity: 0.55 * line10T * (1 - ex),
          transform: `scaleX(${line10T})`,
          transformOrigin: "left center",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 210,
          top: v2y(10) + 18,
          fontFamily: MONO_STACK,
          fontSize: 24,
          letterSpacing: 4,
          color: main,
          opacity: line10T * (1 - ex),
        }}
      >
        10% 生死线
      </div>

      {/* 折线下方柔光 */}
      <div
        style={{
          position: "absolute",
          left: 240,
          top: v2y(24.1) + 30,
          width: 620,
          height: 420,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${main}12 0%, transparent 70%)`,
          opacity: glowT,
        }}
      />

      {/* 折线段 1：2020 → 2024 */}
      <div
        style={{
          position: "absolute",
          left: P2020.x,
          top: P2020.y,
          width: S1.len * s1p,
          height: 7,
          borderRadius: 4,
          background: main,
          transform: `rotate(${S1.ang}deg)`,
          transformOrigin: "left center",
          boxShadow: `0 6px 14px ${main}33`,
        }}
      />
      {/* 折线段 2：2024 → 2025 */}
      <div
        style={{
          position: "absolute",
          left: P2024.x,
          top: P2024.y,
          width: S2.len * s2p,
          height: 7,
          borderRadius: 4,
          background: main,
          transform: `rotate(${S2.ang}deg)`,
          transformOrigin: "left center",
          boxShadow: `0 6px 14px ${main}33`,
        }}
      />

      {/* 节点 + 数值 */}
      {[
        { pt: P2020, t: dot1, label: "24.1%", size: 40, color: INK, lx: P2020.x - 26, ly: P2020.y - 96 },
        { pt: P2024, t: dot2, label: "11.2%", size: 40, color: INK, lx: P2024.x - 120, ly: P2024.y - 60 },
        { pt: P2025, t: dot3, label: "9.7%", size: 52, color: main, lx: P2025.x - 150, ly: P2025.y - 34 },
      ].map((d, i) => (
        <div key={i}>
          <div
            style={{
              position: "absolute",
              left: d.pt.x - 13,
              top: d.pt.y - 13,
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "#FBF6EC",
              border: `6px solid ${d.color}`,
              opacity: clamp01(d.t * 1.4),
              transform: `scale(${0.4 + 0.6 * d.t})`,
              boxShadow: `0 0 0 8px ${d.color}18`,
            }}
          />
          <Num value={parseFloat(d.label)} decimals={d.label.includes(".") ? 1 : 0} suffix="%" x={d.lx} y={d.ly} size={d.size} color={d.color} opacity={clamp01(d.t * 1.2)} />
        </div>
      ))}

      {/* 年份 */}
      {[
        { x: P2020.x - 30, y: "2020" },
        { x: P2024.x - 30, y: "2024" },
        { x: P2025.x - 30, y: "2025" },
      ].map((v, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: v.x,
            top: AX_Y + 18,
            fontFamily: MONO_STACK,
            fontSize: 26,
            letterSpacing: 3,
            color: INK_SOFT,
            opacity: axT * (1 - ex),
          }}
        >
          {v.y}
        </div>
      ))}

      {/* 印章 */}
      <Stamp text="腰 斩" x={560} y={640} size={76} rotate={-9} t={stampT} color={main} border={6} />

      {/* 底注 */}
      <Cap text="来源：乘联会零售口径" x={MARGIN} y={1226} size={20} color={INK_FAINT} opacity={0.7} />
    </div>
  );
};

export default Scene04;
