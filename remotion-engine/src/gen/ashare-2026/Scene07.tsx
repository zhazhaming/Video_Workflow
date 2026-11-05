// ashare-2026 Scene07 —— 终章·复盘（V3 对标版：年代戳 + 进度点 + 水印 chrome 组装）
import React from "react";
import type { GenSceneProps } from "../types";
import { clamp } from "../../dv/atmosphere";
import { YearChart } from "./chart";
import { EraStamp, ProgressDots, Watermark, RecapTree } from "../_lib/chrome";

const SCENE_INDEX = 6 // 0 起，共 7 章

const Scene07: React.FC<GenSceneProps> = ({ p, c1, c2, accent, speed, seed }) => {
  return (
    <>
      <YearChart p={p * (speed ?? 1)} a={0} b={250} mode="final" c1={c1} c2={c2} accent={accent} seed={seed} />
      <EraStamp year="2026.11" place="此刻 · 你" accent={accent} seed={13} />
      <ProgressDots index={SCENE_INDEX} total={7} accent={accent} />
      <RecapTree
        title="这一年，三个数字"
        columns={[
          { head: "顶 · 5·13", color: "#E2604A", subs: ["4243 全年最高", "冲顶即回落"] },
          { head: "底 · 10·30", color: "#3FBF7F", subs: ["3599 年内新低", "最大回撤 15%"] },
          { head: "今 · 11·03", color: "#E8D9A8", subs: ["3608 收盘 -0.82%", "全年 -7.8%"] },
        ]}
        footer="截图保存 · 转给还在补仓的朋友"
        p={clamp((p - 0.5) / 0.14, 0, 1)}
        accent={accent}
        seed={17}
      />
      <Watermark text="Vibe数据大赏" />
    </>
  );
};

export default Scene07;
