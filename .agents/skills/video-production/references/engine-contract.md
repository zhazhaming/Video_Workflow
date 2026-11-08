# 引擎契约（remotion-engine）

> 权威定义：`remotion-engine/src/dv/types.ts`（props 类型）、`src/dv/timeline.ts`（时间轴数学）、
> `backend/app/schemas.py`（Python 侧镜像）。字段名以 types.ts 为准，props 是唯一渲染输入。

## 1. 两个 Composition（1080×1920@30fps，h264）

| Composition | 用途 | 特点 |
|---|---|---|
| `DataVideo` | 默认竖屏口播 | 片头标题卡（2.2s）+ 逐句字幕 + 运镜/转场/调色/颗粒/氛围粒子/SFX |
| `MotionShow` | 轻量版式 | 无片头、帧制布局（GAP 11帧/TAIL 18帧/最短镜 72帧），适合版式/图文 |

## 2. 时间轴数学（timeline.ts，voice.py 预混逐帧对齐）

常量：`FPS=30`、`INTRO_FRAMES=66`、`TRACK_LEAD=0.9`、`TRACK_TAIL=0.6`、`TRACK_GAP=0.35`、
`TRACK_PAUSE_BONUS=0.45`、转场重叠帧 `{whip:11, zoom:13, flash:7, cut:3, glitch:10, slide:12, dissolve:16}`。

DataVideo 布局：`offset = max(2.0, snap((introFrames-15)/30, beats, 0.45))`；镜内首句从 0.9s 起，
句间 `pauseAfter + 0.45`（末句不加）；镜长 = 0.9 + Σ(句时长+句间停顿) + tail；镜起点做节拍吸附
（容差 0.35s）且不侵入上一镜内容。总帧 = `ceil((offset + Σ镜长 + 1.0) × 30)`。

**改 timeline.ts 或 voice.py 任一边必须同步另一边**（AGENTS.md 强制）。本 skill 不改这两处，只消费。

## 3. props.json 字段速查（camelCase；完整 schema 见总入口 pipeline-contracts.md §4）

- 顶层：`title`、`shots[]`、`bgm{src,volume,bpm,beats[]}`、`titleCard`、`grainOpacity`(0~0.12)、
  `look{}`、`kicker`、`sfx`、`narrationAudio{src,volume}`、`safeScale`(0.6~1，缺省 1；抖音全屏 cover 裁左右 ~13% 时用 0.78~0.84 把内容缩进安全区)。
- 镜：`year/label/colors[2]/image/tail(0.6)/durationSec(卡点镜长下限)/camera/camIntensity(0.6~1.6)/
  enterTransition/cameraPerLine/grade{contrast,saturate,brightness,tintOpacity}/overlay/sfxMoment/
  atmosphere{kind,opacity}/scene{kind,palette,accent,speed}`。
- 句：`id/text/durationSec/audio/pauseAfter/emphasis[]`。
- 所有资源路径**相对 `remotion-engine/public/`**：`voice/projects/<pid>/s01_0.wav`、
  `pic/projects/<pid>/01-xxx.jpg`、`bgm/warm_piano.mp3`。
- 缺省行为：`image` 缺 → 用 colors 渐变占位；`scene` 优先于 `image`；`bgm.beats` 空数组 = 不卡点；
  `sfx` 缺省开（用 `public/sfx/{impact,riser,whoosh}.wav`）；`titleCard` 缺省 true。
- 曲库现状：`public/bgm/` 有 `warm_piano / tense_pad / uplifting`（gen_bgm.py 可再生）等；选曲语义见词表（warm_piano 暖钢琴/治愈，tense_pad 紧张铺底，uplifting 昂扬）。

## 4. 逐镜编排词典（SHOT_DIRECTOR_SYSTEM 精炼；完整语义见 `video-style` skill 建成后的知识库）

- **camera**：push 走近/强调、pull 抽离/释然、pan_left/right 并列/环境、tilt_up/down 压迫/仰望、
  diag_in/out 动感/失控、dolly_zoom 眩晕/震惊、handheld 纪实/慌乱、still 冷静/定格。
- **transition**（进本镜）：dissolve 柔和默认（首镜必它）、whip 情绪突变、zoom 悬念/追问、flash 爆点、
  cut 冷峻/纪实、glitch 崩溃/反转/数字失误、slide 章节/话题切换。相邻镜不用相同强转场。
- **grade 跟情绪**：低谷/悬疑 saturate 0.7~0.9 + tintOpacity 0.3~0.4；高潮/励志 saturate 1.15~1.4 +
  contrast 1.1~1.25 + tintOpacity 0~0.1；平静取默认附近。
- **overlay**（20%~40% 镜头有，相邻不重复）：counter 台词含重要数字、typewriter 悬念揭示 ≤18 字、
  chat 对话/被质疑、stat 能量/进度 from>to 掉血、toast 系统通知、terminal 代码/日志 ≤4 行。
- **sfxMoment** 全片 1~3 次：impact 爆点、riser 镜尾蓄力、whoosh 速度感。
- **节奏**：相邻镜主运镜不同；同向运镜连续 ≤2 镜；情绪曲线（低谷→积蓄→爆发→收尾）驱动强度与转场。

## 5. 渲染命令（也可直接用，工具已包装）

```bash
cd remotion-engine
npx remotion render DataVideo "<out.mp4>" --props="<props.json>" --codec=h264 --log=info --overwrite
npx remotion render DataVideo "<preview.mp4>" --props="<props.json>" --frames=0-299 --codec=h264 --overwrite
npx remotion still DataVideo "<still.png>" --props="<props.json>" --frame=180 --overwrite
npx tsc --noEmit   # gen 场景闸门（改了 src/gen 后必须过）
```

推荐统一走 `backend/tools/render_video.py`（自动写日志、JSON 输出、参数校验）。

## 6. 组装 props 的易错点（实测踩过）

1. `pauseAfter` 忘写 → 默认 0.35 也能跑，但节奏不对；按标点表填。
2. `emphasis` 写了非台词子串 → 不生效；必须逐字匹配。
3. `durationSec` 单位是**秒**不是帧；`bgm.beats` 是**秒**数组。
4. `cameraPerLine` 长度必须等于句数且全为合法值，否则整表作废。
5. 预混后 props 被改写（narrationAudio 指向 track.wav、逐句 audio 为 null）——重渲直接用改写后的文件。
6. `look.bg: "paper"` 时 palette 必须浅色、ink 深色（对比度 ≥4.5:1）。
