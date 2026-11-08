// Scene07 · 用途：更准的原子钟（SI 秒定义 9,192,631,770 Hz）→ 手机导航不飘
// 左侧原子钟表盘（朱红秒针持续扫动 + 精度弧）+ 右侧手机导航路线 + 中间精度虚线 + 底部秒脉冲标尺
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper,
  Cap,
  INK,
  INK_SOFT,
  INK_FAINT,
  RED,
  FONT_STACK,
  MARGIN,
  seg,
  eo,
  eio,
  pop,
} from "./ui";

const CX = 330;
const CY = 700;
const R = 190;
const PHONE_X = 620;
const PHONE_Y = 520;
const PHONE_W = 340;
const PHONE_H = 510;
const RULER_Y = 1150;
const RULER_X0 = 96;
const RULER_W = 888;
const N_TICK = 25;

// 导航折线
const PTS: Array<[number, number]> = [
  [700, 620],
  [760, 760],
  [700, 880],
  [820, 1000],
];
const SEG_LEN = PTS.slice(1).map((pt, i) => Math.hypot(pt[0] - PTS[i][0], pt[1] - PTS[i][1]));
const TOTAL = SEG_LEN.reduce((a, b) => a + b, 0);
const pointAt = (t: number): [number, number] => {
  let d = Math.max(0, Math.min(1, t)) * TOTAL;
  for (let i = 0; i < SEG_LEN.length; i += 1) {
    if (d <= SEG_LEN[i] || i === SEG_LEN.length - 1) {
      const k = Math.min(1, d / SEG_LEN[i]);
      return [PTS[i][0] + (PTS[i + 1][0] - PTS[i][0]) * k, PTS[i][1] + (PTS[i + 1][1] - PTS[i][1]) * k];
    }
    d -= SEG_LEN[i];
  }
  return PTS[PTS.length - 1];
};

const Scene07: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed, marks }) => {
  const m = (i: number, fb: number) => marks?.[i]?.start ?? fb;
  const tClock = m(1, 0.341); // 「它能做出更准的原子钟」
  const tNav = m(2, 0.627); // 「你手机导航不飘」

  const clockIn = eo(seg(p, 0.02, 0.17));
  const phoneIn = eo(seg(p, 0.07, 0.21));
  const siIn = seg(p, tClock - 0.02, tClock + 0.08);
  const gauge = eio(seg(p, tClock, tClock + 0.2)); // 精度弧
  const ghostIn = seg(p, 0.2, 0.34) * 0.16;
  const connT = eio(seg(p, tNav - 0.02, tNav + 0.08));
  const routeP = eio(seg(p, tNav + 0.02, tNav + 0.18));
  const pinRaw = seg(p, tNav + 0.14, tNav + 0.28);
  const pinT = pinRaw > 0.001 ? pop(pinRaw) : 0;
  const rulerIn = eio(seg(p, 0.08, 0.3));
  const breathe = 0.5 + 0.5 * Math.sin(p * Math.PI * 5);
  const exit = eio(seg(p, 0.9, 1));

  const secDeg = p * 900; // 秒针 2.5 圈
  const hourDeg = -60 + p * 4;
  const minDeg = 60 + p * 22;

  const routeHead = pointAt(routeP);
  const cursorX = RULER_X0 + RULER_W * ((p * 0.75) % 1); // 底部脉冲游标

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
          transformOrigin: "540px 780px",
        }}
      >
        {/* ---------- 层 1：原子钟表盘 ---------- */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            opacity: clockIn,
            transform: `scale(${0.92 + 0.08 * clockIn})`,
            transformOrigin: `${CX}px ${CY}px`,
          }}
        >
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
            {/* 双圈 */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke={INK} strokeOpacity={0.72} strokeWidth={2} />
            <circle cx={CX} cy={CY} r={R - 16} fill="none" stroke={INK} strokeOpacity={0.15} strokeWidth={1} />
            {/* 12 个刻度 */}
            {Array.from({ length: 12 }, (_, i) => {
              const a = ((i * 30 - 90) * Math.PI) / 180;
              const inner = i % 3 === 0 ? R - 32 : R - 18;
              const outer = R - 6;
              return (
                <line
                  key={`tk${i}`}
                  x1={CX + Math.cos(a) * inner}
                  y1={CY + Math.sin(a) * inner}
                  x2={CX + Math.cos(a) * outer}
                  y2={CY + Math.sin(a) * outer}
                  stroke={INK}
                  strokeOpacity={i % 3 === 0 ? 0.62 : 0.28}
                  strokeWidth={i % 3 === 0 ? 3 : 1.6}
                />
              );
            })}
            {/* 精度弧（第二句起扫过，暗示“更准”） */}
            <circle
              cx={CX}
              cy={CY}
              r={R - 52}
              fill="none"
              stroke={RED}
              strokeOpacity={0.3}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * (R - 52) * gauge} ${2 * Math.PI * (R - 52)}`}
              transform={`rotate(-90 ${CX} ${CY})`}
            />
            {/* 内圈呼吸细环 */}
            <circle cx={CX} cy={CY} r={R - 92} fill="none" stroke={RED} strokeOpacity={0.05 + 0.08 * breathe} strokeWidth={1} />
            {/* 时针 */}
            <line
              x1={CX}
              y1={CY}
              x2={CX + Math.cos(((hourDeg - 90) * Math.PI) / 180) * 96}
              y2={CY + Math.sin(((hourDeg - 90) * Math.PI) / 180) * 96}
              stroke={INK}
              strokeOpacity={0.7}
              strokeWidth={9}
              strokeLinecap="round"
            />
            {/* 分针 */}
            <line
              x1={CX}
              y1={CY}
              x2={CX + Math.cos(((minDeg - 90) * Math.PI) / 180) * 146}
              y2={CY + Math.sin(((minDeg - 90) * Math.PI) / 180) * 146}
              stroke={INK}
              strokeOpacity={0.85}
              strokeWidth={6}
              strokeLinecap="round"
            />
            {/* 中心圆点 */}
            <circle cx={CX} cy={CY} r={10} fill={INK} opacity={0.85} />
            <circle cx={CX} cy={CY} r={4} fill={RED} />
          </svg>

          {/* 秒针（朱红，一直扫动） */}
          <div
            style={{
              position: "absolute",
              left: CX - 1.5,
              top: CY - 160,
              width: 3,
              height: 160,
              transformOrigin: "50% 100%",
              transform: `rotate(${secDeg}deg)`,
            }}
          >
            <div style={{ width: 3, height: 160, background: RED, borderRadius: 2 }} />
            <div style={{ position: "absolute", left: -4, top: -4, width: 11, height: 11, borderRadius: "50%", background: RED }} />
          </div>
        </div>

        {/* SI 秒定义（铯原子钟） */}
        <Cap
          text="SI 秒定义 · 9,192,631,770 Hz"
          x={120}
          y={946}
          size={20}
          color={INK_FAINT}
          opacity={siIn}
          style={{ letterSpacing: 3 }}
        />

        {/* ---------- 层 2：手机 + 导航 ---------- */}
        <div
          style={{
            position: "absolute",
            left: PHONE_X + (1 - phoneIn) * 70,
            top: PHONE_Y,
            width: PHONE_W,
            height: PHONE_H,
            borderRadius: 30,
            border: `2px solid ${INK}2E`,
            background: "#FFFFFF33",
            opacity: phoneIn,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: PHONE_W / 2 - 38,
              top: 16,
              width: 76,
              height: 7,
              borderRadius: 4,
              background: INK,
              opacity: 0.22,
            }}
          />
          {/* 底图街网（静态细线，仅做底纹） */}
          {[0, 1, 2].map((i) => (
            <div key={`h${i}`} style={{ position: "absolute", left: 16, top: 150 + i * 120, width: PHONE_W - 32, height: 1, background: INK, opacity: 0.07 }} />
          ))}
          {[0, 1, 2].map((i) => (
            <div key={`v${i}`} style={{ position: "absolute", left: 60 + i * 105, top: 40, width: 1, height: PHONE_H - 70, background: INK, opacity: 0.07 }} />
          ))}
        </div>

        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <polyline
            points={PTS.map((pt) => pt.join(",")).join(" ")}
            fill="none"
            stroke={INK}
            strokeOpacity={ghostIn}
            strokeWidth={3}
            strokeDasharray="2 9"
            strokeLinecap="round"
          />
          <polyline
            points={PTS.map((pt) => pt.join(",")).join(" ")}
            fill="none"
            stroke={RED}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - routeP}
            opacity={routeP > 0 ? 0.95 : 0}
          />
          {routeP > 0.02 && routeP < 0.99 ? <circle cx={routeHead[0]} cy={routeHead[1]} r={5.5} fill={RED} opacity={0.9} /> : null}
          {pinRaw > 0.05
            ? [20, 44].map((r0) => (
                <circle key={r0} cx={820} cy={1000} r={r0 + 6 * breathe} fill="none" stroke={RED} strokeOpacity={0.22 * Math.min(1, pinRaw * 2)} strokeWidth={1.5} />
              ))
            : null}
        </svg>

        {/* 定位针（水滴形，pop 弹入） */}
        {pinRaw > 0 ? (
          <div
            style={{
              position: "absolute",
              left: 820 - 13,
              top: 1000 - 27,
              width: 26,
              height: 26,
              background: RED,
              borderRadius: "50% 50% 50% 0",
              transform: `rotate(-45deg) scale(${0.35 + 0.65 * Math.min(1, pinRaw * 1.6)})`,
              opacity: Math.min(1, pinRaw * 3),
            }}
          />
        ) : null}

        {/* 3 个原子点从外向内收拢到定位针 */}
        {pinRaw > 0.05
          ? Array.from({ length: 3 }, (_, i) => {
              const a = ((-40 + i * 130) * Math.PI) / 180;
              const d = 76 - 54 * seg(p, tNav + 0.16, tNav + 0.34);
              return (
                <div
                  key={`p${i}`}
                  style={{
                    position: "absolute",
                    left: 820 + Math.cos(a) * d - 4,
                    top: 1000 + Math.sin(a) * d - 4,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: RED,
                    opacity: 0.5 * Math.min(1, pinRaw * 2),
                  }}
                />
              );
            })
          : null}

        {/* 中间连接：冷 → 精度 → 导航 */}
        <div
          style={{
            position: "absolute",
            left: 524,
            top: 700,
            width: 92 * connT,
            height: 0,
            borderTop: `1px dashed ${INK}`,
            opacity: 0.3 * connT,
          }}
        />

        {/* ---------- 层 3：底部秒脉冲标尺（填下幅 + 计时感） ---------- */}
        <div style={{ position: "absolute", left: RULER_X0, top: RULER_Y, width: RULER_W * rulerIn, height: 1, background: INK, opacity: 0.16 }} />
        {Array.from({ length: N_TICK }, (_, i) => {
          const big = i % 6 === 0;
          return (
            <div
              key={`r${i}`}
              style={{
                position: "absolute",
                left: RULER_X0 + (RULER_W / (N_TICK - 1)) * i,
                top: RULER_Y - (big ? 7 : 3) * rulerIn,
                width: 1,
                height: (big ? 15 : 7) * rulerIn,
                background: INK,
                opacity: (big ? 0.3 : 0.16) * rulerIn,
              }}
            />
          );
        })}
        <div
          style={{
            position: "absolute",
            left: cursorX,
            top: RULER_Y - 20,
            width: 1,
            height: 34,
            background: RED,
            opacity: 0.55 * rulerIn,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: cursorX - 4,
            top: RULER_Y - 24,
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: RED,
            opacity: 0.7 * rulerIn,
          }}
        />

        {/* ---------- 层 4：标注 ---------- */}
        <Cap text="原子钟" x={MARGIN} y={336} accent={RED} color={INK_SOFT} opacity={seg(p, 0.04, 0.14)} />
        <Cap text="手机导航" x={PHONE_X} y={478} color={INK_SOFT} opacity={seg(p, 0.1, 0.22)} />
      </div>
    </AbsoluteFill>
  );
};

export default Scene07;
