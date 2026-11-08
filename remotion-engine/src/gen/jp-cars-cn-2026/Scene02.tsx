// Scene02 · 巅峰与现在（钩子：每4辆有1辆日系 → 每10辆摊不到1辆）
// 上下两组小车对比排布：上排 4 辆高亮 1 辆，下排 10 辆只剩 1 辆且变淡。
// 动画只由 p 驱动，只用 transform / opacity。
import React from "react";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Num, INK, INK_SOFT, INK_FAINT, RED, MARGIN, seg, eo, pop, clamp01 } from "./ui";

// 小车剪影（圆角车身 + 座舱 + 双轮），宽约 w
const Car: React.FC<{ x: number; y: number; w: number; fill: string; bodyOp: number; t: number; ring?: boolean }> = ({
  x,
  y,
  w,
  fill,
  bodyOp,
  t,
  ring,
}) => {
  const s = 0.6 + 0.4 * pop(t);
  const h = w * 0.52;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: clamp01(t * 1.6) * bodyOp, transform: `scale(${s})`, transformOrigin: "50% 100%" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: h * 0.18,
          width: w,
          height: h * 0.46,
          borderRadius: `${w * 0.16}px ${w * 0.2}px ${w * 0.08}px ${w * 0.08}px`,
          background: fill,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: w * 0.22,
          bottom: h * 0.56,
          width: w * 0.5,
          height: h * 0.44,
          borderRadius: `${w * 0.18}px ${w * 0.24}px 4px 4px`,
          background: fill,
        }}
      />
      <div style={{ position: "absolute", left: w * 0.16, bottom: 0, width: w * 0.2, height: w * 0.2, borderRadius: "50%", background: "#3A352D" }} />
      <div style={{ position: "absolute", right: w * 0.16, bottom: 0, width: w * 0.2, height: w * 0.2, borderRadius: "50%", background: "#3A352D" }} />
      {ring ? (
        <div
          style={{
            position: "absolute",
            left: -14,
            top: -10,
            right: -14,
            bottom: -8,
            borderRadius: 18,
            border: `3px solid ${RED}66`,
            opacity: 0.55 + 0.25 * Math.sin(t * Math.PI * 4),
          }}
        />
        ) : null}
    </div>
  );
};

const Scene02: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const main = accent || RED;
  const mm = (i: number, fb: number) => marks?.[i]?.start ?? fb;
  const ex = seg(p, 0.88, 1);

  // 上排：巅峰 4 辆，第 1 辆红（每4辆就有1辆）
  const row1 = [0, 1, 2, 3].map((i) => eo(seg(p, 0.04 + i * 0.03, 0.15 + i * 0.03)));
  // 下排：现在 10 辆，第 1 辆淡红（十辆摊不到一辆），其余墨灰
  const t2 = mm(1, 0.5);
  const row2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => eo(seg(p, t2 + i * 0.012, t2 + 0.1 + i * 0.012)));
  const cap2T = eo(seg(p, t2, t2 + 0.1));

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} />

      {/* 上排标签 */}
      <Cap text="巅峰时期" x={MARGIN} y={430} size={26} color={INK_SOFT} accent={main} opacity={row1[0]} />
      <div style={{ position: "absolute", left: MARGIN, top: 560, width: 888, height: 160 }}>
        {[0, 1, 2, 3].map((i) => (
          <Car
            key={i}
            x={40 + i * 220}
            y={30}
            w={170}
            fill={i === 0 ? main : "#DED4C0"}
            bodyOp={i === 0 ? 1 : 0.85}
            t={row1[i]}
            ring={i === 0}
          />
        ))}
      </div>
      <div style={{ position: "absolute", left: MARGIN, top: 700, opacity: row1[3] * (1 - ex) }}>
        <Num value={1} x={MARGIN + 10} y={0} size={44} color={main} suffix="/ 4 辆是日系" suffixSize={26} suffixColor={INK_SOFT} />
      </div>

      {/* 分隔细线 */}
      <Hair x={MARGIN} y={790} w={888} color={INK} thickness={1} opacity={0.2} progress={eo(seg(p, 0.3, 0.45))} />

      {/* 下排标签 */}
      <Cap text="2025 年" x={MARGIN} y={860} size={26} color={INK_SOFT} accent={main} opacity={cap2T} />
      <div style={{ position: "absolute", left: MARGIN, top: 980, width: 888, height: 110 }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <Car
            key={i}
            x={8 + i * 89}
            y={8}
            w={82}
            fill={i === 0 ? main : "#D8CDB8"}
            bodyOp={i === 0 ? 0.92 : 0.6}
            t={row2[i]}
            ring={i === 0}
          />
        ))}
      </div>
      <div style={{ position: "absolute", left: MARGIN, top: 1120, opacity: cap2T * (1 - ex) }}>
        <Num value={1} x={MARGIN + 10} y={0} size={44} color={INK_SOFT} suffix="/ 10 都摊不到" suffixSize={26} suffixColor={INK_FAINT} />
      </div>
    </div>
  );
};

export default Scene02;
