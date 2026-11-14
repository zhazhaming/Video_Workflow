// Scene02 · 起点：1997 年，郑州街头的刨冰摊
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Stamp, Store, Cup, LemonSlice, Signature, exitFade, mk, seg, easeOut, pop, clamp01,
  RED, INK, MUTED, LINE,
} from "./ui";

const Scene02: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.04);
  const yearIn = easeOut(seg(p, 0.02, 0.18));
  const pinDrop = pop(seg(p, m0 + 0.04, m0 + 0.22));
  const storeIn = easeOut(seg(p, 0.12, 0.34));
  const timeline = easeOut(seg(p, 0.35, 0.85));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <Signature />
        <Cap text="起点" x={96} y={330} opacity={seg(p, 0.02, 0.1)} />
        <div
          style={{
            position: "absolute", left: 92, top: 390 + (1 - yearIn) * 40, opacity: yearIn,
            fontFamily: '"Songti SC",serif', fontSize: 178, fontWeight: 700, color: INK, letterSpacing: -4,
          }}
        >
          1997
        </div>
        <div style={{ position: "absolute", left: 100, top: 590, width: 250, height: 4, background: RED, opacity: yearIn }} />
        <div style={{ position: "absolute", left: 100, top: 616, fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 30, color: MUTED, letterSpacing: 8, opacity: yearIn }}>
          郑州 · 一碗刨冰
        </div>
        <div
          style={{
            position: "absolute", left: 300, top: 700, width: 54, height: 54,
            transform: `translate(-50%, -50%) scale(${pinDrop})`, opacity: clamp01(pinDrop),
          }}
        >
          <div style={{ position: "absolute", left: 2, top: 0, width: 50, height: 50, borderRadius: "50% 50% 50% 0", background: RED, transform: "rotate(-45deg)", border: `3px solid ${INK}`, boxSizing: "border-box" }} />
          <div style={{ position: "absolute", left: 18, top: 16, width: 18, height: 18, borderRadius: "50%", background: "#FFF9ED" }} />
        </div>
        <div style={{ position: "absolute", left: 620, top: 470 + (1 - storeIn) * 50, opacity: storeIn }}>
          <Store x={0} y={0} w={330} />
        </div>
        <div style={{ position: "absolute", left: 690, top: 800, opacity: storeIn }}>
          <Cup x={0} y={0} w={90} h={120} straw={false} />
        </div>
        <LemonSlice size={70} x={860} y={610} rotate={20} opacity={0.75} />
        <div style={{ position: "absolute", left: 130, top: 1120, width: 820 * timeline, height: 4, background: INK, opacity: 0.55 }} />
        {[
          { x: 130, label: "1997 · 郑州" },
          { x: 700, label: "今天" },
        ].map((d, i) => (
          <div key={i} style={{ position: "absolute", left: d.x, top: 1108, opacity: timeline }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: i === 0 ? RED : INK, border: `3px solid ${c1}` }} />
            <div style={{ position: "absolute", left: i === 0 ? 0 : -40, top: 28, fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 20, color: MUTED, whiteSpace: "nowrap" }}>{d.label}</div>
          </div>
        ))}
        <div style={{ position: "absolute", left: 350, top: 1060, width: 360, height: 110, border: `2px dashed ${LINE}`, borderRadius: 12, opacity: seg(p, 0.5, 0.7) }} />
        <Stamp text="高质平价" x={450} y={1000} size={34} rotate={-6} t={seg(p, 0.62, 0.78)} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene02;
