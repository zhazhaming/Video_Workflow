# -*- coding: utf-8 -*-
"""按 script.json 生成逐句配音（包装 services/voice.py，供 skill 流程直调，不依赖 FastAPI）。

用法:
    python tools/tts_gen.py --pid <pid> --script storage/projects/<pid>/script.json \
        [--voice zh-CN-YunxiNeural] [--rate "+6%"]

输出（stdout JSON）: {"pid", "voice_dir", "durations": {"s01_0": 2.31, ...}}
逐句 wav 落在 remotion-engine/public/voice/projects/<pid>/，line id 约定 s{镜2位}_{句序}。
"""
import argparse
import json
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(BACKEND_DIR / ".env")

from app.schemas import ScriptDraft  # noqa: E402
from app.services.voice import generate_script_voices  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description="script.json -> 逐句配音 wav")
    ap.add_argument("--pid", required=True)
    ap.add_argument("--script", required=True, type=Path, help="script.json 路径")
    ap.add_argument("--voice", default=None, help="edge-tts 音色，缺省用 TTS_VOICE 环境变量")
    ap.add_argument("--rate", default=None, help='语速，形如 "+6%%"，缺省用 TTS_RATE 环境变量')
    args = ap.parse_args()

    if not args.script.exists():
        print(json.dumps({"error": f"script.json 不存在: {args.script}"}, ensure_ascii=False))
        return 1

    draft = ScriptDraft.model_validate(json.loads(args.script.read_text(encoding="utf-8")))
    kwargs = {}
    if args.voice:
        kwargs["voice"] = args.voice
    if args.rate:
        kwargs["rate"] = args.rate
    durations = generate_script_voices(args.pid, draft.shots, **kwargs)

    from app.config import REMOTION_PUBLIC, VOICE_PUBLIC_SUBDIR

    result = {
        "pid": args.pid,
        "voice_dir": str(REMOTION_PUBLIC / VOICE_PUBLIC_SUBDIR / args.pid),
        "durations": durations,
    }
    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass
    sys.exit(main())
