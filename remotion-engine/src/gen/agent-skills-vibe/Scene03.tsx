// Scene03 · AI 抄近路：光标跳过需求/测试/安全，三张卡被盖 SKIP，质量条见底
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { MONO_STACK, FONT_STACK } from "../../dv/atmosphere";
import { Paper, Cap, Hair, Card, Stamp, INK, INK_SOFT, FAINT, RED, GOLD, SERIF_STACK, seg, eo, eio, pop, lerp, clamp01 } from "../autoloop-2026/ui";

const ACCENT = "#C8452D";

const CARDS = [
  { x: 250, zh: "写需求", en: "SPEC" },
  { x: 540, zh: "跑测试", en: "TEST" },
  { x: 830, zh: "查安全", en: "SECURITY" },
];

const Scene03: React.FC<GenSceneProps> = ({ p, c1, c2 }) => {
  const jumps = [seg(p, 0.06, 0.3), seg(p, 0.32, 0.56), seg(p, 0.58, 0.82)];
  const active = jumps[0] < 1 ? 0 : jumps[1] < 1 ? 1 : 2;
  const cx = lerp(980, CARDS[Math.min(active, 2)].x, eio(jumps[Math.min(active, 2)]));
  const cy = 900 - Math.sin(jumps[Math.min(active, 2)] * Math.PI) * 90;
  const quality = 1 - 0.92 * eo(seg(p, 0.12, 0.86));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={ACCENT} />
      <Cap text="03 / SHORTCUT" x={150} y={392} />
      <Cap text="AI'S DEFAULT" x={930} y={392} align="right" color={FAINT} />
      <Hair x={150} y={430} w={240} color={ACCENT} thickness={2} progress={eo(seg(p, 0.04, 0.3))} opacity={0.75} />

      {CARDS.map((c, i) => {
        const stamp = seg(p, 0.26 + i * 0.26, 0.34 + i * 0.26);
        const dead = seg(p, 0.3 + i * 0.26, 0.4 + i * 0.26);
        return (
          <React.Fragment key={c.en}>
            <Card x={c.x} y={880} w={250} h={320} rotate={-2 + i * 2 - dead * 4} accent={ACCENT} opacity={0.35 + 0.65 * eo(seg(p, 0.02 + i * 0.04, 0.12 + i * 0.04))}>
              <div style={{ position: "absolute", left: 24, top: 28, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 4, color: FAINT }}>{String(i + 1).padStart(2, "0")} / {c.en}</div>
              <div style={{ position: "absolute", left: 24, top: 58, fontFamily: FONT_STACK, fontSize: 32, fontWeight: 700, color: dead > 0.5 ? `${INK}55` : INK }}>{c.zh}</div>
              <div style={{ position: "absolute", left: 24, top: 120, width: 202, height: 1, background: `${INK}18` }} />
              <div style={{ position: "absolute", left: 24, top: 142, width: 150 * (1 - dead * 0.7), height: 8, background: `${INK}18`, borderRadius: 4 }} />
              <div style={{ position: "absolute", left: 24, top: 164, width: 180 * (1 - dead * 0.6), height: 8, background: `${INK}12`, borderRadius: 4 }} />
              <div style={{ position: "absolute", left: 24, top: 186, width: 118 * (1 - dead * 0.5), height: 8, background: `${INK}12`, borderRadius: 4 }} />
              <div style={{ position: "absolute", left: 24, bottom: 22, fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 2, color: dead > 0.5 ? ACCENT : FAINT }}>
                {dead > 0.5 ? "SKIPPED" : "PENDING"}
              </div>
            </Card>
            <Stamp text="SKIP" x={c.x + 34} y={880 + 62} size={34} rotate={-14 + i * 4} t={stamp} color={RED} />
          </React.Fragment>
        );
      })}

      {/* AI 光标 */}
      <div style={{ position: "absolute", left: cx - 26, top: cy - 26, width: 52, height: 52, transform: `rotate(${Math.sin(p * 30) * 6}deg)` }}>
        <div style={{ width: 0, height: 0, borderLeft: "26px solid transparent", borderRight: "26px solid transparent", borderBottom: `46px solid ${INK}` }} />
      </div>

      {/* 质量条 */}
      <div style={{ position: "absolute", left: 240, top: 1236, width: 600, opacity: eo(seg(p, 0.1, 0.24)) }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 3, color: FAINT, marginBottom: 10 }}>
          <span>代码质量</span>
          <span style={{ color: quality < 0.4 ? RED : INK_SOFT }}>{Math.round(quality * 100)}%</span>
        </div>
        <div style={{ height: 18, background: `${INK}12`, borderRadius: 9, overflow: "hidden" }}>
          <div style={{ width: `${quality * 100}%`, height: "100%", background: quality < 0.4 ? RED : ACCENT, borderRadius: 9 }} />
        </div>
        <div style={{ marginTop: 12, fontFamily: FONT_STACK, fontSize: 19, color: INK_SOFT, opacity: eo(seg(p, 0.7, 0.86)) }}>
          跳过的是步骤，透支的是质量
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene03;
