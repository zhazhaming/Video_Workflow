// Scene03 · 原子在乱跑，然后站住（原理）
// 「温度，就是原子在乱跑。」→ 样品池里 64 个铷原子剧烈抖动（拖尾）；
// 「冷到这份上，它们几乎站住了。」→ 原子减速、收敛成六角点阵，外圈朱红细环，右侧热运动条归零。
// 动画只由 p 驱动，随机只用 rand(seed + k)，只用 transform / opacity。
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { rand } from "../../dv/atmosphere";
import {
  Paper,
  Cap,
  Atom,
  SectionNum,
  INK,
  INK_SOFT,
  INK_FAINT,
  RED,
  GOLD,
  clamp01,
  seg,
  eo,
  eio,
  eoq,
  lerp,
  pop,
  FONT_STACK,
} from "./ui";

// ---- 样品池几何 ----
const POOL_X = 96;
const POOL_Y = 380;
const POOL_W = 784;
const POOL_H = 700;
const CX = POOL_X + POOL_W / 2; // 488
const CY = POOL_Y + POOL_H / 2; // 730

// 六角点阵目标（居中，落在外圈朱红细环 r=210 内）
const SP = 52;
const ROW = 46;
const targetX = (c: number, r: number) => CX + (c - 3.5) * SP + (r % 2 ? SP / 2 : 0);
const targetY = (r: number) => CY + (r - 3.5) * ROW;

const Scene03: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed, marks }) => {
  const mm = (i: number, fb: number) => marks?.[i]?.start ?? fb;
  const ex = seg(p, 0.88, 1);
  const enter = eo(seg(p, 0, 0.12));

  // 64 个原子：8×8 网格基准位置 + 确定性相位/频率/半径
  const atoms = useMemo(
    () =>
      Array.from({ length: 64 }, (_, i) => {
        const c = i % 8;
        const r = Math.floor(i / 8);
        const bx = 170 + c * 90.86 + (rand(seed + i * 9) - 0.5) * 34;
        const by = 452 + r * 80 + (rand(seed + i * 9 + 1) - 0.5) * 34;
        return {
          i,
          bx,
          by,
          tx: targetX(c, r),
          ty: targetY(r),
          phase: rand(seed + i * 9 + 2) * Math.PI * 2,
          freq: 26 + rand(seed + i * 9 + 3) * 24,
          amp: 0.7 + rand(seed + i * 9 + 4) * 0.6,
          rad: 5 + rand(seed + i * 9 + 5) * 3,
          late: rand(seed + i * 9 + 6),
        };
      }),
    [seed],
  );

  // 抖动幅度：30px → 1.5px；随后收敛到点阵
  const A = lerp(30, 1.2, eio(seg(p, 0.02, 0.52)));
  const conv = eo(seg(p, 0.52, 0.74));
  const breath = Math.sin(p * Math.PI * 2.4) * 0.6;

  // 热运动条：100% → 3%
  const fillT = eio(seg(p, 0.05, 0.62));
  const fillScale = lerp(1, 0.03, fillT);

  // 朱红细环
  const ringT = seg(p, 0.55, 0.66);
  const ringBreath = 0.5 + 0.5 * Math.sin(p * Math.PI * 5);
  const tickT = seg(p, 0.62, 0.72);

  // 第二句（「它们几乎站住了」）驱动「热运动几乎停止」标注
  const stopT = clamp01(seg(p, mm(1, 0.495) + 0.02, mm(1, 0.495) + 0.14));

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
        {/* ---------------- 样品池 ---------------- */}
        <div
          style={{
            position: "absolute",
            left: POOL_X,
            top: POOL_Y,
            width: POOL_W,
            height: POOL_H,
            borderRadius: 24,
            border: `1.5px solid rgba(27,24,21,0.20)`,
            background: "rgba(255,255,255,0.30)",
            opacity: enter,
            transform: `scale(${0.985 + 0.015 * enter})`,
          }}
        />
        {/* 池内十字参考线（层次：测量腔） */}
        <div style={{ position: "absolute", left: CX, top: POOL_Y + 12, width: 1, height: POOL_H - 24, background: INK, opacity: 0.05 }} />
        <div style={{ position: "absolute", left: POOL_X + 12, top: CY, width: POOL_W - 24, height: 1, background: INK, opacity: 0.05 }} />

        {/* 四角定位角标 */}
        {[
          { x: POOL_X + 14, y: POOL_Y + 14, t: 1, l: 1 },
          { x: POOL_X + POOL_W - 14, y: POOL_Y + 14, t: 1, l: -1 },
          { x: POOL_X + 14, y: POOL_Y + POOL_H - 14, t: -1, l: 1 },
          { x: POOL_X + POOL_W - 14, y: POOL_Y + POOL_H - 14, t: -1, l: -1 },
        ].map((k, i) => (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: k.l > 0 ? k.x : k.x - 22, top: k.y, width: 22, height: 1.5, background: INK, opacity: 0.3 * enter }} />
            <div style={{ position: "absolute", left: k.x, top: k.t > 0 ? k.y : k.y - 22, width: 1.5, height: 22, background: INK, opacity: 0.3 * enter }} />
          </React.Fragment>
        ))}

        {/* ---------------- 64 个原子 ---------------- */}
        {atoms.map((a) => {
          const jx = Math.sin(a.phase + p * a.freq) * A * a.amp;
          const jy = Math.cos(a.phase * 1.27 + p * a.freq * 0.83) * A * a.amp;
          const x = lerp(a.bx + jx, a.tx, conv) + conv * breath;
          const y = lerp(a.by + jy, a.ty, conv) + conv * breath;
          const vx = Math.cos(a.phase + p * a.freq) * a.freq * a.amp;
          const vy = -Math.sin(a.phase * 1.27 + p * a.freq * 0.83) * a.freq * 0.83 * a.amp;
          const trail = lerp(0.55, 0, seg(p, 0.02, 0.5)) * a.amp;
          const appear = clamp01(seg(p, 0.01 + a.late * 0.1, 0.06 + a.late * 0.1));
          return (
            <Atom
              key={a.i}
              x={x}
              y={y}
              r={a.rad}
              color={INK}
              opacity={0.82 * appear}
              trail={trail}
              trailColor={GOLD}
              angle={Math.atan2(vy, vx)}
            />
          );
        })}

        {/* ---------------- 朱红细环 ---------------- */}
        {ringT > 0 ? (
          <div
            style={{
              position: "absolute",
              left: CX - 248,
              top: CY - 248,
              width: 496,
              height: 496,
              borderRadius: "50%",
              border: `2px solid ${RED}`,
              opacity: 0.5 * ringT * (0.72 + 0.28 * ringBreath),
              transform: `scale(${0.88 + 0.12 * pop(ringT)})`,
            }}
          />
        ) : null}
        {tickT > 0
          ? [-90, 30, 150].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: CX + Math.cos(rad) * 248 - 1,
                    top: CY + Math.sin(rad) * 248 - 9,
                    width: 2,
                    height: 18,
                    background: RED,
                    opacity: 0.7 * tickT,
                    transform: `rotate(${deg + 90}deg)`,
                    transformOrigin: "center center",
                  }}
                />
              );
            })
          : null}

        {/* ---------------- 池标签 ---------------- */}
        <Cap
          text="铷原子云 · 微重力"
          x={96}
          y={340}
          size={24}
          color={INK_SOFT}
          style={{ opacity: clamp01(seg(p, 0.02, 0.1)) }}
        />

        {/* ---------------- 右侧热运动条 ---------------- */}
        <Cap
          text="热运动"
          x={906}
          y={350}
          size={22}
          color={INK_FAINT}
          style={{ opacity: clamp01(seg(p, 0.02, 0.1)) }}
        />
        <div
          style={{
            position: "absolute",
            left: 940,
            top: 400,
            width: 10,
            height: 640,
            borderRadius: 5,
            background: INK,
            opacity: 0.12,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 940,
            top: 400,
            width: 10,
            height: 640,
            borderRadius: 5,
            background: RED,
            opacity: 0.9,
            transform: `scaleY(${fillScale})`,
            transformOrigin: "center bottom",
          }}
        />
        {/* 液面刻线（跟着填充顶部走） */}
        <div
          style={{
            position: "absolute",
            left: 934,
            top: 400 + 640 * (1 - fillScale) - 1.5,
            width: 22,
            height: 3,
            background: RED,
            opacity: 0.75,
          }}
        />

        {/* ---------------- 收尾标注 ---------------- */}
        <Cap
          text="热运动几乎停止"
          x={386}
          y={1114}
          size={22}
          color={INK_SOFT}
          style={{ opacity: stopT, transform: `translateY(${(1 - stopT) * 10}px)` }}
        />
        {/* 标注前的朱红小方块 */}
        <div
          style={{
            position: "absolute",
            left: 362,
            top: 1122,
            width: 10,
            height: 10,
            background: RED,
            opacity: stopT,
            transform: `rotate(45deg) scale(${0.6 + 0.4 * stopT})`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default Scene03;
