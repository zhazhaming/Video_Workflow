// Scene06 · 对比：上一个纪录 38 pK（德国 2021）→ 这次 9.7 pK，压到四分之一
// 同一基准线上的两条对比条（长度比 4:1）+ 4 等分标尺 + ¼ 印章 + 底部投影量距
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Num, Stamp, INK, INK_SOFT, INK_FAINT, RED, FONT_STACK, MARGIN, seg, eio, eoq } from "./ui";

const X0 = 96;
const PX = 720 / 38; // 38 pK 对应 720px
const BAR_W1 = 720;
const BAR_W2 = 9.7 * PX; // ≈184px（正好 1/4）
const BAR1_Y = 626;
const BAR2_Y = 876;
const BAR_H = 80;
const RULER_Y = 752;
const RULER_H = 40;
const CELL = 180; // 38 / 4 ≈ 9.5 pK 每格
const AXIS_Y = 988;
const MEASURE_Y = 1120;

const Scene06: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed, marks }) => {
  const m = (i: number, fb: number) => marks?.[i]?.start ?? fb;
  const tQ = m(1, 0.606); // 「这次，直接压到四分之一」

  const axisIn = eoq(seg(p, 0.04, 0.22));
  const b1 = eoq(seg(p, 0.08, 0.35));
  const b2 = eoq(seg(p, 0.22, 0.5));
  const ghost = eio(seg(p, 0.44, 0.6));
  const quarter = seg(p, tQ, tQ + 0.16);
  const rulerStart = Math.max(0.6, tQ);
  const ruler = eio(seg(p, rulerStart, rulerStart + 0.1));
  const cellIn = (i: number) => seg(p, rulerStart + 0.03 + i * 0.02, rulerStart + 0.08 + i * 0.02);
  const proj = eio(seg(p, 0.42, 0.66));
  const measure = eio(seg(p, 0.6, 0.78));
  const pulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 7);
  const exit = eio(seg(p, 0.9, 1));

  return (
    <AbsoluteFill style={{ fontFamily: FONT_STACK, overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />

      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 1920,
          transform: `translateY(${exit * 6}px) scale(${1 - exit * 0.012})`,
          transformOrigin: "540px 780px",
        }}
      >
        {/* ---------- 基准轴：竖线 + 横轴 + 刻度 ---------- */}
        <div style={{ position: "absolute", left: X0, top: 500, width: 1, height: 510 * axisIn, background: INK, opacity: 0.2 }} />
        <div style={{ position: "absolute", left: X0, top: AXIS_Y, width: 758 * axisIn, height: 1, background: INK, opacity: 0.18 }} />
        {[0, 10, 20, 30, 40].map((v) => (
          <div
            key={v}
            style={{ position: "absolute", left: X0 + v * PX, top: AXIS_Y - 7, width: 1, height: 15, background: INK, opacity: 0.3 * axisIn }}
          />
        ))}

        {/* ---------- 上条：德国 2021 · 38 pK ---------- */}
        <div style={{ position: "absolute", left: X0, top: BAR1_Y, width: BAR_W1 * b1, height: BAR_H, background: INK, opacity: 0.74 }} />
        <div
          style={{
            position: "absolute",
            left: X0 + BAR_W1 - 2,
            top: BAR1_Y - 8,
            width: 2,
            height: BAR_H + 16,
            background: INK,
            opacity: 0.5 * seg(b1, 0.9, 1),
          }}
        />

        {/* ---------- 下条：中国空间站 · 9.7 pK（朱红，只有 1/4 长） ---------- */}
        <div
          style={{
            position: "absolute",
            left: X0,
            top: BAR2_Y,
            width: BAR_W2 * b2,
            height: BAR_H,
            background: RED,
            opacity: 0.95,
            borderRadius: "0 2px 2px 0",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: X0 + BAR_W2 - 6,
            top: BAR2_Y + BAR_H / 2 - 6,
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: RED,
            opacity: b2 > 0.98 ? 0.8 : 0,
            transform: `scale(${1 + 0.45 * pulse})`,
          }}
        />
        {/* 4:1 参照：下条长度的虚线延展 */}
        <div
          style={{
            position: "absolute",
            left: X0 + BAR_W2,
            top: BAR2_Y,
            width: (BAR_W1 - BAR_W2) * ghost,
            height: BAR_H,
            border: `1px dashed ${INK}`,
            borderLeft: "none",
            opacity: 0.16 * ghost,
          }}
        />

        {/* ---------- 4 等分标尺：38 分成 4 格，1 格填朱红，其余打斜线 ---------- */}
        {ruler > 0
          ? Array.from({ length: 4 }, (_, i) => {
              const on = cellIn(i) * ruler;
              return (
                <div
                  key={`c${i}`}
                  style={{
                    position: "absolute",
                    left: X0 + i * CELL,
                    top: RULER_Y,
                    width: CELL - 2,
                    height: RULER_H,
                    boxSizing: "border-box",
                    border: `1px ${i === 0 ? "solid" : "dashed"} ${i === 0 ? RED : INK}`,
                    borderColor: i === 0 ? `${RED}B3` : `${INK}59`,
                    background:
                      i === 0
                        ? `${RED}26`
                        : `repeating-linear-gradient(45deg, ${INK}2E 0px, ${INK}2E 1px, transparent 1px, transparent 8px)`,
                    opacity: on,
                    transform: `scaleX(${0.15 + 0.85 * on})`,
                    transformOrigin: "0 50%",
                  }}
                />
              );
            })
          : null}

        {/* ---------- ¼ 印章 ---------- */}
        <Stamp text="¼" x={890} y={772} size={96} rotate={-6} t={quarter} />

        {/* ---------- 底部投影量距：把 4:1 的差额量出来，撑住下半幅 ---------- */}
        <div
          style={{
            position: "absolute",
            left: X0 + BAR_W1 - 1,
            top: BAR1_Y,
            width: 1,
            height: (MEASURE_Y - BAR1_Y) * proj,
            backgroundImage: `repeating-linear-gradient(to bottom, ${INK} 0px, ${INK} 3px, transparent 3px, transparent 9px)`,
            opacity: 0.22,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: X0 + BAR_W2 - 1,
            top: BAR2_Y + BAR_H,
            width: 1,
            height: (MEASURE_Y - BAR2_Y - BAR_H) * proj,
            backgroundImage: `repeating-linear-gradient(to bottom, ${INK} 0px, ${INK} 3px, transparent 3px, transparent 9px)`,
            opacity: 0.22,
          }}
        />
        <div style={{ position: "absolute", left: X0 + BAR_W2, top: MEASURE_Y, width: (BAR_W1 - BAR_W2) * measure, height: 1, background: RED, opacity: 0.42 }} />
        <div style={{ position: "absolute", left: X0 + BAR_W2 - 1, top: MEASURE_Y - 9, width: 2, height: 18, background: RED, opacity: 0.55 * measure }} />
        <div
          style={{
            position: "absolute",
            left: X0 + BAR_W2 + (BAR_W1 - BAR_W2) * measure - 2,
            top: MEASURE_Y - 9,
            width: 2,
            height: 18,
            background: RED,
            opacity: 0.55 * measure,
          }}
        />

        {/* ---------- 标注 ---------- */}
        <Cap text="上一个纪录 vs 这次" x={MARGIN} y={336} accent={RED} color={INK_SOFT} opacity={seg(p, 0.03, 0.12)} />

        <Cap text="德国 2021" x={X0 + 14} y={546} color={INK_FAINT} size={24} opacity={seg(p, 0.08, 0.2)} />
        <Num value={38} x={824} y={524} size={58} color={INK} suffix="pK" suffixSize={28} opacity={seg(p, 0.1, 0.24)} />

        <Cap text="中国空间站" x={X0 + 14} y={828} color={INK_SOFT} size={24} opacity={seg(p, 0.22, 0.34)} />
        <Num value={9.7} decimals={1} x={300} y={806} size={58} color={RED} suffix="pK" suffixSize={28} opacity={seg(p, 0.32, 0.46)} />

        {/* 右下：比例刻度（装饰层） */}
        <div style={{ position: "absolute", left: 824, top: 918, width: 150 * seg(p, 0.5, 0.66), height: 1, background: INK, opacity: 0.18 }} />
        <div style={{ position: "absolute", left: 824, top: 924, width: 1, height: 8, background: INK, opacity: 0.18 }} />
      </div>
    </AbsoluteFill>
  );
};

export default Scene06;
