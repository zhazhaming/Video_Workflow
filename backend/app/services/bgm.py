# -*- coding: utf-8 -*-
"""BGM 曲库管理：导入（含视频抽音轨）/ 元数据 / 曲库清单 / 试听。

职责边界（与并行模块的分工）：
- 节拍分析复用 beat.py（按文件 mtime 缓存，导入后立即预热缓存）
- 自动选曲在 music.py（按剧情情绪关键词）
- 渲染侧的卡点组装在 tasks.py + remotion DataVideo.tsx
- 本模块只负责"把曲子弄进曲库、把曲库展示/试听出来"
"""
import argparse
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

from mutagen.mp3 import MP3
from mutagen.wave import WAVE

from ..config import BGM_PUBLIC_SUBDIR, FFMPEG_BIN, REMOTION_PUBLIC, STORAGE_DIR
from . import beat

BGM_DIR = REMOTION_PUBLIC / BGM_PUBLIC_SUBDIR
META_PATH = STORAGE_DIR / "bgm_library.json"  # 曲目元数据（标题/标签）
BEATS_CACHE_PATH = STORAGE_DIR / "bgm_meta.json"  # beat.py 的缓存（只读，强刷时剔除条目）

AUDIO_EXTS = (".mp3", ".wav")
VIDEO_EXTS = (".mp4", ".mov", ".mkv", ".webm", ".m4a", ".avi", ".flv", ".ts")
MAX_SOURCE_BYTES = 200 * 1024 * 1024

# 内置三首曲子实测约 -18 LUFS，导入曲统一到同一响度，保证同一音量参数下手感一致
LOUDNESS_TARGET_LUFS = -18


# ---------- 元数据 ----------

def _load_meta_all() -> dict:
    if not META_PATH.exists():
        return {}
    try:
        return json.loads(META_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def _save_meta_all(meta: dict) -> None:
    META_PATH.parent.mkdir(parents=True, exist_ok=True)
    META_PATH.write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")


def save_meta(
    name: str,
    title: str | None = None,
    tags: list[str] | None = None,
    source: dict | None = None,
) -> None:
    """source: 来源溯源信息（如在线曲库的 url/license/creator），写入元数据。"""
    meta = _load_meta_all()
    item = meta.setdefault(name, {})
    if title is not None:
        item["title"] = title
    if tags is not None:
        item["tags"] = tags
    if source is not None:
        item["source"] = source
    item.setdefault("title", name)
    item.setdefault("tags", [])
    item["imported_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
    _save_meta_all(meta)


def track_file(name: str) -> Path:
    """按曲目名找 public/bgm 下的音频文件。"""
    for ext in AUDIO_EXTS:
        f = BGM_DIR / f"{name}{ext}"
        if f.exists():
            return f
    raise FileNotFoundError(f"曲库中没有「{name}」")


def audio_duration(path: Path) -> float:
    """精确时长（mutagen 直读，不受 beat 分析 240s 上限影响）。"""
    try:
        if path.suffix.lower() == ".wav":
            return round(float(WAVE(str(path)).info.length), 2)
        return round(float(MP3(str(path)).info.length), 2)
    except Exception:  # noqa: BLE001 — 损坏文件不算致命
        return 0.0


def _beats_cache_bpm(path: Path) -> float:
    try:
        cache = json.loads(BEATS_CACHE_PATH.read_text(encoding="utf-8"))
        return float(cache.get(path.name, {}).get("bpm") or 0)
    except (OSError, json.JSONDecodeError, ValueError):
        return 0.0


def list_tracks() -> list[dict]:
    """曲库清单：文件扫描 + 元数据 + 已缓存的 BPM。"""
    tracks: list[dict] = []
    if not BGM_DIR.exists():
        return tracks
    meta_all = _load_meta_all()
    for f in sorted(BGM_DIR.iterdir()):
        if f.suffix.lower() not in AUDIO_EXTS:
            continue
        name = f.stem
        meta = meta_all.get(name, {})
        tracks.append(
            {
                "name": name,
                "file": f"{BGM_PUBLIC_SUBDIR}/{f.name}",
                "title": meta.get("title") or name,
                "tags": meta.get("tags") or [],
                "duration": audio_duration(f),
                "bpm": _beats_cache_bpm(f),
                "builtin": name in ("warm_piano", "tense_pad", "uplifting"),
                "source": meta.get("source") or None,
            }
        )
    return tracks


# ---------- 导入 ----------

def _sanitize_name(raw: str) -> str:
    name = re.sub(r"\s+", "_", raw.strip())
    name = re.sub(r"[\\/:*?\"<>|]", "", name)
    return name or "bgm"


def _unique_name(name: str) -> str:
    taken = {f.stem for f in BGM_DIR.iterdir()} if BGM_DIR.exists() else set()
    if name not in taken:
        return name
    i = 2
    while f"{name}_{i}" in taken:
        i += 1
    return f"{name}_{i}"


def _ffmpeg_run(args: list[str], timeout: int = 600) -> None:
    if not FFMPEG_BIN.exists():
        raise RuntimeError(f"未找到 ffmpeg（{FFMPEG_BIN}），无法导入 BGM")
    proc = subprocess.run(
        [str(FFMPEG_BIN), "-v", "error", "-y", *args],
        capture_output=True,
        timeout=timeout,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg 失败：{proc.stderr.decode('utf-8', 'replace')[-300:]}")


def import_track(
    src: Path,
    name: str | None = None,
    title: str | None = None,
    tags: list[str] | None = None,
) -> dict:
    """把本地音频/视频导入曲库：视频自动抽音轨，统一转 44.1k mp3 并归一到 -18 LUFS。

    成功后预热 beat.py 的节拍缓存，渲染流水线可直接取用。
    """
    src = Path(src)
    if not src.exists():
        raise FileNotFoundError(f"文件不存在：{src}")
    if src.stat().st_size > MAX_SOURCE_BYTES:
        raise ValueError(f"文件超过 {MAX_SOURCE_BYTES // (1024 * 1024)}MB 限制")

    base_name = _sanitize_name(name or src.stem)
    BGM_DIR.mkdir(parents=True, exist_ok=True)
    out_name = _unique_name(base_name)
    out = BGM_DIR / f"{out_name}.mp3"
    tmp = out.with_name(f".{out.stem}.tmp.mp3")

    args = ["-i", str(src)]
    if src.suffix.lower() in VIDEO_EXTS:
        args += ["-vn"]  # 视频参考曲：只取音轨
    args += [
        "-af",
        f"loudnorm=I={LOUDNESS_TARGET_LUFS}:TP=-1.5:LRA=11",
        "-ar",
        "44100",
        "-ac",
        "2",
        "-codec:a",
        "libmp3lame",
        "-b:a",
        "192k",
        str(tmp),
    ]
    try:
        _ffmpeg_run(args)
        if not tmp.exists() or tmp.stat().st_size == 0:
            raise RuntimeError("转码产物为空，源文件可能没有音轨")
        os.replace(tmp, out)
    finally:
        tmp.unlink(missing_ok=True)

    save_meta(out_name, title or src.stem, tags or [])
    info = beat.analyze(out)  # 预热节拍缓存
    return {
        "name": out_name,
        "file": f"{BGM_PUBLIC_SUBDIR}/{out.name}",
        "title": title or src.stem,
        "tags": tags or [],
        "duration": audio_duration(out),
        "bpm": info.get("bpm") or 0,
        "beat_count": len(info.get("beats") or []),
    }


def force_reanalyze(name: str) -> dict:
    """剔除 beat.py 缓存条目后强制重新分析。"""
    path = track_file(name)
    try:
        cache = json.loads(BEATS_CACHE_PATH.read_text(encoding="utf-8"))
        cache.pop(path.name, None)
        BEATS_CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
    except (OSError, json.JSONDecodeError):
        pass
    return beat.analyze(path)


# ---------- CLI（python -m app.services.bgm import <path> [name]）----------

def main() -> int:
    parser = argparse.ArgumentParser(description="BGM 曲库工具（导入/清单/分析）")
    sub = parser.add_subparsers(dest="cmd", required=True)
    p_import = sub.add_parser("import", help="导入音频/视频（视频自动抽音轨）")
    p_import.add_argument("path")
    p_import.add_argument("name", nargs="?")
    p_import.add_argument("--title", default=None)
    p_import.add_argument("--tags", default="", help="逗号分隔，如：人生,励志")
    sub.add_parser("list", help="列出曲库")
    p_an = sub.add_parser("analyze", help="强制重新分析节拍")
    p_an.add_argument("name")
    args = parser.parse_args()

    if args.cmd == "import":
        tags = [t.strip() for t in args.tags.split(",") if t.strip()]
        print(json.dumps(import_track(Path(args.path), args.name, args.title, tags), ensure_ascii=False, indent=1))
    elif args.cmd == "list":
        print(json.dumps(list_tracks(), ensure_ascii=False, indent=1))
    elif args.cmd == "analyze":
        print(json.dumps(force_reanalyze(args.name), ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
