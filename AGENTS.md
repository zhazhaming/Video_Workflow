# video-workflow 工作区规则（AI 每次会话必读）

## ★ 重点规则：模板相关性检查（每次制作视频前必须执行）

在为任何选题/项目做视频（生成脚本、编排动效、渲染、写提示词）之前，**必须先判断当前视频内容与渲染引擎的内置能力是否相关**。

渲染引擎现状：`remotion-engine/`（仓库内，基于 Remotion 开源工具全新搭建）——
- 两个合成：`DataVideo`（默认竖屏口播：片头标题 + 逐句字幕 + 运镜/转场/调色/颗粒/氛围粒子）与
  `MotionShow`（轻量版式）。时间轴在 `remotion-engine/src/dv/timeline.ts`，与
  `backend/app/services/voice.py` 的预混音轨数学逐帧对齐，**改一边必须同步另一边**。
- **没有任何内置领域场景**（旧 remotion-life-sim 的行星/太阳系代码场景库已废弃删除，不存在了）。
  `scene.kind` 只支持 `gen:<pid>:<NN>`（六步流程由本地 agent 现场编写的场景，
  契约见 `remotion-engine/src/gen/types.ts` + `src/gen/registry.ts`，确定性随机用 `src/dv/atmosphere.ts` 的 `rand`）；
  其余 scene kind 一律忽略并回退到 图片/渐变。
- 资源目录：`remotion-engine/public/{bgm,sfx}`（`backend/tools/gen_bgm.py`、`gen_sfx.py` 可重新生成），
  运行时产物 `public/pic/projects/<pid>/`、`public/voice/projects/<pid>/`。

判定与执行：

1. **无关 → 从零开始（from_scratch）**：禁止给无关内容编排领域性动效（尤其行星/宇宙类意象）。
   画面与动效通过提示词 + AI 创作：产出从零制作提示词包（参照 `briefs/ppt-20pages-video-brief.md`
   的结构），走六步流程的 gen 场景能力（现场编写 `src/gen/<pid>/SceneNN.tsx`）实现。
   产品内已有自动判定与清洗（backend/app/services/director.py 的 template 相关性阶段），不得绕过。
2. **有关 → 先看能否复用**：列出可复用的部分（哪个 gen 场景 / 哪段音效素材 / 哪张图），
   只复用匹配项，其余仍按内容原创设计，并在方案里注明复用清单。
3. 判定结论要落库可查（plan JSON 的 `template` 字段：mode/reason/reusable），不许静默注入模板元素。

判不准时按"无关"处理（宁可中性渲染 + 提示词包，也不许给无关内容塞领域动效）。

## ★ 默认出片预设：抖音竖屏安全画幅（2026-11 起，做竖屏视频默认执行）

出片默认按抖音安全画幅，**不需要用户再提**。原因：抖音在 20:9 机型/作品预览页按 cover 铺满 9:16 视频，
左右各裁 ≈13%（1080 宽 ≈139px/侧），贴边内容会被切。

- `plan.json` 顶层写 **`safeScale: 0.8`**；`build_config.json` 写 **`"safe_scale": 0.8`**
  （`build_props.py` 优先读 config，缺省回落到 `plan.json`）。引擎 `src/dv/DataVideo.tsx` 的
  `props.safeScale` 会把整镜（背景/图形/字幕/镜标签/片头）缩到中央，外圈纸色渐变被平台裁掉，内容不丢。
- 内容安全区（safeScale=0.8）：**x 185~895 / y 300~1460**；字幕、数字、印章都在里面。
- 运镜幅度 **≤1.1**（push≤1.1 / dolly≤0.8 / diag≤0.75 / pan≤0.6 / pull≤0.9），否则缩放会把贴边内容推出安全区。
- UI 避让：右侧 x>880、底部 y>1500、顶部 y<120 不放关键内容。
- 验收必须**按 802×1920（裁 x139~941）模拟裁切抽帧**，确认无切字；封面用整帧 1080×1920。
- 完整预设与换平台公式见 `.agents/skills/video-producer/references/platform-presets.md`。
- 用户明确要「满屏无边框」才改用 9:20（1080×2400，需重排字幕与场景纵向坐标）。

## ★ 开场 5 秒与片长结构（所有视频默认，2026-11-12 起，硬规则）

> 依据本账号 26 条已发布作品实测：2s 跳出中位 **43%**、5s 完播 **28.7%**、平均播放 **9.7 秒**、完播 **2.54%**。
> 流量差的主因在开场与结构，不在选题数量。以下两条为不可跳过的创作闸门。

**动作 1：开场 0–5 秒 = 数字 → 反差 → 代价**

- 第 1 句：具体数字或事实（能被一眼看懂、能被记住的那种）。
- 第 2 句：反差或矛盾（"但是 / 偏偏 / 结果"）。
- 第 3 句：代价或冲突（为什么这件事重要）。
- **前 5 秒禁止**：自我介绍、「本期 / 今天 / 大家好 / 这期聊」、栏目名、频道名、空提问式钩子。
- **首帧必须是画面事件**：数据图、剖面、对比尺、实物、表格。禁止"渐变底 + 大字标题"。
- 品牌/栏目信息需要时放到 0:05 之后，全片最多 1 句。

**动作 2：默认 45 秒，15 秒一个信息台阶**

- `target_seconds` 默认 **45**（30–60 区间；用户明确要长内容才延长）。
- 固定 **3 个台阶 × 15 秒**：每台阶「结论先行 + 证据」，每 15 秒必须交付一个新的完整信息点。
- **第 10 秒前必须交付第一个完整价值**——平均观看只有 9.7 秒，铺垫等于弃片。
- 幕数 ≈ `round(target_seconds / 4)`（45 秒 ≈ 11±2 幕）；总字数 ≈ `target_seconds × 4.5`。
- 不再写固定开场白/结束语，不出现「我是阿扎」式人设句。

**发布后判定线**：2s 跳出 ≤35%、5s 完播 ≥45%、完播 ≥8%。不达标先改开场，不换选题。

**开场闸门（机器校验，不可绕过）**：

```bash
python -X utf8 backend/tools/check_opening.py --script backend/storage/projects/<pid>/script.json
```

退出码非 0 不许渲染。公式库见 `.agents/skills/video-script/references/opening-formulas.md`；
验收清单里它和 facts_audit 同级（都是硬闸门）。

## ★ 选题闸门：热点 → 栏目 → 开场数字（2026-11-13 起）

热点是原料，不是选题。热点雷达与视频流水线的每条候选都必须过三关：

1. **栏目归属**：只能归到 `ai干活` 或 `公司大赏`，归不进 → 淘汰。
2. **硬过滤**：行情预测/个股/纳指 A股 涨跌、彩票、医疗诊断、明星八卦、灾难事故 → 淘汰。
3. **开场数字**：必须给出这条视频开场要用的具体数字，给不出 → 淘汰。

实现：`backend/app/services/hotspot.py::classify_column` 输出 `column / opening_number / reject_reason`；
`video-topic` 与热点雷达共用同一套规则，淘汰项在前端禁用「生成脚本」。
每日热点配额 `DAILY_HOTSPOT_QUOTA=2`、`DAILY_AI_COLUMN_QUOTA=1`（至少 1 条来自 ai干活）。

**2026-11-13 决策：硬科普不再作为栏目。** 账号只保留 `ai干活` 与 `公司大赏` 两个栏目；
宇宙/地球/天文/考古/纯自然科普一律不做（除非能落进这两个栏目的机制视角，例如「某公司为什么押注航天」）。
`vibe知识大赏` 合集停更，不再新增条目。

## 视频制作的 skill 路径（主路径）

流程与知识已沉淀为 ZCode skill 家族（`.agents/skills/`，总入口 `video-producer`）：
**内容选题 → 视频文案 → BGM → 配音 → 视频风格 → 视频内容**。做视频时优先走 skill：
agent 依据 skill 的方法论做创作判断，确定性步骤（TTS/预混/渲染）调 `backend/tools/`
的 CLI 包装（`tts_gen.py` / `premix_track.py` / `render_video.py`），不经 FastAPI 编排。
产物契约单一事实源：`.agents/skills/video-producer/references/pipeline-contracts.md`
（改 schemas.py / types.ts / voice.py 时间轴常量时同步它）。
FastAPI 六步向导保留双轨（见 skill 的 `references/legacy-backend.md`），不再为其新增功能；
上述 ★ 模板相关性规则在 skill 流程中同样强制（判定落 `plan.json` 的 `template` 字段）。

## 其他约定

- 后端测试：改测试后先清 `__pycache__` 与 `.pytest_cache`（Windows mtime 精度会导致旧字节码假失败）。
- 8000 端口可能有旧实例：改完代码要 taskkill 占用进程后重启，避免请求打到旧代码。
- 引擎改动后：`cd remotion-engine && npx tsc --noEmit` 必须通过（gen_scenes 校验闸门也依赖 tsc）。
- 交付物路径：成片 `backend/storage/renders/<pid>/final.mp4`；
  项目图片 `remotion-engine/public/pic/projects/<pid>/`。
