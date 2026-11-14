// Scene02 · 是什么：21 个经济体围一张圆桌，协商一致
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, Stamp, exitFade, mk, seg, easeOut, pop, clamp01,
  INK, INK_SOFT, OCEAN, CORAL, GOLD, CREAM, SERIF, SANS, MONO,
} from "./ui";

const C = { x: 540, y: 858 };
const RX = 320;
const RY = 214;
const SEATS = Array.from({ length: 21 }, (_, i) => {
  const angle = -Math.PI / 2 + (i / 21) * Math.PI * 2;
  const x = C.x + Math.cos(angle) * (RX + 58);
  const y = C.y + Math.sin(angle) * (RY + 58);
  return { x, y, deg: (angle * 180) / Math.PI + 90, delay: 0.02 + i * 0.012 };
});

const Scene02: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = mk(marks, 1, 0.4);
  const m2 = mk(marks, 2, 0.68);
  const ex = exitFade(p);
  const tableT = easeOut(seg(p, 0, 0.14));
  const ringT = easeOut(seg(p, 0.04, 0.24));
  const centerT = pop(seg(p, 0.12, 0.3));
  const consensusT = seg(p, m2 + 0.05, m2 + 0.25);
  const spin = p * 1.6;

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: SANS }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ position: "absolute", inset: 0, opacity: ex, transform: `scale(${1 - 0.02 * (1 - ex)})` }}>
        <Cap text="ONE TABLE / 21 ECONOMIES" x={96} y={306} mono opacity={seg(p, 0.02, 0.1)} accent={accent} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 344,
            fontFamily: SERIF,
            fontSize: 46,
            color: INK,
            letterSpacing: 3,
            opacity: seg(p, 0.05, 0.16),
          }}
        >
          没有投票箱，只有一张桌
        </div>

        {/* 外层同心圆 */}
        {[0, 1, 2].map((i) => {
          const t = easeOut(seg(p, 0.06 + i * 0.06, 0.28 + i * 0.06));
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: C.x - (RX + 118 + i * 38),
                top: C.y - (RY + 118 + i * 38),
                width: (RX + 118 + i * 38) * 2,
                height: (RY + 118 + i * 38) * 2,
                borderRadius: "50%",
                border: `1px ${i === 1 ? "dashed" : "solid"} ${i === 0 ? OCEAN : INK}`,
                opacity: (i === 0 ? 0.22 : 0.1) * t,
                transform: `scale(${0.94 + 0.06 * t}) rotate(${(i % 2 ? -1 : 1) * spin * (1 + i) * 0.6}deg)`,
              }}
            />
          );
        })}

        {/* 桌面：椭圆 + 编织放射线 */}
        <div
          style={{
            position: "absolute",
            left: C.x - RX,
            top: C.y - RY,
            width: RX * 2,
            height: RY * 2,
            borderRadius: "50%",
            background: `radial-gradient(ellipse at 38% 28%, ${CREAM} 0%, ${c1} 58%, ${c2} 100%)`,
            border: `2px solid ${INK}55`,
            boxShadow: `0 28px 60px rgba(64,43,25,0.14), inset 0 0 0 10px ${CREAM}66`,
            transform: `scale(${0.9 + 0.1 * tableT})`,
            opacity: 0.5 + 0.5 * tableT,
          }}
        >
          {Array.from({ length: 36 }, (_, i) => {
            const a = (i / 36) * Math.PI * 2;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: RX,
                  top: RY,
                  width: RX * 0.92,
                  height: 1,
                  background: i % 3 === 0 ? OCEAN : INK,
                  opacity: i % 3 === 0 ? 0.16 : 0.07,
                  transformOrigin: "0 50%",
                  transform: `rotate(${(a * 180) / Math.PI}deg)`,
                }}
              />
            );
          })}
          <div
            style={{
              position: "absolute",
              left: RX - 178,
              top: RY - 58,
              width: 356,
              textAlign: "center",
              transform: `scale(${0.86 + 0.14 * centerT})`,
              opacity: centerT,
            }}
          >
            <div style={{ fontFamily: SERIF, fontSize: 82, fontWeight: 700, letterSpacing: 12, color: INK, lineHeight: 1 }}>APEC</div>
            <div style={{ fontFamily: MONO, fontSize: 17, color: INK_SOFT, letterSpacing: 5, marginTop: 12 }}>21 ECONOMIES</div>
            <div style={{ width: 96, height: 2, background: CORAL, margin: "16px auto 0" }} />
          </div>
        </div>

        {/* 21 把椅子 */}
        {SEATS.map((s, i) => {
          const t = pop(seg(p, s.delay, s.delay + 0.2));
          const isChina = i === 16;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: s.x - 24,
                top: s.y - 9,
                width: 48,
                height: 18,
                borderRadius: 6,
                background: isChina ? CORAL : i % 5 === 0 ? GOLD : OCEAN,
                opacity: 0.76 * clamp01(t),
                transform: `translate(-50%, -50%) rotate(${s.deg}deg) scale(${t})`,
                boxShadow: `0 3px 8px ${INK}14`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 17,
                  top: 3,
                  width: 14,
                  height: 12,
                  borderRadius: "3px 3px 2px 2px",
                  background: CREAM,
                  opacity: 0.55,
                }}
              />
            </div>
          );
        })}

        {/* 席位序号 */}
        {SEATS.map((s, i) => {
          const t = seg(p, 0.35 + i * 0.008, 0.48 + i * 0.008);
          return (
            <div
              key={`n${i}`}
              style={{
                position: "absolute",
                left: s.x + Math.cos((s.deg * Math.PI) / 180) * 38 - 8,
                top: s.y + Math.sin((s.deg * Math.PI) / 180) * 38 - 9,
                fontFamily: MONO,
                fontSize: 12,
                color: i === 16 ? CORAL : INK_SOFT,
                opacity: 0.8 * t,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
          );
        })}

        <Hair x={96} y={1164} w={888} progress={seg(p, 0.45, 0.7)} color={INK} opacity={0.14} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 1184,
            fontFamily: SANS,
            fontSize: 19,
            color: INK_SOFT,
            letterSpacing: 2,
            opacity: seg(p, 0.5, 0.7),
          }}
        >
          自主自愿 · 协商一致 · 成果文件不具法律约束力
        </div>

        <Stamp text="共识" x={852} y={1112} size={40} rotate={-7} t={consensusT} color={CORAL} />
        <div
          style={{
            position: "absolute",
            right: 96,
            top: 334,
            fontFamily: MONO,
            fontSize: 15,
            lineHeight: 1.8,
            color: INK_SOFT,
            letterSpacing: 2,
            textAlign: "right",
            opacity: seg(p, 0.1, 0.3),
          }}
        >
          NOT A TREATY
          <br />
          A FORUM
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene02;
