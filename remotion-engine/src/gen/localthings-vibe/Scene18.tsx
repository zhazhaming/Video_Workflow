// Scene18 · 自动识别：扫描线扫过家电、绿色轮廓逐段点亮，右侧开关面板弹起、盖「已识别」章
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, mixHex, rand } from "../../dv/atmosphere";
import { INK, LINE, MUTED, PAPER, SHADOW, clamp01, easeBack, easeOut, exitFade } from "./ui";

const Scene18: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const dots = useMemo(
    () =>
      Array.from({ length: 16 }, (_, k) => ({
        x: 60 + rand(seed + k * 3 + 40) * 960,
        y0: 260 + rand(seed + k * 3 + 41) * 1300,
        r: 2.5 + rand(seed + k * 3 + 42) * 4,
        v: 30 + rand(seed + k * 3 + 43) * 60,
        tw: rand(seed + k * 3 + 44) * Math.PI * 2,
      })),
    [seed],
  );
  const scan = easeOut(clamp01((p - 0.08) / 0.4)); // 扫描 0.08~0.48
  const panelIn = easeBack(clamp01((p - 0.5) / 0.24)); // 面板弹入
  const stampIn = easeBack(clamp01((p - 0.72) / 0.2)); // 已识别章
  const SCAN_TOP = 420;
  const SCAN_BOT = 1180;
  const scanY = SCAN_TOP + scan * (SCAN_BOT - SCAN_TOP);
  const toggles = [0, 1, 2].map((i) => easeBack(clamp01((p - 0.56 - i * 0.09) / 0.2)));
  const dialT = easeOut(clamp01((p - 0.6) / 0.28));

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        <div
          style={{
            position: "absolute", inset: -60, opacity: 0.4,
            backgroundImage: `linear-gradient(${LINE} 1px, transparent 1px), linear-gradient(90deg, ${LINE} 1px, transparent 1px)`,
            backgroundSize: "96px 96px",
            transform: `translateY(${p * -12}px)`,
          }}
        />
        {dots.map((d, k) => (
          <span
            key={k}
            style={{
              position: "absolute", left: d.x, top: d.y0 - ((p * d.v) % 1300),
              width: d.r * 2, height: d.r * 2, borderRadius: "50%",
              background: k % 3 === 0 ? accent : mixHex(INK, c1, 0.72),
              opacity: 0.2 + 0.22 * Math.sin(p * Math.PI * 2 + d.tw),
            }}
          />
        ))}

        {/* 家电卡（左，扫描对象） */}
        <div style={{ position: "absolute", left: 540 - 430, top: 420 }}>
          {/* 灰底家电 */}
          <div
            style={{
              width: 330, height: 400, borderRadius: 28, background: PAPER,
              border: `4px solid ${INK}`, boxShadow: SHADOW, boxSizing: "border-box",
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
              position: "relative",
            }}
          >
            <div style={{ width: 190, height: 190, borderRadius: "50%", border: `6px solid ${mixHex(INK, c1, 0.55)}`, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
              <div style={{ width: 120, height: 120, borderRadius: "50%", background: mixHex(INK, c1, 0.85) }} />
            </div>
            {/* 扫描过的区域着色（clip 到扫描线以上） */}
            <div
              style={{
                position: "absolute", inset: 0,
                clipPath: `inset(0 0 ${Math.max(0, 1 - scan) * 100}% 0)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <div style={{ width: 190, height: 190, borderRadius: "50%", border: `6px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
                <div style={{ width: 120, height: 120, borderRadius: "50%", background: accent, opacity: 0.85 }} />
              </div>
            </div>
          </div>
          {/* 扫描线 */}
          {scan > 0 && scan < 1 && (
            <div
              style={{
                position: "absolute", left: -14, top: scanY - SCAN_TOP - 3, width: 358, height: 6,
                borderRadius: 3, background: accent,
                boxShadow: `0 0 18px ${accent}`,
              }}
            />
          )}
        </div>

        {/* 控制面板（右，弹入） */}
        <div
          style={{
            position: "absolute", left: 540 + 70, top: 470,
            opacity: clamp01(panelIn * 1.4),
            transform: `translateX(${(1 - panelIn) * 140}px) rotate(${(1 - panelIn) * 4}deg)`,
          }}
        >
          <div
            style={{
              width: 380, height: 560, borderRadius: 26, background: PAPER,
              border: `4px solid ${INK}`, boxShadow: SHADOW, boxSizing: "border-box",
              padding: "30px 32px", display: "flex", flexDirection: "column", gap: 22,
            }}
          >
            {/* 开关行 ×3 */}
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ width: 130, height: 14, borderRadius: 7, background: LINE }} />
                <div
                  style={{
                    width: 96, height: 52, borderRadius: 26, background: mixHex(INK, c1, 0.84),
                    border: `3px solid ${INK}`, boxSizing: "border-box", position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute", top: 4, left: 4 + toggles[i] * 40,
                      width: 38, height: 38, borderRadius: "50%",
                      background: toggles[i] > 0.5 ? accent : mixHex(INK, c1, 0.55),
                    }}
                  />
                </div>
              </div>
            ))}
            {/* 温度转盘 */}
            <div style={{ position: "relative", width: 220, height: 220, margin: "6px auto 0" }}>
              <div
                style={{
                  position: "absolute", inset: 0, borderRadius: "50%", background: PAPER,
                  border: `5px solid ${INK}`, boxSizing: "border-box",
                }}
              />
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * 360 - 210;
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute", left: "50%", top: "50%", width: 5, height: 18,
                      background: i <= dialT * 11 ? accent : mixHex(INK, c1, 0.8),
                      transformOrigin: "50% 0",
                      transform: `rotate(${a}deg) translateY(-78px)`,
                      borderRadius: 3,
                    }}
                  />
                );
              })}
              <div
                style={{
                  position: "absolute", left: "50%", top: "50%", width: 8, height: 66,
                  background: INK, borderRadius: 4, transformOrigin: "50% 100%",
                  transform: `translate(-50%, -100%) rotate(${-110 + dialT * 145}deg)`,
                }}
              />
              <div style={{ position: "absolute", left: "50%", top: "50%", width: 26, height: 26, borderRadius: "50%", background: INK, transform: "translate(-50%,-50%)" }} />
            </div>
            <div style={{ width: 180, height: 12, borderRadius: 6, background: LINE, margin: "0 auto" }} />
          </div>
        </div>

        {/* 已识别章 */}
        <div
          style={{
            position: "absolute", left: 540 - 320, top: 300,
            opacity: clamp01(stampIn * 1.3),
            transform: `scale(${1.6 - stampIn * 0.6}) rotate(${(1 - stampIn) * -16 - 5}deg)`,
          }}
        >
          <div
            style={{
              padding: "14px 34px", borderRadius: 18, background: accent,
              border: `4px solid ${PAPER}`, boxShadow: SHADOW,
              fontSize: 38, fontWeight: 900, color: PAPER, letterSpacing: 4,
            }}
          >
            已识别
          </div>
        </div>
        {/* 底部提示骨架 */}
        <div
          style={{
            position: "absolute", left: 540 - 240, top: 1250, width: 480, height: 14,
            borderRadius: 7, background: mixHex(INK, c1, 0.78),
            opacity: easeOut(clamp01((p - 0.7) / 0.2)),
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default Scene18;
