# 项目进度记录（截至 2026-10-28）

> 重启电脑后：双击根目录 **`launch.bat`** 即可恢复运行（后端 8000 + 前端 5173 + 自动打开浏览器）。
> 密钥已保存在 `backend/.env`，项目数据在 `backend/storage/projects/`，不会因重启丢失。

## 一、已完成并验证的功能

### 1. Web 工作流（Phase 1 全链路）
- 项目创建/列表/打开，分镜可视化编辑（年份、占位图文案、配色、台词增删、排序、JSON 模式）
- **AI 脚本生成/优化**：多模型下拉选择
  - 默认 **DeepSeek V4.1 Flash**（`deepseek-flash`，1M 上下文）
  - 备选 **MiMo v2.6 Flash**（`https://api.xiaomimimo.com/v1`）
  - 自定义 OpenAI 兼容接口预留
- **脚本提示词模板**：故事反转 / 悬念揭秘 / 知识干货 / 情感治愈 / 吐槽共鸣 / 自定义，可编辑、记忆
- **分镜图片提示词**：一键生成全部镜头的豆包出图提示词（人物跨镜一致、竖屏 9:16、无文字水印），逐镜复制/全部复制
- **自定义画面**：网页上传，或把豆包生成的图命名为 `custom_01.png`… 放入项目 pic 目录（渲染时优先使用，手动文件不会被清掉）
- **配音**：edge-tts 逐句生成 + 试听 5 种音色（云希/云健/云扬/晓晓/晓伊）
- **渲染**：Remotion 本地渲染 1080×1920 MP4，任务队列 + 进度轮询 + 在线预览/下载
- **执行流程面板**：生成脚本/保存/图片提示词/配音/画面/渲染/完成 七步实时状态
- 默认时长 180s；生成可中断（停止按钮）；生成前自动落库、生成结果自动落库

### 2. 剪辑工艺升级（DataVideo v2，对标中级剪辑师）
- **开场标题序列**（≥2.4s）：逐字弹入 + 红蓝色差 + 动态光晕 + 运动模糊光带 + 下划线扫入
- **转场**：交叉溶解 + 入场冲刺（放大回落 + 运动模糊消散），无黑场，重叠帧数自适应
- **运镜**：4 方向缓推缓拉/平移交替
- **质感**：暗角 + 胶片颗粒 + 底部进度条
- **字幕**：白字黑描边（参考片风格），逐句随配音出现

### 3. 音频工程
- **配音去"生硬"**：edge-tts 自带 ~0.2s 头 + ~0.9s 尾静音 → 自动裁剪（保留 30ms/120ms）；
  loudnorm -16 LUFS + 峰值安全增益；标点自适应停顿（。0.5s ？！0.6s ，0.25s）
- **BGM 铺底**：曲库 `remotion-life-sim/public/bgm/`（3 首程序化生成无版权曲 + 参考片原声），
  说话时自动闪避到 30%，首尾淡入淡出
- **自动匹配**：按剧情情绪关键词自动选曲（低谷→低沉悬疑 / 励志→明亮励志 / 其他→温暖钢琴）
- **节拍卡点**：自动检测 BPM 与节拍点，开场结束点与每镜起点吸附到最近节拍 + 节拍脉冲微动效

## 二、验证证据

| 项目 | 结果 |
|---|---|
| 后端单元测试 | **38 passed** |
| 前端构建 | tsc + vite build 通过 |
| 端到端渲染 | 417 帧 / 13.9s / 3.1MB 正常出片 |
| 卡点精度 | 开场 3.111s、镜1 3.111s 落在节拍（误差 0.000s）；镜2 误差 0.023s |
| 音频混音 | 间隙 RMS 0.022 vs 语音 0.060（无死寂段） |
| 配音时长优化 | 单句 3.34s → 2.43s（裁掉尾部静音） |

## 三、关键文件地图

```
video-workflow/
├── launch.bat / stop.bat        一键启停
├── backend/
│   ├── .env                     密钥与配置（勿外发）
│   ├── models.json              模型注册表
│   ├── prompts.json             脚本提示词模板
│   ├── tools/gen_bgm.py         程序化 BGM 生成器
│   ├── app/services/
│   │   ├── llm.py               模型调用/脚本与图片提示词生成
│   │   ├── voice.py             edge-tts + 裁静音 + 响度归一 + 试听
│   │   ├── beat.py              BPM/节拍检测（缓存 bgm_meta.json）
│   │   ├── music.py             BGM 情绪自动匹配
│   │   ├── pipeline.py          时间轴/停顿/props 组装
│   │   ├── images.py            自定义图优先 + 占位图
│   │   ├── renderer.py          Remotion 子进程渲染
│   │   └── tasks.py             渲染任务流水线
│   └── storage/                 项目数据 / 渲染产物 / 备份
└── frontend/src/                App / ScriptEditor / RenderPanel / PipelinePanel

remotion-life-sim/
├── src/DataVideo.tsx            props 驱动模板（开场/转场/字幕/BGM/卡点）
└── public/
    ├── bgm/                     BGM 曲库（可放入真实音乐 mp3）
    ├── pic/projects/<pid>/      分镜图（custom_NN.png 优先）
    └── voice/projects/<pid>/    配音 mp3
```

## 四、已知限制 / 未完成

1. **参考片 BGM**：`人生副本-参考.mp4` 的音轨是旁白+BGM 混录，提取出的 `ref_theme.mp3`
   含原视频人声，不能铺底。需要一首纯音乐文件放入 `public/bgm/` 才能真正复刻。
2. **真实图片生成 API 未接入**（Phase 2）：目前用渐变占位图 + 手动自定义图。
3. **热点选题聚合未做**（Phase 3）。
4. 配音仍是免费 edge-tts 极限优化；更高自然度需接付费 TTS（火山/MiniMax）。
5. **重启前请确认浏览器里没有未保存的分镜内容**——未点保存的内容只存在于页面中，重启会丢失。

## 五、下一步建议（优先级）

1. 用户把真实的多分镜内容保存落库，然后用豆包出的图渲染一版对比参考片
2. 提供一首纯音乐 BGM → 验证卡点/情绪匹配效果
3. 接入即梦 Seedream 图片 API（Phase 2）
4. 可选：LLM 语义选曲、逐字卡拉OK字幕、火山/MiniMax 付费 TTS

## 六、2026-10-29 剪辑与配音升级（P0）

### 剪辑（`remotion-life-sim/src/DataVideo.tsx`）
- **按句切镜**：同一分镜内每句台词换一个构图硬切；超过 3.4s 的长句再补一刀，避免一张图停 6~10 秒
- **8 种运镜**：推 / 拉 / 左右摇 / 上下摇 / 斜推 / 斜拉，幅度加大到 1.04~1.19，落刀带轻微定帧
- **5 类转场**：溶解、甩镜（横移 + 运动模糊）、变焦模糊、闪白、硬切；按下一镜语气（！/？）与序号自动选择，避免连续重复
- **音效层**：`public/sfx/{whoosh,impact,riser}.wav`，由 `backend/tools/gen_sfx.py` 程序化生成；开场 impact + riser，转场按类型触发
- **调色**：contrast / saturate / brightness + 按分镜配色的 soft-light 色调 + 缓慢游移高光
- **质感**：动态胶片颗粒（逐帧位移）、暗角、片尾淡出
- **字幕**：48→56px，数字 / 引语关键词高亮，逐句淡入淡出节奏重调
- **开场**：3.6s→2.2s，去掉固定英文小字，改为可选 `kicker`

### 配音（`backend/app/services/voice.py`）
- **整场合成**：同一场景台词一次性交给 edge-tts，利用 WordBoundary 按词边界切回逐句 mp3，保留原有逐句契约
- **语调连贯**：问句 +2Hz、感叹句 +1Hz；整场合成失败自动回退逐句合成，不影响出片
- **后处理**：highpass 75Hz + 轻压缩 + loudnorm -16 LUFS + 峰值安全增益
- **语速**：项目默认 +6%，前端新增语速选择（-4% ~ +15%），随项目落库

### 验证
- 后端 `pytest`：38 passed
- 前端 `tsc && vite build`：通过
- Remotion `tsc --noEmit`：通过
- 0~33s 实渲染通过（1080×1920，含溶解 / 硬切 / 闪白），音频轨正常，音效峰值约 -13dB
- 旧 `props.json` 契约完全兼容，无需迁移

## 七、2026-10-30 热点雷达（媒体搜索引擎，Phase 3 核心交付）

> 产品目标：针对媒体热点第一时间出手，抓住第一波流量。全程以"用户早上打开 → 3 分钟内决定今天拍什么"为验收标准。

### 数据源（真实探测验证，免登录）
- **已接入 5 源**：抖音热榜 / 头条热榜 / 百度热搜 / 知乎热榜 / B站搜索热词（首轮实测 230 条 / 5 源全绿）
- **待接入**：微博（403/访客系统反爬）、小红书（无公开接口），`backend/tools/probe_hot_sources.py` 可随时复测
- 单源失败不影响其他源；UA 伪装 + 超时 12s；自动抓取每 10 分钟（HOTSPOT_REFRESH_MINUTES，最小 5）

### 核心算法（`backend/app/services/hotspot.py`）
- **归一化热度**：有数值平台（抖音/头条/知乎）平台内对数缩放 max→100；无数值平台（百度/B站）排名代理 榜首100→末位30
- **趋势引擎**：基于**原始热度**跨快照对比（相对变化率，6% 阈值滤抖动）→ new / up / flat / down；
  注意不能用归一化值对比（榜首恒 100 会抹掉涨跌，实测踩过）
- **第一波指数 burst**：趋势基础分（新58/升48/平30/降16）+ 热度×0.35 + 新鲜度（≤30min +15 … 超24h -10），
  普通热点封顶 97，**跨平台共振 +8 可达 100 永远置顶**
- **状态瘦身**：7 天未再出现的热点从 state.json 清除；快照保留 72h

### 功能清单
- 热点列表：第一波指数/热度/最新三种排序，平台筛选，多关键词过滤，方向 chips 筛选（含"未分类"）
- **自定义搜索方向**：名称+关键词+排除词，热点命中自动打标；预设 AI科技/影视娱乐/社会民生/游戏电竞，可增删
- 跨平台共振识别（同标题 normalize 后多平台同时上榜）
- 每条热点带原链接 + 平台站内搜索直达（"去抖音搜同款"）
- **AI 选题**：勾选热点 → LLM 生成选题（标题/角度/钩子/流量点/来源）→ 一键新建项目自动填入选题框
- 前端 90s 静默轮询；方向/热点/源状态全部实时渲染

### 文件
- 新增：`services/hotspot.py`、`services/hotspot_sources.py`、`routers/hotspot.py`、
  `tests/test_hotspot.py`、`frontend/src/components/HotspotRadar.tsx`、`backend/tools/probe_hot_sources*.py`
- 修改：`main.py`（注册+启动/停止钩子）、`config.py`（HOTSPOT_*）、`services/llm.py`（generate_hotspot_topics）、
  `frontend`（types/api/App/index.css：顶层 Tab 视频项目 / 热点雷达）

### 验证
- 后端 `pytest`：**64 passed**（热点雷达新增 26 个：归一化/趋势/指数/方向匹配/5 源解析器/服务两轮编排/路由 CRUD/AI 选题）
- 前端 `tsc --noEmit && vite build`：通过
- 真实网络端到端：5 源抓取 230 条、方向 CRUD、AI 选题真实 LLM 生成（茅台谣言/BLG vs TES → 4 条可用选题）
- 浏览器实测：Tab 切换、列表渲染、趋势徽章（实测出现"上升 +6.8%"）、共振标记、AI 选题卡、
  一键建项目（选题自动填入）全链路 ✓

## 八、2026-10-30 凌晨热点雷达迭代（V1.1，7 个迭代全交付）

> PM 驱动通宵迭代：每个迭代独立可验证，全程保持 pytest 全绿 + 前端构建通过。

| # | 迭代 | 内容 | 验证 |
|---|---|---|---|
| 1 | **趋势 sparkline** | items API 新增 `history`（最近热度序列，含本轮）；前端 SVG 迷你曲线（升绿降紫红）；第一波指数分档配色（≥85 红/≥70 橙/≥50 黄/其余灰） | 67 tests ✓ 实测 99 条曲线渲染 |
| 2 | **聚合同事件** | 跨平台同标题条目合并为一行：多平台徽章竖排、burst/hot 取高、rank 取前；开关记忆 | UI 实测开关生效 |
| 3 | **今日选题工作台** | AI 选题生成即落库（topics.json）；状态流转 待拍→拍摄中→已完成（点击循环）+ 弃/删；建项目后回填 project_id，可一键跳转项目；同热点重复生成时前端提示 | 20 hotspot tests ✓ |
| 4 | **每日早报** | `GET /api/hotspot/briefing`：Top N + 规则理由（共振/刚上榜/上升中/平台标记），不依赖 LLM 快且稳；顶部横幅卡片可折叠记忆；24h 新见统计 | 实测理由："百度、抖音、头条多平台同时上榜，大事件信号" |
| 5 | **项目列表体验** | list API 返回 shot_count/line_count/has_video；列表搜索 + 三种排序 + 卡片统计徽章（N 镜 · N 句 · ✓已出片） | 搜索/统计实测 ✓ |
| 6 | **赛道预警** | 命中自定义方向 + 2h 内新见 + trend new/up + burst≥70 → 雷达页预警横幅 + Tab 红点（脉冲动画）；已读 localStorage 记忆，"知道了"清除 | 条件各子集均有数据，深夜交集为 0（白天高峰自然触发） |
| 7 | **细节打磨** | 复制热点标题 / 复制选题文案（标题+角度+钩子）；早报条目"＋选题"直达勾选；平台/排序/聚合开关 localStorage 记忆 | UI 实测 ✓ |

### 最终验收（浏览器实测截图）
- 早报 5 条 + "＋选题"勾选联动 ✓；sparkline 99 条 ✓；分档配色 10 红 + 95 橙 ✓
- 项目列表搜索"BGM"过滤 1/4 ✓；3 个"已出片"徽章 ✓
- 用户已自建方向「vibe 知识大赛」（功能被真实使用）✓
- 后端 69 passed / 前端 tsc + vite build 通过

### 备注
- 凌晨重启 8000 端口旧实例以加载新代码（launch.bat 白天启动即为新版）
- 选题工作台文件：backend/storage/hotspot/topics.json

## 九、2026-10-30 凌晨 V1.2 迭代（6 项全交付）

> 用户授权 PM 自主决策持续迭代至 09:00。每个迭代独立验证，全程 70 tests 全绿。

| # | 迭代 | 内容 | 验证 |
|---|---|---|---|
| 1 | **热点详情弹窗** | 「详情」链接打开弹窗：大号面积填充趋势图（不足 2 轮数据自动降级为提示）、burst 分档大数字、原始热度/排名/首见/最近/命中方向、摘要、复制/原页面/搜同款/加入选题，ESC 与遮罩关闭 | UI 实测 ✓ |
| 2 | **选题工作台增强** | 状态筛选 chips（全部/待拍/拍摄中/已完成/已弃+计数）；备注字段（落库 note，📝 编辑，Enter 保存）；清空已完成/已弃（`POST topics/clear`）；复制清单按钮 | 70 tests ✓ |
| 3 | **选题一键生成脚本** | 工作台「⚡ 生成脚本」= 建项目 + 自动 AI 生成分镜 + 落库 + 自动流转"拍摄中"；aiGenerate 支持外部 pid/topic 注入 | tsc+build ✓ |
| 4 | **渲染完成通知 + 早报 AI 点评** | 渲染中/完成/失败 → 标签页标题变化 + 桌面 Notification；早报卡「🤖 AI 点评」逐条给 适合形式/拍摄角度/风险提示（按 generated_at 缓存省 token） | 真实 LLM 实测 5 条点评 ✓（含"票数数据需核实"类风险提示） |
| 5 | **新数据源探测** | 网易/澎湃/搜狗/IT之家/36氪 全部不可用（404/签名/500），维持 5 源阵容；探测脚本 `probe_hot_sources3.py` 留档 | 探测完成 |
| 6 | **早报洞察统计** | briefing stats 新增 各平台在榜数 / 方向命中分布 / 平均第一波指数；早报卡顶部一排分布徽章 | UI 实测 ✓ |

### 排障记录
- **pytest 断言重写缓存陈旧**（Windows mtime 精度）：改测试后 pytest 偶尔执行旧字节码，现象为"断言行号对不上/逻辑诡异"。清 `__pycache__` + `.pytest_cache` 后 3 连跑全绿。夜间自动化班次若遇类似诡异失败，先清缓存再判断。
- 早报 AI 点评按钮被 vite HMR 重置过一次（开发期正常现象）。

### 验收截图要点
- 赛道预警横幅真实触发（1 条新爆热点）；AI 点评 5 条渲染（口播/图文口播/盘点 + 风险提示）；洞察分布行 + 平均第一波指数 68.3；用户自建方向「vibe 知识大赏」命中 8 条。

## 十、2026-10-30 凌晨 V1.3 迭代（2 项）

1. **搜索方向编辑**：方向 chip 新增 ✎ 编辑入口（复用表单回填，保存调 PUT），不再需要"删了重建"
2. **多平台分发调研**：详情弹窗新增小红书/快手/微博搜索直达（对同一热点看各平台竞争度，方便一稿多投）

## 夜间盯守日志

### 2026-10-30 01:41 班次（自动化）
- ✓ 健康检查：后端 71 passed、前端 tsc 无错误（旧班次指令里的"64 passed"为过时预期，实际以最新为准）
- ✓ 数据采集：01:41 抓取 230 条，5 源全通（抖音50/头条50/百度50/知乎30/B站50）
- ✗ 微博复测：仍 403/432（反爬），继续挂起
- ✓ 迭代队列 **A 完成**：热点导出 CSV（`GET /api/hotspot/export.csv`，UTF-8 BOM 防 Excel 乱码，
  含平台/排名/标题/热度/趋势/第一波指数/首见/命中方向；前端状态条新增「⬇ 导出 CSV」），
  新增 1 个测试 → 71 passed，前端构建通过。**下一班从 B 开始领取。**

### 2026-10-30 01:58 班次（自动化·队列制）
- ✓ 健康检查：后端 71 passed（队列 A 基线）、前端 tsc 无错误
- ✓ 数据采集：01:58 抓取 230 条，5 源全通（趋势采样点持续累积）
- ✓ 迭代队列 **B 完成**：state.json 写入备份——save_state 覆盖前将旧文件复制为
  state.json.bak（趋势历史不可再生，防写坏）；load_state 在 state.json 损坏时自动回退
  bak；新增 1 个单测（备份存在+内容正确+损坏回退）→ 72 passed，前端构建通过。
  **下一班从 C 开始领取。**

### 2026-10-30 02:43 班次（自动化·队列制）
- ✓ 健康检查：后端 72 passed、前端 tsc 无错误
- ⚠ 数据采集：02:43 抓取 180 条，**抖音源本轮失败**（其余 4 源全通；疑似瞬时网络问题，连续 2 班失败才会定性，下班继续观察）
- ✓ 迭代队列 **C 完成**：搜索快捷键——按 `/`（非输入框聚焦时）快速聚焦关键词搜索框，
  输入框内 Escape 一键清空并失焦；placeholder 补提示。tsc + build 全绿（纯前端改动，无新增后端测试面）。
  **下一班从 D 开始领取。**

### 2026-10-30 03:29 班次（自动化·队列制）
- ✓ 健康检查：后端 72 passed（本班前）、前端 tsc 无错误
- ✓ 数据采集：03:29 抓取 230 条，**5 源全通**（02:43 抖音单轮失败确认为瞬时问题，未连续失败）
- ✓ 迭代队列 **D 完成**：早报环比——briefing 新增与上一份快照的在榜条目重合率 overlap_pct
  （低=榜单大换血、新热点多；早报卡头部显示"与上轮重合 X%"，不足两轮快照省略）。
  **顺带修掉一个真实边角 bug**：快照文件名原只精确到秒，同秒两轮抓取会互相覆盖
  （测试同秒连跑两次踩中），已加毫秒精度。新增 1 个单测 → 73 passed，前端构建通过。
  **下一班从 E 开始领取。**

### 2026-10-30 04:14 班次（自动化·队列制）
- ✓ 健康检查：后端 73 passed、前端 tsc 无错误
- ⚠ 数据采集：04:14 抓取 180 条，**抖音再次单轮失败**（02:43 败 → 03:29 复 → 04:13 又败，
  间歇性模式，未满足"连续 2 班"定性条件；其余 4 源全通。下一班若仍失败则定性并排查
  ——可能与夜间限流/缓存过期有关，douyin 接口为旧 SDK 免登录接口，容忍偶发）
- ✓ 迭代队列 **E 完成**：选题工作台空状态改为三步引导（1 勾选热点 → 2 AI 生成选题 →
  3 ⚡生成脚本，编号圆点 + 箭头，GitHub Dark 风格）。tsc + build 全绿，73 passed。
- 🎉 **迭代队列 A–E 全部清空**。后续班次只做健康检查 + 数据采集。

### 2026-10-30 04:58 班次（自动化·队列制）
- ✓ 健康检查：后端 73 passed、前端 tsc 无错误
- ⚠ 数据采集定性：04:59 抓取 180 条，**抖音连续 2 班失败（04:13 + 04:59），定性为接口层拒绝**
  ——3 次重试均报 WinError 10054（远端强制断连），非解析问题。推测：iesdouyin 旧 SDK 接口
  夜间风控/限流（本机后台每 10 分钟自动刷新 + 班次采集双通道高频访问，可能触发）。
  UI 已自动显示"抖音 ✗"，其余 4 源正常（180 条），服务韧性符合设计（单源失败隔离）。
  **留白天人工决策**：换新接口 / 降低抓取频率（HOTSPOT_REFRESH_MINUTES 调大）/ 挂代理。
- ✓ 队列已清空，本班无代码改动。

### 2026-10-30 05:43 班次（自动化·队列制）
- ✓ 健康检查：后端 73 passed、前端 tsc 无错误
- ✓ 数据采集：05:43 抓取 230 条，**5 源全通（抖音已恢复）**——确认 04 点档的失败为间歇性
  风控而非接口下线；维持现有抓取频率不变，继续观察白天表现。
- ✓ 队列已清空，本班无代码改动。

### 2026-10-30 06:28 班次（自动化·队列制）
- ✓ 健康检查：后端 73 passed、前端 tsc 无错误
- ⚠ 数据采集：06:28 抓取 180 条，抖音单轮失败（05:43 曾成功，未连续 2 班，不定性；
  间歇风控模式持续：成-败交替），其余 4 源全通
- ✓ 队列已清空，本班无代码改动。

### 2026-10-30 07:13 班次（自动化·队列制）
- ✓ 健康检查：后端 73 passed、前端 tsc 无错误
- ✓ 数据采集：07:13 抓取 230 条，**5 源全通（抖音恢复）**。间歇风控模式稳定呈
  "约一小时成功-一小时失败"交替（05:43✓ → 06:28✗ → 07:13✓），与自动抓取节奏叠加后
  对趋势数据影响有限（相邻快照总有覆盖）；维持现状，不再逐班记录该模式。
- ✓ 队列已清空，本班无代码改动。

### 2026-10-30 07:58 班次（自动化·队列制）
- ✓ 健康检查：后端 73 passed、前端 tsc 无错误
- ⚠ 数据采集：07:58 抓取 180 条，抖音单轮失败（交替模式延续：07:13✓ → 07:58✗），其余 4 源全通
- ✓ 队列已清空，本班无代码改动。

### 2026-10-30 08:44 班次（自动化·队列制·末班）
- ✓ 健康检查：后端 73 passed、前端 tsc 无错误
- ✓ 数据采集：08:44 抓取 230 条，**5 源全通**——早高峰前最后一轮采样完成，
  整夜共积累约 13 个趋势采样点（01:16 起每 10-45 分钟一轮），sparkline 与早报环比数据就绪。
- ✓ 队列已清空，本班无代码改动。**盯守到此结束（09:00 起）**，此自动化可在 Automations 页面删除。

## 十一、AI 导演上线（运镜/转场/调色/颗粒/BGM 交给 AI）

> 动机：用户指出"效果差"的根源——视觉动效层是写死的规则，AI 只管文案。本次把剪辑决策权交给 AI，固定规则降级为兜底。

### 架构
- **契约**：RenderShot 新增 camera / camIntensity / enterTransition / grade(contrast·saturate·brightness·tintOpacity)；
  RenderProps 新增 grainOpacity（全片颗粒）。全部可选、exclude_none 序列化，旧模板完全兼容
- **services/director.py**：LLM 输出清洗（枚举受限/数值 clamp/缺镜补齐——模型输出不可信）+
  脚本指纹缓存（storage/projects/<pid>/director.json，脚本不变不重复生成，省 token）
- **llm.generate_director_plan**：导演 system prompt（运镜/转场/调色语义表 + BGM 曲库注入 + 温度 0.6）
- **tasks.py**：新增 `directing` 阶段（配音/画面之后）；BGM 优先级 = 用户指定 > AI 选曲(auto 时) > 关键词规则；
  导演生成失败自动回退固定规则（实测兜底成功出片）
- **DataVideo.tsx**：CAM_INDEX 运镜名映射、camFor 强度倍率（0.6~1.6 缩放位移/变焦）、
  buildSubShots 机位覆盖、buildTimeline 尊重 AI 显式转场（规则路径仍做连续去重）、
  SceneInner 逐镜 grade filter + tintOpacity、Grain 可调透明度
- **前端**：AI 面板「AI 导演」开关（默认开，随项目落库）+ 执行流程面板新增「AI 导演」步骤

### 验证
- 后端 83 passed（新增 10：枚举清洗/clamp/指纹缓存/生成一次复用/props 合并/序列化 camelCase 无 null）
- Remotion tsc --noEmit 通过；前端 tsc + vite build 通过
- 端到端（BGM卡点验证项目，真实 LLM）：镜1 低谷→push 0.9 + 冷调低饱和 + dissolve；
  镜2 反击"天塌了！"→diag_in 1.25 + 高饱和 + whip 甩镜；grainOpacity 0.045；
  director.json 落库；Remotion 正常消费新 props 出片（stage=done）
- 排障：tasks.py 中 `bgm = None` 赋值把 bgm 模块名变成局部变量导致 UnboundLocalError
  （已改 `bgm as bgm_svc` 别名）；8000 端口旧实例需 kill 后新代码才生效

## 十二、工作区持久化（刷新/误关不再丢内容）

> 用户痛点：刷新页面后未保存的分镜编辑、选题、提示词全部丢失；正在跑的渲染任务进度也"消失"。

### 实现
1. **本地编辑草稿（App.tsx）**：dirty 时 800ms 防抖把 分镜脚本 + 选题/风格/提示词/时长/模型/配音/
   语速/BGM/AI导演开关 整体写入 localStorage（按项目隔离 `vw.draft.<pid>`，带时间戳）；
   打开项目时草稿时间戳 ≥ 服务器 updated_at 才恢复（云端更新时丢弃过期草稿），恢复后顶部
   黄条提示 + 「放弃草稿还原服务器版本」按钮；保存成功自动清草稿；有未保存修改时
   beforeunload 拦截提醒；列表卡片显示「💾 有本地草稿」标记；删除项目同步清草稿
2. **渲染任务恢复**：后端新增 `GET /api/projects/{pid}/task/active`（后端任务线程不因前端刷新
   中断）；RenderPanel 挂载时查询活跃任务并自动恢复进度轮询；顺带修复 RUNNING 集合缺
   `directing` 阶段导致 AI 导演期间轮询提前停止的 bug

### 验证（浏览器实测）
- 编辑分镜 → 新标签页重开项目 → 黄条"已恢复上次未保存的编辑"+ 编辑内容完整还原 ✓
- 「放弃草稿」→ 内容还原为服务器版本、草稿清除 ✓
- beforeunload 在有未保存修改时触发拦截 ✓（IAB 实测刷新被拦）
- 后端 105 passed（+2：active 端点）；前端 tsc/build 通过

## 十三、模板相关性门（AGENTS.md 规则的产品化落地）

> 用户规则（最后重申）：每次制作视频前，先判断内容与已有模板库是否相关；
> 无关 → 从零开始设计（通过提示词 + AI 创作），有关 → 检查能否复用，只复用匹配项。

### 实现（三层防线）
1. **工作区规则文件**：根目录 `AGENTS.md`（AI 每次会话必读）——模板库=行星/宇宙/地球演化域
   （solar/nebula/accretion/ocean 等 11 种代码场景），无关内容禁止注入，判不准按无关处理
2. **导演链阶段 0（判定）**：`llm.judge_template_relevance` → `director.validate_template_info`
   （非法/判定失败保守按 from_scratch）；结论落库 director.json `template` 字段；
   `mode_box` 回传闭包，from_scratch 时给风格圣经/逐镜编排提示词追加 FROM_SCRATCH_RULE 硬性禁令
3. **强制清洗（执行）**：`director.sanitize_plan_for_mode` —— from_scratch 时剥离全部
   scene 代码场景与 stars 星空氛围（含缓存复用的旧镜头），通用词表（运镜/转场/调色/浮层）保留；
   提示词层只引导，清洗层才兜底

### 从零创作提示词包（prompt pack）
- `services/brief.py`：script + plan + 实测句时长（props.json）→ `storage/projects/<pid>/prompt_pack.md`
  （概览/判定结论与禁令/全局风格/逐镜台词时长重音动效意图/生图指引/验收标准）
- directing 完成自动落库；`GET /api/projects/{pid}/prompt-pack` 按需重建（text/markdown）
- 人工参照样板：`briefs/ppt-20pages-video-brief.md`（《一句话生成20页PPT》全量简报）

### 细节
- 判定缓存：脚本指纹未变 → 复用上次判定，不重复调 LLM；judge_fn 未提供（旧调用方/测试）→
  维持 reuse 旧行为
- 阶段消息编号 0~4/4（相关性→风格→逐镜→审查）
- 测试 142 passed（+13：判定清洗/from_scratch 剥离/复用保留/判定失败保守/无judge兼容/
  判定缓存/mode_box 回传/提示词包内容与端点）

## 十四、2026-11-02 开源工具盘点成片（10 个日常提效工具）

> 用户需求：从 GitHub 搜 10 个提高普通职业日常效率的开源工具，做成 1 分钟竖屏科普，
> 动效精美、内容属实、面向小白，并且数据落库、前端可见制作进度。

### 成片

| 项 | 值 |
|---|---|
| 项目 id | `8a1ef37747ff` |
| 标题 | 10 个开源工具，把日常办公效率拉满 |
| 成片 | `backend/storage/renders/8a1ef37747ff/final.mp4`（64.32s / 1929 帧 / 7.4MB） |
| 预览 | 同目录 `preview.mp4`（前 10 秒）；`cover.jpg` 已生成供发布面板使用 |
| 画幅 | 1080×1920 @30fps，MotionShow（纸感设计令牌） |
| 结构 | 12 镜 / 14 句：封面 → 10 个工具卡 → 收尾互动 |
| 判定 | `from_scratch`（工具盘点与行星/宇宙模板无关；无模板 scene、无星空） |

### 内容与事实源

10 个工具全部来自 GitHub 官方仓库，star 数与许可为 **2026-11-02 GitHub API 快照**：

| # | 工具 | 仓库 | ★ | 许可 |
|---|---|---|---|---|
| 1 | PowerToys | microsoft/PowerToys | 14.0万 | MIT |
| 2 | ShareX | ShareX/ShareX | 4.1万 | GPL-3.0 |
| 3 | CopyQ | hluk/CopyQ | 1.3万 | GPL-3.0 |
| 4 | Espanso | espanso/espanso | 1.5万 | GPL-3.0 |
| 5 | Umi-OCR | hiroi-sora/Umi-OCR | 4.8万 | MIT |
| 6 | Stirling PDF | Stirling-Tools/Stirling-PDF | 9.6万 | MIT 核心 |
| 7 | Joplin | laurent22/joplin | 5.7万 | AGPL-3.0 |
| 8 | LocalSend | localsend/localsend | 9.7万 | Apache-2.0 |
| 9 | OBS Studio | obsproject/obs-studio | 7.9万 | GPL-2.0 |
| 10 | Czkawka | qarmin/czkawka | 3.5万 | MIT / GPL-3.0 |

数据落库：`storage/projects/8a1ef37747ff/` 下 `research.json`（10 节点 + 仓库出处）、
`script.json`、`director.json`（每镜 tool 卡片 + layout=tools）、`styles.json`、`review.json`、
`flow.json`、`prompt_pack.md`；`renders/<pid>/props.json` 含完整渲染契约。

### 代码改动

1. **ToolSpec 数据契约**：`schemas.RenderShot.tool` + `pipeline._tool_spec`；
   `stars` 为数值，卡片内做 0→当前 star 的计数动画。
2. **MotionShow `tools` 版式**：左侧工具名/分类/仓库/星数/许可/平台，右侧 300px 图标卡
   + 旋转虚线轨道 + 10 个手绘 SVG 图标（windows/camera/clipboard/keyboard/scan/pdf/
   notebook/send/record/broom）；逐元素错帧、遮罩擦除、强调色下划线、10 格进度轨。
3. **MotionShow 音频修复**：新增 `narrationAudio` 根级播放；`voice.mix_motion_track`
   严格复刻 MotionShow 时间轴（0.35s 句间 / 0.6s 镜尾 / 最短 2.4s）预混整轨，
   避免 DataVideo 混音器导致的音画漂移。
4. **纸感材质层级修复**：`TextureLayer` 拆 under（纸纹/网点，内容之下）/ over（颗粒/暗角）；
   原实现把纸纹盖在文字上，把 ink `#14110F` 洗成约灰度 100，现恢复为清晰墨色。

### 验证

- 后端 pytest：**249 passed**（新增 tool 卡片契约回归 1 个）
- Remotion `tsc --noEmit`：通过；顺手修掉 `motion.ts` 的 `React.CSSProperties` 历史类型错误
- 实测：preview 10.01s / final 64.32s，音轨 AAC 48k stereo；旁白 RMS 0.209、峰值 0.99
- 抽帧 QA：4 张关键帧纸感占比 97%+，强调色/墨色均存在，内容 bbox 左右 ≥72px、
  底部 ≥628px 安全区，无越界
- 前端：`http://localhost:5173` 项目列表显示「已出片」；六步面板 step=6、预览/成片可播
  （`/api/projects/8a1ef37747ff/video` 返回 206 video/mp4）

## 十五、2026-11-02 A 股 vs 美股 20 年（60s 卡点数据片）

> 用户需求：近 20 年 A 股与美股走势 + 对应事件，曲线动效漂亮，面向小白；
> 60 秒竖屏；BGM 自选并让大起大落的切点卡在重音上；数据准确。

### 成片

| 项 | 值 |
|---|---|
| 项目 id | `e28e30a04e57` |
| 标题 | 20 年，谁跑赢了？A 股 vs 美股 |
| 成片 | `backend/storage/renders/e28e30a04e57/final.mp4`（60.01s / 1800 帧 / 4.87MB） |
| 规格 | 1080×1920 @30fps，AAC 48k stereo，H.264 |
| 结构 | 9 镜：封面 6s → 20 年全程 13s → 6 个事件各 6s → 总结 5s |
| 判定 | `from_scratch`（财经数据可视化，与行星模板无关；自绘 SVG 双线/事件卡） |

### 数据（Yahoo Finance 月末收盘，价格指数不含股息）

- 口径：**2005-12-31 = 100**，覆盖 2006–2025 共 20 个完整自然年；241 个月末点。
- 20 年累计：**标普 500 +448.4%**（年化 8.9%），**上证 +241.8%**（年化 6.3%）。
- 六个事件卡：2008 金融危机（上证 -72% / 标普 -57%）、2015 杠杆牛（+153% / -49%）、
  2020 熔断（标普 33 天 -34%，全年 +16%）、2022 加息（-19% / -15%）、
  2024 924（A 股 6 日 +27%，标普全年 +23%）、2025 关税（标普 -18.9% 后全年 +16%）。
- 数据落库：`storage/projects/e28e30a04e57/` 下 `market.json`（241 点 + 20 年年度涨跌 +
  6 事件）、`research.json`（11 节点带 Yahoo/BIS/上海市政府/IMF 出处）、`script.json`、
  `director.json`、`market.md`、`prompt_pack.md`；`renders/<pid>/props.json` 含完整行情数组。

### 卡点与 BGM

- 硬切点：**6 / 19 / 25 / 31 / 37 / 43 / 49 / 55s**；每镜 `durationSec` 固定，
  `mix_motion_track` 也复刻同一时长，实测总长 60.00s，无漂移。
- BGM：`public/bgm/market_race_bgm.mp3`，基底为项目内无版权 `gold_race_bgm`（120.2 BPM），
  在 8 个硬切点烘焙 impact、4 个段落前叠 riser、图表事件点叠轻 tick；尾部淡出。
- 成片音频：8 个切点前后 0.25s 峰值 **0.81–0.94**，局部基线 RMS 0.08–0.11；
  旁白 RMS 0.177、峰值 0.95；最长静音 0.25s。

### 代码改动

1. **行情数据契约**：`MarketData / MarketPoint / MarketAnnual / MarketEvent / MarketMarker /
   MarketShot`；`RenderShot.market` + `RenderProps.market`；`pipeline` 透传并校验。
2. **卡点镜长**：`RenderShot.duration_sec`（`durationSec`）+ MotionShow
   `shotDurationInFrames = max(台词排布, durationSec)`；`voice.mix_motion_track` 同步。
3. **MotionShow `market` 版式**：overview（双线平滑曲线、事件标记、20 年年度红蓝条形、
   年份游标）、zoom（窗口归一化、事件竖带、峰值脉冲、双列收益卡、20 年上下文轨）、
   finale（累计收益计数、年化、结论）。红=上证 `#C8452D`，蓝=标普 `#1F4E79`。
4. **数据装载**：`flow._load_market` / `tasks` 从项目 `market.json` 读取并注入 props，
   普通项目无 market.json 时完全不受影响。
5. **BGM 工具**：`backend/tools/make_market_bgm.py`（选曲 + 精确重音 + 尾部收束）。

### 验证

- 后端 pytest：**254 passed**（新增 market payload + durationSec 回归 1 个）
- Remotion `tsc --noEmit`：通过
- 抽帧 QA：9 镜均含纸感底、墨色文字、红色/蓝色数据层；居中后内容 bbox
  x 96–983 / y 364–1501，无越界
- 前端：`http://localhost:5173` 项目列表第一条；六步面板 step=6、预览/成片可播；
  `/api/projects/e28e30a04e57/video` 返回 206 video/mp4；`cover.jpg` 已生成
- 来源：Yahoo Finance（`000001.SS` / `^GSPC`）、BIS April-2025 tariff shock、
  上海市政府 2024-09-24 报道、IMF 2024 China equity rally 报告
