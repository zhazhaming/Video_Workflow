// Scene10 · 数据回家：屋外散落的数据粒子被缓缓吸回屋内，归档成卡片，still 静稳收束
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, mixHex, rand } from "../../dv/atmosphere";
import { INK, LINE, PAPER, SHADOW, clamp01, easeBack, easeOut, exitFade } from "./ui";

const Scene10: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  // 26 颗数据粒子：从屋外沿弧线落回屋内档案位
  const bits = useMemo(
    () =>
      Array.from({ length: 26 }, (_, k) => {
        const ang = rand(seed + k * 7 + 3) * Math.PI * 2;
        const r = 320 + rand(seed + k * 7 + 4) * 260;
        return {
          x0: 540 + Math.cos(ang) * r,
          y0: 850 + Math.sin(ang) * r * 1.15,
          cx: 540 + Math.cos(ang) * r * 0.45 + (rand(seed + k * 7 + 8) - 0.5) * 240,
          cy: 850 + Math.sin(ang) * r * 0.5 - 140,
          d: rand(seed + k * 7 + 5) * 0.35, // 归巢延迟
          sq: rand(seed + k * 7 + 6) > 0.5,
        };
      }),
    [seed],
  );
  const houseIn = easeOut(clamp01(p / 0.13));
  // 屋内档案卡堆（随粒子归巢逐渐叠高）
  const filed = clamp01((p - 0.3) / 0.45);
  const winGlow = clamp01((p - 0.6) / 0.25); // 归档完成后窗灯亮
  const flag = easeBack(clamp01((p - 0.66) / 0.22)); // 屋顶升旗（价值达成感）

  return (
    <AbsoluteFill style={{ background: `linear-gradient(165deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {/* 柔光斑（静） */}
        {[
          { x: 180, y: 420, s: 300, o: 0.1 },
          { x: 760, y: 1180, s: 360, o: 0.08 },
        ].map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute", left: b.x, top: b.y, width: b.s, height: b.s,
              borderRadius: "50%", background: accent, opacity: b.o,
            }}
          />
        ))}
        {/* 大房子（剖面感：屋身中央镂空放档案堆） */}
        <div
          style={{
            position: "absolute", left: 540 - 300, top: 560 + (1 - houseIn) * 50,
            opacity: houseIn,
          }}
        >
          <div
            style={{
              position: "absolute", left: 0, top: 0, width: 600, height: 190,
              background: PAPER, border: `4px solid ${INK}`,
              clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
              borderRadius: 20, boxShadow: SHADOW, boxSizing: "border-box",
            }}
          />
          <div
            style={{
              position: "absolute", left: 50, top: 190, width: 500, height: 380,
              background: PAPER, border: `4px solid ${INK}`, borderRadius: "0 0 26px 26px",
              boxShadow: SHADOW, boxSizing: "border-box", overflow: "hidden",
            }}
          >
            {/* 窗灯（归档完成后亮起，位于房身上部两角） */}
            <div style={{ position: "absolute", left: 34, top: 26, width: 90, height: 84, borderRadius: 12, background: accent, opacity: 0.15 + winGlow * 0.7, border: `3px solid ${INK}`, boxSizing: "border-box" }} />
            <div style={{ position: "absolute", right: 34, top: 26, width: 90, height: 84, borderRadius: 12, background: accent, opacity: 0.15 + winGlow * 0.7, border: `3px solid ${INK}`, boxSizing: "border-box" }} />
          </div>
        {/* 烟囱（安心小细节） */}
        <div
          style={{
            position: "absolute", left: 430, top: 40, width: 44, height: 90,
            background: PAPER, border: `4px solid ${INK}`, borderRadius: 8, boxSizing: "border-box",
          }}
        />
        {/* 屋顶升旗（数据归档完成） */}
        <div
          style={{
            position: "absolute", left: 150, top: -46 - flag * 10, width: 8, height: 54 + flag * 10,
            background: INK, borderRadius: 4, transformOrigin: "bottom center",
          }}
        >
          <div
            style={{
              position: "absolute", left: 8, top: 0, width: 66, height: 44,
              background: accent, borderRadius: "4px 10px 10px 4px",
              opacity: flag, transformOrigin: "left center",
              transform: `scaleX(${flag})`,
            }}
          />
        </div>
        </div>
        {/* 屋内档案卡堆（从下往上叠） */}
        {Array.from({ length: 4 }, (_, i) => {
          const t = clamp01(filed * 4 - i);
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: 540 - 150 + i * 4, top: 985 - i * 50,
                width: 300, height: 44, borderRadius: 10,
                background: i === 3 ? accent : mixHex(accent, PAPER, 0.5),
                border: `3px solid ${INK}`, boxSizing: "border-box",
                opacity: easeOut(t), transform: `translateY(${(1 - easeOut(t)) * 26}px)`,
                display: "flex", alignItems: "center", paddingLeft: 18, gap: 10,
              }}
            >
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: PAPER }} />
              <div style={{ width: 150, height: 10, borderRadius: 5, background: "rgba(255,255,255,0.6)" }} />
            </div>
          );
        })}
        {/* 数据粒子沿弧线归巢 */}
        {bits.map((b, k) => {
          const t = easeOut(clamp01((p - 0.12 - b.d) / 0.42));
          // 二次贝塞尔：起点 → 弧顶控制点 → 屋内
          const x = (1 - t) * (1 - t) * b.x0 + 2 * (1 - t) * t * b.cx + t * t * (540 - 90);
          const y = (1 - t) * (1 - t) * b.y0 + 2 * (1 - t) * t * b.cy + t * t * 860;
          return (
            <div
              key={k}
              style={{
                position: "absolute", left: x, top: y, width: 18, height: 18,
                borderRadius: b.sq ? 5 : "50%",
                background: k % 4 === 0 ? accent : mixHex(accent, PAPER, 0.3),
                border: `2px solid ${INK}`, boxSizing: "border-box",
                opacity: 0.9 * (1 - t * 0.55), transform: `rotate(${t * 220}deg)`,
              }}
            />
          );
        })}
        {/* 地面线 */}
        <div
          style={{
            position: "absolute", left: 540 - 340, top: 1150, width: 680, height: 8,
            borderRadius: 4, background: mixHex(INK, c1, 0.78),
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default Scene10;
