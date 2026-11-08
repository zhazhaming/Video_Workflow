// Scene06 · 自由宣言：大开关拨向 LOCAL，云连线断开褪灰，小屋发出自由信号环（甩镜入场）
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK, mixHex } from "../../dv/atmosphere";
import { INK, LINE, MUTED, PAPER, SHADOW, clamp01, easeBack, easeOut, exitFade } from "./ui";

const Scene06: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  // 0~0.42 云还连着；0.42~0.6 开关拨动 + 断线；之后自由信号环
  const toggleT = easeBack(clamp01((p - 0.42) / 0.18));
  const toLocal = clamp01((p - 0.42) / 0.14); // 0=CLOUD 1=LOCAL
  const cloudFade = clamp01((p - 0.46) / 0.16); // 云褪灰
  const snapT = clamp01((p - 0.44) / 0.1); // 连线断开进度

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {/* 灰云（断线后褪成虚线轮廓） */}
        <div
          style={{
            position: "absolute", left: 540 - 150, top: 350,
            opacity: 1 - cloudFade * 0.75, transform: `translateY(${cloudFade * -18}px)`,
          }}
        >
          {[
            { x: 0, y: 52, s: 96 },
            { x: 70, y: 20, s: 118 },
            { x: 168, y: 34, s: 100 },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                position: "absolute", left: c.x, top: c.y, width: c.s, height: c.s,
                borderRadius: "50%", background: mixHex(INK, c1, 0.3),
                border: cloudFade > 0.6 ? `2px dashed ${LINE}` : undefined, boxSizing: "border-box",
              }}
            />
          ))}
        </div>
        {/* 云→开关连线（中间断裂） */}
        <div
          style={{
            position: "absolute", left: 540 - 2, top: 560, width: 4, height: 210,
            backgroundImage: `linear-gradient(${mixHex(INK, c1, 0.55)} 46%, transparent 46%)`,
            backgroundSize: "4px 30px",
            opacity: 0.65,
            clipPath: `inset(0 0 ${snapT * 100}% 0)`,
          }}
        />
        <div
          style={{
            position: "absolute", left: 540 - 2, top: 770, width: 4, height: 80,
            backgroundImage: `linear-gradient(${mixHex(INK, c1, 0.55)} 46%, transparent 46%)`,
            backgroundSize: "4px 30px", opacity: 0.65 * (1 - snapT),
          }}
        />

        {/* 大开关面板 */}
        <div
          style={{
            position: "absolute", left: 540 - 260, top: 850, width: 520, height: 240,
            background: PAPER, border: `4px solid ${INK}`, borderRadius: 28,
            boxShadow: SHADOW, boxSizing: "border-box",
            transform: `rotate(${Math.sin(p * Math.PI * 2) * 0.6}deg)`,
          }}
        >
          {/* 两档标签 */}
          <div
            style={{
              position: "absolute", left: 36, top: 26, fontSize: 30, fontWeight: 800,
              fontFamily: MONO_STACK, color: toLocal > 0.5 ? MUTED : accent, letterSpacing: 2,
            }}
          >
            CLOUD
          </div>
          <div
            style={{
              position: "absolute", right: 36, top: 26, fontSize: 30, fontWeight: 800,
              fontFamily: MONO_STACK, color: toLocal > 0.5 ? accent : MUTED, letterSpacing: 2,
            }}
          >
            LOCAL
          </div>
          {/* 滑轨 */}
          <div
            style={{
              position: "absolute", left: 40, top: 88, width: 440, height: 110,
              borderRadius: 55, background: mixHex(INK, c1, 0.86), border: `3px solid ${INK}`,
              boxSizing: "border-box",
            }}
          />
          {/* 滑块 */}
          <div
            style={{
              position: "absolute", top: 96,
              left: 48 + toggleT * 356, width: 96, height: 96, borderRadius: "50%",
              background: toLocal > 0.5 ? accent : mixHex(INK, c1, 0.5),
              border: `4px solid ${INK}`, boxShadow: SHADOW, boxSizing: "border-box",
            }}
          />
        </div>

        {/* 自由信号环（开关拨到 LOCAL 后从面板发散） */}
        {[0, 1, 2].map((i) => {
          const q = clamp01((p - 0.6 - i * 0.12) / 0.5);
          if (q <= 0 || q >= 1) return null;
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: 540 - 140 - q * 260, top: 970 - q * 260,
                width: 280 + q * 520, height: 280 + q * 520, borderRadius: "50%",
                border: `3px solid ${accent}`, opacity: 0.32 * (1 - q),
              }}
            />
          );
        })}

        {/* 底部小屋安心亮灯 */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute", left: 340 + i * 110, top: 1290 + Math.sin(p * Math.PI * 2 * 1.4 + i) * 6,
              width: 56, height: 56, borderRadius: 12, background: PAPER,
              border: `3px solid ${INK}`, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 26, height: 26, borderRadius: "50%", background: accent,
                opacity: 0.5 + 0.5 * Math.abs(Math.sin(p * Math.PI * 2 * 1.2 + i * 1.4)),
              }}
            />
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default Scene06;
