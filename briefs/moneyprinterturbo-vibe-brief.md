# 《Vibe 知识大赏 · MoneyPrinterTurbo 工具科普》竖屏视频制作简报（from_scratch 提示词包）

> 用途：抖音竖屏 1080×1920 · 约 60–66 秒 · 快节奏「Vibe 知识大赏」科普界面。
> 本文是 AGENTS.md 要求的**模板相关性判定 + 从零制作提示词包**：画面/动效全部由本片自定义实现，
> 不注入模板库（`DataVideo` / `src/dv/*`）的行星/宇宙类场景与星空氛围。
> 叙事结构：钩子 → 主角 → 旧做法痛点 → 流水线洞察 → 脚本/配音/画面三步拆解 → 输出 → 三种跑法 → 两个坑 → 评论区。
> 实施入口：`backend/tools/run_moneyprinterturbo_vibe.py` → Remotion composition `MoneyPrinterTurboVibe`
> （`D:\Work\remotion-life-sim\src\vibe-mpt\`）。

---

## 1. 模板相关性判定（必填）

| 项 | 结论 |
|---|---|
| 判定模式 | **`from_scratch`（从零开始）** |
| 原因 | 题材是「AI 短视频生产工具」科普，与模板库的**行星/宇宙/地球演化 / 天体碰撞**场景域完全无关 |
| 复用清单 | 仅复用**基础设施与设计系统**：Remotion 宿主工程、`Root.tsx` 注册方式、`voice.py` 配音、`beat.py` 拍点分析、`src/vibe-agent/fx.tsx` 的通用动效原语（PageShell/CaptionBar/Chrome/KineticTitle/TerminalCard）、无版权 `sfx/` 基建 |
| 禁止项 | ❌ 不注入任何 `dv/*` 场景；❌ 不用 `atmosphere=stars` 星空；❌ 不复用旧占位图；❌ 不用紫色渐变 / 荧光青霓虹 |
| 落库 | `briefs/moneyprinterturbo-vibe-plan.json` + `backend/storage/_moneyprinterturbo-vibe_script.json` + `renders/moneyprinterturbo-vibe/props.json` |

## 2. 项目概览

| 项 | 值 |
|---|---|
| 项目 id | `moneyprinterturbo-vibe` |
| 标题 | 打一行字，成片自己出来？MoneyPrinterTurbo 到底值不值得用 |
| 画幅/帧率 | 1080×1920 竖屏 @30fps，H.264 + AAC 48k |
| 成片时长 | 以实测配音时长为准，目标 **60–66s**（每个切点锁 BGM 拍点） |
| 结构 | 12 镜：钩子 → 主角 → 旧做法痛点 → 流水线 → 脚本 → 配音字幕 → 画面来源 → 输出 → 三种跑法 → 版权/查重/成本 → 工具边界 → 评论区 |
| 受众 | 想做短视频但不会剪辑的普通人、自媒体、电商/矩阵号运营、AI 工具爱好者 |
| BGM | 抖音「vibe 知识大赏」同款《We Never (Remix)》0.9x（`vibe_we_never.mp3`，90.04s / 112.3 BPM），口播时自动闪避 |
| 视觉语言 | 近黑舞台 `#07080B` + 米白墨色 `#F4F1EA` + 每镜主色（金 `#F5B942` / 珊瑚 `#FF6B57` / 薄荷 `#3DDC97` / 天蓝 `#5AB0FF`）；品牌角标「VIBE 知识大赏」+ 页计数器 + 分段进度条；逐字弹入标题、手机竖屏卡、五段流水线、终端卡片、素材网格、留存曲线 |

## 3. 事实来源（口播/字幕逐句可核）

事实卡：`briefs/moneyprinterturbo-facts.md`（README / GitHub API / release，2026-11-05 快照）。

- 定位：输入主题或关键词 → 脚本、配音、素材、字幕、BGM、合成全流程；WebUI / API / CLI / AI Agent 四种入口。来源：README-en L7/L188/L189
- 数字：GitHub **139,056★ / 22,187 fork**；MIT；Python；最新 release **v1.3.9（2026-10-21）**。来源：GitHub API、release API
- 脚本模型：Kimi/Moonshot、OpenAI、Claude、Gemini、DeepSeek、Qwen、Ollama 等。来源：README-en L197/L198
- 配音：**Edge TTS 免费、无需 API key**；字幕 `edge` 模式用 TTS 时间戳，另有 `whisper` 模式。来源：README-en L534/L542-L549
- 画面：默认从 **Pexels / Pixabay / Coverr** 免费图库匹配；也可上传本地素材或接 AI 视频服务。来源：README-en L202-L210
- 输出：9:16 1080×1920 / 16:9 1920×1080 / 1:1 1080×1080；支持批量与任务历史。来源：README-en L221/L190
- 跑法：Windows 一键包；`python -m pip install mpt` + `mpt webui`；`docker compose -f docker-compose.release.yml up`。来源：README-en L302-L412
- 边界：不强制 GPU；最低 4 核/4GB，推荐 6–8 核/8GB；Windows 路径避免中文/空格。来源：README-en L262-L275/L375

## 4. 逐镜脚本（口播 = 字幕）

> 切点由后端按实测配音 + BGM 拍点吸附，最终以 `props.json` 为准。

| # | id | 目标时长 | 屏显标题 | 口播/字幕（重音） | 画面与动效意图 |
|---|---|---|---|---|---|
| 01 | cover | 5.5s | 打一行字 / **成片自己出来** | 有人把做短视频，做成了一条**流水线**。**打一行字**，成片自己出来。 | 金色氛围光；标题逐字砸入；右下角 9:16 手机框 + 播放键 + 进度条，光标点下播放（钩子留人）；标签行 OPEN SOURCE / MIT / 139k★ / PYTHON |
| 02 | hero | 5.3s | 今天的主角 / **MoneyPrinterTurbo** | 它叫 **MoneyPrinterTurbo**，开源 MIT，**十三万九千星**，上个月刚更新。 | 仓库卡弹出：MPT 图标、harry0703/MoneyPrinterTurbo、MIT / Python 3.11+ / v1.3.9 / 无需 GPU；139k 星数从 0 计数 |
| 03 | pain | 7.5s | 以前做一条 / **半天没了** | 以前做一条：写稿**半小时**，找素材**一小时**，配音字幕再一小时，剪辑还得一小时。 | 2×2 工时卡错帧弹入（写稿 30 / 素材 60 / 字幕 60 / 剪辑 60）；右侧时钟指针转动；底部合计条从 0 涨到 3 小时 30 分 |
| 04 | pipeline | 4.3s | 它最值钱的 / **是这条流水线** | 它最值钱的不是生成，是把**五步**串成流水线。 | 竖向六节点：主题 → 脚本 → 配音 → 字幕 → 画面 → 成片；虚线管道内光点向下流动，节点逐个点亮；右侧「自动」标签 |
| 05 | script | 5.3s | 脚本这步 / **模型随便换** | 脚本这步，**Kimi**、**DeepSeek**、**Claude** 都能接，本地 **Ollama** 也行。 | 左「主题」输入卡 → 右脚本打字机；下方 7 个模型 chips 错帧亮起，Ollama 单独标「本地/免费」 |
| 06 | voice | 4.8s | 配音字幕 / **免费也能跑** | 配音默认 **Edge TTS**，**免费不用 key**；字幕跟着语音走。 | 手机框内波形条逐帧跳动；示例字幕条高亮「是它自己生成的」；右上徽章「Edge TTS · FREE · NO KEY」；下方小字「whisper 模式更准，首次下载 3GB」 |
| 07 | footage | 4.8s | 画面从哪来 / **免费素材库** | 但画面**默认不是 AI 生成的**，是从 **Pexels、Pixabay** 匹配的。 | 3×3 素材缩略网格（城市/办公/自然/人物…）逐格翻转；搜索框「关键词：AI 办公」；搜索栏右侧红标「默认不是 AI 生成」；底部 Pexels / Pixabay / Coverr chips |
| 08 | output | 4.8s | 竖屏横屏 / **批量出片** | 竖屏、横屏、方形都能出，还能**批量**跑任务。 | 三个画幅框（9:16 / 16:9 / 1:1）依次展开；左侧 ×N 批量计数器滚动；右侧任务历史小卡 |
| 09 | run | 4.8s | 三种跑法 / **选一个就行** | 三种跑法：**Windows 一键包**、**pip** 装 mpt、或者 **Docker**。 | 终端卡五行命令逐字打出：`pip install mpt` → `mpt webui` → `docker compose -f docker-compose.release.yml up`；顶部三枚方式 chips |
| 10 | caution1 | 5.3s | 素材版权 / **平台查重** / **API 要钱** | 先说坑：**素材有版权**，**平台查重**，模型 **API 也要钱**。 | 三行警示卡（版权/查重/成本）逐行砸入，每行右侧红/黄/蓝徽章；底部小字「免费素材 ≠ 随便商用；批量号更容易撞车」 |
| 11 | caution2 | 5.9s | 省手不省脑 / **前 3 秒靠你** | 一键只省手，**不省脑子**。脚本和**前 3 秒**，还得你自己盯。 | 左侧「省手」自动化清单 vs 右侧留存曲线：前 3 秒断崖式下跌，红色标注「划走」；底部结论条「一键生成 ≠ 爆款」 |
| 12 | outro | 5.9s | 先跑一条 / **再决定投入** | 链接在**评论区**。**先收藏**，跑一条，再决定要不要投入。 | 金色收尾；仓库地址 mono 行；139k★ 呼吸；胶囊按钮「先收藏 · 跑一条再决定」；片尾闪金 |

## 5. 动效语法（实现约束）

- 一切由 `useCurrentFrame()` 驱动，无 `Math.random()` / `Date` / CSS animation；伪随机用固定 sin 哈希。
- 入场：`zoom / bounce / slideUp / slideLeft / slideRight / whip / flip / pop`；出场：`up / down / left / right / zoomOut`；运镜：`pushIn / pushSlow / pullOut / panLeft / panRight / rock / whipR`。
- 标题逐字 spring 弹入（stagger 1.8 帧），第二行用主题色 + 光晕；副标 mono 行延迟上浮。
- 底部口播字幕：左侧 6px 主题色竖条 + 深色玻璃底，重音词主题色加粗发光；字号随句长自适应（31/34/37/40px）。
- 页与页之间硬切/甩镜/变焦，接缝可闪下一页主题色（≤0.2s、opacity ≤0.5）；页尾整体暗角 + 胶片颗粒 0.05。
- 固定 UI：左上「◆ VIBE 知识大赏 // TOOL LAB」、右上页计数、底部分段进度条（12 段）、左下标画幅、右下时间码；底部 250px 为抖音 UI 安全区，不放内容。

## 6. 音频规则

1. 配音：edge-tts `zh-CN-YunjianNeural`，rate `+12%`，逐镜单句，首尾静音裁剪 + loudnorm（`voice.py` 既有流水线）。
2. 旁白整轨预混成一条 `voice/projects/moneyprinterturbo-vibe/narration.wav`，根级播放（规避嵌套 Sequence 音频碎片 bug），峰值归一 0.92。
3. BGM：`bgm/vibe_we_never.mp3`（44.1k / -18 LUFS / 90.04s），根级播放；口播窗口音量 0.33，空隙 0.60~0.62，片头 0.6s 淡入、片尾 1.5s 淡出。
4. 切镜锁拍：每镜结束时间取「旁白结束 +0.30s 之后、目标 +0.60s 之内」离目标最近的实测拍点；每镜开头留 0.32s、旁白后余量 0.62s。

## 7. 验收标准

- [ ] 1080×1920@30，H.264 + AAC 48k，时长 60–66s
- [ ] 开头 5 秒内抛出「打一行字，成片自己出来」钩子，第二镜立即报出主角
- [ ] 每镜口播/字幕/画面同源；字幕无出框，底部安全区 ≥250px
- [ ] 12 个切点全部锁在 BGM 拍点（帧取整误差 ≤1 帧；视频起点 0 除外）
- [ ] 无任何行星/宇宙模板场景、无星空、无紫蓝渐变
- [ ] 事实句与 `briefs/moneyprinterturbo-facts.md` 一一对应，不出现未核实数字
- [ ] 封面 `cover.jpg` + QA 抽帧人工过目
- [ ] 成片无「AI 味」：短句、口语、具体数字、没有「首先/其次/总而言之/让我们一起」等套话

## 8. 复现命令

```bash
cd D:\Work\video-workflow\backend
python -X utf8 tools/run_moneyprinterturbo_vibe.py                # 全流程（配音 → 时间轴 → props → 渲染 → 封面/QA）
python -X utf8 tools/run_moneyprinterturbo_vibe.py --no-render    # 只准备 props
python -X utf8 tools/run_moneyprinterturbo_vibe.py --preview      # 只渲前 10 秒
python -X utf8 tools/run_moneyprinterturbo_vibe.py --reuse-voice  # 复用已有配音
```

产物：`backend/storage/renders/moneyprinterturbo-vibe/final.mp4`（+ `props.json`、`cover.jpg`、`qa_*.jpg`、`publish_copy.json`）。
