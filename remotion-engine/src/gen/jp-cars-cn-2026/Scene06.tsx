// Scene06 · 买家去哪了（大盘微涨的两根柱 + 巨型问号落下）
// 左侧小柱组证明「市场没变小」，右侧大问号制造悬念。动画只由 p 驱动。
import React from "react";
import type { GenSceneProps } from "../types";
import { rand } from "../../dv/atmosphere";
import { Paper, Cap, Hair, Num, INK, INK_SOFT, INK_FAINT, RED, SERIF_STACK, MONO_STACK, MARGIN, seg, eo, pop, clamp01, lerp } from "./ui";

const Scene06: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const main = accent || RED;
  const mm = (i: number, fb: number) => marks?.[i]?.start ?? fb;
  const ex = seg(p, 0.88, 1);
  const tQ = mm(1, 0.45); // 问号在第二句「都去买什么了」落下

  const barsT = eo(seg(p, 0.04, 0.16));
  const BASE = 1060;

  const qIn = seg(p, tQ, tQ + 0.16);
  const qPop = pop(eo(qIn));
  const bob = Math.sin(p * Math.PI * 2 * 0.7) * 10;
  const ring = seg(p, tQ + 0.08, tQ + 0.4);

  // 游离的小车点（从左往右游移，隐喻买家换方向）
  const dots = React.useMemo(
    () =>
      Array.from({ length: 9 }, (_, k) => ({
        y0: 520 + rand(k * 7 + 41) * 520,
        delay: rand(k * 7 + 42) * 0.3,
        sp: 0.7 + rand(k * 7 + 43) * 0.6,
        r: 5 + rand(k * 7 + 44) * 6,
      })),
    [],
  );

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} />

      <Cap text="2024 中国汽车大盘" x={MARGIN} y={360} size={26} color={INK_SOFT} accent={main} />

      {/* 左侧两根柱：2023 → 2024 +4.5% */}
      <div style={{ position: "absolute", left: 150, top: 0, width: 320, height: 1080 }}>
        <div
          style={{
            position: "absolute",
            left: 30,
            top: BASE - 300 * barsT,
            width: 108,
            height: 300 * barsT,
            borderRadius: "8px 8px 0 0",
            background: "#D9CFBA",
            transformOrigin: "bottom",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 186,
            top: BASE - 314 * eo(seg(p, 0.12, 0.28)),
            width: 108,
            height: 314 * eo(seg(p, 0.12, 0.28)),
            borderRadius: "8px 8px 0 0",
            background: INK_SOFT,
            opacity: 0.85,
          }}
        />
        {/* 总量标注（涨幅数值交给左上浮层） */}
        <div style={{ position: "absolute", left: 150, top: BASE - 380, opacity: eo(seg(p, 0.24, 0.36)) }}>
          <div style={{ fontFamily: MONO_STACK, fontSize: 24, color: INK_FAINT, letterSpacing: 3, whiteSpace: "nowrap" }}>全年总销量 3143.6 万辆</div>
        </div>
        {/* 年份 */}
        <div style={{ position: "absolute", left: 46, top: BASE + 16, fontFamily: MONO_STACK, fontSize: 24, color: INK_FAINT, opacity: barsT }}>2023</div>
        <div style={{ position: "absolute", left: 206, top: BASE + 16, fontFamily: MONO_STACK, fontSize: 24, color: INK_FAINT, opacity: barsT }}>2024</div>
      </div>
      <Hair x={150} y={BASE} w={320} color={INK} opacity={0.35} thickness={2} progress={barsT} />

      {/* 右侧巨型问号 */}
      <div
        style={{
          position: "absolute",
          left: 660,
          top: lerp(430, 470, qPop) + bob,
          fontFamily: SERIF_STACK,
          fontSize: 380,
          fontWeight: 900,
          color: main,
          opacity: clamp01(qIn * 1.5) * (1 - ex),
          transform: `scale(${0.5 + 0.5 * qPop}) rotate(-4deg)`,
          transformOrigin: "50% 50%",
          textShadow: `0 18px 40px ${main}2E`,
        }}
      >
        ？
      </div>
      {/* 落点涟漪 */}
      {[0, 1].map((i) => {
        const r = seg(p, tQ + 0.1 + i * 0.09, tQ + 0.42 + i * 0.09);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 660 + 190 * (0.4 + r * 0.8),
              top: 470 + 190 * (0.4 + r * 0.8),
              width: 380,
              height: 380,
              marginLeft: -190,
              marginTop: -190,
              borderRadius: "50%",
              border: `3px solid ${main}`,
              opacity: (1 - r) * 0.4 * clamp01(r * 6),
              transform: `scale(${0.5 + r})`,
            }}
          />
        );
      })}

      {/* 游移小车点 */}
      {dots.map((d, k) => {
        const run = eo(seg(p, 0.2 + d.delay, 0.2 + d.delay + 0.5 / d.sp));
        const x = lerp(430, 640, run);
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: x,
              top: d.y0 + Math.sin(p * Math.PI * 2 * d.sp + k) * 8,
              width: d.r * 2,
              height: d.r * 2,
              borderRadius: "50%",
              background: INK_FAINT,
              opacity: 0.4 * (1 - run * 0.7) * (1 - ex),
            }}
          />
        );
      })}

      {/* 底部提问印语 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1150,
          textAlign: "center",
          fontFamily: SERIF_STACK,
          fontSize: 36,
          letterSpacing: 10,
          color: INK_SOFT,
          opacity: eo(seg(p, tQ + 0.15, tQ + 0.3)) * (1 - ex),
        }}
      >
        买家都去哪了
      </div>
    </div>
  );
};

export default Scene06;
