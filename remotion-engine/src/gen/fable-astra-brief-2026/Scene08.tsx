// Scene08 · 结尾：阿扎签名 + 下期见。
import React from "react";
import type { GenSceneProps } from "../types";
import { Chip, Dust, INK, MUTED, Mic, PAPER, Shell, Stamp, clamp01, easeOut, mono, sans } from "./ui";

const Scene08: React.FC<GenSceneProps> = ({ p, c1, c2, accent, seed }) => {
  const name = easeOut(clamp01((p - 0.03) / 0.22));
  const stamp = clamp01((p - 0.32) / 0.14);
  const chips = clamp01((p - 0.52) / 0.16);
  const mic = easeOut(clamp01((p - 0.1) / 0.2));

  return (
    <Shell c1={c1} c2={c2} accent={accent} index={8} label="OUTRO / SEE YOU" tag="THE END">
      <div style={{ position: "absolute", left: 185, top: 440, opacity: name, transform: `translateY(${(1 - name) * 18}px)` }}>
        <div style={{ ...mono(14, accent, 900) }}>THANKS FOR WATCHING</div>
        <div style={{ fontFamily: "sans-serif", fontSize: 140, fontWeight: 900, color: INK, lineHeight: 1, marginTop: 10 }}>
          阿扎
        </div>
        <div style={{ width: 250, height: 8, background: accent, marginTop: 6 }} />
        <div style={{ fontFamily: "sans-serif", fontSize: 54, fontWeight: 900, color: INK, marginTop: 28, letterSpacing: 6 }}>
          下期见
        </div>
      </div>

      <div style={{ position: "absolute", left: 690, top: 470, opacity: mic }}>
        <Mic x={0} y={0} size={120} color={INK} />
      </div>

      <Stamp text="SEE YOU" x={650} y={790} progress={stamp} rotate={-6} size={24} />
      <div style={{ position: "absolute", left: 660, top: 875, ...mono(12, MUTED, 600), opacity: stamp }}>
        FABLE 5.2 / GPT-6 ASTRA
      </div>

      <div style={{ position: "absolute", left: 190, top: 1030, display: "flex", gap: 10, opacity: chips }}>
        <Chip text="点赞" color={accent} size={15} />
        <Chip text="收藏" color={accent} size={15} />
        <Chip text="关注" color={accent} size={15} />
      </div>
      <div style={{ position: "absolute", left: 190, top: 1100, ...mono(12, MUTED, 600), opacity: chips }}>
        下期想看哪个模型？评论区点名。
      </div>

      <Dust seed={seed + 9} p={p} color={accent} count={18} opacity={0.26} />
    </Shell>
  );
};

export default Scene08;
