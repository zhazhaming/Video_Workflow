// Scene01 · 开场问候：小屋灯牌呼吸亮起 + 窗灯依次点亮 + 上升微粒 + 名牌卡（对应 s01 开场问好/报题）
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, mixHex } from "../../dv/atmosphere";
import { Bar, INK, LINE, PAPER, SHADOW, clamp01, easeOut, exitFade, makeDots } from "./ui";

const Scene01: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const dots = useMemo(() => makeDots(seed, 24, { x0: 40, x1: 1040, y0: 300, y1: 1560 }), [seed]);
  const inn = easeOut(clamp01(p / 0.15)); // 主入场：前 15% 完成
  const spring = 1 + Math.sin(Math.min(1, p / 0.15) * Math.PI) * 0.04; // 入场微弹
  const halo = 1 + Math.sin(p * Math.PI * 2) * 0.035;
  const doorOpen = easeOut(clamp01((p - 0.3) / 0.22)); // 门开漏光（中段巧思）
  // 四扇窗灯按序点亮，再随呼吸微微起伏
  const winOn = (i: number) => {
    const t = clamp01((p - 0.1 - i * 0.07) / 0.16);
    return 0.25 + 0.75 * easeOut(t) * (0.82 + 0.18 * Math.sin(p * Math.PI * 2 * 1.3 + i));
  };

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {/* 视差网格（缓移） */}
        <div
          style={{
            position: "absolute", inset: -60, opacity: 0.3,
            backgroundImage: `linear-gradient(${LINE} 1px, transparent 1px), linear-gradient(90deg, ${LINE} 1px, transparent 1px)`,
            backgroundSize: "100px 100px",
            transform: `translateY(${p * -16}px)`,
          }}
        />
        {/* 呼吸光晕 + 旋转虚线轨道 */}
        <div
          style={{
            position: "absolute", left: 540 - 340 * halo, top: 700 - 340 * halo,
            width: 680 * halo, height: 680 * halo, borderRadius: "50%",
            background: accent, opacity: 0.08,
          }}
        />
        <div
          style={{
            position: "absolute", left: 540 - 410, top: 700 - 410, width: 820, height: 820,
            borderRadius: "50%", border: `2px dashed ${LINE}`, transform: `rotate(${p * 30}deg)`,
          }}
        />
        {/* 上升微粒 */}
        {dots.map((d, k) => (
          <span
            key={k}
            style={{
              position: "absolute", left: d.x, top: d.y0 - ((p * d.v) % 1400),
              width: d.r * 2, height: d.r * 2, borderRadius: "50%",
              background: k % 3 === 0 ? accent : mixHex(INK, c1, 0.7),
              opacity: 0.3 + 0.28 * Math.sin(p * Math.PI * 2 + d.tw),
            }}
          />
        ))}
        {/* 小屋灯牌：屋顶窗灯 x2 + 房身窗灯 x2 */}
        <div
          style={{
            position: "absolute", left: 540 - 240, top: 430 + (1 - inn) * 60,
            opacity: inn, transform: `translateY(${Math.sin(p * Math.PI * 2 * 1.1) * 7}px) scale(${spring})`,
          }}
        >
          {/* 屋顶 */}
          <div
            style={{
              position: "absolute", left: 0, top: 0, width: 480, height: 150,
              background: PAPER, border: `4px solid ${INK}`,
              clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
              borderRadius: 18, boxShadow: SHADOW, boxSizing: "border-box",
            }}
          />
          {/* 房身 */}
          <div
            style={{
              position: "absolute", left: 40, top: 150, width: 400, height: 300,
              background: PAPER, border: `4px solid ${INK}`, borderRadius: "0 0 22px 22px",
              boxShadow: SHADOW, boxSizing: "border-box",
            }}
          />
          {/* 窗灯 */}
          {[
            { x: 96, y: 34, w: 62, h: 62, r: 10 },
            { x: 322, y: 34, w: 62, h: 62, r: 10 },
            { x: 96, y: 210, w: 78, h: 92, r: 12 },
            { x: 306, y: 210, w: 78, h: 92, r: 12 },
          ].map((w, i) => (
            <div
              key={i}
              style={{
                position: "absolute", left: w.x, top: w.y + 150 * (i > 1 ? 1 : 0),
                width: w.w, height: w.h, borderRadius: w.r,
                background: accent, opacity: winOn(i), boxSizing: "border-box",
                border: `3px solid ${INK}`,
              }}
            />
          ))}
          {/* 门 + 门开漏光 */}
          <div
            style={{
              position: "absolute", left: 216, top: 344, width: 64, height: 106,
              borderRadius: "12px 12px 0 0", border: `3px solid ${INK}`, boxSizing: "border-box",
              background: mixHex(accent, INK, 0.25), overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute", inset: 0, background: "#FFE9A8",
                opacity: doorOpen * 0.9, transformOrigin: "left center",
                transform: `scaleX(${1 - doorOpen * 0.55})`,
                filter: `blur(${2 + doorOpen * 4}px)`,
              }}
            />
          </div>
        </div>
        {/* 名牌卡（骨架条，避免与字幕抢字） */}
        {[
          { y: 960, w: 380, x: 540 - 190 },
          { y: 1012, w: 250, x: 540 - 125 },
        ].map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute", left: b.x, top: b.y, opacity: easeOut(clamp01((p - 0.16 - i * 0.09) / 0.3)),
              transform: `translateY(${(1 - easeOut(clamp01((p - 0.16 - i * 0.09) / 0.3))) * 24}px)`,
            }}
          >
            <div
              style={{
                width: 380, height: 44 + i * 8, borderRadius: 16, background: PAPER,
                boxShadow: SHADOW, display: "flex", alignItems: "center",
                justifyContent: "center", gap: 14, padding: "0 30px",
              }}
            >
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: i === 0 ? accent : LINE }} />
              <Bar w={b.w - 130} h={i === 0 ? 16 : 12} c={i === 0 ? mixHex(INK, c1, 0.75) : LINE} />
            </div>
          </div>
        ))}
        {/* 地面投影 */}
        <div
          style={{
            position: "absolute", left: 540 - 260, top: 920, width: 520, height: 34,
            borderRadius: "50%", background: LINE, opacity: 0.55,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default Scene01;
