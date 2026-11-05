# 共享产物契约（所有阶段必读）

> 本文档是 skill 流程的单一事实源：目录约定、产物 JSON schema、时长/停顿公式。
> 与 `backend/app/schemas.py`、`remotion-engine/src/dv/types.ts` 保持同步；改任何一边必须同步本文。

## 1. 目录约定（仓库根 = `D:\work\Video_Workflow`）

```
backend/
  storage/projects/<pid>/        # 项目产物（每步落盘，可追溯）
    script.json                  # ② 文案产物（ScriptDraft）
    plan.json                    # ⑤ 风格/分镜编排方案 + template 相关性判定
    research.json | research.md  # ① 选题/调研产物（可选）
  storage/renders/<pid>/
    props.json                   # ⑥ 渲染输入（camelCase，预混后被改写）
    preview.mp4                  # 前 10 秒预览（--frames 0-299）
    final.mp4                    # 交付成片
    cover.jpg                    # 封面（ffmpeg 取 8% 处帧）
remotion-engine/
  public/voice/projects/<pid>/   # ④ 配音：s01_0.wav... + 预混 track.wav
  public/pic/projects/<pid>/     # 图片素材（props 引用相对 public/ 的路径）
  public/bgm/  public/sfx/       # BGM 与音效曲库
  src/gen/<pid>/SceneNN.tsx      # ⑥ 现场编写的动画场景（可选）
```

注意：props 与 BGM/配音/图片里的路径一律**相对 `remotion-engine/public/`**（如 `voice/projects/<pid>/s01_0.wav`、`bgm/warm_piano.mp3`）。

## 2. script.json（文案产物，ScriptDraft）

```json
{
  "title": "标题（≤60字，口播标题建议≤24字）",
  "shots": [
    {
      "year": "年代/阶段标签，≤16字，非年代故事留空",
      "label": "本幕小标题，≤40字（建议 4~12 字）",
      "colors": ["#1a1a2e", "#16213e"],
      "lines": [{ "text": "一句台词" }]
    }
  ]
}
```

- `colors`：该镜背景两色（hex `#RRGGBB`），默认浅色纸感（浅底深墨 + 低饱和强调色），贴合该幕情绪；不要默认深底霓虹。
- `lines`：每幕 1~3 句（上限 8），每句 ≤20 字（写稿规则见 video-script skill）。
- 幕数参考：`clamp(round(target_seconds / 9), 8, 22)`；纯创作短 footage 可少于此值，但每幕至少 1 句。

## 3. line id 与时长/停顿公式

- **line id**：`s{镜号2位}_{句序}`，如 `s01_0`、`s01_1`、`s02_0`（镜号从 01 起、句序从 0 起）。配音文件名 = `<line_id>.wav`。
- **每句时长 durationSec**（三选一）：
  - `tts`：`backend/tools/tts_gen.py` 实测输出，直接采用；
  - `custom`（自带配音）：整段口播按各幕字数占比分摊 / 分幕音频按句长占比分摊；
  - `none`（无配音）：屏显阅读速度，`max(1.4, 0.35 + 字数/3.6)` 秒。
  - 兜底：缺时长时按 `max(0.8, 字数/4.5)` 估算（中文口播约 4.5 字/秒）。
- **pauseAfter**（句尾停顿，秒，模拟呼吸感；时间轴会再加 **0.12s** 缓冲，末句除外）：

| 句尾 | ？! | … | 。 | ，、； | 数字/% | 其他 |
|---|---|---|---|---|---|---|
| pauseAfter | 0.50 | 0.55 | 0.38 | 0.20 | 0.40 | 0.30 |

> 2026-11 P0+P1：不再所有句都写 0.4（旧值 + 0.45 缓冲会让每句静音约 1.1s，全片近一半在等）。
> `build_props.py` 会按上表自动给 `pauseAfter`；`voice.py` / `timeline.ts` 只负责加 0.12 缓冲。

## 4. props.json（渲染输入，RenderProps，camelCase）

只有这份 JSON 喂给 `npx remotion render --props=`。由 `video-production` 阶段组装。

```json
{
  "title": "视频标题",
  "kicker": "片头标题上方小字（可省）",
  "titleCard": true,
  "grainOpacity": 0.06,
  "shots": [
    {
      "year": "", "label": "",
      "colors": ["#F2EDE4", "#E6DCCB"],
      "image": "pic/projects/<pid>/01-xxx.jpg",
      "tail": 0.6,
      "durationSec": null,
      "lines": [
        {
          "id": "s01_0", "text": "台词", "durationSec": 2.31,
          "audio": "voice/projects/<pid>/s01_0.wav",
          "pauseAfter": 0.5, "emphasis": ["关键词"]
        }
      ],
      "camera": "push", "camIntensity": 1.0,
      "enterTransition": "dissolve",
      "cameraPerLine": null,
      "grade": { "contrast": 1.05, "saturate": 1.1, "brightness": 1.03, "tintOpacity": 0.2 },
      "overlay": null, "sfxMoment": null, "atmosphere": null, "scene": null,
      "grainOpacity": null
    }
  ],
  "bgm": { "src": "bgm/warm_piano.mp3", "volume": 0.75, "bpm": 96, "beats": [0.0, 0.63] },
  "look": {
    "preset": "paper", "mode": "light", "bg": "paper",
    "accent": "#C8452D", "palette": ["#F2EDE4", "#E6DCCB"], "ink": "#14110F",
    "vignette": 0.3, "subtitleStyle": "bold",
    "atmosphere": { "kind": "none", "opacity": 0.5 }
  },
  "sfx": true,
  "narrationAudio": { "src": "voice/projects/<pid>/track.wav", "volume": 1.0 }
}
```

### 枚举与取值范围（模型输出必须清洗到这些值内）

| 字段 | 允许值 |
|---|---|
| `camera`（11 种） | push 缓推/强调、pull 缓拉/抽离、pan_left、pan_right 横摇/并列、tilt_up、tilt_down 上下摇/压迫、diag_in、diag_out 斜推/动感、dolly_zoom 滑动变焦/眩晕、handheld 手持/纪实、still 静止/沉重 |
| `camIntensity` | 0.6~1.6（平静 0.8~1.0、紧张 1.1~1.3、高潮 1.3~1.6） |
| `enterTransition`（7 种） | dissolve 柔和(默认/首镜)、whip 甩镜/情绪突变、zoom 变焦/悬念、flash 闪白/爆点、cut 硬切/冷峻、glitch 故障/崩溃反转、slide 推移/章节 |
| `grade` | contrast 0.9~1.25、saturate 0.7~1.4、brightness 0.9~1.1、tintOpacity 0~0.4（低谷 saturate 低 tint 高，高潮反之） |
| `overlay.kind`（6 种） | counter 数字(配 value/label/unit)、typewriter 打字机(≤18字)、chat 气泡(side/name/text)、stat 状态条(label/from/to/unit)、toast 告警(tone: error\|info\|success)、terminal 终端(≤4行)；全片 20%~40% 镜头有即可，相邻镜不重复 |
| `sfxMoment`（≤3 次/片） | impact 重锤/爆点、riser 上扬/蓄力、whoosh 呼啸/速度感 |
| `atmosphere.kind`（5 种） | none(默认)、stars、rain、dust、embers；**from_scratch 禁用 stars** |
| `scene.kind` | `null` 或 `gen:<pid>:<NN>`（from_scratch 禁止其他；有真实图片的镜 scene 让位给 image） |
| `grainOpacity` | 0~0.12（纪实/回忆 0.08~0.12，干净现代 0.03~0.05；全片顶层统一） |
| `look.preset` | paper 暖白纸感(默认)、editorial 编辑衬线、cinema 电影暗调、graphic 海报图形、dark 深色 |
| `emphasis` | 每句 0~3 个，必须是该句台词的**连续子串**（数字/引语优先），渲染端金色高亮 |

硬规则：ink 与背景对比度 ≥4.5:1；accent 低饱和印刷感（禁荧光青/霓虹紫）；相邻镜不用相同强转场、运镜不全同；第一镜转场固定 dissolve。

## 5. 时间轴常量（timeline.ts ⇄ voice.py 强制同步）

`remotion-engine/src/dv/timeline.ts` 与 `backend/app/services/voice.py` 的预混音数学逐帧对齐：
`FPS=30`，`INTRO_FRAMES=48`(1.6s)，`TRACK_LEAD=0.45`，`TRACK_TAIL=0.4`，`TRACK_GAP=0.22`，
`TRACK_PAUSE_BONUS=0.12`，转场重叠帧 `{whip:11, zoom:13, flash:7, cut:3, glitch:10, slide:12, dissolve:16}`。

**offset 也必须落在拍网格上**：`offset = snap(max(2.0, (INTRO_FRAMES-15)/30), beats, 0.45)`。
110 BPM 时是 2.182s（旧逻辑取 2.0 会让所有切点整体偏 0.18s，BGM 重音再按绝对拍域吸附就晚了）。
`build_props.py` 的切点算法必须与 `timeline.ts` / `voice.py` 完全一致：
“保底（不侵入上一镜）→ 吸附 → 若吸附后仍低于保底，取保底之后的下一拍”。

**这三处（timeline.ts / voice.py / build_props.py）任何一边改动必须同步另外两处**（预混整轨 `track.wav` 按同一套常量布局，否则人声、字幕、BGM 三轨漂移）。整轨预混由 `backend/tools/premix_track.py` 完成，它调用 voice.py，不复制数学。

时长估算：成片总秒 ≈ `offset(≥2.0，按拍吸附) + Σ(每镜: 0.45 + Σ(句时长+句停顿+0.12) + tail 默认 0.4) + 1.0`，preview 用 `--frames 0-299`（前 10 秒）。

## 6. plan.json（风格/分镜方案 + 模板判定落库）

```json
{
  "template": { "mode": "from_scratch|reuse", "reason": "≤60字", "reusable": ["通用运镜词表"] },
  "look": { "...同 props.look..." },
  "kicker": "...", "pacing": "节奏曲线一句话",
  "shots": [
    { "hash": "可选，缓存用", "plan": { "camera": "push", "intensity": 1.0, "transition": "dissolve",
      "grade": {...}, "grain": 0.06, "overlay": null, "sfxMoment": null, "atmosphere": null,
      "emphasis": ["关键词"], "layout": "statement", "align": "left", "textStyle": "display" } }
  ]
}
```

组装 props 时把 `plan.shots[i].plan` 映射进 `RenderShot`（`intensity→camIntensity`、`transition→enterTransition`、`grain→顶层 grainOpacity 平均值`），并过滤 `emphasis` 为该句台词子串。

## 7. 交付与验收基线

- 成片：`backend/storage/renders/<pid>/final.mp4`（1080×1920@30fps，h264）。
- 先渲 `preview.mp4`（前 10 秒）过目，确认后才渲整片。
- 渲完自查：字幕无出框/重叠/过小；年份文案正确；切镜卡拍（±1~2 帧）；人声与字幕同步（≤2 帧）。
