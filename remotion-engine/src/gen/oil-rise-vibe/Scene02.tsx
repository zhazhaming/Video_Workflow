// Scene02 · 2026 调价记录：年内 21 次窗口，14 涨 5 跌 2 搁浅（计数板，非时序）
// 数字全部来自 briefs/oil-rise-vibe-facts.md 白名单 N7（S15/S16/S17 + 网易订阅）。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Num, Chip, exitStyle, mk,
  INK, INK_SOFT, INK_FAINT, RED,
  seg, eo, eoq, pop,
} from "./ui";

const GREEN = "#1E7A55";

// 计数板：上调 14 / 下调 5 / 搁浅 2 / 待调 4（聚合呈现，不暗示时序）
const UP = 14;
const DOWN = 5;
const FLAT = 2;
const TOTAL = 25;

const Scene02: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.06);
  const t14 = eoq(seg(p, m0 + 0.02, m0 + 0.34));
  const val = Math.round(UP * t14);
  const chipT = pop(seg(p, m0 + 0.66, m0 + 0.78));

  const cell = 104;
  const gap = 12;
  const cols = 5;
  const x0 = (1080 - (cols * cell + (cols - 1) * gap)) / 2;
  const y0 = 676;
  const cellT = (i: number) => eo(seg(p, m0 + 0.28 + i * 0.015, m0 + 0.4 + i * 0.015));

  const cells: ("up" | "down" | "flat" | "future")[] = [
    ...Array.from({ length: UP }, () => "up" as const),
    ...Array.from({ length: DOWN }, () => "down" as const),
    ...Array.from({ length: FLAT }, () => "flat" as const),
    ...Array.from({ length: TOTAL - UP - DOWN - FLAT }, () => "future" as const),
  ];

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={exitStyle(p)}>
        <Cap text="2026 · 成品油调价记录" y={310} opacity={seg(p, 0.02, 0.1)} />
        <Num
          value={val}
          x={96}
          y={352}
          size={200}
          color={RED}
          suffix="涨"
          suffixSize={100}
          suffixColor={RED}
          opacity={eo(seg(p, m0, m0 + 0.08))}
        />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 596,
            fontFamily: "inherit",
            fontSize: 28,
            fontWeight: 700,
            color: INK_FAINT,
            letterSpacing: 3,
            opacity: seg(p, m0 + 0.18, m0 + 0.3),
          }}
        >
          上调
          <span style={{ color: RED, fontWeight: 800, margin: "0 16px 0 8px" }}>14</span>
          下调
          <span style={{ color: GREEN, fontWeight: 800, margin: "0 16px 0 8px" }}>5</span>
          搁浅
          <span style={{ color: INK_FAINT, fontWeight: 800, margin: "0 16px 0 8px" }}>2</span>
          待调
          <span style={{ color: INK, fontWeight: 800, marginLeft: 8 }}>4</span>
        </div>
        {cells.map((kind, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const t = cellT(i);
          const isUp = kind === "up";
          const isDown = kind === "down";
          const isFlat = kind === "flat";
          const bg = isUp ? RED : isDown ? GREEN : "transparent";
          const border = isUp || isDown ? "none" : `3px dashed ${isFlat ? INK_FAINT + "88" : INK + "2E"}`;
          const glyph = isUp ? "▲" : isDown ? "▼" : isFlat ? "—" : "";
          const glyphColor = isUp || isDown ? "#FBF6EC" : INK_FAINT;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x0 + col * (cell + gap),
                top: y0 + row * (cell + gap),
                width: cell,
                height: cell,
                background: bg,
                border,
                borderRadius: 14,
                opacity: t,
                transform: `scale(${0.7 + 0.3 * pop(t)})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                fontWeight: 800,
                color: glyphColor,
              }}
            >
              {glyph}
            </div>
          );
        })}
        <Chip text="计划 25 次 · 已走完 21 次" x={96} y={1268} t={chipT} color={INK_SOFT} size={26} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene02;
