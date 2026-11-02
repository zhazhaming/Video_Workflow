# -*- coding: utf-8 -*-
"""画面服务：自定义图优先，缺失的分镜生成 Pillow 占位图。

自定义图约定：文件名为 custom_01.png / custom_02.png ...（序号对应分镜序号，
支持 png/jpg/jpeg/webp），放在 public/pic/projects/<pid>/ 下。
可以是网页上传的，也可以是用户用豆包/Midjourney 等任何工具生成后手动放进去的。

Phase 2 的图片生成 API 会作为另一个来源接入（自定义图 > API 生成 > 占位图）。
"""
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from ..config import PIC_PUBLIC_SUBDIR, REMOTION_PUBLIC
from ..schemas import Shot

W, H = 1080, 1920

_CUSTOM_EXTS = (".png", ".jpg", ".jpeg", ".webp")

_FONT_CANDIDATES = [
    ("C:/Windows/Fonts/msyhbd.ttc", 120),
    ("C:/Windows/Fonts/msyh.ttc", 120),
    ("/System/Library/Fonts/PingFang.ttc", 120),
]


def project_pic_dir(project_id: str) -> Path:
    return REMOTION_PUBLIC / PIC_PUBLIC_SUBDIR / project_id


def find_custom(out_dir: Path, shot_no: int) -> Path | None:
    """按序号找自定义图：custom_01.png / custom_01.jpg ..."""
    for ext in _CUSTOM_EXTS:
        p = out_dir / f"custom_{shot_no:02d}{ext}"
        if p.exists():
            return p
    return None


def remove_custom(out_dir: Path, shot_no: int) -> None:
    for ext in _CUSTOM_EXTS:
        p = out_dir / f"custom_{shot_no:02d}{ext}"
        if p.exists():
            p.unlink()


def _load_font(size: int) -> ImageFont.FreeTypeFont:
    for path, default_size in _FONT_CANDIDATES:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size or default_size)
            except OSError:
                continue
    return ImageFont.load_default()


def _hex_to_rgb(h: str, fallback: tuple[int, int, int]) -> tuple[int, int, int]:
    h = h.strip().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    try:
        return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]
    except ValueError:
        return fallback


def _gradient(c1: tuple[int, int, int], c2: tuple[int, int, int]) -> Image.Image:
    """垂直渐变，逐行插值（1080x1920 足够快）。"""
    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        t = y / (H - 1)
        r = int(c1[0] + (c2[0] - c1[0]) * t)
        g = int(c1[1] + (c2[1] - c1[1]) * t)
        b = int(c1[2] + (c2[2] - c1[2]) * t)
        for x in range(W):
            px[x, y] = (r, g, b)
    return img


def render_placeholder(shot: Shot, out_path: Path) -> None:
    c1 = _hex_to_rgb(shot.colors[0], (26, 26, 46))
    c2 = _hex_to_rgb(shot.colors[1], (22, 33, 62))
    img = _gradient(c1, c2)
    draw = ImageDraw.Draw(img, "RGBA")

    text = shot.label or shot.year or ""
    if text:
        font = _load_font(120)
        lines = [text[i : i + 8] for i in range(0, len(text), 8)] if len(text) > 10 else [text]
        line_h = 160
        y0 = (H - line_h * len(lines)) // 2
        for i, ln in enumerate(lines):
            bbox = draw.textbbox((0, 0), ln, font=font)
            tw = bbox[2] - bbox[0]
            x = (W - tw) // 2
            y = y0 + i * line_h
            draw.text((x + 4, y + 6), ln, font=font, fill=(0, 0, 0, 90))
            draw.text((x, y), ln, font=font, fill=(255, 255, 255, 46))

    if shot.year:
        yfont = _load_font(90)
        draw.text((64, 80), shot.year, font=yfont, fill=(255, 255, 255, 210))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, "PNG")


def ensure_images(project_id: str, shots: list[Shot]) -> list[str]:
    """为所有分镜确定画面：自定义图优先，缺失则生成占位图。

    - 不再整体清空目录（保护用户手动放置的 custom_* 文件）
    - 会清理不再被引用的旧占位图（shot_*.png），custom_* 永不删除
    返回相对 public/ 的路径列表，与 shots 对齐。
    """
    out_dir = project_pic_dir(project_id)
    out_dir.mkdir(parents=True, exist_ok=True)

    rels: list[str] = []
    expected_placeholders: set[str] = set()
    for i, shot in enumerate(shots):
        no = i + 1
        custom = find_custom(out_dir, no)
        if custom:
            rels.append(f"{PIC_PUBLIC_SUBDIR}/{project_id}/{custom.name}")
            continue
        name = f"shot_{no:02d}.png"
        render_placeholder(shot, out_dir / name)
        expected_placeholders.add(name)
        rels.append(f"{PIC_PUBLIC_SUBDIR}/{project_id}/{name}")

    for f in out_dir.glob("shot_*.png"):
        if f.name not in expected_placeholders:
            f.unlink(missing_ok=True)
    return rels
