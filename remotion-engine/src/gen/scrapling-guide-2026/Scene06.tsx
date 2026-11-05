// Scene06 · 安装：pip install scrapling 只装解析器，要加 fetchers + install
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";
import { ProgressDots, Watermark } from "../_lib/chrome";
import { clamp01, easeOut, INK, MUTED, LINE, PAPER, SHADOW, CheckIcon, CrossIcon, Glyph } from "./ui";

const Scene06: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = easeOut(clamp01(p / 0.14));
  const wrong = clamp01((p - 0.12) / 0.14);
  const fix = clamp01((p - 0.3) / 0.16);
  const install = clamp01((p - 0.48) / 0.14);
  const ready = clamp01((p - 0.64) / 0.14);
  const cursor = Math.floor((p * 24) % 2) === 0 ? "▌" : " ";

  return (
    <AbsoluteFill style={{ background: `linear-gradient(155deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <ProgressDots index={5} total={9} accent={accent} light />

      <div style={{ position: "absolute", left: 72, top: 356, right: 72, opacity: enter }}>
        <div style={{ fontSize: 26, color: "#B8462C", fontWeight: 800, letterSpacing: 4 }}>THE FIRST TRAP</div>
        <div style={{ marginTop: 8, fontSize: 54, fontWeight: 900, color: INK, letterSpacing: 2 }}>上手三步</div>
        <div style={{ marginTop: 2, fontSize: 54, fontWeight: 900, color: "#B8462C", letterSpacing: 2 }}>第一步就容易错</div>
      </div>

      <div style={{ position: "absolute", left: 72, top: 620, width: 936, height: 500, borderRadius: 18, background: "#221E18", boxShadow: SHADOW, padding: "24px 28px", opacity: enter, transform: `translateY(${(1 - enter) * 28}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Glyph kind="grid" size={22} color="#D9C9A8" />
          <span style={{ fontFamily: MONO_STACK, fontSize: 18, color: "rgba(233,222,196,0.7)" }}>terminal</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: MONO_STACK, fontSize: 16, color: "#8FBF9F" }}>python 3.10+</span>
        </div>

        {/* 错误命令 */}
        <div style={{ opacity: wrong, height: wrong > 0 ? 86 : 0, overflow: "hidden", transition: "none" }}>
          <div style={{ fontFamily: MONO_STACK, fontSize: 23, color: "#F0B49E" }}>
            <span style={{ color: "#8A8578" }}>$ </span>
            <span style={{ textDecoration: "line-through", textDecorationColor: "#B8462C", textDecorationThickness: 3 }}>pip install scrapling</span>
          </div>
          <div style={{ marginTop: 8, fontFamily: MONO_STACK, fontSize: 18, color: "rgba(240,180,158,0.9)" }}>
            ModuleNotFoundError: scrapling.fetchers
          </div>
        </div>

        {/* 正确命令 */}
        <div style={{ marginTop: 12, opacity: fix, transform: `translateY(${(1 - fix) * 12}px)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: MONO_STACK, fontSize: 23, color: "#A9D8B8" }}>
            <CheckIcon size={22} color="#8FBF9F" />
            <span><span style={{ color: "#8A8578" }}>$ </span>pip install "scrapling[fetchers]"</span>
          </div>
        </div>

        <div style={{ marginTop: 18, opacity: install, transform: `translateY(${(1 - install) * 12}px)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: MONO_STACK, fontSize: 23, color: "#A9D8B8" }}>
            <CheckIcon size={22} color="#8FBF9F" />
            <span><span style={{ color: "#8A8578" }}>$ </span>scrapling install</span>
            <span style={{ fontSize: 16, color: "rgba(233,222,196,0.55)", marginLeft: 4 }}>装浏览器</span>
          </div>
        </div>

        <div style={{ marginTop: 18, opacity: ready, transform: `translateY(${(1 - ready) * 12}px)` }}>
          <div style={{ fontFamily: MONO_STACK, fontSize: 21, color: "rgba(238,229,208,0.9)" }}>
            <span style={{ color: "#8A8578" }}>$ </span>python -c "from scrapling.fetchers import Fetcher"
          </div>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <CheckIcon size={18} color="#8FBF9F" />
            <span style={{ fontFamily: MONO_STACK, fontSize: 17, color: "#8FBF9F" }}>import ok · 可以开始抓了</span>
            <span style={{ fontFamily: MONO_STACK, fontSize: 17, color: accent }}>{cursor}</span>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", left: 72, top: 1170, right: 72, display: "flex", gap: 12, opacity: clamp01((p - 0.56) / 0.16) }}>
        {[
          { t: "基础包只有解析器", c: "#B8462C" },
          { t: "fetchers 才带请求/浏览器", c: accent },
          { t: "浏览器包体不小", c: "#8A6A2F" },
        ].map((x) => (
          <div key={x.t} style={{ flex: 1, background: "rgba(255,252,244,0.82)", border: `1px solid ${LINE}`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: x.c }} />
            <span style={{ fontSize: 19, color: INK }}>{x.t}</span>
          </div>
        ))}
      </div>

      <Watermark text="vibe 知识大赏 · 科普" light />
    </AbsoluteFill>
  );
};

export default Scene06;
