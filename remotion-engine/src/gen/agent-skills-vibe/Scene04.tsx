// Scene04 · 六站流水线：AI 方块沿轨道走位盖章，终点卡尺量代码
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { MONO_STACK, FONT_STACK } from "../../dv/atmosphere";
import { Paper, Cap, Hair, INK, INK_SOFT, FAINT, RED, GOLD, SERIF_STACK, seg, eo, eio, pop, lerp, clamp01 } from "../autoloop-2026/ui";

const ACCENT = "#C8452D";
const STATIONS = ["DEFINE", "PLAN", "BUILD", "VERIFY", "REVIEW", "SHIP"];
const ZH = ["定需求", "拆任务", "写代码", "跑测试", "做评审", "上线"];

const Scene04: React.FC<GenSceneProps> = ({ p, c1, c2 }) => {
  const X0 = 150;
  const STEP = 140;
  const walk = eio(seg(p, 0.1, 0.86));
  const bx = lerp(X0, X0 + STEP * 5, walk);
  const by = 862;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={ACCENT} />
      <Cap text="04 / 6 STAGES" x={150} y={392} />
      <Cap text="DEFINE → SHIP" x={930} y={392} align="right" color={FAINT} />
      <Hair x={150} y={430} w={240} color={ACCENT} thickness={2} progress={eo(seg(p, 0.04, 0.3))} opacity={0.75} />

      {/* 轨道 */}
      <div style={{ position: "absolute", left: X0 - 60, top: 940, width: 900 * eo(seg(p, 0.04, 0.34)), height: 3, background: `${INK}44` }} />
      <div style={{ position: "absolute", left: X0 - 60, top: 940, width: (bx - X0 + 60), height: 3, background: ACCENT }} />

      {STATIONS.map((s, i) => {
        const x = X0 + i * STEP;
        const lit = seg(p, 0.12 + i * 0.12, 0.2 + i * 0.12);
        const stamp = pop(seg(p, 0.16 + i * 0.12, 0.24 + i * 0.12));
        return (
          <React.Fragment key={s}>
            <div
              style={{
                position: "absolute", left: x - 44, top: 986, width: 88, height: 88,
                border: `2px solid ${lit > 0.2 ? ACCENT : INK}${lit > 0.2 ? "" : "33"}`,
                background: lit > 0.2 ? `${ACCENT}10` : "rgba(251,247,239,0.6)",
                borderRadius: 8,
                transform: `translateY(${(1 - pop(seg(p, 0.02 + i * 0.03, 0.12 + i * 0.03))) * 18}px)`,
                opacity: 0.35 + 0.65 * eo(seg(p, 0.02 + i * 0.03, 0.12 + i * 0.03)),
              }}
            >
              <div style={{ position: "absolute", left: 0, right: 0, top: 20, textAlign: "center", fontFamily: MONO_STACK, fontSize: 20, fontWeight: 700, color: lit > 0.2 ? ACCENT : INK }}>{i + 1}</div>
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 12, textAlign: "center", fontFamily: FONT_STACK, fontSize: 16, color: INK_SOFT }}>{ZH[i]}</div>
            </div>
            <div style={{ position: "absolute", left: x - 54, top: 1086, width: 108, textAlign: "center", fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 1.5, color: lit > 0.2 ? INK_SOFT : FAINT }}>{s}</div>
            {stamp > 0.05 ? (
              <div style={{ position: "absolute", left: x + 22, top: 972, width: 24, height: 24, borderRadius: 12, background: ACCENT, transform: `scale(${1 + 0.3 * stamp})`, opacity: stamp, boxShadow: `0 0 0 4px ${ACCENT}18` }} />
            ) : null}
          </React.Fragment>
        );
      })}

      {/* AI 方块 */}
      <div
        style={{
          position: "absolute", left: bx - 26, top: by - 26, width: 52, height: 52,
          background: INK, borderRadius: 12,
          transform: `rotate(${Math.sin(walk * 18) * 8}deg) scale(${1 + 0.05 * Math.sin(walk * 24)})`,
          boxShadow: `0 14px 26px ${INK}33`,
        }}
      >
        <div style={{ position: "absolute", left: 12, top: 18, width: 8, height: 8, borderRadius: 4, background: "#FBF7EF" }} />
        <div style={{ position: "absolute", right: 12, top: 18, width: 8, height: 8, borderRadius: 4, background: "#FBF7EF" }} />
      </div>

      {/* 终点卡尺 */}
      <div style={{ position: "absolute", left: 700, top: 620, width: 220, height: 130, opacity: eo(seg(p, 0.72, 0.9)), transform: `translateY(${(1 - eo(seg(p, 0.72, 0.9))) * 14}px)` }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 2, height: 96, background: INK }} />
        <div style={{ position: "absolute", right: 0, top: 0, width: 2, height: 96, background: INK }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: 220, height: 2, background: INK }} />
        {Array.from({ length: 11 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: i * 20, top: 0, width: 1, height: i % 5 === 0 ? 16 : 9, background: INK, opacity: 0.5 }} />
        ))}
        <div style={{ position: "absolute", left: 0, top: 44, width: 220, height: 30, background: `${ACCENT}22`, border: `1.5px solid ${ACCENT}` }} />
        <div style={{ position: "absolute", left: 0, top: 100, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 2, color: FAINT }}>EVIDENCE REQUIRED</div>
      </div>

      <div style={{ position: "absolute", left: 150, bottom: 470, fontFamily: FONT_STACK, fontSize: 24, color: INK_SOFT, opacity: eo(seg(p, 0.55, 0.7)) }}>
        每一站，都要留下证据
      </div>
    </AbsoluteFill>
  );
};

export default Scene04;
