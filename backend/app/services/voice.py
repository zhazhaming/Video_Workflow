# -*- coding: utf-8 -*-
"""配音服务：edge-tts 整场合成 + 按词边界切句 + 裁剪静音 + 响度归一 + 实测时长。

逐句单独合成会让每句都重置语调，听感机械。这里改为同一场景的台词一次性合成，
用 WordBoundary 事件把音频切回逐句文件，既保留原有的逐句音频契约，
又让一句话的语调带着下一句的上下文。整场失败时自动回退为逐句合成。

edge-tts 的输出每句自带约 0.2s 头部 / 0.9s 尾部静音，不裁掉会导致句间空档过长，
裁剪后再用 ffmpeg 做轻压缩 + loudnorm 统一到 -14 LUFS（短视频人声偏响）。
"""
import asyncio
import json
import os
import re
import shutil
import subprocess
import wave
from pathlib import Path

import edge_tts
import numpy as np
from mutagen.mp3 import MP3

from ..config import (
    FFMPEG_BIN,
    REMOTION_PUBLIC,
    STORAGE_DIR,
    TTS_RATE,
    TTS_VOICE,
    VOICE_PUBLIC_SUBDIR,
)
from .pipeline import line_id

SAMPLE_TEXT = "人生就像一场没有剧本的演出，你永远不知道下一秒，会发生什么。"
SAMPLE_RATE = "+0%"

HEAD_KEEP = 0.03  # 头部保留 30ms
TAIL_KEEP = 0.12  # 尾部保留 120ms
SILENCE_THRESHOLD = 0.01
SEG_LEAD = 0.05  # 切句时向前多留 50ms，避免吃掉辅音

# edge-tts 偶发断连或返回空音频（网络抖动/限流），重试 + 超时避免整条流水线失败或卡死
TTS_TIMEOUT_SECONDS = float(os.getenv("TTS_TIMEOUT_SECONDS", "90"))
TTS_RETRIES = max(1, int(os.getenv("TTS_RETRIES", "3")))
TTS_RETRY_DELAY = float(os.getenv("TTS_RETRY_DELAY", "1.5"))

_SPOKEN_CLEAN = re.compile(r"[\W_]+")
_END_PUNCT = tuple("。！？…，、；：,.!?;:")
_QUESTION = re.compile(r"[？?]")
_EXCLAIM = re.compile(r"[！!]")


def _spoken_len(text: str) -> int:
    """只统计会被读出来的字符（去掉标点/空白），用于对齐词边界。"""
    return len(_SPOKEN_CLEAN.sub("", text))


def _join_scene_text(texts: list[str]) -> str:
    """把同一场的多句台词拼成一段：未收句的补逗号，让 TTS 自然连读。"""
    parts = []
    for t in texts:
        t = t.strip()
        if not t:
            continue
        if not t.endswith(_END_PUNCT):
            t += "，"
        parts.append(t)
    return "".join(parts)


def _scene_pitch(text: str) -> str:
    """问句略提音高、感叹句略提气势，避免整片一个语调。"""
    if _QUESTION.search(text):
        return "+2Hz"
    if _EXCLAIM.search(text):
        return "+1Hz"
    return "+0Hz"


def _line_spans(texts: list[str], bounds: list[dict]) -> list[tuple[float, float]] | None:
    """把 WordBoundary 事件按台词字符数切成每句的 [起, 止]（秒）。"""
    events: list[tuple[int, int, float, float]] = []
    cum = 0
    for b in bounds:
        n = _spoken_len(str(b.get("text", "")))
        events.append((cum, cum + n, float(b["start"]), float(b["dur"])))
        cum += n
    if cum == 0 or not events:
        return None

    spans: list[tuple[float, float]] = []
    offset = 0
    for t in texts:
        n = _spoken_len(t)
        if n == 0:
            return None
        start = next((e[2] for e in events if e[1] > offset), None)
        ends = [e for e in events if e[0] < offset + n]
        if start is None or not ends:
            return None
        end = ends[-1][2] + ends[-1][3]
        if end <= start:
            return None
        spans.append((start, end))
        offset += n
    return spans


def _voice_dir(project_id: str) -> Path:
    return REMOTION_PUBLIC / VOICE_PUBLIC_SUBDIR / project_id


def _find_speech_bounds(wav_path: Path) -> tuple[float, float] | None:
    """解码后的 wav 中，找首尾人声时间（秒）。"""
    try:
        with wave.open(str(wav_path), "rb") as w:
            sr = w.getframerate()
            ch = w.getnchannels()
            data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
        if len(data) == 0:
            return None
        samples = data.reshape(-1, ch).astype(np.float32).mean(axis=1) / 32768
        idx = np.where(np.abs(samples) > SILENCE_THRESHOLD)[0]
        if len(idx) == 0:
            return None
        return float(idx[0] / sr), float(idx[-1] / sr)
    except (OSError, wave.Error):
        return None


def _peak_safe_gain(wav_path: Path, start: float, end: float) -> float:
    """按裁剪后语音段的 RMS 计算增益，同时保证峰值不爆音（<=0.9）。"""
    try:
        with wave.open(str(wav_path), "rb") as w:
            sr = w.getframerate()
            ch = w.getnchannels()
            data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
        samples = data.reshape(-1, ch).astype(np.float32).mean(axis=1) / 32768
        seg = samples[int(start * sr) : int(end * sr)]
        if len(seg) == 0:
            return 1.0
        rms = float(np.sqrt(np.mean(seg ** 2))) or 1e-6
        peak = float(np.abs(seg).max()) or 1e-6
        target_rms = 0.105
        gain = min(target_rms / rms, 0.9 / peak)
        return max(0.8, min(gain, 5.0))
    except (OSError, wave.Error):
        return 1.0


def trim_and_normalize(path: Path) -> float:
    """裁剪首尾静音 + 轻压缩/EQ + loudnorm，返回头部裁剪偏移（秒）。

    任一步失败则保留原文件并返回 0.0，调用方据此决定词边界是否需要平移。
    """
    if not FFMPEG_BIN.exists():
        return 0.0
    wav = path.with_name(path.stem + ".tmp.wav")
    out = path.with_name(path.stem + ".norm.wav")
    try:
        decode = subprocess.run(
            [str(FFMPEG_BIN), "-y", "-v", "error", "-i", str(path), "-ac", "1", "-ar", "44100", "-f", "wav", str(wav)],
            capture_output=True,
            timeout=60,
        )
        if decode.returncode != 0:
            return 0.0
        bounds = _find_speech_bounds(wav)
        if bounds is None:
            return 0.0
        first, last = bounds
        start = max(0.0, first - HEAD_KEEP)
        end = last + TAIL_KEEP
        gain = _peak_safe_gain(wav, start, end)
        filt = (
            f"atrim=start={start:.3f}:end={end:.3f},"
            "highpass=f=75,"
            "acompressor=threshold=-20dB:ratio=2.5:attack=8:release=160,"
            "loudnorm=I=-13:TP=-1.0:LRA=11,"
            f"volume={gain:.3f}"
        )
        proc = None
        # 滤镜降级阶梯：Remotion 精简版 ffmpeg 缺 highpass/acompressor，
        # 逐级退到可用滤镜子集，保证任何构建下都能产出真 wav（否则 mp3 残留会炸掉时长解析）。
        for chain in (
            f"atrim=start={start:.3f}:end={end:.3f},"
            "highpass=f=75,"
            "acompressor=threshold=-20dB:ratio=2.5:attack=8:release=160,"
            "loudnorm=I=-13:TP=-1.0:LRA=11,"
            f"volume={gain:.3f}",
            f"atrim=start={start:.3f}:end={end:.3f},"
            "loudnorm=I=-13:TP=-1.0:LRA=11,"
            f"volume={gain:.3f}",
            f"atrim=start={start:.3f}:end={end:.3f},"
            f"volume={gain:.3f}",
        ):
            proc = subprocess.run(
                [
                    str(FFMPEG_BIN),
                    "-y",
                    "-v",
                    "error",
                    "-i",
                    str(path),
                    "-af",
                    chain,
                    "-ar",
                    "44100",
                    "-ac",
                    "1",
                    "-c:a",
                    "pcm_s16le",
                    str(out),
                ],
                capture_output=True,
                timeout=60,
            )
            if proc.returncode == 0 and out.exists() and out.stat().st_size > 0:
                break
        if proc and proc.returncode == 0 and out.exists() and out.stat().st_size > 0:
            os.replace(out, path)
            return start
        return 0.0
    except (OSError, subprocess.SubprocessError):
        return 0.0
    finally:
        wav.unlink(missing_ok=True)
        out.unlink(missing_ok=True)


def _voice_file_duration(path: Path) -> float:
    """读取配音文件时长（wav 直读，mp3 走 mutagen）；空/损坏给出可读错误。"""
    size = path.stat().st_size if path.exists() else 0
    if size == 0:
        raise RuntimeError(f"配音文件为空：{path.name}")
    try:
        if path.suffix.lower() == ".wav":
            with wave.open(str(path), "rb") as w:
                return w.getnframes() / float(w.getframerate())
        return MP3(str(path)).info.length
    except Exception as e:  # noqa: BLE001 — mutagen/ wave 的异常类型较多
        raise RuntimeError(f"配音文件无法解析（{path.name}，{size} 字节）：{e}") from e


async def _synth(
    text: str,
    out_path: Path,
    voice: str,
    rate: str,
    pitch: str,
    boundary: str | None = None,
) -> list[dict]:
    """单次合成：音频写入 out_path，返回 WordBoundary 事件（秒）。"""
    out_path.unlink(missing_ok=True)
    kwargs: dict = {"rate": rate, "pitch": pitch}
    if boundary:
        kwargs["boundary"] = boundary
    tts = edge_tts.Communicate(text, voice, **kwargs)
    bounds: list[dict] = []
    with open(out_path, "wb") as f:
        async for chunk in tts.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                bounds.append(
                    {
                        "start": chunk["offset"] / 1e7,
                        "dur": chunk["duration"] / 1e7,
                        "text": chunk.get("text", ""),
                    }
                )
    if not out_path.exists() or out_path.stat().st_size == 0:
        raise RuntimeError("TTS 未返回音频")
    return bounds


async def _synth_with_retry(
    text: str,
    out_path: Path,
    voice: str,
    rate: str,
    pitch: str,
    boundary: str | None = None,
) -> list[dict]:
    """带超时与退避重试的合成；失败时清理残留文件，避免留下 0 字节 mp3。"""
    last: Exception | None = None
    for attempt in range(1, TTS_RETRIES + 1):
        try:
            return await asyncio.wait_for(
                _synth(text, out_path, voice, rate, pitch, boundary),
                timeout=TTS_TIMEOUT_SECONDS,
            )
        except Exception as e:  # noqa: BLE001 — 网络/服务端异常都要重试
            last = e
            out_path.unlink(missing_ok=True)
            if attempt < TTS_RETRIES:
                print(
                    f"[voice] TTS 第 {attempt} 次失败（{type(e).__name__}: {e}），重试...",
                    flush=True,
                )
                await asyncio.sleep(TTS_RETRY_DELAY * attempt)
    raise RuntimeError(f"配音失败（连续 {TTS_RETRIES} 次）：{last}") from last


async def _gen_one(
    text: str, out_path: Path, voice: str, rate: str, pitch: str = "+0Hz"
) -> float:
    await _synth_with_retry(text, out_path, voice, rate, pitch)
    trim_and_normalize(out_path)
    return _voice_file_duration(out_path)


async def _synth_scene(
    text: str, out_path: Path, voice: str, rate: str, pitch: str
) -> list[dict]:
    """整场合成一段语音，返回 WordBoundary 事件（秒）。"""
    return await _synth_with_retry(
        text, out_path, voice, rate, pitch, boundary="WordBoundary"
    )


def _cut_segment(src: Path, dst: Path, start: float, end: float) -> None:
    proc = subprocess.run(
        [
            str(FFMPEG_BIN),
            "-y",
            "-v",
            "error",
            "-i",
            str(src),
            "-ss",
            f"{start:.3f}",
            "-t",
            f"{max(0.1, end - start):.3f}",
            "-ac",
            "1",
            "-ar",
            "44100",
            "-c:a",
            "pcm_s16le",
            str(dst),
        ],
        capture_output=True,
        timeout=60,
    )
    if proc.returncode != 0 or not dst.exists() or dst.stat().st_size == 0:
        raise RuntimeError(f"切句失败：{dst.name}")


async def _gen_scene(
    out_dir: Path,
    scene_no: int,
    lines: list[tuple[str, str]],
    voice: str,
    rate: str,
) -> dict[str, float]:
    """一场台词一次合成，再按词边界切回逐句文件。"""
    texts = [t for _, t in lines]
    joined = _join_scene_text(texts)
    if not joined:
        raise ValueError("空场景")
    scene_path = out_dir / f".scene_{scene_no:02d}.wav"
    try:
        bounds = await _synth_scene(
            joined, scene_path, voice, rate, _scene_pitch(joined)
        )
        shift = trim_and_normalize(scene_path)
        spans = _line_spans(texts, bounds)
        if spans is None:
            raise ValueError("词边界无法对齐")
        scene_dur = _voice_file_duration(scene_path)
        durations: dict[str, float] = {}
        for (lid, text), (a, b) in zip(lines, spans):
            start = max(0.0, a - shift - SEG_LEAD)
            end = min(scene_dur, b - shift + TAIL_KEEP)
            if end - start < 0.25:
                raise ValueError("切句过短")
            seg = out_dir / f"{lid}.wav"
            _cut_segment(scene_path, seg, start, end)
            durations[lid] = round(_voice_file_duration(seg), 3)
            print(f"[voice] {lid}: {durations[lid]:.2f}s  {text}", flush=True)
        return durations
    finally:
        scene_path.unlink(missing_ok=True)


async def _gen_scene_with_fallback(
    out_dir: Path,
    scene_no: int,
    lines: list[tuple[str, str]],
    voice: str,
    rate: str,
) -> dict[str, float]:
    try:
        return await _gen_scene(out_dir, scene_no, lines, voice, rate)
    except Exception as e:  # noqa: BLE001 — 整场合成失败不影响出片
        print(f"[voice] 场景 {scene_no + 1} 整场合成失败，回退逐句：{e}", flush=True)
        durations: dict[str, float] = {}
        for lid, text in lines:
            out_path = out_dir / f"{lid}.wav"
            dur = await _gen_one(text, out_path, voice, rate, _scene_pitch(text))
            durations[lid] = round(dur, 3)
            print(f"[voice] {lid}: {dur:.2f}s  {text}", flush=True)
        return durations


async def generate_for_script(
    project_id: str,
    shots,
    voice: str = TTS_VOICE,
    rate: str = TTS_RATE,
) -> dict[str, float]:
    """按场景整段合成配音，返回 {line_id: 实测秒数}。"""
    out_dir = _voice_dir(project_id)
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    durations: dict[str, float] = {}
    for si, shot in enumerate(shots):
        lines = [(f"s{si + 1:02d}_{li}", line.text) for li, line in enumerate(shot.lines)]
        if not lines:
            continue
        if len(lines) == 1:
            lid, text = lines[0]
            dur = await _gen_one(text, out_dir / f"{lid}.wav", voice, rate, _scene_pitch(text))
            durations[lid] = round(dur, 3)
            print(f"[voice] {lid}: {dur:.2f}s  {text}", flush=True)
            continue
        durations.update(await _gen_scene_with_fallback(out_dir, si, lines, voice, rate))
    return durations


def generate_script_voices(
    project_id: str, shots, voice: str = TTS_VOICE, rate: str = TTS_RATE
) -> dict[str, float]:
    """同步包装，供后台任务线程调用。"""
    return asyncio.run(generate_for_script(project_id, shots, voice, rate))


def sample_voice(voice: str) -> Path:
    """生成（并缓存）某音色的试听样本，供前端试听。"""
    out_dir = STORAGE_DIR / "tts_samples"
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"{voice}.mp3"
    if not path.exists() or path.stat().st_size == 0:
        asyncio.run(_gen_one(SAMPLE_TEXT, path, voice, SAMPLE_RATE))
    return path


async def generate_voices(
    project_id: str,
    texts: list[str],
    voice: str = TTS_VOICE,
    rate: str = TTS_RATE,
) -> dict[str, float]:
    """texts 的下标 (shot_idx, line_idx) 由调用方通过 line_id 约定对齐。

    返回 {line_id: 实测秒数}。逐句串行生成（对 edge 服务更友好）。
    """
    out_dir = _voice_dir(project_id)
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    durations: dict[str, float] = {}
    for lid, text in texts:
        out_path = out_dir / f"{lid}.wav"
        dur = await _gen_one(text, out_path, voice, rate)
        durations[lid] = round(dur, 3)
        print(f"[voice] {lid}: {dur:.2f}s  {text}", flush=True)
    return durations


def run_generate(
    project_id: str,
    pairs: list[tuple[str, str]],
    voice: str = TTS_VOICE,
    rate: str = TTS_RATE,
) -> dict[str, float]:
    """同步包装，供后台任务线程调用。"""
    return asyncio.run(generate_voices(project_id, pairs, voice, rate))


def build_line_list(script_shots) -> list[tuple[str, str]]:
    """(line_id, text) 列表，供 generate_voices 使用。"""
    pairs = []
    for si, shot in enumerate(script_shots):
        for li, line in enumerate(shot.lines):
            pairs.append((line_id(si, li), line.text))
    return pairs


# ---------- 整轨预混：绕过合成器对嵌套 Sequence 音频的错位 bug ----------
#
# 实测（无 BGM 渲染逐窗包络）：逐句 <Sequence from=..><Audio/></Sequence>
# 会被合成器切成约 1.5s 周期的碎片、段间掉声音（表现为"一句话一半没声音"），
# 而根级整段 Audio（BGM / narrationAudio 同路径）始终完好。
# 因此渲染前按 DataVideo.buildTimeline 的精确时间轴把全部句子混成一条音轨，
# 经 narrationAudio（根级 Audio）播放；混音失败时回退逐句路径。

_TRACK_FPS = 30
_TRACK_LEAD = 0.45
_TRACK_TAIL = 0.4
_TRACK_GAP = 0.22
_TRACK_PAUSE_BONUS = 0.12
_TRACK_INTRO_FRAMES = 48  # 与 timeline.ts INTRO_FRAMES 同步（原 66 已过期）
_TRACK_OVERLAP = {"whip": 11, "zoom": 13, "flash": 7, "cut": 3, "glitch": 10, "slide": 12, "dissolve": 16}
_TRACK_SR = 44100


def _track_snap(t: float, beats: list[float], tol: float = 0.35) -> float:
    if not beats:
        return t
    best, bd = t, 1e9
    for b in beats:
        if abs(b - t) < bd:
            bd, best = abs(b - t), b
    return best if bd <= tol else t


def _track_decode(path: Path) -> np.ndarray:
    """解码任意音频为 44.1k mono float64（-1..1）。

    捆绑版 ffmpeg 不带 s16le 裸流 muxer，落到临时 wav 再读。
    """
    tmp = path.with_suffix(".dec.wav")
    proc = subprocess.run(
        [str(FFMPEG_BIN), "-y", "-v", "error", "-i", str(path), "-ac", "1", "-ar",
         str(_TRACK_SR), str(tmp)],
        capture_output=True, timeout=60,
    )
    if proc.returncode != 0 or not tmp.exists():
        raise RuntimeError(f"解码失败 {path.name}: {proc.stderr[:120]!r}")
    with wave.open(str(tmp), "rb") as w:
        raw = w.readframes(w.getnframes())
    tmp.unlink(missing_ok=True)
    return np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768.0


def mix_line_track(project_id: str, props: dict) -> dict:
    """按渲染时间轴预混逐句配音为单轨 track.wav。

    props 为 RenderProps 的 dict（field-name 键）。返回
    {"src": "voice/projects/<pid>/track.wav", "schedule": [{line, at, dur}, ...]}。
    """
    beats = list(((props.get("bgm") or {}).get("beats") or [])[:400])
    intro_frames = 0 if props.get("title_card") is False else _TRACK_INTRO_FRAMES
    # 无片头卡（title_card=False）时不留 2s 空白：整轨从 0 开始，首句直接进。
    offset = 0.0 if intro_frames == 0 else _track_snap(
        max(2.0, max(0.0, (intro_frames - 15) / _TRACK_FPS)), beats, 0.45
    )

    # 逐场布局（与 DataVideo.buildLayout 一致）
    scenes: list[dict] = []
    cursor = 0.0
    for sh in props.get("shots") or []:
        lines = sh.get("lines") or []
        t = _TRACK_LEAD
        items = []
        for li, l in enumerate(lines):
            dur = max(0.3, float(l.get("duration_sec") or 1.5))
            is_last = li == len(lines) - 1
            pa = l.get("pause_after")
            pause = 0.0 if is_last else (float(pa) if pa is not None else _TRACK_GAP) + _TRACK_PAUSE_BONUS
            items.append({"start": t, "dur": dur, "audio": l.get("audio"), "id": l.get("id")})
            t += dur + pause
        dur_s = t + (sh.get("tail") or _TRACK_TAIL)
        scenes.append({"start": cursor, "dur_s": dur_s, "lines": items,
                       "enter": sh.get("enter_transition") or "dissolve"})
        cursor += dur_s

    # 场景起点：节拍吸附 + 不许侵入上一镜内容（与 buildTimeline 完全一致）
    starts = [0.0]
    for i in range(1, len(scenes)):
        ov = _TRACK_OVERLAP.get(scenes[i]["enter"], 16) / _TRACK_FPS
        guard = starts[i - 1] + scenes[i - 1]["dur_s"] - ov + 0.3
        raw = max(scenes[i]["start"], guard, starts[i - 1] + 0.6)
        snapped = _track_snap(raw, beats)
        if snapped < guard:
            later = next((b for b in beats if b >= guard), None)
            snapped = later if later is not None else raw
        starts.append(snapped)

    # 轨长必须按“吸附后的最后一镜起点”算（与 timeline.ts 的 offset+body+1.0 一致）。
    # 用 Σ(dur_s) 会漏掉切镜节拍吸附累计出的间隔，最后一句配音会被缓冲区截断。
    body_end = starts[-1] + scenes[-1]["dur_s"] if scenes else 0.0
    total_s = offset + body_end + 1.0
    buf = np.zeros(int(total_s * _TRACK_SR) + _TRACK_SR, dtype=np.float64)
    vdir = _voice_dir(project_id)
    schedule = []
    for i, sc in enumerate(scenes):
        for ln in sc["lines"]:
            rel = ln.get("audio")
            if not rel:
                continue
            src = REMOTION_PUBLIC / rel
            if not src.exists():
                continue
            y = _track_decode(src)
            at = offset + starts[i] + ln["start"]
            a = int(at * _TRACK_SR)
            seg = y[: max(0, len(buf) - a)]
            # 3ms 淡入去爆音
            fade = min(128, len(seg))
            seg = seg.copy()
            seg[:fade] *= np.linspace(0.0, 1.0, fade)
            buf[a : a + len(seg)] += seg
            schedule.append({"line": ln.get("id"), "at": round(at, 3), "dur": round(len(y) / _TRACK_SR, 3)})

    if not schedule:
        raise RuntimeError("没有可用的逐句配音文件（整轨预混需要至少一句真实音频）")

    peak = float(np.max(np.abs(buf))) if len(buf) else 0.0
    if peak > 0.99:
        buf *= 0.99 / peak
    out_dir = vdir
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / "track.wav"
    with wave.open(str(out), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(_TRACK_SR)
        w.writeframes((buf * 32767).astype(np.int16).tobytes())
    return {"src": f"{VOICE_PUBLIC_SUBDIR}/{project_id}/track.wav", "schedule": schedule}


def apply_mixed_track(project_id: str, props):
    """渲染前把逐句配音混成整轨并经 narrationAudio 播放（清空逐句 audio）。

    混音失败时原样返回（逐句 Sequence 路径兜底，宁可错位也不没声音）。
    """
    try:
        from ..schemas import RenderProps

        d = json.loads(props.model_dump_json())
        track = mix_line_track(project_id, d)
        d["narration_audio"] = {"src": track["src"], "volume": 1.0}
        for sh in d.get("shots") or []:
            for l in sh.get("lines") or []:
                l["audio"] = None
        return RenderProps.model_validate(d)
    except Exception as e:  # noqa: BLE001 — 混音失败不阻断渲染
        print(f"[voice] 整轨预混失败，回退逐句音频: {e}", flush=True)
        return props


# MotionShow 的时间轴与 DataVideo 不同（无片头、句间 0.35s、镜尾 0.6s、最短 2.4s），
# 不能复用 mix_line_track，否则人声会整体漂移。这里按 MotionShow 的
# shotDurationInFrames 逐帧复刻，保证根级整轨与画面严格同步。
_MOTION_FPS = 30
_MOTION_GAP_FRAMES = 11  # Math.round(0.35 * 30)
_MOTION_TAIL_FRAMES = 18  # Math.round(0.6 * 30)
_MOTION_MIN_SHOT_FRAMES = 72  # 2.4s


def mix_motion_track(project_id: str, props: dict) -> dict:
    """按 MotionShow 时间轴预混逐句配音为单轨（返回 src 与逐句落点）。"""
    placements: list[tuple[int, np.ndarray]] = []
    schedule: list[dict] = []
    cursor = 0
    for sh in props.get("shots") or []:
        line_off = 0
        for ln in sh.get("lines") or []:
            dur = max(0.3, float(ln.get("duration_sec") or 1.4))
            rel = ln.get("audio")
            if rel:
                src = REMOTION_PUBLIC / rel
                if src.exists():
                    y = _track_decode(src)
                    at = int(round((cursor + line_off) * _TRACK_SR / _MOTION_FPS))
                    placements.append((at, y))
                    schedule.append(
                        {
                            "line": ln.get("id"),
                            "at": round((cursor + line_off) / _MOTION_FPS, 3),
                            "dur": round(len(y) / _TRACK_SR, 3),
                        }
                    )
            line_off += max(1, int(round(dur * _MOTION_FPS))) + _MOTION_GAP_FRAMES
        wanted = int(round(float(sh.get("duration_sec") or 0) * _MOTION_FPS))
        cursor += max(_MOTION_MIN_SHOT_FRAMES, line_off + _MOTION_TAIL_FRAMES, wanted)
    if not placements:
        raise RuntimeError("没有可用的逐句配音文件（MotionShow 整轨预混需要至少一句真实音频）")

    total_samples = int(round(cursor * _TRACK_SR / _MOTION_FPS)) + _TRACK_SR
    buf = np.zeros(total_samples, dtype=np.float64)
    for at, y in placements:
        seg = y[: max(0, len(buf) - at)]
        fade = min(128, len(seg))
        seg = seg.copy()
        if fade:
            seg[:fade] *= np.linspace(0.0, 1.0, fade)
        buf[at : at + len(seg)] += seg
    peak = float(np.max(np.abs(buf))) if len(buf) else 0.0
    if peak > 0.99:
        buf *= 0.99 / peak

    out_dir = _voice_dir(project_id)
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / "motion_track.wav"
    with wave.open(str(out), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(_TRACK_SR)
        w.writeframes((buf * 32767).astype(np.int16).tobytes())
    return {"src": f"{VOICE_PUBLIC_SUBDIR}/{project_id}/motion_track.wav", "schedule": schedule}


def apply_motion_track(project_id: str, props):
    """MotionShow 专用：整轨经 narrationAudio 播放（清空逐句 audio）。"""
    try:
        from ..schemas import RenderProps

        d = json.loads(props.model_dump_json())
        track = mix_motion_track(project_id, d)
        d["narration_audio"] = {"src": track["src"], "volume": 1.0}
        for sh in d.get("shots") or []:
            for l in sh.get("lines") or []:
                l["audio"] = None
        return RenderProps.model_validate(d)
    except Exception as e:  # noqa: BLE001 — 混音失败不阻断渲染
        print(f"[voice] MotionShow 整轨预混失败，回退逐句音频: {e}", flush=True)
        return props
