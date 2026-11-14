// Scene01 · 开场钩子：工作、电费、选票，三张卡被同一根红线串起来
// 不先讲“反AI”，先把观众的钱包、饭碗、选票摆上桌；中央 AI 节点给出统一解释。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Card, Stamp, RED, BLUE, GOLD, INK, INK_SOFT, FAINT, MONO_STACK, SERIF_STACK, seg, eo, pop, clamp01 } from "./ui";

const CARDS = [
  { k: "工作", s: "被 AI 改写", x: 232, c: RED },
  { k: "电费", s: "被算力推高", x: 540, c: GOLD },
  { k: "选票", s: "把账单算清", x: 848, c: BLUE },
];

const Scene01: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const head = eo(seg(p, 0.04, 0.22));
  const thread = eo(seg(p, 0.3, 0.6));
  const node = pop(seg(p, 0.5, 0.64));
  const note = eo(seg(p, 0.62, 0.78));
  const stampT = pop(seg(p, 0.7, 0.82));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="01 / 11 · 三件事" x={108} y={300} color={RED} />
        <Cap text="AI BACKLASH / 2026" x={972} y={300} align="right" color={FAINT} />
        <Hair x={108} y={338} w={864} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 108, top: 392 + (1 - head) * 26, opacity: head }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 20, letterSpacing: 5, color: FAINT }}>THREE BILLS / ONE LINE</div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 82, fontWeight: 700, color: INK, letterSpacing: 3, marginTop: 8 }}>
          三件事，一条线。
        </div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 34, color: INK_SOFT, letterSpacing: 2, marginTop: 8 }}>
          工作 · 电费 · 选票
        </div>
      </div>

      {CARDS.map((c, i) => {
        const t = pop(seg(p, 0.1 + i * 0.06, 0.26 + i * 0.06));
        return (
          <Card key={c.k} x={c.x} y={760} w={268} h={176} opacity={t} scale={0.92 + 0.08 * t} accent={c.c}>
            <div style={{ position: "absolute", left: 20, top: 16, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 2, color: FAINT }}>
              0{i + 1} / {c.s}
            </div>
            <div style={{ position: "absolute", left: 20, top: 50, fontFamily: SERIF_STACK, fontSize: 54, fontWeight: 700, color: c.c }}>
              {c.k}
            </div>
            <div style={{ position: "absolute", left: 20, bottom: 24, width: 96, height: 3, background: c.c, opacity: 0.7 }} />
            <div style={{ position: "absolute", right: 18, top: 20, width: 10, height: 10, borderRadius: 5, background: c.c, opacity: 0.8 }} />
          </Card>
        );
      })}

      {/* 红线：三张卡汇到同一个 AI 节点 */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <g fill="none" stroke={RED} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.8}>
          <path d="M 232 848 L 232 962 L 540 962 L 540 1030" strokeDasharray="420" strokeDashoffset={420 * (1 - thread)} />
          <path d="M 540 848 L 540 1030" strokeDasharray="220" strokeDashoffset={220 * (1 - thread)} />
          <path d="M 848 848 L 848 962 L 540 962" strokeDasharray="420" strokeDashoffset={420 * (1 - thread)} />
        </g>
        <circle cx={540} cy={1090} r={60} fill="rgba(252,248,240,0.95)" stroke={RED} strokeWidth={2.5} opacity={node} />
        <text x={540} y={1105} textAnchor="middle" fontFamily={MONO_STACK} fontSize="38" fontWeight="700" fill={RED} opacity={node}>
          AI
        </text>
      </svg>

      <div style={{ position: "absolute", left: 0, top: 1172, width: 1080, textAlign: "center", opacity: node }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 16, letterSpacing: 4, color: FAINT }}>同一个原因</div>
      </div>

      <div style={{ position: "absolute", left: 108, top: 1240, opacity: note }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 29, color: INK_SOFT }}>
          不是三件事，是同一条成本链。
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 2, color: FAINT, marginTop: 12 }}>
          数字与事件来自公开报道 · 片尾列出信源
        </div>
      </div>

      <Stamp text="成本本地化" x={820} y={1150} size={24} rotate={-8} t={stampT} w={220} color={RED} />

      <div style={{ position: "absolute", right: 108, top: 1300, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 2, color: FAINT, opacity: clamp01(note) }}>
        PAGE 01
      </div>
    </AbsoluteFill>
  );
};

export default Scene01;
