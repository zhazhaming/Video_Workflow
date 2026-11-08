# agent-desktop 科普事实卡（抖音竖屏 · 约 80 秒 · 完全小白向）

> 事实基准日：**2026-11-04**（工作区日期）
> 对象：`vercel-labs/agent-desktop`（Vercel Labs 开源产品）
> 用途：给编剧/分镜直接引用短句。每个结论带来源 URL；**文档原文**与**推断**分开标注；无法核实的一律写「未核实」，不进结论。
> 原则：官方 README / agent-browser.dev 文档 / GitHub API / SECURITY.md / npm registry 为准；中文二手文章未采用（准确性未核实）。

---

## 一、一句话定位

**给 AI agent 用的「桌面操作」工具：不截图、不比像素，而是读取操作系统的无障碍树（accessibility tree），把桌面应用的界面变成 JSON + 每个可操作元素的引用（ref）；agent 点一下 ref、再读一遍验证，循环由调用方自己写——它内部没有大模型。**

支撑原文（README / 官方文档）：

- 「agent-desktop gives an AI agent computer use **without screenshots or pixel matching**. It reads the accessibility tree of a desktop app and returns it as JSON, with a ref for every element the agent can act on.」——文档原文（README）
- 「The loop lives in your agent; **agent-desktop has no model inside**. It ships as a CLI and a C library.」——文档原文（README）
- 「**It is not an agent.** The observe, act, and verify loop lives in the calling agent or script.」——文档原文（[Introduction](https://agent-browser.dev/desktop)）
- 「**No model inside.** It never embeds an LLM, has no GUI, and has no interactive prompt. Every command prints one JSON envelope and exits.」——文档原文（Introduction）
- 「**Desktop apps only.** It does not automate web pages; use agent-browser for those.」——文档原文（Introduction）
- 「**Limited to what apps expose.** It reads accessibility trees and does not match pixels, so it cannot see a UI that publishes no accessibility tree.」——文档原文（Introduction）

来源：
<https://raw.githubusercontent.com/vercel-labs/agent-desktop/main/README.md> ·
<https://agent-browser.dev/desktop>

---

## 二、关键数字表

| 项目 | 数值 | 来源 | 标注 |
|---|---|---|---|
| GitHub Star | **13249**（GitHub API 2026-11-04 快照；同日复测 API 返回 13252，实时浮动） | [GitHub API](https://api.github.com/repos/vercel-labs/agent-desktop) | 文档原文·快照值 |
| Fork 数 | **912** | GitHub API | 文档原文 |
| 开源许可证 | **Apache-2.0** | GitHub API、README「License」、npm registry | 文档原文 |
| 主要语言 | **Rust** | GitHub API `language` | 文档原文 |
| 仓库创建时间 | **2026-02-19**（UTC `2026-02-19T18:00:49Z`） | GitHub API `created_at` | 文档原文 |
| 命令数量 | **60 个命令名，其中 56 个可操作命令**；另 4 个（key-down / key-up / mouse-down / mouse-up）在守护进程能释放按键前拒绝执行 | README「Commands」 | 文档原文 |
| 命令分组 | **11 组**（App/窗口、观察、交互、滚动、键盘、鼠标、通知、剪贴板、等待、系统、批量） | [Commands](https://agent-browser.dev/desktop/commands) | 文档原文 |
| 支持的平台 | **3 个**：macOS / Windows / Linux | README、Introduction | 文档原文 |
| macOS 最低版本 | **macOS 13 或更高**，Intel 或 Apple Silicon | README、[macOS 页](https://agent-browser.dev/desktop/platforms/macos) | 文档原文 |
| Windows 最低版本 | **Windows 10 1809 或更高**（或 Windows Server 2019+），x64 或 ARM64 | README、[Windows 页](https://agent-browser.dev/desktop/platforms/windows) | 文档原文 |
| Linux 最低版本 | **Ubuntu 24.04 或更高**（x86_64 / aarch64，glibc 2.35），需运行中的 AT-SPI 总线 | README、[Linux 页](https://agent-browser.dev/desktop/platforms/linux) | 文档原文 |
| 三大平台的无障碍 API | macOS = **AX API**；Windows = **UI Automation**；Linux = **AT-SPI** | README、Introduction | 文档原文 |
| JSON 输出契约版本 | **2.6**（每条命令只打印一个 JSON 信封） | README 示例、[JSON output](https://agent-browser.dev/desktop/json-output) | 文档原文 |
| C 库 ABI 版本 | **7**（`AD_ABI_VERSION_MAJOR = 7`） | [C library](https://agent-browser.dev/desktop/ffi) | 文档原文 |
| npm 包（抓取时最新） | **agent-desktop 1.1.0**，Apache-2.0，`engines.node >= 18`，native 覆盖 darwin/win32/linux × arm64/x64 | [npm registry](https://registry.npmjs.org/agent-desktop/latest) | 文档原文·抓取时点值 |
| 原生二进制目标数 | **6 个**（macOS arm64/x64、Linux x64/arm64、Windows x64/arm64） | [Installation](https://agent-browser.dev/desktop/installation) | 文档原文 |
| 创建至今时长 | 约 **8 个多月**（2026-02-19 → 2026-11-04） | 由创建时间计算 | **推断**（不要当官方数字） |

> 字幕建议：star 用「**1.3 万+**」最稳，精确值可能因实时增长而变。

---

## 三、使用步骤（可直接改写成 80 秒脚本的骨架）

### 3.1 安装（一条命令）

```bash
npm install -g agent-desktop     # macOS / Windows / Linux 通用
agent-desktop status             # 看平台、权限、支持的界面类型
agent-desktop permissions --guide  # macOS：引导你去开辅助功能授权
```

- npm / pnpm / Yarn / Bun 都能装；需要 **Node 18 或更高**，包内含 x64 与 ARM64 的原生二进制和平台助手。——文档原文（[Installation](https://agent-browser.dev/desktop/installation)）
- macOS 和 Linux 也可 **`brew install agent-desktop`**；**没有官方 Scoop 包**（README 原文）。——文档原文（README）
- 安装脚本被包管理器拦截时，Node 启动器仍可用，但每次调用要先启动 Node，**多 100ms 以上**。——文档原文（Installation）

### 3.2 权限（决定能不能用）

| 平台 | 需要什么 | 来源 |
|---|---|---|
| macOS | **辅助功能（Accessibility）**授权给「启动 agent-desktop 的那个 App」（如终端、iTerm2、VS Code、agent 宿主）；`screenshot` 另需**屏幕录制**；Automation 只在命令报缺时给 | [macOS 页](https://agent-browser.dev/desktop/platforms/macos) |
| Windows | **没有授权弹窗**，靠完整性级别：普通 App 无需授权；管理员权限的 App 无法从低权限终端操作（UIPI 拦截，报 `PERM_DENIED`） | [Windows 页](https://agent-browser.dev/desktop/platforms/windows) |
| Linux | 无授权弹窗，**AT-SPI 总线（at-spi2-core）**是否响应决定一切；用 `status` 检查 | [Linux 页](https://agent-browser.dev/desktop/platforms/linux) |

- macOS 授权属于「启动它的 App」，**换个终端就要重新授权**；授权后不需要重启 App。——文档原文（macOS 页）
- `agent-desktop permissions` 只检查、不弹窗；`--guide` 才打开系统设置并高亮缺失项；`--request` 是唯一会弹「Automation」授权的路径。——文档原文（macOS 页）

### 3.3 观察：快照拿到 refs

```bash
agent-desktop snapshot --app Finder -i      # -i 只要可交互元素，每个元素带一个 ref
```

返回一个 JSON 信封（节选，README 原文）：

```json
{
  "version": "2.6",
  "ok": true,
  "command": "snapshot",
  "data": {
    "app": "Finder",
    "snapshot_id": "s8f3k2p9",
    "ref_count": 59,
    "complete": true,
    "tree": {
      "role": "window",
      "name": "Downloads",
      "children": [
        { "role": "treeitem", "name": "Documents", "ref_id": "@s8f3k2p9:e8", "available_actions": ["Click"] }
      ]
    }
  }
}
```

- **ref 一定带快照 id**：`@s8f3k2p9:e8`。裸写 `@e8` 会报 `INVALID_ARGS`。——文档原文（README、[Snapshots and refs](https://agent-browser.dev/desktop/snapshots-and-refs)）
- 复杂应用先 `--skeleton` 看三层骨架，再用 `--root` 钻进去，省时间。——文档原文（[Quick start](https://agent-browser.dev/desktop/quick-start)、Introduction）
- PowerShell 里 ref 必须加单引号（裸 `@` 是 splatting 操作符，会被吞掉）。——文档原文（README、Windows 页）

### 3.4 操作：click / type

```bash
agent-desktop click @s8f3k2p9:e8
```

- 默认 **headless（无头）**：不移动鼠标指针、不切换焦点，直接用无障碍接口触发。——文档原文（README）
- 加 `--headed` 才走**物理输入**：真实点击、真实按键、真实滚轮。部分命令（`hover` / `drag` / `mouse-move` / `mouse-click` / `mouse-wheel` / `triple-click`，及部分平台的 `double-click`）**只在 `--headed` 下可用**，无头时报 `POLICY_DENIED`。——文档原文（README、各平台页）
- Windows 的 `type` 需要 `--headed`；无头写文本用 `set-value`。Linux Wayland 的指针手势与窗口控制多为 `ACTION_NOT_SUPPORTED`。——文档原文（Windows 页、Linux 页）

### 3.5 验证：再读一遍

```bash
agent-desktop snapshot --app Finder -i
# 或等待某个元素出现/读值变化
agent-desktop wait --element @s2txcl95uvubmn:e6 --predicate value --value 7
```

- **`ok: true` 不证明界面真的变了**：命令可能返回成功但 App 实际没动作；要用 `get` / `is` / 再 `snapshot` 读回来确认。——文档原文（[JSON output](https://agent-browser.dev/desktop/json-output)、macOS 页）

### 3.6 错误处理：什么时候能重试

- 失败时打印 `ok: false` 信封，退出码 `1`（解析错误 `2`）。——文档原文（[Errors and recovery](https://agent-browser.dev/desktop/errors-and-recovery)）
- 常见结果：
  - `STALE_REF`（ref 已失效）、`AMBIGUOUS_TARGET`（多个元素/窗口匹配，拒绝猜）→ **重新 snapshot，用新 ref**。
  - `SNAPSHOT_NOT_FOUND` → 在同一 session 里重新快照。
  - `PERM_DENIED` → 去补权限。
- **只有 `error.disposition.retry` 是 `safe` 才可重试**；`unsafe` / `unknown` 必须先观察界面再决定。盲目重试 `click` 可能提交两次，重试 `toggle` 可能把自己撤销。——文档原文（Errors and recovery）
- 官方定义 16 个错误码；`recovery` 字段只在「重试安全」时才出现。——文档原文（Errors and recovery）

### 3.7 接入 Agent：MCP

```bash
agent-desktop mcp        # 用 stdio 起一个 MCP server
```

客户端配置（README 原文）：

```json
{ "mcpServers": { "agent-desktop": { "command": "agent-desktop", "args": ["mcp"] } } }
```

- 每条命令就是一个 MCP 工具，命名规则 `desktop_` + 命令名（`desktop_snapshot`、`desktop_click`、`desktop_session_start`），参数即命令参数。——文档原文（README、[MCP 指南](https://agent-browser.dev/desktop/guides/mcp)）
- 给 `mcp` 的全局参数（如 `--session`、`--headed`、`--trace`）对每次调用都生效；单次工具调用不能改全局参数。——文档原文（MCP 指南）

### 3.8 C 库（进阶，视频可不展开）

- 每次 release 单独提供 `libagent_desktop_ffi`（macOS `.dylib`、Linux `.so`、Windows `.dll`），任何有 C FFI 的语言都能调；**不在 npm 包里**。——文档原文（README、[C library](https://agent-browser.dev/desktop/ffi)）
- 加载后先 `ad_init(7)`，ABI 大版本不匹配直接返回错误，别的都别调。——文档原文（C library）

---

## 四、注意事项（分级）

### 4.1 必须知道（讲错会被懂行的人挑）

1. **它不是 agent，也没有内置模型。** 它只提供「看界面 + 操作界面」的能力，观察-操作-验证的循环要由调用它的 agent 或脚本自己写。来源：README、Introduction。
2. **它是读无障碍树，不是截图识别。** 所以：没有无障碍树的界面（自绘 UI、游戏画面、Canvas）它看不到；也不做像素匹配。来源：README、Introduction。
3. **它只管桌面应用，不管网页。** 网页用同门 `agent-browser`；对于它能启动的 Chromium/Electron 应用，可以开 DevTools 端口交给 agent-browser 接管网页内容。来源：Introduction、macOS/Windows 页。
4. **ref 必须带快照 id。** `@s8f3k2p9:e8` 合法，`@e8` 报 `INVALID_ARGS`。来源：README。
5. **UI 一变旧 ref 就作废。** `STALE_REF` / `AMBIGUOUS_TARGET` 时重新快照，不能硬点。来源：README、Errors and recovery。
6. **只有 `disposition.retry == safe` 才能重试。** 这是官方写进 JSON 的「安不安全重试」字段。来源：Errors and recovery。
7. **4 个命令永远拒绝执行**：`key-down`、`key-up`、`mouse-down`、`mouse-up`（要等守护进程能释放按住的键/按钮才放开），属于「故意 fail closed」。来源：README、Commands。
8. **macOS 必须给「启动它的 App」辅助功能授权**；Windows 没有授权弹窗但受完整性级别限制；Linux 要有 AT-SPI 总线 + 图形会话。来源：各平台页。

### 4.2 风险（做视频要说人话提醒）

1. **隐私**：快照、剪贴板读取、截图、命令输出、调试产物都可能包含桌面私密内容；**不要进公开日志、不要上传**。——文档原文（README 开头）。
2. **MCP server 等于给 AI 一个 shell**：工具能操作无障碍树暴露的任何 App，`desktop_launch` 能启动 PATH 上任何程序；而且**从屏幕上读到的文本对模型来说是不可信输入**（可能被当成指令）。——文档原文（MCP 指南 Security 段）。
3. **Windows 二进制未签名**：SmartScreen 会警告、杀软可能隔离、干净的 Win11 上 Smart App Control 会直接拦。——文档原文（Windows 页）。
4. **高危按键默认被拒**：`cmd+q`、`alt+f4`、`win+l`、`alt+tab` 等不给 `--force` 就 `POLICY_DENIED`；`ctrl+alt+delete` 根本无法合成。——文档原文（macOS/Windows 页）。
5. **不要用「重试」掩盖错误**：`click` 重复会提交两次，`toggle` 重复会撤销。先观察再动作。——文档原文（Errors and recovery）。
6. **安全漏洞走私报**：走 GitHub 私密漏洞报告，不要开公开 issue；范围含 CLI、npm 安装器、FFI 边界、release 产物、CI、平台适配层。——文档原文（[SECURITY.md](https://raw.githubusercontent.com/vercel-labs/agent-desktop/main/SECURITY.md)）。
7. **权限最小化**：只给需要的授权；macOS 屏幕录制只在要 `screenshot` 时给。——文档原文（macOS 页）。

---

## 五、应用场景（只写文档能支持的，不臆造）

| 场景 | 用到的能力（官方命令/机制） | 标注 |
|---|---|---|
| 重复桌面操作（反复点同一批按钮、填同一张表） | `snapshot` + `click` / `type` / `set-value` 循环 | 文档支持（README、Commands） |
| 跨 App 数据搬运 | `clipboard-get` / `clipboard-set` + ref 操作 | 文档支持（README 命令表） |
| QA / 回归测试 | 快照树可当断言对象；`get` / `is` / `wait` 读状态 | **推断**（官方定位是 agent 工具，未明说 QA） |
| 老软件自动化 | 读系统无障碍树，不依赖 App 自带 API | **推断**（官方只说读无障碍树） |
| 通知 / 窗口管理 | `list-notifications` / `dismiss-notification` / `list-windows` / `focus-window` / `resize-window` | 文档支持（Commands） |
| 剪贴板操作 | `clipboard-get` / `clipboard-set` / `clipboard-clear` | 文档支持（Commands） |
| 接入 AI Agent / MCP 客户端 | `agent-desktop mcp`（所有命令变工具） | 文档支持（README、MCP 指南） |
| **不适合**：网页自动化 | 官方明确：网页用 agent-browser | 文档原文（Introduction） |
| **不适合**：无无障碍树的 UI（游戏、自绘画布） | 官方明确：看不到不发布无障碍树的 UI | 文档原文（Introduction） |

---

## 六、事实来源清单

| # | 来源 | 核实的内容 |
|---|---|---|
| 1 | <https://raw.githubusercontent.com/vercel-labs/agent-desktop/main/README.md> | 定位、无截图/无像素、无内置模型、CLI + C 库、安装命令、snapshot/click 示例、ref 规则、60/56/4 命令、平台矩阵、MCP 配置、隐私提醒、Apache-2.0 |
| 2 | <https://api.github.com/repos/vercel-labs/agent-desktop> | star 13252（抓取时）、fork 912、Rust、Apache-2.0、创建时间 2026-02-19、149 open issues、topics |
| 3 | <https://agent-browser.dev/desktop> | 不是 agent、无模型、无 GUI、只做桌面、不匹配像素、平台支持表、四步循环（skeleton → drill → click → wait） |
| 4 | <https://agent-browser.dev/desktop/snapshots-and-refs> | 快照=一次无障碍树观察、ref 带 snapshot id、JSON 示例 |
| 5 | <https://agent-browser.dev/desktop/commands> | 60 命令 / 11 组、逐条命令说明、4 个保留命令 fail closed |
| 6 | <https://agent-browser.dev/desktop/errors-and-recovery> | 16 个错误码、STALE_REF / AMBIGUOUS_TARGET 处理、disposition.delivery/retry 表、recovery 策略、退出码 1/2 |
| 7 | <https://agent-browser.dev/desktop/installation> | Node ≥ 18、npm/pnpm/Yarn/Bun、6 个原生目标、brew、无 Scoop、postinstall 影响、release 校验 |
| 8 | <https://agent-browser.dev/desktop/json-output> | 单一 JSON 信封、version 2.6、ok/data/error 字段、`ok:true` 不等于效果发生 |
| 9 | <https://agent-browser.dev/desktop/ffi> | C 库文件名、ABI 7、ad_init(7)、CLI/库共用 core 与 ref、npm 包不含 C 库 |
| 10 | <https://agent-browser.dev/desktop/platforms/macos> | macOS 13+、辅助功能/屏幕录制/Automation 权限、授权属于启动 App、headless 与 --headed 差异、高危按键拒绝 |
| 11 | <https://agent-browser.dev/desktop/platforms/windows> | Win10 1809+/Server 2019+、无授权弹窗、完整性级别/UIPI、未签名 SmartScreen、PowerShell 引号、headless `type` 需 `--headed` |
| 12 | <https://agent-browser.dev/desktop/platforms/linux> | Ubuntu 24.04+、AT-SPI 总线、glibc 2.35、X11/Wayland 差异、Wayland 窗口控制不支持 |
| 13 | <https://agent-browser.dev/desktop/guides/mcp> | MCP 工具命名、全局参数、并发 8 / 消息 4MiB、安全警告（等同 shell、屏幕文本不可信） |
| 14 | <https://raw.githubusercontent.com/vercel-labs/agent-desktop/main/SECURITY.md> | 私密漏洞报告、覆盖范围（CLI/npm 安装器/FFI/release/CI/适配层） |
| 15 | <https://registry.npmjs.org/agent-desktop/latest> | 版本 1.1.0、Apache-2.0、Node ≥18、os/cpu 矩阵、provenance 签名 |
| 16 | <https://agent-browser.dev/desktop/quick-start> | status/skills、skeleton 快照、ref 示例、等待验证 |

### 6.3 不确定 / 未核实项（不进结论，编剧注意）

1. **star 数有 3 个的差值**：任务给的 2026-11-04 快照是 **13249**，本次抓 API 返回 **13252**。star 实时变动，视频用「**1.3 万+**」最稳。来源 2。
2. **npm 版本号 1.1.0 是抓取时点的最新版**，之后可能更新；视频不必报版本号。来源 15。
3. **「8 个多月 / 半年多」是计算推断**，官方只给创建时间。用的话标「推断」。来源 2。
4. **腾讯云/CSDN 等中文二手文章未采用**：未核实其准确性，本卡所有结论均回到官方来源。若编剧引用中文文章里的数字，需回到本卡来源表核对。
5. **别把「Vercel Labs 产品」说成「Vercel 正式产品」**：仓库属于 `vercel-labs` 组织，README badge 写 "LABS PRODUCT"（实验室产品）。来源 1。
6. **「56 个可操作命令」是 README 原文**；Commands 页写「60 commands in 11 groups」。上字幕建议简化成「**60 个命令**」，避免 56/60 的歧义。来源 1、5。
7. **没有官方性能数字**（速度、省多少 token、成功率）：未核实，不要编造对比数字。
8. **各平台能力细节**以平台页为准（例如 macOS 无头 `double-click` 仅在元素支持 `AXOpen` 时可用；Linux Wayland 窗口控制不支持）。视频不必展开，但口播别说「三平台完全一样」。

---

## 七、给视频脚本的 10 条金句素材（每条 ≤20 字，中文口语，不夸大）

1. 让 AI 看懂桌面应用：不截图，读界面结构
2. Vercel 实验室开源，Rust 实现
3. 1.3 万 star，全部代码开源
4. 六十个命令，一次一个 JSON 结果
5. 每步先快照，拿到 ref 再点击
6. 默认不抢鼠标键盘，安静操作
7. macOS 要开辅助功能权限才能用
8. 界面一变，旧 ref 就失效，要重拍快照
9. 快照和剪贴板可能带隐私，别传上网
10. 它不会自己思考，只是 AI 的手和眼

> 用法建议：第 1、10 条做开篇定位与收尾边界；第 3 条配 star 数字动效；第 4、5 条讲机制；第 6、7、8 条讲使用与坑；第 9 条做安全提醒。所有短句都能在第二节/第四节找到对应来源，未使用「全自动」「取代人类」「零门槛」等夸大词。
