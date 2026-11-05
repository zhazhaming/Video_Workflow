# -*- coding: utf-8 -*-
"""BPM/节拍分析（包装 services/beat.py，供 skill 流程直调，不依赖 FastAPI）。

用法:
    python tools/beat_analyze.py --audio <bgm.mp3|wav> [--max-seconds 240]

输出（stdout JSON）: {"bpm", "beats": [秒...], "n_beats", "audio"}（结果按 mtime 缓存于
storage/bgm_meta.json，同一文件重复分析不耗时）。beats 可直接填 props.bgm.beats。
"""
import argparse
import json
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(BACKEND_DIR / ".env")

from app.config import REMOTION_PUBLIC, BGM_PUBLIC_SUBDIR  # noqa: E402
from app.services.beat import analyze  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description="音频 BPM/节拍分析")
    ap.add_argument("--audio", required=True, type=Path, help="音频路径（绝对，或相对 public/ 的曲库路径）")
    ap.add_argument("--max-seconds", type=float, default=240.0)
    args = ap.parse_args()

    path = args.audio if args.audio.is_absolute() else REMOTION_PUBLIC / BGM_PUBLIC_SUBDIR / args.audio
    if not path.exists():
        print(json.dumps({"error": f"音频不存在: {path}"}, ensure_ascii=False))
        return 1

    info = analyze(path, args.max_seconds)
    result = {
        "audio": str(path),
        "bpm": round(float(info.get("bpm") or 0.0), 2),
        "beats": [round(float(b), 3) for b in (info.get("beats") or [])][:600],
        "n_beats": len(info.get("beats") or []),
    }
    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass
    sys.exit(main())
