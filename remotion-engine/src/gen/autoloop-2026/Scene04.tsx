// Scene04 · 一轮怎么转：事件 → 规则 → Agent → 退出
// 四层卡片沿中轴向下推进，一枚小圆点逐层下落；右侧虚线把“退出”接回“事件”。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Card, Chip, VArrow, Dot, INK, INK_SOFT, FAINT, TEAL, RED, GOLD, MONO_STACK, SERIF_STACK, seg, eo, eoq, pop, lerp } from "./ui";

const rows = [
  { no: "01", en: "EVENT", zh: "新任务进来", meta: "定时 / 提问 / 报错", color: GOLD },
  { no: "02", en: "RULE", zh: "安排谁去干", meta: "时间 · 事情 · 交给谁", color: TEAL },
  { no: "03", en: "AGENT", zh: "把这一轮干完", meta: "AI 助手", color: TEAL },
  { no: "04", en: "EXIT", zh: "干完直接退出", meta: "不占着电脑", color: RED },
];
const TOP = 418;
const STEP = 176;
const AX = 268;

const Scene04: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const tok = eoq(seg(p, 0.24, 0.84));
  const pos = tok * 3;
  const segIdx = Math.min(3, Math.floor(pos));
  const frac = pos - segIdx;
  const dotY = TOP + (segIdx + Math.min(0.96, frac)) * STEP;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="04 / 一轮活" x={150} y={330} />
        <Cap text="有事 → 干完" x={880} y={330} align="right" color={FAINT} />
        <Hair x={150} y={368} w={300} color={TEAL} thickness={2} progress={eo(seg(p, 0.06, 0.3))} opacity={0.65} />
      </div>

      <VArrow x={AX} y1={TOP + 54} y2={TOP + STEP * 3 - 54} progress={eo(seg(p, 0.1, 0.7))} color={INK} opacity={0.22} dashed />

      {rows.map((r, i) => {
        const t = eo(seg(p, 0.06 + i * 0.055, 0.2 + i * 0.055));
        const y = TOP + i * STEP;
        const live = pos >= i - 0.02;
        return (
          <React.Fragment key={r.no}>
            <div
              style={{
                position: "absolute", left: AX - 19, top: y - 19, width: 38, height: 38, borderRadius: 19,
                background: live ? r.color : "rgba(251,247,239,0.9)",
                border: `1.5px solid ${live ? r.color : INK + "44"}`,
                color: live ? "#FBF6EC" : FAINT,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: MONO_STACK, fontSize: 13, opacity: t,
                transform: `scale(${live ? 1 : 0.94})`,
                boxShadow: live ? `0 0 0 6px ${r.color}14` : "none",
              }}
            >
              {r.no}
            </div>
            <Card
              x={560} y={y + 22} w={566} h={110}
              opacity={t} scale={0.97 + 0.03 * t}
              accent={r.color}
            >
              <div style={{ position: "absolute", left: 24, top: 18, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 3, color: r.color }}>
                {r.en}
              </div>
              <div style={{ position: "absolute", left: 22, top: 44, fontFamily: SERIF_STACK, fontSize: 34, color: INK, letterSpacing: 1 }}>
                {r.zh}
              </div>
              <div style={{ position: "absolute", right: 20, bottom: 16, fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 1, color: FAINT }}>
                {r.meta}
              </div>
              <div
                style={{
                  position: "absolute", right: 184, top: 30, height: 5, borderRadius: 3,
                  width: live ? 52 : 0, background: r.color, opacity: 0.5, transition: "none",
                }}
              />
            </Card>
          </React.Fragment>
        );
      })}

      <Dot x={AX} y={dotY} r={9} color={RED} opacity={eo(seg(p, 0.2, 0.3)) * 0.95} />

      {/* 回环 */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <path
          d={`M 842 ${TOP + STEP * 3 + 22} C 902 ${TOP + STEP * 3} 902 ${TOP + 44} 846 ${TOP + 44}`}
          fill="none" stroke={TEAL} strokeOpacity={0.42} strokeWidth={1.6} strokeDasharray="7 9"
          strokeDashoffset={260 * (1 - eo(seg(p, 0.62, 0.92)))}
        />
        <path d={`M 846 ${TOP + 44} l 14 -6 l -4 12 z`} fill={TEAL} fillOpacity={0.5} />
      </svg>
      <div style={{ position: "absolute", right: 128, top: 690, transform: "rotate(90deg)", fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 4, color: TEAL, opacity: 0.45 }}>
        NEXT ROUND
      </div>

      <div style={{ position: "absolute", left: 150, top: 1160, opacity: eo(seg(p, 0.7, 0.9)) }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 16, letterSpacing: 3, color: FAINT }}>不占着电脑</div>
        <div style={{ marginTop: 10, fontFamily: SERIF_STACK, fontSize: 34, color: INK_SOFT, letterSpacing: 1 }}>
          干完就退出，不占着电脑等。
        </div>
      </div>
      <div style={{ position: "absolute", left: 150, top: 1248, width: 730, height: 1, background: INK, opacity: 0.14 * eo(seg(p, 0.7, 0.9)) }} />
    </AbsoluteFill>
  );
};

export default Scene04;
