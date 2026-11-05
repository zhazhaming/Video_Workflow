// Scene02 · 它读的是什么：一个真实窗口被扫描 → 右侧浮出 ref → 下方 JSON 逐行敲出
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";
import { ProgressDots, Watermark } from "../_lib/chrome";
import { clamp01, easeOut, INK, MUTED, LINE, PAPER, SHADOW, RefBadge, WindowFrame, Glyph } from "./ui";

const FIELDS = [
  { k: "日期", v: "2026-11-04" },
  { k: "金额", v: "¥ 1,286.00" },
  { k: "事由", v: "客户拜访 · 高铁" },
  { k: "发票", v: "3 张已上传" },
];

const JSON_LINES = [
  "{",
  '  "role": "button",',
  '  "name": "提交",',
  '  "ref": "@s8f3k2p9:e8",',
  '  "actions": ["Click"]',
  "}",
];

const Scene02: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const winIn = easeOut(clamp01(p / 0.12));
  const scan = ((p * 2.2) % 1) * 300;
  const refIn = clamp01((p - 0.1) / 0.1);
  const jsonT = clamp01((p - 0.16) / 0.5);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <ProgressDots index={1} total={9} accent={accent} light />

      <WindowFrame x={72} y={392} w={936} h={364} title="报销系统 · 单据 #2041" accent={accent} opacity={winIn} scale={0.98 + winIn * 0.02}>
        <div style={{ padding: "26px 28px" }}>
          {FIELDS.map((f) => (
            <div key={f.k} style={{ display: "flex", alignItems: "center", height: 58, borderBottom: `1px dashed ${LINE}` }}>
              <div style={{ width: 110, fontSize: 22, color: MUTED, letterSpacing: 1 }}>{f.k}</div>
              <div style={{ fontSize: 25, fontWeight: 600, color: INK }}>{f.v}</div>
            </div>
          ))}
          {/* 真实按钮 */}
          <div
            style={{
              position: "absolute",
              right: 30,
              top: 222,
              padding: "14px 34px",
              borderRadius: 10,
              background: accent,
              color: "#FFF7EC",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: 2,
              boxShadow: "0 8px 20px rgba(184,70,44,0.28)",
              outline: refIn > 0 ? `3px solid rgba(184,70,44,${0.15 + 0.35 * Math.abs(Math.sin(p * 25))})` : "none",
              outlineOffset: 4,
            }}
          >
            提交
          </div>
        </div>
        {/* 扫描线 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 20 + scan,
            height: 2,
            background: accent,
            opacity: 0.45 * (1 - clamp01((p - 0.42) / 0.1)),
            boxShadow: `0 0 18px ${accent}`,
          }}
        />
      </WindowFrame>

      {/* JSON 代码卡 */}
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 806,
          width: 936,
          borderRadius: 18,
          background: "#221E18",
          boxShadow: SHADOW,
          padding: "24px 28px",
          opacity: clamp01((p - 0.02) / 0.1),
          transform: `translateY(${(1 - clamp01((p - 0.02) / 0.1)) * 24}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Glyph kind="grid" size={22} color="#D9C9A8" />
          <div style={{ fontFamily: MONO_STACK, fontSize: 19, color: "rgba(233,222,196,0.7)", letterSpacing: 1 }}>snapshot.json</div>
          <div style={{ flex: 1 }} />
          <div style={{ opacity: refIn }}>
            <RefBadge text="@s8f3k2p9:e8" accent={accent} size={16} solid />
          </div>
        </div>
        {JSON_LINES.map((ln, i) => {
          const start = i * 0.09;
          const show = clamp01((jsonT - start) / 0.09);
          const chars = Math.round(ln.length * show);
          const isRef = ln.includes("ref");
          const isName = ln.includes("name");
          return (
            <div
              key={i}
              style={{
                fontFamily: MONO_STACK,
                fontSize: 27,
                lineHeight: 1.42,
                color: isRef ? "#F0B49E" : isName ? "#F3D9A4" : "rgba(238,229,208,0.92)",
                whiteSpace: "pre",
              }}
            >
              {ln.slice(0, chars)}
              {show > 0 && show < 1 ? <span style={{ color: accent }}>▌</span> : null}
            </div>
          );
        })}
      </div>

      {/* 三个字段标签 */}
      <div style={{ position: "absolute", top: 1190, left: 72, right: 72, display: "flex", alignItems: "center", gap: 14, opacity: clamp01((p - 0.46) / 0.16) }}>
        {["role", "name", "ref"].map((t) => (
          <span
            key={t}
            style={{
              fontFamily: MONO_STACK,
              fontSize: 22,
              padding: "8px 18px",
              borderRadius: 999,
              background: "rgba(255,252,244,0.72)",
              border: `1.5px solid ${LINE}`,
              color: INK,
              letterSpacing: 1,
            }}
          >
            {t}
          </span>
        ))}
        <span style={{ fontFamily: FONT_STACK, fontSize: 22, color: MUTED, marginLeft: 6 }}>一个能点的元素 就是一个 ref</span>
      </div>

      <Watermark text="vibe 知识大赏 · 科普" light />
    </AbsoluteFill>
  );
};

export default Scene02;
