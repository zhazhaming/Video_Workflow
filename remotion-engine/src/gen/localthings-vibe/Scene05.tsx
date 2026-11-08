// Scene05 · 本地直连：中枢在中央，八类家电环绕依次连线点亮，信号包沿线路滚动（斜推动感）
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, mixHex } from "../../dv/atmosphere";
import { INK, LINE, PAPER, SHADOW, clamp01, easeOut, exitFade } from "./ui";

const CX = 540;
const CY = 830;

const Scene05: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  // 家电贴纸：椭圆环绕（角度、图标绘制函数索引）
  const tiles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const ang = (-90 + i * 45) * (Math.PI / 180);
        return {
          i,
          x: CX + Math.cos(ang) * 350,
          y: CY + Math.sin(ang) * 470,
          kind: i, // 0 洗衣机 1 空调 2 冰箱 3 烤箱 4 微波炉 5 扫地机 6 热泵 7 音箱
        };
      }),
    [seed],
  );

  const hubIn = easeOut(clamp01(p / 0.13));

  const tileIcon = (kind: number, on: number, cLine: string, cAcc: string) => {
    const base: React.CSSProperties = { position: "absolute", background: cAcc, opacity: on };
    switch (kind) {
      case 0: // 洗衣机：方框 + 圆门
        return (
          <>
            <div style={{ position: "absolute", inset: 0, border: `3px solid ${cLine}`, borderRadius: 10 }} />
            <div style={{ ...base, left: 14, top: 16, width: 36, height: 36, borderRadius: "50%", border: `3px solid ${cLine}`, background: "transparent", opacity: Math.max(on, 0.4) }} />
          </>
        );
      case 1: // 空调：横条栅格
        return (
          <>
            <div style={{ position: "absolute", inset: 0, border: `3px solid ${cLine}`, borderRadius: 8 }} />
            <div style={{ ...base, left: 10, top: 18, width: 44, height: 5, borderRadius: 3 }} />
            <div style={{ ...base, left: 10, top: 30, width: 44, height: 5, borderRadius: 3 }} />
          </>
        );
      case 2: // 冰箱：上下双门
        return (
          <>
            <div style={{ position: "absolute", inset: 0, border: `3px solid ${cLine}`, borderRadius: 8 }} />
            <div style={{ ...base, left: 8, top: 8, width: 48, height: 2, background: cLine, opacity: 0.9 }} />
            <div style={{ ...base, left: 38, top: 22, width: 4, height: 14, borderRadius: 2 }} />
          </>
        );
      case 3: // 烤箱：方窗
        return (
          <>
            <div style={{ position: "absolute", inset: 0, border: `3px solid ${cLine}`, borderRadius: 8 }} />
            <div style={{ ...base, left: 12, top: 20, width: 40, height: 26, borderRadius: 5, border: `3px solid ${cLine}`, background: "transparent", opacity: Math.max(on, 0.4) }} />
          </>
        );
      case 4: // 微波炉：侧把手
        return (
          <>
            <div style={{ position: "absolute", inset: 0, border: `3px solid ${cLine}`, borderRadius: 8 }} />
            <div style={{ ...base, left: 12, top: 14, width: 30, height: 22, borderRadius: 3, border: `3px solid ${cLine}`, background: "transparent", opacity: Math.max(on, 0.4) }} />
            <div style={{ ...base, left: 48, top: 16, width: 4, height: 20, borderRadius: 2 }} />
          </>
        );
      case 5: // 扫地机：圆盘
        return <div style={{ ...base, left: 8, top: 8, width: 48, height: 48, borderRadius: "50%", border: `3px solid ${cLine}`, background: "transparent", opacity: Math.max(on, 0.4) }} />;
      case 6: // 热泵：波纹
        return (
          <>
            <div style={{ ...base, left: 8, top: 16, width: 48, height: 4, borderRadius: 2 }} />
            <div style={{ ...base, left: 8, top: 28, width: 48, height: 4, borderRadius: 2 }} />
            <div style={{ ...base, left: 8, top: 40, width: 48, height: 4, borderRadius: 2 }} />
          </>
        );
      default: // 音箱：点阵
        return (
          <>
            <div style={{ ...base, left: 14, top: 12, width: 36, height: 30, borderRadius: 6, border: `3px solid ${cLine}`, background: "transparent", opacity: Math.max(on, 0.4) }} />
            <div style={{ ...base, left: 26, top: 48, width: 12, height: 4, borderRadius: 2 }} />
          </>
        );
    }
  };

  return (
    <AbsoluteFill style={{ background: `linear-gradient(162deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {/* 中枢光晕 */}
        <div
          style={{
            position: "absolute", left: CX - 220, top: CY - 220, width: 440, height: 440,
            borderRadius: "50%", background: accent, opacity: 0.06 + 0.03 * Math.sin(p * Math.PI * 2),
          }}
        />
        {/* 连线（从中枢向外画出）+ 信号包 */}
        {tiles.map((t, i) => {
          const dx = t.x - CX;
          const dy = t.y - CY;
          const len = Math.hypot(dx, dy);
          const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
          const on = easeOut(clamp01((p - 0.16 - i * 0.055) / 0.3));
          const q = (p * 0.9 + i * 0.13) % 1;
          return (
            <React.Fragment key={i}>
              <div
                style={{
                  position: "absolute", left: CX, top: CY - 2, width: len * on, height: 4,
                  background: mixHex(accent, PAPER, 0.35), transformOrigin: "0 50%",
                  transform: `rotate(${ang}deg)`, borderRadius: 2, opacity: 0.85,
                }}
              />
              <div
                style={{
                  position: "absolute", left: CX + dx * q - 8, top: CY + dy * q - 8,
                  width: 16, height: 16, borderRadius: "50%", background: accent,
                  opacity: 0.9 * on * (1 - Math.abs(q - 0.5) * 0.4),
                }}
              />
            </React.Fragment>
          );
        })}
        {/* 中枢：HA 圆牌 */}
        <div
          style={{
            position: "absolute", left: CX - 92, top: CY - 92, width: 184, height: 184,
            borderRadius: "50%", background: PAPER, border: `4px solid ${INK}`,
            boxShadow: SHADOW, display: "flex", alignItems: "center", justifyContent: "center",
            opacity: hubIn, transform: `scale(${0.6 + hubIn * 0.4})`,
          }}
        >
          <div
            style={{
              width: 96, height: 78, background: accent,
              clipPath: "polygon(50% 0, 100% 40%, 100% 100%, 0 100%, 0 40%)",
            }}
          />
          <div
            style={{
              position: "absolute", bottom: 34, width: 34, height: 34, borderRadius: "50%",
              background: PAPER, border: `3px solid ${INK}`, boxSizing: "border-box",
            }}
          />
        </div>
        {/* 家电贴纸 */}
        {tiles.map((t, i) => {
          const on = easeOut(clamp01((p - 0.2 - i * 0.055) / 0.32));
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: t.x - 64, top: t.y - 64, width: 64, height: 64,
                background: on > 0.6 ? PAPER : mixHex(PAPER, c1, 0.4),
                border: `3px solid ${INK}`, borderRadius: 12, boxShadow: SHADOW,
                opacity: clamp01(on * 1.5), transform: `scale(${0.5 + on * 0.5})`,
              }}
            >
              {tileIcon(t.kind, on > 0.6 ? 0.85 : 0.3, INK, accent)}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export default Scene05;
