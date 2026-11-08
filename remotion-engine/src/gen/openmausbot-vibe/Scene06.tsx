// Scene06 · 自动打工：定时器圆环 + 信封自动起草 + 应用点阵（对应 s06 定时/邮件/五百应用）
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, rand, mixHex } from "../../dv/atmosphere";
import { easeOut, clamp01, exitFade, INK, LINE, PAPER, SHADOW, Bar } from "./ui";

const Scene06: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const apps = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        hot: rand(seed + i * 5 + 20) > 0.7,
        dly: 0.52 + i * 0.022,
      })),
    [seed],
  );
  const dots = useMemo(
    () =>
      Array.from({ length: 12 }, (_, k) => ({
        x: 90 + rand(seed + k * 7 + 80) * 900,
        y: 380 + rand(seed + k * 7 + 81) * 1050,
        r: 3 + rand(seed + k * 7 + 82) * 4,
      })),
    [seed],
  );
  const ringIn = easeOut(clamp01(p / 0.14));
  const mailIn = easeOut(clamp01((p - 0.26) / 0.16));
  const draftIn = easeOut(clamp01((p - 0.48) / 0.16));

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {/* 微粒 */}
        {dots.map((d, k) => (
          <span
            key={k}
            style={{
              position: "absolute",
              left: d.x,
              top: d.y + Math.sin(p * Math.PI * 2 + k) * 8,
              width: d.r * 2,
              height: d.r * 2,
              borderRadius: "50%",
              background: k % 3 === 0 ? accent : mixHex(INK, c1, 0.72),
              opacity: 0.25 + 0.2 * Math.sin(p * Math.PI * 2 * 1.3 + k),
            }}
          />
        ))}

        {/* 定时器圆环 */}
        <div style={{ position: "absolute", left: 540, top: 690, opacity: ringIn, transform: `scale(${0.85 + ringIn * 0.15})` }}>
          <div style={{ position: "absolute", left: -172, top: -172, width: 344, height: 344, borderRadius: "50%", border: `14px solid ${LINE}` }} />
          <div
            style={{
              position: "absolute",
              left: -172,
              top: -172,
              width: 344,
              height: 344,
              borderRadius: "50%",
              border: "14px solid transparent",
              borderTopColor: accent,
              borderRightColor: accent,
              transform: `rotate(${p * 540}deg)`,
              opacity: 0.85,
            }}
          />
          {/* 指针 */}
          <div style={{ position: "absolute", left: -5, top: -70, width: 10, height: 74, borderRadius: 5, background: mixHex(INK, c1, 0.4), transformOrigin: "50% 70px", transform: `rotate(${p * 360 * 0.8}deg)` }} />
          <div style={{ position: "absolute", left: -4, top: -104, width: 8, height: 108, borderRadius: 4, background: accent, transformOrigin: "50% 104px", transform: `rotate(${p * 360 * 3}deg)` }} />
          <div style={{ position: "absolute", left: -13, top: -13, width: 26, height: 26, borderRadius: "50%", background: INK }} />
        </div>

        {/* 信封 + 自动草拟回复 */}
        <div style={{ position: "absolute", left: 150, top: 1046, opacity: mailIn, transform: `translateY(${(1 - mailIn) * 34}px)` }}>
          <div style={{ position: "relative", width: 300, height: 190 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 18, background: PAPER, border: `2px solid ${LINE}`, boxShadow: SHADOW }} />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 300,
                height: 110,
                background: mixHex(accent, c1, 0.82),
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                borderRadius: "18px 18px 0 0",
                opacity: 0.75,
              }}
            />
            <div style={{ position: "absolute", left: 34, top: 118, width: 232, height: 12, borderRadius: 6, background: LINE }} />
            <div style={{ position: "absolute", left: 34, top: 146, width: 160, height: 12, borderRadius: 6, background: LINE }} />
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 130,
            top: 1288,
            width: 300,
            height: 96,
            borderRadius: 18,
            background: accent,
            boxShadow: SHADOW,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 12,
            paddingLeft: 26,
            opacity: draftIn,
            transform: `translateY(${(1 - draftIn) * 26}px)`,
          }}
        >
          <Bar w={210} h={13} c="rgba(255,251,244,0.9)" />
          <Bar w={140} h={10} c="rgba(255,251,244,0.55)" />
        </div>

        {/* 应用点阵（五百多个应用） */}
        {apps.map((a, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const inn = easeOut(clamp01((p - a.dly) / 0.14));
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 560 + col * 84,
                top: 1014 + row * 84,
                width: 58,
                height: 58,
                borderRadius: 16,
                background: a.hot ? accent : mixHex(c2, INK, 0.3),
                boxShadow: SHADOW,
                opacity: inn,
                transform: `scale(${0.6 + inn * 0.4}) rotate(${Math.sin(p * Math.PI * 2 + i) * 4}deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: a.hot ? "#FFF7EE" : "rgba(253,251,245,0.8)" }} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export default Scene06;
