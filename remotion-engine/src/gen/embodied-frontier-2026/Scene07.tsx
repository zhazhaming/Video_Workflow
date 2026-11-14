// Scene07 · 近未来：先改造公司，再谈把管家送进家门。
import React from "react";
import type { GenSceneProps } from "../types";
import {
  Card, Chip, House, INK, MUTED, PAPER, SceneShell, Stamp,
  clamp01, easeBack, easeInOut, easeOut, mono, rand,
} from "./ui";

const TinyRobot: React.FC<{ x: number; y: number; accent: string; opacity: number }> = ({ x, y, accent, opacity }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 40, height: 66, opacity }}>
    <div style={{ position: "absolute", left: 7, top: 0, width: 26, height: 23, borderRadius: 7, border: `2.5px solid ${INK}`, background: PAPER }}>
      <span style={{ position: "absolute", left: 5, top: 8, width: 4, height: 4, background: accent }} />
      <span style={{ position: "absolute", right: 5, top: 8, width: 4, height: 4, background: accent }} />
    </div>
    <div style={{ position: "absolute", left: 11, top: 23, width: 18, height: 25, borderRadius: 4, border: `2.5px solid ${INK}`, background: PAPER }} />
    <div style={{ position: "absolute", left: 9, top: 48, width: 5, height: 15, border: `2.5px solid ${INK}`, background: PAPER }} />
    <div style={{ position: "absolute", left: 26, top: 48, width: 5, height: 15, border: `2.5px solid ${INK}`, background: PAPER }} />
  </div>
);

const Scene07: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const buildIn = easeOut(clamp01((p - 0.02) / 0.18));
  const descend = easeInOut(clamp01((p - 0.18) / 0.42));
  const conveyor = clamp01((p - 0.36) / 0.4);
  const walk = easeInOut(clamp01((p - 0.58) / 0.28));
  const gate = clamp01((p - 0.7) / 0.14);
  const stamp = clamp01((p - 0.8) / 0.12);

  const aiY = 414 + descend * 414;
  const floors = [
    { y: 364, h: 240, label: "CODE", sub: "AGENT / REPO / TESTS", color: accent },
    { y: 604, h: 240, label: "SIM", sub: "42 TASKS / REWARD / LOGS", color: "#496B7A" },
    { y: 844, h: 240, label: "FACTORY", sub: "HARDWARE / DATA / SAFETY", color: "#2F5D50" },
  ];

  return (
    <SceneShell c1={c1} c2={c2} accent={accent} index={7} kicker="NEAR TERM / SOFTWARE FIRST" tag="COMPANY → HOME">
      {/* 公司剖面 */}
      <Card x={210} y={364} w={430} h={720} opacity={buildIn} bg="rgba(255,253,246,0.86)" border={INK}>
        {floors.map((f, i) => {
          const on = clamp01((descend - i * 0.2) / 0.2);
          return (
            <div
              key={f.label}
              style={{
                position: "absolute", left: 0, top: f.y - 364, width: "100%", height: f.h,
                borderTop: i === 0 ? "none" : `1.5px solid ${INK}22`,
                background: on > 0.3 ? `${f.color}08` : "transparent",
              }}
            >
              <div style={{ position: "absolute", left: 18, top: 18, ...mono(12, f.color, 800) }}>0{i + 1}</div>
              <div style={{ position: "absolute", left: 52, top: 14 }}>
                <div style={{ ...mono(24, INK, 900), letterSpacing: 2 }}>{f.label}</div>
                <div style={{ ...mono(11, MUTED, 600), marginTop: 5 }}>{f.sub}</div>
              </div>
              {/* 楼层设备 */}
              <div style={{ position: "absolute", right: 18, top: 22, opacity: 0.55 + 0.45 * on }}>
                {i === 0 ? (
                  <div style={{ ...mono(11, `${INK}66`, 600), lineHeight: 1.8, textAlign: "right" }}>
                    <div>{"> PR opened"}</div>
                    <div>{"> tests 418"}</div>
                    <div style={{ color: accent }}>{"> merge"}</div>
                  </div>
                ) : i === 1 ? (
                  <div style={{ display: "flex", gap: 4 }}>
                    {Array.from({ length: 9 }, (_, k) => (
                      <span key={k} style={{ width: 8, height: 8, border: `1.5px solid ${f.color}`, background: k < Math.floor(conveyor * 9) ? `${f.color}22` : "transparent" }} />
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 34, height: 2, background: `${INK}44` }} />
                    <span style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${INK}`, background: PAPER }} />
                    <span style={{ width: 26, height: 26, border: `2px solid ${INK}`, background: `${accent}12` }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* 电梯井 / AI 卡 */}
        <div style={{ position: "absolute", left: 18, top: 0, width: 2, height: "100%", background: `${INK}0E` }} />
        <div
          style={{
            position: "absolute", left: -46, top: aiY - 364,
            width: 84, height: 62, background: INK, borderRadius: 6,
            boxShadow: `5px 5px 0 ${accent}33`,
            opacity: clamp01((p - 0.1) / 0.14),
          }}
        >
          <div style={{ ...mono(11, PAPER, 800), padding: "8px 10px" }}>AI</div>
          <div style={{ display: "flex", gap: 3, padding: "0 10px" }}>
            {[0, 1, 2].map((i) => <span key={i} style={{ width: 5, height: 5, background: accent, opacity: 0.3 + 0.7 * clamp01((descend - i * 0.2) / 0.2) }} />)}
          </div>
        </div>
        <div style={{ position: "absolute", left: -46, top: aiY - 364 + 62, width: 2, height: 30, background: `${accent}55`, opacity: descend > 0 ? 1 : 0 }} />

        {/* 传送带 */}
        <div style={{ position: "absolute", left: 40, right: 36, top: 666, height: 2, background: `${INK}33` }} />
        {Array.from({ length: 8 }, (_, k) => (
          <span
            key={k}
            style={{
              position: "absolute", left: 60 + ((k * 48 + conveyor * 120) % 300), top: 660,
              width: 7, height: 7, borderTop: `2px solid ${INK}55`, borderRight: `2px solid ${INK}55`,
              transform: "rotate(45deg)", opacity: 0.4,
            }}
          />
        ))}
      </Card>

      {/* 出口与围栏 */}
      <div style={{ position: "absolute", left: 640, top: 998, width: 92, height: 2, background: `${INK}55` }} />
      <div style={{ position: "absolute", left: 726, top: 860, width: 2, height: 190, background: `${accent}${gate > 0.3 ? "AA" : "33"}`, borderLeft: `2px dashed ${accent}${gate > 0.3 ? "AA" : "44"}` }} />
      <div style={{ position: "absolute", left: 712, top: 826, ...mono(16, accent, 900), opacity: 0.3 + 0.7 * gate }}>LATER</div>

      {/* 去家的路 */}
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <path d="M 650 1010 C 720 1000 760 900 786 760 C 800 680 820 620 846 590" stroke={`${INK}33`} strokeWidth="2" strokeDasharray="7 9" fill="none" />
        <path d="M 650 1010 C 720 1000 760 900 786 760" stroke={accent} strokeWidth="2.2" strokeDasharray="7 9" fill="none" opacity={0.2 + 0.6 * walk} />
      </svg>

      <House x={806} y={500} s={0.95} color={INK} opacity={0.35 + 0.55 * clamp01((p - 0.6) / 0.2)} />
      <div style={{ position: "absolute", left: 806, top: 592, ...mono(12, MUTED, 700) }}>HOME / 2027?</div>
      <Chip text="NOT THIS QUARTER" color={accent} size={11} style={{ position: "absolute", left: 778, top: 442 }} />

      {/* 小机器人走向门口，停在围栏前 */}
      <TinyRobot x={640 + walk * 70} y={934} accent={accent} opacity={clamp01((p - 0.48) / 0.16)} />
      <div
        style={{
          position: "absolute", left: 628, top: 930, width: 118, height: 2, background: `${accent}55`,
          opacity: clamp01((p - 0.48) / 0.16) * (1 - walk * 0.5),
        }}
      />

      <Stamp text="SOFTWARE FIRST" x={190} y={1124} progress={stamp} rotate={-3} size={21} />
      <div style={{ position: "absolute", left: 190, top: 1190, width: 680, ...mono(12, MUTED, 600), lineHeight: 1.8, opacity: stamp }}>
        大模型先改变的是研发、仿真和测试，<br />
        不是明天就把一台全能管家送进你家。
      </div>

      {Array.from({ length: 7 }, (_, k) => (
        <span
          key={k}
          style={{
            position: "absolute", left: 250 + rand(k + 3) * 520, top: 400 + rand(k + 8) * 520,
            width: 3, height: 3, borderRadius: "50%", background: accent, opacity: 0.12,
          }}
        />
      ))}
    </SceneShell>
  );
};

export default Scene07;
