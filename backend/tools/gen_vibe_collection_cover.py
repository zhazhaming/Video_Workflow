# -*- coding: utf-8 -*-
"""生成抖音合集《Vibe 知识大赏》封面（1080×1080，≤5MB）。
视觉与《黄金三十年》成片一致：暖调哑光 + 金香槟色 + 细金线 + 直角排版。
输出：backend/storage/collections/vibe-knowledge/cover_1080.png
"""
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W = H = 1080
OUT = r"D:\Work\video-workflow\backend\storage\collections\vibe-knowledge\cover_1080.png"

GOLD = (217, 179, 106)
GOLD_HI = (234, 205, 138)
GOLD_D = (138, 106, 44)
CREAM = (239, 230, 210)
MUT = (156, 144, 120)
FAINT = (111, 103, 83)

UI = "C:/Windows/Fonts/msyh.ttc"
UI_BD = "C:/Windows/Fonts/msyhbd.ttc"
MONO = "C:/Windows/Fonts/consolab.ttf"


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def text_w(d: ImageDraw.ImageDraw, s: str, f: ImageFont.FreeTypeFont) -> int:
    return d.textbbox((0, 0), s, font=f)[2]


def main() -> None:
    # ---- 背景：暖哑光渐变 ----
    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        t = y / H
        r = int(21 - 6 * t + (3 if t > 0.7 else 0))
        g = int(18 - 5 * t + (2 if t > 0.7 else 0))
        b = int(12 - 3 * t)
        for x in range(W):
            px[x, y] = (max(r, 8), max(g, 7), max(b, 5))

    d = ImageDraw.Draw(img, "RGBA")

    # 顶部一线暖光
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([140, -320, W - 140, 260], fill=(214, 178, 106, 26))
    glow = glow.filter(ImageFilter.GaussianBlur(90))
    img = Image.alpha_composite(img.convert("RGBA"), glow)

    d = ImageDraw.Draw(img, "RGBA")

    # ---- 顶部 kicker ----
    f_kicker = font(MONO, 30)
    kicker = "V I B E   K N O W L E D G E   S H O W"
    tw = text_w(d, kicker, f_kicker)
    d.text(((W - tw) / 2, 120), kicker, font=f_kicker, fill=GOLD + (235,))
    d.line([W / 2 - 210, 185, W / 2 + 210, 185], fill=GOLD + (90,), width=2)

    # ---- 主标题：Vibe（金） / 知识大赏（象牙白） ----
    f_vibe = font(MONO, 120)
    d.text((W / 2, 258), "Vibe", font=f_vibe, fill=GOLD_HI + (255,), anchor="ma")
    f_title = font(UI_BD, 196)
    d.text((W / 2, 400), "知识大赏", font=f_title, fill=CREAM + (255,), anchor="ma")

    # ---- 副题（通用主张）----
    f_sub = font(UI_BD, 46)
    sub = "把硬知识，做成数据大片"
    tw = text_w(d, sub, f_sub)
    d.text(((W - tw) / 2, 662), sub, font=f_sub, fill=MUT + (255,))

    # ---- 特性 chips（通用，不绑定具体选题）----
    f_chip = font(UI, 33)
    chips = ["数据可视化", "澎湃卡点", "电影级动效"]
    widths = [text_w(d, c, f_chip) + 56 for c in chips]
    gap = 26
    x0 = (W - (sum(widths) + gap)) / 2
    for c, cw in zip(chips, widths):
        d.rounded_rectangle([x0, 756, x0 + cw, 756 + 66], radius=8,
                            outline=(217, 179, 106, 110), width=2)
        d.text((x0 + cw / 2, 756 + 33), c, font=f_chip,
               fill=(217, 205, 178, 255), anchor="mm")
        x0 += cw + gap

    # ---- 底部装饰：迷你金价曲线 + 年份轴（避开 chips 区域） ----
    pts = [(70, 944), (150, 950), (240, 938), (330, 944), (415, 918),
           (505, 928), (600, 902), (700, 910), (800, 882), (910, 862), (1000, 852)]
    d.line(pts, fill=GOLD + (255,), width=5, joint="curve")
    d.line([(70, 962), (1000, 962)], fill=(217, 179, 106, 70), width=2)
    # 播放头
    hx, hy = pts[-2]
    d.ellipse([hx - 9, hy - 9, hx + 9, hy + 9], fill=GOLD_HI + (255,))
    d.ellipse([hx - 16, hy - 16, hx + 16, hy + 16], outline=(234, 205, 138, 120), width=2)

    # ---- 右下 "持续上新"（三角自绘，避免字体缺字形） ----
    f_upd = font(UI, 26)
    upd = "持续上新"
    tw = text_w(d, upd, f_upd)
    ux = W - 56
    uy = 920
    d.polygon([(ux - tw - 30, uy - 8), (ux - tw - 30, uy + 10), (ux - tw - 14, uy + 1)],
              fill=GOLD + (220,))
    d.text((ux, uy), upd, font=f_upd, fill=GOLD + (210,), anchor="rm")

    # ---- 颗粒 + 暗角 ----
    rng = np.random.default_rng(7)
    noise = rng.normal(0, 5.5, (H, W, 1)).repeat(3, axis=2)
    arr = np.asarray(img.convert("RGB"), dtype=np.int16) + noise.astype(np.int16)
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    img2 = Image.fromarray(arr)

    vig = Image.new("L", (W, H), 0)
    vd = ImageDraw.Draw(vig)
    vd.ellipse([-180, -180, W + 180, H + 180], fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(120))
    black = Image.new("RGB", (W, H), (0, 0, 0))
    img2 = Image.composite(img2, black, vig)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    img2.save(OUT, "PNG", optimize=True)
    kb = os.path.getsize(OUT) / 1024
    print(f"封面已生成: {OUT} ({kb:.0f} KB)")

    # ---- 简介字数自检 ----
    intro = (
        "把硬知识做成数据大片：排行榜竞速、时间线推演、趋势可视化，"
        "配上澎湃的卡点BGM和电影级动效。\n"
        "不讲废话，直接看数据——每一格都是一拍，每一拍都踩在知识点上。\n"
        "财经、科技、历史、人文……什么都可能做，持续上新。\n"
        "建议戴耳机，把知识熬成氛围感。关注不迷路。"
    )
    n = len(intro.replace("\n", ""))
    print(f"合集简介字数（不含换行）: {n}/200 {'OK' if n <= 200 else 'OVER!'}")
    print("--- 合集简介（直接粘贴）---")
    print(intro)


if __name__ == "__main__":
    main()
