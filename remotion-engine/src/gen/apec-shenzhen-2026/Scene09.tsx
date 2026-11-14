// Scene09 · 2026 主题：建设亚太共同体，促进共同繁荣；开放、创新、合作
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, exitFade, mk, seg, easeOut, pop, clamp01,
  INK, INK_SOFT, OCEAN, CORAL, GOLD, CREAM, SERIF, SANS, MONO,
} from "./ui";

const C = { x: 540, y: 890 };
const R = 246;
const KEYS = [
  { text: "开放", angle: -150, color: CORAL },
  { text: "创新", angle: -30, color: OCEAN },
  { text: "合作", angle: 90, color: GOLD },
];

const Scene09: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = mk(marks, 1, 0.3);
  const m2 = mk(marks, 2, 0.62);
  const ex = exitFade(p);
  const ringT = easeOut(seg(p, 0.04, 0.36));
  const coreT = pop(seg(p, 0.24, 0.44));
  const keyT = (i: number) => pop(seg(p, m1 + 0.04 + i * 0.08, m1 + 0.18 + i * 0.08));
  const lineT = (i: number) => easeOut(seg(p, m1 + 0.02 + i * 0.08, m1 + 0.18 + i * 0.08));
  const titleT = seg(p, 0.05, 0.18);

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: SANS }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ position: "absolute", inset: 0, opacity: ex, transform: `scale(${1 - 0.015 * (1 - ex)})` }}>
        <Cap text="APEC CHINA 2026 / THEME" x={96} y={306} mono opacity={titleT} accent={accent} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 344,
            fontFamily: SERIF,
            fontSize: 42,
            color: INK,
            letterSpacing: 3,
            opacity: titleT,
          }}
        >
          建设亚太共同体，促进共同繁荣
        </div>

        {/* 背景 2026 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 410,
            width: 1080,
            textAlign: "center",
            fontFamily: SERIF,
            fontSize: 240,
            fontWeight: 700,
            letterSpacing: 8,
            color: INK,
            opacity: 0.045 * ringT,
          }}
        >
          2026
        </div>

        {/* 外圈 */}
        <div
          style={{
            position: "absolute",
            left: C.x - R,
            top: C.y - R,
            width: R * 2,
            height: R * 2,
            borderRadius: "50%",
            border: `1.5px solid ${OCEAN}`,
            opacity: 0.36 * ringT,
            transform: `scale(${0.88 + 0.12 * ringT}) rotate(${p * 8}deg)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: C.x - R + 30,
            top: C.y - R + 30,
            width: (R - 30) * 2,
            height: (R - 30) * 2,
            borderRadius: "50%",
            border: `1px dashed ${CORAL}`,
            opacity: 0.2 * ringT,
            transform: `rotate(${-p * 12}deg)`,
          }}
        />

        {/* 21 个成员点 */}
        {Array.from({ length: 21 }, (_, i) => {
          const a = (i / 21) * Math.PI * 2 - Math.PI / 2;
          const t = pop(seg(p, 0.08 + i * 0.018, 0.2 + i * 0.018));
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: C.x + Math.cos(a) * R - 5,
                top: C.y + Math.sin(a) * R - 5,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: i === 20 ? CORAL : i % 4 === 0 ? GOLD : OCEAN,
                opacity: 0.82 * clamp01(t),
                transform: `scale(${t})`,
              }}
            />
          );
        })}

        {/* 中心 */}
        <div
          style={{
            position: "absolute",
            left: C.x - 196,
            top: C.y - 120,
            width: 392,
            height: 240,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: coreT,
            transform: `scale(${0.88 + 0.12 * coreT})`,
          }}
        >
          <div style={{ fontFamily: SANS, fontSize: 20, color: INK_SOFT, letterSpacing: 10 }}>亚太</div>
          <div style={{ fontFamily: SERIF, fontSize: 78, fontWeight: 700, color: INK, letterSpacing: 8, lineHeight: 1.1, marginTop: 6 }}>共同体</div>
          <div style={{ width: 88, height: 3, background: CORAL, marginTop: 16 }} />
          <div style={{ fontFamily: MONO, fontSize: 13, color: INK_SOFT, letterSpacing: 3, marginTop: 12 }}>BUILDING A COMMUNITY</div>
        </div>

        {/* 三个关键词 + 引线 */}
        {KEYS.map((k, i) => {
          const a = (k.angle * Math.PI) / 180;
          const lx = C.x + Math.cos(a) * (R + 18);
          const ly = C.y + Math.sin(a) * (R + 18);
          const tx = C.x + Math.cos(a) * (R + 104);
          const ty = C.y + Math.sin(a) * (R + 104);
          const t = keyT(i);
          return (
            <React.Fragment key={k.text}>
              <div
                style={{
                  position: "absolute",
                  left: Math.min(lx, tx),
                  top: Math.min(ly, ty),
                  width: Math.max(1, Math.abs(tx - lx)),
                  height: 1,
                  background: k.color,
                  opacity: 0.35 * lineT(i),
                  transform: `rotate(${k.angle}deg)`,
                  transformOrigin: "0 50%",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: tx - 56,
                  top: ty - 34,
                  width: 112,
                  textAlign: "center",
                  opacity: clamp01(t),
                  transform: `scale(${0.82 + 0.18 * t})`,
                }}
              >
                <div style={{ fontFamily: SERIF, fontSize: 46, fontWeight: 700, color: k.color, letterSpacing: 4 }}>{k.text}</div>
                <div style={{ width: 28, height: 2, background: k.color, margin: "7px auto 0", opacity: 0.6 }} />
              </div>
            </React.Fragment>
          );
        })}

        <Hair x={96} y={1280} w={888} progress={seg(p, 0.56, 0.82)} color={INK} opacity={0.13} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 1302,
            fontFamily: SANS,
            fontSize: 18,
            color: INK_SOFT,
            letterSpacing: 2,
            opacity: seg(p, 0.62, 0.84),
          }}
        >
          开放、创新、合作，不是三句口号，是三把开门的钥匙
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene09;
