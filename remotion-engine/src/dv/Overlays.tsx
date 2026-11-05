// 逐镜动效浮层（DVOverlay）：counter / typewriter / chat / stat / toast / terminal。
// 与 backend schemas.OverlaySpec 对齐；全部确定性动画。
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { FONT_STACK, MONO_STACK, clamp } from "./atmosphere";
import type { OverlaySpec } from "./types";

const fmt = (v: number) => {
  if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(1)}万`;
  return Number.isInteger(v) ? `${v}` : v.toFixed(1);
};

const TONE_BG: Record<string, string> = {
  error: "#e5484d",
  info: "#3b82f6",
  success: "#30a46c",
};

const slideIn = (f: number) => {
  const t = clamp(f / 9, 0, 1);
  const e = t * t * (3 - 2 * t);
  return { opacity: e, transform: `translateY(${(1 - e) * 44}px)` };
};

const Card: React.FC<{ children: React.ReactNode; align?: string }> = ({ children, align }) => (
  <div
    style={{
      position: "absolute",
      top: 360,
      left: align === "left" ? 72 : undefined,
      right: align === "right" ? 72 : undefined,
      margin: "0 auto",
      width: "fit-content",
      maxWidth: 900,
      zIndex: 40,
    }}
  >
    {children}
  </div>
);

export const DVOverlay: React.FC<{ spec: OverlaySpec; accent: string }> = ({ spec, accent }) => {
  const frame = useCurrentFrame();
  const anim = slideIn(frame);

  switch (spec.kind) {
    case "counter": {
      const target = spec.value ?? 100;
      const v = interpolate(clamp((frame - 6) / 36, 0, 1), [0, 1], [0, target]);
      return (
        <Card>
          <div
            style={{
              ...anim,
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              color: "#fff",
              fontFamily: FONT_STACK,
              textShadow: "0 3px 16px rgba(0,0,0,0.5)",
            }}
          >
            <span style={{ fontSize: 120, fontWeight: 900, color: accent }}>{fmt(v)}</span>
            {spec.unit && <span style={{ fontSize: 40, fontWeight: 700 }}>{spec.unit}</span>}
          </div>
          {spec.label && (
            <div style={{ ...anim, color: "rgba(255,255,255,0.85)", fontSize: 34, fontWeight: 600, marginTop: 8, textAlign: "center" }}>
              {spec.label}
            </div>
          )}
        </Card>
      );
    }
    case "stat": {
      const from = spec.from ?? 0;
      const to = spec.to ?? spec.value ?? 100;
      const v = interpolate(clamp((frame - 6) / 42, 0, 1), [0, 1], [from, to]);
      return (
        <Card>
          <div style={{ ...anim, textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 10 }}>
              <span style={{ fontSize: 96, fontWeight: 900, color: "#fff", fontFamily: FONT_STACK }}>
                {fmt(v)}
              </span>
              {spec.unit && (
                <span style={{ fontSize: 36, color: "rgba(255,255,255,0.9)", fontWeight: 700 }}>{spec.unit}</span>
              )}
            </div>
            <div
              style={{
                marginTop: 10,
                height: 10,
                borderRadius: 5,
                background: "rgba(255,255,255,0.2)",
                overflow: "hidden",
                width: 420,
                margin: "10px auto 0",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${clamp((v - from) / Math.max(1e-6, to - from), 0, 1) * 100}%`,
                  background: accent,
                }}
              />
            </div>
            {spec.label && (
              <div style={{ marginTop: 12, color: "rgba(255,255,255,0.85)", fontSize: 32, fontWeight: 600 }}>
                {spec.label}
              </div>
            )}
          </div>
        </Card>
      );
    }
    case "typewriter": {
      const full = spec.text ?? "";
      const chars = Math.floor(clamp((frame - 4) / 2.2, 0, full.length));
      return (
        <Card>
          <div
            style={{
              ...anim,
              background: "rgba(10,10,16,0.62)",
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: 20,
              padding: "26px 34px",
              color: "#fff",
              fontFamily: FONT_STACK,
              fontSize: 44,
              fontWeight: 700,
              lineHeight: 1.45,
              maxWidth: 860,
            }}
          >
            {full.slice(0, chars)}
            {chars < full.length && <span style={{ color: accent }}>▌</span>}
          </div>
        </Card>
      );
    }
    case "chat": {
      const mine = spec.side === "right";
      return (
        <div
          style={{
            position: "absolute",
            top: 420,
            left: 72,
            right: 72,
            display: "flex",
            justifyContent: mine ? "flex-end" : "flex-start",
            zIndex: 40,
          }}
        >
          <div style={{ ...anim, maxWidth: 760 }}>
            {spec.name && (
              <div
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 30,
                  fontWeight: 600,
                  marginBottom: 10,
                  textAlign: mine ? "right" : "left",
                }}
              >
                {spec.name}
              </div>
            )}
            <div
              style={{
                background: mine ? accent : "rgba(255,255,255,0.94)",
                color: mine ? "#101018" : "#14141c",
                borderRadius: 28,
                padding: "26px 36px",
                fontSize: 44,
                fontWeight: 700,
                fontFamily: FONT_STACK,
                lineHeight: 1.4,
                boxShadow: "0 10px 34px rgba(0,0,0,0.35)",
              }}
            >
              {spec.text}
            </div>
          </div>
        </div>
      );
    }
    case "toast": {
      const bg = TONE_BG[spec.tone ?? "info"] ?? "#3b82f6";
      return (
        <Card>
          <div
            style={{
              ...anim,
              background: bg,
              color: "#fff",
              borderRadius: 999,
              padding: "20px 44px",
              fontSize: 40,
              fontWeight: 800,
              fontFamily: FONT_STACK,
              boxShadow: `0 12px 40px ${bg}66`,
              whiteSpace: "nowrap",
            }}
          >
            {spec.text}
          </div>
        </Card>
      );
    }
    case "terminal": {
      const lines = spec.lines ?? [];
      const shown = Math.floor(clamp((frame - 6) / 14, 0, lines.length));
      return (
        <Card>
          <div
            style={{
              ...anim,
              background: "rgba(8,10,14,0.82)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 18,
              padding: "28px 34px",
              fontFamily: MONO_STACK,
              minWidth: 620,
            }}
          >
            {lines.slice(0, shown).map((l, i) => (
              <div
                key={i}
                style={{
                  color: i === shown - 1 ? accent : "#d6e2f0",
                  fontSize: 34,
                  lineHeight: 1.6,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: "#5b6b7f" }}>$ </span>
                {l}
              </div>
            ))}
            <span style={{ color: accent, fontSize: 34 }}>▌</span>
          </div>
        </Card>
      );
    }
    default:
      return null;
  }
};
