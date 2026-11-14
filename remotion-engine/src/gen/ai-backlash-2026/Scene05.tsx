// Scene05 · 胃口：EPRI 预计 2030 年数据中心最高吃掉美国 17% 的电
// 半圆仪表盘 + 输电塔剪影；数字从 0 走到 17，强调“电老虎”。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Gauge, Card, RED, BLUE, INK, INK_SOFT, FAINT, MONO_STACK, SERIF_STACK, seg, eo, lerp, clamp01 } from "./ui";

const Scene05: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const sweep = eo(seg(p, 0.12, 0.62));
  const value = lerp(0, 17, sweep);
  const note = eo(seg(p, 0.55, 0.72));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="CASE 05 / 11 · 电力" x={108} y={300} color={BLUE} />
        <Cap text="EPRI / 2026.02" x={972} y={300} align="right" color={FAINT} />
        <Hair x={108} y={338} w={864} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 108, top: 390, opacity: enter }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 64, fontWeight: 700, color: INK, letterSpacing: 2 }}>
          AI 的胃口，是电。
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 19, letterSpacing: 2, color: FAINT, marginTop: 10 }}>
          数据中心 · 24 小时不能停
        </div>
      </div>

      {/* 输电塔剪影 */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: 0.55 * enter }}>
        {[92, 988].map((x, k) => (
          <g key={k} stroke={INK} strokeWidth={2} fill="none" opacity={0.42}>
            <path d={`M ${x} 1180 L ${x - 34} 830 M ${x} 1180 L ${x + 34} 830`} />
            <path d={`M ${x - 34} 830 L ${x + 34} 830`} />
            <path d={`M ${x - 22} 950 L ${x + 22} 950 M ${x - 14} 1030 L ${x + 14} 1030 M ${x - 8} 1100 L ${x + 8} 1100`} />
            <path d={`M ${x - 44} 890 Q ${x} 930 ${x + 44} 890`} />
          </g>
        ))}
        <path d="M 92 880 Q 300 1010 540 930 T 988 880" stroke={RED} strokeWidth={1.6} fill="none" opacity={0.35 * sweep} />
      </svg>

      <Gauge cx={540} cy={900} r={250} value={value} max={20} color={RED} thickness={22} start={160} end={20} opacity={enter} />

      <div style={{ position: "absolute", left: 0, top: 760, width: 1080, textAlign: "center", opacity: enter }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 150, fontWeight: 700, color: INK, letterSpacing: -4, lineHeight: 1 }}>
          {value.toFixed(0)}<span style={{ fontSize: 64, color: RED }}>%</span>
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 19, letterSpacing: 3, color: FAINT, marginTop: 4 }}>
          2030 年 · 占美国用电量
        </div>
      </div>

      <Card x={540} y={1210} w={700} h={112} opacity={note} scale={0.98} accent={BLUE}>
        <div style={{ position: "absolute", left: 24, top: 16, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 3, color: FAINT }}>
          U.S. DATA CENTER LOAD
        </div>
        <div style={{ position: "absolute", left: 24, top: 44, fontFamily: SERIF_STACK, fontSize: 32, color: INK }}>
          最高 17% · 2035 年可达 20%
        </div>
        <div style={{ position: "absolute", right: 22, top: 26, fontFamily: MONO_STACK, fontSize: 14, color: BLUE, textAlign: "right", lineHeight: 1.5 }}>
          SOURCE<br />EPRI
        </div>
      </Card>

      <div style={{ position: "absolute", left: 108, top: 1300, opacity: clamp01(note), fontFamily: SERIF_STACK, fontSize: 26, color: INK_SOFT }}>
        电网扩容的钱，最后会出现在谁家的账单上？
      </div>
    </AbsoluteFill>
  );
};

export default Scene05;
