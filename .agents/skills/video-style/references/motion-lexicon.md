# 逐镜编排词典与审查清单（SHOT_DIRECTOR / CRITIC 蒸馏）

## camera（11 种，作用于图片/占位镜；gen 场景镜退化为整体缓动）

| 值 | 语义 | 典型用法 |
|---|---|---|
| push | 缓推 | 走近/强调/递进 |
| pull | 缓拉 | 抽离/释然/收尾 |
| pan_left / pan_right | 横摇 | 并列/环境/时间推进 |
| tilt_up / tilt_down | 上下摇 | 压迫/仰望 |
| diag_in / diag_out | 斜推斜拉 | 动感/失控 |
| dolly_zoom | 滑动变焦 | 眩晕/震惊/违和感爆发 |
| handheld | 手持晃动 | 纪实/慌乱/真实感 |
| still | 静止 | 冷静/定格/沉重（画面本身在动时给 still） |

intensity 0.6~1.6：平静 0.8~1.0、紧张 1.1~1.3、高潮 1.3~1.6。逐句运镜 cameraPerLine（长度=句数）用于多句镜的句间切机位。

## transition（进本镜的转场，7 种）

dissolve 柔和（**默认，首镜固定**）/ whip 甩镜（情绪突变）/ zoom 变焦模糊（悬念追问）/ flash 闪白（爆点一瞬）/ cut 硬切（冷峻纪实）/ glitch 故障错位（崩溃/系统/反转/数字失误）/ slide 推移（话题切换/章节感）。

## grade 跟情绪

低谷/悬疑：saturate 0.7~0.9、tintOpacity 0.3~0.4（冷色浓）；高潮/励志：saturate 1.15~1.4、contrast 1.1~1.25、tintOpacity 0~0.1；平静取默认附近。grain 见 style-rules。

## overlay（6 种，全片 20%~40% 镜头有，相邻不重复）

counter 数字冲击（台词含重要数字首选，配 value/label/unit）/ typewriter 打字机（悬念揭示 ≤18字）/ chat 聊天气泡（对话/被质疑，side/name/text）/ stat 状态条（能量/进度，from>to 掉血）/ toast 告警卡（tone: error|info|success）/ terminal 终端（代码/报错 ≤4行）。与台词无关不硬塞。

## sfxMoment（全片 1~3 次，真爆点才给）

impact 重锤（爆点开局）/ riser 上扬（镜尾蓄力接高潮）/ whoosh 呼啸（速度感）。注意：与生成式 BGM 的烘焙 impact 二选一为主，避免同刻双响。

## emphasis

每镜台词中值得金色高亮的关键词（数字/人名/引语原文），每镜 0~3 个，**必须是台词的连续子串**。

## 编排规则

- 相邻镜头主运镜不得相同；同向运镜（push 与 diag_in 同族）连续不超过 2 镜。
- 情绪曲线整体跟随台词：低谷→积蓄→爆发→收尾；强度与转场服务曲线。
- scene（gen 场景）相邻镜头不要用相同 kind，除非叙事确实连续（连续图表分窗时除外——那是刻意的连续性设计，需在 plan 里注明）。

## 节奏审查清单（自审，只修真问题）

1. 相邻两镜主运镜相同 → 改后一镜
2. 相邻两镜都用强转场（whip/flash/glitch/zoom）→ 后一镜改 dissolve 或 cut
3. 全片连续 4 镜以上同运镜或同转场 → 打破循环
4. overlay 滥用（相邻都有或超过一半镜头有）→ 删信息量低的
5. sfxMoment 超过 3 个或相邻两镜都有 → 删到只剩真爆点
6. 情绪曲线断裂：高潮镜 intensity <1.1、低谷镜 >1.3 → 修正
7. 调色与情绪矛盾（高潮镜 saturate<0.8）→ 修正 grade
