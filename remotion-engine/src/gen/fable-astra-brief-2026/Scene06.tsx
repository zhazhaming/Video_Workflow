// Scene06 · 智能程度：不是一张总分表，是一架天平。
import React from "react";
import type { GenSceneProps } from "../types";
import { Chip, INK, MUTED, PAPER, Scale, Shell, Stamp, clamp01, easeOut, mono, sans } from "./ui";

const Scene06: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const scaleIn = easeOut(clamp01((p - 0.02) / 0.2));
  const left = clamp01((p - 0.18) / 0.16);
  const right = clamp01((p - 0.3) / 0.16);
  const stamp = clamp01((p - 0.66) / 0.12);

  return (
    <Shell c1={c1} c2={c2} accent={accent} index={6} label="INTELLIGENCE / NOT ONE SCORE" tag="DEPTH VS BREADTH">
      <div style={{ position: "absolute", left: 185, top: 350 }}>
        <div style={{ ...mono(14, accent, 900) }}>INTELLIGENCE 01</div>
        <div style={{ fontFamily: "sans-serif", fontSize: 44, fontWeight: 900, color: INK, marginTop: 8 }}>
          别只看一个榜
        </div>
      </div>

      <div style={{ position: "absolute", left: 150, top: 440, opacity: scaleIn }}>
        <Scale x={0} y={0} p={p} colorA={accent} colorB="#496B7A" />
      </div>

      <div style={{ position: "absolute", left: 205, top: 792, width: 250, opacity: left, transform: `translateY(${(1 - left) * 12}px)` }}>
        <div style={{ ...mono(12, accent, 900) }}>DEPTH</div>
        <div style={{ ...sans(28, INK, 900), lineHeight: 1.2, marginTop: 6 }}>代码 / 科研<br />长任务</div>
      </div>
      <div style={{ position: "absolute", left: 640, top: 792, width: 250, textAlign: "right", opacity: right, transform: `translateY(${(1 - right) * 12}px)` }}>
        <div style={{ ...mono(12, "#496B7A", 900) }}>BREADTH</div>
        <div style={{ ...sans(28, INK, 900), lineHeight: 1.2, marginTop: 6 }}>长上下文<br />电脑操作</div>
      </div>

      <div style={{ position: "absolute", left: 185, top: 1012, display: "flex", gap: 10, opacity: left }}>
        <Chip text="FABLE 5.2" color={accent} size={13} />
        <Chip text="DEPTH" color={accent} size={13} />
      </div>
      <div style={{ position: "absolute", left: 610, top: 1012, display: "flex", gap: 10, opacity: right }}>
        <Chip text="BREADTH" color="#496B7A" size={13} />
        <Chip text="GPT-6 ASTRA" color="#496B7A" size={13} />
      </div>

      <Stamp text="NO SINGLE SCORE" x={390} y={1050} progress={stamp} rotate={-4} size={17} />
      <div style={{ position: "absolute", left: 185, top: 1135, ...mono(12, MUTED, 600), opacity: stamp }}>
        分数是参考，任务匹配才是判断。
      </div>
    </Shell>
  );
};

export default Scene06;
