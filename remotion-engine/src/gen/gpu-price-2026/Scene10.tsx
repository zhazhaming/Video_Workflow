// Scene10 · AI 抢走约七成先进存储产能，整机成本被托住
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, TopBar, Heading, Source, Chip, SERIF, MONO, SANS, INK, RED, GREEN, MUTED, FAINT, easeOut, seg, mk, exitFade, clamp01 } from "./ui";

const R = 148;
const C = 2 * Math.PI * R;

const Scene10: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.05);
  const m1 = mk(marks, 1, 0.34);
  const m2 = mk(marks, 2, 0.66);
  const ring = easeOut(seg(p, m0 + 0.04, m0 + 0.5));
  const punch = easeOut(seg(p, m1, m1 + 0.2));
  const verdict = easeOut(seg(p, m2, m2 + 0.2));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <TopBar label="AI / 先进存储" right="产能挤占" />
        <Heading kicker="不是显卡一个人在涨" title="七成产能，给了 AI" y={350} size={58} opacity={seg(p, 0, 0.2)} />

        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <circle cx={704} cy={760} r={R} fill="none" stroke="rgba(27,23,20,0.10)" strokeWidth={38} />
          <circle
            cx={704} cy={760} r={R} fill="none" stroke={RED} strokeWidth={38}
            strokeDasharray={`${C * 0.7 * ring} ${C}`} strokeLinecap="butt"
            transform="rotate(-90 704 760)"
          />
        </svg>
        <div style={{ position: "absolute", left: 574, top: 682, width: 260, textAlign: "center", opacity: ring }}>
          <div style={{ fontFamily: SERIF, fontSize: 92, lineHeight: 0.95, fontWeight: 700, color: RED, letterSpacing: -4 }}>70%</div>
          <div style={{ marginTop: 10, fontFamily: SANS, fontSize: 19, color: MUTED }}>先进存储产能</div>
        </div>

        <div style={{ position: "absolute", left: 96, top: 560, opacity: punch }}>
          <div style={{ fontFamily: MONO, fontSize: 18, color: MUTED, letterSpacing: 1 }}>AI 算力中心</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
            <span style={{ width: 16, height: 16, background: RED }} />
            <span style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 700, color: INK }}>约 70%</span>
          </div>
          <div style={{ marginTop: 26, fontFamily: MONO, fontSize: 18, color: MUTED, letterSpacing: 1 }}>手机 / 电脑</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
            <span style={{ width: 16, height: 16, background: "rgba(27,23,20,0.18)" }} />
            <span style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 700, color: MUTED }}>约 30%</span>
          </div>
        </div>

        <div style={{ position: "absolute", left: 96, top: 950, width: 548, padding: "20px 24px", background: "rgba(255,249,237,0.82)", border: "2px solid rgba(27,23,20,0.16)", opacity: verdict, boxSizing: "border-box" }}>
          <div style={{ fontFamily: MONO, fontSize: 16, color: MUTED, letterSpacing: 1 }}>一台常规游戏主机</div>
          <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontFamily: MONO, fontSize: 25, color: FAINT, textDecoration: "line-through" }}>5,000</span>
            <span style={{ fontFamily: MONO, fontSize: 20, color: FAINT }}>→</span>
            <span style={{ fontFamily: MONO, fontSize: 44, fontWeight: 800, color: RED, letterSpacing: -2 }}>8,000–10,000</span>
          </div>
          <div style={{ marginTop: 4, fontFamily: SANS, fontSize: 17, color: MUTED }}>去年 vs 今年，整机装机价</div>
        </div>
        <Chip text="省下的 4000" x={676} y={1000} rotate={-5} opacity={verdict} size={18} tone={GREEN} />
        <div style={{ position: "absolute", left: 96, top: 1132, opacity: verdict, fontFamily: SERIF, fontSize: 50, fontWeight: 700, color: INK }}>
          显卡降了，整机未必降。
        </div>
        <Source text="数据：21世纪经济报道 2026-11-11；70%/30% 为受访业内人士口径，非精确统计。" y={1268} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene10;
