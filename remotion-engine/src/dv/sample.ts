// Studio 预览 / 兜底示例 props（无 --props 输入时使用）
import type { RenderProps } from "./types";

export const SAMPLE_DATAVIDEO: RenderProps = {
  title: "示例视频",
  kicker: "60 秒看懂",
  shots: [
    {
      year: "2026",
      label: "开篇",
      colors: ["#141b3a", "#2a3a6a"],
      lines: [{ id: "s01_0", text: "这是渲染引擎的示例画面", durationSec: 2.4, pauseAfter: 0.5 }],
      tail: 0.6,
      atmosphere: { kind: "stars", opacity: 0.5 },
    },
    {
      colors: ["#3a1f2b", "#6a2a3a"],
      lines: [{ id: "s02_0", text: "在网页端新建项目即可出片", durationSec: 2.4, pauseAfter: 0.4 }],
      tail: 0.6,
      enterTransition: "zoom",
      overlay: { kind: "counter", value: 42, unit: "%", label: "示例计数浮层" },
    },
  ],
  bgm: null,
  titleCard: true,
};

export const SAMPLE_MOTIONSHOW: RenderProps = {
  title: "MotionShow 示例",
  shots: [
    {
      colors: ["#f4efe6", "#e7dfcf"],
      lines: [{ id: "s01_0", text: "轻量版式逐句展示", durationSec: 2.2, pauseAfter: 0.35 }],
      tail: 0.6,
      enterTransition: "slide",
    },
    {
      colors: ["#141b3a", "#2a3a6a"],
      lines: [{ id: "s02_0", text: "适合知识干货与工具盘点", durationSec: 2.2, pauseAfter: 0.35 }],
      tail: 0.6,
      enterTransition: "dissolve",
    },
  ],
  titleCard: false,
};
