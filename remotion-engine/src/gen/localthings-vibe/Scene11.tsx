// Scene11 · 收尾致谢：柔和光斑幕布 + 印章盖下（对勾徽记）+ 缓落彩带（缓拉收束）
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, mixHex, rand } from "../../dv/atmosphere";
import { INK, LINE, PAPER, SHADOW, clamp01, easeBack, easeOut, exitFade } from "./ui";

const Scene11: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const blobs = useMemo(
    () =>
      Array.from({ length: 7 }, (_, k) => ({
        x: 80 + rand(seed + k * 3 + 20) * 900,
        y: 340 + rand(seed + k * 3 + 21) * 1100,
        s: 90 + rand(seed + k * 3 + 22) * 180,
        tw: rand(seed + k * 3 + 23) * Math.PI * 2,
      })),
    [seed],
  );
  const ribbons = useMemo(
    () =>
      Array.from({ length: 12 }, (_, k) => ({
        x: 80 + rand(seed + k * 5 + 50) * 920,
        y0: -60 - rand(seed + k * 5 + 51) * 300,
        v: 120 + rand(seed + k * 5 + 52) * 130,
        c: k % 3,
        rot: rand(seed + k * 5 + 53) * 360,
      })),
    [seed],
  );
  const stampT = easeBack(clamp01((p - 0.3) / 0.22)); // 印章盖下

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {/* 柔光斑幕布 */}
        {blobs.map((b, k) => (
          <div
            key={k}
            style={{
              position: "absolute", left: b.x, top: b.y, width: b.s, height: b.s,
              borderRadius: "50%",
              background: k % 3 === 0 ? accent : mixHex(INK, c1, 0.8),
              opacity: 0.1 + 0.07 * Math.sin(p * Math.PI * 2 + b.tw),
            }}
          />
        ))}
        {/* 缓落彩带 */}
        {ribbons.map((r, k) => (
          <div
            key={k}
            style={{
              position: "absolute", left: r.x, top: r.y0 + p * r.v, width: 16, height: 42,
              borderRadius: 8,
              background: r.c === 0 ? accent : r.c === 1 ? mixHex(accent, PAPER, 0.45) : mixHex(INK, c1, 0.6),
              opacity: 0.5, transform: `rotate(${r.rot + p * 120}deg)`,
            }}
          />
        ))}
        {/* 中央印章 */}
        <div
          style={{
            position: "absolute", left: 540 - 170, top: 700 - 170,
            width: 340, height: 340,
            opacity: clamp01(stampT * 1.2), transform: `scale(${1.7 - stampT * 0.7}) rotate(${(1 - stampT) * -14 - 6}deg)`,
          }}
        >
          <div
            style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: `10px solid ${accent}`, opacity: 0.92, boxSizing: "border-box",
            }}
          />
          <div
            style={{
              position: "absolute", inset: 26, borderRadius: "50%",
              border: `4px dashed ${accent}`, opacity: 0.6, boxSizing: "border-box",
            }}
          />
          {/* 对勾徽记 */}
          <div
            style={{
              position: "absolute", left: 96, top: 130, width: 130, height: 16,
              background: accent, borderRadius: 8, transform: "rotate(45deg)",
            }}
          />
          <div
            style={{
              position: "absolute", left: 66, top: 168, width: 84, height: 16,
              background: accent, borderRadius: 8, transform: "rotate(-45deg)",
            }}
          />
        </div>
        {/* 印章落地的环形冲击纹 */}
        {[0, 1].map((i) => {
          const q = clamp01((p - 0.46 - i * 0.14) / 0.4);
          if (q <= 0 || q >= 1) return null;
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: 540 - 190 - q * 160, top: 700 - 190 - q * 160,
                width: 380 + q * 320, height: 380 + q * 320, borderRadius: "50%",
                border: `3px solid ${accent}`, opacity: 0.3 * (1 - q),
              }}
            />
          );
        })}
        {/* 底部致谢卡（骨架条） */}
        <div
          style={{
            position: "absolute", left: 540 - 220, top: 1150,
            opacity: easeOut(clamp01((p - 0.55) / 0.25)),
            transform: `translateY(${(1 - easeOut(clamp01((p - 0.55) / 0.25))) * 22}px)`,
          }}
        >
          <div
            style={{
              width: 440, height: 120, borderRadius: 22, background: PAPER,
              border: `3px solid ${INK}`, boxShadow: SHADOW, boxSizing: "border-box",
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 14,
            }}
          >
            <div style={{ width: 260, height: 14, borderRadius: 7, background: mixHex(INK, c1, 0.72) }} />
            <div style={{ width: 180, height: 10, borderRadius: 5, background: LINE }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene11;
