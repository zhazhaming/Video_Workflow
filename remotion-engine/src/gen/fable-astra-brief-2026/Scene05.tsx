// Scene05 · 速度与容量：左边油门，右边书堆。
import React from "react";
import type { GenSceneProps } from "../types";
import { Card, Chip, DocStack, Gauge, INK, MUTED, PAPER, Shell, clamp01, easeBack, easeOut, mono, sans } from "./ui";

const Scene05: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const gauge = easeOut(clamp01((p - 0.02) / 0.2));
  const fast = easeBack(clamp01((p - 0.3) / 0.18));
  const docs = easeOut(clamp01((p - 0.08) / 0.3));
  const label = clamp01((p - 0.5) / 0.15);

  return (
    <Shell c1={c1} c2={c2} accent={accent} index={5} label="SPEED / CAPACITY" tag="SPEED">
      <div style={{ position: "absolute", left: 185, top: 350 }}>
        <div style={{ ...mono(14, accent, 900) }}>SPEED 01</div>
        <div style={{ fontFamily: "sans-serif", fontSize: 44, fontWeight: 900, color: INK, marginTop: 8 }}>
          快，是体感；装得下，是能力
        </div>
      </div>

      <Gauge x={170} y={470} p={gauge} color={accent} />
      <div style={{ position: "absolute", left: 220, top: 730, ...sans(72, INK, 900), lineHeight: 1 }}>+30%</div>
      <div style={{ position: "absolute", left: 224, top: 812, ...mono(13, MUTED, 700) }}>OUTPUT SPEED / VS 5.1</div>

      <div
        style={{
          position: "absolute", left: 200, top: 880, width: 220, padding: "14px 16px",
          background: PAPER, border: `2.5px solid ${INK}`, boxShadow: "8px 8px 0 rgba(23,23,20,0.08)",
          opacity: clamp01((p - 0.3) / 0.12), transform: `scale(${0.85 + 0.15 * fast}) rotate(-2deg)`,
        }}
      >
        <div style={{ ...mono(11, accent, 900) }}>FAST MODE</div>
        <div style={{ ...sans(46, INK, 900), lineHeight: 1, marginTop: 4 }}>2.5×</div>
        <div style={{ ...mono(11, MUTED, 600), marginTop: 4 }}>TOKEN SPEED</div>
      </div>

      <div style={{ position: "absolute", left: 600, top: 470, width: 300, height: 420, opacity: docs }}>
        <Card x={0} y={0} w={300} h={330} bg="#FBFCFA">
          <div style={{ position: "absolute", left: 18, top: 14, ...mono(12, "#496B7A", 900) }}>CONTEXT / ONE PASS</div>
          <div style={{ position: "absolute", left: 18, top: 58, right: 18 }}>
            {Array.from({ length: 6 }, (_, k) => (
              <div key={k} style={{ height: 7, width: k === 5 ? "60%" : "100%", background: `${INK}${k < 3 ? "28" : "14"}`, marginTop: 14 }} />
            ))}
          </div>
          <div style={{ position: "absolute", left: 18, bottom: 18, right: 18, height: 44, border: `1.5px solid ${INK}22`, background: `${accent}0D` }} />
        </Card>
        <DocStack x={60} y={40} p={docs} color="#496B7A" pages={3} />
        <Chip text="MORE CONTEXT" color="#496B7A" size={13} style={{ position: "absolute", left: 30, top: 352 }} />
        <div style={{ position: "absolute", left: 30, top: 398, ...mono(12, MUTED, 600), opacity: label }}>
          一次读更多，少来回。
        </div>
      </div>

      <div style={{ position: "absolute", left: 185, top: 1060, ...mono(12, MUTED, 600), opacity: label }}>
        FABLE 的标准价 speed 与 fast mode；GPT-6 的强项是容量，不是同口径速度。
      </div>
    </Shell>
  );
};

export default Scene05;
