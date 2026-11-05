// Scene01 · 钩子：截图派 vs 读骨架派（左侧模糊截图 + 扫描线，右侧无障碍树逐行点亮）
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK, rand } from "../../dv/atmosphere";
import { ProgressDots, Watermark } from "../_lib/chrome";
import { clamp01, easeOut, lerp, INK, MUTED, LINE, PAPER, SHADOW, RefBadge, RoleChip, Cursor } from "./ui";

const TREE_ROWS = [
  { depth: 0, role: "window", name: "报销单 - 草稿", ref: "@s8f3k2p9:e1" },
  { depth: 1, role: "text", name: "金额", ref: "@s8f3k2p9:e6" },
  { depth: 1, role: "text", name: "事由", ref: "@s8f3k2p9:e7" },
  { depth: 1, role: "button", name: "提交", ref: "@s8f3k2p9:e8" },
  { depth: 1, role: "menu", name: "更多操作", ref: "@s8f3k2p9:e9" },
];

const Scene01: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const blocks = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        x: 18 + rand(seed + i * 5) * 300,
        y: 24 + rand(seed + i * 5 + 1) * 330,
        w: 60 + rand(seed + i * 5 + 2) * 150,
        h: 18 + rand(seed + i * 5 + 3) * 30,
        o: 0.28 + rand(seed + i * 5 + 4) * 0.32,
      })),
    [seed],
  );

  const panelIn = easeOut(clamp01(p / 0.12));
  const leftDim = p < 0.32 ? 1 : lerp(1, 0.45, clamp01((p - 0.32) / 0.22));
  const scan = ((p * 1.7) % 1) * 420;
  const focus = Math.floor(clamp01((p - 0.1) / 0.5) * TREE_ROWS.length);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(155deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <ProgressDots index={0} total={9} accent={accent} light />

      {/* 左：截图派 —— 一张被扫描的照片，看不出哪个能点 */}
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 646,
          width: 430,
          height: 470,
          borderRadius: 20,
          background: "#E7E0D2",
          boxShadow: SHADOW,
          opacity: panelIn * leftDim,
          transform: `translateY(${(1 - panelIn) * 40}px) rotate(-1.6deg)`,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, filter: "grayscale(0.55)" }}>
          {blocks.map((b, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: b.x,
                top: 60 + b.y,
                width: b.w,
                height: b.h,
                borderRadius: 6,
                background: "rgba(23,20,16,0.16)",
                opacity: b.o,
              }}
            />
          ))}
          {/* 伪按钮块：看起来像按钮，但没有语义 */}
          <div style={{ position: "absolute", left: 40, top: 300, width: 150, height: 54, borderRadius: 10, background: "rgba(23,20,16,0.26)" }} />
          <div style={{ position: "absolute", left: 230, top: 300, width: 150, height: 54, borderRadius: 10, background: "rgba(23,20,16,0.12)" }} />
          <div style={{ position: "absolute", left: 40, top: 380, width: 340, height: 14, borderRadius: 7, background: "rgba(23,20,16,0.10)" }} />
        </div>
        {/* 扫描线 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 52 + scan,
            height: 3,
            background: accent,
            opacity: 0.5,
            boxShadow: `0 0 22px ${accent}`,
          }}
        />
        {/* 猜不透的问号 */}
        <div
          style={{
            position: "absolute",
            right: 26,
            top: 22,
            width: 62,
            height: 62,
            borderRadius: 31,
            background: "rgba(184,70,44,0.12)",
            border: `2px dashed ${accent}`,
            color: accent,
            fontSize: 38,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: clamp01((p - 0.1) / 0.15),
          }}
        >
          ?
        </div>
        <Cursor x={250 + Math.sin(p * 26) * 12} y={286 + Math.cos(p * 19) * 8} scale={0.9} opacity={panelIn * 0.9} />
      </div>

      {/* 右：读骨架 —— 无障碍树每一行都带 ref */}
      <div
        style={{
          position: "absolute",
          left: 566,
          top: 600,
          width: 442,
          height: 552,
          borderRadius: 20,
          background: PAPER,
          boxShadow: SHADOW,
          border: "1px solid rgba(23,20,16,0.08)",
          opacity: panelIn,
          transform: `translateY(${(1 - panelIn) * 46}px)`,
          padding: "22px 20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ fontFamily: MONO_STACK, fontSize: 20, color: MUTED, letterSpacing: 1 }}>accessibility tree</div>
          <div style={{ flex: 1 }} />
          <div style={{ width: 8, height: 8, borderRadius: 4, background: accent }} />
          <div style={{ fontFamily: MONO_STACK, fontSize: 18, color: accent }}>live</div>
        </div>

        {TREE_ROWS.map((row, i) => {
          const reveal = clamp01((p - 0.02 - i * 0.04) / 0.1);
          const active = i === focus && p > 0.08;
          return (
            <div
              key={row.ref}
              style={{
                marginLeft: row.depth * 24,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 6,
                height: 88,
                padding: "0 10px 0 12px",
                borderRadius: 10,
                background: active ? "rgba(184,70,44,0.10)" : "transparent",
                borderLeft: row.depth ? `2px solid ${LINE}` : "none",
                opacity: reveal,
                transform: `translateX(${(1 - reveal) * 18}px)`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <RoleChip label={row.role} color={row.depth ? "rgba(23,20,16,0.5)" : accent} opacity={reveal} />
                <div style={{ fontSize: 25, fontWeight: 600, color: INK, whiteSpace: "nowrap" }}>{row.name}</div>
              </div>
              <div style={{ display: "flex" }}>
                <RefBadge text={row.ref} accent={accent} size={15} solid={active} opacity={reveal} />
              </div>
            </div>
          );
        })}

        <div style={{ position: "absolute", left: 20, right: 20, bottom: 16, fontFamily: MONO_STACK, fontSize: 16, color: MUTED, opacity: 0.8 }}>
          {"{ role, name, ref, actions }"}
        </div>
      </div>

      {/* 星标徽章（替代 overlay counter：overlay 贴左边会出框） */}
      <div
        style={{
          position: "absolute",
          top: 196,
          right: 72,
          textAlign: "right",
          opacity: clamp01((p - 0.04) / 0.14),
          transform: `translateY(${(1 - clamp01((p - 0.04) / 0.14)) * -14}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 10 }}>
          <svg width={38} height={38} viewBox="0 0 24 24">
            <path fill="#C8901F" d="M12 2l2.9 6.26 6.85.72-5.1 4.6 1.43 6.73L12 16.9 5.92 20.3l1.43-6.73-5.1-4.6 6.85-.72L12 2z" />
          </svg>
          <span style={{ fontFamily: MONO_STACK, fontSize: 62, fontWeight: 900, color: INK, letterSpacing: 1, lineHeight: 1 }}>14,201</span>
        </div>
        <div style={{ fontSize: 21, color: MUTED, letterSpacing: 2, marginTop: 4 }}>GitHub stars · Apache-2.0</div>
      </div>

      {/* 底部对比标签 */}
      <div style={{ position: "absolute", top: 1180, left: 72, width: 430, textAlign: "center", opacity: clamp01((p - 0.12) / 0.18) }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: MUTED, letterSpacing: 2 }}>截图：猜坐标</div>
      </div>
      <div style={{ position: "absolute", top: 1180, left: 566, width: 442, textAlign: "center", opacity: clamp01((p - 0.3) / 0.18) }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: accent, letterSpacing: 2 }}>读树：认名字</div>
      </div>

      <Watermark text="vibe 知识大赏 · 科普" light />
    </AbsoluteFill>
  );
};

export default Scene01;
