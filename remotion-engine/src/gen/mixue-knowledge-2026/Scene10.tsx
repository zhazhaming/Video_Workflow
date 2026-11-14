// Scene10 · 从郑州出发：中国各省市门店网络（示意）
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { CHINA_POLYGONS, PROVINCE_POINTS, ZHENGZHOU } from "./chinaMap";
import {
  Paper, Cap, Counter, Signature, exitFade, mk, seg, easeOut, pop, clamp01,
  RED, INK, MUTED, CREAM,
} from "./ui";

const MAJOR = ["北京", "上海", "广州", "成都", "乌鲁木齐", "哈尔滨", "拉萨"];
const LABEL_OFFSET: Record<string, [number, number]> = {
  北京: [10, -10],
  上海: [10, 12],
  广州: [-12, 18],
  成都: [-46, 12],
  乌鲁木齐: [-26, -12],
  哈尔滨: [10, -10],
  拉萨: [-24, 18],
  郑州: [12, 18],
};
const byName = (name: string) => PROVINCE_POINTS.find((p) => p.name === name)!;
const major = MAJOR.map(byName);

const polyPath = (pts: [number, number][]) =>
  "M " + pts.map(([x, y]) => `${x} ${y}`).join(" L ") + " Z";

const Scene10: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = mk(marks, 1, 0.5);
  const mapIn = easeOut(seg(p, 0.02, 0.18));
  const draw = easeOut(seg(p, 0.16, 0.8));
  const zx = ZHENGZHOU.x;
  const zy = ZHENGZHOU.y;

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <Signature />
        <Cap text="从郑州出发" x={96} y={330} opacity={seg(p, 0.02, 0.1)} />
        <div style={{ position: "absolute", left: 96, top: 368, fontFamily: '"Songti SC",serif', fontSize: 40, color: INK, opacity: seg(p, 0.05, 0.16) }}>
          每一家店，都从郑州连出去
        </div>

        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: mapIn, transform: `scale(${0.97 + 0.03 * mapIn})`, transformOrigin: "540px 760px" }}>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            {CHINA_POLYGONS.map((poly, i) => (
              <path
                key={i}
                d={polyPath(poly)}
                fill={i === 0 ? "rgba(78,107,79,0.10)" : "rgba(78,107,79,0.07)"}
                stroke="rgba(27,23,20,0.62)"
                strokeWidth={i === 0 ? 2.2 : 1.6}
                strokeLinejoin="round"
              />
            ))}
            {PROVINCE_POINTS.filter((pt) => pt.name !== "郑州").map((pt, i) => {
              const isMajor = MAJOR.includes(pt.name);
              const mx = (zx + pt.x) / 2;
              const my = Math.min(zy, pt.y) - 58;
              const local = clamp01(draw * 1.5 - i * 0.012);
              return (
                <path
                  key={pt.name}
                  d={`M ${zx} ${zy} Q ${mx} ${my} ${pt.x} ${pt.y}`}
                  fill="none"
                  stroke={isMajor ? RED : "rgba(215,38,30,0.55)"}
                  strokeWidth={isMajor ? 2.4 : 1.2}
                  strokeDasharray="0.01 0.018"
                  pathLength={1}
                  strokeDashoffset={1 - local}
                  opacity={isMajor ? 0.62 : 0.28}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
        </div>

        {PROVINCE_POINTS.map((pt, i) => {
          const t = pop(seg(p, 0.1 + i * 0.008, 0.24 + i * 0.008));
          const isHome = pt.name === "郑州";
          const r = isHome ? 8 : MAJOR.includes(pt.name) ? 4.6 : 3.4;
          return (
            <div
              key={pt.name}
              style={{
                position: "absolute", left: pt.x - r, top: pt.y - r,
                width: r * 2, height: r * 2, borderRadius: "50%",
                background: isHome ? RED : MAJOR.includes(pt.name) ? RED : INK,
                opacity: clamp01(t) * (isHome ? 1 : MAJOR.includes(pt.name) ? 0.85 : 0.55),
                transform: `scale(${t})`,
                boxShadow: isHome ? "0 0 0 10px rgba(215,38,30,0.13)" : undefined,
              }}
            />
          );
        })}

        {[...major, ZHENGZHOU].map((pt) => {
          const [dx, dy] = LABEL_OFFSET[pt.name] ?? [10, 10];
          const isHome = pt.name === "郑州";
          return (
            <div
              key={`label-${pt.name}`}
              style={{
                position: "absolute", left: pt.x + dx, top: pt.y + dy,
                fontFamily: '"Microsoft YaHei",sans-serif',
                fontSize: isHome ? 22 : 16,
                fontWeight: isHome ? 700 : 500,
                color: isHome ? RED : INK,
                letterSpacing: 1,
                whiteSpace: "nowrap",
                opacity: seg(p, 0.24, 0.4),
                textShadow: "0 1px 0 rgba(255,249,237,0.9), 0 0 8px rgba(255,249,237,0.8)",
              }}
            >
              {pt.name}
            </div>
          );
        })}

        <div style={{ position: "absolute", left: 96, top: 1018, padding: "8px 16px", background: "rgba(255,249,237,0.82)", borderRadius: 8, opacity: seg(p, 0.4, 0.55) }}>
          <div style={{ fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 20, color: MUTED, letterSpacing: 3 }}>全球门店</div>
          <Counter value={5} x={0} y={38} size={92} suffix="万+" suffixSize={34} color={RED} />
        </div>
        <div style={{ position: "absolute", left: 640, top: 1032, padding: "8px 16px", background: CREAM, border: `2px solid ${INK}`, borderRadius: 4, fontFamily: '"Microsoft YaHei",sans-serif', fontSize: 22, color: INK, letterSpacing: 2, opacity: seg(p, m1 + 0.2, m1 + 0.36) }}>
          17 个海外市场
        </div>
        <div style={{ position: "absolute", left: 640, top: 1082, width: 260, height: 3, background: RED, opacity: 0.7 * seg(p, 0.6, 0.8) }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene10;
