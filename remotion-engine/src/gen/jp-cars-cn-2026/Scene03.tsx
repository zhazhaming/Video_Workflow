// Scene03 · 曾经的金字招牌（三块挂牌：省油 / 耐用 / 保值，吊绳摇入 + 星光）
// 场景即内容：牌面文字是信息主体（招牌词），衬线大字，落在安全区。
// 动画只由 p 驱动，只用 transform / opacity。
import React from "react";
import type { GenSceneProps } from "../types";
import { rand } from "../../dv/atmosphere";
import { Paper, Cap, Hair, INK, INK_SOFT, RED, GOLD, SERIF_STACK, MARGIN, seg, eo, pop, clamp01, lerp } from "./ui";

const PLAQUES = [
  { x: 130, w: 226, text: "省油", phase: 0.4 },
  { x: 412, w: 256, text: "耐用", phase: 2.2 },
  { x: 716, w: 226, text: "保值", phase: 4.1 },
];
const RAIL_Y = 470;
const PLQ_Y = 640;

const Scene03: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const main = accent || RED;
  const ex = seg(p, 0.88, 1);
  const railT = eo(seg(p, 0, 0.1));

  // 星光点
  const sparks = React.useMemo(
    () =>
      Array.from({ length: 12 }, (_, k) => ({
        x: 120 + rand(k * 5 + 21) * 840,
        y: 360 + rand(k * 5 + 22) * 820,
        r: 2.5 + rand(k * 5 + 23) * 3.5,
        ph: rand(k * 5 + 24) * Math.PI * 2,
        sp: 0.6 + rand(k * 5 + 25) * 0.9,
      })),
    [],
  );

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} />

      <Cap text="当年的金字招牌" x={MARGIN} y={356} size={26} color={INK_SOFT} accent={main} opacity={railT} />

      {/* 挂杆 */}
      <div style={{ position: "absolute", left: MARGIN, top: RAIL_Y, width: 888, height: 8, borderRadius: 4, background: INK_SOFT, opacity: 0.55 * railT }} />
      <Hair x={MARGIN} y={RAIL_Y - 16} w={888} color={GOLD} thickness={2} opacity={0.4} progress={railT} />

      {/* 三块挂牌 */}
      {PLAQUES.map((q, i) => {
        const inT = seg(p, 0.08 + i * 0.05, 0.2 + i * 0.05);
        const drop = eo(inT);
        const amp = lerp(9, 2.6, clamp01(inT * 1.2)); // 荡入幅度渐收
        const rot = Math.sin(p * Math.PI * 2 * 0.8 + q.phase) * amp * (1 - ex * 0.6);
        const sc = 0.7 + 0.3 * pop(inT);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: q.x,
              top: RAIL_Y,
              opacity: clamp01(inT * 2),
              transform: `translateY(${drop * (PLQ_Y - RAIL_Y)}px)`,
            }}
          >
            {/* 双绳 */}
            <div style={{ position: "absolute", left: 34, top: 0, width: 2, height: 96, background: INK_SOFT, opacity: 0.6, transform: `rotate(${rot * 0.4}deg)`, transformOrigin: "top center" }} />
            <div style={{ position: "absolute", right: 34, top: 0, width: 2, height: 96, background: INK_SOFT, opacity: 0.6, transform: `rotate(${-rot * 0.4}deg)`, transformOrigin: "top center" }} />
            {/* 牌面 */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 96,
                width: q.w,
                height: 130,
                borderRadius: 14,
                background: "#F8F1E0",
                border: `3px solid ${GOLD}88`,
                boxShadow: `0 14px 26px ${INK}1E, inset 0 0 0 6px ${main}12`,
                transform: `rotate(${rot}deg) scale(${sc})`,
                transformOrigin: "50% -96px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ position: "absolute", top: 10, left: 12, right: 12, height: 2, background: GOLD, opacity: 0.35 }} />
              <div style={{ position: "absolute", bottom: 10, left: 12, right: 12, height: 2, background: GOLD, opacity: 0.35 }} />
              <span
                style={{
                  fontFamily: SERIF_STACK,
                  fontSize: 58,
                  fontWeight: 700,
                  letterSpacing: 10,
                  color: INK,
                  paddingLeft: 10,
                }}
              >
                {q.text}
              </span>
            </div>
          </div>
        );
      })}

      {/* 星光点 */}
      {sparks.map((s, k) => {
        const tw = 0.5 + 0.5 * Math.sin(p * Math.PI * 2 * s.sp + s.ph);
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: s.x,
              top: s.y,
              width: s.r * 2,
              height: s.r * 2,
              borderRadius: "50%",
              background: GOLD,
              opacity: tw * 0.4 * (1 - ex),
            }}
          />
        );
      })}
    </div>
  );
};

export default Scene03;
