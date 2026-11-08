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
