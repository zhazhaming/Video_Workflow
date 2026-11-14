// Scene02 · 干活手册：翻页 + 三项清单逐个打勾，旁边 AI 新人举手
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { MONO_STACK, FONT_STACK } from "../../dv/atmosphere";
import { Paper, Cap, Hair, INK, INK_SOFT, FAINT, RED, GOLD, SERIF_STACK, seg, eo, eoq, pop, clamp01 } from "../autoloop-2026/ui";

const ACCENT = "#C8452D";

const ITEMS = [
  { n: "01", zh: "先写清需求", en: "SPEC" },
  { n: "02", zh: "再小步实现", en: "BUILD" },
  { n: "03", zh: "最后拿证据", en: "PROVE" },
];

const Scene02: React.FC<GenSceneProps> = ({ p, c1, c2, seed }) => {
  const open = eo(seg(p, 0.04, 0.26));
  const hook = eo(seg(p, 0.3, 0.9));
  const lamp = seg(p, 0.82, 0.96);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={ACCENT} />
      <Cap text="02 / HANDBOOK" x={150} y={392} />
      <Cap text="FOR AI CODING AGENTS" x={930} y={392} align="right" color={FAINT} />
      <Hair x={150} y={430} w={240} color={ACCENT} thickness={2} progress={open} opacity={0.75} />

      {/* 手册左页 */}
      <div
        style={{
          position: "absolute", left: 190, top: 610, width: 300, height: 610,
          transform: `rotate(-2deg) translateY(${(1 - open) * 40}px)`,
          opacity: 0.2 + 0.8 * open,
          background: "rgba(253,250,244,0.97)",
          border: `1px solid ${INK}22`, borderRadius: 8,
          boxShadow: `0 22px 46px ${INK}1C`,
          padding: "34px 26px", boxSizing: "border-box",
        }}
      >
        <div style={{ fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 4, color: FAINT }}>AGENT SKILLS</div>
        <div style={{ marginTop: 18, fontFamily: SERIF_STACK, fontSize: 40, fontWeight: 700, color: INK, lineHeight: 1.25 }}>
          干活<br />手册
        </div>
        <div style={{ marginTop: 22, width: 46, height: 3, background: ACCENT }} />
        <div style={{ marginTop: 26, fontFamily: FONT_STACK, fontSize: 19, lineHeight: 1.75, color: INK_SOFT }}>
          把老工程师<br />的经验，写成<br />AI 照做的步骤。
        </div>
        <div style={{ position: "absolute", left: 26, bottom: 26, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 2, color: FAINT }}>
          VOL. 25 / 2026
        </div>
      </div>

      {/* 右页展开 */}
      <div
        style={{
          position: "absolute", left: 490, top: 610, width: 300 * open, height: 610,
          overflow: "hidden",
          background: "rgba(251,247,239,0.98)",
          border: `1px solid ${INK}22`, borderRadius: "0 8px 8px 0",
          boxShadow: `0 22px 46px ${INK}14`,
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: 300, height: 610, padding: "34px 26px", boxSizing: "border-box" }}>
          {ITEMS.map((it, i) => {
            const t = pop(seg(p, 0.3 + i * 0.16, 0.42 + i * 0.16));
            const done = seg(p, 0.38 + i * 0.16, 0.5 + i * 0.16);
            const y = 30 + i * 150;
            return (
              <div key={it.n} style={{ position: "absolute", left: 26, top: y, width: 250, opacity: 0.25 + 0.75 * t }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 34, height: 34, border: `2px solid ${done > 0.2 ? ACCENT : INK}`, borderRadius: 4, position: "relative", background: done > 0.2 ? `${ACCENT}12` : "transparent" }}>
                    <svg width={34} height={34} style={{ position: "absolute", left: 0, top: 0 }}>
                      <path d="M8 18 L14 24 L26 10" fill="none" stroke={ACCENT} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" strokeDashoffset={30 * (1 - done)} />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontFamily: FONT_STACK, fontSize: 25, fontWeight: 700, color: INK }}>{it.zh}</div>
                    <div style={{ marginTop: 3, fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 3, color: FAINT }}>{it.n} / {it.en}</div>
                  </div>
                </div>
                <div style={{ marginTop: 14, width: 200 * done, height: 1.5, background: `${ACCENT}66` }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* AI 新人 */}
      <div style={{ position: "absolute", left: 856, top: 812, opacity: eo(seg(p, 0.16, 0.32)) }}>
        <div style={{ width: 86, height: 86, borderRadius: 24, background: INK, position: "relative", boxShadow: `0 16px 34px ${INK}30` }}>
          <div style={{ position: "absolute", left: 20, top: 30, width: 12, height: 12, borderRadius: 6, background: "#FBF7EF" }} />
          <div style={{ position: "absolute", right: 20, top: 30, width: 12, height: 12, borderRadius: 6, background: "#FBF7EF" }} />
          <div style={{ position: "absolute", left: 28, bottom: 20, width: 30, height: 4, borderRadius: 2, background: "#FBF7EF", opacity: 0.7 }} />
        </div>
        <div style={{ position: "absolute", left: 30, top: 86, width: 26, height: 92, borderRadius: 13, background: INK }} />
        {/* 举手 */}
        <div style={{ position: "absolute", left: -34, top: 96, width: 62, height: 13, borderRadius: 7, background: INK, transformOrigin: "right center", transform: `rotate(${-72 + 18 * Math.sin(p * 16) * hook}deg)` }} />
        {/* 小灯 */}
        <div style={{ position: "absolute", left: 88, top: 4, width: 28, height: 28, borderRadius: 14, background: lamp > 0.2 ? GOLD : `${INK}22`, boxShadow: lamp > 0.2 ? `0 0 0 8px ${GOLD}22` : "none", opacity: clamp01(lamp * 2) }} />
      </div>

      <div style={{ position: "absolute", left: 150, bottom: 470, fontFamily: FONT_STACK, fontSize: 24, color: INK_SOFT, opacity: eo(seg(p, 0.55, 0.72)) }}>
        不是教程，是让 AI 照着做的规矩
      </div>
    </AbsoluteFill>
  );
};

export default Scene02;
