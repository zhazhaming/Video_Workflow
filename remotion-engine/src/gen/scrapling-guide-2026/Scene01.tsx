// Scene01 · 钩子：改版即报废 vs 9.6 万星 Scrapling
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";
import { ProgressDots, Watermark } from "../_lib/chrome";
import { clamp01, easeOut, INK, MUTED, LINE, PAPER, SHADOW, WindowFrame, Glyph } from "./ui";

const Star: React.FC<{ size: number; color: string; opacity?: number }> = ({ size, color, opacity = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ opacity }}>
    <path
      fill={color}
      d="M12 2l2.9 6.26 6.85.72-5.1 4.6 1.43 6.73L12 16.9 5.92 20.3l1.43-6.73-5.1-4.6 6.85-.72L12 2z"
    />
  </svg>
);

const Scene01: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = easeOut(clamp01(p / 0.14));
  const starT = easeOut(clamp01((p - 0.03) / 0.24));
  const starCount = Math.round(96088 * starT);
  const stamp = clamp01((p - 0.52) / 0.12);
  const warn = clamp01((p - 0.18) / 0.14);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(155deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <ProgressDots index={0} total={9} accent={accent} light />

      {/* 左：改版后的报错窗口 */}
      <div style={{ position: "absolute", left: 72, top: 368, opacity: enter, transform: `translateY(${(1 - enter) * 24}px)` }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, border: `2px solid #B8462C`, color: "#B8462C", borderRadius: 999, padding: "6px 18px", fontSize: 22, fontWeight: 800, letterSpacing: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: "#B8462C" }} />
          网站改版
        </div>
        <div style={{ marginTop: 18, fontSize: 68, lineHeight: 1.05, fontWeight: 900, color: INK, letterSpacing: 2 }}>
          爬虫
          <br />
          又报废了？
        </div>
        <div style={{ marginTop: 14, fontSize: 24, color: MUTED, letterSpacing: 1 }}>选择器失效 / 结构全变 / 重写一遍</div>
      </div>

      <WindowFrame x={72} y={720} w={430} h={420} title="你的爬虫 · main.py" accent="#B8462C" opacity={enter} scale={0.98 + enter * 0.02}>
        <div style={{ padding: "22px 24px", fontFamily: MONO_STACK, fontSize: 20, lineHeight: 1.65 }}>
          <div style={{ color: MUTED }}>{"page.css('.price')"}</div>
          <div style={{ color: "#B8462C", marginTop: 8 }}>SelectorError: no match</div>
          <div style={{ height: 1, background: LINE, margin: "18px 0" }} />
          {[0.86, 0.62, 0.74, 0.48].map((w, i) => (
            <div key={i} style={{ height: 16, width: `${w * 100}%`, background: "rgba(23,20,16,0.14)", borderRadius: 5, marginBottom: 12 }} />
          ))}
          <div style={{ position: "absolute", left: 24, right: 24, bottom: 18, padding: "12px 14px", borderRadius: 10, background: "rgba(184,70,44,0.1)", border: "1px solid rgba(184,70,44,0.34)", color: "#8E321F", fontSize: 18, opacity: warn }}>
            页面一变，全都得重来
          </div>
        </div>
      </WindowFrame>

      {/* 右：仓库卡 + 星数 */}
      <div
        style={{
          position: "absolute",
          left: 566,
          top: 560,
          width: 442,
          height: 590,
          borderRadius: 22,
          background: PAPER,
          border: "1px solid rgba(23,20,16,0.08)",
          boxShadow: SHADOW,
          opacity: enter,
          transform: `translateY(${(1 - enter) * 38}px) rotate(${(1 - enter) * 2}deg)`,
          padding: "24px 24px",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 21, background: INK, color: "#F4F1E8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900 }}>G</div>
          <div style={{ fontFamily: MONO_STACK, fontSize: 19, color: MUTED }}>github.com/D4Vinci</div>
        </div>
        <div style={{ marginTop: 14, fontSize: 38, fontWeight: 900, color: INK, letterSpacing: 1 }}>Scrapling</div>
        <div style={{ marginTop: 6, fontSize: 22, color: MUTED, lineHeight: 1.5 }}>Effortless Web Scraping<br />for the Modern Web</div>

        <div style={{ marginTop: 26, display: "flex", alignItems: "baseline", gap: 10 }}>
          <Star size={34} color="#C8901F" />
          <span style={{ fontFamily: MONO_STACK, fontSize: 56, fontWeight: 900, color: INK, letterSpacing: 1 }}>{starCount.toLocaleString("en-US")}</span>
          <span style={{ fontSize: 20, color: MUTED }}>stars</span>
        </div>
        <div style={{ marginTop: 6, fontSize: 20, color: MUTED, fontFamily: MONO_STACK }}>Python · BSD-3-Clause</div>

        <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
          {["自适应选择器", "隐身浏览器", "整站 Spider"].map((t) => (
            <span key={t} style={{ fontSize: 19, color: accent, border: `1.5px solid ${accent}66`, background: `${accent}0D`, borderRadius: 999, padding: "6px 12px" }}>{t}</span>
          ))}
        </div>

        {stamp > 0 ? (
          <div
            style={{
              position: "absolute",
              right: 18,
              bottom: 22,
              transform: `rotate(-9deg) scale(${1.55 - 0.55 * easeOut(stamp)})`,
              opacity: stamp,
              border: `5px solid ${accent}`,
              color: accent,
              borderRadius: 12,
              padding: "7px 18px",
              fontFamily: MONO_STACK,
              fontSize: 30,
              fontWeight: 900,
              letterSpacing: 2,
              background: "rgba(255,252,244,0.9)",
            }}
          >
            TRENDING
          </div>
        ) : null}
      </div>

      <div style={{ position: "absolute", left: 72, top: 1220, display: "flex", alignItems: "center", gap: 12, opacity: clamp01((p - 0.3) / 0.16) }}>
        <Glyph kind="shield" size={34} color={accent} />
        <span style={{ fontSize: 25, color: INK, fontWeight: 700 }}>不是换皮，是换底层思路</span>
      </div>

      <Watermark text="vibe 知识大赏 · 科普" light />
    </AbsoluteFill>
  );
};

export default Scene01;
