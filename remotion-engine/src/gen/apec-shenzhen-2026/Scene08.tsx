// Scene08 · 2040：布特拉加亚愿景，开放、活力、强韧、和平的亚太共同体
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, exitFade, mk, seg, easeOut, pop, clamp01, lerp,
  INK, INK_SOFT, OCEAN, CORAL, GOLD, SAGE, CREAM, SERIF, SANS, MONO,
} from "./ui";

const KEYWORDS = [
  { text: "开放", x: 160, y: 640, align: "left" as const, delay: 0.18 },
  { text: "活力", x: 920, y: 640, align: "right" as const, delay: 0.24 },
  { text: "强韧", x: 160, y: 1010, align: "left" as const, delay: 0.3 },
  { text: "和平", x: 920, y: 1010, align: "right" as const, delay: 0.36 },
];

const Scene08: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = mk(marks, 1, 0.34);
  const m2 = mk(marks, 2, 0.66);
  const ex = exitFade(p);
  const sunT = easeOut(seg(p, 0.02, 0.26));
  const horizonT = easeOut(seg(p, 0.08, 0.3));
  const arcT = easeOut(seg(p, 0.18, 0.7));
  const shipX = lerp(170, 360, easeOut(seg(p, 0.22, 0.9)));
  const shipT = seg(p, 0.14, 0.26);
  const wordT = (d: number) => pop(seg(p, d, d + 0.18));
  const compassT = easeOut(seg(p, 0.3, 0.62));

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: SANS }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ position: "absolute", inset: 0, opacity: ex, transform: `translateY(${(1 - ex) * 8}px)` }}>
        <Cap text="PUTRAJAYA VISION / 2040" x={96} y={306} mono opacity={seg(p, 0.02, 0.1)} accent={accent} />
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
          把目光放到 2040 年
        </div>

        {/* 太阳光芒：24 根细线，缓慢呼吸 */}
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const t = easeOut(seg(p, 0.08 + i * 0.004, 0.22 + i * 0.004));
          const len = 24 + (i % 4 === 0 ? 20 : 8);
          return (
            <div
              key={`ray${i}`}
              style={{
                position: "absolute",
                left: 540 + Math.cos(a) * 170,
                top: 888 + Math.sin(a) * 170,
                width: len,
                height: 1.2,
                background: i % 4 === 0 ? CORAL : GOLD,
                opacity: 0.32 * t,
                transform: `rotate(${(a * 180) / Math.PI}deg)`,
                transformOrigin: "0 50%",
              }}
            />
          );
        })}

        {/* 太阳 */}
        <div
          style={{
            position: "absolute",
            left: 540 - 190,
            top: 888 - 190 - (1 - sunT) * 58,
            width: 380,
            height: 380,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${GOLD}55 0%, ${GOLD}22 42%, transparent 70%)`,
            opacity: sunT,
            transform: `scale(${0.86 + 0.14 * sunT})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 540 - 74,
            top: 888 - 74 - (1 - sunT) * 58,
            width: 148,
            height: 148,
            borderRadius: "50%",
            background: `linear-gradient(160deg, ${GOLD}, ${CORAL})`,
            opacity: 0.82 * sunT,
          }}
        />

        {/* 海平线 */}
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 888,
            width: 888 * horizonT,
            height: 1.5,
            background: INK,
            opacity: 0.34,
          }}
        />
        <div style={{ position: "absolute", left: 96, top: 900, width: 888, height: 340, opacity: 0.5 * horizonT }}>
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 20 + (i % 3) * 40,
                top: 24 + i * 34,
                width: 848 - i * 36,
                height: 1,
                background: OCEAN,
                opacity: 0.08 + i * 0.012,
                transform: `scaleX(${clamp01(arcT * 1.6 - i * 0.05)})`,
                transformOrigin: "50% 50%",
              }}
            />
          ))}
        </div>

        {/* 扩张的同心弧 */}
        {[0, 1, 2].map((i) => {
          const t = easeOut(seg(p, 0.2 + i * 0.08, 0.5 + i * 0.08));
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 540 - (300 + i * 74),
                top: 888 - (300 + i * 74),
                width: (300 + i * 74) * 2,
                height: (300 + i * 74) * 2,
                borderRadius: "50%",
                border: `1px ${i === 1 ? "dashed" : "solid"} ${i === 2 ? CORAL : OCEAN}`,
                opacity: (i === 2 ? 0.18 : 0.1) * t,
                transform: `scale(${0.9 + 0.1 * t})`,
              }}
            />
          );
        })}

        {/* 大 2040 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 586,
            width: 1080,
            textAlign: "center",
            fontFamily: SERIF,
            fontSize: 180,
            fontWeight: 700,
            letterSpacing: 10,
            color: INK,
            opacity: 0.22 * sunT,
          }}
        >
          2040
        </div>

        {/* 四个关键词 */}
        {KEYWORDS.map((k) => {
          const t = wordT(k.delay);
          return (
            <div
              key={k.text}
              style={{
                position: "absolute",
                left: k.align === "left" ? k.x : k.x - 130,
                top: k.y,
                width: 130,
                textAlign: k.align,
                opacity: clamp01(t),
                transform: `translateY(${(1 - t) * 14}px)`,
              }}
            >
              <div style={{ fontFamily: SERIF, fontSize: 54, fontWeight: 700, color: k.text === "和平" ? CORAL : INK, letterSpacing: 4 }}>{k.text}</div>
              <div style={{ width: 34, height: 2, background: k.text === "和平" ? CORAL : OCEAN, marginTop: 8, marginLeft: k.align === "right" ? 96 : 0 }} />
            </div>
          );
        })}

        {/* 小船 */}
        <div style={{ position: "absolute", left: shipX, top: 858, opacity: shipT, transform: `translateY(${Math.sin(p * Math.PI * 4) * 3}px)` }}>
          <div style={{ width: 86, height: 12, background: INK, clipPath: "polygon(0 0, 100% 0, 86% 100%, 10% 100%)", opacity: 0.6 }} />
          <div style={{ position: "absolute", left: 42, top: -38, width: 2, height: 40, background: INK, opacity: 0.5 }} />
          <div style={{ position: "absolute", left: 44, top: -36, width: 28, height: 20, background: CORAL, clipPath: "polygon(0 0, 100% 45%, 0 100%)", opacity: 0.7 }} />
        </div>

        {/* 罗盘 */}
        <div
          style={{
            position: "absolute",
            right: 108,
            top: 1070,
            width: 120,
            height: 120,
            borderRadius: "50%",
            border: `1px solid ${OCEAN}`,
            opacity: 0.32 * compassT,
            transform: `scale(${0.8 + 0.2 * compassT}) rotate(${p * 10}deg)`,
          }}
        >
          <div style={{ position: "absolute", left: 58, top: 12, width: 1, height: 96, background: OCEAN }} />
          <div style={{ position: "absolute", left: 12, top: 58, width: 96, height: 1, background: OCEAN }} />
          <div style={{ position: "absolute", left: 52, top: 52, width: 16, height: 16, borderRadius: "50%", border: `1px solid ${OCEAN}` }} />
        </div>

        <Hair x={96} y={1270} w={888} progress={seg(p, 0.58, 0.84)} color={INK} opacity={0.13} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 1292,
            fontFamily: SANS,
            fontSize: 18,
            color: INK_SOFT,
            letterSpacing: 2,
            opacity: seg(p, 0.64, 0.86),
          }}
        >
          2040 年，建成开放、活力、强韧、和平的亚太共同体
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene08;
