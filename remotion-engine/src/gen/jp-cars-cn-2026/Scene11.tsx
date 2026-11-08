// Scene11 · 考场换了（反转主视觉：试卷翻面——机械时代「优」→ 智能时代「缺考」）
// 场景即内容：卷头文字与印章是信息主体。翻面用 scaleX 压缩-展开（只用 transform）。
// 动画只由 p 驱动。
import React from "react";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Stamp, INK, INK_SOFT, INK_FAINT, RED, SERIF_STACK, MONO_STACK, MARGIN, seg, eo, pop, clamp01 } from "./ui";

const CX = 540;
const CY = 810;
const GOLD_SOFT = "#A97C33";
const GREENISH = "#2E7D4F";

const Scene11: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const main = accent || RED;
  const mm = (i: number, fb: number) => marks?.[i]?.start ?? fb;
  const ex = seg(p, 0.88, 1);
  const t0 = mm(0, 0.1); // 卷 A 展示
  const t1 = mm(1, 0.42); // 翻面
  const t2 = mm(2, 0.72); // 缺考印

  const inA = eo(seg(p, 0.03, 0.15));
  const stampA = pop(seg(p, t0 + 0.14, t0 + 0.26));
  const flipA = eo(seg(p, t1, t1 + 0.09)); // A scaleX 1→0
  const flipB = eo(seg(p, t1 + 0.09, t1 + 0.18)); // B scaleX 0→1
  const stampB = pop(seg(p, t2, t2 + 0.14));

  const bobA = Math.sin(p * Math.PI * 2 * 0.6) * 5;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} />

      <Cap text="一次换考卷的反转" x={MARGIN} y={360} size={26} color={INK_SOFT} accent={main} />

      {/* 幽灵考字 */}
      <div style={{ position: "absolute", left: 330, top: 520, fontFamily: SERIF_STACK, fontSize: 560, fontWeight: 900, color: INK, opacity: 0.04, lineHeight: 0.9 }}>
        考
      </div>

      {/* 卷 A：机械时代（优） */}
      <div
        style={{
          position: "absolute",
          left: CX - 220,
          top: CY - 290 + bobA,
          width: 440,
          height: 580,
          borderRadius: 16,
          background: "#FBF6EC",
          border: `2px solid ${INK}30`,
          boxShadow: `0 22px 44px ${INK}22`,
          opacity: clamp01(inA * 1.4) * (1 - flipA) * (1 - ex),
          transform: `scaleX(${inA * (1 - flipA)}) rotate(${(1 - flipA) * -1.4}deg)`,
          transformOrigin: "50% 50%",
        }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, top: 36, textAlign: "center", fontFamily: SERIF_STACK, fontSize: 52, fontWeight: 700, letterSpacing: 12, color: INK }}>
          机械时代
        </div>
        <Hair x={60} y={112} w={320} color={GOLD_SOFT} thickness={2} opacity={0.6} />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ position: "absolute", left: 64, top: 158 + i * 84, opacity: clamp01(inA * 2 - i * 0.2) }}>
            <div style={{ position: "absolute", left: 0, top: 2, width: 26, height: 26, borderRadius: 7, border: `3px solid ${GREENISH}`, opacity: 0.8 }} />
            <Hair x={44} y={16} w={i % 2 === 0 ? 240 : 200} color={INK_FAINT} thickness={4} opacity={0.4} progress={clamp01(inA * 2 - i * 0.2)} />
            <div style={{ position: "absolute", left: 6, top: 0, fontFamily: MONO_STACK, fontSize: 22, fontWeight: 800, color: GREENISH, opacity: 0.9 }}>
              ✓
            </div>
          </div>
        ))}
        <Stamp text="优" x={330} y={430} size={64} rotate={-12} t={stampA} color={main} border={5} />
      </div>

      {/* 卷 B：智能时代（缺考） */}
      <div
        style={{
          position: "absolute",
          left: CX - 220,
          top: CY - 290 + bobA * 0.6,
          width: 440,
          height: 580,
          borderRadius: 16,
          background: "#FBF6EC",
          border: `2px solid ${INK}30`,
          boxShadow: `0 22px 44px ${INK}22`,
          opacity: flipB * (1 - ex),
          transform: `scaleX(${flipB}) rotate(${(1 - flipB) * 1.6}deg)`,
          transformOrigin: "50% 50%",
        }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, top: 36, textAlign: "center", fontFamily: SERIF_STACK, fontSize: 52, fontWeight: 700, letterSpacing: 12, color: INK }}>
          智能时代
        </div>
        <Hair x={60} y={112} w={320} color={main} thickness={2} opacity={0.55} />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ position: "absolute", left: 64, top: 158 + i * 84, opacity: clamp01(flipB * 2 - i * 0.2) }}>
            <div style={{ position: "absolute", left: 0, top: 2, width: 26, height: 26, borderRadius: 7, border: `3px dashed ${INK_FAINT}`, opacity: 0.7 }} />
            <Hair x={44} y={16} w={220} color={INK_FAINT} thickness={4} opacity={0.22} />
          </div>
        ))}
        <div style={{ position: "absolute", left: 0, right: 0, top: 500, textAlign: "center", fontFamily: SERIF_STACK, fontSize: 30, letterSpacing: 8, color: INK_FAINT, opacity: 0.8 }}>
          纯电 · 智驾 · 座舱 全部空白
        </div>
        <Stamp text="缺考" x={320} y={440} size={70} rotate={10} t={stampB} color={main} border={6} />
      </div>

      {/* 翻面弧光 */}
      <div
        style={{
          position: "absolute",
          left: CX - 260,
          top: CY - 20,
          width: 520,
          height: 40,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${main}20 0%, transparent 70%)`,
          opacity: clamp01((flipA + flipB) * 0.5) * (1 - clamp01((p - t1 - 0.3) * 3)),
        }}
      />
    </div>
  );
};

export default Scene11;
