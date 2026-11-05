// Scene01 · 悬念开场：GitHub 仓库卡片 + 星标计数器 1200→5900 + TRENDING 盖章
// 素材：github-repo.png（真实仓库页截图，来源 GitHub @wangzan101/Mika）
import React, { useMemo } from "react";
import { AbsoluteFill, staticFile } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK, rand } from "../../dv/atmosphere";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const Star: React.FC<{ size: number; color: string; opacity?: number }> = ({
  size,
  color,
  opacity = 1,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ opacity }}>
    <path
      fill={color}
      d="M12 2l2.9 6.26 6.85.72-5.1 4.6 1.43 6.73L12 16.9 5.92 20.3l1.43-6.73-5.1-4.6 6.85-.72L12 2z"
    />
  </svg>
);

const MikaScene01: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  // 背景漂浮小星
  const stars = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        x: rand(seed + i * 3) * 1080,
        y: 120 + rand(seed + i * 3 + 1) * 1500,
        s: 10 + rand(seed + i * 3 + 2) * 22,
        o: 0.12 + rand(seed + i * 3 + 3) * 0.2,
      })),
    [seed],
  );

  // 卡片入场 p 0~0.18
  const enter = easeOut(clamp01(p / 0.18));
  // 星标计数 p 0.2~0.8
  const countT = easeOut(clamp01((p - 0.2) / 0.6));
  const starCount = Math.round(1200 + (5900 - 1200) * countT);
  // TRENDING 盖章 p 0.82~0.92
  const stampT = clamp01((p - 0.82) / 0.1);
  const stampScale = 1.9 - easeOut(stampT) * 0.9;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`,
        fontFamily: FONT_STACK,
        overflow: "hidden",
      }}
    >
      {stars.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: s.x,
            top: s.y + Math.sin(p * Math.PI * 2 + i) * 14,
            opacity: s.o,
          }}
        >
          <Star size={s.s} color={accent} />
        </div>
      ))}

      {/* 浏览器窗口卡片 */}
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          top: 330,
          transform: `translateY(${(1 - enter) * 150}px) scale(${0.92 + enter * 0.08}) rotate(${(1 - enter) * -2.5}deg)`,
          opacity: enter,
          borderRadius: 26,
          overflow: "hidden",
          background: "#ffffff",
          boxShadow: "0 34px 90px rgba(27,27,34,0.22), 0 4px 14px rgba(27,27,34,0.10)",
        }}
      >
        {/* 顶栏 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "18px 24px",
            background: "#F0EEE9",
            borderBottom: "1px solid #E2DED4",
          }}
        >
          {["#F26D5F", "#F2BE4C", "#5CB85C"].map((c) => (
            <div key={c} style={{ width: 20, height: 20, borderRadius: 10, background: c }} />
          ))}
          <div
            style={{
              flex: 1,
              marginLeft: 12,
              background: "#ffffff",
              borderRadius: 12,
              padding: "10px 20px",
              fontFamily: MONO_STACK,
              fontSize: 24,
              color: "#57606A",
            }}
          >
            github.com/wangzan101/Mika
          </div>
        </div>
        <img
          src={staticFile("pic/projects/mika-guide-2026/github-repo.png")}
          style={{ width: "100%", display: "block", objectFit: "cover", objectPosition: "top" }}
        />
      </div>

      {/* 星标计数器 */}
      <div
        style={{
          position: "absolute",
          top: 1080,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 26,
          opacity: clamp01((p - 0.18) / 0.08),
        }}
      >
        <div style={{ transform: `rotate(-8deg)` }}>
          <Star size={104} color="#E8B93B" />
        </div>
        <span
          style={{
            fontSize: 150,
            fontWeight: 900,
            color: "#1B1B22",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: 2,
          }}
        >
          {starCount.toLocaleString("en-US")}
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          top: 1268,
          width: "100%",
          textAlign: "center",
          fontSize: 40,
          fontWeight: 700,
          color: "#57606A",
          opacity: clamp01((p - 0.3) / 0.1),
        }}
      >
        stars · 还在疯涨
      </div>

      {/* TRENDING 盖章 */}
      {stampT > 0 ? (
        <div
          style={{
            position: "absolute",
            top: 1420,
            left: "50%",
            transform: `translateX(-50%) rotate(-10deg) scale(${stampScale})`,
            opacity: Math.min(1, stampT * 1.6),
            border: `8px solid ${accent}`,
            color: accent,
            borderRadius: 18,
            padding: "14px 44px",
            fontSize: 66,
            fontWeight: 900,
            letterSpacing: 8,
            background: "rgba(255,255,255,0.85)",
          }}
        >
          TRENDING
        </div>
      ) : null}

      {/* 素材来源 */}
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
        素材 GitHub @wangzan101/Mika · Apache-2.0
      </div>
    </AbsoluteFill>
  );
};

export default MikaScene01;
