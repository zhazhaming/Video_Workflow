// Scene01 · 钩子：AI 自己开浏览器 + 48,631 星滚轮 + TRENDING 落章
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK, rand } from "../../dv/atmosphere";
import {
  BrowserWindow, Card, Chip, Cursor, Glyph, Kicker, PAPER, RED, RollNumber, SceneShell, Stamp, clamp01, easeBack, easeInOut, easeOut, exitFade, INK, LINE, MUTED, SHADOW,
} from "./ui";

const Scene01: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const fade = exitFade(p);
  const winIn = easeBack(clamp01((p - 0.02) / 0.2));
  const agentIn = easeOut(clamp01((p - 0.08) / 0.16));
  const cursorT = easeInOut(clamp01((p - 0.22) / 0.26));
  const press = clamp01((p - 0.48) / 0.06) * (1 - clamp01((p - 0.54) / 0.1));
  const ripple = clamp01((p - 0.48) / 0.22);
  const starT = easeOut(clamp01((p - 0.26) / 0.56));
  const value = 48631 * starT;
  const stamp = clamp01((p - 0.7) / 0.12);
  const burst = clamp01((p - 0.8) / 0.16);

  const cx = 300 + cursorT * -160;
  const cy = 1010 + cursorT * -182;

  const stars = React.useMemo(
    () => Array.from({ length: 12 }, (_, k) => ({
      x: 280 + rand(seed + k * 7) * 380,
      y: 930 + rand(seed + k * 7 + 1) * 150,
      s: 10 + rand(seed + k * 7 + 2) * 16,
      r: rand(seed + k * 7 + 3) * 90,
    })),
    [seed],
  );

  return (
    <SceneShell c1={c1} c2={c2} accent={accent} index={1} fade={fade}>
      <Kicker text="VERCEL LABS / OPEN SOURCE" color={accent} opacity={agentIn} style={{ position: "absolute", left: 96, top: 300 }} />

      {/* agent 标牌 */}
      <div
        style={{
          position: "absolute", left: 96, top: 336, display: "flex", alignItems: "center", gap: 12,
          opacity: agentIn, transform: `translateX(${(1 - agentIn) * -18}px)`,
        }}
      >
        <div style={{ width: 48, height: 48, borderRadius: 12, background: INK, color: PAPER, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO_STACK, fontSize: 22, fontWeight: 900 }}>
          AI
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 19, color: MUTED, letterSpacing: 1 }}>
          agent <span style={{ color: accent }}>→</span> shell <span style={{ color: accent }}>→</span> browser
        </div>
      </div>

      {/* 浏览器窗口 */}
      <BrowserWindow
        x={130}
        y={410}
        w={820}
        h={520}
        url="example.com"
        opacity={clamp01(winIn * 1.3)}
        scale={0.9 + 0.1 * winIn}
        rotate={(1 - winIn) * -1.2}
        accent={accent}
      >
        <div style={{ padding: "34px 44px", fontFamily: FONT_STACK }}>
          <div style={{ fontFamily: MONO_STACK, fontSize: 17, color: accent, letterSpacing: 2 }}>EXAMPLE DOMAIN</div>
          <div style={{ marginTop: 10, fontSize: 44, fontWeight: 900, letterSpacing: 1 }}>This domain is for use</div>
          <div style={{ marginTop: 6, fontSize: 44, fontWeight: 900, letterSpacing: 1 }}>in illustrative examples.</div>
          <div style={{ marginTop: 28, height: 12, width: 520, background: "rgba(23,21,15,0.12)", borderRadius: 6 }} />
          <div style={{ marginTop: 12, height: 12, width: 420, background: "rgba(23,21,15,0.10)", borderRadius: 6 }} />

          {/* 按钮 + 点击涟漪 */}
          <div style={{ position: "absolute", left: 44, top: 330 }}>
            <div
              style={{
                width: 238, height: 66, borderRadius: 8, background: accent, border: `3px solid ${INK}`,
                boxShadow: "6px 6px 0 rgba(23,21,15,0.16)",
                color: PAPER, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: MONO_STACK, fontSize: 26, fontWeight: 800, letterSpacing: 1,
                transform: `scale(${1 - press * 0.05}) translateY(${press * 3}px)`,
              }}
            >
              Sign in
            </div>
            {ripple > 0 && ripple < 1 ? (
              <div
                style={{
                  position: "absolute", left: 119 - 40 - ripple * 70, top: 33 - 40 - ripple * 70,
                  width: 80 + ripple * 140, height: 80 + ripple * 140, borderRadius: "50%",
                  border: `3px solid ${accent}`, opacity: 1 - ripple,
                }}
              />
            ) : null}
          </div>

          {/* 页面骨架 */}
          <div style={{ position: "absolute", left: 44, top: 250, display: "flex", gap: 10 }}>
            {["text", "link", "button"].map((t, i) => (
              <span key={t} style={{ fontFamily: MONO_STACK, fontSize: 15, color: FAINT2, border: `1.5px dashed ${LINE}`, borderRadius: 5, padding: "2px 8px", opacity: 0.6 + i * 0.1 }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </BrowserWindow>

      <Cursor x={cx} y={cy} scale={1.05} press={press} opacity={clamp01((p - 0.18) / 0.08)} />

      {/* 星数滚轮 */}
      <div style={{ position: "absolute", left: 96, top: 980, opacity: clamp01((p - 0.24) / 0.12) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Glyph kind="star" size={54} color="#C8901F" />
          <RollNumber value={value} digits={5} size={104} comma color={INK} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginLeft: 4 }}>
            <span style={{ fontFamily: MONO_STACK, fontSize: 24, color: MUTED, letterSpacing: 2 }}>stars</span>
            <span style={{ fontFamily: MONO_STACK, fontSize: 17, color: accent, letterSpacing: 1 }}>≈ 10 个月</span>
          </div>
        </div>
        <div style={{ marginTop: 4, fontFamily: MONO_STACK, fontSize: 21, color: MUTED, letterSpacing: 1 }}>
          vercel-labs / <span style={{ color: INK, fontWeight: 700 }}>agent-browser</span>
        </div>
      </div>

      {/* 落章 */}
      <Stamp text="TRENDING" progress={stamp} rotate={-9} fontSize={30} x={742} y={1010} color={RED} />

      {/* 星屑 */}
      {stars.map((s, k) => {
        const t = clamp01(burst - k * 0.012);
        return (
          <div
            key={k}
            style={{
              position: "absolute", left: s.x, top: s.y - t * (40 + rand(seed + k) * 80),
              opacity: t * 0.85, transform: `rotate(${s.r + t * 80}deg) scale(${0.5 + t * 0.9})`,
              color: k % 3 === 0 ? RED : k % 3 === 1 ? accent : "#C8901F",
            }}
          >
            <Glyph kind="star" size={s.s} color="currentColor" />
          </div>
        );
      })}

      <Chip text="CLI · RUST · APACHE-2.0" color={INK} size={18} style={{ position: "absolute", left: 96, top: 1230 }} />
    </SceneShell>
  );
};

const FAINT2 = "rgba(23,21,15,0.4)";

export default Scene01;
