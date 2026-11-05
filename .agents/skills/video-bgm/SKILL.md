---
name: video-bgm
description: 短视频 BGM 选曲与卡点设计。用户要配背景音乐、自动生成 BGM、卡点、节拍对齐、选曲，或文案完成后要配乐时使用。产出 public/bgm 曲目 + bpm/beats 数据，供渲染端 snapToBeat 切镜。
---

# video-bgm：背景音乐与卡点

BGM 有两条路：**曲库选曲**（快）与**程序化生成**（可控卡点，重点事件可烘焙重音）。选哪条看需求：纯氛围衬底走曲库；要"事件卡点/高潮对齐"必须生成。

## 流程

1. **定情绪曲线**：从 script.json 提炼全片情绪（低谷→积蓄→爆发→收尾），标出 1~5 个"重点事件"（数据爆点/反转/高潮）及其期望出现位置。
2. **路线 A · 曲库选曲**：`public/bgm/` 现有曲目按气质选（`warm_piano` 暖钢琴治愈、`tense_pad` 紧张铺底、`uplifting` 昂扬）；情绪词→搜曲词映射见 `references/music-knowledge.md`。在线 CC 曲库搜索（Openverse/Jamendo，NC/ND 过滤）需要时包装 `app/services/music_search.py`。BPM 未知时用 `backend/tools/beat_analyze.py` 分析节拍。
3. **路线 B · 程序化生成**（事件卡点首选）：
   ```bash
   cd backend && python tools/gen_event_bgm.py --bpm 120 --bars 30 \
     --events "12.5:1.0,27.0:0.8,44.5:1.2" --out ashare_bgm
   ```
   产出 `public/bgm/<out>.mp3` + `<out>.beats.json`（节拍网格秒数 + 事件重音表）。事件秒数从分镜时间轴反推（见下）。
4. **回填 props**：`bgm: {"src": "bgm/<out>.mp3", "volume": 0.7~0.8, "bpm": <bpm>, "beats": [<网格秒>...]}`——**beats 必须填**，渲染端据此把切镜吸附到拍上（容差 0.35s）。

## 事件卡点的时间反推（关键，先于生成做）

1. 配音完成后组好 props（含逐句 durationSec），先填入**纯节拍网格**（`beats = [k*60/BPM ...]`）；
2. 按 timeline 常量算出每镜吸附后的 [start, end]（数学见 `references/music-knowledge.md` §卡点数学，或直接跑 `backend/tools/shot_timeline.py <props.json>`）；
3. 事件在镜内的时间 = 镜起点 + 镜内进度占比 × 镜内容时长；把它吸附到最近的拍/半拍；
4. 以这些秒数作为 `--events` 生成 BGM（生成器在事件处烘焙 impact/crash/subdrop）；
5. 生成的 BGM 音量注意**人声优先**：volume 0.6~0.8，副歌/重音段不要盖旁白。

## 规则

- 只有真的有配音时音乐才闪避（渲染端自动处理旁白侧链不存在，靠音量配比）；
- BGM 全片 1~3 个能量段落即可，别从头燃到尾；
- 版权：曲库曲自带许可元数据；程序化生成 = 完全无版权，优先用于发布类视频。
