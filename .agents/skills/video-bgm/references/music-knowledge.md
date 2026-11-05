# 音乐知识（曲库 / 词表 / 卡点数学）

> 来源：README BGM 库规则、music.py 情绪词表、pick_gold_bgm.py 评分器、gen_gold_race_bgm.py 卡点经验、PROGRESS §14/§15。

## 曲库与许可

- 本地曲库 `remotion-engine/public/bgm/`；导入新曲：视频抽音轨 → ffmpeg loudnorm **-18 LUFS** → 192k mp3，元数据记进 `storage/bgm_library.json`（含许可与来源溯源）。
- 在线搜索只用公有领域/自由许可（CC），**NC/ND 一律过滤**；Wikimedia 走 curl（TLS 指纹）。
- 程序化生成（gen_event_bgm.py / gen_bgm.py）= 无版权，可商用发布。

## 情绪词表 → 选曲（music.py 提炼）

| 台词情绪 | 关键词信号 | 选曲方向 |
|---|---|---|
| 低谷/悬疑/暴跌 | 恐慌、崩、跌、失落 | tense_pad / 暗色 pad、慢 BPM |
| 平静叙事 | 日子、每天、普通 | warm_piano / 中慢速 |
| 高潮/励志/暴涨 | 冲、突破、新高、反弹 | uplifting / 全能量段 |

题材→英文搜曲词（bgm_query_for 提炼）：财经数据→`documentary cinematic tension`；故事→`emotional piano storytelling`；科普盘点→`curious light electronic`；治愈→`warm ambient healing`。

## 选曲评分（pick_gold_bgm.py 提炼，多候选时用）

客观打分三件套：BPM 置信度（检测稳定度）、打击感（onset/flux 尖峰密度）、针对目标时长的最佳 N 秒窗口（选能量匹配段落裁切）。

## 卡点数学（timeline.ts ⇄ voice.py 同步常量）

- FPS=30；拍长 = 60/BPM 秒；**1 拍帧数 = round(1800/BPM)**（120BPM→15帧，100BPM→18帧）。
- 渲染端 `snapToBeat(t, beats, tol=0.35)`：镜起点吸附最近拍（±0.35s 内才吸）；片头 offset=max(2.0, snap((introFrames-15)/30, beats, 0.45))。
- 转场重叠帧：whip 11 / zoom 13 / flash 7 / cut 3 / glitch 10 / slide 12 / dissolve 16。
- **镜起点不许侵入上一镜内容**：`start_i ≥ start_{i-1} + dur_{i-1} - overlap/30 + 0.3`。
- 事件卡点最好让切镜落在拍上、事件揭晓落在镜内重拍上；生成式 BGM 可把 impact 直接烘焙到该秒（比后期找拍准）。
- 验收：80% 以上切镜在节拍 ±2 帧内（`backend/tools/shot_timeline.py` 可打印每镜时间轴核对）。

## 生成式 BGM 设计经验（gen_gold_race_bgm.py 蒸馏）

- 结构：intro（pad+tick 蓄势）→ 主段（鼓组四拍 + pad 和弦进行 + bass + 琶音）→ 高潮段（16 分音符密度 + stab）→ outro（钟琴收束）。
- 情绪段落化：暴跌事件后留 1 小节"张力留白"（只留心跳 kick）；大底后"静场下潜"（subdrop）；高潮段全能量。
- 事件重音三件套：impact（低频锤）+ crash（镲）+ 前置 riser（提前 1~2s 上扬蓄力）；底部事件用 subdrop 不用 impact。
- 侧链闪避：bed（pad/bass/arp）按 kick 包络压 40%，人声占比自然提高。
- 输出统一 wav → ffmpeg 转 192k mp3，首尾淡入淡出（渲染端还会再淡入淡出一层）。
