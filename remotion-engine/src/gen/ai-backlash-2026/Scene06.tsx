// Scene06 · 账单：居民电费 + 地方税收减免，两张纸一起压下来
// 左边电费单，右边州预算表被“打了一个洞”；中间一台数据中心的电表在转。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Card, RED, GOLD, INK, INK_SOFT, FAINT, MONO_STACK, SERIF_STACK, seg, eo, pop, clamp01 } from "./ui";

const Scene06: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const bill = eo(seg(p, 0.04, 0.2));
  const hole = eo(seg(p, 0.22, 0.4));
  const taxIn = clamp01((hole - 0.45) / 0.35);
  const money = 25;
  const arrow = eo(seg(p, 0.44, 0.6));
  const note = eo(seg(p, 0.58, 0.72));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="CASE 06 / 11 · 账单" x={108} y={300} color={GOLD} />
        <Cap text="WHO PAYS?" x={972} y={300} align="right" color={FAINT} />
        <Hair x={108} y={338} w={864} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 108, top: 390, opacity: enter }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 60, fontWeight: 700, color: INK, letterSpacing: 1 }}>
          电费你出，税收也你出。
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 19, letterSpacing: 2, color: FAINT, marginTop: 10 }}>
          数据中心一接入 · 电网扩容 · 地方让税
        </div>
      </div>

      {/* 左：居民电费单 */}
      <div style={{ opacity: bill, transform: `translateY(${(1 - bill) * 40}px)` }}>
        <Card x={328} y={900} w={360} h={440} accent={RED} rotate={-1.6}>
          <div style={{ position: "absolute", left: 24, top: 20, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 3, color: FAINT }}>
            MONTHLY STATEMENT
          </div>
          <div style={{ position: "absolute", left: 24, top: 48, fontFamily: SERIF_STACK, fontSize: 36, fontWeight: 700, color: INK }}>
            电 费 单
          </div>
          <div style={{ position: "absolute", left: 24, top: 104, width: 312, height: 1, background: INK, opacity: 0.16 }} />
          <div style={{ position: "absolute", left: 24, top: 124, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 2, color: FAINT }}>
            THIS MONTH
          </div>
          <div style={{ position: "absolute", left: 24, top: 150, fontFamily: SERIF_STACK, fontSize: 50, fontWeight: 700, color: INK, letterSpacing: 2 }}>
            本月 ↑
          </div>
          <div style={{ position: "absolute", left: 24, top: 222, fontFamily: MONO_STACK, fontSize: 15, color: RED }}>
            ▲ 数据中心接入后
          </div>

          {/* 小折线 */}
          <svg width={330} height={120} style={{ position: "absolute", left: 18, top: 258 }}>
            <polyline points="0,90 40,78 80,84 120,60 160,66 200,40 240,46 280,18 316,10" fill="none" stroke={RED} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={bill} />
            <line x1="0" y1="104" x2="316" y2="104" stroke={INK} strokeOpacity={0.18} strokeWidth={1} />
          </svg>
          <div style={{ position: "absolute", left: 24, bottom: 22, fontFamily: MONO_STACK, fontSize: 12, letterSpacing: 1, color: FAINT }}>
            ILLUSTRATIVE / 示意账单
          </div>
        </Card>
      </div>

      {/* 中：电表 */}
      <div style={{ position: "absolute", left: 540, top: 604, transform: "translate(-50%,-50%)", opacity: arrow }}>
        <div style={{ width: 96, height: 96, borderRadius: 48, border: `2px solid ${INK}`, background: "rgba(252,248,240,0.9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 24px ${INK}18` }}>
          <div style={{ width: 58, height: 58, borderRadius: 29, border: `2px solid ${RED}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO_STACK, fontSize: 13, color: RED }}>
            kWH
          </div>
        </div>
        <div style={{ position: "absolute", left: 104, top: 40, width: 160, height: 2, background: INK, opacity: 0.28 }} />
        <div style={{ position: "absolute", left: 104, top: -42, width: 160, height: 2, background: INK, opacity: 0.28 }} />
      </div>

      {/* 右：州预算被打洞 */}
      <div style={{ opacity: taxIn, transform: `translateY(${(1 - taxIn) * 40}px)` }}>
        <Card x={790} y={900} w={340} h={440} accent={GOLD} rotate={1.8}>
          <div style={{ position: "absolute", left: 22, top: 20, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 3, color: FAINT }}>
            STATE BUDGET / FY2026
          </div>
          <div style={{ position: "absolute", left: 22, top: 48, fontFamily: SERIF_STACK, fontSize: 34, fontWeight: 700, color: INK }}>
            佐治亚州
          </div>
          <div style={{ position: "absolute", left: 22, top: 96, width: 292, height: 1, background: INK, opacity: 0.16 }} />
          {[124, 158, 192, 226].map((y, i) => (
            <div key={y} style={{ position: "absolute", left: 22, top: y, width: 250 - i * 20, height: 7, background: INK, opacity: 0.16 }} />
          ))}
          {/* 洞 */}
          <div
            style={{
              position: "absolute", right: 34, top: 118, width: 120 * hole, height: 120 * hole, borderRadius: "50%",
              background: "radial-gradient(circle at 40% 35%, #2a241c 0%, #0f0d0a 70%)",
              boxShadow: `inset 0 8px 18px #000, 0 0 0 2px ${GOLD}55`,
            }}
          />
          <div style={{ position: "absolute", left: 22, bottom: 92, fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 2, color: FAINT }}>
            TAX ABATEMENT LOSS
          </div>
          <div style={{ position: "absolute", left: 20, bottom: 26, display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontFamily: SERIF_STACK, fontSize: 60, fontWeight: 700, color: RED, lineHeight: 1 }}>-{money.toFixed(0)}</span>
            <span style={{ fontFamily: SERIF_STACK, fontSize: 28, color: RED }}>亿美元</span>
          </div>
        </Card>
      </div>

      <div style={{ position: "absolute", left: 108, top: 1200, opacity: note }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 29, color: INK_SOFT }}>
          电价上涨，税收减少：同一笔账，两头都落在居民身上。
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 16, letterSpacing: 2, color: FAINT, marginTop: 12 }}>
          SOURCE: GOOD JOBS FIRST · 2026.06
        </div>
      </div>

      <div style={{ position: "absolute", left: 700, top: 1268, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 2, color: FAINT, opacity: clamp01(note) }}>
        弗吉尼亚 20 亿 · 得州 13 亿
      </div>
    </AbsoluteFill>
  );
};

export default Scene06;
