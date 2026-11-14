// Scene06 · 一条命令：终端敲命令，工具节点亮起连线，开关拨到 ON
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { MONO_STACK, FONT_STACK } from "../../dv/atmosphere";
import { Paper, Cap, Hair, TermWin, INK, INK_SOFT, FAINT, RED, GOLD, SERIF_STACK, seg, eo, eio, pop, clamp01 } from "../autoloop-2026/ui";

const ACCENT = "#C8452D";
const CMD1 = "npx skills add";
const CMD2 = "addyosmani/agent-skills";

const NODES = [
  { x: 214, y: 720, en: "CLAUDE" },
  { x: 214, y: 940, en: "CURSOR" },
  { x: 214, y: 1160, en: "CODEX" },
  { x: 866, y: 720, en: "COPILOT" },
  { x: 866, y: 940, en: "CLINE" },
  { x: 866, y: 1160, en: "GEMINI" },
];

const Scene06: React.FC<GenSceneProps> = ({ p, c1, c2 }) => {
  const n1 = Math.floor(CMD1.length * seg(p, 0.04, 0.2));
  const n2 = Math.floor(CMD2.length * seg(p, 0.22, 0.46));
  const enter = seg(p, 0.48, 0.56);
  const power = eo(seg(p, 0.72, 0.9));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={ACCENT} />
      <Cap text="06 / ONE COMMAND" x={150} y={392} />
      <Cap text="70+ AGENTS" x={930} y={392} align="right" color={FAINT} />
      <Hair x={150} y={430} w={260} color={ACCENT} thickness={2} progress={eo(seg(p, 0.04, 0.3))} opacity={0.75} />

      <TermWin x={540} y={930} w={700} h={300} title="~/dev" opacity={eo(seg(p, 0.02, 0.14))} scale={0.98 + 0.02 * eo(seg(p, 0.02, 0.14))}>
        <div style={{ padding: "26px 30px", fontFamily: MONO_STACK, fontSize: 24, lineHeight: 1.7, color: "#E9E1D2" }}>
          <div>
            <span style={{ color: "#8FA88B" }}>➜ </span>
            {CMD1.slice(0, n1)}
            <span style={{ opacity: Math.sin(p * 40) > 0 ? 1 : 0, color: ACCENT }}>▌</span>
          </div>
          <div style={{ color: "#CFC3AC" }}>{CMD2.slice(0, n2)}</div>
          <div style={{ marginTop: 14, color: enter > 0.3 ? "#8FA88B" : "#6E6455", opacity: enter > 0.3 ? 1 : 0.4 }}>
            ✓ 25 skills installed for 70+ agents
          </div>
        </div>
      </TermWin>

      {/* 工具节点 */}
      {NODES.map((nd, i) => {
        const on = seg(p, 0.5 + i * 0.045, 0.62 + i * 0.045);
        const left = nd.x < 540;
        return (
          <React.Fragment key={nd.en}>
            <div
              style={{
                position: "absolute", left: nd.x - 70, top: nd.y - 34, width: 140, height: 68,
                border: `1.5px solid ${on > 0.2 ? ACCENT : INK}${on > 0.2 ? "" : "22"}`,
                background: on > 0.2 ? `${ACCENT}0E` : "rgba(251,247,239,0.55)",
                borderRadius: 8,
                opacity: 0.35 + 0.65 * on,
                transform: `translateX(${(1 - on) * (left ? -18 : 18)}px)`,
              }}
            >
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO_STACK, fontSize: 17, letterSpacing: 2, color: on > 0.2 ? ACCENT : FAINT }}>{nd.en}</div>
            </div>
            <div
              style={{
                position: "absolute",
                left: left ? nd.x + 70 : nd.x - 70 - 160 * on,
                top: nd.y - 1,
                width: 160 * on,
                height: 2,
                background: ACCENT,
                opacity: 0.5,
              }}
            />
          </React.Fragment>
        );
      })}

      {/* ON 开关 */}
      <div style={{ position: "absolute", left: 700, top: 480, width: 230, height: 92, opacity: eo(seg(p, 0.68, 0.82)) }}>
        <div style={{ position: "absolute", left: 0, top: 0, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 4, color: FAINT }}>RULE ENGINE</div>
        <div style={{ position: "absolute", left: 0, top: 28, width: 168, height: 58, borderRadius: 29, background: power > 0.5 ? ACCENT : `${INK}18`, transition: "none" }}>
          <div style={{ position: "absolute", left: 6 + 110 * power, top: 6, width: 46, height: 46, borderRadius: 23, background: "#FBF7EF", boxShadow: `0 3px 8px ${INK}33` }} />
        </div>
        <div style={{ position: "absolute", left: 186, top: 42, fontFamily: MONO_STACK, fontSize: 22, fontWeight: 700, color: power > 0.5 ? ACCENT : FAINT }}>{power > 0.5 ? "ON" : "OFF"}</div>
      </div>

      <div style={{ position: "absolute", left: 150, bottom: 470, fontFamily: FONT_STACK, fontSize: 24, color: INK_SOFT, opacity: eo(seg(p, 0.8, 0.94)) }}>
        装完，规矩才开始生效
      </div>
    </AbsoluteFill>
  );
};

export default Scene06;
