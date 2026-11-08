# 《Vibe 知识大赏 · agent-desktop 工具科普》竖屏视频制作简报（from_scratch 提示词包）

> 用途：抖音竖屏 1080×1920 · 约 64 秒 · 快节奏「Vibe 知识大赏」科普界面。
> 本文是 AGENTS.md 要求的**模板相关性判定 + 从零制作提示词包**：画面/动效全部由本片自定义实现，
> 不注入模板库（`DataVideo` / `src/dv/*`）的行星/宇宙类场景与星空氛围。
> 叙事结构（v2，按用户反馈重排）：**钩子问题 → 今天的主角 → 旧 agent 痛点 → 它的优点 → 应用场景 → 怎么用（装/实操/接 MCP）→ 注意事项 → 链接在评论区**。
> 实施入口：`backend/tools/run_agent_desktop_vibe.py` → Remotion composition `AgentDesktopVibe`
> （`D:\Work\remotion-life-sim\src\vibe-agent\`）。

---

## 1. 模板相关性判定（必填）

| 项 | 结论 |
|---|---|
| 判定模式 | **`from_scratch`（从零开始）** |
| 原因 | 题材是「开源桌面自动化工具」科普，与模板库的**行星/宇宙/地球演化 / 天体碰撞**场景域完全无关 |
| 复用清单 | 仅复用**基础设施**：Remotion 宿主工程、`Root.tsx` 注册方式（与 `llm-leaderboard` / `gold-race` / `vibe-show` 同级新增独立 composition）、后端 `voice.py` 配音与 `beat.py` 拍点分析、无版权 `sfx/` 基建 |
| 禁止项 | ❌ 不注入任何 `dv/*` 场景；❌ 不用 `atmosphere=stars` 星空；❌ 不复用旧占位图；❌ 不用紫色渐变 / 荧光青霓虹 |
| 落库 | 本简报 + `backend/storage/_agent-desktop-vibe_script.json` + `renders/agent-desktop-vibe/props.json` |

## 2. 项目概览

| 项 | 值 |
|---|---|
| 项目 id | `agent-desktop-vibe` |
| 标题 | AI 开始替你上班了？agent-desktop 怎么用、坑在哪 |
| 画幅/帧率 | 1080×1920 竖屏 @30fps，H.264 + AAC 48k |
| 成片时长 | 1913 帧 = **63.77s**（以实测配音时长为准，每个切点锁 BGM 拍点） |
| 结构 | 13 镜：钩子问题 → 今天的主角 → 旧 agent 痛点 → 优点（不截图 / 有编号）→ 应用场景 → 怎么用（一键安装 / 看·点·验证实操 / 接 MCP）→ 3 条注意事项 → 快速尝试 + 评论区 |
| 受众 | 完全不懂技术的抖音用户（≤20 字/句口播，字幕与口播同文） |
| BGM | 抖音「vibe 知识大赏」同款《We Never (Remix)》0.9x（Claude 开智小曲），口播时自动闪避；来源/授权说明见 `backend/storage/_vibe_bgm_meta.json` |
| 视觉语言 | 近黑舞台 `#07080B` + 米白墨色 `#F4F1EA` + 每镜主色（金 `#F5B942` / 珊瑚 `#FF6B57` / 薄荷 `#3DDC97` / 天蓝 `#5AB0FF`）；品牌角标「VIBE 知识大赏」+ 分段进度条 + 页计数器 + 时间码；逐字弹入标题、假 App 窗口、终端卡片、无障碍树可视化、AI 光标 |

## 3. 事实来源（口播/字幕逐句可核）

事实卡：`briefs/agent-desktop-facts.md`（16 个官方来源，2026-11-04 快照）。

- 定位：给 AI agent 的桌面 computer use 工具；读 OS 无障碍树返回 JSON + 每个元素的 ref；**不截图、不比像素**；**内部没有模型**，observe→act→verify 循环由调用方实现；CLI + C 库。来源：<https://raw.githubusercontent.com/vercel-labs/agent-desktop/main/README.md>、<https://agent-browser.dev/desktop>
- 数字：GitHub 13,249★ / 912 fork / Apache-2.0 / Rust / 2026-02-19 创建（GitHub API 2026-11-04 快照；片中口播用「一万三千多星」）。来源：<https://api.github.com/repos/vercel-labs/agent-desktop>
- 安装：`npm install -g agent-desktop`；`agent-desktop status`；`agent-desktop permissions --guide`（macOS 辅助功能授权）。来源：README、<https://agent-browser.dev/desktop/installation>
- 平台：macOS 13+（AX API）/ Windows 10 1809+（UI Automation）/ Ubuntu 24.04+（AT-SPI）。来源：README、platforms 三页
- 操作：`snapshot --app Finder -i` → ref 形如 `@s8f3k2p9:e8`（必须带快照 id）→ `click` / `type` → 再 `snapshot` 验证；默认 headless，`--headed` 才物理输入；`STALE_REF` / `AMBIGUOUS_TARGET` 要重新快照；只有 `disposition.retry == "safe"` 才可重试。来源：README、<https://agent-browser.dev/desktop/errors-and-recovery>
- MCP：`agent-desktop mcp` 以 stdio 暴露全部命令（`desktop_snapshot` / `desktop_click` / …）；60 个命令名 / **56 个可操作命令**；4 个按住类命令在守护进程能释放按键前拒绝执行。来源：README「MCP」「Commands」
- 隐私：快照、剪贴板读取、截图、命令输出都可能含私人桌面内容，别进公开日志与上传。来源：README「Snapshots, clipboard reads, screenshots…」、SECURITY.md

## 4. 逐镜脚本（口播 = 字幕，实测时长）

> 切点：0.00 / 5.03 / 9.30 / 13.57 / 17.83 / 23.20 / 29.07 / 33.87 / 39.20 / 44.53 / 49.37 / 54.17 / 59.50 → 63.77s（13 个切点全部锁在实测 BGM 拍点上）

| # | id | 时长 | 屏显标题 | 口播/字幕（重音） | 画面与动效意图 |
|---|---|---|---|---|---|
| 01 | cover | 5.03s | AI 开始 / **替你上班了？** | AI 不只会聊天，它开始**动手帮你上班**——你信吗？ | 金色氛围光 + 漂浮字符；问句标题逐字砸入；副题「AI 不只会聊天 · 还会动手」；标签行 13.2k★；AI 光标在右下点击两次（钩子留人） |
| 02 | hero | 4.27s | 今天的主角 / **agent-desktop** | 今天的主角，是开源工具 **agent-desktop**。 | 仓库卡弹出：vercel-labs / agent-desktop、Computer use CLI、不是模型、0→13.2k 星计数、Apache-2.0 / Rust / 60 命令 / 2026-02 开源 |
| 03 | pain | 4.27s | 截图猜坐标 / **又慢又容易错** | 以前的电脑 agent，全靠**截图**、**猜坐标**。 | 假屏幕像素块 + 扫描线；`guess:(x,y)` 坐标漂移、虚线靶框落错位置、红色「✗ 点错了」盖章；光标点空 |
| 04 | answer | 4.27s | 不截图 / **直接读界面** | 它**不截图**，**直接读**系统的无障碍树。 | 上下对比卡：截图/像素（✗ 慢贵会点错） vs 无障碍树/JSON（✓ 快准省 token）；接缝薄荷闪色 |
| 05 | principle | 5.37s | 每个按钮 / **都有编号** | **每个按钮**都有**编号**，AI 照着编号点，点错会**报错**。 | 无障碍树：window → button/treeitem/textfield，每行带 `@s8f3k2p9:e8` ref；「新建文件夹」常亮 + 脉冲；终端 `click '@s8f3k2p9:e8' ✓ clicked`；副标「点错会报错，不会乱点」 |
| 06 | scenarios | 5.87s | 它最适合 / **干这些活** | **重复填表**、**跨软件搬数据**、**软件测试**，都是它的主场。 | 2×2 场景卡错帧弹入：📋 批量填表 / 🧪 QA 回归 / 🔁 跨 App 搬数据 / 🗄 老软件自动化 |
| 07 | install | 4.80s | 一行命令 / **装好开跑** | 用起来也简单：**一行命令**装好，再开**权限**。 | 终端打字机：`npm i -g agent-desktop` → `status` → `permissions --guide`；三行进度灯；副标「macOS 辅助功能权限」 |
| 08 | firstrun | 5.33s | 看 · 点 · 验证 | 先让它**看一眼**界面，再**点按钮**，再看一眼**验证**。 | 终端实操：`snapshot --app Finder -i`（59 refs）→ `click '@s8f3k2p9:e8'` → 再 `snapshot` 验证；底部三端支持 chips（macOS 13+ / Windows 10 1809+ / Linux 24.04+） |
| 09 | mcp | 5.33s | 接上 MCP / **AI 长出鼠标** | 接上 **MCP**，你的 AI 助手立刻长出**鼠标键盘**。 | 终端 JSON：`agent-desktop mcp` + mcpServers 配置 + `desktop_snapshot` 打勾；三枚客户端标签（Claude Code / Cursor / 任意 MCP） |
| 10 | caution1 | 4.83s | 权限给最小 / **只放行要用的 App** | 但第一，**权限**给到**最小**，只放行要用的那个 App。 | 系统权限面板：辅助功能 ON、屏幕录制 OFF、输入监控 OFF；黄色警示条；副标「权限就是它的边界」 |
| 11 | caution2 | 4.80s | 快照里 / **是你的桌面** | 第二，**快照**里有你的桌面，别传进**公开日志**。 | 隐私 JSON 卡（合同/剪贴板/截图字段飘红）+ 斜盖「别上传」大章；副标「调试日志和录屏发出去之前」 |
| 12 | caution3 | 5.33s | 危险操作 / **必须人工确认** | 第三，删文件、付款、发消息，**必须人工确认**。 | 三行危险操作卡（删 / 付 / 发 字标）逐行砸入，每行右侧「人工确认」徽章；底部三枚规则 chips；接缝珊瑚闪 |
| 13 | outro | 4.27s | 现在就能试 / **链接在评论区** | 现在就能试，链接我已经放在**评论区**了。 | 金色收尾；仓库地址 mono 行；「现在就去试 · 打开就能跑」胶囊按钮呼吸；底部「先收藏，回头让 AI 替你干重复活」；片尾闪金 |

## 5. 动效语法（实现约束）

- 一切由 `useCurrentFrame()` 驱动，无 `Math.random()` / `Date` / CSS animation；伪随机用固定 sin 哈希。
- 入场：`zoom / bounce / slideUp / slideLeft / slideRight / whip / flip / pop`；出场：`up / down / left / right / zoomOut`；运镜：`pushIn / pushSlow / pullOut / panLeft / panRight / rock / whipR`。
- 标题逐字 spring 弹入（stagger 1.8 帧），第二行用主题色 + 光晕；副标 mono 行延迟上浮。
- 底部口播字幕：左侧 6px 主题色竖条 + 深色玻璃底，重音词主题色加粗发光；字号随句长自适应（31/34/37/40px）。
- 页与页之间硬切/甩镜/变焦，接缝可闪下一页主题色（≤0.2s、opacity ≤0.5）；页尾整体暗角 + 胶片颗粒 0.045。
- 固定 UI：左上「◆ VIBE 知识大赏 // TOOL LAB」、右上页计数、底部分段进度条（13 段）、左下标画幅、右下时间码；底部 250px 为抖音 UI 安全区，不放内容。

## 6. 音频规则

1. 配音：edge-tts `zh-CN-YunjianNeural`，rate `+12%`，逐镜单句，首尾静音裁剪 + loudnorm（`voice.py` 既有流水线）。
2. 旁白整轨预混成一条 `voice/projects/agent-desktop-vibe/narration.wav`，根级播放（规避嵌套 Sequence 音频碎片 bug），峰值归一 0.92。
3. BGM：`bgm/vibe_we_never.mp3`（44.1k / -18 LUFS / 90.04s），根级播放；口播窗口音量 0.33，空隙 0.60~0.62，片头 0.6s 淡入、片尾 1.5s 淡出。
4. 切镜锁拍：每镜结束时间取「旁白结束 +0.30s 之后、目标 +0.60s 之内」离目标最近的实测拍点，
   13 个切点全部踩在 BGM 拍点上（帧取整误差 ≤1 帧）。

## 7. 验收标准

- [x] 1080×1920@30，H.264 + AAC 48k，时长 63.77s（目标 60~70s）
- [x] 开头 5 秒抛出问题钩子（AI 替你上班？），第二镜（5.0s 起）立即报出主角 agent-desktop
- [x] 叙事顺序：痛点 → 优点 → 应用场景 → 怎么用 → 注意事项 → 评论区引导
- [x] 每镜口播/字幕/画面同源；字幕无出框，底部安全区 ≥250px
- [x] 13 个切点全部锁在 BGM 拍点（帧取整误差 ≤1 帧；视频起点 0 除外）
- [x] 无任何行星/宇宙模板场景、无星空、无紫蓝渐变
- [x] 事实句与 `briefs/agent-desktop-facts.md` 一一对应，不出现未核实数字
- [x] 封面 `cover.jpg` + QA 抽帧人工过目

## 8. 复现命令

```bash
cd D:\Work\video-workflow\backend
python -I tools/fetch_vibe_bgm.py            # 1) 取 BGM（已产出则跳过）
python -I tools/run_agent_desktop_vibe.py    # 2) 配音 → 时间轴 → props → 渲染 → 封面/QA
python -I tools/run_agent_desktop_vibe.py --reuse-voice --preview   # 只渲前 10 秒
```

产物：`backend/storage/renders/agent-desktop-vibe/final.mp4`（+ `props.json`、`cover.jpg`、`qa_*.jpg`、`publish_copy.json`）。
