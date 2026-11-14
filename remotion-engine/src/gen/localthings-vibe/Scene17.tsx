// Scene17 · 方案揭晓：云端托着「指挥权」徽章沿弧线搬进家门，门口爆光+冲击环，云变虚（爆点镜）
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, mixHex, rand } from "../../dv/atmosphere";
import { INK, LINE, PAPER, SHADOW, clamp01, easeBack, easeOut, exitFade } from "./ui";

const bez = (a: number, c: number, b: number, t: number) =>
  (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;

const Scene17: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const sparkles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, k) => ({
        x: 80 + rand(seed + k * 3 + 40) * 920,
        y0: 300 + rand(seed + k * 3 + 41) * 1200,
        r: 2.5 + rand(seed + k * 3 + 42) * 4.5,
        tw: rand(seed + k * 3 + 43) * Math.PI * 2,
        star: rand(seed + k * 3 + 45) > 0.5,
      })),
    [seed],
  );
  const houseIn = easeBack(clamp01(p / 0.14));
  // 徽章搬家：0.12~0.5 从云(830,430)飞到房门(540,980)
  const fly = easeOut(clamp01((p - 0.12) / 0.38));
  const bx = bez(830, 760, 540, fly);
  const by = bez(430, 640, 960, fly);
  const land = easeBack(clamp01((p - 0.5) / 0.2)); // 落地冲击
  const cloudFade = 1 - clamp01((p - 0.5) / 0.3); // 云交出后变虚
  const winOn = (i: number) => easeOut(clamp01((p - 0.52 - i * 0.08) / 0.2));

  return (
    <AbsoluteFill style={{ background: `linear-gradient(158deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: exitFade(p) }}>
        {sparkles.map((s, k) => (
          <div
            key={k}
            style={{
              position: "absolute", left: s.x, top: s.y0,
              width: s.r * 2, height: s.r * 2,
              background: k % 3 === 0 ? accent : mixHex(INK, c1, 0.7),
              opacity: 0.25 + 0.3 * Math.sin(p * Math.PI * 2 + s.tw),
              borderRadius: s.star ? 0 : "50%",
              clipPath: s.star
                ? "polygon(50% 0, 63% 36%, 100% 38%, 71% 60%, 82% 100%, 50% 76%, 18% 100%, 29% 60%, 0 38%, 37% 36%)"
                : undefined,
              transform: `rotate(${p * 60 + k * 20}deg)`,
            }}
          />
        ))}

        {/* 云（右上，交出指挥权后变虚下沉） */}
        <div
          style={{
            position: "absolute", left: 680, top: 330,
            opacity: 0.4 + 0.6 * cloudFade,
            transform: `translateY(${(1 - cloudFade) * 30}px) scale(${0.9 + cloudFade * 0.1})`,
          }}
        >
          {[
            { x: 0, y: 50, s: 92 },
            { x: 66, y: 18, s: 116 },
            { x: 158, y: 32, s: 98 },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                position: "absolute", left: c.x, top: c.y, width: c.s, height: c.s,
                borderRadius: "50%", background: mixHex(INK, c1, 0.3),
                border: cloudFade < 0.5 ? `2px dashed ${LINE}` : undefined, boxSizing: "border-box",
              }}
            />
          ))}
        </div>

        {/* 中央房子 */}
        <div
          style={{
            position: "absolute", left: 540 - 240, top: 640 + (1 - houseIn) * 90,
            opacity: clamp01(houseIn * 1.4),
            transform: `scale(${0.85 + houseIn * 0.15})`,
          }}
        >
          {/* 屋顶 */}
          <div
            style={{
              position: "absolute", left: 0, top: 0, width: 480, height: 150,
              background: PAPER, border: `4px solid ${INK}`,
              clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
              borderRadius: 18, boxShadow: SHADOW, boxSizing: "border-box",
            }}
          />
          {/* 房身 */}
          <div
            style={{
              position: "absolute", left: 40, top: 150, width: 400, height: 300,
              background: PAPER, border: `4px solid ${INK}`, borderRadius: "0 0 22px 22px",
              boxShadow: SHADOW, boxSizing: "border-box", overflow: "hidden",
            }}
          >
            {/* 门内亮光：开门后门框内透出暖光（徽章到家） */}
            <div
              style={{
                position: "absolute", left: 178, top: 210, width: 56, height: 90,
                background: "#FFE9A8", opacity: land * 0.95,
                transformOrigin: "left center",
                transform: `scaleX(${0.4 + land * 0.6})`,
              }}
            />
          </div>
          {/* 窗灯依次全亮 */}
          {[
            { x: 96, y: 34, top: true },
            { x: 322, y: 34, top: true },
            { x: 76, y: 190, top: false },
            { x: 316, y: 190, top: false },
          ].map((w, i) => (
            <div
              key={i}
              style={{
                position: "absolute", left: w.x, top: (w.top ? 0 : 150) + w.y + 8,
                width: w.top ? 62 : 88, height: w.top ? 62 : 92,
                borderRadius: 10, background: accent,
                opacity: 0.18 + 0.72 * winOn(i),
                border: `3px solid ${INK}`, boxSizing: "border-box",
              }}
            />
          ))}
          {/* 门（到家后向内打开） */}
          <div
            style={{
              position: "absolute", left: 216, top: 344, width: 64, height: 106,
              background: mixHex(accent, INK, 0.25), borderRadius: "12px 12px 0 0",
              border: `3px solid ${INK}`, boxSizing: "border-box",
              transformOrigin: "right center",
              transform: `scaleX(${1 - land * 0.75})`,
            }}
          />
        </div>

        {/* 指挥权徽章：云 → 门 */}
        <div
          style={{
            position: "absolute", left: bx - 52, top: by - 52,
            transform: `rotate(${fly * 300}deg)`,
            opacity: clamp01(fly * 3) * (fly >= 1 ? 0 : 1),
          }}
        >
          <div
            style={{
              width: 104, height: 104, borderRadius: "50%", background: accent,
              border: `5px solid ${PAPER}`, boxShadow: SHADOW, boxSizing: "border-box",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 54, height: 44, background: PAPER,
                clipPath: "polygon(50% 0, 100% 40%, 100% 100%, 0 100%, 0 40%)",
              }}
            />
          </div>
          {/* 拖尾 */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute", left: 44 - i * 12, top: 44 - i * 8,
                width: 16, height: 16, borderRadius: "50%", background: accent,
                opacity: 0.4 - i * 0.1,
              }}
            />
          ))}
        </div>
        {/* 落地冲击环（围绕门口，小范围） + 星屑 */}
        {[0, 1].map((i) => {
          const q = clamp01((p - 0.5 - i * 0.12) / 0.4);
          if (q <= 0 || q >= 1) return null;
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: 540 - 70 - q * 90, top: 1040 - q * 90,
                width: 140 + q * 180, height: 140 + q * 180, borderRadius: "50%",
                border: `4px solid ${accent}`, opacity: 0.4 * (1 - q),
              }}
            />
          );
        })}
        {p > 0.5 &&
          [0, 1, 2, 3, 4, 5].map((i) => {
            const q = clamp01((p - 0.5 - i * 0.03) / 0.3);
            const ang = (i / 6) * Math.PI * 2;
            return (
              <span
                key={i}
                style={{
                  position: "absolute",
                  left: 540 + Math.cos(ang) * q * 170 - 9,
                  top: 1050 + Math.sin(ang) * q * 130 - 9,
                  width: 18, height: 18, borderRadius: "50%",
                  background: i % 2 ? accent : mixHex(accent, PAPER, 0.4),
                  opacity: 1 - q,
                }}
              />
            );
          })}
        {/* 底部三件套点头认可（字幕带上方） */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute", left: 300 + i * 170, top: 1180 - Math.sin(p * Math.PI * 2 * 1.3 + i) * 8,
              width: 74, height: 74, borderRadius: 16, background: PAPER,
              border: `3px solid ${INK}`, boxShadow: SHADOW,
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: easeOut(clamp01((p - 0.3 - i * 0.08) / 0.25)),
            }}
          >
            <div
              style={{
                width: 34, height: 34, borderRadius: i === 1 ? "50%" : 8,
                background: accent, opacity: 0.6 + 0.4 * Math.sin(p * Math.PI * 2 + i * 1.5),
              }}
            />
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default Scene17;
