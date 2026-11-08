# -*- coding: utf-8 -*-
"""AI 现场编写场景（v1）：分镜关键节拍 → 本地 coding agent 无头编写 Remotion 组件
→ 闸门校验（tsc + still 抽帧）→ 修复循环（≤2 轮）→ 重写注册表 → 把
"gen:<pid>:<NN>" 场景写进导演方案对应镜头。

任何失败只影响定制场景本身（回退内置词库 / 渐变底），绝不阻塞出片。
Agent 通过 GEN_AGENT_CMD 指定（默认自动探测 zcode → claude → command-code），
提示词经 stdin 传入，工作目录固定为 Remotion 项目根。
"""
import json
import os
import re
import shutil
import subprocess
from pathlib import Path

from ..config import REMOTION_DIR, RENDERS_DIR
from ..schemas import RenderProps, RenderShot, ScriptDraft, SceneSpec, TimedLine
from . import director, llm, renderer

GEN_DIR = REMOTION_DIR / "src" / "gen"
TSC_TIMEOUT = 300
STILL_FRAMES = (72, 180)  # 单镜 8 秒 props 的 30% / 75% 进度处
MIN_STILL_BYTES = 8 * 1024

AGENT_TIMEOUT = int(os.getenv("GEN_AGENT_TIMEOUT", "900"))
AGENT_CANDIDATES = ("zcode", "claude", "command-code", "commandcode")
_PERMISSION_MODES = {"claude": "acceptEdits", "command-code": "acceptEdits", "commandcode": "acceptEdits"}


def _resolve_dsh() -> str | None:
    """定位 DeepSeek Harness 的 dsh.cmd（桌面版安装后 CLI 不一定在 PATH 里）。"""
    found = shutil.which("dsh")
    if found:
        return found
    bases = [
        Path(os.getenv("LOCALAPPDATA", "")) / "Programs" / "dsh-desktop",
        Path(os.getenv("ProgramFiles", "")) / "dsh-desktop",
        Path("D:/software/dsh-desktop"),
        Path("C:/software/dsh-desktop"),
    ]
    for base in bases:
        cand = base / "resources" / "runtime" / "cli" / "bin" / "dsh.cmd"
        if cand.exists():
            return str(cand)
    return None


def _detect_agent() -> tuple[str, str]:
    """返回 (可执行名或完整路径, 模式标记)；GEN_AGENT_CMD 优先，否则自动探测。"""
    forced = os.getenv("GEN_AGENT_CMD", "").strip()
    if forced:
        if forced.lower() == "dsh":
            resolved = _resolve_dsh()
            if not resolved:
                raise RuntimeError(
                    "GEN_AGENT_CMD=dsh 但未找到 dsh.cmd（找过 PATH 与常见安装位置），"
                    "确认 DeepSeek Harness 已安装，或在 .env 直接写 dsh.cmd 完整路径"
                )
            return resolved, "headless"
        return forced, _PERMISSION_MODES.get(forced.lower(), "yolo")
    for name in AGENT_CANDIDATES:
        if shutil.which(name):
            return name, _PERMISSION_MODES.get(name, "yolo")
    raise RuntimeError(
        "未找到可用的本地 agent CLI（zcode/claude/command-code/dsh），"
        "可在 backend/.env 配置 GEN_AGENT_CMD"
    )


def _slug_of(pid: str, index: int) -> str:
    return f"gen:{pid}:{index:02d}"


def _drop_scenes(pid: str, slugs: list[str]) -> None:
    """删除未通过校验的场景文件（tsc 全项目编译，坏文件会连累后续所有批次）。"""
    for slug in slugs:
        nn = slug.split(":")[-1]
        (GEN_DIR / pid / f"Scene{nn}.tsx").unlink(missing_ok=True)


# ---------- 节拍挑选 ----------

def _beats_system(count: int) -> str:
    dense = count > 6
    return f"""你是动效导演，为一条竖屏知识科普视频挑选适合"代码现场编写定制动画场景"的关键节拍。

只输出 JSON，不输出任何其他文字：
{{"beats": [{{"shot_index": 1, "title": "节拍名（≤8字）",
  "idea": "画面创意（≤70字，具体可视：主体是什么、如何运动、随时间怎么变化）",
  "motion": "动效手法（≤20字，如 粒子汇聚/几何裂变/线条生长）"}}]}}

规则：
1. 挑 {count} 个节拍（{'覆盖全片每一幕的叙事节拍' if dense else '开头钩子 / 核心比喻 / 高潮反转 / 结尾落点，跳过平淡过渡'}）
2. 创意必须能用程序图形表达（粒子/几何/图形隐喻/抽象动态），不要真实人脸、照片级细节
3. shot_index 从 1 开始、必须在分镜范围内、彼此不重复{'；幕数密集时相邻幕允许连排，但创意手法必须彼此不同' if dense else '；各节拍彼此错开不相邻'}
4. 15 个场景要像一套"定制词库"：手法/视觉母题尽量多样（粒子、线条、几何、图表、符号……不要同一种手法用两遍）
5. 只输出 JSON"""


def pick_beats(
    script: ScriptDraft,
    look: dict,
    model_id: str | None,
    count: int = 3,
    exclude_indices: set[int] | None = None,
) -> list[dict]:
    exclude = {int(i) for i in (exclude_indices or set())}
    lines = []
    for i, s in enumerate(script.shots, 1):
        text = " / ".join(l.text for l in s.lines)
        note = "（已有画面，不要选）" if i in exclude else ""
        lines.append(f"第{i}幕[{s.label}]{note}：{text}")
    user = (
        f"视频标题：{script.title}（共 {len(script.shots)} 幕）\n"
        f"整体风格：{json.dumps(look or {}, ensure_ascii=False)[:200]}\n\n"
        + "\n".join(lines)
        + f"\n\n请挑 {count} 个节拍输出 JSON（不要选标注了「已有画面」的幕）。"
    )
    data = llm._chat_json(model_id, user, 0.6, _beats_system(count))
    n = len(script.shots)
    beats, used = [], set()
    for b in data.get("beats") or []:
        if not isinstance(b, dict):
            continue
        try:
            idx = int(b.get("shot_index"))
        except (TypeError, ValueError):
            continue
        if not (1 <= idx <= n) or idx in used or idx in exclude:
            continue
        used.add(idx)
        beats.append(
            {
                "shot_index": idx,
                "title": str(b.get("title") or "").strip()[:8] or f"节拍{idx}",
                "idea": str(b.get("idea") or "").strip()[:90],
                "motion": str(b.get("motion") or "").strip()[:24],
            }
        )
    beats = beats[: max(1, count)]
    # LLM 常少报：数量不足时用剩余幕自动补齐（保证 gen 覆盖「尽可能多」），
    # 一个都没挑出来时保持空（调用方据此回退）
    if 0 < len(beats) < count:
        for i, s in enumerate(script.shots, 1):
            if len(beats) >= count:
                break
            if i in used or i in exclude:
                continue
            body = "；".join(l.text for l in s.lines)[:70]
            beats.append(
                {
                    "shot_index": i,
                    "title": (s.label or f"节拍{i}")[:8],
                    "idea": f"{s.label}：{body}"[:90],
                    "motion": "按幕意推进",
                }
            )
            used.add(i)
    return beats


# ---------- Agent 提示词 ----------

def build_agent_prompt(
    pid: str,
    beats: list[dict],
    look: dict,
    title: str,
    errors: str = "",
    start_number: int = 1,
    numbers: list[int] | None = None,
) -> str:
    items = []
    for i, b in enumerate(beats, 1):
        nn = numbers[i - 1] if numbers else start_number + i - 1
        items.append(
            f"  {i}. 镜头{b['shot_index']}「{b['title']}」：{b['idea']}（手法：{b['motion']}）→ "
            f"文件 src/gen/{pid}/Scene{nn:02d}.tsx"
        )
    repair = ""
    if errors:
        repair = f"\n【上一轮的问题（必须修复）】\n{errors[:3000]}\n"
    return f"""你是 Remotion 动效工程师，在本项目（竖屏 1080×1920，30fps）为一条知识科普视频《{title}》现场编写定制动画场景。

【任务】为下列 {len(beats)} 个关键节拍各写一个场景组件：
{chr(10).join(items)}
{repair}
【硬性合同（逐条遵守）】
1. 每个组件一个文件：src/gen/{pid}/SceneNN.tsx，export default React.FC<GenSceneProps>；
   类型从 "../types" import {{ GenSceneProps }}；确定性随机 import {{ rand }} from "../../dv/atmosphere"
2. Props 语义：p=本镜进度 0~1（全部动画由 p 驱动，渲染是确定性的）；c1/c2=调色板两色（大面积铺陈）；
   accent=强调色（高亮/发光点缀）；speed=0.5~2 速度微调；seed=确定性随机种子（随机只准用 rand(seed+k) 家族）
3. 画布固定 1080×1920；严禁：Math.random、Date.now、外部网络/图片资源、画面内出现任何文字
4. 动效要有起承转合（入场→展开→收束），p 的前 15% 做入场、后 12% 做收束；至少一个"标志性瞬间"；
   禁止整段匀速循环；禁止紫色渐变与深色底霓虹灯管风格
5. 画面必须丰满有层次：至少 3 层视觉结构（背景氛围层 / 中景主体层 / 前景点缀层），
   禁止大面积空底只摆一两个元素；主体随 p 有明确的形变/位移/生长叙事
6. 性能：粒子/元素数组在组件体一次性预生成（useMemo 或模块内），每帧只做纯计算；总数 ≤ 220
7. 不要改动 src/gen/ 之外的任何文件；不要改 registry.ts（后端校验通过后自动重写）
8. 写完即止：禁止运行 tsc/remotion/校验类命令，禁止读回已写出的文件（后端会统一做类型检查与抽帧校验）

【当前选定风格】{json.dumps(look or {}, ensure_ascii=False)[:300]}"""


def _run_agent(prompt: str, update) -> None:
    exe, mode = _detect_agent()
    env = None
    if mode == "headless":
        # DeepSeek Harness：dsh headless，任务从 stdin 读，写文件默认放行。
        # 路径不能加引号：subprocess shell=True 走 cmd /c 时首尾引号会被剥离。
        cmd = f"{exe} headless"
        # dsh 会读 DEEPSEEK_BASE_URL 改写自己的 API 路由（指向官方域名时 Messages 请求 404），
        # 子进程环境里剔除它，只保留 DEEPSEEK_API_KEY。
        env = {k: v for k, v in os.environ.items() if k != "DEEPSEEK_BASE_URL"}
    else:
        cmd = f'{exe} -p --permission-mode {mode}'
    update(stage="gen", message=f"本地 agent（{exe}）现场编写中，最长 {AGENT_TIMEOUT // 60} 分钟…")
    proc = subprocess.Popen(
        cmd,
        cwd=str(REMOTION_DIR),
        shell=True,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        env=env,
    )
    timed_out = False
    try:
        out, _ = proc.communicate(input=prompt, timeout=AGENT_TIMEOUT)
    except subprocess.TimeoutExpired:
        # Windows：shell=True 时直接 kill 只杀得到 cmd.exe，孙进程（agent）会继续
        # 占着管道导致 communicate 永久挂起——必须 taskkill /T 杀整棵进程树
        timed_out = True
        subprocess.run(
            ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
            capture_output=True, timeout=30,
        )
        try:
            proc.communicate(timeout=30)
        except Exception:  # noqa: BLE001
            proc.kill()
    if timed_out:
        raise RuntimeError(f"agent 超时（>{AGENT_TIMEOUT // 60} 分钟），已终止")
    if proc.returncode != 0:
        tail = (out or "")[-300:]
        raise RuntimeError(f"agent 退出码 {proc.returncode}：{tail}")


# ---------- 校验闸门 ----------

def _tsc_check() -> tuple[bool, str]:
    proc = subprocess.run(
        "npx -y -p typescript@5.3.3 tsc --noEmit",
        cwd=str(REMOTION_DIR), shell=True, capture_output=True, text=True,
        encoding="utf-8", errors="replace", timeout=TSC_TIMEOUT,
    )
    out = (proc.stdout or "") + (proc.stderr or "")
    return proc.returncode == 0, out[-2500:]


def _disk_slugs() -> dict[str, list[str]]:
    """扫描 GEN_DIR 下各项目目录里真实存在的场景文件：{pid: [slug, ...]}。"""
    out: dict[str, list[str]] = {}
    if not GEN_DIR.exists():
        return out
    for d in sorted(p for p in GEN_DIR.iterdir() if p.is_dir()):
        nums = sorted(
            int(m.group(1))
            for f in d.glob("Scene*.tsx")
            if (m := re.fullmatch(r"Scene(\d+).tsx", f.name))
        )
        if nums:
            out[d.name] = [f"gen:{d.name}:{n:02d}" for n in nums]
    return out


def write_registry(pid: str, slugs: list[str]) -> None:
    """按通过校验的组件重写注册表（只引用确定存在的文件，保证 tsc 不因缺文件而挂）。

    合并磁盘上所有项目的场景——A 项目重写时不得抹掉 B 项目；组件名带 pid 前缀防撞名。
    """
    merged = {p: list(s) for p, s in _disk_slugs().items()}
    merged[pid] = sorted(set(slugs))
    imports: list[str] = []
    body: list[str] = []
    for p, sl in merged.items():
        for slug in sl:
            nn = slug.split(":")[-1]
            # TS 标识符不允许连字符：pid 里的非字母数字统一转下划线
            comp = "Scene_" + re.sub(r"[^A-Za-z0-9_]", "_", p) + f"_{nn}"
            imports.append(f'import {comp} from "./{p}/Scene{nn}";')
            body.append(f'  "{slug}": {comp},')
    content = (
        "// AI 现场编写场景注册表（由后端 gen_scenes 服务自动重写，勿手改）\n"
        'import type { GenSceneComponent } from "./types";\n'
        + ("\n".join(imports) + "\n" if imports else "")
        + "export const GEN_SCENES: Record<string, GenSceneComponent> = {\n"
        + ("\n".join(body) + "\n" if body else "")
        + "};\n"
    )
    GEN_DIR.mkdir(parents=True, exist_ok=True)
    (GEN_DIR / "registry.ts").write_text(content, encoding="utf-8")


def _still_check(pid: str, slug: str, look: dict) -> tuple[bool, str]:
    """用单镜 props 渲 2 帧 still 验证组件真实可渲染。"""
    palette = tuple((look.get("palette") or ["#141b3a", "#2a3a6a"])[:2])
    accent = look.get("accent") or "#FFD166"
    scene = {"kind": slug, "palette": list(palette), "accent": accent}
    props = RenderProps(
        title="校验",
        title_card=False,
        shots=[
            RenderShot(
                colors=palette,
                lines=[TimedLine(id="s01_0", text="场景校验", duration_sec=8.0, pause_after=0.2)],
                tail=0.5,
                camera="still",
                enter_transition="dissolve",
                scene=SceneSpec(**scene),
            )
        ],
    )
    render_dir = RENDERS_DIR / pid
    render_dir.mkdir(parents=True, exist_ok=True)
    props_path = render_dir / f"gen_check_{slug.replace(':', '_')}.json"
    props_path.write_text(props.to_props_json(), encoding="utf-8")
    for frame in STILL_FRAMES:
        out = render_dir / f"gen_check_{slug.replace(':', '_')}_{frame}.png"
        rc = renderer.render_still(props_path, frame, out, render_dir / "gen_still.log")
        if rc != 0 or not out.exists() or out.stat().st_size < MIN_STILL_BYTES:
            log = renderer.tail_log(render_dir / "gen_still.log", 8)
            return False, f"still 帧 {frame} 渲染失败（rc={rc}）{log[:200]}"
    return True, ""


def validate_scenes(pid: str, slugs: list[str], look: dict) -> tuple[list[str], dict[str, str]]:
    """tsc + 逐场景 still；返回 (通过列表, {未通过slug: 错误})。"""
    write_registry(pid, slugs)
    ok, tsc_out = _tsc_check()
    errors: dict[str, str] = {}
    if not ok:
        return [], {s: f"tsc 失败：{tsc_out[-400:]}" for s in slugs}
    passed = []
    for slug in slugs:
        good, err = _still_check(pid, slug, look)
        if good:
            passed.append(slug)
        else:
            errors[slug] = err
    return passed, errors


# ---------- 方案落库 ----------

def patch_plan(pid: str, beats: list[dict], ok_slugs: list[str], look: dict) -> int:
    """把通过校验的 gen 场景写进导演方案对应镜头（覆盖该镜原 scene）。"""
    plan = director.load_cached_plan(pid)
    if not plan:
        return 0
    n = len(plan.get("shots") or [])
    scene = {"kind": "", "palette": list(look.get("palette") or []) or None, "accent": look.get("accent")}
    patched = 0
    for i, b in enumerate(beats):
        if i >= len(ok_slugs):
            break
        idx = b["shot_index"] - 1
        if not (0 <= idx < n):
            continue
        item = plan["shots"][idx]
        if not isinstance(item, dict) or not isinstance(item.get("plan"), dict):
            continue
        s = dict(scene)
        s["kind"] = ok_slugs[i]
        item["plan"]["scene"] = {k: v for k, v in s.items() if v}
        patched += 1
    if patched:
        plan.pop("_stats", None)
        director.save_plan(pid, plan)
    return patched


# ---------- 编排入口 ----------

def _next_start_number(pid: str) -> int:
    """扫描已有 SceneNN.tsx，返回下一个可用编号（批量生成时编号接续，不覆盖）。"""
    d = GEN_DIR / pid
    if not d.exists():
        return 1
    max_n = 0
    for f in d.glob("Scene*.tsx"):
        m = re.fullmatch(r"Scene(\d+)\.tsx", f.name)
        if m:
            max_n = max(max_n, int(m.group(1)))
    return max_n + 1


def generate_for_project(
    pid: str,
    script: ScriptDraft,
    look: dict,
    model_id: str | None,
    update,
    count: int | None = None,
    batch_size: int | None = None,
    exclude_indices: set[int] | None = None,
) -> dict:
    """六步流程"写分镜"之后的可选阶段：现场编写关键节拍场景并写回方案。

    count>batch_size 时分多个 agent 会话批量编写（每批独立校验/修复，编号接续），
    失败的批只损失该批场景，其余照常注册。
    """
    count = max(2, min(15, int(os.getenv("GEN_MAX_BEATS", "3") if count is None else count)))
    batch = max(1, min(count, int(os.getenv("GEN_AGENT_BATCH", "5") if batch_size is None else batch_size)))
    update(stage="gen", message="AI 挑选关键节拍…")
    beats = pick_beats(script, look, model_id, count, exclude_indices)
    if not beats:
        return {"ok": False, "reason": "未挑选出可用节拍", "scenes": []}
    try:
        _detect_agent()  # 早失败：没有 CLI 就直接回退
    except RuntimeError as e:
        return {"ok": False, "reason": str(e)[:120], "scenes": []}

    batches = [beats[i : i + batch] for i in range(0, len(beats), batch)]
    all_ok: list[dict] = []  # [{beat, slug}]
    failed: list[str] = []
    start = _next_start_number(pid)
    for bi, chunk in enumerate(batches, 1):
        work = [(b, start + j) for j, b in enumerate(chunk)]  # (beat, 场景编号)
        errors: dict[str, str] = {}
        for rnd in (1, 2):
            nums = [n for _, n in work]
            slugs = [_slug_of(pid, n) for n in nums]
            prompt = build_agent_prompt(
                pid, [b for b, _ in work], look, script.title,
                errors="\n".join(errors.values()) if errors else "",
                numbers=nums,
            )
            update(stage="gen", message=f"agent 现场编写 第{bi}/{len(batches)} 批（{len(work)} 个，第 {rnd} 轮）…")
            try:
                _run_agent(prompt, update)
            except Exception as e:  # noqa: BLE001 — 会话异常不整批作废：写出文件的仍可校验通过
                update(stage="gen", message=f"agent 会话异常（{str(e)[:50]}），只校验已写出的文件…")
                errors = {"agent": str(e)[:200]}
                # 没写出文件的场景直接出局：缺文件时 still 校验会走兜底渐变而假通过
                work = [(b, n) for b, n in work if (GEN_DIR / pid / f"Scene{n:02d}.tsx").exists()]
                if not work:
                    break
                slugs = [_slug_of(pid, n) for _, n in work]
            update(stage="gen", message=f"校验第 {bi}/{len(batches)} 批（tsc + 抽帧，第 {rnd} 轮）…")
            ok_slugs, errors = validate_scenes(pid, slugs, look)
            ok_set = set(ok_slugs)
            # 未通过的场景文件必须删除：tsc 是全项目编译，未被注册的坏文件会挂掉后续所有批次
            _drop_scenes(pid, [s for s in slugs if s not in ok_set])
            for (b, n), slug in zip(work, slugs):
                if slug in ok_set:
                    all_ok.append({"beat": b, "slug": slug})
            work = [(b, n) for (b, n), s in zip(work, slugs) if s not in ok_set]  # 修复轮只做失败的
            errors = {k: v for k, v in errors.items() if k in {s for s in slugs if s not in ok_set}}
            if not work:
                break
        failed.extend(_slug_of(pid, n) for _, n in work)
        start += len(chunk)

    if not all_ok:
        write_registry(pid, [])
        reason = "；".join(failed[:2])[:120] or "agent 未产出可校验场景"
        return {"ok": False, "reason": reason, "scenes": []}
    # 注册表 = 全部通过场景（含历史上已存在的：扫描目录里有文件但不在本批 slugs 的）
    existing_slugs = [
        _slug_of(pid, int(m.group(1)))
        for f in (GEN_DIR / pid).glob("Scene*.tsx")
        if (m := re.fullmatch(r"Scene(\d+).tsx", f.name))
    ]
    ok_set = {e["slug"] for e in all_ok}
    pre_existing = [s for s in sorted(set(existing_slugs) - ok_set)]
    final_slugs = sorted(ok_set | set(pre_existing))
    write_registry(pid, final_slugs)
    patched = patch_plan(pid, [e["beat"] for e in all_ok], [e["slug"] for e in all_ok], look)
    # 历史场景的镜头映射保持不变（patch_plan 只动本批 beats）
    return {
        "ok": True,
        "reason": "",
        "scenes": [e["slug"] for e in all_ok],
        "beats": [e["beat"] for e in all_ok],
        "patched": patched,
        "failed": failed,
        "total_registered": len(final_slugs),
    }
