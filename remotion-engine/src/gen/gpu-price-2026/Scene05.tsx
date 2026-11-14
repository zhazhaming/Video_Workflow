// Scene05 · 11 个交易日：从 8299 冲到 2 万附近，再回吐 4000
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, TopBar, Heading, Source, Chip, ChartGrid, MONO, SANS, INK, RED, GREEN, MUTED, FAINT, CREAM, easeOut, seg, mk, exitFade } from "./ui";

const X0 = 150;
const Y0 = 590;
const W = 780;
const H = 420;
const V_MIN = 8000;
const V_MAX = 20500;
const X = [190, 590, 840];
const pts = [8299, 18000, 14000];
const yy = (v: number) => Y0 + H - ((v - V_MIN) / (V_MAX - V_MIN)) * H;
const path = `M ${X[0]} ${yy(pts[0])} L ${X[1]} ${yy(pts[1])} L ${X[2]} ${yy(pts[2])}`;
const area = `${path} L ${X[2]} ${Y0 + H} L ${X[0]} ${Y0 + H} Z`;

const Scene05: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.05);
  const m1 = mk(marks, 1, 0.34);
  const m2 = mk(marks, 2, 0.66);
  const draw = easeOut(seg(p, m0, m1 + 0.06));
  const peak = easeOut(seg(p, m1 - 0.04, m1 + 0.12));
  const tail = easeOut(seg(p, m2 - 0.04, m2 + 0.12));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <TopBar label="10 月底 / 传闻行情" right="渠道价" />
        <Heading kicker="10 月下旬，海外停产传闻" title="11 个交易日，冲到 2 万" y={350} size={56} opacity={seg(p, 0, 0.16)} />

        <ChartGrid x={X0} y={Y0} w={W} h={H} rows={4} cols={3} opacity={0.55} />
        <div style={{ position: "absolute", left: X0, top: yy(20000) - 2, width: W, borderTop: `2px dashed ${RED}`, opacity: 0.55 }}>
          <span style={{ position: "absolute", right: 0, top: -28, fontFamily: MONO, fontSize: 17, color: RED }}>20,000</span>
        </div>

        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <path d={area} fill={RED} opacity={0.05 * draw} />
          <path d={path} fill="none" stroke={INK} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={1000} strokeDashoffset={1000 * (1 - draw)} />
        </svg>

        <div style={{ position: "absolute", left: X[0] - 9, top: yy(8299) - 9, width: 18, height: 18, borderRadius: "50%", background: INK, border: `3px solid ${CREAM}`, opacity: draw }} />
        <div style={{ position: "absolute", left: X[1] - 10, top: yy(18000) - 10, width: 20, height: 20, borderRadius: "50%", background: RED, border: `4px solid ${CREAM}`, opacity: peak }} />
        <div style={{ position: "absolute", left: X[2] - 10, top: yy(14000) - 10, width: 20, height: 20, borderRadius: "50%", background: GREEN, border: `4px solid ${CREAM}`, opacity: tail }} />

        <div style={{ position: "absolute", left: 100, top: 912, opacity: draw }}>
          <div style={{ fontFamily: MONO, fontSize: 19, color: MUTED }}>2025.01 首发</div>
          <div style={{ fontFamily: MONO, fontSize: 40, fontWeight: 800, color: INK, letterSpacing: -2 }}>8,299</div>
        </div>
        <div style={{ position: "absolute", left: 620, top: yy(18000) - 78, width: 210, textAlign: "left", opacity: peak, background: "rgba(244,239,228,0.94)", padding: "2px 10px 4px", boxSizing: "border-box" }}>
          <div style={{ fontFamily: MONO, fontSize: 19, color: MUTED }}>10.23 高点</div>
          <div style={{ fontFamily: MONO, fontSize: 44, fontWeight: 800, color: RED, letterSpacing: -2 }}>18,000</div>
        </div>
        <div style={{ position: "absolute", left: X[2] - 58, top: yy(14000) + 30, width: 190, opacity: tail }}>
          <div style={{ fontFamily: MONO, fontSize: 19, color: MUTED }}>11.10</div>
          <div style={{ fontFamily: MONO, fontSize: 44, fontWeight: 800, color: GREEN, letterSpacing: -2 }}>14,000</div>
        </div>

        <Chip text="连涨 11 个交易日" x={300} y={768} rotate={-2} opacity={peak} size={18} tone={RED} />
        <div style={{ position: "absolute", left: 664, top: 744, opacity: tail, fontFamily: SANS, fontSize: 20, color: MUTED, textAlign: "right" }}>
          <span style={{ color: GREEN, fontWeight: 700 }}>−4,000</span>
          <br />
          两天回吐
        </div>

        <div style={{ position: "absolute", left: X0, top: Y0 + H + 64, display: "flex", width: W - 30, justifyContent: "space-between", fontFamily: MONO, fontSize: 17, color: FAINT }}>
          <span>2025.01</span><span>2026.10.23</span><span>2026.11.10</span>
        </div>
        <div style={{ position: "absolute", left: 96, top: 1128, opacity: tail, fontFamily: SANS, fontSize: 23, color: MUTED }}>
          涨的时候，没人谈性价比；跌的时候，才想起首发价。
        </div>
        <Source text="数据：21世纪经济报道 2026-11-11；7 月为主流非公版成交区间，未作为折线数据点。" y={1268} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene05;
