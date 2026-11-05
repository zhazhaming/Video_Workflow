// Scene03 · 生活比方：左边是「看照片猜」，右边是「看菜单点菜」——结构让 AI 认得出
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK, rand } from "../../dv/atmosphere";
import { ProgressDots, Watermark } from "../_lib/chrome";
import { clamp01, easeOut, lerp, INK, MUTED, LINE, PAPER, SHADOW, Cursor, CheckIcon, CrossIcon } from "./ui";

const DISHES = [
  { name: "清蒸鲈鱼", price: "¥48" },
  { name: "番茄牛腩", price: "¥42" },
  { name: "手撕包菜", price: "¥22" },
];

const Scene03: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const blobs = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        x: 24 + rand(seed + i * 7) * 220,
        y: 100 + rand(seed + i * 7 + 1) * 320,
        r: 40 + rand(seed + i * 7 + 2) * 70,
        o: 0.18 + rand(seed + i * 7 + 3) * 0.2,
      })),
    [seed],
  );

  const leftIn = easeOut(clamp01((p - 0.02) / 0.14));
  const rightIn = easeOut(clamp01((p - 0.06) / 0.16));
  const move = clamp01((p - 0.18) / 0.42);
  const picked = p > 0.58;

  // 光标坐标是菜单卡内坐标
  const cursorX = lerp(318, 246, move);
  const cursorY = lerp(110, 372, move);
  const rowTop = 208;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(158deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <ProgressDots index={2} total={9} accent={accent} light />

      {/* 左：一张看不清的「照片」 */}
      <div
        style={{
          position: "absolute",
          left: 84,
          top: 500,
          width: 352,
          height: 470,
          borderRadius: 18,
          background: "#E4DCCB",
          boxShadow: SHADOW,
          transform: `rotate(-2deg) translateY(${(1 - leftIn) * 50}px)`,
          opacity: leftIn,
          overflow: "hidden",
          filter: "grayscale(0.6)",
        }}
      >
        {blobs.map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: b.x,
              top: b.y,
              width: b.r,
              height: b.r,
              borderRadius: b.r / 2,
              background: `rgba(23,20,16,${b.o})`,
              filter: "blur(9px)",
            }}
          />
        ))}
        <div style={{ position: "absolute", left: 0, top: 300, width: "100%", height: 80, background: "rgba(255,252,244,0.45)", filter: "blur(6px)" }} />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 300,
            transform: "translate(-50%,-50%)",
            fontSize: 120,
            fontWeight: 900,
            color: "rgba(184,70,44,0.55)",
            opacity: clamp01((p - 0.06) / 0.14),
          }}
        >
          ?
        </div>
        <div style={{ position: "absolute", left: 22, bottom: 18, fontFamily: MONO_STACK, fontSize: 20, color: MUTED }}>screenshot.png</div>
      </div>

      {/* 右：一份有结构的菜单 */}
      <div
        style={{
          position: "absolute",
          left: 480,
          top: 452,
          width: 528,
          height: 646,
          borderRadius: 18,
          background: PAPER,
          boxShadow: SHADOW,
          border: "1px solid rgba(23,20,16,0.08)",
          opacity: rightIn,
          transform: `translateY(${(1 - rightIn) * 44}px)`,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "24px 28px 12px", borderBottom: `1px solid ${LINE}`, display: "flex", alignItems: "baseline", gap: 12 }}>
          <div style={{ fontSize: 34, fontWeight: 900, color: INK, letterSpacing: 2 }}>今日菜单</div>
          <div style={{ fontFamily: MONO_STACK, fontSize: 18, color: MUTED, letterSpacing: 3 }}>MENU</div>
          <div style={{ flex: 1 }} />
          <div style={{ fontFamily: MONO_STACK, fontSize: 16, color: accent }}>3 items</div>
        </div>

        {DISHES.map((d, i) => {
          const top = rowTop + i * 128;
          const active = picked && i === 1;
          return (
            <div
              key={d.name}
              style={{
                position: "absolute",
                left: 18,
                right: 18,
                top,
                height: 108,
                borderRadius: 12,
                background: active ? "rgba(184,70,44,0.12)" : "transparent",
                border: active ? `2px solid ${accent}` : `1px solid transparent`,
                display: "flex",
                alignItems: "center",
                padding: "0 18px",
                opacity: clamp01((p - 0.08 - i * 0.06) / 0.12),
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(23,20,16,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontFamily: MONO_STACK, fontSize: 18, color: MUTED }}>{i + 1}</div>
              </div>
              <div style={{ marginLeft: 16, flex: 1 }}>
                <div style={{ fontSize: 30, fontWeight: 700, color: INK }}>{d.name}</div>
                <div style={{ fontFamily: MONO_STACK, fontSize: 17, color: MUTED, marginTop: 4 }}>
                  role: menuitem · name: {d.name}
                </div>
              </div>
              <div style={{ fontFamily: MONO_STACK, fontSize: 24, color: MUTED }}>{d.price}</div>
              <div style={{ width: 34, marginLeft: 14 }}>
                {active ? <CheckIcon size={34} color={accent} /> : <div style={{ width: 26, height: 26, borderRadius: 6, border: `2px solid ${LINE}` }} />}
              </div>
            </div>
          );
        })}

        <div style={{ position: "absolute", left: 24, bottom: 20, fontFamily: MONO_STACK, fontSize: 18, color: MUTED, opacity: 0.85 }}>
          action: Click → 点第二行
        </div>
        <Cursor x={cursorX} y={cursorY} scale={1.05} opacity={clamp01((p - 0.14) / 0.12)} />
      </div>

      {/* 左右结论 */}
      <div style={{ position: "absolute", top: 1048, left: 84, width: 352, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: clamp01((p - 0.16) / 0.15) }}>
        <CrossIcon size={30} color={accent} />
        <div style={{ fontSize: 28, fontWeight: 800, color: MUTED, letterSpacing: 1 }}>看照片 只能猜</div>
      </div>
      <div style={{ position: "absolute", top: 1048, left: 480, width: 528, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: clamp01((p - 0.54) / 0.16) }}>
        <CheckIcon size={30} color={accent} />
        <div style={{ fontSize: 28, fontWeight: 800, color: accent, letterSpacing: 1 }}>看菜单 直接点</div>
      </div>

      <Watermark text="vibe 知识大赏 · 科普" light />
    </AbsoluteFill>
  );
};

export default Scene03;
