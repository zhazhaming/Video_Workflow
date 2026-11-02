# -*- coding: utf-8 -*-
"""BGM 曲库服务测试：命名清洗/去重、元数据、曲库清单、导入转码（含视频抽轨）。"""
import subprocess

import pytest

from app.config import FFMPEG_BIN
from app.services import beat, bgm


@pytest.fixture
def bgm_env(monkeypatch, tmp_path):
    """把曲库目录、元数据、节拍缓存全部指到 tmp，避免污染真实环境。"""
    monkeypatch.setattr(bgm, "BGM_DIR", tmp_path / "bgm")
    monkeypatch.setattr(bgm, "META_PATH", tmp_path / "bgm_library.json")
    monkeypatch.setattr(bgm, "BEATS_CACHE_PATH", tmp_path / "bgm_meta.json")
    monkeypatch.setattr(beat, "CACHE_PATH", tmp_path / "bgm_meta.json")
    return tmp_path


def test_sanitize_name():
    assert bgm._sanitize_name("my song") == "my_song"
    assert bgm._sanitize_name('bad/name:*?"<>|') == "badname"
    assert bgm._sanitize_name("   ") == "bgm"


def test_unique_name(bgm_env):
    d = bgm.BGM_DIR
    d.mkdir(parents=True)
    (d / "ref.mp3").write_bytes(b"x")
    (d / "ref_2.mp3").write_bytes(b"x")
    assert bgm._unique_name("ref") == "ref_3"
    assert bgm._unique_name("other") == "other"


def test_meta_and_list_tracks(bgm_env):
    d = bgm.BGM_DIR
    d.mkdir(parents=True)
    (d / "warm.mp3").write_bytes(b"x")  # 假 mp3：时长 0、不影响清单结构
    (d / "cover.png").write_bytes(b"x")  # 非音频应被忽略
    bgm.BEATS_CACHE_PATH.write_text('{"warm.mp3": {"mtime": 1, "bpm": 120.0, "beats": []}}', encoding="utf-8")

    bgm.save_meta("warm", title="温暖钢琴", tags=["calm"])
    tracks = bgm.list_tracks()
    assert len(tracks) == 1
    t = tracks[0]
    assert t["name"] == "warm"
    assert t["file"] == "bgm/warm.mp3"
    assert t["title"] == "温暖钢琴"
    assert t["tags"] == ["calm"]
    assert t["bpm"] == 120.0


def _make_sine_wav(path, seconds=3.0):
    """用自带 ffmpeg 的 sine 滤镜生成测试音频。"""
    assert FFMPEG_BIN.exists(), "测试需要 Remotion 自带 ffmpeg"
    subprocess.run(
        [
            str(FFMPEG_BIN), "-v", "error", "-y",
            "-f", "lavfi", "-i", f"sine=frequency=440:duration={seconds}",
            "-ac", "1", "-ar", "22050", str(path),
        ],
        check=True, capture_output=True,
    )


@pytest.mark.skipif(not FFMPEG_BIN.exists(), reason="需要 ffmpeg")
def test_import_track_audio(bgm_env):
    src_dir = bgm_env / "src"
    src_dir.mkdir()
    src = src_dir / "My Song.wav"
    _make_sine_wav(src, 3.0)

    track = bgm.import_track(src, title="测试曲", tags=["t1"])
    assert track["name"] == "My_Song"
    out = bgm.BGM_DIR / "My_Song.mp3"
    assert out.exists() and out.stat().st_size > 0
    assert 2.5 <= track["duration"] <= 3.5  # loudnorm 转码后时长近似保留
    assert track["title"] == "测试曲"

    # 元数据落库 + 节拍缓存预热（写入的是 beat.py 的缓存文件）
    meta = bgm._load_meta_all()
    assert meta["My_Song"]["title"] == "测试曲"
    assert beat.CACHE_PATH.exists()

    # 同名再导入 → 自动去重
    track2 = bgm.import_track(src)
    assert track2["name"] == "My_Song_2"
    assert (bgm.BGM_DIR / "My_Song_2.mp3").exists()


@pytest.mark.skipif(not FFMPEG_BIN.exists(), reason="需要 ffmpeg")
def test_import_track_video_ext_branch(bgm_env):
    """视频扩展名 → 走 -vn 抽轨分支。

    注：Remotion 精简版 ffmpeg 没有可用的视频测试源滤镜（color/nullsrc 均不可
    喂给 x264），因此用音频-only 的 .mp4 驱动同一代码分支。
    """
    src_dir = bgm_env / "src"
    src_dir.mkdir()
    src = src_dir / "clip.mp4"
    subprocess.run(
        [
            str(FFMPEG_BIN), "-v", "error", "-y",
            "-f", "lavfi", "-i", "sine=frequency=330:duration=2",
            "-c:a", "aac", str(src),
        ],
        check=True, capture_output=True,
    )
    track = bgm.import_track(src, name="ref_theme")
    assert track["name"] == "ref_theme"
    out = bgm.BGM_DIR / "ref_theme.mp3"
    assert out.exists() and out.stat().st_size > 0


@pytest.mark.skipif(not FFMPEG_BIN.exists(), reason="需要 ffmpeg")
def test_import_rejects_oversized(bgm_env, monkeypatch):
    big = bgm_env / "big.mp3"
    with open(big, "wb") as f:
        f.seek(bgm.MAX_SOURCE_BYTES + 1)
        f.write(b"\0")
    with pytest.raises(ValueError):
        bgm.import_track(big)


def test_track_file_missing(bgm_env):
    with pytest.raises(FileNotFoundError):
        bgm.track_file("not_exist_track")
