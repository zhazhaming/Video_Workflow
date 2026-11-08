// Scene07 · 绿牌车答案是（主视觉：渗透率环 51.1% vs 日系 1% 细条）
// 环由 36 段扇片按角度点亮（只用 transform/opacity），绿牌绿；下方 100% 轨道上
// 日系的 1% 是一枚带脉冲环的红色细片——全片最强反差。
// 动画只由 p 驱动；数值 ≤64px。
import React from "react";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Num, INK, INK_SOFT, INK_FAINT, RED, GREEN, MONO_STACK, MARGIN, seg, eo, pop, clamp01, lerp } from "./ui";

const CX = 540;
const CY = 720;
const R = 200;
const SEGS = 36;

const Scene07: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const main = accent || RED;
  const mm = (i: number, fb: number) => marks?.[i]?.start ?? fb;
  const ex = seg(p, 0.88, 1);
  const t0 = mm(0, 0.1); // 绿牌车
  const t1 = mm(1, 0.38); // 卖得比油车多
  const t2 = mm(2, 0.68); // 只有 1%

  const ringT = eo(seg(p, t0, t1 + 0.12)); // 环扫到 51.1%
  const frac = 0.511;
  const halfTick = eo(seg(p, t1 - 0.04, t1 + 0.06)); // 50% 刻度

  const chipT = seg(p, t2, t2 + 0.12);
  const chipPop = pop(chipT);
  const pulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 2 * 1.6);

  const numT = clamp01(ringT * 1.2);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} />

      <Cap text="2024 年 7 月 · 新能源零售渗透率" x={MARGIN} y={360} size={26} color={INK_SOFT} accent={GREEN} />

      {/* 渗透率环：36 段 */}
      {Array.from({ length: SEGS }, (_, k) => {
        const segFrac = k / SEGS;
        const on = clamp01(ringT * (frac * SEGS + 2) - segFrac * SEGS);
        const ang = segFrac * 360 - 90;
        const isGreen = segFrac < frac;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: CX - 17,
              top: CY - R - 14,
              width: 34,
              height: 28,
              borderRadius: 7,
              background: isGreen ? GREEN : `${INK_SOFT}30`,
              opacity: 0.15 + 0.85 * on,
              transform: `rotate(${ang}deg)`,
              transformOrigin: `17px ${R + 14}px`,
              boxShadow: isGreen && on > 0.8 ? `0 4px 10px ${GREEN}44` : "none",
            }}
          />
        );
      })}
      {/* 50% 刻度（顶部左侧竖线处） */}
      <div
        style={{
          position: "absolute",
          left: CX - 2,
          top: CY - R - 34,
          width: 4,
          height: 26,
          background: INK,
          opacity: 0.55 * halfTick * (1 - ex),
          transform: `rotate(${lerp(-14, 0, halfTick)}deg)`,
          transformOrigin: "2px 60px",
        }}
      />
      {/* 环心数值 */}
      <div style={{ position: "absolute", left: 0, right: 0, top: CY - 58, textAlign: "center", opacity: numT * (1 - ex) }}>
        <span style={{ fontFamily: MONO_STACK, fontSize: 62, fontWeight: 800, color: GREEN, fontVariantNumeric: "tabular-nums" }}>51.1%</span>
        <div style={{ fontFamily: MONO_STACK, fontSize: 24, letterSpacing: 5, color: INK_FAINT, marginTop: 12 }}>首次过半</div>
      </div>

      {/* 100% 轨道 + 1% 细片 */}
      <Cap text="同一时间 · 日系新能源占比" x={MARGIN} y={1020} size={26} color={INK_SOFT} accent={main} opacity={chipT} />
      <div style={{ position: "absolute", left: MARGIN, top: 1082, width: 888, height: 30 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 15, background: `${INK}12` }} />
        {/* 10% 参考虚位 */}
        <div style={{ position: "absolute", left: "10%", top: -4, width: 2, height: 38, background: INK_FAINT, opacity: 0.3 }} />
        <div style={{ position: "absolute", left: "10%", top: 36, fontFamily: MONO_STACK, fontSize: 20, color: INK_FAINT, opacity: 0.5 }}>10%</div>
        {/* 日系 1% 细片（视觉上略加宽到 12px 并加脉冲环，注明为示意） */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 12 * chipPop,
            height: 30,
            borderRadius: 8,
            background: main,
            boxShadow: `0 0 0 ${4 + pulse * 8}px ${main}${pulse > 0.5 ? "26" : "14"}`,
            opacity: clamp01(chipT * 2) * (1 - ex),
          }}
        />
      </div>
      {/* 1% 大标注 */}
      <div style={{ position: "absolute", left: MARGIN + 40, top: 1130, opacity: clamp01(chipT * 1.6) * (1 - ex) }}>
        <Num value={1} suffix="%" x={0} y={0} size={56} color={main} />
      </div>
      <Cap text="细片宽度为示意放大" x={984} y={1156} align="right" size={20} color={INK_FAINT} opacity={0.7} />

      {/* 车尾绿牌小卡（装饰：绿底白字「新能源」不写字，只做色带） */}
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 470,
          width: 0,
          height: 0,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: i * 34,
              top: Math.sin(p * Math.PI * 2 * 0.8 + i * 1.2) * 6,
              width: 22,
              height: 52,
              borderRadius: 6,
              background: GREEN,
              opacity: (0.22 - i * 0.05) * (1 - ex),
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Scene07;
