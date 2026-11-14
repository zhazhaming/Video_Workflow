// Scene14 · 注意事项二：家电卡与 SmartThings 云的连线断裂 + 琥珀警示三角呼吸（still 冷静警示）
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK, mixHex } from "../../dv/atmosphere";
import { INK, LINE, PAPER, SHADOW, clamp01, easeOut, exitFade } from "./ui";

const AMBER = "#C9862B"; // 低饱和琥珀（警示，非荧光）

const Scene14: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const cardIn = easeOut(clamp01(p / 0.14));
  const breakT = clamp01((p - 0.34) / 0.14); // 连线断裂
  const warn = 0.55 + 0.45 * Math.sin(p * Math.PI * 2 * 1.6); // 警示呼吸

  return (
    <AbsoluteFill style={{ background: `linear-gradient(162deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {/* SmartThings 云（顶部灰） */}
        <div style={{ position: "absolute", left: 540 - 150, top: 360, opacity: cardIn }}>
          {[
            { x: 0, y: 52, s: 96 },
            { x: 70, y: 18, s: 120 },
            { x: 170, y: 34, s: 102 },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                position: "absolute", left: c.x, top: c.y, width: c.s, height: c.s,
                borderRadius: "50%", background: mixHex(INK, c1, 0.35), boxShadow: SHADOW,
              }}
            />
          ))}
          <div
            style={{
              position: "absolute", left: 0, right: 0, top: 62, textAlign: "center",
              fontSize: 26, fontWeight: 800, fontFamily: MONO_STACK, color: PAPER,
            }}
          >
            SmartThings
          </div>
        </div>
        {/* 连线：上半段保留，下半段断落后错开 */}
        <div
          style={{
            position: "absolute", left: 540 - 2, top: 560, width: 4, height: 150,
            backgroundImage: `linear-gradient(${mixHex(INK, c1, 0.5)} 46%, transparent 46%)`,
            backgroundSize: "4px 30px", opacity: 0.7,
          }}
        />
        <div
          style={{
            position: "absolute", left: 540 - 2 + breakT * 26, top: 710 + breakT * 34, width: 4, height: 150,
            backgroundImage: `linear-gradient(${mixHex(INK, c1, 0.5)} 46%, transparent 46%)`,
            backgroundSize: "4px 30px", opacity: 0.7 * (1 - breakT * 0.55),
            transform: `rotate(${breakT * 14}deg)`,
          }}
        />
        {/* 断裂火花 + 碎裂粒子 */}
        {breakT > 0 && breakT < 1 && (
          <>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const ang = (i / 6) * Math.PI * 2 + 0.4;
              const travel = breakT * (70 + (i % 3) * 36);
              return (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    left: 540 - 8 + Math.cos(ang) * travel,
                    top: 700 + Math.sin(ang) * travel * 0.7,
                    width: i % 2 ? 10 : 14, height: i % 2 ? 10 : 14,
                    borderRadius: i % 2 ? "50%" : 3,
                    background: i % 3 === 0 ? accent : AMBER,
                    opacity: 1 - breakT, transform: `rotate(${breakT * 220}deg)`,
                  }}
                />
              );
            })}
          </>
        )}
        {/* 家电卡（洗衣机样式） */}
        <div
          style={{
            position: "absolute", left: 540 - 110, top: 920 + (1 - cardIn) * 60,
            width: 220, height: 250, background: PAPER, border: `4px solid ${INK}`,
            borderRadius: 24, boxShadow: SHADOW, boxSizing: "border-box", opacity: cardIn,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 130, height: 130, borderRadius: "50%", border: `5px solid ${INK}`,
              display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box",
            }}
          >
            <div
              style={{
                width: 84, height: 84, borderRadius: "50%",
                background: breakT > 0 ? mixHex(accent, PAPER, 0.55) : accent,
                opacity: 0.35 + 0.6 * (1 - breakT),
              }}
            />
          </div>
        </div>
        {/* 琥珀警示三角（摆动呼吸） */}
        <div
          style={{
            position: "absolute", left: 540 + 70, top: 880,
            opacity: cardIn * warn,
            transform: `scale(${0.7 + 0.3 * cardIn}) rotate(${Math.sin(p * Math.PI * 2 * 1.1) * 7}deg)`,
          }}
        >
          <div
            style={{
              width: 130, height: 116, background: AMBER,
              clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
              filter: "drop-shadow(0 8px 18px rgba(20,17,15,0.22))",
            }}
          />
          <div
            style={{
              position: "absolute", left: 61, top: 38, width: 8, height: 40,
              background: PAPER, borderRadius: 4,
            }}
          />
          <div
            style={{
              position: "absolute", left: 61, top: 88, width: 8, height: 8,
              background: PAPER, borderRadius: "50%",
            }}
          />
        </div>
        {/* 底部提醒骨架条 */}
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute", left: 540 - (i === 0 ? 210 : 150), top: 1250 + i * 58,
              width: i === 0 ? 420 : 300, height: 14 - i * 4, borderRadius: 7,
              background: i === 0 ? mixHex(INK, c1, 0.72) : LINE,
              opacity: easeOut(clamp01((p - 0.5 - i * 0.12) / 0.25)),
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default Scene14;
