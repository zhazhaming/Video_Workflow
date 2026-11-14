// Scene10 · 营收：2025 年 8809 亿，通信 3750 亿、消费者 3445 亿
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Signature, seg, easeOut, easeInOut, mk, clamp01,
  RED, INK, MUTED, LINE, STEEL, MONO, SANS, SERIF,
} from "./ui";

const Scene10: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = mk(marks, 1, 0.44);
  const head = seg(p, 0.03, 0.12);
  const count = 8809 * easeOut(seg(p, 0.06, 0.4));
  const bar = easeInOut(seg(p, m1 - 0.06, m1 + 0.22));
  const labels = seg(p, m1 + 0.04, m1 + 0.18);

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <Signature opacity={0.38} />
      <Cap text="2025 · 营收" x={150} y={310} opacity={head} size={23} />
      <div style={{ position: "absolute", left: 150, top: 350, opacity: head }}>
        <div style={{ fontFamily: SERIF, fontSize: 46, color: INK, letterSpacing: 3 }}>钱从哪来？</div>
      </div>

      <div style={{ position: "absolute", left: 146, top: 448, opacity: seg(p, 0.04, 0.12) }}>
        <div style={{ fontFamily: SANS, fontSize: 18, color: MUTED, letterSpacing: 3 }}>2025 年销售收入</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
          <span style={{ fontFamily: MONO, fontSize: 176, fontWeight: 700, color: RED, letterSpacing: -9, lineHeight: 0.95 }}>{Math.round(count)}</span>
          <span style={{ fontFamily: SERIF, fontSize: 40, color: INK }}>亿元</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: 2 }}>CNY 880.9 BILLION · +2.2% YOY</div>
      </div>

      {/* 结构条 */}
      <div style={{ position: "absolute", left: 150, top: 760, width: 780, height: 96 }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: 96, width: 332 * bar, background: STEEL, opacity: 0.85 }} />
        <div style={{ position: "absolute", left: 332, top: 0, height: 96, width: 305 * bar, background: RED, opacity: 0.9 }} />
        <div style={{ position: "absolute", left: 637, top: 0, height: 96, width: 143 * bar, background: "rgba(16,24,32,0.16)" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: 780, height: 96, border: `1px solid rgba(16,24,32,0.28)`, boxSizing: "border-box" }} />
      </div>

      <div style={{ position: "absolute", left: 150, top: 872, display: "flex", gap: 44, opacity: labels }}>
        <div>
          <div style={{ fontFamily: SANS, fontSize: 14, color: MUTED, letterSpacing: 2 }}>ICT 基础设施</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontFamily: MONO, fontSize: 54, fontWeight: 700, color: INK }}>3750</span>
            <span style={{ fontFamily: SERIF, fontSize: 22, color: INK }}>亿</span>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: SANS, fontSize: 14, color: MUTED, letterSpacing: 2 }}>消费者业务</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontFamily: MONO, fontSize: 54, fontWeight: 700, color: RED }}>3445</span>
            <span style={{ fontFamily: SERIF, fontSize: 22, color: INK }}>亿</span>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: SANS, fontSize: 14, color: MUTED, letterSpacing: 2 }}>其他业务</div>
          <div style={{ fontFamily: SERIF, fontSize: 26, color: MUTED, marginTop: 6 }}>云 / 能源 / 汽车</div>
        </div>
      </div>

      <div style={{ position: "absolute", left: 150, top: 1010, width: 780, opacity: seg(p, 0.5, 0.66) }}>
        <div style={{ height: 1, background: LINE }} />
        <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", fontFamily: SANS, fontSize: 17, color: MUTED, letterSpacing: 1 }}>
          <span>一条腿是通信</span>
          <span style={{ color: RED }}>另一条腿，是终端</span>
        </div>
      </div>

      <div style={{ position: "absolute", left: 610, top: 640, opacity: seg(p, m1 + 0.02, m1 + 0.16) }}>
        <div style={{ width: 70, height: 1, background: RED, transform: "rotate(48deg)", transformOrigin: "left center" }} />
        <div style={{ marginLeft: 44, marginTop: 36, fontFamily: SERIF, fontSize: 24, color: RED, letterSpacing: 2 }}>手机回来了</div>
      </div>

      <div style={{ position: "absolute", left: 150, top: 1120, fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: 2, opacity: 0.7 }}>
        SOURCE / HUAWEI 2025 ANNUAL REPORT
      </div>
    </AbsoluteFill>
  );
};

export default Scene10;
