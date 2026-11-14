// Scene10 · 看懂再动手：两道检查，一条守住开盘价的线
// 左侧“量能 / 开盘价”两个勾选项随台词点亮；右侧价格线在开盘价上方横住。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { rand } from "../../dv/atmosphere";
import { Paper, Cap, Hair, Stamp, INK, INK_SOFT, FAINT, RED, GREEN, GOLD, SERIF_STACK, MONO_STACK, seg, eo, eio, pop, clamp01 } from "./ui";

const OPEN_Y = 930;

const Scene10: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks, seed }) => {
  const enter = eo(seg(p, 0, 0.1));
  const note = eo(seg(p, 0.74, 0.88));
  const ex = seg(p, 0.9, 1);
  const main = accent || RED;

  const pts = React.useMemo(
    () =>
      Array.from({ length: 15 }, (_, k) => ({
        x: 566 + (k / 14) * 372,
        y: 852 - (k / 14) * 58 + Math.sin(k * 0.8 + 1.2) * 16 + (rand(seed + k * 3) - 0.5) * 10,
      })),
    [seed],
  );
  const path = pts.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(" ");

  const checks = [
    { y: 596, label: "量能", sub: "有没有跟上", start: marks?.[0]?.start ?? 0.04, dur: marks?.[0]?.dur ?? 0.36 },
    { y: 812, label: "开盘价", sub: "能不能守住", start: marks?.[1]?.start ?? 0.42, dur: marks?.[1]?.dur ?? 0.4 },
  ];

  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} />

      <div style={{ opacity: enter }}>
        <Cap text="10 / CHECK" x={110} y={300} color={main} />
        <Cap text="先看，再动" x={962} y={300} align="right" color={FAINT} />
        <Hair x={110} y={338} w={852} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 110, top: 392, opacity: enter }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 18, letterSpacing: 4, color: FAINT }}>TWO CHECKS</div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 56, fontWeight: 700, color: INK, letterSpacing: 2, marginTop: 4 }}>
          不急着下结论。
        </div>
      </div>

      {checks.map((c, i) => {
        const q = eio(seg(p, c.start, c.start + Math.max(0.2, c.dur * 0.8)));
        return (
          <React.Fragment key={c.label}>
            <div
              style={{
                position: "absolute",
                left: 110,
                top: c.y,
                width: 46,
                height: 46,
                borderRadius: 8,
                border: `2.5px solid ${q > 0.1 ? main : INK}`,
                opacity: enter * (0.5 + 0.5 * q),
                background: q > 0.1 ? `${main}10` : "transparent",
              }}
            >
              <svg width={46} height={46} style={{ position: "absolute", left: 0, top: 0 }}>
                <path d="M 11 24 L 20 33 L 36 14" fill="none" stroke={main} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="42" strokeDashoffset={42 * (1 - q)} />
              </svg>
            </div>
            <div style={{ position: "absolute", left: 180, top: c.y - 4, opacity: enter * (0.5 + 0.5 * q) }}>
              <div style={{ fontFamily: SERIF_STACK, fontSize: 38, fontWeight: 700, color: q > 0.1 ? INK : FAINT, letterSpacing: 1 }}>{c.label}</div>
              <div style={{ fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 2, color: FAINT, marginTop: 4 }}>{c.sub}</div>
            </div>
          </React.Fragment>
        );
      })}

      {/* 右侧：守住开盘价 */}
      <div style={{ position: "absolute", left: 540, top: 520, width: 1, height: 520, background: INK, opacity: 0.12 }} />
      <div style={{ position: "absolute", left: 560, top: OPEN_Y, width: 394 * enter, height: 2, background: GOLD, opacity: 0.85 }} />
      <div style={{ position: "absolute", left: 560, top: OPEN_Y + 12, opacity: enter * 0.8, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 2, color: GOLD }}>
        开盘价 / 支撑
      </div>

      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={path} fill="none" stroke={INK} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="500" strokeDashoffset={500 * (1 - eio(seg(p, 0.06, 0.62)))} opacity={0.88} />
        <circle cx={938} cy={794} r={6} fill={main} opacity={eio(seg(p, 0.62, 0.72))} />
      </svg>

      {/* 上方防守区 */}
      <div
        style={{
          position: "absolute",
          left: 560,
          top: 716,
          width: 394 * eo(seg(p, 0.4, 0.7)),
          height: 3,
          background: main,
          opacity: 0.35,
          borderTop: "2px dashed",
        }}
      />

      <Stamp text="先看" sub="THEN MOVE" x={858} y={596} size={26} rotate={7} t={pop(seg(p, 0.62, 0.76))} w={160} color={main} />

      <div style={{ position: "absolute", left: 110, top: 1120, opacity: note }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 29, color: INK_SOFT }}>
          先看量能，再看能不能守住开盘价。
        </div>
      </div>

      <div style={{ position: "absolute", right: 110, top: 1132, opacity: note * 0.85, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 3, color: FAINT }}>
        PAGE 10
      </div>
    </AbsoluteFill>
  );
};

export default Scene10;
