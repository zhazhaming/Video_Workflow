// Scene11 · 同一天，两个价：渠道价不是平台价
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, TopBar, Heading, Source, Chip, SERIF, MONO, SANS, INK, RED, GREEN, MUTED, FAINT, easeOut, seg, mk, exitFade } from "./ui";

const Scene11: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.04);
  const m1 = mk(marks, 1, 0.32);
  const m2 = mk(marks, 2, 0.64);
  const left = easeOut(seg(p, m0, m0 + 0.22));
  const right = easeOut(seg(p, m1, m1 + 0.22));
  const gap = easeOut(seg(p, m2, m2 + 0.22));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <TopBar label="同一天 / 两个价" right="2026.11.10" />
        <Heading kicker="华强北 vs 线上双十一" title="渠道价，不是平台价" y={350} size={56} opacity={seg(p, 0, 0.2)} />

        <div style={{ position: "absolute", left: 96, top: 548, width: 372, height: 468, background: "rgba(255,249,237,0.82)", border: `2px solid ${INK}`, opacity: left, transform: `translateY(${(1 - left) * 25}px)`, padding: "24px 26px", boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 17, color: MUTED }}>
            <span>线下 / 渠道</span>
            <span>现货</span>
          </div>
          <div style={{ marginTop: 18, fontFamily: SERIF, fontSize: 44, fontWeight: 700, color: INK }}>华强北</div>
          <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 72, fontWeight: 800, color: GREEN, letterSpacing: -4 }}>14,000</div>
          <div style={{ marginTop: 14, height: 3, background: GREEN, opacity: 0.7 }} />
          <div style={{ marginTop: 18, fontFamily: SANS, fontSize: 21, color: MUTED, lineHeight: 1.5 }}>商家让利回款，<br />价格先松一步。</div>
          <Chip text="可谈" x={244} y={392} rotate={6} opacity={left} size={18} tone={GREEN} />
        </div>

        <div style={{ position: "absolute", left: 612, top: 548, width: 372, height: 468, background: "rgba(255,249,237,0.82)", border: `2px solid ${INK}`, opacity: right, transform: `translateY(${(1 - right) * 25}px)`, padding: "24px 26px", boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 17, color: MUTED }}>
            <span>线上 / 双十一</span>
            <span>页面价</span>
          </div>
          <div style={{ marginTop: 18, fontFamily: SERIF, fontSize: 44, fontWeight: 700, color: INK }}>电商平台</div>
          <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 42, fontWeight: 800, color: RED, letterSpacing: -2, lineHeight: 1.15 }}>16,000<br />– 18,000</div>
          <div style={{ marginTop: 14, height: 3, background: RED, opacity: 0.7 }} />
          <div style={{ marginTop: 18, fontFamily: SANS, fontSize: 21, color: MUTED, lineHeight: 1.5 }}>同一张卡，<br />页面价还没跟下来。</div>
          <Chip text="标价" x={250} y={392} rotate={-5} opacity={right} size={18} tone={RED} />
        </div>

        <div style={{ position: "absolute", left: 96, top: 1086, opacity: gap, fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: INK }}>
          同一天，差 2,000 以上。
        </div>
        <div style={{ position: "absolute", left: 96, top: 1162, opacity: gap, fontFamily: SANS, fontSize: 21, color: MUTED }}>
          看到“直降”之前，先看是谁家的价。
        </div>
        <Source text="数据：21世纪经济报道 2026-11-11；华强北为渠道现货价，线上为双十一页面价，具体以商家实时报价为准。" y={1268} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene11;
