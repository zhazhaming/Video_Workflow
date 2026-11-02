# -*- coding: utf-8 -*-
"""免版权图片搜索与下载：Openverse（免密钥，CC/PDM）+ Wikimedia Commons（curl 子进程）。

面向"六步流程"第 3 步"找图"：只返回许可证允许再分发的图片（与 music_search
同一规则过滤 NC/ND），来源页随结果带出以便成片写出处；下载时做 SSRF 防护、
20MB 大小限制与 PIL 完整性/分辨率校验，保证文件可发布、可用。
"""
import ipaddress
import json
import os
import re
import shutil
import socket
import subprocess
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import quote, urlencode, urlparse

import httpx
from PIL import Image

OPENVERSE_API = "https://api.openverse.org/v1/images/"
WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php"

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) video-workflow/0.1"
DOWNLOAD_TIMEOUT = 120
MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024
MIN_SIDE = 500  # 短边低于 500px 的图不适合作为成片配图
ALLOWED_EXTS = (".jpg", ".jpeg", ".png", ".webp")

# Wikimedia CDN 会按 TLS 指纹拦截 Python httpx（403），本机 curl（系统 TLS 栈）可正常
# 访问，因此 Commons 的请求统一走 curl 子进程。
_CURL = shutil.which("curl") or r"C:\Windows\System32\curl.exe"

# 并行找图时对 Commons 做进程内节流：突发并发会触发限流，反而全军覆没
_CURL_MIN_INTERVAL = 0.5
_curl_lock = threading.Lock()
_last_curl_at = 0.0


def _curl_json(url: str, timeout: int = 40) -> dict:
    global _last_curl_at
    if not shutil.which("curl") and not os.path.exists(_CURL):
        raise RuntimeError("未找到 curl，无法访问 Wikimedia Commons")
    with _curl_lock:
        wait = _CURL_MIN_INTERVAL - (time.monotonic() - _last_curl_at)
        if wait > 0:
            time.sleep(wait)
        _last_curl_at = time.monotonic()
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


def _is_unsafe_license(license_str: str) -> bool:
    """NC（非商业）/ND（禁止改编）等许可发布不安全，与 music_search 同一规则。"""
    lic_u = (license_str or "").upper()
    return any(k in lic_u for k in ("NC", "ND", "FAIR USE", "非自由"))


def _to_int(v) -> int:
    try:
        return int(v or 0)
    except (TypeError, ValueError):
        return 0


# ---------- 结果归一化（统一契约键：id/provider/title/creator/license/page_url/image_url/thumb_url/width/height）----------


def _norm_openverse(item: dict) -> dict | None:
    url = item.get("url") or ""
    if not url:
        return None
    license_label = _license_label((item.get("license") or "").upper(), item.get("license_version"))
    if _is_unsafe_license(license_label):
        return None  # 非商业 / 禁止改编：发布不安全
    return {
        "id": f"openverse:{item.get('id') or url}",
        "provider": "openverse",
        "title": (item.get("title") or "未命名").strip() or "未命名",
        "creator": (item.get("creator") or "未知作者").strip() or "未知作者",
        "license": license_label,
        "page_url": item.get("foreign_landing_url") or "",
        "image_url": url,
        "thumb_url": item.get("thumbnail") or "",
        "width": _to_int(item.get("width")),
        "height": _to_int(item.get("height")),
    }


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
    if _is_unsafe_license(license_name):
        return None
    title = re.sub(r"^File:", "", page.get("title") or "未命名")
    return {
        "id": f"commons:{page.get('pageid') or url}",
        "provider": "commons",
        "title": title.rsplit(".", 1)[0] if "." in title else title,
        "creator": _val("Artist") or "未知作者",
        "license": license_name,
        "page_url": info.get("descriptionurl")
        or ("https://commons.wikimedia.org/wiki/" + quote((page.get("title") or "").replace(" ", "_"))),
        "image_url": url,
        "thumb_url": info.get("thumburl") or "",
        "width": _to_int(info.get("width")),
        "height": _to_int(info.get("height")),
    }


# ---------- 搜索（单源失败降级，双源皆空才抛错）----------


OPENVERSE_TIMEOUT = 12  # Openverse 匿名端点常慢/限流，快速放弃以免拖垮整轮找图


def search_openverse(query: str, limit: int = 12) -> list[dict]:
    """Openverse 图片搜索（免密钥）；可选 OPENVERSE_TOKEN 提升匿名额度。"""
    params = {"q": query, "page_size": str(min(50, max(1, limit)))}
    headers = {"User-Agent": UA}
    token = _openverse_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = httpx.get(OPENVERSE_API, params=params, headers=headers, timeout=OPENVERSE_TIMEOUT)
    if r.status_code == 429:
        raise RuntimeError("Openverse 匿名额度已用尽，可在 backend/.env 配置 OPENVERSE_TOKEN（免费注册）")
    r.raise_for_status()
    out = []
    for item in r.json().get("results", []):
        n = _norm_openverse(item)
        if n:
            out.append(n)
    return out


def search_commons(query: str, limit: int = 10) -> list[dict]:
    """Commons 图片搜索（免密钥）。gsrsearch 限定 filetype:bitmap；走 curl 子进程。

    Commons 全文检索把所有词按 AND 处理，过长的组合查询经常命中 0，
    因此按"全词 → 前 3 词 → 前 2 词"渐进减词重试，取第一个非空结果。
    """
    words = (query or "").split()
    variants = [query.strip()]
    if len(words) > 3:
        variants.append(" ".join(words[:3]))
    if len(words) > 2:
        variants.append(" ".join(words[:2]))
    seen_variants: set[str] = set()
    out: list[dict] = []
    for v in variants:
        v = v.strip()
        if not v or v in seen_variants:
            continue
        seen_variants.add(v)
        params = urlencode(
            {
                "action": "query",
                "format": "json",
                "generator": "search",
                "gsrsearch": f"filetype:bitmap {v}",
                "gsrnamespace": "6",
                "gsrlimit": str(min(50, max(1, limit))),
                "prop": "imageinfo",
                "iiprop": "url|size|extmetadata",
                "iiurlwidth": "640",
            }
        )
        data = _curl_json(f"{WIKIMEDIA_API}?{params}")
        pages = (data.get("query") or {}).get("pages") or {}
        for p in pages.values():
            n = _norm_commons(p)
            if n:
                out.append(n)
        if out:
            break
    return out


def search_images(query_en: str, query_zh: str = "", per_provider: int = 4) -> list[dict]:
    """聚合搜索：所有（检索词×源）并行查询，合并去重，每源最多 per_provider 条。

    返回统一契约 [{"id","provider","title","creator","license","page_url",
    "image_url","thumb_url","width","height"}]；单个源失败静默降级，
    两个源都无结果才抛 RuntimeError("图片搜索无结果")。
    """
    queries = [q for q in (query_en, query_zh) if (q or "").strip()]
    per_provider = max(1, per_provider)
    by_provider: dict[str, list[dict]] = {"openverse": [], "commons": []}
    jobs = [(name, q) for q in queries for name in ("openverse", "commons")]
    ex = ThreadPoolExecutor(max_workers=min(4, max(1, len(jobs))))
    try:
        futs = {
            ex.submit(search_openverse if name == "openverse" else search_commons, q, per_provider * 3): name
            for name, q in jobs
        }
        for fut in as_completed(futs, timeout=120):  # 整体兜底超时，完成的源照常使用
            try:
                by_provider[futs[fut]].extend(fut.result())
            except Exception:  # noqa: BLE001 — 单源失败降级
                continue
    except TimeoutError:  # noqa: F821 — 整体超时：取已完成部分
        pass
    finally:
        ex.shutdown(wait=False, cancel_futures=True)
    # 去重（同一 image_url 可能被两源/两语言收录），每源各取前 per_provider 条
    out: list[dict] = []
    seen: set[str] = set()
    for name in ("openverse", "commons"):
        count = 0
        for c in by_provider[name]:
            if count >= per_provider:
                break
            if c["image_url"] in seen:
                continue
            seen.add(c["image_url"])
            out.append(c)
            count += 1
    if not out:
        raise RuntimeError("图片搜索无结果")
    return out[: per_provider * 2]


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


def _sanitize_slug(base_name: str) -> str:
    """文件名清洗：保留 [A-Za-z0-9_-] 连续段用 - 连接，小写、最长 48，空则 img。"""
    slug = "-".join(re.findall(r"[A-Za-z0-9_-]+", base_name or "")).lower()[:48]
    return slug or "img"


def _ext_from_url(url: str) -> str:
    """从 URL 路径取后缀，仅接受白名单格式，其余一律按 .jpg 处理。"""
    suffix = Path(urlparse(url).path).suffix.lower()
    return suffix if suffix in ALLOWED_EXTS else ".jpg"


def _download_httpx(url: str, out: Path) -> int:
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
                        raise ValueError("图片超过 20MB 下载上限")
                    f.write(chunk)
    except (httpx.HTTPError, httpx.StreamError):
        return 0  # 静默回退 curl
    return size


def _download_curl(url: str, out: Path) -> int:
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
                raise ValueError("图片超过 20MB 下载上限")
            return size
        out.unlink(missing_ok=True)
    return 0


def _validate_and_rewrite(path: Path) -> None:
    """PIL 校验图片完整性并强制最低分辨率，成功则转 RGB 原地重存（jpg 质量 88）。"""
    try:
        with Image.open(path) as im:
            im.load()
            width, height = im.size
            if width < MIN_SIDE or height < MIN_SIDE:
                raise ValueError("图片分辨率过低")
            rgb = im.convert("RGB")
    except ValueError:
        raise
    except Exception as e:
        raise ValueError("图片文件损坏或格式不支持") from e
    if path.suffix.lower() in (".jpg", ".jpeg"):
        rgb.save(path, quality=88)
    else:
        rgb.save(path)


def download_image(url: str, dest_dir: Path, base_name: str) -> Path:
    """下载并校验图片：SSRF 防护 → 流式下载（限 20MB）→ PIL 校验/转 RGB 重存。

    返回最终文件 Path（dest_dir / "<slug><ext>"）；下载失败、内容为空、
    超限或图片不合格（<500px、损坏）都会抛错且不留半成品文件。
    """
    _assert_public_url(url)
    dest_dir = Path(dest_dir)
    dest_dir.mkdir(parents=True, exist_ok=True)
    out = dest_dir / f"{_sanitize_slug(base_name)}{_ext_from_url(url)}"
    try:
        size = _download_httpx(url, out)
        if size == 0:
            size = _download_curl(url, out)  # 对按 TLS 指纹拦截 Python 客户端的站点回退 curl
    except Exception:
        out.unlink(missing_ok=True)
        raise
    if size == 0:
        raise ValueError("下载内容为空")
    try:
        _validate_and_rewrite(out)
    except Exception:
        out.unlink(missing_ok=True)  # 不保留损坏/分辨率不足的文件
        raise
    return out
