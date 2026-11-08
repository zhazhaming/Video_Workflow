// Scene04 · 云电脑放权：云端下连显示器，审批卡 Allow/Deny 盖章脉冲（对应 s05 云电脑+点头放行）
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, rand, mixHex } from "../../dv/atmosphere";
import { easeOut, clamp01, exitFade, INK, LINE, PAPER, SHADOW, Bar } from "./ui";

const Scene04: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const drop = easeOut(clamp01(p / 0.15));
  const bob = Math.sin(p * Math.PI * 2) * 10;
  const stamp = clamp01((p - 0.52) / 0.22); // 审批盖章脉冲
  const stampRing = 0.6 + stamp * 1.1;
  const blink = Math.sin(p * Math.PI * 2 * 2.5) > -0.2 ? 1 : 0.25;
  const files = useMemo(
    () =>
      Array.from({ length: 6 }, (_, k) => ({
        x: 120 + rand(seed + k * 5 + 60) * 820,
        y: 380 + rand(seed + k * 5 + 61) * 1000,
        r: -18 + rand(seed + k * 5 + 62) * 36,
        s: 0.7 + rand(seed + k * 5 + 63) * 0.6,
      })),
    [seed],
  );

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {/* 漂浮文件方块 */}
        {files.map((f, k) => (
          <div
            key={k}
            style={{
              position: "absolute",
              left: f.x,
              top: f.y,
              width: 44,
              height: 52,
              borderRadius: 10,
              background: PAPER,
              border: `2px solid ${LINE}`,
              opacity: 0.5,
              transform: `rotate(${f.r + Math.sin(p * Math.PI * 2 + k) * 6}deg) scale(${f.s})`,
            }}
          />
        ))}

        {/* 云（三圆一板） */}
        <div style={{ position: "absolute", left: 540, top: 560 + bob * 0.4, opacity: drop, transform: `translateY(${(1 - drop) * -60}px)` }}>
          <div style={{ position: "absolute", left: -205, top: -46, width: 410, height: 120, borderRadius: 60, background: PAPER, border: `2px solid ${LINE}`, boxShadow: SHADOW }} />
          {[[-110, -60, 88], [0, -102, 122], [112, -56, 84]].map(([cx, cy, r], i) => (
            <div key={i} style={{ position: "absolute", left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: "50%", background: PAPER, border: `2px solid ${LINE}`, boxShadow: SHADOW }} />
          ))}
        </div>

        {/* 虚线数据流：云端 → 显示器 */}
        {Array.from({ length: 7 }, (_, i) => {
          const off = ((p * 3 + i * 0.35) % 1) * 200;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 537,
                top: 660 + off,
                width: 7,
                height: 20,
                borderRadius: 4,
                background: accent,
                opacity: 0.55 - i * 0.04,
              }}
            />
          );
        })}

        {/* 显示器 */}
        <div
          style={{
            position: "absolute",
            left: 320,
            top: 880,
            width: 440,
            height: 310,
            borderRadius: 22,
            background: PAPER,
            border: `2px solid ${LINE}`,
            boxShadow: SHADOW,
            overflow: "hidden",
            opacity: drop,
            transform: `translateY(${(1 - drop) * 40}px)`,
          }}
        >
          <div style={{ position: "absolute", left: 30, top: 34, width: 60, height: 14, borderRadius: 7, background: accent }} />
          <div style={{ position: "absolute", left: 30, top: 74, width: 300, height: 12, borderRadius: 6, background: mixHex(INK, c1, 0.68) }} />
          <div style={{ position: "absolute", left: 30, top: 106, width: 220, height: 12, borderRadius: 6, background: mixHex(INK, c1, 0.68) }} />
          <div style={{ position: "absolute", left: 30, top: 138, width: 150, height: 12, borderRadius: 6, background: mixHex(INK, c1, 0.68) }} />
          <div style={{ position: "absolute", left: 30, top: 190, width: 240, height: 44, borderRadius: 12, background: "rgba(20,17,15,0.06)", display: "flex", alignItems: "center", paddingLeft: 14 }}>
            <div style={{ width: 90, height: 12, borderRadius: 6, background: accent, opacity: blink }} />
            <div style={{ width: 4, height: 22, background: accent, marginLeft: 6, opacity: blink }} />
          </div>
        </div>
        {/* 显示器支架 */}
        <div style={{ position: "absolute", left: 540 - 8, top: 1190, width: 16, height: 44, background: mixHex(INK, c1, 0.6), borderRadius: 6, opacity: drop }} />
        <div style={{ position: "absolute", left: 540 - 90, top: 1232, width: 180, height: 16, borderRadius: 8, background: mixHex(INK, c1, 0.6), opacity: drop }} />

        {/* 审批卡：Allow / Deny */}
        <div
          style={{
            position: "absolute",
            left: 250,
            top: 1262,
            width: 580,
            height: 122,
            borderRadius: 20,
            background: PAPER,
            border: `2px solid ${LINE}`,
            boxShadow: SHADOW,
            display: "flex",
            alignItems: "center",
            padding: "0 26px",
            gap: 20,
            opacity: easeOut(clamp01((p - 0.2) / 0.18)),
            transform: `translateY(${(1 - easeOut(clamp01((p - 0.2) / 0.18))) * 30}px)`,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
            <Bar w={220} h={15} />
            <Bar w={140} h={10} />
          </div>
          <div style={{ position: "relative" }}>
            {stamp > 0 && stamp < 1 && (
              <div
                style={{
                  position: "absolute",
                  left: 28 - 56 * stampRing,
                  top: 28 - 56 * stampRing,
                  width: 112 * stampRing,
                  height: 112 * stampRing,
                  borderRadius: "50%",
                  border: `3px solid ${accent}`,
                  opacity: (1 - stamp) * 0.7,
                }}
              />
            )}
            {/* Allow：对勾（两根条组成） */}
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: accent, position: "relative" }}>
              <div style={{ position: "absolute", left: 14, top: 27, width: 12, height: 20, borderRadius: 6, background: "#FFF7EE", transform: "rotate(-45deg)" }} />
              <div style={{ position: "absolute", left: 24, top: 16, width: 12, height: 32, borderRadius: 6, background: "#FFF7EE", transform: "rotate(38deg)" }} />
            </div>
          </div>
          {/* Deny：叉 */}
          <div style={{ width: 56, height: 56, borderRadius: "50%", border: `3px solid ${LINE}`, position: "relative", opacity: 0.75 }}>
            <div style={{ position: "absolute", left: 12, top: 25, width: 30, height: 6, borderRadius: 3, background: mixHex(INK, c1, 0.55), transform: "rotate(45deg)" }} />
            <div style={{ position: "absolute", left: 12, top: 25, width: 30, height: 6, borderRadius: 3, background: mixHex(INK, c1, 0.55), transform: "rotate(-45deg)" }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene04;
