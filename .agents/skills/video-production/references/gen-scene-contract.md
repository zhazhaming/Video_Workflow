# gen 场景契约（AI 现场编写动画场景）

> 权威定义：`remotion-engine/src/gen/types.ts`、`src/dv/atmosphere.ts`（rand 家族）、`src/gen/registry.ts`。
> 适用：画面需要"演出来"的代码动画时（from_scratch 项目的主要画面手段）。

## 1. 何时写 gen 场景

- 台词命中具体意象且图片/渐变表达不了（如数据流、粒子汇聚、文字雨）。
- from_scratch 项目需要定制画面主体时。
- **模板相关性已判为无关的选题，禁止使用行星/宇宙/太阳系意象**——写贴合本选题的新场景。
- 数量 3~5 个足够（挑全片关键节拍：钩子/比喻/反转/落点），不必每镜都写。

## 2. 组件契约（硬约束）

文件：`remotion-engine/src/gen/<pid>/SceneNN.tsx`（NN 两位序号 01,02,...）。

```tsx
import React from "react";
import type { GenSceneProps } from "../types";
import { rand, randRange, mixHex } from "../../dv/atmosphere";

const SceneNN: React.FC<GenSceneProps> = ({ p, c1, c2, accent, speed, seed }) => {
  // 全部动画由 p（本镜进度 0~1）驱动；随机只用 rand(seed + k) 家族
  const items = React.useMemo(
    () => Array.from({ length: 60 }, (_, k) => ({ x: rand(seed + k), y: rand(seed + k * 3 + 1) })),
    [seed],
  );
  return <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1}, ${c2})` }}>...</AbsoluteFill>;
};
export default SceneNN;
```

props 语义：`p` 本镜进度 0~1（唯一时间驱动）；`c1/c2` 调色板两色（大面积铺陈）；`accent` 强调色
（高亮/发光点缀）；`speed` 0.5~2；`seed` 确定性随机种子（`hashStr(kind) % 9973`）。

**禁令**：`Math.random`、`Date.now`、网络/外部图片；随机只准 `rand(seed+k)` 家族；
只允许改 `src/gen/<pid>/` 下的文件，**不许手改 registry.ts 以外路径的引擎文件**。

**文字例外（场景即内容）**：默认禁止画面内文字（背景场景规范，避免与字幕打架）。当 gen 场景
本身就是信息主体（如图表、数据可视化）时，允许场景渲染必要的数字/日期/坐标标签，但必须：
与 look 的字体（FONT_STACK）与配色一致；放在安全区（顶部 y<300，避开底部字幕带 y>1400 与
进度条 y>1860）；字号克制（数值类 ≤64px）；并在 plan.json 注明"场景含信息文字"。

**设计要求**：入场动画在前 15% 的 p 内完成、退场在最后 12%；≥3 个视觉层次；粒子数组一次性预生成
（`useMemo` 或模块级常量），全场景元素总数 ≤220；只用 transform/opacity 动画（`spring()` 入场、
`interpolate()` 线性段），避免逐帧 filter；固定画布 1080×1920。

## 3. registry 注册（重写，勿手改累积）

`src/gen/registry.ts` 由你重写生成，格式：

```ts
import type { GenSceneComponent } from "./types";
import React from "react";
import Scene_skyblue2026_01 from "./skyblue2026/Scene01";

export const GEN_SCENES: Record<string, GenSceneComponent> = {
  "gen:skyblue2026:01": Scene_skyblue2026_01,
};
```

- 组件名 `Scene_<pid>_<NN>`；key 为 `gen:<pid>:<NN>`。
- **磁盘上所有项目的场景都要保留**：重写前先扫 `src/gen/*/Scene*.tsx`，把已有项目的映射合并进去，只增删本项目的条目。漏了别人项目的条目会让人家的视频黑屏退化为渐变。
- 组件默认导出必须是 `React.FC<GenSceneProps>`，否则 tsc 挂。

## 4. 闸门校验（顺序执行，≤2 轮修复）

1. `cd remotion-engine && npx tsc --noEmit` —— 整项目类型检查；不过则修复，修不好的场景文件直接删除并同步 registry（别让它毒化后续）。
2. still 抽验：为本场景造一个单镜 8s 的最小 props（1 镜 1 句，`scene: {kind: "gen:<pid>:<NN>", palette: [c1,c2], accent}`），渲染帧 72 与 180 两张 PNG（`npx remotion still DataVideo`），PNG ≥8KB 即通过（全黑/空白会小于阈值）。
3. 两轮都过不了 → 放弃该场景，镜头回退 colors 渐变（渲染端对缺失 gen 场景自动退化为渐变，不黑屏），绝不阻塞出片。

## 5. 接入 props

通过校验的场景写进 `plan.json` 对应镜头：`"scene": {"kind": "gen:<pid>:<NN>", "palette": ["#..","#.."], "accent": "#..", "speed": 1.2}`，组装 props 时原样带入 RenderShot.scene。palette 两色贴台词情绪，accent 用 look 的强调色系。

## 6. 确定性 rand 家族（atmosphere.ts，签名冻结勿改）

```ts
rand(seed) = fract(sin(seed * 12.9898 + 78.233) * 43758.5453)  // 0~1
randRange(seed, min, max) = min + (max - min) * rand(seed)
mixHex(a, b, t) / lighten(hex, t) / luminance(hex)
```

同 seed 同输出——保证每次渲染、每帧重算结果一致（Remotion 逐帧渲染依赖此性质）。
