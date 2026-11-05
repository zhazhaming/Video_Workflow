// ashare-2026 Scene05 —— 二次探底（V3 对标版：年代戳 + 进度点 + 水印 chrome 组装）
import React from "react";
import type { GenSceneProps } from "../types";
import { clamp } from "../../dv/atmosphere";
import { YearChart } from "./chart";
import { EraStamp, ProgressDots, Watermark } from "../_lib/chrome";

const SCENE_INDEX = 4 // 0 起，共 7 章

const Scene05: React.FC<GenSceneProps> = ({ p, c1, c2, accent, speed, seed, marks }) => {
  const m = marks ?? [];
  const at = (i: number, f: number) =>
    m[i] ? clamp(m[i].start + f * m[i].dur, 0, 1) : i === 0 ? 0.12 : 0.62;
  const stops = [
    { p: 0, day: 179 },
    { p: at(0, 0), day: 179 },
    { p: at(0, 0.45), day: 179 },
    { p: at(0, 1), day: 179 },
    { p: at(1, 0), day: 179 },
    { p: at(1, 0.8), day: 201 },
    { p: 1, day: 201 },
  ];
  return (
    <>
      <YearChart p={p * (speed ?? 1)} a={163} b={201} mode="window" c1={c1} c2={c2} accent={accent} seed={seed} stops={stops} />
      <EraStamp year="2026.07" place="上海 · 7·17 二次暴跌" accent={accent} seed={9} />
      <ProgressDots index={SCENE_INDEX} total={7} accent={accent} />
      <Watermark text="Vibe数据大赏" />
    </>
  );
};

export default Scene05;
