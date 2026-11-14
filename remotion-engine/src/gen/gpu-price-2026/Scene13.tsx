// Scene13 · 收尾：先看两个价，再决定要不要冲
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, TopBar, Stamp, Chip, SERIF, MONO, SANS, INK, RED, GREEN, MUTED, FAINT, easeOut, seg, mk, exitFade } from "./ui";

const rows = [
  { n: "01", t: "首发价", d: "决定“贵不贵”", c: INK },
  { n: "02", t: "整机价", d: "决定“值不值”", c: INK },
  { n: "03", t: "自己的需求", d: "决定“买不买”", c: GREEN },
];

const Scene13: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.04);
  const m1 = mk(marks, 1, 0.3);
  const m2 = mk(marks, 2, 0.58);
  const m3 = mk(marks, 3, 0.8);
  const m4 = mk(marks, 4, 0.94);
  const head = easeOut(seg(p, 0.01, 0.14));
  const list = [0, 1, 2].map((i) => easeOut(seg(p, m1 + i * 0.07, m1 + i * 0.07 + 0.13)));
  const cta = easeOut(seg(p, m2 - 0.14, m2 + 0.08));
  const end = easeOut(seg(p, m3, m3 + 0.16));
  const signature = easeOut(seg(p, m4, m4 + 0.08));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <TopBar label="买之前 / 两个坐标" right="END" />
        <div style={{ position: "absolute", left: 96, top: 352, opacity: head, transform: `translateY(${(1 - head) * 20}px)` }}>
          <div style={{ fontFamily: SERIF, fontSize: 84, lineHeight: 1.05, fontWeight: 700, color: INK, letterSpacing: 1 }}>先看两个价</div>
          <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 21, color: RED, letterSpacing: 2 }}>再看自己的需求</div>
        </div>

        {rows.map((r, i) => (
          <div key={r.n} style={{ position: "absolute", left: 96, top: 548 + i * 128, width: 660, display: "flex", alignItems: "baseline", opacity: list[i], transform: `translateX(${(1 - list[i]) * -18}px)` }}>
            <span style={{ fontFamily: MONO, fontSize: 22, color: FAINT, width: 56 }}>{r.n}</span>
            <span style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 700, color: r.c, width: 230 }}>{r.t}</span>
            <span style={{ fontFamily: SANS, fontSize: 25, color: MUTED }}>{r.d}</span>
          </div>
        ))}

        <Stamp text="别追涨杀跌" x={800} y={900} size={28} rotate={7} t={list[2]} color={RED} />
        <Chip text="直降 4000 ≠ 回到首发" x={96} y={920} rotate={-2} opacity={list[2]} size={17} tone={RED} />

        <div style={{ position: "absolute", left: 96, top: 1010, width: 888, opacity: cta, transform: `translateY(${(1 - cta) * 22}px)`, background: INK, color: "#FFF9ED", padding: "26px 30px 24px", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: SANS, fontSize: 20, letterSpacing: 2, opacity: 0.7 }}>你那边</div>
              <div style={{ marginTop: 4, fontFamily: SERIF, fontSize: 44, fontWeight: 700 }}>RTX 5080 多少钱？</div>
            </div>
            <span style={{ flex: 1 }} />
            <div style={{ background: RED, padding: "12px 18px", fontFamily: SANS, fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>评论区报个数</div>
          </div>
          <div style={{ marginTop: 18, borderTop: "1px dashed rgba(255,249,237,0.28)", paddingTop: 14, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <span style={{ fontFamily: SANS, fontSize: 15, opacity: 0.55 }}>渠道价 / 页面价，均以实时为准</span>
            <span style={{ fontFamily: MONO, fontSize: 15, opacity: 0.55 }}>GPU PRICE / 2026.11</span>
          </div>
        </div>

        <div style={{ position: "absolute", left: 96, top: 1232, opacity: end, display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ width: 26, height: 3, background: RED }} />
          <span style={{ fontFamily: MONO, fontSize: 18, color: MUTED, letterSpacing: 2 }}>显卡价格 · 2026</span>
          <span style={{ fontFamily: SANS, fontSize: 17, color: FAINT }}>数据来自公开报道，价格以实时为准</span>
        </div>
        <div style={{ position: "absolute", left: 96, top: 1282, opacity: signature, fontFamily: SERIF, fontSize: 26, fontWeight: 700, color: INK, letterSpacing: 1 }}>
          阿扎 · 带你领略科普知识
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene13;
