# 《油车真的输了吗？》中国油车 vs 电车 近 5 年市占趋势 · 抖音竖屏科普（Vibe 科普风）

> 需求来源（用户原话）：做中国油车与电车近 5 年市场占有量趋势的 vibe 科普视频；**素材和数据一定要真实**；
> 发抖音；**不要深色 AI 味很浓的背景**；**动效精美**；**口播/配音要能吸引留存**。
>
> 本文件 = 制作简报 + 设计规范 + 数据契约 + 验收标准。所有实现以本文件为准。

---

## 0. 模板相关性判定（AGENTS.md 必做项）

- **判定：`from_scratch`（无关 → 从零创作）**
- 理由：本片是「中国乘用车市场 燃油 vs 新能源 渗透率趋势」的数据科普，与模板库
  （`remotion-life-sim/src/dv/*` 行星/宇宙/地球演化：solar/nebula/accretion/ocean/volcano/ice/meteor/life/city）
  完全无关。
- **禁止注入**：任何 `dv/*` scene、星空/星云氛围、旧占位图、深色科技风背景、紫蓝渐变、荧光青霓虹。
- **仅复用基建（不复制旧观感）**：
  1. Remotion 宿主（`D:\Work\remotion-life-sim`）与 `Root.tsx` 注册方式；
  2. 后端配音/拍点/渲染基建（`app/services/voice.py`、`beat.py`、`renderer.py`）；
  3. 既有 `run_*_vibe.py` 的驱动模式（剧本 → edge-tts 逐镜实测 → 拍点锁镜 → 旁白整轨预混 → props → 渲染 → 抽帧）；
  4. BGM `public/bgm/vibe_we_never.mp3`（本系列同款，112.3BPM，见 `storage/_vibe_bgm_meta.json`）；
  5. 字体/纹理**思路**（纸感颗粒），具体实现全新写。
- 结论落库：`backend/storage/projects/auto-market-trend/plan.json` 的 `template` 字段（mode/reason/reusable）。

---

## 1. 视觉方向：明亮「数据刊例 / 手账贴纸」风（明确不要深色）

**一句话**：奶油纸底 + 超粗墨字 + 两色编码 + 手绘 SVG 图标 + 贴纸/印章/胶带细节，
像一页会动的报纸数据版，而不是黑色科技 UI。

### 设计令牌（必须严格使用）
| 令牌 | 值 | 用途 |
|---|---|---|
| BG | `#F7F2E7` | 米白纸底（整片唯一底色，禁止深色背景） |
| PAPER2 | `#EFE7D6` | 次级纸面/分区底 |
| INK | `#17130E` | 墨黑标题与正文 |
| INK2 | `#5A5145` | 次级文字/轴标签 |
| RULE | `rgba(23,19,14,0.14)` | 细分割线/网格 |
| EV | `#0E9F6E` | 新能源主色（绿） |
| EV_SOFT | `#CDEEDF` | 新能源浅底 |
| FUEL | `#C1743A` | 燃油主色（暖棕/琥珀） |
| FUEL_SOFT | `#F3E0CA` | 燃油浅底 |
| ACCENT | `#E4572E` | 强调/里程碑/危机点（橙红） |
| HILITE | `#F5C542` | 高亮荧光笔色（黄色马克笔） |
| CARD | `#FFFCF5` | 白卡底 + 1.5px INK 描边 + 6px 硬投影（`0 6px 0 rgba(23,19,14,0.10)`） |

- **字体**：标题 `'Noto Sans SC','Microsoft YaHei',sans-serif`（用 800/900 粗，
  已安装 `NotoSansSC-VF.ttf` 可变字体）；数字/标签 `'Cascadia Code','Consolas',monospace`（数字要 mono，等宽才有数据感）。
- **字号层级（1080 宽）**：巨型数字 150~230px；主标题 82~104px；卡片标题 44~52px；
  正文 30~36px；mono 标签 24~28px；**全片最小字号 ≥26px**（抖音手机端可读）。
- **安全区**：左右边距 76px；底部 250px 不放关键信息（抖音评论/按钮遮挡）；顶部 56px 为品牌行。
- **质感**：纸纹（极淡）+ 网点（极淡）+ 轻暗角（透明度 ≤0.10）；**禁止**发光/霓虹/扫描线/星空。
- **配色纪律**：EV 恒为绿、FUEL 恒为棕，全片不得互换；橙红只用于「里程碑/代价/警示」，
  黄色只作马克笔高亮。

### 动效语言（全部由 `useCurrentFrame` 驱动，禁止 Math.random / Date / CSS animation）
- **数字滚动（odometer）**：所有百分比/万辆数字 0→目标值滚动，末位带滚动模糊感；里程碑处数字回弹一次。
- **曲线绘制**：`strokeDashoffset` 逐点绘出 + 面积渐显 + 当前点脉冲圆环。
- **100 格剖分图**：小方块逐格弹入（stagger 0.6 帧/格），颜色由 FUEL_SOFT→EV_SOFT 过渡，
  数字同步跳动（6 → 68）。
- **印章/贴纸**：scale 1.6→1 + rotate -8°→-4° + 轻微纸感阴影，落章瞬间全屏闪白 3 帧。
- **马克笔高亮**：宽度 0→100% 从左扫出（圆头笔触）。
- **卡片入场**：spring 上浮 + 硬投影随位移收拢；错帧 4~6 帧。
- **转场**：纸页横推（whip + 轻微运动模糊）、上翻（slideUp）、硬切、放大出画；
  片尾 12 帧淡出。允许页尾 6 帧下一次页主题色闪色（flash）。
- **运镜**：缓推 1.00→1.05、缓拉、左右轻摇（幅度 ≤54px）；不要炫技乱飞。
- **节拍**：可读取 BGM 拍点做 1~2% 的脉冲微动效（`useBeat` 思路，periodFrames=16，112BPM@30fps）。

---

## 2. 叙事结构（12 镜，目标总长 70~78s；前 3 秒必须出钩子）

> 核心洞察（保留率发动机）：**新车市场电车已占 2/3，但把路上跑的车全算上，电车还只占 1 成多。**
> 这个「认知反转」放在第 9 镜，作为二次钩子把观众留到结尾。

| # | id / kind | 画面 | 口播（draft，数字以数据核实为准） |
|---|---|---|---|
| 1 | `cover` | 巨型标题「油车，输了吗？」+ 一行副标「中国车市 近 5 年大逆转」+ 100 格剖分缩略 | 五年前，一百个买车的人里，只有六个选了电车。 |
| 2 | `split` | 100 格剖分图：6 绿/94 棕 → morph 到 68 绿/32 棕，中间大数字 6% → 68% | 今年十月，是一百个人里，六十八个。 |
| 3 | `trend` | 主曲线图（2021→2026.10，渗透率折线 + 面积 + 年份刻度 + 里程碑点），游标数字滚动 | 这条线，就是中国车市这五年最猛的一次翻盘。 |
| 4 | `steps` | 5 张年度台阶卡：15% / 28% / 36% / 48% / 57%（2021→2025），逐卡跳动 | 二一年一成半，二二年近三成，二三年三成半，二四年快一半。（数字以核实为准，可压缩） |
| 5 | `cross` | 交叉点特写：EV 线与 FUEL 线相交，竖虚线 + 印章「首次单月过半 · 2024.07」 | 二四年七月，电车单月销量第一次超过油车。 |
| 6 | `year2025` | 2025 全年成绩单：57% 大数字 + 全年零售量 + 「第一次全年过半」贴纸 | 去年，电车第一次成为新车市场的多数派。 |
| 7 | `reasons` | 3 张原因卡（自绘图标：免税单 / 油枪 / 价签） | 为什么这么快？三个原因：免税、油价、和越打越低的价格。 |
| 8 | `bars` | 年度新能源零售销量条形（110 → 1200 万辆级），数字逐条滚动 | 新能源零售，从一百一十万辆，涨到一千万辆以上。 |
| 9 | `stock` | **反转**：全国汽车保有量 vs 新能源保有量（大数字 + 10 格点阵「9 格油车」） | 但把路上跑的车全算上，十台里只有一台是电车。 |
| 10 | `cost` | 电车代价 3 卡：保值率 / 保险 / 充电条件（中性、不劝退不吹） | 电车也不是没代价：保值率、保费、充电条件，都得算进去。 |
| 11 | `outlook` | 结论页：油电共存（左右分栏对照 + 「共存」印章） | 油车不会消失，它只是从主角，变成了配角。 |
| 12 | `outro` | 互动收尾：提问 + 关注引导（大字） | 你下一辆，买油还是买电？评论区聊聊。 |

**文案纪律**
- 每镜口播 ≤ 30 字（edge-tts 云健 +12% 约 5.2 字/秒，30 字≈5.8s）。
- 前 3 秒必须出现「电车/油车」+ 一个反差数字；禁用「大家好/今天我们来聊聊」。
- 所有数字必须能追溯到 `briefs/auto-trend-facts.md`；不确定的数字宁可不出现。
- 口径必须统一：**乘联分会（CPCA）新能源乘用车「零售」口径渗透率**为主；
  若出现中汽协口径（批发/总销量）必须标注，且不与零售口径混用。
- 不写投资/购车建议结论，不做品牌拉踩。

---

## 3. 数据契约（props.json，后端生成，Remotion 消费）

```jsonc
{
  "brand": "VIBE 知识大赏",
  "tag": "// DATA LAB",
  "bgm": { "src": "bgm/vibe_we_never.mp3", "volume": 0.62, "bpm": 112.3 },
  "narrationAudio": { "src": "voice/projects/auto-market-trend/narration.wav", "volume": 1 },
  "slides": [
    {
      "id": "trend", "kind": "trend",
      "kicker": "02 · 五年曲线", "title": ["五年，从 6% 到 68%"], "sub": "乘联分会 · 新能源乘用车零售渗透率",
      "accent": "#0E9F6E",
      "caption": "这条线，就是中国车市这五年最猛的一次翻盘。",
      "emphasis": ["5.8%", "67.8%"], "narration": "同 caption",
      "narrationSec": 4.32, "durationFrames": 168,
      "enter": "slideUp", "exit": "up", "cam": "pushSlow", "flash": false,
      "payload": { "points": [{"year": "2021", "ev": 14.8}, …], "source": "乘联分会（CPCA）", "note": "零售口径" }
    }
  ]
}
```

### `AutoSlide`
- `id: string`、`kind: SlideKind`（见下）、`kicker?`、`title: string[]`（1~2 行，逐字弹入）、`sub?`
- `accent: string`（HEX）、`caption: string`（底部字幕，与旁白一致）、`emphasis?: string[]`（字幕高亮词）
- `narration: string`（生成 TTS 用，渲染不用）、`narrationSec?: number`（BGM 闪避窗口用）
- `durationFrames: number`（后端按实测配音 + 拍点锁给）
- `enter: "zoom"|"bounce"|"slideUp"|"slideLeft"|"slideRight"|"whip"|"flip"|"pop"`
- `exit: "up"|"down"|"left"|"right"|"zoomOut"|"none"`
- `cam: "pushIn"|"pushSlow"|"pullOut"|"panLeft"|"panRight"|"rock"|"whipR"|"hold"`
- `flash?: boolean`、`payload?: AutoPayload`

### `SlideKind`
`cover | split | trend | steps | cross | year2025 | reasons | bars | stock | cost | outlook | outro`

### `AutoPayload`（所有字段可选，按镜取用）
```ts
interface TrendPoint { year: string; ev: number; fuel?: number; label?: string; major?: boolean }
interface StatItem   { label: string; value: string; unit?: string; tone?: "ev" | "fuel" | "accent" | "ink"; note?: string }
interface BarItem    { label: string; value: number; unit?: string; tone?: "ev" | "fuel" | "accent"; note?: string }
interface ReasonCard { title: string; text: string; icon: "tax" | "oil" | "price" | "plug" | "winter" | "trip" | "resale" | "insurance" | "battery" | "charge" }
interface AutoPayload {
  points?: TrendPoint[];        // trend：折线数据（2021..2026）
  stats?: StatItem[];           // 大数字/统计卡
  bars?: BarItem[];             // bars：条形图
  reasons?: ReasonCard[];       // reasons/cost/stock：卡片
  dots?: { ev: number; total?: number };      // split/stock：100 格剖分（ev=绿色格数）
  big?: { value: string; unit?: string; label?: string; sub?: string };  // 巨型数字
  note?: string;                // 屏内口径注脚（如「零售口径」「含出口」）
  source?: string;              // 数据来源脚注（乘联分会 / 中汽协 / 公安部）
}
```

---

## 4. 工程规范

### Remotion 端（viz-builder 负责；写 `D:\Work\remotion-life-sim\src\vibe-auto\`）
- 新组合 id：**`AutoTrendVibe`**，1080×1920@30，`calculateMetadata` 按 slides 帧数求和。
- 文件划分：`types.ts`（上节契约）、`fx.tsx`（浅色设计系统：PageShell/CaptionBar/Chrome/KineticTitle/
  Kicker/SubLine/FilmGrain/Marker/Odometer/Stamp/DotsGrid/TrendChart 等复用组件）、
  `slides.tsx`（12 个 kind 的场景组件）、`AutoTrendVibe.tsx`（组合：Sequence + BGM 闪避 + 旁白整轨）、
  `data.ts`（Studio 默认 props，便于 `npx remotion still` 直接预览）。
- 在 `src/Root.tsx` 注册（只加一个 Composition，不动既有组合）。
- 严格遵守：确定性渲染（无 random/Date）、`staticFile()` 处理音频、音频不嵌套 Sequence（根级播放）。
- `npx tsc --noEmit` 必须通过（remotion 目录用 `node run-tsc.js`）。

### 后端端（pipeline-builder 负责；写 `backend/tools/run_auto_trend.py`）
- 复制 `run_moneyprinterturbo_vibe.py` 的骨架（剧本表 → TTS → 实测时长 → 拍点锁镜 → 混旁白整轨 → props → 渲染 → 封面/QA 抽帧）。
- PID = `auto-market-trend`，COMPOSITION = `AutoTrendVibe`，VOICE = `zh-CN-YunjianNeural`，RATE = `+12%`。
- 从 `backend/storage/projects/auto-market-trend/research.json` 读取数据并组装每镜 `payload`
  （**数字只从 research.json 来，禁止在 runner 里硬编码数据**）。
- 支持 `--no-render` / `--preview` / `--reuse-voice`。
- 产出：`renders/auto-market-trend/{final.mp4, cover.jpg, preview.mp4, props.json, script.json, publish_copy.json, qa_*.jpg}`。

---

## 5. 验收标准（缺一不可）

1. **数据真实**：每个出现在画面/口播的数字都能在 `briefs/auto-trend-facts.md` 找到来源
   （媒体名 + 日期 + URL），关键数字 ≥2 个独立来源；口径统一（零售 vs 批发分开标注）。
2. **不深色**：全片无深色背景页；抽查帧平均亮度 > 0.55。
3. **动效精美**：趋势曲线绘制、数字滚动、100 格剖分、印章落章、条形生长、
   卡片错帧入场 5 类动效全部出现且不外框。
4. **抖音可读**：最小字号 ≥26px；底部 250px 安全区内无关键信息；抽查帧无越界/重叠。
5. **音频**：成片无 >0.15s 静音段；旁白峰值 ≤0.95；BGM 口播时闪避（0.62→0.33）；
   总时长 70~80s。
6. **工程**：`tsc --noEmit` 通过；后端 pytest 不回归（未改后端代码则仅确认未动）；
   渲染 rc=0；抽帧 QA ≥10 帧人工过目通过。
7. **交付**：`final.mp4` + `cover.jpg` + `publish_copy.json`（抖音标题/话题/简介）+ 事实卡 + 简报。

---

## 6. 来源与素材合规

- 数据来源：乘联分会（原乘联会）官方月度/年度发布经主流媒体转载（第一财经、界面、每经、中新经纬、
  上海证券报、华夏时报等）、中汽协、公安部交管局、中国充电联盟。
- **不下载未授权图片/视频**；画面全部自绘（SVG/Canvas/React），不使用外部照片。
- BGM 沿用系列曲 `vibe_we_never.mp3`（来源与授权口径已记录在 `storage/_vibe_bgm_meta.json`；
  抖音站内发布遵循平台音乐授权范围，站外/商用需自行确认）。
- 片尾/页脚标注数据来源；不出现「投资建议」「购车推荐」类表述。
