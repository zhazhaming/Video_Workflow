// Scene06 · 场景三：桌面软件发版回归 —— 30 个按钮按顺序点完，全绿
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";
import { ProgressDots, Watermark } from "../_lib/chrome";
import { clamp01, easeOut, INK, MUTED, LINE, PAPER, SHADOW, CheckIcon, Cursor } from "./ui";

const COLS = 6;
const ROWS = 5;
const BW = 130;
const BH = 70;
const GX = 18;
const GY = 24;
const X0 = 105;
const Y0 = 640;

const Scene06: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const inA = easeOut(clamp01(p / 0.12));
  const run = clamp01(p / 0.82);
  const done = Math.min(30, Math.floor(run * 30.999));
  const stamp = clamp01((p - 0.86) / 0.1);

  const cx = (done - 1) % COLS;
  const cy = Math.floor((done - 1) / COLS);
  const curX = X0 + Math.max(0, cx) * (BW + GX) + BW * 0.62;
  const curY = Y0 + Math.max(0, cy) * (BH + GY) + BH * 0.7;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(158deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <ProgressDots index={5} total={9} accent={accent} light />

      <div style={{ position: "absolute", left: 105, top: 430, opacity: inA, display: "flex", alignItems: "flex-end", gap: 16 }}>
        <div style={{ fontSize: 40, fontWeight: 900, color: INK, letterSpacing: 2 }}>客户端 v3.2</div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 22, color: MUTED, paddingBottom: 6 }}>发版前 手动点一遍</div>
      </div>

      {/* 进度 */}
      <div style={{ position: "absolute", right: 72, top: 452, width: 300, textAlign: "right", opacity: inA }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 24, color: MUTED }}>
          PASS <span style={{ color: accent, fontWeight: 800, fontSize: 38 }}>{done}</span> / 30
        </div>
        <div style={{ marginTop: 10, height: 8, borderRadius: 4, background: "rgba(23,20,16,0.12)", overflow: "hidden" }}>
          <div style={{ width: `${(done / 30) * 100}%`, height: "100%", background: accent }} />
        </div>
      </div>

      {/* 按钮矩阵 */}
      <div style={{ position: "absolute", left: 0, top: 0, opacity: inA }}>
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const x = X0 + col * (BW + GX);
          const y = Y0 + row * (BH + GY);
          const passed = i < done;
          const current = i === done - 1;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: BW,
                height: BH,
                borderRadius: 12,
                background: passed ? "rgba(184,70,44,0.12)" : PAPER,
                border: current ? `3px solid ${accent}` : `1.5px solid ${LINE}`,
                boxShadow: passed ? "none" : SHADOW,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transform: `scale(${current ? 1.06 : 1})`,
              }}
            >
              <div style={{ fontFamily: MONO_STACK, fontSize: 20, color: passed ? accent : MUTED }}>B{String(i + 1).padStart(2, "0")}</div>
              {passed ? <CheckIcon size={24} color={accent} /> : null}
            </div>
          );
        })}
      </div>

      <div style={{ opacity: p > 0.16 && p < 0.84 ? 1 : 0 }}>
        <Cursor x={curX} y={curY} scale={1} />
      </div>

      {/* 全绿盖章 */}
      {stamp > 0 ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 1120,
            transform: `translateX(-50%) rotate(-7deg) scale(${1.5 - 0.5 * easeOut(stamp)})`,
            opacity: stamp,
            border: `6px solid ${accent}`,
            color: accent,
            borderRadius: 14,
            padding: "10px 34px",
            fontFamily: MONO_STACK,
            fontSize: 52,
            fontWeight: 900,
            letterSpacing: 6,
            background: "rgba(255,252,244,0.86)",
            whiteSpace: "nowrap",
          }}
        >
          全绿 30/30
        </div>
      ) : null}

      <Watermark text="vibe 知识大赏 · 科普" light />
    </AbsoluteFill>
  );
};

export default Scene06;
