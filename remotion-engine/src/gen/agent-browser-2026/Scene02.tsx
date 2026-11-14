// Scene02 · 痛点：截图流 = 慢 / 贵 / 猜坐标（三张截图落下，计数跳到 3）
import React from "react";
import type { GenSceneProps } from "../types";
import { FONT_STACK, MONO_STACK, rand } from "../../dv/atmosphere";
import {
  Card, Chip, Glyph, INK, Kicker, LINE, MUTED, PAPER, RED, RollNumber, SceneShell, Stamp, Tape, clamp01, easeBack, easeOut, exitFade,
} from "./ui";

const ShotCard: React.FC<{ x: number; y: number; w: number; h: number; rot: number; t: number; n: number }> = ({ x, y, w, h, rot, t, n }) => (
  <Card
    x={x}
    y={y}
    w={w}
    h={h}
    rotate={rot}
    opacity={clamp01(t * 1.4)}
    scale={0.86 + 0.14 * t}
    style={{ transform: `translateY(${(1 - t) * 70}px) rotate(${rot}deg) scale(${0.86 + 0.14 * t})` }}
  >
    <div style={{ height: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box", padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(23,21,15,0.22)" }} />
        ))}
        <span style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(23,21,15,0.10)" }} />
        <span style={{ fontFamily: MONO_STACK, fontSize: 15, color: MUTED }}>PNG #{n}</span>
      </div>
      <div style={{ marginTop: 14, height: 18, width: "52%", background: "rgba(23,21,15,0.14)", borderRadius: 4 }} />
      <div style={{ marginTop: 10, height: 10, width: "78%", background: "rgba(23,21,15,0.09)", borderRadius: 4 }} />
      <div style={{ marginTop: 6, height: 10, width: "64%", background: "rgba(23,21,15,0.09)", borderRadius: 4 }} />
      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ height: 64, background: "rgba(31,63,176,0.10)", border: `1.5px dashed ${LINE}`, borderRadius: 5 }} />
        <div style={{ height: 64, background: "rgba(23,21,15,0.05)", border: `1.5px dashed ${LINE}`, borderRadius: 5 }} />
      </div>
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <Glyph kind="camera" size={20} color={RED} />
        <span style={{ fontFamily: MONO_STACK, fontSize: 15, color: RED, letterSpacing: 1 }}>full page capture</span>
      </div>
    </div>
  </Card>
);

const Scene02: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const fade = exitFade(p);
  const t1 = easeBack(clamp01((p - 0.02) / 0.18));
  const t2 = easeBack(clamp01((p - 0.12) / 0.18));
  const t3 = easeBack(clamp01((p - 0.22) / 0.18));
  const counter = 1 + 2 * easeOut(clamp01((p - 0.2) / 0.3));
  const xT = clamp01((p - 0.55) / 0.14);
  const guess = clamp01((p - 0.5) / 0.2);
  const badge = easeOut(clamp01((p - 0.34) / 0.16));

  // 光标在截图里“猜”位置：沿一条折线漂移
  const gx = 560 + Math.sin(p * 9.5) * 150 + rand(seed + 3) * 20;
  const gy = 560 + Math.cos(p * 7.2) * 110;

  return (
    <SceneShell c1={c1} c2={c2} accent={accent} index={2} fade={fade}>
      <Kicker text="THE OLD WAY / SCREENSHOTS" color={RED} opacity={t1} style={{ position: "absolute", left: 96, top: 300 }} />

      <div style={{ position: "absolute", left: 96, top: 344, width: 300 }}>
        <div style={{ fontSize: 68, fontWeight: 900, lineHeight: 1.02, letterSpacing: 1 }}>
          截图流
          <br />
          三宗罪
        </div>
        <div style={{ marginTop: 14, fontFamily: MONO_STACK, fontSize: 19, color: MUTED, lineHeight: 1.7 }}>
          vision-only agent
          <br />
          screenshot → guess
        </div>
      </div>

      {/* 计数 */}
      <div style={{ position: "absolute", left: 96, top: 620, opacity: easeOut(clamp01((p - 0.16) / 0.14)) }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
          <RollNumber value={counter} digits={1} size={168} color={INK} />
          <span style={{ fontSize: 34, fontWeight: 800, marginBottom: 18 }}>张</span>
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 19, color: RED, letterSpacing: 1 }}>才走完一步</div>
      </div>

      {/* 三宗罪 */}
      <div style={{ position: "absolute", left: 96, top: 880, display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { k: "慢", d: "上传、识图、再推理", c: "#8A6A2F" },
          { k: "贵", d: "每一张都烧上下文", c: RED },
          { k: "猜", d: "坐标落在按钮外面", c: accent },
        ].map((x, i) => {
          const t = clamp01(badge - i * 0.08);
          return (
            <div
              key={x.k}
              style={{
                display: "flex", alignItems: "center", gap: 12, opacity: t,
                transform: `translateX(${(1 - t) * -22}px)`,
              }}
            >
              <span style={{ width: 46, height: 46, border: `3px solid ${INK}`, borderRadius: 8, background: x.c, color: PAPER, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 900 }}>{x.k}</span>
              <span style={{ fontSize: 22, color: INK }}>{x.d}</span>
            </div>
          );
        })}
      </div>

      {/* 截图堆 */}
      <ShotCard x={430} y={470} w={300} h={330} rot={-8} t={t1} n={1} />
      <ShotCard x={490} y={430} w={330} h={360} rot={4} t={t2} n={2} />
      <ShotCard x={420} y={400} w={430} h={400} rot={-2} t={t3} n={3} />

      {/* 猜坐标准星 */}
      <div
        style={{
          position: "absolute", left: gx, top: gy, width: 150, height: 76,
          border: `2.5px dashed ${RED}`, opacity: guess * 0.9,
          transform: "translate(-50%,-50%)",
        }}
      >
        <span style={{ position: "absolute", left: -26, top: 26, fontFamily: MONO_STACK, fontSize: 16, color: RED }}>?</span>
        <span style={{ position: "absolute", right: -10, bottom: -28, fontFamily: MONO_STACK, fontSize: 15, color: RED }}>x:{Math.round(320 + gx / 3)}</span>
      </div>

      {/* 红叉 */}
      <div
        style={{
          position: "absolute", left: 420, top: 400, width: 430, height: 400,
          opacity: xT, transform: `scale(${0.7 + 0.3 * easeOut(xT)})`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <div style={{ width: 340, height: 10, background: RED, transform: "rotate(-38deg)", borderRadius: 5 }} />
        <div style={{ position: "absolute", width: 340, height: 10, background: RED, transform: "rotate(38deg)", borderRadius: 5 }} />
      </div>

      <Tape x={676} y={352} w={260} rotate={8} color="#F0C9B6" label="SLOW / PRICEY" opacity={clamp01((p - 0.6) / 0.14)} />
      <Stamp text="又慢又贵" progress={clamp01((p - 0.66) / 0.12)} rotate={-7} fontSize={30} x={676} y={860} color={RED} />

      <Chip text="1 张图 ≠ 1 个元素" color={INK} size={18} style={{ position: "absolute", left: 96, top: 1234, opacity: clamp01((p - 0.52) / 0.14) }} />
    </SceneShell>
  );
};

export default Scene02;
