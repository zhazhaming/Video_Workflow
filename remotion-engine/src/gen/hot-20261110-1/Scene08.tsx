// Scene08 · 信号二：领涨板块
// 三条板块赛道一起起跑，创业板指冲在最前；红旗插在领先者终点，科技成长被点亮。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, INK, INK_SOFT, FAINT, RED, SERIF_STACK, MONO_STACK, seg, eo, eio, pop } from "./ui";

const ROWS = [
  { name: "创业板指", sub: "成长", w: 540, v: "2.44%", lead: true },
  { name: "科技成长", sub: "领跑", w: 420, v: "强势", lead: false },
  { name: "大盘权重", sub: "跟随", w: 260, v: "跟随", lead: false },
];
const X = 372;
const TRACK = 560;

const Scene08: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.1));
  const note = eo(seg(p, 0.72, 0.86));
  const ex = seg(p, 0.9, 1);
  const main = accent || RED;
  const flag = pop(seg(p, 0.38, 0.56));

  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} />

      <div style={{ opacity: enter }}>
        <Cap text="08 / LEADERS" x={110} y={300} color={main} />
        <Cap text="信号二" x={962} y={300} align="right" color={FAINT} />
        <Hair x={110} y={338} w={852} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 110, top: 392, opacity: enter }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 18, letterSpacing: 4, color: FAINT }}>SIGNAL 02 / LEADERS</div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 56, fontWeight: 700, color: INK, letterSpacing: 2, marginTop: 4 }}>
          谁在领跑？
        </div>
      </div>

      {/* 起跑线 / 终点线 */}
      <div style={{ position: "absolute", left: X, top: 520, width: 1, height: 560, background: INK, opacity: 0.16 }} />
      <div style={{ position: "absolute", left: X + TRACK, top: 520, width: 1, height: 560, background: INK, opacity: 0.12, borderLeft: "1px dashed rgba(27,24,21,0.2)" }} />

      {ROWS.map((r, i) => {
        const q = eio(seg(p, 0.05 + i * 0.07, 0.35 + i * 0.07));
        const y = 610 + i * 176;
        const over = 1 + 0.05 * Math.sin(Math.min(1, q) * Math.PI);
        const w = r.w * q * over;
        return (
          <React.Fragment key={r.name}>
            <div style={{ position: "absolute", left: 110, top: y - 8, width: 230, opacity: enter * (0.28 + 0.72 * q) }}>
              <div style={{ fontFamily: SERIF_STACK, fontSize: 32, fontWeight: 700, color: r.lead && q > 0.3 ? main : INK, letterSpacing: 1 }}>{r.name}</div>
              <div style={{ fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 2, color: FAINT, marginTop: 4 }}>{r.sub}</div>
            </div>

            <div style={{ position: "absolute", left: X, top: y + 22, width: TRACK, height: 14, background: "rgba(27,24,21,0.06)", borderRadius: 7, opacity: enter }} />
            <div
              style={{
                position: "absolute",
                left: X,
                top: y + 22,
                width: Math.max(2, w),
                height: 14,
                borderRadius: 7,
                background: r.lead ? `linear-gradient(90deg, ${main}AA, ${main})` : `${INK}44`,
                opacity: q,
              }}
            />

            {r.lead ? (
              <div style={{ position: "absolute", left: X + 300, top: y - 42, opacity: q, fontFamily: MONO_STACK, fontSize: 19, letterSpacing: 1, color: main, background: "rgba(251,247,239,0.9)", padding: "1px 8px", borderRadius: 4 }}>
                {r.v}
              </div>
            ) : (
              <div style={{ position: "absolute", left: X + Math.max(0, w) + 14, top: y + 17, opacity: q, fontFamily: MONO_STACK, fontSize: 16, letterSpacing: 1, color: FAINT }}>
                {r.v}
              </div>
            )}

            {r.lead ? (
              <div style={{ position: "absolute", left: X + r.w - 4, top: y - 50, opacity: flag }}>
                <div style={{ position: "absolute", left: 0, top: 0, width: 3, height: 98, background: INK, opacity: 0.75 }} />
                <div
                  style={{
                    position: "absolute",
                    left: -54,
                    top: 4,
                    width: 0,
                    height: 0,
                    borderTop: "17px solid transparent",
                    borderBottom: "17px solid transparent",
                    borderRight: `54px solid ${main}`,
                    opacity: 0.9,
                  }}
                />
                <div style={{ position: "absolute", left: -112, top: 20, width: 56, textAlign: "right", fontFamily: SERIF_STACK, fontSize: 22, color: main, letterSpacing: 2, whiteSpace: "nowrap" }}>
                  领涨
                </div>
              </div>
            ) : null}
          </React.Fragment>
        );
      })}

      <div style={{ position: "absolute", left: 110, top: 1210, opacity: note }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 29, color: INK_SOFT }}>
          今天创业板更强，科技成长在领跑。
        </div>
      </div>

      <div style={{ position: "absolute", right: 110, top: 1222, opacity: note * 0.85, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 3, color: FAINT }}>
        PAGE 08
      </div>
    </AbsoluteFill>
  );
};

export default Scene08;
