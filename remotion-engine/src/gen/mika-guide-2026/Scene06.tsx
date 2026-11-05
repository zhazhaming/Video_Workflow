// Scene06 · 第1步下载安装：Releases 下载卡 + 进度条 + terminal 风安装记录
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK, clamp } from "../../dv/atmosphere";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => t * t * (3 - 2 * t);

const MikaScene06: React.FC<GenSceneProps> = ({ p, c1, c2, accent, speed }) => {
  const enter = easeOut(clamp((p / (0.12 * (2 - speed))), 0, 1));
  // 下载进度 p 0.18~0.55
  const dl = easeInOut(clamp((p - 0.18) / 0.37, 0, 1));
  // 安装完成章 p 0.6~0.75
  const doneT = clamp((p - 0.6) / 0.15, 0, 1);
  const stamp = doneT < 0.6 ? 1.7 - easeOut(doneT / 0.6) * 0.62 : 1.08 - easeOut((doneT - 0.6) / 0.4) * 0.08;
  // terminal 逐行 p 0.72/0.8/0.88
  const rows = ["$ brew install sanity", "$ adb devices → 无线就绪", "# 其实只要装个 APK"];
  const rowT = (i: number) => clamp((p - (0.72 + i * 0.08) * (2 - speed)) / 0.08, 0, 1);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(155deg, ${c1} 0%, ${c2} 100%)`,
        fontFamily: FONT_STACK,
        overflow: "hidden",
      }}
    >
      {/* 下载卡片 */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 430,
          width: 760,
          marginLeft: -380,
          transform: `translateY(${(1 - enter) * 130}px)`,
          opacity: enter,
          background: "#ffffff",
          borderRadius: 30,
          boxShadow: "0 30px 80px rgba(27,27,34,0.18)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "24px 36px",
            background: "#F0EEE9",
            borderBottom: "1px solid #E2DED4",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 32, fontWeight: 800, color: "#1B1B22" }}>GitHub Releases</span>
          <span style={{ fontFamily: MONO_STACK, fontSize: 24, color: "#8A8578" }}>Latest ✓</span>
        </div>
        <div style={{ padding: "44px 44px 52px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
            {/* APK 图标 */}
            <div
              style={{
                width: 110,
                height: 110,
                borderRadius: 26,
                background: accent,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                fontWeight: 900,
                boxShadow: `0 12px 28px ${accent}44`,
              }}
            >
              APK
            </div>
            <div>
              <div style={{ fontSize: 38, fontWeight: 800, color: "#1B1B22" }}>app-release.apk</div>
              <div style={{ fontSize: 26, color: "#8A8578", marginTop: 6, fontFamily: MONO_STACK }}>
                Android 12+ · {Math.round(38 * (1 - dl * 0.1))} MB / {Math.round(dl * 100)}%
              </div>
            </div>
          </div>
          {/* 进度条 */}
          <div style={{ marginTop: 36, height: 22, borderRadius: 11, background: "#EDE9DF", overflow: "hidden" }}>
            <div
              style={{
                width: `${dl * 100}%`,
                height: "100%",
                borderRadius: 11,
                background: `linear-gradient(90deg, ${accent}, ${accent}CC)`,
                transition: "none",
              }}
            />
          </div>
        </div>
      </div>

      {/* 安装完成章 */}
      {doneT > 0 ? (
        <div
          style={{
            position: "absolute",
            top: 1000,
            left: "50%",
            transform: `translateX(-50%) rotate(-8deg) scale(${stamp})`,
            opacity: Math.min(1, doneT * 2),
            border: `8px solid ${accent}`,
            color: accent,
            borderRadius: 20,
            padding: "16px 48px",
            fontSize: 62,
            fontWeight: 900,
            letterSpacing: 6,
            background: "rgba(255,255,255,0.88)",
            whiteSpace: "nowrap",
          }}
        >
          已安装 ✓
        </div>
      ) : null}

      {/* terminal 小字（幽默注脚） */}
      <div
        style={{
          position: "absolute",
          left: 90,
          bottom: 420,
          minWidth: 540,
          opacity: rowT(0) > 0 ? 1 : 0,
          background: "rgba(27,29,33,0.92)",
          borderRadius: 18,
          padding: "24px 30px",
          fontFamily: MONO_STACK,
        }}
      >
        {rows.map((r, i) => (
          <div
            key={r}
            style={{
              color: i === rows.length - 1 ? accent : "#C8D2DC",
              fontSize: 27,
              lineHeight: 1.65,
              fontWeight: 600,
              whiteSpace: "nowrap",
              opacity: rowT(i),
            }}
          >
            {r.slice(0, Math.floor(rowT(i) * r.length))}
            {rowT(i) < 1 && rowT(i) > 0 ? <span style={{ color: accent }}>▌</span> : null}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default MikaScene06;
