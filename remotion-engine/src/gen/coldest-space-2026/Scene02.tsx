// Scene02 · 9.7 皮开尔文（纪录）
// 左侧等宽大数字从 300 掉到 9.7 pK（计数滚动 + 一层残影），右侧「画不出来的对比条」：
// 宇宙微波背景 2.7 K 是 720px 的灰条，这里 9.7 pK 只有 2.5px 的一根发丝，旁边 2800 亿倍。
// 数据：9.7 pK 铷原子温度；2.7 / 9.7e-12 ≈ 2800 亿倍。动画只由 p 驱动。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper,
  Cap,
  Hair,
  Stamp,
  SectionNum,
  Num,
  INK,
  INK_SOFT,
  INK_FAINT,
  RED,
  clamp01,
  seg,
  eo,
  eoq,
  lerp,
  pop,
  FONT_STACK,
} from "./ui";

const Scene02: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const mm = (i: number, fb: number) => marks?.[i]?.start ?? fb;
  const ex = seg(p, 0.88, 1);
  const enter = eo(seg(p, 0, 0.14));

  const m0 = mm(0, 0.061);
  const m1 = mm(1, 0.512);

  // ---- 主数字：300 → 9.7（缓出，前 1/3 镜内完成）----
  const settle = eo(seg(p, 0.05, m0 + 0.28));
  const val = lerp(300, 9.7, settle);
  const settled = seg(p, 0.34, 0.42);

  // ---- 分隔线 / 对比条 ----
  const divT = eoq(seg(p, 0.20, 0.34));
  const greyT = eoq(seg(p, 0.34, 0.5));
  const redT = pop(seg(p, 0.34, 0.42));
  const arrowT = eo(seg(p, 0.5, 0.58));
  const cmpT = eo(seg(p, m1, m1 + 0.16));
  const numT = eo(seg(p, m1, m1 + 0.18));

  // ---- 印章 ----
  const stampT = seg(p, m0 + 0.26, m0 + 0.36);

  // ---- 持续微动 ----
  const pulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 7);
  const underOp = 0.28 + 0.22 * Math.sin(p * Math.PI * 6 + 0.8);

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
        <SectionNum n={2} x={626} y={316} size={236} t={enter} />

        {/* 栏目标签 */}
        <Cap
          text="RECORD · 铷原子温度"
          x={96}
          y={338}
          size={22}
          color={INK_FAINT}
          accent={RED}
          style={{ opacity: enter, transform: `translateY(${(1 - enter) * 10}px)` }}
        />

        {/* 大数字：右侧残影层（计数时的运动回声）+ 主层 */}
        <Num
          value={val}
          decimals={1}
          x={116}
          y={470}
          size={250}
          color={INK}
          opacity={0.1 * (1 - seg(p, 0.3, 0.42))}
        />
        <Num
          value={val}
          decimals={1}
          x={96}
          y={466}
          size={250}
          color={INK}
          suffix="pK"
          suffixSize={92}
          suffixColor={RED}
          style={{
            opacity: clamp01(seg(p, 0.02, 0.1)),
            transform: `translateY(${(1 - eo(seg(p, 0, 0.12))) * 26}px)`,
          }}
        />
        {/* 数字下的呼吸细线：长镜里的持续微动 */}
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 742,
            width: 432,
            height: 2,
            background: RED,
            opacity: underOp * clamp01(seg(p, 0.34, 0.44)),
            transform: `scaleX(${0.35 + 0.65 * eoq(seg(p, 0.34, 0.5))})`,
            transformOrigin: "left center",
          }}
        />

        {/* 新纪录印章 */}
        <Stamp text="新纪录" x={868} y={470} size={52} rotate={-9} t={stampT} />

        {/* 分隔线 + 对比区基准竖线 */}
        <Hair x={96} y={800} w={888} color={INK} progress={divT} opacity={0.22} />
        <div
          style={{
            position: "absolute",
            left: 94,
            top: 892,
            width: 1,
            height: 172,
            background: INK,
            opacity: 0.16 * clamp01(seg(p, 0.12, 0.22)),
          }}
        />

        {/* ---------------- 对比区 ---------------- */}
        <Cap
          text="宇宙微波背景 2.7 K"
          x={100}
          y={856}
          size={24}
          color={INK_SOFT}
          style={{ opacity: clamp01(seg(p, 0.08, 0.16)) }}
        />
        {/* 2.7 K：720px 灰条 */}
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 906,
            width: 720,
            height: 32,
            background: INK,
            opacity: 0.16,
            transform: `scaleX(${greyT})`,
            transformOrigin: "left center",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 816,
            top: 894,
            width: 1,
            height: 56,
            background: INK,
            opacity: 0.34 * clamp01(seg(p, 0.5, 0.58)),
          }}
        />

        {/* 9.7 pK：一根发丝（2.5px），视觉上短到画不出来 */}
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 1016,
            width: 2.5,
            height: 32,
            background: RED,
            opacity: clamp01(seg(p, 0.33, 0.38)) * (0.82 + 0.18 * pulse),
            transform: `scaleY(${redT})`,
            transformOrigin: "center bottom",
          }}
        />
        <Cap
          text="9.7 pK · 画不出来"
          x={124}
          y={1004}
          size={24}
          color={RED}
          style={{ opacity: clamp01(seg(p, 0.37, 0.44)) }}
        />

        {/* 指向发丝的细箭头 */}
        <div
          style={{
            position: "absolute",
            left: 96.5,
            top: 1077,
            width: 1.5,
            height: 46,
            background: RED,
            opacity: 0.8 * arrowT,
            transform: `scaleY(${arrowT})`,
            transformOrigin: "top center",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 97,
            top: 1054,
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderBottom: `23px solid ${RED}`,
            opacity: arrowT,
            transform: `scale(${0.6 + 0.4 * arrowT})`,
            transformOrigin: "center bottom",
          }}
        />

        {/* 2800 亿倍 */}
        <Hair
          x={560}
          y={1064}
          w={312}
          color={RED}
          thickness={1.5}
          progress={eoq(seg(p, m1, m1 + 0.1))}
          opacity={0.55}
        />
        <Num
          value={2800 * numT}
          x={560}
          y={1080}
          size={100}
          color={RED}
          suffix="亿倍"
          suffixSize={42}
          style={{ opacity: clamp01(seg(p, m1, m1 + 0.06)) }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default Scene02;
