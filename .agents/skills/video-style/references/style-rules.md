# 风格规则（STYLE_BIBLE / STYLE_PROPOSAL 蒸馏）

## look 字段与预设

```json
{"preset": "paper|editorial|cinema|graphic|dark", "mode": "light|dark", "bg": "paper|dark",
 "accent": "#C8452D", "palette": ["#F2EDE4", "#E6DCCB"], "ink": "#14110F",
 "vignette": 0.3, "subtitleStyle": "bold|pill",
 "atmosphere": {"kind": "none|stars|rain|dust|embers", "opacity": 0.5},
 "type": {"display": "...", "body": "...", "mono": "..."},
 "grid": {"margin": 96, "columns": 6, "baseline": 12},
 "texture": {"grain": 0.05, "paper": 0.35, "halftone": 0.0, "vignette": 0.12}}
```

五套 preset：**paper 暖白纸感（默认）**、editorial 编辑衬线、cinema 中性电影暗调、graphic 海报图形、dark 深色。只有悬疑/夜景/科技发布会确实需要才选 dark。

## 硬约束

1. palette = [背景, 次色]；bg=paper 时两个都必须浅色（亮度>0.5）；**ink 对背景对比度 ≥4.5:1**（浅底深墨 / 深底米白）。
2. accent 低饱和印刷感（朱红/墨绿/芥黄/赭石）；**禁荧光青、霓虹紫、纯黑配霓虹**。
3. vignette：paper 0~0.4、cinema 0.8~1.3；不要全片重暗角。grain 0~0.12（纪实回忆 0.08~0.12、干净现代 0.03~0.05）。
4. subtitleStyle：bold（白字描边，普适）/ pill（半透明胶囊，仅图形科技感）。
5. 字体：display 用 NotoSerifSC（编辑/故事）或 SmileySans（图形/科技），body NotoSansSC，mono JetBrainsMono；不用系统默认黑体。
6. grid：margin 80~120、columns 4~8、baseline 8~16。
7. atmosphere 默认 none；只有纪实回忆/雨夜确实加分才用；**from_scratch 禁 stars**（星空凑氛围是 AI 味）。

## AI 味四禁令（一条都不能沾）

① 深色背景配霓虹光；② 字都堆在正中间；③ 紫色渐变；④ 所有东西都淡入淡出。

## 金融/数据题材的加分行内经验（A股视频等）

- 浅色纸感底 + 深墨字 + 朱红强调（**红涨绿跌**：涨用 accent 红、跌用深绿 `#1E7A46` 系）；
- 数字是主角：emphasis 高亮 + counter 浮层给关键数值；图表类 gen 场景与 look 同色系；
- 情绪转折用 palette 微变表达（低谷段次色转冷，反弹段转暖），不要整段换风格。
