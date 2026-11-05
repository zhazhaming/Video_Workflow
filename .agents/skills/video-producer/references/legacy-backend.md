# 双轨说明：FastAPI 旧流程 ⇄ skill 流程

> 决策（2026-11）：保留双轨。FastAPI 六步门禁向导原样可用，但**新制作默认走 skill 流程**（agent 直接编排）。旧代码不删改、不再为其新增功能。

## 什么时候还需要后端

| 场景 | 做法 |
|---|---|
| 浏览器 UI 操作（项目列表、热点雷达、热门歌曲、六步向导面板） | `cd backend && uvicorn app.main:app --port 8000` + `cd frontend && npm run dev` |
| skill 流程的确定性步骤（TTS/预混/渲染） | **不需要后端**，直接 `python backend/tools/*.py` |
| skill 流程的创作步骤（选题/文案/风格/分镜） | 不需要后端 LLM；由 agent 依据 skill 知识完成 |

注意：8000 端口可能有旧实例，改完后端代码要 taskkill 占用进程后重启。

## 旧六步端点（FastAPI，前缀 `/api/projects/{pid}/flow`）

搜索 `POST /research` → 编排 `POST /copy` → 找图 `POST /images/search` → 定样式 `POST /styles` + `POST /styles/select` → 检查 `POST /review` → 预览 `POST /render/preview` → 整片 `POST /render/full`；每步有 approve 门禁（`GATE_KEYS = research, copy, images, styles, review, preview`），状态在 `storage/projects/<pid>/flow.json`。配音模式三选一 `POST /audio-mode`。规则详见 `docs/FLOW.md`。

## 产物互通

两条路径共用同一套落盘契约（见 `pipeline-contracts.md`），可互相接手：

- 旧流程建的项目：`storage/projects/<pid>/script.json` 直接可被 skill 流程的配音/制作阶段使用。
- skill 流程产出的 `script.json` / `props.json`：旧前端详情页与渲染接口同样能读（script.json 形状即 ScriptDraft；props.json 需放在 `storage/renders/<pid>/` 供旧渲染接口使用）。
- 旧流程独有产物：`research.json`（带出处知识节点）、`styles.json`、`review.json`、`director.json`（v2 分镜+缓存）、`prompt_pack.md`（from_scratch 提示词包）。skill 流程的对应物为 `research.json`（可选）、`plan.json`。

## 服务层复用地图（写新工具时从这里包装，不复制逻辑）

| service | 能力 | 已有工具包装 |
|---|---|---|
| `app/services/voice.py` | edge-tts 整场合成+词边界切句+裁剪响度归一；`mix_line_track`/`mix_motion_track` 整轨预混 | `tools/tts_gen.py`、`tools/premix_track.py` |
| `app/services/renderer.py` | npx remotion render/still 子进程封装 | `tools/render_video.py` |
| `app/services/websearch.py` | Bing CN RSS + DuckDuckGo 搜索与正文抓取（SSRF 防护） | 未包装（临时用 WebSearch） |
| `app/services/pic_search.py` | Openverse + Wikimedia 免版权图搜索/下载（NC/ND 过滤，curl 走系统 TLS） | 未包装 |
| `app/services/music_search.py` + `music.py` | 免版权音乐搜索下载；情绪词表选曲 | 未包装 |
| `app/services/beat.py` | BPM/节拍检测（缓存 `storage/bgm_meta.json`） | 未包装 |
| `app/services/palette.py` | 5 套 look 预设、对比度修复、去 AI 味体检 | 未包装 |
| `app/services/pipeline.py` | `pause_after`/`line_id`/`text_line_duration`/`assemble_props` | 公式已提炼进 pipeline-contracts.md |
