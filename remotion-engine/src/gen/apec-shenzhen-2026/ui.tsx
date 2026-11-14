// APEC 2026 深圳 · 纸感海洋信息图共用件
// 风格：暖纸底、深墨字、海蓝结构线、朱红强调；所有动画只由 p 驱动，只用 transform/opacity。
import React from "react";
import { mixHex } from "../../dv/atmosphere";

export const INK = "#17221F";
export const INK_SOFT = "rgba(23,34,31,0.64)";
export const INK_FAINT = "rgba(23,34,31,0.18)";
export const OCEAN = "#1F5960";
export const OCEAN_LIGHT = "#7FA7A2";
export const CORAL = "#C45138";
export const GOLD = "#B8894A";
export const CREAM = "#FBF6EA";
export const WHITE = "#FFFDF7";
export const SAGE = "#6D7F69";
export const LINE = "rgba(23,34,31,0.12)";

export const SERIF = '"Songti SC","STSong","SimSun","Noto Serif SC",serif';
export const SANS = '"Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif';
export const MONO = '"Cascadia Mono","Consolas","Microsoft YaHei",monospace';

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInOut = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeBack = (t: number) => {
  const x = clamp01(t);
  const s = 1.55;
  return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
};
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / Math.max(0.001, b - a));
export const pop = (t: number) => easeBack(t);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);
export const exitFade = (p: number) => 1 - clamp01((p - 0.9) / 0.1);
export const mk = (marks: { start: number; dur: number }[] | undefined, i: number, fallback: number) =>
  marks && marks[i] ? marks[i].start : fallback;

/** 二次贝塞尔取点，用于航线上的移动光点 */
export const quadPoint = (
  p0: [number, number],
  c: [number, number],
  p1: [number, number],
  t: number,
): [number, number] => {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0],
    u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1],
  ];
};

/** 暖纸底：双色渐变 + 纸纹横线 + 右上柔光 + 左下海图等高线 + 裁切角标 */
export const Paper: React.FC<{ c1: string; c2: string; accent?: string }> = ({ c1, c2, accent = CORAL }) => {
  const rings = [0, 1, 2, 3, 4];
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: `linear-gradient(152deg, ${c1} 0%, ${c2} 100%)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -180,
          top: -220,
          width: 760,
          height: 760,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${GOLD}2b 0%, ${GOLD}10 38%, transparent 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.5,
          backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 71px, ${INK}09 71px 72px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 54,
          top: 0,
          bottom: 0,
          width: 1,
          background: `${INK}12`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 188,
          width: 54,
          height: 3,
          background: accent,
          opacity: 0.9,
        }}
      />
      {rings.map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 60 - i * 26,
            bottom: 260 - i * 46,
            width: 430 + i * 140,
            height: 210 + i * 70,
            borderRadius: "50%",
            border: `1px solid ${OCEAN}${i === 0 ? "24" : "11"}`,
            transform: "rotate(-8deg)",
          }}
        />
      ))}
      <div style={{ position: "absolute", right: 54, bottom: 54, width: 46, height: 1, background: `${INK}22` }} />
      <div style={{ position: "absolute", right: 54, bottom: 54, width: 1, height: 46, background: `${INK}22` }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 210px rgba(84,58,32,0.13)",
        }}
      />
    </div>
  );
};

/** 小标签：编号 + 海蓝短线 + 字距拉开 */
export const Cap: React.FC<{
  text: string;
  x?: number;
  y?: number;
  color?: string;
  size?: number;
  opacity?: number;
  accent?: string;
  mono?: boolean;
}> = ({ text, x = 96, y = 330, color = INK_SOFT, size = 22, opacity = 1, accent = CORAL, mono = false }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      display: "flex",
      alignItems: "center",
      gap: 12,
      opacity,
      fontFamily: mono ? MONO : SANS,
      fontSize: size,
      color,
      letterSpacing: mono ? 3.5 : 3,
      whiteSpace: "nowrap",
    }}
  >
    <span style={{ width: 20, height: 2, background: accent, display: "inline-block" }} />
    <span>{text}</span>
  </div>
);

/** 水平细线，progress 用宽度生长 */
export const Hair: React.FC<{
  x: number;
  y: number;
  w: number;
  progress?: number;
  color?: string;
  thickness?: number;
  opacity?: number;
}> = ({ x, y, w, progress = 1, color = INK, thickness = 1.5, opacity = 0.24 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: Math.max(0, w * clamp01(progress)),
      height: thickness,
      background: color,
      opacity,
    }}
  />
);

/** 印章：朱红细框 + 宋体，微微旋转 */
export const Stamp: React.FC<{
  text: string;
  x: number;
  y: number;
  size?: number;
  rotate?: number;
  t?: number;
  color?: string;
  filled?: boolean;
}> = ({ text, x, y, size = 52, rotate = -8, t = 1, color = CORAL, filled = false }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${0.72 + 0.28 * pop(t)})`,
      opacity: clamp01(t * 1.45),
      border: `3px solid ${color}`,
      borderRadius: 7,
      padding: filled ? "9px 18px" : "9px 16px",
      color: filled ? CREAM : color,
      background: filled ? color : "rgba(251,246,234,0.55)",
      fontFamily: SERIF,
      fontSize: size,
      fontWeight: 700,
      letterSpacing: 5,
      lineHeight: 1,
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

/** 大号宋体数字，带极细上标框 */
export const BigSerif: React.FC<{
  text: string;
  x: number;
  y: number;
  size?: number;
  color?: string;
  opacity?: number;
  align?: "left" | "right";
}> = ({ text, x, y, size = 160, color = INK, opacity = 1, align = "left" }) => (
  <div
    style={{
      position: "absolute",
      left: align === "left" ? x : undefined,
      right: align === "right" ? x : undefined,
      top: y,
      fontFamily: SERIF,
      fontSize: size,
      fontWeight: 700,
      color,
      opacity,
      lineHeight: 0.92,
      letterSpacing: -6,
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

/** 深圳天际线：平安金融中心、春笋、市民中心与深圳湾大桥，全部为示意剪影 */
export const ShenzhenSkyline: React.FC<{
  x?: number;
  y?: number;
  w?: number;
  opacity?: number;
  color?: string;
  lights?: string;
  lightT?: number;
}> = ({ x = 0, y = 1180, w = 1080, opacity = 1, color = INK, lights = CREAM, lightT = 0 }) => {
  const s = w / 1080;
  const windows = React.useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        x: 120 + ((i * 73) % 820),
        y: 40 + ((i * 47) % 300),
        w: 3 + (i % 3),
        h: 4 + (i % 2) * 2,
      })),
    [],
  );
  const buildings = [
    { x: 98, w: 92, h: 250, roof: "flat" },
    { x: 198, w: 64, h: 330, roof: "flat" },
    { x: 270, w: 106, h: 210, roof: "step" },
    { x: 384, w: 74, h: 380, roof: "flat" },
    { x: 466, w: 118, h: 300, roof: "curve" },
    { x: 592, w: 80, h: 460, roof: "taper" },
    { x: 680, w: 58, h: 350, roof: "flat" },
    { x: 748, w: 104, h: 270, roof: "step" },
    { x: 862, w: 70, h: 410, roof: "flat" },
    { x: 940, w: 54, h: 300, roof: "flat" },
  ];
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${x} ${y}) scale(${s})`}>
          {buildings.map((b, i) => {
            const top = -b.h;
            const fill = mixHex(color, "#1F5960", 0.12 + (i % 3) * 0.06);
            if (b.roof === "taper") {
              return (
                <g key={i}>
                  <path d={`M ${b.x} 0 L ${b.x} ${top + 50} L ${b.x + b.w / 2} ${top} L ${b.x + b.w} ${top + 50} L ${b.x + b.w} 0 Z`} fill={fill} opacity={0.9} />
                  <rect x={b.x + b.w / 2 - 2} y={top - 44} width={4} height={44} fill={fill} opacity={0.9} />
                </g>
              );
            }
            if (b.roof === "curve") {
              return (
                <g key={i}>
                  <path d={`M ${b.x} 0 L ${b.x} ${top + 36} Q ${b.x + b.w / 2} ${top - 24} ${b.x + b.w} ${top + 36} L ${b.x + b.w} 0 Z`} fill={fill} opacity={0.88} />
                </g>
              );
            }
            if (b.roof === "step") {
              return (
                <g key={i}>
                  <rect x={b.x} y={top + 28} width={b.w} height={b.h - 28} fill={fill} opacity={0.88} />
                  <rect x={b.x + b.w * 0.2} y={top} width={b.w * 0.6} height={30} fill={fill} opacity={0.88} />
                </g>
              );
            }
            return <rect key={i} x={b.x} y={top} width={b.w} height={b.h} fill={fill} opacity={0.88} />;
          })}
          <line x1={0} y1={0} x2={1080} y2={0} stroke={INK} strokeOpacity={0.32} strokeWidth={2} />
          {/* 深圳湾大桥 */}
          <g opacity={0.7}>
            <path d="M 40 28 Q 170 -12 300 28" fill="none" stroke={OCEAN} strokeWidth={2} />
            <path d="M 300 28 Q 430 68 560 28" fill="none" stroke={OCEAN} strokeWidth={2} />
            <line x1={160} y1={8} x2={160} y2={-98} stroke={OCEAN} strokeWidth={4} />
            <line x1={430} y1={58} x2={430} y2={-48} stroke={OCEAN} strokeWidth={4} />
            {Array.from({ length: 7 }, (_, i) => (
              <line key={`c${i}`} x1={160} y1={-90} x2={80 + i * 26} y2={28} stroke={OCEAN} strokeWidth={1} opacity={0.45} />
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <line key={`d${i}`} x1={430} y1={-40} x2={350 + i * 26} y2={58} stroke={OCEAN} strokeWidth={1} opacity={0.45} />
            ))}
          </g>
          {windows.map((wd, i) => (
            <rect
              key={`w${i}`}
              x={wd.x}
              y={-wd.y}
              width={wd.w}
              height={wd.h}
              fill={lights}
              opacity={lightT * (0.35 + (i % 5) * 0.1)}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

/** 21 根羽翼的鲲鹏会标（抽象重构，不是官方标志的精确复刻） */
export const KunpengMark: React.FC<{
  cx: number;
  cy: number;
  size?: number;
  t?: number;
  color?: string;
  accent?: string;
  showCore?: boolean;
}> = ({ cx, cy, size = 1, t = 1, color = OCEAN, accent = CORAL, showCore = true }) => {
  const feathers = React.useMemo(
    () =>
      Array.from({ length: 21 }, (_, i) => {
        const side = i < 10 ? -1 : i > 10 ? 1 : 0;
        const k = side === -1 ? i : side === 1 ? i - 11 : 0;
        // 两翼从身体两侧的不同基点长出，形成有厚度的翼面，而不是同一个圆心的放射线
        const baseX = side === 0 ? 0 : side * (18 + k * 5.5);
        const baseY = side === 0 ? 60 : -8 + k * 6.4;
        const angle = side === 0 ? 90 : side === -1 ? 200 + k * 3.6 : -20 - k * 3.6;
        const len = side === 0 ? 96 : 168 + Math.sin((k + 1) * 0.62) * 82;
        const thick = side === 0 ? 10 : 4.2 + (k % 3) * 1.7;
        return { baseX, baseY, angle, len, thick, side, k, delay: i * 0.018 };
      }),
    [],
  );
  return (
    <div
      style={{
        position: "absolute",
        left: cx,
        top: cy,
        width: 0,
        height: 0,
        transform: `scale(${size})`,
        transformOrigin: "0 0",
      }}
    >
      {/* 两片半透明的翼膜，让 21 根羽翼落在“翅膀”上，而不是散成太阳光芒 */}
      <svg
        width={760}
        height={420}
        viewBox="-380 -210 760 420"
        style={{ position: "absolute", left: -380, top: -150, overflow: "visible", opacity: 0.9 * clamp01(t * 1.5) }}
      >
        <path
          d="M -8 28 C -110 -86 -246 -156 -356 -116 C -296 -14 -196 76 -70 132 Z"
          fill={color}
          fillOpacity={0.055}
          stroke={color}
          strokeOpacity={0.2}
          strokeWidth={1.2}
        />
        <path
          d="M 8 28 C 110 -86 246 -156 356 -116 C 296 -14 196 76 70 132 Z"
          fill={color}
          fillOpacity={0.055}
          stroke={color}
          strokeOpacity={0.2}
          strokeWidth={1.2}
        />
      </svg>

      {feathers.map((f, i) => {
        const tt = clamp01((t - f.delay) / 0.28);
        const e = easeOut(tt);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: f.baseX,
              top: f.baseY,
              width: f.len,
              height: f.thick,
              borderRadius: f.thick,
              background:
                f.side === 0
                  ? `linear-gradient(90deg, ${accent}, ${GOLD})`
                  : `linear-gradient(90deg, ${color}${i % 2 ? "cc" : "99"}, ${color}22)`,
              transformOrigin: "0 50%",
              transform: `rotate(${f.angle}deg) scaleX(${e}) translateY(${(1 - e) * 8}px)`,
              opacity: 0.9 * e,
              boxShadow: f.side === 0 ? `0 0 20px ${accent}55` : undefined,
            }}
          />
        );
      })}

      {/* 鸟身：头、身体、尾，给 21 根羽翼一个明确的“鸟”的骨架 */}
      <div
        style={{
          position: "absolute",
          left: -17,
          top: -34,
          width: 34,
          height: 38,
          borderRadius: "50% 50% 46% 46%",
          background: color,
          opacity: 0.92 * clamp01(t * 1.4),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 8,
          top: -36,
          width: 26,
          height: 13,
          background: accent,
          clipPath: "polygon(0 0, 100% 50%, 0 100%)",
          opacity: 0.92 * clamp01(t * 1.4),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -15,
          top: -2,
          width: 30,
          height: 126,
          background: `linear-gradient(180deg, ${color}, ${color}66)`,
          clipPath: "polygon(50% 0, 100% 18%, 76% 100%, 24% 100%, 0 18%)",
          opacity: 0.9 * clamp01(t * 1.3),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -2,
          top: 106,
          width: 4,
          height: 40,
          background: color,
          opacity: 0.5 * clamp01(t * 1.2),
        }}
      />

      {showCore ? (
        <div
          style={{
            position: "absolute",
            left: -31,
            top: 112,
            width: 62,
            height: 62,
            borderRadius: "50%",
            border: `1.5px solid ${accent}`,
            background: `${CREAM}ee`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: SERIF,
            fontSize: 28,
            fontWeight: 700,
            color: accent,
            transform: `scale(${0.7 + 0.3 * pop(clamp01((t - 0.25) / 0.25))})`,
            opacity: clamp01((t - 0.25) / 0.2),
          }}
        >
          21
        </div>
      ) : null}
    </div>
  );
};
