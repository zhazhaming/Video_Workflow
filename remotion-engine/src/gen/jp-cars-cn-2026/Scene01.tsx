// Scene01 · 开场问好（片头背景：杂货铺雨棚 + 空白吊牌摇曳 + 尘光）
// 片头主标题由引擎 titleCard 呈现，本场景只做氛围：店铺雨棚、挂着摇晃的牛皮纸吊牌、
// 缓缓浮动的尘光点。动画只由 p 驱动，只用 transform / opacity。
import React from "react";
import type { GenSceneProps } from "../types";
import { rand } from "../../dv/atmosphere";
import { Paper, Hair, INK, INK_FAINT, RED, clamp01, seg, eo, lerp } from "./ui";

const TAGS = [
  { x: 150, y: 500, w: 108, h: 138, phase: 0.0, accent: false },
  { x: 330, y: 560, w: 92, h: 120, phase: 1.7, accent: true },
  { x: 560, y: 505, w: 116, h: 146, phase: 3.1, accent: false },
  { x: 780, y: 565, w: 92, h: 122, phase: 4.4, accent: false },
  { x: 905, y: 498, w: 104, h: 132, phase: 5.6, accent: true },
];

const Scene01: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const main = accent || RED;
  const ex = seg(p, 0.88, 1); // 退场（后 12%）

  // ---- 雨棚：条纹 + 半圆垂边，从顶部压入 ----
  const awnT = eo(seg(p, 0, 0.14));
  const stripes = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const sw = 120;
  const scallops = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  // ---- 吊牌：掉入 → 持续轻摆 ----
  const swing = (phase: number) => Math.sin(p * Math.PI * 2 * 0.9 + phase) * 4.2;

  // ---- 尘光点（确定性随机，一次性预生成）----
  const motes = React.useMemo(
    () =>
      Array.from({ length: 14 }, (_, k) => ({
        x: 80 + rand(k * 7 + 11) * 920,
        y0: 380 + rand(k * 7 + 12) * 900,
        r: 2 + rand(k * 7 + 13) * 4,
        sp: 0.5 + rand(k * 7 + 14) * 0.8,
        ph: rand(k * 7 + 15) * Math.PI * 2,
      })),
    [],
  );

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} />

      {/* 雨棚（y≈CONTENT_TOP 上方压入，不进入内容安全区太多） */}
      <div style={{ position: "absolute", left: 0, right: 0, top: lerp(-260, 96, awnT), opacity: 0.92 * awnT }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 74, overflow: "hidden", display: "flex" }}>
          {stripes.map((i) => (
            <div
              key={i}
              style={{
                width: sw,
                height: 74,
                background: i % 2 === 0 ? `${main}` : "#FBF6EC",
                opacity: i % 2 === 0 ? 0.8 : 0.95,
              }}
            />
          ))}
        </div>
        {/* 垂边半圆 */}
        {scallops.map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: i * sw,
              top: 74,
              width: sw,
              height: 34,
              borderRadius: "0 0 60px 60px",
              background: i % 2 === 0 ? main : "#FBF6EC",
              opacity: i % 2 === 0 ? 0.8 : 0.95,
              border: `1px solid ${INK}22`,
              borderTop: "none",
            }}
          />
        ))}
      </div>

      {/* 吊牌（绳 + 孔 + 空白牌面，带纸感阴影） */}
      {TAGS.map((t, i) => {
        const inT = eo(seg(p, 0.05 + i * 0.022, 0.16 + i * 0.022));
        const y = lerp(t.y - 90, t.y, inT);
        const rot = swing(t.phase) * inT;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: t.x,
              top: y,
              width: t.w,
              height: t.h,
              opacity: inT * (1 - ex),
              transform: `rotate(${rot}deg)`,
              transformOrigin: "50% -34px",
            }}
          >
            <div style={{ position: "absolute", left: "50%", top: -34, width: 1.5, height: 36, background: INK_FAINT }} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 10,
                background: t.accent ? main : "#FBF6EC",
                border: `2px solid ${t.accent ? main : INK}55`,
                boxShadow: `0 10px 22px ${INK}18`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 14,
                width: 12,
                height: 12,
                marginLeft: -6,
                borderRadius: "50%",
                background: c1,
                border: `2px solid ${t.accent ? "#FBF6EC" : INK_FAINT}`,
              }}
            />
            {/* 牌面两道留白刻线（无文字，避免与片头打架） */}
            <Hair x={18} y={t.h * 0.52} w={t.w - 36} color={t.accent ? "#FBF6EC" : INK_FAINT} thickness={2} opacity={0.5} />
            <Hair x={18} y={t.h * 0.68} w={t.w - 58} color={t.accent ? "#FBF6EC" : INK_FAINT} thickness={2} opacity={0.35} />
          </div>
        );
      })}

      {/* 尘光点 */}
      {motes.map((m, k) => {
        const drift = Math.sin(p * Math.PI * 2 * m.sp + m.ph);
        const op = (0.16 + 0.1 * Math.sin(p * Math.PI * 2 * m.sp * 1.7 + m.ph)) * (1 - ex);
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: m.x + drift * 22,
              top: m.y0 + drift * 14,
              width: m.r * 2,
              height: m.r * 2,
              borderRadius: "50%",
              background: main,
              opacity: clamp01(op) * 0.5,
            }}
          />
        );
      })}

      {/* 底部台面细线 */}
      <Hair x={96} y={1330} w={888} color={INK} opacity={0.14} progress={eo(seg(p, 0.2, 0.4))} />
    </div>
  );
};

export default Scene01;
