// Scene03 · 起点：1989 堪培拉，12 个创始成员的第一张长桌
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, BigSerif, exitFade, seg, easeOut, pop, clamp01,
  INK, INK_SOFT, OCEAN, CORAL, GOLD, CREAM, SERIF, SANS, MONO,
} from "./ui";

const TABLE = { x: 540, y: 856, w: 690, h: 284, rot: -5 };
const SEATS = Array.from({ length: 12 }, (_, i) => {
  const side = i < 6 ? -1 : 1;
  const k = i % 6;
  const x = TABLE.x - 250 + k * 100;
  const y = TABLE.y + side * (TABLE.h / 2 + 66);
  return { x, y, side, k, i };
});

const Scene03: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = marks?.[1]?.start ?? 0.42;
  const ex = exitFade(p);
  const tableT = easeOut(seg(p, 0.02, 0.22));
  const chairT = (i: number) => pop(seg(p, 0.12 + i * 0.025, 0.28 + i * 0.025));
  const cardT = (i: number) => pop(seg(p, 0.34 + i * 0.022, 0.5 + i * 0.022));
  const numberT = easeOut(seg(p, m1 + 0.02, m1 + 0.24));
  const routeT = easeOut(seg(p, 0.5, 0.86));

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: SANS }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ position: "absolute", inset: 0, opacity: ex, transform: `scale(${1 - 0.02 * (1 - ex)})` }}>
        <BigSerif text="1989" x={86} y={420} size={152} color={INK} opacity={0.1 * tableT} />
        <Cap text="CANBERRA / 1989" x={96} y={306} mono opacity={seg(p, 0.02, 0.1)} accent={accent} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 344,
            fontFamily: SERIF,
            fontSize: 44,
            color: INK,
            letterSpacing: 3,
            opacity: seg(p, 0.05, 0.16),
          }}
        >
          第一张桌子，只有 12 把椅子
        </div>

        {/* 从桌面向外辐射的航线，暗示“亚太”地理 */}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.55 * routeT }}>
          {[
            { x: 120, y: 460, c: 250, d: 600 },
            { x: 950, y: 430, c: 800, d: 580 },
            { x: 130, y: 1230, c: 250, d: 1030 },
            { x: 960, y: 1240, c: 800, d: 1040 },
          ].map((r, i) => (
            <path
              key={i}
              d={`M ${r.x} ${r.y} Q ${r.c} ${r.d} ${TABLE.x + (i % 2 ? 250 : -250)} ${TABLE.y + (i < 2 ? -100 : 100)}`}
              fill="none"
              stroke={i === 1 ? CORAL : OCEAN}
              strokeWidth={i === 1 ? 1.5 : 1}
              opacity={i === 1 ? 0.34 : 0.18}
              strokeLinecap="round"
            />
          ))}
        </svg>

        {/* 长桌 + 纸面 + 12 个席位卡 */}
        <div
          style={{
            position: "absolute",
            left: TABLE.x - TABLE.w / 2,
            top: TABLE.y - TABLE.h / 2,
            width: TABLE.w,
            height: TABLE.h,
            transform: `rotate(${TABLE.rot}deg) scale(${0.86 + 0.14 * tableT})`,
            opacity: tableT,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 26,
              background: `linear-gradient(150deg, ${CREAM} 0%, ${c1} 70%, ${c2} 100%)`,
              border: `2px solid ${INK}66`,
              boxShadow: `0 26px 54px rgba(66,44,25,0.16), inset 0 0 0 10px ${CREAM}55`,
            }}
          />
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 28,
                top: 24 + i * 40,
                width: TABLE.w - 56,
                height: 1,
                background: i === 2 ? CORAL : INK,
                opacity: i === 2 ? 0.22 : 0.07,
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: TABLE.w / 2 - 94,
              top: TABLE.h / 2 - 34,
              width: 188,
              textAlign: "center",
              transform: "rotate(5deg)",
            }}
          >
            <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 4, color: INK_SOFT }}>ASIA-PACIFIC</div>
            <div style={{ fontFamily: SERIF, fontSize: 44, letterSpacing: 7, color: INK }}>圆桌</div>
            <div style={{ width: 70, height: 2, background: CORAL, margin: "10px auto 0" }} />
          </div>

          {/* 桌上的 12 张席位卡 */}
          {SEATS.map((s, i) => {
            const t = cardT(i);
            const top = s.side === -1 ? 20 : TABLE.h - 48;
            const left = 40 + s.k * 100;
            return (
              <div
                key={`card-${i}`}
                style={{
                  position: "absolute",
                  left,
                  top,
                  width: 62,
                  height: 30,
                  borderRadius: 4,
                  background: CREAM,
                  border: `1px solid ${INK}55`,
                  transform: `translateY(${s.side * (1 - t) * -12}px) scale(${t}) rotate(${i % 2 ? 1.5 : -1.5}deg)`,
                  opacity: clamp01(t),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: MONO,
                  fontSize: 13,
                  color: i < 3 ? CORAL : INK_SOFT,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
            );
          })}
        </div>

        {/* 椅子 */}
        {SEATS.map((s, i) => {
          const t = chairT(i);
          return (
            <div
              key={`chair-${i}`}
              style={{
                position: "absolute",
                left: s.x - 22,
                top: s.y - 14,
                width: 44,
                height: 28,
                borderRadius: 9,
                background: i < 3 ? GOLD : OCEAN,
                opacity: 0.7 * clamp01(t),
                transform: `translateY(${s.side * (1 - t) * 22}px) scale(${t})`,
                boxShadow: `0 4px 10px ${INK}18`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 17,
                  top: 5,
                  width: 10,
                  height: 16,
                  borderRadius: 3,
                  background: CREAM,
                  opacity: 0.48,
                }}
              />
            </div>
          );
        })}

        {/* 12 个成员的数字强调 */}
        <div
          style={{
            position: "absolute",
            right: 92,
            top: 402,
            textAlign: "right",
            opacity: numberT,
            transform: `translateY(${(1 - numberT) * 18}px)`,
          }}
        >
          <div style={{ fontFamily: SERIF, fontSize: 112, fontWeight: 700, color: CORAL, lineHeight: 0.9 }}>12</div>
          <div style={{ fontFamily: SANS, fontSize: 18, color: INK_SOFT, letterSpacing: 2, marginTop: 6 }}>个创始成员</div>
        </div>

        <Hair x={96} y={1166} w={888} progress={seg(p, 0.45, 0.72)} color={INK} opacity={0.15} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 1188,
            fontFamily: SANS,
            fontSize: 19,
            color: INK_SOFT,
            letterSpacing: 2,
            opacity: seg(p, 0.52, 0.72),
          }}
        >
          澳大利亚 · 美国 · 日本 · 韩国 · 新西兰 · 加拿大 · 东盟六国
        </div>
        <div
          style={{
            position: "absolute",
            right: 96,
            bottom: 236,
            fontFamily: MONO,
            fontSize: 13,
            letterSpacing: 3,
            color: INK_SOFT,
            opacity: seg(p, 0.62, 0.8),
          }}
        >
          FIRST MINISTERIAL MEETING
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene03;
