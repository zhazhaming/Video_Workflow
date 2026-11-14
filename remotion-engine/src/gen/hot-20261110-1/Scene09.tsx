// Scene09 · 追高的代价：买在情绪最满的那一格
// 价格冲到高点，买入点亮起；随后一根回落线把浮盈抹掉，红色亏损区出现。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, INK, INK_SOFT, FAINT, RED, GREEN, SERIF_STACK, MONO_STACK, seg, eo, eio, pop, clamp01 } from "./ui";

const PEAK = { x: 690, y: 574 };

const Scene09: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const rise = eio(seg(p, 0.06, 0.42));
  const buy = pop(seg(p, 0.4, 0.54));
  const fall = eio(seg(p, 0.48, 0.82));
  const loss = eo(seg(p, 0.6, 0.82));
  const note = eo(seg(p, 0.7, 0.86));
  const ex = seg(p, 0.88, 1);
  const main = accent || RED;

  const upPath = `M 140 1010 C 300 980, 470 760, ${PEAK.x} ${PEAK.y}`;
  const downPath = `M ${PEAK.x} ${PEAK.y} C 800 720, 880 900, 952 1018`;

  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} />

      <div style={{ opacity: enter }}>
        <Cap text="09 / CHASE" x={110} y={300} color={main} />
        <Cap text="追高" x={962} y={300} align="right" color={FAINT} />
        <Hair x={110} y={338} w={852} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 110, top: 392, opacity: enter }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 18, letterSpacing: 4, color: FAINT }}>CHASE THE HIGH</div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 56, fontWeight: 700, color: INK, letterSpacing: 2, marginTop: 4 }}>
          最容易买在情绪上。
        </div>
      </div>

      {/* 价格网格 */}
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ position: "absolute", left: 140, top: 560 + i * 150, width: 820, height: 1, background: INK, opacity: 0.05 * enter }} />
      ))}

      {/* 亏损区 */}
      <div
        style={{
          position: "absolute",
          left: PEAK.x,
          top: PEAK.y,
          width: 270 * fall,
          height: 446 * fall,
          background: `linear-gradient(180deg, ${GREEN}00, ${GREEN}22)`,
          opacity: loss,
          clipPath: "polygon(0 0, 100% 78%, 100% 100%, 0 100%)",
        }}
      />

      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={upPath} fill="none" stroke={main} strokeWidth={3.4} strokeLinecap="round" strokeDasharray="760" strokeDashoffset={760 * (1 - rise)} />
        <path d={downPath} fill="none" stroke={GREEN} strokeWidth={3.2} strokeLinecap="round" strokeDasharray="520" strokeDashoffset={520 * (1 - fall)} />
        <circle cx={PEAK.x} cy={PEAK.y} r={9} fill={main} opacity={buy} />
        <circle cx={PEAK.x} cy={PEAK.y} r={26 + 10 * Math.sin(p * 20)} fill="none" stroke={main} strokeWidth={1.5} opacity={buy * 0.5} />
        <circle cx={952} cy={1018} r={7} fill={GREEN} opacity={fall} />
      </svg>

      <div style={{ position: "absolute", left: PEAK.x + 24, top: PEAK.y - 56, opacity: buy }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 34, height: 2, background: main }} />
          <div style={{ background: main, color: "#FBF7EF", fontFamily: SERIF_STACK, fontSize: 24, letterSpacing: 2, padding: "6px 16px", borderRadius: 4 }}>
            买在这里
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", left: 820, top: 760, opacity: fall * 0.9, fontFamily: SERIF_STACK, fontSize: 30, color: GREEN, transform: "rotate(12deg)" }}>
        回落
      </div>

      <div style={{ position: "absolute", left: 110, top: 1200, opacity: note }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 29, color: INK_SOFT }}>
          追高，最容易买在情绪上。
        </div>
      </div>

      <div style={{ position: "absolute", right: 110, top: 1214, opacity: note * 0.9, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 2, color: main }}>
        第一分钟别追高
      </div>

      <div style={{ position: "absolute", right: 110, top: 1212, opacity: note * 0.85, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 3, color: FAINT }}>
        PAGE 09
      </div>
    </AbsoluteFill>
  );
};

export default Scene09;
