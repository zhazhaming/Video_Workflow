# -*- coding: utf-8 -*-
"""整轨预混（包装 services/voice.py，供 skill 流程直调，不依赖 FastAPI）。

把逐句配音按渲染时间轴混成单轨 track.wav（DataVideo）或 motion_track.wav（MotionShow），
写回 props：narrationAudio 指向整轨、清空逐句 audio —— 绕开 Remotion 嵌套 Sequence
音频碎片化的已知 bug（根级 Audio 才可靠）。时间轴常量与 remotion-engine/src/dv/timeline.ts
逐帧对齐，两边改动必须同步。

用法:
    python tools/premix_track.py --pid <pid> --props <props.json> [--template datavideo|motionshow] [--out <props.json>]

输入 props.json 为 camelCase（渲染用格式）；输出同格式（已应用整轨），stdout 打印
{"src", "schedule", "out"}，schedule 为逐句落点（秒）。
"""
import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(BACKEND_DIR / ".env")

from app.schemas import RenderProps  # noqa: E402
from app.services.voice import mix_line_track, mix_motion_track  # noqa: E402

_C1 = re.compile(r"(.)([A-Z][a-z]+)")
_C2 = re.compile(r"([a-z0-9])([A-Z])")


def _snake_key(k: str) -> str:
    return _C2.sub(r"\1_\2", _C1.sub(r"\1_\2", k)).lower()


def _to_snake(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {_snake_key(k): _to_snake(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_to_snake(v) for v in obj]
    return obj


def main() -> int:
    ap = argparse.ArgumentParser(description="逐句配音 -> 整轨预混并改写 props")
    ap.add_argument("--pid", required=True)
    ap.add_argument("--props", required=True, type=Path, help="camelCase props.json")
    ap.add_argument("--template", default="datavideo", choices=["datavideo", "motionshow"])
    ap.add_argument("--out", type=Path, default=None, help="输出路径，缺省覆盖输入")
    args = ap.parse_args()

    if not args.props.exists():
        print(json.dumps({"error": f"props.json 不存在: {args.props}"}, ensure_ascii=False))
        return 1

    raw = json.loads(args.props.read_text(encoding="utf-8"))
    props = RenderProps.model_validate(_to_snake(raw))
    d = json.loads(props.model_dump_json())  # field-name（snake_case）键，mix_* 的入参格式

    if args.template == "motionshow":
        track = mix_motion_track(args.pid, d)
    else:
        track = mix_line_track(args.pid, d)

    d["narration_audio"] = {"src": track["src"], "volume": 1.0}
    for sh in d.get("shots") or []:
        for line in sh.get("lines") or []:
            line["audio"] = None
    out_props = RenderProps.model_validate(d)

    out_path = args.out or args.props
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(out_props.to_props_json(), encoding="utf-8")

    print(
        json.dumps(
            {"src": track["src"], "schedule": track["schedule"], "out": str(out_path)},
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass
    sys.exit(main())
