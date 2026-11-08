# -*- coding: utf-8 -*-
"""《你的一生，就是一支K线》一键驱动：建项目 → 配音 → 时间轴设计 → BGM → 渲染。

用法：
    python -I tools/run_life_kline.py             # 全流程
    python -I tools/run_life_kline.py --no-render # 只到 props.json（调试用）

前置：python -I tools/life_kline_data.py（生成 market_base.json）
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

PID = "life-kline"
PDIR = ROOT / "storage" / "projects" / PID
DESIGN_JSON = ROOT / "storage" / "_life_kline_design.json"
FPS = 30

STYLE = "人生财经纪录片：暖白纸感、红涨绿跌、左对齐编辑排版；逐年K线蜡烛行军精确到每一岁，人生节点慢放卡点，运镜缓推+呼吸漂移+punch-in，拒绝深色霓虹与紫蓝渐变。"
PROMPT = (
    "数据口径：设计测算（城镇双职工家庭、起薪8000/月、年增~4%、55岁回落）；"
    "蜡烛四价 open/high/low/close 为各岁净资产（万元）；锚点 60 岁 100 万、78.6 岁 40 万、30 岁转负。"
    "事件与同一份 market_base.json 对齐。"
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

SCRIPT = {
    "title": "你的一生，就是一支K线",
    "shots": [
        {"year": "", "label": "你的一生 · 一支K线", "lines": [
            {"text": "你有没有想过——你的一生，其实就是一支股票的一生？"},
            {"text": "这条 K 线，画的是大多数人。"},
        ]},
        {"year": "0—21 岁", "label": "发行期 · 爸妈天使轮", "lines": [
            {"text": "0 到 22 岁，是你这支股票的发行期。"},
            {"text": "养到 18 岁 53.8 万，毕业 68 万。"},
            {"text": "爸妈重仓，一轮没撤资，也没分红。"},
        ]},
        {"year": "22—27 岁", "label": "上市 · 成长股", "lines": [
            {"text": "22 岁，你正式挂牌上市。"},
            {"text": "工资 6000，房租一扣——净流入 800。"},
            {"text": "别嫌少，你的 K 线终于开始画了。"},
        ]},
        {"year": "28—34 岁", "label": "重组与加杠杆", "lines": [
            {"text": "28 岁，重组：彩礼、三金、酒席，积蓄一次跌完。"},
            {"text": "30 岁，买房：你给自己加了 100 万的杠杆。"},
            {"text": "这一天，你的净资产变成负号。"},
            {"text": "别慌——从今天起，两个人一起坐庄。"},
        ]},
        {"year": "35—45 岁", "label": "闪崩与慢牛", "lines": [
            {"text": "35 岁闪崩：公司嫌你贵，孩子刚上学，盘中一度腰斩。"},
            {"text": "上有老下有小——你只是这个家的过路财神。"},
            {"text": "可月供雷打不动，你还是一毫米一毫米，把 K 线往上磨。"},
        ]},
        {"year": "46—60 岁", "label": "冲刺与封板", "lines": [
            {"text": "52 岁，孩子毕业——这 68 万，你替下一个人也付完了。"},
            {"text": "60 岁退休那天，你摸到 100 万：普通人一辈子的，涨停板。"},
        ]},
        {"year": "61—74 岁", "label": "分红缩水", "lines": [
            {"text": "第一个月，工资条变成养老金：3162——分红砍了九成。"},
            {"text": "从这天起，K 线不再进攻，只防守。"},
            {"text": "一场住院，就是一次闪崩。"},
        ]},
        {"year": "75—78.6 岁", "label": "退市清盘", "lines": [
            {"text": "78.6 岁，你这支股票，退市了。"},
            {"text": "一生总收入 400 多万，最后剩下——40 万。"},
            {"text": "房贷、孩子、医院，和每一个平常日子。"},
            {"text": "而这 40 万，会变成下一支股票的天使轮。"},
        ]},
        {"year": "", "label": "设计测算口径 · 不构成理财建议",
         "lines": [
            {"text": "这不是一条 K 线——这是大多数人的一生。"},
            {"text": "关注我，把你这支股票，拿稳拿好。"},
         ]},
    ],
}

EMPHASIS = [
    ["一支股票的一生", "大多数人"],
    ["发行期", "53.8 万", "68 万", "没撤资"],
    ["挂牌上市", "6000", "800"],
    ["重组", "100 万的杠杆", "负号", "两个人一起坐庄"],
    ["闪崩", "过路财神", "一毫米一毫米"],
    ["68 万", "100 万", "涨停板"],
    ["3162", "砍了九成", "一场住院"],
    ["退市", "40 万", "下一支股票的天使轮"],
    ["大多数人的一生", "拿稳拿好"],
]

# 每镜 market 规格（march 的 dayTimes/slowFrames 由设计结果注入）
MARKET_SPECS = {
    0: {"mode": "lifehook", "kicker": "你的一生 · 一支K线", "title": "开盘价 0 · 退市日 78.6 岁"},
    1: {"mode": "lifemarch", "kicker": "① 发行期 · 爸妈天使轮"},
    2: {"mode": "lifemarch", "kicker": "② 上市 · 成长股"},
    3: {"mode": "lifemarch", "kicker": "③ 重组与加杠杆"},
    4: {"mode": "lifemarch", "kicker": "④ 闪崩与慢牛"},
    5: {"mode": "lifemarch", "kicker": "⑤ 冲刺与封板"},
    6: {"mode": "lifemarch", "kicker": "⑥ 分红缩水"},
    7: {"mode": "lifemarch", "kicker": "⑦ 退市清盘"},
    8: None,  # statement
}

NOMINAL_DUR = [6.0, 12.0, 10.0, 16.0, 15.0, 9.0, 10.0, 14.0, 6.0]  # 下限（0.5s 倍数）
MARCH_KEY = {1: "chA", 2: "chB", 3: "chC", 4: "chD", 5: "chE", 6: "chF", 7: "chG"}
GAP_S = 11 / 30  # MotionShow 句间距（11 帧）

# 台词→事件对齐映射：line idx → 章 event idx（解说领先慢放窗口 ≤1.2s）
ALIGN_MAP = {
    1: {1: 0},          # chA: 53.8/68 万 → age18
    2: {0: 0},          # chB: 挂牌上市 → age22（窗口在章首）
    3: {0: 0, 1: 1},    # chC: 婚礼 → age28, 杠杆 → age30
    4: {0: 0},          # chD: 35 岁闪崩 → age35
    5: {0: 0, 1: 1},    # chE: 娃毕业 → age52, 封板 → age60
    6: {0: 0, 2: 1},    # chF: 养老金 → age61, 一场住院 → age70
    7: {2: 0},          # chG: 钱去哪了 → age78（8s 窗口，l3 收尾）
}


def align_life_lines(props, design: dict, durations: dict) -> None:
    """march 镜台词对齐：映射句的起点领先对应事件慢放窗口 ≤1.2s。

    通过给前句垫 duration_sec 实现（mix_motion_track 用同一公式排布音频，
    字幕带同源 → 音/字/画三者同步）。溢出时收缩句间距（0.37→0.25s）重排一次。
    """
    for si, shot in enumerate(props.shots):
        if si not in MARCH_KEY:
            continue
        mo = design["march"][MARCH_KEY[si]]
        d_total = design["shots"][si]["dur"]
        lines = shot.lines
        tts = [durations[f"s{si + 1:02d}_{li}"] for li in range(len(lines))]
        amap = ALIGN_MAP.get(si, {})
        ev_locals = [e["local"] for e in mo["events"]]

        def layout(gap: float):
            starts = []
            for i in range(len(lines)):
                prev_end = starts[-1] + tts[i - 1] + gap if i else 0.5
                if i in amap:
                    des = ev_locals[amap[i]] - min(1.2, 0.35 * tts[i])
                else:
                    des = prev_end + 0.15
                hard = d_total - tts[i] - (0.6 if i == len(lines) - 1 else 0.97)
                starts.append(max(prev_end, min(des, hard)))
            return starts

        starts = layout(GAP_S)
        overflow = starts[-1] + tts[-1] - (d_total - 0.5)
        if overflow > 0:
            starts = layout(0.25)
            assert starts[-1] + tts[-1] <= d_total - 0.3, (
                f"shot {si} lines overflow after gap shrink: {starts[-1] + tts[-1]:.2f} > {d_total - 0.3:.2f}"
            )
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
            f"windows={ev_locals}"
        )


def write_project_files() -> ScriptDraft:
    PDIR.mkdir(parents=True, exist_ok=True)
    (PDIR / "meta.json").write_text(json.dumps({
        "id": PID, "title": SCRIPT["title"],
        "created_at": "2026-11-04 01:00:00", "updated_at": "2026-11-04 01:00:00",
    }, ensure_ascii=False), encoding="utf-8")
    (PDIR / "settings.json").write_text(json.dumps({
        "topic": "中国人一生的财富曲线：把一个人的一生画成一支股票的K线（逐年行军+人生节点卡点）",
        "model_id": "deepseek-flash", "style": STYLE, "prompt": PROMPT,
        "target_seconds": 98, "voice": "zh-CN-YunjianNeural", "tts_rate": "+15%",
        "bgm": "life_kline_bgm", "template": "motionshow",
        "ai_director": False, "gen_scenes": False,
    }, ensure_ascii=False), encoding="utf-8")
    (PDIR / "styles.json").write_text(json.dumps({"proposals": [
        {"name": "纸感人生K线", "why": "暖白纸感 + 红涨绿跌，把一生画成一份可读的行情手账",
         "kicker": "LIFE K-LINE", "look": LOOK},
    ]}, ensure_ascii=False), encoding="utf-8")
    spath = PDIR / "script.json"
    spath.write_text(json.dumps(SCRIPT, ensure_ascii=False, indent=1), encoding="utf-8")
    return ScriptDraft.model_validate_json(spath.read_text(encoding="utf-8"))


def main() -> None:
    no_render = "--no-render" in sys.argv
    script = write_project_files()

    # 1. 配音（实测时长落盘）
    print("[1/5] 配音生成中…", flush=True)
    durations = voice.generate_script_voices(PID, script.shots, voice="zh-CN-YunjianNeural", rate="+15%")
    (PDIR / "durations.json").write_text(json.dumps(durations, ensure_ascii=False, indent=1), encoding="utf-8")

    # 2. 时间轴设计（按实测配音时长定镜长 → dayTimes/事件秒/BGM 卡点表）
    print("[2/5] 时间轴设计…", flush=True)
    subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "life_kline_design.py")], check=True)
    design = json.loads(DESIGN_JSON.read_text(encoding="utf-8"))

    # 3. BGM（事件卡点烘焙）
    print("[3/5] BGM 烘焙…", flush=True)
    subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "make_life_kline_bgm.py")], check=True)

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
            if si in MARCH_KEY:
                mo = design["march"][MARCH_KEY[si]]
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
            "reason": "个人财富/人生节点域（一生K线），与行星/宇宙模板场景域完全无关；画面为 MotionShow market 版式新增的自绘 lifehook/lifemarch 蜡烛行军模式，无 dv/* 场景与星空氛围。",
            "reusable": ["MotionShow 宿主与通用纸感令牌（基础设施）", "march 行军契约（dayTimes/事件慢放机制）", "无版权 sfx 与合成曲基底（基础设施）"],
        },
        "look": LOOK, "kicker": "",
        "bgm": {"track": "life_kline_bgm", "volume": 0.6, "query": ""},
        "shots": shot_plans,
    }
    director.save_plan(PID, plan)

    # 5. props 组装 + 渲染
    md = MarketData.model_validate_json((PDIR / "market.json").read_text(encoding="utf-8"))
    bgm_file = REMOTION_PUBLIC / "bgm" / "life_kline_bgm.mp3"
    meta = beat.analyze(bgm_file)
    bgm = BgmSpec(src="bgm/life_kline_bgm.mp3", volume=0.6, bpm=meta["bpm"], beats=meta["beats"][:400])
    props = assemble_props(
        script, durations, [None] * len(script.shots),
        bgm=bgm, plan=plan, grain_opacity=0.045, market=md,
    )
    props = bind_project(props, PID)
    align_life_lines(props, design, durations)
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
