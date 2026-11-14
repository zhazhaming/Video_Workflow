// Scene07 · 天平：左边堆模型，右边一张规矩清单，反而压下去
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { MONO_STACK, FONT_STACK } from "../../dv/atmosphere";
import { Paper, Cap, Hair, INK, INK_SOFT, FAINT, RED, GOLD, SERIF_STACK, seg, eo, eio, pop, clamp01 } from "../autoloop-2026/ui";

const ACCENT = "#C8452D";

const Scene07: React.FC<GenSceneProps> = ({ p, c1, c2 }) => {
  const tilt = -8 + 17 * eo(seg(p, 0.18, 0.82));
  const drop = 6;
  const rules = ["先写需求", "小步实现", "拿证据", "再上线"];

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={ACCENT} />
      <Cap text="07 / LEVERAGE" x={150} y={392} />
      <Cap text="MODEL vs RULES" x={930} y={392} align="right" color={FAINT} />
      <Hair x={150} y={430} w={240} color={ACCENT} thickness={2} progress={eo(seg(p, 0.04, 0.3))} opacity={0.75} />

      {/* 支点 */}
      <div style={{ position: "absolute", left: 540 - 60, top: 1216, width: 0, height: 0, borderLeft: "60px solid transparent", borderRight: "60px solid transparent", borderBottom: `96px solid ${INK}` }} />
      <div style={{ position: "absolute", left: 540 - 8, top: 1150, width: 16, height: 74, background: INK }} />

      {/* 横梁 + 两盘 */}
      <div style={{ position: "absolute", left: 260, top: 1016, width: 560, height: 0, transform: `rotate(${tilt}deg)`, transformOrigin: "50% 50%" }}>
        <div style={{ position: "absolute", left: 0, top: -5, width: 560, height: 10, background: INK, borderRadius: 5 }} />
        {[0, 1].map((side) => {
          const isLeft = side === 0;
          return (
            <div
              key={side}
              style={{
                position: "absolute",
                left: isLeft ? 40 : 520,
                top: 0,
                width: 0,
                height: 0,
                transform: `rotate(${-tilt}deg)`,
              }}
            >
              <div style={{ position: "absolute", left: -86, top: 0, width: 172, height: 4, background: INK, borderRadius: 2 }} />
              <div style={{ position: "absolute", left: -86, top: 88, width: 172, height: 3, background: INK, opacity: 0.4 }} />
              <div style={{ position: "absolute", left: -84, top: 4, width: 1.5, height: 84, background: `${INK}55` }} />
              <div style={{ position: "absolute", left: 84, top: 4, width: 1.5, height: 84, background: `${INK}55` }} />
            </div>
          );
        })}
      </div>

      {/* 左盘模型方块 */}
      {Array.from({ length: drop }, (_, i) => {
        const t = pop(seg(p, 0.2 + i * 0.07, 0.3 + i * 0.07));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 300 - 54 + (i % 2) * 56,
              top: 1040 + Math.floor(i / 2) * 54 - 120,
              width: 50,
              height: 46,
              background: i % 3 === 0 ? ACCENT : INK,
              opacity: 0.2 + 0.8 * t,
              transform: `translateY(${(1 - t) * -80}px) rotate(${(i % 2 ? 1 : -1) * 3}deg)`,
              borderRadius: 4,
            }}
          />
        );
      })}
      <div style={{ position: "absolute", left: 250, top: 910, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 4, color: FAINT }}>MODEL</div>

      {/* 右盘清单 */}
      <div
        style={{
          position: "absolute", left: 700, top: 838, width: 190,
          background: "rgba(253,250,244,0.98)", border: `1.5px solid ${INK}22`, borderRadius: 6,
          boxShadow: `0 16px 32px ${INK}1A`,
          padding: "16px 16px 18px", boxSizing: "border-box",
          opacity: eo(seg(p, 0.3, 0.5)),
          transform: `translateY(${(1 - eo(seg(p, 0.3, 0.5))) * -26}px) rotate(2deg)`,
        }}
      >
        <div style={{ fontFamily: MONO_STACK, fontSize: 12, letterSpacing: 3, color: ACCENT }}>RULES</div>
        {rules.map((r, i) => (
          <div key={r} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 9 }}>
            <div style={{ width: 8, height: 8, background: ACCENT, borderRadius: 2 }} />
            <div style={{ fontFamily: FONT_STACK, fontSize: 17, color: INK }}>{r}</div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 760, top: 910, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 4, color: FAINT }}>RULES</div>

      {/* 指针 */}
      <div style={{ position: "absolute", left: 540 - 2, top: 950, width: 4, height: 96, background: ACCENT, transformOrigin: "50% 100%", transform: `rotate(${tilt * 2.2}deg)`, borderRadius: 2 }} />
      <div style={{ position: "absolute", left: 540 - 3, top: 944, width: 6, height: 6, borderRadius: 3, background: ACCENT }} />

      <div style={{ position: "absolute", left: 150, bottom: 470, fontFamily: FONT_STACK, fontSize: 24, color: INK_SOFT, opacity: eo(seg(p, 0.62, 0.78)) }}>
        模型决定下限，规矩决定上限
      </div>
    </AbsoluteFill>
  );
};

export default Scene07;
