// Scene08 · 躺在功劳簿上（翻开的功劳簿 + Zzz 上浮 + 十年时钟 + 尘光）
// 混动=祖传绝活：封面挂「祖传绝活」锦旗；一睡十年：右上时钟慢扫。
// 动画只由 p 驱动，只用 transform / opacity。
import React from "react";
import type { GenSceneProps } from "../types";
import { rand } from "../../dv/atmosphere";
import { Paper, Cap, Hair, INK, INK_SOFT, INK_FAINT, RED, GOLD, SERIF_STACK, MONO_STACK, MARGIN, seg, eo, pop, clamp01, lerp } from "./ui";

const BX = 540; // 书中心
const BY = 880;

const Scene08: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const main = accent || RED;
  const mm = (i: number, fb: number) => marks?.[i]?.start ?? fb;
  const ex = seg(p, 0.88, 1);
  const t1 = mm(1, 0.5); // 「一睡就是十年」→ Zzz 与时钟

  const bookT = eo(seg(p, 0.03, 0.16));
  const flagT = pop(seg(p, 0.14, 0.26));
  const zT = clamp01(seg(p, t1, t1 + 0.1));
  const clockT = eo(seg(p, t1 + 0.05, t1 + 0.2));

  // Zzz 三连
  const zs = [
    { x: BX + 150, y: BY - 240, size: 64, d: 0 },
    { x: BX + 230, y: BY - 330, size: 48, d: 0.12 },
    { x: BX + 295, y: BY - 405, size: 36, d: 0.24 },
  ];

  // 尘光
  const motes = React.useMemo(
    () =>
      Array.from({ length: 12 }, (_, k) => ({
        x: 110 + rand(k * 9 + 51) * 860,
        y0: 380 + rand(k * 9 + 52) * 860,
        r: 2 + rand(k * 9 + 53) * 3.5,
        sp: 0.4 + rand(k * 9 + 54) * 0.7,
        ph: rand(k * 9 + 55) * Math.PI * 2,
      })),
    [],
  );

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} />

      <Cap text="电动化慢半拍" x={MARGIN} y={360} size={26} color={INK_SOFT} accent={main} />

      {/* 功劳簿（翻开的书） */}
      <div style={{ position: "absolute", left: BX, top: BY, opacity: bookT * (1 - ex), transform: `translate(-50%, -50%) rotate(${Math.sin(p * Math.PI * 2 * 0.5) * 1.2}deg)` }}>
        {/* 书影 */}
        <div style={{ position: "absolute", left: -250, top: -60, width: 500, height: 260, borderRadius: 18, background: `${INK}14`, transform: "translate(10px, 22px)" }} />
        {/* 左页 */}
        <div
          style={{
            position: "absolute",
            left: -252,
            top: -140,
            width: 252,
            height: 280,
            borderRadius: "16px 0 0 16px",
            background: "#F8F1E0",
            border: `2px solid ${INK}30`,
            transform: `perspective(900px) rotateY(${6 * bookT}deg)`,
            transformOrigin: "right center",
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <Hair key={i} x={28} y={44 + i * 52} w={196} color={INK_FAINT} thickness={2} opacity={0.35} progress={clamp01(bookT * 2 - i * 0.15)} />
          ))}
        </div>
        {/* 右页（封面） */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: -140,
            width: 252,
            height: 280,
            borderRadius: "0 16px 16px 0",
            background: "#F3E9D2",
            border: `2px solid ${INK}30`,
            transform: `perspective(900px) rotateY(${-6 * bookT}deg)`,
            transformOrigin: "left center",
          }}
        >
          <div style={{ position: "absolute", left: 0, right: 0, top: 42, textAlign: "center", fontFamily: SERIF_STACK, fontSize: 40, fontWeight: 700, letterSpacing: 8, color: INK }}>
            混动
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 100, textAlign: "center", fontFamily: SERIF_STACK, fontSize: 23, letterSpacing: 2, color: INK_SOFT, whiteSpace: "nowrap" }}>
            油耗低 · 皮带顺滑
          </div>
          <Hair x={40} y={160} w={172} color={GOLD} thickness={2} opacity={0.5} progress={bookT} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 196, textAlign: "center", fontFamily: SERIF_STACK, fontSize: 22, letterSpacing: 4, color: INK_FAINT }}>
            1997 年以来打磨
          </div>
        </div>
        {/* 书脊 */}
        <div style={{ position: "absolute", left: -3, top: -140, width: 6, height: 280, background: INK_SOFT, opacity: 0.55 }} />
        {/* 锦旗章「祖传绝活」 */}
        <div
          style={{
            position: "absolute",
            left: -120,
            top: -230,
            padding: "14px 26px",
            background: main,
            color: "#FBF6EC",
            fontFamily: SERIF_STACK,
            fontSize: 38,
            fontWeight: 700,
            letterSpacing: 8,
            whiteSpace: "nowrap",
            borderRadius: 10,
            opacity: clamp01(flagT * 1.4) * (1 - ex),
            transform: `rotate(-7deg) scale(${0.6 + 0.4 * flagT})`,
            boxShadow: `0 12px 26px ${main}44`,
          }}
        >
          祖传绝活
        </div>
        {/* 旗绳 */}
        <div style={{ position: "absolute", left: -61, top: -262, width: 2, height: 34, background: GOLD, opacity: 0.6 * flagT }} />
        <div style={{ position: "absolute", left: 59, top: -262, width: 2, height: 34, background: GOLD, opacity: 0.6 * flagT }} />
      </div>

      {/* Zzz 上浮 */}
      {zs.map((z, i) => {
        const t = seg(p, t1 + 0.06 + z.d, t1 + 0.42 + z.d);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: z.x + Math.sin(p * Math.PI * 2 * 0.9 + i) * 10,
              top: z.y - t * 60,
              fontFamily: SERIF_STACK,
              fontSize: z.size,
              fontWeight: 700,
              color: INK_SOFT,
              opacity: Math.sin(t * Math.PI) * zT * (1 - ex),
            }}
          >
            Z
          </div>
        );
      })}

      {/* 十年时钟 */}
      <div style={{ position: "absolute", left: 790, top: 470, opacity: clockT * (1 - ex) }}>
        <div style={{ position: "absolute", left: -74, top: -74, width: 148, height: 148, borderRadius: "50%", border: `4px solid ${INK_SOFT}55`, background: "#FBF6EC" }} />
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: -1.5,
              top: -66,
              width: 3,
              height: 12,
              background: INK_FAINT,
              transform: `rotate(${i * 90}deg)`,
              transformOrigin: "1.5px 66px",
            }}
          />
        ))}
        {/* 时针：慢扫一圈半（十年） */}
        <div
          style={{
            position: "absolute",
            left: -2.5,
            top: -52,
            width: 5,
            height: 52,
            borderRadius: 3,
            background: main,
            transform: `rotate(${clockT * 540}deg)`,
            transformOrigin: "2.5px 52px",
          }}
        />
        <div style={{ position: "absolute", left: -7, top: -7, width: 14, height: 14, borderRadius: "50%", background: INK }} />
        <div style={{ position: "absolute", left: -58, top: 92, fontFamily: MONO_STACK, fontSize: 22, letterSpacing: 4, color: INK_FAINT, whiteSpace: "nowrap" }}>10 年</div>
      </div>

      {/* 尘光 */}
      {motes.map((m, k) => {
        const drift = Math.sin(p * Math.PI * 2 * m.sp + m.ph);
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: m.x + drift * 18,
              top: m.y0 + drift * 10,
              width: m.r * 2,
              height: m.r * 2,
              borderRadius: "50%",
              background: GOLD,
              opacity: 0.18 * (1 - ex),
            }}
          />
        );
      })}
    </div>
  );
};

export default Scene08;
