# 平台发布预设（默认值 · 2026-11 起）

> 目的：把「平台会怎么裁视频」这件事前置到制作阶段，出片即适配，不再等用户上传后才发现左右被切。
> 本文件是默认值来源；`AGENTS.md`、`video-producer`、`video-style`、`video-production` 都引用它。

## 1. 抖音竖屏（**默认预设**，用户没特殊说明时一律按这个出片）

| 项 | 值 |
|---|---|
| 画布 | 1080×1920 @30fps，h264 + AAC（`DataVideo`） |
| 平台行为 | 20:9 机型与作品预览页按 **cover 铺满**，9:16 视频被放大 1.257×，**左右各裁 ≈13%（1080 宽 ≈139px/侧）** |
| 安全画幅 | `plan.json` / `build_config.json` 写 **`safeScale: 0.8`**（引擎 `src/dv/DataVideo.tsx` 读取 `props.safeScale`） |
| 内容安全区 | safeScale=0.8 时内容落在 **x 185~895 / y 300~1460**；字幕/数字/镜标签/印章都必须在这块里 |
| 运镜上限 | safeScale<1 时 **camIntensity ≤ 1.1**（缩放会把贴边内容推出安全区）；推荐 push≤1.1、dolly_zoom≤0.8、diag_in≤0.75、pan≤0.6、pull≤0.9 |
| UI 避让 | 右侧 x>880（点赞/评论/收藏）、底部 y>1500（文案/音乐/操作栏）、顶部 y<120（状态栏）不放关键内容 |
| 封面 | 用安全画幅整帧导出 1080×1920（平台会按同样规则裁切） |
| BGM | 知识科普类默认用抖音站内「**AI 知识大赏 / vibe 知识大赏**」同款（《We Never (Remix)》0.9x，112.3 BPM）；站内发布时再选同款音乐 |
| 验收 | **必须按 802×1920（裁 x139~941）模拟裁切抽帧**，确认片头/字幕/数字/印章不被切 |

### 落地方式

1. `video-style` 阶段把 `safeScale: 0.8` 写进 `backend/storage/projects/<pid>/plan.json` 顶层；
2. `video-production` 阶段在 `build_config.json` 写 `"safe_scale": 0.8`（`build_props.py` 会优先读 config，缺省回落到 `plan.json` 的 `safeScale`）；
3. 生成/校验 props 后确认 `props.safeScale === 0.8`；
4. 验收抽帧：
   ```powershell
   # 按抖音可见区裁切（802×1920）后看字有没有被切
   ffmpeg -ss 13.6 -i final.mp4 -frames:v 1 -vf "crop=802:1920:139:0" qa_crop.png
   ```

### build_config.json 片段

```json
{
  "pid": "<pid>",
  "bpm": 112.3,
  "bgm_out": "<bgm名>",
  "bgm_volume": 0.7,
  "intro_frames": 48,
  "safe_scale": 0.8,
  "sfx": true
}
```

## 2. 备选：9:20 满屏无边框（1080×2400）

只有用户**明确要求「满屏、不要边框」**时才用：需把画布高度改成 2400、字幕纵向位置（`Subtitle.tsx` 的 `bottom`）与各 gen 场景 y 坐标整体重排，成本高（约 30~40 分钟），且非 9:16 视频在部分机型会被加边。默认不启用。

## 3. 其它竖屏平台（视频号 / 小红书 / 快手）

同为 9:16 竖屏，沿用 `safeScale 0.8`；若用户指定平台，按该平台安全区微调并在此文件补一行。

## 4. 通用公式（换平台/换机型时自行推算）

- 可见宽 `Wv = 1080 - 2 × 裁切px`；抖音 20:9 机型裁切 ≈139px → `Wv ≈ 802`。
- 推荐 `safeScale ≈ (Wv - 2 × 40) / 1080`（两侧再留 40px 呼吸）→ 抖音约 `0.67`，但 0.8 已能让内容落在可见区（靠边框被裁），实测更自然：**0.78~0.84，默认 0.8**。
- 换算内容安全区：`x ∈ 540 ± 444 × safeScale × camMax`，其中 `camMax` 为最大运镜缩放（push 1.1 / dolly 1.12 / diag 1.1 / pull 1.11）。
