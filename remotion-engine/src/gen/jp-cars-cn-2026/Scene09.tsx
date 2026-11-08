// Scene09 · 智能化掉队（两台车机对比：左侧国产车机卡片活，右侧日系车机灰旧闪屏）
// 场景即内容：机底标签「国产车机 / 不少日系车机」。动画只由 p 驱动，只用 transform/opacity。
import React from "react";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, INK, INK_SOFT, INK_FAINT, RED, GREEN, MONO_STACK, SERIF_STACK, MARGIN, seg, eo, pop, clamp01, lerp } from "./ui";

// 手机壳：竖屏圆角矩形 + 屏幕区
const Phone: React.FC<{ x: number; y: number; w: number; h: number; t: number; children?: React.ReactNode; frame: string; screen: string }> = ({
  x,
  y,
  w,
  h,
  t,
  children,
  frame,
  screen,
}) => (
  <div style={{ position: "absolute", left: x, top: y + (1 - eo(t)) * 70, width: w, height: h, opacity: clamp01(t * 1.5), transform: `rotate(${(1 - eo(t)) * -3}deg)` }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: 30, background: frame, border: `3px solid ${INK}44`, boxShadow: `0 18px 34px ${INK}26` }} />
    <div style={{ position: "absolute", left: 12, top: 12, right: 12, bottom: 12, borderRadius: 20, background: screen, overflow: "hidden" }}>
      {/* 摄像头挖孔 */}
      <div style={{ position: "absolute", left: "50%", top: 12, width: 12, height: 12, marginLeft: -6, borderRadius: "50%", background: `${INK}55` }} />
      {children}
    </div>
  </div>
);

const Scene09: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const main = accent || RED;
  const ex = seg(p, 0.88, 1);

  const ph1T = seg(p, 0.03, 0.14);
  const ph2T = seg(p, 0.1, 0.2);
  const tileT = (i: number) => eo(seg(p, 0.18 + i * 0.05, 0.3 + i * 0.05));
  const dullT = eo(seg(p, 0.3, 0.42));
  const flick = 0.86 + 0.14 * Math.sin(p * Math.PI * 2 * 3.1);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} />

      <Cap text="车机对比" x={MARGIN} y={360} size={26} color={INK_SOFT} accent={main} />
      <Cap text="示意" x={984} y={360} align="right" size={20} color={INK_FAINT} opacity={0.7} />

      {/* 左：国产车机（活） */}
      <Phone x={168} y={470} w={300} h={560} t={ph1T} frame="#3A352D" screen="#FDF9F0">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 14 + (i % 2) * 134,
              top: 44 + Math.floor(i / 2) * 148,
              width: 126,
              height: 140,
              borderRadius: 14,
              background: i === 0 ? `${GREEN}1E` : `${main}14`,
              border: `2px solid ${i === 0 ? GREEN : main}44`,
              opacity: tileT(i),
              transform: `translateY(${(1 - tileT(i)) * 26}px)`,
            }}
          >
            {/* 图标点 + 进度条 */}
            <div style={{ position: "absolute", left: 16, top: 16, width: 26, height: 26, borderRadius: 8, background: i === 0 ? GREEN : main, opacity: 0.75 }} />
            <Hair x={16} y={70} w={94} color={INK_SOFT} thickness={5} opacity={0.3} progress={tileT(i)} />
            <Hair x={16} y={88} w={62} color={i === 0 ? GREEN : main} thickness={5} opacity={0.6} progress={tileT(i)} />
            <Hair x={16} y={112} w={78} color={INK_FAINT} thickness={3} opacity={0.3} progress={tileT(i)} />
          </div>
        ))}
        {/* 底部导航条 */}
        <Hair x={90} y={486} w={96} color={INK_SOFT} thickness={5} opacity={0.4} progress={tileT(3)} />
      </Phone>
      <Cap text="国产车机" x={318} y={1120} align="center" size={28} color={INK} opacity={ph1T} />

      {/* 右：日系车机（旧） */}
      <Phone x={616} y={470} w={300} h={560} t={ph2T} frame="#6B6154" screen="#E9E2D2">
        <div style={{ position: "absolute", inset: 0, opacity: dullT * flick }}>
          {/* 收音机刻度条 */}
          <Hair x={22} y={64} w={232} color={INK_SOFT} thickness={2} opacity={0.5} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} style={{ position: "absolute", left: 30 + i * 30, top: 56, width: 2, height: i % 2 === 0 ? 14 : 8, background: INK_SOFT, opacity: 0.55 }} />
          ))}
          {/* 大时钟（静态） */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: MONO_STACK, fontSize: 54, fontWeight: 700, color: `${INK_SOFT}BB`, letterSpacing: 4 }}>
            8:00
          </div>
          {/* 两个灰条按钮 */}
          <div style={{ position: "absolute", left: 30, top: 260, width: 104, height: 64, borderRadius: 10, background: `${INK_SOFT}30`, border: `2px solid ${INK_SOFT}44` }} />
          <div style={{ position: "absolute", left: 150, top: 260, width: 104, height: 64, borderRadius: 10, background: `${INK_SOFT}30`, border: `2px solid ${INK_SOFT}44` }} />
          <Hair x={30} y={380} w={224} color={INK_SOFT} thickness={3} opacity={0.3} />
          <Hair x={30} y={410} w={180} color={INK_SOFT} thickness={3} opacity={0.3} />
        </div>
        {/* 裂纹（两条细线） */}
        <div style={{ position: "absolute", left: 60, top: 90, width: 180, height: 2, background: INK, opacity: 0.35 * dullT, transform: "rotate(24deg)" }} />
        <div style={{ position: "absolute", left: 130, top: 96, width: 150, height: 2, background: INK, opacity: 0.3 * dullT, transform: "rotate(-38deg)" }} />
      </Phone>
      <Cap text="不少日系车机" x={766} y={1120} align="center" size={28} color={INK_SOFT} opacity={dullT} />

      {/* 中间 VS 分隔 */}
      <div
        style={{
          position: "absolute",
          left: 540,
          top: 720,
          transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * pop(seg(p, 0.24, 0.34))})`,
          fontFamily: MONO_STACK,
          fontSize: 44,
          fontWeight: 800,
          color: INK_FAINT,
          opacity: 0.5 * (1 - ex),
        }}
      >
        VS
      </div>

      {/* 底部一行小结 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1180,
          textAlign: "center",
          fontFamily: SERIF_STACK,
          fontSize: 30,
          letterSpacing: 8,
          color: INK_SOFT,
          opacity: eo(seg(p, 0.5, 0.62)) * (1 - ex),
        }}
      >
        智能座舱 · 智能驾驶 双双掉队
      </div>
    </div>
  );
};

export default Scene09;
