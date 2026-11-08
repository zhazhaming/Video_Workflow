// Scene02 · 龙虾与老鼠：红虾钳（爪痕）对灰鼠（圆耳）两卡对撞，中心电光脉冲（对应 s02 钩子）
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, mixHex } from "../../dv/atmosphere";
import { easeOut, clamp01, exitFade, INK, LINE, PAPER, SHADOW, Bar } from "./ui";

const Scene02: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const inL = easeOut(clamp01(p / 0.16));
  const bobL = Math.sin(p * Math.PI * 2 * 1.5) * 10;
  const bobR = Math.sin(p * Math.PI * 2 * 1.5 + 1.2) * 10;
  const boltPulse = 1 + Math.sin(p * Math.PI * 6) * 0.1;
  const burst = clamp01((p - 0.3) / 0.55);
  const slate = mixHex(c2, INK, 0.52);

  const sparks = useMemo(
    () =>
      Array.from({ length: 18 }, (_, k) => ({
        ang: (k / 18) * Math.PI * 2 + rand2(seed + k) * 0.5,
        r0: 60 + rand2(seed + k * 3 + 1) * 60,
        dly: rand2(seed + k * 3 + 2) * 0.12,
      })),
    [seed],
  );

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {/* 顶部小名牌 */}
        {[0, 1].map((s) => (
          <div
            key={s}
            style={{
              position: "absolute",
              left: s === 0 ? 190 : 640,
              top: 596,
              width: 230,
              height: 58,
              borderRadius: 29,
              background: PAPER,
              boxShadow: SHADOW,
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "0 22px",
              opacity: inL,
            }}
          >
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: s === 0 ? accent : slate }} />
            <Bar w={120} h={14} />
          </div>
        ))}

        {/* 左：龙虾（accent 卡 + 三道爪痕） */}
        <div
          style={{
            position: "absolute",
            left: 110,
            top: 700,
            width: 380,
            height: 380,
            borderRadius: 56,
            background: accent,
            boxShadow: SHADOW,
            opacity: inL,
            transform: `translateX(${(1 - inL) * -170}px) translateY(${bobL}px)`,
            overflow: "hidden",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 120 + i * 62,
                top: 86,
                width: 30,
                height: 210,
                borderRadius: 15,
                background: "rgba(255,251,244,0.92)",
                transform: "rotate(16deg)",
                opacity: 0.55 + i * 0.14,
              }}
            />
          ))}
          <div style={{ position: "absolute", left: 60, bottom: -70, width: 320, height: 150, borderRadius: "50%", background: "rgba(0,0,0,0.14)" }} />
        </div>

        {/* 右：老鼠（灰蓝卡 + 圆耳 + 头） */}
        <div
          style={{
            position: "absolute",
            left: 590,
            top: 700,
            width: 380,
            height: 380,
            borderRadius: 56,
            background: slate,
            boxShadow: SHADOW,
            opacity: inL,
            transform: `translateX(${(1 - inL) * 170}px) translateY(${bobR}px)`,
            overflow: "hidden",
          }}
        >
          {[0, 1].map((e) => (
            <div
              key={e}
              style={{
                position: "absolute",
                left: 86 + e * 122,
                top: 52,
                width: 108,
                height: 108,
                borderRadius: "50%",
                background: PAPER,
              }}
            />
          ))}
          <div style={{ position: "absolute", left: 92, top: 128, width: 196, height: 150, borderRadius: "80px 80px 90px 90px", background: "#EFE9DC" }} />
          <div style={{ position: "absolute", left: 130, top: 168, width: 18, height: 18, borderRadius: "50%", background: INK }} />
          <div style={{ position: "absolute", left: 232, top: 168, width: 18, height: 18, borderRadius: "50%", background: INK }} />
          <div style={{ position: "absolute", left: 158, top: 210, width: 64, height: 34, borderRadius: "0 0 40px 40px", border: `4px solid ${INK}`, borderTop: "none", opacity: 0.7 }} />
          <div style={{ position: "absolute", right: -60, bottom: 30, width: 190, height: 12, borderRadius: 8, background: "rgba(239,233,220,0.5)", transform: "rotate(-18deg)" }} />
        </div>

        {/* 中心电光 + 旋转辐射线 */}
        <div style={{ position: "absolute", left: 540, top: 890, opacity: inL }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: -3,
                top: -150,
                width: 6,
                height: 44,
                borderRadius: 3,
                background: LINE,
                transformOrigin: "50% 150px",
                transform: `rotate(${i * 45 + p * 60}deg)`,
              }}
            />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: 540 - 62 * boltPulse,
            top: 890 - 78 * boltPulse,
            width: 124 * boltPulse,
            height: 156 * boltPulse,
            background: accent,
            clipPath: "polygon(50% 0%, 100% 55%, 62% 55%, 78% 100%, 0% 46%, 40% 46%)",
            zIndex: 6,
            filter: "drop-shadow(0 10px 24px rgba(200,69,45,0.4))",
          }}
        />
        {/* 对撞火花 */}
        {sparks.map((s, k) => {
          const d = Math.max(0, Math.min(1, (p - 0.3 - s.dly) / 0.5));
          if (d <= 0) return null;
          const dist = s.r0 + d * 460;
          return (
            <span
              key={k}
              style={{
                position: "absolute",
                left: 540 + Math.cos(s.ang) * dist,
                top: 890 + Math.sin(s.ang) * dist,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: k % 2 ? accent : slate,
                opacity: (1 - d) * 0.85,
              }}
            />
          );
        })}
        {/* 地面投影 */}
        <div style={{ position: "absolute", left: 540 - 380, top: 1120, width: 760, height: 40, borderRadius: "50%", background: LINE, opacity: 0.55 }} />
      </div>
    </AbsoluteFill>
  );
};

// 局部确定性随机（rand 家族同式，避免与场景 seed 混排时的取值聚集）
const rand2 = (seed: number) => {
  const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

export default Scene02;
