# -*- coding: utf-8 -*-
"""节拍检测测试：合成 120 BPM 点击音轨，验证 BPM 与节拍间隔。"""
import numpy as np

from app.services.beat import _detect

SR = 44100


def synth_clicks(bpm: float = 120.0, seconds: float = 12.0) -> np.ndarray:
    n = int(SR * seconds)
    y = np.zeros(n, dtype=np.float32)
    interval = 60.0 / bpm
    t = 0.0
    click_len = int(0.05 * SR)
    env = np.exp(-np.arange(click_len) / (0.01 * SR))
    tone = np.sin(2 * np.pi * 1000 * np.arange(click_len) / SR)
    while t < seconds:
        idx = int(t * SR)
        seg = (env * tone * 0.8)[: n - idx]
        y[idx : idx + len(seg)] += seg
        t += interval
    return y


def test_detect_120_bpm():
    y = synth_clicks(120.0, 12.0)
    bpm, beats = _detect(y, SR)
    assert 112 <= bpm <= 128, f"检测到 {bpm} BPM"
    assert len(beats) >= 10
    intervals = np.diff(beats)
    assert np.allclose(intervals, 0.5, atol=0.03), intervals[:5]


def test_detect_80_bpm():
    y = synth_clicks(80.0, 12.0)
    bpm, beats = _detect(y, SR)
    assert 74 <= bpm <= 86, f"检测到 {bpm} BPM"
    intervals = np.diff(beats)
    assert np.allclose(intervals, 0.75, atol=0.04), intervals[:5]


def test_silence_returns_empty():
    bpm, beats = _detect(np.zeros(SR * 3, dtype=np.float32), SR)
    assert bpm == 0.0
    assert beats == []
