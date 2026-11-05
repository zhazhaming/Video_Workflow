// Scene09 · 收尾收藏卡：是什么 / 怎么用 / 别踩坑
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";
import { ProgressDots, Watermark } from "../_lib/chrome";
import { clamp01, easeOut, INK, MUTED, LINE, PAPER, SHADOW, Glyph } from "./ui";

const RECAP = [
  {
    head: "是什么",
    color: "#B8462C",
    lines: ["自适应选择器：改版后还能找回元素", "请求 / 隐身浏览器 / 解析 / 并发，一个库"],
  },
  {
    head: "怎么用",
    color: "#2C6E49",
    lines: ["pip install \"scrapling[fetchers]\"", "scrapling install → extract 一行抓成 Markdown"],
  },
  {
    head: "别踩坑",
    color: "#8A6A2F",
    lines: ["先看 robots / 条款，别碰隐私数据", "限速、代理、内存都是成本"],
  },
];

const Scene09: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = easeOut(clamp01(p / 0.12));

  return (
    <AbsoluteFill style={{ background: `linear-gradient(155deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <ProgressDots index={8} total={9} accent={accent} light />

      <div style={{ position: "absolute", top: 370, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", opacity: enter }}>
        <Glyph kind="bookmark" size={48} color={accent} />
        <div style={{ fontSize: 54, fontWeight: 900, color: INK, letterSpacing: 3, marginTop: 12 }}>这一屏 值得收藏</div>
        <div style={{ width: 90, height: 4, background: accent, marginTop: 14 }} />
      </div>

      {RECAP.map((r, i) => {
        const t = easeOut(clamp01((p - 0.12 - i * 0.1) / 0.16));
        return (
          <div
            key={r.head}
            style={{
              position: "absolute",
              left: 84,
              top: 620 + i * 196,
              width: 912,
              height: 166,
              borderRadius: 16,
              background: "rgba(255,252,244,0.9)",
              border: `1px solid ${LINE}`,
              boxShadow: SHADOW,
              padding: "18px 24px",
              opacity: t,
              transform: `translateY(${(1 - t) * 22}px)`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 9, height: 9, borderRadius: 5, background: r.color }} />
              <span style={{ fontSize: 23, fontWeight: 800, color: r.color, letterSpacing: 3 }}>{r.head}</span>
            </div>
            {r.lines.map((ln, k) => (
              <div key={ln} style={{ display: "flex", alignItems: "center", gap: 9, marginTop: k === 0 ? 10 : 7 }}>
                <span style={{ width: 14, height: 2, background: r.color, opacity: 0.45, flex: "none" }} />
                <span style={{ fontSize: 23, color: INK, letterSpacing: 0.3 }}>{ln}</span>
              </div>
            ))}
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 84, top: 1238, opacity: clamp01((p - 0.5) / 0.16) }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: accent, letterSpacing: 1 }}>先收藏，评论区报个使用场景</div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 17, color: MUTED, marginTop: 8 }}>D4Vinci/Scrapling · BSD-3 · 96,088 stars（2026-11-05 快照）</div>
      </div>

      <Watermark text="vibe 知识大赏 · 科普" light />
    </AbsoluteFill>
  );
};

export default Scene09;
