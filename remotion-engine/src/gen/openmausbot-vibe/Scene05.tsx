// Scene05 · 本质区别（高潮）：左侧管家单人卡 vs 右侧 3×3 员工团队网格，中央闪光环（对应 s08 反转爆点）
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, rand, mixHex } from "../../dv/atmosphere";
import { easeOut, clamp01, exitFade, INK, LINE, PAPER, SHADOW, Bar } from "./ui";

const Scene05: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const divider = easeOut(clamp01(p / 0.15));
  const leftPop = easeOut(clamp01(p / 0.14));
  const breathe = 1 + Math.sin(p * Math.PI * 2 * 1.2) * 0.02;
  const ring = clamp01((p - 0.3) / 0.5);

  const grid = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        act: rand(seed + i * 7 + 11) > 0.62,
        dly: 0.16 + i * 0.05,
      })),
    [seed],
  );
  const dots = useMemo(
    () =>
      Array.from({ length: 36 }, (_, k) => ({
        side: k % 2,
        ox: (rand(seed + k * 3) - 0.5) * 360,
        oy: (rand(seed + k * 3 + 1) - 0.5) * 620,
        r: 3 + rand(seed + k * 3 + 2) * 4,
        dly: rand(seed + k * 3 + 3),
      })),
    [seed],
  );
  const slate = mixHex(c2, INK, 0.42);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {/* 能量微粒（左右两簇） */}
        {dots.map((d, k) => {
          const show = clamp01((p - d.dly * 0.4) * 2.2);
          return (
            <span
              key={k}
              style={{
                position: "absolute",
                left: (d.side === 0 ? 330 : 800) + d.ox,
                top: 860 + d.oy + Math.sin(p * Math.PI * 3 + k) * 8,
                width: d.r * 2,
                height: d.r * 2,
                borderRadius: "50%",
                background: d.side === 0 ? accent : slate,
                opacity: 0.6 * show,
              }}
            />
          );
        })}

        {/* 中央分割线 */}
        <div
          style={{
            position: "absolute",
            left: 538,
            top: 480,
            width: 4,
            height: 920 * divider,
            borderRadius: 2,
            background: mixHex(INK, c1, 0.55),
          }}
        />

        {/* 闪光环（对齐 sfx impact 时刻） */}
        {ring > 0 && ring < 1 && (
          <div
            style={{
              position: "absolute",
              left: 540 - (80 + ring * 560),
              top: 880 - (80 + ring * 560),
              width: (80 + ring * 560) * 2,
              height: (80 + ring * 560) * 2,
              borderRadius: "50%",
              border: `6px solid ${accent}`,
              opacity: (1 - ring) * 0.55,
            }}
          />
        )}

        {/* 左：管家单人卡 */}
        <div
          style={{
            position: "absolute",
            left: 180,
            top: 810,
            width: 300,
            height: 300,
            borderRadius: 52,
            background: PAPER,
            border: `5px solid ${accent}`,
            boxShadow: SHADOW,
            opacity: leftPop,
            transform: `scale(${(0.8 + leftPop * 0.2) * breathe})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 130, height: 130, borderRadius: "50%", background: accent, opacity: 0.9 }} />
        </div>
        {/* 管家气泡 */}
        <div
          style={{
            position: "absolute",
            left: 220,
            top: 1156,
            width: 260,
            height: 88,
            borderRadius: 20,
            background: PAPER,
            border: `1px solid ${LINE}`,
            boxShadow: SHADOW,
            display: "flex",
            alignItems: "center",
            paddingLeft: 24,
            opacity: leftPop,
          }}
        >
          <Bar w={170} h={13} />
        </div>

        {/* 右：员工团队 3×3 */}
        {grid.map((g, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const inn = easeOut(clamp01((p - g.dly) / 0.16));
          const x = 578 + col * 150;
          const y = 690 + row * 150;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: 126,
                height: 126,
                borderRadius: 28,
                background: mixHex(c2, INK, 0.3 + (i % 3) * 0.06),
                boxShadow: SHADOW,
                opacity: inn,
                transform: `scale(${0.6 + inn * 0.4}) translateY(${Math.sin(p * Math.PI * 2 * 1.6 + i) * 4}px)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: g.act ? accent : "rgba(253,251,245,0.85)" }} />
            </div>
          );
        })}
        {/* 团队活跃条 */}
        {grid.map((g, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const inn = easeOut(clamp01((p - g.dly - 0.08) / 0.16));
          return (
            <div
              key={`b${i}`}
              style={{
                position: "absolute",
                left: 578 + col * 150 + 28,
                top: 690 + row * 150 + 136,
                width: 70,
                height: 10,
                borderRadius: 5,
                background: g.act ? accent : LINE,
                opacity: inn * (g.act ? 0.9 : 0.6),
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export default Scene05;
