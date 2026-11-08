# MoneyPrinterTurbo 事实卡（2026-11-05 快照）

> 口播/字幕逐句可核。所有数字来自 GitHub 仓库 README、GitHub API、最新 release。
> 仓库：<https://github.com/harry0703/MoneyPrinterTurbo>

## 1. 项目定位

- 一句话：给一个**视频主题或关键词**，自动生成脚本、匹配素材、生成配音与字幕、配 BGM，输出高清短视频。[README-en L7]
- 不是数字人，也不是纯 AI 视频生成器：默认画面来自**免费素材库匹配**（Pexels / Pixabay / Coverr），也支持上传本地图片/视频，或接第三方 AI 视频服务。[README-en L202-L210]
- 入口：AI Agent、WebUI、API、CLI 四种工作流。[README-en L188]
- 许可证：MIT。语言：Python。要求 Python 3.11+。[README-en L265, LICENSE]
- 最新 release：**v1.3.9**，发布于 2026-10-21。[GitHub release API]
- GitHub：**139,056 stars / 22,187 forks**（2026-11-05 抓取 GitHub API；片中口播用「十三万九千星」）。

## 2. 流水线（README 明示）

主题/关键词 → 脚本 → 配音 → 素材匹配 → 字幕 → BGM → 剪辑合成 → 导出。[README-en L7, L189]

## 3. 脚本 / 模型

- 支持 Kimi / Moonshot、OpenAI、Anthropic Claude、Google Gemini、DeepSeek、阿里 Qwen、Azure OpenAI、火山引擎 Ark、xAI Grok、MiniMax、小米 MiMo 等。[README-en L197]
- 支持 OpenRouter、Ollama、OneAPI、LiteLLM、Groq 等兼容网关或本地运行时；也可以直接给完整自定义脚本。[README-en L198, L196]

## 4. 配音 / 字幕

- **Edge TTS 免费、无需 API key**（WebUI 里的 Azure TTS V1 就是 Edge TTS）。[README-en L534]
- 还支持 Azure TTS V2、SiliconFlow、Google Gemini、MiniMax、ElevenLabs、Chatterbox、Kokoro、Fish Audio 等。[README-en L215, L534]
- 字幕两种模式：`edge`（用 TTS 时间戳，默认，快、无需 GPU）；`whisper`（本地 faster-whisper，更准，首次下载约 3GB large-v3 模型）。[README-en L542-L549]

## 5. 画面素材

- 免费图库：Pexels、Pixabay、Coverr。[README-en L202]
- 也可上传本地图片/视频，或接 Metaso MiniMax H3、火山 Seedance、WaveSpeed、OFox、MuAPI 等 AI 视频/图片服务。[README-en L203-L210]
- 可调片段时长、画面适配、素材顺序。[README-en L210]

## 6. 输出 / 发布

- 竖屏 9:16（1080×1920）、横屏 16:9（1920×1080）、方形 1:1（1080×1080）。[README-en L221]
- 支持批量生成多个版本、任务历史、导入/导出生成设置与 API key。[README-en L190]
- 可直接发布到 TikTok、Instagram、YouTube Shorts（README 功能列表）。[README-en L222]

## 7. 运行方式

- Windows 一键包：Releases 下载 `.7z`，先 `update.bat` 再 `start.bat`。[README-en L302-L315]
- pip：`python -m pip install mpt` → `mpt webui`。[README-en L349-L351]
- Docker：`docker compose -f docker-compose.release.yml up`，WebUI `http://127.0.0.1:8501`，API 文档 `http://127.0.0.1:8080/docs`。[README-en L399-L412]
- 纯 CLI：`uv run python cli.py --video-subject "..."`。[README-en L489]

## 8. 系统要求

- Windows 10+ / macOS 11+ / 主流 Linux；Python 3.11+（推荐 3.11）。
- **不强制 GPU**；最低 4 核 / 4GB RAM，推荐 6–8 核 / 8GB RAM；GPU 主要加速本地 whisper、批量处理。[README-en L262-L275]
- Windows 项目路径避免中文、特殊字符和空格。[README-en L375]

## 9. 必须提醒的坑（基于 README 能力边界，不编造）

1. **素材版权**：默认从免费图库匹配，但「免费」不等于「随便商用」；不同图库/作者授权不同，发布前要看清楚。上传本地素材同理。
2. **平台查重/同质化**：同一主题 + 同一素材库，很容易撞画面；批量矩阵号尤其明显。
3. **API 成本**：Edge TTS 免费，但 LLM 脚本、部分 TTS、AI 视频素材都要钱；免费方案可以用 Ollama + Edge TTS + Pexels/Pixabay。
4. **一键 ≠ 爆款**：工具只解决「做出来」，脚本质量、前 3 秒、选题和留存仍然靠人。
5. **本地环境**：Windows 路径不要带中文/空格；whisper 首次下载模型较大；ffmpeg 可能需要手动指定。[README-en L375, L584-L645]

## 10. 片中不使用/不宣称

- 不宣称「完全免费」：LLM/部分 TTS/AI 素材可能收费。
- 不宣称「自动涨粉/自动变现」：README 没有这种承诺。
- 不宣称「AI 生成画面」：默认是素材库匹配。
- BGM 使用 `vibe_we_never.mp3`，仅本机剪辑；站内发布遵循抖音音乐授权范围，站外/商用需自行确认版权。
