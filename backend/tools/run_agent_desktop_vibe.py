# -*- coding: utf-8 -*-
"""《Vibe 知识大赏 · agent-desktop 工具科普》竖屏 1080×1920 一键驱动。

流程：剧本 → edge-tts 逐镜配音（实测时长）→ 镜头时长按 BGM 拍点吸附
→ 预混旁白整轨 → props.json → Remotion 渲染 AgentDesktopVibe → 封面/QA 抽帧。

用法：
    python -I tools/run_agent_desktop_vibe.py                # 全流程（含整片渲染）
    python -I tools/run_agent_desktop_vibe.py --no-render    # 只准备 props（调试）
    python -I tools/run_agent_desktop_vibe.py --preview      # 只渲前 10 秒
    python -I tools/run_agent_desktop_vibe.py --reuse-voice  # 复用已有配音

契约：Remotion 端 src/vibe-agent/{types,fx,slides,AgentDesktopVibe}.tsx，
composition id = AgentDesktopVibe（1080×1920@30）。
模板判定：from_scratch（工具科普与行星/宇宙模板域无关，画面全部自绘，无 dv/* 场景）。
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

PID = "agent-desktop-vibe"
FPS = 30
VOICE = "zh-CN-YunjianNeural"
RATE = "+12%"
LEAD = 0.45      # 每镜开头留白（旁白起点）
TAIL = 0.95      # 旁白结束后到切镜的余量
MIN_SHOT = 3.6   # 最短镜长

COMPOSITION = "AgentDesktopVibe"
BGM_NAME = "vibe_we_never.mp3"  # 由 tools/fetch_vibe_bgm.py 产出；缺失则回退 uplifting
BGM_FALLBACK = "uplifting.mp3"

# ---------------- 剧本（13 镜） ----------------
# 叙事：钩子问题 → 今天的主角 → 旧 agent 痛点 → 它的优点 → 应用场景 → 怎么用（装/实操/接 MCP）→ 注意事项 → 评论区
SLIDES = [
    dict(
        id="cover", kind="cover",
        kicker="VIBE 知识大赏 · 工具科普",
        title=["AI 开始", "替你上班了？"], sub="AI 不只会聊天 · 还会动手",
        accent="#F5B942",
        narration="AI 不只会聊天，它开始动手帮你上班——你信吗？",
        emphasis=["动手帮你上班"],
        enter="zoom", exit="up", cam="pushSlow",
    ),
    dict(
        id="hero", kind="what",
        kicker="01 · 今天的主角",
        title=["今天的主角", "agent-desktop"], sub="vercel-labs / agent-desktop",
        accent="#5AB0FF",
        narration="今天的主角，是开源工具 agent-desktop。",
        emphasis=["agent-desktop"],
        enter="slideUp", exit="zoomOut", cam="pullOut",
    ),
    dict(
        id="pain", kind="hook",
        kicker="02 · 以前的电脑 agent",
        title=["截图猜坐标", "又慢又容易错"],
        sub="screenshot → 找像素 → 猜坐标 → 点下去",
        accent="#FF6B57",
        narration="以前的电脑 agent，全靠截图猜坐标。",
        emphasis=["截图", "猜坐标"],
        enter="slideUp", exit="zoomOut", cam="pullOut",
    ),
    dict(
        id="answer", kind="answer",
        kicker="03 · 它的优点",
        title=["不截图", "直接读界面"],
        sub="the OS already knows every button",
        accent="#3DDC97",
        narration="它不截图，直接读系统的无障碍树。",
        emphasis=["不截图", "直接读"],
        enter="whip", exit="right", cam="whipR", flash=True,
    ),
    dict(
        id="principle", kind="principle",
        kicker="04 · 为什么更准",
        title=["每个按钮", "都有编号"],
        sub="ref = 快照 ID + 元素编号；点错会报错",
        accent="#5AB0FF",
        narration="每个按钮都有编号，AI 照着编号点，点错会报错。",
        emphasis=["每个按钮", "编号", "报错"],
        enter="slideLeft", exit="down", cam="panRight",
    ),
    dict(
        id="scenarios", kind="scenarios",
        kicker="05 · 应用场景",
        title=["它最适合", "干这些活"],
        sub="凡是「重复、有固定界面、又懒得写脚本」的活",
        accent="#3DDC97",
        narration="重复填表、跨软件搬数据、软件测试，都是它的主场。",
        emphasis=["重复填表", "跨软件搬数据", "软件测试"],
        enter="slideUp", exit="left", cam="panRight",
    ),
    dict(
        id="install", kind="install",
        kicker="06 · 怎么用 · 第一步",
        title=["一行命令", "装好开跑"],
        sub="macOS 还需在系统设置里给「辅助功能」权限",
        accent="#5AB0FF",
        narration="用起来也简单：一行命令装好，再开权限。",
        emphasis=["一行命令", "权限"],
        enter="slideUp", exit="down", cam="pushIn",
    ),
    dict(
        id="firstrun", kind="firstrun",
        kicker="07 · 怎么用 · 第二步",
        title=["看 · 点 · 验证"],
        sub="先快照拿 ref，再点，再快照确认",
        accent="#F5B942",
        narration="先让它看一眼界面，再点按钮，再看一眼验证。",
        emphasis=["看一眼", "点按钮", "验证"],
        enter="bounce", exit="up", cam="pushIn",
    ),
    dict(
        id="mcp", kind="mcp",
        kicker="08 · 怎么用 · 第三步",
        title=["接上 MCP", "AI 长出鼠标"],
        sub="56 个可操作命令：点击 / 输入 / 拖拽 / 剪贴板 / 窗口 / 通知",
        accent="#FF6B57",
        narration="接上 MCP，你的 AI 助手立刻长出鼠标键盘。",
        emphasis=["MCP", "鼠标键盘"],
        enter="flip", exit="right", cam="rock",
    ),
    dict(
        id="caution1", kind="caution1",
        kicker="⚠ 注意事项 01",
        title=["权限给最小", "只放行要用的 App"],
        sub="它能看见整个桌面，权限就是它的边界",
        accent="#FF6B57",
        narration="但第一，权限给到最小，只放行要用的那个 App。",
        emphasis=["权限", "最小"],
        enter="bounce", exit="up", cam="pushIn",
    ),
    dict(
        id="caution2", kind="caution2",
        kicker="⚠ 注意事项 02",
        title=["快照里", "是你的桌面"],
        sub="调试日志和录屏发出去之前，先想想里面有什么",
        accent="#F5B942",
        narration="第二，快照里有你的桌面，别传进公开日志。",
        emphasis=["快照", "公开日志"],
        enter="slideLeft", exit="zoomOut", cam="pullOut",
    ),
    dict(
        id="caution3", kind="caution3",
        kicker="⚠ 注意事项 03",
        title=["危险操作", "必须人工确认"],
        sub="它没有常识，你的确认就是最后一道闸",
        accent="#FF6B57",
        narration="第三，删文件、付款、发消息，必须人工确认。",
        emphasis=["人工确认"],
        enter="whip", exit="down", cam="whipR", flash=True,
    ),
    dict(
        id="outro", kind="outro",
        kicker="OPEN SOURCE · APACHE-2.0",
        title=["现在就能试", "链接在评论区"],
        sub="github.com / vercel-labs / agent-desktop",
        accent="#F5B942",
        narration="现在就能试，链接我已经放在评论区了。",
        emphasis=["评论区"],
        enter="zoom", exit="none", cam="pushSlow", flash=True,
    ),
]

TITLE = "AI 开始替你上班了？agent-desktop 怎么用、坑在哪"


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
                    "title": "AI 开始替你上班了？agent-desktop 上手 3 步，坑我先替你踩了",
                    "hashtags": ["#vibe知识大赏", "#AI工具", "#agentdesktop", "#开源", "#效率工具", "#程序员"],
                    "desc": "AI 不只会聊天，它开始动手帮你上班。Vercel Labs 开源的 agent-desktop：怎么装、怎么用、哪些活能接、哪里会翻车，一条视频讲清。链接在评论区。",
                },
                "xhs": {
                    "title": "AI 真的能帮你点鼠标了？这个开源工具我先替你们试了",
                    "body": "不用截图、不用像素匹配，AI 直接读系统无障碍树，点按钮、填表、搬数据都能干。但权限和隐私这两关，必须先想清楚。",
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

    # 封面 + QA 抽帧（渲染后抽 10 帧人工过目）
    print("封面 / QA 抽帧…", flush=True)
    cursor = 0
    cover_frame = 0
    qa_frames: list[int] = []
    for i, item in enumerate(timeline):
        mid = cursor + item["durationFrames"] // 2
        if i == 0:
            cover_frame = min(90, item["durationFrames"] - 1)
        if i in {1, 3, 5, 8, 9, 11, 12, 13}:
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
