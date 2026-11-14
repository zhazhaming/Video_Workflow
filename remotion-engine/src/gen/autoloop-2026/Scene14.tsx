// Scene14 · 收尾：一枚盖下去的签名章，三条 CTA 依次落位
// 圆形印章 + 竖排“下期见” + 点赞/收藏/关注三枚小牌；纸面留白，暖色收束。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { rand } from "../../dv/atmosphere";
import { Paper, Cap, Hair, Chip, Stamp, INK, INK_SOFT, FAINT, TEAL, RED, GOLD, MONO_STACK, SERIF_STACK, seg, eo, pop, clamp01 } from "./ui";

const CX = 430;
const CY = 690;
const R = 196;

const Scene14: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const enter = eo(seg(p, 0, 0.14));
  const press = pop(seg(p, 0.1, 0.34));
  const ring = eo(seg(p, 0.18, 0.5));
  const side = eo(seg(p, 0.4, 0.58));
  const cta = [0, 1, 2].map((i) => pop(seg(p, 0.6 + i * 0.08, 0.7 + i * 0.08)));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="14 / 收尾" x={150} y={330} />
        <Cap text="下期见" x={880} y={330} align="right" color={FAINT} />
        <Hair x={150} y={368} w={300} color={GOLD} thickness={2} progress={eo(seg(p, 0.08, 0.3))} opacity={0.7} />
      </div>

      {/* 纸面碎屑 */}
      {Array.from({ length: 26 }, (_, i) => {
        const x = 150 + rand(seed + i * 3) * 720;
        const y = 390 + rand(seed + i * 7 + 1) * 760;
        const s = 2 + rand(seed + i * 11 + 2) * 4;
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: x, top: y, width: s, height: s, borderRadius: s,
              background: i % 5 === 0 ? RED : i % 3 === 0 ? GOLD : TEAL,
              opacity: (0.12 + 0.18 * rand(seed + i)) * enter,
            }}
          />
        );
      })}

      {/* 背后的大回环 */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <path
          d={`M ${CX + R + 66} ${CY - 60} C ${CX + R + 130} ${CY + 180} ${CX + 60} ${CY + R + 120} ${CX - 170} ${CY + R + 60}`}
          fill="none" stroke={TEAL} strokeOpacity={0.18} strokeWidth={2} strokeDasharray="8 12"
        />
        <path d={`M ${CX - 170} ${CY + R + 60} l 14 -10 l 2 16 z`} fill={TEAL} fillOpacity={0.3} />
      </svg>

      {/* 印章 */}
      <div style={{ position: "absolute", left: CX, top: CY, width: R * 2, height: R * 2, transform: `translate(-50%,-50%) scale(${0.72 + 0.28 * press})`, opacity: clamp01(press * 1.6) }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: R, border: `2px solid ${RED}`, opacity: 0.85 }} />
        <div style={{ position: "absolute", inset: 14, borderRadius: R, border: `1px solid ${RED}44`, borderStyle: "dashed" }} />
        <div style={{ position: "absolute", inset: 30, borderRadius: R, border: `3px solid ${RED}`, opacity: 0.9 }} />
        <div style={{ position: "absolute", inset: 0, transform: `rotate(${p * 22}deg)` }}>
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * Math.PI * 2;
            return (
              <div
                key={i}
                style={{
                  position: "absolute", left: R + Math.cos(a) * (R - 7), top: R + Math.sin(a) * (R - 7),
                  width: 3, height: 8, background: RED, opacity: 0.55,
                  transform: `translate(-50%,-50%) rotate(${(a * 180) / Math.PI + 90}deg)`,
                }}
              />
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 0, top: 94, width: R * 2, textAlign: "center", fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 6, color: RED, opacity: 0.75 }}>
          KKKKHAZIX · 科普
        </div>
        <div style={{ position: "absolute", left: 0, top: 122, width: R * 2, textAlign: "center", fontFamily: SERIF_STACK, fontSize: 82, fontWeight: 700, color: RED, letterSpacing: 8, lineHeight: 1.1 }}>
          阿扎
        </div>
        <div style={{ position: "absolute", left: 0, top: 224, width: R * 2, textAlign: "center", fontFamily: SERIF_STACK, fontSize: 26, color: RED, letterSpacing: 10, opacity: 0.85 }}>
          带你领略科普知识
        </div>
        <div style={{ position: "absolute", left: R - 40, top: R + 74, width: 80, height: 1, background: RED, opacity: 0.5 * ring }} />
      </div>

      {/* 竖排下期见 */}
      <div style={{ position: "absolute", left: 730, top: 520, opacity: side, transform: `translateY(${(1 - side) * 18}px)` }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 3, color: FAINT }}>NEXT</div>
        <div style={{ marginTop: 10, writingMode: "vertical-rl", fontFamily: SERIF_STACK, fontSize: 64, color: INK, letterSpacing: 12, lineHeight: 1.35 }}>
          下期见
        </div>
        <div style={{ marginTop: 18, marginLeft: 8, width: 10, height: 10, borderRadius: 5, background: RED, opacity: 0.8 }} />
      </div>

      {/* CTA */}
      <div style={{ position: "absolute", left: 150, top: 1010 }}>
        {[
          { t: "点赞", en: "LIKE" },
          { t: "收藏", en: "SAVE" },
          { t: "关注", en: "FOLLOW" },
        ].map((c, i) => (
          <div
            key={c.t}
            style={{
              position: "absolute", left: i * 236, top: 0, width: 216, height: 96,
              border: `1.5px solid ${i === 2 ? TEAL + "88" : INK + "30"}`, borderRadius: 8,
              background: i === 2 ? `${TEAL}18` : "rgba(251,247,239,0.92)",
              boxShadow: `0 12px 26px ${INK}12`,
              opacity: clamp01(cta[i] * 1.5), transform: `translateY(${(1 - cta[i]) * 16}px)`,
            }}
          >
            <div style={{ position: "absolute", left: 16, top: 12, fontFamily: MONO_STACK, fontSize: 12, letterSpacing: 2, color: i === 2 ? TEAL : FAINT }}>{c.en}</div>
            <div style={{ position: "absolute", left: 16, top: 34, fontFamily: SERIF_STACK, fontSize: 34, color: i === 2 ? TEAL : INK }}>{c.t}</div>
            <div style={{ position: "absolute", right: 14, bottom: 12, fontFamily: MONO_STACK, fontSize: 11, color: FAINT }}>0{i + 1}</div>
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", left: 150, top: 1136, opacity: 0.9 }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 3, color: FAINT }}>有帮助，就转给朋友</div>
      </div>
      <div style={{ position: "absolute", left: 150, top: 1180, width: 730, height: 1, background: INK, opacity: 0.14 }} />
      <div style={{ position: "absolute", right: 160, top: 1160, opacity: 0.6 }}>
        <span style={{ fontFamily: MONO_STACK, fontSize: 12, letterSpacing: 2, color: FAINT }}>AGENT AUTOLOOP</span>
      </div>
    </AbsoluteFill>
  );
};

export default Scene14;
