// Scene07 · 2019 实体清单：营收从 8914 亿掉到 6368 亿
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Signature, exitFade, mk, seg, easeOut, easeInOut, pop, clamp01,
  RED, INK, MUTED, MONO, SANS, SERIF,
} from "./ui";

const CHIPS = [
  { text: "芯片", sub: "CHIP" },
  { text: "软件", sub: "SOFTWARE" },
  { text: "工具", sub: "TOOLS" },
];

const Scene07: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = mk(marks, 1, 0.3);
  const m2 = mk(marks, 2, 0.55);
  const m3 = mk(marks, 3, 0.8);
  const panel = easeOut(seg(p, 0.02, 0.12));
  const bar1 = easeOut(seg(p, 0.06, 0.28));
  const bar2 = easeOut(seg(p, m2 - 0.06, m2 + 0.16));
  const drop = easeInOut(seg(p, m2 + 0.04, m2 + 0.22));
  const chips = seg(p, m1 - 0.02, m1 + 0.3);
  const big = pop(seg(p, m3 - 0.02, m3 + 0.12));
  const value2 = 6368 * easeOut(seg(p, m2 - 0.02, m2 + 0.18));

  const base = 588;
  const unitFor = (v: number) => (v / 9500) * 380;

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <Signature />
        <Cap text="2019 · 实体清单" x={150} y={330} opacity={seg(p, 0.02, 0.1)} color={RED} />
        <div style={{ position: "absolute", left: 150, top: 372, fontFamily: SERIF, fontSize: 42, color: INK, opacity: seg(p, 0.02, 0.1) }}>
          最冷的一年
        </div>

        <div
          style={{
            position: "absolute", left: 108, top: 452, width: 864, height: 740,
            background: "linear-gradient(160deg, #16212A 0%, #101820 100%)",
            boxShadow: "0 30px 70px rgba(16,24,32,0.28)",
            transform: `translateY(${(1 - panel) * 30}px)`, opacity: panel,
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "54px 54px", opacity: 0.5 }} />
          <div style={{ position: "absolute", left: 34, top: 30, fontFamily: MONO, fontSize: 12, color: "rgba(232,239,243,0.55)", letterSpacing: 2 }}>
            REVENUE / CNY 100 MILLION
          </div>
          <div style={{ position: "absolute", right: 34, top: 30, fontFamily: MONO, fontSize: 12, color: RED, letterSpacing: 2 }}>
            ENTITY LIST · 2019.05.16
          </div>
          <div style={{ position: "absolute", left: 40, top: 80, fontFamily: SERIF, fontSize: 74, color: "rgba(232,239,243,0.06)", letterSpacing: 6 }}>
            断供
          </div>

          {/* 轴 */}
          {[{ y: 208, v: "9500" }, { y: 348, v: "6000" }, { y: 588, v: "0" }].map((t, i) => (
            <div key={t.v}>
              <div style={{ position: "absolute", left: 52, right: 40, top: t.y, height: 1, background: i === 2 ? "rgba(232,239,243,0.35)" : "rgba(232,239,243,0.1)" }} />
              <div style={{ position: "absolute", left: 54, top: t.y - 20, fontFamily: MONO, fontSize: 11, color: "rgba(232,239,243,0.42)", letterSpacing: 1 }}>{t.v}</div>
            </div>
          ))}

          {/* 2020 柱 */}
          <div style={{ position: "absolute", left: 130, top: base - unitFor(8914) * bar1, width: 160, height: unitFor(8914) * bar1, background: "rgba(232,239,243,0.2)", borderTop: "3px solid rgba(232,239,243,0.8)" }} />
          <div style={{ position: "absolute", left: 130, top: 174, width: 160, textAlign: "center", fontFamily: MONO, fontSize: 40, fontWeight: 700, color: "#E8EFF3", opacity: bar1 }}>
            8914
          </div>
          <div style={{ position: "absolute", left: 130, top: 602, width: 160, textAlign: "center", fontFamily: MONO, fontSize: 15, color: "rgba(232,239,243,0.65)", letterSpacing: 2 }}>
            2020
          </div>

          {/* 2021 柱 */}
          <div style={{ position: "absolute", left: 360, top: base - unitFor(6368) * bar2, width: 160, height: unitFor(6368) * bar2, background: "rgba(207,10,44,0.72)", borderTop: `3px solid ${RED}` }} />
          <div style={{ position: "absolute", left: 360, top: 266 + (1 - bar2) * 18, width: 160, textAlign: "center", fontFamily: MONO, fontSize: 40, fontWeight: 700, color: RED, opacity: bar2 }}>
            {Math.round(value2)}
          </div>
          <div style={{ position: "absolute", left: 360, top: 602, width: 160, textAlign: "center", fontFamily: MONO, fontSize: 15, color: "rgba(232,239,243,0.65)", letterSpacing: 2 }}>
            2021
          </div>

          {/* 下滑箭头 */}
          <svg width="500" height="380" style={{ position: "absolute", left: 200, top: 180, opacity: drop }}>
            <path d="M 100 70 L 260 190" stroke={RED} strokeWidth="2.5" strokeDasharray="6 7" fill="none" />
            <path d="M 244 176 L 262 192 L 236 194" stroke={RED} strokeWidth="2.5" fill="none" />
          </svg>

          {/* 被切断的三样东西 */}
          {CHIPS.map((c, i) => {
            const t = clamp01(chips * 3 - i);
            return (
              <div key={c.text} style={{ position: "absolute", left: 590, top: 110 + i * 100, width: 250, height: 70, border: `1.5px solid ${t > 0.9 ? RED : "rgba(232,239,243,0.32)"}`, boxSizing: "border-box", opacity: 0.55 + 0.45 * t, background: "rgba(232,239,243,0.03)" }}>
                <div style={{ position: "absolute", left: 18, top: 9, fontFamily: SERIF, fontSize: 29, color: "#E8EFF3", letterSpacing: 3 }}>{c.text}</div>
                <div style={{ position: "absolute", right: 14, bottom: 9, fontFamily: MONO, fontSize: 10, color: "rgba(232,239,243,0.5)", letterSpacing: 2 }}>{c.sub}</div>
                <div style={{ position: "absolute", left: 8, top: 34, height: 3, width: 234 * t, background: RED, transform: "rotate(-2deg)", transformOrigin: "left center" }} />
              </div>
            );
          })}

          <div style={{ position: "absolute", left: 34, bottom: 26, fontFamily: SANS, fontSize: 15, color: "rgba(232,239,243,0.55)", letterSpacing: 2 }}>
            BIS Entity List · 五年财务摘要
          </div>
        </div>

        <div style={{ position: "absolute", left: 620, top: 948, opacity: big, transform: `scale(${0.85 + 0.15 * big})` }}>
          <div style={{ fontFamily: MONO, fontSize: 104, fontWeight: 700, color: RED, letterSpacing: -7, lineHeight: 0.9 }}>−28.6%</div>
          <div style={{ fontFamily: SANS, fontSize: 16, color: "rgba(232,239,243,0.75)", letterSpacing: 3, marginTop: 6 }}>营收同比</div>
        </div>

        <div style={{ position: "absolute", left: 150, top: 1224, fontFamily: SANS, fontSize: 18, color: MUTED, letterSpacing: 2, opacity: seg(p, m3, m3 + 0.1) }}>
          2021 年营收 6368 亿元，是华为近年最低点
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene07;
