// Scene07 · 小龙虾定位：手机聊天列表 mockup + 管家小卡（爪痕圆徽）（对应 s07 住进微信的私人管家）
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, rand, mixHex } from "../../dv/atmosphere";
import { easeOut, clamp01, exitFade, INK, LINE, PAPER, SHADOW, Bar } from "./ui";

const Scene07: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const rows = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        tone: i === 0 ? accent : mixHex(c2, INK, 0.2 + rand(seed + i * 5) * 0.32),
        w1: 110 + rand(seed + i * 5 + 1) * 70,
        w2: 60 + rand(seed + i * 5 + 2) * 50,
        badge: i === 0,
      })),
    [seed],
  );
  const phoneIn = easeOut(clamp01(p / 0.15));
  const cardIn = easeOut(clamp01((p - 0.34) / 0.16));

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {/* 暖色氛围圆 */}
        <div style={{ position: "absolute", left: 730 - 300, top: 890 - 300, width: 600, height: 600, borderRadius: "50%", background: accent, opacity: 0.06 }} />

        {/* 手机 mockup */}
        <div
          style={{
            position: "absolute",
            left: 560,
            top: 560,
            width: 340,
            height: 700,
            borderRadius: 48,
            background: PAPER,
            border: `3px solid ${LINE}`,
            boxShadow: SHADOW,
            overflow: "hidden",
            opacity: phoneIn,
            transform: `translateY(${(1 - phoneIn) * 60}px)`,
          }}
        >
          <div style={{ position: "absolute", left: 110, top: 18, width: 120, height: 22, borderRadius: 11, background: mixHex(INK, c1, 0.55) }} />
          <div style={{ position: "absolute", left: 22, top: 62, width: 180, height: 14, borderRadius: 7, background: mixHex(INK, c1, 0.6) }} />
          {rows.map((r, i) => {
            const inn = easeOut(clamp01((p - 0.12 - i * 0.07) / 0.16));
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 22,
                  top: 108 + i * 108,
                  width: 296,
                  height: 88,
                  borderRadius: 18,
                  background: i === 0 ? "rgba(200,69,45,0.07)" : "rgba(20,17,15,0.035)",
                  border: i === 0 ? `2px solid ${accent}` : "2px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "0 16px",
                  opacity: inn,
                  transform: `translateX(${(1 - inn) * 28}px)`,
                }}
              >
                <div style={{ width: 50, height: 50, borderRadius: "50%", background: r.tone, flexShrink: 0 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                  <Bar w={r.w1} h={12} c={i === 0 ? accent : LINE} />
                  <Bar w={r.w2} h={9} />
                </div>
                {r.badge && (
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFF7EE" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 管家小卡：爪痕圆徽 + 名条 */}
        <div style={{ position: "absolute", left: 200, top: 1010, opacity: cardIn, transform: `scale(${0.8 + cardIn * 0.2})` }}>
          <div style={{ position: "relative", width: 190, height: 190, borderRadius: "50%", background: accent, boxShadow: SHADOW }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 62 + i * 24,
                  top: 48,
                  width: 12,
                  height: 84,
                  borderRadius: 6,
                  background: "rgba(255,251,244,0.92)",
                  transform: "rotate(16deg)",
                  opacity: 0.6 + i * 0.15,
                }}
              />
            ))}
          </div>
          <div
            style={{
              marginTop: 22,
              width: 210,
              height: 64,
              borderRadius: 32,
              background: PAPER,
              border: `2px solid ${LINE}`,
              boxShadow: SHADOW,
              display: "flex",
              alignItems: "center",
              gap: 12,
              paddingLeft: 20,
            }}
          >
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: accent }} />
            <Bar w={110} h={13} />
          </div>
        </div>

        {/* 气泡上浮点缀 */}
        {Array.from({ length: 8 }, (_, k) => (
          <span
            key={k}
            style={{
              position: "absolute",
              left: 160 + rand(seed + k * 3 + 70) * 320,
              top: 620 + rand(seed + k * 3 + 71) * 700 - ((p * 60) % 200),
              width: 14,
              height: 14,
              borderRadius: "50%",
              border: `2px solid ${accent}`,
              opacity: 0.28,
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default Scene07;
