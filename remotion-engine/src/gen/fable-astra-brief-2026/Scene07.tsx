// Scene07 · 怎么选：一张图，两条路。
import React from "react";
import type { GenSceneProps } from "../types";
import { Card, Chip, INK, MUTED, PAPER, Shell, clamp01, easeBack, easeOut, mono, sans } from "./ui";

const Scene07: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const top = easeOut(clamp01((p - 0.02) / 0.16));
  const left = easeBack(clamp01((p - 0.12) / 0.22));
  const right = easeBack(clamp01((p - 0.2) / 0.22));
  const arrows = easeOut(clamp01((p - 0.34) / 0.2));
  const note = clamp01((p - 0.62) / 0.14);

  return (
    <Shell c1={c1} c2={c2} accent={accent} index={7} label="HOW TO CHOOSE" tag="DECISION">
      <div style={{ position: "absolute", left: 185, top: 350 }}>
        <div style={{ ...mono(14, accent, 900) }}>DECISION 01</div>
        <div style={{ fontFamily: "sans-serif", fontSize: 44, fontWeight: 900, color: INK, marginTop: 8 }}>
          按任务选，不按名气选
        </div>
      </div>

      <div
        style={{
          position: "absolute", left: 430, top: 430, width: 220, height: 74,
          border: `2.5px solid ${INK}`, background: PAPER, borderRadius: 37,
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: top, transform: `translateY(${(1 - top) * 10}px)`,
        }}
      >
        <span style={mono(15, INK, 900)}>你的任务</span>
      </div>

      <Card x={160} y={590} w={350} h={380} opacity={clamp01(left * 1.2)} scale={0.94 + 0.06 * left} rotate={-1.2 * (1 - left)}>
        <div style={{ padding: "22px 22px 0" }}>
          <div style={{ ...mono(12, accent, 900) }}>PICK A</div>
          <div style={{ ...sans(38, INK, 900), marginTop: 10 }}>FABLE 5.2</div>
          <div style={{ height: 1.5, background: `${INK}18`, margin: "18px 0" }} />
          {["硬核代码", "科研 / 数学", "长任务 / Agent"].map((t) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
              <span style={{ width: 7, height: 7, background: accent }} />
              <span style={{ ...sans(20, INK, 700) }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", right: 20, bottom: 18, ...mono(11, MUTED, 600) }}>DEPTH</div>
      </Card>

      <Card x={560} y={590} w={350} h={380} opacity={clamp01(right * 1.2)} scale={0.94 + 0.06 * right} rotate={1.2 * (1 - right)}>
        <div style={{ padding: "22px 22px 0" }}>
          <div style={{ ...mono(12, "#496B7A", 900) }}>PICK B</div>
          <div style={{ ...sans(38, INK, 900), marginTop: 10 }}>GPT-6 ASTRA</div>
          <div style={{ height: 1.5, background: `${INK}18`, margin: "18px 0" }} />
          {["大文档 / 资料", "多工具 / 流程", "电脑操作"].map((t) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
              <span style={{ width: 7, height: 7, background: "#496B7A" }} />
              <span style={{ ...sans(20, INK, 700) }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", right: 20, bottom: 18, ...mono(11, MUTED, 600) }}>BREADTH</div>
      </Card>

      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <path d="M 470 504 C 440 550 390 570 340 590" fill="none" stroke={accent} strokeWidth="2.5" strokeDasharray="7 8" opacity={arrows} strokeDashoffset={-40 * (1 - arrows)} />
        <path d="M 610 504 C 640 550 690 570 735 590" fill="none" stroke="#496B7A" strokeWidth="2.5" strokeDasharray="7 8" opacity={arrows} strokeDashoffset={-40 * (1 - arrows)} />
      </svg>

      <Chip text="预算紧 → 先试小模型" color={INK} size={14} style={{ position: "absolute", left: 380, top: 1020, opacity: note }} />
      <div style={{ position: "absolute", left: 185, top: 1090, ...mono(12, MUTED, 600), opacity: note }}>
        选错场景，再强也白搭。
      </div>
    </Shell>
  );
};

export default Scene07;
