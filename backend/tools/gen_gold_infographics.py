# -*- coding: utf-8 -*-
"""为《金价砍价》项目生成信息图分镜（幕2/4/5/6/7）——v2 布局。

风格与「金铺柜台」提案一致：深棕底 #2A211A + 金色 #C9932B，1080x1920 竖屏。
v2 布局约束（避开 Remotion 模板的固定层）：
- 顶部 y<200：年份/标签层 → 不放内容
- 中部 y 650~950：counter/stat 浮层带 → 有浮层的幕留白
- 底部 y>1400：pill 字幕带 → 不放内容
"""
import io
import tempfile
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
BG = "#2A211A"
GOLD = "#C9932B"
GOLD_L = "#E8B84B"
CREAM = "#F2E4C8"
GREY = "#9A8C74"
RED = "#D4593F"

UI = "C:/Windows/Fonts/msyh.ttc"
UI_BD = "C:/Windows/Fonts/msyhbd.ttc"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(UI_BD if bold else UI, size)


def canvas() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img, "RGBA")
    for cx, cy, a in [(160, 330, 52), (920, 1500, 44)]:
        d.ellipse([cx - 430, cy - 430, cx + 430, cy + 430], fill=(201, 147, 43, a))
    return img, d


def chart(fig) -> Image.Image:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", transparent=True)
    plt.close(fig)
    buf.seek(0)
    return Image.open(buf).convert("RGBA")


def save(img: Image.Image, out: Path) -> Path:
    img.save(out, "PNG")
    return out


def shot_02_floor(out: Path) -> Path:
    """幕2：原料价地板价（无浮层幕，中部可用）。"""
    img, d = canvas()
    d.text((W // 2, 260), "记住地板价", font=font(92, True), fill=CREAM, anchor="ma")
    d.text((W // 2, 420), "先记住原料多少钱", font=font(48), fill=GREY, anchor="ma")
    bars = [("上金所 AU9999", "833", GOLD_L), ("黄金回收价", "830", GOLD)]
    for i, (label, val, color) in enumerate(bars):
        x = 190 + i * 430
        d.rounded_rectangle([x, 700, x + 300, 1260], 26, fill=color)
        d.text((x + 150, 620), val, font=font(72, True), fill="#FFFFFF", anchor="ma")
        d.text((x + 150, 1310), label, font=font(42), fill=CREAM, anchor="ma")
    d.text((W // 2, 1400 - 160), "原料价就是砍价的地板", font=font(52, True), fill=GOLD_L, anchor="ma")
    return save(img, out)


def shot_04_tea(out: Path) -> Path:
    """幕4：奶茶比方（无浮层幕）。"""
    img, d = canvas()
    d.text((W // 2, 260), "打个比方", font=font(88, True), fill=CREAM, anchor="ma")
    # 茶底小杯 → 成品大杯（中部偏下，避开字幕）
    d.rounded_rectangle([210, 820, 400, 1180], 28, fill="#6B4A2B", outline="#8A6438", width=4)
    d.text((305, 1230), "茶底 3元", font=font(44, True), fill=CREAM, anchor="ma")
    d.rounded_rectangle([600, 620, 860, 1180], 28, fill="#7A5230", outline=GOLD, width=6)
    d.rectangle([600, 760, 860, 820], fill=(201, 147, 43, 90))
    d.text((730, 1230), "装杯卖 12元", font=font(44, True), fill=GOLD_L, anchor="ma")
    d.text((510, 990), "→", font=font(100, True), fill=GOLD, anchor="mm")
    d.text((W // 2, 1320), "多出来的，是杯子和招牌", font=font(50, True), fill="#FFFFFF", anchor="ma")
    return save(img, out)


def shot_05_fee(out: Path) -> Path:
    """幕5：工费区间（stat 浮层带 y650~950 留白）。"""
    img, d = canvas()
    d.text((W // 2, 230), "真正能砍的是工费", font=font(80, True), fill=CREAM, anchor="ma")
    d.text((W // 2, 380), "金价难谈 工费是软肋", font=font(46), fill=GREY, anchor="ma")
    fig, ax = plt.subplots(figsize=(7.6, 3.6), dpi=150)
    brands = ["周生生", "周大福", "周大生", "老庙", "老凤祥"]
    los = [35, 30, 30, 25, 25]
    his = [85, 80, 80, 70, 75]
    y = range(len(brands))
    ax.barh(y, [hi - lo for lo, hi in zip(los, his)], left=los, color="#C9932B", height=0.5)
    ax.set_yticks(list(y))
    ax.set_yticklabels(brands, fontsize=15, color="white")
    ax.tick_params(axis="x", colors="white", labelsize=12)
    ax.set_xlabel("工费区间 (元/克)", fontsize=13, color="white")
    ax.set_facecolor("none")
    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.spines["bottom"].set_color("#9A8C74")
    ax.tick_params(axis="y", length=0)
    fig.patch.set_alpha(0)
    c = chart(fig)
    cw = 900
    ch = int(cw * c.height / c.width)
    img.paste(c.resize((cw, ch)), (90, 980), c.resize((cw, ch)))
    d.text((W // 2, 1470 - 120), "25~85 元/克 · 能免就免", font=font(54, True), fill=GOLD_L, anchor="ma")
    return save(img, out)


def shot_06_shuibei(out: Path) -> Path:
    """幕6：水贝 vs 品牌（counter 浮层带留白，数值放柱内）。"""
    img, d = canvas()
    d.text((W // 2, 260), "水贝是参照", font=font(88, True), fill=CREAM, anchor="ma")
    d.text((W // 2, 420), "批发集散地 贴近原料价", font=font(46), fill=GREY, anchor="ma")
    bars = [("水贝市场", "846~885", GOLD, 1020, 1420), ("品牌门店", "1161~1168", RED, 850, 1420)]
    for i, (label, val, color, ytop, ybot) in enumerate(bars):
        x = 150 + i * 430
        d.rounded_rectangle([x, ytop, x + 310, ybot], 26, fill=color)
        d.text((x + 155, ytop + (ybot - ytop) // 2 - 40), val, font=font(58, True), fill="#FFFFFF", anchor="mm")
        d.text((x + 155, ytop + (ybot - ytop) // 2 + 50), label, font=font(38), fill=(255, 255, 255, 220), anchor="mm")
    d.text((W // 2, 1470 - 120), "水贝 ≈ 品牌价的七成", font=font(56, True), fill=GOLD_L, anchor="ma")
    return save(img, out)


def shot_07_bar(out: Path) -> Path:
    """幕7：金条 vs 首饰（counter 浮层带留白）。"""
    img, d = canvas()
    d.text((W // 2, 260), "金条更便宜", font=font(88, True), fill=CREAM, anchor="ma")
    d.text((W // 2, 420), "同一品牌 同一天", font=font(46), fill=GREY, anchor="ma")
    rows = [("周大福金条", "1030元/克", GOLD, 560), ("周大福首饰", "1168元/克", RED, 760)]
    for label, val, color, ytop in rows:
        d.rounded_rectangle([140, ytop, 540, ytop + 90], 18, fill=color)
        d.text((165, ytop + 14), label, font=font(40, True), fill=CREAM)
        d.text((570, ytop + 8), val, font=font(52, True), fill="#FFFFFF")
    d.line([940, 600, 940, 850], fill=GOLD_L, width=6)
    d.text((W // 2, 1000), "差 138元/克", font=font(88, True), fill=GOLD_L, anchor="ma")
    d.text((W // 2, 1180), "买金条 另找加工 省一大截", font=font(48, True), fill="#FFFFFF", anchor="ma")
    d.text((W // 2, 1280), "同样克重，付的品牌溢价少得多", font=font(40), fill=GREY, anchor="ma")
    return save(img, out)


if __name__ == "__main__":
    out_dir = Path(tempfile.mkdtemp(prefix="gold_info_v2_"))
    outs = {
        2: shot_02_floor(out_dir / "s2.png"),
        4: shot_04_tea(out_dir / "s4.png"),
        5: shot_05_fee(out_dir / "s5.png"),
        6: shot_06_shuibei(out_dir / "s6.png"),
        7: shot_07_bar(out_dir / "s7.png"),
    }
    print(out_dir)
    for k, v in outs.items():
        print(k, v.name, v.stat().st_size // 1024, "KB")
