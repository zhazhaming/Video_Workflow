// Scene01 · 阿扎报到：杂货铺开张——聊天气泡卡从底部升起 + 呼吸灯牌（对应 s01 开场问好/报题）
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, rand, mixHex, lerp } from "../../dv/atmosphere";
import { easeOut, clamp01, exitFade, INK, LINE, PAPER, SHADOW, Bar } from "./ui";

const Scene01: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const bubbles = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        x: [110, 580, 170, 610, 130, 550][i],
        w: [360, 330, 420, 340, 380, 360][i],
        h: [104, 88, 128, 88, 104, 88][i],
        yEnd: [430, 540, 660, 780, 900, 1010][i],
        delay: 0.03 + i * 0.075,
        hi: i === 2,
      })),
    [seed],
  );
  const dots = useMemo(
    () =>
      Array.from({ length: 22 }, (_, k) => ({
        x: 20 + rand(seed + k * 3 + 40) * 1040,
        y0: 260 + rand(seed + k * 3 + 41) * 1420,
        r: 3 + rand(seed + k * 3 + 42) * 5,
        v: 40 + rand(seed + k * 3 + 43) * 80,
        tw: rand(seed + k * 3 + 44) * Math.PI * 2,
      })),
    [seed],
  );
  const halo = 1 + Math.sin(p * Math.PI * 2) * 0.03;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {/* 灯牌：呼吸圆 + 虚线轨道 */}
        <div
          style={{
            position: "absolute",
            left: 540 - 330 * halo,
            top: 620 - 330 * halo,
            width: 660 * halo,
            height: 660 * halo,
            borderRadius: "50%",
            background: accent,
            opacity: 0.07,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 540 - 400,
            top: 620 - 400,
            width: 800,
            height: 800,
            borderRadius: "50%",
            border: `2px dashed ${LINE}`,
            transform: `rotate(${p * 36}deg)`,
          }}
        />
        {/* 上升微粒 */}
        {dots.map((d, k) => (
          <span
            key={k}
            style={{
              position: "absolute",
              left: d.x,
              top: d.y0 - ((p * d.v) % 1600),
              width: d.r * 2,
              height: d.r * 2,
              borderRadius: "50%",
              background: k % 3 === 0 ? accent : mixHex(INK, c1, 0.7),
              opacity: 0.35 + 0.3 * Math.sin(p * Math.PI * 2 + d.tw),
            }}
          />
        ))}
        {/* 气泡卡 */}
        {bubbles.map((b, i) => {
          const inn = easeOut(clamp01((p - b.delay) / 0.5));
          const y = lerp(1500, b.yEnd, inn) + Math.sin(p * Math.PI * 2 * 1.4 + i * 1.1) * 8;
          const barW = b.w - 160;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: b.x,
                top: y,
                width: b.w,
                height: b.h,
                borderRadius: 26,
                background: b.hi ? accent : PAPER,
                boxShadow: SHADOW,
                opacity: inn,
                transform: `translateY(${(1 - inn) * 30}px)`,
                padding: "0 26px",
                display: "flex",
                alignItems: "center",
                gap: 18,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: b.hi ? "rgba(255,255,255,0.92)" : mixHex(INK, c1, 0.72),
                  flexShrink: 0,
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                <Bar w={barW} h={16} c={b.hi ? "rgba(255,255,255,0.88)" : LINE} />
                <Bar w={barW * 0.62} h={12} c={b.hi ? "rgba(255,255,255,0.6)" : LINE} />
              </div>
            </div>
          );
        })}
        {/* 地面投影 */}
        <div
          style={{
            position: "absolute",
            left: 540 - 330,
            top: 1540,
            width: 660,
            height: 44,
            borderRadius: "50%",
            background: LINE,
            opacity: 0.5,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default Scene01;
