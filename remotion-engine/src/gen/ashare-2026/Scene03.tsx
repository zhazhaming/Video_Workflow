// ashare-2026 Scene03 —— 暴跌与反弹（V3 对标版：年代戳 + 进度点 + 水印 chrome 组装）
import React from "react";
import type { GenSceneProps } from "../types";
import { clamp } from "../../dv/atmosphere";
import { YearChart } from "./chart";
import { EraStamp, ProgressDots, Watermark } from "../_lib/chrome";

const SCENE_INDEX = 2 // 0 起，共 7 章

const Scene03: React.FC<GenSceneProps> = ({ p, c1, c2, accent, speed, seed, marks }) => {
  const m = marks ?? [];
  const at = (i: number, f: number) =>
    m[i] ? clamp(m[i].start + f * m[i].dur, 0, 1) : i === 0 ? 0.12 : 0.62;
  const stops = [
    { p: 0, day: 100 },
    { p: at(0, 0), day: 100 },
    { p: at(0, 1), day: 100 },
    // 第二句“又大涨 2.69%”一开口就到 4/8
    { p: at(1, 0), day: 111 },
    { p: at(1, 1), day: 111 },
    { p: 1, day: 120 },
  ];
  return (
    <>
      <YearChart p={p * (speed ?? 1)} a={86} b={120} mode="window" c1={c1} c2={c2} accent={accent} seed={seed} stops={stops} />
      <EraStamp year="2026.03" place="上海 · 3·23 暴跌" accent={accent} seed={7} />
      <ProgressDots index={SCENE_INDEX} total={7} accent={accent} />
      <Watermark text="Vibe数据大赏" />
    </>
  );
};

export default Scene03;
