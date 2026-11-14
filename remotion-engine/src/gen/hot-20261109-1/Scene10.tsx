// Scene10 · 收尾（签名与三枚小印）
// 赞、藏、转三枚小圆印依次落下，中间是手写感的签名与一条朱红横线。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, INK, INK_SOFT, FAINT, RED, seg, eo, pop } from "./ui";

const Scene10: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.1));
  const marks = ["赞", "藏", "转"];
  const sign = eo(seg(p, 0.45, 0.62));
  const line = eo(seg(p, 0.55, 0.75));
  const tail = eo(seg(p, 0.72, 0.86));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="SCIENCE, SIMPLY" x={96} y={318} size={18} />

        {marks.map((m, i) => {
          const t = seg(p, 0.08 + i * 0.12, 0.2 + i * 0.12);
          const s = pop(t);
          return (
            <div
              key={m}
              style={{
                position: "absolute",
                left: 262 + i * 278,
                top: 500,
                width: 120,
                height: 120,
                borderRadius: 60,
                border: `3px solid ${i === 1 ? RED : INK}`,
                color: i === 1 ? RED : INK,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: '"Songti SC", serif',
                fontSize: 38,
                transform: `scale(${0.6 + 0.4 * s}) translateY(${(1 - t) * 18}px)`,
                opacity: t,
              }}
            >
              {m}
            </div>
          );
        })}

        <div style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center", opacity: sign, transform: `translateY(${(1 - sign) * 16}px)` }}>
          <div style={{ fontFamily: '"Songti SC", serif', fontSize: 108, fontWeight: 700, color: INK, letterSpacing: 10 }}>阿扎</div>
          <div style={{ fontFamily: '"SF Mono", monospace', fontSize: 18, color: FAINT, letterSpacing: 8, marginTop: 12 }}>A ZHA · 科普</div>
        </div>

        <Hair x={390} y={1002} w={300} color={RED} thickness={3} progress={line} opacity={0.9} />

        <div style={{ position: "absolute", left: 0, right: 0, top: 1050, textAlign: "center", opacity: tail }}>
          <span style={{ fontFamily: '"Songti SC", serif', fontSize: 30, color: INK_SOFT }}>把复杂的事，说明白一点。</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene10;
