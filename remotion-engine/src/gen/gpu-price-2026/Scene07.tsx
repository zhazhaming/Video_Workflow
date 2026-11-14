// Scene07 · 80 级首发价：4300 → 8600 → 7200 元，涨价不是一条直线
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, TopBar, Heading, Source, ChartGrid, Stamp, SERIF, MONO, SANS, INK, RED, GREEN, MUTED, FAINT, easeOut, seg, mk, exitFade } from "./ui";

const years = [2016, 2018, 2020, 2022, 2025];
const vals = [4300, 5000, 5000, 8600, 7200];
const X0 = 160;
const X1 = 900;
const Y0 = 590;
const H = 430;
const yy = (v: number) => Y0 + H - ((v - 4000) / (9000 - 4000)) * H;
const xx = (i: number) => X0 + i * ((X1 - X0) / 4);

let pathA = `M ${xx(0)} ${yy(vals[0])}`;
for (let i = 1; i < 4; i++) pathA += ` H ${xx(i)} V ${yy(vals[i])}`;
const pathB = `M ${xx(3)} ${yy(vals[3])} H ${xx(4)} V ${yy(vals[4])}`;

const Scene07: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.05);
  const m1 = mk(marks, 1, 0.34);
  const m2 = mk(marks, 2, 0.66);
  const draw = easeOut(seg(p, m0, m1 + 0.1));
  const points = easeOut(seg(p, m1, m1 + 0.3));
  const punch = easeOut(seg(p, m2, m2 + 0.2));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <TopBar label="2016—2025 / 80 级首发价" right="人民币" />
        <Heading kicker="把镜头拉远一点" title="六年翻倍，然后回吐" y={350} size={58} opacity={seg(p, 0, 0.2)} />

        <div style={{ position: "absolute", left: 96, top: 472, display: "flex", alignItems: "baseline", gap: 14, opacity: seg(p, m0, m0 + 0.2) }}>
          <span style={{ fontFamily: MONO, fontSize: 22, color: MUTED }}>2016</span>
          <span style={{ fontFamily: MONO, fontSize: 40, fontWeight: 800, color: INK }}>4300</span>
          <span style={{ fontFamily: MONO, fontSize: 22, color: FAINT }}>→</span>
          <span style={{ fontFamily: MONO, fontSize: 22, color: MUTED }}>2022</span>
          <span style={{ fontFamily: MONO, fontSize: 40, fontWeight: 800, color: RED }}>8600</span>
          <span style={{ fontFamily: SANS, fontSize: 22, color: MUTED }}>元</span>
        </div>

        <ChartGrid x={X0} y={Y0} w={X1 - X0} h={H} rows={4} cols={4} opacity={0.55} />
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <path d={pathA} fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={1600} strokeDashoffset={1600 * (1 - draw)} />
          <path d={pathB} fill="none" stroke={GREEN} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={400} strokeDashoffset={400 * (1 - punch)} />
        </svg>

        {years.map((yr, i) => {
          const on = i <= 3 ? points : punch;
          return (
            <div key={yr}>
              <div
                style={{
                  position: "absolute", left: xx(i) - 10, top: yy(vals[i]) - 10, width: 20, height: 20, borderRadius: "50%",
                  background: i === 3 ? RED : i === 4 ? GREEN : INK, opacity: on, transform: `scale(${0.7 + 0.3 * on})`,
                }}
              />
              <div style={{ position: "absolute", left: xx(i) - 30, top: Y0 + H + 22, width: 60, textAlign: "center", fontFamily: MONO, fontSize: 18, color: FAINT }}>{yr}</div>
              <div
                style={{
                  position: "absolute", left: xx(i) - 46, top: yy(vals[i]) - (i === 4 ? 58 : 38), width: 92, textAlign: "center",
                  fontFamily: MONO, fontSize: i === 2 || i === 3 || i === 4 ? 22 : 19,
                  fontWeight: i === 3 || i === 4 ? 800 : 600,
                  color: i === 3 ? RED : i === 4 ? GREEN : MUTED, opacity: on,
                }}
              >
                {vals[i]}
              </div>
              {i < 2 ? <div style={{ position: "absolute", left: xx(i) - 30, top: yy(vals[i]) + 20, width: 60, textAlign: "center", fontFamily: SANS, fontSize: 17, color: FAINT, opacity: on }}>{yr === 2016 ? "GTX 1080" : "RTX 2080"}</div> : null}
              {i === 2 ? <div style={{ position: "absolute", left: xx(i) - 34, top: yy(vals[i]) + 20, width: 68, textAlign: "center", fontFamily: SANS, fontSize: 17, color: FAINT, opacity: on }}>RTX 3080</div> : null}
              {i === 3 ? <div style={{ position: "absolute", left: xx(i) - 42, top: yy(vals[i]) - 72, width: 84, textAlign: "center", fontFamily: SANS, fontSize: 17, color: RED, opacity: on }}>RTX 4080</div> : null}
              {i === 4 ? <div style={{ position: "absolute", left: xx(i) - 54, top: yy(vals[i]) + 24, width: 108, textAlign: "center", fontFamily: SANS, fontSize: 17, color: GREEN, opacity: on }}>RTX 5080</div> : null}
            </div>
          );
        })}

        <div style={{ position: "absolute", left: xx(3) + 38, top: yy(8600) + 8, opacity: punch, fontFamily: MONO, fontSize: 18, color: GREEN }}>−1400</div>
        <div style={{ position: "absolute", left: 700, top: 470, opacity: points, fontFamily: SANS, fontSize: 22, color: MUTED }}>
          <span style={{ fontFamily: MONO, fontWeight: 800, color: INK }}>×2</span>
          <span style={{ marginLeft: 8 }}>差不多翻倍</span>
        </div>
        <Stamp text="2025 回吐 1400" x={806} y={528} size={26} rotate={-4} t={punch} color={GREEN} />
        <div style={{ position: "absolute", left: 96, top: 1122, opacity: punch, fontFamily: SANS, fontSize: 24, color: MUTED }}>
          2025 年 80 级首发价回到 7200 元，但渠道价并没有跟着回到首发。
        </div>
        <Source text="口径：NVIDIA 80 级显卡首发 MSRP，按 1:7.2 汇率折算并取整到百元；不是国行首发价，不含税与渠道溢价。" y={1268} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene07;
