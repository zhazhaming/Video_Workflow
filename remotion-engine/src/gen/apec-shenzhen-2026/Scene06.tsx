// Scene06 · 1994 茂物两个时间表 + 1995 大阪“两个轮子”
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, exitFade, mk, seg, easeOut, pop, clamp01,
  INK, INK_SOFT, OCEAN, CORAL, GOLD, CREAM, SERIF, SANS, MONO,
} from "./ui";

const Clock: React.FC<{
  x: number; y: number; year: string; label: string; t: number; spin: number; accent: string;
}> = ({ x, y, year, label, t, spin, accent }) => {
  const r = 156;
  return (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        opacity: clamp01(t),
        transform: `scale(${0.82 + 0.18 * t})`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `${CREAM}aa`, border: `2px solid ${INK}55` }} />
      <div style={{ position: "absolute", inset: 12, borderRadius: "50%", border: `1px dashed ${OCEAN}66` }} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: r + Math.cos(a) * (r - 18) - 1,
              top: r + Math.sin(a) * (r - 18) - (i % 3 === 0 ? 8 : 4),
              width: i % 3 === 0 ? 3 : 1.5,
              height: i % 3 === 0 ? 16 : 8,
              background: i % 3 === 0 ? accent : INK,
              opacity: i % 3 === 0 ? 0.7 : 0.3,
              transform: `rotate(${(a * 180) / Math.PI + 90}deg)`,
            }}
          />
        );
      })}
      {/* 时针 / 分针 */}
      <div
        style={{
          position: "absolute",
          left: r - 2,
          top: r - 78,
          width: 4,
          height: 82,
          background: accent,
          borderRadius: 2,
          transformOrigin: "50% 100%",
          transform: `rotate(${spin * 0.9}deg)`,
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: r - 1,
          top: r - 108,
          width: 2,
          height: 112,
          background: INK,
          opacity: 0.55,
          transformOrigin: "50% 100%",
          transform: `rotate(${spin * 3.4}deg)`,
        }}
      />
      <div style={{ position: "absolute", left: r - 7, top: r - 7, width: 14, height: 14, borderRadius: "50%", background: accent }} />
      <div style={{ position: "absolute", left: 0, top: r - 38, width: "100%", textAlign: "center" }}>
        <div style={{ fontFamily: SERIF, fontSize: 60, fontWeight: 700, color: INK, lineHeight: 1 }}>{year}</div>
        <div style={{ fontFamily: SANS, fontSize: 14, color: INK_SOFT, letterSpacing: 2, marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
};

const Wheel: React.FC<{
  x: number; y: number; label: string; sub: string; t: number; spin: number; color: string;
}> = ({ x, y, label, sub, t, spin, color }) => {
  const r = 94;
  return (
    <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, opacity: clamp01(t), transform: `scale(${0.8 + 0.2 * t}) rotate(${spin}deg)` }}>
      {Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * Math.PI * 2;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: r + Math.cos(a) * (r - 4) - 5,
              top: r + Math.sin(a) * (r - 4) - 5,
              width: 10,
              height: 10,
              background: color,
              opacity: 0.55,
              transform: `rotate(${(a * 180) / Math.PI}deg)`,
            }}
          />
        );
      })}
      <div style={{ position: "absolute", inset: 8, borderRadius: "50%", border: `10px solid ${color}33`, boxSizing: "border-box" }} />
      <div style={{ position: "absolute", inset: 28, borderRadius: "50%", border: `1.5px solid ${color}`, opacity: 0.5 }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `rotate(${-spin}deg)` }}>
        <div style={{ fontFamily: SERIF, fontSize: 27, fontWeight: 700, color: INK, whiteSpace: "nowrap" }}>{label}</div>
        <div style={{ fontFamily: SANS, fontSize: 12, color: INK_SOFT, letterSpacing: 1, marginTop: 5 }}>{sub}</div>
      </div>
    </div>
  );
};

const Scene06: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = mk(marks, 1, 0.3);
  const m2 = mk(marks, 2, 0.64);
  const ex = exitFade(p);
  const clockT = (i: number) => easeOut(seg(p, 0.04 + i * 0.12, 0.24 + i * 0.12));
  const wheelT = (i: number) => pop(seg(p, m1 + 0.02 + i * 0.04, m1 + 0.18 + i * 0.04));
  const connectorT = seg(p, m2 + 0.06, m2 + 0.3);
  const yearT = seg(p, 0.04, 0.16);

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: SANS }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ position: "absolute", inset: 0, opacity: ex, transform: `scale(${1 - 0.015 * (1 - ex)})` }}>
        <Cap text="BOGOR 1994 / OSAKA 1995" x={96} y={306} mono opacity={yearT} accent={accent} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 344,
            fontFamily: SERIF,
            fontSize: 43,
            color: INK,
            letterSpacing: 3,
            opacity: seg(p, 0.05, 0.16),
          }}
        >
          先定时间表，再装上两个轮子
        </div>

        {/* 两个时间表 */}
        <Clock x={292} y={690} year="2010" label="发达成员" t={clockT(0)} spin={20 + p * 70} accent={CORAL} />
        <Clock x={788} y={690} year="2020" label="发展中成员" t={clockT(1)} spin={-35 - p * 64} accent={GOLD} />

        <div
          style={{
            position: "absolute",
            left: 470,
            top: 668,
            width: 140,
            textAlign: "center",
            opacity: connectorT,
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 13, color: INK_SOFT, letterSpacing: 2 }}>BOGOR GOALS</div>
          <div style={{ width: 90, height: 1, background: CORAL, margin: "12px auto", opacity: 0.5 }} />
          <div style={{ fontFamily: SERIF, fontSize: 34, color: CORAL }}>→</div>
        </div>

        {/* 两个轮子 */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: 1 }}>
          <Wheel x={436} y={1112} label="贸易投资" sub="自由化 · 便利化" t={wheelT(0)} spin={p * 38} color={OCEAN} />
          <Wheel x={628} y={1112} label="经济技术" sub="合作 · 能力建设" t={wheelT(1)} spin={-p * 30} color={CORAL} />
          <div
            style={{
              position: "absolute",
              left: 510,
              top: 1088,
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: CREAM,
              border: `1.5px dashed ${INK}55`,
              opacity: connectorT,
              transform: `scale(${0.7 + 0.3 * connectorT})`,
            }}
          />
        </div>

        <Hair x={96} y={1320} w={888} progress={seg(p, 0.45, 0.72)} color={INK} opacity={0.15} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 1342,
            fontFamily: SANS,
            fontSize: 18,
            color: INK_SOFT,
            letterSpacing: 2,
            opacity: seg(p, 0.52, 0.74),
          }}
        >
          一个轮子谈开放，一个轮子做合作；少一个，车都走不稳
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene06;
