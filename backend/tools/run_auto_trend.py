# -*- coding: utf-8 -*-
"""《油车，输了吗？》抖音竖屏科普片 · 一键驱动（AutoTrendVibe）。

流水线：story.json + research.json → 逐镜 edge-tts 实测 → 拍点锁镜 → 旁白整轨预混
→ props.json → Remotion 渲染 → 封面 / QA 抽帧 / 音频体检 → 发布文案。

用法：
    python -X utf8 tools/run_auto_trend.py                  # 全流程（含整片渲染）
    python -X utf8 tools/run_auto_trend.py --no-render       # 只组装 props + 自检（不渲染）
    python -X utf8 tools/run_auto_trend.py --preview         # props + QA 抽帧 + 前 10s 预览
    python -X utf8 tools/run_auto_trend.py --reuse-voice     # 复用文案未变时的已有配音
    python -X utf8 tools/run_auto_trend.py --research <path> # 换数据源（联调用；正式用默认）
    python -X utf8 tools/run_auto_trend.py --qa-audio        # 整片后额外实测 BGM 口播闪避

输入（只读，每轮热读，不缓存）：
    storage/projects/auto-market-trend/story.json     镜头文案（Lead 维护）
    storage/projects/auto-market-trend/research.json  真实数据（data-scout 产出）

纪律：
- 文案不写死在本文件里，一律从 story.json 读；
- payload 里出现的每个数字只能来自 research.json（self_check 做数字溯源审计）；
- 确定性渲染：时间轴只由实测配音时长 + BGM 拍点决定。

契约：Remotion 组合 AutoTrendVibe（1080×1920@30），源码 src/vibe-auto/（viz-builder 负责）。
模板判定：from_scratch（车市数据科普与行星/宇宙模板域无关，画面全部自绘）。
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
import tempfile
import time
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent  # backend/
sys.path.insert(0, str(ROOT))

from app.config import (  # noqa: E402
    FFMPEG_BIN,
    REMOTION_DIR,
    REMOTION_PUBLIC,
    RENDERS_DIR,
    STORAGE_DIR,
)
from app.schemas import Line, ScriptDraft, Shot  # noqa: E402
from app.services import beat, voice  # noqa: E402

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ---------------- 常量 ----------------
PID = "auto-market-trend"
FPS = 30
VOICE_NAME = "zh-CN-YunjianNeural"
RATE = "+12%"
COMPOSITION = "AutoTrendVibe"
BGM_NAME = "vibe_we_never.mp3"  # 本系列同款；缺失回退 uplifting
BGM_FALLBACK = "uplifting.mp3"
BGM_VOLUME = 0.62
NARRATION_PEAK = 0.92  # 旁白整轨归一峰值（验收 ≤0.95）

# 时间轴参数（可被 --lead/--tail/--min-shot 覆盖）
# 本片 12 镜口播合计约 46s。验收窗口：brief §5 为 70~80s，Lead 要求 64~72s；
# 取交集 70~72s —— 所以给足「口播 + 构图留白」（数据片需要读图时间），靠 MIN_SHOT 兜短镜。
# 注意：不要靠加长纯静音拉时长，留白必须落在动效收尾（odometer/曲线/印章落章）上。
LEAD = 0.35  # 每镜开头留白（旁白起点）
TAIL = 1.00  # 旁白结束后到切镜的余量
MIN_SHOT = 5.90  # 最短镜长（秒）
TARGET_SEC = (70.0, 80.0)  # 验收窗口（brief §5 / tools/qa_auto_trend.py / Lead 23:29 确认）
LEAD_TARGET_SEC = (70.0, 80.0)  # Lead 最终确认同窗口（此前口头 64~72 已作废）
PREVIEW_FRAMES = (0, 359)  # 前 12 秒（Lead 23:40 要求 12s 预览）

PROJECT_DIR = STORAGE_DIR / "projects" / PID
STORY_PATH = PROJECT_DIR / "story.json"
RESEARCH_PATH = PROJECT_DIR / "research.json"
VIDEO_DIR = RENDERS_DIR / PID
FFPROBE = FFMPEG_BIN.with_name("ffprobe.exe")

KINDS = (
    "cover",
    "split",
    "trend",
    "steps",
    "cross",
    "year2025",
    "reasons",
    "bars",
    "stock",
    "cost",
    "outlook",
    "outro",
)
ENTERS = ("zoom", "bounce", "slideUp", "slideLeft", "slideRight", "whip", "flip", "pop")
EXITS = ("up", "down", "left", "right", "zoomOut", "none")
CAMS = ("pushIn", "pushSlow", "pullOut", "panLeft", "panRight", "rock", "whipR", "hold")
ICONS = (
    "tax",
    "oil",
    "price",
    "plug",
    "winter",
    "trip",
    "resale",
    "insurance",
    "battery",
    "charge",
)

DEFAULT_CALIBER_NOTE = "乘联分会（CPCA）· 新能源乘用车国内零售口径"

_NUM_RE = re.compile(r"-?\d+(?:\.\d+)?")


# ---------------- 小工具 ----------------
def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")


def _pick(d, *names, default=None):
    """容错取字段：research.json 键名可能有细微差异。"""
    if not isinstance(d, dict):
        return default
    for n in names:
        if n in d:
            v = d[n]
            if v not in (None, "", [], {}):
                return v
    return default


def _num(v):
    if v is None or isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return float(v)
    m = _NUM_RE.search(str(v).replace(",", ""))
    return float(m.group()) if m else None


def num(v: float, digits: int = 2) -> str:
    """数字转字符串：最多 digits 位小数，去掉无意义的尾零（5.8 → "5.8"，53.94 → "53.94"）。"""
    s = f"{float(v):.{digits}f}"
    if "." in s:
        s = s.rstrip("0").rstrip(".")
    return s


def pct(v: float, digits: int = 1) -> str:
    return f"{v:.{digits}f}%"


def short_month(label) -> str:
    """'2026年10月' / '2026-10' → '2026.10'。"""
    if label is None:
        return ""
    s = str(label).strip()
    m = re.search(r"(\d{4})\D{0,3}(\d{1,2})(?!\d)", s)
    if m:
        return f"{m.group(1)}.{int(m.group(2)):02d}"
    return s


def signed_pct(v: float) -> str:
    return f"{'+' if v >= 0 else ''}{num(v)}%"


def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


# ---------------- 读 story.json ----------------
def load_story(path: Path) -> dict:
    if not path.exists():
        raise SystemExit(
            f"缺少剧本文件：{path}\n"
            "（文案由 Lead 维护；runner 每次热读、不缓存，不把文案写死在代码里）"
        )
    data = read_json(path)
    slides_raw = data.get("slides") if isinstance(data, dict) else data
    meta = {
        "title": str((data.get("title") if isinstance(data, dict) else "") or "油车，输了吗？"),
        "brand": str((data.get("brand") if isinstance(data, dict) else "") or "VIBE 知识大赏"),
        "tag": str((data.get("tag") if isinstance(data, dict) else "") or "// DATA LAB"),
        "caliber": str((data.get("caliber") if isinstance(data, dict) else "") or ""),
        "voice": str((data.get("voice") if isinstance(data, dict) else "") or VOICE_NAME),
        "rate": str((data.get("rate") if isinstance(data, dict) else "") or RATE),
    }
    if not isinstance(slides_raw, list) or not slides_raw:
        raise SystemExit(f"{path} 里没有 slides 数组")
    slides: list[dict] = []
    problems: list[str] = []
    for i, s in enumerate(slides_raw):
        sid = s.get("id") or f"slide{i + 1:02d}"
        kind = s.get("kind")
        if kind not in KINDS:
            problems.append(f"第 {i + 1} 镜 {sid} 的 kind={kind!r} 不在契约内（{', '.join(KINDS)}）")
            continue
        narration = (s.get("narration") or s.get("caption") or "").strip()
        if not narration:
            problems.append(f"第 {i + 1} 镜 {sid} 缺 narration（TTS 用）")
        ttl = s.get("title")
        if isinstance(ttl, str):
            ttl = [ttl]
        if not ttl:
            problems.append(f"第 {i + 1} 镜 {sid} 缺 title")
            ttl = [""]
        slides.append(
            {
                "id": str(sid),
                "kind": kind,
                "kicker": s.get("kicker") or "",
                "title": [str(t) for t in ttl][:2],
                "sub": s.get("sub") or "",
                "accent": s.get("accent") or "#0E9F6E",
                "narration": narration,
                "emphasis": [str(e) for e in (s.get("emphasis") or [])],
                "enter": s.get("enter") if s.get("enter") in ENTERS else "slideUp",
                "exit": s.get("exit") if s.get("exit") in EXITS else "up",
                "cam": s.get("cam") if s.get("cam") in CAMS else "pushSlow",
                "flash": bool(s.get("flash", False)),
                "payload_override": s.get("payload") if isinstance(s.get("payload"), dict) else None,
            }
        )
    if problems:
        raise SystemExit("story.json 校验失败：\n- " + "\n- ".join(problems))
    meta["slides"] = slides
    return meta


# ---------------- 读 research.json（数字唯一来源） ----------------
def research_view(raw: dict) -> dict:
    """把 research.json 归一成 runner 内部视图；缺字段只告警不崩。"""
    R: dict = {"warnings": [], "raw": raw}
    yearly_raw = _pick(raw, "yearly", "years", "annual", "year_data") or []
    yearly: list[dict] = []
    for row in yearly_raw:
        year = _pick(row, "year", "y", "label")
        ev = _num(
            _pick(row, "ev_penetration", "nev_penetration", "penetration", "ev_pct", "ev_share", "ev")
        )
        if year is None or ev is None:
            R["warnings"].append(f"yearly 行缺 year/ev_penetration，已跳过：{row}")
            continue
        yearly.append(
            {
                "year": str(year),
                "ev": ev,
                "fuel": _num(_pick(row, "fuel_penetration", "ice_penetration", "fuel_pct", "fuel")),
                "ev_wan": _num(_pick(row, "ev_retail_wan", "nev_retail_wan", "ev_sales_wan", "ev_retail")),
                "total_wan": _num(
                    _pick(row, "total_retail_wan", "total_sales_wan", "total_wan", "total_retail")
                ),
                "yoy": _num(_pick(row, "total_yoy", "yoy", "yoy_pct", "total_retail_yoy")),
                "note": str(_pick(row, "note") or ""),
            }
        )
    yearly.sort(key=lambda r: r["year"])
    if not yearly:
        R["warnings"].append("research.json 缺少 yearly 数组——趋势/台阶/条形镜会没有数据")
    R["yearly"] = yearly
    R["first"] = yearly[0] if yearly else None
    R["last"] = yearly[-1] if yearly else None

    latest_raw = _pick(raw, "latest", "latest_month", "current") or {}
    R["latest"] = {
        "month": str(_pick(latest_raw, "month", "label", "period") or ""),
        "ev": _num(_pick(latest_raw, "ev_penetration", "penetration", "ev", "value")),
        "note": _pick(latest_raw, "note", "caliber") or "",
    }
    if R["latest"]["ev"] is None:
        R["warnings"].append("research.json 缺 latest.ev_penetration——最新值镜回退用最后年度值")

    ms_raw = _pick(raw, "milestone_50pct", "milestone", "first_majority") or {}
    R["milestone"] = {
        "month": str(_pick(ms_raw, "month", "label", "period") or ""),
        "value": _num(_pick(ms_raw, "value", "ev_penetration", "penetration")),
        "note": _pick(ms_raw, "note") or "",
    }

    stock_raw = _pick(raw, "stock", "ownership", "parc") or {}
    R["stock"] = {
        "total_wan": _num(_pick(stock_raw, "total_vehicles_wan", "total_wan", "cars_wan", "total")),
        "nev_wan": _num(_pick(stock_raw, "nev_wan", "nev", "new_energy_wan")),
        "share": _num(
            _pick(stock_raw, "nev_share_pct", "nev_share", "share_pct", "share", "nev_ratio")
        ),
        "as_of": str(_pick(stock_raw, "as_of", "date", "period") or ""),
    }

    # 年初至今（缩量数据）：research 可能给结构化 ytd，也可能只写在 latest.note 里
    ytd_raw = _pick(raw, "ytd", "cumulative", "ytd_retail", "latest_ytd", "year_to_date") or {}
    ytd = {
        "period": str(_pick(ytd_raw, "period", "label", "month", "range") or ""),
        # 乘用车累计零售（缩量数据）+ 新能源累计零售（可选）
        "wan": _num(_pick(ytd_raw, "ev_retail_wan", "retail_wan", "value", "wan")),
        "yoy": _num(_pick(ytd_raw, "yoy_pct", "yoy", "change_pct")),
        "nev_wan": _num(_pick(ytd_raw, "nev_retail_wan", "nev_wan", "new_energy_wan")),
        "nev_yoy": _num(_pick(ytd_raw, "nev_yoy_pct", "nev_yoy")),
    }
    if ytd["wan"] is None:
        # 从 latest.note 里抠「1-10月累计零售1502.7万辆（-22%）」——这样仍是 research 原文数字
        note = str(R["latest"].get("note") or "")
        m = re.search(
            r"(\d{1,2})\s*[-—~]\s*(\d{1,2})\s*月累计零售\s*([\d.]+)\s*万辆[（(]([-+]?[\d.]+)%[）)]",
            note,
        )
        if m:
            year = short_month(R["latest"]["month"])[:4] or "2026"
            ytd = {
                "period": f"{year}年{int(m.group(1))}—{int(m.group(2))}月",
                "wan": float(m.group(3)),
                "yoy": float(m.group(4)),
            }
            print(
                f"[info] research 无结构化 ytd，已用正则从 latest.note 解析："
                f"{ytd['period']} {ytd['wan']} 万辆（{ytd['yoy']}%）",
                flush=True,
            )
    R["ytd"] = ytd

    # ---------- 卡片（reasons / cost）----------
    # research 的形态是 id + fact（长句）+ usable_on_screen（上屏短句），没有 num 字段。
    # 角标数字一律从对应 research 行的 fact 里正则提取，括号里是该行的 source_ids（可回溯 facts.md）。
    CARD_SPECS = {
        "reasons": [
            # reason_price_war（S18 秦PLUS 价格 / S34 价格战语境）：7.98 万元起
            ("reason_price_war", r"([\d]+(?:\.\d+)?)\s*万元", "万元起", "last", "price", "on_screen"),
            # reason_oil_price（S15/S16/S17）：92# 8.6—8.7 元/升
            ("reason_oil_price", r"([\d]+(?:\.\d+)?)\s*[—\-~]\s*[\d.]+\s*元/升", "元/升", "first", "oil", "on_screen"),
            # cost_charging（S40/S41）：全国充电枪 2477.7 万个 —— 用作「充电更方便」的原因
            ("cost_charging", r"([\d]+(?:\.\d+)?)\s*万个", "万个枪", "first", "plug", "fact"),
        ],
        "cost": [
            # cost_insurance（S35/S36/S37）：同价位电车保费约为油车 1.7 倍
            ("cost_insurance", r"保费[^。；]*?([\d]+(?:\.\d+)?)\s*倍", "倍", "first", "insurance", "on_screen"),
            # cost_battery_warranty（S38/S39）：260 万辆年底脱保（single-source 照用）
            ("cost_battery_warranty", r"([\d]+(?:\.\d+)?)\s*万辆", "万辆", "first", "battery", "on_screen"),
            # cost_charging（S40/S41）：私人桩占比约 79%
            ("cost_charging", r"占比约\s*([\d]+(?:\.\d+)?)\s*%", "%", "first", "charge", "on_screen"),
        ],
    }
    ID_ICON = {
        "reason_tax": "tax",
        "reason_oil_price": "oil",
        "reason_price_war": "price",
        "cost_insurance": "insurance",
        "cost_battery_warranty": "battery",
        "cost_charging": "charge",
        "cost_resale": "resale",
    }
    rows_by_id: dict[str, dict] = {}
    for bucket in ("reasons", "cost", "outlook", "outlook_reasons"):
        for row in _pick(raw, bucket) or []:
            if isinstance(row, dict):
                rid = str(_pick(row, "id", "key", "slug") or "")
                if rid:
                    rows_by_id[rid] = row

    def _short_fact(fact: str, limit: int = 44) -> str:
        text = str(fact or "").strip()
        for sep in ("：", "。", "；"):
            head = text.split(sep)[0]
            if 6 <= len(head) <= limit:
                return head
        return text[:limit]

    def _mk_card(spec) -> dict:
        rid, stat_re, unit, mode, fallback_icon, text_pref = spec
        row = rows_by_id.get(rid) or {}
        fact = str(_pick(row, "fact", "detail", "desc", "text", "body") or "")
        on_screen = str(_pick(row, "usable_on_screen", "on_screen", "screen", "caption") or "")
        text = _short_fact(fact) if text_pref == "fact" else (on_screen or _short_fact(fact))
        # 文案级修正（Lead 23:40）：数字/时间仍取自同一行 fact
        if rid == "reason_price_war":
            m = re.search(r"(\d{4})\s*年\s*(\d{1,2})\s*月", fact)
            if m:
                text = f"{m.group(1)}.{int(m.group(2)):02d} 秦PLUS 荣耀版起售"
        elif rid == "cost_charging" and text_pref == "fact":
            m = re.search(r"公共充电设施（枪）([\d.]+)万个，同比增长([\d.]+)%", fact)
            if m:
                text = f"公共充电枪 {m.group(1)} 万个，同比 +{m.group(2)}%"
        raw_title = str(_pick(row, "title", "name", "label") or "")
        title = raw_title.split("：")[0].strip() if "：" in raw_title else raw_title
        icon = str(_pick(row, "icon", "type") or ID_ICON.get(rid) or fallback_icon)
        if icon not in ICONS:
            icon = fallback_icon
        card = {"title": title, "text": text, "icon": icon}
        nv = _pick(row, "num", "value", "stat")
        unit2 = _pick(row, "numUnit", "unit", "suffix")
        if nv is None:
            hits = re.findall(stat_re, fact)
            if hits:
                nv = hits[-1] if mode == "last" else hits[0]
                unit2 = unit2 or unit
        n2 = _num(nv)
        if n2 is not None:
            card["num"] = num(n2)
        if unit2:
            card["numUnit"] = str(unit2)
        card["_research_id"] = rid
        card["_status"] = str(_pick(row, "status") or "")
        return card

    R["reasons"] = [_mk_card(sp) for sp in CARD_SPECS["reasons"]]
    R["cost"] = [_mk_card(sp) for sp in CARD_SPECS["cost"]]
    R["outlook"] = [
        _mk_card((rid, r"^$", "", "first", icon, "on_screen"))
        for rid, icon in (
            ("outlook_oil_parc", "trip"),
            ("outlook_oil_energy", "oil"),
            ("outlook_oil_resale", "resale"),
            ("outlook_ev_new_car", "battery"),
            ("outlook_ev_home_charge", "charge"),
            ("outlook_ev_winter", "winter"),
        )
        if rid in rows_by_id
    ]

    # ---------- 出处 / 口径措辞 ----------
    caliber_raw = _pick(raw, "caliber", "caliber_note", "note")
    if isinstance(caliber_raw, dict):
        R["note"] = str(_pick(caliber_raw, "note", "primary", "name") or DEFAULT_CALIBER_NOTE)
    else:
        R["note"] = str(caliber_raw or DEFAULT_CALIBER_NOTE)
    R["source"] = "乘联分会（CPCA）"
    # 页脚署名：只用机构名（媒体名太多，放 facts.md）
    explicit_footer = _pick(raw, "attribution", "footer", "source_label")
    if explicit_footer:
        R["footer"] = str(explicit_footer)
    else:
        parts = ["乘联分会（CPCA）"]
        cal = _pick(raw, "caliber") or {}
        if isinstance(cal, dict):
            for sec in _pick(cal, "secondary") or []:
                sec_name = str(_pick(sec, "name") or "")
                if "公安部" in sec_name:
                    parts.append("公安部交管局")
        R["footer"] = " · ".join(parts)
    return R


def _base_payload(R: dict, kind: str = "") -> dict:
    # source 置空：SourceTag 渲染 [source, note].join(" · ")，短注脚里已含来源名，避免重复
    return {"note": _note_for(kind, R), "source": ""}


def _pin_month(label) -> str:
    """'2024年7月' → '2024.7'（只比较年月，便于和 yearly 的年份对齐）。"""
    s = short_month(label)
    m = re.fullmatch(r"(\d{4})\.(\d{2})", s)
    if m:
        return f"{m.group(1)}.{int(m.group(2))}"
    m = re.fullmatch(r"(\d{4})", s)
    return m.group(1) if m else s


def _latest_ev(R: dict) -> float | None:
    if R["latest"]["ev"] is not None:
        return R["latest"]["ev"]
    if R["last"] is not None:
        return R["last"]["ev"]
    return None


def _points(R: dict, milestone_point: bool = False) -> list[dict]:
    """折线点：年度点（含 2020 起点）+ 最新单月点。

    milestone_point=True（cross 镜用）：把里程碑所在「年」的年度点替换成里程碑单月点
    （2024 → 2024.07 / 51.1%），这样交叉虚线与印章落在同一个刻度上（与 viz 的 pointsCross 一致）。
    label 一律是「数值」（如 "51.1%" / "67.8%"），viz 会画在点上方做角标。
    """
    pts: list[dict] = []
    ms = R["milestone"]
    ms_month = short_month(ms["month"])
    ms_year = ms_month[:4]
    for y in R["yearly"]:
        if milestone_point and ms["value"] is not None and ms_year and str(y["year"]) == ms_year:
            pts.append(
                {
                    "year": ms_month,
                    "ev": evv(ms["value"]),
                    "major": True,
                    "label": f"{num(evv(ms['value']))}%",
                }
            )
            continue
        p = {"year": y["year"], "ev": evv(y["ev"])}
        if y["fuel"] is not None:
            p["fuel"] = round(y["fuel"], 1)
        pts.append(p)
    latest = R["latest"]
    if latest["ev"] is not None:
        label = short_month(latest["month"]) or "最新"
        if not any(p["year"] == label for p in pts):
            pts.append(
                {
                    "year": label,
                    "ev": evv(latest["ev"]),
                    "major": True,
                    "label": f"{num(evv(latest['ev']))}%",
                }
            )
    return pts


def _wan_or_yi(v: float) -> tuple[str, str]:
    """万辆级数字：≥1 亿辆改用「亿辆」读起来不吓人（37100 万辆 → 3.71 亿辆）。"""
    if v >= 10000:
        return num(v / 10000), "亿辆"
    return num(v), "万辆"


def evv(v: float) -> float:
    """渗透率显示统一 1 位小数（53.94 → 53.9），避免同片出现两种精度。"""
    return float(round(float(v), 1))


def period_short(label) -> str:
    """'2026年1—10月' → '2026.01-10'（用于 SourceTag 的短注脚）。"""
    s = str(label or "")
    m = re.search(r"(\d{4})\D{0,3}(\d{1,2})\D{1,3}(\d{1,2})", s)
    if m:
        return f"{m.group(1)}.{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    m = re.search(r"(\d{4})\D{0,3}(\d{1,2})", s)
    if m:
        return f"{m.group(1)}.{int(m.group(2)):02d}"
    return short_month(s)


def period_label(label) -> str:
    """'2026年1—10月' → '2026 年 1-10 月'（用于大数字的 label）。"""
    s = str(label or "")
    m = re.search(r"(\d{4})\D{0,3}(\d{1,2})\D{1,3}(\d{1,2})", s)
    if m:
        return f"{m.group(1)} 年 {int(m.group(2))}-{int(m.group(3))} 月"
    return s


def month_cn(label) -> str:
    """'2024-07' → '2024 年 7 月'；'2026-06-30' → '2026 年 6 月'（大数字 sub/注脚用）。"""
    s = str(label or "")
    m = re.search(r"(\d{4})\D{0,3}(\d{1,2})", s)
    if m:
        return f"{m.group(1)} 年 {int(m.group(2))} 月"
    return s


def _note_for(kind: str, R: dict) -> str:
    """每镜的短注脚（Lead 指定；长口径会折行且重复，不能在每镜都铺一遍）。"""
    if kind in ("cover", "split", "trend", "steps", "bars"):
        return "乘联分会 · 零售口径"
    if kind == "year2025":
        return "乘联分会 · 零售口径 · 由零售量计算"
    if kind == "cross":
        m = short_month(R["milestone"]["month"])
        return f"乘联分会 · {m} 单月" if m else "乘联分会 · 单月"
    if kind == "stock":
        when = short_month(R["stock"]["as_of"])
        return f"公安部交管局 · {when}" if when else "公安部交管局 · 存量口径"
    if kind == "reasons":
        return "乘联分会 / 国家发改委 / 国家能源局"
    if kind == "cost":
        return "金融监管总局 / 中汽协 / 国家能源局"
    if kind == "outlook":
        return f"乘联分会 · {period_short(R['ytd']['period'])}" if R["ytd"]["period"] else "乘联分会 · 零售口径"
    if kind == "outro":
        return "数据来源：乘联分会（CPCA）· 公安部交管局"
    return R["note"]


# ---------------- payload 组装（按 kind 分派） ----------------
def _p_cover(slide: dict, R: dict) -> dict:
    p = _base_payload(R, slide["kind"])
    first = R["first"]
    if first is None:
        R["warnings"].append("cover：无 yearly 数据，只有 note/source")
        return p
    target = _latest_ev(R) if _latest_ev(R) is not None else first["ev"]
    # AutoTrendVibe 的 S01Cover 用 dots.from → dots.ev 做 6→68 双卡对比，points 取首尾年份做标签
    p["dots"] = {
        "ev": int(_clamp(round(target), 0, 100)),
        "from": int(_clamp(round(first["ev"]), 0, 100)),
        "total": 100,
    }
    p["points"] = _points(R)
    p["big"] = {
        "value": num(evv(first["ev"])),
        "unit": "%",
        "label": f"{first['year']} 年 · 零售渗透率",
        "sub": "一百个买车人里，六个选电车",
    }
    return p


def _p_split(slide: dict, R: dict) -> dict:
    p = _base_payload(R, slide["kind"])
    target = _latest_ev(R)
    first = R["first"]
    if target is None:
        R["warnings"].append("split：无 latest.ev_penetration，只有 note/source")
        return p
    when = short_month(R["latest"]["month"]) or "最新"
    # S02Split：100 格从 dots.from 滚到 dots.ev，中间大数字同步
    p["dots"] = {
        "ev": int(_clamp(round(target), 0, 100)),
        "from": int(_clamp(round(first["ev"]), 0, 100)) if first else 0,
        "total": 100,
    }
    p["big"] = {
        "value": num(evv(target)),
        "unit": "%",
        "label": "一百个买车人里，选电车的数量",
        "sub": f"{when} · 零售口径",
    }
    return p


def _p_trend(slide: dict, R: dict) -> dict:
    p = _base_payload(R, slide["kind"])
    p["points"] = _points(R)
    return p


def _p_steps(slide: dict, R: dict) -> dict:
    p = _base_payload(R, slide["kind"])
    annual = [y for y in R["yearly"] if re.fullmatch(r"\d{4}", y["year"])]
    picked = annual[-5:]  # 2021—2025 五个年度台阶
    # S04Steps 读 points（ev + extra 销量）；同时给 bars 兜底（组件按 label 查销量）
    p["points"] = [
        {
            "year": y["year"],
            "ev": evv(y["ev"]),
            **({"extra": f"{num(y['ev_wan'])} 万辆"} if y["ev_wan"] is not None else {}),
        }
        for y in picked
    ]
    p["bars"] = [
        {"label": y["year"], "value": round(y["ev_wan"], 1), "unit": "万辆", "tone": "ev"}
        for y in R["yearly"]
        if y["ev_wan"] is not None
    ]
    p["stats"] = [
        {
            "label": f"{y['year']}",
            "value": num(evv(y["ev"])),
            "unit": "%",
            "tone": "ev",
            "note": f"零售 {num(y['ev_wan'])} 万辆" if y["ev_wan"] else "新能源零售渗透率",
        }
        for y in picked
    ]
    return p


def _p_cross(slide: dict, R: dict) -> dict:
    p = _base_payload(R, slide["kind"])
    ms = R["milestone"]
    p["points"] = _points(R, milestone_point=True)  # 交叉点特写：里程碑单月点替换同年度点
    if ms["value"] is not None:
        p["big"] = {
            "value": num(evv(ms["value"])),
            "unit": "%",
            "sub": f"{month_cn(ms['month'])} · 首次单月过半" if ms["month"] else "首次单月过半",
        }
        # viz 的印章第二行从 payload.milestone 取（不要用硬编码年份）
        p["milestone"] = {
            "month": ms["month"],          # 原始口径："2024-07"
            "label": short_month(ms["month"]),  # 上屏："2024.07"
            "value": evv(ms["value"]),
        }
    else:
        R["warnings"].append("cross：无 milestone_50pct，只有 points")
    return p


def _p_year2025(slide: dict, R: dict) -> dict:
    p = _base_payload(R, slide["kind"])
    annual = [y for y in R["yearly"] if re.fullmatch(r"\d{4}", y["year"])]
    row = next((y for y in annual if y["year"] == "2025"), annual[-1] if annual else None)
    if row is None:
        R["warnings"].append("year2025：无年度数据")
        return p
    p["big"] = {
        "value": num(evv(row["ev"])),
        "unit": "%",
        "label": f"{row['year']} 全年新能源零售渗透率",
        "sub": "第一次全年过半",
    }
    # S06Year2025 只渲染 stats.slice(0,2)；渗透率已是大数字，卡片留给「销量」两条
    stats = []
    if row["ev_wan"]:
        stats.append({"label": "新能源零售", "value": num(row["ev_wan"]), "unit": "万辆", "tone": "ev"})
    if row["total_wan"]:
        # 同比优先取结构化字段，取不到再从 research 的 note 原文里抠「（+3.8%）」
        yoy = row["yoy"]
        if yoy is None:
            m = re.search(r"[（(]([+-]?[\d.]+)%[）)]", row.get("note") or "")
            yoy = float(m.group(1)) if m else None
        note = f"同比 {signed_pct(yoy)}" if yoy is not None else ""
        stats.append(
            {
                "label": "乘用车总零售",
                "value": num(row["total_wan"]),
                "unit": "万辆",
                "tone": "ink",
                "note": note,
            }
        )
    if not stats:
        stats.append({"label": "零售渗透率", "value": num(evv(row["ev"])), "unit": "%", "tone": "ev"})
    p["stats"] = stats
    return p


def _public_cards(cards: list[dict]) -> list[dict]:
    """去掉内部追溯字段（_research_id/_status），只留渲染用字段。"""
    return [{k: v for k, v in c.items() if not k.startswith("_")} for c in cards]


def _p_reasons(slide: dict, R: dict) -> dict:
    p = _base_payload(R, slide["kind"])
    p["reasons"] = _public_cards(R["reasons"][:3])
    if not p["reasons"]:
        R["warnings"].append("research.json 缺 reasons——原因镜没有卡片")
    return p


def _p_bars(slide: dict, R: dict) -> dict:
    p = _base_payload(R, slide["kind"])
    p["bars"] = [
        {"label": y["year"], "value": round(y["ev_wan"], 1), "unit": "万辆", "tone": "ev"}
        for y in R["yearly"]
        if y["ev_wan"] is not None
    ]
    if not p["bars"]:
        R["warnings"].append("research.json 缺 ev_retail_wan——销量条形镜没有数据")
    return p


def _p_stock(slide: dict, R: dict) -> dict:
    p = _base_payload(R, slide["kind"])
    st = R["stock"]
    total, nev = st["total_wan"], st["nev_wan"]
    if not (total and nev):
        R["warnings"].append("research.json 缺 stock.total_vehicles_wan / stock.nev_wan——反转镜没有数据")
        return p
    share = st["share"] if st["share"] is not None else nev / total * 100
    p["big"] = {
        "value": num(share),
        "unit": "%",
        "label": "全国汽车保有量里，新能源的占比",
        "sub": f"截至 {month_cn(st['as_of'])}" if st["as_of"] else "存量口径",
    }
    p["dots"] = {
        "ev": int(_clamp(round(share), 0, 100)),
        "from": 0,
        "total": 100,
    }
    total_v, total_u = _wan_or_yi(total)
    nev_v, nev_u = _wan_or_yi(nev)
    # S09Stock 只渲染 stats.slice(0,2)
    p["stats"] = [
        {"label": "全国汽车保有量", "value": total_v, "unit": total_u, "tone": "ink"},
        {"label": "其中新能源", "value": nev_v, "unit": nev_u, "tone": "ev"},
    ]
    return p


def _p_cost(slide: dict, R: dict) -> dict:
    p = _base_payload(R, slide["kind"])
    p["reasons"] = _public_cards(R["cost"][:3])
    if not p["reasons"]:
        R["warnings"].append("research.json 缺 cost——代价镜没有卡片")
    return p


def _p_outlook(slide: dict, R: dict) -> dict:
    p = _base_payload(R, slide["kind"])
    ytd = R["ytd"]
    # 大数字必须是数字（Odometer 会 parseNum；字符串 "共存" 会被算成 NaN）
    if ytd["wan"] is not None:
        yoy = f"，同比 {signed_pct(ytd['yoy'])}" if ytd["yoy"] is not None else ""
        p["big"] = {
            "value": num(ytd["wan"]),
            "unit": "万辆",
            "label": f"{period_label(ytd['period']) or '累计'}乘用车零售{yoy}",
            "sub": "缩量之年",
        }
        p["stats"] = [
            {
                "label": ytd["period"] or "累计零售",
                "value": num(ytd["wan"]),
                "unit": "万辆",
                "tone": "ink",
                "note": f"同比 {signed_pct(ytd['yoy'])}" if ytd["yoy"] is not None else "",
            }
        ]
    else:
        ev_now = _latest_ev(R)
        p["big"] = {
            "value": num(evv(ev_now)) if ev_now is not None else "0",
            "unit": "%",
            "label": "新能源新车零售渗透率",
            "sub": "从替代，到共存",
        }
        R["warnings"].append("research.json 缺 ytd ——结论镜大数字回退用渗透率")
    # S11Outlook 要 6 张卡（前 3 = 油车侧，后 3 = 电车侧）；research 有 outlook 就用，否则按数据派生
    src = R.get("outlook") or []
    if len(src) >= 6:
        p["reasons"] = _public_cards(src[:6])
    else:
        st = R["stock"]
        share = None
        if st["total_wan"] and st["nev_wan"]:
            share = st["share"] if st["share"] is not None else st["nev_wan"] / st["total_wan"] * 100
        ev_now = _latest_ev(R)
        cards = []
        if share is not None:
            cards.append({"title": "存量", "text": f"保有量里仍占 {num(100.0 - share)}%", "icon": "trip"})
        else:
            cards.append({"title": "存量", "text": "存量车仍是绝对多数", "icon": "trip"})
        cards.append({"title": "补能", "text": "加油快，长途不用提前规划", "icon": "oil"})
        # 不带数字的定性描述只保留「加油快/长途」；这一条改用可核验的互补值（100 − 新车渗透率）
        if ev_now is not None:
            cards.append(
                {"title": "份额", "text": f"新车里还有 {num(100.0 - evv(ev_now))}% 是油车", "icon": "price"}
            )
        else:
            cards.append({"title": "份额", "text": "新车里仍有三成是油车", "icon": "price"})
        if ev_now is not None:
            cards.append({"title": "新车", "text": f"新车零售已占 {num(evv(ev_now))}%", "icon": "battery"})
        else:
            cards.append({"title": "新车", "text": "新车零售已是多数派", "icon": "battery"})
        cards.append({"title": "家充", "text": "有家充桩，用车成本更低", "icon": "charge"})
        cards.append({"title": "冬季", "text": "冬季续航与充电仍是短板", "icon": "winter"})
        p["reasons"] = cards
    return p


def _p_outro(slide: dict, R: dict) -> dict:
    return _base_payload(R, slide["kind"])


BUILDERS = {
    "cover": _p_cover,
    "split": _p_split,
    "trend": _p_trend,
    "steps": _p_steps,
    "cross": _p_cross,
    "year2025": _p_year2025,
    "reasons": _p_reasons,
    "bars": _p_bars,
    "stock": _p_stock,
    "cost": _p_cost,
    "outlook": _p_outlook,
    "outro": _p_outro,
}


def _deep_merge(base: dict, override: dict) -> dict:
    out = dict(base)
    for k, v in (override or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _deep_merge(out[k], v)
        else:
            out[k] = v
    return out


def build_payload(slide: dict, research: dict) -> dict:
    """按 kind 分派组装该镜 payload。数字一律来自 research（或同口径派生值）。

    story.json 里的 slide.payload 可做局部覆盖（便于 Lead 微调个别标签）。
    """
    fn = BUILDERS.get(slide["kind"])
    payload = fn(slide, research) if fn else _base_payload(research, slide["kind"])
    if slide.get("payload_override"):
        payload = _deep_merge(payload, slide["payload_override"])
    return payload


# ---------------- 配音 ----------------
def build_script(story_title: str, slides: list[dict]) -> ScriptDraft:
    return ScriptDraft(
        title=story_title[:60],
        shots=[Shot(label=s["kicker"], lines=[Line(text=s["narration"])]) for s in slides],
    )


def _story_hash(slides: list[dict], voice_name: str, rate: str) -> str:
    raw = "\n".join(f"{s['id']}\t{s['narration']}" for s in slides) + f"\n{voice_name}\t{rate}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]


def ensure_voices(
    slides: list[dict], story_title: str, reuse: bool, voice_name: str, rate: str
) -> dict[str, float]:
    vdir = REMOTION_PUBLIC / voice.VOICE_PUBLIC_SUBDIR / PID
    cache_path = STORAGE_DIR / f"_{PID}_durations.json"
    want_hash = _story_hash(slides, voice_name, rate)
    cache = read_json(cache_path) if cache_path.exists() else {}
    cached = cache.get("durations") if isinstance(cache, dict) else None
    files_ok = all((vdir / f"s{i + 1:02d}_0.wav").exists() for i in range(len(slides)))

    if reuse:
        if not cached or not cache.get("hash"):
            print("[1/5] --reuse-voice：无配音缓存，重新合成", flush=True)
        elif cache.get("hash") != want_hash:
            print("[1/5] --reuse-voice：文案/音色已变更（哈希不一致），为避免口型错位改为重新配音", flush=True)
        elif not files_ok:
            print("[1/5] --reuse-voice：配音文件缺失，重新合成", flush=True)
        else:
            print("[1/5] 复用已有配音（文案哈希一致）", flush=True)
            return {k: float(v) for k, v in cached.items() if k.startswith("s")}

    print("[1/5] 逐镜配音（edge-tts，实测时长）…", flush=True)
    script = build_script(story_title, slides)
    durations = voice.generate_script_voices(PID, script.shots, voice=voice_name, rate=rate)
    write_json(cache_path, {"hash": want_hash, "voice": voice_name, "rate": rate, "durations": durations})
    return durations


# ---------------- 时间轴：实测配音 + BGM 拍点锁镜 ----------------
def build_timeline(durations: dict[str, float], slides: list[dict], beats: list[float]) -> list[dict]:
    out: list[dict] = []
    cursor = 0.0
    for i, s in enumerate(slides):
        key = f"s{i + 1:02d}_0"
        if key not in durations:
            raise SystemExit(f"配音时长缺失：{key}（共 {len(durations)} 条）")
        speech = float(durations[key])
        target = max(MIN_SHOT, speech + LEAD + TAIL)
        end = cursor + target
        # 切点锁拍：候选拍点必须在「旁白结束 +0.30s」之后、不超过目标 +0.60s，
        # 取离目标最近的一拍 —— 每一刀都踩在 BGM 拍点上（帧取整误差 ≤0.02s）。
        if beats:
            lo = cursor + speech + LEAD + 0.30
            hi = cursor + target + 0.60
            cand = [b for b in beats if lo <= b <= hi]
            if cand:
                end = min(cand, key=lambda b: abs(b - (cursor + target)))
        frames = max(1, round((end - cursor) * FPS))
        out.append(
            {
                "index": i,
                "slide": s,
                "startSec": round(cursor, 3),
                "startFrame": round(cursor * FPS),
                "durationFrames": frames,
                "narrationSec": round(speech, 3),
                "narrationStartSec": round(cursor + LEAD, 3),
            }
        )
        cursor += frames / FPS
    return out


# ---------------- 旁白整轨预混 ----------------
def _decode_mono(path: Path) -> tuple[np.ndarray, int]:
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_path = Path(tmp.name)
    try:
        subprocess.run(
            [
                str(FFMPEG_BIN),
                "-y",
                "-v",
                "error",
                "-i",
                str(path),
                "-ac",
                "1",
                "-ar",
                "44100",
                "-f",
                "wav",
                str(tmp_path),
            ],
            capture_output=True,
            timeout=120,
            check=True,
        )
        with wave.open(str(tmp_path), "rb") as w:
            sr = w.getframerate()
            data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
        return data.astype(np.float32) / 32768.0, sr
    finally:
        tmp_path.unlink(missing_ok=True)


def mix_narration(timeline: list[dict], total_frames: int) -> Path:
    """逐镜配音按时间轴混成一条根级音轨（规避嵌套 Sequence 音频碎片 bug）。"""
    sr = 44100
    total_samples = int(total_frames / FPS * sr) + sr
    track = np.zeros(total_samples, dtype=np.float32)
    vdir = REMOTION_PUBLIC / voice.VOICE_PUBLIC_SUBDIR / PID
    for item in timeline:
        wav = vdir / f"s{item['index'] + 1:02d}_0.wav"
        samples, file_sr = _decode_mono(wav)
        if file_sr != sr:
            raise RuntimeError(f"采样率异常：{wav.name} {file_sr}")
        offset = int(item["narrationStartSec"] * sr)
        end = min(total_samples, offset + len(samples))
        track[offset:end] += samples[: end - offset]
    raw_peak = float(np.abs(track).max()) or 1.0
    if raw_peak > NARRATION_PEAK:  # 只压不推，避免把底噪抬起来
        track = track * (NARRATION_PEAK / raw_peak)
    peak = float(np.abs(track).max())
    out = vdir / "narration.wav"
    vdir.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((track * 32767).astype(np.int16).tobytes())
    print(
        f"[3/5] 旁白整轨：{out.name}（{total_samples / sr:.1f}s，峰值 {peak:.2f}，上限 {NARRATION_PEAK}）",
        flush=True,
    )
    return out


# ---------------- BGM ----------------
def resolve_bgm(total_frames: int) -> tuple[dict, list[float], float]:
    meta_path = STORAGE_DIR / "_vibe_bgm_meta.json"
    chosen = REMOTION_PUBLIC / "bgm" / BGM_NAME
    fallback = REMOTION_PUBLIC / "bgm" / BGM_FALLBACK
    if not chosen.exists() and fallback.exists():
        print(f"!! 未找到 {BGM_NAME}，回退 {BGM_FALLBACK}", flush=True)
        chosen = fallback
    if not chosen.exists():
        print("!! 没有可用 BGM，props 不含 bgm（成片会缺背景乐）", flush=True)
        return {}, [], 0.0
    bpm, beats, duration = 0.0, [], 0.0
    if meta_path.exists() and chosen.name == BGM_NAME:
        meta = read_json(meta_path)
        bpm = float(meta.get("bpm") or 0.0)
        beats = [float(b) for b in (meta.get("beats") or [])]
        duration = float(meta.get("duration_sec") or 0.0)
    if not beats:
        info = beat.analyze(chosen)
        bpm, beats = float(info.get("bpm") or 0.0), list(info.get("beats") or [])
    total_sec = total_frames / FPS
    if duration and duration < total_sec:
        print(f"!! BGM 只有 {duration:.1f}s < 成片 {total_sec:.1f}s，尾部会静音", flush=True)
    spec = {"src": f"bgm/{chosen.name}", "volume": BGM_VOLUME, "bpm": bpm}
    print(f"[2/5] BGM：{chosen.name} · {bpm:.1f}BPM · {len(beats)} 拍点 · {duration:.1f}s", flush=True)
    return spec, beats, duration


# ---------------- props 组装 ----------------
def assemble_props(
    timeline: list[dict], research: dict, bgm: dict, narration_rel: str, story: dict
) -> dict:
    return {
        "brand": story["brand"],
        "tag": story["tag"],
        "bgm": bgm,
        "narrationAudio": {"src": narration_rel, "volume": 1},
        "slides": [
            {
                "id": item["slide"]["id"],
                "kind": item["slide"]["kind"],
                "kicker": item["slide"]["kicker"],
                "title": item["slide"]["title"],
                "sub": item["slide"]["sub"],
                "accent": item["slide"]["accent"],
                "caption": item["slide"]["narration"],
                "emphasis": item["slide"]["emphasis"],
                "narration": item["slide"]["narration"],
                "narrationSec": item["narrationSec"],
                "durationFrames": item["durationFrames"],
                "enter": item["slide"]["enter"],
                "exit": item["slide"]["exit"],
                "cam": item["slide"]["cam"],
                "flash": bool(item["slide"].get("flash", False)),
                "payload": build_payload(item["slide"], research),
            }
            for item in timeline
        ],
    }


# ---------------- 自检 ----------------
def _allowed_numbers(R: dict) -> set[str]:
    """payload 允许出现的数字集合：research 派生值 + research 原文里出现过的数字。"""
    allowed: set[str] = {"100", "10", "0", "1"}  # 100 格剖分 / 10 格点阵等结构常数

    def add(v):
        if v is None:
            return
        for n in (f"{v:.0f}", f"{v:.1f}", f"{v:.2f}", f"{v:.3f}", f"{v:,.0f}", f"{v:,.1f}"):
            allowed.add(n)
            allowed.add(n.replace(",", ""))
        allowed.add(num(v))
        allowed.add(f"{round(v):.0f}")

    for y in R["yearly"]:
        allowed.add(str(y["year"]))
        add(y["ev"])
        add(y["fuel"])
        add(y["ev_wan"])
        add(y["total_wan"])
        add(y["yoy"])
    for key in ("ev",):
        add(R["latest"][key])
    add(R["milestone"]["value"])
    st = R["stock"]
    add(st["total_wan"])
    add(st["nev_wan"])
    add(st["share"])
    if st["total_wan"] and st["nev_wan"]:
        computed = st["nev_wan"] / st["total_wan"] * 100
        add(computed)
        add(100.0 - computed)
        if st["share"] is not None:  # research 直接给了占比时，以它为准（13.19 而非 13.1978）
            add(st["share"])
            add(100.0 - st["share"])
        add(st["total_wan"] / 10000)
    add(R["ytd"]["wan"])
    add(R["ytd"]["yoy"])
    ev_now = _latest_ev(R)
    if ev_now is not None and R["first"]:
        add(100.0 - ev_now)
        add(R["first"]["ev"])
    # 月份标签（'2026年10月' → '2026.10' / '2026.1' / '2026年10'）都要算合法
    for label in (R["latest"].get("month"), R["milestone"].get("month"), R["stock"].get("as_of"), R["ytd"].get("period")):
        s = str(label or "")
        if not s:
            continue
        allowed.add(s)
        allowed.add(short_month(s))
        allowed.add(_pin_month(s))
        for m in re.finditer(r"\d{4}(?:[.\-年]\d{1,2})?", s):
            allowed.add(m.group())
            for tok in _NUM_RE.findall(m.group()):
                allowed.add(tok)
    # "2024年2月" 在屏幕上会写成 "2024.02"，属于同一事实的派生写法
    raw_text = json.dumps(R["raw"], ensure_ascii=False)
    for m in re.finditer(r"(\d{4})\s*年\s*(\d{1,2})\s*月", raw_text):
        allowed.add(f"{m.group(1)}.{int(m.group(2)):02d}")
        allowed.add(f"{m.group(1)}.{int(m.group(2))}")
    # research 原文里出现过的所有数字：reasons/cost 卡片文案是原文引用
    for tok in _NUM_RE.findall(json.dumps(R["raw"], ensure_ascii=False)):
        allowed.add(tok)
        allowed.add(tok.rstrip("0").rstrip(".") if "." in tok else tok)
    # 每镜短注脚里出现的数字（如 "2024.07 单月" / "2026.01-10"）
    for kind in KINDS:
        s = _note_for(kind, R)
        allowed.add(s)
        for tok in _NUM_RE.findall(s):
            allowed.add(tok)
        for m in re.finditer(r"\d{4}\.\d{2}-\d{2}", s):
            allowed.add(m.group())
    return allowed


def _iter_strings(obj, path=""):
    if isinstance(obj, str):
        yield path, obj
    elif isinstance(obj, dict):
        for k, v in obj.items():
            yield from _iter_strings(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from _iter_strings(v, f"{path}[{i}]")


def numeric_audit(props: dict, R: dict) -> list[str]:
    """扫描 payload 里的数字，凡不在 research 派生集合内的一律告警（防硬编码）。"""
    allowed = _allowed_numbers(R)
    bad: list[str] = []
    for i, s in enumerate(props["slides"]):
        for path, text in _iter_strings(s.get("payload") or {}):
            for tok in _NUM_RE.findall(text):
                if tok not in allowed:
                    bad.append(f"第 {i + 1} 镜（{s['id']}）{path}: 数字 {tok} 不在 research 派生集合（{text!r}）")
    return bad


def data_trace(props: dict, R: dict) -> list[tuple[str, str, str, bool]]:
    """逐镜对照表：屏幕上显示的数字 ↔ research.json 里的出处。

    这是**独立的复核逻辑**（不复用 builder 的中间量），所以 builder 算错时这里会暴露。
    返回 [(镜 id, 屏幕显示, research 出处, 是否一致)]。
    """
    rows: list[tuple[str, str, str, bool]] = []
    by_year = {y["year"]: y for y in R["yearly"]}
    first, latest = R["first"], R["latest"]
    latest_ev = _latest_ev(R)
    annual = [y for y in R["yearly"] if re.fullmatch(r"\d{4}", y["year"])]
    for s in props["slides"]:
        p = s.get("payload") or {}
        sid, kind = s["id"], s["kind"]
        big = p.get("big") or {}
        dots = p.get("dots") or {}
        stats = p.get("stats") or []
        if kind == "cover" and first is not None:
            # cover 是「2020 → 最新」双卡：dots.from=起点、dots.ev=终点
            rows.append(
                (
                    sid,
                    f"big={big.get('value')}{big.get('unit') or ''} · dots={dots.get('from')}→{dots.get('ev')}/{dots.get('total')}",
                    f"yearly[{first['year']}]={num(first['ev'])} → latest={num(latest_ev) if latest_ev is not None else '—'}",
                    _num(big.get("value")) == evv(first["ev"])
                    and dots.get("from") == int(round(first["ev"]))
                    and (latest_ev is None or dots.get("ev") == int(round(latest_ev))),
                )
            )
        elif kind == "split" and latest_ev is not None:
            rows.append(
                (
                    sid,
                    f"big={big.get('value')}{big.get('unit') or ''} · dots={dots.get('ev')}/{dots.get('total')}",
                    f"latest.ev_penetration={num(latest_ev)}",
                    _num(big.get("value")) == evv(latest_ev) and dots.get("ev") == int(round(latest_ev)),
                )
            )
        elif kind in ("trend", "cross"):
            pts = p.get("points") or []
            ms = R["milestone"]
            ms_month = short_month(ms["month"])
            expect: list[tuple[str, float]] = []
            for y in R["yearly"]:
                if kind == "cross" and ms["value"] is not None and ms_month and str(y["year"]) == ms_month[:4]:
                    expect.append((ms_month, evv(ms["value"])))
                else:
                    expect.append((str(y["year"]), evv(y["ev"])))
            if latest_ev is not None:
                expect.append((short_month(R["latest"]["month"]) or "最新", evv(latest_ev)))
            ok_pts = len(pts) == len(expect) and all(
                str(pts[i]["year"]) == yr and abs(pts[i]["ev"] - v) < 0.051
                for i, (yr, v) in enumerate(expect)
            )
            rows.append(
                (
                    sid,
                    f"points={len(pts)} · " + "/".join(f"{q['year']}:{q['ev']}" for q in pts),
                    "yearly[].ev_penetration"
                    + ("（2024 用 milestone 单月点替换）" if kind == "cross" else "")
                    + " + latest",
                    ok_pts,
                )
            )
            if kind == "cross" and R["milestone"]["value"] is not None:
                ms = R["milestone"]
                pm = p.get("milestone") or {}
                has_ms_pt = any(
                    str(q.get("year")) == short_month(ms["month"]) and abs(q["ev"] - evv(ms["value"])) < 0.051
                    for q in pts
                )
                ok_ms = (
                    _num(big.get("value")) == evv(ms["value"])
                    and has_ms_pt
                    and str(pm.get("month") or "") == str(ms["month"])
                )
                rows.append(
                    (
                        sid,
                        f"big={big.get('value')}{big.get('unit') or ''} · milestone={pm.get('month')}/{pm.get('label')}"
                        f" · sub={big.get('sub')}",
                        f"milestone_50pct {ms['month']} = {num(ms['value'])}",
                        ok_ms,
                    )
                )
        elif kind == "steps":
            expect = annual[-5:]
            pts = p.get("points") or []
            ok_steps = len(pts) == len(expect) and all(
                str(pts[i]["year"]) == y["year"]
                and abs(pts[i]["ev"] - y["ev"]) < 0.051
                and (y["ev_wan"] is None or num(y["ev_wan"]) in str(pts[i].get("extra") or ""))
                for i, y in enumerate(expect)
            )
            rows.append(
                (
                    sid,
                    "steps=" + " / ".join(f"{q['year']}:{q['ev']}%({q.get('extra') or '—'})" for q in pts),
                    "yearly[2021..2025].ev_penetration + ev_retail_wan",
                    ok_steps,
                )
            )
        elif kind == "year2025":
            row = next((y for y in annual if y["year"] == "2025"), annual[-1] if annual else None)
            ok_stats = (
                row is not None
                and _num(big.get("value")) == evv(row["ev"])
                and (not row["ev_wan"] or any(q.get("value") == num(row["ev_wan"]) for q in stats))
                and (not row["total_wan"] or any(q.get("value") == num(row["total_wan"]) for q in stats))
            )
            rows.append(
                (
                    sid,
                    f"big={big.get('value')}{big.get('unit') or ''} · "
                    + " / ".join(f"{q.get('value')}{q.get('unit') or ''}" for q in stats),
                    f"yearly[{row['year'] if row else '?'}].ev / ev_retail_wan / total_retail_wan",
                    bool(ok_stats),
                )
            )
        elif kind == "bars":
            expect = [y for y in R["yearly"] if y["ev_wan"] is not None]
            bars = p.get("bars") or []
            ok_bars = len(bars) == len(expect) and all(
                abs(bars[i]["value"] - expect[i]["ev_wan"]) < 0.05 and bars[i]["label"] == expect[i]["year"]
                for i in range(len(expect))
            )
            rows.append(
                (
                    sid,
                    f"bars={len(bars)} 根 · " + "/".join(f"{b['label']}:{b['value']}" for b in bars),
                    "yearly[].ev_retail_wan",
                    ok_bars,
                )
            )
        elif kind == "stock":
            st = R["stock"]
            if st["total_wan"] and st["nev_wan"]:
                share = st["share"] if st["share"] is not None else st["nev_wan"] / st["total_wan"] * 100
                rows.append(
                    (
                        sid,
                        f"big={big.get('value')}{big.get('unit') or ''} · dots={dots.get('ev')}/{dots.get('total')} · "
                        + " / ".join(f"{q.get('value')}{q.get('unit') or ''}" for q in stats),
                        f"stock: nev={num(st['nev_wan'])} / total={num(st['total_wan'])} → {num(share)}%",
                        _num(big.get("value")) == round(share, 2) and dots.get("ev") == int(round(share)),
                    )
                )
        elif kind in ("reasons", "cost"):
            cards = p.get("reasons") or []
            src_cards = R["reasons"] if kind == "reasons" else R["cost"]
            ok_cards = len(cards) == len(src_cards[:3]) and all(
                cards[i]["title"] == src_cards[i]["title"] for i in range(len(cards))
            )
            rows.append(
                (
                    sid,
                    "cards=" + " / ".join(f"{c['title']}({c['icon']})" for c in cards),
                    f"research.{kind}[0..{max(0, len(cards) - 1)}].title",
                    ok_cards,
                )
            )
        elif kind == "outlook":
            ytd = R["ytd"]
            cards = p.get("reasons") or []
            ok_ytd = ytd["wan"] is not None and any(q.get("value") == num(ytd["wan"]) for q in stats)
            rows.append(
                (
                    sid,
                    f"big={big.get('value')} · 共存卡={len(cards)} 条 · "
                    + " / ".join(f"{q.get('label')}:{q.get('value')}{q.get('unit') or ''}" for q in stats),
                    f"ytd.ev_retail_wan={num(ytd['wan']) if ytd['wan'] is not None else '—'} + 6 张共存卡（前 3 油车 / 后 3 电车）",
                    ok_ytd and len(cards) == 6,
                )
            )
        elif kind == "outro":
            note = str(p.get("note") or "")
            norm = lambda s: re.sub(r"[\s·]+", "", s)  # noqa: E731 — 分隔符/空格差异不算不一致
            rows.append(
                (
                    sid,
                    f"note={note}",
                    f"research sources media = {R['footer']}",
                    norm(R["footer"]) in norm(note),
                )
            )
    return rows


def self_check(
    props: dict, timeline: list[dict], R: dict, bgm_duration: float, story: dict
) -> tuple[list[str], list[str]]:
    problems: list[str] = []
    warns: list[str] = []
    try:
        json.loads(json.dumps(props, ensure_ascii=False))
    except (TypeError, ValueError) as e:
        problems.append(f"props 无法 JSON 序列化：{e}")
    if len(props["slides"]) != len(timeline):
        problems.append(f"镜数不一致：props {len(props['slides'])} vs 时间轴 {len(timeline)}")
    if not props.get("narrationAudio", {}).get("src"):
        problems.append("缺 narrationAudio.src（成片会没有旁白）")
    if not props.get("bgm", {}).get("src"):
        warns.append("缺 bgm.src（成片没有背景乐）")

    total_frames = sum(t["durationFrames"] for t in timeline)
    total_sec = total_frames / FPS
    in_brief = TARGET_SEC[0] <= total_sec <= TARGET_SEC[1]
    in_lead = LEAD_TARGET_SEC[0] <= total_sec <= LEAD_TARGET_SEC[1]
    print(
        f"[自检] {len(timeline)} 镜 · {total_frames} 帧 · {total_sec:.2f}s "
        f"（验收 {TARGET_SEC[0]:.0f}~{TARGET_SEC[1]:.0f}s）",
        flush=True,
    )
    if not in_brief:
        over = "超长" if total_sec > TARGET_SEC[1] else "偏短"
        msg = f"总时长 {total_sec:.2f}s {over}（验收 {TARGET_SEC[0]:.0f}~{TARGET_SEC[1]:.0f}s）"
        print(f"  ✗ {msg}；调 --tail / --min-shot", flush=True)
        problems.append(msg)
    elif not in_lead:
        msg = f"总时长 {total_sec:.2f}s 在验收窗口内，但超出 Lead 期望 {LEAD_TARGET_SEC[0]:.0f}~{LEAD_TARGET_SEC[1]:.0f}s"
        print(f"  ⚠ {msg}", flush=True)
        warns.append(msg)

    # 文案一致性：props.caption 必须逐字等于 story.json 的 narration（防读缓存/内置兜底）
    story_slides = story["slides"]
    if len(story_slides) != len(props["slides"]):
        problems.append(f"story.json {len(story_slides)} 镜 vs props {len(props['slides'])} 镜")
    else:
        mism = [
            (a["id"], b["caption"], a["narration"])
            for a, b in zip(story_slides, props["slides"])
            if b["caption"] != a["narration"]
        ]
        if mism:
            for sid, got, want in mism:
                problems.append(f"{sid} 字幕与 story.json 不一致：props={got!r} story={want!r}")
        else:
            print(f"  ✓ 文案与 story.json 逐字一致（{len(story_slides)}/{len(story_slides)}）", flush=True)

    for i, item in enumerate(timeline):
        slot = item["durationFrames"] / FPS
        speech = item["narrationSec"]
        tail_room = slot - LEAD - speech
        hard_ok = tail_room >= 0.20  # 口播必须在切镜前收住（硬线）
        soft_ok = tail_room >= TAIL - 0.65  # 拍点吸附最多吃掉 0.6s，留差量算正常
        flag = "ok" if soft_ok else ("⚠ 落幅偏紧" if hard_ok else "✗ 口播压到切点")
        print(
            f"  {i + 1:02d} {item['slide']['id']:<9} {item['slide']['kind']:<9} "
            f"slot={slot:5.2f}s nar={speech:5.2f}s 余量={tail_room:5.2f}s "
            f"f={item['durationFrames']:4d} {flag}",
            flush=True,
        )
        if not hard_ok:
            problems.append(
                f"第 {i + 1} 镜 {item['slide']['id']}：旁白 {speech:.2f}s + LEAD {LEAD}s 距切镜只剩 "
                f"{tail_room:.2f}s（要求 ≥0.20s）"
            )
        elif not soft_ok:
            warns.append(
                f"第 {i + 1} 镜 {item['slide']['id']}：落幅余量 {tail_room:.2f}s 略小于目标 {TAIL:.2f}s（拍点吸附导致，可接受）"
            )
        payload = props["slides"][i].get("payload") or {}
        if not payload:
            problems.append(f"第 {i + 1} 镜（{item['slide']['id']}）payload 为空")
        if item["slide"]["kind"] in ("trend", "steps", "bars", "stock", "reasons", "cost") and len(payload) <= 2:
            warns.append(f"第 {i + 1} 镜（{item['slide']['id']}）payload 只有 note/source，画面可能没有数据")

    if bgm_duration and bgm_duration < total_sec:
        problems.append(f"BGM {bgm_duration:.1f}s 覆盖不了成片 {total_sec:.1f}s")

    for b in numeric_audit(props, R):
        warns.append(b)

    print("[自检] payload 关键数字：", flush=True)
    for s in props["slides"]:
        p = s.get("payload") or {}
        bits = []
        if p.get("big"):
            b = p["big"]
            bits.append(f"big={b.get('value')}{b.get('unit') or ''}")
        if p.get("dots"):
            bits.append(f"dots={p['dots'].get('ev')}/{p['dots'].get('total')}")
        if p.get("points"):
            bits.append("points=" + ",".join(f"{q['year']}:{q['ev']}" for q in p["points"]))
        if p.get("stats"):
            bits.append(
                "stats=" + " | ".join(f"{q.get('label')}={q.get('value')}{q.get('unit') or ''}" for q in p["stats"])
            )
        if p.get("bars"):
            bits.append("bars=" + ",".join(f"{q['label']}:{q['value']}" for q in p["bars"]))
        if p.get("reasons"):
            bits.append("reasons=" + ",".join(f"{q['title']}({q['icon']})" for q in p["reasons"]))
        print(f"  {s['id']:<9} {' · '.join(bits) if bits else '(仅 note/source)'}", flush=True)

    print("[自检] 数据溯源（屏幕数字 ⟵ research.json）：", flush=True)
    for sid, screen, src, ok in data_trace(props, R):
        print(f"  {'✓' if ok else '✗'} {sid:<9} {screen}   ⟵ {src}", flush=True)
        if not ok:
            problems.append(f"{sid} 屏幕数字与 research.json 不一致（{screen} ⟵ {src}）")

    for w in R.get("warnings") or []:
        warns.append(f"research: {w}")
    return problems, warns


# ---------------- 发布文案 ----------------
def write_publish_copy(props: dict, R: dict, story: dict) -> None:
    first, latest = R["first"], R["latest"]
    ev_now = _latest_ev(R)
    ms = R["milestone"]
    span = ""
    if first and ev_now is not None:
        years = ""
        try:
            years = f"{int(latest['month'][:4]) - int(str(first['year'])[:4])} 年"
        except (ValueError, TypeError):
            years = "这些年"
        span = f"{years}：{num(first['ev'])}% → {num(ev_now)}%"
    title = f"油车真的输了吗？{span}" if span else "油车真的输了吗？中国车市大逆转"
    if len(title) > 30:
        title = title[:29] + "…"

    desc: list[str] = []
    if first and ev_now is not None:
        desc.append(
            f"新车市场：新能源零售渗透率从 {first['year']} 年的 {pct(first['ev'])} "
            f"涨到 {short_month(latest['month']) or '现在'} 的 {pct(ev_now)}。"
        )
    if ms["value"] is not None:
        desc.append(f"{month_cn(ms['month'])}单月零售渗透率首次过半（{pct(ms['value'])}）。")
    st = R["stock"]
    if st["total_wan"] and st["nev_wan"]:
        share = st["share"] if st["share"] is not None else st["nev_wan"] / st["total_wan"] * 100
        desc.append(
            f"但把存量全算上，路上 {num(st['total_wan'] / 10000)} 亿辆汽车里，新能源只有 "
            f"{num(st['nev_wan'])} 万辆（{num(share)}%）。"
        )
    desc.append("电车的保费、电池脱保、充电条件也是真账，别只听一面。")
    desc.append(
        f"数据来源：{R['footer']}；口径：新能源乘用车国内零售（乘联分会 CPCA）、"
        f"汽车保有量（公安部交管局）。仅数据科普，不构成购车建议。"
    )

    copy = {
        "douyin": {
            "title": title,
            "hashtags": [
                "#油车vs电车",
                "#新能源汽车",
                "#汽车知识",
                "#数据可视化",
                "#vibe知识大赏",
                "#乘联会",
            ],
            "desc": "".join(desc),
            "cover_text": ["油车，输了吗？", "6 年 · 从 6 个到 68 个"],
            "pinned_comment": "口径和来源都写在简介里了，欢迎用自己城市的数据理性对线。",
        },
        "xhs": {
            "title": f"中国车市 6 年翻盘：新能源渗透率 {num(first['ev']) if first else '6'}% → {num(ev_now) if ev_now is not None else '68'}%",
            "body": " ".join(desc),
            "hashtags": ["#新能源汽车", "#油车还是电车", "#数据科普", "#买车避坑"],
        },
        "meta": {
            "project": PID,
            "story_title": story["title"],
            "caliber": R["note"],
            "source": R["footer"],
            "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        },
    }
    write_json(VIDEO_DIR / "publish_copy.json", copy)


# ---------------- 渲染 ----------------
BUNDLE_SOURCES = (
    "src/vibe-auto/fx.tsx",
    "src/vibe-auto/slides.tsx",
    "src/vibe-auto/AutoTrendVibe.tsx",
    "src/vibe-auto/types.ts",
    "src/Root.tsx",
)


def log_bundle_sources() -> None:
    """渲染前打印 Remotion 源码 mtime/大小：确认用的是最新落盘版本，不是旧缓存 bundle。"""
    print("      bundle 源（mtime · size）：", flush=True)
    for rel in BUNDLE_SOURCES:
        p = REMOTION_DIR / rel
        if p.exists():
            st = p.stat()
            print(
                f"        {rel:<28} {time.strftime('%H:%M:%S', time.localtime(st.st_mtime))}  {st.st_size}B",
                flush=True,
            )
        else:
            print(f"        {rel:<28} !! 缺失", flush=True)


def render_still(props_path: Path, frame: int, out_png: Path) -> int:
    cmd = (
        f'npx remotion still {COMPOSITION} "{out_png}" '
        f'--props="{props_path}" --frame={frame} --overwrite'
    )
    proc = subprocess.run(cmd, cwd=str(REMOTION_DIR), shell=True, capture_output=True, timeout=900)
    if proc.returncode != 0:
        tail = proc.stderr.decode("utf-8", "replace")[-1200:]
        print(f"!! still 失败 frame={frame}\n{tail}", flush=True)
    return proc.returncode


def still_targets(slides: list[dict]) -> list[tuple[str, int]]:
    """每镜取「镜尾帧」（90% 处，动效已收尾且未进出场转场）+ 钩子帧 → 13 张。

    Lead 要求看镜尾终态，而不是中段：中段往往还在 odometer/绘线过程中，
    看不出数字与点阵是否同步。
    """
    targets: list[tuple[str, int]] = []
    cursor = 0
    for i, s in enumerate(slides):
        dur = int(s["durationFrames"])
        targets.append((f"{i + 1:02d}_{s['id']}", cursor + max(2, int(dur * 0.90))))
        cursor += dur
    targets.append(("hook", min(45, max(0, int(slides[0]["durationFrames"]) - 1))))
    return targets


def extract_stills(props_path: Path, slides: list[dict]) -> list[Path]:
    out: list[Path] = []
    for label, frame in still_targets(slides):
        png = VIDEO_DIR / f"_qa_{label}.png"
        if render_still(props_path, frame, png) != 0 or not png.exists():
            continue
        try:
            from PIL import Image

            jpg = VIDEO_DIR / f"qa_{frame / FPS:.1f}_{label}.jpg"
            Image.open(png).convert("RGB").save(jpg, quality=90)
            png.unlink(missing_ok=True)
            out.append(jpg)
            print(f"  QA 帧 {jpg.name}（frame={frame}）", flush=True)
        except Exception as e:  # noqa: BLE001
            print(f"!! 抽帧落盘失败 {label}: {e}", flush=True)
    return out


def render_cover(props_path: Path, slides: list[dict]) -> Path | None:
    dur0 = int(slides[0]["durationFrames"])
    # 首镜 75% 处：6%→68% 的 odometer 与点阵都已收尾，封面不会抓到滚动中间态
    frame = min(max(60, int(dur0 * 0.75)), max(1, dur0 - 12))
    png = VIDEO_DIR / "_cover.png"
    if render_still(props_path, frame, png) != 0 or not png.exists():
        return None
    from PIL import Image

    img = Image.open(png).convert("RGB")
    cover = VIDEO_DIR / "cover.jpg"
    img.save(cover, quality=92)
    png.unlink(missing_ok=True)
    if img.size != (1080, 1920):
        print(f"!! 封面尺寸 {img.size}，不是 1080×1920", flush=True)
    return cover


# ---------------- 音频 / 视频体检 ----------------
def probe_media(path: Path) -> dict:
    if not FFPROBE.exists():
        return {}
    proc = subprocess.run(
        [str(FFPROBE), "-v", "error", "-print_format", "json", "-show_streams", "-show_format", str(path)],
        capture_output=True,
        timeout=180,
    )
    if proc.returncode != 0:
        return {}
    try:
        return json.loads(proc.stdout.decode("utf-8", "replace"))
    except json.JSONDecodeError:
        return {}


def decode_audio(path: Path, sr: int = 44100) -> np.ndarray:
    with tempfile.TemporaryDirectory() as td:
        wav = Path(td) / "a.wav"
        subprocess.run(
            [
                str(FFMPEG_BIN),
                "-y",
                "-v",
                "error",
                "-i",
                str(path),
                "-ac",
                "1",
                "-ar",
                str(sr),
                "-c:a",
                "pcm_s16le",
                str(wav),
            ],
            capture_output=True,
            timeout=300,
            check=True,
        )
        with wave.open(str(wav), "rb") as w:
            data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
    return data.astype(np.float32) / 32768.0


def longest_silence(samples: np.ndarray, sr: int, thresh: float = 0.01) -> float:
    if len(samples) == 0:
        return 0.0
    loud = np.abs(samples) >= thresh
    idx = np.flatnonzero(loud)
    if len(idx) == 0:
        return len(samples) / sr
    head = idx[0] / sr
    tail = (len(samples) - 1 - idx[-1]) / sr
    gaps = np.diff(idx) / sr
    return float(max(head, tail, gaps.max() if len(gaps) else 0.0))


def narration_gap_max(timeline: list[dict], total_sec: float) -> float:
    """旁白之间的空档（只剩 BGM 的位置），用于判断留白是否过长。"""
    worst = 0.0
    prev_end = 0.0
    for item in timeline:
        a = item["narrationStartSec"]
        worst = max(worst, a - prev_end)
        prev_end = a + item["narrationSec"]
    return max(worst, total_sec - prev_end)


def qa_media(final: Path, timeline: list[dict]) -> dict:
    report: dict = {"file": str(final), "checks": []}
    info = probe_media(final)
    streams = info.get("streams") or []
    v = next((s for s in streams if s.get("codec_type") == "video"), {})
    a = next((s for s in streams if s.get("codec_type") == "audio"), {})
    fmt = info.get("format") or {}
    dur = float(fmt.get("duration") or 0.0)
    width, height = int(v.get("width") or 0), int(v.get("height") or 0)
    fps_raw = str(v.get("avg_frame_rate") or v.get("r_frame_rate") or "0/1")
    try:
        num_, den = (int(x) for x in fps_raw.split("/"))
        fps = num_ / den if den else 0.0
    except ValueError:
        fps = 0.0
    report.update(
        {
            "duration_sec": round(dur, 3),
            "width": width,
            "height": height,
            "fps": round(fps, 2),
            "video_codec": v.get("codec_name"),
            "audio_codec": a.get("codec_name"),
            "audio_sample_rate": int(a.get("sample_rate") or 0),
            "audio_channels": int(a.get("channels") or 0),
        }
    )

    def check(name: str, ok: bool, detail: str) -> None:
        report["checks"].append({"name": name, "ok": bool(ok), "detail": detail})
        print(f"  {'✓' if ok else '✗'} {name}：{detail}", flush=True)

    print("[体检] 成片媒体信息：", flush=True)
    check("分辨率 1080×1920", (width, height) == (1080, 1920), f"{width}×{height}")
    check("帧率 30fps", abs(fps - 30) < 0.05, f"{fps:.2f}")
    check("视频编码 H.264", str(v.get("codec_name")) == "h264", str(v.get("codec_name")))
    check("音频编码 AAC", str(a.get("codec_name")) == "aac", str(a.get("codec_name")))
    check("音频 48kHz", int(a.get("sample_rate") or 0) == 48000, f"{a.get('sample_rate')} Hz")
    check("时长 70~80s", TARGET_SEC[0] <= dur <= TARGET_SEC[1], f"{dur:.2f}s")

    if a:
        samples = decode_audio(final)
        peak = float(np.abs(samples).max())
        sil = longest_silence(samples, 44100)
        report["peak"] = round(peak, 4)
        report["longest_silence_sec"] = round(sil, 3)
        check("峰值 ≤0.95", peak <= 0.95, f"peak={peak:.3f}")
        check("无 >0.15s 静音", sil <= 0.15, f"最长静音 {sil:.3f}s")
        gap = narration_gap_max(timeline, dur)
        report["max_narration_gap_sec"] = round(gap, 3)
        print(f"  · 旁白间最大空档（仅 BGM）：{gap:.2f}s", flush=True)
    return report


def qa_bgm_ducking(props_path: Path, timeline: list[dict]) -> dict:
    """实测 BGM 口播闪避：去掉旁白重渲一个镜头窗口，比口播/非口播窗口的 RMS。"""
    cand = max(timeline, key=lambda t: t["narrationSec"])
    slide_start = int(cand["startFrame"])
    slide_end = slide_start + int(cand["durationFrames"])
    n_start = slide_start + 10  # 与 Remotion 端 keyframe 约定一致（start + 10）
    n_end = n_start + int(round(cand["narrationSec"] * FPS))
    props = read_json(props_path)
    props.pop("narrationAudio", None)
    tp = VIDEO_DIR / "_qa_bgm_only_props.json"
    write_json(tp, props)
    out = VIDEO_DIR / "_qa_bgm_only.mp4"
    from app.services import renderer

    rc = renderer.render_video(
        tp, out, VIDEO_DIR / "qa_bgm.log", frames=(slide_start, slide_end), composition=COMPOSITION
    )
    if rc != 0 or not out.exists():
        print(f"!! 闪避实测渲染失败 rc={rc}", flush=True)
        return {}
    samples = decode_audio(out)
    sr = 44100

    def rms(f0: int, f1: int) -> float:
        a = max(0, int((f0 - slide_start) * sr / FPS))
        b = min(len(samples), int((f1 - slide_start) * sr / FPS))
        if b - a < int(0.08 * sr):
            return 0.0
        return float(np.sqrt(np.mean(samples[a:b] ** 2)))

    loud_pre = rms(slide_start + 1, n_start - 4)
    loud_post = rms(n_end + 14, slide_end - 2)
    duck = rms(n_start + 16, n_end - 2)
    loud_vals = [x for x in (loud_pre, loud_post) if x > 0]
    loud = float(np.mean(loud_vals)) if loud_vals else 0.0
    ratio = duck / loud if loud > 0 else 0.0
    report = {
        "window_frames": [slide_start, slide_end],
        "rms_loud_pre": round(loud_pre, 5),
        "rms_duck": round(duck, 5),
        "rms_loud_post": round(loud_post, 5),
        "duck_ratio": round(ratio, 3),
        "expected_ratio": round(0.33 / BGM_VOLUME, 3),
    }
    ok = 0.35 <= ratio <= 0.80
    print(
        f"  {'✓' if ok else '✗'} BGM 口播闪避：口播窗口 RMS {duck:.4f} / 非口播 {loud:.4f} "
        f"→ 比值 {ratio:.2f}（期望 ≈{report['expected_ratio']:.2f}，0.62→0.33）",
        flush=True,
    )
    out.unlink(missing_ok=True)
    tp.unlink(missing_ok=True)
    return report


# ---------------- 主流程 ----------------
def run_qa_script() -> dict:
    """跑 Lead 的硬校验脚本 tools/qa_auto_trend.py（容器/静音/亮度/安全区/抽帧）。"""
    path = ROOT / "tools" / "qa_auto_trend.py"
    if not path.exists():
        print("  · 未找到 tools/qa_auto_trend.py，跳过 Lead QA", flush=True)
        return {"rc": 0, "skipped": True}
    print("[体检] 运行 tools/qa_auto_trend.py …", flush=True)
    proc = subprocess.run(
        [sys.executable, "-X", "utf8", str(path)],
        cwd=str(ROOT),
        capture_output=True,
        timeout=1200,
    )
    out = proc.stdout.decode("utf-8", "replace")
    err = proc.stderr.decode("utf-8", "replace")
    print(out.strip(), flush=True)
    if proc.returncode != 0 and err.strip():
        print("  qa_auto_trend stderr：\n" + err[-1500:], flush=True)
    return {"rc": proc.returncode, "tail": out.strip().splitlines()[-3:]}


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="AutoTrendVibe 一键出片流水线")
    p.add_argument("--no-render", action="store_true", help="只组装 props + 自检，不渲染")
    p.add_argument("--preview", action="store_true", help="props + QA 抽帧 + 前 10s 预览（不渲整片）")
    p.add_argument("--reuse-voice", action="store_true", help="文案未变时复用已有配音")
    p.add_argument("--research", type=Path, default=RESEARCH_PATH, help="数据源路径（默认项目 research.json）")
    p.add_argument("--story", type=Path, default=STORY_PATH, help="剧本路径（默认项目 story.json）")
    p.add_argument("--lead", type=float, default=LEAD, help=f"每镜开头留白（默认 {LEAD}）")
    p.add_argument("--tail", type=float, default=TAIL, help=f"旁白结束到切镜余量（默认 {TAIL}）")
    p.add_argument("--min-shot", type=float, default=MIN_SHOT, help=f"最短镜长（默认 {MIN_SHOT}）")
    p.add_argument("--qa-audio", action="store_true", help="额外实测 BGM 口播闪避（多渲一段窗口）")
    p.add_argument("--no-stills", action="store_true", help="跳过 QA 抽帧/封面（只出视频）")
    p.add_argument("--stills-only", action="store_true", help="只出封面 + QA 镜尾抽帧（不渲染视频）")
    p.add_argument("--no-qa-script", action="store_true", help="跳过 tools/qa_auto_trend.py 硬校验")
    p.add_argument("--skip-preview", action="store_true", help="整片模式跳过 preview.mp4")
    return p.parse_args()


def main() -> int:
    global LEAD, TAIL, MIN_SHOT
    args = parse_args()
    LEAD, TAIL, MIN_SHOT = args.lead, args.tail, args.min_shot
    t_start = time.time()
    VIDEO_DIR.mkdir(parents=True, exist_ok=True)

    # ---- 输入（热读） ----
    story = load_story(args.story)
    slides = story["slides"]
    print(f"[0/5] 剧本：{args.story}（{len(slides)} 镜 · {story['title']}）", flush=True)
    if not args.research.exists():
        raise SystemExit(
            f"缺少数据文件：{args.research}\n"
            "（由 data-scout 产出；联调时可用 --research 指向占位数据，数字仍须可追溯）"
        )
    R = research_view(read_json(args.research))
    if story["caliber"]:
        R["note"] = story["caliber"]  # 口径措辞以 Lead 的 story.json 为准
    print(
        f"      数据：{args.research}（yearly {len(R['yearly'])} 年 · latest "
        f"{num(R['latest']['ev']) if R['latest']['ev'] is not None else '—'}% · source={R['source']}）",
        flush=True,
    )
    for w in R["warnings"]:
        print(f"      ⚠ {w}", flush=True)

    # ---- 配音 / 时间轴 ----
    durations = ensure_voices(slides, story["title"], args.reuse_voice, story["voice"], story["rate"])
    timeline = build_timeline(durations, slides, [])
    total_frames = sum(t["durationFrames"] for t in timeline)
    bgm, beats, bgm_duration = resolve_bgm(total_frames)
    timeline = build_timeline(durations, slides, beats)
    total_frames = sum(t["durationFrames"] for t in timeline)
    print(f"      时间轴：{len(timeline)} 镜 · {total_frames} 帧 / {total_frames / FPS:.2f}s", flush=True)
    last = timeline[-1]
    if last["narrationStartSec"] + last["narrationSec"] > total_frames / FPS:
        print("!! 最后一镜旁白超出成片尾部（会被截断）", flush=True)

    # ---- 旁白整轨 ----
    narration = mix_narration(timeline, total_frames)
    narration_rel = str(narration.relative_to(REMOTION_PUBLIC)).replace("\\", "/")

    # ---- props / 脚本 / 发布文案 ----
    props = assemble_props(timeline, R, bgm, narration_rel, story)
    props_path = VIDEO_DIR / "props.json"
    write_json(props_path, props)
    write_json(
        VIDEO_DIR / "durations.json",
        {f"s{i + 1:02d}_0": t["narrationSec"] for i, t in enumerate(timeline)},
    )
    write_json(VIDEO_DIR / "script.json", build_script(story["title"], slides).model_dump())
    write_publish_copy(props, R, story)
    print(f"[4/5] props：{props_path}（{len(props['slides'])} 镜）", flush=True)

    problems, warns = self_check(props, timeline, R, bgm_duration, story)
    for w in warns:
        print(f"⚠ {w}", flush=True)
    if problems:
        print("✗ 自检未通过：\n- " + "\n- ".join(problems), flush=True)
        return 2
    print("✓ 自检通过", flush=True)

    if args.no_render:
        print("[5/5] --no-render：到此为止（未渲染）", flush=True)
        print(f"总耗时 {time.time() - t_start:.1f}s", flush=True)
        return 0

    if args.stills_only:
        print("[5/5] --stills-only：封面 + QA 镜尾抽帧…", flush=True)
        t0 = time.time()
        cover = render_cover(props_path, props["slides"])
        qa = extract_stills(props_path, props["slides"])
        print(
            f"      封面 {cover.name if cover else '失败'} · QA 帧 {len(qa)} 张 · {time.time() - t0:.1f}s",
            flush=True,
        )
        print(f"总耗时 {time.time() - t_start:.1f}s", flush=True)
        return 0

    from app.services import renderer

    # ---- 封面 / QA 抽帧 ----
    if not args.no_stills:
        print("[5/5] QA 抽帧 + 封面（每镜一帧，remotion still）…", flush=True)
        t0 = time.time()
        cover = render_cover(props_path, props["slides"])
        qa = extract_stills(props_path, props["slides"])
        print(
            f"      抽帧 {len(qa)} 张 + 封面 {cover.name if cover else '失败'} · {time.time() - t0:.1f}s",
            flush=True,
        )
        if len(qa) < 12:
            print(f"!! QA 抽帧不足 12 张（{len(qa)}），请检查 still 渲染", flush=True)

    # ---- 预览 ----
    preview = VIDEO_DIR / "preview.mp4"
    need_preview = args.preview or (not args.skip_preview and not preview.exists())
    if need_preview:
        print(f"[5/5] 渲染前 {(PREVIEW_FRAMES[1] + 1) / FPS:.0f}s 预览…", flush=True)
        log_bundle_sources()
        t0 = time.time()
        rc = renderer.render_video(
            props_path, preview, VIDEO_DIR / "preview.log", frames=PREVIEW_FRAMES, composition=COMPOSITION
        )
        print(f"      preview rc={rc} · {time.time() - t0:.1f}s · {preview}", flush=True)
        if rc != 0:
            tail = (VIDEO_DIR / "preview.log").read_text(encoding="utf-8", errors="replace").splitlines()[-20:]
            print("\n".join(tail), flush=True)
            return rc
    else:
        print("[5/5] preview.mp4 已存在（--skip-preview 可跳过）", flush=True)
    if args.preview:
        print(f"总耗时 {time.time() - t_start:.1f}s", flush=True)
        return 0

    # ---- 整片渲染 ----
    print("[5/5] 整片渲染中…", flush=True)
    log_bundle_sources()
    final = VIDEO_DIR / "final.mp4"
    t0 = time.time()
    rc = renderer.render_video(props_path, final, VIDEO_DIR / "render.log", composition=COMPOSITION)
    elapsed = time.time() - t0
    print(f"      render rc={rc} · {elapsed:.0f}s · {final}", flush=True)
    if rc != 0:
        tail = (VIDEO_DIR / "render.log").read_text(encoding="utf-8", errors="replace").splitlines()[-25:]
        print("\n".join(tail), flush=True)
        return rc

    # ---- 体检 ----
    report = qa_media(final, timeline)
    if args.qa_audio:
        report["bgm_ducking"] = qa_bgm_ducking(props_path, timeline)
    # Lead 的硬校验脚本（容器/静音/亮度/安全区/抽帧）——渲染后直接跑
    if not args.no_qa_script:
        report["lead_qa"] = run_qa_script()
    report["render_seconds"] = round(elapsed, 1)
    report["total_seconds"] = round(time.time() - t_start, 1)
    report["passed"] = all(c["ok"] for c in report["checks"]) and report.get("lead_qa", {}).get("rc", 0) == 0
    write_json(VIDEO_DIR / "qa_report.json", report)
    print(
        f"{'✓ 全片体检通过' if report['passed'] else '✗ 体检有问题，见 qa_report.json'}"
        f" · 渲染 {elapsed:.0f}s · 总耗时 {time.time() - t_start:.1f}s",
        flush=True,
    )
    return 0 if report["passed"] else 3


if __name__ == "__main__":
    sys.exit(main())
