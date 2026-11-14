// Scene03 · 是什么：一个很轻的中台，一台电脑就能跑
// 小方盒落在桌面上，云端被划掉；下方命令行逐字敲出，三种系统的小牌依次落位。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Card, Chip, Stamp, INK, INK_SOFT, FAINT, TEAL, RED, GOLD, MONO_STACK, SERIF_STACK, seg, eo, eoq, pop, lerp, clamp01 } from "./ui";

const CMD = "agent-autoloop";

const Scene03: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const drop = pop(seg(p, 0.08, 0.32));
  const slash = eo(seg(p, 0.34, 0.5));
  const typed = Math.floor(CMD.length * eoq(seg(p, 0.4, 0.66)));
  const osT = (i: number) => eo(seg(p, 0.6 + i * 0.07, 0.72 + i * 0.07));
  const note = eo(seg(p, 0.72, 0.9));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="03 / 一台电脑" x={150} y={330} />
        <Cap text="不用云服务器" x={880} y={330} align="right" color={FAINT} />
        <Hair x={150} y={368} w={270} color={TEAL} thickness={2} progress={eo(seg(p, 0.1, 0.36))} opacity={0.65} />
      </div>

      {/* 被划掉的云 */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: 1 - 0.35 * slash }}>
        <path
          d="M 600 560 C 600 512 640 486 682 500 C 700 452 764 448 790 492 C 844 486 878 522 872 560 C 902 568 908 606 878 620 L 620 620 C 592 610 584 572 600 560 Z"
          fill="rgba(24,22,19,0.03)" stroke={INK} strokeOpacity={0.42} strokeWidth={3} strokeDasharray="7 9"
        />
        <text x={626} y={654} fill={FAINT} fillOpacity={0.7} fontFamily={MONO_STACK} fontSize={17} letterSpacing={4}>云服务器</text>
      </svg>
      <div
        style={{
          position: "absolute", left: 600, top: 552, width: 300, height: 4, background: RED,
          transform: `rotate(-13deg) scaleX(${slash})`, transformOrigin: "0% 50%", opacity: 0.85,
        }}
      />

      {/* 桌面线 */}
      <div style={{ position: "absolute", left: 150, top: 900, width: 730, height: 1, background: INK, opacity: 0.2 }} />
      <div style={{ position: "absolute", left: 150, top: 906, width: 730, height: 14, background: `linear-gradient(180deg, ${INK}0A, transparent)` }} />

      {/* 小方盒 */}
      <div
        style={{
          position: "absolute", left: 384, top: lerp(640, 720, drop), width: 230, height: 180,
          transform: `translate(-50%,-50%) scale(${0.86 + 0.14 * drop})`,
          background: "linear-gradient(154deg, #FBF7EE, #EDE2CE)",
          border: `2px solid ${INK}`, borderRadius: 14,
          boxShadow: `0 26px 52px ${INK}26, inset 0 -8px 0 ${INK}08`,
          opacity: clamp01(drop * 2),
        }}
      >
        <div style={{ position: "absolute", left: 20, top: 18, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 3, color: FAINT }}>AI 管家</div>
        <div style={{ position: "absolute", left: 18, top: 52, fontFamily: SERIF_STACK, fontSize: 74, fontWeight: 700, color: INK, lineHeight: 1 }}>A</div>
        <div style={{ position: "absolute", right: 22, top: 58, width: 12, height: 12, borderRadius: 6, background: TEAL, boxShadow: `0 0 0 6px ${TEAL}18` }} />
        <div style={{ position: "absolute", left: 20, bottom: 18, fontFamily: MONO_STACK, fontSize: 14, color: FAINT, letterSpacing: 1 }}>装在自己电脑</div>
        <div style={{ position: "absolute", right: 18, bottom: 16, width: 46, height: 46, borderRadius: 6, border: `1px solid ${INK}22` }}>
          <div style={{ position: "absolute", left: 12, top: 8, width: 20, height: 2, background: INK, opacity: 0.3 }} />
          <div style={{ position: "absolute", left: 12, top: 16, width: 20, height: 2, background: INK, opacity: 0.2 }} />
          <div style={{ position: "absolute", left: 12, top: 24, width: 12, height: 2, background: INK, opacity: 0.2 }} />
        </div>
      </div>

      {/* 一条命令 */}
      <Card x={480} y={1012} w={620} h={92} opacity={eo(seg(p, 0.36, 0.5))} accent={TEAL}>
        <div style={{ position: "absolute", left: 24, top: 30, fontFamily: MONO_STACK, fontSize: 24, color: TEAL }}>&#8250;</div>
        <div style={{ position: "absolute", left: 48, top: 27, fontFamily: MONO_STACK, fontSize: 25, letterSpacing: 0.5, color: INK }}>
          {CMD.slice(0, typed)}
          <span style={{ opacity: 0.5 + 0.5 * Math.sin(p * 50) }}>_</span>
        </div>
        <div style={{ position: "absolute", right: 20, top: 22, fontFamily: MONO_STACK, fontSize: 13, color: FAINT, letterSpacing: 2 }}>
          v1.0
        </div>
      </Card>

      {/* 三平台 */}
      {["WINDOWS", "macOS", "LINUX"].map((t, i) => (
        <div
          key={t}
          style={{ position: "absolute", left: 232 + i * 212, top: 1112, opacity: osT(i), transform: `translateY(${(1 - osT(i)) * 12}px)` }}
        >
          <div style={{ width: 188, height: 58, border: `1px solid ${INK}24`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(251,247,239,0.6)" }}>
            <span style={{ fontFamily: MONO_STACK, fontSize: 17, letterSpacing: 3, color: INK_SOFT }}>{t}</span>
          </div>
        </div>
      ))}

      <div style={{ position: "absolute", left: 150, top: 1240, opacity: note }}>
        <span style={{ fontFamily: SERIF_STACK, fontSize: 30, color: INK_SOFT, letterSpacing: 1 }}>一台电脑，一条命令，就能开始。</span>
      </div>
    </AbsoluteFill>
  );
};

export default Scene03;
