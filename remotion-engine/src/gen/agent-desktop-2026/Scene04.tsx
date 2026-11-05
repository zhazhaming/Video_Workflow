// Scene04 · 场景一：没有接口的老 OA —— 发票从文件夹飞进单据，字段自动填
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";
import { ProgressDots, Watermark } from "../_lib/chrome";
import { clamp01, easeOut, easeInOut, lerp, INK, MUTED, LINE, PAPER, SHADOW, WindowFrame, Glyph, CheckIcon } from "./ui";

const FIELDS = [
  { k: "日期", v: "2026-11-04" },
  { k: "金额", v: "1,286.00" },
  { k: "事由", v: "客户拜访 · 高铁" },
  { k: "发票张数", v: "3" },
];

const Scene04: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const inA = easeOut(clamp01(p / 0.12));
  const fly = easeInOut(clamp01((p - 0.16) / 0.26));
  const filled = clamp01((p - 0.1) / 0.36);
  const submit = p > 0.7;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`, fontFamily: FONT_STACK, overflow: "hidden" }}>
      <ProgressDots index={3} total={9} accent={accent} light />

      {/* 发票文件夹 */}
      <div style={{ position: "absolute", left: 58, top: 596, width: 286, height: 250, opacity: inA, transform: `translateY(${(1 - inA) * 30}px)` }}>
        <div style={{ position: "absolute", left: 0, top: 26, width: 150, height: 34, borderTopLeftRadius: 12, borderTopRightRadius: 12, background: accent, opacity: 0.85 }} />
        <div style={{ position: "absolute", left: 0, top: 52, width: 286, height: 196, borderRadius: 14, background: "#EADFC8", boxShadow: SHADOW, border: "1px solid rgba(23,20,16,0.10)" }} />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 22 + i * 54,
              top: 76 + i * 10,
              width: 132,
              height: 132,
              borderRadius: 8,
              background: PAPER,
              border: `1px solid ${LINE}`,
              boxShadow: "0 6px 14px rgba(23,20,16,0.10)",
              transform: `rotate(${(i - 1) * 5}deg)`,
              opacity: 0.95,
            }}
          >
            <div style={{ fontFamily: MONO_STACK, fontSize: 13, color: MUTED, padding: "8px 10px" }}>发票 {i + 1}</div>
            <div style={{ margin: "4px 10px", height: 5, borderRadius: 3, background: "rgba(23,20,16,0.12)" }} />
            <div style={{ margin: "8px 10px", height: 5, width: "60%", borderRadius: 3, background: "rgba(23,20,16,0.10)" }} />
            <div style={{ margin: "8px 10px", height: 26, borderRadius: 4, background: "rgba(184,70,44,0.12)" }} />
          </div>
        ))}
        <div style={{ position: "absolute", left: 18, bottom: -6, display: "flex", alignItems: "center", gap: 8 }}>
          <Glyph kind="folder" size={26} color={MUTED} />
          <div style={{ fontFamily: MONO_STACK, fontSize: 18, color: MUTED }}>D:\发票\11月</div>
        </div>
      </div>

      {/* 飞行中的发票 */}
      <div
        style={{
          position: "absolute",
          left: lerp(196, 452, fly),
          top: lerp(660, 806, fly),
          width: 128,
          height: 96,
          borderRadius: 8,
          background: PAPER,
          border: `2px solid ${accent}`,
          boxShadow: "0 10px 24px rgba(23,20,16,0.18)",
          opacity: fly > 0 && fly < 1 ? 0.96 : 0,
          transform: `rotate(${lerp(-8, 6, fly)}deg) scale(${0.92 + 0.14 * Math.sin(fly * Math.PI)})`,
        }}
      >
        <div style={{ fontFamily: MONO_STACK, fontSize: 14, color: accent, padding: "8px 10px" }}>invoice.pdf</div>
        <div style={{ margin: "2px 10px", height: 4, borderRadius: 2, background: "rgba(23,20,16,0.14)" }} />
      </div>

      {/* 报销单窗口 */}
      <WindowFrame x={430} y={452} w={586} h={716} title="差旅报销单 · 2041" accent={accent} opacity={inA} scale={0.98 + inA * 0.02}>
        <div style={{ padding: "22px 26px" }}>
          {FIELDS.map((f, i) => {
            const t = clamp01((filled - i * 0.16) / 0.2);
            return (
              <div key={f.k} style={{ display: "flex", alignItems: "center", height: 92, borderBottom: `1px dashed ${LINE}` }}>
                <div style={{ width: 132, fontSize: 22, color: MUTED, letterSpacing: 1 }}>{f.k}</div>
                <div
                  style={{
                    flex: 1,
                    fontSize: 30,
                    fontWeight: 700,
                    color: t > 0 ? INK : "rgba(23,20,16,0.18)",
                    opacity: 0.25 + 0.75 * t,
                    transform: `translateY(${(1 - t) * 8}px)`,
                    fontFamily: f.k === "金额" || f.k === "日期" ? MONO_STACK : FONT_STACK,
                  }}
                >
                  {t > 0 ? f.v : "待识别"}
                </div>
                <div style={{ width: 30 }}>{t > 0.6 ? <CheckIcon size={28} color={accent} opacity={(t - 0.6) / 0.4} /> : null}</div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            position: "absolute",
            left: 26,
            right: 26,
            bottom: 26,
            height: 84,
            borderRadius: 12,
            background: submit ? accent : "rgba(184,70,44,0.14)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: 4,
            color: submit ? "#FFF7EC" : accent,
            transform: `scale(${submit ? 1 : 0.98})`,
            boxShadow: submit ? "0 10px 24px rgba(184,70,44,0.3)" : "none",
          }}
        >
          {submit ? "已提交 ✓" : "提交单据"}
        </div>
      </WindowFrame>

      {/* 本月进度 */}
      <div style={{ position: "absolute", left: 58, top: 912, width: 300, opacity: clamp01((p - 0.3) / 0.15) }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 20, color: MUTED }}>本月已处理</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
          <div style={{ fontFamily: MONO_STACK, fontSize: 58, fontWeight: 800, color: accent }}>7</div>
          <div style={{ fontFamily: MONO_STACK, fontSize: 26, color: MUTED }}>/ 30 张</div>
        </div>
        <div style={{ marginTop: 10, height: 8, borderRadius: 4, background: "rgba(23,20,16,0.12)", overflow: "hidden" }}>
          <div style={{ width: `${(7 / 30) * 100 * clamp01((p - 0.3) / 0.2)}%`, height: "100%", background: accent }} />
        </div>
      </div>

      <Watermark text="vibe 知识大赏 · 科普" light />
    </AbsoluteFill>
  );
};

export default Scene04;
