// Scene03 · GPT-6 Astra：一摞纸 + 一个会点鼠标的窗口。
import React from "react";
import type { GenSceneProps } from "../types";
import { Card, Chip, DocStack, INK, MUTED, PAPER, Shell, clamp01, easeOut, mono, sans } from "./ui";

const Scene03: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const docs = easeOut(clamp01((p - 0.02) / 0.22));
  const badge = clamp01((p - 0.18) / 0.14);
  const win = easeOut(clamp01((p - 0.24) / 0.2));
  const cursor = easeOut(clamp01((p - 0.4) / 0.24));
  const click = clamp01((p - 0.58) / 0.06) * (1 - clamp01((p - 0.64) / 0.1));

  return (
    <Shell c1={c1} c2={c2} accent={accent} index={3} label="GPT-6 ASTRA / CONTEXT" tag="CAPABILITY">
      <div style={{ position: "absolute", left: 185, top: 350 }}>
        <div style={{ ...mono(14, "#496B7A", 900) }}>CAPABILITY 02</div>
        <div style={{ fontFamily: "sans-serif", fontSize: 44, fontWeight: 900, color: INK, marginTop: 8 }}>
          一次，读完整套资料
        </div>
      </div>

      <DocStack x={180} y={470} p={docs} color="#496B7A" pages={5} />
      <div
        style={{
          position: "absolute", left: 210, top: 790, width: 270, padding: "16px 18px",
          background: PAPER, border: `2.5px solid ${INK}`, boxShadow: "8px 8px 0 rgba(23,23,20,0.08)",
          opacity: badge, transform: `translateY(${(1 - badge) * 12}px)`,
        }}
      >
        <div style={mono(11, "#496B7A", 800)}>CONTEXT WINDOW</div>
        <div style={{ ...sans(52, INK, 900), lineHeight: 1, marginTop: 8 }}>105 万</div>
        <div style={mono(13, MUTED, 700)}>TOKEN / 一次输入</div>
      </div>

      {/* 浏览器窗口 */}
      <Card x={600} y={470} w={300} h={350} opacity={win} scale={0.96 + 0.04 * win} bg="#FBFCFA">
        <div style={{ position: "absolute", left: 16, top: 12, right: 16, height: 28, border: `1.5px solid ${INK}22`, borderRadius: 5, display: "flex", alignItems: "center", padding: "0 8px" }}>
          <span style={mono(10, MUTED, 600)}>workspace / browser</span>
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ position: "absolute", left: 18, top: 60 + i * 64, width: 190, height: 44, border: `1.5px solid ${INK}18`, background: i === 2 ? `${accent}12` : "transparent" }} />
        ))}
        <div style={{ position: "absolute", left: 18, top: 252, width: 130, height: 36, background: accent, borderRadius: 4, opacity: 0.9 }} />
        <div style={{ position: "absolute", left: 38, top: 264, ...mono(11, PAPER, 800) }}>RUN TASK</div>
        <div
          style={{
            position: "absolute", left: 162 + cursor * 54, top: 222 + cursor * 36,
            width: 24, height: 32, opacity: clamp01((p - 0.34) / 0.1),
            transform: `scale(${1 - click * 0.1})`,
          }}
        >
          <svg width="24" height="32" viewBox="0 0 24 32">
            <path d="M 3 2 L 21 17 L 13 19 L 18 29 L 12 31 L 8 21 L 3 27 Z" fill={PAPER} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </div>
      </Card>

      <Chip text="COMPUTER USE" color="#496B7A" size={14} style={{ position: "absolute", left: 600, top: 840, opacity: win }} />
      <div style={{ position: "absolute", left: 600, top: 890, width: 300, ...mono(12, MUTED, 600), lineHeight: 1.8, opacity: win }}>
        网页搜索 · 文件搜索<br />代码编写 · 执行
      </div>
    </Shell>
  );
};

export default Scene03;
