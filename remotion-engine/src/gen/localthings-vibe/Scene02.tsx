// Scene02 · 云端拷问：小屋在底部、灰云在顶部，指令脉冲沿虚线反复绕行云端（dolly 蓄力）
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, mixHex } from "../../dv/atmosphere";
import { INK, LINE, PAPER, SHADOW, clamp01, easeOut, exitFade, makeDots } from "./ui";

const Scene02: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const dots = useMemo(() => makeDots(seed, 18, { x0: 60, x1: 1020, y0: 240, y1: 1560 }), [seed]);
  // 三个脉冲沿路径循环（y: 屋顶→云底），相位错开
  const pulses = [0, 0.34, 0.67].map((ph) => ((p * 0.55 + ph) % 1));
  const cloudJit = Math.sin(p * Math.PI * 2 * 6) * (2 + p * 5); // 越到镜尾云越烦躁
  const houseIn = easeOut(clamp01(p / 0.14));

  return (
    <AbsoluteFill style={{ background: `linear-gradient(165deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {/* 环境微粒（下沉感） */}
        {dots.map((d, k) => (
          <span
            key={k}
            style={{
              position: "absolute", left: d.x, top: 240 + ((d.y0 - 240 + p * d.v * 0.5) % 1320),
              width: d.r * 2, height: d.r * 2, borderRadius: "50%",
              background: mixHex(INK, c1, 0.72), opacity: 0.22,
            }}
          />
        ))}

        {/* 灰云（顶部，越到后面越抖） */}
        <div
          style={{
            position: "absolute", left: 540 - 190 + cloudJit, top: 330 - 100,
            opacity: 0.96, transform: `translateY(${Math.sin(p * Math.PI * 2 * 3) * 5}px)`,
          }}
        >
          <div style={{ position: "relative", width: 380, height: 190 }}>
            {[
              { x: 0, y: 78, s: 120 },
              { x: 88, y: 30, s: 150 },
              { x: 216, y: 44, s: 130 },
              { x: 268, y: 92, s: 100 },
            ].map((c, i) => (
              <div
                key={i}
                style={{
                  position: "absolute", left: c.x, top: c.y, width: c.s, height: c.s,
                  borderRadius: "50%", background: mixHex(INK, c1, 0.18),
                  boxShadow: SHADOW, opacity: 0.92,
                }}
              />
            ))}
            {/* 云内的 ？：拷问感 */}
            <div
              style={{
                position: "absolute", left: 0, right: 0, top: 44, textAlign: "center",
                fontSize: 96, fontWeight: 800, color: PAPER,
                textShadow: "0 4px 14px rgba(20,17,15,0.25)",
              }}
            >
              ?
            </div>
          </div>
        </div>

        {/* 虚线路径（屋→云） */}
        <div
          style={{
            position: "absolute", left: 540 - 2, top: 480, width: 4, height: 520,
            backgroundImage: `linear-gradient(${mixHex(INK, c1, 0.5)} 46%, transparent 46%)`,
            backgroundSize: "4px 34px", opacity: 0.6,
          }}
        />
        {/* 上行指令脉冲 */}
        {pulses.map((q, i) => (
          <div
            key={i}
            style={{
              position: "absolute", left: 540 - 13, top: 480 + (1 - q) * 520 - 13,
              width: 26, height: 26, borderRadius: "50%",
              background: i === 0 ? accent : mixHex(accent, PAPER, 0.4),
              opacity: 0.35 + 0.65 * Math.sin(q * Math.PI),
              boxShadow: `0 0 0 ${8 * (1 - q)}px ${mixHex(accent, PAPER, 0.75)}`,
            }}
          />
        ))}

        {/* 底部小屋（等待感） */}
        <div style={{ position: "absolute", left: 540 - 190, top: 1000 + (1 - houseIn) * 80, opacity: houseIn }}>
          <div
            style={{
              position: "absolute", left: 0, top: 0, width: 380, height: 120,
              background: PAPER, border: `4px solid ${INK}`, clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
              borderRadius: 14, boxShadow: SHADOW, boxSizing: "border-box",
            }}
          />
          <div
            style={{
              position: "absolute", left: 30, top: 120, width: 320, height: 240,
              background: PAPER, border: `4px solid ${INK}`, borderRadius: "0 0 20px 20px",
              boxShadow: SHADOW, boxSizing: "border-box",
            }}
          />
          {/* 窗灯：明暗不定（不确定感） */}
          {[0, 1].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute", left: 78 + i * 166, top: 176, width: 76, height: 88,
                borderRadius: 12, background: accent,
                opacity: 0.25 + 0.5 * Math.abs(Math.sin(p * Math.PI * 2 * 1.7 + i * 2)),
                border: `3px solid ${INK}`, boxSizing: "border-box",
              }}
            />
          ))}
        </div>
        {/* 疑问涟漪（屋顶泛开的细环） */}
        {[0, 1, 2].map((i) => {
          const q = (p * 0.8 + i / 3) % 1;
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: 540 - 60 - q * 150, top: 970 - q * 190,
                width: 120 + q * 300, height: 60 + q * 150, borderRadius: "50%",
                border: `2px solid ${accent}`, opacity: 0.3 * (1 - q),
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export default Scene02;
