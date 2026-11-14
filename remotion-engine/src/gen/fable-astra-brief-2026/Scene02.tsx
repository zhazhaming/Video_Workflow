// Scene02 · Fable 5.2：代码评测柱状图，一根就讲清提升。
import React from "react";
import type { GenSceneProps } from "../types";
import { Card, Chip, INK, MUTED, PAPER, Shell, Stamp, clamp01, easeBack, easeOut, mono, sans, stagger } from "./ui";

const Scene02: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const codeIn = easeOut(clamp01((p - 0.02) / 0.18));
  const bars = easeBack(clamp01((p - 0.18) / 0.28));
  const val = 49.1;
  const oldVal = 32.4;
  const stamp = clamp01((p - 0.68) / 0.12);
  const typing = clamp01((p - 0.12) / 0.35);
  const lines = [
    "> run bench --suite frontier_code",
    "  task: patch_repo",
    "  context: 18 files",
    "  result: merged",
    "  49.1%  ↑",
  ];

  return (
    <Shell c1={c1} c2={c2} accent={accent} index={2} label="FABLE 5.2 / CODE" tag="CAPABILITY">
      <div style={{ position: "absolute", left: 185, top: 350 }}>
        <div style={{ ...mono(14, accent, 900) }}>CAPABILITY 01</div>
        <div style={{ fontFamily: "sans-serif", fontSize: 44, fontWeight: 900, color: INK, marginTop: 8 }}>
          代码，是它的主场
        </div>
      </div>

      <Card x={180} y={470} w={410} h={430} opacity={codeIn} scale={0.97 + 0.03 * codeIn} bg="#1A1B18" border="#1A1B18" shadow="10px 10px 0 rgba(23,23,20,0.16)">
        <div style={{ position: "absolute", left: 18, top: 14, right: 18, display: "flex", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 5 }}>
            {[0, 1, 2].map((i) => <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i === 0 ? accent : "rgba(255,253,247,0.35)" }} />)}
          </div>
          <span style={mono(11, "rgba(255,253,247,0.55)", 600)}>agent / code</span>
        </div>
        <div style={{ position: "absolute", left: 20, top: 58, right: 20 }}>
          {lines.map((l, i) => {
            const t = clamp01((typing - i * 0.13) / 0.1);
            return (
              <div
                key={l}
                style={{
                  fontFamily: "monospace", fontSize: 16, lineHeight: 2.05,
                  color: i === 4 ? accent : "rgba(255,253,247,0.82)",
                  opacity: t, transform: `translateX(${(1 - t) * 6}px)`, whiteSpace: "nowrap",
                }}
              >
                {l}
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 20, bottom: 18, ...mono(11, "rgba(255,253,247,0.45)", 600) }}>
          FRONTIERCODE 2.0 / XHIGH
        </div>
      </Card>

      {/* 两根柱 */}
      <div style={{ position: "absolute", left: 650, top: 470, width: 240, height: 430 }}>
        <div style={{ ...mono(12, MUTED, 700), marginBottom: 12 }}>PASS RATE</div>
        <div style={{ position: "relative", height: 300, borderBottom: `2px solid ${INK}66` }}>
          <div
            style={{
              position: "absolute", left: 16, bottom: 0, width: 74,
              height: 32.4 * 5.2 * bars, background: `${INK}33`, borderRadius: "3px 3px 0 0",
            }}
          />
          <div
            style={{
              position: "absolute", left: 128, bottom: 0, width: 74,
              height: 49.1 * 5.2 * bars, background: accent, borderRadius: "3px 3px 0 0",
            }}
          />
          <div style={{ position: "absolute", left: 0, bottom: 32.4 * 5.2 * bars - 36, width: 106, textAlign: "center", ...mono(26, `${INK}77`, 900) }}>
            {oldVal.toFixed(1)}
          </div>
          <div style={{ position: "absolute", left: 116, bottom: 49.1 * 5.2 * bars - 44, width: 106, textAlign: "center", ...mono(38, INK, 900) }}>
            {val.toFixed(1)}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
          <span style={mono(11, MUTED, 700)}>FABLE 5.1</span>
          <span style={mono(11, accent, 800)}>FABLE 5.2</span>
        </div>
      </div>

      <Chip text="NEW" color={accent} size={12} style={{ position: "absolute", left: 748, top: 436, opacity: bars }} />
      <Stamp text="+16.7" x={700} y={840} progress={stamp} rotate={-5} size={20} />
      <div style={{ position: "absolute", left: 185, top: 960, ...mono(12, MUTED, 600), opacity: stamp }}>
        FRONTIERCODE 2.0 / ANTHROPIC 官方基准表
      </div>
    </Shell>
  );
};

export default Scene02;
