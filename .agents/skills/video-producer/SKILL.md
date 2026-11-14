---
name: video-producer
description: 竖屏短视频制作总入口与流程规范（内容选题→视频文案→BGM→配音→视频风格→视频内容）。凡用户要做视频、出片、短视频口播稿、AI 生成视频，或提到选题/文案/脚本/配音/BGM/背景音乐/视频风格/渲染/成片任一环节时，必须先读本 skill 建立全局约定（pid、目录契约、产物 schema、模板相关性规则），再进入对应阶段 skill。
---

# video-producer：视频制作流程总规范

本工作区的视频由 **AI agent 主导编排**：创作判断（选题、写稿、选曲决策、风格设计、分镜编排）由你直接完成，方法论与规范从本 skill 家族的知识库中读取；确定性执行（TTS、混音、渲染、搜索、节拍分析）调用 `backend/tools/` 下的 CLI 工具，不复制其内部逻辑。FastAPI 旧流程（六步门禁向导）保留可用但不再是主路径，见 `references/legacy-backend.md`。

## 六阶段流水线

| # | 阶段 | Skill | 产物 | 依赖的 CLI 工具 |
|---|---|---|---|---|
| 1 | 内容选题 | `video-topic` | `backend/storage/projects/<pid>/meta.json`（+ 可选 research.json） | WebSearch 或后端热点雷达 |
| 2 | 视频文案 | `video-script` | `backend/storage/projects/<pid>/script.json` | — |
| 3 | BGM | `video-bgm` | `public/bgm/<name>.mp3` + bpm/beats | `tools/gen_event_bgm.py`、`tools/beat_analyze.py` |
| 4 | 配音 | `video-voiceover` | `public/voice/projects/<pid>/s01_0.wav...` | `backend/tools/tts_gen.py` |
| 5 | 视频风格 | `video-style` | `backend/storage/projects/<pid>/plan.json` | — |
| 6 | 视频内容 | `video-production` | `backend/storage/renders/<pid>/final.mp4`（+ `facts_audit.json` 事实审计 / `acceptance.json` 视觉自查） | `tools/tts_gen.py`、`tools/premix_track.py`、`tools/render_video.py`、`tools/facts_audit.py`、`tools/acceptance_frames.py` |

**阶段顺序即数据依赖**：文案定字数与幕数 → 配音定每句实测时长 → BGM 节拍与配音时长是风格/分镜的输入（切镜卡拍、幕长规划）→ 制作阶段组装全部产物。用户跳阶段（如只要文案）没问题，但要做完整视频时按此顺序推进，每阶段产物落盘后再进下一阶段。注意：需要事件级卡点时，BGM 生成分两步——先填节拍网格组 props 算出分镜时间轴，再按事件时刻生成（`video-bgm` 有完整流程）。

## 全局约定

1. **pid**：项目标识，小写字母数字短横线（如 `sky-blue-2026`）或 12 位 hex。每个视频一个 pid，全程不变。
2. **目录契约**（读写都在仓库根 `D:\work\Video_Workflow` 下）：
   - 项目产物：`backend/storage/projects/<pid>/`（`script.json`、`plan.json`、`research.json` 等）
   - 配音：`remotion-engine/public/voice/projects/<pid>/s01_0.wav`...（预混整轨 `track.wav`）
   - 图片：`remotion-engine/public/pic/projects/<pid>/`（props 里引用相对 `public/` 的路径）
   - BGM/SFX 曲库：`remotion-engine/public/bgm/`、`public/sfx/`
   - 成片：`backend/storage/renders/<pid>/`（`props.json`、`preview.mp4`、`final.mp4`、`cover.jpg`）
   详细 schema 见 `references/pipeline-contracts.md`——**写任何产物 JSON 前必读**。
3. **Windows 环境**：Python 用 `python`（在 `backend/` 下跑工具，依赖已装）；仓库内 Node 命令在 `remotion-engine/` 下跑 `npx`。
4. **默认出片预设（抖音竖屏安全画幅，必须默认带上）**：`plan.json` 写 `safeScale: 0.8`，`build_config.json` 写
   `safe_scale: 0.8`；内容落在 x 185~895 / y 300~1460；运镜幅度 ≤1.1；验收按 802×1920 模拟平台裁切抽帧。
   原因：抖音 20:9 机型/预览页 cover 铺满会裁掉左右各 ≈13%。完整预设见
   `references/platform-presets.md`（换平台公式、UI 避让区、9:20 备选都在这）。

## ★ 开场 5 秒与片长结构（所有视频默认，2026-11-12 起，硬规则）

依据本账号 26 条作品实测：2s 跳出中位 43%、5s 完播 28.7%、平均播放 9.7 秒、完播 2.54%。流量差的主因在开场与结构，不在选题。

- **动作 1（开场）**：0–5 秒 = 数字 → 反差 → 代价。第 1 句给具体数字/事实，第 2 句给反差，第 3 句给代价。前 5 秒禁止自我介绍、禁止「本期/今天/大家好/这期聊」、禁止栏目或频道信息；**首帧必须是画面事件**（数据图/剖面/对比尺/实物），禁止纯渐变底 + 大字标题。
- **动作 2（结构）**：`target_seconds` 默认 **45**（30–60 区间，用户明确要求才延长）；固定 **3 台阶 × 15 秒**，每台阶结论先行 + 证据；**第 10 秒前必须交付第一个完整价值**（实测平均观看仅 9.7 秒）。
- **不注入人设**：全片不写固定开场白/结束语，不出现「我是阿扎」式自我介绍；品牌/栏目信息需要时放 0:05 之后，全片最多 1 句。
- 判定线：2s 跳出 ≤35%、5s 完播 ≥45%、完播 ≥8%。不达标先改开场，不换选题。

## ★ 模板相关性规则（每次制作前必须执行，继承自 AGENTS.md）

渲染引擎没有内置领域场景，`scene.kind` 只支持 `gen:<pid>:<NN>`（由你现场编写的 Remotion 组件）。制作前判断选题与引擎能力是否相关：

- **无关（from_scratch，默认）**：禁止编排行星/宇宙/太阳系等模板性意象动效。画面通过 图片/配色/构图 + 你现场编写的 gen 场景实现；风格与分镜照常设计。判定结论写入 `backend/storage/projects/<pid>/plan.json` 的 `template` 字段：`{"mode": "from_scratch", "reason": "...", "reusable": ["通用运镜词表", ...]}`。
- **有关（reuse）**：列出可复用项（哪个 gen 场景/音效/图），只复用匹配项，其余原创，结论同样落 `plan.json`（`mode: "reuse"`）。
- **判不准按无关处理**。产出 props 时落实：from_scratch 的镜头 `scene` 只允许 `null` 或 `gen:<pid>:<NN>`，`atmosphere.kind` 禁用 `stars`。

## 阶段路由

- 用户给了主题要"做一条视频" → 从选题或文案开始，依次推进，最后必走 `video-production`。
- 用户只说"写个文案/口播稿" → `video-script`，写完停，问是否继续配音/制作。
- 用户说"渲染/出片/成片"，且 script.json 已存在 → `video-production`。
- 每个阶段产物落盘后向用户简报（产物路径 + 关键决策），需要用户拍板的点（语气、风格方向、预览确认）先问再做。

## 本 skill 的参考文档

- `references/pipeline-contracts.md` —— pid 目录契约、script.json / props.json / plan.json 完整 schema、line id 约定、时长与停顿公式。**所有阶段共用，写产物前必读。**
- `references/platform-presets.md` —— **平台发布预设（默认）**：抖音 9:16 安全画幅 `safeScale 0.8`、内容安全区、运镜上限、UI 避让、裁切验收命令、换平台公式、9:20 备选。做竖屏视频默认按它执行。
- `references/legacy-backend.md` —— 双轨说明：FastAPI 旧六步端点一览、何时还需要启动后端、skill 流程与旧流程的产物如何互通。
- `references/topic-selection.md` —— 选题方法论（已由 `video-topic` skill 承接，此文件保留作背景知识）。
