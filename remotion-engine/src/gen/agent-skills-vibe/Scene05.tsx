// Scene05 · 搜索项目名：输入 agent skills，结果卡弹出，星数翻牌
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { MONO_STACK, FONT_STACK } from "../../dv/atmosphere";
import { Paper, Cap, Hair, INK, INK_SOFT, FAINT, RED, GOLD, SERIF_STACK, seg, eo, eio, pop, clamp01 } from "../autoloop-2026/ui";

const ACCENT = "#C8452D";
const TYPED = "agent skills";

const Scene05: React.FC<GenSceneProps> = ({ p, c1, c2 }) => {
  const n = Math.floor(TYPED.length * seg(p, 0.06, 0.4));
  const caret = Math.sin(p * 34) > 0 ? 1 : 0;
  const open = eo(seg(p, 0.46, 0.66));
  const starT = eo(seg(p, 0.58, 0.84));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={ACCENT} />
      <Cap text="05 / FIND IT" x={150} y={392} />
      <Cap text="GITHUB SEARCH" x={930} y={392} align="right" color={FAINT} />
      <Hair x={150} y={430} w={240} color={ACCENT} thickness={2} progress={eo(seg(p, 0.04, 0.3))} opacity={0.75} />

      {/* 搜索框 */}
      <div
        style={{
          position: "absolute", left: 190, top: 650, width: 700, height: 112,
          background: "rgba(253,250,244,0.98)",
          border: `2px solid ${INK}`, borderRadius: 14,
          boxShadow: `0 18px 40px ${INK}18`,
          opacity: eo(seg(p, 0.02, 0.14)),
          transform: `translateY(${(1 - eo(seg(p, 0.02, 0.14))) * 20}px)`,
        }}
      >
        <svg width={40} height={40} style={{ position: "absolute", left: 28, top: 34 }}>
          <circle cx={15} cy={15} r={10} fill="none" stroke={INK} strokeWidth={3} />
          <line x1={23} y1={23} x2={33} y2={33} stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", left: 84, top: 30, fontFamily: MONO_STACK, fontSize: 42, color: INK, letterSpacing: 1 }}>
          {TYPED.slice(0, n)}
          <span style={{ opacity: caret, borderLeft: `3px solid ${ACCENT}`, marginLeft: 2 }} />
        </div>
        <div style={{ position: "absolute", right: 24, top: 36, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 3, color: FAINT }}>⌘K</div>
      </div>

      {/* 结果卡 */}
      <div
        style={{
          position: "absolute", left: 190, top: 792, width: 700, height: 300,
          transformOrigin: "top center",
          transform: `scaleY(${0.4 + 0.6 * open}) translateY(${(1 - open) * -16}px)`,
          opacity: open,
          background: "rgba(253,250,244,0.99)",
          border: `1px solid ${INK}22`, borderRadius: 14,
          boxShadow: `0 26px 52px ${INK}1C`,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: 6, height: 300, background: ACCENT }} />
        <div style={{ position: "absolute", left: 34, top: 30, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 4, color: FAINT }}>REPOSITORY</div>
        <div style={{ position: "absolute", left: 34, top: 58, fontFamily: MONO_STACK, fontSize: 44, fontWeight: 700, color: INK, letterSpacing: -1 }}>agent-skills</div>
        <div style={{ position: "absolute", left: 34, top: 124, fontFamily: FONT_STACK, fontSize: 21, color: INK_SOFT }}>Production-grade engineering skills for AI coding agents.</div>
        <div style={{ position: "absolute", left: 34, bottom: 34, display: "flex", gap: 14 }}>
          <div style={{ padding: "9px 18px", background: `${ACCENT}12`, color: ACCENT, border: `1.5px solid ${ACCENT}66`, borderRadius: 999, fontFamily: MONO_STACK, fontSize: 18, letterSpacing: 2 }}>
            ★ {Math.round(116430 * starT).toLocaleString("en-US")}
          </div>
          <div style={{ padding: "9px 18px", background: `${INK}08`, color: INK_SOFT, borderRadius: 999, fontFamily: MONO_STACK, fontSize: 18, letterSpacing: 2 }}>
            MIT
          </div>
        </div>
        {/* 纸胶带 */}
        <div style={{ position: "absolute", right: 42, top: -14, width: 118, height: 34, background: `${GOLD}55`, transform: "rotate(6deg)", border: `1px solid ${GOLD}44` }} />
      </div>

      <div style={{ position: "absolute", left: 150, bottom: 470, fontFamily: FONT_STACK, fontSize: 24, color: INK_SOFT, opacity: eo(seg(p, 0.7, 0.86)) }}>
        名字不难记，难的是它真能搜到
      </div>
    </AbsoluteFill>
  );
};

export default Scene05;
