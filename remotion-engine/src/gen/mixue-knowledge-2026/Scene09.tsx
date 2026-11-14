// Scene09 · 雪王：一首主题曲，全网曝光 95 亿次
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Counter, Snowman, Signature, exitFade, mk, seg, easeOut, pop, clamp01,
  RED, INK, MUTED, LEMON, CREAM,
} from "./ui";

const NOTES = [
  { x: 700, y: 560, d: 0.0, s: 42 },
  { x: 790, y: 640, d: 0.12, s: 34 },
  { x: 640, y: 720, d: 0.24, s: 38 },
  { x: 860, y: 520, d: 0.36, s: 30 },
];

const Scene09: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m2 = mk(marks, 2, 0.58);
  const wave = Math.sin(clamp01(p) * Math.PI * 4);
  const count = 95 * easeOut(seg(p, m2 - 0.05, m2 + 0.22));
  const king = pop(seg(p, 0.06, 0.24));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <Signature />
        <div style={{ position: "absolute", left: 220, top: 520, width: 420, height: 420, borderRadius: "50%", background: RED, opacity: 0.1 * seg(p, 0.02, 0.3) }} />
        <Cap text="品牌符号" x={96} y={330} opacity={seg(p, 0.02, 0.1)} />
        <div style={{ position: "absolute", left: 96, top: 368, fontFamily: '"Songti SC",serif', fontSize: 40, color: INK, opacity: seg(p, 0.05, 0.16) }}>
          雪王，把便宜变成了记忆点
        </div>
        <div style={{ position: "absolute", left: 280, top: 470 + (1 - king) * 40, opacity: clamp01(king) }}>
          <Snowman x={0} y={0} size={300} wave={wave} />
        </div>
        <div style={{ position: "absolute", left: 650, top: 470, opacity: seg(p, 0.12, 0.26) }}>
          <div style={{ fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 22, color: MUTED, letterSpacing: 3 }}>
            主题曲曝光
          </div>
        </div>
        <Counter value={count} x={646} y={510} size={150} suffix="亿次" suffixSize={50} color={RED} opacity={seg(p, m2 - 0.08, m2 + 0.02)} />
        <div style={{ position: "absolute", left: 650, top: 700, width: 320, height: 3, background: INK, opacity: 0.15 }} />
        <div style={{ position: "absolute", left: 650, top: 720, fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 20, color: MUTED, letterSpacing: 2, opacity: seg(p, 0.4, 0.56) }}>
          “你爱我，我爱你”
        </div>
        {NOTES.map((n, i) => {
          const t = clamp01(p * 1.2 - n.d);
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: n.x, top: n.y - t * 120,
                fontSize: n.s, color: i % 2 === 0 ? RED : INK, opacity: (1 - t) * 0.75,
                fontFamily: '"Songti SC",serif', transform: `rotate(${Math.sin(t * 6 + i) * 12}deg)`,
              }}
            >
              ♪
            </div>
          );
        })}
        {Array.from({ length: 14 }, (_, i) => {
          const h = 18 + Math.abs(Math.sin(p * Math.PI * 6 + i * 0.7)) * 62;
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: 650 + i * 22, top: 860 - h,
                width: 12, height: h, background: i % 3 === 0 ? RED : INK,
                opacity: 0.55, borderRadius: 2,
              }}
            />
          );
        })}
        <div style={{ position: "absolute", left: 650, top: 884, width: 320, height: 2, background: INK, opacity: 0.2 }} />
        <div style={{ position: "absolute", left: 96, top: 1080, fontFamily: '"Songti SC",serif', fontSize: 30, color: RED, opacity: seg(p, 0.62, 0.8), transform: "rotate(-3deg)" }}>
          便宜不是标签，是街头暗号
        </div>
        <div style={{ position: "absolute", left: 96, top: 1130, width: 420, height: 4, background: LEMON, opacity: seg(p, 0.7, 0.9) }} />
        <div style={{ position: "absolute", left: 96, top: 950, width: 120, height: 120, border: `2px dashed ${CREAM}`, borderRadius: "50%", opacity: 0.4, transform: `rotate(${p * 40}deg)` }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene09;
