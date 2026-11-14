// Scene10 · 深圳底气：3.87 万亿 GDP、研发强度与 PCT 专利全国第一、平均年龄 32.5 岁
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, ShenzhenSkyline, exitFade, mk, seg, easeOut, pop, clamp01,
  INK, INK_SOFT, OCEAN, CORAL, GOLD, CREAM, SERIF, SANS, MONO,
} from "./ui";

const Scene10: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.02);
  const m1 = mk(marks, 1, 0.32);
  const m2 = mk(marks, 2, 0.63);
  const ex = exitFade(p);
  const gdpT = easeOut(seg(p, 0.04, 0.26));
  const ageT = pop(seg(p, m2 + 0.04, m2 + 0.26));
  const statT = (i: number) => pop(seg(p, m1 + i * 0.1, m1 + 0.2 + i * 0.1));
  const skyT = easeOut(seg(p, 0.02, 0.3));
  const gdp = 3.87 * gdpT;
  const age = 32.5 * (0.6 + 0.4 * ageT);
  const lightT = seg(p, 0.25, 0.6);

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: SANS }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ position: "absolute", inset: 0, opacity: ex, transform: `translateY(${(1 - ex) * 6}px)` }}>
        <Cap text="SHENZHEN / WHY HERE" x={96} y={306} mono opacity={seg(p, 0.02, 0.1)} accent={accent} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 344,
            fontFamily: SERIF,
            fontSize: 44,
            color: INK,
            letterSpacing: 3,
            opacity: seg(p, 0.05, 0.16),
          }}
        >
          深圳，为什么接得住
        </div>

        {/* 天际线 */}
        <div style={{ opacity: skyT, transform: `translateY(${(1 - skyT) * 40}px)` }}>
          <ShenzhenSkyline y={1280} opacity={0.7} color="#3F5A55" lightT={0.42 * lightT} />
        </div>

        {/* GDP 数字 */}
        <div style={{ position: "absolute", left: 92, top: 540, opacity: gdpT, transform: `translateY(${(1 - gdpT) * 18}px)` }}>
          <div style={{ fontFamily: SERIF, fontSize: 174, fontWeight: 700, color: CORAL, lineHeight: 0.86, letterSpacing: -7 }}>
            {gdp.toFixed(2)}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 10 }}>
            <span style={{ fontFamily: SERIF, fontSize: 46, fontWeight: 700, color: INK }}>万亿元</span>
            <span style={{ fontFamily: SANS, fontSize: 18, color: INK_SOFT, letterSpacing: 2 }}>2025 年 GDP</span>
          </div>
          <div style={{ width: 280, height: 2, background: CORAL, marginTop: 18, opacity: 0.55 }} />
        </div>

        {/* 平均年龄 */}
        <div style={{ position: "absolute", right: 96, top: 644, textAlign: "right", opacity: ageT, transform: `translateY(${(1 - ageT) * 16}px)` }}>
          <div style={{ fontFamily: SERIF, fontSize: 96, fontWeight: 700, color: OCEAN, lineHeight: 0.9, letterSpacing: -4 }}>
            {age.toFixed(1)}<span style={{ fontSize: 38, letterSpacing: 0 }}>岁</span>
          </div>
          <div style={{ fontFamily: SANS, fontSize: 17, color: INK_SOFT, letterSpacing: 2, marginTop: 8 }}>市民平均年龄</div>
        </div>

        {/* 两个全国第一 */}
        {[
          { label: "研发投入强度", value: "全国第一", x: 96, y: 1002, color: OCEAN },
          { label: "PCT 国际专利", value: "全国第一", x: 500, y: 1002, color: CORAL },
        ].map((s, i) => {
          const t = statT(i);
          return (
            <div
              key={s.label}
              style={{
                position: "absolute",
                left: s.x,
                top: s.y - (1 - t) * 14,
                width: 310,
                padding: "16px 20px 15px",
                borderTop: `2px solid ${s.color}`,
                background: "rgba(251,246,234,0.96)",
                borderRadius: 2,
                boxShadow: `0 8px 18px rgba(66,44,25,0.08)`,
                opacity: clamp01(t),
              }}
            >
              <div style={{ fontFamily: SANS, fontSize: 16, color: INK_SOFT, letterSpacing: 2 }}>{s.label}</div>
              <div style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 700, color: s.color, marginTop: 6, letterSpacing: 2 }}>{s.value}</div>
            </div>
          );
        })}

        {/* 深圳竖章 */}
        <div
          style={{
            position: "absolute",
            right: 120,
            top: 910,
            padding: "8px 8px",
            border: `1.5px solid ${CORAL}`,
            color: CORAL,
            fontFamily: SERIF,
            fontSize: 24,
            letterSpacing: 6,
            writingMode: "vertical-rl",
            opacity: 0.7 * ageT,
          }}
        >
          深圳
        </div>

        <Hair x={96} y={1360} w={888} progress={seg(p, 0.6, 0.84)} color={INK} opacity={0.13} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 1382,
            fontFamily: SANS,
            fontSize: 18,
            color: INK_SOFT,
            letterSpacing: 2,
            opacity: seg(p, 0.66, 0.86),
          }}
        >
          年轻、能造、敢投研发，这座城的气质，正好对上 APEC 的创新议题
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene10;
