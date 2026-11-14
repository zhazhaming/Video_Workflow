// Scene16 · 机房打盹：指令被「维护中」挡板弹回消散，机房冒 Zzz，家电头顶问号（悬念蓄力）
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK, mixHex, rand } from "../../dv/atmosphere";
import { INK, LINE, MUTED, PAPER, SHADOW, clamp01, easeOut, exitFade } from "./ui";

const bez = (a: number, c: number, b: number, t: number) =>
  (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;

const Scene16: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const dots = useMemo(
    () =>
      Array.from({ length: 14 }, (_, k) => ({
        x: 60 + rand(seed + k * 3 + 40) * 960,
        y0: 260 + rand(seed + k * 3 + 41) * 1300,
        r: 2.5 + rand(seed + k * 3 + 42) * 4,
        v: 26 + rand(seed + k * 3 + 43) * 50,
        tw: rand(seed + k * 3 + 44) * Math.PI * 2,
      })),
    [seed],
  );
  // 0~0.3 泡泡飞向机房；0.3~0.42 撞挡板弹回；0.42~0.75 消散；全程 Zzz 渐现
  const fly = clamp01(p / 0.3);
  const bounce = clamp01((p - 0.3) / 0.14);
  const fade = clamp01((p - 0.44) / 0.3);
  const zT = clamp01((p - 0.28) / 0.4);
  const fog = clamp01((p - 0.55) / 0.35);

  // 去程：手机(250,1370) → 机房(540,560)
  const ax = bez(250, 210, 540, fly);
  const ay = bez(1370, 760, 560, fly);
  // 弹回落点：往回一半
  const rx = bez(540, 300, 380, bounce);
  const ry = bez(560, 860, 1000, bounce);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(162deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        <div
          style={{
            position: "absolute", inset: -60, opacity: 0.35,
            backgroundImage: `linear-gradient(${LINE} 1px, transparent 1px), linear-gradient(90deg, ${LINE} 1px, transparent 1px)`,
            backgroundSize: "96px 96px",
            transform: `translate(${Math.cos(p * Math.PI * 2) * 8}px, ${p * -10}px)`,
          }}
        />
        {dots.map((d, k) => (
          <span
            key={k}
            style={{
              position: "absolute", left: d.x, top: d.y0 - ((p * d.v) % 1300),
              width: d.r * 2, height: d.r * 2, borderRadius: "50%",
              background: mixHex(INK, c1, 0.72), opacity: 0.18 + 0.2 * Math.sin(p * Math.PI * 2 + d.tw),
            }}
          />
        ))}

        {/* 机房（灰暗，打盹） */}
        <div style={{ position: "absolute", left: 540 - 130, top: 300, transform: `translateY(${Math.sin(p * Math.PI * 2 * 0.9) * 4}px)` }}>
          <div
            style={{
              position: "relative", width: 260, height: 220, background: PAPER,
              border: `4px solid ${INK}`, borderRadius: 18, boxShadow: SHADOW, boxSizing: "border-box",
              padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10,
              filter: `grayscale(${0.3 + fog * 0.5})`, opacity: 1 - fog * 0.25,
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ display: "flex", gap: 10 }}>
                {[0, 1].map((j) => (
                  <div
                    key={j}
                    style={{
                      flex: 1, height: 30, borderRadius: 6, background: mixHex(INK, c1, 0.82),
                      opacity: 0.5 + 0.4 * Math.abs(Math.sin(p * Math.PI * 2 * 0.7 + i + j)),
                    }}
                  />
                ))}
              </div>
            ))}
            <div style={{ textAlign: "center", fontSize: 24, fontWeight: 700, color: MUTED, marginTop: 2 }}>厂商机房</div>
          </div>
        </div>
        {/* Zzz（打盹） */}
        {["z", "z", "z"].map((z, i) => {
          const t = clamp01(zT * 3 - i);
          return (
            <span
              key={i}
              style={{
                position: "absolute", left: 700 + i * 44, top: 250 - i * 46,
                fontSize: 30 + i * 16, fontWeight: 800, fontFamily: MONO_STACK,
                color: mixHex(INK, c1, 0.45),
                opacity: t * (1 - fog * 0.5),
                transform: `translateY(${(1 - t) * 14}px) rotate(${i * 8 - 6}deg)`,
              }}
            >
              {z}
            </span>
          );
        })}
        {/* 维护中挡板（机房门口） */}
        <div
          style={{
            position: "absolute", left: 540 - 92, top: 470,
            opacity: clamp01(p / 0.2) * (1 - fog * 0.4),
            transform: `rotate(${Math.sin(p * Math.PI * 2 * 2.2) * 2}deg) scale(${0.9 + 0.1 * clamp01(p / 0.2)})`,
          }}
        >
          <div
            style={{
              padding: "12px 26px", borderRadius: 999, background: mixHex(INK, c1, 0.3),
              border: `3px solid ${INK}`, boxShadow: SHADOW,
              display: "flex", gap: 10, alignItems: "center",
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 14, height: 14, borderRadius: "50%", background: PAPER,
                  opacity: 0.35 + 0.65 * Math.abs(Math.sin(p * Math.PI * 2 * 1.4 - i * 0.9)),
                }}
              />
            ))}
            <span style={{ fontSize: 26, fontWeight: 800, color: PAPER }}>维护中</span>
          </div>
        </div>

        {/* 手机（左下，屏幕变灰闪烁） */}
        <div style={{ position: "absolute", left: 170, top: 1250, transform: "rotate(-4deg)" }}>
          <div
            style={{
              width: 150, height: 260, borderRadius: 28, background: PAPER,
              border: `4px solid ${INK}`, boxShadow: SHADOW, boxSizing: "border-box",
              padding: "18px 12px", display: "flex", flexDirection: "column", gap: 10,
            }}
          >
            <div
              style={{
                height: 46, borderRadius: 10,
                background: mixHex(accent, PAPER, 0.4 + 0.5 * Math.abs(Math.sin(p * Math.PI * 2 * 1.8))),
              }}
            />
            <div style={{ height: 30, borderRadius: 8, background: mixHex(INK, c1, 0.86) }} />
            <div style={{ height: 30, borderRadius: 8, background: mixHex(INK, c1, 0.86), width: "70%" }} />
          </div>
        </div>
        {/* 指令泡泡：飞去被弹回消散 */}
        {p < 0.3 && (
          <div style={{ position: "absolute", left: ax - 24, top: ay - 24, width: 48, height: 48, borderRadius: "50%", background: accent, boxShadow: SHADOW }} />
        )}
        {bounce > 0 && bounce < 1 && (
          <div
            style={{
              position: "absolute", left: rx - 24, top: ry - 24, width: 48, height: 48,
              borderRadius: "50%", background: mixHex(accent, PAPER, 0.3 + fade * 0.7),
              opacity: 1 - fade, transform: `scale(${1 - fade * 0.5}) rotate(${bounce * 200}deg)`,
            }}
          />
        )}
        {/* 撞挡板碎星 */}
        {p > 0.3 && p < 0.55 &&
          [0, 1, 2, 3].map((i) => {
            const q = clamp01((p - 0.3) / 0.25);
            return (
              <span
                key={i}
                style={{
                  position: "absolute",
                  left: 540 + (i % 2 ? 1 : -1) * q * (46 + i * 16),
                  top: 500 - q * 70 + (i < 2 ? -10 : 26),
                  width: 12, height: 12, borderRadius: 3,
                  background: i % 2 ? accent : mixHex(INK, c1, 0.6),
                  opacity: 1 - q, transform: `rotate(${q * 160}deg)`,
                }}
              />
            );
          })}
        {/* 家电（右下，头顶问号） */}
        <div style={{ position: "absolute", left: 720, top: 1230, transform: "rotate(3deg)" }}>
          <div
            style={{
              width: 170, height: 200, borderRadius: 22, background: PAPER,
              border: `4px solid ${INK}`, boxShadow: SHADOW, boxSizing: "border-box",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <div style={{ width: 104, height: 104, borderRadius: "50%", border: `5px solid ${INK}`, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: mixHex(accent, PAPER, 0.55), opacity: 0.5 }} />
            </div>
          </div>
          {/* 问号泡泡 */}
          {[0, 1].map((i) => {
            const t = clamp01((p - 0.5 - i * 0.18) / 0.2);
            return (
              <div
                key={i}
                style={{
                  position: "absolute", left: 110 + i * 34, top: -50 - i * 36,
                  width: 44 + i * 10, height: 44 + i * 10, borderRadius: "50%",
                  background: PAPER, border: `3px solid ${INK}`, boxShadow: SHADOW,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24 + i * 8, fontWeight: 900, color: MUTED,
                  opacity: t, transform: `scale(${0.6 + t * 0.4})`,
                }}
              >
                ?
              </div>
            );
          })}
        </div>
        {/* 雾气盖机房（打盹加深） */}
        {fog > 0 && (
          <div
            style={{
              position: "absolute", left: 540 - 220, top: 300, width: 440, height: 260,
              borderRadius: 40, background: mixHex(INK, c1, 0.86), opacity: fog * 0.35,
              transform: `translateY(${(1 - fog) * 40}px)`,
            }}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};

export default Scene16;
