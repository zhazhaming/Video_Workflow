// Scene11 · 收尾：被按住的时候，才看得出骨头 + 固定结束语
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Petal, Signature, seg, easeOut, easeInOut, pop,
  RED, INK, MUTED, LINE, MONO, SANS, SERIF,
} from "./ui";

const TL = [
  { y: "1987", t: "起点" },
  { y: "1993", t: "自研" },
  { y: "2019", t: "断供" },
  { y: "2023", t: "回来" },
  { y: "2024", t: "8621 亿" },
];

const Scene11: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const petal = easeInOut(seg(p, 0.02, 0.24));
  const head = seg(p, 0.06, 0.2);
  const head2 = seg(p, 0.14, 0.3);
  const line = easeOut(seg(p, 0.26, 0.4));
  const timeline = seg(p, 0.3, 0.52);
  const ending = seg(p, 0.54, 0.66);
  const belief = seg(p, 0.64, 0.74);
  const cta = pop(seg(p, 0.78, 0.88));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} warm />
      <AbsoluteFill>
        <Signature opacity={0.35} />
        <div style={{ position: "absolute", left: 90, top: 210, width: 900, height: 900, borderRadius: "50%", border: `1px solid ${LINE}`, opacity: 0.45 }} />
        <div style={{ position: "absolute", left: 240, top: 360, width: 600, height: 600, borderRadius: "50%", border: `1px dashed ${LINE}`, opacity: 0.55 }} />

        <div style={{ position: "absolute", left: 458, top: 250 }}>
          <Petal x={0} y={0} size={120} color={RED} draw={petal} fillOpacity={0.08} strokeWidth={3} rotate={p * 12} />
        </div>

        <div style={{ position: "absolute", left: 150, top: 406, width: 780, textAlign: "center" }}>
          <div style={{ fontFamily: SERIF, fontSize: 56, fontWeight: 700, color: INK, letterSpacing: 4, lineHeight: 1.36, opacity: head, transform: `translateY(${(1 - head) * 16}px)` }}>
            被按住的时候，
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 56, fontWeight: 700, color: RED, letterSpacing: 4, lineHeight: 1.36, opacity: head2, transform: `translateY(${(1 - head2) * 16}px)` }}>
            才看得出骨头。
          </div>
        </div>

        <div style={{ position: "absolute", left: 540 - 120, top: 640, width: 240 * line, height: 3, background: RED, opacity: 0.8 }} />
        <div style={{ position: "absolute", left: 150, top: 658, width: 780, textAlign: "center", fontFamily: MONO, fontSize: 12, color: MUTED, letterSpacing: 3, opacity: line }}>
          HUAWEI · 1987—2024
        </div>

        {/* 时间线 */}
        <div style={{ position: "absolute", left: 180, top: 724, width: 620, opacity: timeline }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 610 * easeOut(timeline), height: 1, background: "rgba(16,24,32,0.35)" }} />
          {TL.map((it, i) => {
            const x = (i / (TL.length - 1)) * 610;
            const t = Math.max(0, Math.min(1, timeline * 1.6 - i * 0.12));
            return (
              <div key={it.y} style={{ position: "absolute", left: x, top: -5, width: 100, textAlign: "left", opacity: t }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: i === TL.length - 1 ? RED : INK, boxShadow: i === TL.length - 1 ? "0 0 0 7px rgba(207,10,44,0.12)" : undefined }} />
                <div style={{ marginTop: 14, fontFamily: MONO, fontSize: 17, fontWeight: 700, color: i === TL.length - 1 ? RED : INK, letterSpacing: 1 }}>{it.y}</div>
                <div style={{ marginTop: 2, fontFamily: SANS, fontSize: 12, color: MUTED, letterSpacing: 2 }}>{it.t}</div>
              </div>
            );
          })}
        </div>

        {/* 固定结束语（画面同步） */}
        <div style={{ position: "absolute", left: 150, top: 858, width: 780, textAlign: "center", opacity: ending, transform: `translateY(${(1 - ending) * 12}px)` }}>
          <div style={{ fontFamily: SANS, fontSize: 21, color: RED, letterSpacing: 6, fontWeight: 700 }}>我是阿扎 · 每日一家公司</div>
          <div style={{ marginTop: 8, fontFamily: SERIF, fontSize: 52, color: INK, letterSpacing: 3, fontWeight: 700 }}>我们下期见</div>
          <div style={{ marginTop: 8, fontFamily: SERIF, fontSize: 27, color: INK, letterSpacing: 3, opacity: belief }}>带你领略科普知识</div>
          <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 12, color: MUTED, letterSpacing: 4, opacity: belief }}>THANKS FOR WATCHING</div>
        </div>

        <div style={{ position: "absolute", left: 540 - 350, top: 1044, width: 700, height: 100, borderRadius: 18, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: cta, transform: `scale(${0.92 + 0.08 * cta})`, background: RED, boxShadow: "0 16px 34px rgba(207,10,44,0.22)" }}>
          <span style={{ fontFamily: SANS, fontSize: 21, color: "rgba(255,255,255,0.86)", letterSpacing: 2 }}>如果对你有帮助</span>
          <span style={{ marginTop: 4, fontFamily: SANS, fontSize: 31, color: "#FFFFFF", letterSpacing: 3, fontWeight: 700 }}>点赞收藏加关注</span>
        </div>

        <div style={{ position: "absolute", left: 150, top: 1172, width: 780, textAlign: "center", fontFamily: MONO, fontSize: 12, color: MUTED, letterSpacing: 3, opacity: 0.6 * cta }}>
          LIKE · SAVE · FOLLOW
        </div>

        <div style={{ position: "absolute", right: 120, bottom: 300, fontFamily: MONO, fontSize: 12, color: MUTED, letterSpacing: 2, opacity: 0.45, transform: "rotate(-90deg)", transformOrigin: "right bottom" }}>
          KEEP BUILDING
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene11;
