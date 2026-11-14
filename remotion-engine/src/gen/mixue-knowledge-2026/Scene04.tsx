// Scene04 · 反转：它主要赚加盟商的钱，不是靠卖奶茶
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Cup, Box, Arrow, Stamp, Signature, exitFade, mk, seg, easeOut, pop, clamp01,
  RED, INK, MUTED, LINE,
} from "./ui";

const Scene04: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = mk(marks, 1, 0.46);
  const reveal = easeOut(seg(p, m1, m1 + 0.3));
  const q = pop(seg(p, 0.06, 0.2));
  const arrow = easeOut(seg(p, m1 + 0.1, m1 + 0.42));

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <Signature />
        <Cap text="真正的生意" x={96} y={330} opacity={seg(p, 0.02, 0.1)} />
        <div style={{ position: "absolute", left: 96, top: 372, fontFamily: '"Songti SC",serif', fontSize: 42, color: INK, opacity: seg(p, 0.06, 0.16) }}>
          一杯奶茶，只是入口
        </div>
        <div style={{ position: "absolute", left: 520, top: 470, width: 2, height: 640, background: LINE }} />
        {/* 左：终端一杯 */}
        <div style={{ position: "absolute", left: 130, top: 540, width: 320, opacity: 0.42 + 0.22 * (1 - reveal), filter: `grayscale(${0.4 * reveal})` }}>
          <Cup x={0} y={0} w={150} h={210} fill="#FFFDF6" accent={accent} />
        </div>
        <div style={{ position: "absolute", left: 120, top: 840, fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 26, color: MUTED, letterSpacing: 3 }}>
          卖一杯奶茶
          <div style={{ marginTop: 8, fontSize: 19, opacity: 0.8 }}>终端 · 几块钱</div>
        </div>
        {/* 右：原料与设备 */}
        <div style={{ position: "absolute", left: 620, top: 500, transform: `scale(${0.9 + 0.1 * reveal})`, opacity: 0.55 + 0.45 * reveal }}>
          <Box x={0} y={0} w={150} h={110} label="糖浆" />
          <Box x={170} y={26} w={150} h={110} label="果酱" rotate={2} />
          <Box x={40} y={140} w={150} h={110} label="杯子" rotate={-1} />
          <Box x={210} y={166} w={150} h={110} label="设备" rotate={1} />
        </div>
        <div style={{ position: "absolute", left: 620, top: 840, fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 26, color: INK, letterSpacing: 3, opacity: 0.6 + 0.4 * reveal }}>
          卖原料和设备
          <div style={{ marginTop: 8, fontSize: 19, color: MUTED }}>供应链 · 每一家店都要进货</div>
        </div>
        <Arrow x={590} y={700} w={40} progress={arrow} color={RED} thickness={3} dashed={false} />
        <div
          style={{
            position: "absolute", left: 460, top: 620, width: 160, height: 160,
            transform: `translate(-50%, -50%) scale(${q}) rotate(${(1 - q) * -12}deg)`,
            opacity: q * (1 - reveal * 0.85),
            fontFamily: '"Songti SC",serif', fontSize: 170, fontWeight: 700, color: RED, lineHeight: 1,
          }}
        >
          ？
        </div>
        <Stamp text="不对" x={540} y={980} size={52} rotate={-8} t={pop(seg(p, m1 + 0.02, m1 + 0.2))} />
        <div style={{ position: "absolute", left: 120, top: 1050, width: 840, height: 2, background: INK, opacity: 0.18 * clamp01(reveal) }} />
        <div style={{ position: "absolute", left: 120, top: 1072, fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 22, color: MUTED, letterSpacing: 2, opacity: clamp01(reveal) }}>
          你买的是柠檬水，它做的是供应链生意
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene04;
