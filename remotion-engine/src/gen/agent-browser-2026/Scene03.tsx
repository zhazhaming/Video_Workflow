// Scene03 · 它是什么：网页 → 带 ref 的文字树；0 张截图
import React from "react";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK } from "../../dv/atmosphere";
import {
  BrowserWindow, Card, Chip, Glyph, INK, Kicker, LINE, MUTED, PAPER, RollNumber, SceneShell, Stamp, clamp01, easeBack, easeOut, exitFade,
} from "./ui";

const rows = [
  { ref: "@e1", role: "heading", name: "Welcome" },
  { ref: "@e2", role: "textbox", name: "Email" },
  { ref: "@e3", role: "button", name: "Sign in" },
  { ref: "@e4", role: "link", name: "More" },
];

const Scene03: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const fade = exitFade(p);
  const head = easeOut(clamp01(p / 0.12));
  const win = easeBack(clamp01((p - 0.04) / 0.18));
  const rowT = (i: number) => easeBack(clamp01((p - 0.14 - i * 0.1) / 0.14));
  const zero = easeOut(clamp01((p - 0.62) / 0.14));
  const stamp = clamp01((p - 0.7) / 0.12);

  return (
    <SceneShell c1={c1} c2={c2} accent={accent} index={3} fade={fade}>
      <Kicker text="CORE MECHANISM / ACCESSIBILITY TREE" color={accent} opacity={head} style={{ position: "absolute", left: 96, top: 300 }} />

      <div style={{ position: "absolute", left: 96, top: 336, opacity: head, transform: `translateY(${(1 - head) * 16}px)` }}>
        <div style={{ fontSize: 62, fontWeight: 900, letterSpacing: 1, lineHeight: 1.05 }}>
          网页 → 文字树
        </div>
        <div style={{ marginTop: 8, fontFamily: MONO_STACK, fontSize: 19, color: MUTED }}>
          不截图 · 不猜坐标 · 只读结构
        </div>
      </div>

      {/* 左：网页 */}
      <BrowserWindow
        x={96}
        y={540}
        w={370}
        h={460}
        url="example.com/login"
        opacity={clamp01(win * 1.3)}
        scale={0.9 + 0.1 * win}
        accent={accent}
      >
        <div style={{ padding: "26px 24px", position: "relative", height: "100%", boxSizing: "border-box" }}>
          {/* 高亮框 */}
          {[
            { y: 22, h: 52, r: "@e1" },
            { y: 104, h: 58, r: "@e2" },
            { y: 184, h: 58, r: "@e3" },
            { y: 204, h: 38, r: "@e4" },
          ].map((b, i) => {
            const t = rowT(i);
            return (
              <div
                key={b.r}
                style={{
                  position: "absolute", left: 18, top: b.y, width: 300, height: b.h,
                  border: `2.5px dashed ${accent}`, borderRadius: 6,
                  opacity: t * 0.95,
                  transform: `scale(${1 + Math.sin(t * Math.PI) * 0.03})`,
                }}
              >
                <span
                  style={{
                    position: "absolute", right: -8, top: -14, background: accent, color: PAPER,
                    fontFamily: MONO_STACK, fontSize: 14, padding: "1px 7px", borderRadius: 4,
                    opacity: t,
                  }}
                >
                  {b.r}
                </span>
              </div>
            );
          })}
          <div style={{ fontSize: 30, fontWeight: 900 }}>Welcome</div>
          <div style={{ marginTop: 26, height: 46, border: `2px solid ${LINE}`, borderRadius: 6, display: "flex", alignItems: "center", padding: "0 12px", fontFamily: MONO_STACK, fontSize: 17, color: MUTED }}>
            you@example.com
          </div>
          <div style={{ marginTop: 18, height: 46, borderRadius: 6, background: accent, color: PAPER, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800 }}>
            Sign in
          </div>
          <div style={{ marginTop: 14, fontSize: 18, color: accent, textDecoration: "underline" }}>More</div>
        </div>
      </BrowserWindow>

      {/* 右：文字树 */}
      <Card x={530} y={520} w={452} h={520} radius={8} opacity={clamp01((p - 0.08) / 0.14)}>
        <div style={{ height: 46, borderBottom: `2px solid ${INK}`, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", background: "#E9EEF8", boxSizing: "border-box" }}>
          <Glyph kind="layers" size={20} color={accent} />
          <span style={{ fontFamily: MONO_STACK, fontSize: 16, color: MUTED, letterSpacing: 1 }}>snapshot -i</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontFamily: MONO_STACK, fontSize: 15, color: accent }}>4 refs</span>
        </div>
        <div style={{ padding: "18px 16px", fontFamily: MONO_STACK }}>
          {rows.map((r, i) => {
            const t = rowT(i);
            return (
              <div
                key={r.ref}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 8px",
                  borderBottom: i < rows.length - 1 ? `1px dashed ${LINE}` : "none",
                  opacity: t,
                  transform: `translateX(${(1 - t) * 22}px)`,
                  background: t > 0.6 ? "rgba(31,63,176,0.05)" : "transparent",
                }}
              >
                <span style={{ width: 16, height: 16, border: `2px solid ${accent}`, transform: "rotate(45deg)", flex: "none", opacity: 0.7 }} />
                <span style={{ fontSize: 17, color: accent, width: 46, flex: "none" }}>{r.ref}</span>
                <span style={{ fontSize: 18, color: MUTED, width: 88, flex: "none" }}>{r.role}</span>
                <span style={{ fontSize: 20, color: INK, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  “{r.name}”
                </span>
              </div>
            );
          })}
          <div style={{ marginTop: 14, fontFamily: MONO_STACK, fontSize: 15, color: MUTED, lineHeight: 1.6 }}>
            <span style={{ color: accent }}>→</span> ref 就是这一页上的门牌号
          </div>
        </div>
      </Card>

      {/* 0 截图 */}
      <div style={{ position: "absolute", left: 96, top: 1046, display: "flex", alignItems: "flex-end", gap: 12, opacity: zero }}>
        <div style={{ fontSize: 148, lineHeight: 1, fontWeight: 900, color: accent, fontFamily: FONT_STACK }}>
          {Math.round(3 * (1 - zero))}
        </div>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontFamily: MONO_STACK, fontSize: 22, color: INK, letterSpacing: 1 }}>张截图</div>
          <div style={{ fontFamily: MONO_STACK, fontSize: 16, color: MUTED }}>纯文本快照</div>
        </div>
      </div>

      <Stamp text="TEXT ONLY" progress={stamp} rotate={-6} fontSize={26} x={690} y={1072} color={accent} />
      <Chip text="token 友好" color={INK} size={18} style={{ position: "absolute", left: 96, top: 1226, opacity: clamp01((p - 0.6) / 0.12) }} />
    </SceneShell>
  );
};

export default Scene03;
