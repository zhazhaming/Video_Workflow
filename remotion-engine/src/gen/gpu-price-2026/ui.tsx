// gpu-price-2026 · 纸面行情板 / 收据 / 价格标签的共用视觉件
import React from "react";

export const INK = "#1B1714";
export const RED = "#C8452D";
export const GREEN = "#1E6B4F";
export const CREAM = "#FFF9ED";
export const PAPER = "#F4EFE4";
export const MUTED = "rgba(27,23,20,0.58)";
export const FAINT = "rgba(27,23,20,0.30)";
export const LINE = "rgba(27,23,20,0.14)";
export const SERIF = '"Songti SC","STSong","Noto Serif SC",serif';
export const SANS = '"Microsoft YaHei","PingFang SC",sans-serif';
export const MONO = '"Cascadia Mono",Consolas,"Microsoft YaHei",monospace';
export const SHADOW = "0 18px 38px rgba(70,48,28,0.14), 0 2px 5px rgba(70,48,28,0.08)";

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
export const mk = (marks: { start: number; dur: number }[] | undefined, i: number, fallback: number) =>
  marks && marks[i] ? marks[i].start : fallback;

/** 纸面：暖白渐变 + 网点 + 版心线 + 四角裁切标记 */
export const Paper: React.FC<{ c1: string; c2: string; accent?: string; grid?: boolean }> = ({
  c1, c2, accent = RED, grid = true,
}) => (
  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(152deg, ${c1} 0%, ${c2} 100%)`, overflow: "hidden" }}>
    {grid && (
      <>
        <div
          style={{
            position: "absolute", inset: 0, opacity: 0.3,
            backgroundImage: "radial-gradient(rgba(27,23,20,0.13) 0.6px, transparent 0.6px)",
            backgroundSize: "17px 17px",
            maskImage: "radial-gradient(circle at 48% 42%, #000 25%, transparent 85%)",
          }}
        />
        <div style={{ position: "absolute", left: 96, top: 0, bottom: 0, width: 1, background: "rgba(27,23,20,0.07)" }} />
        <div style={{ position: "absolute", right: 96, top: 0, bottom: 0, width: 1, background: "rgba(27,23,20,0.07)" }} />
      </>
    )}
    <div style={{ position: "absolute", left: 56, top: 56, width: 54, height: 3, background: accent }} />
    <div style={{ position: "absolute", left: 56, top: 56, width: 3, height: 54, background: accent }} />
    <div style={{ position: "absolute", right: 56, bottom: 56, width: 54, height: 3, background: accent, opacity: 0.45 }} />
    <div style={{ position: "absolute", right: 56, bottom: 56, width: 3, height: 54, background: accent, opacity: 0.45 }} />
    <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 160px rgba(70,48,28,0.10)" }} />
  </div>
);

/** 左上角栏目行：小红块 + 标签 + 右侧小字 */
export const TopBar: React.FC<{ label: string; right?: string; opacity?: number; color?: string }> = ({
  label, right = "", opacity = 1, color = MUTED,
}) => (
  <div style={{ position: "absolute", left: 96, right: 96, top: 286, display: "flex", alignItems: "center", opacity }}>
    <span style={{ width: 16, height: 16, background: RED, display: "inline-block", marginRight: 12 }} />
    <span style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 2, color, fontWeight: 700 }}>{label}</span>
    <span style={{ flex: 1 }} />
    <span style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 1, color: FAINT }}>{right}</span>
  </div>
);

/** 底部来源/口径小字 */
export const Source: React.FC<{ text: string; y?: number; opacity?: number }> = ({ text, y = 1308, opacity = 0.72 }) => (
  <div style={{ position: "absolute", left: 96, right: 96, top: y, fontFamily: SANS, fontSize: 18, lineHeight: 1.5, color: MUTED, letterSpacing: 0.5, opacity }}>
    {text}
  </div>
);

/** 大数字（衬线，紧字距） */
export const BigNum: React.FC<{
  text: string; x: number; y: number; size?: number; color?: string; opacity?: number; mono?: boolean; weight?: number;
}> = ({ text, x, y, size = 160, color = INK, opacity = 1, mono = false, weight = 700 }) => (
  <div
    style={{
      position: "absolute", left: x, top: y, opacity,
      fontFamily: mono ? MONO : SERIF, fontSize: size, lineHeight: 0.92,
      fontWeight: weight, color, letterSpacing: mono ? -4 : -2, whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

/** 红色小标签 */
export const Chip: React.FC<{ text: string; x: number; y: number; tone?: string; opacity?: number; rotate?: number; size?: number }> = ({
  text, x, y, tone = RED, opacity = 1, rotate = 0, size = 22,
}) => (
  <div
    style={{
      position: "absolute", left: x, top: y, opacity, transform: `rotate(${rotate}deg)`,
      background: tone, color: CREAM, fontFamily: SANS, fontSize: size, fontWeight: 700,
      letterSpacing: 2, padding: "8px 14px", borderRadius: 4,
    }}
  >
    {text}
  </div>
);

/** 印章：双线框 + 轻微旋转，带“盖下去”的回弹 */
export const Stamp: React.FC<{
  text: string; x: number; y: number; size?: number; rotate?: number; t?: number; color?: string; width?: number;
}> = ({ text, x, y, size = 44, rotate = -7, t = 1, color = RED, width }) => (
  <div
    style={{
      position: "absolute", left: x, top: y,
      transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${0.65 + 0.35 * pop(t)})`,
      opacity: clamp01(t * 1.4),
      border: `4px solid ${color}`, boxShadow: `inset 0 0 0 3px ${CREAM}, inset 0 0 0 5px ${color}`,
      padding: "10px 18px", color, fontFamily: SERIF, fontSize: size, fontWeight: 700,
      letterSpacing: 4, background: "rgba(255,249,237,0.42)", whiteSpace: "nowrap",
      width, textAlign: "center", boxSizing: "border-box",
    }}
  >
    {text}
  </div>
);

/** 价格牌：打孔 + 切角 + 大数字 */
export const PriceTag: React.FC<{
  x: number; y: number; w: number; kicker: string; value: string; sub?: string;
  color?: string; rotate?: number; t?: number; accent?: string; old?: string;
}> = ({ x, y, w, kicker, value, sub = "", color = INK, rotate = 0, t = 1, accent = RED, old }) => (
  <div
    style={{
      position: "absolute", left: x, top: y, width: w,
      transform: `translateY(${(1 - easeOut(t)) * 40}px) rotate(${rotate}deg) scale(${0.92 + 0.08 * easeOut(t)})`,
      opacity: clamp01(t * 1.3), filter: "drop-shadow(0 16px 28px rgba(70,48,28,0.14))",
    }}
  >
    <div style={{ position: "relative", background: CREAM, border: `3px solid ${INK}`, borderRadius: 12, padding: "26px 28px 24px", boxSizing: "border-box" }}>
      <div style={{ position: "absolute", left: 16, top: 16, width: 13, height: 13, borderRadius: "50%", border: `2px solid ${INK}`, background: "#E4D3BC" }} />
      <div style={{ marginLeft: 26, fontFamily: MONO, fontSize: 17, letterSpacing: 1, color: MUTED }}>{kicker}</div>
      <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontFamily: MONO, fontSize: 44, fontWeight: 800, color, letterSpacing: -2 }}>{value}</span>
        {old ? <span style={{ fontFamily: MONO, fontSize: 24, color: FAINT, textDecoration: "line-through" }}>{old}</span> : null}
      </div>
      {sub ? <div style={{ marginTop: 8, fontFamily: SANS, fontSize: 20, lineHeight: 1.4, color: MUTED }}>{sub}</div> : null}
      <div style={{ position: "absolute", right: -2, bottom: -2, width: 54, height: 54, background: accent, clipPath: "polygon(100% 0, 100% 100%, 0 100%)", borderBottomRightRadius: 9 }} />
    </div>
  </div>
);

/** 虚线箭头：水平/垂直 */
export const DashArrow: React.FC<{
  x: number; y: number; w: number; h?: number; progress?: number; color?: string; vertical?: boolean; thickness?: number;
}> = ({ x, y, w, h = 0, progress = 1, color = RED, vertical = false, thickness = 4 }) => {
  const len = vertical ? h : w;
  return (
    <div
      style={{
        position: "absolute", left: x, top: y,
        width: vertical ? thickness : len * clamp01(progress),
        height: vertical ? len * clamp01(progress) : thickness,
        background: `repeating-linear-gradient(${vertical ? "180deg" : "90deg"}, ${color} 0 10px, transparent 10px 17px)`,
        opacity: progress > 0.02 ? 1 : 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          ...(vertical
            ? { left: -6, bottom: -2, width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: `12px solid ${color}` }
            : { right: -2, top: -6, width: 0, height: 0, borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderLeft: `12px solid ${color}` }),
        }}
      />
    </div>
  );
};

/** 条形码：确定性粗细，用于收据/结尾 */
const BARS = [2, 1, 3, 1, 2, 4, 1, 1, 3, 2, 1, 4, 2, 1, 1, 3, 1, 2, 4, 1, 2, 1, 3, 1, 2, 1, 1, 4, 2, 1, 2, 3];
export const Barcode: React.FC<{ x: number; y: number; w: number; h?: number; color?: string; opacity?: number }> = ({
  x, y, w, h = 54, color = INK, opacity = 0.8,
}) => {
  const unit = w / BARS.reduce((a, b) => a + b, 0);
  let cx = 0;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity }}>
      {BARS.map((b, i) => {
        const bx = cx;
        cx += b * unit;
        return <div key={i} style={{ position: "absolute", left: bx, top: 0, width: b * unit, height: h, background: color }} />;
      })}
    </div>
  );
};

/** 线稿显卡：双风扇 + 金手指 + 供电口，放在背景做低对比图形 */
export const GpuLine: React.FC<{ x: number; y: number; w?: number; opacity?: number; color?: string; rotate?: number }> = ({
  x, y, w = 400, opacity = 0.16, color = INK, rotate = 0,
}) => {
  const h = w * 0.46;
  return (
    <svg
      width={w}
      height={h * 1.55}
      viewBox={`0 0 ${w} ${h * 1.55}`}
      style={{ position: "absolute", left: x, top: y, opacity, transform: `rotate(${rotate}deg)`, transformOrigin: "center" }}
    >
      <g fill="none" stroke={color} strokeWidth={5} strokeLinejoin="round">
        <rect x={w * 0.08} y={h * 0.14} width={w * 0.84} height={h * 0.72} rx={8} />
        <rect x={w * 0.03} y={h * 0.22} width={w * 0.08} height={h * 0.55} rx={3} />
        <circle cx={w * 0.35} cy={h * 0.5} r={h * 0.25} />
        <circle cx={w * 0.67} cy={h * 0.5} r={h * 0.25} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          return (
            <line
              key={i}
              x1={w * 0.35 + Math.cos(a) * 8}
              y1={h * 0.5 + Math.sin(a) * 8}
              x2={w * 0.35 + Math.cos(a) * h * 0.24}
              y2={h * 0.5 + Math.sin(a) * h * 0.24}
              strokeWidth={3}
            />
          );
        })}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          return (
            <line
              key={`b${i}`}
              x1={w * 0.67 + Math.cos(a) * 8}
              y1={h * 0.5 + Math.sin(a) * 8}
              x2={w * 0.67 + Math.cos(a) * h * 0.24}
              y2={h * 0.5 + Math.sin(a) * h * 0.24}
              strokeWidth={3}
            />
          );
        })}
        <rect x={w * 0.44} y={h * 0.12} width={w * 0.16} height={h * 0.08} rx={3} />
        {Array.from({ length: 10 }, (_, i) => (
          <line key={`p${i}`} x1={w * (0.3 + i * 0.04)} y1={h * 0.86} x2={w * (0.3 + i * 0.04)} y2={h * 0.94} strokeWidth={3} />
        ))}
      </g>
      <text x={w * 0.12} y={h * 0.31} fontFamily={MONO} fontSize={w * 0.045} fill={color} letterSpacing={3}>RTX</text>
    </svg>
  );
};

/** 细网格纸，用于图表底 */
export const ChartGrid: React.FC<{ x: number; y: number; w: number; h: number; rows?: number; cols?: number; opacity?: number }> = ({
  x, y, w, h, rows = 4, cols = 5, opacity = 0.5,
}) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity }}>
    {Array.from({ length: rows + 1 }, (_, i) => (
      <div key={`r${i}`} style={{ position: "absolute", left: 0, right: 0, top: (h / rows) * i, height: 1, background: LINE }} />
    ))}
    {Array.from({ length: cols + 1 }, (_, i) => (
      <div key={`c${i}`} style={{ position: "absolute", top: 0, bottom: 0, left: (w / cols) * i, width: 1, background: LINE }} />
    ))}
  </div>
);

/** 双线标题：上方小标 + 下方大标 */
export const Heading: React.FC<{ kicker?: string; title: string; x?: number; y?: number; size?: number; opacity?: number; color?: string }> = ({
  kicker, title, x = 96, y = 370, size = 74, opacity = 1, color = INK,
}) => (
  <div style={{ position: "absolute", left: x, top: y, opacity }}>
    {kicker ? <div style={{ fontFamily: MONO, fontSize: 19, letterSpacing: 2, color: RED, marginBottom: 10 }}>{kicker}</div> : null}
    <div style={{ fontFamily: SERIF, fontSize: size, lineHeight: 1.18, fontWeight: 700, color, letterSpacing: 1 }}>{title}</div>
  </div>
);
