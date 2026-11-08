# -*- coding: utf-8 -*-
"""《一夜蒸发2.3万亿：纳指怎么了》Vibe 知识大赏 · 一键驱动（DataVideo + gen 场景）。

流程：script.json → edge-tts 逐镜配音（实测时长）→ 组装 props（切镜由时间轴数学 +
BGM 实测拍点吸附）→ 整轨预混 premix_track.py → props.json → Remotion 渲染。

用法：
    python -X utf8 tools/run_nasdaq_crash_vibe.py                # 全流程（渲整片）
    python -X utf8 tools/run_nasdaq_crash_vibe.py --no-render    # 只到 props.json（写 gen 场景用）
    python -X utf8 tools/run_nasdaq_crash_vibe.py --preview      # 渲前 12 秒预览
    python -X utf8 tools/run_nasdaq_crash_vibe.py --reuse-voice  # 复用已有配音

契约：composition = DataVideo（1080×1920@30）；gen 场景 src/gen/nasdaq-crash-vibe/SceneNN.tsx。
模板判定：from_scratch（金融市场科普与引擎内置能力/模板域无关；BGM 复用用户点名的
vibe_bgm.mp3=We Never Remix 0.9x；浅纸编辑信息图视觉，禁深底/霓虹/星空）。
事实来源：briefs/nasdaq-crash-vibe-facts.md（2026-11-07 快照）。
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(r"D:\Work\video-workflow\backend")
sys.path.insert(0, str(ROOT))

from app.config import FFMPEG_BIN, REMOTION_PUBLIC, RENDERS_DIR, STORAGE_DIR  # noqa: E402
from app.schemas import BgmSpec, ScriptDraft  # noqa: E402
from app.services import beat, director, renderer, voice  # noqa: E402
from app.services.pipeline import assemble_props, bind_project  # noqa: E402

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PID = "nasdaq-crash-vibe"
PDIR = STORAGE_DIR / "projects" / PID
FPS = 30
VOICE = "zh-CN-YunjianNeural"
RATE = "+12%"

BGM_NAME = "vibe_bgm.mp3"  # 抖音「vibe知识大赏」最火 BGM《We Never (Remix) 0.9x》
BGM_VOLUME = 0.7
GRAIN = 0.035
ACCENT = "#C8452D"

# ---------------- 文案（12 镜；每句 ≤20 字；数字均出自 briefs/nasdaq-crash-vibe-facts.md） ----------------
SCRIPT = {
    "title": "一夜蒸发2.3万亿：纳指怎么了",
    "shots": [
        {"year": "", "label": "两万三千亿", "colors": ["#F4EFE6", "#E7DECD"], "lines": [
            {"text": "两万三千亿美元，一夜蒸发。"},
            {"text": "纳指，怎么了？"},
        ]},
        {"year": "11·05", "label": "单日暴跌", "colors": ["#F2E9DC", "#E5D6C0"], "lines": [
            {"text": "11月5日，纳指暴跌5.52%，"},
            {"text": "创19个月最大单日跌幅。"},
        ]},
        {"year": "-12%", "label": "回调区间", "colors": ["#EFEAE0", "#DDD3C0"], "lines": [
            {"text": "距10月6日高点，已回撤12%。"},
        ]},
        {"year": "", "label": "知识点", "colors": ["#F4EFE6", "#E3DACA"], "lines": [
            {"text": "跌超10%叫回调，"},
            {"text": "跌超20%，才叫熊市。"},
        ]},
        {"year": "11·03", "label": "导火索", "colors": ["#EDEAE4", "#D9D4C8"], "lines": [
            {"text": "导火索：中期选举，"},
            {"text": "民主党横扫国会。"},
        ]},
        {"year": "", "label": "担忧一", "colors": ["#F1EBDF", "#E0D6C2"], "lines": [
            {"text": "市场担心：AI监管收紧，"},
            {"text": "数据中心要踩刹车。"},
        ]},
        {"year": "", "label": "担忧二", "colors": ["#F4EFE6", "#E7DECD"], "lines": [
            {"text": "AI烧了这么多钱，"},
            {"text": "回报在哪？"},
        ]},
        {"year": "-9.26%", "label": "伤亡榜", "colors": ["#F3E8E0", "#E2CFC2"], "lines": [
            {"text": "英伟达跌9.26%，"},
            {"text": "AMD跌17%，"},
            {"text": "费半指数跌12%。"},
        ]},
        {"year": "", "label": "七巨头", "colors": ["#F0E7E4", "#DFCCC7"], "lines": [
            {"text": "特斯拉跌超10%，"},
            {"text": "七巨头无一幸免。"},
        ]},
        {"year": "11·06", "label": "传染亚太", "colors": ["#EAE9E2", "#D6D4C6"], "lines": [
            {"text": "第二天，恐慌传到亚太："},
            {"text": "韩股熔断，日经破6万。"},
        ]},
        {"year": "2022", "label": "历史视角", "colors": ["#F1EEE5", "#DFD9C8"], "lines": [
            {"text": "2022年纳指跌三分之一，"},
            {"text": "后来照样创出新高。"},
        ]},
        {"year": "", "label": "结语", "colors": ["#F4EFE6", "#E7DECD"], "lines": [
            {"text": "评论区聊聊，不构成投资建议。"},
        ]},
    ],
}

EMPHASIS = [
    ["两万三千亿", "一夜蒸发", "纳指"],
    ["5.52%", "19个月", "暴跌"],
    ["10月6日", "12%"],
    ["10%", "回调", "20%", "熊市"],
    ["中期选举", "横扫"],
    ["AI监管", "踩刹车"],
    ["烧了这么多钱", "回报"],
    ["9.26%", "17%", "12%"],
    ["10%", "无一幸免"],
    ["亚太", "熔断", "6万"],
    ["三分之一", "新高"],
    ["不构成投资建议"],
]

# ---------------- 分镜方案（运镜/转场/调色/gen 场景） ----------------
# (camera, intensity, transition, grade, speed)
SHOT_FX = [
    ("push", 1.10, "dissolve", {"contrast": 1.06, "saturate": 1.05, "brightness": 1.02, "tintOpacity": 0.14}, 1.00),
    ("push", 1.30, "flash",    {"contrast": 1.10, "saturate": 1.08, "brightness": 1.00, "tintOpacity": 0.20}, 1.10),
    ("tilt_down", 1.20, "zoom", {"contrast": 1.05, "saturate": 0.95, "brightness": 1.00, "tintOpacity": 0.20}, 1.00),
    ("still", 0.90, "slide",   {"contrast": 1.02, "saturate": 1.00, "brightness": 1.02, "tintOpacity": 0.12}, 0.90),
    ("pan_right", 1.10, "whip", {"contrast": 1.03, "saturate": 0.96, "brightness": 1.01, "tintOpacity": 0.18}, 1.05),
    ("push", 1.15, "cut",      {"contrast": 1.06, "saturate": 0.94, "brightness": 0.99, "tintOpacity": 0.22}, 1.00),
    ("diag_in", 1.20, "zoom",  {"contrast": 1.05, "saturate": 1.00, "brightness": 1.00, "tintOpacity": 0.16}, 1.00),
    ("pan_left", 1.25, "whip", {"contrast": 1.10, "saturate": 1.06, "brightness": 1.00, "tintOpacity": 0.20}, 1.10),
    ("still", 1.00, "cut",     {"contrast": 1.06, "saturate": 0.95, "brightness": 1.00, "tintOpacity": 0.20}, 1.00),
    ("diag_in", 1.30, "whip",  {"contrast": 1.10, "saturate": 1.05, "brightness": 0.99, "tintOpacity": 0.24}, 1.10),
    ("pull", 0.95, "dissolve", {"contrast": 1.02, "saturate": 1.00, "brightness": 1.03, "tintOpacity": 0.12}, 0.90),
    ("push", 1.00, "zoom",     {"contrast": 1.05, "saturate": 1.04, "brightness": 1.02, "tintOpacity": 0.12}, 1.00),
]
SFX_MOMENTS = {1: "impact", 7: "impact"}  # 镜号-1（0 基）：S02 / S08

LOOK = {
    "preset": "editorial", "mode": "light", "bg": "paper", "accent": ACCENT,
    "palette": ["#F4EFE6", "#E7DECD"], "ink": "#1B1815", "support": "#6B6459",
    "vignette": 0.22, "subtitleStyle": "bold",
    "atmosphere": {"kind": "none", "opacity": 0.4},
}

TEMPLATE_JUDGMENT = {
    "mode": "from_scratch",
    "reason": "金融市场暴跌归因科普，与引擎内置能力/任何领域模板域无关；画面全部由现场编写的 gen 场景（浅纸编辑信息图）实现，禁深底/霓虹/星空。",
    "reusable": [
        "BGM：vibe_bgm.mp3（用户点名复用，《We Never (Remix) 0.9x》，vibe知识大赏最火，112.3 BPM 实测节拍）",
        "浅纸编辑信息图设计系统模式（自建 ui.tsx，参照 coldest-space-2026 组件族）",
        "通用运镜/转场/节拍吸附数学、sfx 与 grain/vignette 质感层（基础设施）",
    ],
}


def write_project_files() -> ScriptDraft:
    PDIR.mkdir(parents=True, exist_ok=True)
    (PDIR / "meta.json").write_text(json.dumps({
        "id": PID, "title": SCRIPT["title"],
        "topic": "2026年11月纳指暴跌原因复盘（数据可溯源）",
        "tone": "knowledge", "target_seconds": 64,
        "created_at": "2026-11-07 12:00:00", "updated_at": "2026-11-07 12:00:00",
    }, ensure_ascii=False), encoding="utf-8")
    (PDIR / "settings.json").write_text(json.dumps({
        "topic": "最近纳指暴跌的原因（真实数据、vibe知识大赏科普）",
        "model_id": "agent", "style": "浅暖纸底编辑信息图，深墨字，朱红强调；快节奏卡点；去深色AI味",
        "prompt": "全部数字出自 briefs/nasdaq-crash-vibe-facts.md",
        "target_seconds": 64, "voice": VOICE, "tts_rate": RATE,
        "bgm": "vibe_bgm", "template": "datavideo",
        "ai_director": False, "gen_scenes": True,
    }, ensure_ascii=False), encoding="utf-8")
    spath = PDIR / "script.json"
    spath.write_text(json.dumps(SCRIPT, ensure_ascii=False, indent=1), encoding="utf-8")
    return ScriptDraft.model_validate_json(spath.read_text(encoding="utf-8"))


def build_plan(script: ScriptDraft) -> dict:
    sk = director.style_key("vibe知识大赏·市场科普（浅纸信息图）", "facts: nasdaq-crash-vibe-facts.md")
    shot_plans = []
    for si, sh in enumerate(script.shots):
        cam, inten, trans, grade, speed = SHOT_FX[si]
        plan = {
            "camera": cam, "transition": trans, "intensity": inten,
            "grade": grade, "grain": GRAIN,
            "overlay": None, "sfxMoment": SFX_MOMENTS.get(si),
            "atmosphere": None,
            "emphasis": EMPHASIS[si],
            "scene": {
                "kind": f"gen:nasdaq-crash-vibe:{si + 1:02d}",
                "palette": list(sh.colors),
                "accent": ACCENT,
                "speed": speed,
            },
        }
        shot_plans.append({"hash": director.shot_hash(sh, sk), "plan": plan})
    return {
        "v": 2,
        "script_hash": director.script_fingerprint(script),
        "style_key": sk, "style_ok": True, "critic_used": False,
        "template": TEMPLATE_JUDGMENT,
        "look": LOOK,
        "kicker": "VIBE 知识大赏 · 市场科普",
        "pacing": "钩子→暴跌数据→回撤位置→知识点→归因(导火索/监管/回报)→伤亡→传染→历史→CTA；峰值在 S02/S08/S10，S04 与 S11 降速沉淀",
        "grain": GRAIN,
        "shots": shot_plans,
    }


def main() -> None:
    argv = sys.argv[1:]
    no_render = "--no-render" in argv
    preview = "--preview" in argv
    reuse_voice = "--reuse-voice" in argv

    script = write_project_files()
    durations_path = PDIR / "durations.json"

    # 1. 配音（实测时长落盘）
    if reuse_voice and durations_path.exists():
        durations = json.loads(durations_path.read_text(encoding="utf-8"))
        print("[1/4] 复用已有配音", sum(len(s["lines"]) for s in SCRIPT["shots"]), "句")
    else:
        print("[1/4] 配音生成中…", flush=True)
        durations = voice.generate_script_voices(PID, script.shots, voice=VOICE, rate=RATE)
        durations_path.write_text(json.dumps(durations, ensure_ascii=False, indent=1), encoding="utf-8")
    narr_sec = sum(durations.values())
    print(f"[voice] 口播合计 {narr_sec:.1f}s")

    # 2. BGM（复用 vibe_bgm.mp3 + 库内实测节拍）
    bgm_meta = json.loads((STORAGE_DIR / "bgm_meta.json").read_text(encoding="utf-8"))[BGM_NAME]
    bgm = BgmSpec(
        src=f"bgm/{BGM_NAME}", volume=BGM_VOLUME,
        bpm=float(bgm_meta["bpm"]), beats=[float(b) for b in bgm_meta["beats"]][:400],
    )
    print(f"[bgm] {BGM_NAME} bpm={bgm.bpm} beats={len(bgm.beats)}")

    # 3. 导演方案 + props 组装 + 整轨预混
    print("[2/4] 组装渲染契约…", flush=True)
    plan = build_plan(script)
    director.save_plan(PID, plan)

    props = assemble_props(script, durations, [None] * len(script.shots), bgm=bgm, plan=plan, grain_opacity=GRAIN)
    props = bind_project(props, PID)
    render_dir = RENDERS_DIR / PID
    render_dir.mkdir(parents=True, exist_ok=True)
    props_path = render_dir / "props.json"
    props_path.write_text(props.to_props_json(), encoding="utf-8")

    print("[3/4] 整轨预混…", flush=True)
    subprocess.run(
        [sys.executable, "-I", str(ROOT / "tools" / "premix_track.py"),
         "--pid", PID, "--props", str(props_path), "--template", "datavideo"],
        check=True,
    )

    # 4. 渲染
    if no_render:
        print(f"[4/4] props.json 就绪（--no-render）：{props_path}")
        print("下一步：python -I tools/timeline_check.py --props … --json-out timeline.json（取 marks 写 gen 场景）")
        return

    if preview:
        frames = (0, 359)
        out = render_dir / "preview.mp4"
    else:
        frames = None
        out = render_dir / "final.mp4"
    print(f"[4/4] Remotion 渲染中… -> {out}", flush=True)
    rc = renderer.render_video(props_path, out, render_dir / ("preview.log" if preview else "final.log"),
                               frames=frames, composition="DataVideo")
    print(f"render rc={rc}")
    if rc == 0 and not preview:
        # 封面：8% 处抽帧
        import re
        total = None
        log = (render_dir / "final.log").read_text(encoding="utf-8", errors="replace")
        m = re.search(r"durationInFrames=(\d+)", log)
        if m:
            total = int(m.group(1)) / FPS
        at = total * 0.08 if total else 5.0
        subprocess.run(
            [str(FFMPEG_BIN), "-y", "-hide_banner", "-v", "error", "-ss", f"{at:.2f}",
             "-i", str(out), "-frames:v", "1", str(render_dir / "cover.jpg")],
            check=True,
        )
        print(f"成片：{out}  封面：{render_dir / 'cover.jpg'}")
    sys.exit(rc)


if __name__ == "__main__":
    main()
