// Scene11 · 收束：电、水、钱三张账单，最后落到普通人家门口的电表
// 三列关键词 + 一栋房子 + 转动的电表；问题留在画面里，不做口号。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, RED, GOLD, BLUE, INK, INK_SOFT, FAINT, MONO_STACK, SERIF_STACK, seg, eo, pop, clamp01 } from "./ui";

const COLS = [
  { k: "电", s: "ELECTRICITY", d: "电费涨", c: RED },
  { k: "水", s: "WATER", d: "水变少", c: BLUE },
  { k: "钱", s: "MONEY", d: "税收少", c: GOLD },
];

const Scene11: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const head = eo(seg(p, 0.04, 0.22));
  const house = eo(seg(p, 0.16, 0.36));
  const spin = eo(seg(p, 0.3, 0.8));
  const note = eo(seg(p, 0.58, 0.74));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="尾声 / 11 · 社会许可" x={108} y={300} color={GOLD} />
        <Cap text="THE BILL COMES HOME" x={972} y={300} align="right" color={FAINT} />
        <Hair x={108} y={338} w={864} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 108, top: 390, opacity: head }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 62, fontWeight: 700, color: INK, letterSpacing: 2 }}>
          技术，也得等社会点头。
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 19, letterSpacing: 2, color: FAINT, marginTop: 10 }}>
          这不是反 AI · 是一场重新定价
        </div>
      </div>

      {COLS.map((c, i) => {
        const t = eo(seg(p, 0.08 + i * 0.06, 0.22 + i * 0.06));
        const x = 120 + i * 290;
        return (
          <div key={c.k} style={{ position: "absolute", left: x, top: 600, width: 250, opacity: t, transform: `translateY(${(1 - t) * 26}px)` }}>
            <div style={{ fontFamily: SERIF_STACK, fontSize: 96, fontWeight: 700, color: c.c, lineHeight: 1 }}>{c.k}</div>
            <div style={{ fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 2, color: FAINT, marginTop: 8 }}>{c.s}</div>
            <div style={{ width: 78, height: 3, background: c.c, opacity: 0.65, marginTop: 16 }} />
            <div style={{ fontFamily: SERIF_STACK, fontSize: 30, color: INK, marginTop: 16 }}>{c.d}</div>
          </div>
        );
      })}

      {/* 房子 + 电表 */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <g opacity={house} transform={`translate(0 ${(1 - house) * 24})`}>
          <path d="M 330 1130 L 540 980 L 750 1130" fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d="M 380 1110 L 380 1320 L 700 1320 L 700 1110" fill="rgba(252,248,240,0.7)" stroke={INK} strokeWidth={5} />
          <rect x="470" y="1180" width="140" height="140" fill="none" stroke={INK} strokeWidth={3} />
          <circle cx="540" cy="1250" r="46" fill="none" stroke={INK} strokeWidth={2.5} />
          <line
            x1="540"
            y1="1250"
            x2={540 + Math.cos((-120 + spin * 250) * (Math.PI / 180)) * 36}
            y2={1250 + Math.sin((-120 + spin * 250) * (Math.PI / 180)) * 36}
            stroke={RED}
            strokeWidth={4}
            strokeLinecap="round"
          />
          <circle cx="540" cy="1250" r="5" fill={RED} />
          <text x="540" y="1318" textAnchor="middle" fontFamily={MONO_STACK} fontSize="12" fill={FAINT} letterSpacing="2">
            kWh
          </text>
        </g>
      </svg>

      <div
        style={{
          position: "absolute", left: 770, top: 1080, width: 110, height: 110, borderRadius: 55,
          border: `2px solid ${RED}`, display: "flex", alignItems: "center", justifyContent: "center",
          opacity: note, transform: `scale(${0.9 + 0.1 * Math.sin(p * 12)})`,
        }}
      >
        <span style={{ fontFamily: SERIF_STACK, fontSize: 54, color: RED }}>?</span>
      </div>

      <div style={{ position: "absolute", left: 108, top: 1352, width: 800, opacity: note }}>
        <div style={{ height: 1, background: INK, opacity: 0.16 }} />
        <div style={{ fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 1.5, color: FAINT, marginTop: 10, lineHeight: 1.6 }}>
          SOURCES / NPR · CNBC · CBS · GOOD JOBS FIRST<br />DATA CENTER WATCH · EPRI · OPENAI
        </div>
      </div>

      <div style={{ position: "absolute", right: 108, top: 1360, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 2, color: FAINT, opacity: clamp01(note) }}>
        END / 2026.11
      </div>
    </AbsoluteFill>
  );
};

export default Scene11;
