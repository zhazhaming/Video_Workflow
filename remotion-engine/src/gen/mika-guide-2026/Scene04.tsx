// Scene04 · 直接开大：手机 mockup + 找机票真实演示 GIF + 三枚任务 chip 逐个盖章
// 素材：google-flights.gif（来源 GitHub @wangzan101/Mika，README：找最便宜直飞）
import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { Gif } from "@remotion/gif";
import type { GenSceneProps } from "../types";
import { FONT_STACK, rand } from "../../dv/atmosphere";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const stampScale = (t: number) => {
  const x = clamp01(t);
  return x < 0.6 ? 1.7 - easeOut(x / 0.6) * 0.62 : 1.08 - easeOut((x - 0.6) / 0.4) * 0.08;
};

const CHIPS = ["总结群聊", "全网比价", "找最便宜机票"];

const MikaScene04: React.FC<GenSceneProps> = ({ p, c1, c2, accent, speed, seed }) => {
  const enter = easeOut(clamp01(p / (0.13 * (2 - speed))));
  const bob = Math.sin(p * Math.PI * 2 * speed) * 8;
  // 三枚 chip 盖章时刻
  const stamps = [0.42, 0.56, 0.7].map((t0, i) => clamp01((p - t0 * (2 - speed)) / 0.12));

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(155deg, ${c1} 0%, ${c2} 100%)`,
        fontFamily: FONT_STACK,
        overflow: "hidden",
      }}
    >
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 60 + rand(seed + i * 9) * 800,
            top: 200 + rand(seed + i * 9 + 4) * 1200,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}1f 0%, transparent 66%)`,
          }}
        />
      ))}

      {/* 手机 mockup（右偏，给 chips 留位） */}
      <div
        style={{
          position: "absolute",
          left: 84,
          top: 300,
          width: 560,
          height: 1150,
          transform: `translateY(${(1 - enter) * 180 + bob}px) scale(${0.94 + enter * 0.06})`,
          opacity: enter,
          borderRadius: 72,
          background: "#17171C",
          padding: 16,
          boxShadow: "0 40px 100px rgba(23,23,28,0.35)",
        }}
      >
        <div style={{ width: "100%", height: "100%", borderRadius: 58, overflow: "hidden" }}>
          <Gif
            src={staticFile("pic/projects/mika-guide-2026/google-flights.gif")}
            fit="cover"
            width={528}
            height={1118}
          />
        </div>
      </div>

      {/* 任务 chips 逐个盖章（右侧竖排） */}
      {CHIPS.map((c, i) => {
        const t = stamps[i];
        if (t <= 0) return null;
        return (
          <div
            key={c}
            style={{
              position: "absolute",
              right: 56,
              top: 420 + i * 185,
              transform: `rotate(${(rand(seed + i * 3) - 0.5) * 8}deg) scale(${stampScale(t)})`,
              opacity: Math.min(1, t * 2),
              background: i === 2 ? accent : "#ffffff",
              color: i === 2 ? "#fff" : "#1B1B22",
              border: `4px solid ${accent}`,
              borderRadius: 22,
              padding: "18px 34px",
              fontSize: 36,
              fontWeight: 900,
              boxShadow: "0 14px 40px rgba(27,27,34,0.18)",
              whiteSpace: "nowrap",
            }}
          >
            {c} <span style={{ color: i === 2 ? "#fff" : accent }}>✓</span>
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          bottom: 60,
          width: "100%",
          textAlign: "center",
          fontSize: 22,
          color: "#8A8578",
          opacity: 0.75,
        }}
      >
        演示素材 GitHub @wangzan101/Mika
      </div>
    </AbsoluteFill>
  );
};

export default MikaScene04;
