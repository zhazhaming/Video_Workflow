// jp-cars-cn-2026 · 视觉系统（浅纸底 / 编辑信息图 / 朱红强调 + 新能源绿）
// 设计约束：
//   1) 全片浅色纸感（c1/c2 都是浅色，用户明确不要深色背景），深墨字，朱红做主强调色；禁止深底霓虹、紫色渐变、星空。
//   2) 动画只由 p 驱动，只用 transform / opacity；随机只用 rand(seed+k) 家族。
//   3) 场景信息文字安全区：x 96~984，y 300~1320；避开顶部镜标签、底部字幕带与进度条。
//   4) 元素总数 ≤220；每个场景至少 3 个视觉层次（底纹 / 主图形 / 标注）。
import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";

// ---- 色板（全片统一，浅色印刷感）----
export const INK = "#1B1815";
export const INK_SOFT = "#4C463C";
export const INK_FAINT = "#8C8375";
export const RED = "#C8452D";
export const GOLD = "#A97C33";
export const GREEN = "#2E7D4F"; // 新能源绿牌绿（低饱和印刷绿）
export const PAPER = "#F4EFE6";

// 衬线（宋体系）用于少量编辑性大字/印章/招牌；正文与数字仍用无衬线，保证屏读清晰。
export const SERIF_STACK = '"Songti SC", "SimSun", "STSong", "Noto Serif SC", serif';
export { FONT_STACK, MONO_STACK };

// ---- 安全区 ----
export const MARGIN = 96;
export const CONTENT_TOP = 300;
export const CONTENT_BOTTOM = 1320;

// ---- 缓动 ----
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / Math.max(1e-6, b - a));
export const eo = (t: number) => 1 - Math.pow(1 - clamp01(t), 3); // easeOutCubic
export const ei = (t: number) => Math.pow(clamp01(t), 3); // easeInCubic
export const eio = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const eoq = (t: number) => 1 - Math.pow(1 - clamp01(t), 4); // easeOutQuart
export const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);
/** 0~1 的轻弹簧（欠阻尼一次回弹），只用于盖章/落点这类小事件 */
export const pop = (t: number) => {
  const x = clamp01(t);
  if (x >= 1) return 1;
  return 1 - Math.pow(2, -9 * x) * Math.cos((x * 9 - 0.6) * Math.PI);
};

// ---- 纸底 ----
export const Paper: React.FC<{
  c1: string;
  c2: string;
  accent?: string;
  seed?: number;
  grid?: boolean;
}> = ({ c1, c2, accent = RED, grid = true }) => {
  const cols = [0, 1, 2, 3, 4, 5, 6];
  const gut = 888 / 6;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(158deg, ${c1} 0%, ${c2} 100%)` }}>
      {/* 纸面柔光（极低透明，避免渐变单调） */}
      <div
        style={{
          position: "absolute",
          left: -120,
          top: -80,
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}14 0%, transparent 68%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -180,
          bottom: -120,
          width: 820,
          height: 820,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${INK}0D 0%, transparent 70%)`,
        }}
      />
      {/* 6 栏印刷网格 */}
      {grid
        ? cols.map((i) => (
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
      {/* 页眉 / 页脚细线 + 印刷定位角标 */}
      <div style={{ position: "absolute", left: MARGIN, right: MARGIN, top: CONTENT_TOP - 52, height: 1, background: INK, opacity: 0.16 }} />
      <div style={{ position: "absolute", left: MARGIN, right: MARGIN, top: CONTENT_BOTTOM + 34, height: 1, background: INK, opacity: 0.1 }} />
      {[
        [MARGIN - 18, CONTENT_TOP - 52],
        [984 - 6, CONTENT_TOP - 52],
        [MARGIN - 18, CONTENT_BOTTOM + 34],
        [984 - 6, CONTENT_BOTTOM + 34],
      ].map(([x, y], i) => (
        <div key={i} style={{ position: "absolute", left: x, top: y, width: 24, height: 1, background: INK, opacity: 0.3 }} />
      ))}
    </AbsoluteFill>
  );
};

// ---- 小标（栏目标签 / 单位说明）----
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
      left: align === "center" ? 0 : align === "right" ? undefined : x,
      right: align === "center" ? 0 : align === "right" ? 1080 - x : undefined,
      top: y,
      textAlign: align === "left" ? "left" : align === "right" ? "right" : "center",
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

// ---- 细线（可带生长进度）----
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

// ---- 朱红印章（旋转描边字）----
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
        background: filled ? color : "transparent",
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

// ---- 数字（等宽数字，带可选后缀）----
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

// ---- 章节序号大字（场景内的编辑性标记，与左上镜标签呼应）----
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
