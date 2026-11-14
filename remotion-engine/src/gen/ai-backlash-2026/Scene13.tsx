// Scene13 · 开场背景：2026 美国中期选举，一场反AI运动把执政党选下台
// 先给时间、地点、事件，再进“三张账单”；圆顶、机柜、票箱三个符号用红线串起。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Rack, Stamp, RED, BLUE, GOLD, INK, INK_SOFT, FAINT, MONO_STACK, SERIF_STACK, seg, eo, pop } from "./ui";

const Scene13: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const head = eo(seg(p, 0.08, 0.26));
  const icons = eo(seg(p, 0.3, 0.52));
  const line = eo(seg(p, 0.42, 0.66));
  const stampT = pop(seg(p, 0.68, 0.8));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="00 / 08 · 背景" x={108} y={300} color={RED} />
        <Cap text="2026 U.S. MIDTERMS" x={972} y={300} align="right" color={FAINT} />
        <Hair x={108} y={338} w={864} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 108, top: 400, opacity: head }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 20, letterSpacing: 5, color: BLUE }}>UNITED STATES / ELECTION</div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 58, fontWeight: 700, color: INK, letterSpacing: 2, marginTop: 10 }}>
          美国 · 中期选举
        </div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 54, fontWeight: 700, color: INK, letterSpacing: 2, marginTop: 26 }}>
          一场反AI运动
        </div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 54, fontWeight: 700, color: RED, letterSpacing: 2 }}>
          把执政党选下了台。
        </div>
      </div>

      {/* 三个符号：国会 / 数据中心 / 票箱 */}
      <div style={{ position: "absolute", left: 0, top: 760, width: 1080, opacity: icons }}>
        {/* 国会 */}
        <svg width={220} height={180} style={{ position: "absolute", left: 120, top: 0 }}>
          <path d="M 60 74 Q 110 8 160 74" fill="none" stroke={INK} strokeWidth={3} />
          <line x1={110} y1={8} x2={110} y2={30} stroke={INK} strokeWidth={3} />
          <rect x="52" y="74" width="116" height="12" fill="none" stroke={INK} strokeWidth={2.5} />
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={64 + i * 28} y1={88} x2={64 + i * 28} y2={132} stroke={INK} strokeWidth={2.5} />
          ))}
          <rect x="46" y="132" width="128" height="10" fill="none" stroke={INK} strokeWidth={2.5} />
        </svg>

        {/* 数据中心 */}
        <div style={{ position: "absolute", left: 440, top: 6 }}>
          {[0, 1, 2].map((i) => (
            <Rack key={i} x={i * 52} y={0} w={40} h={150} color={INK} opacity={0.8} filled={0.7} />
          ))}
        </div>

        {/* 票箱 */}
        <svg width={220} height={180} style={{ position: "absolute", left: 740, top: 0 }}>
          <rect x="40" y="40" width="140" height="110" fill="none" stroke={INK} strokeWidth={3} />
          <rect x="68" y="34" width="84" height="8" fill={INK} />
          <rect x="70" y="78" width="44" height="8" fill={BLUE} opacity={0.8} />
          <rect x="70" y="94" width="64" height="6" fill={INK} opacity={0.3} />
          <rect x="70" y="108" width="52" height="6" fill={INK} opacity={0.3} />
          <text x="110" y="136" textAnchor="middle" fontFamily={MONO_STACK} fontSize="14" fill={FAINT} letterSpacing="3">VOTE</text>
        </svg>

        {/* 红色连接线 */}
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <path d="M 230 174 L 440 174 M 590 174 L 740 174" stroke={RED} strokeWidth={2.5} strokeDasharray="8 7" opacity={0.7 * line} />
          <circle cx={230} cy={174} r={5} fill={RED} opacity={line} />
          <circle cx={590} cy={174} r={5} fill={RED} opacity={line} />
          <circle cx={740} cy={174} r={5} fill={RED} opacity={line} />
        </svg>
      </div>

      <div style={{ position: "absolute", left: 108, top: 1050, opacity: icons }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 3, color: FAINT }}>CONGRESS · DATA CENTER · BALLOT</div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 30, color: INK_SOFT, marginTop: 10 }}>
          一张选票，背后是三张账单。
        </div>
      </div>

      <Stamp text="背景" sub="2026.11.03" x={860} y={1170} size={28} rotate={-7} t={stampT} w={180} color={RED} />

      <div style={{ position: "absolute", left: 108, top: 1280, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 2, color: FAINT, opacity: icons }}>
        SOURCE: CBS / NPR / CNBC · 2026.11
      </div>
    </AbsoluteFill>
  );
};

export default Scene13;
