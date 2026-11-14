// Scene03 · 一条会弯的腿（机器人本体）
// 三段连杆按正弦节奏屈伸，膝关节用朱红标出；右侧三条能力刻度依次点亮。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, INK, INK_SOFT, FAINT, RED, seg, eo, eio } from "./ui";

const HIP = { x: 440, y: 470 };
const L1 = 262;
const L2 = 262;

const Scene03: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const swing = eio(seg(p, 0.05, 0.9));
  const a1 = (-6 + 19 * Math.sin(swing * Math.PI * 2.2)) * (Math.PI / 180);
  const a2 = (34 + 15 * Math.sin(swing * Math.PI * 2.2 + 1.1)) * (Math.PI / 180);

  const knee = { x: HIP.x + L1 * Math.sin(a1), y: HIP.y + L1 * Math.cos(a1) };
  const ankle = { x: knee.x + L2 * Math.sin(a1 + a2), y: knee.y + L2 * Math.cos(a1 + a2) };
  const toe = { x: ankle.x + 74, y: ankle.y + 26 };

  const caps = ["跑", "跳", "进厂"];
  const capT = (i: number) => eo(seg(p, 0.34 + i * 0.1, 0.48 + i * 0.1));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="四足 / 人形" x={96} y={318} size={20} />

        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ position: "absolute", left: 140, top: 430 + i * 150, width: 700, height: 1, background: INK, opacity: 0.035 }} />
        ))}

        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <polyline
            points={`${HIP.x + 86},${HIP.y} ${knee.x + 86},${knee.y} ${ankle.x + 86},${ankle.y}`}
            fill="none"
            stroke={INK}
            strokeOpacity={0.07}
            strokeWidth={24}
            strokeLinecap="round"
          />
          <polyline
            points={`${HIP.x},${HIP.y} ${knee.x},${knee.y} ${ankle.x},${ankle.y}`}
            fill="none"
            stroke={INK}
            strokeWidth={30}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1={ankle.x} y1={ankle.y} x2={toe.x} y2={toe.y} stroke={INK} strokeWidth={28} strokeLinecap="round" />
          <circle cx={toe.x + 6} cy={toe.y + 6} r={16} fill={INK} />
          <circle cx={HIP.x} cy={HIP.y} r={25} fill={INK} />
          <circle cx={knee.x} cy={knee.y} r={21} fill="#F5F0E7" stroke={RED} strokeWidth={8} />
          <circle cx={ankle.x} cy={ankle.y} r={15} fill="#F5F0E7" stroke={INK} strokeWidth={7} />
          <path
            d={`M ${HIP.x - 118} ${HIP.y + 46} A 128 128 0 0 1 ${HIP.x - 14} ${HIP.y + 130}`}
            fill="none"
            stroke={RED}
            strokeOpacity={0.4}
            strokeWidth={2}
            strokeDasharray="5 9"
          />
        </svg>

        <div style={{ position: "absolute", left: 292, top: 620, opacity: 0.85 * enter, fontFamily: '"SF Mono", monospace', fontSize: 17, color: FAINT, letterSpacing: 2 }}>
          θ 关节
        </div>

        {caps.map((t, i) => {
          const k = capT(i);
          return (
            <div key={t} style={{ position: "absolute", left: 828, top: 520 + i * 196, opacity: k, transform: `translateX(${(1 - k) * 18}px)` }}>
              <div style={{ fontFamily: '"Songti SC", serif', fontSize: 44, color: i === 2 ? RED : INK }}>{t}</div>
              <Hair x={0} y={64} w={120} color={i === 2 ? RED : INK} thickness={2} progress={k} opacity={i === 2 ? 0.85 : 0.25} />
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 828, top: 1100, opacity: 0.9 * enter, fontFamily: '"SF Mono", monospace', fontSize: 16, color: FAINT, letterSpacing: 3 }}>
          G1 / GO2
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene03;
