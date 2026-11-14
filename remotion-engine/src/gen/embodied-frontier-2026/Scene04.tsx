// Scene04 · 研发被改造：一张机械臂图纸、一个终端、三条日志。
import React from "react";
import type { GenSceneProps } from "../types";
import {
  Card, Chip, Cursor, INK, MUTED, PAPER, RobotArm, SceneShell, Stamp,
  clamp01, easeInOut, easeOut, mono, sans,
} from "./ui";

const Scene04: React.FC<GenSceneProps> = ({ p, c1, c2, accent }) => {
  const leftIn = easeOut(clamp01((p - 0.02) / 0.18));
  const termIn = easeOut(clamp01((p - 0.1) / 0.2));
  const draw = easeInOut(clamp01((p - 0.12) / 0.32));
  const typing = clamp01((p - 0.26) / 0.42);
  const cursorT = easeInOut(clamp01((p - 0.44) / 0.28));
  const logIn = clamp01((p - 0.52) / 0.18);
  const stamp = clamp01((p - 0.76) / 0.1);

  const shoulder = -22 + Math.sin(p * Math.PI * 2) * 4;
  const elbow = 34 + Math.sin(p * Math.PI * 2 + 0.8) * 7;
  const wrist = -18 + Math.sin(p * Math.PI * 2 + 1.6) * 8;

  const terminalLines = [
    { t: "$ ros2 launch sim.launch.py", c: PAPER },
    { t: "[sim] 42 tasks queued", c: "#B9C7BE" },
    { t: "[eval] success 0.649", c: accent },
    { t: "[log] collision 0", c: "#B9C7BE" },
    { t: "[log] cycle 12m 08s", c: "#B9C7BE" },
    { t: "[ai] patch accepted", c: accent },
  ];
  const shown = Math.floor(typing * terminalLines.length);

  return (
    <SceneShell c1={c1} c2={c2} accent={accent} index={4} kicker="CODE / SIM / LOG" tag="THE NEW ENGINEER">
      {/* 左：机械臂图纸 */}
      <Card x={150} y={392} w={430} h={608} opacity={leftIn} bg="#F8F4E9">
        <div style={{ position: "absolute", left: 18, top: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, background: accent }} />
          <span style={mono(16, INK, 900)}>ARM / REV.C</span>
          <span style={mono(11, MUTED, 600)}>SHEET 03</span>
        </div>
        <div style={{ position: "absolute", left: 16, top: 56, opacity: 0.96 }}>
          <RobotArm
            x={20}
            y={56}
            scale={0.83}
            shoulder={shoulder}
            elbow={elbow}
            wrist={wrist}
            accent={accent}
          />
        </div>

        {/* 尺寸线 */}
        <svg width={430} height={608} viewBox="0 0 430 608" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <path d="M 44 520 L 356 520" stroke={`${INK}44`} strokeWidth="1.4" strokeDasharray="6 6" />
          <path d="M 44 512 L 44 528 M 356 512 L 356 528" stroke={`${INK}66`} strokeWidth="1.6" />
          <path d="M 60 430 L 60 520" stroke={`${accent}66`} strokeWidth="1.4" strokeDasharray="4 5" opacity={draw} />
          <path d="M 330 250 L 390 250 L 390 520" stroke={`${INK}30`} strokeWidth="1.2" fill="none" />
          <circle cx="240" cy="342" r="24" fill="none" stroke={accent} strokeWidth="1.6" strokeDasharray="4 5" opacity={draw} />
          <circle cx="240" cy="342" r="3.5" fill={accent} opacity={draw} />
        </svg>

        <div style={{ position: "absolute", left: 18, bottom: 22, width: 192, ...mono(11, MUTED, 600), lineHeight: 1.8 }}>
          <div>J3 / WRIST · ±180°</div>
          <div>REACH 1.82 m</div>
          <div>PAYLOAD 12 kg</div>
        </div>
        <div style={{ position: "absolute", right: 18, bottom: 20, textAlign: "right" }}>
          <div style={mono(11, MUTED, 600)}>TOLERANCE</div>
          <div style={{ ...sans(28, INK, 900), lineHeight: 1 }}>±0.02</div>
          <div style={mono(11, MUTED, 600)}>MM</div>
        </div>
      </Card>

      {/* 右：终端 */}
      <Card x={610} y={392} w={320} h={470} opacity={termIn} bg={INK} border={INK} shadow="10px 10px 0 rgba(22,27,24,0.16)">
        <div style={{ position: "absolute", left: 16, top: 14, right: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 5 }}>
            {[0, 1, 2].map((i) => <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i === 0 ? accent : `${PAPER}44` }} />)}
          </div>
          <span style={mono(11, `${PAPER}77`, 600)}>agent / sim-run</span>
        </div>
        <div style={{ position: "absolute", left: 18, top: 52, right: 18 }}>
          {terminalLines.map((line, i) => {
            const t = clamp01((typing - i / terminalLines.length) * terminalLines.length * 1.6);
            return (
              <div
                key={i}
                style={{
                  fontFamily: "monospace",
                  fontSize: 15,
                  lineHeight: 1.9,
                  color: line.c,
                  opacity: i < shown ? 1 : 0.12,
                  whiteSpace: "nowrap",
                  transform: `translateX(${(1 - t) * 5}px)`,
                }}
              >
                {line.t}
              </div>
            );
          })}
          <span
            style={{
              display: "inline-block", width: 9, height: 18, background: accent, marginTop: 8,
              opacity: Math.sin(p * 42) > -0.2 ? 0.9 : 0.15,
            }}
          />
        </div>
        <div style={{ position: "absolute", left: 18, bottom: 16, ...mono(11, `${PAPER}66`, 600) }}>
          EXIT 0 · 12m 08s
        </div>
      </Card>

      {/* 终端到关节的数据线 */}
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <path
          d="M 610 610 C 560 610 520 600 500 560"
          fill="none"
          stroke={accent}
          strokeWidth="2.4"
          strokeDasharray="7 8"
          opacity={0.18 + 0.65 * cursorT}
          strokeDashoffset={-cursorT * 30}
        />
        <circle cx="500" cy="560" r="5" fill={accent} opacity={cursorT} />
      </svg>

      <Cursor x={690 - cursorT * 220} y={680 - cursorT * 90} s={0.9} color={INK} opacity={clamp01((p - 0.3) / 0.1)} />

      {/* 底部日志条 */}
      <Card x={150} y={1032} w={780} h={150} opacity={logIn} bg="rgba(255,253,246,0.88)" border={`${INK}44`} shadow="none">
        <div style={{ display: "flex", height: "100%" }}>
          {[
            ["ITER", "08", accent],
            ["TASKS", "42 / 42", INK],
            ["COLLISION", "0", INK],
            ["WALL", "12m", INK],
          ].map(([k, v, c], i) => (
            <div key={k} style={{ flex: 1, borderLeft: i === 0 ? "none" : `1px solid ${INK}16`, padding: "22px 18px" }}>
              <div style={mono(11, MUTED, 600)}>{k}</div>
              <div style={{ ...mono(28, c as string, 900), marginTop: 8 }}>{v}</div>
            </div>
          ))}
        </div>
      </Card>

      <Chip text="AI AS A TEAMMATE" color={accent} size={13} style={{ position: "absolute", left: 640, top: 878 }} />
      <Stamp text="0 ERRORS" x={648} y={924} progress={stamp} rotate={-5} size={19} />
      <div style={{ position: "absolute", left: 190, top: 1222, ...mono(11, `${INK}44`, 600) }}>HUMAN REVIEW STILL REQUIRED</div>
    </SceneShell>
  );
};

export default Scene04;
