# -*- coding: utf-8 -*-
"""六步视频流水线：搜索 → 编排 → 找图 → 定样式 → 检查 → 直出。

与旧一键渲染（tasks.start_render）并存，本模块承载新主流程：
- 每步产物落盘 storage/projects/<pid>/（research / images / styles / review / flow），
  步骤之间有明确的人工确认门（gates），后端强制顺序；
- 配音三选一（audio_mode）：tts（edge-tts 逐句）/ custom（自带配音：整段口播或分幕）/
  none（纯字幕+音乐），时长随之变化；
- 直出先渲前 10 秒预览（--frames=0-299），用户确认后再渲整片。

所有 run_* 函数供 tasks.TaskManager.start_task 调度，签名统一为 fn(update)。
"""
import json
import math
import re
import shutil
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from ..config import (
    BGM_PUBLIC_SUBDIR,
    PIC_PUBLIC_SUBDIR,
    PROJECTS_DIR,
    REMOTION_PUBLIC,
    RENDERS_DIR,
    composition_for,
)
from ..schemas import (
    BgmSpec,
    LookSpec,
    MarketData,
    NarrationAudioSpec,
    ProjectSettings,
    RenderProps,
    RenderShot,
    ScriptDraft,
    TimedLine,
    now_iso,
)
from . import beat, bgm as bgm_svc, comfy, director, llm, music, pic_search, renderer, voice, websearch
from .pipeline import (
    assemble_props,
    bind_project,
    line_id,
    text_durations,
    text_line_duration,
)


def _load_script(pid: str) -> ScriptDraft:
    return ScriptDraft.model_validate_json((_pdir(pid) / "script.json").read_text(encoding="utf-8"))


def _load_settings(pid: str) -> ProjectSettings:
    p = _pdir(pid) / "settings.json"
    if not p.exists():
        return ProjectSettings()
    return ProjectSettings.model_validate_json(p.read_text(encoding="utf-8"))


def _load_market(pid: str) -> MarketData | None:
    p = _pdir(pid) / "market.json"
    if not p.exists():
        return None
    try:
        return MarketData.model_validate_json(p.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001 — 行情数据损坏不阻断普通项目
        return None


def _sync_meta_title(pid: str, title: str) -> None:
    """文案落库后同步项目标题（与 projects 路由的 PUT script 行为一致）。"""
    meta_path = _pdir(pid) / "meta.json"
    if not meta_path.exists():
        return
    try:
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        meta["title"] = title
        meta["updated_at"] = now_iso()
        meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
    except Exception:  # noqa: BLE001 — 标题同步失败不阻断
        pass

FPS = 30  # 与 Remotion 端 DataVideo 的 FPS 常量一致
SAMPLE_FRAME = 150  # 样图取约 5 秒处：片头已过、首幕画面与字幕都可见
PREVIEW_FRAMES = (0, 299)  # 前 10 秒预览
GATE_KEYS = ("research", "copy", "images", "styles", "review", "preview")
AUDIO_EXTS = (".mp3", ".wav", ".m4a", ".aac", ".ogg")
IMAGE_EXTS = (".png", ".jpg", ".jpeg", ".webp")


# ---------- 流程状态（flow.json） ----------

def _pdir(pid: str) -> Path:
    return PROJECTS_DIR / pid


def _flow_path(pid: str) -> Path:
    return _pdir(pid) / "flow.json"


def load_flow(pid: str) -> dict:
    p = _flow_path(pid)
    data: dict = {}
    if p.exists():
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001 — 损坏则重建
            data = {}
    data.setdefault("v", 1)
    data.setdefault("step", 1)
    data.setdefault("audio_mode", "tts")
    data.setdefault("custom_audio", {})
    gates = data.setdefault("gates", {})
    for k in GATE_KEYS:
        gates.setdefault(k, False)
    data.setdefault("bgm_choice", None)
    data.setdefault("style_chosen", None)
    return data


def save_flow(pid: str, data: dict) -> None:
    _pdir(pid).mkdir(parents=True, exist_ok=True)
    _flow_path(pid).write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")


def approve_gate(pid: str, gate: str) -> dict:
    if gate not in GATE_KEYS:
        raise RuntimeError(f"未知确认门：{gate}")
    f = load_flow(pid)
    f["gates"][gate] = True
    step = 1
    for i, k in enumerate(GATE_KEYS, 1):
        if f["gates"].get(k):
            step = min(i + 1, 6)
    f["step"] = max(int(f.get("step", 1)), step)
    save_flow(pid, f)
    return f


def require_gate(pid: str, gate: str) -> None:
    f = load_flow(pid)
    if not f["gates"].get(gate):
        raise RuntimeError(f"请先完成并确认上一步（{gate} 尚未确认）")


def set_audio_mode(pid: str, mode: str) -> dict:
    if mode not in ("tts", "custom", "none"):
        raise RuntimeError("配音方式必须是 tts / custom / none")
    f = load_flow(pid)
    f["audio_mode"] = mode
    save_flow(pid, f)
    return f


def flow_state(pid: str) -> dict:
    f = load_flow(pid)
    script = _try_script(pid)
    research = _read_json(pid, "research.json") or {}
    settings = _read_json(pid, "settings.json") or {}
    topic = (research.get("topic") or settings.get("topic") or "").strip()
    return {
        "pid": pid,
        "step": int(f.get("step", 1)),
        "audio_mode": f.get("audio_mode", "tts"),
        "custom_audio": f.get("custom_audio") or {},
        "gates": f["gates"],
        "topic": topic,
        "script_title": script.title if script else "",
        "shot_count": len(script.shots) if script else 0,
        "line_count": sum(len(s.lines) for s in script.shots) if script else 0,
        "has_preview": (RENDERS_DIR / pid / "preview.mp4").exists(),
        "has_video": (RENDERS_DIR / pid / "final.mp4").exists(),
    }


def _try_script(pid: str) -> ScriptDraft | None:
    try:
        return _load_script(pid)
    except Exception:  # noqa: BLE001
        return None


# ---------- 产物读写 ----------

def _read_json(pid: str, name: str) -> dict | None:
    p = _pdir(pid) / name
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return None


def _write_json(pid: str, name: str, data: dict) -> None:
    _pdir(pid).mkdir(parents=True, exist_ok=True)
    (_pdir(pid) / name).write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")


# ---------- 第 1 步：搜索 ----------

def _clean_sources(raw) -> list[dict]:
    out = []
    for s in raw if isinstance(raw, list) else []:
        if not isinstance(s, dict):
            continue
        url = str(s.get("url") or "").strip()
        if not url.startswith(("http://", "https://")):
            continue
        out.append({"title": str(s.get("title") or "")[:80], "url": url})
        if len(out) >= 3:
            break
    return out


def _clean_nodes(raw) -> list[dict]:
    nodes = []
    for n in raw if isinstance(raw, list) else []:
        if not isinstance(n, dict):
            continue
        title = str(n.get("title") or "").strip()
        if not title:
            continue
        nodes.append(
            {
                "year": str(n.get("year") or "").strip()[:16],
                "title": title[:40],
                "what": str(n.get("what") or "").strip()[:200],
                "why": str(n.get("why") or "").strip()[:200],
                "sources": _clean_sources(n.get("sources")),
            }
        )
        if len(nodes) >= 12:
            break
    return nodes


def research_markdown(article: dict) -> str:
    lines = [f"# {article.get('topic', '知识文章')}", ""]
    for i, n in enumerate(article.get("nodes") or [], 1):
        lines.append(f"## {i}. [{n.get('year') or '时期不详'}] {n.get('title')}")
        if n.get("what"):
            lines.append(f"- 做了什么：{n['what']}")
        if n.get("why"):
            lines.append(f"- 为什么重要：{n['why']}")
        srcs = n.get("sources") or []
        if srcs:
            lines.append("- 来源：" + "；".join(f"[{s.get('title') or '链接'}]({s['url']})" for s in srcs))
        lines.append("")
    return "\n".join(lines)


def run_research(pid: str, topic: str, model_id: str | None, update) -> None:
    update(stage="search", message=f"联网搜索：{topic}…")
    context, sources = websearch.gather_research_context(topic)
    fetched = sum(1 for s in sources if s.get("fetched"))
    update(stage="research", message=f"AI 整理知识文章（{len(sources)} 条来源，抓到正文 {fetched} 条）…")
    try:
        data = llm.generate_research(topic, context, model_id)
    except ValueError as e:
        # 把检索质量诊断带给用户，不再只说"模型未返回知识节点"
        raise RuntimeError(f"{e}；本次检索 {len(sources)} 条来源、抓到正文 {fetched} 条") from None
    nodes = _clean_nodes(data.get("nodes"))
    if len(nodes) < 3:
        raise RuntimeError(f"可靠知识点过少（{len(nodes)} 个），请更换主题表述或重试")
    article = {"topic": topic[:100], "nodes": nodes, "generated_at": now_iso(), "model_id": model_id}
    _write_json(pid, "research.json", article)
    _pdir(pid).mkdir(parents=True, exist_ok=True)
    (_pdir(pid) / "research.md").write_text(research_markdown(article), encoding="utf-8")
    update(stage="research", message=f"完成：{len(nodes)} 个关键节点，均带出处")


def load_research(pid: str) -> dict | None:
    return _read_json(pid, "research.json")


def save_research(pid: str, topic: str, nodes: list[dict]) -> dict:
    """人工修正文章节点后保存（同步重新生成 research.md）。"""
    cleaned = _clean_nodes(nodes)
    article = {"topic": (topic or "")[:100], "nodes": cleaned, "generated_at": now_iso(), "model_id": "manual"}
    _write_json(pid, "research.json", article)
    (_pdir(pid) / "research.md").write_text(research_markdown(article), encoding="utf-8")
    return article


# ---------- 第 2 步：编排（文章 → 视频文案） ----------

_PUNCT_SPLIT = "，。！？；…!?;"


def _split_line(text: str, limit: int = 20) -> list[str]:
    """超长台词按标点切成 ≤20 字的短句（保住"一屏不超 20 字"的硬规则）。"""
    text = (text or "").strip()
    if not text:
        return []
    if len(text) <= limit:
        return [text]
    parts, buf = [], ""
    for ch in text:
        buf += ch
        if len(buf) >= limit or (len(buf) >= 6 and ch in _PUNCT_SPLIT):
            parts.append(buf.strip())
            buf = ""
    if buf.strip():
        parts.append(buf.strip())
    out: list[str] = []
    for p in parts:
        while len(p) > 24:  # 无标点的超长段硬切
            out.append(p[:limit])
            p = p[limit:]
        if p:
            out.append(p)
    return out


def _copy_to_script(data: dict, fallback_title: str) -> ScriptDraft:
    raw_shots = data.get("shots") if isinstance(data.get("shots"), list) else []
    if not raw_shots:
        raise RuntimeError("模型未返回分幕文案")
    shots: list[dict] = []
    for i, s in enumerate(raw_shots[:24]):
        if not isinstance(s, dict):
            continue
        colors = ("#1a1a2e", "#16213e")
        raw_colors = s.get("colors")
        if isinstance(raw_colors, (list, tuple)) and len(raw_colors) >= 2:
            c1, c2 = str(raw_colors[0]), str(raw_colors[1])
            if re.fullmatch(r"#[0-9a-fA-F]{6}", c1) and re.fullmatch(r"#[0-9a-fA-F]{6}", c2):
                colors = (c1, c2)
        lines: list[dict] = []
        raw_lines = s.get("lines") if isinstance(s.get("lines"), list) else []
        for rl in raw_lines:
            text = rl.get("text") if isinstance(rl, dict) else str(rl)
            for piece in _split_line(str(text)):
                lines.append({"text": piece})
            if len(lines) >= 6:
                break
        if not lines:
            continue
        shots.append(
            {
                "year": str(s.get("year") or "").strip()[:16],
                "label": (str(s.get("label") or "").strip() or f"第{i + 1}幕")[:40],
                "colors": colors,
                "lines": lines,
            }
        )
    if not shots:
        raise RuntimeError("文案分幕清洗后为空")
    title = str(data.get("title") or "").strip()[:60] or fallback_title[:60]
    return ScriptDraft.model_validate({"title": title, "shots": shots})


def run_copy(pid: str, model_id: str | None, update) -> None:
    article = load_research(pid)
    if not article or not article.get("nodes"):
        raise RuntimeError("缺少第 1 步的搜索结果，请先完成搜索")
    update(stage="compose", message="AI 把知识文章改写成视频文案…")
    settings = _load_settings(pid)
    data = llm.generate_flow_copy(research_markdown(article), settings.target_seconds, model_id)
    script = _copy_to_script(data, fallback_title=article.get("topic") or "知识科普")
    _pdir(pid).mkdir(parents=True, exist_ok=True)
    (_pdir(pid) / "script.json").write_text(script.model_dump_json(indent=1), encoding="utf-8")
    _sync_meta_title(pid, script.title)
    total_lines = sum(len(s.lines) for s in script.shots)
    update(stage="compose", message=f"完成：{len(script.shots)} 幕 / {total_lines} 句（可在下方编辑）")


# ---------- 配音三选一 ----------

def _audio_duration(path: Path) -> float:
    try:
        from mutagen import File as MutagenFile

        mf = MutagenFile(str(path))
        # 注意：FileType 实现了映射协议，无标签文件 bool() 为 False，不能用 if mf 判空
        info = getattr(mf, "info", None) if mf is not None else None
        return float(getattr(info, "length", 0) or 0) if info is not None else 0.0
    except Exception:  # noqa: BLE001
        return 0.0


def _custom_dir(pid: str) -> Path:
    return REMOTION_PUBLIC / "voice" / "projects" / pid / "custom"


def upload_audio(pid: str, kind: str, index: int | None, filename: str, content: bytes) -> dict:
    if kind not in ("full", "shot"):
        raise RuntimeError("kind 必须是 full（整段口播）或 shot（分幕配音）")
    if kind == "shot" and not (index and index >= 1):
        raise RuntimeError("分幕配音需要 index（第几幕，从 1 开始）")
    ext = Path(filename or "").suffix.lower()
    if ext not in AUDIO_EXTS:
        raise RuntimeError("仅支持 mp3 / wav / m4a / aac / ogg 音频")
    if len(content) > 100 * 1024 * 1024:
        raise RuntimeError("音频文件超过 100MB")
    if not content:
        raise RuntimeError("音频内容为空")
    d = _custom_dir(pid)
    d.mkdir(parents=True, exist_ok=True)
    name = f"full{ext}" if kind == "full" else f"shot_{index:02d}{ext}"
    (d / name).write_bytes(content)
    dur = _audio_duration(d / name)
    if dur <= 0:
        (d / name).unlink(missing_ok=True)
        raise RuntimeError("无法读取音频时长，文件可能损坏")
    rel = (Path("voice") / "projects" / pid / "custom" / name).as_posix()
    f = load_flow(pid)
    ca = f.setdefault("custom_audio", {})
    if kind == "full":
        ca["full"] = {"file": rel, "duration": round(dur, 2)}
        ca.pop("shots", None)  # 整段口播与分幕配音互斥
    else:
        ca.setdefault("shots", {})[str(index)] = {"file": rel, "duration": round(dur, 2)}
    save_flow(pid, f)
    return {"file": rel, "duration": round(dur, 2)}


def delete_audio(pid: str, kind: str, index: int | None) -> dict:
    f = load_flow(pid)
    ca = f.get("custom_audio") or {}
    if kind == "full":
        ca.pop("full", None)
    elif kind == "shot" and index:
        (ca.get("shots") or {}).pop(str(index), None)
    save_flow(pid, f)
    return f


def _custom_audio_plan(
    pid: str, script: ScriptDraft, custom: dict
) -> tuple[dict[str, float], str | None, dict[int, str]]:
    """自带配音 → (逐句时长, 顶层整段旁白 rel 路径, {幕下标: 分幕音频 rel 路径})。

    整段口播：总时长按各幕字数占比分摊到幕、幕内再按句长分摊；
    分幕配音：每幕音频时长在幕内按句长分摊；没有覆盖到的句子按屏显时长兜底。
    """
    durations: dict[str, float] = {}
    narration: str | None = None
    shot_audio: dict[int, str] = {}
    full = custom.get("full") or {}
    shots_map = custom.get("shots") or {}
    if full.get("file"):
        total = float(full.get("duration") or 0) or _audio_duration(REMOTION_PUBLIC / full["file"])
        if total <= 0:
            raise RuntimeError("整段口播音频时长读取失败，请重新上传")
        narration = full["file"]
        chars = [sum(len(l.text) for l in s.lines) or 1 for s in script.shots]
        total_chars = sum(chars)
        for si, shot in enumerate(script.shots):
            shot_dur = total * chars[si] / total_chars
            lc = [len(l.text) or 1 for l in shot.lines]
            sc = sum(lc)
            for li, line in enumerate(shot.lines):
                durations[line_id(si, li)] = round(max(0.9, shot_dur * lc[li] / sc), 3)
        return durations, narration, {}  # 整段模式下分幕音频忽略，避免重叠
    for si, shot in enumerate(script.shots):
        info = shots_map.get(str(si + 1)) or {}
        rel = info.get("file") or ""
        if not rel:
            continue
        dur = float(info.get("duration") or 0) or _audio_duration(REMOTION_PUBLIC / rel)
        if dur <= 0:
            continue
        shot_audio[si] = rel
        lc = [len(l.text) or 1 for l in shot.lines]
        sc = sum(lc)
        for li, line in enumerate(shot.lines):
            durations[line_id(si, li)] = round(max(0.9, dur * lc[li] / sc), 3)
    for si, shot in enumerate(script.shots):  # 未覆盖句兜底
        for li, line in enumerate(shot.lines):
            durations.setdefault(line_id(si, li), text_line_duration(line.text))
    return durations, None, shot_audio


# ---------- 第 3 步：找图 ----------

def run_images(pid: str, model_id: str | None, update) -> None:
    script = _load_script(pid)
    update(stage="imagery", message="AI 规划每幕找图检索词…")
    data = llm.generate_image_queries(script, model_id)
    qmap: dict[int, dict] = {}
    for i, s in enumerate(data.get("scenes") or []):
        if isinstance(s, dict):
            try:
                qmap[int(s.get("index", i + 1))] = s
            except (TypeError, ValueError):
                continue
    scenes: list[dict] = []
    for i, shot in enumerate(script.shots, 1):
        q = qmap.get(i, {})
        scenes.append(
            {
                "index": i,
                "query_en": str(q.get("query_en") or "")[:80],
                "query_zh": str(q.get("query_zh") or "")[:80],
                "note": str(q.get("note") or "")[:40],
                "candidates": [],
                "selected": None,
                "custom_file": None,
                "downloaded": None,
            }
        )
    n = len(scenes)

    def _search_one(sc: dict) -> None:
        for attempt in (1, 2):  # 限流抖动下重试一次
            try:
                sc["candidates"] = pic_search.search_images(
                    sc["query_en"], sc["query_zh"], per_provider=4
                )
                return
            except Exception as e:  # noqa: BLE001 — 单幕失败不阻断其它幕
                if attempt == 2:
                    import traceback as _tb

                    sc["error"] = f"搜图失败：{e}｜{_tb.format_exc()[-140:]}"[:220]
                else:
                    time.sleep(2.0)

    pending = [sc for sc in scenes if (sc["query_en"] or sc["query_zh"])]
    done = 0
    with ThreadPoolExecutor(max_workers=min(4, max(1, len(pending)))) as ex:
        futs = {ex.submit(_search_one, sc): sc for sc in pending}
        for fut in as_completed(futs):
            fut.result()
            done += 1
            update(stage="imagery", message=f"搜图进度 {done}/{len(pending)} 幕…")
    _write_json(pid, "images.json", {"scenes": scenes, "generated_at": now_iso()})
    found = sum(1 for s in scenes if s["candidates"])
    update(stage="imagery", message=f"完成：{found}/{n} 幕找到候选图（可上传本地图或留空走代码动画）")


def load_images(pid: str) -> dict:
    data = _read_json(pid, "images.json") or {}
    data.setdefault("scenes", [])
    return data


def image_rels_for(pid: str, shot_count: int) -> list[str | None]:
    scenes = load_images(pid).get("scenes") or []
    rels: list[str | None] = []
    for si in range(shot_count):
        sc = scenes[si] if si < len(scenes) else {}
        rels.append(sc.get("downloaded") or None)
    return rels


def _slug(text: str) -> str:
    slug = "-".join(re.findall(r"[A-Za-z0-9]+", str(text)))[:48].lower()
    return slug or "img"


def select_image(pid: str, scene_idx: int, candidate_id: str | None) -> dict:
    data = load_images(pid)
    scenes = data.get("scenes") or []
    if not (1 <= scene_idx <= len(scenes)):
        raise RuntimeError(f"幕号 {scene_idx} 不存在，请先执行找图")
    sc = scenes[scene_idx - 1]
    if candidate_id:
        cand = next((c for c in sc.get("candidates") or [] if c.get("id") == candidate_id), None)
        if not cand:
            raise RuntimeError("候选图不存在或已过期，请重新搜图")
        dest = REMOTION_PUBLIC / PIC_PUBLIC_SUBDIR / pid
        dest.mkdir(parents=True, exist_ok=True)
        if cand.get("local_path"):
            # AI 生图候选：文件已在本地，直接复制（下载器走 HTTP，没必要绕一圈）
            src = Path(cand["local_path"])
            if not src.exists():
                raise RuntimeError("AI 生成的候选图文件已丢失，请重新生成")
            path = dest / f"{scene_idx:02d}-ai.png"
            shutil.copyfile(src, path)
        else:
            try:
                path = pic_search.download_image(
                    cand["image_url"], dest, f"{scene_idx:02d}-{_slug(cand.get('title') or '')}"
                )
            except Exception as e:  # noqa: BLE001
                raise RuntimeError(f"图片下载失败：{e}") from e
        sc["selected"] = candidate_id
        sc["custom_file"] = None
        sc["downloaded"] = path.relative_to(REMOTION_PUBLIC).as_posix()
    else:
        sc["selected"] = None
        sc["custom_file"] = None
        sc["downloaded"] = None  # 该幕不配图 → 渲染走代码场景/占位
    _write_json(pid, "images.json", data)
    return data


def upload_scene_image(pid: str, scene_idx: int, filename: str, content: bytes) -> dict:
    data = load_images(pid)
    scenes = data.get("scenes") or []
    if not (1 <= scene_idx <= len(scenes)):
        raise RuntimeError(f"幕号 {scene_idx} 不存在，请先执行找图")
    ext = Path(filename or "").suffix.lower()
    if ext not in IMAGE_EXTS:
        raise RuntimeError("仅支持 png / jpg / webp 图片")
    if len(content) > 15 * 1024 * 1024:
        raise RuntimeError("图片超过 15MB")
    try:
        from PIL import Image

        import io

        img = Image.open(io.BytesIO(content))
        img.verify()
        img = Image.open(io.BytesIO(content))
        if img.width < 400 or img.height < 400:
            raise RuntimeError("图片分辨率过低（至少 400×400）")
    except RuntimeError:
        raise
    except Exception as e:  # noqa: BLE001
        raise RuntimeError(f"图片无法解析：{e}") from e
    d = REMOTION_PUBLIC / PIC_PUBLIC_SUBDIR / pid
    d.mkdir(parents=True, exist_ok=True)
    ext = ".jpg" if ext in (".jpeg", ".jpg") else ext
    name = f"{scene_idx:02d}-custom{ext}"
    (d / name).write_bytes(content)
    sc = scenes[scene_idx - 1]
    sc["selected"] = "__custom__"
    sc["custom_file"] = name
    sc["downloaded"] = (Path(PIC_PUBLIC_SUBDIR) / pid / name).as_posix()
    _write_json(pid, "images.json", data)
    return data


# ---------- 第 3 步补充：ComfyUI AI 生图 ----------

AI_CANDIDATE_DIR = "ai"  # storage/projects/<pid>/ai/ 下存候选原图


def ai_candidate_dir(pid: str) -> Path:
    return _pdir(pid) / AI_CANDIDATE_DIR


def _skeleton_scenes(pid: str) -> list[dict]:
    """没有 images.json 时按脚本造一个空骨架（AI 生图不依赖检索词）。"""
    script = _load_script(pid)
    return [
        {
            "index": i,
            "query_en": "",
            "query_zh": "",
            "note": "",
            "candidates": [],
            "selected": None,
            "custom_file": None,
            "downloaded": None,
        }
        for i, _ in enumerate(script.shots, 1)
    ]


def ensure_ai_prompts(pid: str, model_id: str | None) -> list[dict]:
    """给 images.json 每幕补中文生图提示词（generate_image_prompts 一次生成全部分镜，落库缓存）。"""
    data = load_images(pid)
    scenes = data.get("scenes") or _skeleton_scenes(pid)
    data["scenes"] = scenes
    missing = [sc for sc in scenes if not (sc.get("prompt_cn") or "").strip()]
    if missing:
        prompts = llm.generate_image_prompts(_load_script(pid), model_id)
        for sc, prompt in zip(scenes, prompts):
            if not (sc.get("prompt_cn") or "").strip():
                sc["prompt_cn"] = str(prompt or "").strip()
        _write_json(pid, "images.json", data)
    return scenes


def run_ai_images(pid: str, model_id: str | None, update, scene_indexes: list[int] | None = None) -> None:
    """逐幕 AI 生图：中文提示词 → LLM 翻英文 → ComfyUI 出图 → 存为该幕候选（不自动选用）。"""
    if not comfy.is_configured():
        raise RuntimeError("backend/.env 未配置 COMFYUI_URL，无法 AI 生图")
    scenes = ensure_ai_prompts(pid, model_id)
    targets = [sc for sc in scenes if not scene_indexes or sc["index"] in scene_indexes]
    if not targets:
        raise RuntimeError("没有可生图的幕（scene_indexes 不匹配）")
    ck_name = ""
    done = 0
    for sc in targets:
        idx = sc["index"]
        prompt_cn = (sc.get("prompt_cn") or "").strip()
        if not prompt_cn:
            sc["ai_error"] = "该幕没有中文提示词，请先执行找图生成检索词"
            continue
        update(stage="imagery", message=f"第 {idx} 幕：翻译提示词…")
        try:
            prompt_en, is_portrait = llm.translate_image_prompt(prompt_cn, model_id)
            sc["prompt_en_ai"] = prompt_en
            sc["portrait"] = is_portrait
            variant = "portrait" if is_portrait else "scene"
            update(
                stage="imagery",
                message=f"第 {idx} 幕：ComfyUI 出图中（{'人像' if is_portrait else '场景'}模型｜{prompt_en[:36]}…）",
            )
            blob, seed, ck_name = comfy.txt2img(prompt_en, variant=variant)
            dest_dir = ai_candidate_dir(pid)
            dest_dir.mkdir(parents=True, exist_ok=True)
            name = f"{idx:02d}-{seed}.png"
            (dest_dir / name).write_bytes(blob)
            cand = {
                "id": f"ai-{seed}",
                "provider": "comfy",
                "title": f"AI 生图 · seed {seed}",
                "creator": ck_name.replace(".safetensors", ""),
                "license": "本地生成",
                "page_url": f"/api/projects/{pid}/images/ai/{name}",
                "image_url": f"/api/projects/{pid}/images/ai/{name}",
                "thumb_url": f"/api/projects/{pid}/images/ai/{name}",
                "width": comfy.WIDTH,
                "height": comfy.HEIGHT,
                "local_path": str(dest_dir / name),
            }
            cands = [c for c in (sc.get("candidates") or []) if not c.get("id", "").startswith("ai-")]
            sc["candidates"] = [cand] + cands  # 新图排最前；同幕旧 AI 候选只留最近一次
            sc["ai_error"] = ""
        except Exception as e:  # noqa: BLE001 — 单幕失败不阻断其它幕
            import traceback as _tb

            sc["ai_error"] = f"AI 生图失败：{e}｜{_tb.format_exc()[-120:]}"[:260]
        done += 1
        _write_json(pid, "images.json", {"scenes": scenes, "generated_at": now_iso()})
        update(stage="imagery", message=f"AI 生图进度 {done}/{len(targets)} 幕…")
    _write_json(pid, "images.json", {"scenes": scenes, "generated_at": now_iso()})
    ok = sum(1 for sc in targets if not sc.get("ai_error"))
    tail = f" · checkpoint：{ck_name.replace('.safetensors', '')}" if ck_name else ""
    update(stage="imagery", message=f"AI 生图完成：{ok}/{len(targets)} 幕出图{tail}（选中后才会用于渲染）")


# ---------- 第 4 步：定样式 + 写分镜 ----------

_DEFAULT_ACCENTS = ("#5CE1B9", "#FFD166", "#7FB4FF")


def _clean_proposals(raw) -> list[dict]:
    out: list[dict] = []
    for p in raw if isinstance(raw, list) else []:
        if not isinstance(p, dict):
            continue
        look = director.validate_look(p.get("look") or {})
        out.append(
            {
                "name": str(p.get("name") or "").strip()[:8] or f"风格{len(out) + 1}",
                "why": str(p.get("why") or "").strip()[:60],
                "kicker": str(p.get("kicker") or "").strip()[:16],
                "look": look,
            }
        )
        if len(out) >= 3:
            break
    # 不足 3 个 → 用默认风格补位（保证样图恒为 3 张）
    i = 0
    while len(out) < 3:
        look = dict(director.DEFAULT_LOOK)
        look["accent"] = _DEFAULT_ACCENTS[i % 3]
        look["bg"] = "paper" if i == 1 else "dark"
        out.append(
            {
                "name": f"备选{len(out) + 1}",
                "why": "默认风格变体（模型方案不足已补位）",
                "kicker": "",
                "look": look,
            }
        )
        i += 1
    return out


def _style_sample_props(script: ScriptDraft, proposal: dict, image_rels: list[str | None]) -> RenderProps:
    shot0 = script.shots[0]
    line0 = shot0.lines[0]
    timed = TimedLine(
        id="s01_0",
        text=line0.text,
        duration_sec=6.0,  # 拉长首幕，保证样图帧落在画面正中
        audio=None,
        pause_after=0.3,
    )
    shot = RenderShot(
        year=shot0.year,
        label=shot0.label,
        image=image_rels[0] if image_rels else None,
        colors=shot0.colors,
        lines=[timed],
        tail=1.0,
        camera="push",
        cam_intensity=1.0,
        enter_transition="dissolve",
    )
    return RenderProps(
        title=script.title,
        shots=[shot],
        bgm=None,
        title_card=True,
        grain_opacity=0.05,
        look=LookSpec(**proposal["look"]),
        kicker=proposal.get("kicker") or None,
        safe_scale=0.8,  # 抖音竖屏安全画幅（与最终成片一致）
    )


def run_styles(pid: str, model_id: str | None, update) -> None:
    script = _load_script(pid)
    if not script.shots:
        raise RuntimeError("请先生成文案（第 2 步）")
    article = load_research(pid)
    topic = (article or {}).get("topic") or script.title
    first = script.shots[0]
    desc = f"「{first.label}」" + " / ".join(l.text for l in first.lines)
    update(stage="styling", message="AI 提出 3 个差别大的风格方案…")
    data = llm.generate_style_proposals(topic, desc, model_id)
    proposals = _clean_proposals(data.get("proposals"))
    render_dir = RENDERS_DIR / pid
    render_dir.mkdir(parents=True, exist_ok=True)
    image_rels = image_rels_for(pid, len(script.shots))
    for i, p in enumerate(proposals, 1):
        update(stage="styling", message=f"渲染风格样图 {i}/3（{p['name']}）…")
        props = _style_sample_props(script, p, image_rels)
        props_path = render_dir / f"style_props_{i}.json"
        props_path.write_text(props.to_props_json(), encoding="utf-8")
        out = render_dir / f"style_sample_{i}.png"
        rc = renderer.render_still(props_path, SAMPLE_FRAME, out, render_dir / f"style_still_{i}.log")
        if rc != 0 or not out.exists():
            raise RuntimeError(f"样图 {i} 渲染失败（退出码 {rc}），详见 {render_dir / f'style_still_{i}.log'}")
    _write_json(pid, "styles.json", {"proposals": proposals, "chosen": None, "generated_at": now_iso()})
    update(stage="styling", message="完成：3 张样图已生成，请挑选")


def load_styles(pid: str) -> dict:
    data = _read_json(pid, "styles.json") or {}
    data.setdefault("proposals", [])
    data.setdefault("chosen", None)
    return data


def select_style(pid: str, index: int) -> dict:
    styles = load_styles(pid)
    proposals = styles.get("proposals") or []
    if not (1 <= index <= len(proposals)):
        raise RuntimeError("风格序号不存在")
    styles["chosen"] = index
    _write_json(pid, "styles.json", styles)
    f = load_flow(pid)
    f["style_chosen"] = index
    save_flow(pid, f)
    return styles


def storyboard_summary(plan: dict | None, script: ScriptDraft) -> str:
    lines = []
    shots = (plan or {}).get("shots") or []
    for i, item in enumerate(shots):
        p = item.get("plan") or {} if isinstance(item, dict) else {}
        if i >= len(script.shots):
            break
        s = script.shots[i]
        scene = (p.get("scene") or {}).get("kind") or "-"
        lines.append(
            f"第{i + 1}幕[{s.label}] 运镜={p.get('camera') or '默认'} 转场={p.get('transition') or '默认'} "
            f"场景={scene} 强度={p.get('intensity') or 1.0}｜台词：{' / '.join(l.text for l in s.lines)}"
        )
    return "\n".join(lines)


def run_storyboard(pid: str, update) -> None:
    """用户选定风格后：带 preset_look 跑导演出分镜，并解析 BGM（预览/整片共用）。"""
    script = _load_script(pid)
    settings = _load_settings(pid)
    styles = load_styles(pid)
    chosen = styles.get("chosen")
    proposals = styles.get("proposals") or []
    preset = proposals[chosen - 1] if isinstance(chosen, int) and 1 <= chosen <= len(proposals) else None
    model_id = settings.model_id
    bgm_dir = REMOTION_PUBLIC / BGM_PUBLIC_SUBDIR
    track_metas = bgm_svc.list_tracks() if bgm_dir.exists() else []
    mode_box: dict = {}

    def _progress(msg: str) -> None:
        update(stage="storyboard", message=msg)

    def _judge():
        return llm.judge_template_relevance(script, model_id)

    def _gen_style():
        return llm.generate_style_bible(
            script, settings.style, settings.prompt, track_metas, model_id,
            template_mode=mode_box.get("mode"),
        )

    def _gen_batch(start: int, end: int, tail: list[dict]):
        if preset:
            bible = {"look": preset["look"], "pacing": ""}
        else:
            bible = _gen_style()
        return llm.generate_shot_plans(
            script, bible, start, end, tail, model_id, template_mode=mode_box.get("mode")
        )

    def _critic(shot_plans: list[dict]):
        return llm.critic_rhythm(script, shot_plans, model_id)

    update(stage="storyboard", message="AI 写分镜（运镜/转场/卡拍子）…")
    director.create_plan(
        pid, script, settings.style, settings.prompt, track_metas,
        _gen_style, _gen_batch, _critic, _progress, _judge, mode_box,
        preset_look=preset,
    )
    _resolve_bgm(pid, script, settings, update)
    if settings.gen_scenes:
        # 现场编写定制场景（失败只回退内置词库/渐变底，不阻塞出片）
        try:
            from . import gen_scenes

            plan_now = director.load_cached_plan(pid) or {}
            update(stage="gen", message="准备现场编写关键场景…")
            result = gen_scenes.generate_for_project(
                pid, script,
                (preset or {}).get("look") or plan_now.get("look") or {},
                model_id, update,
            )
            if result.get("ok"):
                update(stage="gen", message=f"定制场景完成：{', '.join(result['scenes'])}")
            else:
                update(stage="gen", message=f"现场编写未通过，回退内置场景（{result.get('reason', '')[:60]}）")
        except Exception as e:  # noqa: BLE001 — 生成失败不阻塞出片
            update(stage="gen", message=f"现场编写失败，已回退内置场景：{e}"[:80])
    update(stage="storyboard", message=f"分镜完成（{len(script.shots)} 幕），BGM 已就绪")


def _resolve_bgm(pid: str, script: ScriptDraft, settings: ProjectSettings, update) -> None:
    bgm_dir = REMOTION_PUBLIC / BGM_PUBLIC_SUBDIR
    available = (
        [f.stem for f in bgm_dir.iterdir() if f.suffix.lower() in (".mp3", ".wav")]
        if bgm_dir.exists()
        else []
    )
    name = ""
    if settings.bgm == "auto":
        query = music.bgm_query_for(script, settings.style)
        update(stage="bgm", message=f"在线搜索 BGM：{query}…")
        try:
            name = music.auto_search_track(query, available) or ""
        except Exception:  # noqa: BLE001
            name = ""
        if not name:
            name = music.pick_track(script, available)
        update(stage="bgm", message=f"BGM：{name or '无'}")
    elif settings.bgm:
        name = settings.bgm
    f = load_flow(pid)
    f["bgm_choice"] = {"track": name, "volume": 0.32}
    save_flow(pid, f)


# ---------- 第 5 步：检查 ----------

_SEVERITIES = ("high", "medium", "low")


def _clean_review(data: dict) -> dict:
    issues = []
    for it in data.get("issues") or []:
        if not isinstance(it, dict):
            continue
        sev = str(it.get("severity") or "medium").lower()
        issues.append(
            {
                "severity": sev if sev in _SEVERITIES else "medium",
                "where": str(it.get("where") or "")[:60],
                "problem": str(it.get("problem") or "")[:200],
                "suggestion": str(it.get("suggestion") or "")[:200],
            }
        )
        if len(issues) >= 20:
            break
    off_topic = [x[:120] for x in (data.get("off_topic") or []) if isinstance(x, str) and x.strip()][:10]
    return {
        "passed": bool(data.get("passed")) and not any(i["severity"] == "high" for i in issues),
        "off_topic": off_topic,
        "issues": issues,
        "summary": str(data.get("summary") or "")[:150],
    }


def run_review(pid: str, model_id: str | None, update) -> None:
    script = _load_script(pid)
    article = load_research(pid)
    if not article:
        raise RuntimeError("缺少第 1 步的搜索结果")
    plan = director.load_cached_plan(pid)
    styles = load_styles(pid)
    chosen = styles.get("chosen")
    prop = {}
    if isinstance(chosen, int) and 1 <= chosen <= len(styles.get("proposals") or []):
        prop = styles["proposals"][chosen - 1]
    update(stage="review", message="AI 终审：偏题 / 属实 / 风格贴合…")
    copy_lines = []
    for i, s in enumerate(script.shots, 1):
        copy_lines.append(f"第{i}幕[{s.year} {s.label}]：" + " / ".join(l.text for l in s.lines))
    data = llm.generate_flow_review(
        (article.get("topic") or script.title),
        research_markdown(article),
        "\n".join(copy_lines),
        storyboard_summary(plan, script),
        f"风格「{prop.get('name', '')}」：{prop.get('why', '')}",
        model_id,
    )
    report = _clean_review(data)
    report["generated_at"] = now_iso()
    _write_json(pid, "review.json", report)
    n_high = sum(1 for i in report["issues"] if i["severity"] == "high")
    update(stage="review", message=f"审查完成：{'通过' if report['passed'] else '未通过'}（high 问题 {n_high} 个）")


def load_review(pid: str) -> dict | None:
    return _read_json(pid, "review.json")


# ---------- 第 6 步：直出（先 10 秒预览，确认后整片） ----------

def _build_bgm(pid: str) -> BgmSpec | None:
    choice = load_flow(pid).get("bgm_choice") or {}
    name = str(choice.get("track") or "")
    if not name:
        return None
    bgm_dir = REMOTION_PUBLIC / BGM_PUBLIC_SUBDIR
    for ext in (".mp3", ".wav"):
        f = bgm_dir / f"{name}{ext}"
        if f.exists():
            meta = beat.analyze(f)
            return BgmSpec(
                src=f"{BGM_PUBLIC_SUBDIR}/{name}{ext}",
                volume=float(choice.get("volume") or 0.68),
                bpm=meta["bpm"],
                beats=meta["beats"][:400],
            )
    return None


def _estimate_total_frames(props: RenderProps) -> int:
    """粗估总帧数（与 Remotion buildTimeline 近似，留足余量供预览截断）。"""
    total = 66 if props.title_card is not False else 0  # TitleIntro INTRO_SEC=2.2s
    for shot in props.shots:
        d = sum((l.duration_sec or 0) + (l.pause_after or 0) for l in shot.lines) + (shot.tail or 0)
        total += math.ceil(d * FPS)
    return total + 15  # END_HOLD


def run_render(pid: str, mode: str, update) -> None:
    if mode not in ("preview", "full"):
        raise RuntimeError(f"未知渲染模式：{mode}")
    # 事实审计硬闸门（有 research.json 才跑；查无出处的数字不上屏）
    from .tasks import _facts_gate

    gate_ok, gate_reason = _facts_gate(pid)
    if not gate_ok:
        raise RuntimeError(
            f"事实审计未通过：{gate_reason}（修正 script.json 数字或补 research.json 后重试）"
        )
    script = _load_script(pid)
    settings = _load_settings(pid)
    flow = load_flow(pid)
    audio_mode = flow.get("audio_mode", "tts")
    custom = flow.get("custom_audio") or {}

    narration: str | None = None
    shot_audio: dict[int, str] = {}
    if audio_mode == "tts":
        update(stage="voice", message="edge-tts 逐句配音…")
        durations = voice.generate_script_voices(
            pid, script.shots, voice=settings.voice, rate=settings.tts_rate
        )
    elif audio_mode == "custom":
        update(stage="voice", message="按自带配音排时…")
        durations, narration, shot_audio = _custom_audio_plan(pid, script, custom)
    else:
        update(stage="voice", message="无配音：按屏显阅读速度排时…")
        durations = text_durations(script)

    plan = director.load_cached_plan(pid)
    grain = None
    if plan:
        vals = [it.get("plan", {}).get("grain") for it in plan.get("shots", []) if isinstance(it, dict)]
        vals = [v for v in vals if isinstance(v, (int, float))]
        grain = round(sum(vals) / len(vals), 3) if vals else None

    update(stage="props", message="组装渲染数据…")
    image_rels = image_rels_for(pid, len(script.shots))
    props = bind_project(
        assemble_props(
            script, durations, image_rels,
            bgm=_build_bgm(pid), plan=plan, grain_opacity=grain,
            prefer_images=True, with_line_audio=(audio_mode == "tts"),
            market=_load_market(pid),
            safe_scale=(plan or {}).get("safeScale", 0.8),  # 抖音竖屏安全画幅默认
        ),
        pid,
    )
    if narration:
        props.narration_audio = NarrationAudioSpec(src=narration)
    elif audio_mode == "tts":
        # TTS 配音预混成整轨（绕过合成器对嵌套 Sequence 音频的错位/截断 bug）；
        # MotionShow 的时间轴与 DataVideo 不同，必须用对应的混音器。
        if (settings.template or "").strip().lower() == "motionshow":
            props = voice.apply_motion_track(pid, props)
        else:
            props = voice.apply_mixed_track(pid, props)
    for si, rel in shot_audio.items():
        if 0 <= si < len(props.shots):
            props.shots[si].audio = rel

    render_dir = RENDERS_DIR / pid
    render_dir.mkdir(parents=True, exist_ok=True)
    props_path = render_dir / "props.json"
    props_path.write_text(props.to_props_json(), encoding="utf-8")

    frames = None
    if mode == "preview":
        total = _estimate_total_frames(props)
        hi = min(PREVIEW_FRAMES[1], max(30, total - 10))
        frames = (0, hi)
    out_name = "preview.mp4" if mode == "preview" else "final.mp4"
    log_name = "preview.log" if mode == "preview" else "render.log"
    update(stage="rendering", message="渲染前 10 秒预览…" if mode == "preview" else "Remotion 渲染整片…")
    out_path = render_dir / out_name
    log_path = render_dir / log_name
    rc = renderer.render_video(
        props_path,
        out_path,
        log_path,
        frames=frames,
        composition=composition_for(settings.template),
    )
    log_tail = renderer.tail_log(log_path)
    if rc != 0 or not out_path.exists():
        raise RuntimeError(f"渲染失败（退出码 {rc}）\n{log_tail[-800:]}")
    done_msg = "预览完成，请过目" if mode == "preview" else "整片完成"
    if mode == "full":
        # 视觉验收帧（建议级，不拦截交付）
        try:
            from .tasks import _acceptance_frames

            done_msg += _acceptance_frames(None, pid, out_path, props_path)
        except Exception as e:  # noqa: BLE001 — 验收帧失败不影响出片
            done_msg += f"；视觉验收帧生成失败：{e}"[:100]
    update(
        stage="rendering",
        message=done_msg,
        video_url=f"/api/projects/{pid}/flow/video-preview" if mode == "preview" else f"/api/projects/{pid}/video",
        log_tail=log_tail,
    )
