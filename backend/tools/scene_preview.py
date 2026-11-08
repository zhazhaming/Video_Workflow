# -*- coding: utf-8 -*-
"""为单个 gen 场景生成最小可渲染 props（供场景作者抽帧自检）。

用法:
    cd backend && python tools/scene_preview.py --pid <pid> --shot 3 \
        --out storage/renders/<pid>/prev_s03.json [--seconds 8]

生成的 props 只含 1 镜 1 句、无片头（titleCard=false）、无 BGM/无配音。
时间轴：offset=2.0s，镜长 = seconds，因此镜内进度 p 对应的帧号 = 60 + round(p*seconds*30)。
stdout 打印建议抽帧帧号（p=0.15 / 0.5 / 0.85）。
"""
import argparse
import json
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
FPS = 30


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pid", required=True)
    ap.add_argument("--shot", required=True, type=int, help="镜号，从 1 起")
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--seconds", type=float, default=8.0)
    ap.add_argument("--line", type=int, default=0)
    args = ap.parse_args()

    proj = BACKEND / "storage" / "projects" / args.pid
    script = json.loads((proj / "script.json").read_text(encoding="utf-8"))
    plan = json.loads((proj / "plan.json").read_text(encoding="utf-8"))
    si = args.shot - 1
    shot = script["shots"][si]
    p = (plan["shots"][si].get("plan") or {})
    line = shot["lines"][args.line]
    dur = max(1.0, args.seconds - 0.85)

    props = {
        "title": script.get("title", ""),
        "kicker": plan.get("kicker"),
        "titleCard": False,
        "grainOpacity": plan.get("grain", 0.05),
        "look": plan["look"],
        "sfx": False,
        "shots": [
            {
                "year": shot.get("year", ""),
                "label": shot.get("label", ""),
                "colors": shot["colors"],
                "tail": 0.4,
                "lines": [
                    {
                        "id": f"s{args.shot:02d}_{args.line}",
                        "text": line["text"],
                        "durationSec": round(dur, 3),
                        "pauseAfter": 0.3,
                        "emphasis": None,
                    }
                ],
                "camera": p.get("camera"),
                "camIntensity": p.get("intensity"),
                "enterTransition": "dissolve",
                "grade": p.get("grade"),
                "overlay": p.get("overlay"),
                "sfxMoment": None,
                "atmosphere": p.get("atmosphere"),
                "scene": p.get("scene"),
            }
        ],
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(props, ensure_ascii=False, indent=1), encoding="utf-8")

    base = 60  # offset 2.0s
    frames = {p_: base + round(p_ * args.seconds * FPS) for p_ in (0.15, 0.5, 0.85)}
    print(json.dumps({"props": str(args.out), "seconds": args.seconds,
                      "still_frames": frames, "hint": "python tools/render_video.py --props <props> --out <png> --still <frame>"},
                     ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass
    sys.exit(main())
