// Scene12 · 就业：数据中心承诺就业，但运营期用工很少；与此同时 AI 冲击白领岗位
// 左边一张“招聘启事”，右边一面机柜墙 + IMF 60% 暴露度；错位感是这镜的主角。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Card, Rack, Stamp, RED, BLUE, GOLD, INK, INK_SOFT, FAINT, MONO_STACK, SERIF_STACK, seg, eo, pop, clamp01 } from "./ui";

const Scene12: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const head = eo(seg(p, 0.04, 0.2));
  const card = eo(seg(p, 0.12, 0.3));
  const pct = 60;
  const racks = eo(seg(p, 0.36, 0.58));
  const stampT = pop(seg(p, 0.64, 0.76));
  const note = eo(seg(p, 0.66, 0.8));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="03 / 11 · 就业" x={108} y={300} color={BLUE} />
        <Cap text="JOBS / IMF" x={972} y={300} align="right" color={FAINT} />
        <Hair x={108} y={338} w={864} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 108, top: 390, opacity: head }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 64, fontWeight: 700, color: INK, letterSpacing: 2 }}>
          机房很大，用工很少。
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 19, letterSpacing: 2, color: FAINT, marginTop: 10 }}>
          数据中心的就业承诺 · AI 的岗位冲击
        </div>
      </div>

      {/* 左：招聘启事 */}
      <div style={{ opacity: card, transform: `translateY(${(1 - card) * 28}px)` }}>
        <Card x={300} y={890} w={360} h={380} accent={GOLD} rotate={-1.4}>
          <div style={{ position: "absolute", left: 22, top: 18, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 3, color: FAINT }}>
            NOW HIRING / 数据中心
          </div>
          <div style={{ position: "absolute", left: 22, top: 44, fontFamily: SERIF_STACK, fontSize: 34, fontWeight: 700, color: INK }}>
            招聘启事
          </div>
          {[
            { t: "电工", s: "高压证", y: 96 },
            { t: "安保", s: "三班倒", y: 150 },
            { t: "运维", s: "24 小时", y: 204 },
          ].map((r) => (
            <div key={r.t}>
              <div style={{ position: "absolute", left: 22, top: r.y, fontFamily: SERIF_STACK, fontSize: 28, color: INK }}>{r.t}</div>
              <div style={{ position: "absolute", right: 26, top: r.y + 5, fontFamily: MONO_STACK, fontSize: 15, color: FAINT }}>{r.s}</div>
              <div style={{ position: "absolute", left: 22, top: r.y + 38, width: 300, height: 1, background: INK, opacity: 0.1 }} />
            </div>
          ))}
          <div style={{ position: "absolute", left: 22, bottom: 58, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 2, color: RED }}>
            长期岗位：少
          </div>
          {/* 简历队列 */}
          <div style={{ position: "absolute", left: 22, bottom: 22, display: "flex", gap: 7 }}>
            {Array.from({ length: 14 }, (_, i) => (
              <div key={i} style={{ width: 9, height: 9, borderRadius: 5, background: i < 9 ? RED : INK, opacity: i < 9 ? 0.7 : 0.25 }} />
            ))}
          </div>
        </Card>
      </div>

      {/* 右上：IMF 60% */}
      <div style={{ position: "absolute", left: 640, top: 560, width: 330, opacity: enter }}>
        <div style={{ fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 3, color: FAINT }}>IMF / 2024</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 6 }}>
          <span style={{ fontFamily: SERIF_STACK, fontSize: 112, fontWeight: 700, color: RED, lineHeight: 1 }}>{Math.round(pct)}</span>
          <span style={{ fontFamily: MONO_STACK, fontSize: 42, color: RED }}>%</span>
        </div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 26, color: INK, marginTop: 4 }}>发达经济体岗位</div>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 26, color: INK_SOFT }}>暴露于 AI</div>
        <div style={{ width: 250, height: 1, background: INK, opacity: 0.16, marginTop: 16 }} />
        <div style={{ fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 1.5, color: FAINT, marginTop: 12, lineHeight: 1.6 }}>
          不是“已经失业”<br />是“随时可能被重写”
        </div>
      </div>

      {/* 右下：机柜墙，值班的人很少 */}
      <div style={{ position: "absolute", left: 640, top: 920, width: 340, opacity: racks }}>
        {Array.from({ length: 7 }, (_, i) => (
          <Rack key={i} x={i * 46} y={0} w={34} h={124} color={INK} opacity={0.82} filled={0.72} />
        ))}
        <div style={{ position: "absolute", left: 0, top: 132, width: 330, height: 2, background: INK, opacity: 0.25 }} />
        {[0, 1].map((i) => (
          <div key={i} style={{ position: "absolute", left: 70 + i * 64, top: 138, opacity: 0.9 }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, border: `2px solid ${RED}`, background: "rgba(252,248,240,0.9)" }} />
            <div style={{ width: 2, height: 18, background: RED, marginLeft: 6, marginTop: 3 }} />
          </div>
        ))}
        <div style={{ position: "absolute", left: 0, top: 178, fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 1.5, color: FAINT }}>
          值班的人，比机柜少
        </div>
      </div>

      <Stamp text="错位" sub="MISMATCH" x={840} y={1120} size={28} rotate={-7} t={stampT} w={170} color={RED} />

      <div style={{ position: "absolute", left: 108, top: 1210, opacity: note }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 29, color: INK_SOFT }}>
          被抢的岗位，和新建的岗位，不是同一批。
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 2, color: FAINT, marginTop: 12 }}>
          SOURCE: IMF / GOOD JOBS FIRST · 2024-2026
        </div>
      </div>

      <div style={{ position: "absolute", right: 108, top: 1300, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 1.5, color: FAINT, opacity: clamp01(note) }}>
        建设期热闹 · 运营期冷清
      </div>
    </AbsoluteFill>
  );
};

export default Scene12;
