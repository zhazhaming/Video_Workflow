// chrome.tsx —— 对标「Vibe 知识大赏」沉淀的排版组件库（gen 层，不改 src/dv）。
// 用法：src/gen/<pid>/SceneNN.tsx 里按需组合；文字均落在安全区
// （避开左上镜标签 top:170/left:72、底部字幕带 y>1400、进度条 y>1860）。
// 所有动画只用 transform/opacity，随机只准 rand(seed+k) 家族。
import React from "react";
import { FONT_STACK, clamp, rand } from "../../dv/atmosphere";

const INK = "#14110F";

/** 年代戳：大年份衬线数字 + 城市·人名小字（参考片①语法，左上） */
export const EraStamp: React.FC<{
  year: string;
  place: string;
  sup?: string; // 年份上标（如 ² 表“约”）
  accent: string;
  light?: boolean; // 浅色底（纸感）用墨色
  seed?: number;
}> = ({ year, place, sup, accent, light, seed = 7 }) => {
  const col = light ? INK : "#E8D9A8";
  return (
    <div style={{ position: "absolute", top: 96, left: 72, fontFamily: FONT_STACK, zIndex: 7 }}>
      <div style={{ fontSize: 84, fontWeight: 700, color: col, lineHeight: 1, letterSpacing: 2 }}>
        {year}
        {sup && <sup style={{ fontSize: 34, color: accent }}>{sup}</sup>}
      </div>
      <div style={{ fontSize: 28, color: col, opacity: 0.72, letterSpacing: 4, marginTop: 10 }}>
        {place}
      </div>
      <div
        style={{
          width: 64,
          height: 3,
          background: accent,
          marginTop: 14,
          transform: `scaleX(${clamp(seed * 0.14, 0.6, 1)})`,
          transformOrigin: "left",
        }}
      />
    </div>
  );
};

/** 章节进度点：右上角一排圆点，随章节点亮（片②语法） */
export const ProgressDots: React.FC<{
  index: number; // 0 起
  total: number;
  accent: string;
  light?: boolean;
}> = ({ index, total, accent, light }) => (
  <div
    style={{
      position: "absolute",
      top: 112,
      right: 72,
      display: "flex",
      gap: 12,
      alignItems: "center",
      fontFamily: FONT_STACK,
      zIndex: 7,
    }}
  >
    {Array.from({ length: total }, (_, i) => (
      <span
        key={i}
        style={{
          width: i === index ? 14 : 9,
          height: i === index ? 14 : 9,
          borderRadius: "50%",
          background: i <= index ? accent : "transparent",
          border: `2px solid ${i <= index ? accent : light ? "rgba(20,17,15,.35)" : "rgba(232,217,168,.4)"}`,
          transition: "none",
        }}
      />
    ))}
  </div>
);

/** 书名引用卡：右上（进度点下方），原文斜体 + 红色小书标 */
export const CiteCard: React.FC<{
  original: string; // 拉丁/英文原题（斜体）
  cn: string; // 中文译名
  year?: string; // 右上角小年份
  light?: boolean;
}> = ({ original, cn, year, light }) => {
  const col = light ? "rgba(20,17,15,.75)" : "rgba(232,217,168,.8)";
  return (
    <div
      style={{
        position: "absolute",
        top: 180,
        right: 72,
        textAlign: "right",
        fontFamily: FONT_STACK,
        zIndex: 7,
      }}
    >
      {year && <div style={{ fontSize: 22, color: col, opacity: 0.7, letterSpacing: 2 }}>{year}</div>}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, justifyContent: "flex-end" }}>
        <div>
          <div style={{ fontSize: 24, fontStyle: "italic", color: col, lineHeight: 1.35 }}>{original}</div>
          <div style={{ fontSize: 22, color: col, opacity: 0.75, marginTop: 4 }}>{cn}</div>
        </div>
        <span
          style={{
            width: 26,
            height: 30,
            background: "#C8452D",
            borderRadius: 3,
            display: "inline-block",
            flex: "none",
            boxShadow: "inset -5px 0 0 rgba(0,0,0,.28)",
          }}
        />
      </div>
    </div>
  );
};

/** 片尾复盘树：全片压缩成一屏（收藏引擎，片②语法） */
export const RecapTree: React.FC<{
  title: string;
  columns: { head: string; color: string; subs: string[] }[];
  footer: string;
  p: number; // 0~1 入场进度
  accent: string;
  seed: number;
}> = ({ title, columns, footer, p, accent, seed }) => {
  const show = clamp(p * 1.6, 0, 1);
  const colW = 810 / Math.max(1, columns.length);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        fontFamily: FONT_STACK,
        opacity: show,
        zIndex: 8,
        // 片尾复盘必须是“一屏卡片”，不能半透明地压在图表上：
        // 图表、坐标轴、事件标签全部被这层盖住，只留字幕（字幕在 DataVideo 层，z 更高）。
        background: "radial-gradient(120% 80% at 50% 38%, #171720 0%, #0b0b10 72%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "300px 72px 380px",
          boxSizing: "border-box",
          transform: `translateY(${(1 - show) * 46}px)`,
        }}
      >
        <div style={{ fontSize: 52, fontWeight: 700, color: "#E8D9A8", letterSpacing: 5, textShadow: "0 2px 18px rgba(0,0,0,.6)" }}>
          {title}
        </div>
        <div style={{ width: 280, height: 2, background: accent, opacity: 0.7, margin: "20px 0 28px" }} />
        <div style={{ display: "flex", gap: 22 }}>
          {columns.map((c, ci) => (
            <div
              key={ci}
              style={{
                width: colW,
                border: "1px solid rgba(232,217,168,.35)",
                borderRadius: 12,
                padding: "20px 20px",
                background: "rgba(10,10,14,.72)",
                opacity: clamp((p - 0.15 - ci * 0.12) * 3, 0, 1),
                transform: `translateY(${(1 - clamp((p - 0.15 - ci * 0.12) * 3, 0, 1)) * 24}px)`,
              }}
            >
              <div style={{ fontSize: 32, fontWeight: 700, color: c.color, marginBottom: 12, letterSpacing: 3 }}>{c.head}</div>
              {c.subs.map((s, si) => (
                <div key={si} style={{ fontSize: 23, color: "rgba(238,230,210,.88)", lineHeight: 1.7, opacity: 0.55 + 0.45 * rand(seed + ci * 9 + si) }}>
                  {s}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 26, color: "rgba(238,230,210,.75)", marginTop: 32, letterSpacing: 2 }}>{footer}</div>
      </div>
    </div>
  );
};

/** 数据速查卡：关键点位/日期速览（片②口诀卡的行情版） */
export const SpeedFacts: React.FC<{
  title: string;
  rows: { k: string; v: string; down?: boolean }[];
  p: number;
  light?: boolean;
}> = ({ title, rows, p, light }) => (
  <div
    style={{
      position: "absolute",
      right: 72,
      top: 560,
      width: 430,
      fontFamily: FONT_STACK,
      zIndex: 8,
      opacity: clamp(p * 2.2, 0, 1),
      transform: `translateX(${(1 - clamp(p * 2.2, 0, 1)) * 40}px)`,
    }}
  >
    <div
      style={{
        border: `1px solid ${light ? "rgba(20,17,15,.25)" : "rgba(232,217,168,.4)"}`,
        borderRadius: 12,
        padding: "20px 24px",
        background: light ? "rgba(255,252,244,.85)" : "rgba(10,10,14,.62)",
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 700, color: light ? INK : "#E8D9A8", letterSpacing: 3, marginBottom: 14 }}>
        {title}
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px dashed ${light ? "rgba(20,17,15,.14)" : "rgba(232,217,168,.18)"}` }}>
          <span style={{ fontSize: 24, color: light ? "rgba(20,17,15,.72)" : "rgba(238,230,210,.78)" }}>{r.k}</span>
          <span style={{ fontSize: 26, fontWeight: 700, color: r.down ? "#1E7A46" : "#C8452D" }}>{r.v}</span>
        </div>
      ))}
    </div>
  </div>
);

/** 弹幕共鸣气泡：开场把用户痛点打在屏上（片②语法） */
export const ChatBubble: React.FC<{
  name: string;
  text: string;
  tone: "error" | "info" | "success";
  side: "left" | "right";
  p: number; // 0~1 气泡自身入场进度
}> = ({ name, text, tone, side, p }) => {
  const show = clamp(p * 2.4, 0, 1);
  const colors = {
    error: { bg: "rgba(12,10,14,0.78)", bd: "#C8452D" },
    info: { bg: "rgba(12,10,14,0.78)", bd: "#58a6ff" },
    success: { bg: "rgba(12,10,14,0.78)", bd: "#3fb950" },
  }[tone];
  return (
    <div
      style={{
        position: "absolute",
        top: 560 + (side === "right" ? 120 : 0),
        [side]: 90,
        fontFamily: FONT_STACK,
        zIndex: 8,
        opacity: show,
        transform: `translateX(${(side === "left" ? -1 : 1) * (1 - show) * 36}px)`,
      } as React.CSSProperties}
    >
      <div
        style={{
          background: colors.bg,
          border: `2px solid ${colors.bd}`,
          borderRadius: 16,
          padding: "14px 22px",
          maxWidth: 620,
        }}
      >
        <div style={{ fontSize: 22, color: colors.bd, marginBottom: 6, fontWeight: 700 }}>{name}</div>
        <div style={{ fontSize: 36, fontWeight: 700, color: "#F2EDE0", letterSpacing: 2, textShadow: "0 2px 10px rgba(0,0,0,.7)" }}>
          {text}
        </div>
      </div>
    </div>
  );
};

/** 账号水印：右下角小字（系列化约定，全片常驻） */
export const Watermark: React.FC<{ text: string; light?: boolean }> = ({ text, light }) => (
  <div
    style={{
      position: "absolute",
      right: 72,
      bottom: 72,
      fontFamily: FONT_STACK,
      fontSize: 24,
      letterSpacing: 3,
      color: light ? "rgba(20,17,15,.45)" : "rgba(238,230,210,.5)",
      zIndex: 7,
    }}
  >
    ☾ {text}
  </div>
);
