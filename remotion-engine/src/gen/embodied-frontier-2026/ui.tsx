// embodied-frontier-2026 场景共用零件：
// 工业设计图纸 + 暖纸色 + 安全橙。只在本项目目录内使用，不改引擎。
import React from "react";
import { FONT_STACK, MONO_STACK, rand as randFn } from "../../dv/atmosphere";
export const rand = (seed: number) => randFn(seed);

export const INK = "#161B18";
export const MUTED = "rgba(22,27,24,0.62)";
export const FAINT = "rgba(22,27,24,0.36)";
export const LINE = "rgba(22,27,24,0.18)";
export const PAPER = "#FFFDF6";
export const ORANGE = "#C6552D";
export const GREEN = "#2F5D50";
export const BLUE = "#496B7A";
export const GOLD = "#B98A2E";
export const SHADOW = "9px 9px 0 rgba(22,27,24,0.09)";

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
export const windowIn = (p: number, at: number, len = 0.16) => easeOut(clamp01((p - at) / len));
export const stagger = (p: number, start: number, step: number, i: number, len = 0.12) =>
  easeOut(clamp01((p - start - i * step) / len));
// 场景不主动淡出，切镜交给引擎转场，避免切点前发灰。
export const keep = (_p: number) => 1;

export const mono = (size: number, color = MUTED, weight = 600): React.CSSProperties => ({
  fontFamily: MONO_STACK,
  fontSize: size,
  color,
  fontWeight: weight,
  letterSpacing: 1.2,
});
export const sans = (size: number, color = INK, weight = 700): React.CSSProperties => ({
  fontFamily: FONT_STACK,
  fontSize: size,
  color,
  fontWeight: weight,
  letterSpacing: 0.4,
});

/** 图纸底：暖纸渐变 + 点阵 + 细网格 + 角标 + 页码。 */
export const SceneShell: React.FC<{
  c1: string;
  c2: string;
  accent: string;
  index: number;
  total?: number;
  kicker: string;
  tag: string;
  children?: React.ReactNode;
}> = ({ c1, c2, accent, index, total = 8, kicker, tag, children }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      fontFamily: FONT_STACK,
      color: INK,
      background: `linear-gradient(152deg, ${c1} 0%, ${c2} 100%)`,
    }}
  >
    {/* 点阵 */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `radial-gradient(${INK}24 1.5px, transparent 1.5px)`,
        backgroundSize: "38px 38px",
        opacity: 0.55,
      }}
    />
    {/* 细网格 */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `linear-gradient(${INK}0A 1px, transparent 1px), linear-gradient(90deg, ${INK}0A 1px, transparent 1px)`,
        backgroundSize: "152px 152px",
        opacity: 0.8,
      }}
    />
    {/* 右侧大圆弧：技术图纸的“量角器” */}
    <div
      style={{
        position: "absolute",
        right: -300,
        top: 210,
        width: 760,
        height: 760,
        borderRadius: "50%",
        border: `1.5px solid ${accent}24`,
      }}
    />
    <div
      style={{
        position: "absolute",
        right: -220,
        top: 290,
        width: 600,
        height: 600,
        borderRadius: "50%",
        border: `1px dashed ${INK}18`,
      }}
    />
    {/* 内框与角标 */}
    <div style={{ position: "absolute", left: 50, top: 50, right: 50, bottom: 50, border: `1.5px solid ${accent}2A` }} />
    {[
      [50, 50],
      [1030, 50],
      [50, 1870],
      [1030, 1870],
    ].map(([x, y], i) => (
      <div key={i} style={{ position: "absolute", left: x - 10, top: y - 10, width: 20, height: 20 }}>
        <div style={{ position: "absolute", left: 9, top: 0, width: 2, height: 20, background: `${accent}70` }} />
        <div style={{ position: "absolute", left: 0, top: 9, width: 20, height: 2, background: `${accent}70` }} />
      </div>
    ))}

    {/* 页眉：只保留右上角图注，避免和 DataVideo 的 year/label 叠字 */}
    <div style={{ position: "absolute", right: 185, top: 292, textAlign: "right", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 28, height: 1.5, background: `${accent}88` }} />
      <span style={mono(15, accent, 800)}>{tag}</span>
    </div>

    {children}

    {/* 页脚 */}
    <div style={{ position: "absolute", left: 185, top: 1322, display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ width: 54, height: 2, background: accent }} />
      <span style={mono(16, INK, 700)}>
        FIG. {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
      <span style={mono(14, FAINT, 600)}>EMBODIED SYSTEMS LAB</span>
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
}> = ({ x, y, w, h, children, bg = PAPER, border = INK, shadow = SHADOW, radius = 10, opacity = 1, scale = 1, rotate = 0, style }) => (
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
}> = ({ text, color = INK, bg = "rgba(255,253,246,0.74)", size = 16, style }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      height: size + 14,
      padding: `0 ${Math.round(size * 0.7)}px`,
      border: `1.5px solid ${color}66`,
      borderRadius: 4,
      background: bg,
      color,
      fontFamily: MONO_STACK,
      fontSize: size,
      fontWeight: 700,
      letterSpacing: 1,
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
}> = ({ text, x, y, progress, color = ORANGE, rotate = -8, size = 26 }) => {
  const t = easeBack(progress);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        padding: "7px 15px",
        border: `3px solid ${color}`,
        boxShadow: `inset 0 0 0 2px ${color}55`,
        borderRadius: 5,
        color,
        fontFamily: MONO_STACK,
        fontSize: size,
        fontWeight: 900,
        letterSpacing: 2,
        background: "rgba(255,253,246,0.68)",
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

export const Crosshair: React.FC<{ x: number; y: number; r?: number; color?: string; opacity?: number }> = ({
  x,
  y,
  r = 10,
  color = ORANGE,
  opacity = 1,
}) => (
  <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, opacity }}>
    <div style={{ position: "absolute", left: r - 0.75, top: 0, width: 1.5, height: r * 2, background: color }} />
    <div style={{ position: "absolute", left: 0, top: r - 0.75, width: r * 2, height: 1.5, background: color }} />
  </div>
);

export const Arrow: React.FC<{
  d: string;
  progress: number;
  color?: string;
  width?: number;
  dash?: string;
  opacity?: number;
}> = ({ d, progress, color = ORANGE, width = 2.5, dash = "7 7", opacity = 1 }) => {
  const len = 520;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dash}
        strokeDashoffset={len * (1 - clamp01(progress))}
      />
    </svg>
  );
};

export const MetricBar: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  value: number;
  color: string;
  track?: string;
  opacity?: number;
}> = ({ x, y, w, h, value, color, track = "rgba(22,27,24,0.09)", opacity = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, background: track, borderRadius: 2, opacity, overflow: "hidden" }}>
    <div style={{ width: `${clamp01(value) * 100}%`, height: "100%", background: color, borderRadius: 2 }} />
  </div>
);

/** 工业机械臂（侧视、线稿）：用于开场“身体等待大脑”。 */
export const RobotArm: React.FC<{
  x: number;
  y: number;
  scale?: number;
  shoulder: number;
  elbow: number;
  wrist: number;
  opacity?: number;
  accent?: string;
}> = ({ x, y, scale = 1, shoulder, elbow, wrist, opacity = 1, accent = ORANGE }) => (
  <svg
    width={380 * scale}
    height={460 * scale}
    viewBox="0 0 380 460"
    style={{ position: "absolute", left: x, top: y, opacity, overflow: "visible" }}
  >
    {/* 底座 */}
    <ellipse cx="150" cy="420" rx="118" ry="20" fill={`${INK}18`} />
    <rect x="86" y="362" width="128" height="52" rx="8" fill={PAPER} stroke={INK} strokeWidth="3" />
    <rect x="108" y="344" width="84" height="22" rx="4" fill={accent} opacity="0.16" stroke={INK} strokeWidth="2.5" />
    <circle cx="150" cy="356" r="16" fill={PAPER} stroke={INK} strokeWidth="3" />
    <circle cx="150" cy="356" r="5" fill={accent} />
    <g transform={`translate(150 356) rotate(${shoulder})`}>
      <rect x="-17" y="-172" width="34" height="172" rx="17" fill={PAPER} stroke={INK} strokeWidth="3.2" />
      <line x1="0" y1="-18" x2="0" y2="-150" stroke={accent} strokeWidth="2" strokeDasharray="8 9" opacity="0.55" />
      <g transform="translate(0 -172) rotate(${elbow})">
        <circle cx="0" cy="0" r="21" fill={PAPER} stroke={INK} strokeWidth="3.2" />
        <circle cx="0" cy="0" r="7" fill={accent} />
        <rect x="-14" y="-142" width="28" height="142" rx="14" fill={PAPER} stroke={INK} strokeWidth="3" />
        <g transform="translate(0 -142) rotate(${wrist})">
          <circle cx="0" cy="0" r="17" fill={PAPER} stroke={INK} strokeWidth="3" />
          <path d="M -16 -4 L -30 -22 M 16 -4 L 30 -22 M -10 6 L -22 18 M 10 6 L 22 18" stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M -32 -24 L -38 -34 M 32 -24 L 38 -34" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </g>
      </g>
    </g>
    <g opacity="0.8">
      <path d="M 70 402 L 44 402 L 44 438" stroke={INK} strokeWidth="2" fill="none" />
      <path d="M 230 402 L 258 402 L 258 438" stroke={INK} strokeWidth="2" fill="none" />
      <circle cx="44" cy="438" r="3" fill={accent} />
      <circle cx="258" cy="438" r="3" fill={accent} />
    </g>
  </svg>
);

/** 极简人形机器人：pose=0 单膝撑地，pose=1 站直。 */
export const Humanoid: React.FC<{
  x: number;
  y: number;
  scale?: number;
  pose: number;
  opacity?: number;
  accent?: string;
  look?: number;
}> = ({ x, y, scale = 1, pose, opacity = 1, accent = ORANGE, look = 0 }) => {
  const t = clamp01(pose);
  const e = easeInOut(t);
  // 整体：从低姿态到站立，轻微回弹
  const bodyY = lerp(88, 0, e) - Math.sin(clamp01((t - 0.82) / 0.18) * Math.PI) * 6;
  const bodyRot = lerp(18, 0, e);
  // 关节角：pose 0 是单膝撑地的低姿态，pose 1 站直
  const lShoulder = lerp(74, 18, e) + Math.sin(t * Math.PI) * 8;
  const lElbow = lerp(16, -8, e);
  const rShoulder = lerp(-32, -16, e);
  const rElbow = lerp(42, 8, e);
  const lHip = lerp(30, 2, e);
  const lKnee = lerp(-74, -2, e);
  const rHip = lerp(-18, -2, e);
  const rKnee = lerp(58, 2, e);
  const headTilt = lerp(-10, 0, e) + look * 4;
  return (
    <svg
      width={380 * scale}
      height={650 * scale}
      viewBox="0 0 380 650"
      style={{ position: "absolute", left: x, top: y, opacity, overflow: "visible" }}
    >
      <ellipse cx="190" cy="612" rx={lerp(128, 92, e)} ry={lerp(16, 12, e)} fill={`${INK}20`} />
      <g transform={`translate(0 ${bodyY}) rotate(${bodyRot} 190 330)`}>
        {/* 腿 */}
        <g transform={`translate(172 330) rotate(${lHip})`}>
          <rect x="-13" y="0" width="26" height="138" rx="13" fill={PAPER} stroke={INK} strokeWidth="3" />
          <g transform="translate(0 138) rotate(${lKnee})">
            <rect x="-11" y="0" width="22" height="132" rx="11" fill={PAPER} stroke={INK} strokeWidth="3" />
            <path d="M -12 130 L -40 144 L -40 154 L 8 154 L 12 138" fill={PAPER} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          </g>
        </g>
        <g transform={`translate(208 330) rotate(${rHip})`}>
          <rect x="-13" y="0" width="26" height="138" rx="13" fill={PAPER} stroke={INK} strokeWidth="3" />
          <g transform="translate(0 138) rotate(${rKnee})">
            <rect x="-11" y="0" width="22" height="132" rx="11" fill={PAPER} stroke={INK} strokeWidth="3" />
            <path d="M -12 130 L -40 144 L -40 154 L 8 154 L 12 138" fill={PAPER} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          </g>
        </g>
        {/* 躯干 */}
        <rect x="156" y="150" width="68" height="190" rx="24" fill={PAPER} stroke={INK} strokeWidth="3.4" />
        <rect x="170" y="174" width="40" height="58" rx="8" fill={`${accent}14`} stroke={`${accent}88`} strokeWidth="2" />
        <circle cx="190" cy="204" r="9" fill={accent} opacity="0.8" />
        <path d="M 166 258 L 214 258" stroke={LINE} strokeWidth="2" />
        <path d="M 166 274 L 202 274" stroke={LINE} strokeWidth="2" />
        {/* 手臂 */}
        <g transform={`translate(156 184) rotate(${lShoulder})`}>
          <rect x="-11" y="0" width="22" height="112" rx="11" fill={PAPER} stroke={INK} strokeWidth="3" />
          <g transform="translate(0 112) rotate(${lElbow})">
            <rect x="-9" y="0" width="18" height="104" rx="9" fill={PAPER} stroke={INK} strokeWidth="3" />
            <path d={`M -10 102 L -20 116 M 10 102 L 20 116`} stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
          </g>
        </g>
        <g transform={`translate(224 184) rotate(${rShoulder})`}>
          <rect x="-11" y="0" width="22" height="112" rx="11" fill={PAPER} stroke={INK} strokeWidth="3" />
          <g transform={`translate(0 112) rotate(${rElbow})`}>
            <rect x="-9" y="0" width="18" height="104" rx="9" fill={PAPER} stroke={INK} strokeWidth="3" />
            <path d={`M -10 102 L -20 116 M 10 102 L 20 116`} stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
          </g>
        </g>
        {/* 颈与头 */}
        <rect x="182" y="128" width="16" height="28" rx="6" fill={PAPER} stroke={INK} strokeWidth="3" />
        <g transform={`rotate(${headTilt} 190 96)`}>
          <rect x="150" y="40" width="80" height="92" rx="28" fill={PAPER} stroke={INK} strokeWidth="3.4" />
          <rect x="163" y="68" width="54" height="30" rx="15" fill={INK} opacity="0.9" />
          <circle cx="178" cy="83" r="5.5" fill={PAPER} />
          <circle cx="202" cy="83" r="5.5" fill={PAPER} />
          <path d="M 180 112 L 200 112" stroke={`${accent}`} strokeWidth="4" strokeLinecap="round" />
          <path d="M 150 62 L 136 48 M 230 62 L 244 48" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <circle cx="134" cy="46" r="4" fill={accent} />
          <circle cx="246" cy="46" r="4" fill={accent} />
        </g>
      </g>
      {/* 姿态辅助线 */}
      <path d="M 92 560 C 92 470 130 400 190 372" stroke={`${accent}44`} strokeWidth="2" strokeDasharray="6 8" fill="none" />
    </svg>
  );
};

export const House: React.FC<{ x: number; y: number; s?: number; color?: string; opacity?: number }> = ({
  x,
  y,
  s = 1,
  color = INK,
  opacity = 1,
}) => (
  <svg width={80 * s} height={76 * s} viewBox="0 0 80 76" style={{ position: "absolute", left: x, top: y, opacity }}>
    <path d="M 8 34 L 40 8 L 72 34" fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round" />
    <path d="M 16 32 L 16 68 L 64 68 L 64 32" fill={PAPER} stroke={color} strokeWidth="3.5" strokeLinejoin="round" />
    <rect x="34" y="46" width="13" height="22" fill={color} opacity="0.82" />
    <rect x="22" y="40" width="8" height="8" fill={color} opacity="0.3" />
    <rect x="50" y="40" width="8" height="8" fill={color} opacity="0.3" />
  </svg>
);

export const Cup: React.FC<{ x: number; y: number; s?: number; tint?: string; opacity?: number; rotate?: number }> = ({
  x,
  y,
  s = 1,
  tint = INK,
  opacity = 1,
  rotate = 0,
}) => (
  <svg width={88 * s} height={100 * s} viewBox="0 0 88 100" style={{ position: "absolute", left: x, top: y, opacity, transform: `rotate(${rotate}deg)`, overflow: "visible" }}>
    <path d="M 18 18 L 24 86 Q 26 94 36 94 L 58 94 Q 68 94 70 86 L 76 18 Z" fill={PAPER} stroke={tint} strokeWidth="3.4" />
    <ellipse cx="47" cy="18" rx="29" ry="8" fill={PAPER} stroke={tint} strokeWidth="3.4" />
    <ellipse cx="47" cy="19" rx="20" ry="4.5" fill={`${tint}14`} />
    <path d="M 78 38 C 96 38 98 70 78 74" fill="none" stroke={tint} strokeWidth="4" />
  </svg>
);

export const Shield: React.FC<{ x: number; y: number; s?: number; color?: string; progress?: number; opacity?: number }> = ({
  x,
  y,
  s = 1,
  color = GREEN,
  progress = 1,
  opacity = 1,
}) => {
  const t = easeOut(progress);
  return (
    <svg width={150 * s} height={170 * s} viewBox="0 0 150 170" style={{ position: "absolute", left: x, top: y, opacity, overflow: "visible" }}>
      <path d="M 75 8 L 136 32 L 136 84 C 136 122 110 148 75 162 C 40 148 14 122 14 84 L 14 32 Z" fill={`${color}10`} stroke={color} strokeWidth="3" opacity={0.25 + 0.75 * t} />
      <path d="M 75 24 L 120 42 L 120 84 C 120 112 101 133 75 145 C 49 133 30 112 30 84 L 30 42 Z" fill="none" stroke={color} strokeWidth="2" opacity={0.3 + 0.7 * t} />
      <path d="M 52 82 L 68 98 L 100 64" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="80" strokeDashoffset={80 * (1 - t)} />
    </svg>
  );
};

/** 技术标签：小方块 + 引线 + 文本。 */
export const Callout: React.FC<{
  x: number;
  y: number;
  w?: number;
  text: string;
  sub?: string;
  color?: string;
  progress: number;
  align?: "left" | "right";
}> = ({ x, y, w = 220, text, sub, color = ORANGE, progress, align = "left" }) => {
  const t = easeOut(progress);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        opacity: t,
        transform: `translateY(${(1 - t) * 10}px)`,
        textAlign: align,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: align === "right" ? "flex-end" : "flex-start", gap: 8 }}>
        <span style={{ width: 9, height: 9, background: color, display: "inline-block" }} />
        <span style={mono(18, color, 800)}>{text}</span>
      </div>
      {sub ? <div style={{ ...mono(14, MUTED, 600), marginTop: 4 }}>{sub}</div> : null}
    </div>
  );
};

/** 小光标 / 机械指针。 */
export const Cursor: React.FC<{ x: number; y: number; s?: number; color?: string; opacity?: number }> = ({
  x,
  y,
  s = 1,
  color = INK,
  opacity = 1,
}) => (
  <svg width={34 * s} height={46 * s} viewBox="0 0 34 46" style={{ position: "absolute", left: x, top: y, opacity, overflow: "visible" }}>
    <path d="M 4 3 L 29 25 L 17 27 L 24 42 L 17 45 L 10 30 L 4 38 Z" fill={PAPER} stroke={color} strokeWidth="2.6" strokeLinejoin="round" />
  </svg>
);

/** 确定性的纸面尘埃（不是星空）。 */
export const Dust: React.FC<{ seed: number; p: number; color?: string; count?: number; opacity?: number }> = ({
  seed,
  p,
  color = ORANGE,
  count = 18,
  opacity = 0.28,
}) => (
  <>
    {Array.from({ length: count }, (_, k) => {
      const x = 140 + rand(seed + k * 4) * 800;
      const y = 300 + rand(seed + k * 4 + 1) * 1000;
      const s = 2 + rand(seed + k * 4 + 2) * 4;
      const drift = 18 + rand(seed + k * 4 + 3) * 44;
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
            opacity: opacity * (0.25 + 0.75 * rand(seed + k + 99)) * (1 - Math.max(0, p - 0.92) / 0.08),
          }}
        />
      );
    })}
  </>
);

/** 技术网格方块阵列（用于 42 任务 / 30 家庭等）。 */
export const TileGrid: React.FC<{
  x: number;
  y: number;
  cols: number;
  rows: number;
  size: number;
  gap: number;
  progress: number;
  color?: string;
  active?: number;
  seed?: number;
}> = ({ x, y, cols, rows, size, gap, progress, color = GREEN, active = -1, seed = 1 }) => (
  <>
    {Array.from({ length: cols * rows }, (_, k) => {
      const c = k % cols;
      const r = Math.floor(k / cols);
      const t = stagger(progress, 0, 0.012, k, 0.16);
      const on = k === active || (active < 0 && rand(seed + k * 3) > 0.55);
      return (
        <div
          key={k}
          style={{
            position: "absolute",
            left: x + c * (size + gap),
            top: y + r * (size + gap),
            width: size,
            height: size,
            boxSizing: "border-box",
            border: `1.5px solid ${color}${on ? "AA" : "38"}`,
            background: on ? `${color}14` : "transparent",
            opacity: t,
            transform: `scale(${0.7 + 0.3 * t})`,
          }}
        />
      );
    })}
  </>
);
