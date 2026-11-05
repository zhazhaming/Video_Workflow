// infographics.tsx —— 信息图组件库（gen 层，一屏一图一物，片①②语法沉淀）。
// 全部确定性动画（rand(seed+k)），元素数均 ≤220，只用 transform/opacity。
import React from "react";
import { FONT_STACK, clamp, mixHex, rand } from "../../dv/atmosphere";

const INK = "#14110F";

/** 3D 骰子（CSS 立方体）：缓旋 + 落定，实物锚 */
export const Dice3D: React.FC<{
  size?: number;
  p: number;
  seed: number;
  x?: number;
  y?: number;
}> = ({ size = 190, p, seed, x = 50, y = 44 }) => {
  const rotY = -28 + Math.sin(p * Math.PI * 2 + seed) * 9;
  const rotX = -16 + Math.cos(p * Math.PI * 1.4 + seed) * 7;
  const drop = (1 - clamp(p * 3.2, 0, 1)) ** 2 * -420;
  const face = (n: number, tf: string) => (
    <div
      key={n}
      style={{
        position: "absolute",
        width: size,
        height: size,
        background: "linear-gradient(145deg,#F5EFDD,#D9CFB4)",
        borderRadius: size * 0.14,
        transform: tf,
        boxShadow: "inset 0 0 18px rgba(0,0,0,.14)",
        display: "grid",
      }}
    >
      {PIPS[n].map(([px, py], i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${px}%`,
            top: `${py}%`,
            width: size * 0.14,
            height: size * 0.14,
            borderRadius: "50%",
            background: n === 1 ? "#C8452D" : "#2A2A32",
            transform: "translate(-50%,-50%)",
          }}
        />
      ))}
    </div>
  );
  const h = size / 2;
  return (
    <div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, perspective: 900, zIndex: 6 }}>
      <div
        style={{
          width: size,
          height: size,
          transformStyle: "preserve-3d",
          transform: `translateY(${drop}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
        }}
      >
        {face(1, `translateZ(${h}px)`)}
        {face(6, `rotateY(180deg) translateZ(${h}px)`)}
        {face(3, `rotateY(90deg) translateZ(${h}px)`)}
        {face(4, `rotateY(-90deg) translateZ(${h}px)`)}
        {face(5, `rotateX(90deg) translateZ(${h}px)`)}
        {face(2, `rotateX(-90deg) translateZ(${h}px)`)}
      </div>
      <div
        style={{
          position: "absolute",
          left: -size * 0.5,
          top: size * 0.92,
          width: size * 2,
          height: size * 0.34,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(0,0,0,.5), transparent 70%)",
          opacity: 0.55 * clamp(p * 3.2, 0, 1),
        }}
      />
    </div>
  );
};

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[26, 26], [50, 50], [74, 74]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[30, 24], [70, 24], [30, 50], [70, 50], [30, 76], [70, 76]],
};

/** 对局/对比双条卡：双色进度条 + 百分比 + 胜负标（片①赌局卡语法） */
export const DuelBars: React.FC<{
  left: { label: string; pct: number; tag?: string };
  right: { label: string; pct: number; tag?: string };
  p: number;
  accent: string;
  down?: string; // 劣势色
  x?: number;
  y?: number;
  light?: boolean;
}> = ({ left, right, p, accent, down = "#1E7A46", x = 90, y = 620, light }) => {
  const bd = light ? "rgba(20,17,15,.3)" : "rgba(232,217,168,.35)";
  const txt = light ? "rgba(20,17,15,.85)" : "rgba(238,230,210,.92)";
  const bar = (d: { label: string; pct: number; tag?: string }, color: string, i: number) => {
    const fill = clamp((p - i * 0.18) * 1.6, 0, 1) * d.pct;
    return (
      <div key={i} style={{ marginBottom: 26 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <span style={{ fontSize: 28, color: txt, letterSpacing: 2 }}>{d.label}</span>
          <span style={{ fontSize: 44, fontWeight: 700, color: d.tag ? color : txt }}>
            {fill.toFixed(1)}%
            {d.tag && (
              <span
                style={{
                  marginLeft: 12,
                  fontSize: 26,
                  padding: "2px 12px",
                  borderRadius: 8,
                  border: `1.5px solid ${d.tag === "赢" ? color : down}`,
                  color: d.tag === "赢" ? color : down,
                }}
              >
                {d.tag}
              </span>
            )}
          </span>
        </div>
        <div style={{ height: 16, border: `1px solid ${bd}`, borderRadius: 8, padding: 2 }}>
          <div style={{ width: `${fill}%`, height: "100%", borderRadius: 6, background: `linear-gradient(90deg,${color}88,${color})` }} />
        </div>
      </div>
    );
  };
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 900, fontFamily: FONT_STACK, zIndex: 6 }}>
      {bar(left, accent, 0)}
      {bar(right, down, 1)}
    </div>
  );
};

/** 钟形曲线生长：直方柱逐根升起 + 外轮廓线（大数定律/分布通用） */
export const BellCurve: React.FC<{
  p: number;
  accent: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  seed?: number;
  label?: string;
}> = ({ p, accent, x = 50, y = 56, w = 880, h = 520, seed = 11, label }) => {
  const bars = 44;
  const g = (i: number) => Math.exp(-((i / (bars - 1) - 0.5) ** 2) / (2 * 0.16 ** 2));
  return (
    <div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,0)", width: w, fontFamily: FONT_STACK, zIndex: 6 }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1={0} x2={w} y1={h - 2} y2={h - 2} stroke={INK} strokeOpacity={0.4} strokeWidth={2} />
        {Array.from({ length: bars }, (_, i) => {
          const bh = g(i) * (h - 70) * clamp(p * 1.9 - (i / bars) * 0.9, 0, 1);
          const bw = w / bars - 6;
          return (
            <rect key={i} x={(i * w) / bars + 3} y={h - 2 - bh} width={bw} height={Math.max(0, bh)} fill={accent} fillOpacity={0.32 + 0.3 * g(i)} rx={2} />
          );
        })}
        <polyline
          points={Array.from({ length: 60 }, (_, i) => {
            const gx = (i / 59) * w;
            const gy = h - 2 - g(i / (bars - 1) / (1 / (bars - 1)) * (bars / 60) * 0 + g(Math.round((i / 59) * (bars - 1))) * (h - 70) * clamp(p * 1.9 - 0.45, 0, 1));
            return `${gx},${gy.toFixed(1)}`;
          }).join(" ")}
          fill="none"
          stroke="#E8D9A8"
          strokeOpacity={0.85}
          strokeWidth={3}
        />
      </svg>
      {label && (
        <div style={{ textAlign: "center", fontSize: 28, color: "rgba(238,230,210,.8)", marginTop: 10, letterSpacing: 4 }}>
          {label}
        </div>
      )}
      {rand(seed) > 2 && null}
    </div>
  );
};

/** 粒子云：双簇对比（人群/样本分布通用） */
export const ParticleCloud: React.FC<{
  p: number;
  accent: string;
  second?: string;
  cx?: number[];
  cy?: number[];
  count?: number;
  seed: number;
}> = ({ p, accent, second = "#8AB6D6", cx = [340, 760], cy = [560, 560], count = 90, seed }) => {
  const pts = React.useMemo(
    () =>
      Array.from({ length: count }, (_, k) => ({
        c: k % 2,
        ox: (rand(seed + k * 3) - 0.5) * 330,
        oy: (rand(seed + k * 3 + 1) - 0.5) * 560,
        r: 3 + rand(seed + k * 3 + 2) * 4,
        dly: rand(seed + k * 3 + 3),
      })),
    [seed, count],
  );
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FONT_STACK, zIndex: 6 }}>
      {pts.map((pt, k) => {
        const show = clamp((p - pt.dly * 0.5) * 2.4, 0, 1);
        return (
          <span
            key={k}
            style={{
              position: "absolute",
              left: cx[pt.c] + pt.ox,
              top: cy[pt.c] + pt.oy + Math.sin(p * Math.PI * 3 + k) * 6,
              width: pt.r * 2,
              height: pt.r * 2,
              borderRadius: "50%",
              background: pt.c === 0 ? accent : second,
              opacity: 0.75 * show,
            }}
          />
        );
      })}
    </div>
  );
};

/** 收敛折线：波动随时间衰减、贴向目标虚线（大数定律式） */
export const ConvergeLine: React.FC<{
  p: number;
  accent: string;
  target?: number; // 0~1
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  seed: number;
  light?: boolean;
}> = ({ p, accent, target = 0.6, x = 90, y = 520, w = 900, h = 560, seed, light }) => {
  const N = 60;
  const val = (i: number) => {
    const decay = Math.exp(-i / 9) * (1 - clamp(p * 1.4, 0.15, 1) * 0.55);
    return target + (rand(seed + i * 7) - 0.5) * 0.62 * decay;
  };
  const shown = Math.floor(clamp(p * 1.25, 0, 1) * N);
  const ty = h - target * h;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: x, top: y, zIndex: 6 }}>
      <line x1={0} x2={w} y1={ty} y2={ty} stroke={light ? INK : "#E8D9A8"} strokeOpacity={0.5} strokeDasharray="8 10" strokeWidth={2.5} />
      <polyline
        points={Array.from({ length: shown }, (_, i) => `${(i / (N - 1)) * w},${(h - val(i) * h).toFixed(1)}`).join(" ")}
        fill="none"
        stroke={accent}
        strokeWidth={3.5}
        strokeLinejoin="round"
        strokeOpacity={0.95}
      />
      {shown > 0 && (
        <circle cx={((shown - 1) / (N - 1)) * w} cy={h - val(shown - 1) * h} r={7} fill={accent} />
      )}
    </svg>
  );
};

/** 提问卡：开场共鸣/章节测验（片②“你最怕哪一块”语法） */
export const QuizCard: React.FC<{
  q: string;
  answer?: string;
  revealed: boolean;
  p: number;
  accent: string;
  light?: boolean;
}> = ({ q, answer, revealed, p, accent, light }) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      top: 700,
      transform: `translateX(-50%) translateY(${(1 - clamp(p * 2, 0, 1)) * 40}px)`,
      opacity: clamp(p * 2, 0, 1),
      fontFamily: FONT_STACK,
      zIndex: 8,
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontSize: 64,
        fontWeight: 700,
        color: light ? INK : "#F2EDE0",
        textShadow: "0 3px 22px rgba(0,0,0,.55)",
        letterSpacing: 4,
      }}
    >
      {q}
    </div>
    {answer && (
      <div
        style={{
          display: "inline-block",
          marginTop: 34,
          fontSize: 40,
          fontWeight: 700,
          color: light ? INK : "#E8D9A8",
          border: `2px solid ${accent}`,
          borderRadius: 12,
          padding: "10px 34px",
          background: "rgba(10,10,14,.5)",
          opacity: revealed ? 1 : 0,
          letterSpacing: 3,
        }}
      >
        {answer}
      </div>
    )}
    {mixHex(accent, INK, 0.5) && null}
  </div>
);
