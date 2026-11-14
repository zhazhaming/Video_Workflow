// Scene12 · 注意一：本地跑、不碰凭据；Token 花的是自己的额度
// 左边一台本地小电脑（带锁），右边一根电量条被慢慢充上；API Key 小卡从下方滑入。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Card, Chip, Dot, INK, INK_SOFT, FAINT, TEAL, RED, GOLD, MONO_STACK, SERIF_STACK, seg, eo, pop, lerp, clamp01 } from "./ui";

const Scene12: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const lap = eo(seg(p, 0.04, 0.24));
  const lock = pop(seg(p, 0.28, 0.44));
  const fill = eo(seg(p, 0.38, 0.72));
  const key = pop(seg(p, 0.7, 0.86));
  const bars = Math.round(fill * 5);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="12 / 注意" x={150} y={330} />
        <Cap text="先在自己电脑" x={880} y={330} align="right" color={FAINT} />
        <Hair x={150} y={368} w={300} color={RED} thickness={2} progress={eo(seg(p, 0.08, 0.32))} opacity={0.6} />
      </div>

      {/* 本地电脑 */}
      <div style={{ opacity: lap, transform: `translateY(${(1 - lap) * 16}px)` }}>
        <div style={{ position: "absolute", left: 180, top: 470, width: 300, height: 206, border: `2px solid ${INK}`, borderRadius: 10, background: "rgba(251,247,239,0.8)", boxShadow: `0 20px 42px ${INK}18` }}>
          <div style={{ position: "absolute", left: 16, top: 14, fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 2, color: FAINT }}>这台电脑</div>
          <div style={{ position: "absolute", left: 24, top: 44, width: 252, height: 1, background: INK, opacity: 0.12 }} />
          <div style={{ position: "absolute", left: 24, top: 58, fontFamily: MONO_STACK, fontSize: 16, color: INK_SOFT }}>只装在这台电脑</div>
          <div style={{ position: "absolute", left: 24, top: 88, fontFamily: MONO_STACK, fontSize: 13, color: FAINT }}>任务卡 · 程序 · 记录</div>
        </div>
        <div style={{ position: "absolute", left: 158, top: 676, width: 344, height: 14, borderRadius: 7, background: "#E2D5C0", border: `1.5px solid ${INK}44` }} />
        <div style={{ position: "absolute", left: 300, top: 702, width: 60, height: 8, borderRadius: 4, background: INK, opacity: 0.12 }} />
      </div>

      {/* 锁 */}
      <div style={{ position: "absolute", left: 398, top: 592, opacity: clamp01(lock * 1.5), transform: `scale(${0.8 + 0.2 * lock})` }}>
        <div style={{ position: "absolute", left: 18, top: -4, width: 26, height: 26, borderRadius: 14, border: `4px solid ${TEAL}`, borderBottom: "none" }} />
        <div style={{ position: "absolute", left: 0, top: 18, width: 62, height: 48, borderRadius: 7, background: TEAL, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 8, height: 14, borderRadius: 4, background: "#FBF6EC" }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 180, top: 730, width: 300, textAlign: "center", fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 2, color: TEAL, opacity: lock * 0.9 }}>
        不保存账号密码
      </div>

      {/* Token 电量 */}
      <div style={{ position: "absolute", left: 700, top: 452, opacity: enter }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 3, color: FAINT }}>AI 用量</div>
        <div
          style={{
            position: "absolute", left: 0, top: 34, width: 124, height: 300, border: `2px solid ${INK}`, borderRadius: 14,
            padding: 10, boxSizing: "border-box", background: "rgba(251,247,239,0.7)",
          }}
        >
          <div style={{ position: "absolute", left: 40, top: -12, width: 40, height: 12, borderRadius: "4px 4px 0 0", background: INK }} />
          {Array.from({ length: 5 }, (_, i) => {
            const on = i < bars;
            return (
              <div
                key={i}
                style={{
                  position: "absolute", left: 12, right: 12, bottom: 12 + i * 54, height: 42, borderRadius: 5,
                  background: on ? (i >= 3 ? RED : TEAL) : "rgba(24,22,19,0.06)",
                  opacity: on ? 0.72 : 1,
                }}
              />
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 144, top: 170, fontFamily: MONO_STACK, fontSize: 14, color: FAINT, letterSpacing: 2, writingMode: "vertical-rl" }}>
          用多少算多少
        </div>
      </div>

      {/* API Key 卡 */}
      <div style={{ position: "absolute", left: 560, top: 880, width: 320, height: 108, opacity: clamp01(key * 1.5), transform: `translateY(${(1 - key) * 30}px) rotate(-1.5deg)` }}>
        <div style={{ position: "absolute", inset: 0, border: `1.5px solid ${GOLD}66`, borderRadius: 9, background: "rgba(251,247,239,0.95)", boxShadow: `0 16px 34px ${INK}16` }}>
          <div style={{ position: "absolute", left: 18, top: 16, fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 3, color: GOLD }}>按量付费</div>
          <div style={{ position: "absolute", left: 18, top: 42, fontFamily: MONO_STACK, fontSize: 17, color: INK_SOFT, letterSpacing: 1 }}>用多少，付多少</div>
          <div style={{ position: "absolute", right: 16, top: 40, width: 26, height: 26, borderRadius: 13, border: `1.5px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", color: GOLD, fontSize: 14 }}>✓</div>
          <div style={{ position: "absolute", left: 18, bottom: 12, fontFamily: MONO_STACK, fontSize: 12, color: FAINT }}>天天大量跑，建议用这个</div>
        </div>
      </div>

      <div style={{ position: "absolute", left: 150, top: 1110, opacity: eo(seg(p, 0.72, 0.9)) }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 16, letterSpacing: 3, color: FAINT }}>用多少，算你的</div>
        <div style={{ marginTop: 10, fontFamily: SERIF_STACK, fontSize: 34, color: INK_SOFT, letterSpacing: 1 }}>
          本地跑，但 AI 用量算你的。
        </div>
      </div>
      <div style={{ position: "absolute", left: 150, top: 1196, width: 730, height: 1, background: INK, opacity: 0.14 * eo(seg(p, 0.72, 0.9)) }} />
      <Dot x={848} y={452} r={4} color={GOLD} opacity={0.7} />
    </AbsoluteFill>
  );
};

export default Scene12;
