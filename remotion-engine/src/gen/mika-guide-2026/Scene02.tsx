// Scene02 · AI打工人/代练：手机 mockup + 微信发消息真实演示 GIF + 任务气泡打字
// 素材：wechat-send-side.gif（来源 GitHub @wangzan101/Mika）
import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { Gif } from "@remotion/gif";
import type { GenSceneProps } from "../types";
import { FONT_STACK, rand } from "../../dv/atmosphere";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const springPop = (t: number) => {
  // 快速过冲回弹
  const x = clamp01(t);
  return x < 0.7 ? easeOut(x / 0.7) * 1.12 : 1.12 - easeOut((x - 0.7) / 0.3) * 0.12;
};

const MikaScene02: React.FC<GenSceneProps> = ({ p, c1, c2, accent, speed, seed }) => {
  const enter = easeOut(clamp01(p / (0.15 * (2 - speed))));
  const bob = Math.sin(p * Math.PI * 2 * speed) * 9;

  // 任务气泡打字 p 0.18~0.45
  const TASK = "把这句话发给老板";
  const typeT = clamp01((p - 0.18) / 0.27);
  const shown = Math.floor(typeT * TASK.length);
  // 已发送气泡 p 0.55~0.72
  const sentT = clamp01((p - 0.55) / 0.17);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(155deg, ${c1} 0%, ${c2} 100%)`,
        fontFamily: FONT_STACK,
        overflow: "hidden",
      }}
    >
      {/* 背景光斑 */}
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 120 + rand(seed + i) * 700,
            top: 200 + rand(seed + i + 7) * 1200,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}22 0%, transparent 68%)`,
          }}
        />
      ))}

      {/* 手机 mockup */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 300,
          width: 560,
          height: 1150,
          marginLeft: -280,
          transform: `translateY(${(1 - enter) * 200 + bob}px) scale(${0.94 + enter * 0.06})`,
          opacity: enter,
          borderRadius: 76,
          background: "#17171C",
          padding: 18,
          boxShadow: "0 40px 100px rgba(23,23,28,0.35)",
        }}
      >
        <div style={{ width: "100%", height: "100%", borderRadius: 60, overflow: "hidden", position: "relative" }}>
          <Gif
            src={staticFile("pic/projects/mika-guide-2026/wechat-send-side.gif")}
            fit="cover"
            width={532}
            height={1118}
          />
          {/* 顶部任务气泡（打字机） */}
          <div
            style={{
              position: "absolute",
              top: 36,
              left: 30,
              right: 30,
              background: "rgba(255,255,255,0.96)",
              borderRadius: 26,
              padding: "20px 28px",
              fontSize: 34,
              fontWeight: 700,
              color: "#1B1B22",
              boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
              opacity: clamp01((p - 0.14) / 0.06),
            }}
          >
            {TASK.slice(0, shown)}
            {typeT < 1 ? <span style={{ color: accent }}>▌</span> : null}
          </div>
          {/* 已发送回执 */}
          {sentT > 0 ? (
            <div
              style={{
                position: "absolute",
                bottom: 46,
                right: 30,
                background: accent,
                color: "#fff",
                borderRadius: 24,
                padding: "16px 30px",
                fontSize: 32,
                fontWeight: 800,
                transform: `scale(${springPop(sentT)})`,
                boxShadow: `0 12px 30px ${accent}55`,
              }}
            >
              已发送 ✓
            </div>
          ) : null}
        </div>
      </div>

      {/* 左上角身份标签 */}
      <div
        style={{
          position: "absolute",
          top: 280,
          left: 90,
          background: "#1B1B22",
          color: "#fff",
          borderRadius: 16,
          padding: "12px 28px",
          fontSize: 28,
          fontWeight: 800,
          transform: "rotate(-4deg)",
          opacity: enter,
        }}
      >
        你的 AI 打工人
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

export default MikaScene02;
