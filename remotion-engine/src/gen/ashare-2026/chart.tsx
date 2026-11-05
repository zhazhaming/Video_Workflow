// A股年度日线图场景（共享组件）：逐日跳动 + 事件爆发冲击波 + 震屏 + 均线 + 月份轴。
// 数据来自 ./data.ts（真实日线快照）；全部动画由 p 驱动，随机只用 rand(seed+k)。
// 场景即信息主体：读数/坐标/标注按 gen-scene-contract 的"文字例外"放在安全区，
// 避开左上镜标签（DataVideo 固定 top:170/left:72）与底部字幕带（y>1400）。
import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT_STACK, clamp, luminance, mixHex, rand } from "../../dv/atmosphere";
import { CLOSES, DATES, EVENTS, N, Y_MAX, Y_MIN, type ChartEvent } from "./data";

const X0 = 180; // 左侧留足纵轴刻度安全区：推镜 1.2 时左边界裁至 ~63px，刻度起点 ~102px
const X1 = 984;
const Y_TOP = 400;
const Y_BOT = 1150;
const AXIS_Y = Y_BOT + 52; // 月份轴行
const INK_LIGHT = "#14110F"; // 纸感浅底用墨
const INK_DARK = "#EDE6D6";  // 暗调底用暖白（cinema+gold 对标版）
const UP_LIGHT = "#C8452D";
const UP_DARK = "#E2604A";
const DOWN_LIGHT = "#1E7A46";
const DOWN_DARK = "#3FBF7F";

export const xOf = (d: number): number => X0 + (d / (N - 1)) * (X1 - X0);
export const yOf = (c: number): number => Y_BOT - ((c - Y_MIN) / (Y_MAX - Y_MIN)) * (Y_BOT - Y_TOP);

export type ChartMode = "sweep" | "window" | "final";
export interface DayStop {
  p: number; // 镜内进度 0~1
  day: number; // 对应交易日下标
}

const dayAtStops = (p: number, stops: DayStop[]): number => {
  if (stops.length === 0) return 0;
  if (p <= stops[0].p) return stops[0].day;
  for (let i = 0; i < stops.length - 1; i++) {
    const s0 = stops[i];
    const s1 = stops[i + 1];
    if (p <= s1.p) {
      const t = clamp((p - s0.p) / Math.max(1e-6, s1.p - s0.p), 0, 1);
      const e = t * t * (3 - 2 * t);
      return s0.day + (s1.day - s0.day) * e;
    }
  }
  return stops[stops.length - 1].day;
};

/** 事件日被游标跨过的 p（用于 0.4s 的爆发/震屏衰减，避免驻留时一直震）。 */
const pAtDay = (stops: DayStop[], day: number): number => {
  for (let i = 0; i < stops.length - 1; i++) {
    const s0 = stops[i];
    const s1 = stops[i + 1];
    const lo = Math.min(s0.day, s1.day);
    const hi = Math.max(s0.day, s1.day);
    if (day >= lo && day <= hi) {
      const t = Math.abs(s1.day - s0.day) < 1e-6 ? 0 : (day - s0.day) / (s1.day - s0.day);
      return s0.p + t * (s1.p - s0.p);
    }
  }
  return 1;
};

// MA20 均线（模块级算一次）：i<19 时沿用前值起点，保证从窗口首日就有线
const MA: number[] = (() => {
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < N; i++) {
    sum += CLOSES[i];
    if (i >= 20) sum -= CLOSES[i - 20];
    out.push(sum / Math.min(i + 1, 20));
  }
  return out;
})();

// 月份轴刻度：月份变化处取整；逢偶数月出标签（避免拥挤）
const MONTH_TICKS: { d: number; label: string; major: boolean }[] = (() => {
  const ticks: { d: number; label: string; major: boolean }[] = [];
  let lastMon = "";
  let idx = 0;
  for (let i = 0; i < DATES.length; i++) {
    const mon = DATES[i].slice(0, 7);
    if (mon !== lastMon) {
      if (lastMon) {
        ticks.push({ d: i, label: `${DATES[i].slice(2, 4)}.${DATES[i].slice(5, 7)}`, major: idx % 2 === 0 });
        idx++;
      }
      lastMon = mon;
    }
  }
  return ticks;
})();

const easeOut = (t: number): number => 1 - Math.pow(1 - clamp(t, 0, 1), 1.6);

export const YearChart: React.FC<{
  p: number;
  a: number;
  b: number;
  mode: ChartMode;
  c1: string;
  c2: string;
  accent: string;
  seed: number;
  /** 事件驻留：p→交易日 的分段映射；缺省时保持原来的线性扫动 */
  stops?: DayStop[];
}> = ({ p, a, b, mode, c1, c2, accent, seed, stops }) => {
  const isDark = luminance(c1) <= 0.5;
  const INK = isDark ? INK_DARK : INK_LIGHT;
  const UP = isDark ? UP_DARK : UP_LIGHT;
  const DOWN = isDark ? DOWN_DARK : DOWN_LIGHT;
  const span = Math.max(1, b - a);
  // 有 stops 时：p 直接走分段映射（念到事件就停在事件日），
  // 不再用 0.87 缓出；否则保留原来的扫动/缓出。
  const pcRaw = mode === "window" ? Math.min(1, p / 0.87) : p;
  const pc = stops && stops.length > 0 ? p : mode === "window" ? easeOut(pcRaw) : pcRaw;
  const dayFloat =
    stops && stops.length > 0
      ? dayAtStops(pc, stops)
      : mode === "sweep"
        ? p * (N - 1)
        : mode === "final"
          ? N - 1
          : a + pc * span;
  const D = Math.floor(dayFloat);
  const dCur = Math.min(N - 1, Math.max(a, Math.min(D, b === N - 1 ? N - 1 : b)));
  // 窗口内逐日进度的小数部分 → 每跳一天的脉冲相位
  const dayFrac = mode === "sweep" ? 0 : stops && stops.length > 0
    ? clamp(dayFloat - Math.floor(dayFloat), 0, 1)
    : (pc * span) % 1;

  const gradId = `area-${seed}-${a}-${b}`;
  const refPts = React.useMemo(
    () => CLOSES.map((c, i) => `${xOf(i).toFixed(1)},${yOf(c).toFixed(1)}`).join(" "),
    [],
  );
  const actFrom = mode === "final" ? 0 : a;
  const actPts = React.useMemo(() => {
    const pts: string[] = [];
    for (let i = actFrom; i <= dCur; i++) pts.push(`${xOf(i).toFixed(1)},${yOf(CLOSES[i]).toFixed(1)}`);
    return pts.join(" ");
  }, [actFrom, dCur]);
  const areaPts = React.useMemo(() => {
    if (dCur <= actFrom) return "";
    return `${actPts} ${xOf(dCur).toFixed(1)},${Y_BOT} ${xOf(actFrom).toFixed(1)},${Y_BOT}`;
  }, [actPts, actFrom, dCur]);
  const maPts = React.useMemo(() => {
    const pts: string[] = [];
    for (let i = Math.max(actFrom, 19); i <= dCur; i++) pts.push(`${xOf(i).toFixed(1)},${yOf(MA[i]).toFixed(1)}`);
    return pts.join(" ");
  }, [actFrom, dCur]);

  const cur = CLOSES[dCur];
  const dayChg = dCur > 0 ? (cur / CLOSES[dCur - 1] - 1) * 100 : 0;
  const isUp = dayChg >= 0;

  // 事件爆发：光标刚跨过事件日 → 冲击波 + 火花 + 光束闪光；暴跌/新低附带震屏
  const bursts = React.useMemo(() => {
    if (mode === "final") return [];
    const out: { e: ChartEvent; t: number }[] = [];
    for (const e of EVENTS) {
      if (e.day < a || e.day > b) continue;
      if (stops && stops.length > 0) {
        // 驻留模式：爆发按“跨过事件日后的 0.4s”算，而不是按交易日数，
        // 否则 long hold 会变成一直震屏 + 常驻冲击波。
        const cp = pAtDay(stops, e.day);
        const t = (p - cp) / 0.05;
        if (p >= cp && t >= 0 && t <= 1) out.push({ e, t });
      } else {
        const dt = dCur - e.day;
        if (dt >= 0 && dt <= 5) out.push({ e, t: dt / 5 });
      }
    }
    return out;
  }, [dCur, a, b, mode, p, stops]);
  const shakeAmp = React.useMemo(() => {
    if (mode === "final") return 0;
    let amp = 0;
    for (const { e, t } of bursts) {
      if (e.kind === "crash" || e.kind === "low") amp = Math.max(amp, (1 - t) * 8);
    }
    return amp;
  }, [bursts, mode]);
  const shakeX = shakeAmp ? (rand(seed + dCur * 13.7) - 0.5) * 2 * shakeAmp : 0;
  const shakeY = shakeAmp ? (rand(seed + dCur * 7.3 + 1) - 0.5) * 1.4 * shakeAmp : 0;

  const dust = React.useMemo(
    () =>
      Array.from({ length: 36 }, (_, k) => ({
        x: rand(seed + k * 2) * 100,
        y0: rand(seed + k * 2 + 1) * 100,
        r: 1.5 + rand(seed + k * 3 + 7) * 2.5,
        drift: 4 + rand(seed + k * 5 + 11) * 10,
      })),
    [seed],
  );
  // 扫动速度线（仅 sweep）：头部后方的高速拖尾
  const streaks = React.useMemo(
    () =>
      Array.from({ length: 9 }, (_, k) => ({
        yOff: (rand(seed + k * 11 + 3) - 0.5) * 130,
        len: 46 + rand(seed + k * 11 + 5) * 90,
        gap: 26 + rand(seed + k * 11 + 9) * 60,
        o: 0.3 - k * 0.025,
      })),
    [seed],
  );
  // 爆发火花方向（每个事件固定 8 向）
  const sparkDirs = React.useMemo(
    () =>
      Array.from({ length: 8 }, (_, k) => {
        const ang = (k / 8) * Math.PI * 2 + rand(seed + k) * 0.5;
        return { dx: Math.cos(ang), dy: Math.sin(ang) * 0.8 };
      }),
    [seed],
  );

  const beamColor = (e: ChartEvent) => (e.kind === "crash" || e.kind === "low" ? DOWN : UP);
  const beamOpacity = (e: ChartEvent) => {
    if (e.day > dCur) return 0;
    const burst = bursts.find((x) => x.e.day === e.day);
    if (burst) return 0.55 + (1 - burst.t) * 0.45; // 爆发时刻光束全亮
    if (mode === "sweep") return Math.exp(-(dCur - e.day) / 4) * 0.9; // 快速掠过时闪现
    return 0.4 + 0.18 * Math.sin(p * Math.PI * 4 + e.day);
  };

  const gridLines = [3700, 3900, 4100];
  // 峰谷标注：只保留“顶”的标注；低点会和字幕/月份轴撞，且字幕已经说了 3599。
  const tagEvents = EVENTS.filter((e) => e.kind === "peak");
  const tagVisible = (e: ChartEvent) => dCur >= e.day || mode === "final";

  return (
    <AbsoluteFill style={{ fontFamily: FONT_STACK }}>
      {/* 深度渐变 */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${mixHex(c1, c2, 0.05)} 0%, ${mixHex(c1, c2, 0.3)} 62%, ${mixHex(c2, INK, 0.06)} 100%)`,
        }}
      />
      {/* 环境浮尘 */}
      {dust.map((dt, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${dt.x}%`,
            top: `${((dt.y0 - p * dt.drift + 100) % 100).toFixed(2)}%`,
            width: dt.r * 2,
            height: dt.r * 2,
            borderRadius: "50%",
            background: mixHex(c2, INK, 0.25),
            opacity: 0.16,
          }}
        />
      ))}

      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", inset: 0, transform: `translate(${shakeX.toFixed(2)}px, ${shakeY.toFixed(2)}px)` }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity={0.2} />
            <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* 网格基线 + 纵轴刻度 */}
        {gridLines.map((v) => (
          <g key={v}>
            <line x1={X0} x2={X1} y1={yOf(v)} y2={yOf(v)} stroke={INK} strokeOpacity={0.12} strokeDasharray="4 10" strokeWidth={2} />
            <text x={X0 - 14} y={yOf(v) + 10} textAnchor="end" fontSize={30} fill={INK} fillOpacity={0.42}>
              {v}
            </text>
          </g>
        ))}

        {/* 月份轴：竖向浅格线 + 刻度标签 */}
        {MONTH_TICKS.map((tk) => (
          <g key={tk.d}>
            <line x1={xOf(tk.d)} x2={xOf(tk.d)} y1={Y_TOP - 20} y2={Y_BOT} stroke={INK} strokeOpacity={tk.major ? 0.09 : 0.05} strokeWidth={2} />
            {tk.major && (
              <text x={xOf(tk.d)} y={AXIS_Y} textAnchor="middle" fontSize={26} fill={INK} fillOpacity={0.4}>
                {tk.label}
              </text>
            )}
          </g>
        ))}

        {/* 全年参考线（弱）：别用 0.16 把结局提前画满，留一点“未来还没发生” */}
        <polyline points={refPts} fill="none" stroke={INK} strokeOpacity={0.1} strokeWidth={2} />

        {/* 已走过的日线：面积填充 + MA20 均线 + 宽淡/细实双层主线 */}
        {areaPts && <polygon points={areaPts} fill={`url(#${gradId})`} />}
        {maPts && <polyline points={maPts} fill="none" stroke={accent} strokeOpacity={0.45} strokeWidth={2.5} strokeDasharray="2 7" strokeLinecap="round" />}
        <polyline points={actPts} fill="none" stroke={accent} strokeOpacity={0.18} strokeWidth={10} strokeLinejoin="round" />
        <polyline points={actPts} fill="none" stroke={INK} strokeOpacity={0.92} strokeWidth={3.5} strokeLinejoin="round" />

        {/* 事件光束 + 脉冲环 */}
        {EVENTS.map((e) => {
          const op = beamOpacity(e);
          if (op <= 0) return null;
          const x = xOf(e.day);
          const y = yOf(CLOSES[e.day]);
          const fr = (p * 1.6 + e.day * 0.13) % 1;
          return (
            <g key={e.day}>
              <line x1={x} x2={x} y1={Y_TOP - 70} y2={y} stroke={beamColor(e)} strokeOpacity={op} strokeWidth={3.5} />
              <circle cx={x} cy={y} r={9 + 30 * fr} fill="none" stroke={beamColor(e)} strokeOpacity={(1 - fr) * 0.55 * op * 2} strokeWidth={3} />
              <circle cx={x} cy={y} r={6} fill={beamColor(e)} fillOpacity={Math.min(1, op * 1.6)} />
            </g>
          );
        })}

        {/* 事件爆发：冲击波环 + 放射火花（光标跨过事件日的 5 个交易日内） */}
        {bursts.map(({ e, t }) => {
          const x = xOf(e.day);
          const y = yOf(CLOSES[e.day]);
          const col = beamColor(e);
          return (
            <g key={`burst-${e.day}`}>
              <circle cx={x} cy={y} r={16 + t * 90} fill="none" stroke={col} strokeOpacity={(1 - t) * 0.7} strokeWidth={4 - t * 2.5} />
              <circle cx={x} cy={y} r={10 + t * 46} fill="none" stroke={col} strokeOpacity={(1 - t) * 0.35} strokeWidth={2} />
              {sparkDirs.map((d, k) => (
                <circle
                  key={k}
                  cx={x + d.dx * (18 + t * 76)}
                  cy={y + d.dy * (18 + t * 60)}
                  r={3.2 * (1 - t) + 1}
                  fill={col}
                  fillOpacity={(1 - t) * 0.85}
                />
              ))}
            </g>
          );
        })}

        {/* 扫动速度线（仅 sweep，头部后方拖尾） */}
        {mode === "sweep" &&
          streaks.map((st, k) => {
            const hx = xOf(dCur);
            const hy = yOf(cur) + st.yOff;
            if (hy < Y_TOP || hy > Y_BOT) return null;
            return (
              <line
                key={k}
                x1={Math.max(X0, hx - st.gap - st.len)}
                x2={Math.max(X0, hx - st.gap)}
                y1={hy}
                y2={hy}
                stroke={accent}
                strokeOpacity={st.o * clamp(p * 6, 0, 1)}
                strokeWidth={2}
                strokeLinecap="round"
              />
            );
          })}

        {/* 峰谷标注：细引线 + 数值短语 */}
        {tagEvents.map((e) => {
          if (!tagVisible(e)) return null;
          const x = Math.min(Math.max(xOf(e.day), X0 + 130), 1080 - 140); // 钳制在画布内，防右缘裁字
          const y = yOf(CLOSES[e.day]);
          const up = e.kind === "peak";
          const ty = up ? y - 88 : y + 64;
          const op = mode === "final" ? 0.75 : clamp((dCur - e.day) / 2 + 0.4, 0, 1) * 0.75;
          return (
            <g key={`tag-${e.day}`} opacity={op}>
              <line x1={x} x2={x} y1={up ? y - 26 : y + 26} y2={up ? ty + 14 : ty - 20} stroke={INK} strokeOpacity={0.35} strokeWidth={2} />
              <text x={x} y={ty} textAnchor="middle" fontSize={30} fontWeight={700} fill={up ? UP : DOWN} fillOpacity={0.9}>
                {e.level} {up ? "全年最高" : "年内新低"}
              </text>
            </g>
          );
        })}

        {/* 当前日游标：辉光晕 + 逐日跳动脉冲 + 涨跌配色 */}
        {mode !== "final" ? (
          <g>
            <circle cx={xOf(dCur)} cy={yOf(cur)} r={26 + 7 * Math.sin(p * Math.PI * 6)} fill={accent} fillOpacity={0.16} />
            <circle cx={xOf(dCur)} cy={yOf(cur)} r={14 + 4 * dayFrac} fill={accent} fillOpacity={0.32} />
            <circle
              cx={xOf(dCur)}
              cy={yOf(cur)}
              r={10 + 26 * dayFrac}
              fill="none"
              stroke={isUp ? UP : DOWN}
              strokeOpacity={(1 - dayFrac) * 0.5}
              strokeWidth={2.5}
            />
            <circle cx={xOf(dCur)} cy={yOf(cur)} r={6.5} fill={isUp ? UP : DOWN} />
          </g>
        ) : (
          <g>
            <circle cx={xOf(N - 1)} cy={yOf(CLOSES[N - 1])} r={16 + 10 * Math.sin(p * Math.PI * 4)} fill={UP} fillOpacity={0.24} />
            <circle cx={xOf(N - 1)} cy={yOf(CLOSES[N - 1])} r={12 + 34 * ((p * 2) % 1)} fill="none" stroke={UP} strokeOpacity={0.35 * (1 - ((p * 2) % 1))} strokeWidth={2.5} />
            <circle cx={xOf(N - 1)} cy={yOf(CLOSES[N - 1])} r={7} fill={UP} />
          </g>
        )}
      </svg>

      {/* 右上读数：日期 / 点位 / 当日涨跌（红涨绿跌） */}
      <div
        style={{
          position: "absolute",
          top: 148,
          right: 72,
          textAlign: "right",
          fontFamily: FONT_STACK,
          zIndex: 6,
          opacity: clamp(p * 30, 0, 1),
        }}
      >
        <div style={{ fontSize: 38, letterSpacing: 3, color: mixHex(INK, c1, 0.32) }}>{DATES[dCur]}</div>
        <div style={{ fontSize: 78, fontWeight: 700, color: INK, lineHeight: 1.15 }}>
          {cur.toFixed(0)}
          <span style={{ fontSize: 34, fontWeight: 400 }}> 点</span>
        </div>
        <div style={{ fontSize: 38, fontWeight: 700, color: isUp ? UP : DOWN }}>
          {isUp ? "+" : ""}
          {dayChg.toFixed(2)}%
        </div>
      </div>
    </AbsoluteFill>
  );
};
