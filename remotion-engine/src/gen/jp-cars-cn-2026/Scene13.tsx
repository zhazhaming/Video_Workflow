// Scene13 · 结尾致谢（杂货铺雨棚呼应开场 + 赞/藏/关 三徽章弹跳 + 「下期见」吊牌 + 纸屑）
// 场景即内容：徽章单字与吊牌词是信息主体。动画只由 p 驱动，只用 transform/opacity。
import React from "react";
import type { GenSceneProps } from "../types";
import { rand } from "../../dv/atmosphere";
import { Paper, Hair, INK, INK_SOFT, INK_FAINT, RED, GOLD, SERIF_STACK, seg, eo, pop, clamp01, lerp } from "./ui";

const BADGES = [
  { x: 300, text: "赞", phase: 0 },
  { x: 540, text: "藏", phase: 0.12 },
  { x: 780, text: "关", phase: 0.24 },
];
const BY = 760;

const Scene13: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const main = accent || RED;
  const ex = seg(p, 0.9, 1);

  // 雨棚（呼应 Scene01，从顶部压入）
  const awnT = eo(seg(p, 0, 0.12));
  const stripes = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const sw = 120;

  // 纸屑（一次性预生成）
  const confetti = React.useMemo(
    () =>
      Array.from({ length: 18 }, (_, k) => ({
        x: 60 + rand(k * 11 + 61) * 960,
        ph: rand(k * 11 + 62),
        sp: 0.5 + rand(k * 11 + 63) * 0.6,
        w: 10 + rand(k * 11 + 64) * 10,
        rot0: rand(k * 11 + 65) * 360,
        warm: rand(k * 11 + 66) > 0.5,
      })),
    [],
  );

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - ex * 0.9 }}>
      <Paper c1={c1} c2={c2} accent={main} />

      {/* 雨棚 */}
      <div style={{ position: "absolute", left: 0, right: 0, top: lerp(-260, 96, awnT), opacity: 0.92 * awnT }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 74, overflow: "hidden", display: "flex" }}>
          {stripes.map((i) => (
            <div key={i} style={{ width: sw, height: 74, background: i % 2 === 0 ? main : "#FBF6EC", opacity: i % 2 === 0 ? 0.8 : 0.95 }} />
          ))}
        </div>
        {stripes.map((i) => (
          <div
            key={`s${i}`}
            style={{
              position: "absolute",
              left: i * sw,
              top: 74,
              width: sw,
              height: 34,
              borderRadius: "0 0 60px 60px",
              background: i % 2 === 0 ? main : "#FBF6EC",
              opacity: i % 2 === 0 ? 0.8 : 0.95,
              border: `1px solid ${INK}22`,
              borderTop: "none",
            }}
          />
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 400,
          textAlign: "center",
          fontFamily: SERIF_STACK,
          fontSize: 40,
          letterSpacing: 14,
          color: INK_SOFT,
          opacity: eo(seg(p, 0.04, 0.16)) * (1 - ex),
        }}
      >
        觉得有用的话
      </div>

      {/* 三徽章 */}
      {BADGES.map((b, i) => {
        const t = seg(p, 0.16 + i * 0.09, 0.28 + i * 0.09);
        const sc = 0.5 + 0.5 * pop(t);
        const bob = Math.sin(p * Math.PI * 2 * 1.1 + b.phase * 6) * 6 * clamp01(t);
        const ring = seg(p, 0.24 + i * 0.09, 0.52 + i * 0.09);
        return (
          <div key={i} style={{ position: "absolute", left: b.x, top: BY + bob }}>
            {[0, 1].map((r) => (
              <div
                key={r}
                style={{
                  position: "absolute",
                  left: -86 - r * 10,
                  top: -86 - r * 10,
                  width: 172 + r * 20,
                  height: 172 + r * 20,
                  borderRadius: "50%",
                  border: `3px solid ${main}`,
                  opacity: (1 - ring) * 0.35 * clamp01(ring * 5),
                  transform: `scale(${0.7 + ring * 0.5})`,
                }}
              />
            ))}
            <div
              style={{
                position: "absolute",
                left: -86,
                top: -86,
                width: 172,
                height: 172,
                borderRadius: "50%",
                background: i === 0 ? main : "#FBF6EC",
                border: `5px solid ${i === 0 ? main : INK_SOFT}66`,
                boxShadow: `0 16px 30px ${INK}22`,
                transform: `scale(${sc}) rotate(${(1 - sc) * -14}deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: SERIF_STACK,
                  fontSize: 72,
                  fontWeight: 700,
                  letterSpacing: 0,
                  color: i === 0 ? "#FBF6EC" : INK,
                  paddingLeft: 4,
                }}
              >
                {b.text}
              </span>
            </div>
          </div>
        );
      })}
      {/* 徽章下的辅助词 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 910,
          textAlign: "center",
          fontFamily: SERIF_STACK,
          fontSize: 30,
          letterSpacing: 16,
          color: INK_FAINT,
          opacity: eo(seg(p, 0.42, 0.56)) * (1 - ex),
        }}
      >
        点赞 · 收藏 · 加关注
      </div>

      {/* 「下期见」吊牌 */}
      {(() => {
        const t = eo(seg(p, 0.52, 0.64));
        const rot = Math.sin(p * Math.PI * 2 * 0.9 + 1.2) * 5;
        return (
          <div
            style={{
              position: "absolute",
              left: 540,
              top: lerp(1000, 1050, t),
              opacity: clamp01(t * 1.5) * (1 - ex),
              transform: `translate(-50%, 0) rotate(${rot}deg)`,
              transformOrigin: "50% -60px",
            }}
          >
            <div style={{ position: "absolute", left: "50%", top: -60, width: 1.5, height: 60, background: INK_FAINT }} />
            <div
              style={{
                position: "relative",
                padding: "16px 38px",
                borderRadius: 12,
                background: GOLD,
                color: "#FBF6EC",
                fontFamily: SERIF_STACK,
                fontSize: 40,
                fontWeight: 700,
                letterSpacing: 10,
                boxShadow: `0 12px 26px ${INK}2A`,
              }}
            >
              下期见
            </div>
          </div>
        );
      })()}

      {/* 纸屑 */}
      {confetti.map((cf, k) => {
        const cyc = (p * cf.sp + cf.ph) % 1;
        const y = lerp(360, 1500, cyc);
        const op = Math.sin(cyc * Math.PI) * 0.5;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: cf.x + Math.sin(cyc * Math.PI * 2 + k) * 24,
              top: y,
              width: cf.w,
              height: cf.w * 0.5,
              borderRadius: 3,
              background: cf.warm ? GOLD : main,
              opacity: op,
              transform: `rotate(${cf.rot0 + cyc * 360}deg)`,
            }}
          />
        );
      })}

      {/* 台面 */}
      <Hair x={96} y={1330} w={888} color={INK} opacity={0.14} progress={eo(seg(p, 0.3, 0.5))} />
    </div>
  );
};

export default Scene13;
