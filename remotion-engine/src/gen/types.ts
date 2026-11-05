// AI 现场编写场景的类型合同（backend gen_scenes.py 约定）。
// 生成的组件位于 src/gen/<pid>/SceneNN.tsx，props 语义：
//   p      本镜进度 0~1（全部动画由 p 驱动，确定性）
//   c1/c2  调色板两色（大面积铺陈）
//   accent 强调色（高亮/发光点缀）
//   speed  0.5~2 速度微调
//   seed   确定性随机种子（随机只准用 rand(seed+k) 家族）
import type React from "react";

export interface GenSceneMark {
  /** 本句在镜内的起点（0~1，已按镜长归一） */
  start: number;
  /** 本句在镜内的时长（0~1） */
  dur: number;
}

export interface GenSceneProps {
  p: number;
  c1: string;
  c2: string;
  accent: string;
  speed: number;
  seed: number;
  /**
   * 逐句时间窗（P0 数据游标用）：场景可以把“解说某事件”的那一句映射到确定的 p，
   * 让游标在念到该事件时停在事件日，而不是线性扫过去。
   */
  marks?: GenSceneMark[];
}

export type GenSceneComponent = React.FC<GenSceneProps>;
