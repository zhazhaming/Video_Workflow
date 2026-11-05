// Scene07 · 三步上手：装/授权 → 拍快照 → 交给 agent 循环（上方叠 terminal 浮层给真实命令）
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";
import { ProgressDots, Watermark } from "../_lib/chrome";
import { clamp01, easeOut, INK, MUTED, LINE, PAPER, SHADOW, Glyph } from "./ui";

const STEPS = [
  { t: "装好 · 给权限", d: "辅助功能 / 屏幕录制", icon: "download" as const, code: "status" },
  { t: "拍一张快照", d: "每个元素拿到 ref", icon: "camera" as const, code: "snapshot" },
  { t: "交给你的 agent", d: "点一下 再读一遍", icon: "loop" as const, code: "click → verify" },
];

const Scene07: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const inA = easeOut(clamp01(p / 0.12));

  return (
    <AbsoluteFill style={{ background: `linear-gradient(158deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <ProgressDots index={6} total={9} accent={accent} light />

      {STEPS.map((s, i) => {
        const t = easeOut(clamp01((p - 0.05 - i * 0.08) / 0.14));
        const activeIndex = p < 0.36 ? 0 : p < 0.68 ? 1 : 2;
        const active = i === activeIndex;
        const top = 792 + i * 176;
        return (
          <div
            key={s.t}
            style={{
              position: "absolute",
              left: 92,
              top,
              width: 900,
              height: 148,
              borderRadius: 18,
              background: active ? "rgba(255,252,244,0.96)" : "rgba(255,252,244,0.72)",
              border: `1.5px solid ${active ? accent : LINE}`,
              boxShadow: active ? SHADOW : "0 8px 20px rgba(23,20,16,0.06)",
              display: "flex",
              alignItems: "center",
              padding: "0 26px",
              gap: 22,
              opacity: t,
              transform: `translateX(${(1 - t) * 40}px)`,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                background: active ? accent : "rgba(23,20,16,0.08)",
                color: active ? "#FFF7EC" : MUTED,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: MONO_STACK,
                fontSize: 30,
                fontWeight: 800,
              }}
            >
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 34, fontWeight: 800, color: INK, letterSpacing: 1 }}>{s.t}</div>
              <div style={{ fontSize: 22, color: MUTED, marginTop: 6 }}>{s.d}</div>
            </div>
            <div style={{ opacity: 0.9 }}>
              <Glyph kind={s.icon} size={46} color={active ? accent : MUTED} />
            </div>
            <div
              style={{
                fontFamily: MONO_STACK,
                fontSize: 17,
                color: active ? accent : MUTED,
                border: `1px dashed ${active ? accent : LINE}`,
                borderRadius: 8,
                padding: "6px 10px",
                whiteSpace: "nowrap",
              }}
            >
              {s.code}
            </div>
          </div>
        );
      })}

      {/* 连接虚线 */}
      <div style={{ position: "absolute", left: 124, top: 940, width: 3, height: 352, background: `repeating-linear-gradient(${accent} 0 8px, transparent 8px 18px)`, opacity: 0.35 }} />

      <div style={{ position: "absolute", left: 92, top: 1310, fontFamily: MONO_STACK, fontSize: 20, color: MUTED, opacity: clamp01((p - 0.55) / 0.2) * 0.9 }}>
        真实命令见上方终端 · 全部是一条条 JSON
      </div>

      <Watermark text="vibe 知识大赏 · 科普" light />
    </AbsoluteFill>
  );
};

export default Scene07;
