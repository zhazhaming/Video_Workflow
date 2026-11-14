// Scene11 · 会标：鲲鹏展翅，21 根羽翼代表 21 个成员；“乘大势，共翱翔”
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, KunpengMark, exitFade, mk, seg, easeOut, pop, clamp01,
  INK, INK_SOFT, OCEAN, CORAL, GOLD, CREAM, SERIF, SANS, MONO,
} from "./ui";

const Scene11: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.02);
  const m1 = mk(marks, 1, 0.32);
  const m2 = mk(marks, 2, 0.66);
  const ex = exitFade(p);
  const sunT = easeOut(seg(p, 0.02, 0.26));
  const birdT = easeOut(seg(p, 0.1, 0.62));
  const coreT = pop(seg(p, m1 + 0.02, m1 + 0.22));
  const wordT = seg(p, m2 + 0.02, m2 + 0.24);
  const ringT = easeOut(seg(p, 0.18, 0.48));

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: SANS }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ position: "absolute", inset: 0, opacity: ex, transform: `scale(${1 - 0.02 * (1 - ex)})` }}>
        <Cap text="APEC CHINA 2026 / EMBLEM" x={96} y={306} mono opacity={seg(p, 0.02, 0.1)} accent={accent} />
        <div
          style={{
            position: "absolute",
            right: 96,
            top: 306,
            fontFamily: MONO,
            fontSize: 13,
            color: INK_SOFT,
            letterSpacing: 3,
            textAlign: "right",
            opacity: seg(p, 0.12, 0.3),
          }}
        >
          KUNPENG
          <br />
          21 WINGS
        </div>

        {/* 金色日轮 */}
        <div
          style={{
            position: "absolute",
            left: 540 - 300,
            top: 760 - 300,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${GOLD}36 0%, ${GOLD}14 42%, transparent 70%)`,
            opacity: sunT,
            transform: `scale(${0.86 + 0.14 * sunT})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 540 - 192,
            top: 760 - 192,
            width: 384,
            height: 384,
            borderRadius: "50%",
            border: `1px solid ${GOLD}`,
            opacity: 0.3 * ringT,
          }}
        />

        {/* 鲲鹏 */}
        <div style={{ position: "absolute", left: 540, top: 780, opacity: birdT }}>
          <KunpengMark cx={0} cy={0} size={1.34} t={birdT} color={OCEAN} accent={CORAL} />
        </div>

        {/* 主文案 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 1110,
            width: 1080,
            textAlign: "center",
            opacity: wordT,
            transform: `translateY(${(1 - wordT) * 14}px)`,
          }}
        >
          <div style={{ fontFamily: SERIF, fontSize: 74, fontWeight: 700, color: INK, letterSpacing: 12 }}>乘大势，共翱翔</div>
          <div style={{ width: 90, height: 3, background: CORAL, margin: "18px auto 0" }} />
        </div>

        <div
          style={{
            position: "absolute",
            left: 96,
            top: 1042,
            fontFamily: SANS,
            fontSize: 18,
            color: INK_SOFT,
            letterSpacing: 3,
            opacity: seg(p, 0.3, 0.5),
          }}
        >
          深圳 · 鹏城
        </div>

        <Hair x={96} y={1250} w={888} progress={seg(p, 0.58, 0.82)} color={INK} opacity={0.14} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 1272,
            fontFamily: SANS,
            fontSize: 18,
            color: INK_SOFT,
            letterSpacing: 2,
            opacity: seg(p, 0.64, 0.84),
          }}
        >
          21 根羽翼交织成大鹏：不是 21 个孤岛，是 21 个一起飞的成员
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene11;
