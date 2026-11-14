// Scene07 · 飞轮：门店越多 → 原料越多 → 成本越低
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Signature, exitFade, mk, seg, easeOut, pop, clamp01,
  RED, INK, MUTED, LINE, CREAM,
} from "./ui";

const CX = 540;
const CY = 760;
const R = 238;
const NODES = [
  { a: -Math.PI / 2, label: "更多门店", lx: -70, ly: -70 },
  { a: 0, label: "更多原料", lx: 34, ly: -14 },
  { a: Math.PI / 2, label: "更低成本", lx: -74, ly: 40 },
  { a: Math.PI, label: "更低价格", lx: -158, ly: -14 },
];

const Scene07: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.06);
  const draw = easeOut(seg(p, 0.04, 0.3));
  const rot = Math.sin(clamp01(p) * Math.PI * 2) * 4;
  const center = pop(seg(p, m0 + 0.2, m0 + 0.4));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <Signature />
        <Cap text="规模飞轮" x={96} y={330} opacity={seg(p, 0.02, 0.1)} />
        <div style={{ position: "absolute", left: 96, top: 368, fontFamily: '"Songti SC",serif', fontSize: 40, color: INK, opacity: seg(p, 0.05, 0.16) }}>
          店越多，成本越低
        </div>
        <div
          style={{
            position: "absolute", left: CX - R, top: CY - R, width: R * 2, height: R * 2,
            borderRadius: "50%", border: `2px dashed ${INK}`, opacity: 0.22 * draw,
            transform: `rotate(${rot}deg)`,
          }}
        />
        <div
          style={{
            position: "absolute", left: CX - R + 40, top: CY - R + 40, width: (R - 40) * 2, height: (R - 40) * 2,
            borderRadius: "50%", border: `1px solid ${RED}`, opacity: 0.12 * draw,
          }}
        />
        {NODES.map((n, i) => {
          const x = CX + Math.cos(n.a) * R;
          const y = CY + Math.sin(n.a) * R;
          const t = seg(p, 0.12 + i * 0.08, 0.26 + i * 0.08);
          const s = pop(t);
          return (
            <React.Fragment key={i}>
              <div
                style={{
                  position: "absolute", left: x - 17, top: y - 17, width: 34, height: 34,
                  borderRadius: "50%", background: i % 2 === 0 ? RED : INK,
                  transform: `scale(${s})`, opacity: clamp01(t),
                  boxShadow: "0 0 0 7px rgba(215,38,30,0.08)",
                }}
              />
              <div
                style={{
                  position: "absolute", left: x + n.lx, top: y + n.ly,
                  fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 24, fontWeight: 700,
                  color: i % 2 === 0 ? RED : INK, letterSpacing: 2,
                  opacity: clamp01(t), whiteSpace: "nowrap",
                }}
              >
                {n.label}
              </div>
            </React.Fragment>
          );
        })}
        {[45, 135, 225, 315].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const x = CX + Math.cos(rad) * R;
          const y = CY + Math.sin(rad) * R;
          return (
            <div
              key={deg}
              style={{
                position: "absolute", left: x - 9, top: y - 9, width: 18, height: 18,
                borderTop: `4px solid ${RED}`, borderRight: `4px solid ${RED}`,
                transform: `rotate(${deg + 45}deg)`, opacity: 0.65 * draw,
              }}
            />
          );
        })}
        <div
          style={{
            position: "absolute", left: CX - 82, top: CY - 82, width: 164, height: 164,
            borderRadius: "50%", background: RED, display: "flex", alignItems: "center", justifyContent: "center",
            color: CREAM, fontFamily: '"Songti SC",serif', fontSize: 44, fontWeight: 700, letterSpacing: 4,
            transform: `scale(${0.7 + 0.3 * center})`, opacity: clamp01(center),
            boxShadow: "0 20px 46px rgba(215,38,30,0.22)",
          }}
        >
          成本
        </div>
        <div style={{ position: "absolute", left: 96, top: 1120, fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 21, color: MUTED, letterSpacing: 2, opacity: seg(p, 0.62, 0.8) }}>
          规模 → 采购量 → 议价与自产 → 更低成本 → 更低价格
        </div>
        <div style={{ position: "absolute", left: 96, top: 1150, width: 888 * draw, height: 2, background: LINE }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene07;
