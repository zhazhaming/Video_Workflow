// ashare-2026 Scene02 —— 年初上冲（V3 对标版：年代戳 + 进度点 + 水印 chrome 组装）
import React from "react";
import type { GenSceneProps } from "../types";
import { clamp } from "../../dv/atmosphere";
import { YearChart } from "./chart";
import { EraStamp, ProgressDots, Watermark } from "../_lib/chrome";

const SCENE_INDEX = 1 // 0 起，共 7 章

const Scene02: React.FC<GenSceneProps> = ({ p, c1, c2, accent, speed, seed, marks }) => {
  const m = marks ?? [];
  const at = (i: number, f: number) =>
    m[i] ? clamp(m[i].start + f * m[i].dur, 0, 1) : i === 0 ? 0.12 : 0.62;
  // 念「3914 起步」时停在起点；念「涨到 4163」时才走到 2/27 的 4163。
  const stops = [
    { p: 0, day: 0 },
    { p: at(0, 0), day: 0 },
    // 第二句一开口就应该是 4163，而不是念到句尾才爬到
    { p: at(1, 0), day: 84 },
    { p: at(1, 0.9), day: 84 },
    { p: 1, day: 84 },
  ];
  return (
    <>
      <YearChart p={p * (speed ?? 1)} a={0} b={84} mode="window" c1={c1} c2={c2} accent={accent} seed={seed} stops={stops} />
      <EraStamp year="2025.10" place="上海 · 上证指数" accent={accent} seed={6} />
      <ProgressDots index={SCENE_INDEX} total={7} accent={accent} />
      <Watermark text="Vibe数据大赏" />
    </>
  );
};

export default Scene02;
