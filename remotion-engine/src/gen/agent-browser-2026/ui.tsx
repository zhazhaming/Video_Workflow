// agent-browser-2026 场景共用零件：蓝图网格纸 + 瑞士印刷排版 + 硬边卡片 + 数字滚轮。
// 只在 src/gen/agent-browser-2026/ 下使用，不改引擎。
import React from "react";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeBack = (t: number) => {
  const c = 1.70158;
  const x = clamp01(t) - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};
// 场景不退场淡出：切镜交给引擎的 TransitionIn，避免切点前出现“闪白/变灰”。
export const exitFade = (_p: number, _at = 0.97) => 1;

export const INK = "#17150F";
export const MUTED = "rgba(23,21,15,0.62)";
export const FAINT = "rgba(23,21,15,0.38)";
export const LINE = "rgba(23,21,15,0.18)";
export const PAPER = "#FFFBF0";
export const BLUE = "#1F3FB0";
export const RED = "#D24B2C";
export const GOLD = "#C8901F";
export const SHADOW = "10px 10px 0 rgba(23,21,15,0.10)";

/** 全局底：纸色渐变 + 蓝图点阵 + 裁切角标 + 页码 */
export const SceneShell: React.FC<{
  c1: string;
  c2: string;
  accent: string;
  index: number;
  total?: number;
  children?: React.ReactNode;
  fade?: number;
}> = ({ c1, c2, accent, index, total = 10, children, fade = 1 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      fontFamily: FONT_STACK,
      color: INK,
      background: `linear-gradient(158deg, ${c1} 0%, ${c2} 100%)`,
      opacity: fade,
    }}
  >
    {/* 蓝图点阵 */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `radial-gradient(${accent}26 1.7px, transparent 1.7px)`,
        backgroundSize: "44px 44px",
        opacity: 0.9,
      }}
    />
    {/* 纸面大色块（斜切），增加层次 */}
    <div
      style={{
        position: "absolute",
        right: -220,
        top: 210,
        width: 620,
        height: 980,
        background: `${accent}0A`,
        transform: "rotate(-9deg)",
      }}
    />
    {/* 内框 + 四角裁切标 */}
    <div style={{ position: "absolute", left: 54, top: 54, right: 54, bottom: 54, border: `1.5px solid ${accent}2E` }} />
    {[
      [54, 54],
      [1026, 54],
      [54, 1866],
      [1026, 1866],
    ].map(([x, y], i) => (
      <div key={i} style={{ position: "absolute", left: x - 12, top: y - 12, width: 24, height: 24 }}>
        <div style={{ position: "absolute", left: 11, top: 0, width: 2, height: 24, background: `${accent}66` }} />
        <div style={{ position: "absolute", left: 0, top: 11, width: 24, height: 2, background: `${accent}66` }} />
      </div>
    ))}
    {/* 页码 / 图号 */}
    <div
      style={{
        position: "absolute",
        left: 96,
        top: 1316,
        display: "flex",
        alignItems: "center",
        gap: 14,
        fontFamily: MONO_STACK,
        fontSize: 20,
        letterSpacing: 3,
        color: `${INK}8F`,
      }}
    >
      <span style={{ display: "inline-block", width: 72, height: 2, background: accent }} />
      FIG. {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
    </div>
    {children}
  </div>
);

/** 硬边纸卡：粗描边 + 位移阴影 */
export const Card: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  children?: React.ReactNode;
  rotate?: number;
  bg?: string;
  border?: string;
  shadow?: string;
  radius?: number;
  opacity?: number;
  scale?: number;
  style?: React.CSSProperties;
}> = ({
  x,
  y,
  w,
  h,
  children,
  rotate = 0,
  bg = PAPER,
  border = INK,
  shadow = SHADOW,
  radius = 10,
  opacity = 1,
  scale = 1,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      boxSizing: "border-box",
      background: bg,
      border: `3px solid ${border}`,
      borderRadius: radius,
      boxShadow: shadow,
      opacity,
      transform: `translateY(0) rotate(${rotate}deg) scale(${scale})`,
      ...style,
    }}
  >
    {children}
  </div>
);

/** 胶带条 */
export const Tape: React.FC<{
  x: number;
  y: number;
  w: number;
  rotate?: number;
  color?: string;
  label?: string;
  opacity?: number;
}> = ({ x, y, w, rotate = -5, color = "#E9C468", label, opacity = 0.9 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: 40,
      background: color,
      opacity,
      transform: `rotate(${rotate}deg)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: MONO_STACK,
      fontSize: 17,
      letterSpacing: 2,
      color: "rgba(23,21,15,.6)",
      boxShadow: "0 3px 8px rgba(23,21,15,.12)",
    }}
  >
    {label}
  </div>
);

/** 印章：外粗内细双框，带轻微旋转与落章回弹 */
export const Stamp: React.FC<{
  x?: number;
  y?: number;
  text: string;
  color?: string;
  rotate?: number;
  progress: number;
  fontSize?: number;
  solid?: boolean;
  right?: number;
  bottom?: number;
  absolute?: boolean;
}> = ({ x, y, text, color = RED, rotate = -8, progress, fontSize = 34, solid = false, right, bottom, absolute = true }) => {
  const t = easeBack(progress);
  const style: React.CSSProperties = {
    position: absolute ? "absolute" : "relative",
    left: x,
    top: y,
    right,
    bottom,
    opacity: clamp01(progress * 2.4),
    transform: `rotate(${rotate}deg) scale(${0.6 + 0.4 * t})`,
    border: `4px solid ${color}`,
    boxShadow: solid ? "none" : `inset 0 0 0 2px ${color}`,
    color: solid ? PAPER : color,
    background: solid ? color : "rgba(255,251,240,0.72)",
    borderRadius: 8,
    padding: "6px 16px",
    fontFamily: MONO_STACK,
    fontWeight: 900,
    fontSize,
    letterSpacing: 3,
    whiteSpace: "nowrap",
  };
  return <div style={style}>{text}</div>;
};

export const Chip: React.FC<{
  text: string;
  color?: string;
  bg?: string;
  size?: number;
  filled?: boolean;
  style?: React.CSSProperties;
}> = ({ text, color = INK, bg, size = 20, filled = false, style }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: `${Math.round(size * 0.32)}px ${Math.round(size * 0.72)}px`,
      border: `2px solid ${color}`,
      borderRadius: 999,
      background: filled ? color : bg ?? "rgba(255,251,240,0.8)",
      color: filled ? PAPER : color,
      fontFamily: MONO_STACK,
      fontSize: size,
      lineHeight: 1.1,
      letterSpacing: 1,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {text}
  </span>
);

/** 数字滚轮：固定位数，按位滚动，末位落定；带千分位逗号 */
export const RollNumber: React.FC<{
  value: number;
  digits?: number;
  size?: number;
  color?: string;
  comma?: boolean;
  weight?: number;
  letterSpacing?: number;
}> = ({ value, digits = 5, size = 96, color = INK, comma = false, weight = 900, letterSpacing = 0 }) => {
  const cell = size;
  const intVal = Math.max(0, Math.floor(value));
  const items: React.ReactNode[] = [];
  for (let i = 0; i < digits; i++) {
    const place = Math.pow(10, digits - 1 - i);
    const d = Math.floor(intVal / place) % 10;
    const visible = intVal >= place || i === digits - 1;
    if (comma && i === digits - 3) {
      items.push(
        <span
          key="comma"
          style={{
            height: cell, lineHeight: `${cell}px`, fontSize: size * 0.86, color,
            opacity: intVal >= 1000 ? 1 : 0, margin: "0 -2px", flex: "none",
          }}
        >
          ,
        </span>,
      );
    }
    items.push(
      <div
        key={i}
        style={{
          position: "relative",
          height: cell,
          width: size * 0.62,
          overflow: "hidden",
          flex: "none",
          opacity: visible ? 1 : 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            transform: `translateY(${-d * cell}px)`,
            fontFamily: MONO_STACK,
            fontSize: size,
            lineHeight: `${cell}px`,
            fontWeight: weight,
            color,
            textAlign: "center",
            letterSpacing,
          }}
        >
          {Array.from({ length: 10 }, (_, n) => (
            <div key={n} style={{ height: cell, lineHeight: `${cell}px` }}>{n}</div>
          ))}
        </div>
      </div>,
    );
  }
  return <div style={{ display: "flex", alignItems: "flex-start", height: cell, lineHeight: 1 }}>{items}</div>;
};

/** 进度条 */
export const Bar: React.FC<{
  x: number;
  y: number;
  w: number;
  h?: number;
  t: number;
  color?: string;
  track?: string;
  radius?: number;
}> = ({ x, y, w, h = 12, t, color = BLUE, track = "rgba(23,21,15,0.12)", radius = 999 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, background: track, borderRadius: radius, overflow: "hidden" }}>
    <div style={{ width: `${clamp01(t) * 100}%`, height: "100%", background: color, borderRadius: radius }} />
  </div>
);

/** 鼠标箭头 */
export const Cursor: React.FC<{ x: number; y: number; scale?: number; press?: number; opacity?: number; color?: string }> = ({
  x,
  y,
  scale = 1,
  press = 0,
  opacity = 1,
  color = INK,
}) => (
  <svg
    width={44 * scale}
    height={56 * scale}
    viewBox="0 0 44 56"
    style={{
      position: "absolute",
      left: x,
      top: y,
      opacity,
      transform: `scale(${1 - press * 0.12})`,
      transformOrigin: "8px 6px",
      filter: "drop-shadow(0 4px 6px rgba(23,21,15,0.25))",
    }}
  >
    <path d="M4 2l32 24-14 2.4 8 15.6-8 4-8-15.4L4 42z" fill={color} stroke={PAPER} strokeWidth={2.6} strokeLinejoin="round" />
  </svg>
);

/** 浏览器窗口：纸色 + 粗边 + 地址栏 */
export const BrowserWindow: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  url: string;
  children?: React.ReactNode;
  opacity?: number;
  scale?: number;
  rotate?: number;
  accent?: string;
}> = ({ x, y, w, h, url, children, opacity = 1, scale = 1, rotate = 0, accent = BLUE }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      background: PAPER,
      border: `3px solid ${INK}`,
      borderRadius: 14,
      boxShadow: SHADOW,
      opacity,
      transform: `rotate(${rotate}deg) scale(${scale})`,
      transformOrigin: "center center",
      overflow: "hidden",
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        height: 54,
        background: "#EFE7D6",
        borderBottom: `2px solid ${INK}`,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 18px",
        boxSizing: "border-box",
      }}
    >
      {[RED, "#E7B44E", "#5C9A63"].map((c) => (
        <span key={c} style={{ width: 13, height: 13, borderRadius: "50%", background: c }} />
      ))}
      <div
        style={{
          marginLeft: 10,
          flex: 1,
          height: 30,
          borderRadius: 999,
          border: `1.5px solid ${LINE}`,
          background: "rgba(255,251,240,0.8)",
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          fontFamily: MONO_STACK,
          fontSize: 17,
          color: MUTED,
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ color: accent, marginRight: 8 }}>●</span>
        {url}
      </div>
    </div>
    <div style={{ position: "relative", height: h - 54 }}>{children}</div>
  </div>
);

/** 线性小图标 */
export const Glyph: React.FC<{
  kind: "star" | "camera" | "cursor" | "check" | "shield" | "lock" | "terminal" | "form" | "table" | "gauge" | "refresh" | "bolt" | "eye" | "ban" | "key" | "layers" | "globe" | "play";
  size?: number;
  color?: string;
  opacity?: number;
  strokeWidth?: number;
}> = ({ kind, size = 40, color = INK, opacity = 1, strokeWidth = 3 }) => {
  const common = {
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ opacity, flex: "none" }}>
      {kind === "star" && (
        <path fill={color} d="M24 4l5.6 12.2 13.4 1.5-9.9 9 2.8 13.2L24 33.3 12.1 39.9l2.8-13.2-9.9-9 13.4-1.5z" />
      )}
      {kind === "camera" && (
        <>
          <rect x="5" y="14" width="38" height="27" rx="4" {...common} />
          <path d="M16 14l3-6h10l3 6" {...common} />
          <circle cx="24" cy="27" r="7.5" {...common} />
        </>
      )}
      {kind === "cursor" && (
        <>
          <path d="M10 6l24 18-11 1.8 6 12-6 3-6-12-7 6z" {...common} />
        </>
      )}
      {kind === "check" && <path d="M8 25l9 9L40 11" {...common} strokeWidth={strokeWidth + 0.6} />}
      {kind === "shield" && (
        <>
          <path d="M24 5l16 6v12c0 11-7 17-16 21-9-4-16-10-16-21V11z" {...common} />
          <path d="M16 24l6 6 11-12" {...common} />
        </>
      )}
      {kind === "lock" && (
        <>
          <rect x="9" y="21" width="30" height="22" rx="4" {...common} />
          <path d="M15 21v-6a9 9 0 0118 0v6" {...common} />
          <circle cx="24" cy="32" r="2.4" fill={color} />
        </>
      )}
      {kind === "terminal" && (
        <>
          <rect x="4" y="8" width="40" height="32" rx="4" {...common} />
          <path d="M12 19l6 5-6 5M22 30h12" {...common} />
        </>
      )}
      {kind === "form" && (
        <>
          <rect x="7" y="6" width="34" height="36" rx="3" {...common} />
          <path d="M13 15h22M13 23h22M13 31h9" {...common} />
        </>
      )}
      {kind === "table" && (
        <>
          <rect x="5" y="8" width="38" height="32" rx="3" {...common} />
          <path d="M5 18h38M18 18v22M31 18v22" {...common} />
        </>
      )}
      {kind === "gauge" && (
        <>
          <path d="M6 33a18 18 0 1136 0" {...common} />
          <path d="M24 33l10-12" {...common} />
          <circle cx="24" cy="33" r="2.6" fill={color} />
        </>
      )}
      {kind === "refresh" && (
        <>
          <path d="M40 20a16 16 0 10-2 14" {...common} />
          <path d="M40 8v12H28" {...common} />
        </>
      )}
      {kind === "bolt" && <path d="M27 4L10 27h11l-3 17 19-25H25z" {...common} />}
      {kind === "eye" && (
        <>
          <path d="M3 24s8-13 21-13 21 13 21 13-8 13-21 13S3 24 3 24z" {...common} />
          <circle cx="24" cy="24" r="6" {...common} />
        </>
      )}
      {kind === "ban" && (
        <>
          <circle cx="24" cy="24" r="19" {...common} />
          <path d="M10 10l28 28" {...common} />
        </>
      )}
      {kind === "key" && (
        <>
          <circle cx="16" cy="20" r="8" {...common} />
          <path d="M22 26l18 18M32 36l5-5M37 41l5-5" {...common} />
        </>
      )}
      {kind === "layers" && (
        <>
          <path d="M24 5l19 10-19 10L5 15z" {...common} />
          <path d="M5 24l19 10 19-10M5 33l19 10 19-10" {...common} />
        </>
      )}
      {kind === "globe" && (
        <>
          <circle cx="24" cy="24" r="19" {...common} />
          <path d="M5 24h38M24 5c6 6 6 32 0 38M24 5c-6 6-6 32 0 38" {...common} />
        </>
      )}
      {kind === "play" && <path d="M14 8l26 16-26 16z" {...common} />}
    </svg>
  );
};

/** 纸感开关 */
export const Toggle: React.FC<{
  x: number;
  y: number;
  on: number; // 0~1
  accent?: string;
  w?: number;
  h?: number;
  label?: string;
}> = ({ x, y, on, accent = BLUE, w = 96, h = 50, label }) => {
  const t = clamp01(on);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: h / 2,
          border: `3px solid ${INK}`,
          background: t > 0.5 ? accent : "rgba(23,21,15,0.12)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 5 + t * (w - h - 4),
          top: 5,
          width: h - 10,
          height: h - 10,
          borderRadius: "50%",
          background: PAPER,
          border: `3px solid ${INK}`,
          transform: `scale(${1 + Math.sin(t * Math.PI) * 0.16})`,
        }}
      />
      {label ? (
        <div
          style={{
            position: "absolute",
            left: w + 16,
            top: 8,
            fontFamily: MONO_STACK,
            fontSize: 18,
            color: t > 0.5 ? accent : FAINT,
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};

/** 小标题：左侧短杠 + 等宽英文 */
export const Kicker: React.FC<{ text: string; color?: string; opacity?: number; style?: React.CSSProperties }> = ({
  text,
  color = MUTED,
  opacity = 1,
  style,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontFamily: MONO_STACK,
      fontSize: 20,
      letterSpacing: 3,
      color,
      opacity,
      ...style,
    }}
  >
    <span style={{ width: 26, height: 2, background: color }} />
    {text}
  </div>
);
