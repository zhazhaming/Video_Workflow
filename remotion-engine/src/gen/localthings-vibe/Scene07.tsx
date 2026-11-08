// Scene07 · 实时同步：30 秒轮询表盘扫动 + 推送波形从小屋射向手机（数字交给 counter 浮层）
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK, mixHex } from "../../dv/atmosphere";
import { INK, LINE, PAPER, SHADOW, clamp01, easeOut, exitFade } from "./ui";

const Scene07: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const dialIn = easeOut(clamp01(p / 0.14));
  const sweep = (p * 0.9) % 1; // 表针循环扫
  const ticks = useMemo(() => Array.from({ length: 30 }, (_, i) => i), []);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {/* 30 秒表盘 */}
        <div
          style={{
            position: "absolute", left: 540 - 240, top: 380 + (1 - dialIn) * 60,
            width: 480, height: 480, borderRadius: "50%", background: PAPER,
            border: `5px solid ${INK}`, boxShadow: SHADOW, boxSizing: "border-box",
            opacity: dialIn, transform: `scale(${0.8 + dialIn * 0.2})`,
          }}
        >
          {ticks.map((i) => {
            const a = (i / 30) * 360 - 90;
            const lit = i / 30 <= sweep;
            return (
              <div
                key={i}
                style={{
                  position: "absolute", left: "50%", top: "50%",
                  width: 4, height: i % 5 === 0 ? 26 : 16,
                  background: lit ? accent : mixHex(INK, c1, 0.78),
                  transformOrigin: "50% 0",
                  transform: `rotate(${a}deg) translateY(-${196 - (i % 5 === 0 ? 26 : 16)}px)`,
                  borderRadius: 2, opacity: lit ? 0.95 : 0.7,
                }}
              />
            );
          })}
          {/* 中心 + 指针 */}
          <div
            style={{
              position: "absolute", left: "50%", top: "50%", width: 22, height: 22,
              borderRadius: "50%", background: INK, transform: "translate(-50%,-50%)",
            }}
          />
          <div
            style={{
              position: "absolute", left: "50%", top: "50%", width: 6, height: 180,
              background: accent, transformOrigin: "50% 100%",
              transform: `translate(-50%,-100%) rotate(${sweep * 360}deg)`, borderRadius: 3,
            }}
          />
        </div>
        {/* 表盘读数环 */}
        <div
          style={{
            position: "absolute", left: 540 - 270, top: 350, width: 540, height: 540,
            borderRadius: "50%", border: `2px dashed ${LINE}`,
            transform: `rotate(${-p * 26}deg)`,
          }}
        />

        {/* 小屋 → 手机：推送波形 */}
        <div
          style={{
            position: "absolute", left: 120, top: 1120, width: 170, height: 170,
            borderRadius: 26, background: PAPER, border: `4px solid ${INK}`, boxShadow: SHADOW,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 84, height: 66, background: accent,
              clipPath: "polygon(50% 0, 100% 40%, 100% 100%, 0 100%, 0 40%)",
            }}
          />
        </div>
        {/* 波形条（错落起伏） */}
        {Array.from({ length: 12 }, (_, i) => {
          const h = 22 + 70 * Math.abs(Math.sin(p * Math.PI * 2 * 1.6 + i * 0.55));
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: 320 + i * 42, top: 1205 - h / 2,
                width: 16, height: h, borderRadius: 8,
                background: i % 3 === 0 ? accent : mixHex(INK, c1, 0.7),
                opacity: 0.55 + 0.35 * Math.sin(p * Math.PI * 2 + i),
              }}
            />
          );
        })}
        {/* 手机（右下，弹入通知点） */}
        <div
          style={{
            position: "absolute", left: 810, top: 1090, width: 150, height: 260,
            borderRadius: 28, background: PAPER, border: `4px solid ${INK}`, boxShadow: SHADOW,
            boxSizing: "border-box", paddingTop: 20,
          }}
        >
          {[0, 1, 2].map((i) => {
            const t = easeOut(clamp01(((p * 1.2 + i * 0.2) % 1 - 0.5) / 0.5));
            return (
              <div
                key={i}
                style={{
                  margin: "0 14px 12px", height: 52, borderRadius: 12,
                  background: i === 0 ? accent : mixHex(INK, c1, 0.88),
                  opacity: 0.25 + 0.75 * t, transform: `scale(${0.85 + t * 0.15})`,
                }}
              />
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene07;
