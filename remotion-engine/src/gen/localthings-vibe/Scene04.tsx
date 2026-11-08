// Scene04 · 项目登场：GitHub 风格仓库卡片弹入 + 星星雨（数字交给 counter 浮层）——场景即信息主体
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK, mixHex, rand } from "../../dv/atmosphere";
import { INK, LINE, MUTED, PAPER, SHADOW, clamp01, easeBack, easeOut, exitFade } from "./ui";

const Scene04: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  // 星星雨：一次性预生成 34 颗（含五角星 clip-path 与圆点两种）
  const stars = useMemo(
    () =>
      Array.from({ length: 34 }, (_, k) => ({
        x: 60 + rand(seed + k * 5 + 10) * 960,
        y0: -80 - rand(seed + k * 5 + 11) * 500,
        v: 340 + rand(seed + k * 5 + 12) * 420,
        s: 12 + rand(seed + k * 5 + 13) * 20,
        star: rand(seed + k * 5 + 14) > 0.45,
        rot: rand(seed + k * 5 + 15) * 360,
      })),
    [seed],
  );
  const cardIn = easeBack(clamp01((p - 0.04) / 0.24));
  const badgeIn = easeOut(clamp01((p - 0.24) / 0.26));
  // 星数计数（0→1109），置于安全区，替代引擎浮层（浮层容器会越安全线）
  const starCount = Math.round(1109 * easeOut(clamp01((p - 0.18) / 0.5)));
  const numIn = easeOut(clamp01((p - 0.18) / 0.24));

  return (
    <AbsoluteFill style={{ background: `linear-gradient(158deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {/* 星星雨落向卡片 */}
        {stars.map((s, k) => {
          const y = s.y0 + p * s.v;
          return (
            <div
              key={k}
              style={{
                position: "absolute", left: s.x, top: y, width: s.s, height: s.s,
                background: k % 4 === 0 ? accent : mixHex(INK, c1, 0.62),
                opacity: 0.3 + 0.4 * rand(seed + k),
                transform: `rotate(${s.rot + p * 160}deg)`,
                clipPath: s.star
                  ? "polygon(50% 0, 63% 36%, 100% 38%, 71% 60%, 82% 100%, 50% 76%, 18% 100%, 29% 60%, 0 38%, 37% 36%)"
                  : undefined,
                borderRadius: s.star ? 0 : "50%",
              }}
            />
          );
        })}
        {/* GitHub 风格仓库卡 */}
        <div
          style={{
            position: "absolute", left: 540 - 330, top: 620 + (1 - cardIn) * 120,
            width: 660, transform: `scale(${0.7 + cardIn * 0.3})`,
            opacity: clamp01(cardIn * 1.4),
          }}
        >
          {/* 窗口三点 */}
          <div
            style={{
              position: "absolute", left: 0, top: -18, width: 660, height: 46,
              background: mixHex(INK, c1, 0.24), borderRadius: "18px 18px 0 0",
              display: "flex", alignItems: "center", paddingLeft: 20, gap: 10, boxSizing: "border-box",
            }}
          >
            {["#E06C5A", "#E8B84B", accent].map((cc, i) => (
              <span key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: cc }} />
            ))}
          </div>
          <div
            style={{
              position: "relative", width: 660, height: 400, background: PAPER,
              border: `4px solid ${INK}`, borderRadius: "0 0 24px 24px", boxShadow: SHADOW,
              boxSizing: "border-box", padding: "52px 40px 0",
            }}
          >
            {/* 仓库名 */}
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div
                style={{
                  width: 74, height: 74, borderRadius: "50%", border: `3px solid ${INK}`,
                  background: accent, display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {/* 迷你房子 icon */}
                <div
                  style={{
                    width: 30, height: 24, background: PAPER,
                    clipPath: "polygon(50% 0, 100% 42%, 100% 100%, 0 100%, 0 42%)",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 30, fontFamily: MONO_STACK, color: MUTED }}>mbillow /</span>
                <span style={{ fontSize: 52, fontWeight: 800, fontFamily: MONO_STACK, color: INK, marginTop: -10 }}>
                  localthings
                </span>
              </div>
            </div>
            {/* 简介骨架 + 徽章 */}
            <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ height: 14, width: 480, borderRadius: 7, background: LINE }} />
              <div style={{ height: 14, width: 360, borderRadius: 7, background: LINE }} />
            </div>
            <div style={{ marginTop: 30, display: "flex", gap: 16, opacity: badgeIn, transform: `translateY(${(1 - badgeIn) * 16}px)` }}>
              {[
                { t: "MIT", c: accent, tc: PAPER },
                { t: "HACS", c: INK, tc: PAPER },
                { t: "Home Assistant", c: PAPER, tc: INK },
              ].map((b, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 22px", borderRadius: 999, border: `3px solid ${INK}`,
                    background: b.c, color: b.tc, fontWeight: 800, fontSize: 24,
                    fontFamily: MONO_STACK, boxSizing: "border-box",
                  }}
                >
                  {b.t}
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 4 }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#E8B84B", border: `3px solid ${INK}`, boxSizing: "border-box" }} />
                <span style={{ fontSize: 24, fontFamily: MONO_STACK, color: MUTED }}>Python</span>
              </div>
            </div>
          </div>
        </div>
        {/* 星数计数（场景即信息主体，数字落在安全区内） */}
        <div
          style={{
            position: "absolute", left: 540 - 280, top: 1090, width: 560,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 20,
            opacity: numIn, transform: `translateY(${(1 - numIn) * 26}px)`,
          }}
        >
          <div
            style={{
              width: 64, height: 64, background: accent,
              clipPath: "polygon(50% 0, 63% 36%, 100% 38%, 71% 60%, 82% 100%, 50% 76%, 18% 100%, 29% 60%, 0 38%, 37% 36%)",
              transform: `rotate(${p * 40}deg)`,
            }}
          />
          <span
            style={{
              fontSize: 112, fontWeight: 900, fontFamily: MONO_STACK, color: INK,
              letterSpacing: 2, fontVariantNumeric: "tabular-nums",
            }}
          >
            {starCount}
          </span>
          <span style={{ fontSize: 34, fontWeight: 700, fontFamily: MONO_STACK, color: MUTED, marginBottom: 10 }}>
            stars
          </span>
        </div>
        {/* 卡片星标角标（小星 + 呼吸） */}
        <div
          style={{
            position: "absolute", left: 540 + 250, top: 560,
            transform: `rotate(${Math.sin(p * Math.PI * 2) * 10}deg)`,
            opacity: cardIn,
          }}
        >
          <div
            style={{
              width: 86, height: 86, background: accent,
              clipPath: "polygon(50% 0, 63% 36%, 100% 38%, 71% 60%, 82% 100%, 50% 76%, 18% 100%, 29% 60%, 0 38%, 37% 36%)",
              filter: "drop-shadow(0 10px 20px rgba(20,17,15,0.25))",
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene04;
