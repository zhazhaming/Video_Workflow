// autoloop-2026 · 视觉系统：浅纸编辑信息图 / 墨线 + 青绿 + 朱砂
// 约束：动画只由 p 驱动；只用 transform / opacity；不出现霓虹深底、紫色渐变。
import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";

export const INK = "#181613";
export const INK_SOFT = "#494338";
export const FAINT = "#8B8172";
export const TEAL = "#1F5F57";
export const TEAL_SOFT = "#6E938B";
export const RED = "#B4482E";
export const GOLD = "#A97C33";
export const PAPER = "#F6F0E5";
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

/** 纸底：暖色渐变 + 两团低饱和光 + 六栏网格 + 四角裁切标 + 细纸纹 */
export const Paper: React.FC<{ c1: string; c2: string; accent?: string; grid?: boolean }> = ({
  c1,
  c2,
  accent = TEAL,
  grid = true,
}) => (
  <AbsoluteFill style={{ background: `linear-gradient(156deg, ${c1} 0%, ${c2} 100%)`, overflow: "hidden" }}>
    <div
      style={{
        position: "absolute", left: -220, top: -180, width: 900, height: 900, borderRadius: "50%",
        background: `radial-gradient(circle, ${accent}14 0%, transparent 66%)`,
      }}
    />
    <div
      style={{
        position: "absolute", right: -240, bottom: -200, width: 860, height: 860, borderRadius: "50%",
        background: `radial-gradient(circle, ${INK}0D 0%, transparent 68%)`,
      }}
    />
    <div
      style={{
        position: "absolute", inset: 0,
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(24,22,19,0.028) 0px, rgba(24,22,19,0.028) 1px, transparent 1px, transparent 4px)",
        opacity: 0.5,
      }}
    />
    {grid
      ? [0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute", left: 150 + i * 125, top: 310, width: 1, height: 960,
              background: INK, opacity: 0.05,
            }}
          />
        ))
      : null}
    {[
      [150, 310], [900, 310], [150, 1270], [900, 1270],
    ].map(([x, y], i) => (
      <React.Fragment key={i}>
        <div style={{ position: "absolute", left: x - 9, top: y, width: 18, height: 1, background: INK, opacity: 0.26 }} />
        <div style={{ position: "absolute", left: x, top: y - 9, width: 1, height: 18, background: INK, opacity: 0.26 }} />
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
}> = ({ text, x = 150, y = 330, align = "left", color = FAINT, size = 22, opacity = 1, style }) => (
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
  x?: number; y: number; w: number; color?: string; thickness?: number; progress?: number; opacity?: number;
}> = ({ x = 150, y, w, color = INK, thickness = 1, progress = 1, opacity = 0.22 }) => (
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
}> = ({ x, y, w, h, children, opacity = 1, rotate = 0, scale = 1, dashed = false, flat = false, accent = TEAL, style }) => (
  <div
    style={{
      position: "absolute", left: x, top: y, width: w, height: h,
      background: flat ? "transparent" : "rgba(251,247,239,0.92)",
      border: dashed ? `1.5px dashed ${INK}55` : `1px solid ${INK}22`,
      borderRadius: 10,
      boxShadow: flat ? "none" : `0 16px 40px ${INK}16, inset 0 0 0 1px rgba(255,255,255,0.55)`,
      opacity,
      transform: `translate(-50%,-50%) rotate(${rotate}deg) scale(${scale})`,
      transformOrigin: "50% 50%",
      ...style,
    }}
  >
    {!flat ? (
      <div style={{ position: "absolute", left: 0, top: 0, width: 4, height: h, background: accent, opacity: 0.55, borderRadius: "10px 0 0 10px" }} />
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

/** 竖向流程箭头（带绘制进度） */
export const VArrow: React.FC<{
  x: number; y1: number; y2: number; progress?: number; color?: string; opacity?: number; dashed?: boolean;
}> = ({ x, y1, y2, progress = 1, color = INK, opacity = 0.35, dashed = false }) => {
  const len = Math.max(0, (y2 - y1) * clamp01(progress));
  return (
    <div style={{ position: "absolute", left: x, top: y1, width: 2, height: len, background: color, opacity }}>
      {dashed ? (
        <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(180deg, ${color} 0 6px, transparent 6px 14px)` }} />
      ) : null}
      <div
        style={{
          position: "absolute", left: -5, top: len - 6, width: 0, height: 0,
          borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
          borderTop: `8px solid ${color}`, opacity: progress > 0.02 ? 1 : 0,
        }}
      />
    </div>
  );
};

/** 横向流程箭头 */
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

/** 深色只用在“终端窗口”这一小块，不铺满画面 */
export const TermWin: React.FC<{
  x: number; y: number; w: number; h: number; title?: string; opacity?: number; scale?: number; rotate?: number;
  children?: React.ReactNode; dark?: boolean;
}> = ({ x, y, w, h, title = "terminal", opacity = 1, scale = 1, rotate = 0, children, dark = true }) => (
  <div
    style={{
      position: "absolute", left: x, top: y, width: w, height: h,
      transform: `translate(-50%,-50%) rotate(${rotate}deg) scale(${scale})`,
      background: dark ? "#23211D" : "rgba(251,247,239,0.96)",
      border: dark ? "1px solid #3A362F" : `1px solid ${INK}22`,
      borderRadius: 12, overflow: "hidden",
      boxShadow: `0 24px 54px ${INK}40`,
      opacity,
    }}
  >
    <div
      style={{
        height: 46, display: "flex", alignItems: "center", gap: 8, paddingLeft: 18,
        background: dark ? "#2C2924" : "rgba(24,22,19,0.05)",
        borderBottom: dark ? "1px solid #3A362F" : `1px solid ${INK}18`,
      }}
    >
      {["#B4482E", "#A97C33", "#4E7A63"].map((c, i) => (
        <div key={i} style={{ width: 11, height: 11, borderRadius: 6, background: c, opacity: 0.85 }} />
      ))}
      <div style={{ marginLeft: 14, fontFamily: MONO_STACK, fontSize: 17, letterSpacing: 2, color: dark ? "#B7AF9F" : FAINT }}>
        {title}
      </div>
    </div>
    {children}
  </div>
);

export const Stamp: React.FC<{
  text: string; x: number; y: number; size?: number; rotate?: number; t?: number; color?: string; filled?: boolean;
}> = ({ text, x, y, size = 44, rotate = -9, t = 1, color = RED, filled = false }) => {
  const s = 1.45 - 0.45 * pop(t);
  return (
    <div
      style={{
        position: "absolute", left: x, top: y,
        transform: `translate(-50%,-50%) rotate(${rotate}deg) scale(${s})`,
        opacity: clamp01(t * 2.4),
        border: `4px solid ${color}`, color: filled ? "#FBF6EC" : color,
        background: filled ? color : "transparent", borderRadius: 6,
        padding: `${size * 0.12}px ${size * 0.28}px`,
        fontFamily: SERIF_STACK, fontSize: size, fontWeight: 700, letterSpacing: 5,
        lineHeight: 1.1, whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

export const Dot: React.FC<{ x: number; y: number; r?: number; color?: string; opacity?: number }> = ({
  x, y, r = 6, color = TEAL, opacity = 1,
}) => (
  <div
    style={{
      position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2,
      borderRadius: r, background: color, opacity,
      boxShadow: `0 0 0 4px ${color}18`,
    }}
  />
);
