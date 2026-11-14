// Scene02 · 痛点：人守着终端，窗口一关，会话就断
// 亮色终端窗口 + 右侧被拔掉的插头；拔开的一瞬，红色断线标记亮起。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, TermWin, Chip, INK, INK_SOFT, FAINT, TEAL, RED, GOLD, MONO_STACK, SERIF_STACK, seg, eo, pop, lerp, clamp01 } from "./ui";

const Scene02: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const pull = eo(seg(p, 0.5, 0.72));
  const plugY = lerp(792, 660, pull);
  const alarm = eo(seg(p, 0.7, 0.82));
  const dim = 1 - 0.35 * pull;

  const lines = [
    { t: "$ AI 助手", at: 0.08 },
    { t: "> 修改登录页", at: 0.2 },
    { t: "+ 检查通过", at: 0.34 },
    { t: "? 等你确认_", at: 0.46 },
  ];

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="02 / ATTENDED" x={150} y={330} />
        <Cap text="已经跑了 41 秒" x={880} y={330} align="right" color={FAINT} />
        <Hair x={150} y={368} w={250} color={RED} thickness={2} progress={eo(seg(p, 0.08, 0.3))} opacity={0.6} />
      </div>

      <div style={{ opacity: dim }}>
        <TermWin x={432} y={690} w={562} h={356} title="AI 助手 — 正在干活" opacity={eo(seg(p, 0.03, 0.2))} scale={0.98 + 0.02 * enter} dark={false}>
          <div style={{ padding: "24px 26px", fontFamily: MONO_STACK, fontSize: 21, lineHeight: 1.9, color: INK }}>
            {lines.map((l, i) => {
              const t = eo(seg(p, l.at, l.at + 0.08));
              return (
                <div key={i} style={{ opacity: t, transform: `translateX(${(1 - t) * -10}px)`, color: i === 3 ? GOLD : i === 2 ? TEAL : INK_SOFT }}>
                  {l.t}
                  {i === 3 ? (
                    <span style={{ opacity: 0.55 + 0.45 * Math.sin(p * 46) }}>|</span>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div style={{ position: "absolute", left: 26, bottom: 18, fontFamily: MONO_STACK, fontSize: 15, color: FAINT, letterSpacing: 1.5 }}>
            别关窗口
          </div>
        </TermWin>
      </div>

      {/* 线缆 + 插头 + 插座 */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <path
          d={`M 706 742 C 770 742 820 ${plugY - 22} 848 ${plugY - 34}`}
          fill="none" stroke={INK} strokeOpacity={0.55} strokeWidth={6} strokeLinecap="round"
        />
        <path
          d={`M 706 742 C 770 742 820 ${plugY - 22} 848 ${plugY - 34}`}
          fill="none" stroke={GOLD} strokeOpacity={0.35} strokeWidth={2} strokeLinecap="round"
        />
      </svg>

      <div
        style={{
          position: "absolute", left: 848, top: plugY - 34, width: 84, height: 58,
          transform: "translate(-50%,-50%)",
          background: "#EFE7D8", border: `2px solid ${INK}`, borderRadius: 8,
          boxShadow: `0 10px 22px ${INK}22`,
        }}
      >
        <div style={{ position: "absolute", left: 16, top: 56, width: 9, height: 20, background: "#C9BBA4", border: `1.5px solid ${INK}` }} />
        <div style={{ position: "absolute", right: 16, top: 56, width: 9, height: 20, background: "#C9BBA4", border: `1.5px solid ${INK}` }} />
        <div style={{ position: "absolute", left: 12, top: 9, width: 60, height: 2, background: INK, opacity: 0.3 }} />
      </div>

      <div
        style={{
          position: "absolute", left: 848, top: 856, width: 108, height: 104,
          transform: "translate(-50%,-50%)",
          background: "#DCCDB6", border: `2px solid ${INK}55`, borderRadius: 12,
          boxShadow: `inset 0 0 0 5px #E9DDC8`,
        }}
      >
        <div style={{ position: "absolute", left: 20, top: -12, width: 14, height: 18, background: "#2A2620", borderRadius: 2 }} />
        <div style={{ position: "absolute", right: 20, top: -12, width: 14, height: 18, background: "#2A2620", borderRadius: 2 }} />
        <div style={{ position: "absolute", left: 16, top: 34, width: 76, height: 9, background: INK, opacity: 0.22, borderRadius: 4 }} />
        <div style={{ position: "absolute", left: 16, top: 56, width: 52, height: 9, background: INK, opacity: 0.16, borderRadius: 4 }} />
        <div style={{ position: "absolute", right: 12, top: 72, width: 8, height: 8, borderRadius: 4, background: RED, opacity: 0.55 }} />
        <div style={{ position: "absolute", left: 10, bottom: 6, fontFamily: MONO_STACK, fontSize: 12, color: FAINT, letterSpacing: 2 }}>电源</div>
      </div>

      {/* 断开的虚线 + 状态 */}
      <div
        style={{
          position: "absolute", left: 846, top: plugY + 2, width: 2, height: Math.max(0, 790 - plugY),
          backgroundImage: `repeating-linear-gradient(180deg, ${RED} 0 7px, transparent 7px 15px)`,
          opacity: alarm * 0.9,
        }}
      />
      <Chip
        text={pull > 0.4 ? "断开了" : "运行中"}
        x={700} y={930} w={190}
        color={pull > 0.4 ? "#FBF6EC" : TEAL}
        bg={pull > 0.4 ? RED : "rgba(31,95,87,0.10)"}
        opacity={alarm}
        size={20}
      />

      {/* 底部批注 */}
      <div style={{ position: "absolute", left: 150, top: 1120, opacity: eo(seg(p, 0.66, 0.86)) }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 16, letterSpacing: 3, color: FAINT }}>人得守着</div>
        <div style={{ marginTop: 10, fontFamily: SERIF_STACK, fontSize: 36, color: INK, letterSpacing: 1 }}>
          窗口一关，它就停了。
        </div>
      </div>

      {/* 墙上时钟 */}
      <div style={{ position: "absolute", left: 742, top: 1080, width: 128, height: 128, borderRadius: 64, border: `1.5px solid ${INK}2E`, opacity: 0.55 * enter }}>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: 64 + Math.cos(a) * 54, top: 64 + Math.sin(a) * 54,
                width: 3, height: 3, borderRadius: 2, background: INK, transform: "translate(-50%,-50%)",
              }}
            />
          );
        })}
        <div style={{ position: "absolute", left: 62, top: 64, width: 2, height: 38, background: INK, transformOrigin: "50% 100%", transform: "rotate(38deg)" }} />
        <div style={{ position: "absolute", left: 63, top: 64, width: 1.5, height: 24, background: RED, transformOrigin: "50% 100%", transform: `rotate(${lerp(38, 220, p)}deg)` }} />
        <div style={{ position: "absolute", left: 60, top: 60, width: 8, height: 8, borderRadius: 4, background: RED }} />
      </div>
    </AbsoluteFill>
  );
};

export default Scene02;
