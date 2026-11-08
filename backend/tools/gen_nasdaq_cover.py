# -*- coding: utf-8 -*-
"""《一夜蒸发2.3万亿：纳指怎么了》封面生成。

输出（backend/storage/renders/nasdaq-crash-vibe/）：
  cover_3x4.png       1080×1440（3:4）· 按成片视觉语言设计（暖纸底/墨字/朱红印章/断崖折线）
  cover_3x4_video.jpg 1080×1440（3:4）· 成片钩子帧中心裁切（备选）

用法：python -X utf8 tools/gen_nasdaq_cover.py
"""
import os
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(r"D:\Work\video-workflow")
OUT_DIR = ROOT / "backend" / "storage" / "renders" / "nasdaq-crash-vibe"

W, H = 1080, 1440  # 3:4

INK = (27, 24, 21)
INK_SOFT = (76, 70, 60)
INK_FAINT = (140, 131, 117)
RED = (200, 69, 45)
GOLD = (169, 124, 51)
PAPER_A = (247, 242, 233)
PAPER_B = (233, 223, 204)

UI = "C:/Windows/Fonts/msyh.ttc"
UI_BD = "C:/Windows/Fonts/msyhbd.ttc"
MONO = "C:/Windows/Fonts/consolab.ttf"
SERIF = "C:/Windows/Fonts/simsun.ttc"


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def text_w(d: ImageDraw.ImageDraw, s: str, f: ImageFont.FreeTypeFont) -> int:
    return d.textbbox((0, 0), s, font=f)[2]


def is_latin(ch: str) -> bool:
    return ord(ch) < 0x2E80


def draw_mixed(d: ImageDraw.ImageDraw, xy, s: str, size: int, color, tracking: int = 2):
    """混排绘制：ASCII 用 Consolas（等宽），CJK 用微软雅黑，逐字推进。"""
    fm = font(MONO, size)
    fc = font(UI, size)
    fc_b = font(UI_BD, size)
    x, y = xy
    for ch in s:
        if is_latin(ch):
            f = fm
        else:
            # 中文里的强调字符由调用方决定粗细，这里默认常规雅黑
            f = fc
        d.text((x, y), ch, font=f, fill=color)
        x += text_w(d, ch, f) + (tracking if is_latin(ch) else 1)
    return x


def draw_mixed_w(d: ImageDraw.ImageDraw, s: str, size: int, tracking: int = 2) -> int:
    fm = font(MONO, size)
    fc = font(UI, size)
    return sum(
        text_w(d, ch, fm if is_latin(ch) else fc) + (tracking if is_latin(ch) else 1)
        for ch in s
    )


def stamp_layer(text: str, size: int, color, border: int, rotate: float) -> Image.Image:
    """朱红描边印章（旋转），透明图层。"""
    f = font(SERIF, size)
    tmp = Image.new("RGBA", (size * len(text) * 2, size * 3), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)
    tw = text_w(td, text, f)
    pad_x, pad_y = int(size * 0.3), int(size * 0.14)
    w0, h0 = tw + pad_x * 2, size + pad_y * 2
    tmp = tmp.crop((0, 0, w0 + border * 2, h0 + border * 2))
    td = ImageDraw.Draw(tmp)
    td.rectangle([border // 2, border // 2, w0 + border * 1.5, h0 + border * 1.5],
                 outline=color + (235,), width=border)
    td.text((border + pad_x, border + pad_y - size * 0.08), text, font=f, fill=color + (240,))
    return tmp.rotate(rotate, expand=True, resample=Image.BICUBIC)


def polyline(d: ImageDraw.ImageDraw, pts, color, width: int) -> None:
    d.line(pts, fill=color, width=width, joint="curve")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # ---- 纸底：竖向渐变 + 左上红晕 + 右下墨晕 ----
    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        t = y / H
        c0 = tuple(int(PAPER_A[i] + (PAPER_B[i] - PAPER_A[i]) * t) for i in range(3))
        for x in range(W):
            px[x, y] = c0
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-260, -200, 420, 460], fill=RED + (16,))
    gd.ellipse([W - 420, H - 460, W + 260, H + 200], fill=INK + (12,))
    img = Image.alpha_composite(img.convert("RGBA"), glow.filter(ImageFilter.GaussianBlur(110)))
    d = ImageDraw.Draw(img, "RGBA")

    M = 90
    # ---- 6 栏印刷网格 ----
    gut = (W - 2 * M) / 6
    for i in range(7):
        d.line([(M + i * gut, 170), (M + i * gut, H - 120)], fill=INK + (11,), width=1)
    # 页眉 / 页脚细线 + 角标
    d.line([(M, 150), (W - M, 150)], fill=INK + (40,), width=1)
    d.line([(M, H - 110), (W - M, H - 110)], fill=INK + (26,), width=1)
    for x in (M - 14, W - M + 2):
        d.line([(x, 150), (x + 18, 150)], fill=INK + (70,), width=2)
        d.line([(x, H - 110), (x + 18, H - 110)], fill=INK + (50,), width=2)

    # ---- 顶部：品牌 + kicker ----
    draw_mixed(d, (M, 52), "VIBE 知识大赏 · 市场科普", 30, INK_FAINT + (255,))
    d.text((W - M - text_w(d, "MARKET LAB", font(MONO, 30)), 52), "MARKET LAB",
           font=font(MONO, 30), fill=RED + (200,))

    # ---- 主视觉：Cap + 巨型数字 ----
    draw_mixed(d, (M, 232), "$2.3 TRILLION · 单日蒸发", 34, INK_SOFT + (255,))

    f_big = font(UI_BD, 300)
    f_mid = font(UI_BD, 132)
    d.text((M - 6, 292), "2.3", font=f_big, fill=RED + (255,))
    x_num = M - 6 + text_w(d, "2.3", f_big) + 18
    d.text((x_num, 448), "万亿", font=f_mid, fill=INK + (255,))

    # 断崖折线：爬升（墨）→ 悬崖（朱红）
    rise = [(M, 890), (240, 838), (400, 778), (540, 742), (636, 646)]
    cliff = [(636, 646), (716, 876), (812, 1016), (886, 1096)]
    polyline(d, rise, INK + (215,), 7)
    polyline(d, cliff, RED + (245,), 11)
    d.ellipse([618, 628, 654, 664], outline=RED + (150,), width=3)
    d.ellipse([870, 1080, 902, 1112], fill=RED + (255,))

    # 印章（收进右边界内）
    st = stamp_layer("一夜蒸发", 80, RED, 6, -9)
    img.alpha_composite(st, (600, 196))

    # ---- 标题区 ----
    d.line([(M, 1018), (W - M, 1018)], fill=INK + (46,), width=2)
    f_title = font(UI_BD, 92)
    d.text((M, 1044), "一夜蒸发", font=f_title, fill=INK + (255,))
    d.text((M + text_w(d, "一夜蒸发", f_title), 1044), "2.3万亿", font=f_title, fill=RED + (255,))
    d.text((M, 1150), "纳指怎么了", font=f_title, fill=INK + (255,))
    # 标题下方同一行带：红下划线（左） + 数据行（右），避开标题字形（底部 ~1254）
    d.line([(M, 1296), (M + 250, 1296)], fill=RED + (220,), width=6)
    draw_mixed(d, (M + 300, 1284), "纳指 -5.52% · 19个月最惨 · 回调 -12%", 30, INK_SOFT + (255,))
    draw_mixed(d, (M, H - 88), "NASDAQ COMPOSITE · 2026-11-05 · 60秒看懂", 26, INK_FAINT + (255,))

    out_png = OUT_DIR / "cover_3x4.png"
    img.convert("RGB").save(out_png, "PNG")
    print(f"[done] {out_png}")

    # ---- 备选：成片钩子帧中心裁 3:4 ----
    src = OUT_DIR / "cover.jpg"
    if src.exists():
        im = Image.open(src)
        sw, sh = im.size  # 1080×1920
        ch = int(sw * 4 / 3)
        top = (sh - ch) // 2
        im.crop((0, top, sw, top + ch)).save(OUT_DIR / "cover_3x4_video.jpg", "JPEG", quality=92)
        print(f"[done] {OUT_DIR / 'cover_3x4_video.jpg'}")
    else:
        print("[skip] cover.jpg 不存在，跳过视频帧裁切")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
