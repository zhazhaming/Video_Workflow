// Scene10 · 怎么上手：一条命令安装，先跑 try 走一遍问答
// 上：安装命令逐字敲出，进度条走完；下：一张试跑卡问“选个颜色”，选项被点亮。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, TermWin, Card, Chip, Stamp, INK, INK_SOFT, FAINT, TEAL, RED, GOLD, MONO_STACK, SERIF_STACK, seg, eo, pop, lerp, clamp01 } from "./ui";

const CMD = "irm .../install.ps1 | iex";

const Scene10: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const typed = Math.floor(CMD.length * eo(seg(p, 0.1, 0.38)));
  const prog = eo(seg(p, 0.34, 0.56));
  const cardIn = pop(seg(p, 0.48, 0.66));
  const pick = eo(seg(p, 0.72, 0.84));
  const done = eo(seg(p, 0.84, 0.94));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="10 / 怎么装" x={150} y={330} />
        <Cap text="一条命令" x={880} y={330} align="right" color={FAINT} />
        <Hair x={150} y={368} w={300} color={TEAL} thickness={2} progress={eo(seg(p, 0.08, 0.32))} opacity={0.65} />
      </div>

      <Chip text="NODE 24+" x={700} y={398} w={168} color={TEAL} bg="rgba(31,95,87,0.10)" size={17} opacity={eo(seg(p, 0.06, 0.2))} />

      <TermWin x={540} y={560} w={700} h={214} title="安装" opacity={eo(seg(p, 0.03, 0.16))} dark={false}>
        <div style={{ padding: "22px 26px", fontFamily: MONO_STACK, fontSize: 22, color: INK }}>
          <span style={{ color: TEAL }}>&#8250; </span>
          {CMD.slice(0, typed)}
          <span style={{ opacity: 0.5 + 0.5 * Math.sin(p * 48) }}>_</span>
        </div>
        <div style={{ position: "absolute", left: 26, right: 26, bottom: 22, height: 8, borderRadius: 4, background: "rgba(24,22,19,0.08)", overflow: "hidden" }}>
          <div style={{ width: `${prog * 100}%`, height: 8, background: TEAL, opacity: 0.8 }} />
        </div>
        <div style={{ position: "absolute", left: 26, bottom: 38, fontFamily: MONO_STACK, fontSize: 13, color: FAINT, letterSpacing: 1 }}>
          {prog < 0.99 ? "正在下载安装…" : "装好了"}
        </div>
      </TermWin>

      <div style={{ position: "absolute", left: 540, top: 690, width: 2, height: 40, backgroundImage: `repeating-linear-gradient(180deg, ${INK} 0 5px, transparent 5px 11px)`, opacity: 0.25 }} />

      <Card x={540} y={884} w={570} h={286} opacity={clamp01(cardIn * 1.4)} scale={0.92 + 0.08 * cardIn} accent={TEAL}>
        <div style={{ position: "absolute", left: 24, top: 18, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 2, color: TEAL }}>agent-autoloop try</div>
        <div style={{ position: "absolute", left: 24, top: 48, fontFamily: SERIF_STACK, fontSize: 30, color: INK }}>试跑：选一个颜色</div>
        <div style={{ position: "absolute", left: 24, top: 92, width: 520, height: 1, background: INK, opacity: 0.12 }} />
        {["蓝色", "绿色"].map((t, i) => {
          const on = i === 1 && pick > 0.35;
          return (
            <div
              key={t}
              style={{
                position: "absolute", left: 24, top: 110 + i * 64, width: 522, height: 52,
                border: `1.2px solid ${on ? TEAL : INK + "22"}`, borderRadius: 7,
                background: on ? `${TEAL}12` : "transparent",
                display: "flex", alignItems: "center", paddingLeft: 18,
                fontFamily: MONO_STACK, fontSize: 19, color: on ? TEAL : INK_SOFT,
                transform: `scale(${on ? 1 : 0.995})`,
              }}
            >
              <span style={{ width: 26, color: FAINT, fontSize: 14 }}>0{i + 1}</span>
              {t}
              {on ? <span style={{ marginLeft: "auto", marginRight: 18, fontSize: 17 }}>&#10003;</span> : null}
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 24, bottom: 16, fontFamily: MONO_STACK, fontSize: 13, color: FAINT }}>答完它就会接着干</div>
      </Card>

      <div style={{ position: "absolute", left: 760, top: 1024, opacity: done }}>
        <Stamp text="跑通了" x={0} y={0} size={26} rotate={-8} t={done} color={TEAL} />
      </div>

      <div style={{ position: "absolute", left: 150, top: 1180, opacity: eo(seg(p, 0.66, 0.86)) }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 16, letterSpacing: 3, color: FAINT }}>先试一遍</div>
        <div style={{ marginTop: 8, fontFamily: SERIF_STACK, fontSize: 32, color: INK_SOFT }}>先跑一遍，再写规则。</div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene10;
