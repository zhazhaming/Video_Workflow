# -*- coding: utf-8 -*-
"""分镜图片提示词：LLM 生成 + 本地兜底 + 按项目持久化。

用途：把每个镜头的图片提示词一键复制给豆包等工具生成配图，
生成好的图按 custom_NN.png 命名放进项目目录即可被渲染使用。
"""
import json

from ..config import PROJECTS_DIR
from ..schemas import ScriptDraft, Shot
from . import llm


def _prompts_path(project_id: str):
    return PROJECTS_DIR / project_id / "image_prompts.json"


def build_local_prompt(title: str, shot: Shot) -> str:
    """LLM 不可用/数量不齐时的本地兜底提示词（保证可复制可用）。"""
    lines_text = "；".join(l.text for l in shot.lines)
    parts = [
        "电影感写实摄影风格，竖屏 9:16 构图",
        f"画面主题：{shot.label or title}",
    ]
    if shot.year:
        parts.append(f"年代背景：{shot.year}")
    parts.append(f"情境参考：{lines_text}")
    parts.append("自然柔和的光线，浅景深，真实细腻的质感，情绪饱满，画面中无任何文字、水印、logo")
    return "，".join(parts) + "。"


def align_prompts(prompts: list[str], script: ScriptDraft) -> list[str]:
    """把 LLM 返回的提示词对齐到分镜数量：缺的用本地兜底补齐，多的截断。"""
    out: list[str] = []
    for i, shot in enumerate(script.shots):
        p = ""
        if i < len(prompts):
            p = (prompts[i] or "").strip()
        out.append(p or build_local_prompt(script.title, shot))
    return out


def generate_and_store(project_id: str, script: ScriptDraft, model_id: str | None) -> list[str]:
    """调用 LLM 生成全部镜头提示词并持久化。LLM 失败时整体回退到本地提示词。"""
    try:
        raw_prompts = llm.generate_image_prompts(script, model_id)
    except RuntimeError:
        raise
    except Exception:  # noqa: BLE001 — LLM 失败不应阻断，回退本地提示词
        raw_prompts = []

    prompts = align_prompts(raw_prompts, script)
    path = _prompts_path(project_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps({"prompts": prompts}, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    return prompts


def load_stored(project_id: str) -> list[str]:
    path = _prompts_path(project_id)
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        prompts = data.get("prompts", [])
        return [str(p) for p in prompts] if isinstance(prompts, list) else []
    except (OSError, json.JSONDecodeError):
        return []
