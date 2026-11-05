// Scene05 · 整站 Spider：并发、代理轮换、断点续爬、导出
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";
import { ProgressDots, Watermark } from "../_lib/chrome";
import { clamp01, easeOut, INK, MUTED, LINE, PAPER, SHADOW, Glyph } from "./ui";

const NODES = [
  { label: "shop", x: 838, y: 660 },
  { label: "blog", x: 872, y: 860 },
  { label: "api", x: 810, y: 1060 },
  { label: "rss", x: 242, y: 660 },
  { label: "sitemap", x: 208, y: 860 },
  { label: "proxy", x: 270, y: 1060 },
];

const Scene05: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = easeOut(clamp01(p / 0.14));
  const sys = clamp01((p - 0.18) / 0.38);
  const exports = clamp01((p - 0.68) / 0.14);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(155deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <ProgressDots index={4} total={9} accent={accent} light />

      <div style={{ position: "absolute", left: 72, top: 356, opacity: enter }}>
        <div style={{ fontSize: 26, color: accent, fontWeight: 800, letterSpacing: 4 }}>FULL-SCALE CRAWL</div>
        <div style={{ marginTop: 8, fontSize: 54, fontWeight: 900, color: INK, letterSpacing: 2 }}>要爬整站</div>
        <div style={{ marginTop: 2, fontSize: 54, fontWeight: 900, color: accent, letterSpacing: 2 }}>不用自己造轮子</div>
      </div>

      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        {NODES.map((n, i) => {
          const t = clamp01((p - 0.16 - i * 0.03) / 0.18);
          const cx = 540;
          const cy = 866;
          const mx = (cx + n.x) / 2 + (i % 2 === 0 ? 40 : -40);
          const my = (cy + n.y) / 2;
          return (
            <g key={n.label} opacity={t}>
              <path d={`M ${cx} ${cy} Q ${mx} ${my} ${n.x} ${n.y}`} fill="none" stroke={accent} strokeOpacity={0.33} strokeWidth={2.5} strokeDasharray="5 9" />
              <circle cx={cx + (n.x - cx) * (0.2 + 0.65 * ((sys * 1.6 + i * 0.12) % 1))} cy={cy + (n.y - cy) * (0.2 + 0.65 * ((sys * 1.6 + i * 0.12) % 1))} r={4} fill={accent} opacity={0.7 * sys} />
            </g>
          );
        })}
      </svg>

      {/* 中心 Spider */}
      <div style={{ position: "absolute", left: 540 - 120, top: 866 - 58, width: 240, height: 116, borderRadius: 20, background: PAPER, border: `2px solid ${accent}`, boxShadow: SHADOW, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: enter, transform: `scale(${0.92 + enter * 0.08})` }}>
        <Glyph kind="loop" size={32} color={accent} />
        <div style={{ fontFamily: MONO_STACK, fontSize: 23, fontWeight: 900, color: INK, marginTop: 4 }}>Spider</div>
        <div style={{ fontSize: 16, color: MUTED }}>concurrent_requests = 10</div>
      </div>

      {/* URL 节点 */}
      {NODES.map((n, i) => {
        const t = easeOut(clamp01((p - 0.24 - i * 0.035) / 0.16));
        return (
          <div
            key={n.label}
            style={{
              position: "absolute",
              left: n.x - 64,
              top: n.y - 28,
              width: 128,
              height: 56,
              borderRadius: 12,
              background: "rgba(255,252,244,0.92)",
              border: `1.5px solid ${LINE}`,
              boxShadow: SHADOW,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: MONO_STACK,
              fontSize: 20,
              color: INK,
              opacity: t,
              transform: `translateY(${(1 - t) * 16}px)`,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: 4, background: accent, marginRight: 8 }} />
            {n.label}
          </div>
        );
      })}

      {/* 能力条 */}
      <div style={{ position: "absolute", left: 72, top: 1178, right: 72, display: "flex", gap: 12, opacity: clamp01((p - 0.42) / 0.16) }}>
        {[
          { icon: "loop" as const, t: "代理轮换", s: "ProxyRotator" },
          { icon: "clock" as const, t: "断点续爬", s: "crawldir" },
          { icon: "grid" as const, t: "流式输出", s: "stream()" },
        ].map((b) => (
          <div key={b.t} style={{ flex: 1, background: "rgba(255,252,244,0.8)", border: `1px solid ${LINE}`, borderRadius: 12, padding: "12px 12px", display: "flex", alignItems: "center", gap: 9 }}>
            <Glyph kind={b.icon} size={25} color={accent} />
            <div>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>{b.t}</div>
              <div style={{ fontFamily: MONO_STACK, fontSize: 15, color: MUTED }}>{b.s}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", left: 72, top: 1298, display: "flex", alignItems: "center", gap: 10, opacity: exports }}>
        <span style={{ fontSize: 21, color: MUTED }}>结果直接导出</span>
        {["JSON", "CSV", "JSONL", "XML"].map((t, i) => (
          <span key={t} style={{ fontFamily: MONO_STACK, fontSize: 18, color: i === 0 ? "#FFF9EE" : INK, background: i === 0 ? accent : "rgba(255,252,244,0.85)", border: `1px solid ${i === 0 ? accent : LINE}`, borderRadius: 8, padding: "5px 10px", transform: `translateY(${(1 - exports) * 8}px)` }}>{t}</span>
        ))}
      </div>

      <Watermark text="vibe 知识大赏 · 科普" light />
    </AbsoluteFill>
  );
};

export default Scene05;
