// Scene10 · 谁拥有华为：16 万人持股，连接 30 亿人
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { CHINA_POLYGONS, PROVINCE_POINTS, SHENZHEN } from "./chinaMap";
import {
  Paper, Cap, Stamp, Signature, exitFade, seg, easeOut, easeInOut, pop, qPoint, clamp01,
  RED, INK, MUTED, LINE, STEEL, MONO, SANS, SERIF,
} from "./ui";

const MAJOR = ["北京", "上海", "广州", "成都", "西安", "武汉", "南京", "哈尔滨"];
const OFFSET: Record<string, [number, number]> = {
  北京: [8, -24],
  上海: [12, 10],
  广州: [-18, 22],
  成都: [-44, 12],
  西安: [-38, 20],
  武汉: [10, 18],
  南京: [10, -20],
  哈尔滨: [10, -22],
  深圳: [18, 16],
};
const byName = (name: string) => PROVINCE_POINTS.find((p) => p.name === name)!;
const major = MAJOR.map(byName);
const polyPath = (pts: [number, number][]) => "M " + pts.map(([x, y]) => `${x} ${y}`).join(" L ") + " Z";

const Scene10: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = marks && marks[1] ? marks[1].start : 0.4;
  const grid = seg(p, 0.03, 0.26);
  const hold = 1 - seg(p, 0.4, 0.5);
  const mapIn = easeOut(seg(p, 0.4, 0.56));
  const draw = easeInOut(seg(p, 0.44, 0.78));
  const arcs = seg(p, 0.52, 0.84);
  const count = 16.2 * easeOut(seg(p, 0.03, 0.28));
  const billion = 30 * easeOut(seg(p, 0.62, 0.86));
  const sx = SHENZHEN.x;
  const sy = SHENZHEN.y;

  return (
    <AbsoluteFill>
      <Paper c1={c1} c2={c2} accent={accent} />
      <AbsoluteFill style={{ opacity: exitFade(p) }}>
        <Signature />
        <Cap text="谁拥有华为" x={150} y={330} opacity={seg(p, 0.02, 0.1)} />
        <div style={{ position: "absolute", left: 150, top: 372, fontFamily: SERIF, fontSize: 42, color: INK, opacity: seg(p, 0.02, 0.1) * hold }}>
          公司，在员工手里
        </div>

        {/* 员工持股点阵 */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: hold }}>
          <div style={{ position: "absolute", left: 150, top: 466, opacity: seg(p, 0.03, 0.12) }}>
            <div style={{ fontFamily: SANS, fontSize: 20, color: MUTED, letterSpacing: 3 }}>持股员工</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontFamily: MONO, fontSize: 112, fontWeight: 700, color: INK, letterSpacing: -6 }}>{count.toFixed(1)}</span>
              <span style={{ fontFamily: SERIF, fontSize: 34, color: INK }}>万人</span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: MUTED, letterSpacing: 1, marginTop: 4 }}>161,749 SHAREHOLDERS</div>
          </div>

          <Cap text="任正非持股" x={150} y={730} opacity={seg(p, 0.22, 0.32)} />
          <div style={{ position: "absolute", left: 150, top: 768, fontFamily: MONO, fontSize: 88, fontWeight: 700, color: RED, letterSpacing: -4, opacity: seg(p, 0.22, 0.32) }}>
            0.65%
          </div>

          <div style={{ position: "absolute", left: 466, top: 500, width: 360, height: 312 }}>
            {Array.from({ length: 12 }, (_, r) =>
              Array.from({ length: 14 }, (_, c) => {
                const i = r * 14 + c;
                const t = clamp01(grid * 168 - i * 0.45);
                const isRen = i === 86;
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute", left: c * 26, top: r * 26,
                      width: isRen ? 15 : 9, height: isRen ? 15 : 9,
                      marginLeft: isRen ? -3 : 0, marginTop: isRen ? -3 : 0,
                      borderRadius: "50%",
                      background: isRen ? RED : INK,
                      opacity: t * (isRen ? 1 : 0.42),
                      transform: `scale(${0.4 + 0.6 * t})`,
                      boxShadow: isRen ? "0 0 0 12px rgba(207,10,44,0.13)" : undefined,
                    }}
                  />
                );
              }),
            )}
            <div style={{ position: "absolute", left: 14 * 26 + 18, top: 6 * 26 - 6, fontFamily: SANS, fontSize: 15, color: RED, letterSpacing: 1, opacity: seg(p, 0.26, 0.36), whiteSpace: "nowrap" }}>
              任正非
            </div>
          </div>

          <div style={{ position: "absolute", left: 466, top: 840, fontFamily: SANS, fontSize: 16, color: MUTED, letterSpacing: 2, opacity: seg(p, 0.28, 0.38) }}>
            每一个点，代表一名持股员工
          </div>

          <Stamp text="不上市" x={806} y={430} size={40} rotate={-9} t={seg(p, 0.24, 0.34)} />
        </div>

        {/* 中国地图 */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: mapIn }}>
          <div style={{ position: "absolute", inset: 0, transform: "scale(1.08)", transformOrigin: "560px 760px" }}>
            <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
              {CHINA_POLYGONS.map((poly, i) => (
                <path
                  key={i}
                  d={polyPath(poly)}
                  fill={i === 0 ? "rgba(62,90,107,0.17)" : "rgba(62,90,107,0.11)"}
                  stroke="rgba(16,24,32,0.78)"
                  strokeWidth={i === 0 ? 2.6 : 1.8}
                  strokeLinejoin="round"
                />
              ))}
              {PROVINCE_POINTS.map((pt) => (
                <circle key={pt.name} cx={pt.x} cy={pt.y} r="3" fill={INK} opacity={0.42 * arcs} />
              ))}
              {major.map((pt, i) => {
                const local = clamp01(arcs * 1.6 - i * 0.08);
                const d = `M ${sx} ${sy} Q ${(sx + pt.x) / 2} ${Math.min(sy, pt.y) - 70} ${pt.x} ${pt.y}`;
                return (
                  <path
                    key={pt.name}
                    d={d}
                    fill="none"
                    stroke={RED}
                    strokeWidth="2.1"
                    strokeDasharray="5 7"
                    pathLength={1}
                    strokeDashoffset={1 - local}
                    opacity={0.72}
                  />
                );
              })}
              {major.map((pt, i) => {
                const tt = (p * 1.5 + i * 0.17) % 1;
                const q = qPoint(sx, sy, pt.x, pt.y, 70, tt);
                return <circle key={`p-${pt.name}`} cx={q.x} cy={q.y} r="4" fill={RED} opacity={arcs > 0.7 ? 0.9 : 0} />;
              })}
              <circle cx={sx} cy={sy} r="16" fill="none" stroke={RED} strokeWidth="2" opacity="0.45" />
              <circle cx={sx} cy={sy} r={9 + 3 * Math.sin(p * 10)} fill={RED} />
            </svg>

            {major.map((pt) => {
              const [dx, dy] = OFFSET[pt.name] ?? [10, 10];
              return (
                <div key={`label-${pt.name}`} style={{ position: "absolute", left: pt.x + dx, top: pt.y + dy, fontFamily: SANS, fontSize: 15, color: INK, letterSpacing: 1, whiteSpace: "nowrap", opacity: seg(p, 0.58, 0.7), textShadow: "0 1px 0 rgba(248,250,251,0.98), 0 0 8px rgba(248,250,251,0.95)" }}>
                  {pt.name}
                </div>
              );
            })}
            <div style={{ position: "absolute", left: sx + 18, top: sy + 14, fontFamily: SANS, fontSize: 24, fontWeight: 700, color: RED, letterSpacing: 2, opacity: seg(p, 0.48, 0.6), textShadow: "0 1px 0 rgba(248,250,251,0.98), 0 0 10px rgba(248,250,251,0.95)" }}>
              深圳
            </div>
          </div>

          <div style={{ position: "absolute", left: 150, top: 402, fontFamily: SERIF, fontSize: 42, color: INK, letterSpacing: 1, opacity: seg(p, 0.5, 0.6) }}>
            从深圳，连向世界
          </div>
          <div style={{ position: "absolute", left: 150, top: 456, fontFamily: MONO, fontSize: 12, color: MUTED, letterSpacing: 2, opacity: seg(p, 0.52, 0.62) }}>
            SHENZHEN · HQ / 170+ MARKETS
          </div>
        </div>

        {/* 30 亿人 */}
        <div style={{ position: "absolute", left: 150, top: 1010, opacity: seg(p, 0.6, 0.7) }}>
          <div style={{ fontFamily: SANS, fontSize: 19, color: MUTED, letterSpacing: 3 }}>全球服务人口</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: MONO, fontSize: 118, fontWeight: 700, color: RED, letterSpacing: -6, lineHeight: 0.95 }}>{Math.round(billion)}</span>
            <span style={{ fontFamily: SERIF, fontSize: 38, color: INK }}>亿人</span>
          </div>
        </div>
        <div style={{ position: "absolute", right: 150, top: 1046, opacity: seg(p, 0.66, 0.78) }}>
          <div style={{ padding: "12px 18px", border: `2px solid ${INK}`, background: "rgba(248,250,251,0.8)" }}>
            <div style={{ fontFamily: MONO, fontSize: 36, fontWeight: 700, color: INK, letterSpacing: -1 }}>170+</div>
            <div style={{ fontFamily: SANS, fontSize: 14, color: MUTED, letterSpacing: 2 }}>国家和地区</div>
          </div>
        </div>

        <div style={{ position: "absolute", left: 150, top: 1198, fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: 2, opacity: 0.65 * seg(p, 0.7, 0.8) }}>
          地图仅为示意 · 边界简化自公开地理数据
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene10;
