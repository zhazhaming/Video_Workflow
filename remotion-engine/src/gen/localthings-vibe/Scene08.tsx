// Scene08 · 三步上手：三张步骤卡依次切入，逐张盖上绿色对勾（HACS 安装 / 填 IP / 自动识别）——场景即信息主体
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK, mixHex } from "../../dv/atmosphere";
import { INK, LINE, MUTED, PAPER, SHADOW, clamp01, easeOut, exitFade } from "./ui";

const Scene08: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const step = (i: number) => easeOut(clamp01((p - 0.06 - i * 0.16) / 0.3));
  const check = (i: number) => clamp01((p - 0.34 - i * 0.16) / 0.16);
  const labels = ["HACS", "IP", "AUTO"];
  const subs = ["商店安装", "填个地址", "自动认型号"];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {[0, 1, 2].map((i) => {
          const s = step(i);
          const fromRight = 1 - s;
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: 540 - 330, top: 430 + i * 280,
                width: 660, height: 230, transform: `translateX(${fromRight * 420}px)`,
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
                {/* 序号圆牌 */}
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
                {/* 标签 + 副题 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                  <span style={{ fontSize: 52, fontWeight: 900, fontFamily: MONO_STACK, color: INK }}>
                    {labels[i]}
                  </span>
                  <div style={{ height: 12, width: 320, borderRadius: 6, background: LINE }} />
                  <span style={{ fontSize: 26, fontWeight: 600, color: MUTED }}>{subs[i]}</span>
                </div>
                {/* 图标 */}
                <div style={{ width: 70, height: 70, position: "relative", flexShrink: 0 }}>
                  {i === 0 && (
                    <div
                      style={{
                        position: "absolute", left: 18, top: 4, width: 34, height: 44,
                        background: accent, clipPath: "polygon(50% 0,100% 62%,50% 50%,0 62%)",
                      }}
                    />
                  )}
                  {i === 0 && <div style={{ position: "absolute", left: 28, top: 52, width: 14, height: 14, borderRadius: 3, background: accent }} />}
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
                {/* 对勾印章 */}
                <div
                  style={{
                    position: "absolute", right: -18, top: -18, width: 84, height: 84,
                    borderRadius: "50%", background: accent, border: `4px solid ${PAPER}`,
                    boxShadow: SHADOW, boxSizing: "border-box",
                    opacity: check(i), transform: `scale(${0.4 + check(i) * 0.6}) rotate(-8deg)`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute", left: 20, top: 30, width: 44, height: 8,
                      background: PAPER, borderRadius: 4, transform: "rotate(45deg)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute", left: 12, top: 42, width: 26, height: 8,
                      background: PAPER, borderRadius: 4, transform: "rotate(-45deg)",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
        {/* 顶部进度点 */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute", left: 540 - 60 + i * 50, top: 330,
              width: 22, height: 22, borderRadius: "50%",
              background: step(i) >= 1 ? accent : mixHex(INK, c1, 0.8),
              border: `3px solid ${INK}`, boxSizing: "border-box",
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default Scene08;
