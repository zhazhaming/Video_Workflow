// Scene01 · 开场：两张模型卡，接着一颗等待策略的机器头。
import React from "react";
import type { GenSceneProps } from "../types";
import { FONT_STACK } from "../../dv/atmosphere";
import {
  Card, Chip, Crosshair, Dust, INK, MUTED, PAPER, SceneShell, Stamp,
  clamp01, easeBack, easeInOut, easeOut, mono, sans,
} from "./ui";

type Pt = [number, number];

const pointOn = (pts: Pt[], t: number): Pt => {
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = lens.reduce((a, b) => a + b, 0);
  let d = clamp01(t) * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i]) {
      const k = lens[i] === 0 ? 0 : d / lens[i];
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
    }
    d -= lens[i];
  }
  return pts[pts.length - 1];
};

const Scene01: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const leftIn = easeBack(clamp01((p - 0.04) / 0.22));
  const rightIn = easeBack(clamp01((p - 0.1) / 0.22));
  const headIn = easeOut(clamp01((p - 0.12) / 0.26));
  const cable = easeInOut(clamp01((p - 0.24) / 0.34));
  const headTurn = easeInOut(clamp01((p - 0.48) / 0.2)) * (1 - 0.35 * clamp01((p - 0.82) / 0.18));
  const eyes = clamp01((p - 0.55) / 0.08);
  const q = clamp01((p - 0.74) / 0.12);
  const scan = ((p * 1.7) % 1);

  const cables: { pts: Pt[]; color: string }[] = [
    { pts: [[256, 678], [256, 742], [392, 792], [466, 812]], color: accent },
    { pts: [[824, 678], [824, 742], [690, 792], [614, 812]], color: "#496B7A" },
  ];
  const dots: { x: number; y: number; color: string; o: number }[] = Array.from({ length: 6 }, (_, k) => {
    const c = cables[k % 2];
    const t = (p * 1.8 + k * 0.17) % 1;
    const [x, y] = pointOn(c.pts, t);
    return { x, y, color: c.color, o: Math.sin(t * Math.PI) };
  });

  return (
    <SceneShell c1={c1} c2={c2} accent={accent} index={1} kicker="TWO MODELS / ONE BODY" tag="OPENING">
      <div
        style={{
          position: "absolute", right: 175, top: 1040, fontFamily: FONT_STACK, fontSize: 300,
          fontWeight: 900, color: `${INK}08`, lineHeight: 1, letterSpacing: -10,
        }}
      >
        01
      </div>

      {/* 左：Claude 模型卡 */}
      <Card x={150} y={380} w={212} h={298} opacity={leftIn} scale={0.92 + 0.08 * leftIn} rotate={-1.6} bg={PAPER}>
        <div style={{ padding: "18px 18px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={mono(12, MUTED, 700)}>CLAUDE / ANTHROPIC</span>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: accent, opacity: 0.4 + 0.6 * eyes }} />
          </div>
          <div style={{ ...sans(40, INK, 900), lineHeight: 1.05, marginTop: 18 }}>
            FABLE
            <br />
            5.2
          </div>
          <div style={{ ...mono(13, MUTED, 600), marginTop: 12 }}>GENERAL MODEL</div>
        </div>
        <div style={{ position: "absolute", left: 18, right: 18, bottom: 16 }}>
          <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <span key={i} style={{ flex: 1, height: 5, background: i < 3 ? accent : `${INK}18` }} />
            ))}
          </div>
          <div style={{ ...mono(11, MUTED, 600), letterSpacing: 0.6 }}>64.9 / ROBODOJO SIM</div>
        </div>
        <div style={{ position: "absolute", right: 14, top: 112, transform: "rotate(90deg)", transformOrigin: "right top", ...mono(10, `${INK}55`, 600) }}>
          UNIT A-052
        </div>
      </Card>

      {/* 右：GPT-6 模型卡 */}
      <Card x={718} y={380} w={212} h={298} opacity={rightIn} scale={0.92 + 0.08 * rightIn} rotate={1.4} bg="#FBF6EB">
        <div style={{ padding: "18px 18px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={mono(12, MUTED, 700)}>OPENAI / FRONTIER</span>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#496B7A", opacity: 0.4 + 0.6 * eyes }} />
          </div>
          <div style={{ ...sans(40, INK, 900), lineHeight: 1.05, marginTop: 18 }}>
            GPT-6
            <br />
            ASTRA
          </div>
          <div style={{ ...mono(13, MUTED, 600), marginTop: 12 }}>GENERAL MODEL</div>
        </div>
        <div style={{ position: "absolute", left: 18, right: 18, bottom: 16 }}>
          <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <span key={i} style={{ flex: 1, height: 5, background: i < 2 ? "#496B7A" : `${INK}18` }} />
            ))}
          </div>
          <div style={{ ...mono(11, MUTED, 600), letterSpacing: 0.6 }}>29.8 / ROBODOJO SIM</div>
        </div>
        <div style={{ position: "absolute", right: 14, top: 112, transform: "rotate(90deg)", transformOrigin: "right top", ...mono(10, `${INK}55`, 600) }}>
          UNIT B-006
        </div>
      </Card>

      {/* 连接线 + 数据脉冲 */}
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {cables.map((c, i) => (
          <path
            key={i}
            d={c.pts.map(([x, y], j) => `${j === 0 ? "M" : "L"} ${x} ${y}`).join(" ")}
            fill="none"
            stroke={c.color}
            strokeWidth="2.2"
            strokeDasharray="7 9"
            strokeDashoffset={-cable * 40}
            opacity={0.28 + 0.5 * cable}
          />
        ))}
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={3.4} fill={d.color} opacity={0.15 + 0.75 * d.o * cable} />
        ))}
      </svg>

      {/* 测试台上的机器头 */}
      <div
        style={{
          position: "absolute", left: 468, top: 800, width: 144, height: 156,
          opacity: headIn, transform: `translateY(${(1 - headIn) * 18}px) rotate(${headTurn * -3}deg)`,
        }}
      >
        <div
          style={{
            position: "absolute", inset: 0, borderRadius: 42, background: PAPER,
            border: `3px solid ${INK}`, boxShadow: "8px 8px 0 rgba(22,27,24,0.09)",
          }}
        >
          <div style={{ position: "absolute", left: 18, top: 32, width: 108, height: 54, borderRadius: 27, background: INK }}>
            <div style={{ position: "absolute", left: 24, top: 21, width: 14, height: 14, borderRadius: "50%", background: PAPER, opacity: 0.35 + 0.65 * eyes }} />
            <div style={{ position: "absolute", right: 24, top: 21, width: 14, height: 14, borderRadius: "50%", background: PAPER, opacity: 0.35 + 0.65 * eyes }} />
            <div style={{ position: "absolute", left: 44, top: 40, width: 20, height: 3, background: accent, opacity: eyes }} />
          </div>
          <div style={{ position: "absolute", left: 58, top: 102, width: 28, height: 8, borderRadius: 4, background: `${INK}20` }} />
          <div style={{ position: "absolute", left: -12, top: 40, width: 12, height: 34, background: INK, borderRadius: 4 }} />
          <div style={{ position: "absolute", right: -12, top: 40, width: 12, height: 34, background: INK, borderRadius: 4 }} />
        </div>
        <div style={{ position: "absolute", left: 62, top: 154, width: 20, height: 54, background: PAPER, border: `3px solid ${INK}`, borderTop: "none" }} />
        <div style={{ position: "absolute", left: 34, top: 204, width: 76, height: 10, background: INK, borderRadius: 5 }} />
      </div>

      {/* 台面 */}
      <div style={{ position: "absolute", left: 150, top: 1060, width: 780, height: 2.5, background: `${INK}55` }} />
      <div style={{ position: "absolute", left: 380, top: 1071, width: 320, height: 10, background: `${INK}12`, borderRadius: "50%" }} />
      <div style={{ position: "absolute", left: 380, top: 1090, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 8, height: 8, background: accent }} />
        <span style={mono(16, INK, 800)}>UNIT 01 / AWAITING POLICY</span>
      </div>

      <Crosshair x={816} y={914} r={16} color={accent} opacity={0.55} />
      <Stamp text="?" x={692} y={902} progress={q} rotate={7} size={54} />
      <Chip text="2026 / FRONTIER MODELS" color={INK} size={14} style={{ position: "absolute", left: 150, top: 720, opacity: leftIn * rightIn }} />
      <Dust seed={seed + 5} p={p} color={accent} count={16} opacity={0.24} />
    </SceneShell>
  );
};

export default Scene01;
