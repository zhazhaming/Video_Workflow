// Scene03 · 降幅对比：高端回吐，不是全线跳水
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, TopBar, Heading, Source, SERIF, MONO, SANS, INK, RED, GREEN, MUTED, easeOut, seg, mk, exitFade } from "./ui";

const rows = [
  { name: "RTX 5090", from: "50000", to: "46000", drop: 4000, label: "−4000", color: RED },
  { name: "RTX 5080", from: "18000", to: "14000", drop: 4000, label: "−4000", color: RED },
  { name: "RTX 5060", from: "主流", to: "主流", drop: 200, label: "−200", color: GREEN },
];

const Scene03: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.05);
  const m1 = mk(marks, 1, 0.34);
  const m2 = mk(marks, 2, 0.66);
  const head = easeOut(seg(p, 0, 0.16));
  const rowsIn = [0, 1, 2].map((i) => easeOut(seg(p, m0 + i * 0.1, m0 + i * 0.1 + 0.18)));
  const verdict = easeOut(seg(p, m2, m2 + 0.2));
  const maxW = 360;

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <TopBar label="降幅对比 / 2026.11.10" right="渠道价" />
        <Heading kicker="同一张报价单" title="谁在降？" y={354} size={68} opacity={head} />
        {rows.map((r, i) => {
          const y = 570 + i * 176;
          const w = (r.drop / 4000) * maxW;
          return (
            <div key={r.name} style={{ position: "absolute", left: 96, top: y, width: 888, opacity: rowsIn[i] }}>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span style={{ fontFamily: MONO, fontSize: 31, fontWeight: 700, color: INK, letterSpacing: -1 }}>{r.name}</span>
                <span style={{ marginLeft: 16, fontFamily: SANS, fontSize: 19, color: MUTED }}>
                  {r.from === "主流" ? "主流型号，波动很小" : `${r.from} → ${r.to}`}
                </span>
                <span style={{ flex: 1 }} />
                <span style={{ fontFamily: MONO, fontSize: 34, fontWeight: 800, color: r.color }}>{r.label}</span>
              </div>
              <div style={{ position: "relative", marginTop: 14, height: 18, background: "rgba(27,23,20,0.08)" }}>
                <div style={{ width: `${(w / maxW) * 100 * rowsIn[i]}%`, height: 18, background: r.color, opacity: 0.88 }} />
                {i === 2 ? (
                  <div style={{ position: "absolute", left: 24, top: 26, fontFamily: SANS, fontSize: 18, color: MUTED }}>只有前两行的 1/20</div>
                ) : null}
              </div>
            </div>
          );
        })}

        <div style={{ position: "absolute", left: 96, top: 1090, opacity: verdict, transform: `translateY(${(1 - verdict) * 18}px)` }}>
          <div style={{ fontFamily: SERIF, fontSize: 64, lineHeight: 1.16, fontWeight: 700, color: INK }}>
            不是全线跳水，
            <br />
            是<span style={{ color: RED }}>高端回吐</span>。
          </div>
        </div>
        <div style={{ position: "absolute", left: 780, top: 1102, opacity: verdict, transform: `rotate(-6deg)` }}>
          <div style={{ fontFamily: MONO, fontSize: 21, color: MUTED, letterSpacing: 1 }}>5060 只降</div>
          <div style={{ fontFamily: SERIF, fontSize: 66, fontWeight: 700, color: GREEN, lineHeight: 1 }}>200</div>
        </div>
        <Source text="数据：21世纪经济报道 2026-11-11；5060 为系列整体波动，不标具体成交价。" y={1268} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene03;
