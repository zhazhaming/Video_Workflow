// Scene08 · 收尾：AI 的“稍后补测试”被红笔划掉，评论区气泡冒出来
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { MONO_STACK, FONT_STACK } from "../../dv/atmosphere";
import { Paper, Cap, Hair, INK, INK_SOFT, FAINT, RED, GOLD, SERIF_STACK, seg, eo, eio, pop, clamp01 } from "../autoloop-2026/ui";

const ACCENT = "#C8452D";
const COMMENTS = ["太真实了", "天天遇到", "救命 +1", "我也是"];

const Scene08: React.FC<GenSceneProps> = ({ p, c1, c2, seed }) => {
  const strike = eo(seg(p, 0.22, 0.5));
  const ask = pop(seg(p, 0.5, 0.64));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={ACCENT} />
      <Cap text="08 / YOUR TURN" x={150} y={392} />
      <Cap text="THE END" x={930} y={392} align="right" color={FAINT} />
      <Hair x={150} y={430} w={240} color={ACCENT} thickness={2} progress={eo(seg(p, 0.04, 0.3))} opacity={0.75} />

      {/* AI 气泡 */}
      <div
        style={{
          position: "absolute", left: 540 - 330, top: 700, width: 660,
          background: "rgba(253,250,244,0.98)",
          border: `1.5px solid ${INK}22`, borderRadius: 18,
          boxShadow: `0 22px 44px ${INK}18`,
          padding: "26px 30px", boxSizing: "border-box",
          opacity: eo(seg(p, 0.04, 0.16)),
          transform: `translateY(${(1 - eo(seg(p, 0.04, 0.16))) * 18}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: INK, position: "relative" }}>
            <div style={{ position: "absolute", left: 8, top: 12, width: 6, height: 6, borderRadius: 3, background: "#FBF7EF" }} />
            <div style={{ position: "absolute", right: 8, top: 12, width: 6, height: 6, borderRadius: 3, background: "#FBF7EF" }} />
          </div>
          <div style={{ fontFamily: MONO_STACK, fontSize: 17, letterSpacing: 3, color: FAINT }}>AI</div>
        </div>
        <div style={{ marginTop: 16, fontFamily: SERIF_STACK, fontSize: 46, fontWeight: 700, color: INK }}>测试我稍后补</div>
        <div style={{ marginTop: 10, fontFamily: FONT_STACK, fontSize: 19, color: INK_SOFT }}>—— 然后就再也没有然后了</div>
      </div>

      {/* 红笔划线 */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <path
          d="M250 840 C 380 808, 560 876, 812 828"
          fill="none"
          stroke={ACCENT}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray="640"
          strokeDashoffset={640 * (1 - strike)}
        />
      </svg>

      {/* 问号 */}
      <div
        style={{
          position: "absolute", left: 90, top: 1050,
          fontFamily: SERIF_STACK, fontSize: 200, fontWeight: 700, color: `${INK}14`,
          transform: `scale(${0.9 + 0.1 * ask}) rotate(-6deg)`,
          opacity: ask,
        }}
      >
        ?
      </div>

      {/* 评论气泡 */}
      {COMMENTS.map((c, i) => {
        const t = pop(seg(p, 0.5 + i * 0.09, 0.62 + i * 0.09));
        const x = 150 + (i % 2) * 300 + (i > 1 ? 60 : 0);
        const y = 1130 + i * 96;
        return (
          <div
            key={c}
            style={{
              position: "absolute", left: x, top: y, minWidth: 210,
              padding: "14px 22px", boxSizing: "border-box",
              background: i === 1 ? ACCENT : "rgba(251,247,239,0.95)",
              color: i === 1 ? "#FBF7EF" : INK,
              border: `1.5px solid ${i === 1 ? ACCENT : `${INK}22`}`,
              borderRadius: 999,
              fontFamily: FONT_STACK, fontSize: 22, fontWeight: 700,
              opacity: t,
              transform: `translateY(${(1 - t) * 26}px) scale(${0.92 + 0.08 * t})`,
            }}
          >
            {c}
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 150, bottom: 470, fontFamily: FONT_STACK, fontSize: 24, color: INK_SOFT, opacity: eo(seg(p, 0.66, 0.82)) }}>
        你被 AI 的“稍后补”坑过吗
      </div>
    </AbsoluteFill>
  );
};

export default Scene08;
