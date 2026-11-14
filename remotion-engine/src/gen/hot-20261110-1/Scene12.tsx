// Scene12 · 下期见：一枚印章落下，行情线继续向前
// 圆环收束、印章盖下、签名线与上扬的收尾线画出；留白收尾，不抢结束语。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, INK, INK_SOFT, FAINT, RED, GOLD, SERIF_STACK, MONO_STACK, seg, eo, pop, clamp01 } from "./ui";

const CX = 540;
const CY = 760;

const Scene12: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const rings = eo(seg(p, 0.04, 0.46));
  const stamp = pop(seg(p, 0.2, 0.4));
  const sign = eo(seg(p, 0.44, 0.66));
  const tail = eo(seg(p, 0.62, 0.82));
  const note = eo(seg(p, 0.7, 0.86));
  const ex = seg(p, 0.88, 1);
  const main = accent || RED;

  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} />

      <div style={{ opacity: enter }}>
        <Cap text="12 / NEXT" x={110} y={300} color={main} />
        <Cap text="下期见" x={962} y={300} align="right" color={FAINT} />
        <Hair x={110} y={338} w={852} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 110, top: 392, opacity: enter }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 18, letterSpacing: 4, color: FAINT }}>THANKS FOR WATCHING</div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 54, fontWeight: 700, color: INK, letterSpacing: 2, marginTop: 4 }}>
          到这里，先收个尾。
        </div>
      </div>

      {/* 圆环 */}
      {[150, 232, 314].map((r, i) => {
        const len = 2 * Math.PI * r;
        return (
          <svg key={r} width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, transform: `rotate(${-90 + p * (i % 2 === 0 ? 8 : -6)}deg)`, transformOrigin: `${CX}px ${CY}px` }}>
            <circle
              cx={CX}
              cy={CY}
              r={r}
              fill="none"
              stroke={i === 0 ? main : INK}
              strokeWidth={i === 0 ? 1.8 : 1}
              strokeOpacity={i === 0 ? 0.55 : 0.14}
              strokeDasharray={i === 0 ? "10 8" : undefined}
              strokeDashoffset={len * (1 - rings)}
            />
          </svg>
        );
      })}

      {/* 轨道点 */}
      {[0, 1, 2].map((k) => {
        const a = (p * 40 + k * 120) * (Math.PI / 180);
        const r = 232;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: CX + Math.cos(a) * r - 4,
              top: CY + Math.sin(a) * r - 4,
              width: 8,
              height: 8,
              borderRadius: 4,
              background: k === 0 ? main : GOLD,
              opacity: rings * 0.55,
            }}
          />
        );
      })}

      {/* 印章 */}
      <div
        style={{
          position: "absolute",
          left: CX - 98,
          top: CY - 98,
          width: 196,
          height: 196,
          transform: `rotate(-5deg) scale(${1.44 - 0.44 * stamp})`,
          opacity: clamp01(stamp * 1.4),
        }}
      >
        <div style={{ position: "absolute", inset: 0, border: `6px solid ${main}`, borderRadius: 8, background: "rgba(200,69,45,0.06)" }} />
        <div style={{ position: "absolute", left: 12, top: 12, right: 12, bottom: 12, border: `1.5px solid ${main}`, opacity: 0.55 }} />
        <div style={{ position: "absolute", left: 0, top: 54, width: "100%", textAlign: "center", fontFamily: SERIF_STACK, fontSize: 58, fontWeight: 700, letterSpacing: 6, color: main }}>
          阿扎
        </div>
        <div style={{ position: "absolute", left: 0, bottom: 30, width: "100%", textAlign: "center", fontFamily: MONO_STACK, fontSize: 12, letterSpacing: 4, color: main, opacity: 0.85 }}>
          AZHA · 2026
        </div>
      </div>

      {/* 签名线 */}
      <div style={{ position: "absolute", left: 700, top: 940, width: 230 * sign, height: 2, background: INK, opacity: 0.35 }} />
      <div style={{ position: "absolute", left: 700, top: 946, width: 150 * sign, height: 1, background: INK, opacity: 0.16 }} />

      {/* 收尾上扬线 */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d="M 150 1130 C 330 1110, 470 1000, 620 1010 C 730 1018, 810 940, 930 906" fill="none" stroke={main} strokeWidth={2.6} strokeLinecap="round" strokeDasharray="1000" strokeDashoffset={1000 * (1 - tail)} opacity={0.75} />
        <circle cx={930} cy={906} r={6} fill={main} opacity={tail} />
      </svg>

      <div style={{ position: "absolute", left: 110, top: 1190, opacity: note }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 3, color: FAINT }}>NEXT / 下期见</div>
        <div style={{ marginTop: 8, fontFamily: SERIF_STACK, fontSize: 30, color: INK_SOFT }}>
          行情每天都有，故事下期继续。
        </div>
      </div>

      <div style={{ position: "absolute", right: 110, top: 1202, opacity: note * 0.85, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 3, color: FAINT }}>
        PAGE 12
      </div>
    </AbsoluteFill>
  );
};

export default Scene12;
