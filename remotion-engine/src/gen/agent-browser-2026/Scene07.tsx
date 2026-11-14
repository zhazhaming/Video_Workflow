// Scene07 · 怎么用：5 行命令逐字敲出 + 三步进度
import React from "react";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";
import {
  Card, Chip, Glyph, INK, Kicker, MUTED, PAPER, RED, RollNumber, SceneShell, clamp01, easeOut, exitFade,
} from "./ui";

const CMDS = [
  "npm i -g agent-browser",
  "agent-browser install",
  "agent-browser open example.com",
  "agent-browser snapshot -i",
  "agent-browser click @e1",
];
const START = [0.06, 0.2, 0.32, 0.48, 0.63];
const SPAN = 0.14;

const Scene07: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const fade = exitFade(p);
  const head = easeOut(clamp01(p / 0.1));
  const t = easeOut(clamp01((p - 0.03) / 0.14));
  const lineT = (i: number) => clamp01((p - START[i]) / SPAN);
  const doneAt = (i: number) => clamp01((p - START[i] - SPAN) / 0.08);
  const steps = Math.min(3, 1 + Math.floor(clamp01((p - 0.2) / 0.6) * 2.99));
  const stepT = (i: number) => clamp01((p - 0.28 - i * 0.16) / 0.1);

  return (
    <SceneShell c1={c1} c2={c2} accent={accent} index={7} fade={fade}>
      <Kicker text="GET STARTED / 3 STEPS · 5 LINES" color={accent} opacity={head} style={{ position: "absolute", left: 96, top: 300 }} />
      <div style={{ position: "absolute", left: 96, top: 336, display: "flex", alignItems: "baseline", gap: 16, opacity: head }}>
        <span style={{ fontSize: 56, fontWeight: 900 }}>三步上手</span>
        <span style={{ fontFamily: MONO_STACK, fontSize: 20, color: MUTED }}>npm → open → snapshot</span>
      </div>

      {/* 终端 */}
      <div
        style={{
          position: "absolute", left: 96, top: 430, width: 888, height: 620,
          background: "#1C1913", border: `3px solid ${INK}`, borderRadius: 12,
          boxShadow: "12px 12px 0 rgba(23,21,15,0.14)", overflow: "hidden",
          opacity: clamp01(t * 1.2), transform: `translateY(${(1 - t) * 26}px)`,
        }}
      >
        <div style={{ height: 48, background: "#2A251C", borderBottom: "2px solid #0F0D0A", display: "flex", alignItems: "center", gap: 10, padding: "0 18px" }}>
          {[RED, "#E7B44E", "#6FA36F"].map((c) => (
            <span key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c, opacity: 0.9 }} />
          ))}
          <span style={{ marginLeft: 12, fontFamily: MONO_STACK, fontSize: 16, color: "#B9AF98" }}>zsh — agent-browser</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontFamily: MONO_STACK, fontSize: 14, color: "#6FA36F" }}>● daemon</span>
        </div>

        <div style={{ padding: "28px 26px", fontFamily: MONO_STACK }}>
          {CMDS.map((cmd, i) => {
            const lt = lineT(i);
            const shown = cmd.slice(0, Math.floor(cmd.length * easeOut(lt)));
            const done = doneAt(i);
            const active = lt > 0 && done < 0.8;
            const blink = Math.floor(p * 40) % 2 === 0;
            return (
              <div key={cmd} style={{ height: 86, display: "flex", alignItems: "center", gap: 12, opacity: lt > 0 ? 0.45 + 0.55 * easeOut(lt) : 0.25 }}>
                <span style={{ color: "#7B8FD9", fontSize: 24 }}>$</span>
                <span style={{ color: "#F2EAD8", fontSize: 26, letterSpacing: 0.4, whiteSpace: "nowrap" }}>
                  {shown}
                  {active ? <span style={{ color: "#F2EAD8", opacity: blink ? 1 : 0.1 }}>▌</span> : null}
                </span>
                <span style={{ flex: 1 }} />
                {done > 0.2 ? <Glyph kind="check" size={24} color="#7FAE7F" opacity={done} strokeWidth={3.4} /> : null}
                <span style={{ fontFamily: MONO_STACK, fontSize: 13, color: "#8A8270", width: 52, textAlign: "right" }}>
                  {i < 2 ? "SETUP" : i === 2 ? "OPEN" : i === 3 ? "READ" : "ACT"}
                </span>
              </div>
            );
          })}
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#7FAE7F", opacity: 0.4 + 0.6 * (Math.floor(p * 10) % 2) }} />
            <span style={{ fontFamily: MONO_STACK, fontSize: 15, color: "#8A8270" }}>浏览器常驻 · 下一条命令接着用</span>
          </div>
        </div>
      </div>

      {/* 三步 */}
      <div style={{ position: "absolute", left: 96, top: 1112, display: "flex", alignItems: "center", gap: 18 }}>
        {[
          { n: 1, k: "装", s: "install" },
          { n: 2, k: "开", s: "open" },
          { n: 3, k: "拍", s: "snapshot" },
        ].map((x, i) => {
          const st = stepT(i);
          return (
            <React.Fragment key={x.n}>
              {i > 0 ? <span style={{ width: 46, height: 2, background: `${INK}33`, opacity: st }} /> : null}
              <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: clamp01(st * 1.4), transform: `translateY(${(1 - st) * 12}px)` }}>
                <span
                  style={{
                    width: 46, height: 46, borderRadius: "50%", border: `3px solid ${INK}`,
                    background: st > 0.5 ? accent : "transparent", color: st > 0.5 ? PAPER : INK,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900,
                  }}
                >
                  {x.n}
                </span>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{x.k}</div>
                  <div style={{ fontFamily: MONO_STACK, fontSize: 13, color: MUTED }}>{x.s}</div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <span style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
          <RollNumber value={steps} digits={1} size={72} color={INK} />
          <span style={{ fontSize: 20, color: MUTED, marginBottom: 8 }}>步</span>
        </div>
      </div>

      <Chip text="一条命令 = 一个动作" color={INK} size={18} style={{ position: "absolute", left: 96, top: 1230 }} />
      <Chip text="也可以 npx 直接跑" color={accent} size={18} style={{ position: "absolute", left: 404, top: 1230 }} />
    </SceneShell>
  );
};

export default Scene07;
