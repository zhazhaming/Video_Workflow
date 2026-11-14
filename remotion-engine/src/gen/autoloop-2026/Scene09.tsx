// Scene09 · 适合谁：一张雷达图，四个角色依次被点亮
// 同心圆 + 旋转扫描扇面，四个角色标签落在圆环对角；中心是一枚小小的人。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Card, Dot, INK, INK_SOFT, FAINT, TEAL, RED, GOLD, PAPER, MONO_STACK, SERIF_STACK, seg, eo, pop, clamp01 } from "./ui";

const CX = 540;
const CY = 720;
const R = 286;

const roles = [
  { a: -135, en: "DEV", zh: "开发者", sub: "每天跑 Agent", color: TEAL },
  { a: -45, en: "INDIE", zh: "独立开发", sub: "一个人当团队", color: GOLD },
  { a: 45, en: "TEAM", zh: "小团队", sub: "缺一个值班的", color: TEAL },
  { a: 135, en: "OPS", zh: "运维", sub: "重复排障", color: RED },
];

const Scene09: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const ring1 = eo(seg(p, 0.05, 0.3));
  const ring2 = eo(seg(p, 0.12, 0.38));
  const ring3 = eo(seg(p, 0.19, 0.46));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="09 / 适合谁" x={150} y={330} />
        <Cap text="常用 AI 的人" x={880} y={330} align="right" color={FAINT} />
        <Hair x={150} y={368} w={260} color={TEAL} thickness={2} progress={eo(seg(p, 0.08, 0.3))} opacity={0.65} />
      </div>

      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {[130, 208, R].map((r, i) => {
          const t = i === 0 ? ring1 : i === 1 ? ring2 : ring3;
          const len = 2 * Math.PI * r;
          return (
            <circle
              key={r} cx={CX} cy={CY} r={r} fill="none"
              stroke={i === 2 ? TEAL : INK}
              strokeOpacity={i === 2 ? 0.45 : 0.16}
              strokeWidth={i === 2 ? 1.8 : 1}
              strokeDasharray={i === 2 ? "8 10" : undefined}
              strokeDashoffset={i === 2 ? len * (1 - t) : undefined}
            />
          );
        })}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={CX + Math.cos(a) * 130} y1={CY + Math.sin(a) * 130}
              x2={CX + Math.cos(a) * R} y2={CY + Math.sin(a) * R}
              stroke={INK} strokeOpacity={0.07}
            />
          );
        })}
      </svg>

      {/* 扫描扇面 */}
      <div
        style={{
          position: "absolute", left: CX - R, top: CY - R, width: R * 2, height: R * 2, borderRadius: R,
          background: `conic-gradient(from ${p * 300 - 60}deg, transparent 0deg, transparent 300deg, ${TEAL}2A 340deg, transparent 360deg)`,
          opacity: 0.9 * ring3,
          maskImage: "radial-gradient(circle, black 0%, black 100%)",
          WebkitMaskImage: "radial-gradient(circle, black 0%, black 100%)",
        }}
      />

      {/* 中心 */}
      <div style={{ position: "absolute", left: CX - 78, top: CY - 78, width: 156, height: 156, borderRadius: 78, background: PAPER, border: `1.5px solid ${INK}22`, display: "flex", alignItems: "center", justifyContent: "center", opacity: ring1, boxShadow: `0 12px 30px ${INK}12` }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: MONO_STACK, fontSize: 12, letterSpacing: 3, color: FAINT }}>YOU</div>
          <div style={{ marginTop: 6, fontFamily: SERIF_STACK, fontSize: 28, color: INK }}>天天用</div>
          <div style={{ fontFamily: SERIF_STACK, fontSize: 28, color: INK }}>AI</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: CX - 4, top: CY + 62, width: 8, height: 8, borderRadius: 4, background: RED, opacity: 0.45 + 0.4 * Math.sin(p * 18) }} />

      {/* 角色卡 */}
      {roles.map((r, i) => {
        const t = pop(seg(p, 0.3 + i * 0.09, 0.46 + i * 0.09));
        const rad = (r.a * Math.PI) / 180;
        const x = CX + Math.cos(rad) * (R + 26);
        const y = CY + Math.sin(rad) * (R - 52);
        return (
          <div key={r.en} style={{ opacity: clamp01(t * 1.4), transform: `translate(-50%,-50%) scale(${0.9 + 0.1 * t})`, position: "absolute", left: x, top: y }}>
            <div style={{ width: 210, height: 98, background: "rgba(251,247,239,0.93)", border: `1px solid ${INK}20`, borderRadius: 9, boxShadow: `0 14px 30px ${INK}14`, padding: "12px 16px", boxSizing: "border-box" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 2, color: r.color }}>{r.en}</span>
                <span style={{ fontFamily: SERIF_STACK, fontSize: 26, color: INK }}>{r.zh}</span>
              </div>
              <div style={{ marginTop: 4, fontFamily: MONO_STACK, fontSize: 13, color: FAINT }}>{r.sub}</div>
            </div>
            <div style={{ position: "absolute", left: 210 / 2 - 4, top: -5, width: 8, height: 8, borderRadius: 4, background: r.color, opacity: 0.8 }} />
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 150, top: 1136, opacity: eo(seg(p, 0.7, 0.88)) }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 16, letterSpacing: 3, color: FAINT }}>不是所有人都适合</div>
        <div style={{ marginTop: 10, fontFamily: SERIF_STACK, fontSize: 34, color: INK_SOFT, letterSpacing: 1 }}>
          不用命令行 Agent 的人，先别急着装。
        </div>
      </div>
      <div style={{ position: "absolute", left: 150, top: 1220, width: 730, height: 1, background: INK, opacity: 0.14 * eo(seg(p, 0.7, 0.88)) }} />
      <Dot x={150} y={330} r={4} color={RED} opacity={0.7} />
    </AbsoluteFill>
  );
};

export default Scene09;
