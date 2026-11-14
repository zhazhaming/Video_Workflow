// Scene10 · 收尾：给 AI 一双手 + 仓库卡 + 48,631 星落定
import React from "react";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK, rand } from "../../dv/atmosphere";
import {
  Card, Chip, Glyph, INK, Kicker, LINE, MUTED, PAPER, RollNumber, SceneShell, Stamp, clamp01, easeBack, easeOut, exitFade,
} from "./ui";

const Scene10: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const fade = 1;
  const head = easeOut(clamp01(p / 0.14));
  const cardIn = easeBack(clamp01((p - 0.14) / 0.2));
  const starT = easeOut(clamp01((p - 0.42) / 0.4));
  const value = 48631 * starT;
  const stamp = clamp01((p - 0.62) / 0.12);
  const burst = clamp01((p - 0.8) / 0.14);

  const sparks = React.useMemo(
    () => Array.from({ length: 16 }, (_, k) => ({
      x: 250 + rand(seed + k * 11) * 560,
      y: 780 + rand(seed + k * 11 + 1) * 160,
      s: 8 + rand(seed + k * 11 + 2) * 18,
      a: rand(seed + k * 11 + 3) * 360,
    })),
    [seed],
  );

  return (
    <SceneShell c1={c1} c2={c2} accent={accent} index={10} fade={fade}>
      <Kicker text="START HERE / OPEN SOURCE" color={accent} opacity={head} style={{ position: "absolute", left: 96, top: 300 }} />

      <div style={{ position: "absolute", left: 96, top: 340, opacity: head, transform: `translateY(${(1 - head) * 20}px)` }}>
        <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 0.98, letterSpacing: 2 }}>
          给 AI
          <br />
          一双手<span style={{ color: accent }}>。</span>
        </div>
        <div style={{ marginTop: 16, fontFamily: MONO_STACK, fontSize: 20, color: MUTED, letterSpacing: 1 }}>
          browser automation for agents
        </div>
      </div>

      {/* 仓库卡 */}
      <Card
        x={96}
        y={650}
        w={888}
        h={332}
        radius={10}
        opacity={clamp01(cardIn * 1.2)}
        style={{ transform: `translateY(${(1 - cardIn) * 54}px) rotate(${(1 - cardIn) * 1.2}deg)` }}
      >
        <div style={{ padding: "24px 26px", boxSizing: "border-box", height: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 44, height: 44, borderRadius: 22, background: INK, color: PAPER, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO_STACK, fontSize: 20, fontWeight: 900 }}>G</span>
            <span style={{ fontFamily: MONO_STACK, fontSize: 22, color: MUTED }}>github.com / vercel-labs</span>
            <span style={{ flex: 1 }} />
            <Glyph kind="globe" size={24} color={accent} />
          </div>
          <div style={{ marginTop: 10, fontFamily: MONO_STACK, fontSize: 46, fontWeight: 900, letterSpacing: 0.5 }}>
            agent-browser
          </div>

          <div style={{ marginTop: 6, display: "flex", alignItems: "flex-end", gap: 12 }}>
            <Glyph kind="star" size={42} color="#C8901F" />
            <RollNumber value={value} digits={5} size={112} comma color={INK} />
            <span style={{ fontFamily: MONO_STACK, fontSize: 22, color: MUTED, marginBottom: 18, marginLeft: 6 }}>stars · ≈ 10 个月</span>
          </div>
        </div>
      </Card>

      <Stamp text="OPEN SOURCE" progress={stamp} rotate={8} fontSize={26} x={690} y={702} color={accent} solid />

      {/* 安装条 */}
      <div
        style={{
          position: "absolute", left: 96, top: 1042, width: 888, height: 78, background: INK, borderRadius: 8,
          display: "flex", alignItems: "center", gap: 14, padding: "0 24px", boxSizing: "border-box",
          opacity: clamp01((p - 0.5) / 0.14), transform: `translateY(${(1 - clamp01((p - 0.5) / 0.14)) * 16}px)`,
        }}
      >
        <span style={{ color: "#7B8FD9", fontFamily: MONO_STACK, fontSize: 24 }}>$</span>
        <span style={{ color: "#F2EAD8", fontFamily: MONO_STACK, fontSize: 27, letterSpacing: 0.5 }}>npm i -g agent-browser</span>
        <span style={{ flex: 1 }} />
        <span style={{ color: "#7FAE7F", fontFamily: MONO_STACK, fontSize: 14 }}>Apache-2.0</span>
      </div>

      <div style={{ position: "absolute", left: 96, top: 1152, display: "flex", alignItems: "center", gap: 12, opacity: clamp01((p - 0.66) / 0.12) }}>
        <Chip text="Rust" color={INK} size={18} />
        <Chip text="Apache-2.0" color={INK} size={18} />
        <Chip text="mac / linux / windows" color={INK} size={16} />
        <span style={{ fontFamily: MONO_STACK, fontSize: 18, color: MUTED, marginLeft: 6 }}>搜 agent browser 就能找到</span>
      </div>

      {sparks.map((s, k) => {
        const t = clamp01(burst - k * 0.01);
        return (
          <div
            key={k}
            style={{
              position: "absolute", left: s.x, top: s.y - t * (60 + rand(seed + k) * 90),
              opacity: t * 0.9, transform: `rotate(${s.a + t * 140}deg) scale(${0.4 + t})`,
              color: k % 4 === 0 ? accent : k % 4 === 1 ? "#C8901F" : "rgba(23,21,15,0.55)",
            }}
          >
            <Glyph kind="star" size={s.s} color="currentColor" />
          </div>
        );
      })}

    </SceneShell>
  );
};

export default Scene10;
