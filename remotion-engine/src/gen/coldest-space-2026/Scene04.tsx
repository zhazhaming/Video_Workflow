// Scene04 · 地面：重力把原子拽下去（困境）
// 左侧落塔：12 个原子被重力加速下落（y = 470 + 620·t²）；中段朱红向上箭头（束缚力）出现，
// 原子被托住的同时开始发抖；底部赭金波浪线（升温）；右侧秒表扫到 0.05s 就卡住，最后盖章「太短」。
// 数据：地面同类实验稳定观测约 0.05 秒。动画只由 p 驱动，只用 transform / opacity。
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { rand } from "../../dv/atmosphere";
import {
  Paper,
  Cap,
  Stamp,
  SectionNum,
  Num,
  INK,
  INK_SOFT,
  INK_FAINT,
  RED,
  GOLD,
  clamp01,
  seg,
  eo,
  eio,
  lerp,
  pop,
  FONT_STACK,
} from "./ui";

// ---- 几何 ----
const TOWER_X = 300;
const TOWER_TOP = 400;
const TOWER_BOT = 1140;
const CLK_X = 760;
const CLK_Y = 700;
const CLK_R = 150;

const upArrowX = [210, 300, 390];

const Scene04: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed, marks }) => {
  const mm = (i: number, fb: number) => marks?.[i]?.start ?? fb;
  const ex = seg(p, 0.88, 1);
  const enter = eo(seg(p, 0, 0.12));

  const m1 = mm(1, 0.37);
  const m2 = mm(2, 0.743);

  // 12 个下落原子
  const atoms = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        i,
        dx: (rand(seed + i * 11) - 0.5) * 46,
        delay: rand(seed + i * 11 + 1) * 0.12,
        rad: 5 + rand(seed + i * 11 + 2) * 2.4,
        ph: rand(seed + i * 11 + 3) * Math.PI * 2,
      })),
    [seed],
  );

  // 束缚力窗口（第二句「想托住它就得加力」）
  const forceIn = eo(seg(p, m1, m1 + 0.12));
  const forceWin = clamp01(seg(p, m1, m1 + 0.1)) * (1 - clamp01(seg(p, 0.82, 0.92)));

  // 升温波浪（第二句后半「一加力又升温」）
  const waveT = eo(seg(p, m1 + 0.08, m1 + 0.22));
  const heatLabelT = clamp01(seg(p, m1 + 0.1, m1 + 0.2));

  // 秒表：指针 0.15→0.35 扫到 0.05s 后卡住，第三句时抖一下
  const handBase = 1.8 * eo(seg(p, 0.15, 0.35));
  const jitterT = clamp01(seg(p, m2, m2 + 0.01));
  const handJit = jitterT * 2.8 * Math.sin((p - m2) * 180) * Math.exp(-Math.max(0, p - m2) * 16);
  const handDeg = handBase + handJit;
  const stopVal = 0.05 * eo(seg(p, 0.15, 0.35));

  const clkT = eo(seg(p, 0.1, 0.22));
  const redRingT = seg(p, m2 + 0.02, m2 + 0.12);
  const stampT = seg(p, m2 + 0.03, m2 + 0.13);
  const breathe = 0.5 + 0.5 * Math.sin(p * Math.PI * 6);

  return (
    <AbsoluteFill style={{ fontFamily: FONT_STACK, overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 1 - 0.88 * ex,
          transform: `scale(${1 - 0.035 * ex})`,
          transformOrigin: "50% 50%",
        }}
      >
        <SectionNum n={4} x={610} y={300} size={200} t={enter} />

        {/* ---------------- 左侧落塔 ---------------- */}
        <div style={{ position: "absolute", left: TOWER_X, top: TOWER_TOP, width: 1.5, height: TOWER_BOT - TOWER_TOP, background: INK, opacity: 0.26 }} />
        <div style={{ position: "absolute", left: TOWER_X + 32, top: TOWER_TOP, width: 1, height: TOWER_BOT - TOWER_TOP, background: INK, opacity: 0.16 }} />
        {/* 塔架斜撑（信息图结构感） */}
        {Array.from({ length: 8 }, (_, k) => {
          const y = 480 + k * 80;
          const down = k % 2 === 0;
          return (
            <div
              key={`b${k}`}
              style={{
                position: "absolute",
                left: TOWER_X,
                top: down ? y : y + 40,
                width: 52,
                height: 1.2,
                background: INK,
                opacity: 0.13,
                transform: `rotate(${down ? 52 : -52}deg)`,
                transformOrigin: "left center",
              }}
            />
          );
        })}
        {/* 塔顶 / 塔底 */}
        <div style={{ position: "absolute", left: TOWER_X - 54, top: TOWER_TOP, width: 108, height: 1.5, background: INK, opacity: 0.42 }} />
        <div style={{ position: "absolute", left: TOWER_X - 54, top: TOWER_BOT, width: 108, height: 1.5, background: INK, opacity: 0.34 }} />
        {/* 地面斜线（底面标记） */}
        {Array.from({ length: 7 }, (_, i) => (
          <div
            key={`g${i}`}
            style={{
              position: "absolute",
              left: TOWER_X - 46 + i * 15,
              top: TOWER_BOT + 8,
              width: 1.5,
              height: 11,
              background: INK,
              opacity: 0.22,
              transform: "rotate(38deg)",
            }}
          />
        ))}
        {/* 刻度（横档） */}
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={`t${i}`}
            style={{
              position: "absolute",
              left: TOWER_X - 10,
              top: 480 + i * 80,
              width: 52,
              height: 1,
              background: INK,
              opacity: 0.2,
            }}
          />
        ))}
        {/* 向下流动的刻度（持续微动） */}
        {[0, 1, 2].map((k) => (
          <div
            key={`f${k}`}
            style={{
              position: "absolute",
              left: TOWER_X - 7,
              top: 480 + ((k * 213 + p * 640 * 1.6) % 640),
              width: 14,
              height: 2,
              background: INK_SOFT,
              opacity: 0.2,
            }}
          />
        ))}

        {/* g + 向下红箭头 */}
        <Cap
          text="g"
          x={140}
          y={664}
          size={28}
          color={INK_SOFT}
          style={{ opacity: enter, transform: `translateY(${(1 - enter) * 8}px)` }}
        />
        <div style={{ position: "absolute", left: 150, top: 716, width: 1.5, height: 84, background: RED, opacity: 0.85 * enter }} />
        <div
          style={{
            position: "absolute",
            left: 150,
            top: 800,
            width: 0,
            height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: `22px solid ${RED}`,
            opacity: 0.85 * enter,
            transform: "translateX(-50%)",
          }}
        />

        {/* ---------------- 下落原子 ---------------- */}
        {atoms.map((a) => {
          const t = seg(p, 0.05 + a.delay, 0.78 + a.delay);
          const slow = 1 - 0.14 * forceWin;
          const rawY = 470 + 620 * Math.pow(t * slow, 2);
          const landY = 1112 + a.rad * 2;
          const yy = Math.min(rawY, landY);
          const landed = clamp01((rawY - 1080) / 40);
          const jx = forceWin * 8 * Math.sin(p * 95 + a.ph);
          const jy = forceWin * 7 * Math.cos(p * 88 + a.ph * 1.3);
          const appear = clamp01(seg(p, 0.01 + a.delay * 0.2, 0.05 + a.delay * 0.3));
          return (
            <div
              key={a.i}
              style={{
                position: "absolute",
                left: TOWER_X + a.dx + jx - a.rad,
                top: yy + jy - a.rad,
                width: a.rad * 2,
                height: a.rad * 2,
                borderRadius: "50%",
                background: INK,
                opacity: appear * (0.78 - 0.34 * landed),
                transform: `scale(${0.7 + 0.3 * appear})`,
              }}
            />
          );
        })}

        {/* ---------------- 束缚力：一组向上箭头 ---------------- */}
        {upArrowX.map((x, i) => (
          <React.Fragment key={`u${i}`}>
            <div
              style={{
                position: "absolute",
                left: x,
                top: 822,
                width: 2,
                height: 58,
                background: RED,
                opacity: 0.8 * forceIn,
                transform: `scaleY(${forceIn})`,
                transformOrigin: "center bottom",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: x,
                top: 800,
                width: 0,
                height: 0,
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderBottom: `22px solid ${RED}`,
                opacity: forceIn,
                transform: `translateX(-50%) scale(${0.6 + 0.4 * forceIn})`,
                transformOrigin: "center bottom",
              }}
            />
          </React.Fragment>
        ))}

        {/* ---------------- 升温：赭金波浪（4 条，由细竖条组成）---------------- */}
        {[0, 1, 2, 3].map((s) => (
          <React.Fragment key={`w${s}`}>
            {Array.from({ length: 15 }, (_, k) => {
              const h = 3 + 21 * Math.abs(Math.sin(k * 0.55 + p * 7 + s * 0.9));
              return (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: 130 + k * 16,
                    top: 1000 + s * 28 - h / 2,
                    width: 3,
                    height: h,
                    background: GOLD,
                    opacity: 0.55 * waveT,
                  }}
                />
              );
            })}
          </React.Fragment>
        ))}
        <Cap
          text="升温"
          x={372}
          y={952}
          size={24}
          color={GOLD}
          style={{ opacity: heatLabelT, transform: `translateY(${(1 - heatLabelT) * 8}px)` }}
        />

        {/* ---------------- 右侧秒表 ---------------- */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: clkT,
            transform: `scale(${0.92 + 0.08 * clkT})`,
            transformOrigin: `${CLK_X}px ${CLK_Y}px`,
          }}
        >
          {/* 外圈 / 内圈 */}
          <div
            style={{
              position: "absolute",
              left: CLK_X - CLK_R,
              top: CLK_Y - CLK_R,
              width: CLK_R * 2,
              height: CLK_R * 2,
              borderRadius: "50%",
              border: "2px solid rgba(27,24,21,0.7)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: CLK_X - CLK_R,
              top: CLK_Y - CLK_R,
              width: CLK_R * 2,
              height: CLK_R * 2,
              borderRadius: "50%",
              border: "2px solid #C8452D",
              opacity: redRingT * (0.55 + 0.25 * breathe),
            }}
          />
          <div
            style={{
              position: "absolute",
              left: CLK_X - 118,
              top: CLK_Y - 118,
              width: 236,
              height: 236,
              borderRadius: "50%",
              border: "1px solid rgba(27,24,21,0.15)",
            }}
          />
          {/* 12 个刻度 */}
          {Array.from({ length: 12 }, (_, k) => {
            const a = (k * 30 * Math.PI) / 180;
            const isTop = k === 0;
            const rr = isTop ? 132 : 136;
            const hh = isTop ? 18 : 11;
            return (
              <div
                key={`c${k}`}
                style={{
                  position: "absolute",
                  left: CLK_X + Math.cos(a) * rr - 1,
                  top: CLK_Y + Math.sin(a) * rr - hh / 2,
                  width: 2,
                  height: hh,
                  background: INK,
                  opacity: isTop ? 0.55 : 0.32,
                  transform: `rotate(${k * 30 + 90}deg)`,
                  transformOrigin: "center center",
                }}
              />
            );
          })}
          {/* 指针（几乎不动） */}
          <div
            style={{
              position: "absolute",
              left: CLK_X - 1.5,
              top: CLK_Y - 112,
              width: 3,
              height: 112,
              background: INK,
              borderRadius: 2,
              transform: `rotate(${handDeg}deg)`,
              transformOrigin: "50% 100%",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: CLK_X - 8,
              top: CLK_Y - 8,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: INK,
            }}
          />
          {/* 表盘里的读数 */}
          <Num value={stopVal} decimals={2} x={680} y={722} size={52} color={INK} suffix="秒" suffixSize={28} />
        </div>

        {/* 太短印章 */}
        <Stamp text="太短" x={912} y={566} size={46} rotate={-10} t={stampT} />
      </div>
    </AbsoluteFill>
  );
};

export default Scene04;
