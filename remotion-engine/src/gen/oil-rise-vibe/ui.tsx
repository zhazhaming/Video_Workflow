// nasdaq-crash-vibe · 视觉系统（浅暖纸底 / 财经编辑信息图 / 朱红强调）
// 约束：全片浅色纸感；动画只由 p 驱动、只用 transform/opacity；随机只用 rand(seed+k)。
// 安全区：x 96~984，y 300~1320；顶部 y≈170 引擎镜标签（左）/品牌角标（右）；y>1360 字幕带禁放。
import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";

// ---- 色板 ----
export const INK = "#1B1815";
export const INK_SOFT = "#4C463C";
export const INK_FAINT = "#8C8375";
export const RED = "#C8452D";
export const GOLD = "#A97C33";
export const BLUE = "#3F6A85";
export const PAPER = "#F4EFE6";

export const SERIF_STACK = '"Songti SC", "SimSun", "STSong", "Noto Serif SC", serif';
export { FONT_STACK, MONO_STACK };

// ---- 安全区 ----
export const MARGIN = 96;
export const CONTENT_TOP = 300;
export const CONTENT_BOTTOM = 1320;

// ---- 缓动 ----
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
/** 轻弹簧回弹（easeOutBack）：t=0 → 0，t=1 → 1，中段过冲；只用于印章/落点小事件 */
export const pop = (t: number) => {
  const x = clamp01(t);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

/** 台词 marks 取值：marks[i]?.start，缺省回退 fallback */
export const mk = (marks: { start: number; dur: number }[] | undefined, i: number, fallback: number) =>
  marks?.[i]?.start ?? fallback;

// ---- 退场统一处理：末段 12% 整体收缩淡出（不硬切） ----
export const exitStyle = (p: number): React.CSSProperties => {
  const t = clamp01((p - 0.88) / 0.12);
  return {
    opacity: 1 - t,
    transform: `scale(${1 - 0.02 * eo(t)})`,
    transformOrigin: "50% 50%",
  };
};

// ---- 纸底 + 印刷网格 + 品牌角标 ----
export const Paper: React.FC<{
  c1: string;
  c2: string;
  accent?: string;
  grid?: boolean;
  brand?: string;
}> = ({ c1, c2, accent = RED, grid = true, brand = "VIBE 知识大赏 // MARKET LAB" }) => {
  const gut = 888 / 6;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)` }}>
      <div
        style={{
          position: "absolute",
          left: -140,
          top: -60,
          width: 880,
          height: 880,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}12 0%, transparent 68%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -160,
          bottom: -140,
          width: 820,
          height: 820,
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
                top: CONTENT_TOP - 40,
                width: 1,
                height: CONTENT_BOTTOM - CONTENT_TOP + 80,
                background: INK,
                opacity: 0.045,
              }}
            />
          ))
        : null}
      <div style={{ position: "absolute", left: MARGIN, right: MARGIN, top: CONTENT_TOP - 52, height: 1, background: INK, opacity: 0.16 }} />
      <div style={{ position: "absolute", left: MARGIN, right: MARGIN, top: CONTENT_BOTTOM + 34, height: 1, background: INK, opacity: 0.1 }} />
      {/* 品牌角标（右上） */}
      <div
        style={{
          position: "absolute",
          right: MARGIN,
          top: 176,
          fontFamily: MONO_STACK,
          fontSize: 20,
          letterSpacing: 4,
          color: INK_FAINT,
          whiteSpace: "nowrap",
        }}
      >
        {brand}
      </div>
    </AbsoluteFill>
  );
};

// ---- 等宽小标 ----
export const Cap: React.FC<{
  text: string;
  x?: number;
  y?: number;
  align?: "left" | "right" | "center";
  color?: string;
  size?: number;
  accent?: string;
  opacity?: number;
  style?: React.CSSProperties;
}> = ({ text, x = MARGIN, y = CONTENT_TOP, align = "left", color = INK_FAINT, size = 24, accent, opacity = 1, style }) => (
  <div
    style={{
      position: "absolute",
      left: align === "center" ? 0 : x,
      right: align === "center" ? 0 : undefined,
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
    {accent ? <span style={{ color: accent, marginRight: 10 }}>▍</span> : null}
    {text}
  </div>
);

// ---- 生长细线 ----
export const Hair: React.FC<{
  x?: number;
  y: number;
  w: number;
  color?: string;
  thickness?: number;
  progress?: number;
  opacity?: number;
  from?: "left" | "right" | "center";
}> = ({ x = MARGIN, y, w, color = INK, thickness = 1, progress = 1, opacity = 0.22, from = "left" }) => {
  const t = clamp01(progress);
  const width = w * t;
  const left = from === "right" ? x + w - width : from === "center" ? x + (w - width) / 2 : x;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: y,
        width,
        height: thickness,
        background: color,
        opacity,
      }}
    />
  );
};

// ---- 印章 ----
export const Stamp: React.FC<{
  text: string;
  x: number;
  y: number;
  size?: number;
  rotate?: number;
  t?: number;
  color?: string;
  border?: number;
  filled?: boolean;
}> = ({ text, x, y, size = 60, rotate = -8, t = 1, color = RED, border = 5, filled = false }) => {
  const s = 1.6 - 0.6 * pop(t);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${s})`,
        opacity: clamp01(t * 2.2),
        border: `${border}px solid ${color}`,
        color: filled ? "#FBF6EC" : color,
        background: filled ? color : "rgba(251,246,236,0.6)",
        borderRadius: 6,
        padding: `${size * 0.12}px ${size * 0.3}px`,
        fontFamily: SERIF_STACK,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: 6,
        lineHeight: 1.1,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

// ---- 等宽数字 ----
export const Num: React.FC<{
  value: number;
  decimals?: number;
  x: number;
  y: number;
  size?: number;
  color?: string;
  weight?: number;
  font?: string;
  opacity?: number;
  suffix?: string;
  suffixSize?: number;
  suffixColor?: string;
  style?: React.CSSProperties;
}> = ({
  value,
  decimals = 0,
  x,
  y,
  size = 120,
  color = INK,
  weight = 800,
  font = FONT_STACK,
  opacity = 1,
  suffix,
  suffixSize,
  suffixColor,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      fontFamily: font,
      fontSize: size,
      fontWeight: weight,
      color,
      opacity,
      lineHeight: 1,
      fontVariantNumeric: "tabular-nums",
      letterSpacing: -2,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    {suffix ? (
      <span style={{ fontSize: suffixSize ?? size * 0.34, fontWeight: 700, marginLeft: 12, color: suffixColor ?? color, letterSpacing: 2 }}>
        {suffix}
      </span>
    ) : null}
  </div>
);

// ---- 分段折线：折线图逐段揭示（只用 transform/opacity） ----
export const Polyline: React.FC<{
  points: [number, number][];
  p: number; // 0~1 揭示进度
  color?: string;
  thickness?: number;
  opacity?: number;
  dot?: boolean; // 末端行进点
  dotColor?: string;
}> = ({ points, p, color = INK, thickness = 4, opacity = 0.9, dot = true, dotColor = RED }) => {
  const total = points.length - 1;
  const t = clamp01(p) * total;
  const segs: React.ReactElement[] = [];
  for (let i = 0; i < total; i++) {
    const local = clamp01(t - i);
    if (local <= 0) continue;
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    segs.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left: x1,
          top: y1 - thickness / 2,
          width: len * local,
          height: thickness,
          background: color,
          opacity,
          transformOrigin: "0 50%",
          transform: `rotate(${angle}rad)`,
          borderRadius: thickness / 2,
        }}
      />,
    );
  }
  // 行进点：落在当前揭示前沿
  let dotEl: React.ReactElement | null = null;
  if (dot && t > 0.02 && t < total) {
    const i = Math.min(Math.floor(t), total - 1);
    const local = t - i;
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const dx = x1 + (x2 - x1) * local;
    const dy = y1 + (y2 - y1) * local;
    dotEl = (
      <div
        style={{
          position: "absolute",
          left: dx - 9,
          top: dy - 9,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: dotColor,
        }}
      />
    );
  }
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}>
      {segs}
      {dotEl}
    </div>
  );
};

// ---- 横向条形 ----
export const Bar: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  p: number;
  color?: string;
  opacity?: number;
  radius?: number;
}> = ({ x, y, w, h, p, color = RED, opacity = 1, radius = 6 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      background: color,
      opacity,
      borderRadius: radius,
      transform: `scaleX(${clamp01(p)})`,
      transformOrigin: "0 50%",
    }}
  />
);

// ---- 圆角标签 ----
export const Chip: React.FC<{
  text: string;
  x: number;
  y: number;
  t?: number;
  color?: string;
  bg?: string;
  size?: number;
}> = ({ text, x, y, t = 1, color = INK, bg = "rgba(27,24,21,0.05)", size = 26 }) => {
  const s = 1.3 - 0.3 * pop(t);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `scale(${s})`,
        transformOrigin: "0 50%",
        opacity: clamp01(t * 2),
        fontFamily: MONO_STACK,
        fontSize: size,
        letterSpacing: 2,
        color,
        background: bg,
        border: `2px solid ${color}33`,
        borderRadius: 999,
        padding: "8px 22px",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

// ---- 章节大字 ----
export const SectionNum: React.FC<{ n: number; x?: number; y?: number; t?: number; color?: string; size?: number }> = ({
  n,
  x = MARGIN,
  y = CONTENT_TOP + 46,
  t = 1,
  color = INK,
  size = 300,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      fontFamily: FONT_STACK,
      fontSize: size,
      fontWeight: 900,
      color,
      opacity: 0.06 * clamp01(t),
      lineHeight: 0.8,
      letterSpacing: -12,
    }}
  >
    {String(n).padStart(2, "0")}
  </div>
);
