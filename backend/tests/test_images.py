# -*- coding: utf-8 -*-
"""画面服务测试：自定义图优先、占位图补缺、不误删 custom 文件。"""
from PIL import Image

from app.schemas import Line, Shot
from app.services import images


def make_shots(n=2):
    return [Shot(year="2026", label=f"第{i}幕", lines=[Line(text="台词")]) for i in range(n)]


def test_ensure_images_placeholders(monkeypatch, tmp_path):
    monkeypatch.setattr(images, "REMOTION_PUBLIC", tmp_path)
    rels = images.ensure_images("pid1", make_shots(2))
    assert rels == ["pic/projects/pid1/shot_01.png", "pic/projects/pid1/shot_02.png"]
    assert (tmp_path / "pic/projects/pid1/shot_01.png").exists()


def test_custom_image_wins_over_placeholder(monkeypatch, tmp_path):
    monkeypatch.setattr(images, "REMOTION_PUBLIC", tmp_path)
    out_dir = tmp_path / "pic/projects/pid1"
    out_dir.mkdir(parents=True)
    # 手动放置自定义图（模拟用户用豆包生成后拷进来）
    Image.new("RGB", (64, 64), (200, 30, 30)).save(out_dir / "custom_01.png")

    rels = images.ensure_images("pid1", make_shots(2))
    assert rels[0] == "pic/projects/pid1/custom_01.png"  # 分镜1 用自定义图
    assert rels[1] == "pic/projects/pid1/shot_02.png"  # 分镜2 仍是占位图
    assert (out_dir / "custom_01.png").exists()


def test_stale_placeholder_cleaned_custom_kept(monkeypatch, tmp_path):
    monkeypatch.setattr(images, "REMOTION_PUBLIC", tmp_path)
    out_dir = tmp_path / "pic/projects/pid1"
    out_dir.mkdir(parents=True)
    (out_dir / "custom_01.webp").write_bytes(b"x")
    # 旧的多余占位图（脚本从3镜减到1镜后）
    (out_dir / "shot_03.png").write_bytes(b"x")

    rels = images.ensure_images("pid1", make_shots(1))
    assert rels == ["pic/projects/pid1/custom_01.webp"]
    assert not (out_dir / "shot_03.png").exists()  # 过期占位图被清理
    assert (out_dir / "custom_01.webp").exists()  # 自定义图保留


def test_remove_custom(monkeypatch, tmp_path):
    monkeypatch.setattr(images, "REMOTION_PUBLIC", tmp_path)
    out_dir = tmp_path / "d"
    out_dir.mkdir()
    (out_dir / "custom_01.jpg").write_bytes(b"x")
    images.remove_custom(out_dir, 1)
    assert not (out_dir / "custom_01.jpg").exists()
