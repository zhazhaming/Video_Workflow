# -*- coding: utf-8 -*-
"""从 agent-desktop-2026 母版剪出 A/B 两个短视频版本（复用原配音，不重跑 TTS）。

产物：backend/storage/projects/<variant>/ 下 script/plan/durations/build_config，
并把母版逐句 wav 复制到 public/voice/projects/<variant>/<新 line id>.wav。
"""
import json
import shutil
from pathlib import Path

ROOT = Path(r"D:\work\Video_Workflow")
BACKEND = ROOT / "backend"
PUBLIC = ROOT / "remotion-engine" / "public"
MASTER = "agent-desktop-2026"

master_script = json.loads((BACKEND / "storage/projects" / MASTER / "script.json").read_text(encoding="utf-8"))
master_plan = json.loads((BACKEND / "storage/projects" / MASTER / "plan.json").read_text(encoding="utf-8"))
master_dur = json.loads((BACKEND / "storage/projects" / MASTER / "durations.json").read_text(encoding="utf-8"))

VARIANTS = [
    {
        "pid": "agent-desktop-cut30",
        "title": "AI 不用截图也能点电脑",
        "kicker": "34 秒快剪 · vibe 知识大赏",
        "pacing": "钩子(2句)→读骨架→老 OA 场景→三坑→收藏",
        # (母版镜序号 0-based, 选中的句序号)
        "pick": [(0, [0, 1]), (1, [0, 1, 2]), (3, [0, 1]), (7, [0, 1, 2]), (8, [1])],
    },
    {
        "pid": "agent-desktop-slice18",
        "title": "AI 点电脑 最容易踩的三个坑",
        "kicker": "23 秒切片 · vibe 知识大赏",
        "pacing": "钩子→三个坑→收藏",
        "pick": [(0, [0, 1]), (7, [0, 1, 2]), (8, [1])],
    },
]


def build(v):
    pid = v["pid"]
    proj = BACKEND / "storage" / "projects" / pid
    proj.mkdir(parents=True, exist_ok=True)
    voice = PUBLIC / "voice" / "projects" / pid
    voice.mkdir(parents=True, exist_ok=True)

    script = {"title": v["title"], "shots": []}
    plan = {
        "template": master_plan["template"],
        "look": master_plan["look"],
        "kicker": v["kicker"],
        "grain": master_plan.get("grain", 0.045),
        "pacing": v["pacing"],
        "bgm": master_plan.get("bgm"),
        "voice": master_plan.get("voice"),
        "shots": [],
    }
    durations = {}

    for k, (mi, lines_idx) in enumerate(v["pick"], start=1):
        ms = master_script["shots"][mi]
        lines = []
        for j, li in enumerate(lines_idx):
            old_id = f"s{mi + 1:02d}_{li}"
            new_id = f"s{k:02d}_{j}"
            text = ms["lines"][li]["text"]
            lines.append({"text": text})
            durations[new_id] = master_dur[old_id]
            src = PUBLIC / "voice" / "projects" / MASTER / f"{old_id}.wav"
            shutil.copyfile(src, voice / f"{new_id}.wav")
        script["shots"].append({
            "year": ms.get("year", ""),
            "label": ms.get("label", ""),
            "colors": ms["colors"],
            "lines": lines,
        })
        plan["shots"].append(json.loads(json.dumps(master_plan["shots"][mi])))

    (proj / "script.json").write_text(json.dumps(script, ensure_ascii=False, indent=1), encoding="utf-8")
    (proj / "plan.json").write_text(json.dumps(plan, ensure_ascii=False, indent=1), encoding="utf-8")
    (proj / "durations.json").write_text(json.dumps(durations, ensure_ascii=False, indent=1), encoding="utf-8")
    cfg = {"pid": pid, "bpm": 112.3, "intro_frames": 48, "bgm_out": "vibe_bgm", "bgm_volume": 0.6, "sfx": True}
    (proj / "build_config.json").write_text(json.dumps(cfg, ensure_ascii=False, indent=1), encoding="utf-8")

    total = sum(durations.values())
    print(f"{pid}: {len(script['shots'])} shots / {len(durations)} lines / speech {total:.2f}s")


for v in VARIANTS:
    build(v)
