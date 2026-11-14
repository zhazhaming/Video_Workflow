// Scene12 · APEC 离你远吗：集装箱船、通关便利、商务旅行卡
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, exitFade, mk, seg, easeOut, pop, clamp01, lerp,
  INK, INK_SOFT, OCEAN, CORAL, GOLD, CREAM, SERIF, SANS, MONO,
} from "./ui";

const CONTAINERS = [
  { x: 0, y: 0, color: CORAL },
  { x: 52, y: 0, color: OCEAN },
  { x: 104, y: 0, color: GOLD },
  { x: 0, y: -34, color: OCEAN },
  { x: 52, y: -34, color: CORAL },
  { x: 104, y: -34, color: OCEAN },
  { x: 0, y: -68, color: GOLD },
  { x: 52, y: -68, color: OCEAN },
];

const Scene12: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.02);
  const m1 = mk(marks, 1, 0.32);
  const m2 = mk(marks, 2, 0.64);
  const ex = exitFade(p);
  const seaT = easeOut(seg(p, 0.02, 0.2));
  const shipT = easeOut(seg(p, 0.1, 0.36));
  const shipX = lerp(110, 250, easeOut(seg(p, 0.15, 0.9)));
  const craneT = easeOut(seg(p, 0.2, 0.45));
  const cardT = pop(seg(p, m1 + 0.02, m1 + 0.24));
  const cardSlide = easeOut(seg(p, m1, m1 + 0.28));
  const goodsT = seg(p, m1 + 0.04, m1 + 0.26);

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: SANS }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ position: "absolute", inset: 0, opacity: ex, transform: `translateY(${(1 - ex) * 6}px)` }}>
        <Cap text="EVERYDAY / CONNECTIVITY" x={96} y={306} mono opacity={seg(p, 0.02, 0.1)} accent={accent} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 344,
            fontFamily: SERIF,
            fontSize: 43,
            color: INK,
            letterSpacing: 3,
            opacity: seg(p, 0.05, 0.16),
          }}
        >
          这张桌子，离你的包裹并不远
        </div>

        {/* 海面 */}
        <div style={{ position: "absolute", left: 0, top: 846, width: 1080, height: 470, opacity: seaT }}>
          <div style={{ position: "absolute", left: 96, top: 0, width: 888, height: 1.5, background: OCEAN, opacity: 0.35 }} />
          {Array.from({ length: 13 }, (_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 60 + (i % 4) * 46,
                top: 44 + i * 30,
                width: 820 - i * 24,
                height: 1,
                background: OCEAN,
                opacity: 0.09,
              }}
            />
          ))}
        </div>

        {/* 集装箱船 */}
        <div style={{ position: "absolute", left: shipX, top: 760, opacity: shipT, transform: `translateY(${Math.sin(p * Math.PI * 4) * 5}px) scale(1.28)`, transformOrigin: "0 0" }}>
          <div style={{ position: "absolute", left: 0, top: 84, width: 300, height: 10, background: INK, opacity: 0.28 }} />
          <div
            style={{
              position: "absolute",
              left: 16,
              top: 36,
              width: 262,
              height: 54,
              background: OCEAN,
              clipPath: "polygon(3% 0, 100% 0, 94% 100%, 0 100%)",
              opacity: 0.9,
            }}
          />
          <div style={{ position: "absolute", left: 252, top: -14, width: 34, height: 50, background: CREAM, border: `2px solid ${INK}`, opacity: 0.9 }} />
          <div style={{ position: "absolute", left: 262, top: -4, width: 6, height: 14, background: CORAL }} />
          {CONTAINERS.map((c, i) => {
            const t = pop(seg(p, 0.1 + i * 0.03, 0.26 + i * 0.03));
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 28 + c.x,
                  top: 36 + c.y - (1 - t) * 40,
                  width: 50,
                  height: 30,
                  background: c.color,
                  opacity: 0.8 * clamp01(t),
                  transform: `scale(${0.9 + 0.1 * t})`,
                  border: `1px solid ${INK}22`,
                }}
              >
                {Array.from({ length: 5 }, (_, k) => (
                  <div key={k} style={{ position: "absolute", left: 5 + k * 9, top: 5, width: 1, height: 20, background: CREAM, opacity: 0.3 }} />
                ))}
              </div>
            );
          })}
          <div style={{ position: "absolute", left: -18, top: 42, width: 20, height: 18, background: OCEAN, clipPath: "polygon(100% 0, 100% 100%, 0 70%)" }} />
        </div>

        {/* 岸桥 */}
        <div style={{ position: "absolute", right: 60, top: 588, width: 310, height: 420, opacity: 0.82 * craneT, transform: "scale(1.12)", transformOrigin: "100% 0" }}>
          <div style={{ position: "absolute", left: 24, top: 84, width: 8, height: 280, background: OCEAN, opacity: 0.55 }} />
          <div style={{ position: "absolute", left: 218, top: 84, width: 8, height: 280, background: OCEAN, opacity: 0.55 }} />
          <div style={{ position: "absolute", left: 6, top: 74, width: 250, height: 8, background: OCEAN, opacity: 0.65 }} />
          <div style={{ position: "absolute", left: 6, top: 36, width: 8, height: 46, background: OCEAN, opacity: 0.55 }} />
          <div style={{ position: "absolute", left: 0, top: 26, width: 250, height: 6, background: OCEAN, opacity: 0.6 }} />
          <div
            style={{
              position: "absolute",
              left: 30 + (0.5 + 0.5 * Math.sin(p * Math.PI * 3)) * 130,
              top: 84,
              width: 2,
              height: 190,
              background: CORAL,
              opacity: 0.55,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 22 + (0.5 + 0.5 * Math.sin(p * Math.PI * 3)) * 130,
              top: 268,
              width: 20,
              height: 12,
              border: `2px solid ${CORAL}`,
              opacity: 0.7,
            }}
          />
          <div style={{ position: "absolute", left: 0, top: 360, width: 270, height: 3, background: INK, opacity: 0.18 }} />
        </div>

        {/* 商务旅行卡 */}
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 438,
            width: 296,
            height: 184,
            borderRadius: 14,
            background: `linear-gradient(150deg, ${CREAM}, ${c1})`,
            border: `1.5px solid ${INK}55`,
            boxShadow: `0 18px 34px rgba(66,44,25,0.16)`,
            opacity: cardT,
            transform: `translateY(${(1 - cardSlide) * 26}px) rotate(${-3 + 2 * cardT}deg)`,
          }}
        >
          <div style={{ position: "absolute", left: 20, top: 18, fontFamily: MONO, fontSize: 11, letterSpacing: 2, color: INK_SOFT }}>APEC BUSINESS TRAVEL CARD</div>
          <div style={{ position: "absolute", left: 20, top: 48, width: 54, height: 54, borderRadius: "50%", border: `1.5px solid ${OCEAN}`, opacity: 0.55 }} />
          <div style={{ position: "absolute", left: 32, top: 60, width: 30, height: 30, borderRadius: "50%", border: `1px dashed ${OCEAN}`, opacity: 0.4 }} />
          <div style={{ position: "absolute", left: 92, top: 54, fontFamily: SERIF, fontSize: 24, color: INK, letterSpacing: 2 }}>商务旅行卡</div>
          <div style={{ position: "absolute", left: 92, top: 90, width: 150, height: 3, background: CORAL, opacity: 0.55 }} />
          <div style={{ position: "absolute", left: 92, top: 108, fontFamily: SANS, fontSize: 12, color: INK_SOFT, letterSpacing: 1 }}>多次入境 · 商务往来</div>
          <div style={{ position: "absolute", right: 16, bottom: 14, fontFamily: SERIF, fontSize: 34, color: CORAL, opacity: 0.7 }}>21</div>
        </div>

        {/* 三个小标签 */}
        {[
          { text: "更快通关", x: 96, y: 1042 },
          { text: "更顺物流", x: 96, y: 1090 },
          { text: "更省时间", x: 96, y: 1138 },
        ].map((it, i) => (
          <div
            key={it.text}
            style={{
              position: "absolute",
              left: it.x,
              top: it.y,
              display: "flex",
              alignItems: "center",
              gap: 12,
              opacity: seg(p, 0.12 + i * 0.05, 0.28 + i * 0.05),
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: i === 0 ? CORAL : OCEAN }} />
            <span style={{ fontFamily: SANS, fontSize: 20, color: INK, letterSpacing: 2 }}>{it.text}</span>
          </div>
        ))}

        <Hair x={96} y={1226} w={888} progress={seg(p, 0.6, 0.84)} color={INK} opacity={0.13} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 1248,
            fontFamily: SANS,
            fontSize: 18,
            color: INK_SOFT,
            letterSpacing: 2,
            opacity: seg(p, 0.66, 0.86),
          }}
        >
          它不只是在会场里握手，也在码头、海关和你的快递单上
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene12;
