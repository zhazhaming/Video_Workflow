// Scene08 · 安全：默认不设防 → 三道锁依次打开，计数 0→3
import React from "react";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";
import {
  Card, Chip, Glyph, INK, Kicker, LINE, MUTED, PAPER, RED, RollNumber, SceneShell, Stamp, Tape, Toggle, clamp01, easeBack, easeOut, exitFade,
} from "./ui";

const locks = [
  { t: "域名白名单", s: "--allowed-domains", d: "不让它把数据带去陌生域名", icon: "globe" as const },
  { t: "动作策略", s: "--action-policy", d: "eval、下载、上传先关掉", icon: "ban" as const },
  { t: "危险确认", s: "--confirm-actions", d: "破坏性操作必须人工点头", icon: "lock" as const },
];

const Scene08: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const fade = exitFade(p);
  const head = easeOut(clamp01(p / 0.12));
  const warn = easeOut(clamp01((p - 0.04) / 0.12));
  const on = (i: number) => clamp01((p - 0.26 - i * 0.14) / 0.16);
  const count = on(0) + on(1) + on(2);
  const locked = clamp01((p - 0.6) / 0.12);

  return (
    <SceneShell c1={c1} c2={c2} accent={accent} index={8} fade={fade}>
      <Kicker text="SECURITY / OPT-IN BY DEFAULT" color={RED} opacity={head} style={{ position: "absolute", left: 96, top: 300 }} />
      <div style={{ position: "absolute", left: 96, top: 336, opacity: head }}>
        <div style={{ fontSize: 58, fontWeight: 900, letterSpacing: 1 }}>
          默认，<span style={{ color: RED }}>不设防</span>
        </div>
        <div style={{ marginTop: 6, fontFamily: MONO_STACK, fontSize: 18, color: MUTED }}>
          navigation / action / output controls are opt-in
        </div>
      </div>

      {/* 锁计数 */}
      <div style={{ position: "absolute", right: 96, top: 318, textAlign: "right", opacity: warn }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 17, color: MUTED, letterSpacing: 2 }}>LOCKS ON</div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end", gap: 4 }}>
          <RollNumber value={count} digits={1} size={104} color={count > 2.5 ? accent : RED} />
          <span style={{ fontFamily: MONO_STACK, fontSize: 34, color: MUTED, marginBottom: 14 }}>/3</span>
        </div>
      </div>

      <Tape x={96} y={452} w={330} rotate={-2} color="#F0C9B6" label="DEFAULT: NO LIMITS" opacity={warn * (1 - clamp01((p - 0.3) / 0.15))} />

      {locks.map((x, i) => {
        const o = on(i);
        const t = easeOut(clamp01((p - 0.1 - i * 0.06) / 0.14));
        return (
          <div
            key={x.t}
            style={{
              position: "absolute", left: 96, top: 512 + i * 152, width: 888, height: 124,
              background: PAPER, border: `3px solid ${INK}`, borderRadius: 10,
              boxShadow: "9px 9px 0 rgba(23,21,15,0.10)",
              display: "flex", alignItems: "center", gap: 18, padding: "0 24px", boxSizing: "border-box",
              opacity: clamp01(t * 1.3), transform: `translateY(${(1 - t) * 30}px)`,
            }}
          >
            <span style={{ width: 54, height: 54, borderRadius: 10, background: o > 0.5 ? accent : "rgba(23,21,15,0.06)", border: `2px solid ${o > 0.5 ? accent : LINE}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Glyph kind={x.icon} size={30} color={o > 0.5 ? PAPER : INK} />
            </span>
            <div style={{ width: 300 }}>
              <div style={{ fontSize: 28, fontWeight: 900 }}>{x.t}</div>
              <div style={{ marginTop: 2, fontFamily: MONO_STACK, fontSize: 15, color: accent }}>{x.s}</div>
            </div>
            <div style={{ flex: 1, fontSize: 19, color: MUTED }}>{x.d}</div>
            <Toggle x={710} y={37} on={easeBack(o)} accent={accent} w={96} h={50} />
            <span style={{ position: "absolute", right: 30, top: 48, fontFamily: MONO_STACK, fontSize: 15, color: o > 0.5 ? accent : MUTED, width: 44 }}>
              {o > 0.5 ? "ON" : "OFF"}
            </span>
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 96, top: 1010, display: "flex", alignItems: "center", gap: 14, opacity: locked }}>
        <Glyph kind="key" size={38} color={accent} />
        <span style={{ fontSize: 23, color: INK }}>密码放进本地 auth vault，模型只看到名字</span>
      </div>

      <Stamp text="LOCKED / 3" progress={locked} rotate={-7} fontSize={26} x={700} y={1084} color={accent} />
      <Chip text="默认值不等于安全值" color={RED} size={18} style={{ position: "absolute", left: 96, top: 1230, opacity: clamp01((p - 0.5) / 0.12) }} />
    </SceneShell>
  );
};

export default Scene08;
