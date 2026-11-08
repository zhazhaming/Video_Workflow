# -*- coding: utf-8 -*-
"""近 3 年 A 股 vs 美股 日线行情数据生成器（东方财富接口）。

产出 market.json（MarketData 契约）：
- points：并集交易日历（任一市场开盘即保留），缺侧按前收盘填充；窗口首点 = 100 归一化
- monthly：完整自然月的月度涨跌（首月用窗口前的月末收盘作基期）
- annual：完整年度涨跌 + 最新一年 YTD
- events：6 个事件卡（文案人工定稿，数字由脚本重算核对）

用法：python -I fetch_market_daily.py <输出路径>
"""
import json
import ssl
import sys
import time
import urllib.request
from collections import OrderedDict

BEG = "20231020"          # 略早于窗口，用于首个月度条形的基期（2023-10-31）
WINDOW_START = "2023-11-01"
END = "2026-11-02"        # 数据截止（ pinned，保证可复现）
FETCH_END = "20261104"

SECIDS = {
    "sse": "1.000001",    # 上证指数
    "spx": "100.SPX",     # 标普500
}

# 事件卡定稿文案（% 数字会被下方 CHECK 重算核对，漂移 > 1.5pp 打 WARN）
EVENTS = [
    {
        "id": "cn2024q1", "year": 2024, "date": "2024-02-05",
        "title": "微盘股危机", "short": "踩踏",
        "cause": "雪球敲入 + 量化踩踏 → 中央汇金增持，2 月 V 型修复",
        "sse": "-11%", "spx": "+14%",
        "sseDetail": "3032 → 2702（2/5）", "spxDetail": "4595 → 5254",
        "note": "同窗口美股 +14%，极致分化",
        "check": {"sse": ("start_to_trough", -11.0), "spx": ("start_to_end", 14.4)},
    },
    {
        "id": "carry2024", "year": 2024, "date": "2024-08-05",
        "title": "全球套息平仓", "short": "黑色星期一",
        "cause": "日央行加息 → 日元套息交易平仓 → 全球风险资产急跌",
        "sse": "-5%", "spx": "-8%",
        "sseDetail": "2976 → 2842（8/29）", "spxDetail": "5667 → 5186（8/5）",
        "note": "8/5 标普单日 -3%，日经 -12%",
        "check": {"sse": ("start_to_end", -4.5), "spx": ("start_to_trough", -8.5)},
    },
    {
        "id": "cn924", "year": 2024, "date": "2024-09-24",
        "title": "924 政策组合拳", "short": "暴涨",
        "cause": "降准降息 + 互换便利 + 回购增持再贷款 → 风险偏好骤升",
        "sse": "+29%", "spx": "+3%",
        "sseDetail": "2704 → 3490（10/8）", "spxDetail": "5648 → 5841",
        "note": "9/30 单日 +8.1%，10/8 冲高回落",
        "check": {"sse": ("trough_to_peak", 29.1), "spx": ("start_to_end", 3.4)},
    },
    {
        "id": "tariff2025", "year": 2025, "date": "2025-04-07",
        "title": "对等关税冲击", "short": "暴跌",
        "cause": "4/2 对等关税 → 全球急跌 → 4/9 暂停 90 天 → V 型反弹",
        "sse": "-8%", "spx": "-19%",
        "sseDetail": "3352 → 3097（4/7）", "spxDetail": "6144 → 4983（4/8）",
        "note": "4/9 标普单日 +9.5%，5/12 日内瓦缓和",
        "check": {"sse": ("start_to_trough", -7.6), "spx": ("start_to_trough", -18.9)},
    },
    {
        "id": "oil2026", "year": 2026, "date": "2026-03-23",
        "title": "霍尔木兹危机", "short": "油价冲击",
        "cause": "美伊冲突 → 油运受阻、油价破 100 → 全球风险资产回调",
        "sse": "-7%", "spx": "-8%",
        "sseDetail": "4082 → 3813（3/23）", "spxDetail": "6910 → 6344（3/30）",
        "note": "4 月降级反弹，5/1 标普新高 7230",
        "check": {"sse": ("start_to_trough", -6.6), "spx": ("start_to_trough", -8.2)},
    },
    {
        "id": "cn2026top", "year": 2026, "date": "2026-07-17",
        "title": "冲高回落", "short": "出清",
        "cause": "科技股拥挤交易 → 7/17 双创跌超 7% → 缩量阴跌破 3600",
        "sse": "-15%", "spx": "+8%",
        "sseDetail": "4242 → 3599（10/30）", "spxDetail": "高点 7819（10/6）",
        "note": "同窗口标普创历史新高",
        "check": {"sse": ("start_to_trough", -15.2), "spx": ("trough_to_peak", 7.6)},
    },
]


def fetch_kline(secid: str) -> OrderedDict:
    url = (
        "https://push2his.eastmoney.com/api/qt/stock/kline/get"
        f"?secid={secid}&klt=101&fqt=1&beg={BEG}&end={FETCH_END}"
        "&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f53&lmt=100000"
    )
    last_err = None
    for i in range(4):
        try:
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                    "Referer": "https://quote.eastmoney.com/",
                },
            )
            ctx = ssl.create_default_context()
            with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
                data = json.load(resp)
            kl = data["data"]["klines"]
            out: OrderedDict = OrderedDict()
            for row in kl:
                d, close = row.split(",")
                out[d] = float(close)
            return out
        except Exception as e:  # noqa: BLE001
            last_err = e
            time.sleep(1.5 * (i + 1))
    raise RuntimeError(f"fetch {secid} failed: {last_err}")


def main() -> None:
    out_path = sys.argv[1] if len(sys.argv) > 1 else "market_daily.json"
    raw = {k: fetch_kline(v) for k, v in SECIDS.items()}

    # 并集交易日历（窗口内），缺侧前收盘填充
    dates = [d for d in sorted(set(raw["sse"]) | set(raw["spx"])) if WINDOW_START <= d <= END]
    assert dates[0] == WINDOW_START and dates[-1] == END, f"窗口异常: {dates[0]}..{dates[-1]}"

    prev = {k: max(d for d in s if d < WINDOW_START) for k, s in raw.items()}
    points = []
    for d in dates:
        for k in raw:
            if d in raw[k]:
                prev[k] = d
        sse = raw["sse"][prev["sse"]]
        spx = raw["spx"][prev["spx"]]
        points.append({"date": d, "sse": sse, "spx": spx})
    base_sse, base_spx = points[0]["sse"], points[0]["spx"]
    for p in points:
        p["sseN"] = round(p["sse"] / base_sse * 100, 2)
        p["spxN"] = round(p["spx"] / base_spx * 100, 2)

    # 月度涨跌（完整自然月，两市场均有月末收盘；最后一个残月丢弃）
    def month_last(series: OrderedDict) -> "OrderedDict[str, tuple[str, float]]":
        out: "OrderedDict[str, tuple[str, float]]" = OrderedDict()
        for d, v in series.items():
            out[d[:7]] = (d, v)
        return out

    ml_sse, ml_spx = month_last(raw["sse"]), month_last(raw["spx"])
    months_all = sorted(set(ml_sse) & set(ml_spx))  # 含基期月 2023-10
    months = [m for m in months_all if WINDOW_START[:7] <= m < "2026-11"]  # 丢残月 2026-11
    monthly = []
    for m in months:
        i = months_all.index(m)
        if i == 0:
            continue
        m_prev = months_all[i - 1]
        r_sse = (ml_sse[m][1] / ml_sse[m_prev][1] - 1) * 100
        r_spx = (ml_spx[m][1] / ml_spx[m_prev][1] - 1) * 100
        monthly.append({"month": m, "sseRet": round(r_sse, 1), "spxRet": round(r_spx, 1)})

    # 年度涨跌（完整年）+ 最新一年 YTD；基期取 ≤ 锚点日的最后一个交易日
    def last_on_or_before(series: OrderedDict, anchor: str) -> str:
        cands = [d for d in series if d <= anchor]
        return max(cands)

    annual = []
    for y in (2024, 2025):
        d0, d1 = last_on_or_before(raw["sse"], f"{y - 1}-12-31"), last_on_or_before(raw["sse"], f"{y}-12-31")
        sse_r = (raw["sse"][d1] / raw["sse"][d0] - 1) * 100
        spx_r = (raw["spx"][last_on_or_before(raw["spx"], f"{y}-12-31")]
                 / raw["spx"][last_on_or_before(raw["spx"], f"{y - 1}-12-31")] - 1) * 100
        annual.append({"year": y, "sseRet": round(sse_r, 1), "spxRet": round(spx_r, 1)})
    d_ytd0 = last_on_or_before(raw["sse"], "2025-12-31")
    annual.append({
        "year": 2026,
        "sseRet": round((raw["sse"][END] / raw["sse"][d_ytd0] - 1) * 100, 1),
        "spxRet": round((raw["spx"][END] / raw["spx"][last_on_or_before(raw["spx"], "2025-12-31")] - 1) * 100, 1),
    })

    # 事件卡数字核对（窗口与 director.json 的 zoom start/end 一致）
    print("== 事件卡核对（stated vs computed）==")
    WINDOWS = {
        "cn2024q1": ("2023-12-01", "2024-03-29"),
        "carry2024": ("2024-07-16", "2024-08-30"),
        "cn924": ("2024-09-02", "2024-10-17"),
        "tariff2025": ("2025-02-19", "2025-05-30"),
        "oil2026": ("2026-02-20", "2026-04-30"),
        "cn2026top": ("2026-05-13", "2026-10-30"),
    }
    for ev in EVENTS:
        w0, w1 = WINDOWS[ev["id"]]
        for key, (mode, stated) in ev["check"].items():
            ser = OrderedDict((p["date"], p[key]) for p in points if w0 <= p["date"] <= w1)
            ds = sorted(ser)
            sv, ev_v = ser[ds[0]], ser[ds[-1]]
            lo_d = min(ds, key=lambda d: ser[d])
            hi_d = max(ds, key=lambda d: ser[d])
            if mode == "start_to_trough":
                comp = (ser[lo_d] / sv - 1) * 100
            elif mode == "trough_to_peak":
                comp = (ser[hi_d] / ser[lo_d] - 1) * 100
            else:
                comp = (ev_v / sv - 1) * 100
            flag = "OK " if abs(comp - stated) <= 1.5 else "WARN"
            print(f"  [{flag}] {ev['id']}.{key} stated={stated:+.1f} computed={comp:+.1f}")

    sse_cum = points[-1]["sseN"] - 100
    spx_cum = points[-1]["spxN"] - 100
    import datetime as _dt
    d0 = _dt.date.fromisoformat(points[0]["date"])
    d1 = _dt.date.fromisoformat(points[-1]["date"])
    years = (d1 - d0).days / 365.25
    sse_cagr = ((points[-1]["sseN"] / 100) ** (1 / years) - 1) * 100
    spx_cagr = ((points[-1]["spxN"] / 100) ** (1 / years) - 1) * 100

    payload = {
        "meta": {
            "start": points[0]["date"],
            "end": points[-1]["date"],
            "source": "东方财富（East Money）行情日 K",
            "note": "每日收盘价，缺失交易日按前收盘填充",
        },
        "points": points,
        "annual": annual,
        "monthly": monthly,
        "events": [{k: v for k, v in ev.items() if k != "check"} for ev in EVENTS],
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=1)

    print(f"\npoints={len(points)} ({points[0]['date']} → {points[-1]['date']})")
    print(f"monthly bars={len(monthly)} ({monthly[0]['month']} → {monthly[-1]['month']})")
    print(f"annual={annual}")
    print(f"累计：SSE {sse_cum:+.1f}% (CAGR {sse_cagr:+.1f}%) | SPX {spx_cum:+.1f}% (CAGR {spx_cagr:+.1f}%)")
    print(f"written: {out_path}")


if __name__ == "__main__":
    main()
