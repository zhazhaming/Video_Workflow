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

## 十六、2026-11-03 今日早报三栏目（实时热点 / 科普知识 / 工具分享）

### 功能

早报卡片从单一「实时热点」扩展为三个栏目 Tab（记忆上次所在栏目）：

1. **🔥 实时热点**：原有逻辑，国内平台热点按第一波指数排序（GitHub 仓库不混入）。
2. **🔬 科普知识**：当日全平台科普最火内容。内置科普子话题词表
   （宇宙地球 / AI科技 / 财经知识 / 健康心理 / 历史人文 / 生活百科，覆盖地球起源、
   AI 趋势、黄金股票走势、知识科普等），每次抓取自动归类，顶部展示子话题命中分布，
   条目带子话题徽章 + 入选理由；可走 `ai-briefing?section=science` 逐条 AI 拍摄点评。
3. **🧰 工具分享**：GitHub 每日热门仓库（解析 github.com/trending 页，
   失败自动回退官方 Search API「近 7 天新建高星仓库」），展示星数 / 语言 / 简介 /
   职场受众标签（启发式兜底 + `POST /api/hotspot/ai-tools` AI 解读：
   受众 / 用途 / 提效点，按仓库名落盘 `tools_meta.json` 缓存，同一仓库只花一次 token）。
   仓库同时进入热点主列表（平台筛选可选 GitHub），可正常「＋选题 / AI 选题」。

### 代码改动

1. `hotspot_sources.py`：`fetch_github`（trending 页解析 `_parse_trending_html` +
   Search API 兜底 `_github_api_fallback`）；github 源 `trust_env=True`（可走系统代理）。
2. `hotspot.py`：`SCIENCE_TOPICS` 词表 + `match_channels`（每次抓取算 subtopics）；
   `briefing()` 返回 `science` / `tools` 栏目；`tools_section`（受众启发式
   `guess_audience` 兜底）+ `merge_tools_meta`（AI 结果防幻觉校验后落盘）；
   `HotspotStore` 增加 `tools_meta.json` 读写；早报理由抽为模块级 `_hot_reason`。
3. `llm.py`：`generate_tool_meta`（批量仓库 → 受众/用途/提效点 JSON）。
4. `routers/hotspot.py`：`ai-briefing` 增加 `section` 参数（hot/science，缓存键
   `(generated_at, section)`）；新增 `POST /api/hotspot/ai-tools`。
5. 前端 `HotspotRadar.tsx`：早报 Tab 切换（localStorage 记忆）、科普/工具栏目渲染、
   AI 按钮按栏目分流；`types.ts` / `api.ts` 新类型与接口；`index.css` 样式
   （brief-tabs / subtopic-badge / aud-chip / tool-stars / pf-github）。

### 验证

- 后端 pytest：**262 passed**（test_hotspot 33 个，新增 GitHub 解析/兜底、科普频道、
  栏目编排、AI 工具解读缓存、section 路由 8 个）
- 前端 `tsc -b` + `npm run build`：通过
- 实测：6/6 源在线；GitHub trending 解析 15 条（当日页实际条数），星数与
  GitHub API 实际值核对一致（Scrapling 92.5k ↔ 92466）；`ai-tools` 真实 LLM
  解读 12 个仓库成功，二次调用 `classified: 0`（缓存命中）；科普 AI 点评正常

## 十七、2026-11-03 视频工作流 Skill 化（第一阶段打样）

### 动机

不再以 FastAPI 编排代码作为流程的唯一载体：把「内容选题 → 视频文案 → BGM → 配音 →
视频风格 → 视频内容」的流程与知识沉淀为 ZCode skill，由 AI agent 依据 skill 直接做
创作判断（不再经后端 LLM 转发），确定性执行（TTS/预混/渲染）走 CLI 工具包装。
FastAPI 六步向导保留双轨（决策：不删不改，不再新增功能）。

### 交付

1. **Skill 家族**（`.agents/skills/`，项目级，ZCode 自动发现；总入口 `video-producer`）：
   - `video-producer`：六阶段流水线路由、pid/目录契约、★模板相关性规则（落 plan.json）。
     references：pipeline-contracts.md（产物 schema 单一事实源）、legacy-backend.md（双轨）、
     topic-selection.md（选题临时指引）。
   - `video-script`：写稿流程 + 自检清单。references：tone-recipes.md（prompts.json 五配方）、
     script-rules.md（≤20字/幕数公式/结构四要素/标点停顿）、script-schema.md。
   - `video-production`：配音→组 props→预混→gen场景→preview→final→验收。
     references：engine-contract.md（timeline 常量/枚举/易错点）、gen-scene-contract.md、
     acceptance.md；assets/prompt-pack-template.md（from_scratch 简报 8 节模板）。
2. **CLI 工具层**（`backend/tools/`，包装 service 不复制逻辑，不依赖 FastAPI）：
   - `tts_gen.py`：script.json → 逐句 wav + 实测时长 JSON（整场合成+词边界切句+响度归一全复用 voice.py）
   - `premix_track.py`：camelCase props → mix_line_track/mix_motion_track 整轨预混 → 改写
     narrationAudio/清逐句 audio（snake↔camel 在工具内转换；时间轴数学仍在 voice.py 与 timeline.ts 两边同步）
   - `render_video.py`：npx remotion render/still 包装（--frames/--still/--comp），路径自动转绝对，
     stdout 输出 JSON + 失败时日志尾
3. **文档**：AGENTS.md（新增 skill 主路径节）、README.md（双轨说明）、本节。
   plan.json 契约写入 pipeline-contracts.md §6（template 判定落库格式）。

### 验证（mini 端到端，pid=skill-pilot，3 幕 6 句 60s 内科普）

- `tts_gen.py`：6 句全部合成成功（s01_0 2.706s ~ s03_1 2.621s），wav 落
  `public/voice/projects/skill-pilot/`
- `premix_track.py`：track.wav 26.39s（44.1k mono），与公式 25.39s+1s 缓冲吻合；
  schedule 落点 offset=2.9s、句间 0.85s 与 timeline 常量一致；props 改写正确
- `render_video.py --still 180`：纸感底 + 红色强调高亮 + 镜标签正常
- `render_video.py --frames 0-299`：preview.mp4 300 帧成功；抽帧确认片头逐字弹入、
  字幕与配音落点同步（2.9s/6.5s/8.6s）、counter 浮层动画正常
- 过程修复：argparse help 的 `%` 需转义；renderer 子进程 cwd=remotion-engine，
  工具入参必须先 resolve 为绝对路径（已在工具内固化）

### 后续（铺开阶段，待用户确认打样效果）

- 其余 4 个阶段 skill：video-topic / video-bgm / video-voiceover / video-style
  （对应 CLI：web_research / image_search / bgm_search / beat_analyze）
- gen 场景分支实战一次（video-production 的 SceneNN.tsx 现场编写路径）
- 发布阶段（抖音文案/封面）可作为第 7 个 skill

## 十七、2026-11-03 《A股这一年》成片交付（skill 流程首次全链路跑通）

### 成片

- `backend/storage/renders/ashare-2026/final.mp4`：61.44s，1080×1920@30，7 镜 15 句，
  封面 cover.jpg 同目录。项目产物 `backend/storage/projects/ashare-2026/`。
- 内容：上证指数近一年（2025-10-22~2026-11-03，251 个交易日真实日线，新浪财经）复盘。
  逐日跳动曲线 gen 场景（7 个，chart.tsx 共享组件：sweep/window/final 三模式 +
  事件光束/脉冲环 + 右上日期/点位/涨跌读数），开头钩子「昨天 A股大涨1.08%」+
  片头 kicker「从4243到3599」针对 5s 留存。

### 本次迭代要点

1. **数据更新到当日收盘**：11-03 实际收跌 -0.82%（3608.10），文案按合规红线
   保持「昨天大涨1.08%」事实表述，s07 新增「结果今天 又跌0.82%」，全年口径
   -7.8%（跌了近8%）；data.ts/N、Scene01/07 窗口、build_props WINDOWS 同步 251 点。
2. **sfx 分层**：plan 补 s04/s06 sfxMoment=riser（镜中 55% 蓄力）接入 BGM 最强两拍
   （见顶 1.1 / 反攻 1.2）；暴跌镜靠 whip/flash 转场自动 impact + counter 重锤。
3. **切镜卡点修复**：build_props 吸附逻辑改为「保底约束 → 吸附到拍 → 吸附后低于
   保底则取下一拍」，6/6 切镜 0 帧偏差落在 0.5s 拍网格；BGM 按新事件时刻
   （20.5/23.0/29.0/37.5/50.0s）重生成 33 小节（66.8s）。
4. **图表刻度防裁**：推镜 1.2 最大缩放左边界裁至 ~63px，chart.tsx X0 96→180，
   纵轴刻度 4100/3900/3700 全程完整可见。
5. 修复 build_props sfxMoment/atmosphere 未从 plan 透传的问题。

### 验证

- 引擎 `tsc --noEmit` 通过；still 抽帧 3 处 + preview 抽帧 3 处视觉验收通过
  （字幕无出框、刻度完整、读数清晰、红涨绿跌、emphasis 高亮正常）。
- 成片 ffprobe：61.44s（估算 61.41，±10% 内）；预混整轨生效
  （narrationAudio=track.wav，逐句 audio 清空）；人声/重音/riser 响度抽查在位。
- 卡点：6/6 切镜 ±0 帧；BGM 事件全部 snap 至拍网格；sfxMoment 2 次 ≤3。

## 十八、2026-11-03 《A股这一年》V2 迭代（BGM 激起化 + 动效全面升级）

### 用户反馈 → 改动

1. **BGM 不够激起** → 128 BPM（原 120）；事件从 5 个扩到 8 个（3·23 暴跌 hit +
   低点 subdrop、4·8 反弹、5·13 见顶 1.15、7·17 二次暴跌 + subdrop、10·30 新低
   subdrop 绝望下潜、11·2 反攻 1.3 全曲最强）；≥0.85 事件自动前置 2s riser 共 4 条；
   和弦进行 Dm,Bb,F,C → Dm,Bb,G,Am（小调上行张力）。实测响度梯度：反攻 -9.4dB <
   暴跌 -11.6 < 片头 -12.1 < subdrop -13（动态分层成立）。
2. **动画生硬** → chart.tsx 特效重写：曲线下面积渐变填充、MA20 均线（点状）、
   月份轴（竖格线+双月标签）、当前日辉光+逐日跳动脉冲环、事件爆发冲击波+8 向火花、
   暴跌/新低震屏（rand 确定性抖动）、扫动速度线拖尾、4243/3599 峰谷数值标注、
   window 模式缓出减速揭晓（ease-out 1.6）。
3. **运镜转场单一** → 7 镜 7 种运镜（diag_in/tilt_up/handheld/dolly_zoom/diag_out/
   tilt_down→pull，s06 用 cameraPerLine 句间切机位 tilt_down→push）；转场引入
   glitch（暴跌）/cut（见顶定格）/flash（二次暴跌）；grade 跟情绪（低谷 saturate
   0.85-0.9 + tint 0.22-0.28，反攻 1.2 + 0.05）；overlay 换 stat（3914→4163 状态条）
   + counter；sfxMoment 收敛为 s04 riser×1（BGM 已烘焙 riser，避免同刻双响）。

### 修复

- **128BPM 下切镜脱拍**：根因 offset 2.0 不在 0.46875s 拍网格上（120BPM 时恰好整数拍），
  局部吸附≠全局吸附。build_props 改为全局时间域吸附（offset 先上取整到拍、
  切镜在 offset+local 域吸附、吸附后低于保底取下一拍）→ 6/6 切镜 0 帧偏差。
- 峰谷标注右缘裁字（x 钳制到画布内）；build_props 补 cameraPerLine/sfxMoment 透传。

### 验证

- `tsc --noEmit` 通过；still 5 帧（sweep/crash/final/峰谷标注修复前后）视觉验收通过
- final.mp4 61.44s（est 61.75，±10% 内）；预混整轨生效；卡点 6/6 ±0 帧

## 十九、2026-11-04 三批改造落地 + 《A股这一年》V3 对标版

按 docs/vibe-upgrade-backlog.md 的优先级路线图，三批连续执行完毕：

### 第一批（留存杠杆）
- A1 `tools/gen_event_bgm.py`：主旋律动机层（Dm 五声 4 短句 A/A'+8度/B/A''收束，32 拍
  循环）+ 808 sub 长音层（根音低八度滑音）+ 母线 tanh 1.38/归一 0.90（BGM 文件 RMS
  0.567、sub 占比 74.6%、能量弧不塌）+ BPM 默认 110。
- A2/A3/A5 `src/gen/_lib/chrome.tsx`：EraStamp 年代戳 / ProgressDots 章节进度点 /
  CiteCard 书引卡 / RecapTree 终章复盘树 / SpeedFacts 速查卡 / ChatBubble 共鸣气泡 /
  Watermark 水印（gen 层组件，src/dv 未动）。
- B9 片头 66→48 帧：timeline.ts 单一事实源，TitleCard 重定时 + pipeline-contracts 同步。

### 第二批（产能）
- A4/A6/A7 `src/gen/_lib/infographics.tsx`：Dice3D/DuelBars/BellCurve/ParticleCloud/
  ConvergeLine/QuizCard。
- B1 `tools/build_props.py` 通用构建器：配置驱动（build_config.json）+ 全局拍域吸附 +
  事件同拍碰撞顺延 + cameraPerLine/sfx 透传 + props 写 sceneStarts；
  ashare-2026 专用脚本已删除迁移。
- B2 `tools/qa_report.py`：黑帧（暗色安全 pix_th=0.03）/静音/响度/落拍（读
  sceneStarts）/时长机检，strict 退出码。

### 视频改造（ashare-2026 V3 对标版）
- cinema+gold 暗调 look；7 章 EraStamp+进度点+水印；s01「一打开账户就绿…」共鸣气泡；
  s04 数据源引用卡；s05 跌幅速查卡；s07 终章复盘树（顶/底/今三卡+评论区 CTA）；
  标题改数字冲击「一年，跌了将近8%」；chart.tsx 底色亮度自适应（暗底暖白墨、
  红涨绿跌提亮）；BGM 110BPM 8 事件重生成（hit/sub 碰撞已顺延一拍）。
- 验收：qa_report **pass**（6/6 切镜 0 帧落拍偏差、黑帧 0、响度 -9.8dB 比 V2 +2.8dB）；
  成片 61.61s；`--comp CinemaVideo` 横屏版可渲。
- 修 bug：props beats 数组按秒误当条数截断（V1 起就有，只影响元数据）；
  CinemaVideo 居中 / render still composition 透传。

### 第三批（产品化）
- A9 CinemaVideo 横屏 comp 注册 + render_video `--comp CinemaVideo`。
- B6 `POST /api/hotspot/topics/{tid}/brief` 制作简报端点 + 选题工作台「📋 简报」按钮
  （复制 JSON → 发给 ZCode 走 video-producer 流程）。
- B7 `tools/publish_log.py` 发布登记（add/list/stats 回填，storage/publish_log.json）。
- B8 系列化约定写入 backlog 文档（标题公式/水印/复盘树/series 字段）。

### 验证
- 后端 pytest 276 passed；前端 tsc + build 通过；引擎 tsc 通过。
- 后端已重启（新端点生效）。经验清单与执行记录：docs/vibe-upgrade-backlog.md。

## 二十、2026-11-04 《AI 不用截图也能操作电脑》vibe 知识大赏科普

> 用户需求：基于 vercel-labs/agent-desktop 做一期抖音竖屏科普（vibe 知识大赏），
> 讲清应用场景 / 如何使用 / 注意事项，要抓留存、讲干货，并配活动向 BGM。

### 成片

| 项 | 值 |
|---|---|
| 项目 id | `agent-desktop-2026` |
| 标题 | AI 不用截图也能操作电脑 |
| 成片 | `backend/storage/renders/agent-desktop-2026/final.mp4`（约 66.7s / 2000 帧 / 20.5MB） |
| 预览 / 封面 | 同目录 `preview.mp4`、`cover.jpg` |
| 规格 | 1080×1920 @30fps，h264 + AAC 48k stereo |
| 结构 | 9 镜 / 23 句：钩子（截图派 vs 读骨架派）→ 它读什么（JSON+ref）→ 菜单比方 → 三个场景（报销/报表/回归测试）→ 三步上手 → 三个坑 → 收藏卡 |
| 判定 | `from_scratch`（与引擎内置领域场景无关；9 个现场编写 gen 场景，无模板意象、无 stars） |

### 内容事实源

`backend/storage/projects/agent-desktop-2026/research.json`（10 节点，GitHub API/README/官方文档）：
14,201 stars、Apache-2.0、macOS 13+/Win10 1809+/Ubuntu 24.04+、60 命令、ref 带快照 id、
headless 默认、16 种错误码且仅 `disposition.retry=safe` 可重试。

### 留存设计

- 前 3 秒反常识钩子（「你还在教 AI 截图找按钮吗？」）+ 右上角 9 点章节进度（ProgressDots）
- 中段 46 秒内密集给 3 个具体场景，每个场景一张「可截图保存」的信息卡
- 结尾「这一屏值得收藏」三栏复盘卡，直接服务收藏率
- 文案 23 句全部 ≤14 字，实测节奏 65.3s（估算），无长静音

### BGM

- 使用用户自备 `public/bgm/vibe_bgm.mp3`（112.3 BPM，抖音视频音轨提取 130s）。
- 官方活动曲库无法公开核验（活动页 JS/登录态，WebSearch 通道本次不可用），未编造曲名；
  发布页可直接换抖音站内「vibe知识大赏」活动音乐，切镜在 0.534s 拍网格上，100~125 BPM 均可卡住。
- QA：8/8 切镜落拍（±2 帧内），黑帧 0，>0.6s 静音 0，loudness mean -15.5dB，无削波（flat factor 0）。

### 工程记录（踩坑）

1. **预混常量与引擎不同步（历史遗留）**：`premix_track.py` 首次运行产出 77.9s 整轨，而引擎时间轴
   只有 68.5s —— 根因是 `voice.py` 的 `__pycache__` 陈旧（常量 B9 已改为 LEAD 0.45/TAIL 0.4/
   GAP 0.22/BONUS 0.12）。清 `__pycache__` 后重跑与引擎一致（66.3s）。
   **结论：改 voice.py/timeline.ts 常量后，先清 `backend/**/__pycache__` 再预混。**
2. `build_props.py` 已同步新常量并按标点给 `pauseAfter`（`？`→0.6 等），旧文档里的 0.9/0.6 已过期。
3. 用 PowerShell `Get-Content|Set-Content` 批量改中文 .tsx 会把 UTF-8 读成 GBK 并写坏文件——
   本次 5 个场景文件被写坏后整体重写。**中文源码只用 edit/write 工具改，不要走 PowerShell 文本管道。**
4. overlay `counter` 在 `Card`（absolute + margin auto）下贴左出框，数字被裁 —— 大数字改由 gen 场景自绘。
5. gen 场景 `p` 与镜长成比例（本片镜长 5.8~9.3s），动画阈值按 p 设计时要以「镜头内节奏」为准，
   并在前 20% 内完成入画，避免长镜前段空镜。

### 代码改动

- 新增 `remotion-engine/src/gen/agent-desktop-2026/{ui.tsx,Scene01..09}.tsx`，`registry.ts` 合并注册（保留旧项目）。
- 无引擎改动（`src/dv/*` 未动）；`tsc --noEmit` 通过。

### 衍生版本（同素材重剪，A/B 投放）

`backend/tools/make_agent_desktop_cuts.py` 从母版 script/plan/durations 剪出两个版本，
**复用原逐句 wav（复制 + 重新编号），不重跑 TTS**：

| 版本 | pid | 时长 | 结构 | QA |
|---|---|---|---|---|
| 快剪 | `agent-desktop-cut30` | 34.35s | 钩子+读骨架+老 OA+三坑+收藏（5 镜 11 句） | pass，4/4 落拍 |
| 切片 | `agent-desktop-slice18` | 22.04s | 钩子+三个坑+收藏（3 镜 6 句） | pass，2/2 落拍 |

产物：`backend/storage/renders/<pid>/{final.mp4,cover.jpg,props.json}`；
文案与投放策略见 `storage/projects/agent-desktop-2026/publish.md`「三版成片投放策略」。
## 2026-11-05/06 《油车，输了吗？》中国油车 vs 电车 近 6 年渗透率趋势（vibe 数据科普 · from_scratch）

> 用户需求：中国油车与电车近 5 年市场占有量趋势的 vibe 科普视频；**数据与素材必须真实**；发抖音；
> **不要深色 AI 味背景**；动效精美；口播/配音要能吸引留存。

### 成片
| 项 | 值 |
|---|---|
| 项目 id | `auto-market-trend` |
| 标题 | 油车，输了吗？中国车市 6 年大逆转 |
| 成片 | `backend/storage/renders/auto-market-trend/final.mp4`（70.72s / 2121 帧 / 38.99 MB / 1080×1920@30 / AAC 48k） |
| 附件 | `cover.jpg`、`preview.mp4`(12s)、`props.json`、`publish_copy.json`、`qa_report.json`、26 张 `qa_*.jpg` |
| 结构 | 12 镜：钩子(100 人里 6 个选电车) → 100 格剖分 6→68 → 6 年曲线 → 五个年度台阶 → 2024.07 单月首破 50%(51.1%) → 2025 全年 53.9% → 三大原因 → 销量条形(110.9→1280.9 万辆) → **反转：存量只有 13.19%** → 电车代价(保费 1.7 倍/260 万辆脱保/79% 私桩) → 油电共存 → 互动 CTA |
| 判定 | `from_scratch`（`storage/projects/auto-market-trend/plan.json`；与行星/宇宙模板域无关，画面全部自绘，无深色背景） |

### 数据（全部可溯源：`briefs/auto-trend-facts.md` 47 条来源 + `storage/projects/auto-market-trend/research.json`）
- 乘联分会（CPCA）新能源乘用车**国内零售**渗透率：2020 5.8% / 2021 14.8% / 2022 27.6% / 2023 35.7% / 2024 47.6% / 2025 53.94%（=1280.9/2374.4，计算值）/ 2026.10 67.8%
- 2024-07 单月首次过半 51.1%（87.8/172 可复核）；「50.8%」查无出处已禁用
- 存量（公安部交管局 2026-06）：汽车 3.71 亿辆、新能源 4897 万辆、13.19%（十台里约 1.32 台）
- 2026 1-10 月乘用车零售 1502.7 万辆（-22%）；购置税 2024-2025 免征、2026 起减半（gov.cn 公告 2023 年第 10 号）
- 口径纪律：零售 vs 批发 vs 中汽协总销量严禁混用，屏幕标注口径与来源

### 代码与资产
1. Remotion 组合 `remotion-life-sim/src/vibe-auto/`（`types.ts` 契约 / `fx.tsx` 明亮纸感设计系统 / `slides.tsx` 12 个自绘场景 / `AutoTrendVibe.tsx` / `data.ts`），`Root.tsx` 注册 `AutoTrendVibe`
2. 驱动 `backend/tools/run_auto_trend.py`：热读 `story.json` + `research.json` → edge-tts 逐镜实测 → BGM 169 拍点锁镜 → 旁白整轨预混 → props → 渲染 → QA；内置 caption 逐字比对/数字溯源表/数字审计三道自检
3. 数据取证工具 `backend/tools/probe_auto_data.py`（360 搜索 `data-mdurl` 真实 URL + 东方财富资讯搜索）、`backend/tools/fetch_auto_trend_data.py`（可重跑）、QA `backend/tools/qa_auto_trend.py`
4. 简报 `briefs/auto-oil-vs-ev-brief.md`；文案 `storage/projects/auto-market-trend/story.json`

### 验证
- `tools/qa_auto_trend.py` **PASS**：70.72s / 1080×1920 / 音轨有 / 逐镜 RMS 0.120~0.167 / 亮度 0.860~0.890（无深色页）/ 峰值 0.770 / 最长静音 0.133s
- Remotion `node run-tsc.js` 通过；渲染 rc=0（91s）
- 抽帧 QA：26 张（12 镜镜尾 + 中段）人工过目，无越界/重叠/乱码；数字与 research.json 逐项对齐
- BGM：复用系列曲 `vibe_we_never.mp3`（112.3BPM），口播自动闪避 0.62→0.33
- 已知小瑕疵：steps 大标题采用「出血式」左贴边（x≈5px），属设计风格非裁切；如后续要严格 76px 边距可单改该镜

### 环境备注
- 制作期间（23:49）仓库发生引擎迁移更新（新增 `remotion-engine/` 与 `.agents/skills/`，AGENTS.md 指向新引擎）；
  本条成片仍产出在既有 `remotion-life-sim` + `AutoTrendVibe` 组合（Root 已注册、渲染验证通过），
  后续新片应改走 `video-producer` skill + `remotion-engine` gen 场景路径。

## 2026-11-07 「视频流水线」栏目：每日凌晨驱动 DeepSeek Harness 自动出 3 条最热视频

> 用户需求：新增一个栏目——根据每日热点新闻，凌晨自动生成 3 条最热视频；执行体不是
> DeepSeek API，而是**驱动本地 DeepSeek Harness 桌面端（dsh）用 agent 能力做任务**。

### dsh 无头自动化调研结论（本机实测）
- 应用：`D:\Software\dsh-desktop\DeepSeek Harness.exe`（Electron 壳 44.7.0 + dsh runtime 0.2.1-rc.5，
  内置 Node 24.21 / Python 3.12.14），用户数据 `~/.dsh/`
- **官方无头入口**：`resources\runtime\cli\bin\dsh.cmd --profile headless --json -`（一次性任务模式，
  任务书走 stdin，stdout 输出 NDJSON 事件流 session→status/text/tool_call/tool_result→final，
  退出码 0=完成；`--session-id` 可续会话；出处：asar 内 `@deepseek-ai/dsh-headless` README）
- 凭据：headless profile 默认不读 GUI 已存凭据 → 建 `~/.dsh/profiles/headless/cordis.patch.yml`
  （恢复 credentials/authorization/deepseek-account 三行 + opencode-go 网关 + deepseek-v4.1-flash，
  照抄用户 11-05 的 acp profile patch）
- 探针验证通过：write/pwsh 工具真实可用（审批默认放行），NDJSON 事件流完整；偶发 429 过载重试即过

### 架构
后端只做「定时 → burst 选热点 → 派任务书 → 采集事件日志 → 验收成片 → 落记录」；
创作全权交给 dsh agent（会话内按 AGENTS.md + video-producer skill 家族六阶段走完，
确定性步骤调 backend/tools 的 tts_gen/premix_track/render_video；★模板相关性判定照规则执行）。

### 代码
| 文件 | 职责 |
|---|---|
| `backend/app/services/daily.py` | DailyPipelineService：守护线程调度（默认 03:30）· 选题去重（burst 前 40 → 排除平台/近 7 天已用）· `build_agent_prompt` 任务书 · dsh 会话 spawn（stdin+超时 taskkill 进程树+429 重试）· `verify_render` 验收 · runs/config/state 落 `storage/pipeline/` |
| `backend/app/routers/pipeline.py` | `/api/pipeline` status/config(PUT)/run(POST)/runs/runs/{id}/log（NDJSON→可读日志投影） |
| `backend/app/config.py` | `PIPELINE_DIR` + `DAILY_PIPELINE_*` / `DAILY_AGENT_*` 环境变量 |
| `backend/tools/run_daily_pipeline.py` | CLI：`--dry-run`（只选题+任务书）/ `--run-now`（schtasks 兜底）/ `--status` |
| `backend/tests/test_daily_pipeline.py` | 18 用例：调度时刻/去重/任务书/验收/批次隔离/互斥/5 路由（agent 会话全 fake） |
| `frontend/src/components/DailyPipeline.tsx` | 新栏目「🎬 视频流水线」：状态卡（下次运行/启停/配置/立即生成）· 批次历史（封面卡片+播放+项目详情+实时日志）· 运行中 5s 轮询 |
| `frontend/src/App.tsx` | ListTab 加 `pipeline`，顶栏红点（20s 轮询运行状态） |
| `~/.dsh/profiles/headless/cordis.patch.yml` | dsh headless 凭据恢复 + 模型 patch（工作区外，一次性） |

产物目录：`backend/storage/pipeline/{config.json,state.json,runs/,logs/}`；
成片/项目落标准契约位置 `storage/renders/hot-YYYYMMDD-N/`、`storage/projects/hot-YYYYMMDD-N/`。

### 验证
- `pytest tests/ -q`：**303+19 passed**（含自愈/心跳用例）；前端 `tsc --noEmit` + `npm run build` 通过
- dsh 探针：写文件 + pwsh 命令真实执行，exit 0
- **端到端实测（2026-11-07 批次 20261107-125154，CLI 独立进程跑通）**：
  - 选题「T1淘汰KC半决赛将战BLG」→ dsh 会话 62 分钟全流程自主完成：
    web_search 核实事实 → script.json（8 镜）→ TTS 逐句 wav → BGM → plan.json → props →
    preview.mp4 → QA 迭代重渲 → **final.mp4（9.4MB / 1498 帧 / 62.4s / 1080×1920@30）**
  - ★模板相关性判定落库：`plan.json.template.mode="from_scratch"`（理由与复用清单规范）
  - 交付验收 `verify_render` 通过，批次状态 done，标题「BLG的转折点，不是3比0」

### 实测发现与修复（重要经验）
1. **dsh 沙箱 ACL provisioning**：会话对 `remotion-engine/public/{bgm,voice}` 直接写入报
   `PermissionError [Errno 13]`（该链缺 WRITE_DAC，沙箱无法下发授权）。用 dsh 自带的
   `diagnose-windows-sandbox-acl` skill（脚本已复制到 `tmp/diagnose-windows-sandbox-acl.ps1`，
   报告/回滚在 `tmp/acl-recovery/`）在沙箱外修复并验证。agent 偶发受限时按任务书第 9 条纪律
   改走同机后端 API 执行确定性步骤（实测可行，产物仍落契约路径）。
2. **防呆条款必要**：首次实跑 agent 因 BGM 生成失败加载 dsh 自带诊断 skill 钻进沙箱排查兔子洞
   （探测 bitsadmin/junction/服务枚举），已人工 taskkill；任务书第 9/10 条（禁诊断沙箱 +
   BGM 失败即改曲库选曲）后未再发生。
3. **批次进程与后端生命周期解耦**：批次跑在 uvicorn 线程内时，launch.bat 端口清理重启后端会
   连带杀死 dsh 子进程；改为心跳（60s 重写运行记录）+ 空闲自愈（running 且心跳 >5min 过期才收敛），
   支持 CLI 独立进程跑批（`--run-now`，不占端口不受后端重启影响，schtasks 兜底推荐用此方式）。

### 备注
- 凌晨出片前提：后端进程与电脑保持运行（睡眠>2h 错过窗口则跳过本轮）；Windows 任务计划兜底命令见 CLI docstring
- 单条实测 62 分钟（含调研+QA 迭代+重渲），3 条串行预算 2~3 小时；90 分钟/条超时兜底；网关 429 自动重试 3 次
- ⚠ 批次运行中不要重启后端（launch.bat 端口清理会杀 dsh 子进程；已自愈为 failed 但该条作废）；
  兜底可改用 `python -X utf8 backend/tools/run_daily_pipeline.py --run-now`（独立进程，不受影响）

## 2026-11-07（下午）流水线 v2：主题定义 + 飞书候选确认 + 风格硬约束/亮度闸门

> 用户三点反馈：① 要能定义主题；② 制作前把 10 条候选推飞书，默认做前 3，允许点选做哪几条；
> ③ 调试片动效/背景没按账号要求来（数据准确/动效优美抓留存/竖屏抖音/不要深色 AI 味背景）。

### 方案（用户已确认：群机器人 webhook + 20 分钟窗口 + 主题优先命中）
- **两阶段流程**：`prepare_batch`（主题命中优先 + burst 选 10 条候选 → 落 `awaiting_confirm` 记录 →
  推飞书卡片（默认前 N ⭐标注 + 截止时间 + 跳转本页按钮）→ 起倒计时线程）→
  `confirm_batch`（API/前端勾选 1-based 序号 或 `use_default`；超时自动按默认开做）→ `_produce`。
- **主题**：`config.themes=[{name,keywords}]`（UI 可增删）；命中标题/标签/摘要的热点优先入选，
  主题名注入任务书 F 条（角度必须贴合方向）；前端配置面板可编辑。
- **风格硬约束**：任务书新增【风格硬性要求】A~F 块（数据可溯源宁缺毋滥 / 浅色明亮背景禁深色 AI 味 /
  动效层次+3 秒钩子+结尾互动 CTA / 1080×1920 抖音安全区 / preview 后亮度自检 / qa_report 自检），
  另加可配置的 `style_prompt` 追加段（UI 可编辑）。
- **亮度闸门**：`verify_render` 用 ffmpeg 抽 2 帧 + PIL 灰度均值，双双低于 `min_brightness`
  （默认 0.45）判失败——深色成片会被硬拦下。
- **并发修复**：`_save_run` 心跳/生产双线程写同一记录 → tmp 带线程 id + `os.replace` 退避重试
  （Windows 并发 replace 互斥实测会 WinError 5）。
- CLI：`--run-now`（完整两阶段，前台等待）/ `--immediate`（跳过窗口直接按默认，schtasks 推荐）。

### 新 API
`POST /api/pipeline/runs/{id}/confirm` `{indices:[1-based] | use_default:true}`；
`status` 增 `awaiting_run_id`；config 增 `confirm_minutes/feishu_webhook/page_url/themes/style_prompt/min_brightness`。

### 验证
- `pytest tests/ -q`：**323 passed**（新增主题优先/两阶段确认/飞书卡片/亮度闸门/过期 awaiting 自愈等 26 项）
- 前端 `tsc --noEmit` + build 通过；候选勾选器（默认勾前 N）+ 倒计时 + 主题/webhook/风格配置面板

## 2026-11-08 凌晨 流程重排 v3：中午推送 → 确认排产 → 凌晨制作

> 用户需求：① 每天 12:00 推送一次当日热点候选（按关注方向挑 10 条）；② 确认了才做、
> 确认后排产到凌晨自动制作（或手动立即制作）；当晚 24:00 未确认则默认不做。

- **调度改为分钟级 tick**：`_tick` 每分钟检查三个事件——推送（`push_hour/minute` 默认 12:00，
  `state.last_push_date` 防重一天一次）/ 制作（`produce_hour/minute` 默认 03:30，把所有
  `scheduled` 批次逐个生产）/ 过期收敛（昨天及更早仍 awaiting → skipped）。
- **新增排产态**：`confirm_batch(schedule=True)` → `status=scheduled` + `produce_at`（下一次
  制作时刻）；`POST /runs/{id}/produce`（`produce_now`）跳过等待立即制作；待确认卡片双按钮
  「✓ 确认并排产」「▶ 立即制作」。已排产批次在列表里带「将于 MM-DD HH:MM 制作」+ 立即制作按钮。
- **配置语义更新**：`push_hour/minute`、`produce_hour/minute`（旧 `hour/minute` 自动迁移为
  制作时间）；`confirm_minutes/auto_confirm` 废弃不再使用。
- 候选质量：方向搜索补齐（`theme_search_fill`）默认关（Bing 泛查询返回百科/官网，实测质量差），
  方向内容以热点池命中为主；搜索结果加站点首页黑名单过滤。
- 修复：`_extract_frame` 对损坏 mp4 会留下 ffmpeg 僵尸进程（subprocess 超时只杀 cmd.exe），
  现仅接受快速失败路径 + 测试用伪产物不触 ffmpeg；`_save_run` 并发写退避重试保留。
- 测试：27 用例（排产流/推送防重/tick 生产/过期收敛/亮度闸门/深链卡片/签名），全量 324 passed。
- 用户已在页面配置 5 个方向（金融/科技/汽车/互联网/硬件），定时已重新启用。

## 2026-11-08 远程访问：SSH 反向隧道把流水线暴露到公网服务器

> 用户有可 SSH 的公网服务器，需要外地/手机查看流水线。生产链路（dsh agent/TTS/渲染）必须留在
> 本地，因此采用「本地跑全套 + 服务器只做公网入口」的架构。

- `frontend/vite.config.ts` 增加 `preview` 配置（dist 生产构建 + /api 代理，同 dev）。
- 新增 `backend/tools/remote_tunnel.py`：
  `python -X utf8 tools/remote_tunnel.py --server user@服务器IP --remote-port 8090`
  流程 = npm build → 起 vite preview（:5173，已有服务则复用）→ `ssh -N -R 0.0.0.0:8090:127.0.0.1:5173`
  （ServerAlive 保活 + 5s 断线重连，Ctrl+C 退出）。
- 远程地址 `http://<服务器IP>:8090/?tab=pipeline`；飞书卡片链接（page_url）改成服务器地址即可全域可达。
- 服务器侧注意：sshd 需允许外网绑定（`GatewayPorts clientspecified`）或用 nginx 反代
  127.0.0.1:8090 并加 Basic Auth；页面可触发渲染/删除，公网裸奔有风险。
- 本地链路已实测（preview 200 + /api 代理 + 隧道命令生成/重连循环）；隧道本身待用户以真实服务器验证。

## 2026-11-08 完全自动化的四块拼图：事实硬闸门 / 视觉建议级验收 / 常驻看护 / 数据回流

> 用户目标「完全自动化产出 AI 知识大赏视频」的四项缺口一次补齐（发布调度已有发布中心，暂缓）。
> 决策：视觉验收=建议级提醒（不卡交付、控 token）；事实审计=硬闸门+最多 3 次返修；
> 常驻=launch.bat 三窗口（后端/前端/watchdog）用户自主启动。

- **事实审计硬闸门（新）**：`backend/tools/facts_audit.py`（确定性、零 LLM）——script.json 数字断言
  （数值+单位，跳过「5 秒/20 字/1080px」类制作参数与 5G 型号）↔ research.json 节点+来源匹配，
  放宽链：原文子串 → 裸数值（≥2位）→ 万/亿换算数值等值。daily 闸门 `verify_facts` **按最终
  script+research 重算**（不信任落盘快照，伪造无效），unverifiable>0 派返修会话（带失败明细的
  「返修任务书」），最多 `DAILY_FACTS_RETRIES=3` 次，耗尽 failed+飞书告警；非 facts 失败不重试。
- **视觉验收建议级（新）**：`backend/tools/acceptance_frames.py` 有界抽帧——按 shot_timeline
  （重构出 `build()` 供复用，CLI 输出不变）确定性选 ≤6 帧（片头中点+每镜中点+末帧，540×960 JPEG），
  前 2 张镜内帧带抖音裁切模拟版（802×1920→402×960）。任务书第 12 条要求 agent 会话内 Read 一次
  批量判定（一轮+一次复检硬上限），落 `renders/<pid>/acceptance.json`。`collect_advisory` 汇总
  qa_report 机检 + 视觉自查进 run JSON（`video.qa/acceptance`）与飞书结果卡，**不拦截交付**。
  token 成本 ≈3-8k/条（<整会话 2%）：机检免费挡废片、抽帧有硬上限、判定在已有会话内顺带做。
- **任务书更新（build_agent_prompt）**：交付标准加 research.json/facts_audit/acceptance.json；
  新增第 11 条（事实审计自检循环）与第 12 条（有界视觉自查）；支持 repair 返修块。
- **常驻可靠性**：新增根目录 `watchdog.bat`（60s 探活 /api/health，挂了清 8000 并按同款命令拉起，
  日志 backend/storage/logs/watchdog.log）；`launch.bat` 升三窗口并附可选 schtasks/唤醒注册注释。
  飞书通知补全：制作结果卡（✅/❌+时长+facts 轮次+视觉建议摘要，`DAILY_NOTIFY_RESULTS` 可关）、
  生产异常告警、中断批次自愈告警；统一推送入口 `_post_feishu`。顺手接活死配置
  `DAILY_PIPELINE_HOUR/MINUTE`（→produce 默认）与 `CONFIRM_MINUTES`（→status 展示）。
- **发布数据回流（搭在发布中心上）**：发布成功自动登记台账 `publish_stats.register_published`
  （task_id 去重）；`creator_douyin.collect_stats` 用创作者中心会话抓「内容管理」页表现数据
  （播放/点赞/收藏/评论/分享，万/w 换算，选择器集中+失败截图）；`publish_scheduler` 每日自动回填
  （`PUBLISH_STATS_SYNC` 开关，浏览器与上传互斥）+ `POST /api/publish/stats/sync` 手动触发 +
  `tools/publish_log.py sync` CLI；台账条目加 `task_id`/`plays/shares`，同条目一天一条。
  未扫码登录时同步跳过（不阻塞）。
- **qa_report/acceptance_frames ffmpeg 兜底**：PATH → Remotion 自带 `FFMPEG_BIN`（含 .exe 探测），
  任何环境都能机检；shot_timeline 重构暴露 `build()`（输出逐字节不变）。
- 冒烟实测：facts_audit 在 coldest-space-2026 抓出 4 个数字（3 verified / 1 unverifiable「2800亿」，
  正是闸门要拦的）；acceptance_frames 出 6+2 帧可判读；qa_report 7/7 落拍 pass；
  dry-run 任务书含第 11/12 条；后端重启后 /api/pipeline/status 返回 facts_retries=3、
  /api/publish/stats/sync 与 douyin/status 正常。测试：test_facts_audit.py 6 用例 +
  test_daily_pipeline.py 扩至 38（facts 重试环/返修任务书/视觉不拦截/结果卡），全量 360 passed。
- 契约同步：pipeline-contracts.md 新增 §8（research/facts_audit/acceptance/publish_log schema），
  §7 交付基线写明「事实=硬闸门、视觉=建议级」；video-production SKILL 第 6 步与 acceptance.md
  加工具闸门节；video-producer SKILL 六阶段表 stage-6 产物更新。
