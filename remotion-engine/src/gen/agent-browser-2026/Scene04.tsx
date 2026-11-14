// Scene04 · 工作流：snapshot → click → verify 的闭环，一条命令一步
import React from "react";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";
import {
  Card, Chip, Cursor, Glyph, INK, Kicker, LINE, MUTED, PAPER, SceneShell, clamp01, easeBack, easeOut, exitFade,
} from "./ui";

const CX = 540;
const CY = 800;
const R = 288;

const Node: React.FC<{
  x: number; y: number; w: number; h: number; label: string; sub: string;
  kind: "camera" | "cursor" | "check"; active: number; t: number; accent: string; num: string;
}> = ({ x, y, w, h, label, sub, kind, active, t, accent, num }) => (
  <Card
    x={x}
    y={y}
    w={w}
    h={h}
    radius={8}
    opacity={clamp01(t * 1.3)}
    style={{
      transform: `translateY(${(1 - t) * 34}px) scale(${0.94 + 0.06 * t + active * 0.035})`,
      borderColor: active > 0.35 ? accent : INK,
      boxShadow: active > 0.35 ? `10px 10px 0 ${accent}33` : "10px 10px 0 rgba(23,21,15,0.10)",
    }}
  >
    <div style={{ padding: "16px 18px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Glyph kind={kind} size={30} color={active > 0.35 ? accent : INK} />
        <span style={{ fontFamily: MONO_STACK, fontSize: 15, color: MUTED, letterSpacing: 1 }}>{num}</span>
        <span style={{ flex: 1 }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: active > 0.35 ? accent : "rgba(23,21,15,0.15)" }} />
      </div>
      <div style={{ marginTop: 8, fontSize: 30, fontWeight: 900, letterSpacing: 1, color: INK }}>{label}</div>
      <div style={{ marginTop: 4, fontFamily: MONO_STACK, fontSize: 16, color: MUTED, lineHeight: 1.35 }}>{sub}</div>
    </div>
  </Card>
);

const Scene04: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const fade = exitFade(p);
  const head = easeOut(clamp01(p / 0.12));
  const t1 = easeBack(clamp01((p - 0.05) / 0.16));
  const t2 = easeBack(clamp01((p - 0.12) / 0.16));
  const t3 = easeBack(clamp01((p - 0.19) / 0.16));
  const dotT = clamp01((p - 0.24) / 0.7);
  const ang = (-90 + dotT * 360 * 1.12) * (Math.PI / 180);
  const dx = CX + Math.cos(ang) * R;
  const dy = CY + Math.sin(ang) * R;
  const norm = (a: number) => ((a % 360) + 360) % 360;
  const near = (target: number) => {
    const d = Math.abs(norm(ang * 180 / Math.PI) - norm(target));
    return clamp01(1 - Math.min(d, 360 - d) / 40);
  };
  const a1 = near(-90);
  const a2 = near(30);
  const a3 = near(150);
  const step = 1 + Math.floor(dotT * 2.99);
  const pulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 8);

  return (
    <SceneShell c1={c1} c2={c2} accent={accent} index={4} fade={fade}>
      <Kicker text="AGENT LOOP / ONE COMMAND AT A TIME" color={accent} opacity={head} style={{ position: "absolute", left: 96, top: 300 }} />
      <div style={{ position: "absolute", left: 96, top: 336, opacity: head, display: "flex", alignItems: "baseline", gap: 16 }}>
        <span style={{ fontSize: 58, fontWeight: 900, letterSpacing: 1 }}>三步闭环</span>
        <span style={{ fontFamily: MONO_STACK, fontSize: 22, color: MUTED }}>01 → 01 → 01</span>
      </div>

      {/* 环形轨道 */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: clamp01((p - 0.1) / 0.16) }}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={`${accent}55`} strokeWidth={3} strokeDasharray="10 12" />
        <circle cx={CX} cy={CY} r={R - 26} fill="none" stroke={`${INK}18`} strokeWidth={1.5} />
        {/* 三个方向箭头 */}
        {[
          [-55, 12],
          [65, 12],
          [185, 12],
        ].map(([deg], i) => {
          const a = (deg * Math.PI) / 180;
          const x = CX + Math.cos(a) * R;
          const y = CY + Math.sin(a) * R;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${deg + 90})`}>
              <path d="M0 -12 L9 8 L0 3 L-9 8 Z" fill={accent} opacity={0.75} />
            </g>
          );
        })}
      </svg>

      {/* 节点 */}
      <Node x={CX - 130} y={CY - R - 92} w={260} h={180} label="拍快照" sub="snapshot -i" kind="camera" active={a1} t={t1} accent={accent} num="STEP 01" />
      <Node x={CX + R - 118} y={CY + 84} w={260} h={180} label="点一下" sub="click @e1" kind="cursor" active={a2} t={t2} accent={accent} num="STEP 02" />
      <Node x={CX - R - 142} y={CY + 84} w={260} h={180} label="再核对" sub="snapshot again" kind="check" active={a3} t={t3} accent={accent} num="STEP 03" />

      {/* 中心：1 条命令 */}
      <div
        style={{
          position: "absolute", left: CX - 150, top: CY - 150, width: 300, height: 300,
          borderRadius: "50%", background: PAPER, border: `3px solid ${INK}`,
          boxShadow: "10px 10px 0 rgba(23,21,15,0.10)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          opacity: clamp01((p - 0.16) / 0.14),
          transform: `scale(${0.9 + 0.1 * easeOut(clamp01((p - 0.16) / 0.14))})`,
        }}
      >
        <div style={{ position: "absolute", inset: 10, borderRadius: "50%", border: `1.5px dashed ${accent}55` }} />
        <div style={{ fontSize: 118, fontWeight: 900, lineHeight: 1, fontFamily: MONO_STACK, color: accent }}>1</div>
        <div style={{ marginTop: 2, fontSize: 22, fontWeight: 800, letterSpacing: 2 }}>条命令</div>
        <div style={{ marginTop: 2, fontFamily: MONO_STACK, fontSize: 15, color: MUTED }}>= 一次动作</div>
      </div>

      {/* 走位光点 */}
      <div style={{ position: "absolute", left: dx - 17, top: dy - 17, width: 34, height: 34, borderRadius: "50%", background: accent, border: `3px solid ${PAPER}`, boxShadow: `0 0 0 8px ${accent}22`, opacity: clamp01((p - 0.2) / 0.1) }} />
      <Cursor x={dx + 4} y={dy + 2} scale={0.55} opacity={clamp01((p - 0.2) / 0.1) * 0.9} />

      {/* 步数 */}
      <div style={{ position: "absolute", left: 96, top: 1180, display: "flex", alignItems: "center", gap: 14, opacity: clamp01((p - 0.24) / 0.14) }}>
        <span style={{ fontFamily: MONO_STACK, fontSize: 22, color: MUTED, letterSpacing: 2 }}>CYCLE</span>
        <span style={{ fontFamily: MONO_STACK, fontSize: 58, fontWeight: 900, color: INK, fontVariantNumeric: "tabular-nums" }}>{String(step).padStart(2, "0")}</span>
        <span style={{ width: 120, height: 8, background: "rgba(23,21,15,0.12)", borderRadius: 4, overflow: "hidden" }}>
          <span style={{ display: "block", width: `${clamp01(pulse) * 100}%`, height: "100%", background: accent }} />
        </span>
      </div>

      <Chip text="shell-native · 无框架" color={INK} size={18} style={{ position: "absolute", left: 96, top: 1268, opacity: clamp01((p - 0.4) / 0.12) }} />
    </SceneShell>
  );
};

export default Scene04;
