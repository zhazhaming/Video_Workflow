// Scene02 · 结果：左边是账单，右边是选票；2026 中期选举把两者结算
// 红蓝分栏 + 参众两院色块；先给“成本”，再给“选票”，把因果摆在同一屏。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Card, Stamp, RED, BLUE, GOLD, INK, INK_SOFT, FAINT, MONO_STACK, SERIF_STACK, seg, eo, pop, clamp01 } from "./ui";

const Scene02: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.12));
  const line = eo(seg(p, 0.12, 0.32));
  const left = eo(seg(p, 0.08, 0.28));
  const right = eo(seg(p, 0.26, 0.48));
  const bars = eo(seg(p, 0.46, 0.7));
  const stampT = pop(seg(p, 0.68, 0.8));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="09 / 11 · 结果" x={108} y={300} color={BLUE} />
        <Cap text="2026 MIDTERMS" x={972} y={300} align="right" color={FAINT} />
        <Hair x={108} y={338} w={864} color={INK} opacity={0.2} progress={enter} />
      </div>

      <div style={{ position: "absolute", left: 108, top: 390, opacity: enter }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 62, fontWeight: 700, color: INK, letterSpacing: 2 }}>
          账单到期，选票结账。
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 19, letterSpacing: 3, color: FAINT, marginTop: 10 }}>
          2026.11.03 · 美国中期选举
        </div>
      </div>

      {/* 左：账单 */}
      <div style={{ opacity: left, transform: `translateY(${(1 - left) * 24}px)` }}>
        <Card x={300} y={860} w={360} h={430} accent={GOLD} rotate={-1.4}>
          <div style={{ position: "absolute", left: 24, top: 20, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 3, color: FAINT }}>
            THE BILL / 成本
          </div>
          <div style={{ position: "absolute", left: 24, top: 48, fontFamily: SERIF_STACK, fontSize: 40, fontWeight: 700, color: INK }}>
            账单
          </div>
          {[
            { t: "电费", v: "↑", y: 118, c: RED },
            { t: "水耗", v: "↑", y: 182, c: BLUE },
            { t: "税收", v: "↓", y: 246, c: GOLD },
          ].map((r) => (
            <div key={r.t}>
              <div style={{ position: "absolute", left: 24, top: r.y, fontFamily: SERIF_STACK, fontSize: 32, color: INK }}>{r.t}</div>
              <div style={{ position: "absolute", right: 34, top: r.y - 4, fontFamily: MONO_STACK, fontSize: 34, color: r.c }}>{r.v}</div>
              <div style={{ position: "absolute", left: 24, top: r.y + 44, width: 300, height: 1, background: INK, opacity: 0.1 }} />
            </div>
          ))}
          <div style={{ position: "absolute", left: 24, bottom: 66, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 2, color: FAINT }}>
            成本留在本地
          </div>
          <div style={{ position: "absolute", left: 24, bottom: 24, fontFamily: SERIF_STACK, fontSize: 30, color: RED }}>
            谁来付？
          </div>
        </Card>
      </div>

      {/* 分界 */}
      <div style={{ position: "absolute", left: 538, top: 540, width: 2, height: 760 * line, background: RED, opacity: 0.55 }} />
      <div style={{ position: "absolute", left: 526, top: 520 - 24 * line, width: 26, height: 26, borderRadius: 13, border: `2px solid ${RED}`, opacity: line }} />

      {/* 右：选票 */}
      <div style={{ opacity: right, transform: `translateY(${(1 - right) * 24}px)` }}>
        <Card x={780} y={860} w={360} h={430} accent={BLUE} rotate={1.2}>
          <div style={{ position: "absolute", left: 24, top: 20, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 3, color: BLUE }}>
            THE VOTE / 选票
          </div>
          <div style={{ position: "absolute", left: 24, top: 46, fontFamily: MONO_STACK, fontSize: 26, color: INK, letterSpacing: 1 }}>
            2026.11.03
          </div>
          <div style={{ position: "absolute", left: 24, top: 86, fontFamily: SERIF_STACK, fontSize: 50, fontWeight: 700, color: BLUE, letterSpacing: 1 }}>
            BLUE WAVE
          </div>
          <div style={{ position: "absolute", left: 24, top: 148, fontFamily: SERIF_STACK, fontSize: 30, color: INK }}>
            民主党拿下参众两院
          </div>

          {[
            { name: "HOUSE", y: 220, pct: 0.53 },
            { name: "SENATE", y: 286, pct: 0.51 },
          ].map((b) => (
            <div key={b.name} style={{ position: "absolute", left: 24, top: b.y, width: 312 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO_STACK, fontSize: 13, letterSpacing: 2, color: FAINT }}>
                <span>{b.name}</span>
                <span style={{ color: BLUE }}>DEM</span>
              </div>
              <div style={{ position: "relative", marginTop: 6, height: 14, background: "rgba(166,58,43,0.16)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, height: 14, width: `${b.pct * 100 * bars}%`, background: BLUE }} />
                <div style={{ position: "absolute", left: "50%", top: -4, width: 1, height: 22, background: INK, opacity: 0.35 }} />
              </div>
            </div>
          ))}
          <div style={{ position: "absolute", left: 24, bottom: 26, fontFamily: MONO_STACK, fontSize: 14, letterSpacing: 2, color: FAINT }}>
            数据中心议题 · 胜负手
          </div>
        </Card>
      </div>

      <Stamp text="结算" x={540} y={1130} size={30} rotate={-8} t={stampT} w={140} color={RED} />

      <div style={{ position: "absolute", left: 108, top: 1240, opacity: clamp01(right) }}>
        <div style={{ fontFamily: SERIF_STACK, fontSize: 28, color: INK_SOFT }}>
          账单，变成了选票。
        </div>
      </div>

      <div style={{ position: "absolute", left: 108, top: 1300, fontFamily: MONO_STACK, fontSize: 15, letterSpacing: 2, color: FAINT, opacity: clamp01(right) }}>
        SOURCE: CBS / NPR · 2026.11
      </div>
    </AbsoluteFill>
  );
};

export default Scene02;
