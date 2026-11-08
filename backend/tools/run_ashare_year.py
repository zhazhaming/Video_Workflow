# -*- coding: utf-8 -*-
"""《A股这一年：242 个交易日》一键驱动：建项目 → 配音 → 时间轴设计 → BGM → 渲染。

用法：
    python -I tools/run_ashare_year.py            # 全流程
    python -I tools/run_ashare_year.py --no-render # 只到 props.json（调试用）
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(r"D:\Work\video-workflow\backend")
sys.path.insert(0, str(ROOT))

from app.config import REMOTION_PUBLIC, RENDERS_DIR, composition_for  # noqa: E402
from app.schemas import BgmSpec, MarketData, ScriptDraft  # noqa: E402
from app.services import beat, brief, director, renderer, voice  # noqa: E402
from app.services.pipeline import assemble_props, bind_project  # noqa: E402

PID = "ashare-year-242d"
PDIR = ROOT / "storage" / "projects" / PID
DESIGN_JSON = ROOT / "storage" / "_ashare_design.json"
FPS = 30

STYLE = "财经数据纪录片：暖白纸感、红涨绿跌、左对齐编辑排版；日级行情图精确到每个交易日跳动，事件慢放卡点，拒绝深色霓虹与紫蓝渐变。"
PROMPT = (
    "数据口径：东方财富 上证指数日线（前复权），2025-11-03 至 2026-11-02 共 242 个交易日；"
    "涨跌幅基准 2025-10-31 收盘 3954.79；成交额为沪市口径。事件日期与涨跌幅与同一份日线快照对齐。"
)

LOOK = {
    "preset": "paper", "mode": "light", "bg": "paper", "accent": "#C8452D",
    "palette": ["#F2EDE4", "#E6DCCB"], "ink": "#14110F", "support": "#6B6459",
    "vignette": 0.35,
    "type": {"display": "NotoSerifSC", "body": "NotoSansSC", "mono": "JetBrainsMono"},
    "texture": {"grain": 0.04, "paper": 0.32, "halftone": 0.04, "vignette": 0.12},
    "subtitleStyle": "bold", "atmosphere": None,
    "grid": {"margin": 96, "columns": 6, "baseline": 12},
    "motion": {"tempo": 1.1, "easing": "snappy", "stagger": 1},
}

GRADE = {"contrast": 1.02, "saturate": 1.04, "brightness": 1.0, "tintOpacity": 0.0}

# 每镜台词（配音与字幕同源）；强调词按句过滤
SCRIPT = {
    "title": "A股这一年：242 个交易日的过山车",
    "shots": [
        {"year": "", "label": "A股这一年", "lines": [{"text": "A股这一年，一分钟看完。"}]},
        {"year": "2025.11—2026.02", "label": "冲高与惊吓", "lines": [
            {"text": "一年前，沪指 3976 点。"},
            {"text": "开年 17 连阳，重返 4000 点。"},
            {"text": "AI 牛市，一路冲上 4163。"},
        ]},
        {"year": "2026.03—2026.05", "label": "崩塌与修复", "lines": [
            {"text": "3 月 23 日，黑色星期一，单日暴跌 3.63%。"},
            {"text": "4 月 8 日，停火预期，百点长阳。"},
            {"text": "5 月 13 日，4242 点，年内新高。"},
        ]},
        {"year": "2026.06—2026.11", "label": "天量与探底", "lines": [
            {"text": "6 月 22 日，成交 3.76 万亿，历史第二。"},
            {"text": "7 月 17 日，科技股踩踏，近 200 只跌停。"},
            {"text": "随后连跌三个月，10 月底跌到 3599。"},
            {"text": "11 月 2 日，放量反弹，收 3638。"},
        ]},
        {"year": "", "label": "一年的成绩单", "lines": [
            {"text": "一年下来，133 天上涨，109 天下跌。"},
            {"text": "最大回撤 15%，全年下跌 8%。"},
        ]},
        {"year": "", "label": "这是 A 股的一年 · 数据：东方财富 上证指数日线 · 不构成投资建议",
         "lines": [{"text": "关注我，下个交易日见。"}]},
    ],
}

EMPHASIS = [
    ["242", "一分钟"],
    ["3976", "17 连阳", "4000", "4163"],
    ["3.63%", "黑色星期一", "百点长阳", "4242"],
    ["3.76 万亿", "200 只跌停", "3599", "3638"],
    ["133", "109", "15%"],
    ["下个交易日"],
]

# 每镜 market 规格（march 的 dayTimes/slowFrames 由设计结果注入）
MARKET_SPECS = {
    0: {"mode": "hook", "kicker": "A股这一年 · 上证指数", "title": "242 个交易日 · 一分钟走完"},
    1: {"mode": "march", "kicker": "① 冲高与惊吓 · 2025.11—2026.02"},
    2: {"mode": "march", "kicker": "② 崩塌与修复 · 2026.03—2026.05"},
    3: {"mode": "march", "kicker": "③ 天量与探底 · 2026.06—2026.11"},
    4: {"mode": "recap", "kicker": "2025.11 — 2026.11", "title": "一年的成绩单",
        "takeaway": "单日天量：6-22 全市场成交 3.76 万亿（历史第二高）"},
    5: None,  # statement
}

NOMINAL_DUR = [5.5, 14.5, 16.5, 23.0, 10.5, 6.0]  # 下限（0.5s 倍数；设计脚本按配音实测上调）
MARCH_KEY = {1: "marchA", 2: "marchB", 3: "marchC"}
GAP_S = 11 / 30  # MotionShow 句间距（11 帧）


def align_march_lines(props, design: dict, durations: dict) -> None:
    """march 镜：把第 i 句的起点对齐到第 i 个事件慢放窗口（解说先行 ≤1.2s）。

    通过给前一句垫 duration_sec 实现（mix_motion_track 用同一公式排布音频，
    字幕带同源 → 音/字/画三者同步）。硬约束：Σ句帧+镜尾 ≤ durationSec*30，
    保证镜头总帧不被撑破、切点不漂移。
    """
    for si, shot in enumerate(props.shots):
        if si not in MARCH_KEY:
            continue
        mo = design["march"][MARCH_KEY[si]]
        d_total = design["shots"][si]["dur"]
        lines = shot.lines
        tts = [durations[f"s{si + 1:02d}_{li}"] for li in range(len(lines))]
        starts = []
        for i in range(len(lines)):
            w = mo["events"][i]["local"] if i < len(mo["events"]) else d_total - 1.0
            des = w - min(1.2, 0.35 * tts[i])
            hard = d_total - tts[i] - 0.97  # 末句留足镜尾 18f
            prev_end = starts[-1] + tts[i - 1] + GAP_S if i else 0.0
            starts.append(max(prev_end, min(des, hard)))
        durs = [
            round((starts[i + 1] - starts[i] - GAP_S) if i < len(lines) - 1 else tts[-1], 3)
            for i in range(len(lines))
        ]
        used = sum(round(max(0.8, d) * 30) + 11 for d in durs) + 18
        assert used <= round(d_total * 30), f"shot {si} lines overflow: {used} > {round(d_total * 30)}"
        for i, d in enumerate(durs):
            lines[i].duration_sec = d
        print(
            f"[align] {MARCH_KEY[si]}: starts={['%.2f' % s for s in starts]} "
            f"windows={['%.2f' % e['local'] for e in mo['events']]}"
        )


def write_project_files() -> ScriptDraft:
    PDIR.mkdir(parents=True, exist_ok=True)
    (PDIR / "meta.json").write_text(json.dumps({
        "id": PID, "title": SCRIPT["title"],
        "created_at": "2026-11-03 01:00:00", "updated_at": "2026-11-03 01:00:00",
    }, ensure_ascii=False), encoding="utf-8")
    (PDIR / "settings.json").write_text(json.dumps({
        "topic": "A股近一年（242 个交易日）逐日走势复盘与关键事件",
        "model_id": "deepseek-flash", "style": STYLE, "prompt": PROMPT,
        "target_seconds": 75, "voice": "zh-CN-YunjianNeural", "tts_rate": "+10%",
        "bgm": "ashare_year_bgm", "template": "motionshow",
        "ai_director": False, "gen_scenes": False,
    }, ensure_ascii=False), encoding="utf-8")
    (PDIR / "styles.json").write_text(json.dumps({"proposals": [
        {"name": "纸感行情", "why": "暖白纸感 + 红涨绿跌，像一份可读的年度行情手账",
         "kicker": "242 DAYS", "look": LOOK},
    ]}, ensure_ascii=False), encoding="utf-8")
    spath = PDIR / "script.json"
    spath.write_text(json.dumps(SCRIPT, ensure_ascii=False, indent=1), encoding="utf-8")
    return ScriptDraft.model_validate_json(spath.read_text(encoding="utf-8"))


def main() -> None:
    no_render = "--no-render" in sys.argv
    script = write_project_files()
    design = json.loads(DESIGN_JSON.read_text(encoding="utf-8")) if DESIGN_JSON.exists() else None

    # 1. 配音（实测时长落盘）
    print("[1/5] 配音生成中…", flush=True)
    durations = voice.generate_script_voices(PID, script.shots, voice="zh-CN-YunjianNeural", rate="+10%")
    (PDIR / "durations.json").write_text(json.dumps(durations, ensure_ascii=False, indent=1), encoding="utf-8")

    # 2. 时间轴设计（按实测配音时长重新定镜长 → dayTimes/事件秒/BGM 卡点表）
    print("[2/5] 时间轴设计…", flush=True)
    subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "ashare_year_design.py")], check=True)
    design = json.loads(DESIGN_JSON.read_text(encoding="utf-8"))

    # 3. BGM（事件卡点烘焙）
    print("[3/5] BGM 烘焙…", flush=True)
    subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "make_ashare_year_bgm.py")], check=True)

    # 4. 导演方案（手工 plan；哈希与产品缓存格式一致，UI 重渲染可复用）
    print("[4/5] 组装渲染契约…", flush=True)
    sk = director.style_key(STYLE, PROMPT)
    shot_plans = []
    for si, sh in enumerate(script.shots):
        dsh = design["shots"][si]
        plan = {
            "camera": "still", "transition": "cut", "intensity": 1.0,
            "grade": GRADE, "grain": 0.045,
            "layout": "market" if MARKET_SPECS[si] else "statement",
            "durationSec": dsh["dur"], "emphasis": EMPHASIS[si],
        }
        if MARKET_SPECS[si]:
            spec = dict(MARKET_SPECS[si])
            mkey = {1: "marchA", 2: "marchB", 3: "marchC"}
            if si in mkey:
                mo = design["march"][mkey[si]]
                spec.update({
                    "start": mo["start"], "end": mo["end"],
                    "dayTimes": mo["dayTimes"], "eventIds": [e["id"] for e in mo["events"]],
                    "slowFrames": mo["slowFrames"],
                })
            plan["market"] = spec
        shot_plans.append({"hash": director.shot_hash(sh, sk), "plan": plan})

    plan = {
        "v": 2, "script_hash": director.script_fingerprint(script), "style_key": sk,
        "style_ok": True, "critic_used": False,
        "template": {
            "mode": "from_scratch",
            "reason": "A 股日级行情数据可视化（逐日行军曲线 + 事件慢放卡点），与行星/宇宙模板场景域完全无关；画面为 MotionShow market 版式新增的自绘 march/hook/recap 模式，无 dv/* 场景与星空氛围。",
            "reusable": ["MotionShow 宿主与通用纸感令牌（基础设施）", "无版权 sfx 与合成曲基底（基础设施）"],
        },
        "look": LOOK, "kicker": "",
        "bgm": {"track": "ashare_year_bgm", "volume": 0.6, "query": ""},
        "shots": shot_plans,
    }
    director.save_plan(PID, plan)

    # 5. props 组装 + 渲染
    md = MarketData.model_validate_json((PDIR / "market.json").read_text(encoding="utf-8"))
    bgm_file = REMOTION_PUBLIC / "bgm" / "ashare_year_bgm.mp3"
    meta = beat.analyze(bgm_file)
    bgm = BgmSpec(src="bgm/ashare_year_bgm.mp3", volume=0.6, bpm=meta["bpm"], beats=meta["beats"][:400])
    props = assemble_props(
        script, durations, [None] * len(script.shots),
        bgm=bgm, plan=plan, grain_opacity=0.045, market=md,
    )
    props = bind_project(props, PID)
    align_march_lines(props, design, durations)
    props = voice.apply_motion_track(PID, props)
    render_dir = RENDERS_DIR / PID
    render_dir.mkdir(parents=True, exist_ok=True)
    props_path = render_dir / "props.json"
    props_path.write_text(props.to_props_json(), encoding="utf-8")

    try:
        brief.write_prompt_pack(PID, script, plan, durations)
        print("prompt_pack.md 已生成")
    except Exception as e:  # noqa: BLE001 — 简报失败不阻断出片
        print(f"prompt_pack 跳过: {e}")

    if no_render:
        print(f"props.json 就绪（--no-render）：{props_path}")
        return

    print("[5/5] Remotion 渲染中…", flush=True)
    rc = renderer.render_video(
        props_path, render_dir / "final.mp4", render_dir / "render.log",
        composition=composition_for("motionshow"),
    )
    print(f"render rc={rc}")
    if rc == 0:
        print(f"成片：{render_dir / 'final.mp4'}")
    sys.exit(rc)


if __name__ == "__main__":
    main()
