// Scene06 · 担忧一：AI 监管收紧，数据中心踩刹车
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, Stamp, exitStyle, mk,
  INK, INK_SOFT, INK_FAINT, RED, GOLD,
  seg, eo, pop,
} from "./ui";

const COLS = [180, 450, 720];
const ROWS = [430, 545, 660, 775];
const UW = 170;
const UH = 96;

const Scene06: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.09);
  const m1 = mk(marks, 1, 0.585);
  const redShift = eo(seg(p, m0 + 0.04, m0 + 0.28));
  const stampT = pop(seg(p, m0 + 0.02, m0 + 0.18));
  const brakeT = eo(seg(p, m1 + 0.02, m1 + 0.18));
  const capT = pop(seg(p, m1 + 0.12, m1 + 0.28));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={exitStyle(p)}>
        <Cap text="AI 基建 · 数据中心" y={310} opacity={seg(p, 0.03, 0.12)} />
        <Stamp text="监管收紧？" x={810} y={408} size={56} rotate={-10} t={stampT} />
        {/* 机架 */}
        {COLS.map((cx) =>
          ROWS.map((ry, ri) => {
            // 熄灯：从顶行往下逐排
            const off = 1 - seg(p, m0 + 0.1 + ri * 0.07, m0 + 0.24 + ri * 0.07);
            return (
              <div key={`${cx}-${ry}`}>
                <div
                  style={{
                    position: "absolute",
                    left: cx,
                    top: ry,
                    width: UW,
                    height: UH,
                    border: `2px solid ${INK}`,
                    opacity: 0.45,
                    borderRadius: 10,
                    background: "rgba(27,24,21,0.02)",
                  }}
                />
                {/* 红色警示描边（随 m0 升起） */}
                <div
                  style={{
                    position: "absolute",
                    left: cx,
                    top: ry,
                    width: UW,
                    height: UH,
                    border: `2px solid ${RED}`,
                    opacity: redShift * 0.55,
                    borderRadius: 10,
                  }}
                />
                {[0, 1, 2].map((li) => (
                  <div
                    key={li}
                    style={{
                      position: "absolute",
                      left: cx + 22 + li * 26,
                      top: ry + UH - 30,
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: GOLD,
                      opacity: (0.35 + 0.3 * Math.sin(p * 18 + ri * 2.1 + li * 1.3)) * Math.max(0.06, off),
                    }}
                  />
                ))}
                {/* 散热栅 */}
                <div style={{ position: "absolute", left: cx + 20, top: ry + 22, width: UW - 40, height: 3, background: INK, opacity: 0.18 }} />
                <div style={{ position: "absolute", left: cx + 20, top: ry + 34, width: UW - 40, height: 3, background: INK, opacity: 0.14 }} />
              </div>
            );
          }),
        )}
        {/* 刹车：下行箭头 + 横杆 */}
        <div style={{ position: "absolute", left: 536, top: 1012, width: 16, height: 74, background: RED, opacity: brakeT }} />
        <div
          style={{
            position: "absolute",
            left: 544 - 34,
            top: 1078,
            width: 0,
            height: 0,
            borderLeft: "34px solid transparent",
            borderRight: "34px solid transparent",
            borderTop: `30px solid ${RED}`,
            opacity: brakeT,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 180,
            top: 1128,
            width: 710,
            height: 14,
            background: RED,
            borderRadius: 7,
            transform: `scaleX(${brakeT})`,
            transformOrigin: "0 50%",
          }}
        />
        <div style={{ position: "absolute", left: 180, top: 1158, opacity: capT, fontSize: 40, fontWeight: 900, color: INK, letterSpacing: 4 }}>
          数据中心 · <span style={{ color: RED }}>踩刹车</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene06;
