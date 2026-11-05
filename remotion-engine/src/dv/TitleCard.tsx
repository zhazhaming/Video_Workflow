// 开场标题序列（66 帧 ≈ 2.2s）：kicker 小字 + 逐字弹入标题 + 色差光晕 + 下划线扫过。
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT_STACK, rand } from "./atmosphere";

const CJK = /[\u3000-\u9fff\uff00-\uffef]/;
const PUNCT = "，。！？、：；,.!?:;";

function charWidth(c: string): number {
  if (CJK.test(c)) return 1;
  if (/[A-Za-z0-9%]/.test(c)) return 0.56;
  if (c === " ") return 0.35;
  return 0.7;
}

function textWidth(s: string): number {
  return Array.from(s).reduce((a, c) => a + charWidth(c), 0);
}

/**
 * 片名排版：优先在中线附近按标点/拉丁词边界断行，避免「8%」「吗」这种孤字。
 * 单行能放下就不折；折两行后按估算字宽自动降字号。
 */
export function layoutTitle(title: string): { lines: string[]; fontSize: number } {
  const chars = Array.from(title);
  if (chars.length === 0) return { lines: [title], fontSize: 118 };
  const maxW = 900; // 1080 - 左右各 90
  let fontSize = chars.length > 9 ? 96 : 118;
  if (textWidth(title) * fontSize + Math.max(0, chars.length - 1) * 6 <= maxW) {
    return { lines: [title], fontSize };
  }

  const mid = chars.length / 2;
  const candidates: number[] = [];
  for (let i = 2; i < chars.length - 2; i++) {
    const prev = chars[i - 1];
    const prevIsLatin = /[A-Za-z0-9%]/.test(prev);
    const nextIsLatin = /[A-Za-z0-9%]/.test(chars[i]);
    if (PUNCT.includes(prev) || (prevIsLatin && !nextIsLatin) || prev === " ") {
      candidates.push(i);
    }
  }
  // 只在中线 ±1 字内优先用语义断点；否则用几何中线（避免 3/6 这种头重脚轻）
  const near = candidates.filter((i) => Math.abs(i - mid) <= 1);
  let breakAt = near.length
    ? near.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0]
    : Math.round(mid);
  if (chars.length - breakAt < 3) breakAt = chars.length - 3;
  if (breakAt < 3) breakAt = Math.min(3, chars.length - 1);
  // 不要把逗号/句号甩到下一行开头：断点落在标点上时，把标点收进上一行
  while (breakAt < chars.length && PUNCT.includes(chars[breakAt])) breakAt += 1;
  const lines = [chars.slice(0, breakAt).join(""), chars.slice(breakAt).join("")];

  while (fontSize > 64) {
    const w = Math.max(textWidth(lines[0]), textWidth(lines[1])) * fontSize +
      6 * Math.max(lines[0].length, lines[1].length);
    if (w <= maxW) break;
    fontSize -= 4;
  }
  return { lines, fontSize };
}

export const DVTitleCard: React.FC<{
  title: string;
  kicker?: string | null;
  accent: string;
  paper?: boolean;
}> = ({ title, kicker, accent, paper }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useMemo(() => layoutTitle(title), [title]);
  const lines = useMemo(() => {
    let offset = 0;
    return layout.lines.map((text) => {
      const start = offset;
      offset += Array.from(text).length;
      return { text, start };
    });
  }, [layout]);

  const bg = paper ? "#f4efe6" : "#0d0e14";
  const ink = paper ? "#1c1c24" : "#ffffff";

  // 光带扫过（运动模糊感）
  const sweep = interpolate(frame, [7, 38], [-30, 130], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: bg, justifyContent: "center", alignItems: "center" }}>
      {/* 动态光晕 */}
      {[-1, 0, 1].map((i) => {
        const x = 20 + rand(i + 3) * 60;
        const y = 18 + rand(i + 9) * 55;
        const pul = 0.5 + 0.5 * Math.sin(frame * 0.09 + i * 2.1);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: 420,
              height: 420,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${accent}${Math.round(30 + pul * 26).toString(16)} 0%, transparent 68%)`,
              filter: "blur(8px)",
            }}
          />
        );
      })}

      {/* 光带 */}
      <div
        style={{
          position: "absolute",
          left: `${sweep}%`,
          top: 0,
          bottom: 0,
          width: 90,
          background: `linear-gradient(90deg, transparent, ${accent}2e, transparent)`,
          filter: "blur(14px)",
          transform: "skewX(-12deg)",
        }}
      />

      <div style={{ position: "relative", textAlign: "center", padding: "0 90px" }}>
        {kicker ? (
          <div
            style={{
              fontFamily: FONT_STACK,
              color: accent,
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: 10,
              marginBottom: 34,
              opacity: interpolate(frame, [2, 10], [0, 1], { extrapolateRight: "clamp" }),
            }}
          >
            {kicker}
          </div>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {lines.map((line) => (
            <div
              key={line.start}
              style={{
                display: "flex",
                justifyContent: "center",
                height: layout.fontSize * 1.12,
                alignItems: "center",
              }}
            >
              {Array.from(line.text).map((c, ci) => {
                const i = line.start + ci;
                const s = spring({
                  frame: frame - 4 - i * 1.5,
                  fps,
                  config: { damping: 11, stiffness: 160, mass: 0.7 },
                });
                const chroma = Math.max(0, 1 - (frame - 4 - i * 1.5) / 9);
                const isNumber = /[0-9%]/.test(c);
                return (
                  <span
                    key={ci}
                    style={{
                      fontFamily: FONT_STACK,
                      fontSize: layout.fontSize,
                      fontWeight: 900,
                      color: isNumber ? accent : ink,
                      display: "inline-block",
                      transform: `scale(${0.4 + s * 0.6}) translateY(${(1 - s) * 40}px)`,
                      opacity: s,
                      textShadow:
                        chroma > 0
                          ? `${chroma * 5}px 0 ${accent}, ${-chroma * 5}px 0 ${accent}88`
                          : undefined,
                      marginRight: 6,
                    }}
                  >
                    {c === " " ? "\u00A0" : c}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 40,
            height: 6,
            width: interpolate(frame, [16, 36], [0, 320], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            background: `linear-gradient(90deg, ${accent}, transparent)`,
            borderRadius: 3,
            margin: "40px auto 0",
          }}
        />
      </div>

      {/* 收尾不再淡回纯背景：DataVideo 会把标题序列延长到 offset（2.18s），
          由下一镜的 dissolve 覆盖，避免 1.6~2.18s 之间出现 0.58s 空黑。 */}
    </AbsoluteFill>
  );
};
