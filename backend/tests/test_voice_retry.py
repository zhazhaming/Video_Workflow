# -*- coding: utf-8 -*-
"""配音重试策略测试：瞬时失败要重试，彻底失败要清理残留文件并给出可读错误。"""
import asyncio
import time

import pytest

from app.services import voice


def test_synth_with_retry_succeeds_after_transient(monkeypatch, tmp_path):
    calls = {"n": 0}

    async def fake_synth(text, out_path, name, rate, pitch, boundary=None):
        calls["n"] += 1
        if calls["n"] == 1:
            raise RuntimeError("connection reset")
        out_path.write_bytes(b"ok")
        return []

    monkeypatch.setattr(voice, "_synth", fake_synth)
    monkeypatch.setattr(voice, "TTS_RETRIES", 3)
    monkeypatch.setattr(voice, "TTS_RETRY_DELAY", 0)

    out = tmp_path / "a.mp3"
    bounds = asyncio.run(voice._synth_with_retry("台词", out, "v", "+0%", "+0Hz"))
    assert bounds == []
    assert calls["n"] == 2
    assert out.read_bytes() == b"ok"


def test_synth_with_retry_cleans_empty_file(monkeypatch, tmp_path):
    async def fake_synth(text, out_path, name, rate, pitch, boundary=None):
        out_path.write_bytes(b"")  # edge-tts 写出 0 字节后失败
        raise RuntimeError("TTS 未返回音频")

    monkeypatch.setattr(voice, "_synth", fake_synth)
    monkeypatch.setattr(voice, "TTS_RETRIES", 2)
    monkeypatch.setattr(voice, "TTS_RETRY_DELAY", 0)

    out = tmp_path / "b.mp3"
    with pytest.raises(RuntimeError, match="连续 2 次"):
        asyncio.run(voice._synth_with_retry("台词", out, "v", "+0%", "+0Hz"))
    assert not out.exists()


def test_synth_with_retry_times_out(monkeypatch, tmp_path):
    async def fake_synth(text, out_path, name, rate, pitch, boundary=None):
        await asyncio.sleep(10)  # 模拟卡住不返回

    monkeypatch.setattr(voice, "_synth", fake_synth)
    monkeypatch.setattr(voice, "TTS_RETRIES", 1)
    monkeypatch.setattr(voice, "TTS_TIMEOUT_SECONDS", 0.05)

    start = time.monotonic()
    with pytest.raises(RuntimeError, match="配音失败"):
        asyncio.run(voice._synth_with_retry("台词", tmp_path / "c.mp3", "v", "+0%", "+0Hz"))
    assert time.monotonic() - start < 2


def test_voice_file_duration_rejects_empty_file(tmp_path):
    empty = tmp_path / "empty.wav"
    empty.write_bytes(b"")
    with pytest.raises(RuntimeError, match="配音文件为空"):
        voice._voice_file_duration(empty)
