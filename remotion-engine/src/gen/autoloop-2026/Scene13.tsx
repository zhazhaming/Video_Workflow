// Scene13 · 注意二：危险动作先停下等人；连环派活最多 8 层
// 左边一枚合拢的暂停闸门挡住四类危险动作，右边 8 层堆栈逐层亮起，第 8 层拉红线。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Card, Chip, Stamp, INK, INK_SOFT, FAINT, TEAL, RED, GOLD, MONO_STACK, SERIF_STACK, seg, eo, pop, lerp, clamp01 } from "./ui";

const dangers = [
  { t: "删文件", at: 0.1 },
  { t: "重启", at: 0.16 },
  { t: "花钱", at: 0.22 },
  { t: "发消息", at: 0.28 },
];

const Scene13: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const gate = eo(seg(p, 0.36, 0.52));
  const layers = eo(seg(p, 0.44, 0.8));
  const hot = eo(seg(p, 0.78, 0.88));
  const stamp = pop(seg(p, 0.84, 0.94));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="13 / 会刹车" x={150} y={330} />
        <Cap text="关键动作人来定" x={880} y={330} align="right" color={FAINT} />
        <Hair x={150} y={368} w={260} color={RED} thickness={2} progress={eo(seg(p, 0.08, 0.3))} opacity={0.6} />
      </div>

      {/* 危险动作列表 */}
      {dangers.map((d, i) => {
        const t = eo(seg(p, d.at, d.at + 0.1));
        const stop = eo(seg(p, 0.5, 0.6));
        return (
          <div
            key={d.t}
            style={{
              position: "absolute", left: 150 + i * 6, top: 448 + i * 62, width: 218, height: 50,
              border: `1px solid ${INK}20`, borderRadius: 6, background: "rgba(251,247,239,0.85)",
              display: "flex", alignItems: "center", gap: 10, paddingLeft: 14, boxSizing: "border-box",
              opacity: t, transform: `translateX(${(1 - t) * -18}px)`,
            }}
          >
            <div style={{ width: 7, height: 7, borderRadius: 4, background: RED, opacity: 0.45 + 0.55 * stop }} />
            <span style={{ fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 1.5, color: INK_SOFT }}>{d.t}</span>
            <span style={{ marginLeft: "auto", marginRight: 12, fontFamily: MONO_STACK, fontSize: 12, color: stop > 0.4 ? RED : FAINT }}>{stop > 0.4 ? "HOLD" : "…"}</span>
          </div>
        );
      })}

      {/* 暂停闸门 */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: 0.5 + 0.5 * enter }}>
        <polygon
          points="392,760 464,682 536,760 536,862 464,940 392,862"
          fill="rgba(251,247,239,0.92)"
          stroke={RED}
          strokeWidth={2.4}
          strokeOpacity={0.55 + 0.35 * gate}
        />
        <polygon
          points="392,760 464,682 536,760 536,862 464,940 392,862"
          fill={RED} fillOpacity={0.06 * gate}
        />
      </svg>
      <div style={{ position: "absolute", left: 440, top: 784, display: "flex", gap: 10 }}>
        <div style={{ width: 16, height: 50, borderRadius: 4, background: RED, opacity: 0.55 + 0.45 * gate }} />
        <div style={{ width: 16, height: 50, borderRadius: 4, background: RED, opacity: 0.55 + 0.45 * gate }} />
      </div>
      <div style={{ position: "absolute", left: 464, top: 862, width: 0, height: 0 }} />
      <div style={{ position: "absolute", left: 464, top: 900, width: 220, marginLeft: -110, textAlign: "center", fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 3, color: RED, opacity: 0.75 * gate }}>
        等你点同意
      </div>

      {/* 8 层堆栈 */}
      <div style={{ position: "absolute", left: 690, top: 640, width: 200, height: 300, fontFamily: SERIF_STACK, fontSize: 300, color: TEAL, opacity: 0.1, lineHeight: 1, textAlign: "center" }}>8</div>
      <div style={{ position: "absolute", left: 660, top: 424, fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 2, color: FAINT }}>最多往下传 8 层</div>
      {Array.from({ length: 8 }, (_, i) => {
        const on = layers * 8 > i;
        const y = 452 + i * 62;
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: 660, top: y, width: 222, height: 46,
              border: `1px solid ${i === 7 ? RED + "88" : INK + "22"}`,
              borderRadius: 5,
              background: on ? (i === 7 ? `${RED}26` : `${TEAL}22`) : "rgba(251,247,239,0.7)",
              display: "flex", alignItems: "center", paddingLeft: 14, boxSizing: "border-box",
              opacity: on ? 0.95 : 0.5,
            }}
          >
            <span style={{ fontFamily: MONO_STACK, fontSize: 12, color: i === 7 ? RED : FAINT, letterSpacing: 1 }}>L{i + 1}</span>
            <div style={{ marginLeft: 12, height: 5, width: `${28 + i * 13}%`, borderRadius: 2, background: i === 7 ? RED : TEAL, opacity: on ? 0.8 : 0.2 }} />
            {i === 7 ? <span style={{ marginLeft: "auto", marginRight: 10, fontFamily: MONO_STACK, fontSize: 11, color: RED }}>MAX</span> : null}
          </div>
        );
      })}
      <div
        style={{
          position: "absolute", left: 646, top: 452 + 8 * 62 - 10, width: 250, height: 2,
          background: RED, opacity: hot * 0.85,
          transform: `scaleX(${hot})`, transformOrigin: "0% 50%",
        }}
      />
      <div style={{ position: "absolute", left: 646, top: 452 + 8 * 62 + 2, fontFamily: MONO_STACK, fontSize: 12, letterSpacing: 2, color: RED, opacity: hot }}>
        8 / 8 · STOP
      </div>

      <div style={{ position: "absolute", left: 590, top: 1004, opacity: stamp }}>
        <Stamp text="HOLD" x={0} y={0} size={26} rotate={-8} t={stamp} color={RED} />
      </div>

      <div style={{ position: "absolute", left: 150, top: 1064, opacity: eo(seg(p, 0.7, 0.88)) }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 16, letterSpacing: 3, color: FAINT }}>危险动作要你同意</div>
        <div style={{ marginTop: 10, fontFamily: SERIF_STACK, fontSize: 34, color: INK_SOFT, letterSpacing: 1 }}>
          危险动作，等你点头。
        </div>
        <div style={{ marginTop: 8, fontFamily: SERIF_STACK, fontSize: 34, color: INK_SOFT, letterSpacing: 1 }}>
          派出去的活，最多传 8 层。
        </div>
      </div>
      <div style={{ position: "absolute", left: 150, top: 1238, width: 730, height: 1, background: INK, opacity: 0.14 * eo(seg(p, 0.7, 0.88)) }} />
    </AbsoluteFill>
  );
};

export default Scene13;
