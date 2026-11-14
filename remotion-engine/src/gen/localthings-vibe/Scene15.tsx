// Scene15 · 痛点演出：指令泡泡从手机沿弧线飞厂商机房、盖章后再飞回家电执行（双程路径+循环）
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, mixHex, rand } from "../../dv/atmosphere";
import { INK, LINE, MUTED, PAPER, SHADOW, clamp01, easeOut, exitFade } from "./ui";

// 二次贝塞尔
const bez = (a: number, c: number, b: number, t: number) =>
  (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;

const Scene15: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const dots = useMemo(
    () =>
      Array.from({ length: 18 }, (_, k) => ({
        x: 60 + rand(seed + k * 3 + 40) * 960,
        y0: 260 + rand(seed + k * 3 + 41) * 1300,
        r: 2.5 + rand(seed + k * 3 + 42) * 4,
        v: 30 + rand(seed + k * 3 + 43) * 60,
        tw: rand(seed + k * 3 + 44) * Math.PI * 2,
      })),
    [seed],
  );
  // 手机发出（0~0.42）→ 机房盖章（0.42~0.55）→ 回程执行（0.55~1）
  const legA = clamp01(p / 0.42);
  const stamp = clamp01((p - 0.42) / 0.13);
  const legB = clamp01((p - 0.55) / 0.45);
  // 两颗循环泡泡（去程相位差半圈）
  const loopA = (p * 1.15) % 1;
  const inA = easeOut(clamp01(p / 0.12));

  // 去程：手机(250,1370) → 机房(540,560)，控制点(210,760)
  const ax = bez(250, 210, 540, legA);
  const ay = bez(1370, 760, 560, legA);
  // 回程：机房(540,560) → 家电(790,1290)，控制点(880,780)
  const bx = bez(540, 880, 790, legB);
  const by = bez(560, 780, 1290, legB);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {/* 视差网格（缓移） */}
        <div
          style={{
            position: "absolute", inset: -60, opacity: 0.4,
            backgroundImage: `linear-gradient(${LINE} 1px, transparent 1px), linear-gradient(90deg, ${LINE} 1px, transparent 1px)`,
            backgroundSize: "96px 96px",
            transform: `translate(${Math.sin(p * Math.PI) * 10}px, ${p * -14}px)`,
          }}
        />
        {dots.map((d, k) => (
          <span
            key={k}
            style={{
              position: "absolute", left: d.x, top: d.y0 - ((p * d.v) % 1300),
              width: d.r * 2, height: d.r * 2, borderRadius: "50%",
              background: k % 3 === 0 ? accent : mixHex(INK, c1, 0.72),
              opacity: 0.2 + 0.24 * Math.sin(p * Math.PI * 2 + d.tw),
            }}
          />
        ))}

        {/* 厂商机房（顶部） */}
        <div style={{ position: "absolute", left: 540 - 130, top: 300, opacity: inA, transform: `translateY(${(1 - inA) * -30}px)` }}>
          <div
            style={{
              position: "relative", width: 260, height: 220, background: PAPER,
              border: `4px solid ${INK}`, borderRadius: 18, boxShadow: SHADOW, boxSizing: "border-box",
              padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10,
            }}
          >
            {/* 天线 */}
            <div style={{ position: "absolute", left: 118, top: -34, width: 6, height: 34, background: INK, borderRadius: 3 }} />
            {[0, 1, 2].map((i) => {
              const q = clamp01((p * 1.6 + i * 0.25) % 1);
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute", left: 121 - 16 - q * 26, top: -40 - q * 30,
                    width: 32 + q * 52, height: 16 + q * 26, borderRadius: "50%",
                    border: `2.5px solid ${accent}`, opacity: 0.5 * (1 - q),
                  }}
                />
              );
            })}
            {/* 机房窗户 */}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ display: "flex", gap: 10 }}>
                {[0, 1].map((j) => (
                  <div
                    key={j}
                    style={{
                      flex: 1, height: 30, borderRadius: 6,
                      background: (i + j) % 3 === 0 ? accent : mixHex(INK, c1, 0.82),
                      opacity: (i + j) % 3 === 0 ? 0.75 : 0.9,
                    }}
                  />
                ))}
              </div>
            ))}
            <div style={{ textAlign: "center", fontSize: 24, fontWeight: 700, color: MUTED, marginTop: 2 }}>厂商机房</div>
          </div>
        </div>

        {/* 手机（左下） */}
        <div style={{ position: "absolute", left: 170, top: 1250, opacity: inA, transform: `translateY(${(1 - inA) * 40}px) rotate(-4deg)` }}>
          <div
            style={{
              width: 150, height: 260, borderRadius: 28, background: PAPER,
              border: `4px solid ${INK}`, boxShadow: SHADOW, boxSizing: "border-box", padding: "18px 12px",
              display: "flex", flexDirection: "column", gap: 10,
            }}
          >
            <div style={{ height: 46, borderRadius: 10, background: accent, opacity: 0.85 + 0.15 * Math.sin(p * Math.PI * 4) }} />
            <div style={{ height: 30, borderRadius: 8, background: mixHex(INK, c1, 0.86) }} />
            <div style={{ height: 30, borderRadius: 8, background: mixHex(INK, c1, 0.86), width: "70%" }} />
          </div>
        </div>
        {/* 家电（右下洗衣机） */}
        <div style={{ position: "absolute", left: 720, top: 1230, opacity: inA, transform: `rotate(3deg)` }}>
          <div
            style={{
              width: 170, height: 200, borderRadius: 22, background: PAPER,
              border: `4px solid ${INK}`, boxShadow: SHADOW, boxSizing: "border-box",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 104, height: 104, borderRadius: "50%", border: `5px solid ${INK}`,
                display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: 64, height: 64, borderRadius: "50%", background: accent,
                  opacity: 0.3 + 0.7 * clamp01((legB - 0.7) / 0.3),
                  transform: `rotate(${legB * 360}deg)`,
                  clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
                }}
              />
            </div>
          </div>
        </div>

        {/* 去程指令泡泡（首颗：完整叙事） */}
        {p < 0.6 && (
          <div
            style={{
              position: "absolute", left: ax - 26, top: ay - 26, width: 52, height: 52,
              borderRadius: "50%", background: accent, boxShadow: SHADOW,
              opacity: 0.95 - stamp * 0.9,
              transform: `scale(${1 - stamp * 0.5})`,
            }}
          />
        )}
        {/* 机房盖章（收到） */}
        <div
          style={{
            position: "absolute", left: 540 + 90, top: 470,
            opacity: stamp, transform: `scale(${0.5 + stamp * 0.5}) rotate(${stamp * -8}deg)`,
          }}
        >
          <div style={{ width: 74, height: 74, borderRadius: "50%", background: mixHex(INK, c1, 0.2), border: `4px solid ${INK}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 30, height: 12, background: PAPER, borderRadius: 6, transform: "rotate(45deg) translateX(4px)" }} />
            <div style={{ width: 20, height: 12, background: PAPER, borderRadius: 6, transform: "rotate(-45deg) translateX(-2px)", marginLeft: -14 }} />
          </div>
        </div>
        {/* 回程执行泡泡 */}
        {legB > 0 && legB < 1 && (
          <div
            style={{
              position: "absolute", left: bx - 20, top: by - 20, width: 40, height: 40,
              borderRadius: "50%", background: mixHex(accent, PAPER, 0.25),
              boxShadow: `0 0 0 ${8 * (1 - legB)}px ${mixHex(accent, PAPER, 0.7)}`,
            }}
          />
        )}
        {/* 循环小泡泡（去程空中补给） */}
        {loopA < 0.42 && p > 0.5 && (
          <div
            style={{
              position: "absolute",
              left: bez(250, 210, 540, loopA / 0.42) - 14,
              top: bez(1370, 760, 560, loopA / 0.42) - 14,
              width: 28, height: 28, borderRadius: "50%",
              background: mixHex(accent, PAPER, 0.35), opacity: 0.7,
            }}
          />
        )}
        {/* 路径虚线（淡） */}
        <svg width="1080" height="1920" style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
          <path d={`M 250 1370 Q 210 760 540 560`} fill="none" stroke={mixHex(INK, c1, 0.6)} strokeWidth="3" strokeDasharray="10 14" />
          <path d={`M 540 560 Q 880 780 790 1290`} fill="none" stroke={mixHex(accent, c1, 0.55)} strokeWidth="3" strokeDasharray="10 14" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

export default Scene15;
