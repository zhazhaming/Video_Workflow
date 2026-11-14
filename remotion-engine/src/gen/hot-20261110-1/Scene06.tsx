// Scene06 · 地铁的比方：门开了，大家往里挤；能不能到终点，看后面还有没有人上车
// 列车进站 → 车门打开 → 人流向门里收拢 → 列车开走，月台留下几个人。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { rand } from "../../dv/atmosphere";
import { Paper, Cap, Hair, INK, INK_SOFT, FAINT, RED, GOLD, SERIF_STACK, MONO_STACK, seg, eo, lerp, clamp01 } from "./ui";

const TX = 290;
const TY = 596;
const TW = 700;
const TH = 440;
const DOOR = { x: 58, y: 50, w: 128, h: 320 };
const FLOOR = 1190;

const Scene06: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const enter = eo(seg(p, 0, 0.1));
  const open = eo(seg(p, 0.06, 0.22));
  const board = eo(seg(p, 0.24, 0.66));
  const depart = eo(seg(p, 0.66, 0.9));
  const note = eo(seg(p, 0.74, 0.86));
  const ex = seg(p, 0.9, 1);
  const main = accent || RED;

  const people = React.useMemo(
    () =>
      Array.from({ length: 22 }, (_, k) => ({
        x: 78 + rand(seed + k * 13 + 2) * 300,
        y: 1062 + rand(seed + k * 13 + 3) * 104,
        left: k % 6 === 0,
        r: 6 + rand(seed + k * 13 + 5) * 4,
      })),
    [seed],
  );

  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} grid={false} />

      <div style={{ opacity: enter }}>
        <Cap text="06 / METRO" x={110} y={300} color={main} />
        <Cap text="08:45 早高峰" x={962} y={300} align="right" color={FAINT} />
        <Hair x={110} y={338} w={852} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 110, top: 388, opacity: enter }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 18, letterSpacing: 4, color: FAINT }}>MORNING RUSH</div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 54, fontWeight: 700, color: INK, letterSpacing: 2, marginTop: 4 }}>
          像早高峰的地铁。
        </div>
      </div>

      {/* 站台 */}
      <div style={{ position: "absolute", left: 60, top: FLOOR, width: 960, height: 1.5, background: INK, opacity: 0.32 }} />
      <div style={{ position: "absolute", left: 60, top: FLOOR + 12, width: 960, height: 8, background: GOLD, opacity: 0.38 * enter }} />
      <div style={{ position: "absolute", left: 60, top: FLOOR + 42, width: 960, height: 1, background: INK, opacity: 0.12 }} />

      {/* 轨道 */}
      <div style={{ position: "absolute", left: 0, top: 1240, width: 1080, height: 3, background: INK, opacity: 0.2 }} />
      <div style={{ position: "absolute", left: -(p * 120) % 52, top: 1252, width: 1080, height: 2, background: INK, opacity: 0.12 }} />

      {/* 列车 */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `translateX(${depart * 205}px)` }}>
        <div
          style={{
            position: "absolute",
            left: TX,
            top: TY,
            width: TW,
            height: TH,
            borderRadius: "46px 110px 110px 46px",
            background: "rgba(252,248,240,0.97)",
            border: `2px solid ${INK}`,
            boxShadow: `0 30px 70px ${INK}20`,
          }}
        >
          {/* 车顶 / 腰线 */}
          <div style={{ position: "absolute", left: 28, top: 20, width: TW - 56, height: 2, background: INK, opacity: 0.16 }} />
          <div style={{ position: "absolute", left: 210, top: 334, width: 360, height: 3, background: main, opacity: 0.35 }} />

          {/* 目的地牌 */}
          <div style={{ position: "absolute", left: 54, top: 16, width: 238, height: 32, borderRadius: 5, background: INK, opacity: 0.9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 3, color: "#FBF7EF" }}>终点 · TERMINAL</span>
          </div>

          {/* 车门 */}
          <div style={{ position: "absolute", left: DOOR.x, top: DOOR.y, width: DOOR.w, height: DOOR.h, overflow: "hidden", borderRadius: 8, background: "#4A3C31", border: `2px solid ${INK}88` }}>
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${GOLD}44, ${main}20)` }} />
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ position: "absolute", left: 12, top: 92 + i * 58, width: DOOR.w - 24, height: 3, background: "#FBF7EF", opacity: 0.16 }} />
            ))}
            {/* 车厢里的立影 */}
            {[0, 1, 2].map((i) => (
              <div key={`p${i}`} style={{ position: "absolute", left: 26 + i * 26, bottom: 34, width: 10, height: 46, borderRadius: 5, background: "#FBF7EF", opacity: 0.22 }} />
            ))}
            {/* 双开门扇（保留在两侧） */}
            <div style={{ position: "absolute", left: 0, top: 0, width: DOOR.w / 2, height: "100%", background: "rgba(252,248,240,0.98)", borderRight: `1px solid ${INK}44`, transform: `translateX(${-44 * open}px)` }}>
              <div style={{ position: "absolute", left: 8, top: 28, width: 36, height: 92, borderRadius: 6, border: `1.5px solid ${INK}44`, background: `linear-gradient(180deg, ${GOLD}22, ${main}0A)` }} />
              <div style={{ position: "absolute", right: 8, top: 150, width: 4, height: 46, borderRadius: 2, background: INK, opacity: 0.4 }} />
            </div>
            <div style={{ position: "absolute", right: 0, top: 0, width: DOOR.w / 2, height: "100%", background: "rgba(252,248,240,0.98)", borderLeft: `1px solid ${INK}44`, transform: `translateX(${44 * open}px)` }}>
              <div style={{ position: "absolute", right: 8, top: 28, width: 36, height: 92, borderRadius: 6, border: `1.5px solid ${INK}44`, background: `linear-gradient(180deg, ${GOLD}22, ${main}0A)` }} />
              <div style={{ position: "absolute", left: 8, top: 150, width: 4, height: 46, borderRadius: 2, background: INK, opacity: 0.4 }} />
            </div>
            <div style={{ position: "absolute", left: 10, bottom: 10, width: DOOR.w - 20, height: 3, background: main, opacity: 0.8 * open }} />
          </div>

          {/* 车窗 */}
          {[246, 382, 518].map((wx, i) => (
            <div key={i} style={{ position: "absolute", left: wx, top: 74, width: 112, height: 88, borderRadius: 9, border: `1.8px solid ${INK}66`, background: `linear-gradient(165deg, ${GOLD}2E, ${main}10)` }}>
              <div style={{ position: "absolute", left: 6, top: 6, width: 30, height: 30, background: "#FBF7EF", opacity: 0.28, transform: "rotate(18deg)" }} />
              <div style={{ position: "absolute", left: 0, top: 44, width: "100%", height: 1.5, background: INK, opacity: 0.2 }} />
            </div>
          ))}

          {/* 车头挡风玻璃 */}
          <div style={{ position: "absolute", right: 26, top: 54, width: 66, height: 208, borderRadius: "10px 82px 82px 10px", border: `1.8px solid ${INK}77`, background: `linear-gradient(160deg, ${INK}CC, ${INK}88)` }}>
            <div style={{ position: "absolute", left: 8, top: 10, width: 14, height: 90, background: "#FBF7EF", opacity: 0.18, transform: "rotate(10deg)" }} />
          </div>
          <div style={{ position: "absolute", right: 34, top: 292, width: 12, height: 52, borderRadius: 6, background: main, opacity: 0.85 }} />
          <div style={{ position: "absolute", right: 54, top: 362, fontFamily: MONO_STACK, fontSize: 12, letterSpacing: 2, color: FAINT }}>
            A-1030
          </div>

          {/* 车厢腰线站点 */}
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} style={{ position: "absolute", left: 224 + i * 42, top: 336, width: 6, height: 6, borderRadius: 3, background: i < 5 ? main : INK, opacity: i < 5 ? 0.55 : 0.2 }} />
          ))}

          {/* 轮 / 转向架 */}
          {[188, 442, 612].map((wx) => (
            <React.Fragment key={wx}>
              <div style={{ position: "absolute", left: wx, top: TH - 10, width: 34, height: 34, borderRadius: 17, background: INK, opacity: 0.85 }} />
              <div style={{ position: "absolute", left: wx + 11, top: TH + 2, width: 12, height: 12, borderRadius: 6, background: "#FBF7EF", opacity: 0.65 }} />
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 车门开启后的暖光 */}
      <div
        style={{
          position: "absolute",
          left: TX + DOOR.x + 10,
          top: TY + DOOR.y + 10,
          width: DOOR.w - 20,
          height: DOOR.h - 20,
          background: `linear-gradient(180deg, ${GOLD}00, ${main}14)`,
          opacity: open,
        }}
      />

      {/* 人流 */}
      {people.map((it, k) => {
        const delay = (k % 6) * 0.028;
        const q = eo(seg(p, 0.22 + delay, 0.6 + delay));
        const stop = it.left ? 0.4 : 1;
        const travel = q * stop;
        const x = lerp(it.x, TX + DOOR.x + DOOR.w / 2, travel);
        const y = lerp(it.y, 936, Math.pow(travel, 1.5)) + Math.sin(p * 18 + k) * 3 * travel;
        const op = it.left ? 1 - 0.15 * board : 1 - seg(q, 0.8, 1);
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: x - it.r,
              top: y - it.r,
              width: it.r * 2,
              height: it.r * 2,
              borderRadius: it.r,
              background: k % 4 === 0 ? INK : main,
              opacity: clamp01(op) * (0.6 + 0.35 * enter),
            }}
          />
        );
      })}

      {/* 列车开走后的风线 */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 900 + i * 22,
            top: 740 + i * 76,
            width: 86 * depart,
            height: 2,
            background: INK,
            opacity: 0.15 * depart,
          }}
        />
      ))}

      <div style={{ position: "absolute", left: 110, top: 1262, opacity: note }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 29, color: INK_SOFT }}>
          门开了，大家都往里挤；能不能坐到终点，看后面还有没有人上车。
        </div>
      </div>

      <div style={{ position: "absolute", right: 110, top: 1274, opacity: note * 0.85, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 3, color: FAINT }}>
        PAGE 06
      </div>
    </AbsoluteFill>
  );
};

export default Scene06;
