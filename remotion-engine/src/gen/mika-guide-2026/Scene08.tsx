// Scene08 · 第3步配对：手机 + 无线调试配对码滚动定格 + 已配对印章 + 点击涟漪
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK, clamp, rand } from "../../dv/atmosphere";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (v: number) => clamp(v, 0, 1);

const CODE = ["8", "3", "4", "2", "1", "6"]; // 定格配对码 834 216

const MikaScene08: React.FC<GenSceneProps> = ({ p, c1, c2, accent, speed, seed }) => {
  const enter = easeOut(clamp01(p / (0.12 * (2 - speed))));
  // 配对码逐位滚动定格 p 0.2~0.5
  const digitT = (i: number) => clamp01((p - (0.2 + i * 0.05)) / 0.12);
  // 已配对章 p 0.58~0.72
  const stampT = clamp01((p - 0.58) / 0.14);
  const stamp = stampT < 0.6 ? 1.7 - easeOut(stampT / 0.6) * 0.62 : 1.08 - easeOut((stampT - 0.6) / 0.4) * 0.08;
  // 点击涟漪 p 0.78/0.86 两圈
  const ripple = (i: number) => clamp01((p - (0.78 + i * 0.08) * (2 - speed)) / 0.14);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(155deg, ${c1} 0%, ${c2} 100%)`,
        fontFamily: FONT_STACK,
        overflow: "hidden",
      }}
    >
      {/* 手机（亮屏） */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 330,
          width: 560,
          height: 1150,
          marginLeft: -280,
          transform: `translateY(${(1 - enter) * 140}px)`,
          opacity: enter,
          borderRadius: 70,
          background: "#17171C",
          padding: 16,
          boxShadow: "0 40px 100px rgba(23,23,28,0.35)",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 56,
            overflow: "hidden",
            position: "relative",
            background: "#FBF9F3",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ marginTop: 130, fontSize: 34, fontWeight: 700, color: "#8A8578" }}>
            无线调试 · 配对码
          </div>
          {/* 配对码：逐位滚动定格 */}
          <div
            style={{
              marginTop: 44,
              display: "flex",
              gap: 10,
              fontFamily: MONO_STACK,
              fontWeight: 700,
            }}
          >
            {CODE.map((d, i) => {
              const t = digitT(i);
              const rolling = t < 1;
              // 滚动中显示随机数字（确定性），定格显示真码
              const shown = rolling
                ? String(Math.floor(rand(seed + i * 13 + Math.floor(p * 24)) * 10))
                : d;
              return (
                <div
                  key={i}
                  style={{
                    width: 62,
                    height: 84,
                    borderRadius: 16,
                    background: "#1B1B22",
                    color: t >= 1 ? accent : "#C8D2DC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 46,
                    marginRight: i === 2 ? 20 : 0,
                    transform: `scale(${t >= 1 && t < 1.15 ? 1.12 : 1})`,
                  }}
                >
                  {shown}
                </div>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 40,
              fontSize: 30,
              fontWeight: 700,
              color: "#8A8578",
              opacity: digitT(5),
            }}
          >
            在另一台设备输入这串数字
          </div>
          {/* 涟漪点击点 */}
          <div style={{ position: "absolute", bottom: 200, right: 110 }}>
            {ripple(0) > 0 ? (
              <div
                style={{
                  position: "absolute",
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  background: accent,
                  opacity: 1 - ripple(0),
                  transform: `scale(${1 + ripple(0) * 3})`,
                }}
              />
            ) : null}
            {ripple(1) > 0 ? (
              <div
                style={{
                  position: "absolute",
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  border: `5px solid ${accent}`,
                  opacity: 1 - ripple(1),
                  transform: `scale(${1 + ripple(1) * 4.5})`,
                }}
              />
            ) : null}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                background: "#1B1B22",
                opacity: 0.85,
              }}
            />
          </div>
        </div>
      </div>

      {/* 已配对章 */}
      {stampT > 0 ? (
        <div
          style={{
            position: "absolute",
            bottom: 620,
            left: "50%",
            transform: `translateX(-50%) rotate(-8deg) scale(${stamp})`,
            opacity: Math.min(1, stampT * 2),
            border: `8px solid ${accent}`,
            color: accent,
            borderRadius: 20,
            padding: "14px 46px",
            fontSize: 60,
            fontWeight: 900,
            letterSpacing: 6,
            background: "rgba(255,255,255,0.88)",
            whiteSpace: "nowrap",
          }}
        >
          已配对 ✓
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export default MikaScene08;
