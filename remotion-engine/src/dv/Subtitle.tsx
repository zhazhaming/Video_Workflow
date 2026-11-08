// 字幕：白字黑描边 + 强调词金色高亮（数字/引语），支持 bold / pill 两种样式。
import React from "react";
import { useCurrentFrame } from "remotion";
import { FONT_STACK, clamp } from "./atmosphere";
import type { LookSpec } from "./types";
import type { TLine } from "./timeline";

const ACCENT_DEFAULT = "#FFD166";

/** 把台词按强调词切段，渲染时高亮。与后端 pipeline._EMPHASIS_RE 同源（后端已算好子串）。 */
export function splitEmphasis(text: string, words?: string[] | null) {
  if (!words || words.length === 0) return [{ text, hit: false }];
  const marks: { text: string; hit: boolean }[] = [];
  let rest = text;
  let guard = 0;
  while (rest.length > 0 && guard++ < 24) {
    let best: { idx: number; word: string } | null = null;
    for (const w of words) {
      if (!w) continue;
      const idx = rest.indexOf(w);
      if (idx >= 0 && (best === null || idx < best.idx)) best = { idx, word: w };
    }
    if (!best) break;
    if (best.idx > 0) marks.push({ text: rest.slice(0, best.idx), hit: false });
    marks.push({ text: best.word, hit: true });
    rest = rest.slice(best.idx + best.word.length);
  }
  if (rest) marks.push({ text: rest, hit: false });
  return marks.length > 0 ? marks : [{ text, hit: false }];
}

/**
 * 把一句拆成 2~4 字的渲染 token。逐 token 错 1~2 帧出现，字幕才有“被说出来”的节奏；
 * token 之间的换行由外层的两行排版控制，避免「AI。」「齐。」这种孤字。
 */
export function tokenizeLine(text: string): string[] {
  const out: string[] = [];
  let buf = "";
  const flush = () => {
    if (buf) {
      out.push(buf);
      buf = "";
    }
  };
  const isLatin = (c: string) => /[A-Za-z0-9.%]/.test(c);
  for (const c of Array.from(text)) {
    // 拉丁/数字整段保留（DeepSeek、3.63%、GitHub 不拆开），中文按 2~4 字切
    if (isLatin(c)) {
      if (buf && !isLatin(buf[0])) flush();
      buf += c;
      continue;
    }
    if (buf && isLatin(buf[0])) flush();
    buf += c;
    const isBreak = /[\s，。！？、：；,.!?:;]/.test(c);
    if (isBreak) {
      flush();
      continue;
    }
    if (Array.from(buf).length >= 4) flush();
  }
  flush();
  return out.length > 0 ? out : [text];
}

const CJK_RE = /[\u3000-\u9fff\uff00-\uffef]/;
const charEm = (c: string): number => {
  if (CJK_RE.test(c)) return 1;
  if (/[A-Za-z0-9.%]/.test(c)) return 0.56;
  if (c === " ") return 0.35;
  return 0.7;
};
const textEm = (s: string): number => Array.from(s).reduce((a, c) => a + charEm(c), 0);
const textLen = (s: string): number => Array.from(s).length;

export const DVSubtitle: React.FC<{
  line: TLine;
  look?: LookSpec | null;
  accent?: string;
  entering?: number;
  age?: number;
  /** 图片镜头：字幕下垫米白纸底板，对比度与插画内容解耦（复古 caption strip 质感） */
  plate?: boolean;
}> = ({ line, look, accent, entering = 1, age, plate = false }) => {
  const frame = useCurrentFrame();
  const lineAge = Math.max(0, age ?? frame);
  const style = look?.subtitleStyle === "pill" ? "pill" : "bold";
  const paper = look?.bg === "paper" || look?.mode === "light";
  const ink = look?.ink || "#1B1B22";
  const acc = accent || ACCENT_DEFAULT;
  const pop = 0.97 + 0.03 * clamp(lineAge / 7, 0, 1);
  const rise = 14 * (1 - clamp(lineAge / 7, 0, 1));
  const segments = splitEmphasis(line.text, line.emphasis);
  const tokens = segments.flatMap((seg) =>
    tokenizeLine(seg.text).map((text) => ({ text, hit: seg.hit })),
  );

  const fontSize = line.text.length > 20 ? 56 : line.text.length > 16 ? 60 : line.text.length > 13 ? 64 : 68;
  // 手动排两行：避免浏览器把「AI。」「齐。」甩成孤字。
  const maxEm = 900 / fontSize;
  const totalEm = tokens.reduce((a, t) => a + textEm(t.text), 0);
  let rows: typeof tokens[] = [tokens];
  if (totalEm > maxEm && tokens.length > 1) {
    const target = totalEm / 2;
    let best = -1;
    let bestScore = Infinity;
    for (let i = 1; i < tokens.length; i++) {
      const leftEm = tokens.slice(0, i).reduce((a, t) => a + textEm(t.text), 0);
      const rightEm = totalEm - leftEm;
      if (leftEm > maxEm || rightEm > maxEm) continue;
      if (textLen(tokens.slice(0, i).map((t) => t.text).join("")) < 3) continue;
      if (textLen(tokens.slice(i).map((t) => t.text).join("")) < 3) continue;
      let score = Math.abs(leftEm - target);
      if (/[，。！？、：；,.;:!?]$/.test(tokens[i - 1].text)) score -= 6;
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }
    if (best > 0) rows = [tokens.slice(0, best), tokens.slice(best)];
  }

  const textEl = (
    <div
      style={{
        width: "100%",
        fontFamily: FONT_STACK,
        fontWeight: 800,
        fontSize,
        lineHeight: 1.32,
        color: paper ? ink : "#ffffff",
        textAlign: "center",
        WebkitTextStroke: !paper && style === "bold" ? "2.5px rgba(0,0,0,0.85)" : undefined,
        paintOrder: "stroke",
        textShadow: paper
          ? "0 2px 0 rgba(244,241,232,0.95), 0 0 14px rgba(244,241,232,0.95), 0 0 30px rgba(244,241,232,0.75)"
          : style === "bold"
            ? "0 4px 18px rgba(0,0,0,0.55)"
            : undefined,
      }}
    >
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: "flex", justifyContent: "center", whiteSpace: "nowrap" }}>
          {row.map((tok, i) => {
            const globalIndex = rows.slice(0, ri).reduce((a, r) => a + r.length, 0) + i;
            const t = clamp((lineAge - globalIndex * 1.15) / 5.5, 0, 1);
            const e = t * t * (3 - 2 * t);
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  whiteSpace: "pre",
                  opacity: t,
                  transform: `translateY(${(1 - e) * 10}px) scale(${tok.hit ? 1 + 0.12 * (1 - e) : 1})`,
                  color: tok.hit ? acc : undefined,
                  textShadow: tok.hit ? (paper ? "none" : `0 0 22px ${acc}55`) : undefined,
                }}
              >
                {tok.text === " " ? "\u00A0" : tok.text}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        right: 72,
        bottom: 330,
        display: "flex",
        justifyContent: "center",
        transform: `translateY(${rise}px) scale(${pop})`,
        opacity: entering,
      }}
    >
      {style === "pill" ? (
        <div
          style={{
            background: "rgba(12,12,18,0.72)",
            borderRadius: 26,
            padding: "22px 40px",
            border: "1px solid rgba(255,255,255,0.14)",
            width: "100%",
          }}
        >
          {textEl}
        </div>
      ) : plate ? (
        <div
          style={{
            width: "100%",
            background: "rgba(244,239,230,0.9)",
            borderRadius: 18,
            padding: "18px 30px",
            border: "1.5px solid rgba(27,24,21,0.14)",
            boxShadow: "0 10px 28px rgba(27,24,21,0.22)",
          }}
        >
          {textEl}
        </div>
      ) : (
        textEl
      )}
    </div>
  );
};
