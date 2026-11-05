// Scene08 · 三个坑：ref 会作废 / 默认不动鼠标 / 快照带隐私
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";
import { ProgressDots, Watermark } from "../_lib/chrome";
import { clamp01, easeOut, INK, MUTED, LINE, PAPER, SHADOW, Glyph } from "./ui";

const PITS = [
  { no: "坑一", t: "界面一变，ref 就作废", d: "STALE_REF · AMBIGUOUS_TARGET → 重拍快照", icon: "warn" as const },
  { no: "坑二", t: "默认不动你的鼠标", d: "要真的物理点击，得显式加 --headed", icon: "grid" as const },
  { no: "坑三", t: "快照会带着你的隐私", d: "snapshot / 剪贴板 别往公开日志里发", icon: "shield" as const },
];

const Scene08: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const inA = easeOut(clamp01(p / 0.1));

  return (
    <AbsoluteFill style={{ background: `linear-gradient(158deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <ProgressDots index={7} total={9} accent={accent} light />

      {PITS.map((pit, i) => {
        const t = easeOut(clamp01((p - 0.02 - i * 0.08) / 0.1));
        const top = 462 + i * 246;
        const live = (p < 0.34 ? 0 : p < 0.66 ? 1 : 2) === i;
        return (
          <div
            key={pit.no}
            style={{
              position: "absolute",
              left: 76,
              top,
              width: 928,
              height: 214,
              borderRadius: 18,
              background: PAPER,
              border: `2.5px solid ${live ? accent : "rgba(23,20,16,0.10)"}`,
              boxShadow: live ? "0 24px 58px rgba(184,70,44,0.18), 0 3px 10px rgba(23,20,16,0.08)" : SHADOW,
              display: "flex",
              alignItems: "center",
              padding: "0 30px 0 0",
              opacity: t,
              transform: `translateY(${(1 - t) * 34}px) scale(${live ? 1.015 : 1})`,
              overflow: "hidden",
            }}
          >
            <div style={{ width: 10, height: "100%", background: accent, opacity: 0.9 }} />
            <div style={{ padding: "0 26px", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontFamily: MONO_STACK, fontSize: 18, color: "#FFF7EC", background: accent, borderRadius: 6, padding: "3px 10px", letterSpacing: 1 }}>
                  {pit.no}
                </span>
                <span style={{ fontSize: 22, color: MUTED, letterSpacing: 2 }}>避坑</span>
              </div>
              <div style={{ fontSize: 40, fontWeight: 800, color: INK, marginTop: 12, letterSpacing: 1 }}>{pit.t}</div>
              <div style={{ fontFamily: pit.d.includes("STALE") || pit.d.includes("headed") ? MONO_STACK : FONT_STACK, fontSize: 22, color: MUTED, marginTop: 8 }}>
                {pit.d}
              </div>
            </div>
            <Glyph kind={pit.icon} size={56} color={accent} opacity={0.9} />
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 76, top: 1236, opacity: clamp01((p - 0.6) / 0.14) }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 22, color: accent, letterSpacing: 1 }}>
          rule: 只看 error.disposition.retry，safe 才重试
        </div>
        <div style={{ fontSize: 21, color: MUTED, marginTop: 10 }}>点两次提交按钮，是会重复提单的</div>
      </div>

      <Watermark text="vibe 知识大赏 · 科普" light />
    </AbsoluteFill>
  );
};

export default Scene08;
