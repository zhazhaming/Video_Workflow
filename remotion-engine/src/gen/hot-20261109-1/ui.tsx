// hot-20261109-1 · 视觉系统（浅纸底 / 编辑信息图 / 朱红强调）
// 约束：动画只由 p 驱动；只用 transform / opacity；不出现深底、霓虹、紫渐变。
import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";

export const INK = "#1B1815";
export const INK_SOFT = "#4C463C";
export const FAINT = "#8C8375";
export const RED = "#C8452D";
export const GOLD = "#A97C33";
export const BLUE = "#3F6A85";
export const PAPER = "#F5F0E7";

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

export const MARGIN = 96;

export const Paper: React.FC<{ c1: string; c2: string; accent?: string; grid?: boolean }> = ({
  c1,
  c2,
  accent = RED,
  grid = true,
}) => {
  const gut = 888 / 6;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(158deg, ${c1} 0%, ${c2} 100%)` }}>
      <div
        style={{
          position: "absolute",
          left: -160,
          top: -120,
          width: 980,
          height: 980,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}12 0%, transparent 68%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -200,
          bottom: -160,
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${INK}0C 0%, transparent 70%)`,
        }}
      />
      {grid
        ? [0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: MARGIN + i * gut,
                top: 300,
                width: 1,
                height: 1010,
                background: INK,
                opacity: 0.04,
              }}
            />
          ))
        : null}
    </AbsoluteFill>
  );
};

export const Cap: React.FC<{
  text: string;
  x?: number;
  y?: number;
  align?: "left" | "right" | "center";
  color?: string;
  size?: number;
  opacity?: number;
  style?: React.CSSProperties;
}> = ({ text, x = MARGIN, y = 300, align = "left", color = FAINT, size = 22, opacity = 1, style }) => (
  <div
    style={{
      position: "absolute",
      left: align === "center" ? 0 : align === "right" ? undefined : x,
      right: align === "center" ? 0 : align === "right" ? 1080 - x : undefined,
      top: y,
      textAlign: align === "center" ? "center" : align,
      fontFamily: MONO_STACK,
      fontSize: size,
      letterSpacing: 5,
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
  x?: number;
  y: number;
  w: number;
  color?: string;
  thickness?: number;
  progress?: number;
  opacity?: number;
}> = ({ x = MARGIN, y, w, color = INK, thickness = 1, progress = 1, opacity = 0.22 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: Math.max(0.5, w * clamp01(progress)),
      height: thickness,
      background: color,
      opacity,
    }}
  />
);

export const Stamp: React.FC<{
  text: string;
  x: number;
  y: number;
  size?: number;
  rotate?: number;
  t?: number;
  color?: string;
  filled?: boolean;
}> = ({ text, x, y, size = 54, rotate = -8, t = 1, color = RED, filled = false }) => {
  const s = 1.5 - 0.5 * pop(t);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${s})`,
        opacity: clamp01(t * 2.4),
        border: `4px solid ${color}`,
        color: filled ? "#FBF6EC" : color,
        background: filled ? color : "transparent",
        borderRadius: 4,
        padding: `${size * 0.12}px ${size * 0.26}px`,
        fontFamily: SERIF_STACK,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: 4,
        lineHeight: 1.1,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

export const BigNum: React.FC<{
  value: number;
  x: number;
  y: number;
  size?: number;
  color?: string;
  suffix?: string;
  suffixColor?: string;
  opacity?: number;
  weight?: number;
}> = ({ value, x, y, size = 200, color = INK, suffix, suffixColor = RED, opacity = 1, weight = 900 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      display: "flex",
      alignItems: "flex-end",
      opacity,
      lineHeight: 0.86,
    }}
  >
    <span
      style={{
        fontFamily: FONT_STACK,
        fontSize: size,
        fontWeight: weight,
        color,
        letterSpacing: -size * 0.045,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value.toLocaleString("en-US")}
    </span>
    {suffix ? (
      <span
        style={{
          fontFamily: FONT_STACK,
          fontSize: size * 0.36,
          fontWeight: 800,
          color: suffixColor,
          marginLeft: size * 0.06,
          letterSpacing: 2,
          paddingBottom: size * 0.06,
        }}
      >
        {suffix}
      </span>
    ) : null}
  </div>
);

/** 细十字定位标（编辑排版的小零件，避免画面“空”） */
export const Cross: React.FC<{ x: number; y: number; s?: number; color?: string; opacity?: number }> = ({
  x,
  y,
  s = 7,
  color = INK,
  opacity = 0.35,
}) => (
  <div style={{ position: "absolute", left: x, top: y, opacity }}>
    <div style={{ position: "absolute", left: -s, top: 0, width: s * 2, height: 1, background: color }} />
    <div style={{ position: "absolute", left: 0, top: -s, width: 1, height: s * 2, background: color }} />
  </div>
);
