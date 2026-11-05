// Scene09 · 收尾收藏卡：整条视频压成一屏（是什么 / 怎么用 / 别踩坑）
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";
import { ProgressDots, Watermark } from "../_lib/chrome";
import { clamp01, easeOut, INK, MUTED, LINE, PAPER, SHADOW, Glyph } from "./ui";

const RECAP = [
  { head: "是什么", color: "#B8462C", lines: ["读系统无障碍树，每个元素一个 ref", "不用截图，不做像素匹配"] },
  { head: "怎么用", color: "#2C4E6B", lines: ["装 → 授权 → snapshot → click", "点完再读一遍，确认了才走"] },
  { head: "别踩坑", color: "#8A6A2F", lines: ["界面变了，ref 立刻作废", "默认 headless，隐私别外发"] },
];

const Scene09: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const inA = easeOut(clamp01(p / 0.12));

  return (
    <AbsoluteFill style={{ background: `linear-gradient(158deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <ProgressDots index={8} total={9} accent={accent} light />

      <div style={{ position: "absolute", top: 420, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", opacity: inA }}>
        <Glyph kind="bookmark" size={52} color={accent} />
        <div style={{ fontSize: 54, fontWeight: 900, color: INK, letterSpacing: 3, marginTop: 14 }}>这一屏 值得收藏</div>
        <div style={{ width: 90, height: 4, background: accent, marginTop: 16 }} />
      </div>

      {RECAP.map((r, i) => {
        const t = easeOut(clamp01((p - 0.14 - i * 0.12) / 0.16));
        return (
          <div
            key={r.head}
            style={{
              position: "absolute",
              left: 84,
              top: 636 + i * 220,
              width: 912,
              height: 190,
              borderRadius: 16,
              background: "rgba(255,252,244,0.9)",
              border: `1px solid ${LINE}`,
              boxShadow: SHADOW,
              padding: "22px 26px",
              opacity: t,
              transform: `translateY(${(1 - t) * 26}px)`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: 5, background: r.color }} />
              <span style={{ fontSize: 24, fontWeight: 800, color: r.color, letterSpacing: 3 }}>{r.head}</span>
            </div>
            {r.lines.map((ln, k) => (
              <div key={ln} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: k === 0 ? 14 : 10 }}>
                <span style={{ width: 16, height: 2, background: r.color, opacity: 0.5 }} />
                <span style={{ fontSize: 26, color: INK, letterSpacing: 0.5 }}>{ln}</span>
              </div>
            ))}
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: 84,
          top: 1322,
          fontFamily: MONO_STACK,
          fontSize: 21,
          color: MUTED,
          opacity: clamp01((p - 0.55) / 0.16) * 0.9,
        }}
      >
        vercel-labs/agent-desktop · Apache-2.0 · 1.4 万 stars
      </div>

      <Watermark text="vibe 知识大赏 · 科普" light />
    </AbsoluteFill>
  );
};

export default Scene09;
