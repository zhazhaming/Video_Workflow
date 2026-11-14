// Scene02 · 1987 深圳：2.1 万元注册华为
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Stamp, Signature, GhostYear, exitFade, mk, seg, easeOut, easeInOut, pop,
  RED, INK, MUTED, LINE, STEEL, MONO, SANS, SERIF,
} from "./ui";

const Scene02: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = mk(marks, 1, 0.4);
  const m2 = mk(marks, 2, 0.76);
  const docIn = easeOut(seg(p, 0.02, 0.14));
  const office = easeInOut(seg(p, 0.06, 0.42));
  const money = 2.1 * easeOut(seg(p, m1 - 0.04, m1 + 0.16));
  const moneyIn = seg(p, m1 - 0.06, m1 + 0.04);
  const seal = pop(seg(p, m1 + 0.16, m1 + 0.28));
  const pin = pop(seg(p, m2 - 0.03, m2 + 0.09));
  const pulse = 0.4 + 0.6 * Math.abs(Math.sin(p * 9));

  const draw = office;

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} warm />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <Signature />
        <GhostYear text="1987" x={540} y={760} size={330} opacity={0.045} />

        <Cap text="起点 · 深圳" x={150} y={330} opacity={seg(p, 0.02, 0.1)} />
        <div style={{ position: "absolute", left: 150, top: 372, fontFamily: SERIF, fontSize: 42, color: INK, letterSpacing: 1, opacity: seg(p, 0.02, 0.1) }}>
          一间小办公室，几个人
        </div>

        {/* 登记档案卡 */}
        <div
          style={{
            position: "absolute", left: 132, top: 470, width: 420, height: 560,
            background: "rgba(252,250,244,0.94)", border: `2px solid ${INK}`,
            boxShadow: "0 22px 46px rgba(60,52,36,0.16)",
            transform: `translateY(${(1 - docIn) * 34}px) rotate(-2.2deg)`, opacity: docIn,
            padding: "30px 34px", boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: `2px solid ${INK}`, paddingBottom: 12 }}>
            <span style={{ fontFamily: SERIF, fontSize: 27, fontWeight: 700, color: INK, letterSpacing: 4 }}>公司登记</span>
            <span style={{ fontFamily: MONO, fontSize: 18, color: MUTED, letterSpacing: 2 }}>1987 · SZ</span>
          </div>
          {[
            ["名称", "华 为"],
            ["地点", "深 圳"],
            ["时间", "1987 年"],
          ].map(([k, v], i) => (
            <div key={k} style={{ display: "flex", gap: 18, marginTop: 24, opacity: seg(p, 0.04 + i * 0.03, 0.12 + i * 0.03) }}>
              <span style={{ fontFamily: SANS, fontSize: 19, color: MUTED, letterSpacing: 3, width: 46 }}>{k}</span>
              <span style={{ fontFamily: SERIF, fontSize: 26, color: INK, letterSpacing: 2 }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 30, borderTop: `1px dashed ${LINE}`, paddingTop: 18, opacity: moneyIn }}>
            <div style={{ fontFamily: SANS, fontSize: 19, color: MUTED, letterSpacing: 3 }}>注册资本</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
              <span style={{ fontFamily: MONO, fontSize: 82, fontWeight: 700, color: RED, letterSpacing: -4 }}>{money.toFixed(1)}</span>
              <span style={{ fontFamily: SERIF, fontSize: 30, color: INK }}>万元</span>
            </div>
          </div>
          <div style={{ position: "absolute", left: 34, bottom: 34, fontFamily: MONO, fontSize: 14, color: MUTED, letterSpacing: 1, opacity: 0.75 }}>
            CAPITAL · CNY 21,000
          </div>
          <div style={{ position: "absolute", right: 28, bottom: 58, transform: `scale(${seal}) rotate(-10deg)`, opacity: seal > 0.05 ? 1 : 0 }}>
            <div style={{ border: `4px solid ${RED}`, borderRadius: 8, padding: "7px 14px", color: RED, fontFamily: SERIF, fontSize: 26, fontWeight: 700, letterSpacing: 5, background: "rgba(252,250,244,0.7)" }}>
              深圳
            </div>
          </div>
        </div>

        {/* 办公室蓝图 */}
        <div style={{ position: "absolute", left: 600, top: 452, width: 360, opacity: 0.92 }}>
          <svg width="360" height="380" viewBox="0 0 400 400">
            <g fill="none" stroke={INK} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
              <path d="M18 352 L18 48 L382 48 L382 352" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} opacity="0.5" />
              <path d="M18 352 L382 352" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} opacity="0.5" />
              {/* 窗 */}
              <g opacity={seg(draw, 0.25, 0.7)}>
                <rect x="52" y="84" width="120" height="102" stroke={STEEL} />
                <path d="M112 84 L112 186 M52 135 L172 135" stroke={STEEL} opacity="0.6" />
                <path d="M60 176 L164 92" stroke={STEEL} opacity="0.18" />
              </g>
              {/* 吊灯 */}
              <g opacity={seg(draw, 0.2, 0.6)}>
                <path d="M262 48 L262 118" stroke={STEEL} />
                <path d="M236 150 L288 150 L270 118 L254 118 Z" stroke={INK} />
                <path d="M248 160 L276 160" stroke={RED} strokeWidth="4" />
              </g>
              {/* 桌子 */}
              <g opacity={seg(draw, 0.3, 0.85)}>
                <path d="M74 246 L292 246" strokeWidth="4" />
                <path d="M80 246 L80 330 M286 246 L286 330" />
                <path d="M86 274 L280 274" opacity="0.35" />
                <rect x="150" y="206" width="78" height="40" stroke={STEEL} />
                <path d="M158 214 L220 214 M158 224 L208 224 M158 234 L214 234" opacity="0.4" strokeWidth="1.5" />
              </g>
              {/* 椅子 */}
              <g opacity={seg(draw, 0.45, 0.95)}>
                <path d="M314 238 L314 330 M314 330 L330 352 M314 330 L298 352" />
                <path d="M302 238 L330 238 L326 282 L306 282 Z" stroke={STEEL} />
                <path d="M302 238 L302 200 L330 200 L330 238" stroke={STEEL} opacity="0.7" />
              </g>
              {/* 地上的纸箱 */}
              <g opacity={seg(draw, 0.55, 1)}>
                <path d="M62 300 L118 300 L118 350 L62 350 Z" stroke={STEEL} />
                <path d="M62 316 L118 316 M90 300 L90 350" stroke={STEEL} opacity="0.55" />
              </g>
              {/* 电话 */}
              <g opacity={seg(draw, 0.6, 1)}>
                <rect x="196" y="266" width="58" height="26" rx="4" stroke={STEEL} />
                <path d="M204 270 L246 270 L246 262 L204 262 Z" stroke={RED} strokeWidth="3" />
              </g>
            </g>
          </svg>
          <div style={{ position: "absolute", left: 18, top: 18, fontFamily: MONO, fontSize: 13, color: MUTED, letterSpacing: 2 }}>
            OFFICE / 40 m²
          </div>
        </div>

        {/* 深圳坐标 */}
        <div style={{ position: "absolute", left: 700, top: 900, opacity: seg(p, m2 - 0.1, m2) }}>
          <div style={{ position: "absolute", left: -46, top: -46, width: 92, height: 92, borderRadius: "50%", border: `1px solid ${RED}`, opacity: 0.18 + pulse * 0.3 }} />
          <div style={{ position: "absolute", left: -26, top: -26, width: 52, height: 52, borderRadius: "50%", border: `1px dashed ${RED}`, opacity: 0.4 }} />
          <div
            style={{
              position: "absolute", left: -13, top: -26, width: 26, height: 26,
              background: RED, borderRadius: "50% 50% 50% 0", transform: `rotate(-45deg) scale(${pin})`,
              boxShadow: "0 6px 14px rgba(207,10,44,0.28)",
            }}
          />
          <div style={{ position: "absolute", left: 34, top: -8, whiteSpace: "nowrap" }}>
            <div style={{ fontFamily: SANS, fontSize: 22, fontWeight: 700, color: INK, letterSpacing: 2 }}>深圳</div>
            <div style={{ fontFamily: MONO, fontSize: 13, color: MUTED, letterSpacing: 1, marginTop: 2 }}>22.5°N / 114.1°E</div>
          </div>
        </div>

        <Stamp text="1987" x={330} y={1090} size={40} rotate={-9} t={seg(p, m1 + 0.2, m1 + 0.3)} />
        <div style={{ position: "absolute", left: 430, top: 1078, fontFamily: SANS, fontSize: 18, color: MUTED, letterSpacing: 3, opacity: seg(p, m1 + 0.22, m1 + 0.32) }}>
          深圳 · 南山
        </div>

        <div style={{ position: "absolute", right: 150, top: 420, fontFamily: MONO, fontSize: 13, color: MUTED, letterSpacing: 3, writingMode: "vertical-rl", opacity: 0.6 }}>
          FOUNDED / 1987
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene02;
