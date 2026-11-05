// ashare-2026 Scene06 —— 新低与反攻（V3 对标版：年代戳 + 进度点 + 水印 chrome 组装）
import React from "react";
import type { GenSceneProps } from "../types";
import { clamp } from "../../dv/atmosphere";
import { YearChart } from "./chart";
import { EraStamp, ProgressDots, Watermark } from "../_lib/chrome";

const SCENE_INDEX = 5 // 0 起，共 7 章

const Scene06: React.FC<GenSceneProps> = ({ p, c1, c2, accent, speed, seed, marks }) => {
  const m = marks ?? [];
  const at = (i: number, f: number) =>
    m[i] ? clamp(m[i].start + f * m[i].dur, 0, 1) : i === 0 ? 0.12 : 0.62;
  // 念 10/30 时停在 3599；念 11/2 时停在 3638（+1.08%）；最后一天 3608。
  const stops = [
    { p: 0, day: 248 },
    { p: at(0, 0), day: 248 },
    { p: at(0, 0.45), day: 248 },
    { p: at(0, 1), day: 248 },
    { p: at(1, 0), day: 249 },
    { p: at(1, 0.9), day: 249 },
    { p: 1, day: 250 },
  ];
  return (
    <>
      <YearChart p={p * (speed ?? 1)} a={210} b={250} mode="window" c1={c1} c2={c2} accent={accent} seed={seed} stops={stops} />
      <EraStamp year="2026.10" place="上海 · 年内新低" accent={accent} seed={10} />
      <ProgressDots index={SCENE_INDEX} total={7} accent={accent} />
      <Watermark text="Vibe数据大赏" />
    </>
  );
};

export default Scene06;
