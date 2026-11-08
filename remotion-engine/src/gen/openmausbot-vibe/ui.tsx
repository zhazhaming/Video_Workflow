// openmausbot-vibe · 本项目共用令牌与小件（纸感浅色系，改写自 agent-desktop-2026/ui 的令牌约定）
import React from "react";

export const INK = "#14110F";
export const MUTED = "rgba(20,17,15,0.6)";
export const LINE = "rgba(20,17,15,0.14)";
export const PAPER = "#FDFBF5";
export const SHADOW = "0 22px 54px rgba(20,17,15,0.14), 0 3px 10px rgba(20,17,15,0.08)";

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
/** 退场：最后 12% 整体淡出（场景背景渐变保留，只淡内容层） */
export const exitFade = (p: number) => 1 - clamp01((p - 0.88) / 0.12);

/** 骨架条：场景内不带文字的通用信息条 */
export const Bar: React.FC<{ w: number; h: number; c?: string; r?: number }> = ({ w, h, c = LINE, r }) => (
  <div style={{ width: w, height: h, borderRadius: r ?? h / 2, background: c }} />
);
