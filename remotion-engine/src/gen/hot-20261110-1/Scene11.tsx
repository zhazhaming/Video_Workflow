// Scene11 · 评论区见：几个问题浮上来，一个赞落下去
// 评论气泡错落浮起，光标点向红心；小心形向上飘，收束到互动。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { rand } from "../../dv/atmosphere";
import { Paper, Cap, Hair, INK, INK_SOFT, FAINT, RED, GOLD, SERIF_STACK, MONO_STACK, seg, eo, pop, clamp01 } from "./ui";

const BUBBLES = [
  { x: 160, y: 660, w: 262, h: 128, r: -3, q: "?" },
  { x: 470, y: 548, w: 288, h: 142, r: 2, q: "…" },
  { x: 700, y: 786, w: 250, h: 120, r: -2, q: "?" },
];

const Scene11: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const enter = eo(seg(p, 0, 0.1));
  const note = eo(seg(p, 0.72, 0.86));
  const like = pop(seg(p, 0.5, 0.66));
  const ex = seg(p, 0.9, 1);
  const main = accent || RED;

  const hearts = React.useMemo(
    () =>
      Array.from({ length: 7 }, (_, k) => ({
        x: 700 + rand(seed + k * 11 + 1) * 230,
        y0: 980 + rand(seed + k * 11 + 2) * 100,
        sp: 0.5 + rand(seed + k * 11 + 3) * 0.7,
        ph: rand(seed + k * 11 + 4) * 6,
      })),
    [seed],
  );

  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} grid={false} />

      <div style={{ opacity: enter }}>
        <Cap text="11 / TALK" x={110} y={300} color={main} />
        <Cap text="评论区" x={962} y={300} align="right" color={FAINT} />
        <Hair x={110} y={338} w={852} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 110, top: 392, opacity: enter }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 18, letterSpacing: 4, color: FAINT }}>YOUR CALL</div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 56, fontWeight: 700, color: INK, letterSpacing: 2, marginTop: 4 }}>
          你觉得，能高走吗？
        </div>
      </div>

      {BUBBLES.map((b, i) => {
        const q = eo(seg(p, 0.06 + i * 0.08, 0.28 + i * 0.08));
        const float = Math.sin(p * Math.PI * 2 * 0.8 + i * 1.7) * 5;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: b.x,
              top: b.y + (1 - q) * 30 + float,
              width: b.w,
              height: b.h,
              borderRadius: 24,
              background: "rgba(252,248,240,0.95)",
              border: `1.5px solid ${INK}22`,
              boxShadow: `0 18px 42px ${INK}12`,
              opacity: q * 0.98,
              transform: `rotate(${b.r}deg) scale(${0.94 + 0.06 * q})`,
            }}
          >
            <div style={{ position: "absolute", left: 20, top: 20, width: 40, height: 40, borderRadius: 20, background: i === 1 ? `${main}22` : `${INK}0F`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO_STACK, fontSize: 15, color: i === 1 ? main : FAINT }}>
              {i === 1 ? "我" : "?"}
            </div>
            <div style={{ position: "absolute", left: 74, top: 24, fontFamily: SERIF_STACK, fontSize: 40, fontWeight: 700, color: i === 1 ? main : INK }}>{b.q}</div>
            <div style={{ position: "absolute", left: 74, bottom: 24, width: b.w - 100, height: 2, background: INK, opacity: 0.12 }} />
            <div style={{ position: "absolute", left: b.w - 34, bottom: 18, fontFamily: MONO_STACK, fontSize: 12, letterSpacing: 1, color: FAINT }}>JUST NOW</div>
            <div
              style={{
                position: "absolute",
                left: 34,
                bottom: -14,
                width: 0,
                height: 0,
                borderLeft: "12px solid transparent",
                borderRight: "12px solid transparent",
                borderTop: `18px solid rgba(252,248,240,0.95)`,
              }}
            />
          </div>
        );
      })}

      {/* 红心 */}
      <div style={{ position: "absolute", left: 790, top: 900, opacity: enter, transform: `scale(${1 + 0.08 * like})` }}>
        <svg width={132} height={132}>
          <path
            d="M66 112 C 22 84, 10 54, 22 38 C 34 22, 56 24, 66 42 C 76 24, 98 22, 110 38 C 122 54, 110 84, 66 112 Z"
            fill={like > 0.4 ? main : "none"}
            stroke={like > 0.4 ? main : INK}
            strokeWidth={3}
            opacity={0.9}
          />
        </svg>
        <div style={{ position: "absolute", left: 0, top: 138, width: 132, textAlign: "center", fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 2, color: like > 0.4 ? main : FAINT }}>
          点赞
        </div>
      </div>

      {/* 光标 */}
      <div
        style={{
          position: "absolute",
          left: 690 + 40 * like,
          top: 1010 - 28 * like,
          width: 0,
          height: 0,
          borderLeft: "15px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: `26px solid ${INK}`,
          transform: "rotate(-22deg)",
          opacity: enter * 0.85,
        }}
      />

      {/* 上浮小心形 */}
      {hearts.map((h, k) => {
        const q = eo(seg(p, 0.5 + k * 0.03, 0.85 + k * 0.02));
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: h.x + Math.sin(p * 6 + h.ph) * 14,
              top: h.y0 - 150 * q,
              width: 12,
              height: 12,
              opacity: (1 - q) * 0.5 * enter,
              transform: `rotate(45deg) scale(${0.6 + q * 0.5})`,
              background: main,
              borderRadius: 2,
            }}
          />
        );
      })}

      <div style={{ position: "absolute", left: 110, top: 1190, opacity: note }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 29, color: INK_SOFT }}>
          把你的判断，留在评论区。
        </div>
      </div>

      <div style={{ position: "absolute", right: 110, top: 1202, opacity: note * 0.85, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 3, color: FAINT }}>
        PAGE 11
      </div>
    </AbsoluteFill>
  );
};

export default Scene11;
