// Scene05 · 太空解法：原子在微重力里自由飘 → 十二束激光从外向内织成一张网（全光阱）→ 一稳就是 7 秒
// 动画全部由 p 驱动；关键事件由 marks 驱动（带 fallback）；随机只用 rand(seed+k)。
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { rand } from "../../dv/atmosphere";
import {
  Paper,
  Cap,
  Stamp,
  Num,
  Atom,
  INK,
  INK_SOFT,
  RED,
  GOLD,
  MONO_STACK,
  FONT_STACK,
  MARGIN,
  seg,
  eo,
  eio,
  eoq,
  lerp,
  pop,
} from "./ui";

const CX = 540;
const CY = 748;
const R_OUT = 306; // 激光发射端半径
const R_IN = 64; // 激光内端（核心区外缘）
const BEAM = R_OUT - R_IN;
const RING = 272; // 7 秒环半径
const CORE = 186; // 核心圆盘半径
const CIRC = 2 * Math.PI * RING;
const TICKS = 7; // 每 1 秒一个刻度
const N_BEAM = 12;

const Scene05: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed, marks }) => {
  // ---- marks（可能 undefined，全部带 fallback）----
  const m = (i: number, fb: number) => marks?.[i]?.start ?? fb;
  const tNet = m(1, 0.403); // 「他们用二十多束激光，织成一张网」
  const tHold = m(2, 0.752); // 「一稳，就是 7 秒」

  // ---- 预生成（确定性）----
  const angles = useMemo(() => Array.from({ length: N_BEAM }, (_, i) => (i * 360) / N_BEAM), []);
  const atoms = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const k = seed + i * 7;
        return {
          r0: 18 + rand(k) * 66, // 半径 18~84（云团感）
          a0: rand(k + 1) * Math.PI * 2,
          rr: 3.2 + rand(k + 3) * 2.8, // 3.2~6px
          jp: rand(k + 4) * Math.PI * 2,
        };
      }),
    [seed],
  );

  // ---- 时间函数 ----
  const guideT = (i: number) => eo(seg(p, 0.03 + i * 0.004, 0.15 + i * 0.004)); // 早期“瞄准线”
  const netT = (i: number) => eoq(seg(p, tNet + i * 0.008, tNet + 0.16)); // 激光织网
  const glow = eio(seg(p, tNet, tNet + 0.16)); // 网亮起
  const squeeze = lerp(1, 0.68, eio(seg(p, tNet + 0.03, tNet + 0.24))); // 原子被托住、收拢
  const arcP = eio(seg(p, tHold, 0.965)); // 7 秒环走满
  const arcAng = -90 + arcP * 360;
  const rad = (arcAng * Math.PI) / 180;
  const dotX = CX + Math.cos(rad) * RING;
  const dotY = CY + Math.sin(rad) * RING;
  const stampT = seg(p, 0.925, 0.985);
  const exit = eio(seg(p, 0.9, 1));
  const breath = 0.5 + 0.5 * Math.sin(p * Math.PI * 6);
  const numIn = seg(p, tHold - 0.01, tHold + 0.05);

  return (
    <AbsoluteFill style={{ fontFamily: FONT_STACK, overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />

      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 1920,
          transform: `translateY(${exit * 6}px) scale(${1 - exit * 0.012})`,
          transformOrigin: "540px 800px",
        }}
      >
        {/* ---------- 层 1：12 束激光（先瞄准线，第二句起由外向内织网） ---------- */}
        {angles.map((a, i) => {
          const g = guideT(i);
          const n = netT(i);
          const flowT = (p * 1.7 + i * 0.11) % 1;
          return (
            <div
              key={`b${i}`}
              style={{ position: "absolute", left: CX, top: CY, width: 0, height: 0, transform: `rotate(${a}deg)` }}
            >
              {/* 早期细瞄准线（从发射端指向核心） */}
              <div
                style={{
                  position: "absolute",
                  left: R_IN,
                  top: -0.5,
                  width: BEAM,
                  height: 1,
                  background: INK,
                  opacity: 0.13 * g * (1 - glow),
                  transform: `scaleX(${g})`,
                  transformOrigin: "100% 50%",
                }}
              />
              {/* 赭金激光 3px */}
              <div
                style={{
                  position: "absolute",
                  left: R_IN,
                  top: -1.5,
                  width: BEAM,
                  height: 3,
                  borderRadius: 2,
                  background: `linear-gradient(90deg, ${GOLD}00 0%, ${GOLD}66 26%, ${GOLD} 100%)`,
                  opacity: (0.42 + 0.42 * glow) * n,
                  transform: `scaleX(${n})`,
                  transformOrigin: "100% 50%",
                }}
              />
              {/* 1px 亮芯 */}
              <div
                style={{
                  position: "absolute",
                  left: R_IN,
                  top: -0.5,
                  width: BEAM,
                  height: 1,
                  background: `linear-gradient(90deg, ${GOLD}00 0%, ${GOLD} 30%, ${GOLD} 100%)`,
                  opacity: 0.85 * n * (0.5 + 0.5 * glow),
                  transform: `scaleX(${n * 0.985})`,
                  transformOrigin: "100% 50%",
                }}
              />
              {/* 沿光束向内流动的光点 */}
              {glow > 0.02 ? (
                <div
                  style={{
                    position: "absolute",
                    left: R_IN + BEAM * (1 - flowT),
                    top: -2.5,
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: GOLD,
                    opacity: glow * 0.9 * Math.sin(Math.PI * flowT),
                  }}
                />
              ) : null}
            </div>
          );
        })}

        {/* 交汇处：赭金空心圆 */}
        <div
          style={{
            position: "absolute",
            left: CX - 13,
            top: CY - 13,
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: `2px solid ${GOLD}`,
            opacity: 0.3 + 0.55 * glow,
            transform: `scale(${0.7 + 0.3 * pop(glow)}) rotate(${p * 40}deg)`,
          }}
        />

        {/* ---------- 层 2：仪器环 + 核心盘 + 7 秒环（SVG） ---------- */}
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          {/* 外圈虚线仪器框 */}
          <circle
            cx={CX}
            cy={CY}
            r={R_OUT + 26}
            fill="none"
            stroke={INK}
            strokeOpacity={0.07}
            strokeWidth={1}
            strokeDasharray="2 11"
          />
          {/* 发射端节点 */}
          {angles.map((a, i) => {
            const r0 = (a * Math.PI) / 180;
            return (
              <circle
                key={`e${i}`}
                cx={CX + Math.cos(r0) * R_OUT}
                cy={CY + Math.sin(r0) * R_OUT}
                r={3}
                fill="none"
                stroke={GOLD}
                strokeOpacity={0.28 + 0.4 * glow}
                strokeWidth={1.4}
              />
            );
          })}
          {/* 核心盘（柔光，让激光“收”进核心，也让读数清晰） */}
          <defs>
            <radialGradient id="coreGlow">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.46 + 0.1 * glow} />
              <stop offset="62%" stopColor="#FFFFFF" stopOpacity={0.2 + 0.06 * glow} />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={CX} cy={CY} r={CORE} fill="url(#coreGlow)" />
          {/* 计时环打底 */}
          <circle cx={CX} cy={CY} r={RING} fill="none" stroke={INK} strokeOpacity={0.13} strokeWidth={3} />
          <circle cx={CX} cy={CY} r={RING - 15} fill="none" stroke={INK} strokeOpacity={0.05} strokeWidth={1} />
          {/* 朱红进度弧 */}
          {arcP > 0.001 ? (
            <circle
              cx={CX}
              cy={CY}
              r={RING}
              fill="none"
              stroke={RED}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={`${CIRC * arcP} ${CIRC}`}
              transform={`rotate(-90 ${CX} ${CY})`}
              opacity={0.95}
            />
          ) : null}
          {/* 每 1 秒一个刻度，扫到点亮 */}
          {Array.from({ length: TICKS }, (_, i) => {
            const a = ((-90 + (i * 360) / TICKS) * Math.PI) / 180;
            const lit = arcP > 0.004 && arcP * TICKS >= i - 1e-4;
            return (
              <line
                key={`t${i}`}
                x1={CX + Math.cos(a) * (RING + 8)}
                y1={CY + Math.sin(a) * (RING + 8)}
                x2={CX + Math.cos(a) * (RING + 25)}
                y2={CY + Math.sin(a) * (RING + 25)}
                stroke={lit ? RED : INK}
                strokeOpacity={lit ? 0.9 : 0.18}
                strokeWidth={lit ? 3 : 2}
              />
            );
          })}
          {/* 环心十字准星 */}
          <line x1={CX - 10} y1={CY} x2={CX - 24} y2={CY} stroke={INK} strokeOpacity={0.16} strokeWidth={1} />
          <line x1={CX + 10} y1={CY} x2={CX + 24} y2={CY} stroke={INK} strokeOpacity={0.16} strokeWidth={1} />
          <line x1={CX} y1={CY - 10} x2={CX} y2={CY - 24} stroke={INK} strokeOpacity={0.16} strokeWidth={1} />
          <line x1={CX} y1={CY + 10} x2={CX} y2={CY + 24} stroke={INK} strokeOpacity={0.16} strokeWidth={1} />
          {/* 弧端头 */}
          {arcP > 0.004 ? <circle cx={dotX} cy={dotY} r={4} fill={RED} opacity={0.95} /> : null}
          {arcP > 0.004 ? (
            <circle cx={dotX} cy={dotY} r={9 + 3 * breath} fill="none" stroke={RED} strokeOpacity={0.3} strokeWidth={1} />
          ) : null}
        </svg>

        {/* ---------- 层 3：原子云（微重力自由飘 → 被托住收拢） ---------- */}
        {atoms.map((a, i) => {
          const ang = a.a0 + p * 0.85;
          const rr = a.r0 * squeeze;
          const x = CX + Math.cos(ang) * rr + Math.sin(p * 46 + a.jp) * 2.2;
          const y = CY + Math.sin(ang) * rr + Math.cos(p * 41 + a.jp) * 2.2;
          return <Atom key={`a${i}`} x={x} y={y} r={a.rr} color={INK} opacity={0.62} />;
        })}

        {/* ---------- 层 4：标注 ---------- */}
        <Cap text="微重力 · 全光阱" x={MARGIN} y={336} accent={RED} color={INK_SOFT} opacity={seg(p, 0.03, 0.12)} />

        {/* 核心读数：7 秒计数（最后一句才出现） */}
        <Num
          value={arcP * 7}
          decimals={1}
          x={448}
          y={838}
          size={72}
          color={RED}
          suffix="s"
          suffixSize={32}
          opacity={numIn * (1 - seg(p, 0.985, 1))}
        />

        {/* 左下：g ≈ 0 细框 + 激光束数 */}
        <div
          style={{
            position: "absolute",
            left: MARGIN,
            top: 1082,
            padding: "10px 18px",
            border: `1px solid ${INK}3D`,
            fontFamily: MONO_STACK,
            fontSize: 22,
            letterSpacing: 4,
            color: INK_SOFT,
            opacity: seg(p, 0.06, 0.2),
          }}
        >
          g ≈ 0
        </div>
        <Cap text="20+ 束激光" x={MARGIN} y={1176} color={GOLD} size={28} opacity={Math.min(1, glow * 1.5)} />

        {/* 中下：环闭合时的落点印章 */}
        <Stamp text="7 秒" x={540} y={1128} size={56} rotate={-8} t={stampT} />

        {/* 底部收口细线 */}
        <div style={{ position: "absolute", left: MARGIN, top: 1258, width: 888 * seg(p, 0.1, 0.3), height: 1, background: INK, opacity: 0.1 }} />

        {/* 右上角小刻度装饰（仪器感，纯装饰） */}
        <div style={{ position: "absolute", left: 884, top: 340, opacity: 0.16 }}>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} style={{ width: i % 2 === 0 ? 26 : 14, height: 1, background: INK, marginBottom: 9 }} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene05;
