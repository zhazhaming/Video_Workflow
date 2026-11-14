// Scene06 · 适合人群：四张“入场券”依次盖章
import React from "react";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";
import {
  Card, Chip, Glyph, INK, Kicker, LINE, MUTED, PAPER, SceneShell, Stamp, clamp01, easeBack, easeOut, exitFade,
} from "./ui";

const people = [
  { n: "01", t: "AI 编程用户", s: "Claude Code / Cursor / Codex", icon: "terminal" as const, tag: "VIBE CODER" },
  { n: "02", t: "测试与运营", s: "回归、巡检、批量填表", icon: "check" as const, tag: "QA / OPS" },
  { n: "03", t: "数据与自动化工程师", s: "抓取、定时任务、流水线", icon: "table" as const, tag: "AUTOMATION" },
  { n: "04", t: "独立开发者", s: "一个人，也要有一支队伍", icon: "bolt" as const, tag: "SOLO MAKER" },
];

const Scene06: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const fade = exitFade(p);
  const head = easeOut(clamp01(p / 0.12));
  const ticket = (i: number) => easeBack(clamp01((p - 0.08 - i * 0.09) / 0.2));
  const check = (i: number) => clamp01((p - 0.24 - i * 0.09) / 0.12);
  const note = easeOut(clamp01((p - 0.66) / 0.14));

  return (
    <SceneShell c1={c1} c2={c2} accent={accent} index={6} fade={fade}>
      <Kicker text="AUDIENCE / WHO BENEFITS" color={accent} opacity={head} style={{ position: "absolute", left: 96, top: 300 }} />
      <div style={{ position: "absolute", left: 96, top: 336, display: "flex", alignItems: "baseline", gap: 16, opacity: head }}>
        <span style={{ fontSize: 56, fontWeight: 900 }}>这四类人</span>
        <span style={{ fontFamily: MONO_STACK, fontSize: 20, color: MUTED }}>先受益</span>
      </div>

      {people.map((x, i) => {
        const t = ticket(i);
        const c = check(i);
        return (
          <div
            key={x.n}
            style={{
              position: "absolute", left: 120, top: 430 + i * 150, width: 840, height: 128,
              display: "flex", alignItems: "center", gap: 20,
              background: PAPER, border: `3px solid ${INK}`, borderRadius: 10,
              boxShadow: "9px 9px 0 rgba(23,21,15,0.10)",
              opacity: clamp01(t * 1.25),
              transform: `translateX(${(1 - t) * 70}px) rotate(${(1 - t) * 1.4}deg)`,
              padding: "0 22px", boxSizing: "border-box",
            }}
          >
            <span style={{ fontFamily: MONO_STACK, fontSize: 30, fontWeight: 900, color: `${accent}99`, width: 44 }}>{x.n}</span>
            <span style={{ width: 2, height: 56, background: LINE }} />
            <span style={{ width: 54, height: 54, borderRadius: 12, background: `${accent}12`, border: `2px solid ${accent}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Glyph kind={x.icon} size={30} color={accent} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 0.5 }}>{x.t}</div>
              <div style={{ marginTop: 3, fontFamily: MONO_STACK, fontSize: 16, color: MUTED }}>{x.s}</div>
            </div>
            <span style={{ fontFamily: MONO_STACK, fontSize: 14, color: MUTED, letterSpacing: 1, marginRight: 74 }}>{x.tag}</span>
            <div
              style={{
                position: "absolute", right: 20, top: 30, width: 60, height: 60, borderRadius: "50%",
                border: `3px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center",
                opacity: c, transform: `scale(${0.5 + 0.5 * easeBack(c)}) rotate(-12deg)`,
                background: "rgba(255,251,240,0.8)",
              }}
            >
              <Glyph kind="check" size={32} color={accent} strokeWidth={4} />
            </div>
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 120, top: 1058, display: "flex", gap: 14, alignItems: "center", opacity: note }}>
        <Card x={0} y={0} w={420} h={96} radius={8} style={{ position: "relative", boxShadow: "7px 7px 0 rgba(23,21,15,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 18px", height: "100%" }}>
            <span style={{ width: 26, height: 26, border: `3px solid ${accent}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Glyph kind="check" size={18} color={accent} strokeWidth={4} />
            </span>
            <span style={{ fontSize: 23, fontWeight: 700 }}>只要你会给 agent 下命令</span>
          </div>
        </Card>
        <Stamp text="4 / 4 适配" progress={note} rotate={-5} fontSize={24} x={470} y={24} color={accent} />
      </div>

      <Chip text="不要求会写爬虫" color={INK} size={18} style={{ position: "absolute", left: 120, top: 1184, opacity: note }} />
      <Chip text="不要求会视觉模型" color={INK} size={18} style={{ position: "absolute", left: 372, top: 1184, opacity: note }} />
    </SceneShell>
  );
};

export default Scene06;
