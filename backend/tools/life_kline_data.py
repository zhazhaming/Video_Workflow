# -*- coding: utf-8 -*-
"""《你的一生，就是一支K线》逐年数据模型。

输出：storage/projects/life-kline/market_base.json
- daily: 79 根蜡烛（0-78 岁），open/high/low/close（万元），chg 年变化率，amount 当年总支出
- events: 9 个人生节点（tier/kind/卡片文案，与 briefs/life-kline-brief.md §2 对齐）
- segments: 7 章年龄窗（行军分配用）+ 阶段色带

锚点断言：60 岁收盘=100.0（天花板）；78 岁收盘=40.0（78.6 岁退市日）；30 岁收盘<0（转负）。
口径：城镇双职工家庭 · 单人名下净存款 · 起薪 8000/月、年增 ~4%、55 岁回落（设计测算）。
"""
import json
import sys
from pathlib import Path

ROOT = Path(r"D:\Work\video-workflow\backend")
PDIR = ROOT / "storage" / "projects" / "life-kline"

# ---- 逐年收盘锚点（岁: close）；open=前岁 close，high/low 在 candles 表内显式给出 ----
CLOSE = {
    **{a: 0.0 for a in range(0, 22)},
    22: 0.4, 23: 1.6, 24: 3.2, 25: 5.4, 26: 8.0, 27: 13.8,
    28: 4.6, 29: 8.2, 30: -12.0, 31: -6.8, 32: -1.6, 33: 3.6, 34: 8.8,
    35: 8.0, 36: 12.2, 37: 16.4, 38: 20.6, 39: 24.8, 40: 29.0,
    41: 33.2, 42: 37.4, 43: 41.6, 44: 45.8, 45: 50.0,
    46: 54.0, 47: 58.0, 48: 61.4, 49: 64.8, 50: 68.2, 51: 71.6, 52: 75.0,
    53: 79.5, 54: 84.0, 55: 88.0, 56: 91.0, 57: 93.5, 58: 95.5, 59: 97.5,
    60: 100.0, 61: 97.8,
    62: 96.0, 63: 94.2, 64: 92.4, 65: 90.6, 66: 88.8, 67: 87.0, 68: 85.2, 69: 83.4,
    70: 71.4, 71: 69.4, 72: 67.4, 73: 65.4, 74: 63.4, 75: 56.6,
    76: 54.6, 77: 52.6, 78: 40.0,
}

# (low, high) 年内瞬间极值；缺省 (min(open,close), max(open,close))
EXTREME = {
    22: (0.0, 0.5),
    28: (1.2, None),   # 婚礼瞬间
    30: (-16.4, None),  # 首付瞬间（全片最深）
    35: (3.0, None),   # 失业 3 个月
    52: (70.2, None),  # 毕业开销
    60: (None, 100.0),  # 封板触及天花板
    70: (68.0, None),  # 住院 -15.4
    75: (52.0, None),  # 大手术 -11.4
    78: (38.5, None),  # 终年医疗+通胀
}

# 当年总支出（万元，轴底迷你条形强度）
SPEND = {
    **{a: round(1.2 + a * 0.16, 1) for a in range(0, 22)},
    22: 5.0, 23: 6.0, 24: 6.5, 25: 7.0, 26: 7.5, 27: 8.0,
    28: 14.0, 29: 8.5, 30: 30.0, 31: 12.0, 32: 12.0, 33: 12.0, 34: 12.0,
    35: 10.0, 36: 11.0, 37: 11.5, 38: 12.0, 39: 12.5, 40: 13.0,
    41: 13.0, 42: 13.5, 43: 13.5, 44: 14.0, 45: 14.0,
    46: 14.0, 47: 14.0, 48: 14.5, 49: 14.5, 50: 14.5, 51: 14.5, 52: 13.0,
    53: 10.0, 54: 10.0, 55: 10.0, 56: 10.0, 57: 10.0, 58: 10.0, 59: 10.0,
    60: 10.0, 61: 8.0, 62: 8.0, 63: 8.0, 64: 8.0, 65: 8.0, 66: 8.0, 67: 8.0,
    68: 8.0, 69: 8.0, 70: 20.0, 71: 8.0, 72: 8.0, 73: 8.0, 74: 8.0,
    75: 17.0, 76: 8.0, 77: 8.0, 78: 14.0,
}

EVENTS = [
    {"id": "age18", "year": 18, "date": "0018-06-30", "tier": 2, "kind": "down",
     "title": "爸妈已投入 53.8 万", "short": "18 岁", "sse": "−53.8 万", "spx": "爸妈持仓",
     "cause": "把孩子养到 18 岁，全国家庭平均花 53.8 万（育娲人口报告 2024）"},
    {"id": "age22", "year": 22, "date": "0022-06-30", "tier": 2, "kind": "up",
     "title": "挂牌上市 · 第一份工资", "short": "22 岁", "sse": "+6000/月", "spx": "净存 +800/月",
     "cause": "应届本科平均月收入 6000 量级，扣掉房租通勤，一个月能留下 800"},
    {"id": "age28", "year": 28, "date": "0028-06-30", "tier": 1, "kind": "down",
     "title": "重大资产重组 · 婚礼", "short": "28 岁", "sse": "−67%", "spx": "13.8 万 → 4.6 万",
     "cause": "彩礼、三金、酒席一次付清，头六年的积蓄跌去三分之二"},
    {"id": "age30", "year": 30, "date": "0030-06-30", "tier": 1, "kind": "down",
     "title": "加杠杆 · 买房", "short": "30 岁", "sse": "−246%", "spx": "融资余额 63 万",
     "cause": "首付掏空两代人的钱包，净资产历史性转负，从此背上 30 年月供"},
    {"id": "age35", "year": 35, "date": "0035-06-30", "tier": 1, "kind": "down",
     "title": "闪崩惊魂 · 35 岁", "short": "35 岁", "sse": "−9%", "spx": "年内最低 3.0 万",
     "cause": "公司嫌你贵、孩子刚上学；失业三个月，收回时只剩一根锤子线"},
    {"id": "age52", "year": 52, "date": "0052-06-30", "tier": 2, "kind": "down",
     "title": "替下一个人付完 68 万", "short": "52 岁", "sse": "+3.4 万", "spx": "娃毕业",
     "cause": "孩子上完大学——这 68 万，你替下一支股票也付完了"},
    {"id": "age60", "year": 60, "date": "0060-06-30", "tier": 1, "kind": "peak",
     "title": "封板 · 100 万", "short": "60 岁", "sse": "+100 万", "spx": "人生最高收盘价",
     "cause": "普通人存款的天花板：月存 2380 元 × 35 年，正好 100 万（虎嗅测算）"},
    {"id": "age61", "year": 61, "date": "0061-06-30", "tier": 2, "kind": "down",
     "title": "分红砍九成 · 退休", "short": "61 岁", "sse": "−2.2%", "spx": "月入 8000 → 3162",
     "cause": "工资条变成养老金：企业退休人员月均 3162 元，收入断崖只剩四成"},
    {"id": "age70", "year": 70, "date": "0070-06-30", "tier": 1, "kind": "down",
     "title": "闪崩 · 一场住院", "short": "70 岁", "sse": "−14.4%", "spx": "年内最低 68 万",
     "cause": "大病住院一次就是十几万；退休后没有回血，只有长下影"},
    {"id": "age78", "year": 78, "date": "0078-06-30", "tier": 1, "kind": "down",
     "title": "退市清盘 · 78.6 岁", "short": "78.6 岁", "sse": "收盘 40 万", "spx": "一生总收入 400 多万",
     "cause": "中国人的平均寿命。收盘价 40 万——留给下一支股票的天使轮"},
]

# 7 章年龄窗（design 脚本按此分配行军帧）；events 为章内慢放事件顺序
SEGMENTS = {
    "A": {"start": 0, "end": 21, "events": ["age18"]},          # S2 发行期
    "B": {"start": 22, "end": 27, "events": ["age22"]},         # S3 上市
    "C": {"start": 28, "end": 34, "events": ["age28", "age30"]},  # S4 重组与杠杆
    "D": {"start": 35, "end": 45, "events": ["age35"]},         # S5 震荡慢牛
    "E": {"start": 46, "end": 60, "events": ["age52", "age60"]},  # S6 封板
    "F": {"start": 61, "end": 74, "events": ["age61", "age70"]},  # S7 分红缩水
    "G": {"start": 75, "end": 78, "events": ["age78"]},         # S8 清盘
}

STAGES = [
    {"from": 0, "to": 21, "label": "发行期"},
    {"from": 22, "to": 27, "label": "成长"},
    {"from": 28, "to": 34, "label": "加杠杆"},
    {"from": 35, "to": 51, "label": "慢牛"},
    {"from": 52, "to": 60, "label": "冲刺"},
    {"from": 61, "to": 80, "label": "退休"},
]


def main() -> None:
    daily = []
    for age in range(0, 79):
        close = CLOSE[age]
        open_ = CLOSE[age - 1] if age > 0 else 0.0
        lo_def, hi_def = min(open_, close), max(open_, close)
        lo, hi = EXTREME.get(age, (None, None))
        chg = round((close - open_) / abs(open_) * 100, 1) if abs(open_) > 0.5 else None
        daily.append({
            "date": f"{age:04d}-06-30", "close": close, "chg": chg,
            "amount": SPEND[age], "open": open_,
            "high": hi if hi is not None else hi_def,
            "low": lo if lo is not None else lo_def,
        })

    # ---- 锚点断言 ----
    c = {d["date"][:4]: d for d in daily}
    assert c["0060"]["close"] == 100.0, "天花板锚点失效"
    assert c["0078"]["close"] == 40.0, "退市日锚点失效"
    assert c["0030"]["close"] < 0 and c["0030"]["low"] == -16.4, "转负锚点失效"
    assert c["0028"]["close"] < c["0027"]["close"] * 0.5, "婚礼大阴线失效"
    assert max(d["low"] for d in daily) <= 100.0 and c["0060"]["high"] == 100.0
    for ev in EVENTS:
        assert c[ev["date"][:4]] is not None, f"事件 {ev['id']} 无对应蜡烛"

    base = {
        "meta": {
            "start": "0 岁", "end": "78.6 岁",
            "source": "设计测算口径",
            "note": "城镇双职工家庭 · 单人名下净存款 · 起薪 8000/月、年增 ~4%、55 岁回落 · 不构成理财建议",
        },
        "daily": daily,
        "events": EVENTS,
        "segments": SEGMENTS,
        "stages": STAGES,
        "anchors": {
            "peak": {"age": 60, "close": 100.0},
            "final": {"age": 78.6, "close": 40.0},
            "negative": {"age": 30, "close": -12.0, "low": -16.4},
            "totalIncome": "400 多万（设计测算）",
        },
    }
    PDIR.mkdir(parents=True, exist_ok=True)
    (PDIR / "market_base.json").write_text(json.dumps(base, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"market_base.json: {len(daily)} candles, {len(EVENTS)} events, "
          f"peak@60={c['0060']['close']}, final@78={c['0078']['close']}, neg@30={c['0030']['close']}")


if __name__ == "__main__":
    sys.exit(main())
