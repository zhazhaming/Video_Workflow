// Scene02 · 手动挡 vs 自动挡：四套工具 vs 一个库
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";
import { ProgressDots, Watermark } from "../_lib/chrome";
import { clamp01, easeOut, INK, MUTED, LINE, PAPER, SHADOW, Glyph, CheckIcon } from "./ui";

const PIECES = [
  { name: "requests", note: "只发请求" },
  { name: "selenium", note: "浏览器重" },
  { name: "BeautifulSoup", note: "只解析" },
  { name: "Scrapy", note: "另一套工程" },
];

const LAYERS = [
  { name: "Fetcher", note: "HTTP / TLS 指纹" },
  { name: "StealthyFetcher", note: "隐身浏览器" },
  { name: "Parser", note: "CSS / XPath / 自适应" },
  { name: "Spider", note: "并发 / 代理 / 续爬" },
];

const Scene02: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = easeOut(clamp01(p / 0.14));
  const stackT = (i: number) => easeOut(clamp01((p - 0.16 - i * 0.06) / 0.16));

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <ProgressDots index={1} total={9} accent={accent} light />

      <div style={{ position: "absolute", left: 72, top: 356, opacity: enter }}>
        <div style={{ fontSize: 26, color: accent, fontWeight: 800, letterSpacing: 4 }}>WHY IT FEELS DIFFERENT</div>
        <div style={{ marginTop: 10, fontSize: 56, fontWeight: 900, color: INK, letterSpacing: 2 }}>普通爬虫是手动挡</div>
        <div style={{ marginTop: 4, fontSize: 56, fontWeight: 900, color: accent, letterSpacing: 2 }}>它是自动挡</div>
      </div>

      {/* 左：四件套 */}
      <div style={{ position: "absolute", left: 72, top: 620, width: 430, height: 470, opacity: enter, transform: `translateY(${(1 - enter) * 24}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ width: 10, height: 10, borderRadius: 5, background: "#B8462C" }} />
          <span style={{ fontSize: 24, color: MUTED, fontWeight: 700, letterSpacing: 2 }}>四套 API，四份作业</span>
        </div>
        {PIECES.map((pc, i) => (
          <div
            key={pc.name}
            style={{
              position: "absolute",
              left: i % 2 === 0 ? 0 : 222,
              top: 52 + Math.floor(i / 2) * 196,
              width: 208,
              height: 176,
              background: PAPER,
              border: `1.5px dashed ${LINE}`,
              borderRadius: 14,
              boxShadow: SHADOW,
              padding: "18px 18px",
              transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (2 + Math.sin(p * 8 + i) * 1.2)}deg)`,
            }}
          >
            <div style={{ fontFamily: MONO_STACK, fontSize: 21, fontWeight: 800, color: INK }}>{pc.name}</div>
            <div style={{ marginTop: 8, fontSize: 20, color: MUTED }}>{pc.note}</div>
            <div style={{ position: "absolute", right: 14, bottom: 12, width: 20, height: 20, borderRadius: 10, border: `2px solid #B8462C`, color: "#B8462C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>×</div>
          </div>
        ))}
      </div>

      {/* 右：一个库 */}
      <div style={{ position: "absolute", left: 566, top: 620, width: 442, height: 470, borderRadius: 20, background: PAPER, border: "1px solid rgba(23,20,16,0.08)", boxShadow: SHADOW, padding: "18px 22px", opacity: enter, transform: `translateY(${(1 - enter) * 34}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: 5, background: accent }} />
          <span style={{ fontFamily: MONO_STACK, fontSize: 20, color: accent, letterSpacing: 2 }}>ONE LIBRARY</span>
          <div style={{ flex: 1 }} />
          <CheckIcon size={24} color={accent} opacity={clamp01((p - 0.48) / 0.12)} />
        </div>
        {LAYERS.map((l, i) => {
          const t = stackT(i);
          return (
            <div
              key={l.name}
              style={{
                position: "absolute",
                left: 22,
                right: 22,
                top: 64 + i * 88,
                height: 74,
                borderRadius: 10,
                background: i === 2 ? `${accent}12` : "#F4EFE3",
                border: `1.5px solid ${i === 2 ? `${accent}55` : LINE}`,
                opacity: t,
                transform: `translateY(${(1 - t) * 34}px)`,
                display: "flex",
                alignItems: "center",
                padding: "0 16px",
                gap: 12,
              }}
            >
              <Glyph kind={i === 0 ? "download" : i === 1 ? "shield" : i === 2 ? "grid" : "loop"} size={28} color={i === 2 ? accent : INK} />
              <div>
                <div style={{ fontFamily: MONO_STACK, fontSize: 21, fontWeight: 800, color: INK }}>{l.name}</div>
                <div style={{ fontSize: 18, color: MUTED, marginTop: 2 }}>{l.note}</div>
              </div>
              {i === 2 ? (
                <div style={{ marginLeft: "auto", fontFamily: MONO_STACK, fontSize: 15, color: accent, border: `1px solid ${accent}66`, borderRadius: 999, padding: "3px 9px" }}>adaptive</div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", left: 72, top: 1218, right: 72, textAlign: "center", fontSize: 24, color: MUTED, letterSpacing: 2, opacity: clamp01((p - 0.52) / 0.16) }}>
        请求、浏览器、解析、并发 —— 一个 import 全包
      </div>

      <Watermark text="vibe 知识大赏 · 科普" light />
    </AbsoluteFill>
  );
};

export default Scene02;
