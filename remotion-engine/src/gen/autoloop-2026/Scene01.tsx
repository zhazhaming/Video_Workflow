// Scene01 · 开场：一个自己转的环
// 中心是接活的中枢，四张任务卡沿轨道汇入；虚线环随进度绘制，亮点绕圈巡游。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Card, Chip, Dot, INK, INK_SOFT, FAINT, TEAL, RED, GOLD, SERIF_STACK, MONO_STACK, seg, eo, eoq, pop, lerp, clamp01 } from "./ui";

const CX = 515;
const CY = 790;
const R = 292;

const sat = [
  { a: -90, label: "定时", sub: "09:00", color: GOLD },
  { a: 0, label: "提问", sub: "项目", color: TEAL },
  { a: 90, label: "报错", sub: "网站", color: RED },
  { a: 180, label: "确认", sub: "等你", color: TEAL },
];

const Scene01: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const ring = eo(seg(p, 0.04, 0.44));
  const len = 2 * Math.PI * R;
  const dotA = (-90 + p * 300) * (Math.PI / 180);
  const hub = pop(seg(p, 0.12, 0.34));
  const note = eo(seg(p, 0.62, 0.82));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="01 / LOOP" x={150} y={330} />
        <Cap text="AGENT AUTOLOOP" x={880} y={330} align="right" color={FAINT} />
        <Hair x={150} y={368} w={300} color={TEAL} thickness={2} progress={eo(seg(p, 0.1, 0.4))} opacity={0.7} />
      </div>

      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <circle cx={CX} cy={CY} r={R + 34} fill="none" stroke={INK} strokeOpacity={0.1} strokeWidth={1} />
        <g transform={`rotate(${p * 16} ${CX} ${CY})`}>
          <circle
            cx={CX} cy={CY} r={R}
            fill="none" stroke={TEAL} strokeWidth={2.2} strokeOpacity={0.75}
            strokeDasharray="10 13"
            strokeDashoffset={len * (1 - ring)}
          />
        </g>
        {Array.from({ length: 36 }, (_, i) => {
          const a = (i / 36) * Math.PI * 2;
          const r2 = R + 46;
          const on = i % 3 === 0;
          return (
            <line
              key={i}
              x1={CX + Math.cos(a) * (r2 - (on ? 12 : 6))}
              y1={CY + Math.sin(a) * (r2 - (on ? 12 : 6))}
              x2={CX + Math.cos(a) * r2}
              y2={CY + Math.sin(a) * r2}
              stroke={on ? INK : FAINT}
              strokeOpacity={on ? 0.34 : 0.2}
              strokeWidth={on ? 1.6 : 1}
            />
          );
        })}
      </svg>

      {/* 四张任务卡 */}
      {sat.map((s, i) => {
        const t = eo(seg(p, 0.26 + i * 0.075, 0.44 + i * 0.075));
        const rad = (s.a * Math.PI) / 180;
        const x = CX + Math.cos(rad) * R;
        const y = CY + Math.sin(rad) * R;
        const dx = Math.cos(rad) * (1 - t) * 46;
        const dy = Math.sin(rad) * (1 - t) * 46;
        return (
          <Card
            key={s.label}
            x={x + dx} y={y + dy} w={182} h={82}
            opacity={t} rotate={s.a === 0 ? 0 : s.a === 180 ? 0 : 0}
            scale={0.92 + 0.08 * t}
            accent={s.color}
          >
            <div style={{ position: "absolute", left: 18, top: 15, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 2.5, color: FAINT }}>
              {s.label}
            </div>
            <div style={{ position: "absolute", left: 18, bottom: 12, fontFamily: MONO_STACK, fontSize: 22, color: INK }}>
              {s.sub}
            </div>
            <div style={{ position: "absolute", right: 16, top: 20, width: 10, height: 10, borderRadius: 5, background: s.color, opacity: 0.8 }} />
          </Card>
        );
      })}

      {/* 中心中枢 */}
      <Card x={CX} y={CY} w={312} h={208} opacity={hub} scale={0.9 + 0.1 * hub} accent={TEAL}>
        <div style={{ position: "absolute", left: 26, top: 22, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 3, color: FAINT }}>
          AI 管家 / 在岗
        </div>
        <div style={{ position: "absolute", left: 26, top: 60, fontFamily: SERIF_STACK, fontSize: 62, fontWeight: 700, color: INK, letterSpacing: 2 }}>
          接活
        </div>
        <div style={{ position: "absolute", left: 26, bottom: 24, fontFamily: MONO_STACK, fontSize: 17, letterSpacing: 1.5, color: INK_SOFT }}>
          &#8250; 等活来_
        </div>
        <div
          style={{
            position: "absolute", right: 20, top: 18, width: 54, height: 54, borderRadius: 27,
            border: `1.5px solid ${TEAL}44`, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: MONO_STACK, fontSize: 13, color: TEAL, opacity: 0.9,
            transform: `scale(${1 + 0.05 * Math.sin(p * 22)})`,
          }}
        >
          ON
        </div>
      </Card>

      {/* 轨道巡游点 */}
      <Dot
        x={CX + Math.cos(dotA) * R}
        y={CY + Math.sin(dotA) * R}
        r={8}
        color={RED}
        opacity={clamp01(ring * 1.4) * (0.75 + 0.25 * Math.sin(p * 30))}
      />
      <Dot x={CX} y={CY} r={4} color={TEAL} opacity={0.5} />

      {/* 底部批注 */}
      <div style={{ position: "absolute", left: 150, top: 1150, opacity: note }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 16, letterSpacing: 3, color: FAINT }}>不用一直盯着</div>
        <div style={{ marginTop: 10, fontFamily: SERIF_STACK, fontSize: 34, color: INK_SOFT, letterSpacing: 1 }}>
          不用守着，它自己转。
        </div>
      </div>
      <div style={{ position: "absolute", left: 150, top: 1234, width: 730, height: 1, background: INK, opacity: 0.16 * note }} />
      <div style={{ position: "absolute", right: 180, top: 1176, opacity: note * 0.9 }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 60, color: TEAL, opacity: 0.22, letterSpacing: -2 }}>24H</div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene01;
