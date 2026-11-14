// Scene08 · 代价：又慢又贵，但账上一直留着一笔钱
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Signature, seg, easeOut, easeInOut, pop, mk, clamp01,
  RED, INK, MUTED, LINE, STEEL, MONO, SANS, SERIF,
} from "./ui";

const Scene08: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = mk(marks, 1, 0.5);
  const head = seg(p, 0.03, 0.12);
  const wafer = easeOut(seg(p, 0.06, 0.3));
  const dies = seg(p, 0.12, 0.46);
  const vault = easeOut(seg(p, m1 - 0.06, m1 + 0.18));
  const open = easeInOut(seg(p, m1 + 0.02, m1 + 0.28));
  const glow = pop(seg(p, m1 + 0.08, m1 + 0.26));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <Signature opacity={0.34} />
      <Cap text="代价 · COST" x={150} y={310} opacity={head} size={22} />

      <div style={{ position: "absolute", left: 150, top: 352, opacity: head }}>
        <div style={{ fontFamily: SERIF, fontSize: 78, fontWeight: 700, color: INK, letterSpacing: 3 }}>又慢，又贵<span style={{ color: RED }}>。</span></div>
      </div>

      {/* 晶圆 */}
      <div style={{ position: "absolute", left: 140, top: 520, width: 440, height: 440, opacity: wafer, transform: `scale(${0.94 + 0.06 * wafer})` }}>
        <svg width="440" height="440" viewBox="0 0 440 440">
          <defs>
            <clipPath id="waferClip">
              <circle cx="220" cy="220" r="196" />
            </clipPath>
          </defs>
          <circle cx="220" cy="220" r="204" fill="rgba(248,250,251,0.5)" stroke="rgba(16,24,32,0.45)" strokeWidth="2" />
          <circle cx="220" cy="220" r="196" fill="none" stroke="rgba(16,24,32,0.18)" strokeWidth="1" />
          <g clipPath="url(#waferClip)">
            {Array.from({ length: 14 }, (_, i) =>
              Array.from({ length: 14 }, (_, j) => {
                const cx = 220 + (i - 6.5) * 28;
                const cy = 220 + (j - 6.5) * 28;
                if (Math.hypot(cx - 220, cy - 220) > 186) return null;
                const t = clamp01(dies * 1.7 - (i + j) * 0.035);
                const bad = (i * 7 + j * 11) % 17 === 0;
                return (
                  <rect
                    key={`${i}-${j}`} x={cx - 11} y={cy - 11} width="22" height="22"
                    fill={bad ? "rgba(207,10,44,0.55)" : "rgba(62,90,107,0.28)"}
                    stroke={bad ? RED : "rgba(16,24,32,0.2)"} strokeWidth="0.8"
                    opacity={t}
                  />
                );
              })
            )}
          </g>
          <circle cx="220" cy="220" r="196" fill="none" stroke="rgba(16,24,32,0.25)" strokeWidth="1" strokeDasharray="2 6" />
          <rect x="214" y="18" width="12" height="8" fill="rgba(16,24,32,0.4)" />
        </svg>
        <div style={{ position: "absolute", left: 18, bottom: 10, fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: 2 }}>WAFER / YIELD LOSS</div>
      </div>

      <div style={{ position: "absolute", left: 188, top: 970, opacity: seg(p, 0.34, 0.48) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: SANS, fontSize: 20, color: MUTED, letterSpacing: 2 }}>良率</span>
          <span style={{ fontFamily: MONO, fontSize: 30, color: RED }}>↓</span>
          <span style={{ fontFamily: SERIF, fontSize: 26, color: INK }}>每多一次曝光，就多一批废片</span>
        </div>
      </div>

      {/* 保险箱 / 研发储备 */}
      <div style={{ position: "absolute", left: 650, top: 500, width: 330, height: 360, opacity: vault, transform: `translateY(${(1 - vault) * 22}px)` }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 10, background: "rgba(248,250,251,0.65)", border: `2px solid ${INK}`, boxShadow: "0 28px 60px rgba(16,24,32,0.16)" }} />
        <div style={{ position: "absolute", left: 18, top: 16, fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: 2 }}>RESERVE / LONG-TERM</div>
        <div style={{ position: "absolute", left: 26, top: 44, right: 26, bottom: 26, borderRadius: 6, background: "rgba(16,24,32,0.06)", border: `1px solid rgba(16,24,32,0.2)` }} />
        <div
          style={{
            position: "absolute", left: 40, top: 62, width: 250, height: 250, borderRadius: 6,
            background: "linear-gradient(135deg, rgba(62,90,107,0.22), rgba(248,250,251,0.9))",
            border: `1.5px solid ${STEEL}`,
            transform: `perspective(700px) rotateY(${-open * 34}deg)`,
            transformOrigin: "left center",
            boxShadow: "8px 0 24px rgba(16,24,32,0.12)",
          }}
        >
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 92, height: 92, marginLeft: -46, marginTop: -46, borderRadius: "50%", border: `2px solid ${INK}` }}>
            <div style={{ position: "absolute", left: "50%", top: 6, width: 2, height: 40, background: INK, transform: `translateX(-50%) rotate(${open * 120}deg)`, transformOrigin: "bottom center" }} />
            <div style={{ position: "absolute", left: "50%", top: "50%", width: 10, height: 10, marginLeft: -5, marginTop: -5, borderRadius: "50%", background: RED }} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 18, textAlign: "center", fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: 2 }}>R&amp;D BUDGET</div>
        </div>
        <div style={{ position: "absolute", left: 40, top: 62, width: 250, height: 250, background: RED, opacity: 0.1 * glow, filter: "blur(12px)" }} />
        <div style={{ position: "absolute", right: 16, bottom: 14, fontFamily: SERIF, fontSize: 20, color: RED, letterSpacing: 2 }}>研发储备</div>
      </div>

      <div style={{ position: "absolute", left: 150, top: 1080, width: 800, opacity: seg(p, m1 + 0.06, m1 + 0.2) }}>
        <div style={{ fontFamily: SERIF, fontSize: 44, color: INK, letterSpacing: 2 }}>
          但华为账上，一直留着一<span style={{ color: RED }}>笔钱</span>。
        </div>
        <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: 2 }}>THE MONEY WAS ALREADY THERE</div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene08;
