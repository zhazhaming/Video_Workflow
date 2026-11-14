// Scene01 · 3000亿的表盘（开场）
// 数字从 0 滚到 3000，右侧竖标尺的朱红指针同步上移；底部三枚小标签依次落位。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, Cross, BigNum, INK, INK_SOFT, FAINT, RED,
  seg, eo, eoq, clamp01, lerp,
} from "./ui";

const GAUGE_X = 916;
const GAUGE_TOP = 430;
const GAUGE_BOT = 1150;

const Scene01: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.1));
  const count = eoq(seg(p, 0.06, 0.58));
  const value = Math.round(3000 * count);
  const suffix = eo(seg(p, 0.5, 0.62));
  const rule = eo(seg(p, 0.04, 0.34));
  const gauge = eo(seg(p, 0.02, 0.2));
  const ratio = clamp01(value / 3000);
  const needleY = lerp(GAUGE_BOT, GAUGE_TOP, ratio);

  const tags = ["四足", "人形", "进厂"];
  const tagT = (i: number) => eo(seg(p, 0.52 + i * 0.09, 0.64 + i * 0.09));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="市值 / MARKET CAP" x={96} y={318} size={22} />
        <Cap text="11.09 · 盘中" x={96} y={356} size={20} color={FAINT} />
        <Cross x={96} y={404} s={7} opacity={0.3} />
        <BigNum value={value} x={92} y={396} size={236} suffix="亿" opacity={enter} />
        <Hair x={96} y={700} w={600} color={RED} thickness={3} progress={rule} opacity={0.85} />
        <div
          style={{
            position: "absolute", left: 96, top: 724, display: "flex", gap: 14,
            opacity: eo(seg(p, 0.3, 0.44)),
          }}
        >
          <span style={{ fontFamily: '"Songti SC", serif', fontSize: 26, color: INK_SOFT }}>
            热闹很大，账要慢慢算。
          </span>
        </div>

        {/* 右侧竖标尺 */}
        <div style={{ position: "absolute", left: GAUGE_X, top: GAUGE_TOP, width: 1, height: GAUGE_BOT - GAUGE_TOP, background: INK, opacity: 0.18 * gauge }} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const y = lerp(GAUGE_BOT, GAUGE_TOP, i / 6);
          const g = eo(seg(p, 0.04 + i * 0.02, 0.16 + i * 0.02));
          return (
            <div key={i}>
              <div style={{ position: "absolute", left: GAUGE_X - 12, top: y, width: 12, height: 1, background: INK, opacity: 0.3 * g }} />
              <div
                style={{
                  position: "absolute", left: GAUGE_X + 20, top: y - 12,
                  fontFamily: '"SF Mono", monospace', fontSize: 17, color: FAINT, opacity: 0.8 * g,
                }}
              >
                {i * 500}
              </div>
            </div>
          );
        })}
        <div
          style={{
            position: "absolute", left: GAUGE_X - 34, top: needleY - 1,
            width: 34, height: 2, background: RED, opacity: suffix,
          }}
        />
        <div
          style={{
            position: "absolute", left: GAUGE_X - 6, top: needleY - 6,
            width: 12, height: 12, borderRadius: 6, background: RED,
            transform: `scale(${0.6 + 0.4 * suffix})`, opacity: suffix,
          }}
        />

        {/* 底部三枚标签 */}
        {tags.map((t, i) => {
          const k = tagT(i);
          return (
            <div key={t} style={{ position: "absolute", left: 96 + i * 210, top: 1000, opacity: k, transform: `translateY(${(1 - k) * 14}px)` }}>
              <div style={{ fontFamily: '"SF Mono", monospace', fontSize: 16, letterSpacing: 3, color: FAINT }}>
                0{i + 1}
              </div>
              <div style={{ fontFamily: '"Songti SC", serif', fontSize: 40, color: INK, marginTop: 8 }}>{t}</div>
              <Hair x={0} y={68} w={96} color={i === 2 ? RED : INK} thickness={2} progress={k} opacity={i === 2 ? 0.8 : 0.25} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export default Scene01;
