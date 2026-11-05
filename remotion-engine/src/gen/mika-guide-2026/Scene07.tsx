// Scene07 · 第2步连模型：手机线框 + 三张模型卡飞入 + 钥匙插锁点亮
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, clamp, rand } from "../../dv/atmosphere";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t;

const MODELS = ["DeepSeek", "通义", "Kimi"];

const MikaScene07: React.FC<GenSceneProps> = ({ p, c1, c2, accent, speed, seed }) => {
  const enter = easeOut(clamp(p / (0.12 * (2 - speed)), 0, 1));
  // 模型卡依次飞入
  const cardT = (i: number) => easeOut(clamp((p - (0.16 + i * 0.1)) / 0.16, 0, 1));
  // 钥匙落下插入 p 0.5~0.66
  const keyDrop = easeIn(clamp((p - 0.5) / 0.1, 0, 1));
  const keyTurn = easeOut(clamp((p - 0.6) / 0.08, 0, 1));
  // 屏幕点亮 p 0.68~0.82
  const glow = easeOut(clamp((p - 0.68) / 0.14, 0, 1));
  // 已连接章 p 0.82~0.92
  const stampT = clamp((p - 0.82) / 0.1, 0, 1);
  const stamp = stampT < 0.6 ? 1.7 - easeOut(stampT / 0.6) * 0.62 : 1.08 - easeOut((stampT - 0.6) / 0.4) * 0.08;

  const keyY = -520 + keyDrop * 850;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(155deg, ${c1} 0%, ${c2} 100%)`,
        fontFamily: FONT_STACK,
        overflow: "hidden",
      }}
    >
      {/* 手机线框（暗屏） */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 400,
          width: 540,
          height: 1100,
          marginLeft: -270,
          transform: `translateY(${(1 - enter) * 120}px)`,
          opacity: enter,
          borderRadius: 68,
          border: "10px solid #1B1B22",
          background: `#FBF9F3`,
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(27,27,34,0.16)",
        }}
      >
        {/* 屏幕点亮渐变 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 50% 34%, ${accent}33 0%, ${accent}0A 42%, transparent 70%)`,
            opacity: glow,
          }}
        />
        {/* 屏内句号：一个巨大的对勾浮现 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 300,
            color: accent,
            opacity: glow * 0.9,
            transform: `scale(${0.7 + glow * 0.3})`,
          }}
        >
          ✓
        </div>
        {/* 锁孔 */}
        <div
          style={{
            position: "absolute",
            top: 96,
            left: "50%",
            width: 64,
            height: 64,
            marginLeft: -32,
            borderRadius: 32,
            border: `6px solid ${accent}`,
            opacity: 0.9,
          }}
        />
      </div>

      {/* 模型卡飞入（左/右交替） */}
      {MODELS.map((m, i) => {
        const t = cardT(i);
        const fromLeft = i % 2 === 0;
        return (
          <div
            key={m}
            style={{
              position: "absolute",
              top: 470 + i * 165,
              left: fromLeft ? 70 : undefined,
              right: fromLeft ? undefined : 70,
              transform: `translateX(${(1 - t) * (fromLeft ? -220 : 220)}px) rotate(${(rand(seed + i * 5) - 0.5) * 6}deg)`,
              opacity: t,
              background: "#ffffff",
              border: `3px solid ${accent}55`,
              borderRadius: 20,
              padding: "20px 38px",
              fontSize: 42,
              fontWeight: 900,
              color: "#1B1B22",
              boxShadow: "0 14px 36px rgba(27,27,34,0.14)",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ color: accent, marginRight: 12 }}>●</span>
            {m}
          </div>
        );
      })}

      {/* 钥匙 */}
      {keyDrop > 0 ? (
        <div
          style={{
            position: "absolute",
            top: keyY,
            left: "50%",
            marginLeft: -46,
            transform: `rotate(${-20 + keyTurn * 90}deg)`,
            opacity: 1,
          }}
        >
          <svg width={92} height={210} viewBox="0 0 92 210">
            <circle cx={46} cy={40} r={30} fill="none" stroke={accent} strokeWidth={14} />
            <rect x={39} y={66} width={14} height={130} rx={7} fill={accent} />
            <rect x={52} y={150} width={26} height={13} rx={6} fill={accent} />
            <rect x={52} y={176} width={19} height={13} rx={6} fill={accent} />
          </svg>
        </div>
      ) : null}

      {/* 已连接章 */}
      {stampT > 0 ? (
        <div
          style={{
            position: "absolute",
            bottom: 420,
            left: "50%",
            transform: `translateX(-50%) rotate(-8deg) scale(${stamp})`,
            opacity: Math.min(1, stampT * 2),
            border: `8px solid ${accent}`,
            color: accent,
            borderRadius: 20,
            padding: "14px 44px",
            fontSize: 58,
            fontWeight: 900,
            letterSpacing: 6,
            background: "rgba(255,255,255,0.88)",
            whiteSpace: "nowrap",
          }}
        >
          大脑已连接
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export default MikaScene07;
