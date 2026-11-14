// Scene13 · 兼容范围：2018→2026 时间尺扫动，2022 分界后亮绿「大多能用」，旧机段标 8888——场景即信息主体
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK, mixHex, rand } from "../../dv/atmosphere";
import { INK, LINE, MUTED, PAPER, SHADOW, clamp01, easeOut, exitFade } from "./ui";

const Scene13: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const barIn = easeOut(clamp01(p / 0.14));
  const sweep = easeOut(clamp01((p - 0.14) / 0.55)); // 光标从 2018 扫到 2026
  // 2022 在时间尺上的位置：2018~2026 共 8 年 → (2022-2018)/8 = 0.5
  const SPLIT = 0.5;
  const ticks = useMemo(
    () => Array.from({ length: 9 }, (_, i) => ({ y: 2018 + i, x: i / 8 })),
    [],
  );

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {/* 背景网格 */}
        <div
          style={{
            position: "absolute", inset: 0, opacity: 0.45,
            backgroundImage: `linear-gradient(${LINE} 1px, transparent 1px), linear-gradient(90deg, ${LINE} 1px, transparent 1px)`,
            backgroundSize: "90px 90px",
          }}
        />
        {/* 标题骨架条 */}
        <div
          style={{
            position: "absolute", left: 540 - 170, top: 480, width: 340, height: 18,
            borderRadius: 9, background: mixHex(INK, c1, 0.72), opacity: barIn,
          }}
        />
        {/* 时间尺主轴 */}
        <div
          style={{
            position: "absolute", left: 540 - 400, top: 940, width: 800, height: 26,
            borderRadius: 13, background: PAPER, border: `4px solid ${INK}`,
            boxShadow: SHADOW, boxSizing: "border-box", opacity: barIn,
            transform: `scaleX(${barIn})`, transformOrigin: "50% 50%",
          }}
        >
          {/* 2022 后亮绿段 */}
          <div
            style={{
              position: "absolute", left: `${SPLIT * 100}%`, top: 0, bottom: 0,
              width: `${(1 - SPLIT) * 100}%`, borderRadius: "0 9px 9px 0",
              background: accent, opacity: 0.85,
            }}
          />
        </div>
        {/* 年份刻度 */}
        {ticks.map((t, i) => (
          <div
            key={i}
            style={{
              position: "absolute", left: 540 - 400 + t.x * 800 - 40, top: 990,
              width: 80, textAlign: "center",
              fontSize: i === 4 ? 34 : 26, fontWeight: i === 4 ? 900 : 600,
              fontFamily: MONO_STACK,
              color: i >= 4 ? accent : MUTED,
              opacity: barIn * (0.55 + 0.45 * easeOut(clamp01((p - 0.2 - t.x * 0.3) / 0.2))),
            }}
          >
            {t.y}
          </div>
        ))}
        {/* 2022 分界旗标 */}
        <div
          style={{
            position: "absolute", left: 540 - 3, top: 800, width: 6, height: 140,
            background: accent, opacity: easeOut(clamp01((p - 0.3) / 0.2)),
            transform: `scaleY(${easeOut(clamp01((p - 0.3) / 0.2))})`, transformOrigin: "50% 100%",
          }}
        />
        {/* 扫动光标 */}
        <div
          style={{
            position: "absolute", left: 540 - 400 + sweep * 800 - 16, top: 880,
            width: 32, height: 32, borderRadius: "50%", background: accent,
            boxShadow: `0 0 0 ${10 * (1 - sweep)}px ${mixHex(accent, PAPER, 0.75)}`,
            opacity: 0.95,
          }}
        />
        {/* 左段：旧机 8888 标签 */}
        <div
          style={{
            position: "absolute", left: 540 - 330, top: 1080,
            opacity: easeOut(clamp01((p - 0.36) / 0.22)),
            transform: `translateY(${(1 - easeOut(clamp01((p - 0.36) / 0.22))) * 20}px)`,
          }}
        >
          <div
            style={{
              padding: "12px 26px", borderRadius: 14, background: mixHex(INK, c1, 0.82),
              border: `3px solid ${INK}`, fontSize: 28, fontWeight: 700,
              fontFamily: MONO_STACK, color: INK,
            }}
          >
            {"旧机型 · TCP 8888"}
          </div>
        </div>
        {/* 右段：大多能用标签 */}
        <div
          style={{
            position: "absolute", left: 540 + 60, top: 1080,
            opacity: easeOut(clamp01((p - 0.46) / 0.22)),
            transform: `translateY(${(1 - easeOut(clamp01((p - 0.46) / 0.22))) * 20}px)`,
          }}
        >
          <div
            style={{
              padding: "12px 26px", borderRadius: 14, background: accent,
              border: `3px solid ${INK}`, fontSize: 28, fontWeight: 800,
              color: PAPER,
            }}
          >
            {"2022 后 · 大多能用"}
          </div>
        </div>
        {/* 顶部小家电图标排（静默点缀） */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute", left: 190 + i * 150, top: 640,
              width: 64, height: 64, borderRadius: 14, background: PAPER,
              border: `3px solid ${INK}`, opacity: 0.25 + 0.55 * easeOut(clamp01((p - 0.1 - i * 0.06) / 0.25)),
              transform: `translateY(${(1 - easeOut(clamp01((p - 0.1 - i * 0.06) / 0.25))) * 16}px)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 28, height: 28, borderRadius: i % 2 ? "50%" : 6,
                background: i >= 3 ? accent : mixHex(accent, PAPER, 0.5), border: `2px solid ${INK}`, boxSizing: "border-box",
              }}
            />
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default Scene13;
