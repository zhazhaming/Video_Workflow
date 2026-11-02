# video-workflow 工作区规则（AI 每次会话必读）

## ★ 重点规则：模板相关性检查（每次制作视频前必须执行）

在为任何选题/项目做视频（生成脚本、编排动效、渲染、写提示词）之前，**必须先判断当前视频内容与已有模板库是否相关**。

模板库现状：`D:\Work\remotion-life-sim`（DataVideo.tsx + src/dv/*）——
内置"代码绘制场景"为**行星/宇宙/地球演化**域：太阳系(solar)、星云(nebula)、吸积盘(accretion)、
天体碰撞(impact)、卫星形成(moonform)、海洋(ocean)、火山(volcano)、冰期(ice)、陨石灭绝(meteor)、
生命(life)、城市(city)，以及固定的运镜/转场/字幕/调色/颗粒词表和占位图规则。

判定与执行：

1. **无关 → 从零开始（from_scratch）**：禁止注入模板的 scene 场景（尤其行星/太阳系类）与星空氛围，
   禁止复用旧占位图。画面与动效通过提示词 + AI 创作：产出从零制作提示词包
   （参照 `briefs/ppt-20pages-video-brief.md` 的结构），供 agent 用 remotion skill 从零实现。
   产品内已有自动判定与清洗（backend/app/services/director.py 的 template 相关性阶段），不得绕过。
2. **有关 → 先看能否复用**：列出可复用的部分（哪个 scene kind / 哪段词表 / 哪张素材），
   只复用匹配项，其余仍按内容原创设计，并在方案里注明复用清单。
3. 判定结论要落库可查（plan JSON 的 `template` 字段：mode/reason/reusable），不许静默注入模板元素。

判不准时按"无关"处理（宁可中性渲染 + 提示词包，也不许给无关内容塞行星动效）。

## 其他约定

- 后端测试：改测试后先清 `__pycache__` 与 `.pytest_cache`（Windows mtime 精度会导致旧字节码假失败）。
- 8000 端口可能有旧实例：改完代码要 taskkill 占用进程后重启，避免请求打到旧代码。
- 交付物路径：成片 `backend/storage/renders/<pid>/final.mp4`；项目图片 `remotion-life-sim/public/pic/projects/<pid>/`。
