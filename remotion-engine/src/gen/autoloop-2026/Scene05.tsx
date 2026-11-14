// Scene05 · 只问关键：拿不准才发卡片，等待期间进程退出、Token 归零
// 左边是暂停的会话，右边是飞来的问询卡；底部一条空掉的 Token 计量条。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Card, Chip, Stamp, Dot, INK, INK_SOFT, FAINT, TEAL, RED, GOLD, MONO_STACK, SERIF_STACK, seg, eo, pop, lerp, clamp01 } from "./ui";

const Scene05: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const cardIn = pop(seg(p, 0.16, 0.4));
  const opt1 = eo(seg(p, 0.42, 0.54));
  const opt2 = eo(seg(p, 0.52, 0.64));
  const meter = eo(seg(p, 0.58, 0.78));
  const stamp = eo(seg(p, 0.74, 0.86));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="05 / 只问关键" x={150} y={330} />
        <Cap text="等你回复 / 不花钱" x={880} y={330} align="right" color={FAINT} />
        <Hair x={150} y={368} w={310} color={GOLD} thickness={2} progress={eo(seg(p, 0.08, 0.32))} opacity={0.7} />
      </div>

      {/* 左边：暂停的会话 */}
      <Card x={330} y={690} w={300} h={270} opacity={eo(seg(p, 0.04, 0.2))} accent={FAINT} style={{ background: "rgba(251,247,239,0.72)" }}>
        <div style={{ position: "absolute", left: 24, top: 20, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 2.5, color: FAINT }}>任务</div>
        <div style={{ position: "absolute", left: 24, top: 66, width: 64, height: 64, borderRadius: 32, border: `2px solid ${INK}33`, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <div style={{ width: 9, height: 28, background: INK, opacity: 0.55, borderRadius: 2 }} />
          <div style={{ width: 9, height: 28, background: INK, opacity: 0.55, borderRadius: 2 }} />
        </div>
        <div style={{ position: "absolute", left: 108, top: 78, fontFamily: MONO_STACK, fontSize: 17, color: INK_SOFT, letterSpacing: 1 }}>暂停中</div>
        <div style={{ position: "absolute", left: 108, top: 102, fontFamily: MONO_STACK, fontSize: 14, color: FAINT }}>已经退出</div>
        <div style={{ position: "absolute", left: 24, bottom: 22, fontFamily: MONO_STACK, fontSize: 14, color: FAINT }}>
          等你回复，不占电脑
        </div>
      </Card>

      {/* 虚线投递路径 */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <path
          d="M 480 690 C 520 620 560 620 596 672"
          fill="none" stroke={GOLD} strokeWidth={2} strokeOpacity={0.55} strokeDasharray="6 8"
          strokeDashoffset={120 * (1 - eo(seg(p, 0.2, 0.42)))}
        />
        <path d="M 596 672 l 2 16 l -15 -7 z" fill={GOLD} fillOpacity={0.6} />
      </svg>

      {/* 右边：问询卡 */}
      <Card
        x={700} y={680} w={300} h={430}
        opacity={clamp01(cardIn * 1.4)} scale={0.86 + 0.14 * cardIn} rotate={-2.4}
        accent={GOLD}
      >
        <div style={{ position: "absolute", left: 24, top: 20, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 3, color: GOLD }}>需要你定</div>
        <div style={{ position: "absolute", right: 18, top: 12, fontFamily: SERIF_STACK, fontSize: 92, color: GOLD, opacity: 0.16 }}>?</div>
        <div style={{ position: "absolute", left: 24, top: 58, fontFamily: SERIF_STACK, fontSize: 30, color: INK, letterSpacing: 1 }}>这一步，</div>
        <div style={{ position: "absolute", left: 24, top: 96, fontFamily: SERIF_STACK, fontSize: 30, color: INK, letterSpacing: 1 }}>要你来定。</div>
        <div style={{ position: "absolute", left: 24, top: 152, width: 250, height: 1, background: INK, opacity: 0.12 }} />
        {["A / 继续", "B / 先停"].map((t, i) => {
          const k = i === 0 ? opt1 : opt2;
          return (
            <div
              key={t}
              style={{
                position: "absolute", left: 24, top: 174 + i * 62, width: 252, height: 50,
                border: `1px solid ${i === 0 ? TEAL + "66" : INK + "22"}`, borderRadius: 7,
                background: i === 0 ? `${TEAL}10` : "transparent",
                display: "flex", alignItems: "center", paddingLeft: 16,
                fontFamily: MONO_STACK, fontSize: 17, color: i === 0 ? TEAL : INK_SOFT,
                opacity: k, transform: `translateX(${(1 - k) * 14}px)`,
              }}
            >
              {t}
              {i === 0 ? <span style={{ marginLeft: "auto", marginRight: 14, fontSize: 15 }}>&#10003;</span> : null}
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 24, bottom: 22, fontFamily: MONO_STACK, fontSize: 13, color: FAINT, letterSpacing: 1 }}>飞书 / 电脑弹窗</div>
      </Card>

      <div style={{ position: "absolute", left: 706, top: 922, opacity: stamp }}>
        <Stamp text="等你" x={0} y={0} size={26} rotate={-7} t={stamp} color={RED} />
      </div>

      {/* Token 计量 */}
      <div style={{ position: "absolute", left: 150, top: 1052, width: 730, opacity: meter }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontFamily: MONO_STACK, fontSize: 16, letterSpacing: 4, color: FAINT }}>AI 用量</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontFamily: SERIF_STACK, fontSize: 54, color: TEAL, lineHeight: 1 }}>0</span>
            <span style={{ fontFamily: MONO_STACK, fontSize: 14, color: FAINT, letterSpacing: 2 }}>等待时不花钱</span>
          </div>
        </div>
        <div style={{ marginTop: 14, position: "relative", height: 18, borderRadius: 9, background: "rgba(24,22,19,0.07)", overflow: "hidden" }}>
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} style={{ position: "absolute", left: `${(i / 24) * 100}%`, top: 0, width: 1, height: 18, background: INK, opacity: 0.08 }} />
          ))}
          <div style={{ position: "absolute", left: 0, top: 0, height: 18, width: `${2 * Math.sin(p * 8) + 2}%`, background: RED, opacity: 0.35 }} />
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 12 }}>
          <div style={{ height: 36, padding: "0 18px", display: "flex", alignItems: "center", borderRadius: 18, background: "rgba(31,95,87,0.09)", color: TEAL, fontFamily: MONO_STACK, fontSize: 16, letterSpacing: 1 }}>你一点，接着干</div>
          <div style={{ height: 36, padding: "0 16px", display: "flex", alignItems: "center", borderRadius: 18, background: "rgba(24,22,19,0.05)", color: INK_SOFT, fontFamily: MONO_STACK, fontSize: 16, letterSpacing: 1 }}>不占电脑</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene05;
