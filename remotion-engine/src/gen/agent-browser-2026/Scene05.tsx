// Scene05 · 应用场景：4 张场景卡 + 各自的微型 UI 演示
import React from "react";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";
import {
  Card, Chip, Glyph, INK, Kicker, LINE, MUTED, PAPER, RED, SceneShell, clamp01, easeBack, easeOut, exitFade,
} from "./ui";

const UseCard: React.FC<{
  x: number; y: number; t: number; idx: number; title: string; en: string;
  icon: "form" | "table" | "check" | "gauge"; accent: string; children: React.ReactNode; rot: number;
}> = ({ x, y, t, idx, title, en, icon, accent, children, rot }) => (
  <Card
    x={x}
    y={y}
    w={400}
    h={332}
    rotate={rot}
    opacity={clamp01(t * 1.3)}
    style={{ transform: `translateY(${(1 - t) * 46}px) rotate(${rot + (1 - t) * 3}deg) scale(${0.92 + 0.08 * t})` }}
  >
    <div style={{ padding: "18px 20px", boxSizing: "border-box", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Glyph kind={icon} size={28} color={accent} />
        <span style={{ fontFamily: MONO_STACK, fontSize: 15, color: MUTED }}>{en}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: MONO_STACK, fontSize: 24, fontWeight: 900, color: `${accent}88` }}>0{idx}</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 32, fontWeight: 900, letterSpacing: 1 }}>{title}</div>
      <div style={{ marginTop: 10, flex: 1, position: "relative" }}>{children}</div>
    </div>
  </Card>
);

const Scene05: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const fade = exitFade(p);
  const head = easeOut(clamp01(p / 0.12));
  const t = (i: number) => easeBack(clamp01((p - 0.05 - i * 0.075) / 0.18));
  const local = (i: number) => clamp01((p - 0.2 - i * 0.06) / 0.36);

  return (
    <SceneShell c1={c1} c2={c2} accent={accent} index={5} fade={fade}>
      <Kicker text="USE CASES / REPETITIVE WORK" color={accent} opacity={head} style={{ position: "absolute", left: 96, top: 300 }} />
      <div style={{ position: "absolute", left: 96, top: 336, display: "flex", alignItems: "baseline", gap: 14, opacity: head }}>
        <span style={{ fontSize: 56, fontWeight: 900 }}>四类活儿</span>
        <span style={{ fontFamily: MONO_STACK, fontSize: 20, color: MUTED }}>交给它跑</span>
      </div>

      {/* 01 填表 */}
      <UseCard x={96} y={440} t={t(0)} idx={1} title="填表登录" en="FORM / LOGIN" icon="form" accent={accent} rot={-1.4}>
        {[0, 1].map((i) => {
          const lt = clamp01((local(0) - i * 0.28) / 0.4);
          return (
            <div key={i} style={{ marginTop: i === 0 ? 6 : 10, height: 40, border: `2px solid ${INK}`, borderRadius: 5, position: "relative", overflow: "hidden", background: PAPER }}>
              <div style={{ position: "absolute", left: 10, top: 10, height: 16, width: `${lt * 62}%`, background: `${accent}33`, borderRadius: 3 }} />
              <div style={{ position: "absolute", left: 10, top: 9, fontFamily: MONO_STACK, fontSize: 14, color: lt > 0.5 ? INK : FAINT2 }}>{i === 0 ? "you@mail.com" : "••••••••"}</div>
            </div>
          );
        })}
        <div style={{ marginTop: 10, height: 40, borderRadius: 5, background: accent, color: PAPER, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, transform: `scale(${0.96 + 0.04 * easeOut(local(0))})` }}>
          Sign in
        </div>
      </UseCard>

      {/* 02 抓数据 */}
      <UseCard x={584} y={440} t={t(1)} idx={2} title="抓取数据" en="SCRAPE / EXPORT" icon="table" accent={accent} rot={1.2}>
        <div style={{ border: `2px solid ${INK}`, borderRadius: 5, overflow: "hidden", background: PAPER, marginTop: 4 }}>
          {[0, 1, 2].map((r) => {
            const lt = clamp01((local(1) - r * 0.22) / 0.32);
            return (
              <div key={r} style={{ display: "flex", gap: 6, padding: "8px 8px", borderBottom: r < 2 ? `1px solid ${LINE}` : "none", opacity: 0.25 + 0.75 * lt, transform: `translateX(${(1 - lt) * 14}px)` }}>
                <span style={{ height: 12, width: 34, background: `${accent}55`, borderRadius: 2 }} />
                <span style={{ height: 12, flex: 1, background: "rgba(23,21,15,0.12)", borderRadius: 2 }} />
                <span style={{ height: 12, width: 24, background: "rgba(23,21,15,0.08)", borderRadius: 2 }} />
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, fontFamily: MONO_STACK, fontSize: 14, color: accent, opacity: clamp01((local(1) - 0.5) / 0.3) }}>
          <Glyph kind="check" size={16} color={accent} /> rows → json
        </div>
      </UseCard>

      {/* 03 回归测试 */}
      <UseCard x={96} y={796} t={t(2)} idx={3} title="回归测试" en="E2E / REGRESSION" icon="check" accent={accent} rot={1}>
        {["open", "click @e1", "assert url"].map((s, i) => {
          const lt = clamp01((local(2) - i * 0.24) / 0.3);
          return (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: i === 0 ? 2 : 10, opacity: 0.35 + 0.65 * lt }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${lt > 0.6 ? accent : LINE}`, display: "flex", alignItems: "center", justifyContent: "center", background: lt > 0.6 ? `${accent}12` : "transparent" }}>
                {lt > 0.6 ? <Glyph kind="check" size={14} color={accent} strokeWidth={4} /> : null}
              </span>
              <span style={{ fontFamily: MONO_STACK, fontSize: 17, color: INK }}>{s}</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontFamily: MONO_STACK, fontSize: 13, color: lt > 0.6 ? accent : FAINT2 }}>{lt > 0.6 ? "PASS" : "..."}</span>
            </div>
          );
        })}
      </UseCard>

      {/* 04 网页巡检 */}
      <UseCard x={584} y={796} t={t(3)} idx={4} title="网页巡检" en="MONITOR / WATCH" icon="gauge" accent={accent} rot={-1.2}>
        <div style={{ position: "relative", height: 128, marginTop: 2 }}>
          <svg width={330} height={128}>
            {[0, 1, 2].map((i) => (
              <line key={i} x1={0} y1={26 + i * 38} x2={330} y2={26 + i * 38} stroke={`${INK}18`} strokeWidth={1.5} />
            ))}
            <path
              d="M0 96 L44 82 L88 90 L132 58 L176 66 L220 38 L264 50 L308 24"
              fill="none"
              stroke={accent}
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeDasharray="520"
              strokeDashoffset={520 * (1 - local(3))}
            />
            <circle cx={308} cy={24} r={7} fill={RED} opacity={local(3) > 0.9 ? 1 : 0} />
          </svg>
          <div style={{ position: "absolute", right: 0, top: 0, fontFamily: MONO_STACK, fontSize: 15, color: MUTED }}>
            price / day
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
          <span style={{ fontFamily: MONO_STACK, fontSize: 13, color: accent, border: `1.5px solid ${accent}`, borderRadius: 4, padding: "2px 8px" }}>09:00</span>
          <span style={{ fontFamily: MONO_STACK, fontSize: 13, color: MUTED, border: `1.5px solid ${LINE}`, borderRadius: 4, padding: "2px 8px" }}>21:00</span>
        </div>
      </UseCard>

      <div style={{ position: "absolute", left: 96, top: 1206, display: "flex", alignItems: "center", gap: 14, opacity: clamp01((p - 0.58) / 0.14) }}>
        <span style={{ fontFamily: MONO_STACK, fontSize: 34, fontWeight: 900, color: accent }}>×4</span>
        <div style={{ width: 2, height: 40, background: LINE }} />
        <span style={{ fontSize: 22, color: INK }}>重复的活儿，交给同一条闭环</span>
        <Chip text="无需写选择器" color={INK} size={16} style={{ marginLeft: "auto" }} />
      </div>
    </SceneShell>
  );
};

const FAINT2 = "rgba(23,21,15,0.35)";

export default Scene05;
