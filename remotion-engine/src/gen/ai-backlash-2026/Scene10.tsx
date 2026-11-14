// Scene10 · 重定价：高盛预计未来两年只有 50%-60% 的计划算力能落地
// 左边下跌的柱状图，右边“交付率”竖标尺；把“许可”盖成红色风险章。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Stamp, RED, GOLD, BLUE, INK, INK_SOFT, FAINT, MONO_STACK, SERIF_STACK, seg, eo, pop, lerp, clamp01 } from "./ui";

const BARS = [0.92, 0.86, 0.9, 0.78, 0.82, 0.68, 0.72, 0.55, 0.6, 0.44, 0.48, 0.34, 0.38, 0.26, 0.3];

const Scene10: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const chart = eo(seg(p, 0.08, 0.4));
  const fill = eo(seg(p, 0.28, 0.6));
  const stampT = pop(seg(p, 0.56, 0.7));
  const note = eo(seg(p, 0.58, 0.74));
  const pct = lerp(0, 55, fill);

  const baseY = 1130;
  const chartH = 400;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="CASE 10 / 11 · 华尔街" x={108} y={300} color={RED} />
        <Cap text="REPRICING" x={972} y={300} align="right" color={FAINT} />
        <Hair x={108} y={338} w={864} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 108, top: 390, opacity: enter }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 58, fontWeight: 700, color: INK, letterSpacing: 1 }}>
          AI 最大的风险，是许可。
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 19, letterSpacing: 2, color: FAINT, marginTop: 10 }}>
          不是芯片 · 不是需求 · 是能不能建
        </div>
      </div>

      {/* 关键数字：2 万亿市值蒸发 */}
      <div style={{ position: "absolute", left: 120, top: 560, opacity: enter }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 46, fontWeight: 700, color: RED, lineHeight: 1 }}>2万亿</div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 1.5, color: FAINT, marginTop: 4 }}>AI 股市值蒸发</div>
      </div>

      {/* 左：下跌柱状图 */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <line x1={120} y1={baseY} x2={610} y2={baseY} stroke={INK} strokeOpacity={0.25} strokeWidth={1.4} />
        {BARS.map((v, i) => {
          const t = clamp01((chart * BARS.length - i) * 1.9);
          const bw = 26;
          const x = 132 + i * 31;
          const h = chartH * v * t;
          return (
            <rect
              key={i}
              x={x}
              y={baseY - h}
              width={bw}
              height={h}
              fill={i > 9 ? RED : INK}
              opacity={i > 9 ? 0.55 : 0.24}
            />
          );
        })}
        <line x1={120} y1={baseY - chartH * 0.8} x2={610} y2={baseY - chartH * 0.8} stroke={RED} strokeOpacity={0.3} strokeWidth={1.2} strokeDasharray="7 7" />
      </svg>

      <div style={{ position: "absolute", left: 120, top: 1160, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 2, color: FAINT }}>
        AI INFRA / 估值与订单预期
      </div>

      {/* 右：交付率竖标尺 */}
      <div style={{ position: "absolute", left: 700, top: 600, width: 280, opacity: enter }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 3, color: FAINT }}>未来两年 · 可落地算力</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 8 }}>
          <span style={{ fontFamily: SERIF_STACK, fontSize: 100, fontWeight: 700, color: RED, lineHeight: 1 }}>50</span>
          <span style={{ fontFamily: SERIF_STACK, fontSize: 46, color: RED }}>–60%</span>
        </div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 26, color: INK_SOFT, marginTop: 4 }}>高盛预测 · 计划容量</div>
      </div>

      <div style={{ position: "absolute", left: 760, top: 830, width: 92, height: 330, border: `2px solid ${INK}`, background: "rgba(23,21,18,0.03)" }}>
        {/* 50-60% 区间带 */}
        <div style={{ position: "absolute", left: -10, width: 112, top: 330 * (1 - 0.6), height: 330 * 0.1, background: GOLD, opacity: 0.22 * fill }} />
        <div
          style={{
            position: "absolute", left: 0, bottom: 0, width: 92, height: 330 * (pct / 100),
            background: `linear-gradient(180deg, ${RED} 0%, ${RED}AA 100%)`, opacity: 0.78,
          }}
        />
        {[0, 0.5, 1].map((g) => (
          <React.Fragment key={g}>
            <div style={{ position: "absolute", left: 92, top: 330 * g, width: 12, height: 1, background: INK, opacity: 0.4 }} />
            <div style={{ position: "absolute", left: 110, top: 330 * g - 8, fontFamily: MONO_STACK, fontSize: 12, color: FAINT }}>
              {Math.round((1 - g) * 100)}%
            </div>
          </React.Fragment>
        ))}
      </div>

      <div style={{ position: "absolute", left: 700, top: 1180, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 2, color: FAINT }}>
        SOURCE: GOLDMAN SACHS / 2026
      </div>

      <Stamp text="许可风险" sub="SOCIAL LICENSE" x={390} y={735} size={34} rotate={-8} t={stampT} w={250} color={RED} filled={false} />

      <div style={{ position: "absolute", left: 108, top: 1240, opacity: note }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 29, color: INK_SOFT }}>
          从“需求有多大”，变成“到底能不能建出来”。
        </div>
      </div>

      <div style={{ position: "absolute", left: 108, top: 1300, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 2, color: FAINT, opacity: clamp01(note) }}>
        许可 · 并网 · 用水 · 地方否决
      </div>
    </AbsoluteFill>
  );
};

export default Scene10;
