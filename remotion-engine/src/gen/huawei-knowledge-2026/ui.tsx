// huawei-knowledge-2026 · 冷调纸感 + 华为红 + 工业蓝图 共用设计系统
import React from "react";
import { mixHex } from "../../dv/atmosphere";

export const INK = "#101820";
export const RED = "#CF0A2C";
export const STEEL = "#3E5A6B";
export const MIST = "#8FA6B4";
export const PAPER = "#F8FAFB";
export const WARM = "#F5F1E8";
export const MUTED = "rgba(16,24,32,0.58)";
export const LINE = "rgba(16,24,32,0.14)";
export const SERIF = '"Songti SC","STSong","Noto Serif SC",serif';
export const SANS = '"Microsoft YaHei","PingFang SC","Helvetica Neue",sans-serif';
export const MONO = '"Consolas","SFMono-Regular","Menlo",monospace';

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInOut = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeBack = (t: number) => {
  const x = clamp01(t);
  const s = 1.42;
  return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
};
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / Math.max(0.001, b - a));
export const pop = (t: number) => easeBack(t);
export const exitFade = (p: number) => 1 - clamp01((p - 0.92) / 0.08);
export const mk = (marks: { start: number; dur: number }[] | undefined, i: number, fallback: number) =>
  marks && marks[i] ? marks[i].start : fallback;

/** 冷调纸底：双色渐变 + 蓝图网格 + 横线 + 四角标记 + 暗角 */
export const Paper: React.FC<{ c1: string; c2: string; accent?: string; warm?: boolean }> = ({
  c1, c2, accent = RED, warm = false,
}) => (
  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(158deg, ${c1} 0%, ${c2} 100%)`, overflow: "hidden" }}>
    <div
      style={{
        position: "absolute", inset: 0, opacity: warm ? 0.2 : 0.3,
        backgroundImage: `linear-gradient(rgba(16,24,32,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(16,24,32,0.06) 1px, transparent 1px)`,
        backgroundSize: "36px 36px",
        maskImage: "radial-gradient(circle at 50% 42%, #000 18%, transparent 84%)",
      }}
    />
    <div
      style={{
        position: "absolute", inset: 0, opacity: 0.45,
        backgroundImage: `radial-gradient(rgba(16,24,32,0.14) 0.7px, transparent 0.7px)`,
        backgroundSize: "18px 18px",
        maskImage: "radial-gradient(circle at 50% 45%, #000 22%, transparent 82%)",
      }}
    />
    <div style={{ position: "absolute", left: 58, top: 58, width: 64, height: 2, background: accent }} />
    <div style={{ position: "absolute", left: 58, top: 58, width: 2, height: 64, background: accent }} />
    <div style={{ position: "absolute", right: 58, bottom: 58, width: 64, height: 2, background: accent, opacity: 0.45 }} />
    <div style={{ position: "absolute", right: 58, bottom: 58, width: 2, height: 64, background: accent, opacity: 0.45 }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: "31%", height: 1, background: "rgba(16,24,32,0.05)" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: "69%", height: 1, background: "rgba(16,24,32,0.05)" }} />
    <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 190px rgba(24,44,60,0.12)" }} />
  </div>
);

/** 小标签：红色竖条 + 字距拉开的说明字 */
export const Cap: React.FC<{
  text: string; x?: number; y?: number; color?: string; size?: number; opacity?: number;
  bar?: boolean; letterSpacing?: number; weight?: number;
}> = ({ text, x = 150, y = 330, color = MUTED, size = 24, opacity = 1, bar = true, letterSpacing = 2, weight = 500 }) => (
  <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: 10, opacity, fontFamily: SANS, fontSize: size, color, letterSpacing, fontWeight: weight }}>
    {bar && <span style={{ width: 4, height: 22, background: RED, display: "inline-block" }} />}
    <span>{text}</span>
  </div>
);

/** 细线 */
export const Rule: React.FC<{ x: number; y: number; w: number; color?: string; h?: number; opacity?: number }> = ({
  x, y, w, color = INK, h = 2, opacity = 0.2,
}) => <div style={{ position: "absolute", left: x, top: y, width: w, height: h, background: color, opacity }} />;

/** 大数字（计数） */
export const Counter: React.FC<{
  value: number; x: number; y: number; size?: number; suffix?: string; suffixSize?: number;
  color?: string; opacity?: number; decimals?: number; font?: string; weight?: number;
}> = ({ value, x, y, size = 170, suffix = "", suffixSize = 54, color = RED, opacity = 1, decimals = 0, font = MONO, weight = 700 }) => (
  <div style={{ position: "absolute", left: x, top: y, opacity, display: "flex", alignItems: "baseline", gap: 10, fontFamily: font, lineHeight: 0.92, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
    <span style={{ fontSize: size, fontWeight: weight, color, letterSpacing: -5 }}>{value.toFixed(decimals)}</span>
    {suffix && <span style={{ fontSize: suffixSize, fontWeight: 700, color: INK, letterSpacing: 0 }}>{suffix}</span>}
  </div>
);

/** 印章 */
export const Stamp: React.FC<{
  text: string; x: number; y: number; size?: number; rotate?: number; t?: number; color?: string; fill?: string;
}> = ({ text, x, y, size = 48, rotate = -7, t = 1, color = RED, fill = "rgba(248,250,251,0.55)" }) => (
  <div
    style={{
      position: "absolute", left: x, top: y,
      transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${0.68 + 0.32 * pop(t)})`,
      opacity: clamp01(t * 1.6),
      border: `4px solid ${color}`, borderRadius: 6,
      padding: "7px 16px", color, fontFamily: SERIF,
      fontSize: size, fontWeight: 700, letterSpacing: 5, whiteSpace: "nowrap",
      background: fill,
    }}
  >
    {text}
  </div>
);

/** 屏幕角落的栏目签名 */
export const Signature: React.FC<{ opacity?: number }> = ({ opacity = 0.5 }) => (
  <div style={{ position: "absolute", right: 150, top: 300, fontFamily: SANS, fontSize: 16, color: MUTED, letterSpacing: 2, opacity, textAlign: "right" }}>
    每日一家公司
  </div>
);

/** 八瓣标记（抽象信号花，非官方 logo 复刻），draw 0~1 控制描边生长 */
export const Petal: React.FC<{
  x: number; y: number; size?: number; color?: string; draw?: number; fillOpacity?: number;
  rotate?: number; strokeWidth?: number;
}> = ({ x, y, size = 420, color = RED, draw = 1, fillOpacity = 0.06, rotate = 0, strokeWidth = 2 }) => {
  const s = size / 240;
  return (
    <svg width={size} height={size} viewBox="-120 -120 240 240" style={{ position: "absolute", left: x, top: y, overflow: "visible", transform: `scale(${s}) rotate(${rotate}deg)`, transformOrigin: "center" }}>
      {Array.from({ length: 8 }, (_, i) => (
        <path
          key={i}
          d="M0,-14 C 25,-40 25,-92 0,-114 C -25,-92 -25,-40 0,-14 Z"
          transform={`rotate(${i * 45})`}
          fill={color}
          fillOpacity={fillOpacity}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset={1 - clamp01(draw)}
        />
      ))}
    </svg>
  );
};

/** 通信基站铁塔（线稿） */
export const Tower: React.FC<{ x: number; y: number; h?: number; color?: string; opacity?: number; pulse?: number }> = ({
  x, y, h = 150, color = INK, opacity = 1, pulse = 1,
}) => {
  const w = h * 0.62;
  return (
    <svg width={w + 20} height={h + 40} viewBox="0 0 120 190" style={{ position: "absolute", left: x, top: y, opacity, overflow: "visible" }}>
      <g stroke={color} strokeWidth="2.4" fill="none" strokeLinejoin="round">
        <path d="M60 34 L60 164" />
        <path d="M34 164 L60 42 L86 164" />
        <path d="M42 124 L78 124" />
        <path d="M48 92 L72 92" />
        <path d="M54 62 L66 62" />
        <path d="M24 164 L96 164" />
      </g>
      <circle cx="60" cy="30" r="5" fill={RED} />
      <g stroke={RED} strokeWidth="2" fill="none" opacity={pulse}>
        <path d="M46 20 Q60 4 74 20" />
        <path d="M38 11 Q60 -14 82 11" />
      </g>
    </svg>
  );
};

/** 手机（线稿 + 屏幕内容槽） */
export const Phone: React.FC<{ x: number; y: number; w?: number; h?: number; rotate?: number; glow?: number; children?: React.ReactNode }> = ({
  x, y, w = 280, h = 570, rotate = 0, glow = 1, children,
}) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `rotate(${rotate}deg)`, transformOrigin: "center" }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: w * 0.12, background: "rgba(248,250,251,0.9)", border: `3px solid ${INK}`, boxShadow: `0 26px 60px rgba(16,24,32,0.22), 0 0 0 1px rgba(207,10,44,${0.2 * glow})`, boxSizing: "border-box" }} />
    <div style={{ position: "absolute", left: 12, top: 14, right: 12, bottom: 14, borderRadius: w * 0.09, background: "#0E171E", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: "50%", top: 10, width: w * 0.3, height: 14, marginLeft: -w * 0.15, borderRadius: 8, background: "#1B2833" }} />
      {children}
    </div>
  </div>
);

/** 芯片（线稿 + 引脚） */
export const Chip: React.FC<{ x: number; y: number; size?: number; t?: number; color?: string; pins?: number; light?: boolean }> = ({
  x, y, size = 220, t = 1, color = RED, pins = 7, light = false,
}) => {
  const s = size;
  return (
    <svg width={s + 60} height={s + 60} viewBox="-30 -30 300 300" style={{ position: "absolute", left: x - 30, top: y - 30 }}>
      <g>
        {Array.from({ length: pins }, (_, i) => {
          const step = s / (pins + 1);
          const on = clamp01(t * pins - i) > 0.02;
          return (
            <g key={i}>
              <line x1={i * step + step} y1={-8} x2={i * step + step} y2={8} stroke={on ? color : "rgba(16,24,32,0.25)"} strokeWidth="3" />
              <line x1={i * step + step} y1={s + 8} x2={i * step + step} y2={s + 24} stroke={on ? color : "rgba(16,24,32,0.25)"} strokeWidth="3" />
              <line x1={-8} y1={i * step + step} x2={8} y2={i * step + step} stroke={on ? color : "rgba(16,24,32,0.25)"} strokeWidth="3" />
              <line x1={s + 8} y1={i * step + step} x2={s + 24} y2={i * step + step} stroke={on ? color : "rgba(16,24,32,0.25)"} strokeWidth="3" />
            </g>
          );
        })}
        <rect x="0" y="0" width={s} height={s} rx="10" fill={light ? "rgba(242,193,78,0.08)" : "rgba(207,10,44,0.06)"} stroke={light ? color : INK} strokeWidth="2.5" />
        <rect x="22" y="22" width={s - 44} height={s - 44} rx="6" fill="none" stroke={color} strokeWidth="1.2" opacity="0.55" strokeDasharray="5 5" />
        <text x={s / 2} y={s / 2 + 8} textAnchor="middle" fontFamily={MONO} fontSize={s * 0.16} fill={light ? color : INK} opacity="0.9">HUAWEI</text>
      </g>
    </svg>
  );
};

/** 二次贝塞尔连线，返回 path d */
export const arcPath = (x1: number, y1: number, x2: number, y2: number, lift = 60) => {
  const mx = (x1 + x2) / 2;
  const my = Math.min(y1, y2) - lift;
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
};

/** 二次贝塞尔上的点 */
export const qPoint = (x1: number, y1: number, x2: number, y2: number, lift: number, t: number) => {
  const mx = (x1 + x2) / 2;
  const my = Math.min(y1, y2) - lift;
  const u = 1 - t;
  return { x: u * u * x1 + 2 * u * t * mx + t * t * x2, y: u * u * y1 + 2 * u * t * my + t * t * y2 };
};

/** 圆点 + 可选光晕 */
export const Dot: React.FC<{ x: number; y: number; r?: number; color?: string; opacity?: number; halo?: boolean }> = ({
  x, y, r = 4, color = RED, opacity = 1, halo = false,
}) => (
  <div
    style={{
      position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%",
      background: color, opacity, boxShadow: halo ? `0 0 0 9px ${color}22` : undefined,
    }}
  />
);

/** 数字小标签 */
export const ChipLabel: React.FC<{ x: number; y: number; text: string; opacity?: number; tone?: "red" | "ink" | "paper" }> = ({
  x, y, text, opacity = 1, tone = "ink",
}) => {
  const bg = tone === "red" ? RED : tone === "ink" ? INK : "rgba(248,250,251,0.9)";
  const fg = tone === "red" ? "#FFFFFF" : tone === "ink" ? "#F8FAFB" : INK;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity, background: bg, color: fg, fontFamily: SANS, fontSize: 20, fontWeight: 600, letterSpacing: 1, padding: "7px 13px", borderRadius: 4, whiteSpace: "nowrap" }}>
      {text}
    </div>
  );
};

/** 年份幽灵字（背景层） */
export const GhostYear: React.FC<{ text: string; x: number; y: number; size?: number; opacity?: number }> = ({
  text, x, y, size = 300, opacity = 0.06,
}) => (
  <div style={{ position: "absolute", left: x, top: y, fontFamily: MONO, fontSize: size, fontWeight: 700, color: INK, opacity, letterSpacing: -8, lineHeight: 0.9 }}>
    {text}
  </div>
);

export const tint = (a: string, b: string, t: number) => mixHex(a, b, t);
