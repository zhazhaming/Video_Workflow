// ashare-2026 Scene04 —— 全年之顶（V3 对标版：年代戳 + 进度点 + 水印 chrome 组装）
import React from "react";
import type { GenSceneProps } from "../types";
import { clamp } from "../../dv/atmosphere";
import { YearChart } from "./chart";
import { EraStamp, ProgressDots, Watermark } from "../_lib/chrome";

const SCENE_INDEX = 3 // 0 起，共 7 章

const Scene04: React.FC<GenSceneProps> = ({ p, c1, c2, accent, speed, seed, marks }) => {
  const m = marks ?? [];
  const at = (i: number, f: number) =>
    m[i] ? clamp(m[i].start + f * m[i].dur, 0, 1) : i === 0 ? 0.12 : 0.62;
  const stops = [
    { p: 0, day: 133 },
    { p: at(0, 0), day: 133 },
    { p: at(0, 0.45), day: 133 },
    { p: at(0, 1), day: 133 },
    { p: at(1, 0), day: 133 },
    { p: at(1, 0.8), day: 150 },
    { p: 1, day: 150 },
  ];
  return (
    <>
      <YearChart p={p * (speed ?? 1)} a={120} b={150} mode="window" c1={c1} c2={c2} accent={accent} seed={seed} stops={stops} />
      <EraStamp year="2026.05" place="上海 · 见顶 4243" accent={accent} seed={8} />
      <ProgressDots index={SCENE_INDEX} total={7} accent={accent} />
      <Watermark text="Vibe数据大赏" />
    </>
  );
};

export default Scene04;
