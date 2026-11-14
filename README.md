# Video Workflow

基于 Remotion 的 AI 短视频工作流（Phase 1）：Web 端管理脚本 → AI 生成/优化 → edge-tts 配音 → 占位画面 → 本地渲染竖屏 MP4（1080×1920，适配抖音/小红书）。

**🔥 热点雷达（媒体搜索引擎）已上线**：聚合抖音/头条/百度/知乎/B站 五大平台热榜，
趋势判断帮你抢第一波流量，自定义搜索方向自动归类赛道，AI 把热点直接变成可拍选题。
见下方「热点雷达」章节。

## 目录结构

```
video-workflow/
├── backend/          # Python FastAPI 后端（编排层）
│   ├── app/
│   │   ├── main.py           # 入口
│   │   ├── config.py         # 路径与环境变量
│   │   ├── schemas.py        # 脚本/项目/任务数据模型
│   │   ├── routers/          # REST 接口
│   │   └── services/         # 配音、占位图、LLM、渲染、任务
│   ├── storage/              # 项目脚本与渲染产物（运行时生成）
│   └── tests/                # 单元测试
└── frontend/         # React + Vite 前端
    └── src/                  # 项目列表 / AI 脚本 / 分镜编辑 / 渲染面板
```

渲染引擎为仓库内的 `remotion-engine/`（基于 Remotion 开源工具全新搭建，
含 `DataVideo` / `MotionShow` 两个合成），通过 `npx remotion render --props=...`
子进程调用。

**制作路径双轨（2026-11 起）**：
- **skill 流程（主路径）**：流程与方法论沉淀在 `.agents/skills/`（总入口 `video-producer`，
  阶段 skill：选题 → 文案 → BGM → 配音 → 风格 → 制作）。AI agent 依据 skill 做创作判断，
  确定性步骤直接调 `backend/tools/` 的 CLI 包装（`tts_gen.py` / `premix_track.py` /
  `render_video.py`），无需启动后端。
- **Web 向导（保留）**：FastAPI 六步门禁流程 + 前端 FlowPanel 原样可用（见下文启动方式），
  两条路径共用同一套落盘契约，产物互通；skill 侧知识库是流程规则的单一事实源
  （`.agents/skills/video-producer/references/pipeline-contracts.md`）。

## 一键启动（推荐）

双击根目录的 **`launch.bat`** 即可：
- 自动清理 8000/5173/5174 端口上的旧实例（可重复双击，不会起重复进程）
- 自动检查并安装缺失依赖（首次运行稍慢）
- 分别弹出一个后端窗口和一个前端窗口，并自动打开浏览器到 http://localhost:5173

停止服务：双击 **`stop.bat`**，或直接关闭两个服务窗口。

> 说明：bat 文件内容为英文，避免 Windows 命令行中文编码问题；功能说明见本文档。

## 手动启动

### 1. 后端（Python 3.12）

```bash
cd backend
pip install -r requirements.txt
copy .env.example .env    # 填入 LLM_API_KEY（可选，不填则只能手动编辑脚本）
uvicorn app.main:app --reload --port 8000
```

### 2. 前端（Node 18+）

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173（/api 已代理到 8000）
```

### 3. 使用流程

1. 新建视频项目（默认模型 DeepSeek V4.1 Flash，默认时长 180 秒，均可修改并随项目落库）
2. 输入选题 →（可选）选择**脚本提示词模板**（故事反转/悬念揭秘/知识干货/情感治愈/吐槽共鸣），模板内容自动填入提示词框且可自由修改 →「AI 生成脚本」（生成前自动保存当前脚本，生成结果立即落库；生成中可点「停止生成」中断），或直接手动编辑分镜
3. 右侧「执行流程」面板实时显示当前步骤（生成/保存/提示词/配音/画面/渲染）
4. 配音员与 BGM 可在 AI 面板选择（音色试听、BGM 试听），设置随项目落库；渲染时自动套用。
   BGM 支持**自动匹配**（按剧情情绪 + 卡点切镜）、**指定曲库曲目**、**关闭**三种模式，
   也可点击「⬆ 上传自定义 BGM」或「本机路径导入」添加自己的音乐（视频文件会自动抽取音轨）
3. （可选）为分镜配置**自定义画面**：网页上传，或把豆包/Midjourney 等任何工具
   生成的图片命名为 `custom_01.png`、`custom_02.png`…（序号对应分镜）手动放到
   `remotion-engine\public\pic\projects\<项目id>\` 目录。有自定义图的分镜直接使用，
   没有的自动生成渐变占位图
4. 「开始渲染」：自动保存 → 配音 → 画面素材 → Remotion 渲染 → 在线预览/下载 MP4

### 4. 多模型配置

模型注册表在 `backend/models.json`（MiMo / DeepSeek / 自定义 OpenAI 兼容三个条目），
密钥与接口地址通过 `backend/.env` 的 `${VAR}` 注入，前端 AI 面板可自助切换。
在 `.env` 里补齐任一模型的 `*_BASE_URL` + `*_API_KEY` 即自动变为可用。

## 环境变量（backend/.env）

| 变量 | 说明 |
|---|---|
| MIMO_BASE_URL / MIMO_API_KEY | MiMo（小米）：https://api.xiaomimimo.com/v1 |
| DEEPSEEK_BASE_URL / DEEPSEEK_API_KEY | DeepSeek：https://api.deepseek.com |
| CUSTOM_BASE_URL / CUSTOM_API_KEY / CUSTOM_MODEL | 任意 OpenAI 兼容接口 |
| TTS_VOICE | edge-tts 音色（默认 zh-CN-YunjianNeural） |
| TTS_RATE | 语速（默认 +6%） |
| REMOTION_DIR | 渲染引擎路径（默认仓库内 remotion-engine/） |

模型注册表在 `models.json`，`.env` 的变量通过 `${VAR}` 注入；前端 AI 面板可自助切换模型。

脚本提示词模板在 `prompts.json`（可直接编辑增删），通过 `GET /api/scripts/prompts` 提供；
前端选中模板后填入可编辑的提示词框，生成时作为最高优先级指令传给模型。

## 运行测试

```bash
cd backend
python -m pytest tests -q
```

## 热点雷达（媒体搜索引擎）

列表页顶部「🔥 热点雷达」进入。核心目的：**针对媒体热点第一时间出手，抓住第一波流量**。

### 功能

- **多平台热榜聚合**：抖音、头条、百度、知乎、B站（免登录 JSON 直连，每源独立失败隔离；
  微博因反爬暂列「待接入」，接口放开后加一个 fetcher 即可）
- **第一波指数**：趋势（🚀新上榜 / 📈上升 / ➖持平 / 📉降温，基于原始热度对比、6% 阈值滤抖动）
  + 新鲜度（首见时间）+ 跨平台共振（同标题多平台同时上榜，额外加权且永远置顶）→ 0~100 分，
  越高越要马上做
- **自定义搜索方向**：方向 = 关键词规则（+ 排除词），热点标题命中即自动归类；
  支持增删，预设 AI科技 / 影视娱乐 / 社会民生 / 游戏电竞
- **筛选与直达**：平台筛选、多关键词过滤、按第一波指数/热度/最新排序、聚合同事件开关；
  每条热点带「去XX搜同款」直达，详情弹窗还有小红书/快手/微博**多平台分发调研**入口
- **今日早报**：Top 15 + 规则理由（共振/刚上榜/上升中/平台标记），打开 10 秒决定拍什么；
  「🤖 AI 点评」逐条给 适合形式/拍摄角度/风险提示（按轮次缓存省 token）；附平台/方向分布统计
- **今日选题工作台**：AI 选题生成即落库，状态流转 待拍→拍摄中→已完成，备注/批量清理/复制清单；
  「⚡ 生成脚本」一键完成 建项目 + AI 分镜生成 + 状态流转
- **赛道预警**：自定义方向出现 2h 内新爆热点（burst≥70 且在涨）→ Tab 红点 + 页面横幅
- **趋势可视化**：热点行 sparkline 走势 + 详情弹窗大图；第一波指数分档配色（红≥85>橙≥70>黄≥50）
- **AI 选题**：勾选热点 → AI 生成蹭热点选题（标题/切入角度/开场钩子/流量点）→
  一键创建视频项目并自动填入选题，无缝进入现有脚本生成流水线
- **自动抓取**：后端每 10 分钟（`HOTSPOT_REFRESH_MINUTES`，最小 5）抓一轮，快照落盘
  保留 72 小时，重启不丢历史趋势

### 数据文件（backend/storage/hotspot/）

| 文件 | 内容 |
|---|---|
| state.json | 热度历史、源状态、跨平台共振索引（自动瘦身：7 天未出现即清理） |
| directions.json | 自定义搜索方向 |
| snapshots/snap_*.json | 每轮抓取快照（保留 72 小时） |

### 相关接口（/api/hotspot）

`GET status` · `GET items?direction_id=&platform=&q=&sort=&limit=` · `POST refresh` ·
`GET/POST/PUT/DELETE directions` · `POST ai-topics`

探测工具：`python backend/tools/probe_hot_sources.py`（检测各平台接口当前可用性，
接入新平台前先跑它）。

## 每日一家公司（系列排产）

「业务流水线」页第二条轨道（`视频流水线 → 🏢 每日公司`，深链
`/?tab=pipeline&track=company`）：每天一期，先选公司，再改初稿，最后排产。

- **候选库**：35 家国内外知名公司（`backend/app/services/company_pool.json`），带赛道、
  国家、成立年份、创始人、总部、钩子和六段式初稿素材；支持按国内/海外、赛道、关键词筛选
- **档期板**：未来 7 天，一天一期；空档会自动推荐一家最近没用过的公司
- **内容初稿**：按「钩子 / 起点 / 转折 / 生意 / 记忆点 / CTA」生成，可逐段编辑；
  初稿只是提纲，正式口播稿在制作期核验事实后重写（每句 ≤20 字）
- **排产**：点「排产」生成一个 `kind=company` 的流水线批次，到凌晨制作时间自动出片；
  也可「立即制作」。制作复用现有的 dsh agent 全流程 + 事实审计 + 视觉验收，
  成片与日志在「🔥 热点流水线」历史批次里查看
- **一天一期**：同一时间只允许一条公司期数处于「已排产/制作中」，避免制作队列打架
- 选题方法、六段式模板与首期完整初稿（蜜雪冰城）见
  `briefs/daily-company-series.md`

### 相关接口（/api/company）

`GET pool` · `GET plan?days=7` · `POST plan` · `PUT plan/{date}` ·
`POST plan/{date}/draft` · `DELETE plan/{date}` · `POST plan/{date}/schedule`

## 成片工艺（DataVideo 模板）

- **AI 导演（默认开启，可按项目关闭）**：渲染时由 AI 逐镜决定运镜（8 种）/ 转场（5 类）/
  调色（对比·饱和·亮度·色调浓度）/ 颗粒强度，并从曲库智能选曲 + 定音量；
  方案按脚本指纹缓存（脚本不变不重复生成），AI 失败自动回退内置规则
- **开场标题序列**：逐字弹入 + 色差 + 动态光晕 + 运动模糊光带（约 2.2 秒）
- **按句切镜**：同一分镜内每句台词换构图硬切，长句再补刀；8 种推拉摇移运镜
- **转场**：溶解 / 甩镜（横移 + 运动模糊）/ 变焦模糊 / 闪白 / 硬切，按台词语气自动选择
- **音效**：开场 impact + riser，转场按类型触发 whoosh / impact（`public/sfx/`）
- **调色与质感**：对比度/饱和度校正 + 分镜色调 soft-light + 动态胶片颗粒 + 暗角 + 片尾淡出
- **音频**：整场合成配音（按词边界切回逐句，语调连贯；裁首尾静音 + 轻压缩 + 响度归一）+ BGM 铺底（说话时自动闪避，首尾淡入淡出）
- **BGM 自动匹配**：按剧本情绪关键词自动选曲（低谷→低沉悬疑 / 励志→明亮励志 / 其他→温暖钢琴）
- **节拍卡点**：自动分析 BGM 的 BPM 与节拍点，场景切换吸附到最近节拍（容差 0.35s），
  并有节拍脉冲微动效；曲库列表展示每首曲子的 BPM
- **字幕**：白字黑描边、逐句随配音出现，数字/引语关键词高亮，按标点自适应停顿
- **进度条**：底部细进度条 + 片尾淡出

BGM 曲库在 `remotion-engine\public\bgm\`。内置三首（`warm_piano` / `tense_pad` /
`uplifting`，由 `backend/tools/gen_bgm.py` 程序化生成的无版权曲目），此外可自助扩充：

- **网页导入**：AI 面板「⬆ 上传自定义 BGM」（音频或视频，视频自动抽音轨）或
  「本机路径导入」（输入本机文件完整路径，例如参考片 MP4）
- **在线免版权曲库**：AI 面板「🔎 搜索在线曲库」→ 关键词搜索 → 试听 → 一键导入。
  来源为 Openverse（CC0/PDM/CC BY 等明确允许再使用的许可）与 Jamendo（CC），
  结果自带许可证信息；导入时把来源/作者/许可写入曲目元数据（`storage/bgm_library.json`），
  发布成片可追溯授权。可选配置 `backend/.env`：`OPENVERSE_TOKEN`
  （api.openverse.org 免费注册，提升限额）、`JAMENDO_CLIENT_ID`
  （devportal.jamendo.com 免费申请，未配置则跳过该源）。
  注意：不解析未授权分发商业音乐的站点——抖音热歌等请用平台站内曲库或已授权文件
- **导入即归一**：统一转 44.1k mp3 并响度归一到 -18 LUFS（与内置曲一致，避免
  忽大忽小/削波），随后自动分析 BPM 与节拍点并缓存
- **接口**：`GET /api/bgm/tracks`（曲库清单，含 BPM/时长）、`POST /api/bgm/import`、
  `POST /api/bgm/import-path`、`GET /api/bgm/online-search`（免版权曲库搜索）、
  `POST /api/bgm/online-import`（搜索结果一键导入，含内网地址防护）、
  `POST /api/bgm/analyze/{name}`（强制重新分析）、`GET /api/bgm/audio/{name}`（试听）
- **命令行**：`cd backend && python -m app.services.bgm import <文件路径> [曲目名]`
  或 `python -m app.services.bgm list`

「人生副本」系列参考曲已导入为 `ref_theme`（来源
参考片抽取的完整音轨），
在项目设置里选中即可整片使用。

转场音效在 `remotion-engine\public\sfx\`，由 `python backend\tools\gen_sfx.py` 生成
（`whoosh` / `impact` / `riser`）；删除目录会导致渲染报错，重新生成即可。

## 后续路线（已预留切换点）

- **Phase 2**：`backend/app/services/images.py` 的 `generate_placeholders`
  替换为真实图片生成 API（即梦 Seedream / 通义万相），输出路径约定不变
- **Phase 2**：BGM 曲库按情绪标签匹配，注入渲染 props
- **热点雷达 V1.1**：微博/小红书接入（探测脚本就绪）、热点词条趋势曲线图、
  同事件跨平台聚合去重、定时热点简报推送（企业微信/钉钉 webhook）
