# -*- coding: utf-8 -*-
"""为《一句话生成20页PPT》项目生成"网页工具演示截图风"分镜图。

输出 custom_04~08.png 到项目 pic 目录（工作流约定：custom_NN 对应分镜 N）。
风格：深色桌面背景 + 居中浏览器窗口卡片，窗口内是 PPT/对话界面 —— 还原演示感。
图表用 matplotlib 真渲染（英文轴避免中文字体问题），中文文案用 Pillow 叠加。
"""
import io
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from PIL import Image, ImageDraw, ImageFont

PID = "91bdcc0592dc"
OUT_DIR = Path(rf"D:\Work\remotion-life-sim\public\pic\projects\{PID}")
W, H = 1080, 1920
UI = "C:/Windows/Fonts/msyh.ttc"
UI_BD = "C:/Windows/Fonts/msyhbd.ttc"

INK = "#1f2328"
BLUE = "#2f6fed"
GREEN = "#23a35a"
RED = "#e5534b"
GREY = "#6e7781"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(UI_BD if bold else UI, size)


def base_canvas(browser_title: str) -> tuple[Image.Image, ImageDraw.ImageDraw, tuple[int, int, int, int]]:
    """深色桌面 + 居中浏览器窗口，返回 (图, 画笔, 内容区矩形)。"""
    img = Image.new("RGB", (W, H), "#0d1117")
    d = ImageDraw.Draw(img, "RGBA")
    # 桌面氛围光
    for cx, cy, color in [(150, 300, (88, 120, 255, 40)), (930, 1500, (255, 120, 150, 34))]:
        d.ellipse([cx - 420, cy - 420, cx + 420, cy + 420], fill=color)
    # 浏览器窗口
    wx0, wy0, wx1, wy1 = 60, 400, W - 60, 1640
    d.rounded_rectangle([wx0, wy0, wx1, wy1], 22, fill="#f6f8fa", outline="#30363d", width=2)
    # 标题栏
    d.rounded_rectangle([wx0, wy0, wx1, wy0 + 64], 22, fill="#e7ebf0")
    d.rectangle([wx0, wy0 + 40, wx1, wy0 + 64], fill="#e7ebf0")
    for i, c in enumerate([RED, "#d29922", GREEN]):
        d.ellipse([wx0 + 26 + i * 40, wy0 + 24, wx0 + 46 + i * 40, wy0 + 44], fill=c)
    d.rounded_rectangle([wx0 + 160, wy0 + 16, wx1 - 40, wy0 + 48], 16, fill="#ffffff")
    d.text((wx0 + 184, wy0 + 20), browser_title, font=font(24), fill=GREY)
    return img, d, (wx0 + 8, wy0 + 76, wx1 - 8, wy1 - 8)


def ppt_frame(area, d, title: str, page: str):
    """窗口内画一页 16:9 的 PPT 幻灯片。"""
    x0, y0, x1, y1 = area
    fx0, fy0, fx1, fy1 = x0 + 40, y0 + 40, x1 - 40, y0 + 40 + int((x1 - x0 - 80) * 9 / 16)
    d.rounded_rectangle([fx0, fy0, fx1, fy1], 10, fill="#ffffff", outline="#d0d7de", width=2)
    d.rectangle([fx0, fy0, fx1, fy0 + 14], fill=BLUE)  # 顶部色条
    d.text((fx0 + 44, fy0 + 52), title, font=font(64, True), fill=INK)
    d.text((fx1 - 150, fy1 - 64), page, font=font(34), fill=GREY)
    return (fx0, fy0, fx1, fy1)


def chart_png() -> Image.Image:
    """matplotlib 真图表（Q3 月度销售），返回 RGBA 图。"""
    fig, ax1 = plt.subplots(figsize=(6.4, 4.2), dpi=140)
    months = ["Jul", "Aug", "Sep"]
    bars = ax1.bar(months, [486, 612, 758], color="#4c8dff", width=0.5, label="Sales (10k)")
    ax1.plot(months, [320, 415, 502], color="#e5534b", marker="o", linewidth=3, label="Target (10k)")
    ax1.set_title("Q3 Sales Overview", fontsize=15, fontweight="bold")
    ax1.legend(fontsize=10, loc="upper left")
    ax1.spines[["top", "right"]].set_visible(False)
    buf = io.BytesIO()
    fig.savefig(buf, format="png", transparent=True)
    plt.close(fig)
    buf.seek(0)
    return Image.open(buf).convert("RGBA")


# ---- 镜4：输入框里说一句话 ----
def shot_04():
    img, d, (x0, y0, x1, y1) = base_canvas("AI PPT 助手")
    # 对话区
    d.text((x0 + 50, y0 + 40), "AI 一句话 PPT", font=font(44, True), fill=INK)
    # 用户气泡
    bubble = (x0 + 60, y0 + 130, x1 - 60, y0 + 370)
    d.rounded_rectangle(bubble, 18, fill=BLUE)
    d.text((bubble[0] + 34, bubble[1] + 26), "我说了一句：", font=font(30), fill=(255, 255, 255, 200))
    d.text((bubble[0] + 34, bubble[1] + 92), "帮我做份 Q3 销售总结", font=font(48, True), fill="#ffffff")
    d.text((bubble[0] + 34, bubble[1] + 168), "20 页，要数据图表，还带动画", font=font(40), fill="#ffffff")
    # AI 回复气泡
    ai = (x0 + 60, y0 + 1020, x1 - 60, y0 + 1200)
    d.rounded_rectangle(ai, 18, fill="#ffffff", outline="#d0d7de", width=2)
    d.text((ai[0] + 34, ai[1] + 26), "收到！正在为你生成 20 页 PPT…", font=font(38, True), fill=INK)
    for i in range(3):
        d.ellipse([ai[1 - 1] + 640 + i * 44, ai[3] - 78, ai[1 - 1] + 664 + i * 44, ai[3] - 54],
                  fill=(GREY if i < 2 else "#d0d7de"))
    d.text((x0 + 50, y1 - 90), "发送后，剩下的交给 AI", font=font(36, True), fill=GREEN)
    img.save(OUT_DIR / "custom_04.png")


# ---- 镜5：目录页自己长出来 ----
def shot_05():
    img, d, (x0, y0, x1, y1) = base_canvas("AI PPT 助手 — 生成中")
    fx0, fy0, fx1, fy1 = ppt_frame((x0, y0, x1, y1), d, "Q3 销售总结报告", "1 / 20")
    items = ["01  本季度核心数据", "02  三大区域战报", "03  明星产品拆解", "04  客户增长分析", "05  问题与复盘"]
    for i, it in enumerate(items):
        y = fy0 + 220 + i * 130
        d.rounded_rectangle([fx0 + 60, y, fx1 - 60, y + 96], 12, fill="#f0f6ff")
        d.text((fx0 + 96, y + 22), it, font=font(42, True), fill="#26437c")
    d.text((x0 + 50, y1 - 84), "目录 20 页排版全部自动完成", font=font(36, True), fill=GREEN)
    img.save(OUT_DIR / "custom_05.png")


# ---- 镜6：图表页自动配好 ----
def shot_06():
    img, d, (x0, y0, x1, y1) = base_canvas("AI PPT 助手 — 数据图表页")
    fx0, fy0, fx1, fy1 = ppt_frame((x0, y0, x1, y1), d, "Q3 业绩一路走高", "12 / 20")
    chart = chart_png()
    cw = fx1 - fx0 - 120
    ch = int(cw * chart.height / chart.width)
    img.paste(chart.resize((cw, ch)), (fx0 + 60, fy0 + 180), chart.resize((cw, ch)))
    d.text((fx0 + 60, fy1 - 96), "9 月销售额 758 万，环比 +24%", font=font(36, True), fill=INK)
    d.text((x0 + 50, y1 - 84), "图表自动选取 + 数据自动填充", font=font(36, True), fill=GREEN)
    img.save(OUT_DIR / "custom_06.png")


# ---- 镜7：还带切换动画 ----
def shot_07():
    img, d, (x0, y0, x1, y1) = base_canvas("AI PPT 助手 — 动画已配好")
    fx0, fy0, fx1, fy1 = ppt_frame((x0, y0, x1, y1), d, "谢谢观看 · Q3 复盘", "20 / 20")
    # 滑入轨迹示意
    for i in range(4):
        alpha = 60 + i * 45
        d.rounded_rectangle([fx0 - 260 + i * 78, (fy0 + fy1) // 2 - 110, fx0 - 130 + i * 78, (fy0 + fy1) // 2 + 110],
                            14, outline=(73, 141, 255, alpha), width=5)
    d.text((fx0 + 40, (fy0 + fy1) // 2 - 26), "→ 翻页自动滑入", font=font(46, True), fill=BLUE)
    d.rounded_rectangle([x0 + 60, y1 - 220, x1 - 60, y1 - 130], 16, fill="#fff8e1")
    d.text((x0 + 96, y1 - 204), "每页切换动画 / 元素入场，全部自动配好", font=font(38, True), fill="#8a6d00")
    img.save(OUT_DIR / "custom_07.png")


# ---- 镜8：三小时对比三分钟 ----
def shot_08():
    img = Image.new("RGB", (W, H), "#0d1117")
    d = ImageDraw.Draw(img, "RGBA")
    for cx, cy, color in [(150, 400, (229, 83, 75, 44)), (930, 1500, (35, 163, 90, 46))]:
        d.ellipse([cx - 420, cy - 420, cx + 420, cy + 420], fill=color)
    d.text((W // 2, 260), "同一份 20 页 PPT", font=font(56, True), fill="#e6edf3", anchor="ma")
    # 左：手工
    d.rounded_rectangle([80, 460, W // 2 - 30, 1280], 26, fill="#301b1b", outline=(229, 83, 75, 120), width=3)
    d.text(((80 + W // 2 - 30) // 2, 560), "手工做", font=font(52, True), fill="#ff7b72", anchor="ma")
    d.text(((80 + W // 2 - 30) // 2, 700), "3", font=font(190, True), fill="#ffffff", anchor="ma")
    d.text(((80 + W // 2 - 30) // 2, 960), "小时起步", font=font(44), fill="#e6edf3", anchor="ma")
    d.text(((80 + W // 2 - 30) // 2, 1080), "找数据 排版 改到眼花", font=font(30), fill=GREY, anchor="ma")
    # 右：AI
    d.rounded_rectangle([W // 2 + 30, 460, W - 80, 1280], 26, fill="#12261a", outline=(35, 163, 90, 130), width=3)
    d.text(((W // 2 + 30 + W - 80) // 2, 560), "交给 AI", font=font(52, True), fill="#3fb950", anchor="ma")
    d.text(((W // 2 + 30 + W - 80) // 2, 700), "3", font=font(190, True), fill="#ffffff", anchor="ma")
    d.text(((W //2 + 30 + W - 80) // 2, 960), "分钟直接开讲", font=font(44), fill="#e6edf3", anchor="ma")
    d.text(((W // 2 + 30 + W - 80) // 2, 1080), "你只负责说一句话", font=font(30), fill=GREY, anchor="ma")
    d.text((W // 2, 1440), "省下的时间，够你把汇报练 10 遍", font=font(44, True), fill="#ffd166", anchor="ma")
    img.save(OUT_DIR / "custom_08.png")


if __name__ == "__main__":
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    shot_04()
    shot_05()
    shot_06()
    shot_07()
    shot_08()
    print("done:", [f.name for f in sorted(OUT_DIR.glob("custom_*.png"))])
