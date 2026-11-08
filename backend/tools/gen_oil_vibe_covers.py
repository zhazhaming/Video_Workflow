# -*- coding: utf-8 -*-
"""oil-rise-vibe 封面生成：9:16（1080×1920）与 3:4（1080×1440）。

视觉：与正片同源的复古印刷风——AI 插画打底 + 米白纸底板 + 墨字 + 朱红强调。
主视觉用 S02「加油枪+钞票」（钱=钩子最强）；底板区域避开画面焦点（上方留插画）。

用法：python -X utf8 tools/gen_oil_vibe_covers.py
输出：backend/storage/renders/oil-rise-vibe/cover_9x16.png / cover_3x4.png
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

BACKEND = Path(__file__).resolve().parent.parent
PID = "oil-rise-vibe"
PUB = BACKEND.parent / "remotion-engine" / "public" / "pic" / "projects" / PID
RENDER = BACKEND / "storage" / "renders" / PID

INK = (20, 17, 15)
INK_SOFT = (76, 70, 60)
INK_FAINT = (140, 131, 117)
RED = (200, 69, 45)
CREAM = (244, 239, 230)


def font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    for name in ("msyhbd.ttc", "msyh.ttc", "simhei.ttf") if bold else ("msyh.ttc", "simhei.ttf"):
        p = Path(r"C:\Windows\Fonts") / name
        if p.exists():
            return ImageFont.truetype(str(p), size)
    raise SystemExit("找不到中文字体（msyh/simhei）")


def cover_fit(img: Image.Image, w: int, h: int, top_bias: float = 0.5) -> Image.Image:
    """cover 裁切：短边贴满，按 top_bias 决定纵向裁切位置。"""
    sw, sh = img.size
    scale = max(w / sw, h / sh)
    nw, nh = round(sw * scale), round(sh * scale)
    img = img.resize((nw, nh), Image.LANCZOS)
    x = (nw - w) // 2
    y = round((nh - h) * top_bias)
    return img.crop((x, y, x + w, y + h))


def seg_width(segs: list[tuple[str, tuple, ImageFont.FreeTypeFont]]) -> int:
    d = ImageDraw.Draw(Image.new("RGB", (8, 8)))
    return sum(d.textlength(t, font=f) for t, _, f in segs)


def draw_segments(
    draw: ImageDraw.Draw,
    xy: tuple[int, int],
    segs: list[tuple[str, tuple, ImageFont.FreeTypeFont]],
) -> None:
    x, y = xy
    for t, color, f in segs:
        draw.text((x, y), t, font=f, fill=color)
        x += draw.textlength(t, font=f)


def chip(
    layer: Image.Image,
    xy: tuple[int, int],
    text: str,
    fill: tuple,
    fg: tuple,
    f: ImageFont.FreeTypeFont,
    pad: tuple = (26, 12),
    border: tuple | None = None,
) -> None:
    d = ImageDraw.Draw(layer)
    tw = d.textlength(text, font=f)
    asc, desc = f.getmetrics()
    th = asc + desc
    x, y = xy
    box = (x, y, x + tw + pad[0] * 2, y + th + pad[1] * 2)
    d.rounded_rectangle(box, radius=12, fill=fill, outline=border, width=3 if border else 0)
    d.text((x + pad[0], y + pad[1]), text, font=f, fill=fg)


def build(out: Path, w: int, h: int, base_img: Path, top_bias: float) -> None:
    canvas = cover_fit(Image.open(base_img).convert("RGB"), w, h, top_bias).convert("RGBA")
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    f_kicker = font(34)
    f_l1 = font(int(w * 0.082))
    f_big = font(int(w * 0.104))
    f_sub = font(int(w * 0.040))
    f_chip = font(int(w * 0.031))

    # 顶部左侧：品牌 chip（红底米白字）
    chip(layer, (56, 72), "VIBE 知识大赏 · 市场科普", RED + (255,), CREAM + (255,), f_kicker)

    # 底部米白纸底板
    margin = 56
    plate_h = int(h * 0.30)
    plate = (margin, h - plate_h - 64, w - margin, h - 64)
    d.rounded_rectangle(plate, radius=28, fill=CREAM + (238,), outline=INK + (36,), width=3)

    px = margin + 44
    py = plate[1] + 40
    # L1 墨字
    d.text((px, py), "加满一箱油", font=f_l1, fill=INK + (255,))
    py += int(w * 0.082) * 1.24
    # L2 大字：多花 100 块？（100 红色）
    segs = [
        ("多花", INK + (255,), f_big),
        ("100", RED + (255,), f_big),
        ("块？", INK + (255,), f_big),
    ]
    draw_segments(d, (px, py), segs)
    py += int(w * 0.104) * 1.22
    # 分隔线
    d.line((px, py, plate[2] - 44, py), fill=INK + (52,), width=2)
    py += 18
    # 副标
    d.text((px, py), "五年油价过山车 · 一次讲清", font=f_sub, fill=INK_SOFT + (255,))
    py += int(w * 0.040) * 1.7
    # 数据 chips
    chip(layer, (px, py), "年内 14 次上调", RED + (255,), CREAM + (255,), f_chip)
    chip(layer, (px + int(w * 0.255), py), "布油重上 98 美元", INK + (22,), INK + (255,), f_chip, border=INK + (60,))

    out_img = Image.alpha_composite(canvas, layer).convert("RGB")
    out_img.save(out, quality=95)
    print(f"[cover] {out} {w}x{h}")


def main() -> int:
    RENDER.mkdir(parents=True, exist_ok=True)
    base = PUB / "01-ai.png"
    build(RENDER / "cover_9x16.png", 1080, 1920, base, top_bias=0.18)
    build(RENDER / "cover_3x4.png", 1080, 1440, base, top_bias=0.30)
    return 0


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass
    sys.exit(main())
