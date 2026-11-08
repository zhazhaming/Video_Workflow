# -*- coding: utf-8 -*-
"""《A股这一年：242 个交易日》数据准备。

数据源：东方财富 push2his 日 K（上证指数 000001.SH，前复权），已缓存于
backend/storage/_sse_year_raw.json（2026-11-02 收盘后抓取，242 个交易日）。

产出：
- projects/ashare-year-242d/market_base.json  日线 + 事件 + 统计摘要（设计阶段再补 dayTimes）
- projects/ashare-year-242d/research.json     事件出处（可引用节点）
"""
import json
import sys
from pathlib import Path

ROOT = Path(r"D:\Work\video-workflow\backend")
PID = "ashare-year-242d"
RAW = ROOT / "storage" / "_sse_year_raw.json"
OUT_DIR = ROOT / "storage" / "projects" / PID

WIN_START = "2025-11-02"  # 窗口过滤（首个交易日 2025-11-03）
WIN_END = "2026-11-02"

# 10 个关键事件：日期/涨跌幅均与同一份日线快照对齐；文案来自公开报道复盘。
EVENTS = [
    {
        "id": "nov21", "date": "2025-11-21", "kind": "down", "tier": 2,
        "short": "外围惊吓", "title": "美股 AI 回调传导",
        "cause": "英伟达财报后 AI 获利回吐，隔夜美股大幅下挫，A股跳空破位",
        "chg": -2.45, "note": "高位科技股集中回调",
    },
    {
        "id": "jan05", "date": "2026-01-05", "kind": "up", "tier": 2,
        "short": "17连阳", "title": "开年 17 连阳，重返 4000",
        "cause": "AI 科技牛叠加增量资金，开市以来最长连阳纪录",
        "chg": 1.38, "note": "沪指收 4023，单日成交超 2.5 万亿",
    },
    {
        "id": "febtop", "date": "", "kind": "peak", "tier": 2,
        "short": "AI 主升", "title": "AI 牛市主升浪",
        "cause": "科创板块领涨，指数创阶段新高",
        "chg": None, "note": "",  # date/chg/note 由数据填充
    },
    {
        "id": "mar23", "date": "2026-03-23", "kind": "down", "tier": 1,
        "short": "黑色星期一", "title": "单日暴跌 3.63%",
        "cause": "中东地缘冲突升级 + 美联储降息预期逆转，超 5200 只个股下跌，市值单日蒸发逾 4 万亿",
        "chg": -3.63, "note": "收 3813，3 月累计一度跌超 8%",
    },
    {
        "id": "apr08", "date": "2026-04-08", "kind": "up", "tier": 1,
        "short": "百点长阳", "title": "百点长阳收复失地",
        "cause": "美伊停火预期升温、中东局势缓和，避险情绪消退，全线放量反弹",
        "chg": 2.70, "note": "创业板指涨近 6%，随后重回 4000",
    },
    {
        "id": "may13", "date": "2026-05-13", "kind": "peak", "tier": 2,
        "short": "年内新高", "title": "4242 点，年内最高收盘",
        "cause": "5 月 11 日站上 4200，科创 50 刷新历史新高，AI/硬科技主线",
        "chg": None, "note": "5 月 14 日盘中高见 4258.86",
    },
    {
        "id": "jun22", "date": "2026-06-22", "kind": "up", "tier": 1,
        "short": "天量", "title": "全市场成交 3.76 万亿",
        "cause": "创业板再创历史新高，单日成交历史第二高，上半年成交 317.5 万亿创半年纪录",
        "chg": 1.78, "note": "重回 4100 上方",
    },
    {
        "id": "jul17", "date": "2026-07-17", "kind": "down", "tier": 1,
        "short": "踩踏", "title": "科技股踩踏，单日 -3.05%",
        "cause": "高位题材集中兑现引发流动性冲击，近 200 只个股跌停，市值蒸发逾 4.5 万亿",
        "chg": -3.05, "note": "创业板盘中一度泻逾 8%",
    },
    {
        "id": "oct30", "date": "2026-10-30", "kind": "down", "tier": 1,
        "short": "探底", "title": "缩量探底，失守 3600",
        "cause": "美联储加息预期升温 + 三季报验证 + 隔夜美股科技股大跌，沪深 300 十二周连跌",
        "chg": -1.44, "note": "10 月创业板指单月跌超 23%",
    },
    {
        "id": "today", "date": "2026-11-02", "kind": "up", "tier": 1,
        "short": "放量反弹", "title": "放量反弹 1.08%",
        "cause": "超跌后资金回流，机构预期 11 月修复行情",
        "chg": 1.08, "note": "沪市成交 8475 亿，显著放量",
    },
]

SOURCES = {
    "data": {"title": "东方财富 · 上证指数日 K（前复权）", "url": "https://quote.eastmoney.com/zs000001.html"},
    "jan05": {"title": "中新网 · 2026-01-05 A股开门红", "url": "https://www.chinanews.com.cn/cj/2026/01-05/10546347.shtml"},
    "jan17": {"title": "新浪财经 · 开年 17 连阳创纪录（2026-01-29）", "url": "https://finance.sina.com.cn/wm/2026-01-29/doc-inhiymqm1069695.shtml"},
    "mar23": {"title": "新浪财经/财联社 · 2026-03-23 收盘复盘", "url": "https://finance.sina.com.cn"},
    "apr08": {"title": "东方财富 · 2026-04-08 全线暴涨", "url": "https://emcreative.eastmoney.com/app_fortune/article/index.html?artCode=20260408155832675699810&postId=1690676767"},
    "apr08b": {"title": "澳门日报 · A股大幅反弹 创业板指涨近6%", "url": "https://www.macaodaily.com/html/2026-04/09/content_1900242.htm"},
    "may11": {"title": "Investing · 2026-05-11 沪指站上4200 科创50新高", "url": "https://www.investing.com"},
    "jun22": {"title": "新浪财经 · 2026-06-22 成交3.76万亿历史第二高", "url": "https://finance.sina.com.cn"},
    "jul17": {"title": "中国证券报/新浪 · 2026-07-17 近200只跌停", "url": "https://finance.sina.com.cn"},
    "oct30": {"title": "东方财富/同花顺 · 2026-10-30 失守3600", "url": "https://quote.eastmoney.com"},
    "oct23": {"title": "联合早报 · 2026-10-23 沪指击穿3600后反弹", "url": "https://www.zaobao.com"},
}


def main() -> None:
    raw = json.loads(RAW.read_text(encoding="utf-8"))
    kl = [k.split(",") for k in raw["data"]["klines"]]
    rows = [
        {
            "date": k[0], "open": float(k[1]), "close": float(k[2]),
            "high": float(k[3]), "low": float(k[4]), "amt": float(k[6]),
        }
        for k in kl
    ]
    base = next(r for r in rows if r["date"] == "2025-10-31")["close"]  # 窗口前收盘

    daily = []
    prev = base
    for r in rows:
        if not (WIN_START <= r["date"] <= WIN_END):
            continue
        daily.append({
            "date": r["date"],
            "close": r["close"],
            "chg": round((r["close"] / prev - 1) * 100, 2),
            "amount": r["amt"],
        })
        prev = r["close"]
    assert len(daily) == 242, f"expected 242 trading days, got {len(daily)}"

    closes = {d["date"]: d["close"] for d in daily}
    by_date = {d["date"]: d for d in daily}

    # ---- 统计摘要 ----
    hi = max(daily, key=lambda d: d["close"])
    lo = min(daily, key=lambda d: d["close"])
    hi_intra = max(daily, key=lambda d: max(x["high"] for x in rows if x["date"] == d["date"]))
    lo_intra = min(daily, key=lambda d: min(x["low"] for x in rows if x["date"] == d["date"]))
    peak, mdd, mdd_pair = daily[0]["close"], 0.0, ("", "")
    pk_date = daily[0]["date"]
    for d in daily:
        if d["close"] > peak:
            peak, pk_date = d["close"], d["date"]
        dd = (d["close"] / peak - 1) * 100
        if dd < mdd:
            mdd, mdd_pair = dd, (pk_date, d["date"])
    ups = sum(1 for d in daily if d["chg"] > 0)
    downs = len(daily) - ups
    amax = max(daily, key=lambda d: d["amount"])
    amin = min(daily, key=lambda d: d["amount"])
    top_up = max(daily, key=lambda d: d["chg"])
    top_down = min(daily, key=lambda d: d["chg"])
    feb_days = [d for d in daily if d["date"].startswith("2026-02")]
    feb_top = max(feb_days, key=lambda d: d["close"])
    cum = (daily[-1]["close"] / base - 1) * 100

    summary = {
        "days": len(daily),
        "start": daily[0]["date"], "end": daily[-1]["date"],
        "base_close": base, "start_close": daily[0]["close"], "end_close": daily[-1]["close"],
        "chg_pct": round(cum, 2),
        "high_close": hi["close"], "high_close_date": hi["date"],
        "high_intra": max(x["high"] for x in rows if WIN_START <= x["date"] <= WIN_END),
        "high_intra_date": hi_intra["date"],
        "low_close": lo["close"], "low_close_date": lo["date"],
        "low_intra": min(x["low"] for x in rows if WIN_START <= x["date"] <= WIN_END),
        "low_intra_date": lo_intra["date"],
        "max_dd": round(mdd, 2), "max_dd_pair": list(mdd_pair),
        "up_days": ups, "down_days": downs,
        "max_amt": amax["amount"], "max_amt_date": amax["date"],
        "min_amt": amin["amount"], "min_amt_date": amin["date"],
        "top_up": top_up, "top_down": top_down,
    }

    # ---- 事件与日线对齐 ----
    events = []
    for e in EVENTS:
        if e["id"] == "febtop":
            e = {**e, "date": feb_top["date"], "chg": feb_top["chg"],
                 "note": f"2 月最高收盘 {feb_top['close']:.2f}"}
        d = by_date[e["date"]]
        events.append({
            **e,
            "year": int(e["date"][:4]),
            "chg": d["chg"] if e["chg"] is None else e["chg"],
            "close": d["close"],
            "sse": f"{(d['chg'] if e['chg'] is None else e['chg']):+.2f}%",
            "spx": "-",
        })
    ids = {e["id"] for e in events}
    assert ids == {x["id"] for x in EVENTS} and "febtop" in ids

    # ---- 三段窗口（叙事分章）----
    seg_defs = {"A": ("2025-11-03", "2026-02-28"), "B": ("2026-03-01", "2026-05-31"), "C": ("2026-06-01", "2026-11-02")}
    segs = {}
    for k, (s, t) in seg_defs.items():
        days = [d["date"] for d in daily if s <= d["date"] <= t]
        evs = [e["id"] for e in events if e["date"] in days]
        segs[k] = {"start": days[0], "end": days[-1], "count": len(days), "events": evs}

    market_base = {
        "meta": {
            "start": daily[0]["date"], "end": daily[-1]["date"],
            "source": "东方财富",
            "note": "上证指数日线收盘（前复权）；成交额为沪市口径；事件日期与涨跌幅同源",
        },
        "daily": daily,
        "events": events,
        "summary": summary,
        "segments": segs,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "market_base.json").write_text(
        json.dumps(market_base, ensure_ascii=False, indent=1), encoding="utf-8"
    )

    research = {
        "topic": "A股近一年（2025-11-03 至 2026-11-02）上证指数逐日走势与关键事件",
        "generated_at": "2026-11-03 00:30",
        "model_id": "manual-research",
        "nodes": [
            {
                "year": "基准", "title": "起点：2025-10-31 收盘 3976.52",
                "what": "2025 年沪指全年上涨 18.41%，收于 3968.80（12-31）；窗口以 10-31 收盘 3976.52 为涨跌幅基准。",
                "why": "近一年所有涨跌幅与累计收益均相对该基准计算。",
                "sources": [SOURCES["data"]],
            },
            {
                "year": "2025-11", "title": "11-21 外围惊吓 -2.45%",
                "what": "英伟达财报后美股 AI 获利回吐大跌，A股跳空低开破位，沪指收 3834.89。",
                "why": "本窗口第一次单日大跌，高位科技股集中回调的起点。",
                "sources": [SOURCES["mar23"], SOURCES["data"]],
            },
            {
                "year": "2026-01", "title": "开年 17 连阳，重返 4000",
                "what": "1 月 5 日首日 +1.38% 收 4023.42；开年一度 17 连阳，创 1990 年开市以来最长连阳。",
                "why": "AI 科技牛 + 增量资金，高盛建议高配中国股票。",
                "sources": [SOURCES["jan05"], SOURCES["jan17"]],
            },
            {
                "year": "2026-02", "title": "2 月最高收盘 " + f"{feb_top['close']:.2f}（{feb_top['date']}）",
                "what": "AI 主升浪延续，2 月收 4162.90 为全年最高月收盘。",
                "why": "本轮上行的月度高点。",
                "sources": [SOURCES["data"]],
            },
            {
                "year": "2026-03", "title": "3-23 黑色星期一 -3.63%",
                "what": "中东地缘冲突升级 + 美联储降息预期逆转，沪指收 3813.28，超 5200 只个股下跌，市值单日蒸发逾 4 万亿。",
                "why": "全年最大单日跌幅，风险偏好的分水岭。",
                "sources": [SOURCES["mar23"], SOURCES["data"]],
            },
            {
                "year": "2026-04", "title": "4-08 百点长阳 +2.70%",
                "what": "美伊停火预期升温，沪指收 3994.99 逼近 4000，创业板指涨近 6%；随后重回 4000。",
                "why": "全年最大单日涨幅，危机修复的样板。",
                "sources": [SOURCES["apr08"], SOURCES["apr08b"]],
            },
            {
                "year": "2026-05", "title": "5-13 年内最高收盘 4242.57",
                "what": "5 月 11 日站上 4200、科创 50 创历史新高；5-14 盘中高见 4258.86。",
                "why": "全年顶点。",
                "sources": [SOURCES["may11"], SOURCES["data"]],
            },
            {
                "year": "2026-06", "title": "6-22 天量 3.76 万亿",
                "what": "全市场单日成交 3.76 万亿（历史第二高），沪指 +1.78% 收 4163.10，创业板再创新高。",
                "why": "上半年『天量成交』标签的顶点；沪市口径成交 1.70 万亿。",
                "sources": [SOURCES["jun22"], SOURCES["data"]],
            },
            {
                "year": "2026-07", "title": "7-17 科技股踩踏 -3.05%",
                "what": "近 200 只个股跌停、市值蒸发逾 4.5 万亿、成交 2.67 万亿；7-21 V 形反转。",
                "why": "全年第二次单日跌超 3%，高位题材流动性冲击。",
                "sources": [SOURCES["jul17"], SOURCES["data"]],
            },
            {
                "year": "2026-10", "title": "10 月缩量探底，10-30 收 3599.02",
                "what": "先后失守 3800/3700/3600；10-23 盘中 3574.27 为全年最低；创业板指单月跌超 23%，沪深 300 十二周连跌。",
                "why": "加息预期升温 + 三季报验证 + 美股拖累的集中释放。",
                "sources": [SOURCES["oct30"], SOURCES["oct23"], SOURCES["data"]],
            },
            {
                "year": "2026-11", "title": "11-02 放量反弹 +1.08%",
                "what": "沪指收 3638.03，沪市成交 8475 亿元较前一日明显放量。",
                "why": "超跌后的修复起点，也是本片的时间终点。",
                "sources": [SOURCES["data"]],
            },
        ],
    }
    (OUT_DIR / "research.json").write_text(
        json.dumps(research, ensure_ascii=False, indent=1), encoding="utf-8"
    )

    print("== summary ==")
    print(json.dumps(summary, ensure_ascii=False, indent=1))
    print("== events ==")
    for e in events:
        print(f"{e['date']}  {e['chg']:+.2f}%  close {e['close']:.2f}  [{e['id']}] {e['title']}")
    print("== segments ==")
    print(json.dumps(segs, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    sys.exit(main())
