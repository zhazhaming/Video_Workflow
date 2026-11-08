# -*- coding: utf-8 -*-
"""LLM 服务：多模型注册表（models.json）+ OpenAI 兼容调用。

支持在前端自助选择模型（MiMo / DeepSeek / 自定义）。
注册表里的 base_url / api_key 用 ${ENV_VAR} 占位，从 .env 解析；
未配置完整的模型在列表里标记为不可用。
"""
import json
import os
import re
import time
from dataclasses import dataclass, field
from pathlib import Path

import httpx

from ..config import MODELS_CONFIG, PROMPTS_CONFIG
from ..schemas import GenRequest, ModelEntryIO, OptimizeRequest, ScriptDraft

SYSTEM_PROMPT = """你是资深竖屏短视频编导。你只输出 JSON，不输出任何其他文字。

输出必须严格符合以下 JSON 结构（不要 markdown 代码块，直接输出 JSON）：
{
  "title": "视频标题（10字内）",
  "shots": [
    {
      "year": "可选，年代或阶段标签，如 2008；非年代故事留空字符串",
      "label": "占位画面上的4-8字短文案，概括本镜画面或情绪",
      "colors": ["#1a1a2e", "#16213e"],
      "lines": [{"text": "一句台词"}]
    }
  ]
}

规则：
1. 每镜 1~3 句台词，每句不超过 28 个字，短句、口语、有画面感，适合逐句 TTS 配音
2. 避免书面语、成语堆砌、 emoji、括号说明
3. 整体结构：钩子开场 → 递进 → 转折/高潮 → 收尾互动引导（"评论区"类 CTA 最多一句）
4. colors 用两个协调的 hex 颜色（#开头），贴合该镜情绪；默认浅色纸感/编辑风
   （浅底 + 深墨字 + 一个低饱和强调色），不要默认深色底 + 霓虹色
5. 台词里不要出现引号、书名号
6. 开场 0~5 秒必须是「数字 → 反差 → 代价」：第 1 句给具体数字或事实，第 2 句给反差，第 3 句给代价；
   前 5 秒禁止自我介绍、「本期/今天/大家好/这期聊」、栏目名
7. 片长默认 45 秒（30~60 区间），结构为 3 个台阶 × 15 秒，每台阶先给结论再给证据；
   第 10 秒前必须交付第一个完整价值
8. 全片不写固定开场白/结束语，不出现固定主持人式的人设句"""

IMAGE_PROMPT_SYSTEM = """你是资深 AI 绘画提示词工程师，为竖屏短视频分镜撰写文生图提示词（用于豆包图片生成）。

只输出 JSON，不输出任何其他文字：
{"prompts": ["第1镜提示词", "第2镜提示词", ...]}

每个镜头的提示词要求：
1. 中文，80~150 字，具体可画，避免抽象词和比喻
2. 必须包含：画面主体、场景环境、人物外观与动作/神情（镜头有人的话）、构图与视角、光线与氛围、艺术风格
3. 全片视觉风格统一（建议电影感写实摄影）；跨镜头出现的同一人物，年龄段、发型、衣着必须保持一致
4. 竖屏 9:16 构图
5. 画面中不允许出现任何文字、字幕、水印、logo
6. prompts 数量必须严格等于输入镜头数量，顺序一一对应，不多不少"""

HOTSPOT_TOPIC_SYSTEM = """你是资深短视频编导和流量操盘手，擅长把平台热点转化为能蹭到第一波流量的竖屏短视频选题。

只输出 JSON，不输出任何其他文字：
{"topics": [
  {"title": "选题标题（≤20字，可直接作为脚本生成的选题输入）",
   "column": "ai干活|公司大赏|淘汰",
   "opening_number": "开场要用的那个具体数字（如 7 纳米 / 330 块 / 68 个）；没有就留空",
   "reject_reason": "column=淘汰 时写原因；否则空字符串",
   "angle": "切入角度（20~40字，说明从哪个视角讲这个热点）",
   "hook": "开场钩子（≤25字，第一句台词，口语化，让人停下滑动）",
   "why": "为什么能蹭到流量（20~40字，点出情绪共鸣或争议点）",
   "ref": "来源热点（原样返回对应的热点标题）"}
]}

规则：
1. 每个热点衍生 1~2 个选题，总数等于用户要求；角度彼此不同（如：故事视角 / 反常识观点 / 盘点科普 / 情绪共鸣）
2. 不做单纯新闻复述，必须有个人化视角或情绪张力
3. 标题口语化、有钩子感，避免书面语和感叹号堆砌
4. 内容合规：不造谣、不煽动对立、不涉政治敏感，一律用"网传""据说"等表述处理未证实信息
5. **栏目归属**：column 只能是 ai干活 / 公司大赏 / 淘汰。归不到这两个栏目的，一律 column=淘汰，
   reject_reason 写"不属于 ai干活 / 公司大赏"
6. **硬淘汰题材**：行情预测、个股点评、A股/美股/纳指/金价涨跌、彩票博彩、医疗诊断与偏方、
   明星八卦、灾难事故——一律 column=淘汰，reject_reason 写明命中了哪一类
7. **开场数字**：opening_number 必须是这条视频开场第一句要用的那个具体数字。
   写不出具体数字 → column=淘汰，reject_reason="缺开场数字"
8. 开场必须能写成「数字 → 反差 → 代价」三句，写不成的选题不要提
9. 每条按 45 秒口播设计：3 个信息台阶，第 10 秒前就要给出第一个完整结论"""


@dataclass
class ModelEntry:
    id: str
    name: str
    base_url: str
    api_key: str
    model: str
    is_default: bool = False
    # 附加请求头（如 opencode Go 的 x-opencode-session）
    extra_headers: dict[str, str] = field(default_factory=dict)

    @property
    def available(self) -> bool:
        return bool(self.base_url and self.api_key and self.model)


def _resolve(value: str, env: dict[str, str]) -> str:
    """把 ${VAR} 占位符解析成环境变量值；未设置则为空串。"""
    m = re.fullmatch(r"\$\{(\w+)\}", (value or "").strip())
    if m:
        return env.get(m.group(1), "")
    return value or ""


def load_models(path: Path | None = None, env: dict[str, str] | None = None) -> list[ModelEntry]:
    path = path or MODELS_CONFIG
    env = env if env is not None else dict(os.environ)
    if not path.exists():
        return []
    raw = json.loads(path.read_text(encoding="utf-8"))
    entries = []
    for m in raw.get("models", []):
        entries.append(
            ModelEntry(
                id=m["id"],
                name=m.get("name", m["id"]),
                base_url=_resolve(m.get("base_url", ""), env).rstrip("/"),
                api_key=_resolve(m.get("api_key", ""), env),
                model=_resolve(m.get("model", ""), env),
                is_default=bool(m.get("default", False)),
                extra_headers={
                    str(k): str(v)
                    for k, v in (m.get("extra_headers") or {}).items()
                },
            )
        )
    return entries


def list_model_infos() -> list[dict]:
    models = load_models()
    default_id = next((m.id for m in models if m.is_default and m.available), None)
    if default_id is None:
        default_id = next((m.id for m in models if m.available), None)
    return [
        {
            "id": m.id,
            "name": m.name,
            "available": m.available,
            "is_default": m.id == default_id,
        }
        for m in models
    ]


def get_model_configs() -> list[dict]:
    """models.json 的完整配置（含 api_key），供前端设置弹窗编辑。

    本项目 models.json 即本地明文密钥配置（已 gitignore，模板见 models.example.json）。
    """
    return [
        {
            "id": m.id,
            "name": m.name,
            "base_url": m.base_url,
            "api_key": m.api_key,
            "model": m.model,
            "default": m.is_default,
            "extra_headers": dict(m.extra_headers),
            "available": m.available,
        }
        for m in load_models()
    ]


def save_model_configs(entries: list[ModelEntryIO], path: Path | None = None) -> list[dict]:
    """把前端设置弹窗的模型列表写回 models.json（旧文件备份 .bak），返回落盘后的配置。"""
    cleaned, seen = [], set()
    for e in entries:
        eid = (e.id or "").strip()
        if not eid:
            raise ValueError("模型 id 不能为空")
        if eid in seen:
            raise ValueError(f"模型 id 重复：{eid}")
        seen.add(eid)
        cleaned.append(
            {
                "id": eid,
                "name": (e.name or "").strip() or eid,
                "base_url": (e.base_url or "").strip(),
                "api_key": (e.api_key or "").strip(),
                "model": (e.model or "").strip(),
                "default": bool(e.default),
                "extra_headers": {
                    str(k).strip(): str(v).strip()
                    for k, v in (e.extra_headers or {}).items()
                    if str(k).strip()
                },
            }
        )
    path = path or MODELS_CONFIG
    if path.exists():
        backup = path.parent / (path.name + ".bak")
        backup.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps({"models": cleaned}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return get_model_configs()


def _test_error(e: Exception, url: str = "") -> str:
    """把测试连接的异常转成用户可读的一句话（HTTP 错误附上实际请求的 URL 便于排查）。"""
    suffix = f"（POST {url}）" if url else ""
    if isinstance(e, httpx.HTTPStatusError):
        return f"HTTP {e.response.status_code}：{e.response.text[:200]}{suffix}"
    if isinstance(e, httpx.ConnectError):
        return f"连接失败（地址不可达？）：{e}"
    if isinstance(e, httpx.TimeoutException):
        return "请求超时（20s）"
    return str(e)[:200]


def test_model(
    base_url: str,
    api_key: str,
    model: str,
    timeout: float = 20.0,
    extra_headers: dict[str, str] | None = None,
) -> dict:
    """对 OpenAI 兼容端点发一次最小补全请求，测试连通性与密钥（可测未保存的草稿值）。"""
    base_url = (base_url or "").strip().rstrip("/")
    started = time.monotonic()
    if not base_url or not model:
        return {"ok": False, "latency_ms": 0, "error": "base_url 与 model 不能为空"}
    url = f"{base_url}/chat/completions"
    try:
        resp = httpx.post(
            url,
            headers={
                "Authorization": f"Bearer {api_key}",
                **(extra_headers or {}),
            },
            json={
                "model": model,
                "messages": [{"role": "user", "content": "回复：OK"}],
                "max_tokens": 8,
                "temperature": 0,
            },
            timeout=timeout,
        )
        resp.raise_for_status()
        data = resp.json()
        choices = data.get("choices") or [{}]
        reply = ((choices[0].get("message") or {}).get("content") or "").strip()
        return {
            "ok": True,
            "latency_ms": int((time.monotonic() - started) * 1000),
            "reply": reply[:80],
        }
    except Exception as e:  # noqa: BLE001
        return {
            "ok": False,
            "latency_ms": int((time.monotonic() - started) * 1000),
            "error": _test_error(e, url),
        }


def load_prompt_templates(path: Path | None = None) -> list[dict]:
    """读取脚本生成提示词模板（prompts.json）。"""
    path = path or PROMPTS_CONFIG
    if not path.exists():
        return []
    raw = json.loads(path.read_text(encoding="utf-8"))
    return [
        {
            "id": t.get("id", ""),
            "name": t.get("name", ""),
            "description": t.get("description", ""),
            "content": t.get("content", ""),
        }
        for t in raw.get("templates", [])
    ]


def build_generate_user_prompt(req: GenRequest) -> str:
    """组装生成请求的用户消息：选题/风格/时长 + 自定义提示词指引。"""
    parts = [
        f"选题：{req.topic}",
        f"风格：{req.style}",
        f"目标时长：约 {req.target_seconds} 秒（按每秒 4.5 字估算台词总量，"
        f"即全部台词总字数约 {int(req.target_seconds * 4.5)} 字）",
        "【开场与片长（硬规则）】0–5 秒必须是「数字 → 反差 → 代价」：第 1 句给具体数字或事实，"
        "第 2 句给反差，第 3 句给代价；前 5 秒禁止自我介绍、「本期/今天/大家好/这期聊」、栏目名。"
        "默认 45 秒（30–60 区间），3 台阶 × 15 秒，每台阶结论先行，第 10 秒前必须交付第一个完整价值。"
        "全片不写固定开场白/结束语，不出现固定主持人式的人设句。",
    ]
    prompt = (req.prompt or "").strip()
    if prompt:
        parts.append("【创作提示词（优先级最高，必须严格执行）】\n" + prompt)
    parts.append("请输出完整分镜脚本 JSON。")
    return "\n".join(parts)


def _pick(model_id: str | None) -> ModelEntry:
    models = load_models()
    if model_id:
        for m in models:
            if m.id == model_id:
                if not m.available:
                    raise RuntimeError(f"模型「{m.name}」未配置完整，请在「⚙ 模型 API」里补齐密钥与接口地址")
                return m
        # id 不在注册表（如 vibe 项目遗留的 "agent" 占位）→ 静默回退默认可用模型
    for m in models:
        if m.is_default and m.available:
            return m
    for m in models:
        if m.available:
            return m
    raise RuntimeError("没有可用的模型：请在「⚙ 模型 API」里配置任一模型的密钥与接口地址")


def _extract_json(text: str) -> dict:
    text = text.strip()
    m = re.search(r"```(?:json)?\s*(.*?)```", text, re.S)
    if m:
        text = m.group(1).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"LLM 返回中未找到 JSON: {text[:200]}")
    return json.loads(text[start : end + 1])


def _chat(
    model_id: str | None,
    user_prompt: str,
    temperature: float = 0.8,
    system_prompt: str | None = None,
) -> str:
    entry = _pick(model_id)
    resp = httpx.post(
        f"{entry.base_url}/chat/completions",
        headers={
            "Authorization": f"Bearer {entry.api_key}",
            **entry.extra_headers,
        },
        json={
            "model": entry.model,
            "messages": [
                {"role": "system", "content": system_prompt or SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "response_format": {"type": "json_object"},
        },
        timeout=180,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"]


def generate_script(req: GenRequest) -> ScriptDraft:
    raw = _chat(req.model_id, build_generate_user_prompt(req), temperature=0.9)
    return ScriptDraft.model_validate(_extract_json(raw))


def generate_image_prompts(script: ScriptDraft, model_id: str | None) -> list[str]:
    """根据分镜脚本生成每个镜头的文生图提示词。"""
    shot_lines = []
    for i, s in enumerate(script.shots):
        lines_text = " / ".join(l.text for l in s.lines)
        shot_lines.append(
            f"镜头{i + 1}：年代={s.year or '不限'}；画面要点={s.label or '无'}；台词参考={lines_text}"
        )
    user = (
        f"视频标题：{script.title}\n"
        f"共 {len(script.shots)} 个镜头，请为每个镜头生成一条文生图提示词。\n\n"
        + "\n".join(shot_lines)
    )
    raw = _chat(model_id, user, temperature=0.7, system_prompt=IMAGE_PROMPT_SYSTEM)
    data = _extract_json(raw)
    prompts = data.get("prompts", [])
    if not isinstance(prompts, list):
        raise ValueError("模型返回的 prompts 不是数组")
    return [str(p) for p in prompts]


def generate_hotspot_topics(
    hot_items: list[dict],
    count: int,
    model_id: str | None,
    direction_hint: str = "",
) -> list[dict]:
    """把选中的热点转化为可拍的选题建议。

    hot_items: [{title, platform, tag, summary}]（由路由层从 HotItem 组装）
    """
    lines = []
    for i, h in enumerate(hot_items, start=1):
        line = f"{i}. [{h.get('platform', '')}] {h.get('title', '')}"
        if h.get("tag"):
            line += f"（标签：{h['tag']}）"
        if h.get("summary"):
            line += f"\n   摘要：{h['summary']}"
        lines.append(line)
    user = (
        f"以下是当前各平台热点（按第一波流量潜力排序）：\n"
        + "\n".join(lines)
        + f"\n\n请生成 {count} 个竖屏短视频选题。"
    )
    if direction_hint:
        user += f"\n账号方向：{direction_hint}（选题优先贴合该方向，确属大热点的除外）"
    raw = _chat(model_id, user, temperature=0.85, system_prompt=HOTSPOT_TOPIC_SYSTEM)
    data = _extract_json(raw)
    topics = data.get("topics", [])
    if not isinstance(topics, list):
        raise ValueError("模型返回的 topics 不是数组")
    return [t for t in topics if isinstance(t, dict) and t.get("title")]


DIRECTOR_SYSTEM = """你是资深短视频剪辑导演，为竖屏口播视频做逐镜编排（运镜/转场/调色/颗粒/BGM）。

只输出 JSON，不输出任何其他文字：
{"shots": [
  {"camera": "push|pull|pan_left|pan_right|tilt_up|tilt_down|diag_in|diag_out",
   "intensity": 1.0,
   "transition": "dissolve|whip|zoom|flash|cut",
   "grade": {"contrast": 1.05, "saturate": 1.1, "brightness": 1.03, "tint_opacity": 0.2},
   "grain_opacity": 0.06}
 ],
 "bgm": {"track": "曲库中的曲目名", "volume": 0.72}}

shots 数量必须严格等于输入镜头数量，顺序一一对应。

编排规则（发挥导演功力，不要千镜一面）：
1. 运镜语义：push=缓推（走近/强调），pull=缓拉（抽离/释然），pan_left/pan_right=横摇（并列/环境），
   tilt_up/tilt_down=上下摇（压迫/仰望），diag_in/diag_out=斜推斜拉（动感/失控）。intensity 0.6~1.6：
   情绪平静 0.8~1.0，紧张 1.1~1.3，高潮爆发 1.3~1.6
2. 转场语义：dissolve=柔和过渡（默认），whip=甩镜（情绪突变/高潮），zoom=变焦模糊（悬念/追问），
   flash=闪白（爆点/转折一瞬），cut=硬切（冷峻/纪实）。transition 是"进入该镜"的转场；
   相邻两镜不要用相同强转场；第一镜无脑给 dissolve
3. 调色跟随台词情绪：低谷/悬疑 → contrast 略降、saturate 0.7~0.9、tint_opacity 高（冷色调浓）；
   高潮/励志 → saturate 1.15~1.4、contrast 1.1~1.25、tint_opacity 低；平静叙事用默认值附近
4. grain_opacity（胶片颗粒 0~0.12）：纪实/回忆感强则 0.08~0.12，干净现代风 0.03~0.05
5. bgm.track 必须从给定曲库列表中逐字选择；volume 0.2~1.0（口播为主建议 0.6~0.8）"""


def generate_director_plan(script: ScriptDraft, bgm_tracks: list[dict], model_id: str | None) -> dict:
    """AI 导演：根据分镜台词情绪输出逐镜编排方案。bgm_tracks: [{name, title, tags, bpm}]。"""
    lines = []
    for i, s in enumerate(script.shots):
        text = " / ".join(l.text for l in s.lines)
        lines.append(f"镜头{i + 1}：{s.label or '无标签'}｜台词：{text}")
    track_lines = [
        f"- {t.get('name', '')}（{t.get('title') or '无标题'}{'，标签：' + '、'.join(t.get('tags') or []) if t.get('tags') else ''}{'，BPM ' + str(round(t['bpm'])) if t.get('bpm') else ''}）"
        for t in bgm_tracks
    ]
    user = (
        f"视频标题：{script.title}\n\n逐镜内容：\n" + "\n".join(lines)
        + "\n\n可用 BGM 曲库：\n" + ("\n".join(track_lines) or "（曲库为空，track 留空字符串）")
        + "\n\n请输出完整导演编排 JSON。"
    )
    raw = _chat(model_id, user, temperature=0.6, system_prompt=DIRECTOR_SYSTEM)
    return _extract_json(raw)


# ============ 多阶段 Agent 导演（v2）：风格定调 → 分批逐镜编排 → 节奏审查 ============

STYLE_BIBLE_SYSTEM = """你是顶尖短视频视觉总监，为一部竖屏口播视频定调整体视觉风格（风格圣经）。

只输出 JSON，不输出任何其他文字：
{
  "look": {
    "preset": "paper|editorial|cinema|graphic|dark",
    "mode": "light|dark",
    "bg": "paper|dark",
    "accent": "#C8452D",
    "palette": ["#F2EDE4", "#E6DCCB"],
    "ink": "#14110F",
    "vignette": 0.3,
    "subtitleStyle": "bold",
    "type": {"display": "NotoSerifSC", "body": "NotoSansSC", "mono": "JetBrainsMono"},
    "grid": {"margin": 96, "columns": 6, "baseline": 12},
    "texture": {"grain": 0.05, "paper": 0.35, "halftone": 0.0, "vignette": 0.12},
    "atmosphere": {"kind": "none", "opacity": 0.5}
  },
  "kicker": "开场标题上方的小字（≤12字，可为空字符串）",
  "titleCard": true,
  "bgm": {"track": "曲库中的曲目名", "volume": 0.72},
  "pacing": "全片节奏与情绪曲线一句话描述（内部参考，不影响渲染）"
}

字段说明与硬约束：
1. preset 从五套里选：paper（暖白纸感）、editorial（编辑排版/衬线）、cinema（中性电影暗调）、
   graphic（图形/海报）、dark（深色）。**默认 paper**；只有悬疑/夜景/科技发布会这类题材确实需要时才选 dark。
2. palette 是 [背景色, 次色]，bg 为 paper 时两个都必须是浅色（背景亮度 > 0.5）；
   ink 是正文字色，与背景对比度必须 ≥ 4.5:1（浅底配深墨、深底配米白）。
3. accent 要低饱和、有印刷感（朱红/墨绿/芥黄/赭石），**禁用荧光青、霓虹紫、纯黑配霓虹**。
4. vignette：paper 0~0.4，cinema 0.8~1.3，其余按需；不要全片重暗角。
5. subtitleStyle："bold"（白字描边，普适）或 "pill"（半透明胶囊，仅图形/科技感）
6. type：display 用 NotoSerifSC（编辑/故事）或 SmileySans（图形/科技），body 用 NotoSansSC，
   mono 用 JetBrainsMono；不要用系统默认黑体。
7. grid：margin 80~120、columns 4~8、baseline 8~16；texture 各项 0~1。
8. atmosphere：全片氛围粒子层，kind 从 "none"|"stars"|"rain"|"dust"|"embers" 选；
   **默认 none**，只有纪实回忆/雨夜等确实加分时才用，禁止用星空凑氛围。
9. bgm：曲库里没有贴合本片气质的曲目时，track 填 "__search__" 并加一个 "query" 字段
   （英文风格关键词，如 "documentary cinematic ambient space"）；有贴合的就逐字选曲库名，
   严禁编造曲库里不存在的曲名。volume 0.2~1.0（口播为主建议 0.6~0.8）
10. 严禁 AI 味，下面四条一条都不能沾：深色背景配霓虹光、字都堆在正中间、紫色渐变、
    所有东西都淡入淡出。
11. 风格要服务内容：先判断题材气质（故事/盘点/悬疑/励志/科普），再定风格，避免千篇一律。"""

SHOT_DIRECTOR_SYSTEM = """你是资深短视频剪辑导演，正在为竖屏口播视频做【逐镜编排】（代码场景/运镜/转场/调色/浮层/音效/氛围/强调词）。
全局风格圣经已由视觉总监定好，你负责让每一镜都在该风格内做出变化和节奏。

只输出 JSON，不输出任何其他文字：
{"shots": [
  {"scene": null,
   "layout": "statement",
   "align": "left",
   "textStyle": "display",
   "camera": "push|pull|pan_left|pan_right|tilt_up|tilt_down|diag_in|diag_out|dolly_zoom|handheld|still",
   "cameraPerLine": ["push", "pan_left"],
   "intensity": 1.0,
   "transition": "dissolve|whip|zoom|flash|cut|glitch|slide",
   "grade": {"contrast": 1.05, "saturate": 1.1, "brightness": 1.03, "tintOpacity": 0.2},
   "grain": 0.06,
   "overlay": null,
   "sfxMoment": null,
   "atmosphere": null,
   "emphasis": ["关键词"]}
 ]}

shots 数量必须严格等于输入镜头数量，顺序一一对应。

字段语义（发挥导演功力，不要千镜一面）：
1. scene（代码绘制动画场景，本镜画面的主体！）：只允许 null 或 {"kind":"gen:<项目id>:<序号>"}——
   gen 场景由本地 agent 在制作阶段为台词现场编写（注册表：remotion-engine/src/gen/registry.ts）。
   若输入给出了【可用 gen 场景清单】，按台词意象就近选用（相邻镜头不要用相同 kind），可带参数：
   {"kind":"gen:<pid>:<NN>","palette":["#1a1030","#3a1c10"],"accent":"#ff9a3d","speed":1.2}
   （palette 两色贴台词情绪；speed 0.5~2）
   没有清单或没有贴切的场景就写 null——引擎只认 gen: 前缀，其他 kind 一律忽略并回退渐变图，
   编造不存在的场景 kind 等于白编。scene 镜头 grade.tintOpacity 建议 0.1~0.2 保持画面通透
2. camera（本镜主运镜，作用于图片/占位/场景镜头）：
   push=缓推（走近/强调），pull=缓拉（抽离/释然），pan_left/pan_right=横摇（并列/环境），
   tilt_up/tilt_down=上下摇（压迫/仰望），diag_in/diag_out=斜推斜拉（动感/失控），
   dolly_zoom=滑动变焦（眩晕/震惊/违和感爆发），handheld=手持晃动（纪实/慌乱/真实感），still=静止（冷静/定格/沉重）。
   intensity 0.6~1.6：平静 0.8~1.0，紧张 1.1~1.3，高潮 1.3~1.6
3. cameraPerLine（可选）：逐句运镜数组，长度等于本镜句数，句与句之间切机位制造节奏；多句镜头建议使用，
   单句镜头省略此字段
4. transition（进入本镜的转场）：dissolve=柔和（默认），whip=甩镜（情绪突变），zoom=变焦模糊（悬念/追问），
   flash=闪白（爆点一瞬），cut=硬切（冷峻/纪实），glitch=故障错位（崩溃/系统/反转/数字失误），
   slide=推移（话题切换/章节感）。第一镜固定 dissolve；相邻两镜不要用相同强转场
5. grade：调色跟随台词情绪。低谷/悬疑 → saturate 0.7~0.9、tintOpacity 0.3~0.4；
   高潮/励志 → saturate 1.15~1.4、contrast 1.1~1.25、tintOpacity 0~0.1；平静用默认附近。
   grain 0~0.12：纪实/回忆 0.08~0.12，干净现代 0.03~0.05
6. overlay（最多一个动效浮层，出现台词核心信息时使用，不要每镜都用，全片建议 20%~40% 镜头有）：
   {"kind":"counter","value":1234,"label":"标题","unit":"万"} 数字冲击（台词含重要数字时首选）
   {"kind":"typewriter","text":"要打出的短句"} 打字机（悬念揭示/系统提示，≤18字）
   {"kind":"chat","side":"left","text":"消息内容","name":"对方"} 聊天气泡（对话/收到消息/被质疑）
   {"kind":"stat","label":"状态名","from":100,"to":20,"unit":"%"} 状态条（能量/健康/进度变化，from>to 掉血）
   {"kind":"toast","text":"提示文字","tone":"error|info|success"} 告警卡（系统通知/警告/成就）
   {"kind":"terminal","lines":["第1行","第2行"]} 终端窗口（代码/报错/日志，≤4行）。
   与台词内容无关就不要硬塞；同类浮层相邻镜头不要重复
7. sfxMoment（高潮点音效，全片 1~3 次即可）："impact"=重锤（爆点开局），"riser"=上扬（镜尾蓄力接高潮），
   "whoosh"=呼啸（速度感）；平静镜头为 null
8. atmosphere（本镜氛围覆盖全局，谨慎使用）：{"kind":"rain","opacity":0.5} 等，全局已有氛围时一般 null，
   只在情绪剧变的镜头单独切换（如全局 dust、高潮镜 embers）
9. emphasis：本镜台词中值得金色高亮的关键词数组（数字/人名/引语原文），每镜 0~3 个，逐字匹配台词，
   必须是台词的连续子串
10. layout（版式，MotionShow 使用）：cover=封面/开场、statement=一句主张、quote=引语、
    list=并列清单、data=数字/对比、photo-full=满屏图、photo-inset=图文错位、
    comparison=左右对比、caption-bottom=底部字幕图、chapter=章节过渡；按台词内容选，
    连续两镜不要同版式。align 默认 left（左对齐），只有引语/封面才用 center；
    textStyle 从 display|body|mono 选，默认 display。**禁止每镜都居中**。

编排规则：
- 相邻镜头运镜不得相同；同向运镜（如 push 和 diag_in）连续不超过 2 镜
- 情绪曲线：整体跟随台词（低谷→积蓄→爆发→收尾），强度和转场要服务曲线
- 只输出 JSON"""

CRITIC_SYSTEM = """你是苛刻的剪辑节奏审查员，审查一份竖屏短视频的逐镜编排方案，只修正真正的问题，不推翻整体。

只输出 JSON，不输出任何其他文字：
{"patches": [
  {"index": 3, "camera": "pull", "transition": "zoom", "intensity": 1.2,
   "overlay": null, "sfxMoment": "impact", "reason": "修复原因"}
 ]}

没有问题就输出 {"patches": []}。patches 只包含需要修改的镜头，index 从 0 开始；
patch 里只写需要覆盖的字段（camera/transition/intensity/overlay/sfxMoment/atmosphere/grain 任选），不要写 reason 以外的解释。

审查清单（按优先级）：
1. 相邻两镜主运镜相同 → 改后一镜
2. 相邻两镜都用强转场（whip/flash/glitch/zoom）→ 后一镜改 dissolve 或 cut
3. 全片转场/运镜过于单调（连续 4 镜以上同运镜或同转场）→ 打破循环
4. overlay 滥用（相邻镜头都有浮层，或超过一半镜头有）→ 删掉信息量低的
5. sfxMoment 超过 3 个或相邻两镜都有 → 删到只剩真正的爆点
6. 情绪曲线断裂：高潮镜头强度 < 1.1、低谷镜头强度 > 1.3 → 修正 intensity
7. 调色与情绪明显矛盾（如高潮镜头 saturate<0.8）→ 修正 grade"""


def _chat_json(
    model_id: str | None,
    user_prompt: str,
    temperature: float,
    system_prompt: str,
    retries: int = 1,
) -> dict:
    """带一次重试的 JSON 对话：解析失败/网络异常时重试一次。"""
    last_err: Exception | None = None
    for attempt in range(retries + 1):
        try:
            raw = _chat(model_id, user_prompt, temperature=temperature, system_prompt=system_prompt)
            return _extract_json(raw)
        except Exception as e:  # noqa: BLE001 — 重试后由调用方降级
            last_err = e
    raise last_err  # type: ignore[misc]


TRANSLATE_PROMPT_SYSTEM = """你是专业的文生图提示词翻译（中译英），面向 SDXL 类以英文为主的文本编码器。

只输出 JSON：{"prompt_en": "翻译结果", "portrait": true/false}

prompt_en 要求：
1. 完整保留原文的主体、场景、构图、视角、光线、氛围、艺术风格，不增删画面信息
2. 使用地道的 Stable Diffusion 提示词风格（逗号分隔的短语，不写完整句子）
3. 数字与比例照抄（如 9:16），人名/地名按通用英文译名

portrait 判断（用于路由生图模型）：
- 画面主体是人物特写/人像/单人表情动作主导（写真、头像、人物情绪）→ true
- 环境场景、街景、大场面、物件、图表感画面，或人物只是场景中的小元素 → false"""



def translate_image_prompt(text_cn: str, model_id: str | None) -> tuple[str, bool]:
    """中文分镜提示词 → (英文 SDXL 提示词, 是否人像主导)，人像标记用于路由生图模型。"""
    text = (text_cn or "").strip()
    if not text:
        raise ValueError("提示词为空，无法翻译")
    if re.fullmatch(r"[\x00-\x7F]+", text):  # 已是纯 ASCII，无需翻译
        return text, False
    data = _chat_json(
        model_id,
        text,
        temperature=0.2,
        system_prompt=TRANSLATE_PROMPT_SYSTEM,
    )
    out = str(data.get("prompt_en") or "").strip()
    if not out:
        raise RuntimeError("翻译结果为空")
    return out[:600], bool(data.get("portrait"))


def _shot_digest(s, i: int) -> str:
    """把一个镜头压成几行文本（供导演/审查提示词用）。"""
    text = " / ".join(l.text for l in s.lines)
    return f"镜头{i}（共{len(s.lines)}句）：{s.label or '无标签'}｜台词：{text}"


# from_scratch 模式（模板无关选题）追加到导演提示词的硬性禁令。
# 提示词层只是引导，真正的强制在 director.sanitize_plan_for_mode（清洗兜底）。
FROM_SCRATCH_RULE = """

【本片与模板领域无关（from_scratch 模式）——硬性禁令】
1. scene 只允许 null 或 gen:<项目id>:<序号>（本项目现场编写的定制场景）；
   禁止行星/太阳系/星云/海洋/城市等模板场景 kind（引擎会忽略并回退渐变图）。
2. atmosphere 禁止 "stars"（星空）；需要氛围时只用 none/rain/dust/embers。
3. 画面主体交给 gen 场景、配图、配色与构图动效表达；运镜/转场/调色/浮层等通用手段照常用足。"""


def _with_mode(system_prompt: str, template_mode: str | None) -> str:
    """按模板相关性模式拼装系统提示词。"""
    if template_mode == "from_scratch":
        return system_prompt + FROM_SCRATCH_RULE
    return system_prompt


RELEVANCE_SYSTEM = """你是模板资产审核员。判断一部竖屏口播视频的选题，与渲染引擎的内置能力是否相关。

渲染引擎现状：没有内置领域场景（旧的行星/宇宙/地球演化代码场景库已删除，不存在了）。
scene 只支持 gen:<pid>:<NN>（由本地 agent 为本片现场编写的定制场景）；
另有通用的运镜/转场/字幕/调色/颗粒/BGM 词表。

只输出 JSON，不输出任何其他文字：
{"mode": "reuse|from_scratch",
 "reason": "一句话判定理由（≤60字）",
 "reusable": ["可复用项；无关则为空数组"]}

判定标准：当前引擎没有任何内置领域场景可复用，因此 mode 一律 "from_scratch"；
reusable 只填通用词表类（如 "通用运镜词表"、"sfx 音效曲库"）。
例外：仅当输入明确给出了本片已编写的 gen 场景清单且选题与其强相关时，才可填 "reuse" 并列出对应 gen 场景。
拿不准时选 from_scratch（宁可中性渲染 + 现场编写，不许给无关内容塞领域动效）。"""


def judge_template_relevance(script: ScriptDraft, model_id: str | None) -> dict:
    """阶段 0：判定选题与模板库相关性，返回 {mode, reason, reusable} 原始输出。"""
    shot_lines = [_shot_digest(s, i + 1) for i, s in enumerate(script.shots)]
    user = (
        f"视频标题：{script.title}\n\n逐镜内容：\n" + "\n".join(shot_lines)
        + "\n\n请输出模板相关性判定 JSON。"
    )
    return _chat_json(model_id, user, 0.2, RELEVANCE_SYSTEM)


def generate_style_bible(
    script: ScriptDraft,
    style_hint: str,
    prompt_hint: str,
    bgm_tracks: list[dict],
    model_id: str | None,
    template_mode: str | None = None,
) -> dict:
    """阶段 1：视觉风格圣经（look/kicker/曲库选曲/节奏基调）。"""
    shot_lines = [_shot_digest(s, i + 1) for i, s in enumerate(script.shots)]
    track_lines = [
        f"- {t.get('name', '')}（{t.get('title') or '无标题'}{'，标签：' + '、'.join(t.get('tags') or []) if t.get('tags') else ''}）"
        for t in bgm_tracks
    ]
    parts = [
        f"视频标题：{script.title}",
        f"创作者风格要求：{style_hint or '（未指定，自行判断题材气质）'}",
    ]
    if prompt_hint:
        parts.append(f"创作者补充要求（优先级最高）：{prompt_hint[:800]}")
    parts.append("逐镜内容：\n" + "\n".join(shot_lines))
    parts.append("可用 BGM 曲库：\n" + ("\n".join(track_lines) or "（曲库为空，track 留空字符串）"))
    parts.append("请输出完整风格圣经 JSON。")
    return _chat_json(
        model_id, "\n\n".join(parts), 0.7, _with_mode(STYLE_BIBLE_SYSTEM, template_mode)
    )


def generate_shot_plans(
    script: ScriptDraft,
    style_bible: dict,
    start_idx: int,
    end_idx: int,
    tail_context: list[dict],
    model_id: str | None,
    template_mode: str | None = None,
) -> dict:
    """阶段 2：分批逐镜编排。负责 script.shots[start_idx:end_idx]（0-based，含头不含尾）。

    tail_context: 上一批最后 2 镜的实际决策（紧凑 dict），用于保持连续性；首批传空列表。
    """
    batch = script.shots[start_idx:end_idx]
    shot_lines = [_shot_digest(s, i + 1) for i, s in enumerate(batch)]
    look = style_bible.get("look") or {}
    pacing = style_bible.get("pacing") or ""
    parts = [
        "【全局风格圣经】\n" + json.dumps(look, ensure_ascii=False),
    ]
    if pacing:
        parts.append(f"【全片节奏基调】{pacing}")
    if tail_context:
        parts.append(
            "【上一批末尾已定决策（保持连续、避免重复）】\n"
            + json.dumps(tail_context, ensure_ascii=False)
        )
    total = len(script.shots)
    parts.append(
        f"【本次负责 镜头{start_idx + 1}~{end_idx}（全片共 {total} 镜）】\n" + "\n".join(shot_lines)
    )
    parts.append(
        f"本批共 {len(batch)} 个镜头，shots 数组长度必须等于 {len(batch)}，"
        "请输出逐镜编排 JSON。"
    )
    return _chat_json(
        model_id, "\n\n".join(parts), 0.7, _with_mode(SHOT_DIRECTOR_SYSTEM, template_mode)
    )


def critic_rhythm(script: ScriptDraft, plan_shots: list[dict], model_id: str | None) -> dict:
    """阶段 3：节奏审查，返回 {"patches": [...]}；只含违规镜头的最小修改。"""
    compact = []
    for i, (s, p) in enumerate(zip(script.shots, plan_shots)):
        text = " / ".join(l.text for l in s.lines)
        compact.append(
            {
                "index": i,
                "台词": text,
                "决策": {
                    k: p.get(k)
                    for k in ("camera", "cameraPerLine", "intensity", "transition", "overlay", "sfxMoment", "grain")
                    if p.get(k) is not None
                }
                | {"grade": p.get("grade") or {}},
            }
        )
    user = (
        f"视频标题：{script.title}（共 {len(script.shots)} 镜）\n\n逐镜方案：\n"
        + json.dumps(compact, ensure_ascii=False, indent=1)
        + "\n\n请按审查清单输出 patches JSON。"
    )
    return _chat_json(model_id, user, 0.2, CRITIC_SYSTEM)


def optimize_script(req: OptimizeRequest) -> ScriptDraft:
    user = (
        f"请按以下要求修改这个分镜脚本，保持 JSON 结构不变，只输出修改后的完整 JSON：\n"
        f"修改要求：{req.instruction}\n\n"
        f"当前脚本：\n{req.script.model_dump_json(indent=1)}"
    )
    raw = _chat(req.model_id, user, temperature=0.6)
    return ScriptDraft.model_validate(_extract_json(raw))


HOTSPOT_BRIEFING_SYSTEM = """你是资深短视频编导，为「今日早报」的热点做深度点评，帮创作者快速决定怎么拍。

只输出 JSON，不输出任何其他文字：
{"comments": [
  {"ref": "原样返回对应的热点标题",
   "form": "适合形式（口播/剧情演绎/盘点/采访街采/图文快讯 等，≤10字）",
   "angle": "一句话拍摄角度（≤30字，具体可执行）",
   "risk": "风险提示（≤20字；无风险写"无"）"}
]}

规则：
1. comments 数量必须等于输入热点数量，顺序一一对应
2. angle 必须和热点内文强相关，不写空话
3. 涉及时政/未经证实信息时 risk 必须提示（如"涉时政需谨慎""信息未证实"）"""


def generate_briefing_commentary(brief_items: list[dict], model_id: str | None) -> list[dict]:
    """为早报热点逐条生成拍摄点评（形式/角度/风险）。"""
    lines = []
    for i, b in enumerate(brief_items, start=1):
        lines.append(f"{i}. {b.get('title', '')}（平台：{b.get('platform', '')}）")
    user = "以下是今日早报热点：\n" + "\n".join(lines) + "\n\n请逐条给出拍摄点评。"
    raw = _chat(model_id, user, temperature=0.7, system_prompt=HOTSPOT_BRIEFING_SYSTEM)
    data = _extract_json(raw)
    comments = data.get("comments", [])
    if not isinstance(comments, list):
        raise ValueError("模型返回的 comments 不是数组")
    return [c for c in comments if isinstance(c, dict) and c.get("ref")]


TOOL_META_SYSTEM = """你是效率工具测评师，帮中国职场人（运营、行政、工程师、政府工作人员、产品经理、程序员、硬件工程师、老板、员工）挑提效工具。
根据 GitHub 仓库信息，判断每个工具适合哪些职场人群、解决什么问题、提效点在哪。

只输出 JSON，不输出任何其他文字：
{"tools": [
  {"ref": "原样返回仓库名（owner/repo）",
   "intro": "中文介绍：把仓库英文描述翻译成通顺中文（≤50字），保留它是什么/能干什么的关键信息，描述为空就按仓库名合理概括",
   "audience": ["适合人群，从：程序员/产品经理/设计师/运营·自媒体/行政·办公/硬件工程师/老板·管理者/学生·研究者/政府·事业单位/全员通用 中选1~3个"],
   "use": "一句话说明它是什么、解决什么问题（≤36字）",
   "why": "提效点/为什么值得试（≤36字）"}
]}

规则：
1. tools 数量必须等于输入数量，顺序一一对应，ref 原样返回
2. intro/use/why 必须基于仓库描述，英文描述翻译成中文大白话，不编造仓库里没有的功能
3. 受众宁可保守：纯开发库不要硬塞给运营或行政
4. 只输出 JSON"""


def generate_tool_meta(tools: list[dict], model_id: str | None = None) -> list[dict]:
    """为 GitHub 热门仓库逐个生成职场受众/用途/亮点解读。"""
    lines = []
    for i, t in enumerate(tools, start=1):
        lines.append(
            f"{i}. {t.get('name', '')}（语言：{t.get('language') or '未知'}；热度：{t.get('stars') or '无'}）\n"
            f"   描述：{t.get('description') or '（无）'}"
        )
    user = "以下是 GitHub 今日热门仓库：\n" + "\n".join(lines) + "\n\n请逐个给出受众与提效解读。"
    raw = _chat(model_id, user, temperature=0.4, system_prompt=TOOL_META_SYSTEM)
    data = _extract_json(raw)
    tools_out = data.get("tools", [])
    if not isinstance(tools_out, list):
        raise ValueError("模型返回的 tools 不是数组")
    return [t for t in tools_out if isinstance(t, dict) and t.get("ref")]


# ============ 六步流水线：搜索 → 编排 → 找图 → 定样式 → 检查 → 直出 ============

RESEARCH_SYSTEM = """你是知识科普作者，最在意事实准确。
根据给定的网络检索资料，围绕主题整理一篇知识文章。

只输出 JSON，不输出任何其他文字：
{"topic": "主题",
 "nodes": [{"year": "年份/时期（≤16字）", "title": "谁、做了什么（≤30字）",
   "what": "具体经过（≤150字）", "why": "为什么重要（≤150字）",
   "sources": [{"title": "来源标题", "url": "来源链接"}]}]}

规则：
1. 挑 8~10 个关键节点，按时间先后排序；每个节点写清哪一年、谁、做了什么、为什么重要
2. 年份、人名、数字、原话都必须有出处：sources 从给定资料的 [#N] 编号里选，逐字抄对应的 URL，
   严禁编造资料里不存在的链接；每节点 1~3 个来源
3. 找不到可靠出处的节点直接删掉，宁缺毋滥
4. 资料互相矛盾时以更权威来源为准，并在 why 里注明分歧
5. 只输出 JSON"""

FLOW_COPY_SYSTEM = """你是抖音知识视频的编剧，擅长把复杂的事讲给完全不懂的人听。
把知识文章改写成视频文案。

只输出 JSON，不输出任何其他文字：
{"title": "视频标题（≤24字，口语化有钩子）",
 "shots": [{"year": "时间/时期（≤16字，可为空）", "label": "本幕小标题（≤12字）",
   "colors": ["#RRGGBB", "#RRGGBB"], "lines": [{"text": "台词"}]}]}

规则：
1. 这是一条竖屏视频：观众只看画面上的字（配音乐），所以每句话都要短、一看就懂，
   一屏不超过 20 个字；每幕 1~3 句
2. 分成一幕一幕（按目标时长控制幕数）：开头先抛一个问题让观众猜；中间当故事讲，
   用至少一个生活里的比方，安排一次反转；结尾落到普通人身上
3. 不解释就用的专业术语，一律换成大白话或当场用一句话讲清
4. 只允许使用文章里出现的事实；文章没有的不要编
5. colors 两个 hex 贴合本幕情绪（暖=亮/燃，冷=暗/沉）
6. 只输出 JSON"""

IMAGE_QUERY_SYSTEM = """你是科普视频的资料图片策划。为分镜的每一幕给出找图检索词。

只输出 JSON，不输出任何其他文字：
{"scenes": [{"index": 1, "query_en": "英文检索词", "query_zh": "中文检索词",
  "note": "这一幕想要什么样的图（≤30字）"}]}

规则：
1. 每一幕配一张真实的图才不干巴：老照片、人物肖像、论文首页、机器的样子、实物/现场照片
2. query_en 用英文（图片库英文命中率高），query_zh 作补充，两者不要直译重复
3. 具体优于宽泛：搜 "Apollo 11 command module" 而不是 "space"
4. index 从 1 开始、数量与输入幕数完全一致、顺序一一对应
5. 只输出 JSON"""

STYLE_PROPOSAL_SYSTEM = """你是短视频视觉总监。为一条知识科普竖屏视频提出 3 个差别大的画面风格，供创作者挑选。

只输出 JSON，不输出任何其他文字：
{"proposals": [{"name": "风格名（≤8字）", "why": "一句为什么适合这条视频（≤40字）",
  "kicker": "开场标题上方的小字标语（≤16字，可为空字符串）",
  "look": {"preset": "paper|editorial|cinema|graphic|dark", "mode": "light|dark",
    "accent": "#RRGGBB", "palette": ["#RRGGBB", "#RRGGBB"], "ink": "#RRGGBB",
    "vignette": 0.8, "subtitleStyle": "bold|pill", "bg": "dark|paper",
    "atmosphere": {"kind": "none|stars|rain|dust|embers", "opacity": 0.5}}}]}

规则：
1. 三个风格必须一眼能区分：明暗（light 浅色 / dark 深色）、冷暖、质感都要拉开；
   **至少两个是浅色（paper/editorial/graphic），最多一个 dark**
2. 严禁 AI 味，下面四条一条都不能沾：深色背景配霓虹光、字都堆在正中间、紫色渐变、所有东西都淡入淡出
3. palette 是画面主基调两色；bg=paper 时整体浅色纸感、ink 为深墨色；vignette 0~1.5
4. atmosphere 只在确实加分时给 none 以外的值；opacity 0~1
5. 风格贴合题材气质（历史纪实/硬核科技/生活烟火……），别套模板
6. 只输出 JSON"""

FLOW_REVIEW_SYSTEM = """你是知识科普视频的终审编辑，负责上线前最后检查。对照知识文章逐项审查整个视频方案。

只输出 JSON，不输出任何其他文字：
{"passed": true 或 false,
 "off_topic": ["偏题之处（无则空数组）"],
 "issues": [{"severity": "high|medium|low", "where": "位置（第几幕/哪个环节）",
   "problem": "问题描述", "suggestion": "修改建议"}],
 "summary": "总评（≤80字）"}

检查项（按优先级）：
1. 是否偏题：内容是否始终围绕主题，跑题的写进 off_topic
2. 内容是否属实：逐句对照文章——文案里出现文章没有的事实/事件 = high；
   数字、年份、人名与文章不符 = high；表述含糊但不算错 = low
3. 画面风格是否符合主题：风格名/色调/氛围与题材气质是否匹配；
   出现"深色配霓虹 / 字堆正中 / 紫色渐变 / 星空凑氛围"类 AI 味 = high（必须重做风格）
4. 找图：检索词/选图是否贴合该幕内容，宽泛不贴 = medium
5. 结构：开头有没有问题钩子、有没有生活化比方、有没有反转、结尾是否落到普通人；缺失 = medium
6. 没有问题就不凑数；有任何 high 问题时 passed 必须为 false。只输出 JSON"""


def generate_research(topic: str, context: str, model_id: str | None) -> dict:
    """第 1 步：网络资料 → 带出处的知识文章（nodes）。"""
    context = (context or "").strip()
    if len(context) < 800:
        # 资料太薄时模型只能编或返回空，提前给出可行动的报错而不是让用户猜
        raise ValueError(
            f"网络检索资料太少（仅 {len(context)} 字符，可能被限流或关键词太口语化），"
            "无法整理出有出处的知识文章；请更换关键词表述重试"
        )
    user = (
        f"主题：{topic}\n\n以下是刚从网络检索到的资料（编号 [#N]）：\n"
        + context[:16000]
        + "\n\n请整理成知识文章 JSON。"
    )
    data = _chat_json(model_id, user, 0.35, RESEARCH_SYSTEM)
    nodes = data.get("nodes")
    if not isinstance(nodes, list) or not nodes:
        # 一次纠偏重试：格式对但 nodes 缺失/为空，明确指出问题再要一次
        data = _chat_json(
            model_id,
            user + "\n\n注意：上一次输出缺少非空的 nodes 数组。请严格按格式重新输出，"
            "nodes 必须是非空数组，找不到可靠出处的节点可少给但不能为空。",
            0.35,
            RESEARCH_SYSTEM,
        )
        nodes = data.get("nodes")
    if not isinstance(nodes, list) or not nodes:
        head = json.dumps(data, ensure_ascii=False)[:120]
        raise ValueError(f"模型未返回知识节点（资料可能不相关或过少）；模型输出开头：{head}")
    return data


def generate_flow_copy(article_text: str, target_seconds: int, model_id: str | None) -> dict:
    """第 2 步：知识文章 → 通俗视频文案（ScriptDraft 形状）。"""
    act_counts = max(8, min(22, round(target_seconds / 9)))
    user = (
        f"知识文章：\n{article_text[:12000]}\n\n"
        f"目标时长约 {target_seconds} 秒，建议分 {act_counts} 幕左右。\n"
        "请输出视频文案 JSON。"
    )
    return _chat_json(model_id, user, 0.8, FLOW_COPY_SYSTEM)


def generate_image_queries(script: ScriptDraft, model_id: str | None) -> dict:
    """第 3 步：分镜 → 每幕找图检索词。"""
    lines = []
    for i, s in enumerate(script.shots):
        text = " / ".join(l.text for l in s.lines)
        lines.append(f"第{i + 1}幕：{s.year or ''} {s.label or ''}｜内容：{text}")
    user = (
        f"视频标题：{script.title}（共 {len(script.shots)} 幕）\n\n" + "\n".join(lines)
        + f"\n\nscenes 数组长度必须等于 {len(script.shots)}。请输出找图检索词 JSON。"
    )
    data = _chat_json(model_id, user, 0.6, IMAGE_QUERY_SYSTEM)
    scenes = data.get("scenes")
    if not isinstance(scenes, list) or not scenes:
        raise ValueError("模型未返回找图检索词")
    return data


def generate_style_proposals(topic: str, first_scene_desc: str, model_id: str | None) -> dict:
    """第 4 步：3 个差别大的画面风格方案（含样图用 look）。"""
    user = (
        f"视频主题：{topic}\n"
        f"开头一幕的画面与文案：{first_scene_desc}\n\n"
        "请输出 3 个差别大的风格方案 JSON。"
    )
    data = _chat_json(model_id, user, 0.85, STYLE_PROPOSAL_SYSTEM)
    proposals = data.get("proposals")
    if not isinstance(proposals, list) or not proposals:
        raise ValueError("模型未返回风格方案")
    return data


def generate_flow_review(
    topic: str,
    article_text: str,
    copy_text: str,
    storyboard_text: str,
    style_desc: str,
    model_id: str | None,
) -> dict:
    """第 5 步：终审（偏题/属实/风格贴合/结构）。"""
    user = (
        f"主题：{topic}\n\n【知识文章（事实依据）】\n{article_text[:9000]}\n\n"
        f"【视频文案】\n{copy_text[:6000]}\n\n"
        f"【画面方案】\n{storyboard_text[:5000]}\n\n"
        f"【风格】\n{style_desc}\n\n请输出终审 JSON。"
    )
    return _chat_json(model_id, user, 0.2, FLOW_REVIEW_SYSTEM)


def llm_available() -> bool:
    return any(m.available for m in load_models())
