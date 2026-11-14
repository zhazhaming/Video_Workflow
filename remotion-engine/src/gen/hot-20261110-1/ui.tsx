// hot-20261110-1 · 视觉系统：浅纸行情 / 墨线 + 涨红 + 跌绿 + 细网格
// 约束：动画只由 p 驱动；只用 transform / opacity；浅纸底，不出现霓虹深底与紫色渐变。
import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";

export const INK = "#1B1815";
export const INK_SOFT = "#4A4339";
export const FAINT = "#8B8172";
export const RED = "#C8452D";
export const RED_SOFT = "#D98B79";
export const BLUE = "#456070";
export const BLUE_SOFT = "#93AAB6";
export const GOLD = "#A97C33";
export const GREEN = "#3F6B52";
export const GREEN_SOFT = "#7E9C88";
export const PAPER = "#FBF7EF";
export const SERIF_STACK = '"Songti SC", "SimSun", "STSong", "Noto Serif SC", serif';
export { FONT_STACK, MONO_STACK };

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / Math.max(1e-6, b - a));
export const eo = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const ei = (t: number) => Math.pow(clamp01(t), 3);
export const eio = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const eoq = (t: number) => 1 - Math.pow(1 - clamp01(t), 4);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);
export const pop = (t: number) => {
  const x = clamp01(t);
  if (x >= 1) return 1;
  return 1 - Math.pow(2, -9 * x) * Math.cos((x * 9 - 0.6) * Math.PI);
};

/** 纸底：暖色渐变 + 两团低饱和光 + 档案网格 + 四角裁切标 + 细纸纹 */
export const Paper: React.FC<{ c1: string; c2: string; accent?: string; grid?: boolean }> = ({
  c1,
  c2,
  accent = RED,
  grid = true,
}) => (
  <AbsoluteFill style={{ background: `linear-gradient(156deg, ${c1} 0%, ${c2} 100%)`, overflow: "hidden" }}>
    <div
      style={{
        position: "absolute", left: -220, top: -180, width: 900, height: 900, borderRadius: "50%",
        background: `radial-gradient(circle, ${accent}12 0%, transparent 66%)`,
      }}
    />
    <div
      style={{
        position: "absolute", right: -240, bottom: -220, width: 880, height: 880, borderRadius: "50%",
        background: `radial-gradient(circle, ${INK}0D 0%, transparent 68%)`,
      }}
    />
    <div
      style={{
        position: "absolute", inset: 0,
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(24,22,19,0.026) 0px, rgba(24,22,19,0.026) 1px, transparent 1px, transparent 4px)",
        opacity: 0.55,
      }}
    />
    {grid
      ? [0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute", left: 108 + i * 144, top: 300, width: 1, height: 1010,
              background: INK, opacity: 0.045,
            }}
          />
        ))
      : null}
    {[
      [104, 292], [976, 292], [104, 1330], [976, 1330],
    ].map(([x, y], i) => (
      <React.Fragment key={i}>
        <div style={{ position: "absolute", left: x - 10, top: y, width: 20, height: 1, background: INK, opacity: 0.24 }} />
        <div style={{ position: "absolute", left: x, top: y - 10, width: 1, height: 20, background: INK, opacity: 0.24 }} />
      </React.Fragment>
    ))}
  </AbsoluteFill>
);

export const Cap: React.FC<{
  text: string;
  x?: number;
  y?: number;
  align?: "left" | "right" | "center";
  color?: string;
  size?: number;
  opacity?: number;
  style?: React.CSSProperties;
}> = ({ text, x = 108, y = 300, align = "left", color = FAINT, size = 21, opacity = 1, style }) => (
  <div
    style={{
      position: "absolute",
      left: align === "center" ? 0 : align === "right" ? undefined : x,
      right: align === "center" ? 0 : align === "right" ? 1080 - x : undefined,
      top: y,
      textAlign: align === "center" ? "center" : align,
      fontFamily: MONO_STACK,
      fontSize: size,
      letterSpacing: 4,
      color,
      opacity,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {text}
  </div>
);

export const Hair: React.FC<{
  x?: number; y: number; w: number; color?: string; thickness?: number; progress?: number; opacity?: number;
}> = ({ x = 108, y, w, color = INK, thickness = 1, progress = 1, opacity = 0.22 }) => (
  <div
    style={{
      position: "absolute", left: x, top: y, width: Math.max(0.5, w * clamp01(progress)),
      height: thickness, background: color, opacity,
    }}
  />
);

export const Card: React.FC<{
  x: number; y: number; w: number; h: number;
  children?: React.ReactNode;
  opacity?: number;
  rotate?: number;
  scale?: number;
  dashed?: boolean;
  flat?: boolean;
  accent?: string;
  style?: React.CSSProperties;
}> = ({ x, y, w, h, children, opacity = 1, rotate = 0, scale = 1, dashed = false, flat = false, accent = RED, style }) => (
  <div
    style={{
      position: "absolute", left: x, top: y, width: w, height: h,
      background: flat ? "transparent" : "rgba(252,248,240,0.94)",
      border: dashed ? `1.5px dashed ${INK}55` : `1px solid ${INK}22`,
      borderRadius: 8,
      boxShadow: flat ? "none" : `0 14px 34px ${INK}14, inset 0 0 0 1px rgba(255,255,255,0.55)`,
      opacity,
      transform: `translate(-50%,-50%) rotate(${rotate}deg) scale(${scale})`,
      transformOrigin: "50% 50%",
      ...style,
    }}
  >
    {!flat ? (
      <div style={{ position: "absolute", left: 0, top: 0, width: 4, height: h, background: accent, opacity: 0.5, borderRadius: "8px 0 0 8px" }} />
    ) : null}
    {children}
  </div>
);

export const Chip: React.FC<{
  text: string; x: number; y: number; w?: number;
  color?: string; bg?: string; opacity?: number; size?: number; align?: "left" | "center"; mono?: boolean;
}> = ({ text, x, y, w, color = INK, bg = "rgba(24,22,19,0.06)", opacity = 1, size = 22, align = "center", mono = true }) => (
  <div
    style={{
      position: "absolute", left: x, top: y, width: w, height: size * 2.1,
      display: "flex", alignItems: "center", justifyContent: align === "center" ? "center" : "flex-start",
      paddingLeft: align === "center" ? 0 : size * 0.8,
      boxSizing: "border-box",
      background: bg, color, borderRadius: 999,
      fontFamily: mono ? MONO_STACK : FONT_STACK,
      fontSize: size, letterSpacing: mono ? 2 : 0, fontWeight: mono ? 500 : 700,
      opacity, whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

/** 竖线箭头（带绘制进度） */
export const VArrow: React.FC<{
  x: number; y1: number; y2: number; progress?: number; color?: string; opacity?: number;
}> = ({ x, y1, y2, progress = 1, color = INK, opacity = 0.35 }) => {
  const len = Math.max(0, (y2 - y1) * clamp01(progress));
  return (
    <div style={{ position: "absolute", left: x, top: y1, width: 2, height: len, background: color, opacity }}>
      <div
        style={{
          position: "absolute", left: -5, top: Math.max(0, len - 6), width: 0, height: 0,
          borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
          borderTop: `8px solid ${color}`, opacity: progress > 0.02 ? 1 : 0,
        }}
      />
    </div>
  );
};

/** 横线箭头 */
export const HArrow: React.FC<{
  x1: number; x2: number; y: number; progress?: number; color?: string; opacity?: number;
}> = ({ x1, x2, y, progress = 1, color = INK, opacity = 0.35 }) => {
  const len = Math.max(0, (x2 - x1) * clamp01(progress));
  return (
    <div style={{ position: "absolute", left: x1, top: y, width: len, height: 2, background: color, opacity }}>
      <div
        style={{
          position: "absolute", left: len - 1, top: -5, width: 0, height: 0,
          borderTop: "6px solid transparent", borderBottom: "6px solid transparent",
          borderLeft: `9px solid ${color}`, opacity: progress > 0.02 ? 1 : 0,
        }}
      />
    </div>
  );
};

export const Stamp: React.FC<{
  text: string; sub?: string; x: number; y: number; size?: number; rotate?: number; t?: number; color?: string; filled?: boolean; w?: number;
}> = ({ text, sub, x, y, size = 40, rotate = -8, t = 1, color = RED, filled = false, w }) => {
  const s = 1.45 - 0.45 * pop(t);
  return (
    <div
      style={{
        position: "absolute", left: x, top: y, width: w,
        transform: `translate(-50%,-50%) rotate(${rotate}deg) scale(${s})`,
        opacity: clamp01(t * 2.4),
        border: `4px solid ${color}`, color: filled ? "#FBF6EC" : color,
        background: filled ? color : "rgba(251,246,236,0.35)", borderRadius: 5,
        padding: `${size * 0.1}px ${size * 0.24}px`,
        fontFamily: SERIF_STACK, fontSize: size, fontWeight: 700, letterSpacing: 3,
        lineHeight: 1.08, whiteSpace: "nowrap", textAlign: "center",
      }}
    >
      <div>{text}</div>
      {sub ? (
        <div style={{ fontFamily: MONO_STACK, fontSize: Math.max(11, size * 0.3), letterSpacing: 2, marginTop: 6, opacity: 0.85 }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
};

export const Dot: React.FC<{ x: number; y: number; r?: number; color?: string; opacity?: number }> = ({
  x, y, r = 6, color = RED, opacity = 1,
}) => (
  <div
    style={{
      position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2,
      borderRadius: r, background: color, opacity,
      boxShadow: `0 0 0 4px ${color}18`,
    }}
  />
);

/** 小服务器机架图标：用于“算力扩张” */
export const Rack: React.FC<{ x: number; y: number; w?: number; h?: number; color?: string; opacity?: number; filled?: number }> = ({
  x, y, w = 54, h = 92, color = INK, opacity = 1, filled = 0.7,
}) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity }}>
    <div style={{ position: "absolute", inset: 0, border: `1.6px solid ${color}`, borderRadius: 4 }} />
    {[0, 1, 2, 3].map((i) => (
      <div
        key={i}
        style={{
          position: "absolute", left: w * 0.14, top: h * (0.12 + i * 0.2), width: w * 0.72, height: h * 0.11,
          background: i / 4 < filled ? color : "transparent", opacity: i / 4 < filled ? 0.75 : 0.22,
          border: `1px solid ${color}`,
        }}
      />
    ))}
    <div style={{ position: "absolute", right: w * 0.14, bottom: h * 0.04, width: 4, height: 4, borderRadius: 2, background: RED }} />
  </div>
);

/** 电表 / 仪表盘（半圆弧） */
export const Gauge: React.FC<{
  cx: number; cy: number; r: number; value: number; max: number;
  color?: string; track?: string; thickness?: number; start?: number; end?: number; opacity?: number;
}> = ({ cx, cy, r, value, max, color = RED, track = "rgba(23,21,18,0.13)", thickness = 18, start = 160, end = 20, opacity = 1 }) => {
  const p = clamp01(value / max);
  const a0 = (start * Math.PI) / 180;
  const a1 = (end * Math.PI) / 180;
  const a = a0 + (a1 - a0) * p;
  const pt = (ang: number, rr: number) => `${cx + Math.cos(ang) * rr} ${cy + Math.sin(ang) * rr}`;
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity }}>
      <path d={`M ${pt(a0, r)} A ${r} ${r} 0 ${large} 0 ${pt(a1, r)}`} fill="none" stroke={track} strokeWidth={thickness} strokeLinecap="round" />
      <path d={`M ${pt(a0, r)} A ${r} ${r} 0 ${large} 0 ${pt(a, r)}`} fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + Math.cos(a) * (r - 34)} y2={cy + Math.sin(a) * (r - 34)} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={12} fill={INK} />
    </svg>
  );
};
