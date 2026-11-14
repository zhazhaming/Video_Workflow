// Scene12 · 收尾：一台手机的背后，是一家公司用十年把断掉的路接上
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Petal, Signature, seg, easeInOut, pop, mk,
  RED, INK, MUTED, LINE, STEEL, MONO, SANS, SERIF,
} from "./ui";

const Scene12: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = mk(marks, 1, 0.3);
  const m2 = mk(marks, 2, 0.52);
  const m3 = mk(marks, 3, 0.68);
  const m4 = mk(marks, 4, 0.84);
  const body = seg(p, 0.04, 0.16);
  const body2 = seg(p, m1 - 0.04, m1 + 0.12);
  const connect = easeInOut(seg(p, m1 + 0.02, m1 + 0.34));
  const spark = pop(seg(p, m1 + 0.26, m1 + 0.38));
  const ending = seg(p, m2 - 0.04, m2 + 0.08);
  const belief = seg(p, m3 - 0.04, m3 + 0.08);
  const cta = pop(seg(p, m4 - 0.02, m4 + 0.1));
  const petal = easeInOut(seg(p, 0.02, 0.24));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} warm />

      <div style={{ position: "absolute", left: 90, top: 120, width: 900, height: 900, borderRadius: "50%", border: `1px solid ${LINE}`, opacity: 0.35 }} />
      <div style={{ position: "absolute", left: 486, top: 168 }}>
        <Petal x={0} y={0} size={108} color={RED} draw={petal} fillOpacity={0.07} strokeWidth={3} rotate={p * 10} />
      </div>

      <div style={{ position: "absolute", left: 150, top: 342, width: 780, opacity: body, transform: `translateY(${(1 - body) * 14}px)` }}>
        <div style={{ fontFamily: SERIF, fontSize: 50, fontWeight: 700, color: INK, letterSpacing: 3, lineHeight: 1.4 }}>一台手机的背后，是一家公司。</div>
      </div>

      <div style={{ position: "absolute", left: 150, top: 442, width: 780, opacity: body2, transform: `translateY(${(1 - body2) * 14}px)` }}>
        <div style={{ fontFamily: SERIF, fontSize: 50, fontWeight: 700, color: RED, letterSpacing: 3 }}>
          用十年，把断掉的路<span style={{ borderBottom: `6px solid ${RED}` }}>接上</span>。
        </div>
      </div>

      {/* 断线重连 */}
      <div style={{ position: "absolute", left: 90, top: 594, width: 900, height: 200 }}>
        <svg width="900" height="200" viewBox="0 0 900 200" style={{ position: "absolute", inset: 0 }}>
          <path d="M 80 100 C 170 100, 230 96, 340 100" fill="none" stroke="rgba(16,24,32,0.55)" strokeWidth="3" strokeDasharray="7 7" />
          <path d="M 560 100 C 680 104, 750 100, 840 100" fill="none" stroke="rgba(16,24,32,0.55)" strokeWidth="3" strokeDasharray="7 7" />
          <path
            d="M 340 100 C 400 56, 500 56, 560 100"
            fill="none" stroke={RED} strokeWidth="5" strokeLinecap="round"
            pathLength={1} strokeDasharray="1" strokeDashoffset={1 - connect}
            opacity="0.95"
          />
          <circle cx="340" cy="100" r="6" fill={INK} />
          <circle cx="560" cy="100" r="6" fill={INK} />
          <circle cx="450" cy="74" r={8 + 5 * spark} fill={RED} opacity={spark} />
          <circle cx="450" cy="74" r={18 + 16 * spark} fill="none" stroke={RED} strokeWidth="1.5" opacity={0.4 * spark} />
        </svg>
        <div style={{ position: "absolute", left: 30, top: 108, width: 70, textAlign: "center" }}>
          <div style={{ width: 44, height: 74, margin: "0 auto", border: `2px solid ${INK}`, borderRadius: 8 }} />
          <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: 1 }}>2019</div>
        </div>
        <div style={{ position: "absolute", right: 24, top: 108, width: 80, textAlign: "center" }}>
          <div style={{ width: 58, height: 58, margin: "0 auto", border: `2px solid ${RED}`, background: "rgba(207,10,44,0.08)" }} />
          <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: 1 }}>2025</div>
        </div>
        <div style={{ position: "absolute", left: 330, top: 134, fontFamily: SANS, fontSize: 12, color: RED, letterSpacing: 2, opacity: spark }}>接上</div>
      </div>

      <div style={{ position: "absolute", left: 150, top: 800, width: 780, textAlign: "center", opacity: ending, transform: `translateY(${(1 - ending) * 12}px)` }}>
        <div style={{ fontFamily: SANS, fontSize: 20, color: RED, letterSpacing: 6, fontWeight: 700 }}>我是阿扎 · 每日一家公司</div>
        <div style={{ marginTop: 6, fontFamily: SERIF, fontSize: 58, color: INK, letterSpacing: 3, fontWeight: 700 }}>我们下期见</div>
        <div style={{ marginTop: 8, fontFamily: SERIF, fontSize: 26, color: INK, letterSpacing: 3, opacity: belief }}>带你领略科普知识</div>
        <div style={{ marginTop: 4, fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: 4, opacity: belief }}>THANKS FOR WATCHING</div>
      </div>

      <div
        style={{
          position: "absolute", left: 190, top: 1010, width: 700, height: 98, borderRadius: 18,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          opacity: cta, transform: `scale(${0.92 + 0.08 * cta})`,
          background: RED, boxShadow: "0 16px 34px rgba(207,10,44,0.22)",
        }}
      >
        <span style={{ fontFamily: SANS, fontSize: 20, color: "rgba(255,255,255,0.86)", letterSpacing: 2 }}>如果对你有帮助</span>
        <span style={{ marginTop: 3, fontFamily: SANS, fontSize: 31, color: "#FFFFFF", letterSpacing: 3, fontWeight: 700 }}>点赞收藏加关注</span>
      </div>

      <div style={{ position: "absolute", left: 150, top: 1130, width: 780, textAlign: "center", fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: 3, opacity: 0.55 * cta }}>
        ONE PHONE · ONE COMPANY · TEN YEARS
      </div>
    </AbsoluteFill>
  );
};

export default Scene12;
