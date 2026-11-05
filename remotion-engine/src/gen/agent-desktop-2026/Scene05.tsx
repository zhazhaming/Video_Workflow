// Scene05 · 场景二：每天早九点，从后台导报表粘进 Excel（跨软件搬运）
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";
import { ProgressDots, Watermark } from "../_lib/chrome";
import { clamp01, easeOut, INK, MUTED, LINE, PAPER, SHADOW, WindowFrame, CheckIcon, Glyph } from "./ui";

const ROWS = [
  ["11-01", "2,940", "↑ 6.2%"],
  ["11-02", "3,105", "↑ 5.6%"],
  ["11-03", "2,876", "↓ 7.4%"],
  ["11-04", "3,420", "↑ 18.9%"],
];

const Scene05: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const inA = easeOut(clamp01(p / 0.12));
  const fill = clamp01((p - 0.06) / 0.5);
  const sent = clamp01((p - 0.62) / 0.14);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(158deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <ProgressDots index={4} total={9} accent={accent} light />

      {/* 时钟卡 */}
      <div
        style={{
          position: "absolute",
          left: 58,
          top: 430,
          width: 320,
          height: 150,
          borderRadius: 16,
          background: PAPER,
          boxShadow: SHADOW,
          border: "1px solid rgba(23,20,16,0.08)",
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 22px",
          opacity: inA,
          transform: `translateY(${(1 - inA) * 24}px)`,
        }}
      >
        <Glyph kind="clock" size={46} color={accent} />
        <div>
          <div style={{ fontFamily: MONO_STACK, fontSize: 52, fontWeight: 800, color: INK, lineHeight: 1 }}>09:00</div>
          <div style={{ fontSize: 20, color: MUTED, marginTop: 6, letterSpacing: 2 }}>每天都在等这一刻</div>
        </div>
      </div>

      {/* 后台窗口 */}
      <WindowFrame x={58} y={614} w={372} h={470} title="运营后台" accent={accent} opacity={inA} barBg="#EFE9DA">
        <div style={{ padding: "18px 20px" }}>
          {["访客", "下单", "转化率", "退款"].map((k, i) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "16px 0", borderBottom: `1px dashed ${LINE}` }}>
              <span style={{ fontSize: 24, color: MUTED }}>{k}</span>
              <span style={{ fontFamily: MONO_STACK, fontSize: 25, color: INK, fontWeight: 700 }}>{["12,846", "3,420", "26.6%", "18"][i]}</span>
            </div>
          ))}
          <div
            style={{
              marginTop: 22,
              height: 62,
              borderRadius: 10,
              border: `2px solid ${accent}`,
              color: accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: 2,
              background: "rgba(184,70,44,0.08)",
            }}
          >
            导出 CSV
          </div>
        </div>
      </WindowFrame>

      {/* 搬运箭头 */}
      <div style={{ position: "absolute", left: 438, top: 800, opacity: clamp01((p - 0.1) / 0.12) }}>
        <svg width={90} height={110}>
          <path d="M6 14 C 46 14, 46 88, 78 88" fill="none" stroke={accent} strokeWidth={3} strokeDasharray="8 8" />
          <path d="M64 76l16 12-16 12" fill="none" stroke={accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ fontFamily: MONO_STACK, fontSize: 15, color: MUTED, marginTop: 2 }}>copy</div>
      </div>

      {/* Excel 表格 */}
      <div
        style={{
          position: "absolute",
          left: 522,
          top: 614,
          width: 500,
          height: 560,
          borderRadius: 16,
          background: PAPER,
          boxShadow: SHADOW,
          border: "1px solid rgba(23,20,16,0.08)",
          overflow: "hidden",
          opacity: inA,
          transform: `translateY(${(1 - inA) * 30}px)`,
        }}
      >
        <div style={{ height: 54, background: "#EAF0E6", display: "flex", alignItems: "center", padding: "0 18px", gap: 10 }}>
          <Glyph kind="grid" size={22} color="#2C6E49" />
          <div style={{ fontSize: 22, fontWeight: 700, color: "#2C6E49", letterSpacing: 1 }}>日报 11月.xlsx</div>
        </div>
        <div style={{ display: "flex", fontFamily: MONO_STACK, fontSize: 16, color: MUTED, borderBottom: `1px solid ${LINE}` }}>
          {["日期", "GMV", "环比", "状态"].map((h) => (
            <div key={h} style={{ flex: h === "日期" ? 1.1 : 1, padding: "10px 12px" }}>{h}</div>
          ))}
        </div>
        {ROWS.map((r, i) => {
          const t = clamp01((fill - i * 0.18) / 0.22);
          return (
            <div
              key={r[0]}
              style={{
                display: "flex",
                fontFamily: MONO_STACK,
                fontSize: 20,
                color: INK,
                borderBottom: "1px solid rgba(23,20,16,0.06)",
                background: i % 2 ? "rgba(23,20,16,0.025)" : "transparent",
                opacity: 0.2 + 0.8 * t,
                transform: `translateX(${(1 - t) * 24}px)`,
              }}
            >
              <div style={{ flex: 1.1, padding: "16px 12px" }}>{r[0]}</div>
              <div style={{ flex: 1, padding: "16px 12px" }}>{r[1]}</div>
              <div style={{ flex: 1, padding: "16px 12px", color: r[2].includes("↑") ? "#2C6E49" : accent }}>{r[2]}</div>
              <div style={{ flex: 1, padding: "16px 12px" }}>{t > 0.7 ? <CheckIcon size={22} color="#2C6E49" opacity={(t - 0.7) / 0.3} /> : null}</div>
            </div>
          );
        })}
      </div>

      {/* 发群 */}
      <div
        style={{
          position: "absolute",
          left: 640,
          top: 1218,
          display: "flex",
          alignItems: "center",
          gap: 12,
          opacity: sent,
          transform: `translateY(${(1 - sent) * 18}px)`,
        }}
      >
        <div style={{ padding: "10px 18px", borderRadius: 999, background: accent, color: "#FFF7EC", fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>
          已发到部门群
        </div>
        <div style={{ fontSize: 20, color: MUTED }}>8:57</div>
      </div>

      <Watermark text="vibe 知识大赏 · 科普" light />
    </AbsoluteFill>
  );
};

export default Scene05;
