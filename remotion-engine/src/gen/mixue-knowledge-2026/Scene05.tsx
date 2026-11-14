// Scene05 · 进货：糖浆、果酱、杯子、设备，从总部仓到门店
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Box, Store, Signature, exitFade, mk, seg, easeOut, pop, clamp01,
  RED, INK, MUTED, LINE, CREAM,
} from "./ui";

const ITEMS = [
  { x: 280, y: 760, label: "糖浆", delay: 0.18 },
  { x: 410, y: 820, label: "果酱", delay: 0.26 },
  { x: 540, y: 760, label: "杯子", delay: 0.34 },
  { x: 670, y: 820, label: "设备", delay: 0.42 },
];

const Scene05: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.06);
  const path = easeOut(seg(p, 0.04, 0.36));
  const storeIn = easeOut(seg(p, 0.02, 0.2));
  const truck = seg(p, 0.2, 0.8);

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <Signature />
        <Cap text="一家店开业，要进多少货" x={96} y={330} opacity={seg(p, 0.02, 0.1)} />
        {/* 总部仓 */}
        <div style={{ position: "absolute", left: 100, top: 520, opacity: seg(p, 0.02, 0.12) }}>
          <div style={{ width: 180, height: 200, background: CREAM, border: `3px solid ${INK}`, boxSizing: "border-box", boxShadow: "0 14px 30px rgba(76,50,20,0.12)" }} />
          <div style={{ position: "absolute", left: 20, top: 40, width: 140, height: 34, background: RED, opacity: 0.9 }} />
          <div style={{ position: "absolute", left: 24, top: 92, fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 22, color: INK, letterSpacing: 4 }}>总部仓</div>
          <div style={{ position: "absolute", left: 24, top: 130, width: 104, height: 42, border: `2px dashed ${LINE}` }} />
        </div>
        {/* 门店 */}
        <div style={{ position: "absolute", left: 740, top: 440, opacity: storeIn }}>
          <Store x={0} y={0} w={230} />
        </div>
        {/* 路线 */}
        <div style={{ position: "absolute", left: 280, top: 960, width: 480 * path, height: 4, background: `repeating-linear-gradient(90deg, ${INK} 0 12px, transparent 12px 22px)`, opacity: 0.45 }} />
        <div
          style={{
            position: "absolute", left: 280 + 480 * truck, top: 944,
            width: 22, height: 22, borderRadius: "50%", background: RED,
            opacity: path > 0.9 ? 1 : 0.6,
            boxShadow: "0 0 0 6px rgba(215,38,30,0.12)",
          }}
        />
        {ITEMS.map((it, i) => {
          const inn = pop(seg(p, it.delay, it.delay + 0.18));
          return (
            <div key={i} style={{ position: "absolute", left: it.x, top: it.y + (1 - inn) * -24, opacity: clamp01(inn), transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 2}deg)` }}>
              <Box x={0} y={0} w={112} h={82} label={it.label} />
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 280, top: 1010, fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 20, color: MUTED, letterSpacing: 2, opacity: seg(p, 0.55, 0.72) }}>
          原料、包装、机器，都是持续复购
        </div>
        <div style={{ position: "absolute", left: 620, top: 700, fontFamily: '"Songti SC",serif', fontSize: 32, color: RED, opacity: seg(p, m0 + 0.3, m0 + 0.5), transform: `rotate(-4deg)` }}>
          每一家新店
          <br />
          都是一张长期订单
        </div>
        <div style={{ position: "absolute", left: 96, top: 1080, width: 888, height: 2, background: INK, opacity: 0.12 }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene05;
