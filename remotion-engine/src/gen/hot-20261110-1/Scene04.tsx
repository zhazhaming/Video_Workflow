// Scene04 · 高开怎么来：买卖盘在集合竞价里撮合出一个开盘价
// 左右两列委托单向中间收拢，价格线被“撮合”出来，再向上跳一格形成高开。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { rand } from "../../dv/atmosphere";
import { Paper, Cap, Hair, Chip, INK, INK_SOFT, FAINT, RED, GREEN, SERIF_STACK, MONO_STACK, seg, eo, pop, clamp01 } from "./ui";

const MID = 540;
const LINE_Y = 820;

const Scene04: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const enter = eo(seg(p, 0, 0.1));
  const collapse = eo(seg(p, 0.14, 0.5));
  const grow = eo(seg(p, 0.42, 0.58));
  const flash = pop(seg(p, 0.48, 0.62));
  const lift = eo(seg(p, 0.62, 0.8));
  const note = eo(seg(p, 0.7, 0.84));
  const ex = seg(p, 0.9, 1);
  const main = accent || RED;

  const orders = React.useMemo(
    () =>
      Array.from({ length: 7 }, (_, k) => ({
        w: 150 + rand(seed + k * 9 + 2) * 150,
        h: 13 + rand(seed + k * 9 + 3) * 8,
        y: 520 + k * 62,
        op: 0.42 + rand(seed + k * 9 + 4) * 0.4,
      })),
    [seed],
  );

  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} />

      <div style={{ opacity: enter }}>
        <Cap text="04 / AUCTION" x={110} y={300} color={main} />
        <Cap text="09:15 → 09:25" x={962} y={300} align="right" color={FAINT} />
        <Hair x={110} y={338} w={852} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 110, top: 392, opacity: enter }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 18, letterSpacing: 4, color: FAINT }}>CALL AUCTION</div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 56, fontWeight: 700, color: INK, letterSpacing: 2, marginTop: 4 }}>
          开盘价，是撮合出来的。
        </div>
      </div>

      <div style={{ position: "absolute", left: 110, top: 502, opacity: enter * 0.9, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 3, color: RED }}>
        买盘 / BID
      </div>
      <div style={{ position: "absolute", right: 110, top: 502, opacity: enter * 0.9, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 3, color: GREEN, textAlign: "right" }}>
        卖盘 / ASK
      </div>

      {/* 买单：向右收 */}
      {orders.map((o, k) => (
        <div
          key={`b${k}`}
          style={{
            position: "absolute",
            left: 130 + (1 - collapse) * 60,
            top: o.y,
            width: o.w,
            height: o.h,
            borderRadius: 3,
            background: RED,
            opacity: enter * o.op * (0.22 + 0.28 * collapse),
            transform: `translateX(${collapse * 250}px) scaleX(${1 - 0.5 * collapse})`,
          }}
        />
      ))}
      {/* 卖单：向左收 */}
      {orders.map((o, k) => (
        <div
          key={`a${k}`}
          style={{
            position: "absolute",
            right: 130 + (1 - collapse) * 60,
            top: o.y + 14,
            width: o.w * 0.9,
            height: o.h,
            borderRadius: 3,
            background: GREEN,
            opacity: enter * o.op * (0.22 + 0.28 * collapse),
            transform: `translateX(${-collapse * 250}px) scaleX(${1 - 0.5 * collapse})`,
          }}
        />
      ))}

      {/* 中轴 */}
      <div style={{ position: "absolute", left: MID, top: 470, width: 1.5, height: 440 * enter, background: INK, opacity: 0.22, borderLeft: "6px dotted rgba(27,24,21,0.18)" }} />

      {/* 撮合价 */}
      <div
        style={{
          position: "absolute",
          left: MID - 300 * grow,
          top: LINE_Y,
          width: 600 * grow,
          height: 3,
          background: main,
          opacity: grow,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: MID - 9,
          top: LINE_Y - 9,
          width: 18,
          height: 18,
          borderRadius: 9,
          background: main,
          opacity: grow,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: MID - 60 - 46 * flash,
          top: LINE_Y - 60 - 46 * flash,
          width: 120 + 92 * flash,
          height: 120 + 92 * flash,
          borderRadius: "50%",
          border: `2px solid ${main}`,
          opacity: flash * 0.35,
        }}
      />

      {/* 高开跳一格 */}
      <div style={{ position: "absolute", left: MID, top: LINE_Y - 140 * lift, width: 2, height: 140 * lift, background: main, opacity: 0.8 }} />
      <div style={{ position: "absolute", left: MID - 300 * grow, top: LINE_Y - 140 * lift, width: 600 * grow, height: 2.5, background: main, opacity: grow * 0.85 }} />
      <div
        style={{
          position: "absolute",
          left: MID - 13,
          top: LINE_Y - 140 * lift - 13,
          width: 26,
          height: 26,
          borderRadius: 13,
          background: main,
          opacity: pop(lift) * 0.95,
          boxShadow: `0 0 0 8px ${main}18`,
        }}
      />

      <div style={{ position: "absolute", left: MID - 90, top: LINE_Y + 24, width: 180, textAlign: "center", opacity: grow * 0.9 }}>
        <Chip text="开盘价" x={0} y={0} w={180} color={main} bg={`${main}12`} size={18} />
      </div>

      <div style={{ position: "absolute", left: MID - 88, top: LINE_Y - 140 * lift - 66, width: 176, textAlign: "center", opacity: pop(lift) }}>
        <Chip text="高开 +" x={0} y={0} w={176} color="#FBF7EF" bg={main} size={18} />
      </div>

      <div style={{ position: "absolute", left: 110, top: 1200, opacity: note }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 29, color: INK_SOFT }}>
          买单比卖单急，价格就先往上跳一格。
        </div>
      </div>

      <div style={{ position: "absolute", right: 110, top: 1212, opacity: note * 0.85, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 3, color: FAINT }}>
        PAGE 04
      </div>
    </AbsoluteFill>
  );
};

export default Scene04;
