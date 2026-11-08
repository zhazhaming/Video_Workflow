// Scene03 · 回撤标尺：27,641 → 24,315，坠入回调区
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, Num, exitStyle, mk,
  INK, INK_SOFT, INK_FAINT, RED, GOLD, MONO_STACK,
  seg, eo, ei, eoq, pop, clamp01,
} from "./ui";

const RX = 430; // 标尺 x
const RY0 = 430; // 0%
const RY1 = 1190; // -16%
const pxPer = (RY1 - RY0) / 16; // 47.5 px / 1%

const Scene03: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.11);
  const fallT = ei(seg(p, 0.14, 0.52));
  const markerY = RY0 + 18 + fallT * (12 * pxPer - 18);
  const bandT = eo(seg(p, 0.5, 0.62));
  const bigT = pop(seg(p, 0.52, 0.66));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={exitStyle(p)}>
        <Cap text="距 10·6 历史收盘高点" y={310} opacity={seg(p, 0.03, 0.12)} />
        {/* 高点 / 现值 */}
        <div style={{ position: "absolute", left: 520, top: 356, opacity: seg(p, 0.08, 0.18) }}>
          <div style={{ fontFamily: MONO_STACK, fontSize: 24, letterSpacing: 3, color: INK_FAINT }}>2026/10/06 高点</div>
          <div style={{ fontSize: 56, fontWeight: 800, color: INK, fontVariantNumeric: "tabular-nums", lineHeight: 1.25 }}>
            27,641.17
          </div>
        </div>
        <div style={{ position: "absolute", left: 520, top: 1210, opacity: seg(p, 0.35, 0.5) }}>
          <div style={{ fontFamily: MONO_STACK, fontSize: 24, letterSpacing: 3, color: INK_FAINT }}>2026/11/05 收盘</div>
          <div style={{ fontSize: 56, fontWeight: 800, color: INK, fontVariantNumeric: "tabular-nums", lineHeight: 1.25 }}>
            24,315.00
          </div>
        </div>
        {/* 回调警戒带（-10% ~ -15%） */}
        <div
          style={{
            position: "absolute",
            left: 300,
            top: RY0 + 10 * pxPer,
            width: 684,
            height: 5 * pxPer,
            background: RED,
            opacity: 0.07 * bandT,
          }}
        />
        <Cap
          text="回调区间 ≥ -10%"
          x={560}
          y={RY0 + 10 * pxPer + 14}
          color={RED}
          accent={RED}
          opacity={bandT}
        />
        {/* 纵向标尺 */}
        <div style={{ position: "absolute", left: RX, top: RY0, width: 2, height: RY1 - RY0, background: INK, opacity: 0.35 }} />
        {[-4, -8, -12, -16].map((v) => (
          <div key={v} style={{ opacity: seg(p, 0.06 + Math.abs(v) * 0.012, 0.14 + Math.abs(v) * 0.012) }}>
            <div
              style={{
                position: "absolute",
                left: RX - 14,
                top: RY0 + (Math.abs(v) / 16) * (RY1 - RY0),
                width: 30,
                height: 2,
                background: INK,
                opacity: 0.4,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: RX - 86,
                top: RY0 + (Math.abs(v) / 16) * (RY1 - RY0) - 16,
                fontFamily: MONO_STACK,
                fontSize: 26,
                color: INK_FAINT,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {v}%
            </div>
          </div>
        ))}
        {/* 顶端刻度 0% */}
        <div style={{ opacity: seg(p, 0.05, 0.12) }}>
          <div style={{ position: "absolute", left: RX - 86, top: RY0 - 40, fontFamily: MONO_STACK, fontSize: 26, color: INK_FAINT }}>
            0%
          </div>
          <div style={{ position: "absolute", left: RX - 14, top: RY0, width: 30, height: 2, background: GOLD, opacity: 0.8 }} />
        </div>
        {/* 下坠游标 + 拖尾 */}
        {[0.14, 0.08].map((gap, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: RX - 60,
              top: markerY - 46 - i * 54 * (1 - fallT * 0.4) * (fallT > 0.05 ? 1 : 0),
              width: 120,
              height: 4,
              background: RED,
              opacity: 0.12,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: RX - 70,
            top: markerY - 5,
            width: 140,
            height: 10,
            background: RED,
            borderRadius: 5,
            opacity: fallT > 0.01 ? 1 : 0,
            transform: `scaleX(${clamp01(fallT * 3)})`,
            transformOrigin: "50% 50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: RX - 11,
            top: markerY - 11,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: RED,
            opacity: fallT > 0.01 ? 1 : 0,
          }}
        />
        {/* -12% 大数字 */}
        <Num
          value={-12}
          x={600}
          y={948}
          size={168}
          color={RED}
          suffix="%"
          suffixSize={84}
          suffixColor={RED}
          opacity={bigT}
          style={{ transform: `scale(${0.7 + 0.3 * bigT})`, transformOrigin: "0 50%" }}
        />
        <Cap
          text="一个月 · 回调确认"
          x={610}
          y={1130}
          color={INK_SOFT}
          opacity={0.9 * seg(p, 0.62, 0.74)}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene03;
