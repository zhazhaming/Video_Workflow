// Scene09 · 四级台阶（效率是门槛）
// 热度、收入、利润、效率四级台阶；一枚红点从下往上爬，最后停在「效率」那一级。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, INK, INK_SOFT, FAINT, RED, seg, eo, lerp } from "./ui";

const BASE = 1110;
const X0 = 160;
const W = 190;
const H = 112;
const NAMES = ["热度", "收入", "利润", "效率"];

const Scene09: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.1));
  const climb = eo(seg(p, 0.08, 0.82));
  const step = Math.min(3, Math.floor(climb * 3.999));
  const frac = Math.min(0.999, climb * 3.999 - step);
  const dotX = lerp(X0 + step * W + 26, X0 + step * W + W - 26, frac);
  const dotY = BASE - (step + 1) * H - 18;
  const top = eo(seg(p, 0.8, 0.92));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="下一道门槛 / EFFICIENCY" x={96} y={318} size={19} />

        {NAMES.map((n, i) => {
          const k = eo(seg(p, 0.06 + i * 0.08, 0.2 + i * 0.08));
          const h = (i + 1) * H;
          const last = i === 3;
          return (
            <div key={n}>
              <div
                style={{
                  position: "absolute", left: X0 + i * W, top: BASE - h,
                  width: W - 6, height: h,
                  background: last ? `${RED}14` : "transparent",
                  borderLeft: `2px solid ${last ? RED : INK}`,
                  borderTop: `2px solid ${last ? RED : INK}`,
                  opacity: k * (last ? 1 : 0.55),
                  transformOrigin: "left bottom",
                  transform: `scaleY(${0.4 + 0.6 * k})`,
                }}
              />
              <div
                style={{
                  position: "absolute", left: X0 + i * W + 18, top: BASE - h - 62,
                  fontFamily: '"Songti SC", serif', fontSize: 32,
                  color: last ? RED : INK_SOFT, opacity: k,
                }}
              >
                {n}
              </div>
            </div>
          );
        })}

        <div style={{ position: "absolute", left: X0, top: BASE, width: 4 * W, height: 2, background: INK, opacity: 0.35 }} />

        {/* 红点 */}
        <div style={{ position: "absolute", left: dotX - 13, top: dotY - 13, width: 26, height: 26, borderRadius: 13, background: RED, boxShadow: `0 0 0 8px ${RED}18` }} />
        <div style={{ position: "absolute", left: dotX - 1, top: dotY + 18, width: 2, height: 34, background: RED, opacity: 0.35 }} />

        {/* 顶部小旗 */}
        <div style={{ position: "absolute", left: X0 + 3.5 * W, top: BASE - 4 * H - 150, opacity: top }}>
          <div style={{ width: 2, height: 120, background: INK, opacity: 0.5 }} />
          <div style={{ position: "absolute", left: 2, top: 0, padding: "6px 12px", background: RED, color: "#FBF6EC", fontFamily: '"Songti SC", serif', fontSize: 22 }}>门槛</div>
        </div>

        <div style={{ position: "absolute", left: 96, top: 1180, opacity: top, fontFamily: '"Songti SC", serif', fontSize: 28, color: INK_SOFT }}>
          从「能不能做」，到「划不划算」。
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene09;
