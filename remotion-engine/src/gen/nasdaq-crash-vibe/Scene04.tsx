// Scene04 · 知识点：-10% 回调 vs -20% 熊市（深度计）
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, Chip, exitStyle, mk,
  INK, INK_SOFT, INK_FAINT, RED, GOLD,
  seg, eo, ei, pop, clamp01,
} from "./ui";

const RX0 = 120; // 0%
const PX = 28; // px per 1%
const RY = 800; // 标尺 y

const Scene04: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.09);
  const m1 = mk(marks, 1, 0.46);
  const ballFall = ei(seg(p, m0 + 0.1, m0 + 0.34));
  const landT = pop(seg(p, m0 + 0.32, m0 + 0.44));
  const ballX = RX0 + 12 * PX;
  const ballY = 430 + ballFall * (RY - 24 - 430);
  const flag1T = pop(seg(p, m0, m0 + 0.12));
  const flag2T = pop(seg(p, m1 + 0.02, m1 + 0.16));
  const zone2Hot = 0.1 + 0.06 * eo(seg(p, m1, m1 + 0.14));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={exitStyle(p)}>
        <Cap text="知识点 · 回撤深度计" y={310} opacity={seg(p, 0.03, 0.12)} />
        {/* 区带 */}
        <div style={{ position: "absolute", left: RX0, top: RY - 56, width: 10 * PX, height: 56, background: INK, opacity: 0.045 }} />
        <div style={{ position: "absolute", left: RX0 + 10 * PX, top: RY - 56, width: 10 * PX, height: 56, background: GOLD, opacity: zone2Hot * 0.9 }} />
        <div style={{ position: "absolute", left: RX0 + 20 * PX, top: RY - 56, width: 10 * PX, height: 56, background: RED, opacity: zone2Hot }} />
        {/* 标尺与刻度 */}
        <Hair x={RX0} y={RY} w={30 * PX} thickness={3} opacity={0.5} progress={seg(p, 0.05, 0.2)} />
        {[0, 5, 10, 15, 20, 25, 30].map((v, i) => (
          <div key={v} style={{ opacity: seg(p, 0.06 + i * 0.015, 0.14 + i * 0.015) }}>
            <div
              style={{
                position: "absolute",
                left: RX0 + v * PX - 1,
                top: RY - 12,
                width: 2,
                height: 24,
                background: INK,
                opacity: 0.5,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: RX0 + v * PX - 26,
                top: RY + 22,
                width: 52,
                textAlign: "center",
                fontFamily: "inherit",
                fontSize: 26,
                color: INK_FAINT,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {v === 0 ? "0%" : `-${v}%`}
            </div>
          </div>
        ))}
        {/* 阈值旗 */}
        <div style={{ opacity: flag1T }}>
          <div style={{ position: "absolute", left: RX0 + 10 * PX, top: RY - 170, width: 3, height: 116, background: GOLD }} />
          <Chip text="回调 -10%" x={RX0 + 10 * PX - 88} y={RY - 216} t={flag1T} color={GOLD} bg="rgba(169,124,51,0.10)" size={28} />
        </div>
        <div style={{ opacity: flag2T }}>
          <div style={{ position: "absolute", left: RX0 + 20 * PX, top: RY - 230, width: 3, height: 176, background: RED }} />
          <Chip text="熊市 -20%" x={RX0 + 20 * PX - 88} y={RY - 276} t={flag2T} color={RED} bg="rgba(200,69,45,0.10)" size={28} />
        </div>
        {/* 小球：从上方跌落，停在 -12% */}
        <div
          style={{
            position: "absolute",
            left: ballX - 22,
            top: ballY - 22,
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: INK,
            transform: `scaleY(${1 - 0.18 * (1 - Math.abs(landT - 0.5) * 2) * (ballFall >= 1 ? 1 : 0)}) scaleX(${1 + 0.12 * (1 - Math.abs(landT - 0.5) * 2) * (ballFall >= 1 ? 1 : 0)})`,
          }}
        />
        {/* 当前位置标注 */}
        <div
          style={{
            position: "absolute",
            left: ballX - 3,
            top: RY + 64,
            opacity: landT,
          }}
        >
          <div style={{ position: "absolute", left: -2, top: 0, width: 4, height: 40, background: RED }} />
          <div
            style={{
              position: "absolute",
              left: -88,
              top: 48,
              fontSize: 40,
              fontWeight: 900,
              color: RED,
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            当前 -12%
          </div>
        </div>
        <Cap
          text="跌超 10% 叫回调 · 跌超 20% 才是熊市"
          y={1216}
          align="center"
          color={INK_SOFT}
          opacity={0.9 * seg(p, 0.72, 0.84)}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene04;
