# -*- coding: utf-8 -*-
"""在线免版权曲库搜索：Wikimedia Commons（免密钥）+ Openverse（CC/PDM）+ Jamendo（可选）。

只索引明确允许再使用的曲库，返回结果自带许可证信息；导入时把来源与许可
写入曲目元数据，保证成片发布时可追溯授权。
刻意不解析任何未授权分发商业音乐的站点——发布的短视频需要可辩护的授权。
"""
import ipaddress
import json
import os
import re
import shutil
import socket
import subprocess
from urllib.parse import quote, urlencode, urlparse

import httpx

OPENVERSE_API = "https://api.openverse.org/v1/audio/"
JAMENDO_API = "https://api.jamendo.com/v3.0/tracks/"
WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php"

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) video-workflow/0.1"
DOWNLOAD_TIMEOUT = 180
MAX_DOWNLOAD_BYTES = 200 * 1024 * 1024

# Wikimedia CDN 会按 TLS 指纹拦截 Python httpx（403），本机 curl（系统 TLS 栈）可正常
# 访问，因此 Commons 的请求统一走 curl 子进程。
_CURL = shutil.which("curl") or r"C:\Windows\System32\curl.exe"


def _curl_json(url: str, timeout: int = 40) -> dict:
    if not shutil.which("curl") and not os.path.exists(_CURL):
        raise RuntimeError("未找到 curl，无法访问 Wikimedia Commons")
    last_err = ""
    for attempt in range(3):  # Wikimedia 在部分网络下时通时断，重试缓解
        proc = subprocess.run(
            [
                _CURL, "-sS", "-L", "-m", str(timeout), "-A", UA,
                "-H", "Accept: application/json",
                "--retry", "2", "--retry-delay", "1",
                url,
            ],
            capture_output=True,
            timeout=timeout + 15,
        )
        if proc.returncode == 0:
            try:
                return json.loads(proc.stdout.decode("utf-8", "replace"))
            except json.JSONDecodeError as e:
                raise RuntimeError("Wikimedia 返回的不是 JSON（可能被限流）") from e
        last_err = proc.stderr.decode("utf-8", "replace")[-200:]
    raise RuntimeError(f"curl 失败：{last_err}")


def _openverse_token() -> str:
    return os.getenv("OPENVERSE_TOKEN", "").strip()


def _jamendo_client_id() -> str:
    return os.getenv("JAMENDO_CLIENT_ID", "").strip()


def _norm_openverse(item: dict) -> dict | None:
    url = item.get("url") or ""
    if not url:
        return None
    duration_ms = item.get("duration") or 0
    license_code = (item.get("license") or "").upper()
    return {
        "id": f"openverse:{item.get('id') or url}",
        "title": (item.get("title") or "未命名").strip() or "未命名",
        "creator": (item.get("creator") or "未知作者").strip(),
        "duration": round(duration_ms / 1000, 1) if duration_ms else 0,
        "license": _license_label(license_code, item.get("license_version")),
        "url": url,
        "landing_url": item.get("foreign_landing_url") or "",
        "provider": "openverse",
    }


def _norm_jamendo(item: dict) -> dict | None:
    audio = item.get("audio") or ""
    if not audio:
        return None
    return {
        "id": f"jamendo:{item.get('id') or audio}",
        "title": (item.get("name") or "未命名").strip(),
        "creator": (item.get("artist_name") or "未知作者").strip(),
        "duration": round(float(item.get("duration") or 0), 1),
        "license": "CC（Jamendo 授权曲目）",
        "url": audio,
        "landing_url": (item.get("album_image") or "") and "" or f"https://www.jamendo.com/track/{item.get('id')}",
        "provider": "jamendo",
    }


def _license_label(code: str, version: str | None) -> str:
    labels = {
        "CC0": "CC0 公共领域",
        "PDM": "公共领域标记",
        "BY": "CC BY（需署名）",
        "BY-SA": "CC BY-SA（需署名+同方式共享）",
    }
    base = labels.get(code, code or "未知许可")
    return f"{base} {version}".strip() if version else base


def _strip_html(s: str) -> str:
    return re.sub(r"<[^>]+>", "", str(s or "")).strip()


def _norm_commons(page: dict) -> dict | None:
    """Wikimedia Commons 搜索结果 → 统一格式；过滤 NC/ND 许可（发布不安全）。"""
    infos = page.get("imageinfo") or []
    if not infos:
        return None
    info = infos[0]
    url = info.get("url") or ""
    if not url:
        return None
    meta = info.get("extmetadata") or {}

    def _val(key: str) -> str:
        return _strip_html((meta.get(key) or {}).get("value") or "")

    license_name = _val("LicenseShortName") or _val("UsageTerms") or "未知许可"
    lic_u = license_name.upper()
    if any(k in lic_u for k in ("NC", "ND", "FAIR USE", "非自由")):
        return None  # 非商业 / 禁止改编 / 合理使用声明：不适合作为发布用 BGM
    title = re.sub(r"^File:", "", page.get("title") or "未命名")
    return {
        "id": f"commons:{page.get('pageid') or url}",
        "title": title.rsplit(".", 1)[0] if "." in title else title,
        "creator": _val("Artist") or "未知作者",
        "duration": 0,
        "license": license_name,
        "url": url,
        "landing_url": "https://commons.wikimedia.org/wiki/" + quote((page.get("title") or "").replace(" ", "_")),
        "provider": "commons",
    }


def search_commons(query: str, limit: int = 20) -> list[dict]:
    """Commons 音频搜索（免密钥）。gsrsearch 限定 filetype:audio；走 curl 子进程。"""
    params = urlencode(
        {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrsearch": f"filetype:audio {query}",
            "gsrnamespace": "6",
            "gsrlimit": str(min(50, max(1, limit))),
            "prop": "imageinfo",
            "iiprop": "url|extmetadata",
        }
    )
    data = _curl_json(f"{WIKIMEDIA_API}?{params}")
    pages = (data.get("query") or {}).get("pages") or {}
    out = []
    for p in pages.values():
        n = _norm_commons(p)
        if n:
            out.append(n)
    return out


def search_openverse(query: str, limit: int = 20) -> list[dict]:
    """Openverse 音频搜索；只取允许商用的许可证（CC0/PDM/BY/BY-SA）。"""
    params = {
        "q": query,
        "page_size": str(min(50, max(1, limit))),
        "license_type": "commercial",
    }
    headers = {"User-Agent": UA}
    token = _openverse_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = httpx.get(OPENVERSE_API, params=params, headers=headers, timeout=30)
    if r.status_code == 429:
        raise RuntimeError("Openverse 匿名额度已用尽，可在 backend/.env 配置 OPENVERSE_TOKEN（免费注册）")
    r.raise_for_status()
    out = []
    for item in r.json().get("results", []):
        n = _norm_openverse(item)
        if n:
            out.append(n)
    return out


def search_jamendo(query: str, limit: int = 20) -> list[dict]:
    client_id = _jamendo_client_id()
    if not client_id:
        raise RuntimeError("未配置 JAMENDO_CLIENT_ID（jamendo.com 开发者页免费申请，写入 backend/.env）")
    params = {
        "client_id": client_id,
        "format": "json",
        "limit": str(min(50, max(1, limit))),
        "search": query,
        "audioformat": "mp32",
    }
    r = httpx.get(JAMENDO_API, params=params, headers={"User-Agent": UA}, timeout=30)
    r.raise_for_status()
    out = []
    for item in r.json().get("results", []):
        n = _norm_jamendo(item)
        if n:
            out.append(n)
    return out


def search(query: str, limit: int = 20) -> dict:
    """聚合搜索。单个源失败不影响其他源，错误放进 providers。"""
    results: list[dict] = []
    providers: dict[str, str | None] = {}
    for name, fn in (
        ("commons", search_commons),  # 免密钥，放最前
        ("openverse", search_openverse),
        ("jamendo", search_jamendo),
    ):
        try:
            found = fn(query, limit)
            results.extend(found)
            providers[name] = None
        except Exception as e:  # noqa: BLE001 — 单源失败降级
            providers[name] = str(e)
    # 去重（同一 url 可能被两源收录）
    seen: set[str] = set()
    unique = []
    for t in results:
        if t["url"] in seen:
            continue
        seen.add(t["url"])
        unique.append(t)
    return {"results": unique[:limit], "providers": providers}


# ---------- 下载（含 SSRF 防护：只允许公网 http/https 直链）----------


def _assert_public_url(url: str) -> None:
    p = urlparse(url)
    if p.scheme not in ("http", "https"):
        raise ValueError("仅支持 http/https 直链")
    host = p.hostname or ""
    if not host or host in ("localhost",) or host.endswith((".local", ".internal")):
        raise ValueError("不允许本地/内网地址")
    try:
        infos = socket.getaddrinfo(host, None)
    except OSError as e:
        raise ValueError(f"无法解析主机：{host}") from e
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
            or ip.is_unspecified
        ):
            raise ValueError("不允许内网/保留地址")


def download_to_temp(url: str, tmp_dir, ext_hint: str = ".mp3"):
    """流式下载到临时目录（限 200MB），返回 (Path, 后缀)。调用方负责清理。

    优先 httpx；对 Wikimedia 等按 TLS 指纹拦截 Python 客户端的站点自动回退 curl。
    """
    from pathlib import Path as _Path

    _assert_public_url(url)
    suffix = _Path(urlparse(url).path).suffix.lower()
    if not re.fullmatch(r"\.(mp3|wav|m4a|ogg|flac|aac|mp4|webm)", suffix or ""):
        suffix = ext_hint
    out = _Path(tmp_dir) / f"online_bgm{suffix}"
    size = _download_httpx(url, out)
    if size == 0:
        size = _download_curl(url, out)
    if size == 0:
        raise ValueError("下载内容为空")
    return out, suffix


def _download_httpx(url: str, out) -> int:
    size = 0
    try:
        with httpx.stream(
            "GET", url, headers={"User-Agent": UA}, timeout=DOWNLOAD_TIMEOUT, follow_redirects=True
        ) as r:
            r.raise_for_status()
            with open(out, "wb") as f:
                for chunk in r.iter_bytes(64 * 1024):
                    size += len(chunk)
                    if size > MAX_DOWNLOAD_BYTES:
                        raise ValueError("文件超过 200MB 限制")
                    f.write(chunk)
    except (httpx.HTTPError, httpx.StreamError):
        return 0  # 静默回退 curl
    return size


def _download_curl(url: str, out) -> int:
    for attempt in range(3):  # 部分网络下 Wikimedia 时通时断，重试缓解
        proc = subprocess.run(
            [
                _CURL, "-sS", "-L", "-m", str(DOWNLOAD_TIMEOUT), "-A", UA,
                "--retry", "2", "--retry-delay", "1",
                "-o", str(out), url,
            ],
            capture_output=True,
            timeout=DOWNLOAD_TIMEOUT + 30,
        )
        if proc.returncode == 0 and out.exists() and out.stat().st_size > 0:
            size = out.stat().st_size
            if size > MAX_DOWNLOAD_BYTES:
                out.unlink(missing_ok=True)
                raise ValueError("文件超过 200MB 限制")
            return size
        out.unlink(missing_ok=True)
    return 0
