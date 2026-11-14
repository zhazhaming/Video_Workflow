// Scene06 · 涨跌开关：消息点火，库存踩刹车
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, TopBar, Heading, Source, SERIF, MONO, SANS, INK, RED, GREEN, MUTED, easeOut, easeInOut, seg, mk, exitFade } from "./ui";

const Scene06: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m0 = mk(marks, 0, 0.05);
  const m2 = mk(marks, 2, 0.66);
  const tilt = -8 + 17 * easeInOut(seg(p, m0, m2));
  const cards = [0, 1, 2, 3].map((i) => easeOut(seg(p, m0 + i * 0.07, m0 + i * 0.07 + 0.15)));
  const verdict = easeOut(seg(p, m2, m2 + 0.18));

  const cardStyle = (i: number) => ({
    position: "absolute" as const,
    left: i % 2 === 0 ? 96 : 604,
    top: i < 2 ? 548 : 690,
    width: 368,
    padding: "16px 20px 14px",
    background: "rgba(255,249,237,0.84)",
    border: `2px solid ${i === 0 || i === 2 ? "rgba(200,69,45,0.45)" : "rgba(30,107,79,0.42)"}`,
    boxShadow: "0 8px 20px rgba(70,48,28,0.08)",
    opacity: cards[i],
    transform: `translateY(${(1 - cards[i]) * 18}px)`,
    boxSizing: "border-box" as const,
  });

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <TopBar label="涨跌开关 / 这一轮" right="情绪 vs 库存" />
        <Heading kicker="不是芯片突然变强了" title="是谁在按价格？" y={350} size={62} opacity={seg(p, 0, 0.2)} />

        <div style={cardStyle(0)}>
          <div style={{ fontFamily: MONO, fontSize: 16, color: RED, letterSpacing: 1 }}>01 / 消息</div>
          <div style={{ marginTop: 4, fontFamily: SANS, fontSize: 25, fontWeight: 700, color: INK }}>海外停产传闻</div>
          <div style={{ marginTop: 1, fontFamily: SANS, fontSize: 18, color: MUTED }}>先涨为敬，半天一个价</div>
        </div>
        <div style={cardStyle(1)}>
          <div style={{ fontFamily: MONO, fontSize: 16, color: RED, letterSpacing: 1 }}>02 / 情绪</div>
          <div style={{ marginTop: 4, fontFamily: SANS, fontSize: 25, fontWeight: 700, color: INK }}>连涨 11 个交易日</div>
          <div style={{ marginTop: 1, fontFamily: SANS, fontSize: 18, color: MUTED }}>5080 一度逼近 20000</div>
        </div>
        <div style={cardStyle(2)}>
          <div style={{ fontFamily: MONO, fontSize: 16, color: GREEN, letterSpacing: 1 }}>03 / 库存</div>
          <div style={{ marginTop: 4, fontFamily: SANS, fontSize: 25, fontWeight: 700, color: INK }}>双十一尾盘</div>
          <div style={{ marginTop: 1, fontFamily: SANS, fontSize: 18, color: MUTED }}>商家怕压货，想回款</div>
        </div>
        <div style={cardStyle(3)}>
          <div style={{ fontFamily: MONO, fontSize: 16, color: GREEN, letterSpacing: 1 }}>04 / 成交</div>
          <div style={{ marginTop: 4, fontFamily: SANS, fontSize: 25, fontWeight: 700, color: INK }}>让利出货</div>
          <div style={{ marginTop: 1, fontFamily: SANS, fontSize: 18, color: MUTED }}>价格松了，但没崩</div>
        </div>

        <div style={{ position: "absolute", left: 96, top: 838, width: 888, height: 170 }}>
          <div style={{ position: "absolute", left: 10, top: 70, width: 868, height: 6, background: INK, transform: `rotate(${tilt}deg)`, transformOrigin: "50% 50%" }} />
          <div style={{ position: "absolute", left: 434, top: 82, width: 0, height: 0, borderLeft: "40px solid transparent", borderRight: "40px solid transparent", borderBottom: `48px solid ${INK}` }} />
          <div style={{ position: "absolute", left: 0, top: 38, width: 62, height: 62, borderRadius: "50%", background: RED, color: "#FFF9ED", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 34, transform: `translateY(${tilt * 3}px)` }}>涨</div>
          <div style={{ position: "absolute", right: 0, top: 38, width: 62, height: 62, borderRadius: "50%", background: GREEN, color: "#FFF9ED", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 34, transform: `translateY(${-tilt * 3}px)` }}>跌</div>
          <div style={{ position: "absolute", left: 80, top: 0, fontFamily: MONO, fontSize: 16, color: RED }}>传闻 / 情绪</div>
          <div style={{ position: "absolute", right: 72, top: 0, fontFamily: MONO, fontSize: 16, color: GREEN }}>库存 / 回款</div>
        </div>

        <div style={{ position: "absolute", left: 96, top: 1090, opacity: verdict, transform: `translateY(${(1 - verdict) * 16}px)` }}>
          <div style={{ fontFamily: SERIF, fontSize: 54, fontWeight: 700, color: INK, letterSpacing: 1 }}>
            涨的是情绪，跌的也是。
          </div>
          <div style={{ marginTop: 8, width: 560 * verdict, height: 4, background: accent }} />
        </div>
        <div style={{ position: "absolute", left: 790, top: 1104, opacity: verdict, fontFamily: MONO, fontSize: 17, color: MUTED, textAlign: "right", lineHeight: 1.6 }}>
          价格
          <br />
          = 情绪 + 库存
        </div>
        <Source text="数据与商家判断：21世纪经济报道 2026-11-11；双十一尾盘指大促结束前的清货窗口。" y={1268} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene06;
