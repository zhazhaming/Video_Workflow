// Scene07 · 代价：水与地。冷却塔每天抽走数百万加仑，选址又占掉社区的地
// 左边水位下降的储水罐，右边被划走的土地格；红色只标“被拿走的部分”。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Card, RED, BLUE, INK, INK_SOFT, FAINT, MONO_STACK, SERIF_STACK, seg, eo, pop, lerp, clamp01 } from "./ui";

const Scene07: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const drain = eo(seg(p, 0.1, 0.55));
  const level = lerp(0.78, 0.28, drain);
  const land = eo(seg(p, 0.34, 0.5));
  const note = eo(seg(p, 0.56, 0.72));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="CASE 07 / 11 · 水与地" x={108} y={300} color={BLUE} />
        <Cap text="WATER / LAND" x={972} y={300} align="right" color={FAINT} />
        <Hair x={108} y={338} w={864} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 108, top: 390, opacity: enter }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 64, fontWeight: 700, color: INK, letterSpacing: 2 }}>
          还有水，和地。
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 19, letterSpacing: 2, color: FAINT, marginTop: 10 }}>
          冷却 · 征地 · 噪音 · 社区
        </div>
      </div>

      {/* 储水罐 */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <clipPath id="tankClip">
            <rect x="168" y="640" width="286" height="510" rx="26" />
          </clipPath>
        </defs>
        <rect x="168" y="640" width="286" height="510" rx="26" fill="rgba(61,90,108,0.06)" stroke={INK} strokeWidth={2} opacity={0.55 * enter} />
        <rect
          x="168"
          y={640 + 510 * (1 - level)}
          width="286"
          height={510 * level}
          fill={BLUE}
          opacity={0.3}
          clipPath="url(#tankClip)"
        />
        <line x1="168" y1={640 + 510 * (1 - level)} x2="454" y2={640 + 510 * (1 - level)} stroke={BLUE} strokeWidth={3} opacity={0.75} />
        {[0.25, 0.5, 0.75].map((g) => (
          <g key={g}>
            <line x1="454" y1={640 + 510 * g} x2="480" y2={640 + 510 * g} stroke={INK} strokeWidth={1.4} opacity={0.35} />
            <text x="492" y={646 + 510 * g} fontFamily={MONO_STACK} fontSize="14" fill={FAINT} opacity={0.8}>
              {Math.round((1 - g) * 100)}%
            </text>
          </g>
        ))}
        {/* 水滴 */}
        {[0, 1, 2].map((i) => {
          const t = clamp01((p - 0.2 - i * 0.16) / 0.5);
          const y = 620 + t * 180;
          return <circle key={i} cx={300 + i * 26} cy={y} r={5} fill={BLUE} opacity={t > 0 && t < 1 ? 0.6 : 0} />;
        })}
      </svg>

      <div style={{ position: "absolute", left: 150, top: 1180, width: 330, opacity: enter }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 42, fontWeight: 700, color: BLUE }}>数百万加仑</div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 2, color: FAINT, marginTop: 4 }}>每天 · 仅冷却用水</div>
      </div>

      {/* 土地格 */}
      <div style={{ opacity: land }}>
        <Card x={760} y={890} w={370} h={360} accent={RED} rotate={1.2}>
          <div style={{ position: "absolute", left: 22, top: 18, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 3, color: FAINT }}>
            SITE MAP / 社区地块
          </div>
          {Array.from({ length: 9 }, (_, i) => {
            const r = Math.floor(i / 3);
            const c = i % 3;
            const taken = i === 4 || i === 5;
            const t = eo(seg(p, 0.5 + i * 0.012, 0.6 + i * 0.012));
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 30 + c * 102,
                  top: 58 + r * 82,
                  width: 88,
                  height: 68,
                  border: `1.5px solid ${taken ? RED : INK}55`,
                  background: taken ? RED : "rgba(23,21,18,0.035)",
                  opacity: taken ? 0.18 + 0.55 * t : 0.55,
                  transform: `scale(${taken ? 0.92 + 0.08 * t : 1})`,
                }}
              />
            );
          })}
          <div style={{ position: "absolute", left: 30, bottom: 20, fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 1, color: RED }}>
            红格：被征用 / 被争议的选址
          </div>
        </Card>
      </div>

      <div style={{ position: "absolute", left: 108, top: 1260, opacity: note }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 29, color: INK_SOFT }}>
          电费涨、水变少、地没了：反对的理由，从来不止一个。
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 16, letterSpacing: 2, color: FAINT, marginTop: 12 }}>
          SOURCE: CNBC · 2026.11
        </div>
      </div>

      <div style={{ position: "absolute", right: 108, top: 1320, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 2, color: FAINT, opacity: clamp01(note) }}>
        冷却水 · 蒸发 · 不可回收
      </div>
    </AbsoluteFill>
  );
};

export default Scene07;
