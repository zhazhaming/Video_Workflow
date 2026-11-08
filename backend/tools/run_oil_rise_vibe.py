# -*- coding: utf-8 -*-
"""《加满一箱油多花100块？五年油价过山车一次讲清》Vibe 知识大赏 · 一键驱动。

新形式：ComfyUI 复古印刷插画主视觉（11 镜）+ 真数据图表 gen 场景（S02 调价计数板 /
S10 布油五年月线）。BGM 用本会话新入库的 hove.mp3（101.3 BPM 实测节拍）。

流程：script.json（已落盘）→ 复用 TTS 配音 → 加载 plan.json（含 template 判定）→
assemble_props（image 优先于 scene，safeScale 0.8）→ 整轨预混 → Remotion 渲染。

用法：
    python -X utf8 tools/run_oil_rise_vibe.py --preview      # 渲前 12 秒预览
    python -X utf8 tools/run_oil_rise_vibe.py                # 渲整片
    python -X utf8 tools/run_oil_rise_vibe.py --no-render    # 只到 props.json

契约：composition = DataVideo（1080×1920@30）；gen 场景 src/gen/oil-rise-vibe/SceneNN.tsx。
模板判定：from_scratch（见 plan.json template 字段）。
事实来源：briefs/oil-rise-vibe-facts.md（2026-11-07 快照）。
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(r"D:\Work\video-workflow\backend")
sys.path.insert(0, str(ROOT))

from app.config import FFMPEG_BIN, RENDERS_DIR, REMOTION_PUBLIC, STORAGE_DIR  # noqa: E402
from app.schemas import BgmSpec, ScriptDraft  # noqa: E402
from app.services import renderer  # noqa: E402
from app.services.pipeline import assemble_props, bind_project  # noqa: E402

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PID = "oil-rise-vibe"
PDIR = STORAGE_DIR / "projects" / PID
FPS = 30

BGM_NAME = "hove.mp3"  # Lenoxi《HOVE》，本会话 fetch_hove_bgm.py 入库
BGM_VOLUME = 0.7
GRAIN = 0.06
SAFE_SCALE = 0.8

# 关键镜加长收尾（DataVideo 镜长 = 句时长+tail，voice.py/timeline.ts 都读 tail）：
# S02 钩子落点 / S03 计数板读表 / S08 负价冲击 / S11 五年曲线扫线+呼吸 / S14 算账
# 加入开场/结语后全片逼近 BGM 90s 上限，tail 相应收紧。0 基镜号 → tail 秒
TAIL_OVERRIDES = {1: 1.6, 2: 3.4, 7: 2.2, 10: 4.0, 13: 1.4}

# 图片镜头（1 基镜号 → public 相对路径）；S03=调价计数板、S11=五年曲线 为图表 gen 场景，无图
# 文件名沿用初版镜号（01~13），开场 00、结语 15 为后补
IMAGE_SHOTS = {
    1: f"pic/projects/{PID}/00-ai.png",
    2: f"pic/projects/{PID}/01-ai.png",
    4: f"pic/projects/{PID}/03-ai.png",
    5: f"pic/projects/{PID}/04-ai.png",
    6: f"pic/projects/{PID}/05-ai.png",
    7: f"pic/projects/{PID}/06-ai.png",
    8: f"pic/projects/{PID}/07-ai.png",
    9: f"pic/projects/{PID}/08-ai.png",
    10: f"pic/projects/{PID}/09-ai.png",
    12: f"pic/projects/{PID}/11-ai.png",
    13: f"pic/projects/{PID}/12-ai.png",
    14: f"pic/projects/{PID}/13-ai.png",
    15: f"pic/projects/{PID}/15-ai.png",
}
CHART_SHOTS = {3, 11}


def image_rels(n: int) -> list[str | None]:
    return [None if i + 1 in CHART_SHOTS else IMAGE_SHOTS[i + 1] for i in range(n)]


def load_bgm() -> BgmSpec:
    meta = json.loads((REMOTION_PUBLIC / "bgm" / "hove.beats.json").read_text(encoding="utf-8"))
    return BgmSpec(
        src=f"bgm/{BGM_NAME}", volume=BGM_VOLUME,
        bpm=float(meta["bpm"]), beats=[float(b) for b in meta["beats"]][:400],
    )


def main() -> None:
    argv = sys.argv[1:]
    no_render = "--no-render" in argv
    preview = "--preview" in argv

    # 1. 文案 + 配音（TTS 已实测，复用 durations.json）
    script = ScriptDraft.model_validate_json((PDIR / "script.json").read_text(encoding="utf-8"))
    durations = json.loads((PDIR / "durations.json").read_text(encoding="utf-8"))
    missing = [
        lid for lid in durations
        if not (REMOTION_PUBLIC / "voice" / "projects" / PID / f"{lid}.wav").exists()
    ]
    if missing:
        raise SystemExit(f"配音文件缺失: {missing}（先跑 tts_gen.py）")
    print(f"[1/4] 复用配音 {len(durations)} 句，口播合计 {sum(durations.values()):.1f}s")

    # 2. BGM（hove.mp3 + 实测节拍）
    bgm = load_bgm()
    print(f"[bgm] {BGM_NAME} bpm={bgm.bpm} beats={len(bgm.beats)}")

    # 3. plan（已落盘，含 template 判定）+ props 组装 + 整轨预混
    plan = json.loads((PDIR / "plan.json").read_text(encoding="utf-8"))
    print("[2/4] 组装渲染契约…", flush=True)
    props = assemble_props(
        script, durations, image_rels(len(script.shots)),
        bgm=bgm, plan=plan, grain_opacity=GRAIN,
        prefer_images=True, safe_scale=SAFE_SCALE, title_card=True,
    )
    props = bind_project(props, PID)
    for idx, tv in TAIL_OVERRIDES.items():
        props.shots[idx].tail = tv
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

    if no_render:
        print(f"[4/4] props.json 就绪（--no-render）：{props_path}")
        return

    # 4. 渲染
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
