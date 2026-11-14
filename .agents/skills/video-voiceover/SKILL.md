---
name: video-voiceover
description: 短视频配音。用户要配音、TTS、换音色、调语速、自带配音处理，或文案完成后要生成逐句音频时使用。产出 public/voice/projects/<pid>/ 逐句 wav + 实测时长。
---

# video-voiceover：配音

配音三选一（与用户确认，默认 tts）：`tts`（edge-tts 逐句合成）/ `custom`（自带音频）/ `none`（纯字幕+音乐）。

## 流程

### tts 模式

```bash
cd backend && python tools/tts_gen.py --pid <pid> --script storage/projects/<pid>/script.json \
  [--voice zh-CN-YunjianNeural] [--rate "+6%"]
```

- 音色候选（试听靠后端 `GET /api/voice/samples` 或直接合成后听）：`zh-CN-YunjianNeural`（男·沉稳磁性，默认）、`zh-CN-YunyangNeural`（男·新闻）、`zh-CN-XiaoxiaoNeural`（女·活泼）、`zh-CN-XiaoyiNeural`（女·温柔）。语速默认 `+6%`（短视频节奏），healing 语气可 `+0%`。
- 输出 stdout JSON 的 `durations`（`{line_id: 秒}`）是**下游 props 的权威时长**，直接采用。
- 工具内部已完成（voice.py）：同场整段合成+词边界切句（保留语调上下文，失败回退逐句）→ 裁静音（头留 30ms/尾留 120ms）→ 轻压缩 + highpass 75Hz + loudnorm **-13 LUFS**（Remotion 精简版 ffmpeg 缺滤子时三级降级，保证必有真 wav）。

### custom 模式

音频放 `public/voice/projects/<pid>/`：整段口播 1 个（按各幕字数占比分摊每句 durationSec）或分幕 `shot_NN.*`（幕内按句长占比分摊）。MP3 会被自动转 wav。

### none 模式

不生成音频；`durationSec = max(1.4, 0.35 + 字数/3.6)`（屏显阅读速度），props 不写 audio 字段。

## 语调工艺（写稿与选参时考虑）

- 问句 +2Hz、感叹句 +1Hz（工具按句尾标点自动处理）——文案的标点就是配音的表情。
- 同一句内语调连贯（整场合成的价值）；不要手动拆句合成。
- 实测时长与 4.5 字/秒估算偏差大时（>±25%），回头检查文案是否太长/太短。

## 完成后

durations 交给 `video-production` 组 props；若全片节奏太慢/太快，优先调 `--rate`（±2% 一档）重跑，而不是改文案。
