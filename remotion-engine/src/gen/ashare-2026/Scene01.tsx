// ashare-2026 Scene01 —— 序章·全年扫动（V3 对标版：年代戳 + 进度点 + 水印 chrome 组装）
import React from "react";
import type { GenSceneProps } from "../types";
import { YearChart } from "./chart";
import { EraStamp, ProgressDots, Watermark } from "../_lib/chrome";

const SCENE_INDEX = 0 // 0 起，共 7 章

const Scene01: React.FC<GenSceneProps> = ({ p, c1, c2, accent, speed, seed }) => {
  // 开场第一句说的是“昨天大涨 1.08%”，所以画面不能从 2025.10 慢慢扫——
  // 直接把全年画到 11/2，游标停在昨天（3638 / +1.08%），第二句“这一年的过山车”
  // 再用同一条全年线承接，信息与口播一致。
  const stops = [
    { p: 0, day: 249 },
    { p: 1, day: 249 },
  ];
  return (
    <>
      <YearChart p={p * (speed ?? 1)} a={0} b={249} mode="sweep" c1={c1} c2={c2} accent={accent} seed={seed} stops={stops} />
      <EraStamp year="2026.11" place="此刻 · 回看全年" accent={accent} seed={11} />
      <ProgressDots index={SCENE_INDEX} total={7} accent={accent} />
      <Watermark text="Vibe数据大赏" />
    </>
  );
};

export default Scene01;
