// Scene08 · 排队的人，坐不满的桌（餐厅比方）
// 左边等位号越叠越高，右边桌上的转盘只慢慢挪——排队在涨，翻台没跟上。
import React from "react";
import { AbsoluteFill } from "remotion";
import type { GenSceneProps } from "../types";
import { Paper, Cap, Hair, Stamp, INK, INK_SOFT, FAINT, RED, seg, eo, lerp } from "./ui";

const TABLE = { x: 760, y: 700, r: 118 };

const Scene08: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const enter = eo(seg(p, 0, 0.1));
  const queue = seg(p, 0.08, 0.62);
  const clock = eo(seg(p, 0.2, 0.9));
  const gauge = eo(seg(p, 0.5, 0.7));
  const seal = seg(p, 0.68, 0.8);

  const tickets = 6;
  const ang = -90 + 120 * clock; // 只转 120°，慢

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper c1={c1} c2={c2} accent={accent} />
      <div style={{ opacity: enter }}>
        <Cap text="比方 / 一家餐厅" x={96} y={318} size={20} />

        {/* 等位号 */}
        {Array.from({ length: tickets }).map((_, i) => {
          const k = eo(seg(queue, i * 0.09, i * 0.09 + 0.14));
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 110 + (i % 2) * 10,
                top: 470 + i * 96,
                width: 300,
                height: 74,
                background: "#FBF7EE",
                border: `2px solid ${INK}22`,
                boxShadow: `0 ${6 + i * 2}px 0 ${INK}0A`,
                transform: `translateY(${(1 - k) * 26}px) rotate(${(i % 2 ? 1 : -1) * 1.2}deg)`,
                opacity: k,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 22px",
              }}
            >
              <span style={{ fontFamily: '"SF Mono", monospace', fontSize: 30, color: INK }}>A00{i + 1}</span>
              <span style={{ fontFamily: '"Songti SC", serif', fontSize: 18, color: FAINT }}>等位</span>
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 110, top: 1064, opacity: queue, fontFamily: '"Songti SC", serif', fontSize: 26, color: RED }}>
          越排越长 →
        </div>

        {/* 桌子 */}
        <div style={{ position: "absolute", left: TABLE.x - TABLE.r, top: TABLE.y - TABLE.r, width: TABLE.r * 2, height: TABLE.r * 2, borderRadius: "50%", border: `3px solid ${INK}`, background: "#FBF7EE" }} />
        {[0, 1, 2, 3].map((i) => {
          const a = (Math.PI / 2) * i + Math.PI / 4;
          const cx = TABLE.x + Math.cos(a) * (TABLE.r + 46);
          const cy = TABLE.y + Math.sin(a) * (TABLE.r + 46);
          return <div key={i} style={{ position: "absolute", left: cx - 32, top: cy - 32, width: 64, height: 64, borderRadius: 32, border: `2px solid ${INK}`, background: "#F5EFE4", opacity: 0.9 }} />;
        })}
        {/* 转盘指针 */}
        <div
          style={{
            position: "absolute", left: TABLE.x - 2, top: TABLE.y - 2, width: 4, height: TABLE.r - 18,
            background: RED, transformOrigin: "50% 2px", transform: `rotate(${ang}deg)`,
          }}
        />
        <div style={{ position: "absolute", left: TABLE.x - 8, top: TABLE.y - 8, width: 16, height: 16, borderRadius: 8, background: INK }} />

        {/* 翻台率 */}
        <div style={{ position: "absolute", left: 604, top: 960, width: 300, opacity: gauge }}>
          <div style={{ fontFamily: '"SF Mono", monospace', fontSize: 17, color: FAINT, letterSpacing: 3 }}>翻台率</div>
          <div style={{ marginTop: 12, height: 12, background: `${INK}12`, position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: 12, width: 300 * 0.32 * gauge, background: INK, opacity: 0.75 }} />
            <div style={{ position: "absolute", left: 300 * 0.32, top: -6, width: 2, height: 24, background: RED }} />
          </div>
        </div>

        <Stamp text="排队 ≠ 赚钱" x={540} y={1150} size={48} rotate={-5} t={seal} />
      </div>
    </AbsoluteFill>
  );
};

export default Scene08;
