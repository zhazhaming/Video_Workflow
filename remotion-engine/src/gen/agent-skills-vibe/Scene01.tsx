// Scene01 · 25 份文档 → 11 万颗星：文档堆弹入，星数滚爆
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { rand, MONO_STACK, FONT_STACK } from "../../dv/atmosphere";
import { Paper, Cap, Hair, INK, INK_SOFT, FAINT, RED, GOLD, SERIF_STACK, seg, eo, eoq, pop, clamp01 } from "../autoloop-2026/ui";

const ACCENT = "#C8452D";
const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const Scene01: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const docs = React.useMemo(
    () =>
      Array.from({ length: 25 }, (_, k) => ({
        rot: (rand(seed + k * 3) - 0.5) * 13,
        dx: (rand(seed + k * 5 + 1) - 0.5) * 76,
        dy: (rand(seed + k * 7 + 2) - 0.5) * 26,
      })),
    [seed],
  );
  const stars = React.useMemo(
    () =>
      Array.from({ length: 30 }, (_, k) => ({
        a: rand(seed + k * 13) * Math.PI * 2,
        r0: 20 + rand(seed + k * 17) * 40,
        r1: 120 + rand(seed + k * 23) * 230,
        s: 3 + rand(seed + k * 19) * 7,
        d: rand(seed + k * 29),
      })),
    [seed],
  );

  const count = Math.round(110000 * eoq(seg(p, 0.16, 0.72)));
  const burst = seg(p, 0.74, 0.94);
  const shake = Math.sin(p * 90) * 2.2 * seg(p, 0.5, 0.7) * (1 - burst);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={ACCENT} />
      <Cap text="01 / 25 DOCS" x={150} y={392} />
      <Cap text="GITHUB · 2026.11" x={930} y={392} align="right" color={FAINT} />
      <Hair x={150} y={430} w={240} color={ACCENT} thickness={2} progress={eo(seg(p, 0.05, 0.35))} opacity={0.75} />

      {/* 文档堆 */}
      <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(${shake}px, 0)` }}>
        {docs.map((d, k) => {
          const t = pop(seg(p, 0.02 + k * 0.011, 0.1 + k * 0.011));
          const lift = 1 - k * 0.004;
          return (
            <div
              key={k}
              style={{
                position: "absolute",
                left: 320 + d.dx,
                top: 980 - k * 10 + d.dy,
                width: 214,
                height: 268,
                transform: `translate(-50%,-50%) rotate(${d.rot}deg) scale(${(0.62 + 0.38 * t) * lift})`,
                opacity: t,
                background: "rgba(253,250,244,0.97)",
                border: `1px solid ${INK}22`,
                borderRadius: 5,
                boxShadow: `0 12px 26px ${INK}16, inset 0 0 0 1px rgba(255,255,255,0.6)`,
              }}
            >
              <div style={{ position: "absolute", left: 22, top: 30, width: 128, height: 9, background: INK, opacity: 0.2 }} />
              <div style={{ position: "absolute", left: 22, top: 56, width: 164, height: 4, background: INK, opacity: 0.11 }} />
              <div style={{ position: "absolute", left: 22, top: 74, width: 146, height: 4, background: INK, opacity: 0.11 }} />
              <div style={{ position: "absolute", left: 22, top: 112, width: 70, height: 34, border: `1.5px solid ${ACCENT}66`, borderRadius: 3 }} />
              <div style={{ position: "absolute", left: 24, bottom: 16, fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 2, color: FAINT }}>
                SKILL {String(k + 1).padStart(2, "0")}
              </div>
              <div style={{ position: "absolute", right: 0, top: 0, width: 0, height: 0, borderTop: `22px solid ${INK}12`, borderLeft: "22px solid transparent" }} />
            </div>
          );
        })}
      </div>

      {/* 星数 */}
      <div style={{ position: "absolute", left: 560, top: 700, width: 390, textAlign: "center", opacity: eo(seg(p, 0.14, 0.3)) }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 18, letterSpacing: 6, color: FAINT }}>GITHUB STARS</div>
        <div
          style={{
            marginTop: 14,
            fontFamily: SERIF_STACK,
            fontSize: 116,
            fontWeight: 700,
            lineHeight: 1,
            color: INK,
            letterSpacing: -3,
            fontVariantNumeric: "tabular-nums",
            transform: `scale(${1 + 0.04 * eo(seg(p, 0.7, 0.8))})`,
          }}
        >
          {fmt(count)}
        </div>
        <div style={{ marginTop: 22, display: "flex", justifyContent: "center", gap: 14 }}>
          <div style={{ padding: "8px 18px", border: `1.5px solid ${ACCENT}`, color: ACCENT, fontFamily: MONO_STACK, fontSize: 17, letterSpacing: 3, borderRadius: 999 }}>
            25 FILES
          </div>
          <div style={{ padding: "8px 18px", background: `${INK}0D`, color: INK_SOFT, fontFamily: MONO_STACK, fontSize: 17, letterSpacing: 3, borderRadius: 999 }}>
            MIT
          </div>
        </div>
      </div>

      {/* 星爆 */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 1 - seg(p, 0.9, 1) }}>
        {stars.map((s, k) => {
          const t = clamp01(burst * 1.4 - s.d * 0.35);
          const r = s.r0 + (s.r1 - s.r0) * eo(t);
          const x = 755 + Math.cos(s.a) * r;
          const y = 830 + Math.sin(s.a) * r * 0.8;
          return <circle key={k} cx={x} cy={y} r={s.s * (1 - t * 0.4)} fill={k % 4 === 0 ? ACCENT : k % 3 === 0 ? GOLD : INK} opacity={0.85 * (1 - t * 0.3)} />;
        })}
      </svg>

      <div style={{ position: "absolute", left: 150, bottom: 470, fontFamily: FONT_STACK, fontSize: 24, color: INK_SOFT, opacity: eo(seg(p, 0.45, 0.65)) }}>
        25 份文档，凭什么 11 万星
      </div>
    </AbsoluteFill>
  );
};

export default Scene01;
