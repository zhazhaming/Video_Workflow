# 验收清单

> 来源：docs/FLOW.md 第 6 步、PROGRESS.md §14/§15 的 QA 数字、briefs 简报验收节。
> 渲染完成后逐项自查；有工具能验的用工具（shot_timeline.py 可输出每镜时间轴）。

## 工具闸门（有工具能验的用工具）

- [ ] **事实审计**：`python -X utf8 tools/facts_audit.py --script storage/projects/<pid>/script.json --research storage/projects/<pid>/research.json --strict` → `unverifiable=0` 才算过（查不到出处的数字删掉或改定性表述，或补来源进 research.json）。无人值守流水线按最终文件**重算**复核，是硬闸门。
- [ ] **机检**：`python -X utf8 tools/qa_report.py --video storage/renders/<pid>/final.mp4 --props .../props.json`（黑帧/静音/响度/落拍；建议级，结果会进 daily 飞书结果卡）。
- [ ] **有界视觉自查**：`python -X utf8 tools/acceptance_frames.py --video .../final.mp4 --props .../props.json --out .../acceptance`（≤6 帧 540×960，前 2 张镜内帧带抖音裁切模拟版）→ Read 图片**一次批量判定**（下一节「画面」+ 安全画幅项），结果落 `.../acceptance.json`（建议级不拦截交付）。硬上限：一轮判定+一次复检，不逐帧反复看图。

## 音画同步

- [ ] 人声与字幕同步误差 ≤2 帧（≈67ms）：抽 2~3 句听看对照，尤其片头 offset 处与转场重叠处。
- [ ] 整轨预混已生效：props 里 `narrationAudio.src` 指向 `track.wav`（或 `motion_track.wav`），逐句 audio 为 null。
- [ ] 句间无爆音（预混有 3ms 淡入）；无"一句话一半没声音"（那是嵌套 Sequence bug，说明没用整轨）。

## 卡点与节奏

- [ ] 80% 以上的切镜落在 BGM 节拍 ±2 帧内（无 BGM 项目跳过）。
- [ ] 无连续 4 镜以上相同运镜/转场；相邻镜无相同强转场（whip/flash/glitch/zoom）。
- [ ] sfxMoment 全片 ≤3 次且都在真爆点；overlay 出现在 20%~40% 镜头且相邻不重复。

## 画面

- [ ] 字幕无出框/重叠/过小（逐帧抽查 3~5 处：still 帧或 preview 播放）。
- [ ] 年份/标签/文案与 script.json 一致；emphasis 高亮的词确实是台词子串。
- [ ] 颜色对比度 ≥4.5:1（ink vs 背景）；无 AI 味四禁令（深色配霓虹、字全居中、紫色渐变、全片淡入淡出）。
- [ ] from_scratch 项目无模板意象（无 stars 氛围、无越权 scene.kind）；gen 场景画面无文字、无外部图片。
- [ ] 图片镜：图清晰、无明显版权水印；scene 让位给已选图（prefer_images 规则）。

## 交付物

- [ ] `backend/storage/renders/<pid>/preview.mp4` 先行给用户过目，**确认后才渲 final**。
- [ ] `backend/storage/renders/<pid>/final.mp4` 存在、可播放、时长符合估算（±10%）。
- [ ] props.json、渲染日志同目录留存（可追溯）。
- [ ] 封面（可选）：`ffmpeg -ss <时长8%> -i final.mp4 -frames:v 1 cover.jpg`。

## 平台安全画幅（默认预设，2026-11 起必查）

- [ ] `props.safeScale` 存在且为 0.8（或按平台预设；见 `video-producer/references/platform-presets.md`）。
- [ ] 运镜 `camIntensity ≤1.1`（push≤1.1 / dolly_zoom≤0.8 / diag_in≤0.75 / pan≤0.6 / pull≤0.9）。
- [ ] **按抖音可见区模拟裁切抽帧**：`crop=802:1920:139:0`，片头/每镜字幕/数字/印章无切字。
- [ ] 关键内容不在右侧 x>880、底部 y>1500、顶部 y<120（抖音 UI 遮挡区）。

## 交付话术模板

> 成片已生成：`backend/storage/renders/<pid>/final.mp4`（时长 X 秒，N 镜 M 句）。
> 卡点：x/n 个切镜在拍上；音画同步抽查 3 处无漂移。
> 遗留：……（如有）。
