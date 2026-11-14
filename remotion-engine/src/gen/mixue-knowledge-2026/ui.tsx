// mixue-knowledge-2026 · 纸感印刷风共用件（奶油纸 + 印刷红 + 柠檬黄）
import React from "react";
import { mixHex } from "../../dv/atmosphere";

export const INK = "#1B1714";
export const RED = "#D7261E";
export const LEMON = "#F0C33C";
export const GREEN = "#4E6B4F";
export const CREAM = "#FFF9ED";
export const MUTED = "rgba(27,23,20,0.58)";
export const LINE = "rgba(27,23,20,0.14)";
export const SHADOW = "0 18px 42px rgba(76,50,20,0.13), 0 2px 6px rgba(76,50,20,0.08)";
export const SERIF = '"Songti SC","STSong","Noto Serif SC",serif';
export const SANS = '"Microsoft YaHei","PingFang SC",sans-serif';

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInOut = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeBack = (t: number) => {
  const x = clamp01(t);
  const s = 1.5;
  return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
};
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / Math.max(0.001, b - a));
export const pop = (t: number) => easeBack(t);
export const exitFade = (p: number) => 1 - clamp01((p - 0.9) / 0.1);
/** 取第 i 句在本镜内的起点（marks 缺失时用兜底值） */
export const mk = (marks: { start: number; dur: number }[] | undefined, i: number, fallback: number) =>
  marks && marks[i] ? marks[i].start : fallback;

/** 奶油纸底：双色渐变 + 细网格 + 四角裁切标记 + 轻微暗角 */
export const Paper: React.FC<{ c1: string; c2: string; accent?: string }> = ({ c1, c2, accent = RED }) => (
  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(155deg, ${c1} 0%, ${c2} 100%)`, overflow: "hidden" }}>
    <div
      style={{
        position: "absolute", inset: 0, opacity: 0.42,
        backgroundImage: `radial-gradient(rgba(27,23,20,0.11) 0.7px, transparent 0.7px)`,
        backgroundSize: "18px 18px",
        maskImage: "radial-gradient(circle at 50% 45%, #000 30%, transparent 88%)",
      }}
    />
    <div
      style={{
        position: "absolute", inset: 0, opacity: 0.5,
        background: `linear-gradient(90deg, transparent 0 49.8%, rgba(27,23,20,0.035) 50%, transparent 50.2%)`,
      }}
    />
    <div style={{ position: "absolute", left: 56, top: 56, width: 54, height: 3, background: accent }} />
    <div style={{ position: "absolute", left: 56, top: 56, width: 3, height: 54, background: accent }} />
    <div style={{ position: "absolute", right: 56, bottom: 56, width: 54, height: 3, background: accent, opacity: 0.5 }} />
    <div style={{ position: "absolute", right: 56, bottom: 56, width: 3, height: 54, background: accent, opacity: 0.5 }} />
    <div
      style={{
        position: "absolute", inset: 0,
        boxShadow: "inset 0 0 180px rgba(76,50,20,0.12)",
      }}
    />
  </div>
);

/** 小标签：红色小方块 + 字距拉开的说明文字 */
export const Cap: React.FC<{
  text: string;
  x?: number;
  y?: number;
  color?: string;
  size?: number;
  opacity?: number;
  bar?: boolean;
  letterSpacing?: number;
}> = ({ text, x = 96, y = 320, color = MUTED, size = 24, opacity = 1, bar = true, letterSpacing = 2 }) => (
  <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: 10, opacity, fontFamily: SANS, fontSize: size, color, letterSpacing }}>
    {bar && <span style={{ width: 18, height: 4, background: RED, display: "inline-block" }} />}
    <span>{text}</span>
  </div>
);

/** 印章：红框红字，带轻微旋转 */
export const Stamp: React.FC<{
  text: string;
  x: number;
  y: number;
  size?: number;
  rotate?: number;
  t?: number;
  color?: string;
}> = ({ text, x, y, size = 54, rotate = -8, t = 1, color = RED }) => (
  <div
    style={{
      position: "absolute", left: x, top: y,
      transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${0.7 + 0.3 * pop(t)})`,
      opacity: clamp01(t * 1.4),
      border: `5px solid ${color}`, borderRadius: 8,
      padding: "8px 18px", color, fontFamily: SERIF,
      fontSize: size, fontWeight: 700, letterSpacing: 6,
      background: "rgba(255,249,237,0.55)",
    }}
  >
    {text}
  </div>
);

/** 大数字（可做 0→值 的计数） */
export const Counter: React.FC<{
  value: number;
  x: number;
  y: number;
  size?: number;
  suffix?: string;
  suffixSize?: number;
  color?: string;
  opacity?: number;
  decimals?: number;
}> = ({ value, x, y, size = 180, suffix = "", suffixSize = 60, color = RED, opacity = 1, decimals = 0 }) => (
  <div style={{ position: "absolute", left: x, top: y, opacity, display: "flex", alignItems: "baseline", gap: 12, fontFamily: SERIF, lineHeight: 0.92, whiteSpace: "nowrap" }}>
    <span style={{ fontSize: size, fontWeight: 700, color, letterSpacing: -4 }}>{value.toFixed(decimals)}</span>
    {suffix && <span style={{ fontSize: suffixSize, fontWeight: 700, color: INK }}>{suffix}</span>}
  </div>
);

/** 柠檬片（SVG 线稿） */
export const LemonSlice: React.FC<{ size: number; x: number; y: number; rotate?: number; opacity?: number }> = ({ size, x, y, rotate = 0, opacity = 1 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    style={{ position: "absolute", left: x, top: y, transform: `rotate(${rotate}deg)`, opacity }}
  >
    <circle cx="50" cy="50" r="46" fill={LEMON} stroke={INK} strokeWidth="3" />
    <circle cx="50" cy="50" r="39" fill="#FBE7A2" stroke={INK} strokeWidth="1.6" />
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      return (
        <line
          key={i}
          x1={50 + Math.cos(a) * 6}
          y1={50 + Math.sin(a) * 6}
          x2={50 + Math.cos(a) * 37}
          y2={50 + Math.sin(a) * 37}
          stroke={INK}
          strokeWidth="1.4"
          opacity="0.55"
        />
      );
    })}
    <circle cx="50" cy="50" r="5" fill={CREAM} stroke={INK} strokeWidth="1.4" />
  </svg>
);

/** 纸杯：杯身 + 杯盖 + 吸管 + 柠檬片，w/h 为杯身尺寸 */
export const Cup: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  fill?: string;
  stroke?: string;
  accent?: string;
  opacity?: number;
  straw?: boolean;
  rotate?: number;
}> = ({ x, y, w = 200, h = 300, fill = CREAM, stroke = INK, accent = RED, opacity = 1, straw = true, rotate = 0 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h + 60, opacity, transform: `rotate(${rotate}deg)` }}>
    {straw && (
      <div style={{ position: "absolute", left: w * 0.62, top: -60, width: 16, height: 120, background: accent, borderRadius: 8, transform: "rotate(8deg)", transformOrigin: "bottom center" }} />
    )}
    <div style={{ position: "absolute", left: -6, top: 18, width: w + 12, height: 34, background: fill, border: `4px solid ${stroke}`, borderRadius: 12, boxSizing: "border-box" }} />
    <div
      style={{
        position: "absolute", left: 0, top: 48, width: w, height: h,
        background: `linear-gradient(180deg, ${fill} 0%, ${mixHex(fill, LEMON, 0.12)} 100%)`,
        border: `4px solid ${stroke}`,
        borderTop: "none",
        clipPath: "polygon(3% 0, 97% 0, 82% 100%, 18% 100%)",
        boxSizing: "border-box",
      }}
    />
    <div style={{ position: "absolute", left: w * 0.18, top: 100, width: w * 0.64, height: h * 0.34, borderRadius: 16, background: "rgba(240,195,60,0.22)", border: `2px dashed ${stroke}55` }} />
    <div style={{ position: "absolute", left: w * 0.28, top: 170, width: w * 0.44, height: 4, background: accent, opacity: 0.75 }} />
    <div style={{ position: "absolute", left: w * 0.31, top: 188, width: w * 0.38, height: 4, background: stroke, opacity: 0.25 }} />
    <LemonSlice size={w * 0.3} x={w * 0.83} y={40} rotate={18} />
  </div>
);

/** 纸箱：w/h 为箱体，label 为箱面小字 */
export const Box: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  label?: string;
  fill?: string;
  stroke?: string;
  opacity?: number;
  rotate?: number;
}> = ({ x, y, w = 150, h = 110, label = "", fill = "#E8D3AC", stroke = INK, opacity = 1, rotate = 0 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity, transform: `rotate(${rotate}deg)` }}>
    <div style={{ position: "absolute", inset: 0, background: fill, border: `3px solid ${stroke}`, borderRadius: 6, boxSizing: "border-box", boxShadow: SHADOW }} />
    <div style={{ position: "absolute", left: 0, top: h * 0.34, width: "100%", height: 3, background: stroke, opacity: 0.25 }} />
    <div style={{ position: "absolute", left: w * 0.42, top: -3, width: w * 0.16, height: h + 6, background: "rgba(255,249,237,0.7)", border: `2px solid ${stroke}22`, boxSizing: "border-box" }} />
    {label && (
      <div style={{ position: "absolute", left: 10, top: h - 34, fontFamily: SANS, fontSize: 20, fontWeight: 700, color: INK, letterSpacing: 2 }}>
        {label}
      </div>
    )}
  </div>
);

/** 小店：雨棚 + 柜台 + 窗口 + 招牌 */
export const Store: React.FC<{ x: number; y: number; w?: number; opacity?: number }> = ({ x, y, w = 300, opacity = 1 }) => {
  const h = w * 0.72;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h + 70, opacity }}>
      <div style={{ position: "absolute", left: 14, top: 0, width: w - 28, height: 34, background: RED, borderRadius: 6, boxShadow: SHADOW, display: "flex", alignItems: "center", justifyContent: "center", color: CREAM, fontFamily: SERIF, fontSize: 22, letterSpacing: 8 }}>
        蜜雪冰城
      </div>
      <div
        style={{
          position: "absolute", left: 0, top: 36, width: w, height: 44,
          background: "repeating-linear-gradient(90deg, #D7261E 0 26px, #FFF6E5 26px 52px)",
          clipPath: "polygon(0 0, 100% 0, 94% 100%, 6% 100%)",
        }}
      />
      <div style={{ position: "absolute", left: 10, top: 80, width: w - 20, height: h - 80, background: CREAM, border: `3px solid ${INK}`, borderRadius: 6, boxSizing: "border-box", boxShadow: SHADOW }} />
      <div style={{ position: "absolute", left: 34, top: 104, width: w * 0.4, height: h * 0.34, background: "rgba(240,195,60,0.28)", border: `2px solid ${INK}55`, borderRadius: 4 }} />
      <div style={{ position: "absolute", left: w * 0.56, top: 104, width: w * 0.3, height: h - 126, background: INK, opacity: 0.82, borderRadius: 4 }} />
      <div style={{ position: "absolute", left: 34, top: h - 44, width: w * 0.62, height: 8, background: RED, opacity: 0.7 }} />
      <div style={{ position: "absolute", left: w * 0.08, top: h + 24, width: w * 0.84, height: 10, background: LINE, borderRadius: 6 }} />
    </div>
  );
};

/** 雪王：两个雪球 + 王冠 + 红围巾 + 胡萝卜鼻子 */
export const Snowman: React.FC<{ x: number; y: number; size?: number; opacity?: number; wave?: number }> = ({ x, y, size = 260, opacity = 1, wave = 0 }) => {
  const s = size / 260;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: size, height: size * 1.3, opacity, transform: `scale(${s})`, transformOrigin: "top left" }}>
      <div style={{ position: "absolute", left: 70, top: 160, width: 150, height: 150, borderRadius: "50%", background: "#FFFDF7", border: `4px solid ${INK}`, boxSizing: "border-box", boxShadow: SHADOW }} />
      <div style={{ position: "absolute", left: 95, top: 55, width: 100, height: 100, borderRadius: "50%", background: "#FFFDF7", border: `4px solid ${INK}`, boxSizing: "border-box", boxShadow: SHADOW }} />
      <div style={{ position: "absolute", left: 112, top: 78, width: 9, height: 9, borderRadius: "50%", background: INK }} />
      <div style={{ position: "absolute", left: 158, top: 78, width: 9, height: 9, borderRadius: "50%", background: INK }} />
      <div style={{ position: "absolute", left: 145, top: 102, width: 26, height: 12, background: "#E08A2E", clipPath: "polygon(0 0, 100% 50%, 0 100%)" }} />
      <div style={{ position: "absolute", left: 70, top: 142, width: 150, height: 26, background: RED, borderRadius: 8, transform: "rotate(-6deg)" }} />
      <div style={{ position: "absolute", left: 106, top: 168, width: 78, height: 4, background: INK, opacity: 0.3 }} />
      <div style={{ position: "absolute", left: 118, top: 188, width: 56, height: 4, background: INK, opacity: 0.22 }} />
      <div style={{ position: "absolute", left: 86, top: 168, width: 12, height: 140, background: INK, borderRadius: 6, transform: "rotate(52deg)", transformOrigin: "top center" }} />
      <div style={{ position: "absolute", left: 166, top: 168, width: 12, height: 130, background: INK, borderRadius: 6, transform: `rotate(${-52 + wave * 18}deg)`, transformOrigin: "top center" }} />
      <div style={{ position: "absolute", left: 78, top: 22, width: 120, height: 42, background: LEMON, clipPath: "polygon(0 100%, 12% 35%, 30% 60%, 44% 0, 62% 55%, 80% 30%, 100% 100%)", borderBottom: `3px solid ${INK}` }} />
      <div style={{ position: "absolute", left: 88, top: 40, width: 100, height: 8, background: RED, opacity: 0.8 }} />
    </div>
  );
};

/** 虚线箭头（水平，progress 0~1） */
export const Arrow: React.FC<{
  x: number;
  y: number;
  w: number;
  progress?: number;
  color?: string;
  thickness?: number;
  dashed?: boolean;
}> = ({ x, y, w, progress = 1, color = RED, thickness = 4, dashed = true }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w * clamp01(progress), height: thickness, background: dashed ? `repeating-linear-gradient(90deg, ${color} 0 12px, transparent 12px 20px)` : color }}>
    <div
      style={{
        position: "absolute", right: -2, top: -7,
        width: 0, height: 0,
        borderTop: "9px solid transparent", borderBottom: "9px solid transparent",
        borderLeft: `14px solid ${color}`,
        opacity: progress > 0.05 ? 1 : 0,
      }}
    />
  </div>
);

/** 屏幕角落的栏目签名 */
export const Signature: React.FC<{ opacity?: number }> = ({ opacity = 0.55 }) => (
  <div style={{ position: "absolute", right: 150, top: 300, fontFamily: SANS, fontSize: 16, color: MUTED, letterSpacing: 2, opacity, textAlign: "right" }}>
    每日一家公司
  </div>
);
