# 配音工程细节（voice.py 蒸馏）

> 权威实现：`backend/app/services/voice.py`。本文件是方法论留档，调参/排障时读。

## 合成链

1. **同场整段合成**：一幕的台词拼成一段（未收句补逗号连读），一次 TTS；用 WordBoundary 事件按台词字数切回逐句文件（切句向前多留 50ms 防吃辅音）。价值：句间语调带上下文，不机械。失败自动回退逐句。
2. **裁剪**：edge-tts 每句自带 ~0.2s 头 / ~0.9s 尾静音 → 按能量找首尾人声，头留 30ms、尾留 120ms。
3. **响度**：RMS 目标 0.105 增益（峰值限 0.9）+ highpass 75Hz + acompressor(-20dB:2.5) + loudnorm **I=-13 / TP=-1.0 / LRA=11**（短视频人声偏响）。滤镜三级降级：全量 → 无压缩 → 仅裁剪+音量，保证 Remotion 精简 ffmpeg 下必有真 wav。
4. **重试**：TTS_TIMEOUT 90s × 重试 3 次 × 退避 1.5s×n；失败清理 0 字节残留。

## 环境变量（backend/.env）

`TTS_VOICE`（默认 zh-CN-YunxiNeural）、`TTS_RATE`（+6%）、`TTS_RETRIES`、`TTS_TIMEOUT_SECONDS`、`TTS_RETRY_DELAY`。

## 整轨预混（渲染前置，为什么必须有）

实测 Remotion 合成器把嵌套 `<Sequence><Audio/>` 切成 ~1.5s 碎片且段间掉声；根级整段 Audio 始终完好。因此渲染前把逐句 wav 按渲染时间轴混成单轨 `track.wav`（DataVideo）/ `motion_track.wav`（MotionShow），经 `narrationAudio` 播放并清空逐句 audio。混音失败自动回退逐句路径（宁可错位不可没声）。

**时间轴常量两处同步**：`voice.py _TRACK_*/_MOTION_*` ⇄ `remotion-engine/src/dv/timeline.ts`。改一边必须改另一边（AGENTS.md 强制）。

## 逐句落点公式（预混与字幕共用）

镜内首句 start=0.9s（TRACK_LEAD）；句间 = pauseAfter + 0.45s（TRACK_PAUSE_BONUS，末句不加）；镜尾 +0.6s（TRACK_TAIL）；镜起点节拍吸附（±0.35s）且不侵入上一镜（overlap/30 - 0.3 缓冲）。
