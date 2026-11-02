# 六步视频流水线规则（v2 主流程）

> 本文档是流水线的"规则留档"：六步的定义、每步的提示词（与 `backend/app/services/llm.py` 中的系统提示词同步维护）、产物位置与人工确认门。

## 总则

1. 主流程固定六步，**每一步都必须人工确认后才能进入下一步**；确认门在后端强制（未确认时下一步返回 400），状态落盘 `storage/projects/<pid>/flow.json`。
2. **配音三选一**（第 2 步选择、渲染时生效、默认 `tts`）：
   - `tts`：edge-tts 逐句配音（音色/语速取项目设置），时长按实测；
   - `custom`：自带配音——整段口播（上传 1 个音频，总时长按各幕字数占比分摊）或分幕配音（每幕 1 个音频，幕内按句长分摊）；
   - `none`：纯字幕+音乐（无旁白），时长按屏显阅读速度估算（约 3.6 字/秒，最短 1.4 秒）。
3. 竖屏 1080×1920@30fps；BGM 按拍子卡点切镜；**只有真的有配音时音乐才闪避**。
4. 直出先渲**前 10 秒预览**（`--frames=0-299`），过目确认后才渲整片，避免整段废片浪费 token。

## 步骤与产物

| 步骤 | 做什么 | 产物 | 确认动作 |
|---|---|---|---|
| 1 搜索 | 围绕主题联网搜索（Bing）+ 抓正文，AI 整理 8~10 个关键节点 | `research.json` + `research.md`（节点带出处链接） | `POST /flow/research/approve` |
| 2 编排 | 文章 → 通俗视频文案（一幕一幕，行 ≤20 字），选配音方式 | `script.json`（可继续手编）、`flow.json.audio_mode` | `POST /flow/copy/approve` |
| 3 找图 | 每幕出检索词 → Openverse/Wikimedia 搜免版权图 | `images.json`（候选+许可+来源），选中图下载到 `public/pic/projects/<pid>/` | `POST /flow/images/approve` |
| 4 定样式 | AI 出 3 个差别大的风格 → 各渲 1 张竖屏样图 → 选定后 AI 写分镜（卡拍子） | `renders/style_sample_1..3.png`、`styles.json`、`director.json` | `POST /flow/styles/approve`（分镜须已生成） |
| 5 检查 | AI 终审：偏题 / 逐句对照文章核属实 / 风格贴合 / 结构 | `review.json`（问题分级+建议） | `POST /flow/review/confirm` |
| 6 直出 | 渲前 10 秒预览 → 过目 → 渲整片 | `renders/preview.mp4` → `final.mp4` | `POST /flow/render/preview/approve` → `POST /flow/render/full` |

API 前缀：`/api/projects/{pid}/flow`。重活全部走任务线程（`TaskManager.start_task`，一个项目同时只允许一个任务）。

## 提示词规则（与截图提示词同步）

### 第 1 步 · 搜索（`RESEARCH_SYSTEM`）
- 角色：知识科普作者，最在意事实准确。
- 挑 8~10 个关键节点，每个写清哪一年、谁、做了什么、为什么重要。
- 年份、人名、数字、原话都必须有出处：sources 逐字引用给定检索资料的 URL，写在节点里；**找不到可靠出处的节点删掉**。
- 资料矛盾以更权威来源为准并注明分歧。

### 第 2 步 · 编排（`FLOW_COPY_SYSTEM`）
- 角色：抖音知识视频的编剧，擅长把复杂的事讲给完全不懂的人听。
- 竖屏、观众只看画面上的字（配音乐）：**一屏不超过 20 个字**（超长自动按标点切句）。
- 结构：开头先抛一个问题让观众猜；中间当故事讲，用至少一个生活里的比方，安排一次反转；结尾落到普通人身上。
- **avoid**：不解释就用专业术语；文章里没有的事实。

### 第 3 步 · 找图（`IMAGE_QUERY_SYSTEM` + `pic_search`）
- 每一幕都要有一张真实的图（老照片、人物肖像、论文首页、机器的样子、实物/现场照片）。
- 检索词具体优于宽泛（英文主查 + 中文补充）。
- **avoid**：标着版权所有、来路不明的图。只用公有领域/自由许可（NC/ND 一律过滤），每张写出处和许可。

### 第 4 步 · 定样式（`STYLE_PROPOSAL_SYSTEM`）+ 写分镜（director v2）
- 先给 3 个**差别大**的画面风格（明暗/冷暖/质感拉开），每个附一句为什么适合，先别往下做，等选择。
- **avoid（AI 味禁令）**：深色背景配霓虹光；字都堆在正中间；紫色渐变；所有东西都淡入淡出。
- 选定后用该风格（`preset_look`）写分镜：每幕几秒、用什么图、怎么动；**镜头切换卡在 BGM 拍子上**。

### 第 5 步 · 检查（`FLOW_REVIEW_SYSTEM`）
- 是否偏题；**逐句对照文章核属实**（文章没有的事实 = high）；画面风格是否符合主题；结构四要素（钩子/比方/反转/落普通人）。
- 有 high 问题 `passed` 必为 false；报告给人做最终确认。

### 第 6 步 · 直出
- 分镜可以，照着做；**先只做开头 10 秒**渲成 MP4 给用户过目，满意了再做整片。
- 渲完自查：字有没有出框/重叠/太小，年份和文案对不对，切镜在不在拍子上。

## 与旧一键渲染的关系

旧路径（`POST /api/projects/{pid}/render` → `tasks.start_render`）原样保留，前端详情页已切换为六步向导；两者共用 director v2、TTS、BGM、渲染器等底层服务。

## 附录：AI 现场编写定制场景（第 4 步可选能力）

第 4 步「定样式」面板提供开关「选定风格后由本地 coding agent 现场编写 3~5 个定制动画场景」（项目设置 `gen_scenes`，默认关）。

链路：LLM 挑关键节拍（钩子/比喻/反转/落点）→ 组装规范提示词 → 调本地 agent CLI（`GEN_AGENT_CMD`，自动探测 zcode → claude → command-code，无头 `-p` 模式，stdin 传提示词）→ agent 在 remotion-life-sim 的 `src/gen/<项目id>/` 写组件 → 后端闸门校验（`npx tsc --noEmit` + `remotion still` 每场景抽 2 帧）→ 修复循环 ≤2 轮 → 重写 `src/gen/registry.ts` → 把 `gen:<pid>:<NN>` 场景写进导演方案对应镜头。

组件合同：`React.FC<GenSceneProps>`，props = `{p(0~1进度), c1, c2, accent, speed, seed}`；全部动画由 p 驱动、随机只准用 `rand(seed)`；禁 Math.random/Date/外部资源/画面内文字；性能上限 220 元素。缺失的 gen 场景在渲染端退化为同色渐变（不会黑屏）。

失败处理：agent 超时（`GEN_AGENT_TIMEOUT`，默认 900 秒，超时 taskkill /T 杀进程树）、tsc 不过、still 失败 → 回退内置场景词库，绝不阻塞出片。删除项目时同步清理 `src/gen/<pid>/`。
