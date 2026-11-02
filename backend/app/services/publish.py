# -*- coding: utf-8 -*-
"""发布模块：AI 平台化文案 + 封面抽取 + 抖音官方 API 推送 + 小红书半自动推送。

合规边界（重要）：
- 抖音走官方开放平台 OpenAPI（用户在 open.douyin.com 注册应用并授权自己的账号），
  未配置凭证时自动降级为半自动（复制文案 + 打开创作者上传页）。
- 小红书对个人创作者没有官方发布 API，自动脚本发帖违反平台协议，因此只做半自动：
  AI 文案 + 封面 + 打开创作者上传页，最后一步由人点击发布。
"""
import hashlib
import json
import os
import subprocess
import time
import uuid
from pathlib import Path

import httpx

from ..config import FFMPEG_BIN, PROJECTS_DIR, RENDERS_DIR, STORAGE_DIR
from ..schemas import ScriptDraft
from .llm import _chat

# ---------- AI 平台化文案 ----------

DOUYIN_COPY_SYSTEM = """你是抖音爆款短视频运营。根据分镜脚本写发布文案。

只输出 JSON，不输出任何其他文字：
{"title": "视频标题（≤24字，口语化有钩子，可含1个表情）",
 "desc": "正文描述（2~3行，第一行承接标题钩子，可与评论区互动引导结合）",
 "tags": ["话题1", "话题2", "话题3", "话题4"]}

规则：
1. title 不带 # 号；tags 是话题名（不带 # 号），3~5 个，混合大话题+精准话题
2. 贴合脚本内容，不用夸张党标题，不造假
3. 只输出 JSON"""

XHS_COPY_SYSTEM = """你是小红书爆款笔记运营。根据分镜脚本写视频笔记的发布文案。

只输出 JSON，不输出任何其他文字：
{"title": "笔记标题（≤20字，小红书风格，可用1~2个 emoji）",
 "desc": "正文（3~6行，第一行抓眼球；用短句分行的口语种草风；结尾带互动引导）",
 "tags": ["话题1", "话题2", "话题3", "话题4", "话题5"]}

规则：
1. 小红书语感：亲切、有个人视角、适度 emoji（正文 2~4 个，不堆砌）
2. tags 4~6 个，含 1~2 个高流量大话题 + 2~3 个精准话题
3. 内容真实贴合脚本，不虚假承诺
4. 只输出 JSON"""

COPY_SYSTEMS = {"douyin": DOUYIN_COPY_SYSTEM, "xhs": XHS_COPY_SYSTEM}
PLATFORMS = ("douyin", "xhs")

# 半自动推送：各平台创作者上传页（人工完成最后一步发布）
UPLOAD_PAGES = {
    "douyin": "https://creator.douyin.com/creator-micro/content/upload",
    "xhs": "https://creator.xiaohongshu.com/publish/publish",
}


def _copy_path(project_id: str) -> Path:
    return PROJECTS_DIR / project_id / "publish_copy.json"


def _script_fingerprint(script: ScriptDraft) -> str:
    return hashlib.md5(script.model_dump_json().encode("utf-8")).hexdigest()[:12]


def _validate_copy(raw, platform: str) -> dict:
    d = raw if isinstance(raw, dict) else {}
    title = str(d.get("title") or "").strip()[:40]
    desc = str(d.get("desc") or "").strip()[:1000]
    tags = [str(t).strip().lstrip("#") for t in (d.get("tags") or []) if str(t).strip()]
    tags = [t for t in tags if t][:6]
    if not title:
        raise ValueError(f"{platform} 文案缺少标题")
    return {"title": title, "desc": desc, "tags": tags}


def get_or_create_copy(project_id: str, script: ScriptDraft, platform: str, model_id: str | None) -> dict:
    """AI 平台化文案（按脚本哈希缓存，脚本不变不重复生成）。"""
    if platform not in PLATFORMS:
        raise ValueError(f"未知平台：{platform}")
    path = _copy_path(project_id)
    fp = _script_fingerprint(script)
    data = {}
    if path.exists():
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001
            data = {}
    if data.get("script_hash") == fp and data.get("copies", {}).get(platform):
        return data["copies"][platform]

    lines = []
    for i, s in enumerate(script.shots, 1):
        text = " / ".join(l.text for l in s.lines)
        lines.append(f"{i}. [{s.year}] {s.label}：{text}")
    user = f"视频标题：{script.title}\n\n分镜脚本：\n" + "\n".join(lines) + "\n\n请输出发布文案 JSON。"
    raw = _chat(model_id, user, temperature=0.8, system_prompt=COPY_SYSTEMS[platform])
    copy = _validate_copy(_extract_json_text(raw), platform)

    data["script_hash"] = fp
    data.setdefault("copies", {})[platform] = copy
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    return copy


def _extract_json_text(text: str) -> dict:
    import re

    text = text.strip()
    m = re.search(r"```(?:json)?\s*(.*?)```", text, re.S)
    if m:
        text = m.group(1).strip()
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"LLM 返回中未找到 JSON: {text[:120]}")
    body = text[start : end + 1]
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        # LLM 常输出非法转义（如 \d、\'），把不合法的 \X 修正为 \\X 后重试
        fixed = re.sub(r'\\(?!["\\/bfnrtu])', r"\\\\", body)
        return json.loads(fixed)


def load_all_copies(project_id: str) -> dict:
    path = _copy_path(project_id)
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8")).get("copies", {})
    except Exception:  # noqa: BLE001
        return {}


# ---------- 封面抽取 ----------

def extract_cover(project_id: str, at_ratio: float = 0.08) -> Path | None:
    """从成片抽取封面帧（默认取 8% 处，避开片头标题卡）。无成片返回 None。"""
    video = RENDERS_DIR / project_id / "final.mp4"
    if not video.exists() or not FFMPEG_BIN.exists():
        return None
    out = RENDERS_DIR / project_id / "cover.jpg"
    if out.exists():
        return out
    dur = _video_duration(video)
    at = max(1.0, dur * at_ratio)
    cmd = [
        str(FFMPEG_BIN), "-y", "-v", "error", "-ss", f"{at:.2f}",
        "-i", str(video), "-frames:v", "1", "-q:v", "3", str(out),
    ]
    try:
        subprocess.run(cmd, timeout=120, check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:  # noqa: BLE001 — 封面失败不阻断
        return None
    return out if out.exists() else None


def _video_duration(video: Path) -> float:
    ffprobe = FFMPEG_BIN.with_name("ffprobe.exe")
    bin_path = ffprobe if ffprobe.exists() else FFMPEG_BIN
    try:
        r = subprocess.run(
            [str(bin_path), "-v", "error", "-show_entries", "format=duration",
             "-of", "csv=p=0", str(video)],
            capture_output=True, text=True, timeout=60, check=True,
        )
        return float(r.stdout.strip().splitlines()[0])
    except Exception:  # noqa: BLE001
        return 30.0


# ---------- 抖音官方 OpenAPI ----------

DOUYIN_API_BASE = os.getenv("DOUYIN_API_BASE", "https://open.douyin.com")
TOKENS_DIR = STORAGE_DIR / "tokens"


def douyin_configured() -> bool:
    return bool(os.getenv("DOUYIN_CLIENT_KEY") and os.getenv("DOUYIN_CLIENT_SECRET"))


def douyin_authorized() -> bool:
    token = _douyin_load_token()
    return bool(token and token.get("access_token") and token.get("expires_at", 0) > time.time())


def douyin_authorize_url(state: str | None = None) -> dict:
    """生成 OAuth 授权页 URL；用户在浏览器完成授权后，redirect_uri 会带上 code。"""
    key = os.getenv("DOUYIN_CLIENT_KEY", "")
    redirect = os.getenv("DOUYIN_REDIRECT_URI", "")
    if not (key and redirect):
        raise RuntimeError("未配置 DOUYIN_CLIENT_KEY / DOUYIN_REDIRECT_URI（见 .env.example）")
    state = state or uuid.uuid4().hex[:12]
    url = (
        f"{DOUYIN_API_BASE}/platform/oauth/connect/?client_key={key}"
        f"&response_type=code&scope=video.create,video.data&redirect_uri={redirect}&state={state}"
    )
    return {"url": url, "state": state}


def douyin_exchange(code: str) -> dict:
    """授权码换 access_token 并落库（storage/tokens/douyin.json）。"""
    key, secret = os.getenv("DOUYIN_CLIENT_KEY", ""), os.getenv("DOUYIN_CLIENT_SECRET", "")
    if not (key and secret):
        raise RuntimeError("未配置 DOUYIN_CLIENT_KEY / DOUYIN_CLIENT_SECRET")
    r = httpx.post(
        f"{DOUYIN_API_BASE}/oauth/access_token/",
        params={
            "client_key": key, "client_secret": secret,
            "code": code, "grant_type": "authorization_code",
        },
        timeout=60,
    )
    r.raise_for_status()
    body = r.json()
    data = body.get("data") or {}
    if body.get("code") not in (0, "0") or not data.get("access_token"):
        raise RuntimeError(f"抖音授权失败：{body.get('message') or body}")
    token = {
        "access_token": data["access_token"],
        "refresh_token": data.get("refresh_token", ""),
        "open_id": data.get("open_id", ""),
        "expires_in": data.get("expires_in", 0),
        "expires_at": time.time() + int(data.get("expires_in", 0)),
        "saved_at": time.time(),
    }
    TOKENS_DIR.mkdir(parents=True, exist_ok=True)
    (TOKENS_DIR / "douyin.json").write_text(json.dumps(token, ensure_ascii=False, indent=1), encoding="utf-8")
    return token


def _douyin_load_token() -> dict:
    p = TOKENS_DIR / "douyin.json"
    if not p.exists():
        return {}
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return {}


def douyin_publish(project_id: str, title: str, desc: str, tags: list[str]) -> dict:
    """上传成片并创建抖音帖子。返回 {item_id}。上传大文件可能耗时数分钟。"""
    token = _douyin_load_token()
    if not (token and token.get("access_token")):
        raise RuntimeError("尚未授权抖音账号，请先在发布面板完成授权")
    if token.get("expires_at", 0) <= time.time():
        raise RuntimeError("抖音授权已过期，请重新授权")
    video = RENDERS_DIR / project_id / "final.mp4"
    if not video.exists():
        raise RuntimeError("成片不存在，请先渲染")

    text = " ".join(filter(None, [title.strip(), desc.strip(), " ".join("#" + t for t in tags if t)]))
    at = token["access_token"]
    # 1) 上传视频（multipart）
    up = httpx.post(
        f"{DOUYIN_API_BASE}/video/upload/",
        params={"access_token": at},
        files={"video": (video.name, open(video, "rb"), "video/mp4")},
        timeout=1800,
    )
    up.raise_for_status()
    up_body = up.json()
    if up_body.get("code") not in (0, "0"):
        raise RuntimeError(f"抖音上传失败：{up_body.get('message') or up_body}")
    video_id = ((up_body.get("data") or {}).get("video") or {}).get("video_id")
    if not video_id:
        raise RuntimeError(f"抖音上传未返回 video_id：{up_body}")
    # 2) 创建帖子
    cr = httpx.post(
        f"{DOUYIN_API_BASE}/video/create/",
        params={"access_token": at},
        json={"video_id": video_id, "text": text[:1000]},
        timeout=120,
    )
    cr.raise_for_status()
    cr_body = cr.json()
    if cr_body.get("code") not in (0, "0"):
        raise RuntimeError(f"抖音发布失败：{cr_body.get('message') or cr_body}")
    item_id = (cr_body.get("data") or {}).get("item_id", "")
    return {"item_id": item_id, "video_id": video_id}
