// Scene03 · 老鼠是谁：聊天工作台 mockup——侧边栏 bot 群 + 气泡流 + 打字点（对应 s03 项目定位）
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, rand, mixHex } from "../../dv/atmosphere";
import { easeOut, clamp01, exitFade, INK, LINE, PAPER, SHADOW, Bar } from "./ui";

const Scene03: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const bots = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        tone: i === 1 ? accent : mixHex(c2, INK, 0.18 + rand(seed + i * 5) * 0.3),
        nameW: 70 + rand(seed + i * 5 + 1) * 46,
        subW: 40 + rand(seed + i * 5 + 2) * 34,
      })),
    [seed],
  );
  const pop = (th: number) => easeOut(clamp01((p - th) / 0.18));

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {/* 应用窗口 */}
        <div
          style={{
            position: "absolute",
            left: 140,
            top: 460,
            width: 800,
            height: 930,
            borderRadius: 26,
            background: "#FBF8F1",
            boxShadow: SHADOW,
            border: `1px solid ${LINE}`,
            overflow: "hidden",
            opacity: pop(0),
            transform: `translateY(${(1 - pop(0)) * 36}px) scale(${0.97 + pop(0) * 0.03})`,
          }}
        >
          {/* 标题栏 */}
          <div style={{ height: 64, borderBottom: `1px solid ${LINE}`, display: "flex", alignItems: "center", padding: "0 22px", gap: 10 }}>
            {["#E4695B", "#E7B44E", "#6FBF73"].map((c) => (
              <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c, opacity: 0.9 }} />
            ))}
            <div style={{ marginLeft: 14 }}>
              <Bar w={150} h={14} />
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ width: 44, height: 10, borderRadius: 5, background: accent, opacity: 0.5 }} />
          </div>
          <div style={{ position: "relative", height: 866, display: "flex" }}>
            {/* 侧边栏 bot 群 */}
            <div style={{ width: 210, margin: 18, borderRadius: 18, background: "rgba(20,17,15,0.045)", padding: 16 }}>
              {bots.map((b, i) => {
                const inn = pop(0.08 + i * 0.07);
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "13px 12px",
                      marginBottom: 8,
                      borderRadius: 14,
                      border: i === 1 ? `2px solid ${accent}` : "2px solid transparent",
                      background: i === 1 ? "rgba(200,69,45,0.07)" : "transparent",
                      opacity: inn,
                      transform: `translateX(${(1 - inn) * -22}px)`,
                    }}
                  >
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: b.tone, flexShrink: 0 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <Bar w={b.nameW} h={12} c={i === 1 ? accent : LINE} />
                      <Bar w={b.subW} h={9} />
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, opacity: pop(0.5) }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", border: `2px dashed ${LINE}` }} />
                <Bar w={90} h={11} />
              </div>
            </div>
            {/* 会话区 */}
            <div style={{ flex: 1, position: "relative", padding: "26px 22px" }}>
              {/* 频道头 */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: accent, opacity: 0.8 }} />
                <Bar w={170} h={14} />
              </div>
              {/* 对方气泡 1 */}
              <div style={{ display: "flex", gap: 12, marginBottom: 18, opacity: pop(0.14), transform: `translateY(${(1 - pop(0.14)) * 22}px)` }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: mixHex(c2, INK, 0.25), flexShrink: 0 }} />
                <div style={{ width: 300, height: 92, borderRadius: 18, background: PAPER, border: `1px solid ${LINE}`, padding: "18px 20px" }}>
                  <Bar w={210} h={13} />
                  <div style={{ height: 10 }} />
                  <Bar w={140} h={10} />
                </div>
              </div>
              {/* 对方气泡 2 */}
              <div style={{ display: "flex", gap: 12, marginBottom: 18, opacity: pop(0.32), transform: `translateY(${(1 - pop(0.32)) * 22}px)` }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: mixHex(c2, INK, 0.4), flexShrink: 0 }} />
                <div style={{ width: 336, height: 118, borderRadius: 18, background: PAPER, border: `1px solid ${LINE}`, padding: "18px 20px" }}>
                  <Bar w={250} h={13} />
                  <div style={{ height: 10 }} />
                  <Bar w={180} h={10} />
                  <div style={{ height: 10 }} />
                  <Bar w={120} h={10} />
                </div>
              </div>
              {/* 用户气泡（accent） */}
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginBottom: 18, opacity: pop(0.52), transform: `translateY(${(1 - pop(0.52)) * 22}px)` }}>
                <div style={{ width: 290, height: 92, borderRadius: 18, background: accent, padding: "18px 20px" }}>
                  <Bar w={200} h={13} c="rgba(255,251,244,0.9)" />
                  <div style={{ height: 10 }} />
                  <Bar w={130} h={10} c="rgba(255,251,244,0.55)" />
                </div>
              </div>
              {/* 打字中 */}
              <div style={{ display: "flex", gap: 12, alignItems: "center", opacity: pop(0.7) }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: mixHex(c2, INK, 0.25), flexShrink: 0 }} />
                <div style={{ width: 140, height: 78, borderRadius: 18, background: PAPER, border: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: i === 0 ? accent : LINE,
                        transform: `translateY(${Math.sin(p * Math.PI * 2 * 2.2 + i * 0.9) * 8}px)`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* 窗外浮尘 */}
        {Array.from({ length: 10 }, (_, k) => (
          <span
            key={k}
            style={{
              position: "absolute",
              left: 60 + rand(seed + k * 7 + 90) * 960,
              top: 300 + rand(seed + k * 7 + 91) * 1300,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: k % 2 ? accent : mixHex(INK, c1, 0.72),
              opacity: 0.22 + 0.16 * Math.sin(p * Math.PI * 2 + k),
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default Scene03;
