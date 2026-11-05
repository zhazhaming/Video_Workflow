// Scene04 · Cloudflare 验证：隐身浏览器能处理 Turnstile，但不是免死金牌
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";
import { ProgressDots, Watermark } from "../_lib/chrome";
import { clamp01, easeOut, easeInOut, INK, MUTED, LINE, PAPER, SHADOW, CheckIcon, Glyph } from "./ui";

const CODE = [
  "from scrapling.fetchers",
  "import StealthyFetcher",
  "",
  "page = StealthyFetcher.fetch(",
  "    url,",
  "    solve_cloudflare=True",
  ")",
];

const Scene04: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = easeOut(clamp01(p / 0.14));
  const scan = ((p * 2.3) % 1) * 100;
  const solved = clamp01((p - 0.42) / 0.18);
  const pass = clamp01((p - 0.58) / 0.12);
  const codeT = clamp01((p - 0.16) / 0.45);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(155deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <ProgressDots index={3} total={9} accent={accent} light />

      <div style={{ position: "absolute", left: 72, top: 360, right: 72, opacity: enter }}>
        <div style={{ fontSize: 26, color: "#B8462C", fontWeight: 800, letterSpacing: 4 }}>THE WALL</div>
        <div style={{ marginTop: 8, fontSize: 54, fontWeight: 900, color: INK, letterSpacing: 2 }}>遇到 Cloudflare 验证？</div>
      </div>

      {/* 左：验证卡 */}
      <div style={{ position: "absolute", left: 72, top: 610, width: 430, height: 436, borderRadius: 20, background: PAPER, border: "1px solid rgba(23,20,16,0.08)", boxShadow: SHADOW, overflow: "hidden", opacity: enter, transform: `translateY(${(1 - enter) * 26}px)` }}>
        <div style={{ height: 58, background: "#F0EAE0", borderBottom: `1px solid ${LINE}`, display: "flex", alignItems: "center", padding: "0 18px", gap: 8 }}>
          {["#E4695B", "#E7B44E", "#6FBF73"].map((c) => <span key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />)}
          <span style={{ fontFamily: MONO_STACK, fontSize: 19, color: MUTED, marginLeft: 8 }}>protected.example</span>
        </div>
        <div style={{ padding: "28px 26px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 22, background: "#F6821F", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900 }}>CF</div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: INK }}>Checking your browser</div>
              <div style={{ fontSize: 18, color: MUTED, marginTop: 2 }}>Just a moment...</div>
            </div>
          </div>
          <div style={{ marginTop: 34, height: 84, borderRadius: 12, border: `1px solid ${LINE}`, background: "#F7F3EA", display: "flex", alignItems: "center", padding: "0 18px", gap: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, border: `2px solid ${solved > 0.5 ? accent : "rgba(23,20,16,0.3)"}`, background: solved > 0.5 ? accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {solved > 0.5 ? <CheckIcon size={24} color="#fff" /> : null}
            </div>
            <div style={{ fontSize: 22, color: solved > 0.5 ? accent : INK, fontWeight: 700 }}>{solved > 0.5 ? "Verified" : "Verify you are human"}</div>
          </div>
          <div style={{ position: "relative", height: 88, marginTop: 18 }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 18, height: 2, background: "rgba(23,20,16,0.12)" }} />
            <div style={{ position: "absolute", left: `${scan}%`, top: 12, width: 10, height: 14, borderRadius: 3, background: "#F6821F", opacity: 1 - solved, boxShadow: "0 0 14px #F6821F" }} />
            <div style={{ position: "absolute", left: 0, bottom: 0, fontSize: 17, color: MUTED }}>anti-bot challenge · 不是验证码那么简单</div>
          </div>
        </div>
        <div style={{ position: "absolute", left: 26, right: 26, bottom: 20, fontFamily: MONO_STACK, fontSize: 16, color: MUTED, opacity: 0.8 }}>
          官方 README：Turnstile / Interstitial
        </div>
      </div>

      {/* 右：代码卡 */}
      <div style={{ position: "absolute", left: 566, top: 610, width: 442, height: 436, borderRadius: 18, background: "#221E18", boxShadow: SHADOW, padding: "22px 24px", opacity: enter, transform: `translateY(${(1 - enter) * 34}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Glyph kind="shield" size={22} color="#D9C9A8" />
          <span style={{ fontFamily: MONO_STACK, fontSize: 18, color: "rgba(233,222,196,0.7)" }}>stealth.py</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: MONO_STACK, fontSize: 15, color: "#8FBF9F" }}>{solved > 0.5 ? "200 OK" : "challenge"}</span>
        </div>
        {CODE.map((ln, i) => {
          const show = clamp01((codeT - i * 0.08) / 0.12);
          return (
            <div key={i} style={{ fontFamily: MONO_STACK, fontSize: 21, lineHeight: 1.55, whiteSpace: "pre", color: ln.includes("solve") ? "#F0B49E" : ln.includes("Stealthy") ? "#F3D9A4" : "rgba(238,229,208,0.9)", opacity: show, transform: `translateX(${(1 - show) * 10}px)` }}>
              {ln}
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 24, right: 24, bottom: 18, display: "flex", alignItems: "center", gap: 8, opacity: clamp01((p - 0.5) / 0.1) }}>
          <CheckIcon size={20} color="#8FBF9F" />
          <span style={{ fontFamily: MONO_STACK, fontSize: 16, color: "#8FBF9F" }}>fingerprint + browser automation</span>
        </div>
      </div>

      {/* PASS 章 */}
      {pass > 0 ? (
        <div style={{ position: "absolute", left: 252, top: 1046, transform: `rotate(-9deg) scale(${1.55 - 0.55 * easeOut(pass)})`, opacity: pass, border: `6px solid ${accent}`, color: accent, borderRadius: 14, padding: "8px 22px", fontFamily: MONO_STACK, fontSize: 34, fontWeight: 900, letterSpacing: 3, background: "rgba(255,252,244,0.9)" }}>
          PASS
        </div>
      ) : null}

      <div style={{ position: "absolute", left: 72, top: 1100, right: 72, display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderRadius: 14, background: "rgba(184,70,44,0.08)", border: "1.5px solid rgba(184,70,44,0.28)", opacity: clamp01((p - 0.68) / 0.12) }}>
        <Glyph kind="warn" size={30} color="#B8462C" />
        <span style={{ fontSize: 25, color: "#8E321F", fontWeight: 700 }}>能过验证 ≠ 拿到授权：robots、条款、隐私法，一个都不能少</span>
      </div>

      <Watermark text="vibe 知识大赏 · 科普" light />
    </AbsoluteFill>
  );
};

export default Scene04;
