// Scene07 · 场景二：Issue 与告警，先查再问
// 上下两扇窗口（新 Issue / 线上告警），扫描光带自上而下；查到原因后落一枚 LOCATED 印章。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, TermWin, Card, Chip, Stamp, INK, INK_SOFT, FAINT, TEAL, RED, GOLD, MONO_STACK, SERIF_STACK, seg, eo, pop, lerp } from "./ui";

const Scene07: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const scan = eo(seg(p, 0.18, 0.52));
  const alertIn = eo(seg(p, 0.36, 0.52));
  const pulse = 0.5 + 0.5 * Math.sin(p * 26);
  const stamp = eo(seg(p, 0.76, 0.88));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="07 / INVESTIGATE" x={150} y={330} />
        <Cap text="READ BEFORE ASK" x={880} y={330} align="right" color={FAINT} />
        <Hair x={150} y={368} w={330} color={TEAL} thickness={2} progress={eo(seg(p, 0.08, 0.32))} opacity={0.65} />
      </div>

      {/* Issue 窗口 */}
      <TermWin x={540} y={540} w={700} h={264} title="项目里有人提问" opacity={eo(seg(p, 0.04, 0.2))} scale={0.98 + 0.02 * enter} dark={false}>
        <div style={{ padding: "20px 24px", fontFamily: MONO_STACK, fontSize: 20, lineHeight: 1.75, color: INK_SOFT }}>
          <div><span style={{ color: TEAL }}>#128</span> 有人提 · 登录页偶尔白屏</div>
          <div><span style={{ color: FAINT }}>涉及</span> src/login.tsx · src/session.ts</div>
          <div><span style={{ color: GOLD }}>复现</span> 3 / 10 · 清缓存后出现</div>
        </div>
        <div style={{ position: "absolute", left: 0, top: `${8 + scan * 78}%`, width: "100%", height: 3, background: `linear-gradient(90deg, transparent, ${TEAL}88, transparent)`, opacity: 0.8 }} />
      </TermWin>

      <div style={{ position: "absolute", left: 540, top: 748, width: 2, height: 66, background: INK, opacity: 0.18 }}>
        <div style={{ position: "absolute", left: -3, top: 0, width: 8, height: 8, borderRadius: 4, background: TEAL, opacity: 0.6 }} />
      </div>
      <div style={{ position: "absolute", left: 566, top: 758, fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 3, color: FAINT, opacity: 0.8 }}>接着查</div>

      {/* 告警窗口 */}
      <div style={{ opacity: alertIn }}>
        <TermWin x={540} y={930} w={700} h={252} title="网站报警" opacity={1} scale={0.98 + 0.02 * alertIn} dark={false}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 5, height: "100%", background: RED, opacity: 0.8 }} />
          <div style={{ padding: "20px 24px", fontFamily: MONO_STACK, fontSize: 20, lineHeight: 1.8, color: INK_SOFT }}>
            <div style={{ color: RED }}>网站打不开 · 502</div>
            <div><span style={{ color: FAINT }}>位置</span> 结账页 · 18:42</div>
            <div><span style={{ color: TEAL }}>原因</span> 后台服务卡住了</div>
          </div>
          <div style={{ position: "absolute", right: 22, top: 58, width: 10, height: 10, borderRadius: 5, background: RED, opacity: 0.5 + 0.5 * pulse, boxShadow: `0 0 0 ${6 + 10 * pulse}px ${RED}18` }} />
        </TermWin>
      </div>

      <div style={{ position: "absolute", right: 250, top: 470, opacity: alertIn * 0.9 }}>
        <Chip text="先定位，再问人" x={0} y={0} w={208} color={TEAL} bg="rgba(31,95,87,0.09)" size={17} />
      </div>

      <div style={{ position: "absolute", left: 700, top: 1030, opacity: stamp }}>
        <Stamp text="LOCATED" x={0} y={0} size={28} rotate={-7} t={stamp} color={RED} />
      </div>

      <div style={{ position: "absolute", left: 150, top: 1140, opacity: eo(seg(p, 0.68, 0.86)) }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 16, letterSpacing: 3, color: FAINT }}>先查清楚</div>
        <div style={{ marginTop: 10, fontFamily: SERIF_STACK, fontSize: 34, color: INK_SOFT, letterSpacing: 1 }}>
          先把上下文查清楚，再决定问不问。
        </div>
      </div>
      <div style={{ position: "absolute", left: 150, top: 1224, width: 730, height: 1, background: INK, opacity: 0.14 * eo(seg(p, 0.68, 0.86)) }} />
    </AbsoluteFill>
  );
};

export default Scene07;
