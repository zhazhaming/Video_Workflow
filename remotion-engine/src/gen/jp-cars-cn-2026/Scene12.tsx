// Scene12 · 全球易主（2025 全球销量：中国约2700万辆 首超 日本约2500万辆）
// 两根柱生长，中国柱冲过日本峰值虚线；一顶小「冠」从日柱跳到中柱。
// 动画只由 p 驱动，只用 transform/opacity；数值 ≤64px。
import React from "react";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Num, INK, INK_SOFT, INK_FAINT, RED, SERIF_STACK, MONO_STACK, MARGIN, seg, eo, pop, clamp01, lerp } from "./ui";

const BASE = 1120;
const MAX_H = 520; // 2700 → 520px
const hOf = (v: number) => (v / 2700) * MAX_H;

const Scene12: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const main = accent || RED;
  const ex = seg(p, 0.88, 1);

  const jpT = eo(seg(p, 0.06, 0.22));
  const cnT = eo(seg(p, 0.22, 0.46));
  const cnPop = pop(seg(p, 0.4, 0.5));
  const dashedT = eo(seg(p, 0.24, 0.36));
  const crownT = seg(p, 0.52, 0.72); // 0→1 跳跃

  const jpH = hOf(2500);
  const cnH = hOf(2700);
  const jpTop = BASE - jpH;
  const cnTop = BASE - cnH;

  // 冠：从日柱顶弧线跳到中柱顶
  const crownX = lerp(690, 370, eo(crownT));
  const crownY = lerp(jpTop - 90, cnTop - 150, eo(crownT)) - Math.sin(crownT * Math.PI) * 110;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} />

      <Cap text="2025 全球新车销量" x={MARGIN} y={360} size={26} color={INK_SOFT} accent={main} />
      <Cap text="中国车企首次超过日本车企" x={984} y={360} align="right" size={22} color={INK_FAINT} opacity={0.85} />

      {/* 日本峰值虚线 */}
      <div
        style={{
          position: "absolute",
          left: 240,
          top: jpTop,
          width: 600,
          height: 2,
          background: `repeating-linear-gradient(90deg, ${INK_SOFT} 0 12px, transparent 12px 24px)`,
          opacity: 0.5 * dashedT * (1 - ex),
          transform: `scaleX(${dashedT})`,
          transformOrigin: "right center",
        }}
      />
      <div style={{ position: "absolute", left: 615, top: jpTop - 44, fontFamily: MONO_STACK, fontSize: 22, color: INK_FAINT, opacity: dashedT * (1 - ex), letterSpacing: 3 }}>
        日本峰值 ≈2500 万辆
      </div>

      {/* 中国柱 */}
      <div style={{ position: "absolute", left: 280, top: 0, width: 220, height: BASE }}>
        <div
          style={{
            position: "absolute",
            left: 10,
            bottom: 0,
            width: 200,
            height: cnH,
            borderRadius: "12px 12px 0 0",
            background: `linear-gradient(180deg, ${main} 0%, ${main}CC 100%)`,
            transform: `scaleY(${cnT})`,
            transformOrigin: "bottom",
            boxShadow: `0 -10px 30px ${main}33`,
          }}
        />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: cnH + 44, opacity: clamp01(cnT * 1.3) * (1 - ex) }}>
          <Num value={2700} x={0} y={0} size={54} color={main} suffix="万" suffixSize={26} suffixColor={INK_SOFT} style={{ width: 220, textAlign: "center" }} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: -52, textAlign: "center", fontFamily: SERIF_STACK, fontSize: 44, fontWeight: 700, letterSpacing: 6, color: INK, opacity: cnT }}>
          中国
        </div>
      </div>

      {/* 日本柱 */}
      <div style={{ position: "absolute", left: 600, top: 0, width: 220, height: BASE }}>
        <div
          style={{
            position: "absolute",
            left: 10,
            bottom: 0,
            width: 200,
            height: jpH,
            borderRadius: "12px 12px 0 0",
            background: "#CFC5AF",
            transform: `scaleY(${jpT})`,
            transformOrigin: "bottom",
          }}
        />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: jpH + 30, opacity: clamp01(jpT * 1.3) * (1 - ex) }}>
          <Num value={2500} x={0} y={0} size={44} color={INK_SOFT} suffix="万" suffixSize={24} suffixColor={INK_FAINT} style={{ width: 220, textAlign: "center" }} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: -52, textAlign: "center", fontFamily: SERIF_STACK, fontSize: 44, fontWeight: 700, letterSpacing: 6, color: INK_SOFT, opacity: jpT }}>
          日本
        </div>
      </div>

      {/* 基线 */}
      <Hair x={180} y={BASE} w={720} color={INK} thickness={3} opacity={0.4} progress={jpT} />

      {/* 小冠跳柱 */}
      <div
        style={{
          position: "absolute",
          left: crownX,
          top: crownY,
          opacity: clamp01(crownT * 3) * (1 - ex),
          transform: "translate(-50%, -50%)",
        }}
      >
        <div
          style={{
            width: 64,
            height: 34,
            background: "#A97C33",
            clipPath: "polygon(0 100%, 0 30%, 25% 65%, 50% 0, 75% 65%, 100% 30%, 100% 100%)",
          }}
        />
      </div>

      {/* 底部结论 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1200,
          textAlign: "center",
          fontFamily: SERIF_STACK,
          fontSize: 32,
          letterSpacing: 10,
          color: INK_SOFT,
          opacity: eo(seg(p, 0.6, 0.74)) * (1 - ex),
        }}
      >
        中国品牌全球份额 26.7%
      </div>
    </div>
  );
};

export default Scene12;
