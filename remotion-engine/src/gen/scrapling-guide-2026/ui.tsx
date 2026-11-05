// agent-desktop-2026 场景共用零件：纸感窗口 / 标签 / 光标 / 图标。
// 只在 src/gen/agent-desktop-2026/ 下使用，不改引擎。
import React from "react";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const INK = "#171410";
export const MUTED = "rgba(23,20,16,0.62)";
export const LINE = "rgba(23,20,16,0.16)";
export const PAPER = "#FFFCF4";
export const SHADOW = "0 22px 54px rgba(23,20,16,0.16), 0 3px 10px rgba(23,20,16,0.08)";

/** macOS 风格窗口卡：标题栏 + 三色点 + 内容区 */
export const WindowFrame: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  accent: string;
  children?: React.ReactNode;
  opacity?: number;
  scale?: number;
  bg?: string;
  barBg?: string;
}> = ({ x, y, w, h, title, accent, children, opacity = 1, scale = 1, bg = PAPER, barBg = "#F1EBDE" }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: 22,
      background: bg,
      boxShadow: SHADOW,
      overflow: "hidden",
      opacity,
      transform: `scale(${scale})`,
      transformOrigin: "center center",
      border: "1px solid rgba(23,20,16,0.08)",
    }}
  >
    <div
      style={{
        height: 56,
        background: barBg,
        borderBottom: "1px solid rgba(23,20,16,0.10)",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 10,
      }}
    >
      {["#E4695B", "#E7B44E", "#6FBF73"].map((c) => (
        <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c, opacity: 0.9 }} />
      ))}
      <div
        style={{
          marginLeft: 14,
          fontFamily: FONT_STACK,
          fontSize: 24,
          fontWeight: 600,
          color: MUTED,
          letterSpacing: 1,
        }}
      >
        {title}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ width: 46, height: 8, borderRadius: 4, background: accent, opacity: 0.55 }} />
    </div>
    <div style={{ position: "relative", height: h - 56 }}>{children}</div>
  </div>
);

/** 等宽 ref 徽章：@snapshot:eN */
export const RefBadge: React.FC<{
  text: string;
  accent: string;
  opacity?: number;
  scale?: number;
  size?: number;
  solid?: boolean;
}> = ({ text, accent, opacity = 1, scale = 1, size = 24, solid = false }) => (
  <div
    style={{
      display: "inline-block",
      fontFamily: MONO_STACK,
      fontSize: size,
      lineHeight: 1.25,
      padding: `${Math.round(size * 0.32)}px ${Math.round(size * 0.6)}px`,
      borderRadius: 8,
      border: `2px ${solid ? "solid" : "dashed"} ${accent}`,
      background: solid ? accent : "rgba(184,70,44,0.08)",
      color: solid ? "#FFF9EE" : accent,
      opacity,
      transform: `scale(${scale})`,
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

/** 角色胶囊：button / text / menu … */
export const RoleChip: React.FC<{ label: string; color: string; opacity?: number }> = ({
  label,
  color,
  opacity = 1,
}) => (
  <span
    style={{
      fontFamily: MONO_STACK,
      fontSize: 18,
      padding: "3px 10px",
      borderRadius: 6,
      color,
      border: `1px solid ${color}`,
      opacity,
      letterSpacing: 0.5,
    }}
  >
    {label}
  </span>
);

export const CheckIcon: React.FC<{ size?: number; color?: string; opacity?: number; strokeWidth?: number }> = ({
  size = 26,
  color = "#2C6E49",
  opacity = 1,
  strokeWidth = 3.4,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ opacity }}>
    <path d="M4 12.5l5.2 5.2L20 6.6" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CrossIcon: React.FC<{ size?: number; color?: string; opacity?: number }> = ({
  size = 26,
  color = "#B8462C",
  opacity = 1,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ opacity }}>
    <path d="M5 5l14 14M19 5L5 19" fill="none" stroke={color} strokeWidth={3.6} strokeLinecap="round" />
  </svg>
);

/** 鼠标箭头（纯 SVG，跟着 p 移动） */
export const Cursor: React.FC<{ x: number; y: number; scale?: number; opacity?: number; color?: string }> = ({
  x,
  y,
  scale = 1,
  opacity = 1,
  color = INK,
}) => (
  <svg
    width={46 * scale}
    height={58 * scale}
    viewBox="0 0 46 58"
    style={{ position: "absolute", left: x, top: y, opacity, filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.28))" }}
  >
    <path d="M4 2l34 26-15 2.5 8.5 17-8.5 4-8.5-17L4 44z" fill={color} stroke="#FFFCF4" strokeWidth={2.4} strokeLinejoin="round" />
  </svg>
);

/** 小图标集（线性，纸感配色） */
export const Glyph: React.FC<{ kind: "download" | "camera" | "loop" | "folder" | "clock" | "shield" | "bookmark" | "warn" | "grid"; size?: number; color?: string; opacity?: number }> = ({
  kind,
  size = 44,
  color = INK,
  opacity = 1,
}) => {
  const common = { fill: "none", stroke: color, strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ opacity }}>
      {kind === "download" && (
        <>
          <path d="M24 8v22" {...common} />
          <path d="M15 22l9 9 9-9" {...common} />
          <path d="M9 38h30" {...common} />
        </>
      )}
      {kind === "camera" && (
        <>
          <rect x="6" y="14" width="36" height="26" rx="5" {...common} />
          <path d="M17 14l3-5h8l3 5" {...common} />
          <circle cx="24" cy="27" r="7" {...common} />
        </>
      )}
      {kind === "loop" && (
        <>
          <path d="M36 18a14 14 0 10 2 12" {...common} />
          <path d="M36 8v10H26" {...common} />
        </>
      )}
      {kind === "folder" && (
        <>
          <path d="M6 14h12l4 5h20v20a3 3 0 01-3 3H9a3 3 0 01-3-3z" {...common} />
          <path d="M6 24h36" {...common} />
        </>
      )}
      {kind === "clock" && (
        <>
          <circle cx="24" cy="25" r="16" {...common} />
          <path d="M24 15v10l7 5" {...common} />
        </>
      )}
      {kind === "shield" && (
        <>
          <path d="M24 6l16 6v12c0 10-7 16-16 20-9-4-16-10-16-20V12z" {...common} />
          <path d="M17 24l5 5 9-10" {...common} />
        </>
      )}
      {kind === "bookmark" && <path d="M12 6h24v36l-12-9-12 9z" {...common} />}
      {kind === "warn" && (
        <>
          <path d="M24 7l19 33H5z" {...common} />
          <path d="M24 19v11" {...common} />
          <circle cx="24" cy="36" r="1.6" fill={color} />
        </>
      )}
      {kind === "grid" && (
        <>
          <rect x="7" y="7" width="14" height="14" rx="3" {...common} />
          <rect x="27" y="7" width="14" height="14" rx="3" {...common} />
          <rect x="7" y="27" width="14" height="14" rx="3" {...common} />
          <rect x="27" y="27" width="14" height="14" rx="3" {...common} />
        </>
      )}
    </svg>
  );
};

/** 章节角标：例如「场景 1 / 3」 */
export const ChapterTag: React.FC<{ text: string; accent: string; opacity?: number }> = ({ text, accent, opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: 72,
      top: 250,
      fontFamily: FONT_STACK,
      fontSize: 24,
      letterSpacing: 3,
      color: accent,
      borderLeft: `4px solid ${accent}`,
      paddingLeft: 12,
      opacity,
      fontWeight: 700,
    }}
  >
    {text}
  </div>
);
