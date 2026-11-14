// fable-astra-brief-2026：产品发布速览的共用零件。
// 风格：暖纸底、黑色产品卡、橙色价签、少装饰、大字号。
import React from "react";
import { FONT_STACK, MONO_STACK, rand } from "../../dv/atmosphere";
export { rand };

export const INK = "#171714";
export const MUTED = "rgba(23,23,20,0.62)";
export const FAINT = "rgba(23,23,20,0.35)";
export const LINE = "rgba(23,23,20,0.16)";
export const PAPER = "#FFFDF7";
export const ORANGE = "#D24B2C";
export const GREEN = "#2F5D50";
export const BLUE = "#496B7A";
export const GOLD = "#B98A2E";
export const SHADOW = "10px 10px 0 rgba(23,23,20,0.10)";

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeBack = (t: number) => {
  const c = 1.70158;
  const x = clamp01(t) - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};
export const stagger = (p: number, start: number, step: number, i: number, len = 0.12) =>
  easeOut(clamp01((p - start - i * step) / len));

export const mono = (size: number, color = MUTED, weight = 600): React.CSSProperties => ({
  fontFamily: MONO_STACK,
  fontSize: size,
  color,
  fontWeight: weight,
  letterSpacing: 1.1,
});
export const sans = (size: number, color = INK, weight = 800): React.CSSProperties => ({
  fontFamily: FONT_STACK,
  fontSize: size,
  color,
  fontWeight: weight,
  letterSpacing: 0.2,
});

/** 暖纸底 + 柔光带 + 页眉页脚；关键内容从 x=185 起。 */
export const Shell: React.FC<{
  c1: string;
  c2: string;
  accent: string;
  index: number;
  label: string;
  tag: string;
  children?: React.ReactNode;
  watermark?: string;
}> = ({ c1, c2, accent, index, label, tag, children, watermark }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      fontFamily: FONT_STACK,
      color: INK,
      background: `linear-gradient(150deg, ${c1} 0%, ${c2} 100%)`,
    }}
  >
    {/* 柔光带，替代网格，降低“AI味” */}
    <div
      style={{
        position: "absolute",
        left: -180,
        top: 240,
        width: 1440,
        height: 360,
        background: "linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0))",
        transform: "rotate(-8deg)",
      }}
    />
    <div
      style={{
        position: "absolute",
        right: -220,
        top: 820,
        width: 720,
        height: 720,
        borderRadius: "50%",
        border: `1.5px solid ${accent}1F`,
      }}
    />
    {watermark ? (
      <div
        style={{
          position: "absolute",
          right: 132,
          bottom: 520,
          fontFamily: FONT_STACK,
          fontSize: 360,
          fontWeight: 900,
          color: `${INK}06`,
          lineHeight: 1,
          letterSpacing: -12,
        }}
      >
        {watermark}
      </div>
    ) : null}

    <div style={{ position: "absolute", left: 185, top: 298, display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ width: 10, height: 10, background: accent }} />
      <span style={mono(16, INK, 800)}>{label}</span>
      <span style={{ width: 44, height: 1.5, background: `${INK}35` }} />
      <span style={mono(13, MUTED, 600)}>2026 MODEL BRIEF</span>
    </div>
    <div style={{ position: "absolute", right: 185, top: 298, textAlign: "right" }}>
      <span style={mono(14, accent, 800)}>{tag}</span>
    </div>

    {children}

    <div style={{ position: "absolute", left: 185, top: 1324, display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 44, height: 2, background: accent }} />
      <span style={mono(14, INK, 700)}>PAGE {String(index).padStart(2, "0")} / 08</span>
    </div>
  </div>
);

export const Card: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  children?: React.ReactNode;
  bg?: string;
  border?: string;
  shadow?: string;
  radius?: number;
  opacity?: number;
  scale?: number;
  rotate?: number;
  style?: React.CSSProperties;
}> = ({ x, y, w, h, children, bg = PAPER, border = INK, shadow = SHADOW, radius = 12, opacity = 1, scale = 1, rotate = 0, style }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      boxSizing: "border-box",
      background: bg,
      border: `2.5px solid ${border}`,
      borderRadius: radius,
      boxShadow: shadow,
      opacity,
      transform: `rotate(${rotate}deg) scale(${scale})`,
      transformOrigin: "50% 50%",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Chip: React.FC<{
  text: string;
  color?: string;
  bg?: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({ text, color = INK, bg = "rgba(255,253,247,0.76)", size = 15, style }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      height: size + 14,
      padding: `0 ${Math.round(size * 0.7)}px`,
      border: `1.5px solid ${color}55`,
      borderRadius: 5,
      background: bg,
      color,
      fontFamily: MONO_STACK,
      fontSize: size,
      fontWeight: 700,
      letterSpacing: 0.8,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {text}
  </span>
);

export const Stamp: React.FC<{
  text: string;
  x: number;
  y: number;
  progress: number;
  color?: string;
  rotate?: number;
  size?: number;
}> = ({ text, x, y, progress, color = ORANGE, rotate = -7, size = 24 }) => {
  const t = easeBack(progress);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        padding: "8px 16px",
        border: `3px solid ${color}`,
        boxShadow: `inset 0 0 0 2px ${color}44`,
        borderRadius: 6,
        color,
        fontFamily: MONO_STACK,
        fontSize: size,
        fontWeight: 900,
        letterSpacing: 2,
        background: "rgba(255,253,247,0.7)",
        opacity: clamp01(progress * 2.2),
        transform: `rotate(${rotate}deg) scale(${0.55 + 0.45 * t})`,
        transformOrigin: "50% 50%",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

/** 产品盒：上方色条 + 型号 + 定位 + 底部规格。 */
export const ProductBox: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  brand: string;
  name: string;
  sub: string;
  color: string;
  tag: string;
  opacity?: number;
  scale?: number;
  rotate?: number;
}> = ({ x, y, w, h, brand, name, sub, color, tag, opacity = 1, scale = 1, rotate = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      boxSizing: "border-box",
      background: PAPER,
      border: `3px solid ${INK}`,
      borderRadius: 14,
      boxShadow: "12px 12px 0 rgba(23,23,20,0.10)",
      opacity,
      transform: `rotate(${rotate}deg) scale(${scale})`,
      transformOrigin: "50% 50%",
      overflow: "hidden",
    }}
  >
    <div style={{ height: 18, background: color }} />
    <div style={{ padding: "20px 22px 0" }}>
      <div style={mono(12, MUTED, 700)}>{brand}</div>
      <div style={{ ...sans(54, INK, 900), lineHeight: 0.98, marginTop: 22, whiteSpace: "pre-line" }}>{name}</div>
      <div style={{ ...mono(13, MUTED, 600), marginTop: 12, lineHeight: 1.5, whiteSpace: "pre-line" }}>{sub}</div>
    </div>
    <div style={{ position: "absolute", left: 22, right: 22, bottom: 18 }}>
      <div style={{ height: 1.5, background: `${INK}20`, marginBottom: 12 }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={mono(11, MUTED, 700)}>{tag}</span>
        <span style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${color}`, display: "inline-block" }} />
      </div>
    </div>
  </div>
);

/** 收据卡：底边锯齿 + 虚线分隔。 */
export const Receipt: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  rows: { label: string; value: string }[];
  note: string;
  color: string;
  progress: number;
  opacity?: number;
}> = ({ x, y, w, h, title, rows, note, color, progress, opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      opacity,
      transform: `translateY(${(1 - easeOut(progress)) * 24}px)`,
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: PAPER,
        border: `2.5px solid ${INK}`,
        boxShadow: SHADOW,
        clipPath:
          "polygon(0 0, 100% 0, 100% 96%, 96% 100%, 92% 96%, 88% 100%, 84% 96%, 80% 100%, 76% 96%, 72% 100%, 68% 96%, 64% 100%, 60% 96%, 56% 100%, 52% 96%, 48% 100%, 44% 96%, 40% 100%, 36% 96%, 32% 100%, 28% 96%, 24% 100%, 20% 96%, 16% 100%, 12% 96%, 8% 100%, 4% 96%, 0 100%)",
      }}
    />
    <div style={{ position: "absolute", left: 22, right: 22, top: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={mono(13, color, 900)}>{title}</span>
        <span style={mono(11, MUTED, 600)}>PRICE CARD</span>
      </div>
      <div style={{ height: 1.5, background: `${INK}18`, margin: "14px 0 18px" }} />
      {rows.map((r, i) => (
        <div key={r.label} style={{ marginTop: i === 0 ? 0 : 18 }}>
          <div style={mono(12, MUTED, 600)}>{r.label}</div>
          <div style={{ ...sans(44, INK, 900), lineHeight: 1.05, marginTop: 4 }}>{r.value}</div>
        </div>
      ))}
      <div style={{ height: 1.5, background: `${INK}18`, margin: "20px 0 12px" }} />
      <div style={mono(11, MUTED, 600)}>{note}</div>
    </div>
  </div>
);

/** 文档堆：几页纸扇形展开。 */
export const DocStack: React.FC<{ x: number; y: number; p: number; color: string; pages?: number }> = ({
  x,
  y,
  p,
  color,
  pages = 5,
}) => (
  <div style={{ position: "absolute", left: x, top: y, width: 320, height: 380 }}>
    {Array.from({ length: pages }, (_, i) => {
      const t = easeOut(clamp01((p - i * 0.05) / 0.3));
      const rot = -12 + i * 6;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 20 + i * 10,
            top: 20 + i * 8,
            width: 220,
            height: 300,
            background: PAPER,
            border: `2px solid ${INK}`,
            borderRadius: 6,
            boxShadow: "6px 6px 0 rgba(23,23,20,0.06)",
            transform: `rotate(${rot * t}deg) translateY(${(1 - t) * 12}px)`,
            opacity: 0.35 + 0.65 * t,
          }}
        >
          <div style={{ padding: "22px 18px" }}>
            <div style={{ height: 8, width: 70, background: color, marginBottom: 18 }} />
            {[0, 1, 2, 3, 4].map((k) => (
              <div key={k} style={{ height: 5, width: k === 4 ? "55%" : "85%", background: `${INK}22`, marginTop: 12 }} />
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

/** 半圆速度表。 */
export const Gauge: React.FC<{ x: number; y: number; p: number; color: string }> = ({ x, y, p, color }) => {
  const t = easeInOut(clamp01((p - 0.1) / 0.45));
  const angle = -90 + t * 120;
  return (
    <svg width={430} height={300} viewBox="0 0 430 300" style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
      <path d="M 45 240 A 170 170 0 0 1 385 240" fill="none" stroke={`${INK}18`} strokeWidth="22" strokeLinecap="round" />
      <path d="M 45 240 A 170 170 0 0 1 385 240" fill="none" stroke={color} strokeWidth="22" strokeLinecap="round" strokeDasharray="530" strokeDashoffset={530 * (1 - t)} />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = Math.PI - (i / 4) * Math.PI;
        return (
          <line
            key={i}
            x1={215 + Math.cos(a) * 142}
            y1={240 - Math.sin(a) * 142}
            x2={215 + Math.cos(a) * 128}
            y2={240 - Math.sin(a) * 128}
            stroke={`${INK}55`}
            strokeWidth="2"
          />
        );
      })}
      <g transform={`rotate(${angle} 215 240)`}>
        <line x1="215" y1="240" x2="215" y2="112" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        <circle cx="215" cy="240" r="12" fill={INK} />
        <circle cx="215" cy="240" r="5" fill={PAPER} />
      </g>
    </svg>
  );
};

/** 天平：左右托盘 + 倾斜梁。 */
export const Scale: React.FC<{ x: number; y: number; p: number; colorA: string; colorB: string }> = ({ x, y, p, colorA, colorB }) => {
  const tilt = Math.sin(clamp01((p - 0.2) / 0.5) * Math.PI * 0.5) * 6;
  return (
    <svg width={760} height={520} viewBox="0 0 760 520" style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
      <rect x="366" y="210" width="28" height="210" fill={INK} />
      <path d="M 300 420 L 460 420 L 440 450 L 320 450 Z" fill={INK} />
      <g transform={`rotate(${tilt} 380 220)`}>
        <rect x="120" y="208" width="520" height="18" rx="9" fill={INK} />
        <line x1="150" y1="226" x2="150" y2="300" stroke={INK} strokeWidth="3" />
        <line x1="610" y1="226" x2="610" y2="300" stroke={INK} strokeWidth="3" />
        <path d="M 90 300 L 210 300 L 190 330 L 110 330 Z" fill={PAPER} stroke={colorA} strokeWidth="3" />
        <path d="M 550 300 L 670 300 L 650 330 L 570 330 Z" fill={PAPER} stroke={colorB} strokeWidth="3" />
      </g>
      <circle cx="380" cy="220" r="14" fill={PAPER} stroke={INK} strokeWidth="3" />
    </svg>
  );
};

export const Dust: React.FC<{ seed: number; p: number; color?: string; count?: number; opacity?: number }> = ({
  seed,
  p,
  color = ORANGE,
  count = 16,
  opacity = 0.26,
}) => (
  <>
    {Array.from({ length: count }, (_, k) => {
      const x = 180 + rand(seed + k * 5) * 720;
      const y = 340 + rand(seed + k * 5 + 1) * 900;
      const s = 2 + rand(seed + k * 5 + 2) * 4;
      const drift = 16 + rand(seed + k * 5 + 3) * 42;
      return (
        <div
          key={k}
          style={{
            position: "absolute",
            left: x,
            top: y - p * drift,
            width: s,
            height: s,
            borderRadius: "50%",
            background: color,
            opacity: opacity * (0.25 + 0.75 * rand(seed + k + 77)) * (1 - Math.max(0, p - 0.92) / 0.08),
          }}
        />
      );
    })}
  </>
);

/** 麦克风图标。 */
export const Mic: React.FC<{ x: number; y: number; size?: number; color?: string; opacity?: number }> = ({
  x,
  y,
  size = 120,
  color = INK,
  opacity = 1,
}) => (
  <svg width={size} height={size * 1.4} viewBox="0 0 100 140" style={{ position: "absolute", left: x, top: y, opacity }}>
    <rect x="34" y="12" width="32" height="58" rx="16" fill={PAPER} stroke={color} strokeWidth="4" />
    <path d="M 20 56 C 20 92 80 92 80 56" fill="none" stroke={color} strokeWidth="4" />
    <line x1="50" y1="92" x2="50" y2="116" stroke={color} strokeWidth="4" />
    <line x1="30" y1="120" x2="70" y2="120" stroke={color} strokeWidth="4" strokeLinecap="round" />
    {[0, 1, 2].map((i) => (
      <line key={i} x1={16 - i * 8} y1={38 + i * 12} x2={6 - i * 8} y2={38 + i * 12} stroke={color} strokeWidth="2" opacity="0.4" />
    ))}
  </svg>
);
