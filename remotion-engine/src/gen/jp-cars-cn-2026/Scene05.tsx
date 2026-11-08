// Scene05 · 退出与关厂（时间轴三站：三菱退出 / 日产关常州厂 / 本田关广武两厂）
// 三张事件卡按台词逐张落下，卡角盖朱红小印；背景一个幽灵大字「厂」。
// 动画只由 p 驱动，只用 transform / opacity；日期文字为信息主体。
import React from "react";
import type { GenSceneProps } from "../types";
import { rand } from "../../dv/atmosphere";
import { Paper, Cap, Hair, Stamp, INK, INK_SOFT, INK_FAINT, RED, SERIF_STACK, MONO_STACK, MARGIN, seg, eo, pop, clamp01, lerp } from "./ui";

const STOPS = [
  { x: 250, date: "2023.10", title: "三菱", sub: "退出中国", seal: "退", t0: 0.14 },
  { x: 540, date: "2024.06", title: "日产", sub: "常州工厂关闭", seal: "关", t0: 0.44 },
  { x: 830, date: "2024.07", title: "本田", sub: "关广武两厂", seal: "关", t0: 0.72 },
];
const RAIL_Y = 560;

const Scene05: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const main = accent || RED;
  const mm = (i: number, fb: number) => marks?.[i]?.start ?? fb;
  const ex = seg(p, 0.88, 1);
  const ts = [mm(0, STOPS[0].t0), mm(1, STOPS[1].t0), mm(2, STOPS[2].t0)];

  const railT = eo(seg(p, 0, 0.1));

  // 烟囱烟（只在第一张卡上方飘，象征产线停摆）
  const smokes = React.useMemo(
    () =>
      Array.from({ length: 8 }, (_, k) => ({
        ph: rand(k * 3 + 31) * Math.PI * 2,
        sp: 0.5 + rand(k * 3 + 32) * 0.7,
        dx: (rand(k * 3 + 33) - 0.5) * 60,
      })),
    [],
  );

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} />

      {/* 幽灵大字 */}
      <div
        style={{
          position: "absolute",
          left: 430,
          top: 560,
          fontFamily: SERIF_STACK,
          fontSize: 560,
          fontWeight: 900,
          color: INK,
          opacity: 0.035,
          lineHeight: 0.9,
        }}
      >
        厂
      </div>

      <Cap text="产能收缩时间线" x={MARGIN} y={360} size={26} color={INK_SOFT} accent={main} />

      {/* 主轴 */}
      <div style={{ position: "absolute", left: MARGIN, top: RAIL_Y, width: 888 * railT, height: 3, background: INK_SOFT, opacity: 0.5 }} />
      {/* 箭头端 */}
      <div
        style={{
          position: "absolute",
          left: MARGIN + 888 * railT - 4,
          top: RAIL_Y - 8,
          width: 0,
          height: 0,
          borderTop: "10px solid transparent",
          borderBottom: "10px solid transparent",
          borderLeft: `18px solid ${INK_SOFT}`,
          opacity: 0.5 * railT,
        }}
      />

      {/* 三站 */}
      {STOPS.map((s, i) => {
        const t = seg(p, ts[i], ts[i] + 0.12);
        const drop = eo(t);
        const dot = pop(t);
        return (
          <div key={i}>
            {/* 轴上节点 */}
            <div
              style={{
                position: "absolute",
                left: s.x - 15,
                top: RAIL_Y - 12,
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "#FBF6EC",
                border: `5px solid ${main}`,
                opacity: clamp01(dot),
                transform: `scale(${0.3 + 0.7 * dot})`,
              }}
            />
            {/* 垂线 */}
            <Hair x={s.x} y={RAIL_Y + 18} w={54} color={INK_SOFT} thickness={2} opacity={0.4} progress={t} from="center" />
            {/* 事件卡 */}
            <div
              style={{
                position: "absolute",
                left: s.x - 120,
                top: RAIL_Y + 72 + (1 - drop) * 60,
                width: 240,
                height: 218,
                borderRadius: 14,
                background: "#FBF6EC",
                border: `2px solid ${INK}33`,
                boxShadow: `0 16px 30px ${INK}22`,
                opacity: clamp01(t * 1.8) * (1 - ex),
              }}
            >
              <div style={{ position: "absolute", left: 0, right: 0, top: 20, textAlign: "center", fontFamily: MONO_STACK, fontSize: 27, letterSpacing: 4, color: main, fontWeight: 700 }}>
                {s.date}
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, top: 66, textAlign: "center", fontFamily: SERIF_STACK, fontSize: 56, fontWeight: 700, color: INK, letterSpacing: 6 }}>
                {s.title}
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, top: 140, textAlign: "center", fontFamily: MONO_STACK, fontSize: 26, letterSpacing: 3, color: INK_SOFT }}>
                {s.sub}
              </div>
              {/* 卡角小印 */}
              <div
                style={{
                  position: "absolute",
                  right: 12,
                  bottom: 12,
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  background: main,
                  color: "#FBF6EC",
                  fontFamily: SERIF_STACK,
                  fontSize: 28,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: clamp01((t - 0.5) * 3),
                  transform: `scale(${0.5 + 0.5 * pop((t - 0.5) * 2)}) rotate(-6deg)`,
                }}
              >
                {s.seal}
              </div>
            </div>
          </div>
        );
      })}

      {/* 第一张卡上方的小烟囱烟（产线停摆意象） */}
      {smokes.map((s, k) => {
        const cycle = (p * s.sp + s.ph / (Math.PI * 2)) % 1;
        const op = Math.sin(cycle * Math.PI) * 0.3;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: 250 - 10 + s.dx * cycle,
              top: RAIL_Y - 40 - cycle * 90,
              width: 14 + cycle * 18,
              height: 14 + cycle * 18,
              borderRadius: "50%",
              background: INK_FAINT,
              opacity: op * (1 - ex),
            }}
          />
        );
      })}

      {/* 底部小结印 */}
      <Stamp text="产能砍到剩 2/3" x={540} y={1090} size={44} rotate={-4} t={seg(p, ts[2] + 0.12, ts[2] + 0.24)} color={main} border={4} />
      <Cap text="日产 150万→100万 · 本田燃油产能 −40%" x={MARGIN} y={1226} size={22} color={INK_FAINT} opacity={0.75} />
    </div>
  );
};

export default Scene05;
