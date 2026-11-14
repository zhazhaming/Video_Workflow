// Scene02 · 十天：18000 → 14000
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, TopBar, Heading, Source, Chip, SERIF, MONO, SANS, INK, RED, GREEN, MUTED, easeOut, seg, mk, exitFade, clamp01 } from "./ui";

const Scene02: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.06);
  const m1 = mk(marks, 1, 0.34);
  const m2 = mk(marks, 2, 0.64);
  const row1 = easeOut(seg(p, m1 - 0.04, m1 + 0.1));
  const row2 = easeOut(seg(p, m2 - 0.04, m2 + 0.1));
  const delta = easeOut(seg(p, m2 + 0.06, m2 + 0.26));
  const dots = easeOut(seg(p, 0.2, 0.5));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <TopBar label="RTX 5080 / 华强北" right="2026.11.10" />
        <Heading kicker="十天，四千块" title="一张卡的价格跳水" y={358} size={64} opacity={seg(p, 0, 0.2)} />
        <Chip text="渠道现货" x={790} y={382} rotate={2} opacity={seg(p, m0, m0 + 0.16)} size={18} />

        <div style={{ position: "absolute", left: 176, top: 610, width: 3, height: 460, background: "rgba(27,23,20,0.16)" }} />
        <div
          style={{
            position: "absolute", left: 164, top: 630, width: 27, height: 27, borderRadius: "50%",
            background: "#F3EBDD", border: `5px solid ${INK}`, opacity: dots,
            transform: `scale(${0.7 + 0.3 * dots})`,
          }}
        />
        <div
          style={{
            position: "absolute", left: 164, top: 918, width: 27, height: 27, borderRadius: "50%",
            background: "#F3EBDD", border: `5px solid ${GREEN}`, opacity: dots,
            transform: `scale(${0.7 + 0.3 * dots})`,
          }}
        />

        <div style={{ position: "absolute", left: 236, top: 604, opacity: row1, transform: `translateY(${(1 - row1) * 16}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 25, letterSpacing: 2, color: MUTED }}>10.23</div>
          <div style={{ fontFamily: SANS, fontSize: 21, color: MUTED, marginTop: 2 }}>传闻前的高点</div>
        </div>
        <div style={{ position: "absolute", left: 420, top: 568, opacity: row1, transform: `translateY(${(1 - row1) * 18}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 111, lineHeight: 0.92, fontWeight: 800, color: INK, letterSpacing: -5 }}>18,000</div>
        </div>

        <div style={{ position: "absolute", left: 236, top: 892, opacity: row2, transform: `translateY(${(1 - row2) * 16}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 25, letterSpacing: 2, color: MUTED }}>11.10</div>
          <div style={{ fontFamily: SANS, fontSize: 21, color: MUTED, marginTop: 2 }}>双十一尾盘</div>
        </div>
        <div style={{ position: "absolute", left: 420, top: 856, opacity: row2, transform: `translateY(${(1 - row2) * 18}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 111, lineHeight: 0.92, fontWeight: 800, color: GREEN, letterSpacing: -5 }}>14,000</div>
        </div>

        <div
          style={{
            position: "absolute", left: 720, top: 700, opacity: delta,
            transform: `rotate(-7deg) scale(${0.8 + 0.2 * delta})`,
          }}
        >
          <div style={{ fontFamily: SERIF, fontSize: 84, fontWeight: 700, color: RED, lineHeight: 1 }}>−4,000</div>
          <div style={{ fontFamily: SANS, fontSize: 22, color: MUTED, marginTop: 8, letterSpacing: 1 }}>约 22%</div>
        </div>
        <div style={{ position: "absolute", left: 720, top: 640, width: 168, height: 4, background: RED, opacity: clamp01(delta * 0.9) }} />
        <div style={{ position: "absolute", left: 720, top: 636, width: 4, height: 80, background: RED, opacity: clamp01(delta * 0.9) }} />

        <div style={{ position: "absolute", left: 96, top: 1136, opacity: seg(p, m2 + 0.1, m2 + 0.3), fontFamily: SANS, fontSize: 28, color: INK, letterSpacing: 1 }}>
          十几天，跌掉 4000 块。
        </div>
        <Source text="数据：21世纪经济报道 2026-11-11、新浪新闻 2026-11-10；价格取整，实际成交因品牌/商家而异。" y={1278} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene02;
