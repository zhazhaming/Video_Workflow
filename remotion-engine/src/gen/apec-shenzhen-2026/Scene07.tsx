// Scene07 · 中国三次做东：2001 上海 → 2014 北京 → 2026 深圳
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { CHINA_POLYGONS, PROVINCE_POINTS } from "./chinaMap";
import {
  Paper, Cap, Hair, exitFade, mk, seg, easeOut, pop, clamp01,
  INK, INK_SOFT, OCEAN, CORAL, GOLD, CREAM, SERIF, SANS, MONO,
} from "./ui";

const byName = (n: string) => PROVINCE_POINTS.find((p) => p.name === n)!;
const BEIJING = byName("北京");
const SHANGHAI = byName("上海");
const SHENZHEN = { x: 676, y: 930 };
const CITY = [
  { ...SHANGHAI, year: "2001", name: "上海", dx: 22, dy: 14, color: OCEAN },
  { ...BEIJING, year: "2014", name: "北京", dx: 22, dy: -44, color: GOLD },
  { ...SHENZHEN, year: "2026", name: "深圳", dx: -118, dy: 26, color: CORAL },
];
const polyPath = (pts: [number, number][]) => "M " + pts.map(([x, y]) => `${x} ${y}`).join(" L ") + " Z";

const Scene07: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const m1 = mk(marks, 1, 0.32);
  const m2 = mk(marks, 2, 0.66);
  const ex = exitFade(p);
  const mapT = easeOut(seg(p, 0.02, 0.22));
  const routeT = easeOut(seg(p, 0.16, 0.6));
  const cityT = (i: number) => pop(seg(p, 0.24 + i * 0.11, 0.38 + i * 0.11));
  const timelineT = easeOut(seg(p, 0.52, 0.8));

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: SANS }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ position: "absolute", inset: 0, opacity: ex, transform: `translateY(${(1 - ex) * 6}px)` }}>
        <Cap text="CHINA / THREE TIMES" x={96} y={306} mono opacity={seg(p, 0.02, 0.1)} accent={accent} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 344,
            fontFamily: SERIF,
            fontSize: 44,
            color: INK,
            letterSpacing: 3,
            opacity: seg(p, 0.05, 0.16),
          }}
        >
          中国三次做东，这一次在深圳
        </div>

        {/* 简化中国地图 */}
        <div style={{ position: "absolute", inset: 0, opacity: mapT, transform: `scale(${0.96 + 0.04 * mapT})`, transformOrigin: "540px 820px" }}>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            {CHINA_POLYGONS.map((poly, i) => (
              <path
                key={i}
                d={polyPath(poly)}
                fill={i === 0 ? `${OCEAN}0d` : `${OCEAN}08`}
                stroke={i === 0 ? `${OCEAN}aa` : `${OCEAN}66`}
                strokeWidth={i === 0 ? 1.7 : 1}
                strokeLinejoin="round"
              />
            ))}
            {/* 三城航线 */}
            <path
              d={`M ${SHANGHAI.x} ${SHANGHAI.y} Q 740 730 ${BEIJING.x} ${BEIJING.y} Q 690 830 ${SHENZHEN.x} ${SHENZHEN.y}`}
              fill="none"
              stroke={CORAL}
              strokeWidth={2}
              opacity={0.55 * routeT}
              strokeLinecap="round"
            />
            <path
              d={`M ${SHANGHAI.x} ${SHANGHAI.y} Q 740 730 ${BEIJING.x} ${BEIJING.y} Q 690 830 ${SHENZHEN.x} ${SHENZHEN.y}`}
              fill="none"
              stroke={CORAL}
              strokeWidth={9}
              opacity={0.08 * routeT}
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* 三座城市节点 */}
        {CITY.map((c, i) => {
          const t = cityT(i);
          return (
            <div key={c.name} style={{ position: "absolute", left: c.x, top: c.y, opacity: clamp01(t) }}>
              <div
                style={{
                  position: "absolute",
                  left: -10,
                  top: -10,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: c.color,
                  transform: `scale(${t})`,
                  boxShadow: `0 0 0 ${6 + 8 * (i === 2 ? 1 : 0)}px ${c.color}18`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: c.dx,
                  top: c.dy,
                  width: c.name === "深圳" ? 94 : undefined,
                  whiteSpace: "nowrap",
                  textShadow: `0 1px 0 ${CREAM}, 0 0 10px ${CREAM}`,
                  textAlign: c.name === "深圳" ? "right" : "left",
                }}
              >
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: i === 2 ? 24 : 21,
                    fontWeight: i === 2 ? 700 : 600,
                    color: c.color,
                    letterSpacing: 2,
                  }}
                >
                  {c.name}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 12, color: c.color, letterSpacing: 2, marginTop: 3, opacity: 0.8 }}>
                  {c.year}
                </div>
              </div>
            </div>
          );
        })}

        {/* 底部时间轴 */}
        <div style={{ position: "absolute", left: 96, top: 1100, width: 888, opacity: timelineT }}>
          <div style={{ width: 888, height: 1.5, background: INK, opacity: 0.25 }} />
          {[
            { x: 0, year: "2001", label: "上海", color: OCEAN },
            { x: 400, year: "2014", label: "北京", color: GOLD },
            { x: 820, year: "2026", label: "深圳", color: CORAL },
          ].map((it, i) => (
            <div key={it.year} style={{ position: "absolute", left: it.x, top: -6 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: it.color, border: `2px solid ${CREAM}` }} />
              <div style={{ position: "absolute", left: i === 2 ? -58 : -10, top: 24, fontFamily: SERIF, fontSize: 30, color: it.color, fontWeight: 700 }}>{it.year}</div>
              <div style={{ position: "absolute", left: i === 2 ? -44 : 2, top: 62, fontFamily: SANS, fontSize: 17, color: INK_SOFT, letterSpacing: 2 }}>{it.label}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            right: 96,
            top: 516,
            fontFamily: SERIF,
            fontSize: 190,
            fontWeight: 700,
            color: CORAL,
            opacity: 0.09,
          }}
        >
          3
        </div>

        <Hair x={96} y={1280} w={888} progress={seg(p, 0.6, 0.82)} color={INK} opacity={0.14} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 1302,
            fontFamily: SANS,
            fontSize: 18,
            color: INK_SOFT,
            letterSpacing: 2,
            opacity: seg(p, 0.64, 0.84),
          }}
        >
          从黄浦江到雁栖湖，再到深圳湾，三座城市接住了同一张亚太桌子
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene07;
