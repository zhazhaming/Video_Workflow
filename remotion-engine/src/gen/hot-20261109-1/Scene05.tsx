// Scene05 · 两只手握在一起（中石油 × 宇树）
// 两枚圆形印章从左右滑入，一条横线接通，中间盖下「合营」；下方工业具身智能的方案线展开。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Stamp, INK, INK_SOFT, FAINT, RED, seg, eo, eio, pop, lerp } from "./ui";

const Scene05: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.1));
  const left = eio(seg(p, 0.06, 0.3));
  const right = eio(seg(p, 0.12, 0.36));
  const link = eo(seg(p, 0.32, 0.52));
  const seal = seg(p, 0.52, 0.62);
  const bottom = eo(seg(p, 0.62, 0.8));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="北京市监局 · 合营公示" x={96} y={318} size={20} />

        {/* 左：中石油 */}
        <div
          style={{
            position: "absolute", left: 180, top: 600, width: 240, height: 240, borderRadius: 120,
            border: `3px solid ${INK}`, display: "flex", alignItems: "center", justifyContent: "center",
            transform: `translateX(${(1 - left) * -120}px)`, opacity: left,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: '"Songti SC", serif', fontSize: 46, color: INK, letterSpacing: 2 }}>中石油</div>
            <div style={{ fontFamily: '"SF Mono", monospace', fontSize: 14, color: FAINT, letterSpacing: 2, marginTop: 8 }}>CNPC</div>
          </div>
        </div>

        {/* 右：宇树 */}
        <div
          style={{
            position: "absolute", left: 660, top: 600, width: 240, height: 240, borderRadius: 120,
            border: `3px solid ${INK}`, display: "flex", alignItems: "center", justifyContent: "center",
            transform: `translateX(${(1 - right) * 120}px)`, opacity: right,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: '"Songti SC", serif', fontSize: 52, color: INK, letterSpacing: 2 }}>宇树</div>
            <div style={{ fontFamily: '"SF Mono", monospace', fontSize: 14, color: FAINT, letterSpacing: 2, marginTop: 8 }}>UNITREE</div>
          </div>
        </div>

        {/* 连接线 */}
        <Hair x={420} y={720} w={240} color={INK} thickness={2} progress={link} opacity={0.55 * link} />
        <div style={{ position: "absolute", left: 528, top: 712, width: 16, height: 16, borderRadius: 8, background: RED, opacity: link }} />

        <Stamp text="合营" x={540} y={900} size={56} rotate={-7} t={seal} />

        {/* 底部方案线 */}
        <div style={{ position: "absolute", left: 96, top: 1010, width: 888, opacity: bottom }}>
          <Hair x={0} y={0} w={888} color={INK} thickness={1} progress={bottom} opacity={0.2} />
          <div style={{ marginTop: 26, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontFamily: '"Songti SC", serif', fontSize: 46, color: INK }}>工业具身智能</div>
            <div style={{ fontFamily: '"SF Mono", monospace', fontSize: 18, color: FAINT, letterSpacing: 2 }}>央企场景 × 机器人本体</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene05;
