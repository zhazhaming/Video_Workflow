// Scene01 · 开场：两款模型像产品一样上桌。
import React from "react";
import type { GenSceneProps } from "../types";
import { Chip, Dust, ProductBox, Shell, clamp01, easeBack, easeOut, mono, stagger } from "./ui";

const Scene01: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const left = easeBack(clamp01((p - 0.03) / 0.24));
  const right = easeBack(clamp01((p - 0.1) / 0.24));
  const q = stagger(p, 0.26, 0.06, 0, 0.16);
  const q2 = stagger(p, 0.26, 0.06, 1, 0.16);
  const q3 = stagger(p, 0.26, 0.06, 2, 0.16);

  return (
    <Shell c1={c1} c2={c2} accent={accent} index={1} label="TWO NEW MODELS" tag="RELEASE DAY" watermark="2">
      <div style={{ position: "absolute", left: 185, top: 350, opacity: easeOut(clamp01(p / 0.15)) }}>
        <div style={{ ...mono(14, accent, 900) }}>2026 / 两款前沿模型</div>
        <div style={{ fontFamily: "sans-serif", fontSize: 42, fontWeight: 900, color: "#171714", marginTop: 10 }}>
          先看东西，再看价格
        </div>
      </div>

      <ProductBox
        x={170} y={500} w={330} h={410}
        brand="CLAUDE / ANTHROPIC"
        name={"FABLE\n5.2"}
        sub={"硬核技术工作\n代码 / 科研 / 长任务"}
        color={accent}
        tag="GENERAL MODEL"
        opacity={clamp01(left * 1.2)}
        scale={0.9 + 0.1 * left}
        rotate={-2.5 * (1 - left)}
      />
      <ProductBox
        x={580} y={500} w={330} h={410}
        brand="OPENAI / FRONTIER"
        name={"GPT-6\nASTRA"}
        sub={"通用工作模型\n长上下文 / 电脑操作"}
        color="#496B7A"
        tag="GENERAL MODEL"
        opacity={clamp01(right * 1.2)}
        scale={0.9 + 0.1 * right}
        rotate={2.5 * (1 - right)}
      />

      <div style={{ position: "absolute", left: 190, top: 960, display: "flex", gap: 12 }}>
        <Chip text="强在哪" color={accent} size={17} style={{ opacity: q, transform: `translateY(${(1 - q) * 10}px)` }} />
        <Chip text="多少钱" color={accent} size={17} style={{ opacity: q2, transform: `translateY(${(1 - q2) * 10}px)` }} />
        <Chip text="有多快" color={accent} size={17} style={{ opacity: q3, transform: `translateY(${(1 - q3) * 10}px)` }} />
      </div>
      <div style={{ position: "absolute", left: 190, top: 1040, ...mono(13, "rgba(23,23,20,0.62)", 600), opacity: q3 }}>
        INPUT / OUTPUT / SPEED / INTELLIGENCE
      </div>

      <Dust seed={seed + 3} p={p} color={accent} count={14} opacity={0.22} />
    </Shell>
  );
};

export default Scene01;
