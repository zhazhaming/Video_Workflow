// Scene06 · 场景一：早上八点，早报已经写好
// 左边一只走向 8:00 的钟，右边一张自己长出来的简报卡；晨光从钟后面升起。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Card, Chip, Stamp, INK, INK_SOFT, FAINT, TEAL, RED, GOLD, MONO_STACK, SERIF_STACK, seg, eo, pop, lerp } from "./ui";

const CX = 345;
const CY = 780;
const R = 168;

const Scene06: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const hand = eo(seg(p, 0.1, 0.5));
  const cardIn = eo(seg(p, 0.16, 0.38));
  const sun = eo(seg(p, 0.02, 0.3));
  const stamp = eo(seg(p, 0.78, 0.9));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="06 / 早报" x={150} y={330} />
        <Cap text="每天 08:00" x={880} y={330} align="right" color={FAINT} />
        <Hair x={150} y={368} w={250} color={GOLD} thickness={2} progress={eo(seg(p, 0.08, 0.3))} opacity={0.7} />
      </div>

      {/* 晨光 */}
      <div
        style={{
          position: "absolute", left: CX - 300, top: 560, width: 600, height: 600, borderRadius: "50%",
          background: `radial-gradient(circle, ${GOLD}${Math.round(22 + 22 * sun).toString(16)} 0%, transparent 62%)`,
          opacity: sun,
        }}
      />
      <div style={{ position: "absolute", left: CX - 240, top: 960, width: 480, height: 1, background: INK, opacity: 0.16 * sun }} />

      {/* 钟 */}
      <div style={{ position: "absolute", left: CX - R, top: CY - R, width: R * 2, height: R * 2, borderRadius: R, border: `2px solid ${INK}`, opacity: enter, background: "rgba(251,247,239,0.55)" }}>
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i / 60) * Math.PI * 2;
          const big = i % 5 === 0;
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: R + Math.cos(a) * (R - (big ? 18 : 11)), top: R + Math.sin(a) * (R - (big ? 18 : 11)),
                width: big ? 3 : 1.5, height: big ? 12 : 6, background: INK,
                opacity: big ? 0.5 : 0.25,
                transform: `translate(-50%,-50%) rotate(${(a * 180) / Math.PI + 90}deg)`,
              }}
            />
          );
        })}
        {[12, 3, 6, 9].map((n, i) => {
          const a = ((n % 12) / 12) * Math.PI * 2;
          return (
            <div
              key={n}
              style={{
                position: "absolute", left: R + Math.sin(a) * (R - 44) - 8, top: R - Math.cos(a) * (R - 44) - 12,
                fontFamily: MONO_STACK, fontSize: 17, color: INK, opacity: 0.5,
              }}
            >
              {n}
            </div>
          );
        })}
        {/* 时针 7:40 → 8:00 */}
        <div
          style={{
            position: "absolute", left: R - 3, top: R - 74, width: 6, height: 78,
            background: INK, borderRadius: 3, transformOrigin: "50% 100%",
            transform: `rotate(${lerp(230, 240, hand)}deg)`,
          }}
        />
        {/* 分针停在 12（8:00） */}
        <div
          style={{
            position: "absolute", left: R - 2, top: R - 118, width: 4, height: 122,
            background: TEAL, borderRadius: 2, transformOrigin: "50% 100%",
            transform: "rotate(0deg)", opacity: 0.85,
          }}
        />
        {/* 秒针扫一圈，给静态的 8:00 一点活气 */}
        <div
          style={{
            position: "absolute", left: R - 1, top: R - 96, width: 2, height: 100,
            background: RED, borderRadius: 1, transformOrigin: "50% 100%",
            transform: `rotate(${p * 360}deg)`, opacity: 0.55,
          }}
        />
        <div style={{ position: "absolute", left: R - 10, top: R - 10, width: 20, height: 20, borderRadius: 10, background: RED }} />
        <div style={{ position: "absolute", left: R - 4, top: R - 4, width: 8, height: 8, borderRadius: 4, background: "#FBF7EE" }} />
        <div style={{ position: "absolute", left: 0, bottom: -46, width: R * 2, textAlign: "center", fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 5, color: FAINT }}>
          08:00 AM
        </div>
      </div>

      {/* 简报卡 */}
      <Card
        x={690} y={780} w={366} h={470}
        opacity={cardIn} scale={0.94 + 0.06 * cardIn} rotate={2.2}
        accent={TEAL}
      >
        <div style={{ position: "absolute", left: 26, top: 22, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 3, color: TEAL }}>今日早报</div>
        <div style={{ position: "absolute", right: 22, top: 18, fontFamily: MONO_STACK, fontSize: 13, color: FAINT }}>11.10</div>
        <div style={{ position: "absolute", left: 26, top: 56, width: 250, height: 1, background: INK, opacity: 0.12 }} />
        {[0, 1, 2, 3, 4].map((i) => {
          const t = eo(seg(p, 0.3 + i * 0.07, 0.42 + i * 0.07));
          return (
            <div key={i} style={{ position: "absolute", left: 26, top: 82 + i * 52, display: "flex", alignItems: "center", gap: 12, opacity: t, transform: `translateX(${(1 - t) * 10}px)` }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, border: `1.2px solid ${i < 3 ? TEAL : INK + "44"}`, background: i < 3 ? `${TEAL}22` : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: TEAL }}>{i < 3 ? "✓" : ""}</div>
              <div style={{ width: 210 - i * 14, height: 7, borderRadius: 4, background: INK, opacity: 0.16 + 0.05 * (i % 2) }} />
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 26, bottom: 58, display: "flex", gap: 8 }}>
          {["笔记", "代码", "早报"].map((t, i) => (
            <div key={t} style={{ padding: "5px 10px", borderRadius: 4, background: i === 2 ? `${TEAL}16` : "rgba(24,22,19,0.04)", fontFamily: MONO_STACK, fontSize: 12, letterSpacing: 1.5, color: i === 2 ? TEAL : FAINT }}>{t}</div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 26, bottom: 22, fontFamily: MONO_STACK, fontSize: 13, color: FAINT }}>已经放进你的文件夹</div>
      </Card>

      <div style={{ position: "absolute", left: 760, top: 1046, opacity: stamp }}>
        <Stamp text="READY" x={0} y={0} size={28} rotate={-8} t={stamp} color={TEAL} />
      </div>

      <div style={{ position: "absolute", left: 150, top: 1168, opacity: eo(seg(p, 0.66, 0.86)) }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 16, letterSpacing: 3, color: FAINT }}>你睡觉时</div>
        <div style={{ marginTop: 10, fontFamily: SERIF_STACK, fontSize: 34, color: INK_SOFT, letterSpacing: 1 }}>
          你起床，结果已经写好了。
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene06;
