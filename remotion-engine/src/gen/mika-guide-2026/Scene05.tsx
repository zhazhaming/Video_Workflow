// Scene05 · 收尾打卡墙：真实任务便签逐个盖章 + 一张空白便签留给观众
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, rand } from "../../dv/atmosphere";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const stampScale = (t: number) => {
  const x = clamp01(t);
  return x < 0.6 ? 1.7 - easeOut(x / 0.6) * 0.62 : 1.08 - easeOut((x - 0.6) / 0.4) * 0.08;
};

// 全部来自 Mika README 的真实示例任务
const NOTES = ["总结群聊", "比价购物", "找机票", "代打招呼投简历"];

const MikaScene05: React.FC<GenSceneProps> = ({ p, c1, c2, accent, speed, seed }) => {
  const enter = easeOut(clamp01(p / (0.12 * (2 - speed))));
  // 便签入场：p 0.08~0.44 依次落下
  const noteT = (i: number) => easeOut(clamp01((p - (0.08 + i * 0.09)) / 0.14));
  // 盖章：p 0.36~0.66 依次
  const stampT = (i: number) => clamp01((p - (0.36 + i * 0.08) * (2 - speed)) / 0.12);
  // 空白便签（观众位）p 0.74~0.9
  const blankT = clamp01((p - 0.74) / 0.16);
  const wiggle = Math.sin(p * Math.PI * 5 * speed) * 3;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(155deg, ${c1} 0%, ${c2} 100%)`,
        fontFamily: FONT_STACK,
        overflow: "hidden",
      }}
    >
      {/* 2×2 便签墙 */}
      {NOTES.map((n, i) => {
        const t = noteT(i);
        const st = stampT(i);
        const col = i % 2;
        const row = Math.floor(i / 2);
        return (
          <div
            key={n}
            style={{
              position: "absolute",
              left: col === 0 ? 110 : 590,
              top: 470 + row * 420,
              width: 380,
              height: 330,
              transform: `translateY(${(1 - t) * 120}px) rotate(${(rand(seed + i * 7) - 0.5) * 7}deg) scale(${0.9 + t * 0.1})`,
              opacity: t,
              background: "#FFFDF6",
              borderRadius: 20,
              boxShadow: "0 18px 44px rgba(27,27,34,0.14)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 30,
            }}
          >
            <span style={{ fontSize: 44, fontWeight: 800, color: "#1B1B22", textAlign: "center" }}>
              {n}
            </span>
            {st > 0 ? (
              <div
                style={{
                  position: "absolute",
                  right: 18,
                  top: 12,
                  transform: `rotate(14deg) scale(${stampScale(st)})`,
                  opacity: Math.min(1, st * 2),
                  color: accent,
                  border: `6px solid ${accent}`,
                  borderRadius: "50%",
                  width: 110,
                  height: 110,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 56,
                  fontWeight: 900,
                  background: "rgba(255,255,255,0.6)",
                }}
              >
                ✓
              </div>
            ) : null}
          </div>
        );
      })}

      {/* 观众位空白便签 */}
      {blankT > 0 ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 120,
            width: 560,
            marginLeft: -280,
            transform: `translateY(${(1 - easeOut(blankT)) * 90 + wiggle}px) rotate(-2deg) scale(${0.9 + easeOut(blankT) * 0.1})`,
            opacity: Math.min(1, blankT * 1.5),
            background: accent,
            borderRadius: 24,
            padding: "34px 40px",
            boxShadow: `0 24px 60px ${accent}55`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 46, fontWeight: 900, color: "#fff" }}>你的那个活呢？</span>
          <span style={{ fontSize: 64, fontWeight: 900, color: "#fff", opacity: 0.9 }}>？</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export default MikaScene05;
