// Scene08 · 2023：Mate 60 上架，手机业务回来
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Phone, Chip, Petal, Stamp, Signature, GhostYear, exitFade, mk, seg, easeOut, easeInOut, pop,
  RED, INK, MUTED, LINE, STEEL, MONO, SANS, SERIF,
} from "./ui";

const Scene08: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = mk(marks, 1, 0.32);
  const m2 = mk(marks, 2, 0.62);
  const phoneIn = easeOut(seg(p, 0.03, 0.2));
  const screen = easeOut(seg(p, 0.1, 0.32));
  const join = easeInOut(seg(p, 0.22, 0.4));
  const labels = seg(p, m1 - 0.04, m1 + 0.16);
  const mate = pop(seg(p, m2 - 0.04, m2 + 0.1));
  const stamp = pop(seg(p, m2 + 0.12, m2 + 0.24));
  const spark = Math.abs(Math.sin(p * 34)) * (1 - seg(p, 0.42, 0.54));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} warm />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <Signature />
        <GhostYear text="2023" x={520} y={468} size={300} opacity={0.055} />
        <Cap text="2023 · 回来" x={150} y={330} opacity={seg(p, 0.02, 0.1)} />
        <div style={{ position: "absolute", left: 150, top: 372, fontFamily: SERIF, fontSize: 42, color: INK, opacity: seg(p, 0.02, 0.1) }}>
          没有发布会，只有上架
        </div>

        {/* 手机 */}
        <div style={{ opacity: phoneIn, transform: `translateY(${(1 - phoneIn) * 44}px)` }}>
          <div style={{ position: "absolute", left: 140, top: 430, width: 380, height: 700, borderRadius: 60, background: "radial-gradient(circle, rgba(207,10,44,0.18) 0%, rgba(207,10,44,0) 68%)", opacity: screen }} />
          <Phone x={160} y={440} w={330} h={680} rotate={-8 + 8 * phoneIn} glow={screen}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 34%, rgba(207,10,44,0.42) 0%, rgba(14,23,30,0.1) 60%, rgba(14,23,30,0) 80%)", opacity: screen }} />
            <div style={{ position: "absolute", left: 0, top: 58, width: "100%", textAlign: "center", fontFamily: MONO, fontSize: 14, color: "#F2C14E", letterSpacing: 5, opacity: screen }}>
              HUAWEI
            </div>
            <div style={{ position: "absolute", left: 40, top: 160, opacity: screen }}>
              <Chip x={0} y={0} size={196} t={screen} color="#F2C14E" pins={6} light />
            </div>
            <div style={{ position: "absolute", left: 0, bottom: 74, width: "100%", textAlign: "center", fontFamily: MONO, fontSize: 11, color: "rgba(232,239,243,0.6)", letterSpacing: 3, opacity: screen }}>
              HARMONYOS
            </div>
            <div style={{ position: "absolute", left: 0, bottom: 38, width: "100%", textAlign: "center", fontFamily: SERIF, fontSize: 22, color: "#E8EFF3", letterSpacing: 4, opacity: screen }}>
              Mate 60
            </div>
          </Phone>
        </div>

        {/* 重新接通的线路 */}
        <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
          <g fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round">
            <path d="M 996 352 L 870 352 L 812 410 L 742 410" opacity="0.45" strokeDasharray="7 8" />
            <path d="M 648 468 L 570 548 L 500 548" opacity="0.45" strokeDasharray="7 8" />
            <path d="M 742 410 L 648 468" stroke={RED} strokeWidth="3.4" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - join} opacity={join} />
          </g>
          <circle cx="695" cy="439" r={6 + 22 * spark} fill="none" stroke={RED} strokeWidth="1.8" opacity={join * spark + 0.2 * join} />
          <circle cx="695" cy="439" r="4.5" fill={RED} opacity={join} />
        </svg>

        {/* 系统与芯片标签 */}
        <div style={{ position: "absolute", left: 600, top: 600, width: 330, opacity: labels, transform: `translateX(${(1 - labels) * 24}px)` }}>
          {[
            { name: "鸿蒙系统", en: "HARMONYOS", note: "自研操作系统" },
            { name: "海思芯片", en: "HISILICON", note: "自研芯片设计" },
          ].map((it) => (
            <div key={it.name} style={{ position: "relative", padding: "16px 0 16px", borderTop: `1.5px solid rgba(16,24,32,0.18)` }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 700, color: INK, letterSpacing: 2 }}>{it.name}</span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: RED, letterSpacing: 2 }}>{it.en}</span>
              </div>
              <div style={{ fontFamily: SANS, fontSize: 16, color: MUTED, letterSpacing: 2, marginTop: 4 }}>{it.note}</div>
              <div style={{ position: "absolute", right: 0, top: 22, width: 20, height: 20, borderRadius: "50%", border: `1.5px solid ${RED}`, opacity: 0.7 }} />
              <div style={{ position: "absolute", right: 7, top: 29, width: 6, height: 6, borderRadius: "50%", background: RED }} />
            </div>
          ))}
        </div>

        <div style={{ position: "absolute", left: 600, top: 866, opacity: seg(p, m2 - 0.08, m2 + 0.02), transform: `translateY(${(1 - mate) * 12}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 60, fontWeight: 700, color: INK, letterSpacing: -3 }}>Mate 60</div>
          <div style={{ fontFamily: SANS, fontSize: 17, color: MUTED, letterSpacing: 3, marginTop: 2 }}>未发先售 · 2023 年 8 月</div>
        </div>

        <Stamp text="回来" x={806} y={1016} size={46} rotate={-9} t={stamp} />

        <div style={{ position: "absolute", left: 160, top: 1140, opacity: seg(p, m2 + 0.1, m2 + 0.22) }}>
          <Petal x={0} y={-12} size={64} color={RED} draw={1} fillOpacity={0.1} strokeWidth={4} />
          <div style={{ marginLeft: 82, marginTop: -52, fontFamily: SANS, fontSize: 16, color: MUTED, letterSpacing: 2 }}>
            备胎计划 · 十年前的准备
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene08;
