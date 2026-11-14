// Scene04 · 1991：中国、中国香港、中国台北入席，21 个位子坐满
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, exitFade, mk, seg, easeOut, pop, clamp01,
  INK, INK_SOFT, OCEAN, CORAL, GOLD, CREAM, SERIF, SANS, MONO,
} from "./ui";

const CELL_W = 92;
const CELL_H = 66;
const GAP_X = 18;
const GAP_Y = 20;
const GRID_X = 128;
const GRID_Y = 612;
const CELLS = Array.from({ length: 21 }, (_, i) => {
  const row = Math.floor(i / 7);
  const col = i % 7;
  return { i, row, col, x: GRID_X + col * (CELL_W + GAP_X), y: GRID_Y + row * (CELL_H + GAP_Y) };
});
const HIGHLIGHT = [12, 13, 14];

const Scene04: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.02);
  const m1 = mk(marks, 1, 0.3);
  const m2 = mk(marks, 2, 0.64);
  const ex = exitFade(p);
  const gridT = easeOut(seg(p, 0.02, 0.2));
  const baseT = easeOut(seg(p, 0.08, 0.32));
  const newT = (i: number) => pop(seg(p, m1 + (i - 12) * 0.08, m1 + 0.18 + (i - 12) * 0.08));
  const restT = (i: number) => easeOut(seg(p, m2 - 0.16 + (i - 15) * 0.025, m2 + (i - 15) * 0.025));
  const ringT = easeOut(seg(p, m2 + 0.02, m2 + 0.24));
  const labelT = seg(p, m1 + 0.24, m1 + 0.44);

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: SANS }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ position: "absolute", inset: 0, opacity: ex, transform: `scale(${1 - 0.018 * (1 - ex)})` }}>
        <Cap text="GENEVA? NO — APEC / 1991" x={96} y={306} mono opacity={seg(p, 0.02, 0.1)} accent={accent} />
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
          中国入席，圆桌开始坐满
        </div>

        {/* 21 个席位格 */}
        {CELLS.map((cell) => {
          const isNew = HIGHLIGHT.includes(cell.i);
          const isRest = cell.i >= 15;
          const t = isNew ? newT(cell.i) : isRest ? restT(cell.i) : baseT;
          const active = isNew;
          return (
            <div
              key={cell.i}
              style={{
                position: "absolute",
                left: cell.x,
                top: cell.y - (isNew ? (1 - t) * 26 : 0),
                width: CELL_W,
                height: CELL_H,
                borderRadius: 7,
                background: active ? CORAL : isRest ? "rgba(251,246,234,0.45)" : `${OCEAN}12`,
                border: active ? `2px solid ${CORAL}` : `1px solid ${INK}33`,
                opacity: active ? clamp01(t) : isRest ? 0.7 * t : 0.9 * t,
                transform: `scale(${0.88 + 0.12 * t})`,
                boxShadow: active ? `0 10px 22px ${CORAL}22` : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: MONO,
                fontSize: 17,
                color: active ? CREAM : INK_SOFT,
                letterSpacing: 1,
              }}
            >
              {String(cell.i + 1).padStart(2, "0")}
            </div>
          );
        })}

        {/* 三个新席位连线 + 标注 */}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: labelT }}>
          {[
            { i: 12, x: 242, label: "中国" },
            { i: 13, x: 470, label: "中国香港" },
            { i: 14, x: 704, label: "中国台北" },
          ].map((item, k) => (
            <path
              key={k}
              d={`M ${CELLS[item.i].x + CELL_W / 2} ${CELLS[item.i].y + CELL_H + 2} L ${item.x} 900`}
              fill="none"
              stroke={CORAL}
              strokeWidth={1.2}
              opacity={0.46}
              strokeLinecap="round"
            />
          ))}
        </svg>
        {[
          { x: 180, label: "中国", i: 12 },
          { x: 408, label: "中国香港", i: 13 },
          { x: 642, label: "中国台北", i: 14 },
        ].map((item, k) => (
          <div
            key={k}
            style={{
              position: "absolute",
              left: item.x,
              top: 906,
              width: 150,
              textAlign: "center",
              fontFamily: SANS,
              fontSize: 19,
              color: CORAL,
              letterSpacing: 1.5,
              opacity: labelT,
            }}
          >
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: CORAL, margin: "0 auto 10px" }} />
            {item.label}
          </div>
        ))}

        {/* 右侧 21 的完成环 */}
        <div
          style={{
            position: "absolute",
            right: 88,
            top: 970,
            width: 196,
            height: 196,
            borderRadius: "50%",
            border: `1.5px dashed ${OCEAN}`,
            opacity: 0.35 * ringT,
            transform: `scale(${0.8 + 0.2 * ringT}) rotate(${p * 30}deg)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 104,
            top: 1004,
            width: 164,
            textAlign: "center",
            opacity: seg(p, m2 + 0.08, m2 + 0.28),
          }}
        >
          <div style={{ fontFamily: SERIF, fontSize: 92, fontWeight: 700, color: INK, lineHeight: 0.9 }}>21</div>
          <div style={{ fontFamily: SANS, fontSize: 15, color: INK_SOFT, letterSpacing: 2, marginTop: 8 }}>个成员经济体</div>
        </div>

        {/* 1991 大年份 */}
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 970,
            opacity: seg(p, 0.04, 0.16),
            transform: `translateY(${(1 - seg(p, 0.04, 0.16)) * 16}px)`,
          }}
        >
          <div style={{ fontFamily: SERIF, fontSize: 70, fontWeight: 700, color: INK, letterSpacing: -2 }}>1991</div>
          <div style={{ width: 112, height: 3, background: CORAL, marginTop: 6 }} />
          <div style={{ fontFamily: SANS, fontSize: 17, color: INK_SOFT, letterSpacing: 3, marginTop: 10 }}>中国加入 APEC</div>
        </div>

        <Hair x={96} y={1168} w={888} progress={seg(p, 0.4, 0.7)} color={INK} opacity={0.15} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 1190,
            fontFamily: SANS,
            fontSize: 18,
            color: INK_SOFT,
            letterSpacing: 2,
            opacity: seg(p, 0.5, 0.72),
          }}
        >
          成员称“经济体”，不是国家；三个新席位，让亚太的圆桌完整了
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene04;
