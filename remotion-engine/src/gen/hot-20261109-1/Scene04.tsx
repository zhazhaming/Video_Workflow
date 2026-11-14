// Scene04 · 360 次任务，91% 成功（苹果 HALO）
// 左侧 360 枚小点逐一亮起，最后 9% 留成空心红点；右侧一圈 91% 的弧慢慢合拢。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, INK, INK_SOFT, FAINT, RED, seg, eo, eoq, lerp } from "./ui";

const COLS = 18;
const ROWS = 20;
const STEP_X = 28;
const STEP_Y = 35;
const GX = 104;
const GY = 440;
const SUCCESS = 0.91;

const Scene04: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.1));
  const fill = eoq(seg(p, 0.1, 0.66));
  const arc = eo(seg(p, 0.3, 0.8));
  const numIn = eo(seg(p, 0.62, 0.78));

  const cx = 810;
  const cy = 690;
  const r = 128;
  const C = 2 * Math.PI * r;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="HALO · 苹果" x={96} y={318} size={21} />
        <Cap text="6 个未建图环境" x={96} y={356} size={18} color={FAINT} />

        {Array.from({ length: COLS * ROWS }).map((_, i) => {
          const c = i % COLS;
          const row = Math.floor(i / COLS);
          const appear = seg(p, 0.04 + (i / 360) * 0.12, 0.12 + (i / 360) * 0.12);
          const lit = fill * 360 >= i + 1;
          const fail = i >= Math.floor(360 * SUCCESS);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: GX + c * STEP_X,
                top: GY + row * STEP_Y,
                width: 12,
                height: 12,
                borderRadius: 6,
                background: lit ? (fail ? "transparent" : INK) : "transparent",
                border: fail && lit ? `2px solid ${RED}` : "none",
                opacity: appear * (lit ? (fail ? 0.85 : 0.82) : 0.16),
                transform: `scale(${lit ? 1 : 0.55})`,
              }}
            />
          );
        })}

        {/* 进度扫过的小括号 */}
        <div style={{ position: "absolute", left: GX - 16, top: GY + lerp(0, ROWS * STEP_Y, fill) - 16, width: 510, height: 1, background: RED, opacity: 0.35 * (1 - arc) }} />

        {/* 91% 圆环 */}
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={INK} strokeOpacity={0.12} strokeWidth={16} />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={RED}
            strokeWidth={16}
            strokeLinecap="round"
            strokeDasharray={`${C * 0.91} ${C}`}
            strokeDashoffset={C * (1 - arc)}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        </svg>
        <div style={{ position: "absolute", left: cx - 96, top: cy - 58, width: 192, textAlign: "center", opacity: numIn }}>
          <div style={{ fontFamily: '"Songti SC", serif', fontSize: 96, fontWeight: 700, color: INK, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>91%</div>
          <div style={{ fontFamily: '"SF Mono", monospace', fontSize: 16, letterSpacing: 3, color: FAINT, marginTop: 10 }}>平均成功率</div>
        </div>

        <div style={{ position: "absolute", left: 700, top: 928, opacity: eo(seg(p, 0.7, 0.86)), fontFamily: '"Songti SC", serif', fontSize: 30, color: INK_SOFT }}>
          360 次任务
        </div>
        <div style={{ position: "absolute", left: 96, top: 1160, width: 420, opacity: eo(seg(p, 0.45, 0.65)), fontFamily: '"Songti SC", serif', fontSize: 26, color: INK_SOFT, lineHeight: 1.6 }}>
          机器人在陌生房间里，<br />自己找路。
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene04;
