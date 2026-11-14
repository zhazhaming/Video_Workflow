// Scene13 · 第33次领导人非正式会议，深圳，11月
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, ShenzhenSkyline, exitFade, mk, seg, easeOut, pop, clamp01,
  INK, INK_SOFT, OCEAN, CORAL, GOLD, CREAM, SERIF, SANS, MONO,
} from "./ui";

const Scene13: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = mk(marks, 1, 0.36);
  const m2 = mk(marks, 2, 0.66);
  const ex = exitFade(p);
  const numT = pop(seg(p, 0.04, 0.3));
  const sunT = easeOut(seg(p, 0.02, 0.28));
  const skyT = easeOut(seg(p, 0.12, 0.42));
  const lightT = seg(p, m2 + 0.02, m2 + 0.34);
  const lineT = easeOut(seg(p, m1, m1 + 0.24));

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: SANS }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ position: "absolute", inset: 0, opacity: ex, transform: `scale(${1 - 0.018 * (1 - ex)})` }}>
        <Cap text="33RD APEC ECONOMIC LEADERS' MEETING" x={96} y={306} mono opacity={seg(p, 0.02, 0.1)} accent={accent} />

        {/* 夕阳 */}
        <div
          style={{
            position: "absolute",
            left: 540 - 250,
            top: 880 - 250,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${GOLD}44 0%, ${CORAL}14 44%, transparent 70%)`,
            opacity: sunT,
            transform: `scale(${0.86 + 0.14 * sunT})`,
          }}
        />

        {/* 33 道光芒 */}
        {Array.from({ length: 33 }, (_, i) => {
          const a = (i / 33) * Math.PI * 2;
          const t = easeOut(seg(p, 0.12 + i * 0.005, 0.26 + i * 0.005));
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 540 + Math.cos(a) * 248,
                top: 828 + Math.sin(a) * 248,
                width: 20,
                height: 1.5,
                background: i % 3 === 0 ? CORAL : GOLD,
                opacity: 0.28 * t,
                transform: `rotate(${(a * 180) / Math.PI}deg)`,
                transformOrigin: "0 50%",
              }}
            />
          );
        })}

        {/* 大 33 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 560,
            width: 1080,
            textAlign: "center",
            fontFamily: SERIF,
            fontSize: 300,
            fontWeight: 700,
            color: CORAL,
            lineHeight: 0.9,
            letterSpacing: -12,
            opacity: numT,
            transform: `scale(${0.9 + 0.1 * numT})`,
            textShadow: `0 0 60px ${CORAL}12`,
          }}
        >
          33
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 858,
            width: 1080,
            textAlign: "center",
            fontFamily: SERIF,
            fontSize: 30,
            color: INK,
            letterSpacing: 8,
            opacity: seg(p, m1, m1 + 0.2),
          }}
        >
          第33次领导人非正式会议
        </div>

        {/* 天际线 */}
        <div style={{ opacity: 0.78 * skyT, transform: `translateY(${(1 - skyT) * 46}px)` }}>
          <ShenzhenSkyline y={1284} opacity={0.92} lightT={0.55 * lightT} />
        </div>

        {/* 21 盏灯 */}
        {Array.from({ length: 21 }, (_, i) => {
          const t = seg(p, m2 + i * 0.012, m2 + 0.16 + i * 0.012);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 150 + (i / 20) * 780,
                top: 1158 + Math.sin(i * 1.7) * 26,
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: i % 5 === 0 ? CORAL : GOLD,
                opacity: 0.9 * t,
                boxShadow: `0 0 10px ${i % 5 === 0 ? CORAL : GOLD}88`,
                transform: `scale(${0.5 + 0.5 * t})`,
              }}
            />
          );
        })}

        <div
          style={{
            position: "absolute",
            left: 96,
            top: 1004,
            opacity: lineT,
            transform: `translateX(${(1 - lineT) * -20}px)`,
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: 4, color: INK_SOFT }}>SHENZHEN / NOV 2026</div>
          <div style={{ width: 190, height: 2, background: CORAL, marginTop: 12, opacity: 0.7 }} />
        </div>

        <Hair x={96} y={1370} w={888} progress={seg(p, 0.62, 0.86)} color={INK} opacity={0.13} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 1392,
            fontFamily: SANS,
            fontSize: 18,
            color: INK_SOFT,
            letterSpacing: 2,
            opacity: seg(p, 0.68, 0.88),
          }}
        >
          这座城把 21 个成员请到家里，也把自己放进亚太的下一段叙事
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene13;
