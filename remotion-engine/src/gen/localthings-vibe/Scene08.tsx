// Scene08 · 三步上手：顶部进度条 + 三张步骤卡弹簧切入、逐张盖对勾、完成时集体弹跳撒星屑
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK, mixHex, rand } from "../../dv/atmosphere";
import { INK, LINE, MUTED, PAPER, SHADOW, clamp01, easeBack, easeOut, exitFade } from "./ui";

const Scene08: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const step = (i: number) => easeBack(clamp01((p - 0.05 - i * 0.15) / 0.3));
  const check = (i: number) => clamp01((p - 0.32 - i * 0.15) / 0.16);
  const labels = ["HACS", "IP", "AUTO"];
  const subs = ["商店安装", "填个地址", "自动认型号"];
  const allDone = clamp01((p - 0.78) / 0.12); // 集体弹跳
  const progress = clamp01((p - 0.1) / 0.72);
  const stars = Array.from({ length: 14 }, (_, k) => ({
    x: 140 + rand(seed + k * 5 + 20) * 800,
    y0: 340 + rand(seed + k * 5 + 21) * 300,
    v: 200 + rand(seed + k * 5 + 22) * 160,
    s: 10 + rand(seed + k * 5 + 23) * 12,
    rot: rand(seed + k * 5 + 24) * 360,
  }));

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {/* 顶部进度条（三步完成度） */}
        <div
          style={{
            position: "absolute", left: 540 - 240, top: 330, width: 480, height: 16,
            borderRadius: 8, background: mixHex(INK, c1, 0.86), border: `3px solid ${INK}`,
            boxSizing: "border-box", overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`, height: "100%", background: accent,
              borderRadius: 6, transition: "none",
            }}
          />
        </div>
        {/* 进度三点 */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute", left: 540 - 40 + i * 40, top: 372,
              width: 20, height: 20, borderRadius: "50%",
              background: step(i) >= 1 ? accent : mixHex(INK, c1, 0.8),
              border: `3px solid ${INK}`, boxSizing: "border-box",
              transform: `scale(${1 + (check(i) > 0 && check(i) < 1 ? 0.35 * Math.sin(check(i) * Math.PI) : 0)})`,
            }}
          />
        ))}
        {/* 完成撒星屑 */}
        {allDone > 0 &&
          stars.map((s, k) => (
            <div
              key={k}
              style={{
                position: "absolute", left: s.x, top: s.y0 + allDone * s.v,
                width: s.s, height: s.s, background: k % 3 === 0 ? accent : mixHex(accent, PAPER, 0.4),
                clipPath: "polygon(50% 0, 63% 36%, 100% 38%, 71% 60%, 82% 100%, 50% 76%, 18% 100%, 29% 60%, 0 38%, 37% 36%)",
                opacity: 0.85 * (1 - allDone), transform: `rotate(${s.rot + allDone * 140}deg)`,
              }}
            />
          ))}
        {[0, 1, 2].map((i) => {
          const s = step(i);
          const fromRight = 1 - s;
          const bounce = allDone > 0 ? Math.sin(allDone * Math.PI) * (1 + i * 0.1) : 0;
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: 540 - 330, top: 450 + i * 265 + bounce * -14,
                width: 660, height: 220, transform: `translateX(${fromRight * 430}px) rotate(${fromRight * 2.4}deg)`,
                opacity: clamp01(s * 1.5),
              }}
            >
              <div
                style={{
                  position: "absolute", inset: 0, background: PAPER,
                  border: `4px solid ${INK}`, borderRadius: 26, boxShadow: SHADOW,
                  boxSizing: "border-box", display: "flex", alignItems: "center",
                  padding: "0 36px", gap: 30,
                }}
              >
                <div
                  style={{
                    width: 96, height: 96, borderRadius: "50%", background: accent,
                    border: `4px solid ${INK}`, boxSizing: "border-box", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 44, fontWeight: 900, color: PAPER, fontFamily: MONO_STACK }}>
                    {i + 1}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                  <span style={{ fontSize: 52, fontWeight: 900, fontFamily: MONO_STACK, color: INK }}>
                    {labels[i]}
                  </span>
                  <div style={{ height: 12, width: 320, borderRadius: 6, background: LINE }} />
                  <span style={{ fontSize: 26, fontWeight: 600, color: MUTED }}>{subs[i]}</span>
                </div>
                <div style={{ width: 70, height: 70, position: "relative", flexShrink: 0 }}>
                  {i === 0 && (
                    <>
                      <div style={{ position: "absolute", left: 18, top: 4, width: 34, height: 44, background: accent, clipPath: "polygon(50% 0,100% 62%,50% 50%,0 62%)" }} />
                      <div style={{ position: "absolute", left: 28, top: 52, width: 14, height: 14, borderRadius: 3, background: accent }} />
                    </>
                  )}
                  {i === 1 && (
                    <>
                      <div style={{ position: "absolute", inset: 8, borderRadius: "50%", border: `5px solid ${INK}`, boxSizing: "border-box" }} />
                      <div style={{ position: "absolute", left: 30, top: 30, width: 10, height: 10, borderRadius: "50%", background: accent }} />
                    </>
                  )}
                  {i === 2 && (
                    <>
                      <div style={{ position: "absolute", left: 4, top: 4, width: 46, height: 46, borderRadius: "50%", border: `6px solid ${INK}`, boxSizing: "border-box" }} />
                      <div style={{ position: "absolute", left: 46, top: 48, width: 20, height: 8, background: INK, borderRadius: 4, transform: "rotate(45deg)" }} />
                    </>
                  )}
                </div>
                <div
                  style={{
                    position: "absolute", right: -18, top: -18, width: 84, height: 84,
                    borderRadius: "50%", background: accent, border: `4px solid ${PAPER}`,
                    boxShadow: SHADOW, boxSizing: "border-box",
                    opacity: check(i), transform: `scale(${0.4 + easeBack(check(i)) * 0.6}) rotate(-8deg)`,
                  }}
                >
                  <div style={{ position: "absolute", left: 20, top: 30, width: 44, height: 8, background: PAPER, borderRadius: 4, transform: "rotate(45deg)" }} />
                  <div style={{ position: "absolute", left: 12, top: 42, width: 26, height: 8, background: PAPER, borderRadius: 4, transform: "rotate(-45deg)" }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export default Scene08;
