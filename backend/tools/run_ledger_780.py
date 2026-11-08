# -*- coding: utf-8 -*-
"""重新生成《两个账户》ledger-780：配音（A股/美股口径）→ props → 整轨 → 渲染。

用法：
    python -I tools/run_ledger_780.py            # 全流程（配音+props+渲染）
    python -I tools/run_ledger_780.py --no-voice # 复用现有配音，只重建 props 并渲染
    python -I tools/run_ledger_780.py --no-render
"""
import argparse
import io
import json
import sys
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace", line_buffering=True)

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

from app.config import BGM_PUBLIC_SUBDIR, PROJECTS_DIR, REMOTION_PUBLIC, RENDERS_DIR  # noqa: E402
from app.services import beat, renderer, tasks, voice  # noqa: E402
from app.services.pipeline import assemble_props, bind_project, line_id  # noqa: E402
from app.schemas import BgmSpec, MarketData  # noqa: E402

PID = "ledger-780"


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def shot_frames(props) -> tuple[list[int], int]:
    """复刻 MotionShow shotDurationInFrames 的镜长计算（帧）。"""
    frames: list[int] = []
    for sh in props.shots:
        line_off = 0
        for ln in sh.lines:
            line_off += max(1, int(round(ln.duration_sec * 30))) + 11
        wanted = int(round((sh.duration_sec or 0) * 30))
        frames.append(max(72, line_off + 18, wanted))
    return frames, sum(frames)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-voice", action="store_true")
    ap.add_argument("--no-render", action="store_true")
    args = ap.parse_args()

    pdir = PROJECTS_DIR / PID
    script = tasks.load_script(PID)
    settings = tasks.load_settings(PID)
    plan = load_json(pdir / "director.json")
    flow = load_json(pdir / "flow.json")
    market = MarketData.model_validate_json((pdir / "market.json").read_text(encoding="utf-8"))

    # 1) 配音：按场景整段合成，返回逐句实测时长
    if args.no_voice:
        durations = {}
        for si, shot in enumerate(script.shots):
            for li, line in enumerate(shot.lines):
                lid = line_id(si, li)
                p = REMOTION_PUBLIC / f"voice/projects/{PID}/{lid}.wav"
                if p.exists():
                    durations[lid] = round(voice._voice_file_duration(p), 3)
        if len(durations) != sum(len(s.lines) for s in script.shots):
            raise SystemExit("缺少逐句配音文件，请先去掉 --no-voice 生成")
    else:
        durations = voice.generate_script_voices(
            PID, script.shots, voice=settings.voice, rate=settings.tts_rate
        )

    # 2) BGM（沿用 two_accounts_bgm，节拍实测）
    bgm_name = (flow.get("bgm_choice") or {}).get("track") or settings.bgm or "two_accounts_bgm"
    bgm_path = REMOTION_PUBLIC / BGM_PUBLIC_SUBDIR / f"{bgm_name}.mp3"
    meta = beat.analyze(bgm_path)
    bgm = BgmSpec(
        src=f"{BGM_PUBLIC_SUBDIR}/{bgm_name}.mp3",
        volume=float((flow.get("bgm_choice") or {}).get("volume") or 0.4),
        bpm=meta["bpm"],
        beats=meta["beats"][:400],
    )

    # 3) props + 整轨
    props = bind_project(
        assemble_props(
            script, durations, [None] * len(script.shots),
            bgm=bgm, plan=plan, grain_opacity=0.05, market=market,
        ),
        PID,
    )
    props = voice.apply_motion_track(PID, props)

    frames, total = shot_frames(props)
    print("\n==== 时间轴 ====")
    cursor = 0
    for i, (sh, fr) in enumerate(zip(props.shots, frames)):
        print(
            f"S{i + 1} {sh.year:<12} {sh.duration_sec:>4.1f}s  实际 {fr / 30:>5.2f}s  "
            f"起点 {cursor / 30:>5.2f}s  {sh.market.variant if sh.market else ''}"
        )
        for ln in sh.lines:
            print(f"    {ln.id}: {ln.duration_sec:.2f}s  {ln.text}")
        cursor += fr
    print(f"总长 {total / 30:.2f}s（{total} 帧）")

    rdir = RENDERS_DIR / PID
    rdir.mkdir(parents=True, exist_ok=True)
    props_path = rdir / "props.json"
    props_path.write_text(props.to_props_json(), encoding="utf-8")
    print(f"props: {props_path}")

    if args.no_render:
        return

    out_path = rdir / "final.mp4"
    log_path = rdir / "render.log"
    print("Remotion 渲染中...")
    rc = renderer.render_video(props_path, out_path, log_path, composition="MotionShow")
    print(f"render rc={rc}  out={out_path}")
    if rc != 0:
        print(renderer.tail_log(log_path, 40))
        raise SystemExit(rc)


if __name__ == "__main__":
    main()
