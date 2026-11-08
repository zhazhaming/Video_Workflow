// localthings-vibe · 本项目共用令牌与小件（纸感浅色系 · 墨绿强调 · 智能家居意象）
import React from "react";
import { rand } from "../../dv/atmosphere";

export const INK = "#14110F";
export const MUTED = "rgba(20,17,15,0.6)";
export const LINE = "rgba(20,17,15,0.14)";
export const PAPER = "#FDFBF5";
export const SHADOW = "0 22px 54px rgba(20,17,15,0.14), 0 3px 10px rgba(20,17,15,0.08)";

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
/** 回弹入场（印章/徽章类爆点） */
export const easeBack = (t: number) => {
  const x = clamp01(t);
  const s = 1.7;
  return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
};
/** 退场：最后 12% 整体淡出（场景背景渐变保留，只淡内容层） */
export const exitFade = (p: number) => 1 - clamp01((p - 0.88) / 0.12);

/** 骨架条：场景内不带文字的通用信息条 */
export const Bar: React.FC<{ w: number; h: number; c?: string; r?: number }> = ({ w, h, c = LINE, r }) => (
  <div style={{ width: w, height: h, borderRadius: r ?? h / 2, background: c }} />
);

/** 环形描边 */
export const Ring: React.FC<{
  size: number; c?: string; w?: number; dashed?: boolean; style?: React.CSSProperties;
}> = ({ size, c = LINE, w = 2, dashed, style }) => (
  <div
    style={{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: "50%",
      border: `${w}px ${dashed ? "dashed" : "solid"} ${c}`,
      boxSizing: "border-box",
      ...style,
    }}
  />
);

/** 上升/漂浮微粒（确定性） */
export const makeDots = (
  seed: number, n: number, area: { x0: number; x1: number; y0: number; y1: number },
) =>
  Array.from({ length: n }, (_, k) => ({
    x: area.x0 + rand(seed + k * 3 + 40) * (area.x1 - area.x0),
    y0: area.y0 + rand(seed + k * 3 + 41) * (area.y1 - area.y0),
    r: 2.5 + rand(seed + k * 3 + 42) * 4.5,
    v: 40 + rand(seed + k * 3 + 43) * 90,
    tw: rand(seed + k * 3 + 44) * Math.PI * 2,
  }));

/** 小房子（几何线稿：坡屋顶 + 圆角房身 + 门），w×h 为房身尺寸 */
export const House: React.FC<{
  w: number; h: number; body?: string; stroke?: string; door?: string; style?: React.CSSProperties;
}> = ({ w, h, body = PAPER, stroke = INK, door, style }) => {
  const roofH = h * 0.42;
  return (
    <div style={{ position: "absolute", width: w + 56, height: h + roofH + 8, ...style }}>
      <div
        style={{
          position: "absolute", left: 28, top: roofH, width: w, height: h,
          background: body, border: `3px solid ${stroke}`, borderRadius: 14,
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          position: "absolute", left: 8, top: 0, width: w + 40, height: roofH + 4,
          background: body, border: `3px solid ${stroke}`, borderRadius: "12px 12px 4px 4px",
          clipPath: "polygon(50% 0, 100% 92%, 100% 100%, 0 100%, 0 92%)",
          boxSizing: "border-box",
        }}
      />
      {door !== undefined && (
        <div
          style={{
            position: "absolute", left: 28 + w / 2 - 22, top: roofH + h - 56,
            width: 44, height: 56, background: door, borderRadius: "10px 10px 0 0",
          }}
        />
      )}
    </div>
  );
};
