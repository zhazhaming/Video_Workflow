// Scene02 · 开盘全红：三根红色蜡烛同时抬头
// 三根 K 线依次长出，红色实体、上影线、箭头；一条红色扫描线从左扫到右。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Stamp, INK, INK_SOFT, FAINT, RED, SERIF_STACK, MONO_STACK, seg, eo, pop, clamp01 } from "./ui";

const BASE = 1152;

const IDX = [
  { name: "上证", x: 268, h: 168 },
  { name: "深证", x: 540, h: 232 },
  { name: "创业板", x: 812, h: 300 },
];

const Scene02: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.1));
  const head = eo(seg(p, 0.02, 0.16));
  const sweep = eo(seg(p, 0.46, 0.78));
  const stamp = pop(seg(p, 0.52, 0.68));
  const note = eo(seg(p, 0.66, 0.82));
  const ex = seg(p, 0.9, 1);
  const main = accent || RED;

  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} />

      <div style={{ opacity: enter }}>
        <Cap text="02 / ALL RED" x={110} y={300} color={main} />
        <Cap text="09:30 开盘" x={962} y={300} align="right" color={FAINT} />
        <Hair x={110} y={338} w={852} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 110, top: 392, opacity: head }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 18, letterSpacing: 4, color: FAINT }}>OPENING BELL</div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 60, fontWeight: 700, color: INK, letterSpacing: 2 }}>
          门一开，先是一片红。
        </div>
      </div>

      {/* 基线 */}
      <div style={{ position: "absolute", left: 110, top: BASE, width: 852 * enter, height: 1.5, background: INK, opacity: 0.28 }} />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{ position: "absolute", left: 110 + i * 213, top: BASE + 8, width: 1, height: 12, background: INK, opacity: 0.22 }} />
      ))}

      {IDX.map((it, k) => {
        const q = eo(seg(p, 0.08 + k * 0.075, 0.34 + k * 0.075));
        const bodyH = it.h * q;
        const top = BASE - bodyH;
        return (
          <React.Fragment key={it.name}>
            {/* 上影线 */}
            <div style={{ position: "absolute", left: it.x - 1, top: top - 34 * q, width: 2, height: bodyH + 34 * q, background: main, opacity: 0.75 * q }} />
            {/* 箭头 */}
            <div
              style={{
                position: "absolute",
                left: it.x - 11,
                top: top - 48 * q,
                width: 0,
                height: 0,
                borderLeft: "11px solid transparent",
                borderRight: "11px solid transparent",
                borderBottom: `16px solid ${main}`,
                opacity: q * 0.9,
              }}
            />
            {/* 实体 */}
            <div
              style={{
                position: "absolute",
                left: it.x - 46,
                top,
                width: 92,
                height: Math.max(2, bodyH),
                borderRadius: 5,
                background: `linear-gradient(180deg, ${main} 0%, ${main}D9 100%)`,
                boxShadow: `0 14px 34px ${main}22`,
                opacity: q,
              }}
            >
              <div style={{ position: "absolute", left: 10, top: 10, width: 2, height: Math.max(0, bodyH - 20), background: "#FBF7EF", opacity: 0.24 }} />
            </div>
            {/* 名称 */}
            <div style={{ position: "absolute", left: it.x - 70, top: BASE + 30, width: 140, textAlign: "center", opacity: q }}>
              <div style={{ fontFamily: SERIF_STACK, fontSize: 30, fontWeight: 700, color: INK, letterSpacing: 2 }}>{it.name}</div>
              <div style={{ fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 2, color: FAINT, marginTop: 4 }}>OPEN +</div>
            </div>
          </React.Fragment>
        );
      })}

      {/* 红色扫描线 */}
      <div
        style={{
          position: "absolute",
          left: 110 + 852 * sweep,
          top: 470,
          width: 2,
          height: 700,
          background: `linear-gradient(180deg, transparent, ${main}00 0%, ${main} 30%, ${main} 70%, transparent)`,
          opacity: 0.35 * (sweep > 0 ? 1 : 0),
        }}
      />

      <Stamp text="全红" sub="ALL RED" x={880} y={760} size={30} rotate={-7} t={stamp} w={180} color={main} />

      <div style={{ position: "absolute", left: 110, top: 1258, opacity: note }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 28, color: INK_SOFT }}>
          集合竞价把价格抬起来，情绪先到，成交还要等。
        </div>
      </div>

      <div style={{ position: "absolute", right: 110, top: 1270, opacity: note * 0.85, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 3, color: FAINT }}>
        PAGE 02
      </div>
    </AbsoluteFill>
  );
};

export default Scene02;
