// Scene01 · 开场：一张横跨太平洋的 21 节点网络，光点落到深圳
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import {
  Paper, Cap, Hair, BigSerif, exitFade, seg, easeOut, clamp01,
  quadPoint, INK, INK_SOFT, OCEAN, CORAL, GOLD, SERIF, SANS,
} from "./ui";

const NODES = Array.from({ length: 21 }, (_, i) => {
  const u = i / 20;
  const x = 128 + u * 824;
  const y = 820 - Math.sin(u * Math.PI) * 210 + Math.sin(i * 1.37) * 18;
  const h = 34 + (0.5 + 0.5 * Math.sin(i * 1.9 + 0.4)) * 122;
  return { x, y, h, delay: i * 0.026 };
});

const Scene01: React.FC<GenSceneProps> = ({ p, c1, c2, accent, marks }) => {
  const ex = exitFade(p);

  const stems = easeOut(seg(p, 0.02, 0.25));
  const netT = easeOut(seg(p, 0.08, 0.36));
  const shenzhenT = seg(p, 0.18, 0.34);
  const routeT = easeOut(seg(p, 0.3, 0.72));
  const ringPulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 5.2);
  const travel = seg(p, 0.34, 0.74);
  const [dotX, dotY] = quadPoint([132, 988], [470, 760], [800, 1022], travel);
  const end = ex;

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: SANS }}>
      <Paper c1={c1} c2={c2} accent={accent} />

      <div style={{ position: "absolute", inset: 0, opacity: end, transform: `scale(${1 - 0.025 * (1 - ex)})` }}>
        {/* 背景巨号 21，做版面锚点 */}
        <BigSerif text="21" x={86} y={438} size={240} color={INK} opacity={0.045 * stems} />

        <Cap text="PACIFIC / 2026" x={96} y={306} mono opacity={seg(p, 0.02, 0.1)} accent={accent} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 344,
            fontFamily: SERIF,
            fontSize: 42,
            color: INK,
            letterSpacing: 4,
            opacity: seg(p, 0.05, 0.16),
          }}
        >
          一张跨太平洋的桌子
        </div>

        {/* 21 根“水面上的桅杆” */}
        {NODES.map((n, i) => {
          const t = easeOut(seg(p, n.delay, n.delay + 0.2));
          const active = i === 20;
          return (
            <div key={i} style={{ position: "absolute", left: n.x, top: 0, width: 1, height: 1920 }}>
              <div
                style={{
                  position: "absolute",
                  left: -0.5,
                  top: n.y,
                  width: 1.5,
                  height: (n.h + 56) * t,
                  background: active ? CORAL : OCEAN,
                  opacity: active ? 0.7 : 0.22,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: active ? -10 : -5,
                  top: n.y - (n.h + 40) * t,
                  width: active ? 20 : 10,
                  height: active ? 20 : 10,
                  borderRadius: "50%",
                  background: active ? CORAL : i % 4 === 0 ? GOLD : OCEAN,
                  opacity: t,
                  transform: `scale(${t})`,
                  boxShadow: active ? `0 0 0 ${8 + ringPulse * 10}px ${CORAL}18` : undefined,
                }}
              />
              {active ? (
                <>
                  <div
                    style={{
                      position: "absolute",
                      left: -31 - ringPulse * 12,
                      top: n.y - (n.h + 40) - 21 - ringPulse * 12,
                      width: 62 + ringPulse * 24,
                      height: 62 + ringPulse * 24,
                      borderRadius: "50%",
                      border: `1.5px solid ${CORAL}`,
                      opacity: 0.28 * shenzhenT,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      right: 18,
                      top: n.y - (n.h + 64),
                      width: 80,
                      textAlign: "right",
                      fontFamily: SANS,
                      fontSize: 18,
                      color: CORAL,
                      letterSpacing: 2,
                      whiteSpace: "nowrap",
                      opacity: shenzhenT,
                    }}
                  >
                    深圳
                  </div>
                </>
              ) : null}
            </div>
          );
        })}

        {/* 连接 21 个节点的细航线 */}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: netT }}>
          {NODES.slice(0, 20).map((n, i) => {
            const m = NODES[i + 1];
            const mx = (n.x + m.x) / 2;
            const my = Math.min(n.y - n.h, m.y - m.h) - 44;
            return (
              <path
                key={`net-${i}`}
                d={`M ${n.x} ${n.y - n.h - 46} Q ${mx} ${my} ${m.x} ${m.y - m.h - 46}`}
                fill="none"
                stroke={i % 4 === 0 ? GOLD : OCEAN}
                strokeWidth={i % 4 === 0 ? 1.4 : 0.8}
                opacity={i % 4 === 0 ? 0.34 : 0.18}
              />
            );
          })}
        </svg>

        {/* 从太平洋左岸到深圳的主航线 */}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <path
            d="M 132 988 Q 470 760 800 1022"
            fill="none"
            stroke={CORAL}
            strokeWidth={2.4}
            opacity={0.42 * routeT}
            strokeLinecap="round"
          />
          <path
            d="M 132 988 Q 470 760 800 1022"
            fill="none"
            stroke={CORAL}
            strokeWidth={7}
            opacity={0.08 * routeT}
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            left: dotX - 7,
            top: dotY - 7,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: CORAL,
            opacity: clamp01(travel * 2) * (travel < 0.98 ? 1 : 0.55),
            boxShadow: `0 0 0 8px ${CORAL}18, 0 0 24px ${CORAL}66`,
          }}
        />

        {/* 左岸起点 / 右岸终点的小刻度 */}
        <div style={{ position: "absolute", left: 122, top: 1000, fontFamily: SANS, fontSize: 17, color: INK_SOFT, letterSpacing: 2, opacity: routeT }}>
          <div style={{ width: 72, height: 1, background: OCEAN, opacity: 0.55, marginBottom: 10 }} />
          亚太经济体
        </div>

        {/* 底部编辑性信息 */}
        <Hair x={96} y={1138} w={888} progress={seg(p, 0.5, 0.72)} color={INK} opacity={0.16} />
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 1162,
            display: "flex",
            gap: 42,
            fontFamily: SANS,
            fontSize: 20,
            color: INK_SOFT,
            letterSpacing: 2,
            opacity: seg(p, 0.56, 0.72),
          }}
        >
          <span>21 个成员经济体</span>
          <span>3 个观察员</span>
          <span>一张协商桌</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene01;
