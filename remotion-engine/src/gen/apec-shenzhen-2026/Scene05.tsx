// Scene05 · 1993 西雅图：APEC 第一次领导人非正式会议，机制升到最高层
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, exitFade, mk, seg, easeOut, pop, clamp01, lerp,
  INK, INK_SOFT, OCEAN, CORAL, GOLD, CREAM, SERIF, SANS, MONO,
} from "./ui";

const STEPS = [
  { year: "1989", x: 220, y: 1148, w: 132, h: 34 },
  { year: "1990", x: 346, y: 1088, w: 132, h: 34 },
  { year: "1991", x: 472, y: 1028, w: 132, h: 34 },
  { year: "1992", x: 598, y: 968, w: 132, h: 34 },
  { year: "1993", x: 724, y: 908, w: 168, h: 34 },
];

const Scene05: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.02);
  const m1 = mk(marks, 1, 0.28);
  const m2 = mk(marks, 2, 0.64);
  const ex = exitFade(p);
  const stairsT = easeOut(seg(p, 0.02, 0.28));
  const climb = easeOut(seg(p, 0.2, 0.72));
  const flagT = pop(seg(p, m2 + 0.02, m2 + 0.24));
  const leaderT = seg(p, m2 + 0.12, m2 + 0.34);
  const needT = seg(p, 0.04, 0.18);

  const figs = [0, 1, 2, 3].map((i) => {
    const t = clamp01(climb * 1.35 - i * 0.16);
    const idx = Math.min(4, Math.floor(t * 4.999));
    const local = t * 4.999 - idx;
    const a = STEPS[idx];
    const b = STEPS[Math.min(4, idx + 1)];
    const x = lerp(a.x + 60, b.x + 60, local);
    const y = lerp(a.y - 12, b.y - 12, local);
    return { x, y, op: t > 0.02 ? 1 : 0, delay: i * 0.08 };
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: SANS }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ position: "absolute", inset: 0, opacity: ex, transform: `translateY(${(1 - ex) * 8}px)` }}>
        <Cap text="SEATTLE / 1993" x={96} y={306} mono opacity={seg(p, 0.02, 0.1)} accent={accent} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 344,
            fontFamily: SERIF,
            fontSize: 43,
            color: INK,
            letterSpacing: 3,
            opacity: seg(p, 0.05, 0.16),
          }}
        >
          从部长桌，走到领导人桌
        </div>

        {/* 大年份 */}
        <div style={{ position: "absolute", left: 96, top: 520, opacity: needT }}>
          <div style={{ fontFamily: SERIF, fontSize: 128, fontWeight: 700, color: INK, lineHeight: 0.9, letterSpacing: -4 }}>1993</div>
          <div style={{ width: 120, height: 3, background: CORAL, marginTop: 12 }} />
          <div style={{ fontFamily: SANS, fontSize: 17, color: INK_SOFT, letterSpacing: 3, marginTop: 12 }}>第一次领导人非正式会议</div>
        </div>

        {/* 太空针塔剪影 */}
        <div style={{ position: "absolute", right: 96, top: 540, width: 180, height: 420, opacity: 0.65 * needT }}>
          <div style={{ position: "absolute", left: 86, top: 0, width: 3, height: 208, background: OCEAN, opacity: 0.42 }} />
          <div style={{ position: "absolute", left: 54, top: 196, width: 72, height: 26, borderRadius: "50%", border: `2px solid ${OCEAN}`, background: `${CREAM}aa` }} />
          <div style={{ position: "absolute", left: 76, top: 216, width: 28, height: 30, background: OCEAN, opacity: 0.55 }} />
          <div style={{ position: "absolute", left: 84, top: 246, width: 10, height: 132, background: OCEAN, opacity: 0.5 }} />
          <div style={{ position: "absolute", left: 67, top: 374, width: 44, height: 5, background: OCEAN, opacity: 0.35 }} />
          <div style={{ position: "absolute", left: 40, top: 392, width: 98, height: 2, background: OCEAN, opacity: 0.25 }} />
        </div>

        {/* 台阶 */}
        {STEPS.map((s, i) => {
          const t = easeOut(seg(p, 0.04 + i * 0.045, 0.2 + i * 0.045));
          return (
            <div key={s.year} style={{ position: "absolute", left: s.x, top: s.y, opacity: t }}>
              <div
                style={{
                  width: s.w,
                  height: s.h,
                  background: i === 4 ? CORAL : `${OCEAN}${i < 2 ? "22" : "33"}`,
                  border: `1px solid ${i === 4 ? CORAL : INK}44`,
                  transform: `translateY(${(1 - t) * 24}px)`,
                  opacity: i === 4 ? 0.92 : 0.78,
                }}
              />
              <div style={{ fontFamily: MONO, fontSize: 12, color: i === 4 ? CREAM : INK_SOFT, letterSpacing: 1.5, marginTop: -22, marginLeft: 12 }}>
                {s.year}
              </div>
            </div>
          );
        })}

        {/* 爬升的四个人影 */}
        {figs.map((f, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: f.x - 8,
              top: f.y - 28,
              width: 16,
              height: 30,
              opacity: f.op,
              transform: `translateY(${(1 - clamp01(climb * 1.35 - i * 0.16)) * 8}px)`,
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: CORAL, margin: "0 auto" }} />
            <div style={{ width: 2, height: 12, background: CORAL, margin: "1px auto 0" }} />
            <div style={{ width: 10, height: 2, background: CORAL, margin: "1px auto 0" }} />
          </div>
        ))}

        {/* 顶端平台 + 旗 */}
        <div
          style={{
            position: "absolute",
            right: 190,
            top: 838,
            opacity: flagT,
            transform: `translateY(${(1 - flagT) * 18}px)`,
          }}
        >
          <div style={{ width: 78, height: 2, background: INK, opacity: 0.5 }} />
          <div style={{ position: "absolute", left: 38, top: -82, width: 2, height: 84, background: INK, opacity: 0.55 }} />
          <div
            style={{
              position: "absolute",
              left: 40,
              top: -80,
              width: 54,
              height: 34,
              background: CORAL,
              clipPath: "polygon(0 0, 100% 14%, 82% 50%, 100% 86%, 0 100%)",
              transform: `scaleX(${flagT})`,
              transformOrigin: "left center",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            right: 96,
            top: 900,
            fontFamily: MONO,
            fontSize: 12,
            letterSpacing: 3,
            color: INK_SOFT,
            opacity: leaderT,
          }}
        >
          LEADERS&apos; MEETING
        </div>

        <Hair x={96} y={1166} w={888} progress={seg(p, 0.4, 0.7)} color={INK} opacity={0.15} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 1188,
            fontFamily: SANS,
            fontSize: 18,
            color: INK_SOFT,
            letterSpacing: 2,
            opacity: seg(p, 0.5, 0.72),
          }}
        >
          西雅图之后，领导人每年见一次，APEC 从“谈业务”变成“定方向”
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene05;
