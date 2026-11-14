// Scene11 · 一张任务卡：什么时候、做什么、交给谁
// 不再展示 JSON：三行中文任务卡依次写入，荧光笔划过；右下角盖“可以用了”。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Card, Chip, Stamp, INK, INK_SOFT, FAINT, TEAL, RED, GOLD, MONO_STACK, SERIF_STACK, seg, eo, pop, lerp } from "./ui";

const rows = [
  { label: "什么时候", value: "早上 8:00", note: "到点自动开始", color: GOLD },
  { label: "做什么", value: "整理笔记和代码", note: "写成一份早报", color: TEAL },
  { label: "交给谁", value: "AI 助手", note: "干完再告诉你", color: TEAL },
];

const Scene11: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const cardIn = eo(seg(p, 0.04, 0.2));
  const mark = eo(seg(p, 0.4, 0.64));
  const stamp = pop(seg(p, 0.76, 0.9));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="11 / 一张任务卡" x={150} y={330} />
        <Cap text="写清楚就能跑" x={880} y={330} align="right" color={FAINT} />
        <Hair x={150} y={368} w={240} color={TEAL} thickness={2} progress={eo(seg(p, 0.08, 0.3))} opacity={0.65} />
      </div>

      <Card x={540} y={700} w={700} h={476} opacity={cardIn} scale={0.97 + 0.03 * cardIn} accent={TEAL} style={{ background: "rgba(251,247,239,0.95)" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: 46, borderBottom: `1px solid ${INK}16`, display: "flex", alignItems: "center", gap: 12, paddingLeft: 22, boxSizing: "border-box" }}>
          <div style={{ fontFamily: SERIF_STACK, fontSize: 22, color: INK }}>任务卡</div>
          <div style={{ fontFamily: MONO_STACK, fontSize: 12, letterSpacing: 2, color: FAINT }}>保存后自动生效</div>
          <div style={{ marginLeft: "auto", marginRight: 20, fontFamily: MONO_STACK, fontSize: 12, color: TEAL, letterSpacing: 2 }}>已保存</div>
        </div>

        <div style={{ position: "absolute", left: 28, top: 66, fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 2, color: FAINT }}>
          交给 AI 管家的一件事
        </div>

        {rows.map((r, i) => {
          const t = eo(seg(p, 0.14 + i * 0.07, 0.26 + i * 0.07));
          const y = 102 + i * 102;
          return (
            <div key={r.label} style={{ position: "absolute", left: 28, top: y, width: 644, opacity: t, transform: `translateX(${(1 - t) * 12}px)` }}>
              <div
                style={{
                  position: "absolute", left: 0, top: 0, width: 132, height: 42, borderRadius: 6,
                  background: `${r.color}14`, border: `1px solid ${r.color}55`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: MONO_STACK, fontSize: 17, letterSpacing: 1, color: r.color,
                }}
              >
                {r.label}
              </div>
              <div style={{ position: "absolute", left: 156, top: -6, fontFamily: SERIF_STACK, fontSize: 35, color: INK, whiteSpace: "nowrap" }}>
                {r.value}
              </div>
              <div style={{ position: "absolute", left: 158, top: 42, fontFamily: MONO_STACK, fontSize: 13, color: FAINT, letterSpacing: 1 }}>
                {r.note}
              </div>
              <div
                style={{
                  position: "absolute", left: 0, top: 76, width: `${mark * 100}%`, height: 2, background: r.color, opacity: 0.18,
                }}
              />
            </div>
          );
        })}

        <div style={{ position: "absolute", left: 28, bottom: 22, display: "flex", gap: 10 }}>
          <div style={{ fontFamily: MONO_STACK, fontSize: 13, color: TEAL, padding: "6px 12px", borderRadius: 5, background: `${TEAL}12` }}>保存</div>
          <div style={{ fontFamily: MONO_STACK, fontSize: 13, color: TEAL, padding: "6px 12px", borderRadius: 5, background: `${TEAL}12` }}>检查</div>
          <div style={{ fontFamily: MONO_STACK, fontSize: 13, color: FAINT, padding: "6px 12px", borderRadius: 5, background: "rgba(24,22,19,0.04)" }}>自动生效</div>
        </div>
      </Card>

      <div style={{ position: "absolute", left: 796, top: 990, opacity: stamp }}>
        <Stamp text="可以用了" x={0} y={0} size={26} rotate={-9} t={stamp} color={TEAL} />
      </div>

      <div style={{ position: "absolute", left: 150, top: 1060, opacity: eo(seg(p, 0.68, 0.86)) }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 16, letterSpacing: 3, color: FAINT }}>三件事，写清楚</div>
        <div style={{ marginTop: 8, fontFamily: SERIF_STACK, fontSize: 34, color: INK_SOFT }}>
          什么时候、做什么、交给谁。
        </div>
      </div>

      <div style={{ position: "absolute", left: 150, top: 1186, opacity: eo(seg(p, 0.7, 0.88)) }}>
        <Chip text="到点开始" x={0} y={0} w={150} color={INK_SOFT} bg="rgba(24,22,19,0.05)" size={16} />
        <Chip text="有人来找" x={166} y={0} w={150} color={INK_SOFT} bg="rgba(24,22,19,0.05)" size={16} />
        <Chip text="随时手动" x={332} y={0} w={150} color={RED} bg="rgba(180,72,46,0.07)" size={16} />
      </div>
    </AbsoluteFill>
  );
};

export default Scene11;
