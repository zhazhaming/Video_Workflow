// Scene03 · 公开方言：协议词像词典卡片依次翻开（OCF/CoAP/DTLS/RFC 条目）——场景即信息主体
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK, mixHex } from "../../dv/atmosphere";
import { INK, LINE, MUTED, PAPER, SHADOW, clamp01, easeOut, exitFade, makeDots } from "./ui";

const WORDS = ["OCF", "CoAP", "DTLS", "RFC 7252", "RFC 7641", "RFC 7959"];
const SUBS = ["开放互联标准", "轻量物联网协议", "加密传输层", "CoAP 本体", "观察推送", "分块传输"];

const Scene03: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const dots = useMemo(() => makeDots(seed, 16, { x0: 50, x1: 1030, y0: 260, y1: 1560 }), [seed]);
  const cards = useMemo(
    () => Array.from({ length: 6 }, (_, i) => ({ i, hi: i === 1 })),
    [],
  );

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {dots.map((d, k) => (
          <span
            key={k}
            style={{
              position: "absolute", left: d.x, top: d.y0 - ((p * d.v) % 1360),
              width: d.r * 2, height: d.r * 2, borderRadius: "50%",
              background: k % 3 === 0 ? accent : mixHex(INK, c1, 0.74),
              opacity: 0.22 + 0.22 * Math.sin(p * Math.PI * 2 + d.tw),
            }}
          />
        ))}
        {/* 词典卡 2 列 × 3 行，依次翻开（scaleX 0→1 模拟翻页） */}
        {cards.map(({ i, hi }) => {
          const delay = 0.06 + i * 0.09;
          const t = easeOut(clamp01((p - delay) / 0.34));
          const flip = t < 0.5 ? Math.max(t * 2, 0.04) : 1; // 翻页：先窄后全宽
          const col = i % 2;
          const row = Math.floor(i / 2);
          const x = col === 0 ? 540 - 360 : 540 + 40;
          const y = 480 + row * 250;
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: x, top: y, width: 320, height: 210,
                transform: `scaleX(${flip}) translateY(${(1 - t) * 26}px)`,
                opacity: clamp01(t * 1.6),
                background: hi ? accent : PAPER,
                border: `3px solid ${INK}`, borderRadius: 20, boxShadow: SHADOW,
                boxSizing: "border-box", padding: "22px 26px",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 20, fontFamily: MONO_STACK, color: hi ? PAPER : MUTED }}>
                  №{i + 1}
                </span>
                <div style={{ width: 44, height: 6, borderRadius: 3, background: hi ? "rgba(255,255,255,0.5)" : LINE }} />
              </div>
              <div
                style={{
                  fontSize: 46, fontWeight: 800, fontFamily: MONO_STACK,
                  color: hi ? PAPER : INK, letterSpacing: 1,
                }}
              >
                {WORDS[i]}
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, color: hi ? "rgba(255,255,255,0.85)" : MUTED }}>
                {SUBS[i]}
              </div>
            </div>
          );
        })}
        {/* 底部书脊线 */}
        <div
          style={{
            position: "absolute", left: 540 - 320, top: 1272, width: 640, height: 10,
            borderRadius: 5, background: mixHex(INK, c1, 0.78), opacity: 0.7,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default Scene03;
