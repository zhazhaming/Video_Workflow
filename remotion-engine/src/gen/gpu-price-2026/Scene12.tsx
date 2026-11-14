// Scene12 · 结论：不是回到原价，是从高点往回走了一步
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, TopBar, Source, Stamp, Chip, SERIF, MONO, SANS, INK, RED, GREEN, MUTED, FAINT, easeOut, seg, mk, exitFade } from "./ui";

const stair = "M 120 610 H 300 V 740 H 500 V 850 H 700 V 930 H 940";

const Scene12: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.05);
  const m1 = mk(marks, 1, 0.36);
  const m2 = mk(marks, 2, 0.68);
  const head = easeOut(seg(p, m0, m0 + 0.2));
  const sub = easeOut(seg(p, m1, m1 + 0.2));
  const draw = easeOut(seg(p, m1, m2 + 0.1));
  const flat = easeOut(seg(p, m2, m2 + 0.2));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <TopBar label="结论 / 先别上头" right="2026.11" />

        <div style={{ position: "absolute", left: 96, top: 382, opacity: head, transform: `translateY(${(1 - head) * 20}px)` }}>
          <div style={{ fontFamily: SERIF, fontSize: 92, lineHeight: 1.06, fontWeight: 700, color: INK, letterSpacing: 1 }}>
            不是回到
            <span style={{ position: "relative", color: FAINT }}>
              原价
              <span style={{ position: "absolute", left: -4, right: -4, top: "54%", height: 7, background: RED, transform: `scaleX(${head})`, transformOrigin: "left center" }} />
            </span>
            。
          </div>
        </div>
        <div style={{ position: "absolute", left: 96, top: 518, opacity: sub, fontFamily: SERIF, fontSize: 44, fontWeight: 700, color: MUTED, letterSpacing: 1 }}>
          是从天上，往回走了一步。
        </div>

        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <path d={stair} fill="none" stroke={INK} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={1800} strokeDashoffset={1800 * (1 - draw)} />
          <line x1={700} y1={930} x2={940} y2={930} stroke={GREEN} strokeWidth={10} opacity={flat} />
        </svg>
        <div style={{ position: "absolute", left: 690, top: 958, opacity: flat, fontFamily: MONO, fontSize: 20, color: GREEN }}>横盘区</div>
        <div style={{ position: "absolute", left: 120, top: 566, opacity: draw, fontFamily: MONO, fontSize: 17, color: FAINT }}>18000</div>
        <div style={{ position: "absolute", left: 120, top: 944, opacity: flat, fontFamily: MONO, fontSize: 17, color: FAINT }}>14000</div>

        <Stamp text="横盘 / 不是崩盘" x={786} y={746} size={34} rotate={-7} t={flat} color={GREEN} />
        <Chip text="−4000 ≠ 崩盘" x={728} y={608} rotate={4} opacity={flat} size={18} tone={RED} />
        <div style={{ position: "absolute", left: 96, top: 1040, opacity: flat, fontFamily: SANS, fontSize: 23, color: MUTED, lineHeight: 1.65 }}>
          工厂出货趋紧，渠道价逼近成本线；
          <br />
          短期更像横盘，不像 2022 年那种退潮。
        </div>
        <div style={{ position: "absolute", left: 96, top: 1180, opacity: flat, fontFamily: MONO, fontSize: 18, color: FAINT }}>
          先看价，再看需求。
        </div>
        <Source text="判断依据：21世纪经济报道 2026-11-11 受访商家观点；不是价格预测，也不构成购买建议。" y={1268} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene12;
