// Scene08 · 场景三：我们这条视频流，也能排成流水线
// 四张工序卡沿 S 形排开：选题 → 写稿 → 配音 → 渲染；箭头逐段画出，最后亮起播放键。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Card, Chip, HArrow, VArrow, Dot, INK, INK_SOFT, FAINT, TEAL, RED, GOLD, MONO_STACK, SERIF_STACK, seg, eo, pop, lerp, clamp01 } from "./ui";

const cards = [
  { no: "01", en: "TOPIC", zh: "选题", meta: "早报 / 热点", x: 330, y: 500, color: GOLD },
  { no: "02", en: "SCRIPT", zh: "写稿", meta: "钩子 / 落点", x: 730, y: 500, color: TEAL },
  { no: "03", en: "VOICE", zh: "配音", meta: "逐句 / 对齐", x: 730, y: 816, color: TEAL },
  { no: "04", en: "RENDER", zh: "渲染", meta: "1080 × 1920", x: 330, y: 816, color: RED },
];

const Icon: React.FC<{ kind: string; color: string }> = ({ kind, color }) => {
  if (kind === "TOPIC") {
    return (
      <div style={{ position: "relative", width: 42, height: 42 }}>
        <div style={{ position: "absolute", left: 4, top: 2, width: 30, height: 38, border: `2px solid ${color}`, borderRadius: 3 }} />
        <div style={{ position: "absolute", left: 10, top: 10, width: 18, height: 2, background: color, opacity: 0.6 }} />
        <div style={{ position: "absolute", left: 10, top: 18, width: 18, height: 2, background: color, opacity: 0.45 }} />
        <div style={{ position: "absolute", left: 10, top: 26, width: 11, height: 2, background: color, opacity: 0.3 }} />
      </div>
    );
  }
  if (kind === "SCRIPT") {
    return (
      <div style={{ position: "relative", width: 42, height: 42 }}>
        <div style={{ position: "absolute", left: 5, top: 30, width: 30, height: 3, background: color, transform: "rotate(-42deg)", transformOrigin: "0% 50%" }} />
        <div style={{ position: "absolute", left: 26, top: 6, width: 9, height: 9, border: `2px solid ${color}`, transform: "rotate(45deg)" }} />
        <div style={{ position: "absolute", left: 4, top: 34, width: 8, height: 4, background: color, opacity: 0.5 }} />
      </div>
    );
  }
  if (kind === "VOICE") {
    return (
      <div style={{ position: "relative", width: 42, height: 42, display: "flex", alignItems: "center", gap: 4 }}>
        {[10, 24, 38, 20, 30, 14].map((h, i) => (
          <div key={i} style={{ width: 3, height: h, borderRadius: 2, background: color, opacity: 0.45 + i * 0.08 }} />
        ))}
      </div>
    );
  }
  return (
    <div style={{ position: "relative", width: 42, height: 42 }}>
      <div style={{ position: "absolute", left: 3, top: 8, width: 36, height: 26, border: `2px solid ${color}`, borderRadius: 3 }} />
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: "absolute", left: 7 + i * 7, top: 4, width: 4, height: 4, background: color, opacity: 0.5 }} />
      ))}
      <div
        style={{
          position: "absolute", left: 20, top: 17, width: 0, height: 0,
          borderTop: "7px solid transparent", borderBottom: "7px solid transparent", borderLeft: `10px solid ${color}`,
        }}
      />
    </div>
  );
};

const Scene08: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const a1 = eo(seg(p, 0.36, 0.5));
  const a2 = eo(seg(p, 0.5, 0.64));
  const a3 = eo(seg(p, 0.64, 0.78));
  const play = pop(seg(p, 0.8, 0.94));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="08 / 一条流水线" x={150} y={330} />
        <Cap text="从想法到成片" x={880} y={330} align="right" color={FAINT} />
        <Hair x={150} y={368} w={290} color={TEAL} thickness={2} progress={eo(seg(p, 0.08, 0.3))} opacity={0.65} />
      </div>

      {cards.map((c, i) => {
        const t = pop(seg(p, 0.08 + i * 0.11, 0.26 + i * 0.11));
        return (
          <Card key={c.no} x={c.x} y={c.y} w={292} h={214} opacity={clamp01(t * 1.5)} scale={0.9 + 0.1 * t} accent={c.color}>
            <div style={{ position: "absolute", left: 20, top: 16, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 2.5, color: c.color }}>{c.no} / {c.en}</div>
            <div style={{ position: "absolute", left: 20, top: 48 }}><Icon kind={c.en} color={c.color} /></div>
            <div style={{ position: "absolute", left: 20, top: 112, fontFamily: SERIF_STACK, fontSize: 36, color: INK, letterSpacing: 2 }}>{c.zh}</div>
            <div style={{ position: "absolute", right: 18, bottom: 18, fontFamily: MONO_STACK, fontSize: 13, color: FAINT }}>{c.meta}</div>
          </Card>
        );
      })}

      <HArrow x1={486} x2={568} y={500} progress={a1} color={TEAL} opacity={0.5} />
      <VArrow x={730} y1={620} y2={700} progress={a2} color={TEAL} opacity={0.5} />
      <div style={{ position: "absolute", left: 476, top: 816, width: 88, height: 2, background: TEAL, opacity: 0.5 }}>
        <div style={{ position: "absolute", right: 0, width: 88 * a3, height: 2, background: TEAL }} />
        <div style={{ position: "absolute", left: 88 * (1 - a3) - 7, top: -5, width: 0, height: 0, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderRight: `9px solid ${TEAL}`, opacity: a3 > 0.02 ? 1 : 0 }} />
      </div>

      <div style={{ position: "absolute", left: 560, top: 1050, display: "flex", alignItems: "center", gap: 16, opacity: play }}>
        <div
          style={{
            width: 78, height: 78, borderRadius: 39, background: RED, display: "flex", alignItems: "center", justifyContent: "center",
            transform: `scale(${0.8 + 0.2 * play})`, boxShadow: `0 14px 32px ${RED}33`,
          }}
        >
          <div style={{ width: 0, height: 0, marginLeft: 6, borderTop: "15px solid transparent", borderBottom: "15px solid transparent", borderLeft: "24px solid #FBF6EC" }} />
        </div>
        <div>
          <div style={{ fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 3, color: FAINT }}>成片</div>
          <div style={{ marginTop: 4, fontFamily: SERIF_STACK, fontSize: 32, color: INK }}>一条视频，自己走完。</div>
        </div>
      </div>

      <div style={{ position: "absolute", left: 150, top: 1190, opacity: eo(seg(p, 0.7, 0.9)) }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 16, letterSpacing: 3, color: FAINT }}>同一套办法，换个活</div>
        <div style={{ marginTop: 8, fontFamily: SERIF_STACK, fontSize: 30, color: INK_SOFT }}>换一张任务卡，就是另一个场景。</div>
      </div>

      <Dot x={150} y={330} r={4} color={GOLD} opacity={0.7} />
    </AbsoluteFill>
  );
};

export default Scene08;
