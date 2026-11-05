// Scene03 · 自适应选择器：改版前 → 改版后，元素还能被找回来
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";
import { ProgressDots, Watermark } from "../_lib/chrome";
import { clamp01, easeOut, INK, MUTED, LINE, PAPER, SHADOW, WindowFrame } from "./ui";

const Row: React.FC<{ w: number; dim?: boolean; moved?: boolean }> = ({ w, dim, moved }) => (
  <div style={{ height: 18, width: `${w}%`, borderRadius: 5, background: moved ? "rgba(26,107,74,0.22)" : "rgba(23,20,16,0.12)", marginBottom: 15, marginLeft: dim ? 18 : 0 }} />
);

const PriceNode: React.FC<{ accent: string; active: number; moved?: boolean }> = ({ accent, active, moved }) => (
  <div
    style={{
      position: "absolute",
      left: moved ? 118 : 36,
      top: moved ? 232 : 178,
      width: 206,
      height: 62,
      borderRadius: 10,
      border: `2.5px solid ${accent}`,
      background: `${accent}12`,
      boxShadow: `0 0 ${18 + active * 22}px ${accent}44`,
      display: "flex",
      alignItems: "center",
      padding: "0 12px",
      gap: 10,
      transform: `scale(${1 + active * 0.04})`,
    }}
  >
    <span style={{ width: 8, height: 8, borderRadius: 4, background: accent }} />
    <span style={{ fontFamily: MONO_STACK, fontSize: 20, color: INK, fontWeight: 800 }}>¥ 299</span>
    <span style={{ fontFamily: MONO_STACK, fontSize: 15, color: accent, marginLeft: "auto" }}>.price</span>
  </div>
);

const Scene03: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = easeOut(clamp01(p / 0.14));
  const find = easeOut(clamp01((p - 0.34) / 0.3));
  const moved = find > 0.1;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(155deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <ProgressDots index={2} total={9} accent={accent} light />

      <div style={{ position: "absolute", left: 72, top: 360, right: 72, opacity: enter }}>
        <div style={{ fontSize: 26, color: accent, fontWeight: 800, letterSpacing: 4 }}>THE KILLER FEATURE</div>
        <div style={{ marginTop: 8, fontSize: 56, fontWeight: 900, color: INK, letterSpacing: 2 }}>网站结构变了</div>
        <div style={{ marginTop: 2, fontSize: 56, fontWeight: 900, color: accent, letterSpacing: 2 }}>它还能找回元素</div>
      </div>

      <WindowFrame x={72} y={640} w={430} h={460} title="改版前" accent={accent} opacity={enter}>
        <div style={{ padding: "22px 22px" }}>
          <div style={{ fontFamily: MONO_STACK, fontSize: 17, color: MUTED, marginBottom: 14 }}>shop.example / product</div>
          <div style={{ height: 30, width: "58%", borderRadius: 6, background: "rgba(23,20,16,0.12)", marginBottom: 22 }} />
          <Row w={92} />
          <Row w={70} />
          <PriceNode accent={accent} active={0.6} />
          <div style={{ position: "absolute", left: 22, right: 22, top: 320 }}>
            <Row w={84} dim />
            <Row w={62} dim />
            <Row w={74} dim />
          </div>
        </div>
      </WindowFrame>

      <WindowFrame x={566} y={640} w={442} h={460} title="改版后 v2" accent={accent} opacity={enter}>
        <div style={{ padding: "22px 22px" }}>
          <div style={{ fontFamily: MONO_STACK, fontSize: 17, color: MUTED, marginBottom: 14 }}>shop.example / new layout</div>
          <div style={{ height: 96, borderRadius: 10, background: "rgba(26,107,74,0.06)", border: `1px dashed ${accent}44`, marginBottom: 18 }} />
          <Row w={78} />
          <Row w={54} />
          <div style={{ height: 26 }} />
          <PriceNode accent={accent} active={find} moved />
          <div style={{ position: "absolute", left: 22, right: 22, top: 338 }}>
            <Row w={90} dim />
            <Row w={58} dim />
          </div>
        </div>
      </WindowFrame>

      {/* 相似度连线 */}
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, opacity: clamp01((p - 0.28) / 0.16) }}>
        <path
          d="M 310 900 C 420 820, 480 980, 650 1010"
          fill="none"
          stroke={accent}
          strokeWidth={3}
          strokeDasharray="7 10"
          strokeDashoffset={(1 - find) * 120}
          opacity={0.7}
        />
        <circle cx={310} cy={900} r={7} fill={accent} opacity={0.8} />
        <circle cx={650} cy={1010} r={7 + find * 6} fill={accent} opacity={0.8} />
      </svg>

      <div style={{ position: "absolute", left: 566, top: 1118, width: 442, display: "flex", alignItems: "center", gap: 10, opacity: clamp01((p - 0.52) / 0.14) }}>
        <span style={{ fontFamily: MONO_STACK, fontSize: 22, color: accent, border: `1.5px solid ${accent}66`, borderRadius: 999, padding: "6px 14px" }}>similarity 0.92</span>
        <span style={{ fontSize: 21, color: MUTED }}>相似度找回，不是写死坐标</span>
      </div>

      <div style={{ position: "absolute", left: 72, top: 1168, display: "flex", gap: 10, opacity: clamp01((p - 0.4) / 0.16) }}>
        {["CSS", "XPath", "文本", "正则"].map((t) => (
          <span key={t} style={{ fontFamily: MONO_STACK, fontSize: 19, color: INK, background: "rgba(255,252,244,0.78)", border: `1px solid ${LINE}`, borderRadius: 999, padding: "5px 12px" }}>{t}</span>
        ))}
      </div>

      <Watermark text="vibe 知识大赏 · 科普" light />
    </AbsoluteFill>
  );
};

export default Scene03;
