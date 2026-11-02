# -*- coding: utf-8 -*-
"""六步流程测试：门禁顺序、文案清洗、配音三模式时长、组装参数、渲染命令、整轨预混。"""
import json
import wave

import numpy as np
import pytest

from app.schemas import RenderProps, ScriptDraft
from app.services import flow, renderer, voice
from app.services.pipeline import text_durations, text_line_duration

SCRIPT = ScriptDraft.model_validate(
    {
        "title": "测试视频",
        "shots": [
            {"year": "2026", "label": "开", "lines": [{"text": "第一句话"}]},
            {"year": "2027", "label": "合", "lines": [{"text": "第二句话"}, {"text": "第三句话"}]},
        ],
    }
)


@pytest.fixture
def flow_env(tmp_path, monkeypatch):
    monkeypatch.setattr(flow, "PROJECTS_DIR", tmp_path / "projects")
    monkeypatch.setattr(flow, "RENDERS_DIR", tmp_path / "renders")
    (tmp_path / "projects" / "p1").mkdir(parents=True)
    (tmp_path / "projects" / "p1" / "script.json").write_text(
        SCRIPT.model_dump_json(indent=1), encoding="utf-8"
    )
    return tmp_path


def _write_flow(tmp_path, data):
    (tmp_path / "projects" / "p1" / "flow.json").write_text(
        json.dumps(data, ensure_ascii=False), encoding="utf-8"
    )


def _read_flow(tmp_path):
    return json.loads((tmp_path / "projects" / "p1" / "flow.json").read_text(encoding="utf-8"))


# ---------- 门禁 ----------

def test_approve_gate_advances_step(flow_env):
    f = flow.approve_gate("p1", "research")
    assert f["gates"]["research"] is True and f["step"] >= 2
    flow.require_gate("p1", "research")  # 已确认，不再抛错


def test_require_gate_blocks_unapproved(flow_env):
    _write_flow(flow_env, {"gates": {}, "step": 1})
    with pytest.raises(RuntimeError, match="尚未确认"):
        flow.require_gate("p1", "copy")


def test_unknown_gate_rejected(flow_env):
    with pytest.raises(RuntimeError, match="未知确认门"):
        flow.approve_gate("p1", "nope")


def test_set_audio_mode_validates(flow_env):
    with pytest.raises(RuntimeError, match="配音方式"):
        flow.set_audio_mode("p1", "aria")
    f = flow.set_audio_mode("p1", "custom")
    assert f["audio_mode"] == "custom"


# ---------- 行清洗 ----------

def test_split_line_short_kept():
    assert flow._split_line("短句") == ["短句"]


def test_split_line_long_punctuation_three_parts():
    text = "给别人改一份定制简历要半小时，这个AI只要三分钟，但是用不好等于白装"
    parts = flow._split_line(text)
    assert len(parts) >= 3
    assert all(len(p) <= 24 for p in parts)
    assert "".join(parts).replace(" ", "").startswith("给别人")


def test_split_line_no_punctuation_hard_split():
    parts = flow._split_line("这是一段完全没有任何标点的超长台词需要硬切" * 2)
    assert all(len(p) <= 20 for p in parts)


# ---------- 无配音时长 ----------

def test_text_line_duration_floor():
    assert text_line_duration("短") == 1.4


def test_text_line_duration_scales():
    assert text_line_duration("十" * 36) == pytest.approx(10.35, abs=0.01)


def test_text_durations_covers_all_lines():
    out = text_durations(SCRIPT)
    assert set(out) == {"s01_0", "s02_0", "s02_1"}
    assert all(v >= 1.4 for v in out.values())


# ---------- 审查清洗 ----------

def test_clean_review_normalizes_and_blocks_high():
    raw = {
        "passed": True,
        "summary": "ok",
        "off_topic": ["偏题点", 123, None],
        "issues": [
            {"severity": "high", "where": "第1幕", "problem": "事实无出处", "suggestion": "删"},
            {"severity": "离谱", "where": "第2幕", "problem": "口语化不足", "suggestion": "改"},
            "垃圾项",
        ],
    }
    out = flow._clean_review(raw)
    assert out["passed"] is False  # high 问题一票否决
    assert [i["severity"] for i in out["issues"]] == ["high", "medium"]
    assert out["off_topic"] == ["偏题点"]


# ---------- 渲染命令 ----------

def test_render_video_frames_flag(tmp_path, monkeypatch):
    captured = {}

    def fake_run(cmd, **kw):
        captured["cmd"] = cmd

        class R:
            returncode = 0

        return R()

    monkeypatch.setattr(renderer.subprocess, "run", fake_run)
    rc = renderer.render_video(tmp_path / "p.json", tmp_path / "o.mp4", tmp_path / "l.log", frames=(0, 299))
    assert rc == 0
    assert "--frames=0-299" in captured["cmd"]
    assert "DataVideo" in captured["cmd"]


def test_render_video_composition_kwarg(tmp_path, monkeypatch):
    captured = {}

    def fake_run(cmd, **kw):
        captured["cmd"] = cmd

        class R:
            returncode = 0

        return R()

    monkeypatch.setattr(renderer.subprocess, "run", fake_run)
    from app.config import composition_for

    renderer.render_video(tmp_path / "p.json", tmp_path / "o.mp4", tmp_path / "l.log", composition=composition_for("motionshow"))
    assert "MotionShow" in captured["cmd"]


def test_safe_composition_rejects_injection():
    assert renderer._safe_composition("DataVideo; rm -rf") == "DataVideormrf"
    assert renderer._safe_composition(None) == "DataVideo"


# ---------- run_render 编排 ----------

class _Settings:
    template = "datavideo"
    voice = "zh-CN-YunxiNeural"
    tts_rate = "+0%"


@pytest.fixture
def render_env(flow_env, monkeypatch):
    _write_flow(flow_env, {"gates": {}, "step": 6, "audio_mode": "tts"})
    monkeypatch.setattr(flow, "_load_script", lambda pid: SCRIPT)
    monkeypatch.setattr(flow, "_load_settings", lambda pid: _Settings())
    monkeypatch.setattr(flow, "load_flow", lambda pid: {"gates": {}, "audio_mode": "tts"})
    monkeypatch.setattr(flow, "_build_bgm", lambda pid: None)
    monkeypatch.setattr(flow, "image_rels_for", lambda pid, n: [None] * n)
    monkeypatch.setattr(flow.director, "load_cached_plan", lambda pid: None)
    calls = {"mix": 0}

    def fake_mix(pid, props):
        calls["mix"] += 1
        return props

    monkeypatch.setattr(flow.voice, "apply_mixed_track", fake_mix)
    rendered = {}

    def fake_render_video(props_path, out_path, log_path, frames=None, composition=None):
        rendered["frames"] = frames
        rendered["out"] = out_path.name
        rendered["composition"] = composition
        out_path.write_bytes(b"0")
        return 0

    monkeypatch.setattr(flow.renderer, "render_video", fake_render_video)
    return rendered, calls


def test_run_render_full_uses_mixer_and_no_frames(render_env, monkeypatch):
    rendered, calls = render_env
    monkeypatch.setattr(
        flow.voice,
        "generate_script_voices",
        lambda pid, shots, voice=None, rate=None: {
            f"s{i+1:02d}_{j}": 1.5 for i, s in enumerate(shots) for j in range(len(s.lines))
        },
    )
    flow.run_render("p1", "full", lambda **kw: None)
    assert rendered["out"] == "final.mp4"
    assert rendered["frames"] is None
    assert rendered["composition"] == "DataVideo"
    assert calls["mix"] == 1  # TTS 模式渲染前必走整轨预混


def test_run_render_none_mode_uses_text_durations(render_env, monkeypatch):
    rendered, calls = render_env
    monkeypatch.setattr(flow, "load_flow", lambda pid: {"gates": {}, "audio_mode": "none"})

    def no_tts(*a, **kw):
        raise AssertionError("none 模式不应触发 TTS")

    monkeypatch.setattr(flow.voice, "generate_script_voices", no_tts)
    flow.run_render("p1", "full", lambda **kw: None)
    assert rendered["out"] == "final.mp4"
    assert calls["mix"] == 0  # 无配音：不预混


def test_run_render_preview_sets_frame_range(render_env, monkeypatch):
    rendered, _ = render_env
    monkeypatch.setattr(
        flow.voice,
        "generate_script_voices",
        lambda pid, shots, voice=None, rate=None: {
            f"s{i+1:02d}_{j}": 1.5 for i, s in enumerate(shots) for j in range(len(s.lines))
        },
    )
    flow.run_render("p1", "preview", lambda **kw: None)
    assert rendered["out"] == "preview.mp4"
    assert rendered["frames"] is not None and rendered["frames"][0] == 0


def test_run_render_rejects_unknown_mode(flow_env):
    with pytest.raises(RuntimeError, match="未知渲染模式"):
        flow.run_render("p1", "movie", lambda **kw: None)


# ---------- 整轨预混（新音频管线） ----------

@pytest.fixture
def track_env(tmp_path, monkeypatch):
    """真实 wav 句文件的混音环境。"""
    vdir = tmp_path / "public" / "voice" / "projects" / "p1"
    vdir.mkdir(parents=True)
    monkeypatch.setattr(voice, "REMOTION_PUBLIC", tmp_path / "public")

    def make_wav(name, dur, freq=440.0):
        sr = 44100
        t = np.linspace(0, dur, int(sr * dur), endpoint=False)
        data = (np.sin(2 * np.pi * freq * t) * 32000).astype(np.int16)
        with wave.open(str(vdir / name), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(sr)
            w.writeframes(data.tobytes())

    make_wav("s01_0.wav", 1.0, 440)
    make_wav("s01_1.wav", 0.8, 660)
    return vdir


def _props_dict(beats=None):
    return {
        "title": "t",
        "title_card": True,
        "bgm": {"src": "bgm/BARRETE.mp3", "volume": 0.3, "beats": beats or []},
        "shots": [
            {
                "enter_transition": "dissolve",
                "tail": 0.6,
                "lines": [
                    {"id": "s01_0", "text": "a", "duration_sec": 1.0, "pause_after": 0.4,
                     "audio": "voice/projects/p1/s01_0.wav"},
                    {"id": "s01_1", "text": "b", "duration_sec": 0.8, "pause_after": None,
                     "audio": "voice/projects/p1/s01_1.wav"},
                ],
            }
        ],
    }


def test_mix_line_track_schedule_and_file(track_env):
    out = voice.mix_line_track("p1", _props_dict())
    assert out["src"] == "voice/projects/p1/track.wav"
    assert (track_env / "track.wav").exists()
    # 无节拍：offset=2.0（片头兜底）+ LEAD 0.9 → 第一句 2.9s；第二句 = 2.9+1.0+0.85 = 4.75
    at = {s["line"]: s["at"] for s in out["schedule"]}
    assert at["s01_0"] == pytest.approx(2.9, abs=0.01)
    assert at["s01_1"] == pytest.approx(4.75, abs=0.01)


def test_mix_line_track_snaps_to_beats(track_env):
    """节拍吸附作用于场景起点：第二幕布局起点 2.5s 吸附到 2.8s（差 0.3 内）。"""
    props = {
        "title": "t",
        "title_card": True,
        "bgm": {"src": "bgm/x.mp3", "volume": 0.3, "beats": [2.8]},
        "shots": [
            {"enter_transition": "dissolve", "tail": 0.6,
             "lines": [{"id": "s01_0", "text": "a", "duration_sec": 1.0, "pause_after": None,
                        "audio": "voice/projects/p1/s01_0.wav"}]},
            {"enter_transition": "dissolve", "tail": 0.6,
             "lines": [{"id": "s02_0", "text": "b", "duration_sec": 0.8, "pause_after": None,
                        "audio": "voice/projects/p1/s01_1.wav"}]},
        ],
    }
    out = voice.mix_line_track("p1", props)
    at = {s["line"]: s["at"] for s in out["schedule"]}
    assert at["s01_0"] == pytest.approx(2.9, abs=0.01)
    # 布局起点 0.9+1.0+0.6=2.5 → 吸附到节拍 2.8；clamp(earliest=2.5-0.53+0.3=2.27) 不再抬高
    assert at["s02_0"] == pytest.approx(2.0 + 2.8 + 0.9, abs=0.01)


def test_mix_line_track_no_leading_silence_hole(track_env):
    """回归：混出的整轨里第一句必须是连续语音（历史 bug：1.5s 周期碎片）。"""
    voice.mix_line_track("p1", _props_dict())
    with wave.open(str(track_env / "track.wav"), "rb") as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768.0
    sr = 44100
    win = int(0.05 * sr)
    env = [float(np.sqrt(np.mean((x[i:i+win] ** 2)))) for i in range(0, len(x) - win, win)]
    # 第一句窗口 2.9s-3.9s（1.0s 文件）：内部不允许出现 >0.3s 的静音洞
    seg = env[int(3.0 / 0.05):int(3.9 / 0.05)]
    run = longest = 0
    for v in seg:
        run = run + 1 if v < 0.01 else 0
        longest = max(longest, run)
    assert longest * 0.05 < 0.3, "句内出现长静音洞 = 碎片化回归"


def test_apply_mixed_track_sets_narration_and_strips_lines(track_env):
    props = RenderProps.model_validate(
        {
            "title": "t",
            "title_card": True,
            "bgm": {"src": "bgm/x.mp3", "volume": 0.3},
            "shots": [
                {
                    "lines": [
                        {"id": "s01_0", "text": "a", "duration_sec": 1.0,
                         "audio": "voice/projects/p1/s01_0.wav"},
                    ]
                }
            ],
        }
    )
    out = voice.apply_mixed_track("p1", props)
    assert out.narration_audio is not None and out.narration_audio.src.endswith("track.wav")
    assert all(l.audio is None for sh in out.shots for l in sh.lines)
    js = json.loads(out.to_props_json())
    assert js["narrationAudio"]["src"].endswith("track.wav")  # camelCase 落到 Remotion
    assert all("audio" not in l or l.get("audio") is None for sh in js["shots"] for l in sh["lines"])


def test_apply_mixed_track_falls_back_on_failure(track_env, monkeypatch):
    props = RenderProps.model_validate(
        {"title": "t", "shots": [{"lines": [{"id": "s01_0", "text": "a", "duration_sec": 1.0,
                                             "audio": "voice/projects/p1/missing.wav"}]}]}
    )
    out = voice.apply_mixed_track("p1", props)  # 源文件缺失 → 混音失败 → 原样返回
    assert out.narration_audio is None
    assert out.shots[0].lines[0].audio == "voice/projects/p1/missing.wav"
