// Scene03 · 后台隐屏：手机 mockup + 亚马逊购物真实演示 GIF + 「不打扰」标签
// 素材：amazon-cart.gif（来源 GitHub @wangzan101/Mika，README：加购后付款前停下）
import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { Gif } from "@remotion/gif";
import type { GenSceneProps } from "../types";
import { FONT_STACK, rand } from "../../dv/atmosphere";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const springPop = (t: number) => {
  const x = clamp01(t);
  return x < 0.7 ? easeOut(x / 0.7) * 1.12 : 1.12 - easeOut((x - 0.7) / 0.3) * 0.12;
};

const MikaScene03: React.FC<GenSceneProps> = ({ p, c1, c2, accent, speed, seed }) => {
  const enter = easeOut(clamp01(p / (0.14 * (2 - speed))));
  // 横向慢漂（配合 pan_right 运镜）
  const drift = Math.sin(p * Math.PI * speed) * 16;

  // 需求气泡打字 p 0.15~0.42
  const ASK = "30刀以内 评分4.5+";
  const typeT = clamp01((p - 0.15) / 0.27);
  const shown = Math.floor(typeT * ASK.length);
  // 加购回执 p 0.68~0.86
  const doneT = clamp01((p - 0.68) / 0.18);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(155deg, ${c1} 0%, ${c2} 100%)`,
        fontFamily: FONT_STACK,
        overflow: "hidden",
      }}
    >
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 80 + rand(seed + i * 5) * 760,
            top: 240 + rand(seed + i * 5 + 3) * 1100,
            width: 460,
            height: 460,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}20 0%, transparent 68%)`,
          }}
        />
      ))}

      {/* 后台隐屏标签（脉动） */}
      <div
        style={{
          position: "absolute",
          top: 200,
          right: 90,
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: "#1B1B22",
          color: "#fff",
          borderRadius: 999,
          padding: "14px 30px",
          fontSize: 30,
          fontWeight: 800,
          transform: `rotate(3deg) translateY(${(1 - enter) * -60}px)`,
          opacity: enter,
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            background: accent,
            opacity: 0.5 + 0.5 * Math.sin(p * Math.PI * 6 * speed),
          }}
        />
        后台隐屏 · 不打扰你
      </div>

      {/* 手机 mockup */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 300,
          width: 560,
          height: 1150,
          marginLeft: -280,
          transform: `translateX(${drift}px) translateY(${(1 - enter) * 180}px) scale(${0.94 + enter * 0.06})`,
          opacity: enter,
          borderRadius: 76,
          background: "#17171C",
          padding: 18,
          boxShadow: "0 40px 100px rgba(23,23,28,0.35)",
        }}
      >
        <div style={{ width: "100%", height: "100%", borderRadius: 60, overflow: "hidden", position: "relative" }}>
          <Gif
            src={staticFile("pic/projects/mika-guide-2026/amazon-cart.gif")}
            fit="cover"
            width={532}
            height={1118}
          />
          {/* 需求气泡 */}
          <div
            style={{
              position: "absolute",
              bottom: 130,
              left: 30,
              background: "rgba(255,255,255,0.96)",
              borderRadius: 26,
              padding: "18px 26px",
              fontSize: 32,
              fontWeight: 700,
              color: "#1B1B22",
              boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
              opacity: clamp01((p - 0.12) / 0.06),
            }}
          >
            {ASK.slice(0, shown)}
            {typeT < 1 ? <span style={{ color: accent }}>▌</span> : null}
          </div>
          {/* 加购回执：付款前停下（README 事实） */}
          {doneT > 0 ? (
            <div
              style={{
                position: "absolute",
                bottom: 40,
                left: 30,
                right: 30,
                background: accent,
                color: "#fff",
                borderRadius: 24,
                padding: "16px 26px",
                fontSize: 30,
                fontWeight: 800,
                textAlign: "center",
                transform: `scale(${springPop(doneT)})`,
                boxShadow: `0 12px 30px ${accent}55`,
              }}
            >
              已加购 ✓ 付款前它会先问你
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 60,
          width: "100%",
          textAlign: "center",
          fontSize: 22,
          color: "#8A8578",
          opacity: 0.75,
        }}
      >
        演示素材 GitHub @wangzan101/Mika
      </div>
    </AbsoluteFill>
  );
};

export default MikaScene03;
