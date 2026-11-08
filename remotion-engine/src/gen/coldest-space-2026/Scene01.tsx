// Scene01 · 温度标尺的尽头（钩子）
// 一条横贯屏幕的对数温度标尺：左端 10^7 K（恒星核心）→ 右端 1 K（回力棒星云，自然界已知最冷）。
// 指针从左向右巡检，越过尽头掉出刻度；尽头外弹出一枚朱红「？」——「全宇宙最冷的地方在哪？」
// 风格：浅纸底 / 深墨字 / 朱红强调 / 细线信息图。动画只由 p 驱动，只用 transform 与 opacity。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper,
  Cap,
  Hair,
  Stamp,
  SectionNum,
  INK,
  INK_SOFT,
  RED,
  clamp01,
  seg,
  eo,
  eoq,
  lerp,
  pop,
  FONT_STACK,
  SERIF_STACK,
} from "./ui";

// ---- 标尺几何：对数温度轴 10^7 K（左）→ 1 K（右）----
const AX_X = 96;
const AX_W = 888;
const AX_Y = 900;
const AX_END = AX_X + AX_W; // 984
const tickX = (i: number) => AX_X + (AX_W * i) / 7; // 8 个数量级大刻度
const logX = (logT: number) => AX_X + (AX_W * (7 - logT)) / 7; // 任意温度的对数落点

const L_CORE = tickX(0); // 10^7 K
const L_ROOM = logX(Math.log10(300)); // 300 K
const L_CMB = logX(Math.log10(2.7)); // 2.7 K
const L_END = AX_END; // 1 K

const Scene01: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed, marks }) => {
  const mm = (i: number, fb: number) => marks?.[i]?.start ?? fb;
  const ex = seg(p, 0.88, 1); // 退场（后 12%）
  const enter = eo(seg(p, 0, 0.12));

  // ---- 标尺刻度：8 根大刻度 + 14 根小刻度，交错生长 ----
  const ticks: { x: number; major: boolean }[] = [];
  for (let k = 0; k < 8; k++) {
    ticks.push({ x: tickX(k), major: true });
    if (k < 7) {
      const step = tickX(k + 1) - tickX(k);
      ticks.push({ x: tickX(k) + step / 3, major: false });
      ticks.push({ x: tickX(k) + (step * 2) / 3, major: false });
    }
  }

  // 标注入场：随序号轻微错开，淡入 + 上浮
  const lab = (d: number, right = false): React.CSSProperties => {
    const t = eo(seg(p, 0.05 + d * 0.02, 0.15 + d * 0.02));
    return {
      opacity: t,
      transform: `translate(${right ? "-100%" : "0"}, ${(1 - t) * 12}px)`,
      letterSpacing: 2,
    };
  };

  // ---- 指针：沿轴巡检 → 冲过尽头 → 淡出 ----
  const ptrIn = clamp01(seg(p, 0.08, 0.13));
  const ptrRun = eo(seg(p, 0.13, 0.52));
  const ptrOver = eoq(seg(p, 0.52, 0.6));
  const ptrX = p < 0.52 ? lerp(AX_X, AX_END, ptrRun) : AX_END + 92 * ptrOver;
  const ptrOp = ptrIn * (1 - seg(p, 0.55, 0.62));

  // ---- 尽头外的问号 ----
  const qT = seg(p, 0.58, 0.66);
  const qS = 0.55 + 0.45 * pop(qT);
  const ringBreath = 0.5 + 0.5 * Math.sin(p * Math.PI * 5.2);

  // ---- OUT OF SCALE / 印章 ----
  const oosT = eo(seg(p, 0.66, 0.73));
  const stampT = seg(p, mm(2, 0.76), mm(2, 0.76) + 0.18);

  // ---- 巡场高光（指针消失后沿标尺缓慢扫过一次）----
  const sweepT = clamp01(seg(p, 0.6, 0.66));
  const sweepX = -170 + seg(p, 0.62, 1) * 1200;

  return (
    <AbsoluteFill style={{ fontFamily: FONT_STACK, overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 1 - 0.88 * ex,
          transform: `scale(${1 - 0.035 * ex})`,
          transformOrigin: "50% 50%",
        }}
      >
        {/* 编辑性章节号（极淡，只做层次） */}
        <SectionNum n={1} x={96} y={300} size={210} t={enter} />

        {/* ---------------- 标尺 ---------------- */}
        {/* 热 → 冷 的渐变带（唯一的一处色彩提示，很轻） */}
        <div
          style={{
            position: "absolute",
            left: AX_X,
            top: AX_Y - 14,
            width: AX_W,
            height: 6,
            borderRadius: 3,
            background: `linear-gradient(90deg, ${RED}cc 0%, ${RED}55 28%, #3F6A8544 58%, #3F6A85cc 100%)`,
            opacity: 0.85,
            transform: `scaleX(${eo(seg(p, 0.01, 0.12))})`,
            transformOrigin: "left center",
          }}
        />
        <Hair x={AX_X} y={AX_Y} w={AX_W} progress={eo(seg(p, 0, 0.1))} opacity={0.34} thickness={1.5} />
        {ticks.map((t, i) => {
          const g = eo(seg(p, 0.02 + i * 0.006, 0.08 + i * 0.006));
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: t.x,
                top: AX_Y,
                width: t.major ? 2 : 1,
                height: t.major ? 26 : 13,
                background: t.major ? INK : INK_SOFT,
                opacity: t.major ? 0.52 : 0.26,
                transform: `scaleY(${g})`,
                transformOrigin: "top center",
              }}
            />
          );
        })}

        {/* 标尺尽头（界外线） */}
        <div
          style={{
            position: "absolute",
            left: AX_END - 1,
            top: AX_Y - 26,
            width: 2,
            height: 52,
            background: RED,
            opacity: 0.6 * enter,
          }}
        />

        {/* 引线：把 4 个标注连回刻度 */}
        {[
          { x: L_CORE, y: AX_Y + 8, h: 30, up: false, d: 0 },
          { x: L_ROOM, y: 828, h: 72, up: true, d: 2 },
          { x: L_CMB, y: AX_Y + 8, h: 30, up: false, d: 3 },
          { x: L_END, y: AX_Y + 8, h: 86, up: false, d: 4 },
        ].map((l, i) => {
          const t = eo(seg(p, 0.05 + l.d * 0.02, 0.15 + l.d * 0.02));
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: l.x,
                top: l.y,
                width: 1,
                height: l.h,
                background: INK,
                opacity: 0.3 * t,
                transform: `scaleY(${t})`,
                transformOrigin: l.up ? "bottom center" : "top center",
              }}
            />
          );
        })}

        {/* 标注（数据：只放刻度值 + ≤8 字短标签） */}
        <Cap text="10⁷ K · 恒星核心" x={L_CORE} y={944} size={24} color={INK_SOFT} style={lab(0)} />
        <Cap text="300 K · 室温" x={L_ROOM} y={800} size={24} color={INK_SOFT} style={lab(2)} />
        <Cap text="2.7 K · 宇宙背景" x={L_CMB} y={944} size={24} color={INK_SOFT} style={lab(3, true)} />
        <Cap text="1 K · 回力棒星云" x={L_END} y={1000} size={24} color={INK_SOFT} style={lab(4, true)} />

        {/* ---------------- 指针 ---------------- */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            opacity: ptrOp,
            transform: `translateX(${ptrX}px)`,
          }}
        >
          <div style={{ position: "absolute", left: -1, top: 834, width: 2, height: 44, background: RED }} />
          <div
            style={{
              position: "absolute",
              left: -13,
              top: 878,
              width: 0,
              height: 0,
              borderLeft: "13px solid transparent",
              borderRight: "13px solid transparent",
              borderTop: `22px solid ${RED}`,
            }}
          />
        </div>

        {/* ---------------- 尽头外：？ + 同心细环 ---------------- */}
        {[58, 92].map((r, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 930 - r,
              top: 640 - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              border: `1.5px solid ${RED}`,
              opacity: 0.26 * qT * (0.55 + 0.45 * ringBreath),
              transform: `scale(${1 + 0.035 * Math.sin(p * Math.PI * 3.1 + i)})`,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: 930,
            top: 640,
            transform: `translate(-50%, -50%) rotate(-5deg) scale(${qS})`,
            opacity: clamp01(qT * 2.2),
            fontFamily: SERIF_STACK,
            fontSize: 190,
            fontWeight: 700,
            lineHeight: 1,
            color: RED,
          }}
        >
          ？
        </div>

        {/* ---------------- 界外标注 ---------------- */}
        <Cap
          text="OUT OF SCALE"
          x={96}
          y={1120}
          size={24}
          color={INK_SOFT}
          accent={RED}
          style={{ opacity: oosT, transform: `translateY(${(1 - oosT) * 10}px)` }}
        />
        <Hair x={96} y={1166} w={220} color={RED} thickness={2} progress={eo(seg(p, 0.66, 0.76))} opacity={0.75} />

        {/* 落点印章 */}
        <Stamp text="更冷" x={918} y={1110} size={44} rotate={-12} t={stampT} />

        {/* 巡场高光：极轻微的一道亮线沿标尺扫过 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: AX_Y - 18,
            width: 160,
            height: 40,
            background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 100%)",
            opacity: 0.3 * sweepT,
            transform: `translateX(${sweepX}px)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default Scene01;
