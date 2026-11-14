// Scene08 · 价格周期：矿潮、合并、AI，一轮接一轮
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, TopBar, Heading, Source, Chip, SERIF, MONO, SANS, INK, RED, GREEN, MUTED, FAINT, easeOut, seg, mk, exitFade } from "./ui";

const pts = [
  { x: 150, y: 790, year: "2017", label: "矿潮" },
  { x: 330, y: 650, year: "2021", label: "矿潮" },
  { x: 560, y: 750, year: "2022.9", label: "合并" },
  { x: 620, y: 900, year: "", label: "" },
  { x: 800, y: 690, year: "2025", label: "AI" },
  { x: 930, y: 620, year: "", label: "" },
];
const path = pts.map((q, i) => `${i === 0 ? "M" : "L"} ${q.x} ${q.y}`).join(" ");

const Scene08: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.05);
  const m1 = mk(marks, 1, 0.34);
  const m2 = mk(marks, 2, 0.66);
  const draw = easeOut(seg(p, m0, m1 + 0.1));
  const merge = easeOut(seg(p, m1, m1 + 0.25));
  const punch = easeOut(seg(p, m2, m2 + 0.2));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <TopBar label="价格周期 / 不是第一次" right="示意图" />
        <Heading kicker="上一轮高点，怎么结束的" title="上一次，是矿潮" y={350} size={62} opacity={seg(p, 0, 0.2)} />

        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <path d={path} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1600} strokeDashoffset={1600 * (1 - draw)} />
          <line x1={560} y1={392} x2={560} y2={1010} stroke={RED} strokeWidth={3} strokeDasharray="9 10" opacity={0.7 * merge} />
        </svg>

        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute", left: pts[i].x - 9, top: pts[i].y - 9, width: 18, height: 18, borderRadius: "50%",
              background: i === 2 || i === 3 ? RED : i === 4 || i === 5 ? GREEN : INK,
              opacity: draw, transform: `scale(${0.7 + 0.3 * draw})`,
            }}
          />
        ))}

        <div style={{ position: "absolute", left: 120, top: 840, opacity: draw, fontFamily: MONO, fontSize: 20, color: MUTED }}>2017 矿潮</div>
        <div style={{ position: "absolute", left: 292, top: 596, opacity: draw, fontFamily: MONO, fontSize: 20, color: MUTED }}>2021 矿潮</div>
        <div style={{ position: "absolute", left: 752, top: 632, opacity: punch, fontFamily: MONO, fontSize: 20, color: GREEN }}>2025 AI 抢产能</div>

        <Chip text="2022.9 以太坊合并" x={604} y={392} rotate={1.5} opacity={merge} size={18} tone={RED} />
        <div style={{ position: "absolute", left: 588, top: 444, opacity: merge, fontFamily: SANS, fontSize: 19, color: MUTED }}>
          挖矿需求退潮
        </div>
        <div style={{ position: "absolute", left: 604, top: 900, opacity: merge, fontFamily: MONO, fontSize: 21, color: RED, fontWeight: 700 }}>
          PoW → PoS
        </div>

        <div style={{ position: "absolute", left: 748, top: 470, opacity: merge, width: 70, height: 86 }}>
          <div style={{ position: "absolute", left: 11, top: 0, width: 48, height: 48, background: "transparent", border: `4px solid ${INK}`, transform: "rotate(45deg)" }} />
          <div style={{ position: "absolute", left: 28, top: 16, width: 14, height: 14, background: RED, transform: "rotate(45deg)" }} />
          <div style={{ position: "absolute", left: 0, top: 68, fontFamily: MONO, fontSize: 15, color: MUTED }}>ETH</div>
        </div>

        <div style={{ position: "absolute", left: 96, top: 1080, opacity: punch, transform: `translateY(${(1 - punch) * 16}px)` }}>
          <div style={{ fontFamily: SERIF, fontSize: 50, fontWeight: 700, color: INK, lineHeight: 1.2 }}>
            上一轮靠“挖矿退潮”收场，
            <br />
            这一轮靠“AI 抢产能”托底。
          </div>
        </div>
        <div style={{ position: "absolute", left: 760, top: 1056, opacity: punch, fontFamily: SANS, fontSize: 18, color: FAINT, textAlign: "right", lineHeight: 1.6 }}>
          曲线为叙事示意
          <br />
          非精确价格
        </div>
        <Source text="事件：以太坊 2022-09-15 完成 The Merge（PoW→PoS）；矿潮与 AI 周期为行业背景，不构成价格预测。" y={1268} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene08;
