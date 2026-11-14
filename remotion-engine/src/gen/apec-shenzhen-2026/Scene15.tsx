// Scene15 · 收尾：深圳见；21 个光点围成一圈
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, exitFade, seg, easeOut, pop, clamp01,
  INK, INK_SOFT, OCEAN, CORAL, GOLD, CREAM, SERIF, SANS, MONO,
} from "./ui";

const Scene15: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const ex = exitFade(p);
  const titleT = pop(seg(p, 0.02, 0.28));
  const ringT = easeOut(seg(p, 0.08, 0.46));
  const lineT = easeOut(seg(p, 0.3, 0.56));
  const subT = seg(p, 0.48, 0.7);
  const breathe = 0.5 + 0.5 * Math.sin(p * Math.PI * 4);

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: SANS }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ position: "absolute", inset: 0, opacity: ex }}>
        <Cap text="APEC CHINA 2026 / SHENZHEN" x={96} y={306} mono opacity={subT} accent={accent} />

        {/* 21 个光点 */}
        {Array.from({ length: 21 }, (_, i) => {
          const a = (i / 21) * Math.PI * 2 - Math.PI / 2;
          const t = pop(seg(p, 0.08 + i * 0.018, 0.22 + i * 0.018));
          const r = 250 + Math.sin(i * 1.9) * 18;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 540 + Math.cos(a) * r - 5,
                top: 760 + Math.sin(a) * r - 5,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: i % 6 === 0 ? CORAL : i % 4 === 0 ? GOLD : OCEAN,
                opacity: 0.8 * clamp01(t),
                transform: `scale(${t})`,
                boxShadow: i === 0 ? `0 0 0 ${8 + breathe * 8}px ${CORAL}14` : undefined,
              }}
            />
          );
        })}

        {/* 内圈 */}
        <div
          style={{
            position: "absolute",
            left: 540 - 214,
            top: 760 - 214,
            width: 428,
            height: 428,
            borderRadius: "50%",
            border: `1px dashed ${OCEAN}`,
            opacity: 0.22 * ringT,
            transform: `rotate(${p * 14}deg)`,
          }}
        />

        {/* 主字 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 640,
            width: 1080,
            textAlign: "center",
            opacity: titleT,
            transform: `scale(${0.88 + 0.12 * titleT}) translateY(${(1 - titleT) * 20}px)`,
          }}
        >
          <div style={{ fontFamily: SERIF, fontSize: 152, fontWeight: 700, color: INK, letterSpacing: 18, lineHeight: 1 }}>深圳见</div>
          <div style={{ width: 300 * lineT, height: 4, background: CORAL, margin: "28px auto 0" }} />
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            top: 862,
            width: 1080,
            textAlign: "center",
            opacity: subT,
            transform: `translateY(${(1 - subT) * 10}px)`,
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 16, color: INK_SOFT, letterSpacing: 5 }}>NOV 2026 · SHENZHEN</div>
          <div style={{ fontFamily: SANS, fontSize: 19, color: INK_SOFT, letterSpacing: 3, marginTop: 14 }}>21 个成员，一张桌子，下一段亚太故事</div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 540 - 100,
            top: 1050,
            width: 200,
            height: 60,
            borderRadius: 30,
            border: `1.5px solid ${CORAL}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: SANS,
            fontSize: 20,
            color: CORAL,
            letterSpacing: 2,
            opacity: subT,
            background: `${CREAM}88`,
          }}
        >
          评论区聊聊
        </div>

        <Hair x={96} y={1240} w={888} progress={seg(p, 0.5, 0.78)} color={INK} opacity={0.13} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 1262,
            fontFamily: SANS,
            fontSize: 17,
            color: INK_SOFT,
            letterSpacing: 2,
            opacity: seg(p, 0.56, 0.8),
          }}
        >
          从堪培拉到深圳，APEC 的故事还在继续
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene15;
