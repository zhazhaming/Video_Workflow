// Scene07 · 信号一：量能
// 红色成交量柱子先放大，随后后半段缩下去；上方价格线在量能跟不上时低头。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { rand } from "../../dv/atmosphere";
import { Paper, Cap, Hair, INK, INK_SOFT, FAINT, RED, GREEN, SERIF_STACK, MONO_STACK, seg, eo, eio, pop, clamp01 } from "./ui";

const X0 = 150;
const X1 = 950;
const BASE = 1120;

const Scene07: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const enter = eo(seg(p, 0, 0.1));
  const grow = eo(seg(p, 0.06, 0.42));
  const shrink = eo(seg(p, 0.56, 0.8));
  const note = eo(seg(p, 0.66, 0.82));
  const ex = seg(p, 0.9, 1);
  const main = accent || RED;

  const bars = React.useMemo(
    () =>
      Array.from({ length: 26 }, (_, k) => ({
        h: k < 13 ? 110 + rand(seed + k * 5 + 1) * 190 : 70 + rand(seed + k * 5 + 2) * 140,
      })),
    [seed],
  );

  const bw = 24;
  const gap = 6;
  const linePts = Array.from({ length: 27 }, (_, k) => {
    const x = X0 + k * (bw + gap) + bw / 2;
    const up = Math.min(k, 13) / 13;
    const down = Math.max(0, k - 13) / 13;
    return { x, y: 820 - up * 180 + down * 210 };
  });
  const linePath = linePts.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(" ");

  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} />

      <div style={{ opacity: enter }}>
        <Cap text="07 / VOLUME" x={110} y={300} color={main} />
        <Cap text="信号一" x={962} y={300} align="right" color={FAINT} />
        <Hair x={110} y={338} w={852} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 110, top: 392, opacity: enter }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 18, letterSpacing: 4, color: FAINT }}>SIGNAL 01 / VOLUME</div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 56, fontWeight: 700, color: INK, letterSpacing: 2, marginTop: 4 }}>
          先看成交量。
        </div>
      </div>

      {/* 网格 */}
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ position: "absolute", left: X0, top: 540 + i * 170, width: X1 - X0, height: 1, background: INK, opacity: 0.05 * enter }} />
      ))}
      <div style={{ position: "absolute", left: X0, top: BASE, width: (X1 - X0) * enter, height: 1.5, background: INK, opacity: 0.28 }} />

      {/* 成交量柱 */}
      {bars.map((b, k) => {
        const q = eio(seg(p, 0.05 + k * 0.008, 0.28 + k * 0.008));
        const fade = k > 9 ? 1 - shrink * 0.5 : 1;
        const h = b.h * q * fade;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: X0 + k * (bw + gap),
              top: BASE - h,
              width: bw,
              height: Math.max(2, h),
              background: k > 13 ? `${main}88` : main,
              opacity: (0.55 + 0.45 * q) * (1 - (k > 13 ? shrink * 0.25 : 0)),
              borderRadius: 2,
            }}
          />
        );
      })}

      {/* 价格线 */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <path
          d={linePath}
          fill="none"
          stroke={INK}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1200"
          strokeDashoffset={1200 * (1 - grow)}
          opacity={0.85}
        />
      </svg>

      {/* 量能衰竭提示 */}
      <div style={{ position: "absolute", left: 760, top: 940 - 120 * shrink, opacity: shrink }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 2, color: GREEN }}>量能跟不上</div>
        <div style={{ marginTop: 4, width: 2, height: 70, background: GREEN, opacity: 0.6, transform: "rotate(18deg)" }} />
      </div>

      {/* 价格低头箭头 */}
      <div
        style={{
          position: "absolute",
          left: 880,
          top: 700 + 120 * shrink,
          width: 0,
          height: 0,
          borderLeft: "12px solid transparent",
          borderRight: "12px solid transparent",
          borderTop: `18px solid ${GREEN}`,
          opacity: shrink * 0.85,
          transform: "rotate(16deg)",
        }}
      />

      <div style={{ position: "absolute", left: 110, top: 1230, opacity: note }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 29, color: INK_SOFT }}>
          量能跟不上，高开就容易变成回落。
        </div>
      </div>

      <div style={{ position: "absolute", right: 110, top: 1242, opacity: note * 0.85, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 3, color: FAINT }}>
        PAGE 07
      </div>
    </AbsoluteFill>
  );
};

export default Scene07;
