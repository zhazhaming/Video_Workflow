# -*- coding: utf-8 -*-
"""渲染视频/单帧（包装 services/renderer.py，供 skill 流程直调，不依赖 FastAPI）。

用法:
    # 整片渲染
    python tools/render_video.py --props <props.json> --out <final.mp4> [--comp DataVideo|MotionShow|CinemaVideo]
    # 前 10 秒预览（先预览后整片的规则）
    python tools/render_video.py --props <props.json> --out <preview.mp4> --frames 0-299
    # 单帧抽验（PNG）
    python tools/render_video.py --props <props.json> --out <still.png> --still 180

渲染在 remotion-engine/ 目录内执行（npx remotion render/still），日志写在输出同目录。
stdout 打印 {"code", "out", "log", "tail"}；code=0 为成功。
"""
import argparse
import json
import re
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(BACKEND_DIR / ".env")

from app.services import renderer  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description="npx remotion render/still 包装")
    ap.add_argument("--props", required=True, type=Path, help="camelCase props.json")
    ap.add_argument("--out", required=True, type=Path, help="输出 mp4/png 路径")
    ap.add_argument("--comp", default="DataVideo", choices=["DataVideo", "MotionShow", "CinemaVideo"])
    ap.add_argument("--frames", default=None, help="闭区间帧范围，如 0-299（预览前 10 秒）")
    ap.add_argument("--still", type=int, default=None, help="渲染单帧（PNG），帧号；--comp 仅支持 DataVideo")
    args = ap.parse_args()

    if not args.props.exists():
        print(json.dumps({"error": f"props.json 不存在: {args.props}"}, ensure_ascii=False))
        return 1

    # renderer 的子进程 cwd 是 remotion-engine/，路径必须解析为绝对路径
    args.props = args.props.resolve()
    args.out = args.out.resolve()

    frames = None
    if args.frames:
        m = re.fullmatch(r"(\d+)-(\d+)", args.frames.strip())
        if not m or int(m.group(1)) > int(m.group(2)):
            print(json.dumps({"error": f"--frames 需为 A-B 且 A<=B: {args.frames}"}, ensure_ascii=False))
            return 1
        frames = (int(m.group(1)), int(m.group(2)))

    log_path = args.out.with_suffix(".log")
    if args.still is not None:
        code = renderer.render_still(args.props, args.still, args.out, log_path, composition=args.comp)
    else:
        code = renderer.render_video(args.props, args.out, log_path, frames, args.comp)

    tail = renderer.tail_log(log_path, 15) if code != 0 else ""
    print(
        json.dumps(
            {"code": code, "out": str(args.out), "log": str(log_path), "tail": tail},
            ensure_ascii=False,
        )
    )
    return 0 if code == 0 else 1


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass
    sys.exit(main())
