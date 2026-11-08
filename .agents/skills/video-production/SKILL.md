---
name: video-production
description: 短视频制作与渲染出片。用户要渲染、出片、成片、合成视频、写 Remotion 动画场景、做预览，或文案/配音已完成要进入制作阶段时使用。组装 props.json、TTS 配音落地、整轨预混、gen 场景编写、preview/final 渲染与验收。
---

# video-production：视频内容制作

从 script.json 到 `backend/storage/renders/<pid>/final.mp4`。创作判断（分镜编排、风格落实、gen 场景编写）由你完成，确定性执行走 CLI 工具。

## 前置检查

1. `backend/storage/projects/<pid>/script.json` 存在且合法（schema 见 `video-script` 的 script-schema）。
2. 若 `plan.json` 不存在（没走 video-style 阶段）：先做**模板相关性判定**（总入口 ★规则），然后自己完成逐镜编排（camera/transition/grade/overlay...，规范见 `references/engine-contract.md` §枚举），落 `plan.json`。
3. 明确配音模式（三选一，与用户确认或按默认 `tts`）：`tts`（edge-tts）/ `custom`（用户提供音频）/ `none`（纯字幕+音乐）。

## 制作流程

### 第 1 步 · 配音落地（tts 模式）

```bash
cd backend && python tools/tts_gen.py --pid <pid> --script storage/projects/<pid>/script.json
```

输出 JSON 的 `durations`（`{line_id: 秒}`）直接用于 props。`custom` 模式：把用户音频放到 `public/voice/projects/<pid>/`，按字数占比分摊每句 durationSec（整段）或按句长占比（分幕）。`none` 模式：`durationSec = max(1.4, 0.35 + 字数/3.6)`，不写 audio 字段。

### 第 2 步 · 组装 props.json

按 `references/engine-contract.md` 的 schema 组 camelCase props，写到 `backend/storage/renders/<pid>/props.json`：
- 逐句：`id`/`text`/`durationSec`（TTS 实测）/`audio`（`voice/projects/<pid>/<lid>.wav`）/`pauseAfter`（标点表）/`emphasis`（plan 的关键词过滤为台词子串，兜底用数字/引语）。
- 逐镜：colors/image/scene/camera/enterTransition/grade/overlay/sfxMoment/atmosphere 来自 plan.json（映射规则见总入口 `pipeline-contracts.md` §6）。
- 顶层：title/kicker/look/grainOpacity（各镜 grain 的均值）/bgm（有 BGM 时带 `beats` 数组）/**`safeScale`（默认 0.8，抖音安全画幅；来自 `build_config.json` 的 `safe_scale`，缺省回落 `plan.json.safeScale`）**。
- 首镜 `enterTransition` 固定 `dissolve`；from_scratch 项目 `scene` 只允许 null 或 `gen:<pid>:<NN>`、atmosphere 禁 `stars`。
- 用 `build_props.py --project <pid>` 组装时，`build_config.json` 里写 `"safe_scale": 0.8`（默认预设，见 `references/platform-presets.md`）。

### 第 3 步 · 整轨预混（tts/custom 逐句音频时必须）

```bash
cd backend && python tools/premix_track.py --pid <pid> --props storage/renders/<pid>/props.json
# MotionShow 加 --template motionshow
```

工具把逐句 wav 按 timeline.ts 同款常量混成 `track.wav` 并改写 props（narrationAudio 指整轨、逐句 audio 清空）。**不要跳过**：Remotion 嵌套 Sequence 音频有碎片化 bug，根级整轨才可靠。

### 第 4 步 · gen 场景（可选，画面需要代码动画时）

读 `references/gen-scene-contract.md`，在 `remotion-engine/src/gen/<pid>/SceneNN.tsx` 现场编写组件、重写 `src/gen/registry.ts`，过 `npx tsc --noEmit` + still 抽验，≤2 轮修复，失败回退渐变不阻塞。from_scratch 项目的定制画面主要靠这一步。

### 第 5 步 · 渲染（先预览后整片）

```bash
cd backend
# ① 抽帧快检（可选但推荐，比渲染快得多）
python tools/render_video.py --props storage/renders/<pid>/props.json --out storage/renders/<pid>/check.png --still 180
# ② 前 10 秒预览，给用户过目
python tools/render_video.py --props storage/renders/<pid>/props.json --out storage/renders/<pid>/preview.mp4 --frames 0-299
# ③ 用户确认后渲整片
python tools/render_video.py --props storage/renders/<pid>/props.json --out storage/renders/<pid>/final.mp4
```

preview/final 之间**必须**等用户确认（避免整段废片）。预览不合格 → 改 props/场景 → 重跑预混与预览。

### 第 6 步 · 验收

对照 `references/acceptance.md` 清单自查。**默认预设下必须加一步「平台裁切模拟」**：按抖音可见区（裁 x139~941 → 802×1920）抽 3~5 帧，确认片头/字幕/数字/印章无切字。交付时报告：成片路径、时长、镜数、卡点情况、safeScale、遗留问题。

**事实审计（渲 final 前建议，无人值守流水线强制硬闸门）**：

```bash
cd backend && python -X utf8 tools/facts_audit.py \
  --script storage/projects/<pid>/script.json \
  --research storage/projects/<pid>/research.json --strict
```

出现 `unverifiable` 的数字：改 script 删掉/改定性表述，或把权威事实连同来源补进 research.json，重跑到 0 为止。daily 流水线会按最终 script+research **重算**复核（不过关自动派返修会话）。

**视觉自查（建议级，严格控 token）**：渲完 final 后跑 `tools/acceptance_frames.py`（≤6 帧，540×960，前 2 张镜内帧带抖音裁切模拟版），Read 图片**一次批量判定**（字幕贴边/乱码/黑屏/构图/深色背景），能小修的改后重渲并只复检失败帧；结果落 `backend/storage/renders/<pid>/acceptance.json`（schema 见总入口 `pipeline-contracts.md` §8）。硬上限：一轮判定+一次复检，不逐帧反复看图。daily 流水线把该结果记录进飞书结果卡（不拦截交付）。

## 渲染失败排查顺序

1. 看 stdout JSON 的 `tail`（渲染日志最后 15 行）；
2. props 路径错误（必须相对 `public/`）→ 修 props；
3. tsc 类型错（有 gen 场景时）→ 修场景或临时删该场景文件重写 registry；
4. `npx remotion` 报 composition 找不到 → 确认在 `remotion-engine/` 下、comp 名为 `DataVideo`/`MotionShow`。

## 环境注意

- Python 工具在 `backend/` 下执行；npx 命令在 `remotion-engine/` 下执行。
- 渲染超时默认 1800 秒；preview（300 帧）通常 1~3 分钟，整片视时长 5~20 分钟。
- 引擎源码（`src/dv/*`）默认不改（时间轴/布局数学冻结）；平台画幅适配已内置为 `props.safeScale` 参数，直接用，别改布局数学。确需改引擎时：timeline.ts 与 voice.py 时间轴常量必须同步 + `npx tsc --noEmit` 通过。
