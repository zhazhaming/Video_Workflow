# -*- coding: utf-8 -*-
"""《Vibe 知识大赏 · MoneyPrinterTurbo 工具科普》竖屏 1080×1920 一键驱动。

流程：剧本 → edge-tts 逐镜配音（实测时长）→ 镜头时长按 BGM 拍点吸附
→ 预混旁白整轨 → props.json → Remotion 渲染 MoneyPrinterTurboVibe → 封面/QA 抽帧。

用法：
    python -X utf8 tools/run_moneyprinterturbo_vibe.py                # 全流程（含整片渲染）
    python -X utf8 tools/run_moneyprinterturbo_vibe.py --no-render    # 只准备 props（调试）
    python -X utf8 tools/run_moneyprinterturbo_vibe.py --preview      # 只渲前 10 秒
    python -X utf8 tools/run_moneyprinterturbo_vibe.py --reuse-voice  # 复用已有配音

契约：Remotion 端 src/vibe-mpt/{types,slides,MoneyPrinterTurboVibe,data}.tsx，
composition id = MoneyPrinterTurboVibe（1080×1920@30）。
模板判定：from_scratch（工具科普与行星/宇宙模板域无关，画面全部自绘，无 dv/* 场景）。
事实来源：briefs/moneyprinterturbo-facts.md（README / GitHub API，2026-11-05 快照）。
"""
import json
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np

ROOT = Path(r"D:\Work\video-workflow\backend")
sys.path.insert(0, str(ROOT))

from app.config import FFMPEG_BIN, REMOTION_PUBLIC, RENDERS_DIR, STORAGE_DIR  # noqa: E402
from app.schemas import Line, ScriptDraft, Shot  # noqa: E402
from app.services import beat, voice  # noqa: E402

PID = "moneyprinterturbo-vibe"
FPS = 30
VOICE = "zh-CN-YunjianNeural"
RATE = "+12%"
LEAD = 0.32      # 每镜开头留白（旁白起点）
TAIL = 0.62      # 旁白结束后到切镜的余量
MIN_SHOT = 3.4   # 最短镜长

COMPOSITION = "MoneyPrinterTurboVibe"
BGM_NAME = "vibe_we_never.mp3"  # 抖音「vibe 知识大赏」同款；缺失则回退 uplifting
BGM_FALLBACK = "uplifting.mp3"

# ---------------- 剧本（12 镜） ----------------
# 叙事：钩子 → 主角 → 旧做法痛点 → 流水线 → 脚本 → 配音字幕 → 画面来源 → 输出 → 三种跑法 → 坑 01 → 坑 02 → 评论区
SLIDES = [
    dict(
        id="cover", kind="cover",
        kicker="VIBE 知识大赏 · 工具科普",
        title=["打一行字", "成片自己出来"], sub="AI 短视频流水线 · 开源工具实测",
        accent="#F5B942",
        narration="有人把做短视频，做成了一条流水线。打一行字，成片自己出来。",
        emphasis=["流水线", "打一行字"],
        enter="zoom", exit="up", cam="pushSlow", flash=True,
    ),
    dict(
        id="hero", kind="what",
        kicker="01 · 今天的主角",
        title=["今天的主角", "MoneyPrinterTurbo"],
        sub="harry0703 / MoneyPrinterTurbo · MIT",
        accent="#5AB0FF",
        narration="它叫 MoneyPrinterTurbo，开源 MIT，十三万九千星，上个月刚更新。",
        emphasis=["MoneyPrinterTurbo", "十三万九千星"],
        enter="slideUp", exit="zoomOut", cam="pullOut",
    ),
    dict(
        id="pain", kind="hook",
        kicker="02 · 以前的做法",
        title=["以前做一条", "半天没了"],
        sub="写稿 + 找素材 + 配音字幕 + 剪辑",
        accent="#FF6B57",
        narration="以前做一条：写稿半小时，找素材一小时，配音字幕再一小时，剪辑还得一小时。",
        emphasis=["半小时", "一小时"],
        enter="slideUp", exit="zoomOut", cam="pullOut",
    ),
    dict(
        id="pipeline", kind="principle",
        kicker="03 · 它到底做了什么",
        title=["它最值钱的", "是这条流水线"],
        sub="主题 → 脚本 → 配音 → 字幕 → 画面 → 成片",
        accent="#3DDC97",
        narration="它最值钱的不是生成，是把五步串成流水线。",
        emphasis=["五步", "流水线"],
        enter="whip", exit="right", cam="whipR", flash=True,
    ),
    dict(
        id="script", kind="loop",
        kicker="04 · 第一步 · 脚本",
        title=["脚本这步", "模型随便换"],
        sub="Kimi / OpenAI / Claude / DeepSeek / Ollama",
        accent="#5AB0FF",
        narration="脚本这步，Kimi、DeepSeek、Claude 都能接，本地 Ollama 也行。",
        emphasis=["Kimi", "DeepSeek", "Ollama"],
        enter="slideUp", exit="up", cam="pushIn",
    ),
    dict(
        id="voice", kind="answer",
        kicker="05 · 第二步 · 配音字幕",
        title=["配音字幕", "免费也能跑"],
        sub="Edge TTS · 无需 API key · 时间戳对齐",
        accent="#F5B942",
        narration="配音默认 Edge TTS，免费不用 key；字幕跟着语音走。",
        emphasis=["Edge TTS", "免费", "不用 key"],
        enter="pop", exit="zoomOut", cam="pushSlow",
    ),
    dict(
        id="footage", kind="platforms",
        kicker="06 · 第三步 · 画面",
        title=["画面从哪来", "免费素材库"],
        sub="Pexels / Pixabay / Coverr · 不是 AI 生成",
        accent="#FF6B57",
        narration="但画面默认不是 AI 生成的，是从 Pexels、Pixabay 匹配的。",
        emphasis=["不是 AI 生成", "Pexels", "Pixabay"],
        enter="whip", exit="right", cam="panRight", flash=True,
    ),
    dict(
        id="output", kind="scenarios",
        kicker="07 · 输出",
        title=["竖屏横屏", "批量出片"],
        sub="9:16 · 16:9 · 1:1 · 任务历史",
        accent="#3DDC97",
        narration="竖屏、横屏、方形都能出，还能批量跑任务。",
        emphasis=["1080×1920", "批量"],
        enter="slideUp", exit="up", cam="pullOut",
    ),
    dict(
        id="run", kind="install",
        kicker="08 · 怎么跑",
        title=["三种跑法", "选一个就行"],
        sub="一键包 / pip / Docker",
        accent="#5AB0FF",
        narration="三种跑法：Windows 一键包、pip 装 mpt、或者 Docker。",
        emphasis=["Windows 一键包", "pip", "Docker"],
        enter="slideUp", exit="zoomOut", cam="pushIn",
    ),
    dict(
        id="caution1", kind="caution1",
        kicker="⚠ 坑 01 · 先别上头",
        title=["素材版权", "平台查重", "API 要钱"],
        sub="发布前先看授权 · 别批量撞车 · 先算成本",
        accent="#FF6B57",
        narration="先说坑：素材有版权，平台查重，模型 API 也要钱。",
        emphasis=["版权", "查重", "API 也要钱"],
        enter="slideLeft", exit="up", cam="panLeft",
    ),
    dict(
        id="caution2", kind="caution2",
        kicker="⚠ 坑 02 · 工具边界",
        title=["省手不省脑", "前 3 秒靠你"],
        sub="一键生成 ≠ 爆款",
        accent="#F5B942",
        narration="一键只省手，不省脑子。脚本和前 3 秒，还得你自己盯。",
        emphasis=["不省脑子", "前 3 秒"],
        enter="slideUp", exit="zoomOut", cam="pushSlow",
    ),
    dict(
        id="outro", kind="outro",
        kicker="OPEN SOURCE · MIT",
        title=["先跑一条", "再决定投入"],
        sub="github.com / harry0703 / MoneyPrinterTurbo",
        accent="#F5B942",
        narration="链接在评论区。先收藏，跑一条，再决定要不要投入。",
        emphasis=["评论区", "先收藏"],
        enter="zoom", exit="none", cam="pushSlow", flash=True,
    ),
]

TITLE = "打一行字，成片自己出来？MoneyPrinterTurbo 到底值不值得用"


def video_dir() -> Path:
    return RENDERS_DIR / PID


def build_script() -> ScriptDraft:
    return ScriptDraft(
        title=TITLE,
        shots=[
            Shot(label=s["kicker"], lines=[Line(text=s["narration"])])
            for s in SLIDES
        ],
    )


# ---------------- 配音 ----------------
def ensure_voices(script: ScriptDraft, reuse: bool) -> dict[str, float]:
    vdir = REMOTION_PUBLIC / voice.VOICE_PUBLIC_SUBDIR / PID
    durations_path = STORAGE_DIR / f"_{PID}_durations.json"
    cached = json.loads(durations_path.read_text(encoding="utf-8")) if durations_path.exists() else {}
    if (
        reuse
        and len(cached) == len(SLIDES)
        and all((vdir / f"s{i + 1:02d}_0.wav").exists() for i in range(len(SLIDES)))
    ):
        print("[1/5] 复用已有配音", flush=True)
        return json.loads(durations_path.read_text(encoding="utf-8"))
    print("[1/5] 逐镜配音（edge-tts）…", flush=True)
    durations = voice.generate_script_voices(PID, script.shots, voice=VOICE, rate=RATE)
    durations_path.write_text(json.dumps(durations, ensure_ascii=False, indent=1), encoding="utf-8")
    return durations


# ---------------- 时间轴：实测配音 + BGM 拍点吸附 ----------------
def build_timeline(durations: dict[str, float], beats: list[float], bpm: float) -> list[dict]:
    out: list[dict] = []
    cursor = 0.0
    for i, s in enumerate(SLIDES):
        speech = durations[f"s{i + 1:02d}_0"]
        target = max(MIN_SHOT, speech + LEAD + TAIL)
        end = cursor + target
        # 切点锁拍：候选拍点必须落在旁白结束 +0.30s 之后，且不超过目标 +0.60s；
        # 取离目标最近的一拍 —— 这样每一刀都踩在 BGM 拍点上（帧取整误差 ≤0.02s）。
        if beats:
            lo = cursor + speech + LEAD + 0.30
            hi = cursor + target + 0.60
            cand = [b for b in beats if lo <= b <= hi]
            if cand:
                end = min(cand, key=lambda b: abs(b - (cursor + target)))
        frames = max(1, round((end - cursor) * FPS))
        spoken_start = cursor + LEAD
        out.append(
            {
                "index": i,
                "slide": s,
                "startSec": round(cursor, 3),
                "startFrame": round(cursor * FPS),
                "durationFrames": frames,
                "narrationSec": round(speech, 3),
                "narrationStartSec": round(spoken_start, 3),
            }
        )
        cursor += frames / FPS
    return out


def _decode_mono(path: Path) -> tuple[np.ndarray, int]:
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_path = Path(tmp.name)
    try:
        subprocess.run(
            [str(FFMPEG_BIN), "-y", "-v", "error", "-i", str(path), "-ac", "1", "-ar", "44100", "-f", "wav", str(tmp_path)],
            capture_output=True,
            timeout=120,
            check=True,
        )
        with wave.open(str(tmp_path), "rb") as w:
            sr = w.getframerate()
            data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
        return data.astype(np.float32) / 32768.0, sr
    finally:
        tmp_path.unlink(missing_ok=True)


def mix_narration(timeline: list[dict], total_frames: int) -> Path:
    """把逐镜配音按时间轴混成一条根级音轨（避免嵌套 Sequence 音频碎片 bug）。"""
    sr = 44100
    total_samples = int(total_frames / FPS * sr) + sr
    track = np.zeros(total_samples, dtype=np.float32)
    vdir = REMOTION_PUBLIC / voice.VOICE_PUBLIC_SUBDIR / PID
    for item in timeline:
        wav = vdir / f"s{item['index'] + 1:02d}_0.wav"
        samples, file_sr = _decode_mono(wav)
        if file_sr != sr:
            raise RuntimeError(f"采样率异常：{wav.name} {file_sr}")
        offset = int(item["narrationStartSec"] * sr)
        end = min(total_samples, offset + len(samples))
        track[offset:end] += samples[: end - offset]
    peak = float(np.abs(track).max()) or 1.0
    track = track * min(1.0, 0.92 / peak)
    out = REMOTION_PUBLIC / voice.VOICE_PUBLIC_SUBDIR / PID / "narration.wav"
    with wave.open(str(out), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((track * 32767).astype(np.int16).tobytes())
    print(f"[3/5] 旁白整轨：{out.name}（{total_samples / sr:.1f}s，峰值归一 0.92）", flush=True)
    return out


# ---------------- BGM ----------------
def resolve_bgm(total_frames: int) -> tuple[dict, list[float], float]:
    meta_path = STORAGE_DIR / "_vibe_bgm_meta.json"
    chosen = REMOTION_PUBLIC / "bgm" / BGM_NAME
    fallback = REMOTION_PUBLIC / "bgm" / BGM_FALLBACK
    if not chosen.exists() and fallback.exists():
        print(f"!! 未找到 {BGM_NAME}，回退 {BGM_FALLBACK}", flush=True)
        chosen = fallback
    if not chosen.exists():
        return {}, [], 0.0
    bpm, beats, duration = 0.0, [], 0.0
    if meta_path.exists() and chosen.name == BGM_NAME:
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        bpm = float(meta.get("bpm") or 0.0)
        beats = [float(b) for b in (meta.get("beats") or [])]
        duration = float(meta.get("duration_sec") or 0.0)
    if not beats:
        info = beat.analyze(chosen)
        bpm, beats = float(info.get("bpm") or 0.0), list(info.get("beats") or [])
    total_sec = total_frames / FPS
    if duration and duration < total_sec:
        print(f"!! BGM 只有 {duration:.1f}s < 成片 {total_sec:.1f}s，尾部会静音", flush=True)
    spec = {"src": f"bgm/{chosen.name}", "volume": 0.62, "bpm": bpm}
    print(f"[2/5] BGM：{chosen.name} · {bpm:.1f}BPM · {len(beats)} 拍点", flush=True)
    return spec, beats, duration


# ---------------- 落盘 ----------------
def write_publish_copy() -> None:
    out = video_dir() / "publish_copy.json"
    out.write_text(
        json.dumps(
            {
                "douyin": {
                    "title": "打一行字，成片自己出来？这个开源工具我先替你踩了坑",
                    "hashtags": ["#vibe知识大赏", "#AI工具", "#MoneyPrinterTurbo", "#开源", "#短视频制作", "#自媒体"],
                    "desc": "输入一个主题，脚本、配音、字幕、素材、合成一条龙。但画面不是 AI 生成的，素材版权、平台查重、API 成本这三个坑，先看清再上手。链接在评论区。",
                },
                "xhs": {
                    "title": "做短视频能有多快？我把这条流水线跑了一遍",
                    "body": "脚本换模型、配音用免费 Edge TTS、画面从 Pexels/Pixabay 匹配。省的是手，不是脑子——前 3 秒还是得自己盯。",
                },
            },
            ensure_ascii=False,
            indent=1,
        ),
        encoding="utf-8",
    )


def render_still(props_path: Path, frame: int, out_path: Path) -> None:
    cmd = (
        f'npx remotion still {COMPOSITION} "{out_path}" '
        f'--props="{props_path}" --frame={frame} --overwrite'
    )
    proc = subprocess.run(cmd, cwd=r"D:\Work\remotion-life-sim", shell=True, capture_output=True, timeout=600)
    if proc.returncode != 0:
        print(f"!! still 失败 frame={frame}\n{proc.stderr.decode('utf-8', 'replace')[-800:]}", flush=True)


def main() -> None:
    args = sys.argv[1:]
    no_render = "--no-render" in args
    preview = "--preview" in args
    reuse = "--reuse-voice" in args

    script = build_script()
    durations = ensure_voices(script, reuse)
    script_path = STORAGE_DIR / f"_{PID}_script.json"
    script_path.write_text(script.model_dump_json(indent=1), encoding="utf-8")

    # 先按无拍点排一版，拿到总时长后确认 BGM，再吸附重排
    timeline = build_timeline(durations, [], 0.0)
    total_frames = sum(t["durationFrames"] for t in timeline)
    bgm, beats, bgm_duration = resolve_bgm(total_frames)
    timeline = build_timeline(durations, beats, float(bgm.get("bpm") or 0.0))
    total_frames = sum(t["durationFrames"] for t in timeline)
    print(f"      时间轴：{len(timeline)} 镜 · {total_frames} 帧 / {total_frames / FPS:.2f}s", flush=True)

    narration = mix_narration(timeline, total_frames)

    props = {
        "brand": "VIBE 知识大赏",
        "tag": "// TOOL LAB",
        "bgm": bgm,
        "narrationAudio": {
            "src": str(narration.relative_to(REMOTION_PUBLIC)).replace("\\", "/"),
            "volume": 1,
        },
        "slides": [
            {
                "id": s["slide"]["id"],
                "kind": s["slide"]["kind"],
                "kicker": s["slide"]["kicker"],
                "title": s["slide"]["title"],
                "sub": s["slide"]["sub"],
                "accent": s["slide"]["accent"],
                "caption": s["slide"]["narration"],
                "emphasis": s["slide"]["emphasis"],
                "narration": s["slide"]["narration"],
                "narrationSec": s["narrationSec"],
                "durationFrames": s["durationFrames"],
                "enter": s["slide"]["enter"],
                "exit": s["slide"]["exit"],
                "cam": s["slide"]["cam"],
                "flash": bool(s["slide"].get("flash", False)),
            }
            for s in timeline
        ],
    }

    vdir = video_dir()
    vdir.mkdir(parents=True, exist_ok=True)
    props_path = vdir / "props.json"
    props_path.write_text(json.dumps(props, ensure_ascii=False, indent=1), encoding="utf-8")
    (vdir / "script.json").write_text(script.model_dump_json(indent=1), encoding="utf-8")
    (vdir / "durations.json").write_text(
        json.dumps(
            {f"s{item['index'] + 1:02d}_0": item["narrationSec"] for item in timeline},
            indent=1,
        ),
        encoding="utf-8",
    )
    write_publish_copy()
    print(f"[4/5] props 就绪：{props_path}", flush=True)

    if no_render:
        return

    from app.services import renderer

    if preview:
        out = vdir / "preview.mp4"
        print("[5/5] 渲染前 10 秒预览…", flush=True)
        rc = renderer.render_video(props_path, out, vdir / "preview.log", frames=(0, 299), composition=COMPOSITION)
        print(f"preview rc={rc} → {out}", flush=True)
        return

    print("[5/5] 整片渲染中（3~8 分钟）…", flush=True)
    out = vdir / "final.mp4"
    rc = renderer.render_video(props_path, out, vdir / "render.log", composition=COMPOSITION)
    print(f"render rc={rc}", flush=True)
    if rc != 0:
        tail = (vdir / "render.log").read_text(encoding="utf-8", errors="replace").splitlines()[-25:]
        print("\n".join(tail), flush=True)
        sys.exit(rc)

    # 封面 + QA 抽帧（渲染后抽帧人工过目）
    print("封面 / QA 抽帧…", flush=True)
    cursor = 0
    cover_frame = 0
    qa_frames: list[int] = []
    for i, item in enumerate(timeline):
        mid = cursor + item["durationFrames"] // 2
        if i == 0:
            cover_frame = min(90, item["durationFrames"] - 1)
        if i in {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11}:
            qa_frames.append(mid)
        cursor += item["durationFrames"]
    png = vdir / "_cover.png"
    render_still(props_path, cover_frame, png)
    if png.exists():
        from PIL import Image

        Image.open(png).convert("RGB").save(vdir / "cover.jpg", quality=92)
        png.unlink(missing_ok=True)
    for f in qa_frames:
        png = vdir / f"_qa_{f / FPS:.1f}.png"
        render_still(props_path, f, png)
        if png.exists():
            from PIL import Image

            Image.open(png).convert("RGB").save(vdir / f"qa_{f / FPS:.1f}.jpg", quality=90)
            png.unlink(missing_ok=True)
    print(f"成片：{out}（{total_frames} 帧 / {total_frames / FPS:.2f}s）", flush=True)


if __name__ == "__main__":
    main()
