// Scene08 · 反抗：地方项目一个个被挡下，累计 64 亿美元
// 抽象“项目方块阵”代替地图（不伪造地理边界）；红点逐个落下，右侧数字累计。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Stamp, RED, INK, INK_SOFT, FAINT, MONO_STACK, SERIF_STACK, seg, eo, pop, lerp, clamp01 } from "./ui";

const COLS = 8;
const ROWS = 5;
const HOT = new Set([1, 3, 5, 6, 10, 12, 15, 17, 20, 23, 26, 28, 31, 34, 37]);

const Scene08: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const grid = eo(seg(p, 0.08, 0.3));
  const num = lerp(0, 64, eo(seg(p, 0.12, 0.35)));
  const stampT = pop(seg(p, 0.58, 0.72));
  const note = eo(seg(p, 0.62, 0.78));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="CASE 08 / 11 · 地方" x={108} y={300} color={RED} />
        <Cap text="LOCAL VETO" x={972} y={300} align="right" color={FAINT} />
        <Hair x={108} y={338} w={864} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 108, top: 390, opacity: enter }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 64, fontWeight: 700, color: INK, letterSpacing: 2 }}>
          地方先说了不。
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 19, letterSpacing: 2, color: FAINT, marginTop: 10 }}>
          听证会 · 诉讼 · 公投 · 规划否决
        </div>
      </div>

      {/* 方块阵 */}
      <div style={{ position: "absolute", left: 118, top: 606, width: 500, height: 500, opacity: grid }}>
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const c = i % COLS;
          const r = Math.floor(i / COLS);
          const hot = HOT.has(i);
          const t = eo(seg(p, 0.18 + (i % 17) * 0.012, 0.3 + (i % 17) * 0.012));
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: c * 62,
                top: r * 92,
                width: 48,
                height: 70,
                border: `1px solid ${INK}2A`,
                background: hot ? "rgba(166,58,43,0.07)" : "rgba(23,21,18,0.025)",
                opacity: 0.5 + 0.5 * t,
              }}
            >
              <div style={{ position: "absolute", left: 18, bottom: 14, width: 10, height: 10, borderRadius: 5, background: hot ? RED : INK, opacity: hot ? 0.85 * t : 0.18 }} />
              {hot ? (
                <div
                  style={{
                    position: "absolute",
                    left: 14,
                    bottom: 22,
                    width: 18,
                    height: 18,
                    transform: `translateY(${(1 - t) * -26}px) rotate(45deg)`,
                    background: t > 0 ? RED : "transparent",
                    borderRadius: "50% 50% 50% 0",
                    opacity: 0.8 * t,
                  }}
                />
              ) : null}
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 0, top: 490, fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 1, color: FAINT }}>
          每个方块 = 一个地方项目（示意，非地理边界）
        </div>
      </div>

      {/* 右侧数字 */}
      <div style={{ position: "absolute", left: 680, top: 596, width: 300, opacity: enter }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 3, color: FAINT }}>2023 – 2025 Q1</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 8 }}>
          <span style={{ fontFamily: SERIF_STACK, fontSize: 116, fontWeight: 700, color: RED, lineHeight: 1 }}>{Math.round(num)}</span>
          <span style={{ fontFamily: SERIF_STACK, fontSize: 38, color: RED }}>亿</span>
        </div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 30, color: INK, marginTop: 6 }}>美元项目</div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 27, color: INK_SOFT, marginTop: 2 }}>被阻止，或延迟。</div>
        <div style={{ width: 250, height: 1, background: INK, opacity: 0.16, marginTop: 20 }} />
        <div style={{ fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 2, color: FAINT, marginTop: 14, lineHeight: 1.6 }}>
          DATA CENTER WATCH<br />地方反对累计统计
        </div>
      </div>

      <Stamp text="BLOCKED" sub="已挡下" x={790} y={1080} size={34} rotate={-7} t={stampT} w={250} color={RED} />

      <div style={{ position: "absolute", left: 108, top: 1240, opacity: note }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 29, color: INK_SOFT }}>
          开发商发现：真正的审批，不在州府，在社区。
        </div>
      </div>

      <div style={{ position: "absolute", left: 108, top: 1300, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 2, color: FAINT, opacity: clamp01(note) }}>
        SOURCE: DATA CENTER WATCH / 2025
      </div>
    </AbsoluteFill>
  );
};

export default Scene08;
