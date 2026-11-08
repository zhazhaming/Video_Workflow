// Scene10 · 省油不值钱了（天平：油枪侧沉 vs 电插头侧轻 + 金币落入 + 「亏」印）
// 每公里几分钱 → 右侧电费标签；价格战 → 底部红色「亏」印摇晃。
// 动画只由 p 驱动，只用 transform/opacity。
import React from "react";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Num, Stamp, INK, INK_SOFT, INK_FAINT, RED, GOLD, GREEN, MONO_STACK, MARGIN, seg, eo, pop, clamp01, lerp } from "./ui";

const PX = 540; // 支点
const PY = 700;

const Scene10: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const main = accent || RED;
  const mm = (i: number, fb: number) => marks?.[i]?.start ?? fb;
  const ex = seg(p, 0.88, 1);
  const t2 = mm(2, 0.62); // 「卖一台亏一台」

  const standT = eo(seg(p, 0.03, 0.13));
  const coinT = (i: number) => seg(p, 0.14 + i * 0.06, 0.24 + i * 0.06);
  // 油侧三枚金币落下 → 油侧下沉（-12°）；最后回摆一点
  const tipT = eo(seg(p, 0.16, 0.4));
  const angle = lerp(0, -13, tipT) + Math.sin(p * Math.PI * 2 * 0.6) * 0.8 * tipT;
  const stampT = seg(p, t2, t2 + 0.12);
  const shake = stampT > 0 ? Math.sin(p * Math.PI * 2 * 5) * 2 * (1 - clamp01((p - t2 - 0.2) * 4)) : 0;

  const coins = [
    { d: 0, x: -150 },
    { d: 0.06, x: -122 },
    { d: 0.12, x: -176 },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} />

      <Cap text="省钱账本换了算法" x={984} y={360} align="right" size={26} color={INK_SOFT} accent={main} />

      {/* 支架（梯形柱 + 底座） */}
      <div style={{ position: "absolute", left: PX - 16, top: PY, width: 32, height: 330, background: INK_SOFT, opacity: 0.85 * standT, borderRadius: "0 0 8px 8px" }} />
      <div style={{ position: "absolute", left: PX - 130, top: PY + 330, width: 260, height: 22, borderRadius: 8, background: INK_SOFT, opacity: 0.85 * standT }} />

      {/* 横梁 + 两侧吊盘 */}
      <div style={{ position: "absolute", left: PX, top: PY, opacity: standT * (1 - ex) }}>
        <div style={{ position: "absolute", left: -290, top: -8, width: 580, height: 14, borderRadius: 7, background: INK, transform: `rotate(${angle}deg)`, transformOrigin: "50% 50%" }} />
        {/* 支点圆 */}
        <div style={{ position: "absolute", left: -13, top: -13, width: 26, height: 26, borderRadius: "50%", background: main, opacity: 0.9 }} />

        {/* 左盘：油枪（重） */}
        <div style={{ position: "absolute", left: -260, top: 0, transform: `rotate(${angle}deg)` }}>
          <div style={{ position: "absolute", left: -2, top: 0, width: 2, height: 150, background: INK_SOFT, transform: "rotate(14deg)", transformOrigin: "top center" }} />
          <div style={{ position: "absolute", left: 100, top: 0, width: 2, height: 150, background: INK_SOFT, transform: "rotate(-14deg)", transformOrigin: "top center" }} />
          <div style={{ position: "absolute", left: -10, top: 148, width: 220, height: 74, borderRadius: "8px 8px 60px 60px", background: "#F3E9D2", border: `3px solid ${INK}44` }} />
          {/* 油枪图标 */}
          <div style={{ position: "absolute", left: 62, top: 66, width: 56, height: 78, borderRadius: 8, background: main, opacity: 0.92 }}>
            <div style={{ position: "absolute", right: -16, top: 12, width: 18, height: 12, background: INK, borderRadius: 3 }} />
            <Hair x={12} y={20} w={32} color="#FBF6EC" thickness={4} opacity={0.85} />
            <Hair x={12} y={38} w={32} color="#FBF6EC" thickness={4} opacity={0.6} />
          </div>
          <div style={{ position: "absolute", left: -110, top: 236, width: 220, textAlign: "center", fontFamily: MONO_STACK, fontSize: 28, color: INK_SOFT, letterSpacing: 2, whiteSpace: "nowrap" }}>一箱油 300+</div>
        </div>

        {/* 右盘：电插头（轻） */}
        <div style={{ position: "absolute", left: 40, top: 0, transform: `rotate(${angle}deg)` }}>
          <div style={{ position: "absolute", left: -2, top: 0, width: 2, height: 150, background: INK_SOFT, transform: "rotate(14deg)", transformOrigin: "top center" }} />
          <div style={{ position: "absolute", left: 100, top: 0, width: 2, height: 150, background: INK_SOFT, transform: "rotate(-14deg)", transformOrigin: "top center" }} />
          <div style={{ position: "absolute", left: -10, top: 148, width: 220, height: 74, borderRadius: "8px 8px 60px 60px", background: "#F3E9D2", border: `3px solid ${INK}44` }} />
          {/* 电池图标 */}
          <div style={{ position: "absolute", left: 58, top: 74, width: 64, height: 44, borderRadius: 8, background: GREEN, opacity: 0.92 }}>
            <div style={{ position: "absolute", right: -8, top: 12, width: 8, height: 20, background: GREEN, borderRadius: 2 }} />
            <Hair x={10} y={20} w={40} color="#FBF6EC" thickness={5} opacity={0.9} />
          </div>
          <div style={{ position: "absolute", left: -110, top: 236, width: 220, textAlign: "center", fontFamily: MONO_STACK, fontSize: 28, color: GREEN, letterSpacing: 2, whiteSpace: "nowrap" }}>每公里几分钱</div>
        </div>

        {/* 金币落向左盘 */}
        {coins.map((c, i) => {
          const t = coinT(i);
          const cy = lerp(-340, 160, eo(t));
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: c.x,
                top: cy,
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: GOLD,
                border: `3px solid ${GOLD}`,
                boxShadow: `inset 0 0 0 5px #FBF6EC`,
                opacity: clamp01(t * 2) * (t < 1 ? 1 : 0.85),
                transform: `rotate(${t * 260}deg)`,
              }}
            />
          );
        })}
      </div>

      {/* 价格战箭头 */}
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 1150,
          opacity: eo(seg(p, 0.4, 0.52)) * (1 - ex),
        }}
      >
        <Num value={-30} suffix="%" x={0} y={0} size={44} color={INK_SOFT} />
        <div style={{ fontFamily: MONO_STACK, fontSize: 22, color: INK_FAINT, letterSpacing: 4, marginTop: 6 }}>一年内官降示意</div>
      </div>

      {/* 亏字印 */}
      <Stamp text="卖一台亏一台" x={720} y={1130} size={42} rotate={-6} t={stampT} color={main} border={5} />
      <div style={{ position: "absolute", left: 720 + shake, top: 1130, width: 0, height: 0 }} />
    </div>
  );
};

export default Scene10;
