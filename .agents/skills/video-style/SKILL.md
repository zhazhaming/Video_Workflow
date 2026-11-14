---
name: video-style
description: 短视频视觉风格与逐镜分镜编排。用户要定风格、出风格方案、写分镜、编排运镜/转场/调色/浮层，或文案配音完成后要做导演方案时使用。内置 29 种画风风格库（references/style-library.md：水墨/水彩/木刻/蓝图/贴纸科普/等轴/像素/ASCII/粒子聚散/Synthwave/Risograph/玻璃拟态/扫描HUD/积木/爆炸拆解等），点名或挑选画风时必查。产出 plan.json（look + 逐镜编排 + 模板相关性判定落库）。
---

# video-style：视频风格与分镜编排

两件事：①**模板相关性判定**（总入口 ★规则，先做）；②**风格圣经 + 逐镜编排**（让每一镜在风格内做出节奏变化）。

## 流程

1. **模板相关性判定**：判断选题与引擎内置能力（gen 场景机制、通用运镜/转场/调色词表）是否相关。无关（默认）→ `from_scratch`：画面主体交给 配图/配色/构图动效/gen 场景，禁止行星宇宙类模板意象与 stars 氛围；有关 → 列可复用清单。结论落 `plan.json` 的 `template` 字段（mode/reason/reusable），**不许静默注入模板元素**。
2. **定风格圣经（look）**：按 `references/style-rules.md` 选 preset/色板/字体/质感/氛围；用户点名画风、或题材需要某种具体画风（水墨/像素/蓝图/粒子等）时，查 `references/style-library.md` 的 29 张风格卡（含提示语模板、失败点、Remotion gen 场景落地要点），按卡写 look 与场景设计提示词。硬约束：ink 与背景对比度 ≥4.5:1、accent 低饱和印刷感、**AI 味四禁令**（深底霓虹/字全居中/紫色渐变/全片淡入淡出；深底风格卡整片专用时例外，见 style-library.md §怎么用-4）。先判断题材气质（故事/盘点/悬疑/励志/科普）再定风格，别套模板。
3. **默认画幅预设（抖音竖屏，必须带）**：`plan.json` 顶层写 **`safeScale: 0.8`**（抖音 20:9 机型/预览页 cover 会裁左右各 ≈13%，引擎会把整镜缩到中央安全区）。同时运镜幅度 **camIntensity ≤1.1**（push≤1.1 / dolly_zoom≤0.8 / diag_in≤0.75 / pan≤0.6 / pull≤0.9），否则缩放会把贴边内容推出安全区。详见总入口 `references/platform-presets.md`。
4. **逐镜编排**：按 `references/motion-lexicon.md` 的词典给每镜 camera/intensity/transition/grade/overlay/sfxMoment/emphasis。规则：相邻镜主运镜不同、同向运镜连续≤2镜、相邻镜不用相同强转场、首镜固定 dissolve、overlay 全片 20%~40% 镜头且相邻不重复、sfxMoment ≤3 次、情绪曲线（低谷→积蓄→爆发→收尾）驱动强度。
5. **节奏自审**：对照 `references/motion-lexicon.md` 末尾的 7 点审查清单自查，输出最小修正（只改违规镜）。
6. **落盘**：`backend/storage/projects/<pid>/plan.json`（格式见总入口 pipeline-contracts.md §6，含 `safeScale`），向用户简报风格方向与节奏设计；关键分歧（如明暗基调）先问用户。

## 风格提案模式（用户没有明确风格时）

出 3 个**一眼能区分**的方案（明暗/冷暖/质感拉开，至少两个浅色、最多一个 dark），每个附一句为什么适合，用户选定后再往下。候选池 = 五套 preset + 风格库 29 卡：**出方案前必须先读 `references/style-library.md` 的 §选择决策表**，快速判断有没有比 preset 更贴合题材气质的风格卡；有贴合的就纳入候选并标卡号与落地档位（✅直接/🔶变通/⛔不建议），没有贴合的才回退纯 preset 组合。需要样图时用 `render_video.py --still` 各渲 1 张（样图 props 只含首镜）。
