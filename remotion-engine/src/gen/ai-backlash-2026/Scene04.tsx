// Scene04 · 起点：2022 年 ChatGPT 发布，算力被当成石油，机架一排排长出来
// 横向时间轴 + 逐年增高的服务器机架；2022 节点用红框标出。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Card, Rack, RED, GOLD, INK, INK_SOFT, FAINT, MONO_STACK, SERIF_STACK, seg, eo, pop, lerp } from "./ui";

const YEARS = ["2022", "2023", "2024", "2025", "2026"];
const RACKS = [1, 2, 3, 4, 5];

const Scene04: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const line = eo(seg(p, 0.1, 0.42));
  const head = eo(seg(p, 0.05, 0.24));
  const eq = pop(seg(p, 0.62, 0.76));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="CASE 04 / 11 · 起点" x={108} y={300} color={GOLD} />
        <Cap text="2022 → 2026" x={972} y={300} align="right" color={FAINT} />
        <Hair x={108} y={338} w={864} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 108, top: 390, opacity: head }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 64, fontWeight: 700, color: INK, letterSpacing: 2 }}>
          算力，成了石油。
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 20, letterSpacing: 3, color: FAINT, marginTop: 10 }}>
          2022 年 11 月 · ChatGPT 发布
        </div>
      </div>

      <Card x={300} y={660} w={384} h={116} opacity={pop(seg(p, 0.16, 0.3))} scale={0.94} accent={GOLD}>
        <div style={{ position: "absolute", left: 18, top: 14, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 3, color: FAINT }}>2022.11 / OPENAI</div>
        <div style={{ position: "absolute", left: 18, top: 44, fontFamily: SERIF_STACK, fontSize: 34, fontWeight: 700, color: INK }}>ChatGPT 上线</div>
        <div style={{ position: "absolute", right: 16, top: 22, width: 44, height: 44, borderRadius: 22, border: `2px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO_STACK, fontSize: 13, color: GOLD }}>AI</div>
      </Card>

      {/* 时间轴 */}
      <div style={{ position: "absolute", left: 120, top: 1010, width: 840, height: 2, background: INK, opacity: 0.25 }} />
      <div style={{ position: "absolute", left: 120, top: 1010, width: 840 * line, height: 3, background: GOLD }} />

      {YEARS.map((y, i) => {
        const x = 152 + i * 196;
        const t = pop(seg(p, 0.14 + i * 0.05, 0.26 + i * 0.05));
        const grow = eo(seg(p, 0.18 + i * 0.05, 0.34 + i * 0.05));
        const n = RACKS[i];
        return (
          <React.Fragment key={y}>
            <div style={{ position: "absolute", left: x, top: 1010, width: 2, height: 600 * 0 }} />
            <div
              style={{
                position: "absolute", left: x + 2, top: 1002, width: 14, height: 14, borderRadius: 7,
                background: i === 0 ? RED : INK, opacity: t,
              }}
            />
            <div style={{ position: "absolute", left: x - 10, top: 1032, fontFamily: MONO_STACK, fontSize: 22, letterSpacing: 1, color: i === 0 ? RED : INK_SOFT, opacity: t }}>
              {y}
            </div>

            {/* 机架逐年增高 */}
            <div style={{ position: "absolute", left: x - 56, top: 940, width: 150, height: 60 }}>
              {Array.from({ length: n }, (_, k) => {
                const h = 34 + k * 26;
                const bx = k * 24;
                return (
                  <div key={k} style={{ opacity: grow }}>
                    <Rack x={bx} y={-h} w={20} h={h} color={i === 0 ? RED : INK} opacity={0.55 + 0.08 * k} filled={0.4 + 0.12 * k} />
                  </div>
                );
              })}
            </div>
          </React.Fragment>
        );
      })}

      {/* 尾节点：2026 红色向上箭头 */}
      <div style={{ position: "absolute", left: 930, top: 900, opacity: eo(seg(p, 0.7, 0.84)) }}>
        <div style={{ width: 2, height: 86, background: RED, marginLeft: 8 }} />
        <div style={{ width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderBottom: `14px solid ${RED}`, marginLeft: -1 }} />
      </div>

      <div style={{ position: "absolute", left: 120, top: 1110, width: 840, opacity: eq }}>
        <div style={{ height: 1, background: INK, opacity: 0.16 }} />
        <div style={{ marginTop: 26, display: "flex", alignItems: "baseline", gap: 18 }}>
          <span style={{ fontFamily: SERIF_STACK, fontSize: 56, fontWeight: 700, color: INK }}>算力</span>
          <span style={{ fontFamily: MONO_STACK, fontSize: 38, color: RED }}>=</span>
          <span style={{ fontFamily: SERIF_STACK, fontSize: 56, fontWeight: 700, color: RED }}>石油</span>
          <span style={{ fontFamily: MONO_STACK, fontSize: 19, letterSpacing: 2, color: FAINT, marginLeft: 10 }}>资本开支的新信仰</span>
        </div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 28, color: INK_SOFT, marginTop: 10 }}>
          巨头开始抢地、抢电、抢水，数据中心从后台成本变成战略资产。
        </div>
      </div>

      <div style={{ position: "absolute", left: 108, top: 1300, fontFamily: MONO_STACK, fontSize: 16, letterSpacing: 2, color: FAINT }}>
        SOURCE: OPENAI / 2022.11
      </div>
    </AbsoluteFill>
  );
};

export default Scene04;
