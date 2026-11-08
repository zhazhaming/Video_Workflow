// Scene08 · 收尾：2011 → 2026（15 年）的年度长河 → 就为这稳稳的 7 秒 → 下一个纪录会是谁？
// 16 根年度刻度 + 15 年朱红跨度 + 2026 端点呼吸环 + 基线末端的 7 秒量距（74px 括号 + 引线） + 轴外朱红问号
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Num, INK, INK_SOFT, INK_FAINT, RED, FONT_STACK, MONO_STACK, SERIF_STACK, seg, eio, eo, pop } from "./ui";

const X0 = 136;
const STEP = 51;
const N = 16; // 2011~2026
const LAST = X0 + STEP * (N - 1); // 901
const AXY = 700; // 时间轴
const SPAN_Y = 620; // 15 年朱红跨度线
const BASE_Y = 1060; // 底部投影基线
const YEAR_LABELS: Array<{ i: number; y: string }> = [
  { i: 0, y: "2011" },
  { i: 5, y: "2016" },
  { i: 10, y: "2021" },
  { i: 15, y: "2026" },
];

const Scene08: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed, marks }) => {
  const m = (i: number, fb: number) => marks?.[i]?.start ?? fb;
  const tSpan = m(0, 0.059); // 「从论证到成果，15 年」
  const tSeven = m(1, 0.445); // 「就为这稳稳的 7 秒」
  const tNext = m(2, 0.709); // 「下一个纪录，会是谁？」

  const axisIn = eo(seg(p, 0.02, 0.2));
  const tick = (i: number) => eo(seg(p, 0.03 + i * 0.012, 0.13 + i * 0.012));
  const spanT = eo(seg(p, tSpan + 0.16, tSpan + 0.34));
  const headRaw = seg(p, tSeven - 0.02, tSeven + 0.1); // 2026 端点朱红
  const headT = headRaw > 0.001 ? pop(headRaw) : 0;
  const sevenT = eo(seg(p, tSeven + 0.02, tSeven + 0.2));
  const nextT = seg(p, tNext, tNext + 0.14);
  const breathe = 0.5 + 0.5 * Math.sin(p * Math.PI * 5);
  const exit = eio(seg(p, 0.9, 1));
  const qFloat = Math.sin(p * Math.PI * 3) * 6;

  return (
    <AbsoluteFill style={{ fontFamily: FONT_STACK, overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />

      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 1920,
          transform: `translateY(${exit * 6}px) scale(${1 - exit * 0.012})`,
          transformOrigin: "540px 800px",
        }}
      >
        {/* ---------- 年度刻度向下延伸的虚线（把下半幅撑成“长河”） ---------- */}
        <div
          style={{
            position: "absolute",
            left: X0,
            top: AXY,
            width: (LAST - X0) * axisIn,
            height: (BASE_Y - AXY) * axisIn,
            background: INK,
            opacity: 0.032,
          }}
        />
        {Array.from({ length: N - 1 }, (_, i) => (
          <div
            key={`g${i}`}
            style={{
              position: "absolute",
              left: X0 + i * STEP,
              top: AXY,
              width: 1,
              height: (BASE_Y - AXY) * tick(i),
              backgroundImage: `repeating-linear-gradient(to bottom, ${INK} 0px, ${INK} 3px, transparent 3px, transparent 10px)`,
              opacity: 0.1,
            }}
          />
        ))}

        {/* ---------- 层 1：年度长河 ---------- */}
        <div style={{ position: "absolute", left: X0, top: AXY, width: (LAST - X0) * axisIn, height: 1, background: INK, opacity: 0.28 }} />

        {Array.from({ length: N }, (_, i) => {
          const k = tick(i);
          const isEnd = i === N - 1;
          const isHead = isEnd && headRaw > 0.02;
          const h = isEnd ? 26 + 12 * headRaw : 14;
          return (
            <div
              key={`tk${i}`}
              style={{
                position: "absolute",
                left: X0 + i * STEP - (isHead ? 1 : 0),
                top: AXY - h * k,
                width: isHead ? 3 : 1,
                height: h * k,
                background: isHead ? RED : INK,
                opacity: isHead ? Math.min(1, headRaw * 1.6) : 0.3 * k,
              }}
            />
          );
        })}

        {/* 年份刻度标签 */}
        {YEAR_LABELS.map(({ i, y }) => (
          <Cap
            key={y}
            text={y}
            x={X0 + i * STEP}
            y={736}
            size={24}
            color={i === N - 1 && headRaw > 0.5 ? RED : INK_SOFT}
            opacity={tick(i) * (i === N - 1 ? Math.min(1, headRaw * 1.4) : 1)}
            style={{ transform: "translateX(-50%)" }}
          />
        ))}

        {/* 面板内的年份竖排小字（填实“长河”，不抢主图形；2026 列留给朱红量距线） */}
        {Array.from({ length: N - 1 }, (_, i) => (
          <div
            key={`my${i}`}
            style={{
              position: "absolute",
              left: X0 + i * STEP + 7,
              top: 782,
              transformOrigin: "0 0",
              transform: "rotate(90deg)",
              fontFamily: MONO_STACK,
              fontSize: 15,
              letterSpacing: 2,
              color: INK_FAINT,
              opacity: 0.32 * tick(i),
              whiteSpace: "nowrap",
            }}
          >
            {2011 + i}
          </div>
        ))}
        {/* 面板内的三条极淡横线（长河纹理） */}
        {[880, 966, 1052].map((y, i) => (
          <div
            key={`hr${i}`}
            style={{ position: "absolute", left: X0, top: y, width: (LAST - X0) * axisIn, height: 1, background: INK, opacity: 0.05, transform: `scaleY(${1})` }}
          />
        ))}

        {/* ---------- 层 2：15 年朱红跨度 ---------- */}
        <div style={{ position: "absolute", left: X0, top: SPAN_Y, width: (LAST - X0) * spanT, height: 2, background: RED, opacity: 0.55 }} />
        <div style={{ position: "absolute", left: X0 - 1, top: SPAN_Y - 9 * spanT, width: 2, height: 18 * spanT, background: RED, opacity: 0.7 }} />
        <div
          style={{
            position: "absolute",
            left: X0 + (LAST - X0) * spanT - 1,
            top: SPAN_Y - 9 * spanT,
            width: 2,
            height: 18 * spanT,
            background: RED,
            opacity: 0.7 * spanT,
          }}
        />
        <Cap text="15 年" x={518} y={568} size={30} color={RED} opacity={spanT} style={{ transform: "translateX(-50%)", letterSpacing: 6 }} />

        {/* 2026 端点：朱红圆环呼吸 */}
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          {headRaw > 0.05 ? (
            <>
              <circle cx={LAST} cy={AXY} r={20 + 4 * breathe} fill="none" stroke={RED} strokeOpacity={0.35 * Math.min(1, headRaw)} strokeWidth={1.5} />
              <circle cx={LAST} cy={AXY} r={34 + 6 * breathe} fill="none" stroke={RED} strokeOpacity={0.14 * Math.min(1, headRaw)} strokeWidth={1} />
            </>
          ) : null}
        </svg>

        {/* ---------- 层 3：底部投影基线（15 年的量距） ---------- */}
        <div style={{ position: "absolute", left: X0, top: BASE_Y, width: (LAST - X0) * axisIn, height: 1, background: INK, opacity: 0.18 }} />
        <div style={{ position: "absolute", left: X0 - 1, top: BASE_Y - 8, width: 2, height: 17, background: INK, opacity: 0.25 * axisIn }} />
        <div style={{ position: "absolute", left: LAST - 1, top: BASE_Y - 8, width: 2, height: 17, background: INK, opacity: 0.25 * axisIn }} />

        {/* 2026 竖直投影（朱红虚线，从年份小字下方一直落到基线） */}
        <div
          style={{
            position: "absolute",
            left: LAST,
            top: 830,
            width: 1,
            height: (BASE_Y - 830) * sevenT,
            backgroundImage: `repeating-linear-gradient(to bottom, ${RED} 0px, ${RED} 4px, transparent 4px, transparent 11px)`,
            opacity: 0.4 * sevenT,
          }}
        />

        {/* ---------- 层 4：7 秒量距（基线末端 74px 朱红段 + U 形括号 + 引线到 2026） ---------- */}
        {sevenT > 0.01 ? (
          <>
            {/* 底部一对读数：左「15 年」（整条基线） ↔ 右「7.0 s」（末端的 74px） */}
            <Cap text="15 年" x={X0 + 10} y={1066} size={22} color={INK_SOFT} opacity={0.75 * axisIn} style={{ letterSpacing: 4 }} />
            {/* 7 秒 = 基线末端的 74px 朱红段（夸张对比 15 年的 765px） */}
            <div style={{ position: "absolute", left: LAST - 74, top: BASE_Y - 2, width: 74 * sevenT, height: 4, background: RED, opacity: 0.9 }} />
            {/* U 形括号：与朱红段等宽，两端竖线接回基线 */}
            <div style={{ position: "absolute", left: LAST - 74, top: BASE_Y + 4, width: 1.5, height: 26 * sevenT, background: RED, opacity: 0.8 }} />
            <div style={{ position: "absolute", left: LAST - 1, top: BASE_Y + 4, width: 1.5, height: 26 * sevenT, background: RED, opacity: 0.8 }} />
            <div style={{ position: "absolute", left: LAST - 74, top: BASE_Y + 28, width: 74 * sevenT, height: 1.5, background: RED, opacity: 0.8 }} />
            {/* 读数：紧贴括号左端 */}
            <Num value={7} decimals={1} x={LAST - 200} y={BASE_Y + 2} size={46} color={RED} suffix="s" suffixSize={24} opacity={sevenT} />
            {/* 左侧量距线：括号左端向上接到时间轴，与右侧 2026 投影合成“7 秒窗口” */}
            <div
              style={{
                position: "absolute",
                left: LAST - 74,
                top: 716,
                width: 1,
                height: (BASE_Y - 716) * sevenT,
                backgroundImage: `repeating-linear-gradient(to bottom, ${RED} 0px, ${RED} 4px, transparent 4px, transparent 11px)`,
                opacity: 0.34 * sevenT,
              }}
            />
            {/* 两端小横线：把量距线明显挂到时间轴与基线上 */}
            <div style={{ position: "absolute", left: LAST - 74, top: 716, width: 16, height: 1, background: RED, opacity: 0.5 * sevenT }} />
            <div style={{ position: "absolute", left: LAST - 74, top: BASE_Y, width: 16, height: 1, background: RED, opacity: 0.5 * sevenT }} />
          </>
        ) : null}

        {/* ---------- 层 5：未来（虚线延伸 + 问号） ---------- */}
        <div
          style={{
            position: "absolute",
            left: LAST,
            top: AXY,
            width: 84 * nextT,
            height: 1,
            backgroundImage: `repeating-linear-gradient(to right, ${INK} 0px, ${INK} 3px, transparent 3px, transparent 8px)`,
            opacity: 0.3 * nextT,
          }}
        />
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          {nextT > 0.05 ? (
            <circle cx={940} cy={552 + qFloat} r={44 + 4 * breathe} fill="none" stroke={RED} strokeOpacity={0.2 * nextT} strokeWidth={1.2} />
          ) : null}
        </svg>
        <div
          style={{
            position: "absolute",
            left: 940,
            top: 552 + qFloat,
            transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * pop(nextT)}) rotate(${-4 + 4 * nextT}deg)`,
            fontFamily: SERIF_STACK,
            fontSize: 96,
            fontWeight: 700,
            color: RED,
            opacity: nextT,
            lineHeight: 1,
          }}
        >
          ?
        </div>

        {/* 左上编辑性角标已移除（避免孤立朱红短横线被误读为残留元素） */}
      </div>
    </AbsoluteFill>
  );
};

export default Scene08;
