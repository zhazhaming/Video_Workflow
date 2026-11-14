// Scene04 · 价格：两张价签，直接比。
import React from "react";
import type { GenSceneProps } from "../types";
import { Chip, Receipt, Shell, easeOut, mono, clamp01 } from "./ui";

const Scene04: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const a = clamp01((p - 0.04) / 0.2);
  const b = clamp01((p - 0.14) / 0.2);
  const note = easeOut(clamp01((p - 0.45) / 0.18));

  return (
    <Shell c1={c1} c2={c2} accent={accent} index={4} label="PRICE / PER 1M TOKENS" tag="MONEY">
      <div style={{ position: "absolute", left: 185, top: 350 }}>
        <div style={{ ...mono(14, accent, 900) }}>PRICE 01</div>
        <div style={{ fontFamily: "sans-serif", fontSize: 44, fontWeight: 900, color: "#171714", marginTop: 8 }}>
          都按百万 token 算
        </div>
      </div>

      <Receipt
        x={170} y={450} w={350} h={500}
        title="FABLE 5.2"
        rows={[
          { label: "INPUT / 百万 token", value: "$8" },
          { label: "OUTPUT / 百万 token", value: "$40" },
        ]}
        note="标准价 / ANTHROPIC"
        color={accent}
        progress={a}
      />
      <Receipt
        x={560} y={450} w={350} h={500}
        title="GPT-6 ASTRA"
        rows={[
          { label: "INPUT / 百万 token", value: "$10" },
          { label: "OUTPUT / 百万 token", value: "$50" },
        ]}
        note="标准价 / OPENAI"
        color="#496B7A"
        progress={b}
      />

      <div style={{ position: "absolute", left: 185, top: 1000, display: "flex", gap: 12, opacity: note }}>
        <Chip text="FABLE 低 20%" color={accent} size={14} />
        <Chip text="按标准价粗算" color="#171714" size={14} />
      </div>
      <div style={{ position: "absolute", left: 185, top: 1060, ...mono(12, "rgba(23,23,20,0.62)", 600), opacity: note }}>
        输入更便宜，长上下文任务更要算总账。
      </div>
    </Shell>
  );
};

export default Scene04;
