// 确定性随机与色彩小工具。gen_scenes 生成的场景组件约定从这里 import { rand }，
// 函数签名与语义不可随意变动（seed → [0,1)，同 seed 同结果）。

/** 确定性伪随机（sin 混淆哈希），渲染必须可复现：随机只准用 rand(seed + k) 家族。 */
export function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** [min, max) 区间确定性随机。 */
export function randRange(seed: number, min: number, max: number): number {
  return min + rand(seed) * (max - min);
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = (hex || "#000000").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** 两色按 t（0~1）线性混合，用于纸感模式提亮/暗化。 */
export function mixHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const ch = (x: number, y: number) => Math.round(lerp(x, y, t));
  return `#${[ch(r1, r2), ch(g1, g2), ch(b1, b2)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** 颜色提亮（paper 模式把深色底拉到浅色）。 */
export function lighten(hex: string, amount: number): string {
  return mixHex(hex, "#ffffff", amount);
}

/** 相对亮度（0 黑 ~ 1 白），判断底色深浅。 */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** 中文友好字体栈（Windows 渲染机优先微软雅黑，保证可复现）。 */
export const FONT_STACK =
  '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", "Source Han Sans SC", sans-serif';
export const MONO_STACK =
  '"Cascadia Mono", Consolas, "Microsoft YaHei", monospace';
