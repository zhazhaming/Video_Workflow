// Scene12 · 互动引导：三枚互动徽章（点赞心形 / 收藏星 / 关注铃）弹跳升起 + 撒彩点（爆点收尾）
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, mixHex, rand } from "../../dv/atmosphere";
import { INK, LINE, PAPER, SHADOW, clamp01, easeBack, easeOut, exitFade } from "./ui";

const Scene12: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const confetti = useMemo(
    () =>
      Array.from({ length: 30 }, (_, k) => ({
        x: 60 + rand(seed + k * 5 + 30) * 960,
        y0: -40 - rand(seed + k * 5 + 31) * 420,
        v: 260 + rand(seed + k * 5 + 32) * 340,
        s: 10 + rand(seed + k * 5 + 33) * 14,
        c: k % 3,
        rot: rand(seed + k * 5 + 34) * 360,
      })),
    [seed],
  );
  const badge = (i: number) => easeBack(clamp01((p - 0.08 - i * 0.14) / 0.26));
  const bob = (i: number) => Math.sin(p * Math.PI * 2 * 1.5 + i * 1.2) * 9;

  const BADGES = [
    { x: 540 - 300, icon: "heart" as const, hi: true },   // 点赞
    { x: 540 - 46, icon: "star" as const, hi: false },    // 收藏
    { x: 540 + 208, icon: "bell" as const, hi: false },   // 关注
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(158deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {/* 中央光晕托底 */}
        <div
          style={{
            position: "absolute", left: 540 - 330, top: 760 - 330, width: 660, height: 660,
            borderRadius: "50%", background: accent, opacity: 0.07 + 0.03 * Math.sin(p * Math.PI * 2),
          }}
        />
        {/* 撒彩点 */}
        {confetti.map((s, k) => (
          <div
            key={k}
            style={{
              position: "absolute", left: s.x, top: s.y0 + p * s.v, width: s.s, height: s.s,
              borderRadius: "50%",
              background: s.c === 0 ? accent : s.c === 1 ? mixHex(accent, PAPER, 0.4) : mixHex(INK, c1, 0.55),
              opacity: 0.55, transform: `rotate(${s.rot + p * 200}deg)`,
            }}
          />
        ))}
        {/* 三枚徽章 */}
        {BADGES.map((b, i) => {
          const t = badge(i);
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: b.x, top: 640 + (1 - t) * 420 + bob(i),
                width: 184, height: 184, opacity: clamp01(t * 1.3),
                transform: `scale(${0.5 + t * 0.5})`,
              }}
            >
              <div
                style={{
                  position: "absolute", inset: 0, borderRadius: "50%", background: PAPER,
                  border: `5px solid ${INK}`, boxShadow: SHADOW, boxSizing: "border-box",
                }}
              />
              {/* 图标（静态 clip-path / 几何，动画只走 transform/opacity） */}
              {b.icon === "heart" && (
                <div style={{ position: "absolute", left: 38, top: 48, width: 108, height: 96 }}>
                  <div style={{ position: "absolute", left: 0, top: 12, width: 58, height: 58, borderRadius: "50%", background: accent }} />
                  <div style={{ position: "absolute", right: 0, top: 12, width: 58, height: 58, borderRadius: "50%", background: accent }} />
                  <div style={{ position: "absolute", left: 12, top: 34, width: 84, height: 70, background: accent, transform: "rotate(45deg)", borderRadius: 14 }} />
                </div>
              )}
              {b.icon === "star" && (
                <div
                  style={{
                    position: "absolute", left: 30, top: 30, width: 124, height: 124, background: accent,
                    clipPath: "polygon(50% 0, 63% 36%, 100% 38%, 71% 60%, 82% 100%, 50% 76%, 18% 100%, 29% 60%, 0 38%, 37% 36%)",
                  }}
                />
              )}
              {b.icon === "bell" && (
                <div style={{ position: "absolute", left: 44, top: 34, width: 96, height: 116 }}>
                  <div style={{ position: "absolute", left: 0, top: 12, width: 96, height: 78, background: accent, borderRadius: "48px 48px 10px 10px" }} />
                  <div style={{ position: "absolute", left: -12, top: 86, width: 120, height: 14, background: accent, borderRadius: 7 }} />
                  <div style={{ position: "absolute", left: 38, top: 100, width: 20, height: 20, borderRadius: "50%", background: accent }} />
                </div>
              )}
              {/* 高亮徽章描边圈 */}
              {b.hi && (
                <div
                  style={{
                    position: "absolute", inset: -14, borderRadius: "50%",
                    border: `4px dashed ${accent}`,
                    transform: `rotate(${p * 60}deg)`,
                  }}
                />
              )}
            </div>
          );
        })}
        {/* 徽章弹起时的冲击环 */}
        {[0, 1, 2].map((i) => {
          const q = clamp01((p - 0.16 - i * 0.14) / 0.36);
          if (q <= 0 || q >= 1) return null;
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: BADGES[i].x + 92 - 110 - q * 90, top: 730 - q * 150,
                width: 220 + q * 180, height: 220 + q * 180, borderRadius: "50%",
                border: `3px solid ${accent}`, opacity: 0.3 * (1 - q),
              }}
            />
          );
        })}
        {/* 底部三连骨架条 */}
        <div
          style={{
            position: "absolute", left: 540 - 190, top: 1080,
            opacity: easeOut(clamp01((p - 0.5) / 0.25)),
          }}
        >
          <div
            style={{
              width: 380, height: 76, borderRadius: 38, background: PAPER,
              border: `3px solid ${INK}`, boxShadow: SHADOW, boxSizing: "border-box",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: easeBack(clamp01((p - 0.55 - i * 0.1) / 0.2)) > 0.5 ? accent : LINE,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene12;
