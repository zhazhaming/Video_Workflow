// Scene05 · 出海：从深圳到 170 多个国家和地区
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Tower, Stamp, Signature, exitFade, mk, seg, easeOut, easeInOut, pop, qPoint, clamp01,
  RED, INK, MUTED, LINE, STEEL, MONO, SANS, SERIF,
} from "./ui";

const NODES = [
  { city: "深圳", utc: "UTC+8", x: 200 },
  { city: "内罗毕", utc: "UTC+3", x: 338 },
  { city: "迪拜", utc: "UTC+4", x: 476 },
  { city: "巴黎", utc: "UTC+1", x: 614 },
  { city: "圣保罗", utc: "UTC−3", x: 752 },
  { city: "雅加达", utc: "UTC+7", x: 890 },
];

const MORE = [
  "曼谷", "利雅得", "墨西哥城", "约翰内斯堡",
  "布达佩斯", "马德里", "开罗", "吉隆坡",
];

const Scene05: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = mk(marks, 1, 0.6);
  const band = easeInOut(seg(p, 0.02, 0.2));
  const arcs = easeInOut(seg(p, 0.16, 0.52));
  const count = 170 * easeOut(seg(p, 0.22, 0.5));
  const stamp = pop(seg(p, 0.8, 0.9));
  const ticker = seg(p, 0.5, 0.7);

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <Signature />
        {[240, 400, 560, 720, 880, 1040, 1200].map((x) => (
          <div key={x} style={{ position: "absolute", left: x, top: 250, bottom: 320, width: 1, background: "rgba(16,24,32,0.045)" }} />
        ))}

        <Cap text="出海 · 从深圳出发" x={150} y={330} opacity={seg(p, 0.02, 0.1)} />
        <div style={{ position: "absolute", left: 150, top: 372, fontFamily: SERIF, fontSize: 42, color: INK, opacity: seg(p, 0.02, 0.1) }}>
          基站立到哪里，网就铺到哪里
        </div>

        <div style={{ position: "absolute", right: 150, top: 438, textAlign: "right", opacity: seg(p, 0.18, 0.3) }}>
          <div style={{ fontFamily: SANS, fontSize: 18, color: MUTED, letterSpacing: 3, marginBottom: 2 }}>业务覆盖</div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 4 }}>
            <span style={{ fontFamily: MONO, fontSize: 132, fontWeight: 700, color: RED, letterSpacing: -7, lineHeight: 0.9 }}>{Math.round(count)}</span>
            <span style={{ fontFamily: SERIF, fontSize: 42, color: INK }}>+</span>
          </div>
          <div style={{ fontFamily: SANS, fontSize: 20, color: INK, letterSpacing: 2 }}>个国家和地区</div>
        </div>

        {/* 170 个市场点阵 */}
        <div style={{ position: "absolute", left: 150, top: 512, width: 620, height: 132, opacity: 0.9 * seg(p, 0.08, 0.2) }}>
          {Array.from({ length: 170 }, (_, k) => {
            const c = k % 15;
            const r = Math.floor(k / 15);
            const on = clamp01(seg(p, 0.1, 0.36) * 170 - k * 0.7);
            const hot = k % 19 === 0;
            return (
              <div
                key={k}
                style={{
                  position: "absolute", left: c * 38, top: r * 12,
                  width: hot ? 6 : 4, height: hot ? 6 : 4, borderRadius: "50%",
                  background: hot ? RED : INK,
                  opacity: on * (hot ? 0.8 : 0.22),
                }}
              />
            );
          })}
        </div>

        {/* 时区带 */}
        <div style={{ position: "absolute", left: 110, top: 800, width: 860 * band, height: 2, background: INK, opacity: 0.6 }} />
        <div style={{ position: "absolute", left: 110, top: 802, width: 860 * band, height: 22, backgroundImage: `repeating-linear-gradient(90deg, ${INK} 0 1px, transparent 1px 34px)`, opacity: 0.2 }} />

        {NODES.map((n, i) => {
          const t = pop(seg(p, 0.08 + i * 0.05, 0.2 + i * 0.05));
          return (
            <div key={n.city} style={{ position: "absolute", left: n.x - 60, top: 0, width: 120, height: 1920, opacity: t }}>
              <div style={{ position: "absolute", left: 60, top: 800, width: 10, height: 10, marginLeft: -5, marginTop: -5, borderRadius: "50%", background: i === 0 ? RED : INK, boxShadow: i === 0 ? "0 0 0 9px rgba(207,10,44,0.12)" : undefined }} />
              <div style={{ position: "absolute", left: 8, top: 606, width: 104, height: 175, transform: `translateY(${(1 - t) * 14}px)` }}>
                <Tower x={10} y={0} h={170} color={i === 0 ? RED : STEEL} opacity={0.95} pulse={0.5 + 0.5 * Math.sin(p * 7 + i)} />
              </div>
              <div style={{ position: "absolute", left: -10, top: 832, width: 140, textAlign: "center" }}>
                <div style={{ fontFamily: SANS, fontSize: 22, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? RED : INK, letterSpacing: 1 }}>{n.city}</div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: 1, marginTop: 3 }}>{n.utc}</div>
              </div>
            </div>
          );
        })}

        {/* 信号弧 */}
        {NODES.slice(0, -1).map((n, i) => {
          const x1 = n.x;
          const x2 = NODES[i + 1].x;
          const local = clamp01(arcs * 1.5 - i * 0.1);
          const tt = (p * 1.4 + i * 0.21) % 1;
          const pt = qPoint(x1, 790, x2, 790, 110, tt);
          return (
            <div key={`arc-${i}`} style={{ position: "absolute", inset: 0 }}>
              <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
                <path d={`M ${x1} 790 Q ${(x1 + x2) / 2} ${668} ${x2} 790`} fill="none" stroke={RED} strokeWidth="2.2" strokeDasharray="5 6" opacity={0.5} pathLength={1} strokeDashoffset={1 - local} />
                <circle cx={pt.x} cy={pt.y} r="5" fill={RED} opacity={local > 0.9 ? 1 : 0} />
              </svg>
            </div>
          );
        })}

        {/* 更多市场 */}
        <div style={{ position: "absolute", left: 150, top: 970, width: 780, opacity: ticker }}>
          <div style={{ height: 1, background: LINE, marginBottom: 16 }} />
          {[0, 1].map((r) => (
            <div key={r} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              {MORE.slice(r * 4, r * 4 + 4).map((c) => (
                <div key={c} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 10px", border: `1px solid rgba(16,24,32,0.16)` }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: RED, display: "inline-block" }} />
                  <span style={{ fontFamily: SANS, fontSize: 16, color: INK, letterSpacing: 1 }}>{c}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ position: "absolute", left: 150, top: 1110, fontFamily: SERIF, fontSize: 36, color: INK, letterSpacing: 2, opacity: seg(p, 0.6, 0.72) }}>
          从中国，连到世界<span style={{ color: RED }}>。</span>
        </div>

        <div style={{ position: "absolute", left: 150, top: 1180, display: "flex", gap: 18, alignItems: "center", opacity: 0.75 * seg(p, 0.66, 0.78) }}>
          <span style={{ fontFamily: MONO, fontSize: 12, color: MUTED, letterSpacing: 2 }}>NETWORK FOOTPRINT / 2024</span>
          <span style={{ width: 90, height: 1, background: LINE, display: "inline-block" }} />
          <span style={{ fontFamily: MONO, fontSize: 12, color: MUTED, letterSpacing: 2 }}>170+ MARKETS</span>
        </div>

        <div style={{ position: "absolute", right: 150, top: 690, transform: `scale(${stamp}) rotate(-8deg)`, opacity: stamp > 0.05 ? 1 : 0 }}>
          <div style={{ border: `3px solid ${RED}`, borderRadius: 6, padding: "9px 16px", color: RED, fontFamily: MONO, fontSize: 24, fontWeight: 700, letterSpacing: 3 }}>
            GLOBAL
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene05;
