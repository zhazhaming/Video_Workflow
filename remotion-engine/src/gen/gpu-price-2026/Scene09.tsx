// Scene09 · 存储涨价：显卡之外，整机成本还在往上走
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, TopBar, Heading, Source, Chip, SERIF, MONO, SANS, INK, RED, GREEN, MUTED, FAINT, easeOut, seg, mk, exitFade } from "./ui";

const rows = [
  { label: "1TB 硬盘", before: 355, after: 850, pct: "+139%", note: "去年 → 现在" },
  { label: "16GB DDR5", before: 450, after: 1600, pct: "+255%", note: "去年 → 现在" },
  { label: "32GB DDR5", before: 900, after: 3800, pct: "+322%", note: "" },
];

const Scene09: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.04);
  const m1 = mk(marks, 1, 0.34);
  const m2 = mk(marks, 2, 0.66);
  const at = [m0, m1, m2].map((m, i) => easeOut(seg(p, m + i * 0.01, m + 0.22)));
  const slam = easeOut(seg(p, m2, m2 + 0.2));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <TopBar label="装机成本 / 存储" right="2026.11" />
        <Heading kicker="显卡在降，别的在涨" title="整机为什么更贵了？" y={348} size={58} opacity={seg(p, 0, 0.2)} />

        {rows.map((r, i) => {
          const y = 540 + i * 224;
          const on = at[i];
          const beforeW = (r.before / r.after) * 100;
          return (
            <div key={r.label} style={{ position: "absolute", left: 96, top: y, width: 888, opacity: on }}>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span style={{ fontFamily: MONO, fontSize: i === 2 ? 23 : 29, fontWeight: 700, color: INK }}>{r.label}</span>
                <span style={{ marginLeft: 14, fontFamily: SANS, fontSize: 17, color: MUTED }}>{r.note}</span>
                <span style={{ flex: 1 }} />
                <span style={{ fontFamily: MONO, fontSize: i === 2 ? 27 : 34, fontWeight: 800, color: RED }}>{r.pct}</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", marginTop: 4 }}>
                <span style={{ fontFamily: MONO, fontSize: i === 2 ? 22 : 28, color: FAINT, textDecoration: "line-through" }}>{r.before}</span>
                <span style={{ margin: "0 10px", fontFamily: MONO, fontSize: 20, color: FAINT }}>→</span>
                <span style={{ fontFamily: MONO, fontSize: i === 2 ? 42 : 58, fontWeight: 800, color: i === 2 ? INK : RED, letterSpacing: -3 }}>{r.after}</span>
                <span style={{ marginLeft: 7, fontFamily: SANS, fontSize: 17, color: MUTED }}>元</span>
              </div>
              <div style={{ position: "relative", marginTop: 7, height: i === 2 ? 12 : 16, background: "rgba(27,23,20,0.08)" }}>
                <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${beforeW * on}%`, background: INK, opacity: 0.28 }} />
                <div style={{ position: "absolute", left: `${beforeW}%`, top: 0, height: "100%", width: `${(100 - beforeW) * on}%`, background: RED, opacity: i === 2 ? 0.72 : 0.88 }} />
              </div>
            </div>
          );
        })}

        <div style={{ position: "absolute", left: 96, top: 1128, opacity: slam, transform: `translateY(${(1 - slam) * 16}px)` }}>
          <div style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: INK, lineHeight: 1.2 }}>
            显卡省下的 4000，
            <br />
            可能还不够填存储的坑。
          </div>
        </div>
        <Chip text="涨幅均超 100%" x={676} y={1136} rotate={-4} opacity={slam} size={19} tone={RED} />
        <Source text="数据：21世纪经济报道 2026-11-11；价格为华强北渠道同口径对比，不同品牌容量有差异。" y={1268} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene09;
