// Scene09 · 选票：限制数据中心成为候选人承诺，蓝潮把议题送进国会
// 一张勾选选票 + 投票箱；最后参众两院条变蓝，点明“风向变了”。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Card, RED, BLUE, INK, INK_SOFT, FAINT, MONO_STACK, SERIF_STACK, seg, eo, pop, lerp, clamp01 } from "./ui";

const ITEMS = ["限制数据中心", "暂停新的审批", "公开电费与水耗"];

const Scene09: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const ballot = eo(seg(p, 0.1, 0.3));
  const drop = eo(seg(p, 0.3, 0.5));
  const checks = eo(seg(p, 0.34, 0.66));
  const bars = eo(seg(p, 0.5, 0.7));
  const note = eo(seg(p, 0.6, 0.76));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="CASE 09 / 11 · 选票" x={108} y={300} color={BLUE} />
        <Cap text="BALLOT / 2026" x={972} y={300} align="right" color={FAINT} />
        <Hair x={108} y={338} w={864} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 108, top: 390, opacity: enter }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 62, fontWeight: 700, color: INK, letterSpacing: 2 }}>
          数据中心，上了选票。
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 19, letterSpacing: 2, color: FAINT, marginTop: 10 }}>
          2026 中期选举 · 地方公投与候选人承诺
        </div>
      </div>

      {/* 选票 */}
      <div style={{ opacity: ballot, transform: `translateY(${(1 - ballot) * 34}px)` }}>
        <Card x={318} y={880} w={370} h={450} accent={BLUE} rotate={-2}>
          <div style={{ position: "absolute", left: 24, top: 18, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 3, color: FAINT }}>
            OFFICIAL BALLOT
          </div>
          <div style={{ position: "absolute", left: 24, top: 44, fontFamily: SERIF_STACK, fontSize: 34, fontWeight: 700, color: INK }}>
            你支持吗？
          </div>
          <div style={{ position: "absolute", left: 24, top: 92, width: 322, height: 1, background: INK, opacity: 0.18 }} />
          {ITEMS.map((it, i) => {
            const t = eo(seg(p, 0.22 + i * 0.05, 0.36 + i * 0.05));
            return (
              <div key={it} style={{ position: "absolute", left: 24, top: 122 + i * 74, width: 322 }}>
                <div
                  style={{
                    position: "absolute", left: 0, top: 0, width: 34, height: 34,
                    border: `2px solid ${INK}`, background: t > 0.3 ? BLUE : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <svg width={24} height={24} viewBox="0 0 24 24">
                    <polyline
                      points="4,13 10,19 20,5"
                      fill="none"
                      stroke="#FBF6EC"
                      strokeWidth={3.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="30"
                      strokeDashoffset={30 * (1 - t)}
                    />
                  </svg>
                </div>
                <div style={{ position: "absolute", left: 52, top: 1, fontFamily: SERIF_STACK, fontSize: 30, color: INK }}>
                  {it}
                </div>
              </div>
            );
          })}
          <div style={{ position: "absolute", left: 24, bottom: 20, fontFamily: MONO_STACK, fontSize: 12, letterSpacing: 1, color: FAINT }}>
            SAMPLE BALLOT / 示意
          </div>
        </Card>
      </div>

      {/* 投票箱 */}
      <div style={{ opacity: drop, transform: `translateY(${(1 - drop) * 20}px)` }}>
        <div style={{ position: "absolute", left: 640, top: 900, width: 300, height: 330, border: `2.5px solid ${INK}`, background: "rgba(252,248,240,0.75)", borderRadius: 6, boxShadow: `0 18px 40px ${INK}18` }}>
          <div style={{ position: "absolute", left: 44, top: -10, width: 212, height: 10, background: INK }} />
          <div style={{ position: "absolute", left: 0, top: 76, width: 300, height: 2, background: INK, opacity: 0.35 }} />
          <div style={{ position: "absolute", left: 0, top: 150, width: 300, textAlign: "center", fontFamily: MONO_STACK, fontSize: 18, letterSpacing: 4, color: BLUE }}>
            VOTE
          </div>
          <div style={{ position: "absolute", left: 0, top: 196, width: 300, height: 8, background: BLUE, opacity: 0.85 * bars }} />
          <div style={{ position: "absolute", left: 0, top: 212, width: 300 * 0.62 * bars, height: 8, background: BLUE, opacity: 0.55 }} />
          <div style={{ position: "absolute", left: 0, bottom: 18, width: 300, textAlign: "center", fontFamily: MONO_STACK, fontSize: 13, color: FAINT }}>
            DEM + HOUSE + SENATE
          </div>
        </div>

        {/* 三张选票落箱 */}
        {[0, 1, 2].map((i) => {
          const t = clamp01((p - 0.28 - i * 0.05) / 0.18);
          const y = 720 + t * 180 + i * 22;
          const x = 700 + i * 52;
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: x, top: y, width: 104, height: 70,
                background: "#FBF6EC", border: `1.5px solid ${INK}55`,
                transform: `rotate(${-8 + i * 7}deg)`,
                opacity: t > 0 ? 0.9 : 0,
                boxShadow: `0 8px 18px ${INK}18`,
              }}
            >
              <div style={{ position: "absolute", left: 12, top: 14, width: 56, height: 5, background: BLUE, opacity: 0.7 }} />
              <div style={{ position: "absolute", left: 12, top: 28, width: 76, height: 4, background: INK, opacity: 0.25 }} />
              <div style={{ position: "absolute", left: 12, top: 40, width: 44, height: 4, background: INK, opacity: 0.25 }} />
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", left: 108, top: 1230, opacity: note }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 31, color: INK_SOFT }}>
          “限制数据中心”不再是技术问题，而是能赢的竞选承诺。
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 16, letterSpacing: 2, color: FAINT, marginTop: 12 }}>
          SOURCE: CNBC / DATA CENTER KNOWLEDGE · 2026.11
        </div>
      </div>

      <div style={{ position: "absolute", left: 700, top: 1300, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 2, color: BLUE, opacity: clamp01(note) }}>
        HOUSE ✓ · SENATE ✓
      </div>
    </AbsoluteFill>
  );
};

export default Scene09;
