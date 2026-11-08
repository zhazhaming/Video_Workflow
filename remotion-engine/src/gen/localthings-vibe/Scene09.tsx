// Scene09 · 真机实证：90 格真机墙按波形点亮 + 50 颗贡献者头像点脉冲（数字交给 typewriter 浮层）
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, mixHex, rand } from "../../dv/atmosphere";
import { INK, LINE, PAPER, SHADOW, clamp01, easeOut, exitFade } from "./ui";

const Scene09: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const TXT = "90台真机 · 50位贡献者";
  const chars = Math.floor(Math.min(1, Math.max(0, (p - 0.32) / 0.3)) * TXT.length);
  // 90 格真机墙（9×10）
  const wall = useMemo(
    () =>
      Array.from({ length: 90 }, (_, k) => ({
        d: rand(seed + k * 7 + 1) * 0.5, // 依序点亮延迟
        hot: rand(seed + k * 7 + 2) > 0.82, // 少数高亮格
      })),
    [seed],
  );
  // 50 位贡献者（2 行 × 25）
  const devs = useMemo(
    () =>
      Array.from({ length: 50 }, (_, k) => ({
        d: rand(seed + k * 5 + 60) * 0.4,
        s: 0.85 + rand(seed + k * 5 + 61) * 0.3,
      })),
    [seed],
  );
  const gridIn = easeOut(clamp01(p / 0.12));

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {/* 背景示波网格 */}
        <div
          style={{
            position: "absolute", inset: 0, opacity: 0.5,
            backgroundImage: `linear-gradient(${LINE} 1px, transparent 1px), linear-gradient(90deg, ${LINE} 1px, transparent 1px)`,
            backgroundSize: "72px 72px",
          }}
        />
        {/* 真机墙 9×10 */}
        <div
          style={{
            position: "absolute", left: 540 - 324, top: 360 + (1 - gridIn) * 40,
            width: 648, opacity: gridIn, transform: `scale(${0.9 + gridIn * 0.1})`,
          }}
        >
          {wall.map((w, k) => {
            const lit = clamp01((p - 0.1 - w.d) / 0.2);
            const pulse = 0.75 + 0.25 * Math.sin(p * Math.PI * 2 * 1.5 + k * 0.7);
            return (
              <div
                key={k}
                style={{
                  position: "absolute",
                  left: (k % 9) * 72, top: Math.floor(k / 9) * 72,
                  width: 56, height: 56, borderRadius: 12,
                  background: lit > 0 ? (w.hot ? accent : mixHex(accent, PAPER, 0.55)) : mixHex(INK, c1, 0.85),
                  border: `3px solid ${INK}`, boxSizing: "border-box",
                  opacity: 0.25 + 0.75 * lit * pulse,
                  transform: `scale(${0.6 + lit * 0.4})`,
                }}
              />
            );
          })}
        </div>
        {/* 实证字条（场景内逐字显现，替代引擎浮层——浮层容器会越安全线） */}
        <div
          style={{
            position: "absolute", left: 540 - 300, top: 1082, width: 600,
            display: "flex", justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "rgba(10,10,16,0.62)", borderRadius: 18,
              padding: "20px 32px", fontSize: 42, fontWeight: 700,
              fontFamily: FONT_STACK, color: "#fff", whiteSpace: "nowrap",
              letterSpacing: 1,
            }}
          >
            {TXT.slice(0, chars)}
            {chars < TXT.length && <span style={{ color: accent }}>▌</span>}
          </div>
        </div>
        {/* 贡献者头像点 2 行 × 25 */}
        {devs.map((d, k) => {
          const lit = clamp01((p - 0.3 - d.d) / 0.24);
          const bob = Math.sin(p * Math.PI * 2 * 1.8 + k) * 4;
          return (
            <div
              key={k}
              style={{
                position: "absolute",
                left: 540 - 450 + (k % 25) * 36 + 4, top: 1180 + Math.floor(k / 25) * 62 + bob,
                width: 30 * d.s, height: 30 * d.s, borderRadius: "50%",
                background: lit > 0 ? mixHex(accent, PAPER, 0.35) : mixHex(INK, c1, 0.8),
                border: `3px solid ${INK}`, boxSizing: "border-box",
                opacity: 0.2 + 0.8 * lit,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export default Scene09;
