// Scene08 · 注意事项：条款/隐私、成本、能力边界
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";
import { ProgressDots, Watermark } from "../_lib/chrome";
import { clamp01, easeOut, INK, MUTED, LINE, PAPER, SHADOW, Glyph } from "./ui";

const CAUTIONS = [
  {
    no: "01",
    icon: "shield" as const,
    title: "robots / 条款 / 隐私",
    body: "先看网站规则，别碰个人数据",
    color: "#B8462C",
  },
  {
    no: "02",
    icon: "clock" as const,
    title: "限速 / 代理 / 内存",
    body: "并发不是越大越好，成本会反噬",
    color: "#8A6A2F",
  },
  {
    no: "03",
    icon: "warn" as const,
    title: "能过验证 ≠ 有授权",
    body: "Turnstile 不是免死金牌",
    color: "#2C4E6B",
  },
];

const Scene08: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = easeOut(clamp01(p / 0.14));
  const foot = clamp01((p - 0.6) / 0.16);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(155deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <ProgressDots index={7} total={9} accent={accent} light />

      <div style={{ position: "absolute", left: 72, top: 356, right: 72, opacity: enter }}>
        <div style={{ fontSize: 26, color: "#B8462C", fontWeight: 800, letterSpacing: 4 }}>READ BEFORE YOU CRAWL</div>
        <div style={{ marginTop: 8, fontSize: 54, fontWeight: 900, color: INK, letterSpacing: 2 }}>先别急着爬</div>
        <div style={{ marginTop: 2, fontSize: 54, fontWeight: 900, color: "#B8462C", letterSpacing: 2 }}>三个坑</div>
      </div>

      {CAUTIONS.map((c, i) => {
        const t = easeOut(clamp01((p - 0.14 - i * 0.11) / 0.18));
        return (
          <div
            key={c.no}
            style={{
              position: "absolute",
              left: 72,
              top: 588 + i * 232,
              width: 936,
              height: 206,
              borderRadius: 18,
              background: "rgba(255,252,244,0.9)",
              border: `1px solid ${LINE}`,
              boxShadow: SHADOW,
              opacity: t,
              transform: `translateX(${(1 - t) * 28}px)`,
              display: "flex",
              alignItems: "center",
              padding: "0 26px",
              gap: 22,
              borderLeft: `8px solid ${c.color}`,
            }}
          >
            <div style={{ width: 68, height: 68, borderRadius: 34, background: `${c.color}12`, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <Glyph kind={c.icon} size={36} color={c.color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontFamily: MONO_STACK, fontSize: 18, color: c.color, letterSpacing: 2 }}>{c.no}</span>
                <span style={{ fontSize: 32, fontWeight: 900, color: INK, letterSpacing: 1 }}>{c.title}</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 23, color: MUTED }}>{c.body}</div>
            </div>
            <div style={{ fontFamily: MONO_STACK, fontSize: 16, color: c.color, border: `1px solid ${c.color}55`, borderRadius: 999, padding: "5px 12px" }}>
              {i === 0 ? "COMPLIANCE" : i === 1 ? "COST" : "LIMITS"}
            </div>
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 72, top: 1292, right: 72, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: foot }}>
        <span style={{ fontSize: 26, fontWeight: 800, color: INK, letterSpacing: 1 }}>工具是效率，不是许可证</span>
        <span style={{ fontFamily: MONO_STACK, fontSize: 18, color: MUTED }}>官方 disclaimer：educational & research use</span>
      </div>

      <Watermark text="vibe 知识大赏 · 科普" light />
    </AbsoluteFill>
  );
};

export default Scene08;
