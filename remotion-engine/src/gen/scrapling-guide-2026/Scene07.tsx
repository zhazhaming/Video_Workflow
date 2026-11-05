// Scene07 · 一行命令变 Markdown + 应用场景
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";
import { ProgressDots, Watermark } from "../_lib/chrome";
import { clamp01, easeOut, INK, MUTED, LINE, PAPER, SHADOW, Glyph, CheckIcon } from "./ui";

const MD_LINES = [
  "# Quotes to Scrape",
  "",
  "> “The world as we have created it...”",
  "",
  "## Albert Einstein",
  "- tags: change, deep-thoughts",
  "- author: Albert Einstein",
  "",
  "## J.K. Rowling",
  "- tags: abilities, choices",
];

const Scene07: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = easeOut(clamp01(p / 0.14));
  const typeT = clamp01((p - 0.12) / 0.36);
  const docT = easeOut(clamp01((p - 0.38) / 0.22));
  const uses = clamp01((p - 0.62) / 0.16);
  const cmd1 = "scrapling extract get https://quotes.toscrape.com/ quotes.md";
  const cmd2 = "scrapling extract get https://quotes.toscrape.com/ quotes.md --css-selector .quote";
  const shown = Math.floor(typeT * cmd1.length);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(155deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <ProgressDots index={6} total={9} accent={accent} light />

      <div style={{ position: "absolute", left: 72, top: 356, right: 72, opacity: enter }}>
        <div style={{ fontSize: 26, color: accent, fontWeight: 800, letterSpacing: 4 }}>NO CODE, STILL WORKS</div>
        <div style={{ marginTop: 8, fontSize: 54, fontWeight: 900, color: INK, letterSpacing: 2 }}>一行命令</div>
        <div style={{ marginTop: 2, fontSize: 54, fontWeight: 900, color: accent, letterSpacing: 2 }}>网页变 Markdown</div>
      </div>

      {/* 终端 */}
      <div style={{ position: "absolute", left: 72, top: 620, width: 470, height: 456, borderRadius: 18, background: "#221E18", boxShadow: SHADOW, padding: "22px 22px", opacity: enter, transform: `translateY(${(1 - enter) * 24}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Glyph kind="grid" size={20} color="#D9C9A8" />
          <span style={{ fontFamily: MONO_STACK, fontSize: 17, color: "rgba(233,222,196,0.7)" }}>terminal</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: MONO_STACK, fontSize: 15, color: "#8FBF9F" }}>extract</span>
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 19, lineHeight: 1.55, color: "#A9D8B8", wordBreak: "break-all" }}>
          <span style={{ color: "#8A8578" }}>$ </span>
          {cmd1.slice(0, shown)}
          {shown < cmd1.length ? <span style={{ color: accent }}>▌</span> : null}
        </div>
        <div style={{ marginTop: 18, opacity: clamp01((p - 0.52) / 0.12) }}>
          <div style={{ fontFamily: MONO_STACK, fontSize: 17, lineHeight: 1.55, color: "rgba(238,229,208,0.7)", wordBreak: "break-all" }}>
            <span style={{ color: "#8A8578" }}>$ </span>{cmd2}
          </div>
          <div style={{ marginTop: 12, fontFamily: MONO_STACK, fontSize: 15, color: "rgba(233,222,196,0.5)" }}>--css-selector  /  --solve-cloudflare  /  --wait-selector</div>
        </div>
        <div style={{ position: "absolute", left: 22, right: 22, bottom: 18, fontFamily: MONO_STACK, fontSize: 15, color: "rgba(233,222,196,0.45)" }}>
          optional: pip install "scrapling[shell]"
        </div>
      </div>

      {/* Markdown 文档 */}
      <div style={{ position: "absolute", left: 566, top: 620, width: 442, height: 456, borderRadius: 18, background: PAPER, border: "1px solid rgba(23,20,16,0.08)", boxShadow: SHADOW, padding: "18px 22px", opacity: docT, transform: `translateX(${(1 - docT) * 34}px) rotate(${(1 - docT) * 2}deg)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 30, height: 38, borderRadius: 5, background: accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900 }}>MD</div>
          <span style={{ fontFamily: MONO_STACK, fontSize: 18, color: INK }}>quotes.md</span>
          <div style={{ flex: 1 }} />
          <CheckIcon size={20} color={accent} opacity={clamp01((p - 0.55) / 0.1)} />
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 17, lineHeight: 1.5, color: INK, whiteSpace: "pre-wrap" }}>
          {MD_LINES.map((ln, i) => {
            const t = clamp01((p - 0.4 - i * 0.025) / 0.1);
            return (
              <div key={i} style={{ opacity: 0.3 + 0.7 * t, color: ln.startsWith("#") ? accent : ln.startsWith(">") ? MUTED : INK }}>
                {ln || " "}
              </div>
            );
          })}
        </div>
      </div>

      {/* 应用场景 */}
      <div style={{ position: "absolute", left: 72, top: 1142, right: 72, display: "flex", gap: 10, opacity: uses, transform: `translateY(${(1 - uses) * 14}px)` }}>
        {["比价", "监控", "数据集", "喂给 AI"].map((t, i) => (
          <div key={t} style={{ flex: 1, borderRadius: 12, background: i === 3 ? `${accent}14` : "rgba(255,252,244,0.82)", border: `1.5px solid ${i === 3 ? `${accent}55` : LINE}`, padding: "12px 8px", textAlign: "center", fontSize: 21, fontWeight: 800, color: i === 3 ? accent : INK }}>{t}</div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 72, top: 1228, right: 72, textAlign: "center", fontSize: 19, color: MUTED, letterSpacing: 1, opacity: uses }}>
        整站 → Markdown 语料 → RAG / 检索 / 分析
      </div>

      <Watermark text="vibe 知识大赏 · 科普" light />
    </AbsoluteFill>
  );
};

export default Scene07;
