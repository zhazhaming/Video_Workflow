# -*- coding: utf-8 -*-
"""每日视频流水线：中午推送候选到飞书 → 用户确认排产 → 凌晨自动制作。

每日节奏（用户定义的流程）：
  1. 每天 12:00 推送一次：按「我的方向」+ 第一波指数挑 10 条候选，推飞书卡片；
  2. 白天随时勾选候选并「确认并排产」→ 排到凌晨 produce 时间自动制作；
     也可以点「立即制作」马上做；当日 24:00 前未确认 → 默认不做（skipped）；
  3. 凌晨 produce 时间：批量执行所有「已排产」批次（串行逐条派 dsh 无头会话）。

创作全权交给 dsh agent —— 会话内按 AGENTS.md + video-producer skill 家族完成
选题细化→文案→BGM→配音→风格→渲染→QA（skill 主路径，★模板相关性判定照规则执行）。

dsh 无头模式契约（@deepseek-ai/dsh-headless README）：
    dsh --profile headless --json -     # 任务走 stdin，stdout 输出 NDJSON 事件流
事件：session → status/text/thinking/tool_call/tool_result → final；退出码 0=完成。
"""
import base64
import hashlib
import hmac
import io
import json
import os
import subprocess
import sys
import threading
import time
import traceback
from datetime import date, datetime, timedelta
from pathlib import Path

import httpx

from ..config import (
    BACKEND_DIR,
    DAILY_AGENT_CMD,
    DAILY_AGENT_PROFILE,
    DAILY_AGENT_TIMEOUT,
    DAILY_AI_COLUMN_QUOTA,
    DAILY_FACTS_RETRIES,
    DAILY_HOTSPOT_QUOTA,
    DAILY_NOTIFY_RESULTS,
    DAILY_PIPELINE_CONFIRM_MINUTES,
    DAILY_PIPELINE_COUNT,
    DAILY_PIPELINE_ENABLED,
    DAILY_PIPELINE_HOUR,
    DAILY_PIPELINE_MIN_BRIGHTNESS,
    DAILY_PIPELINE_MINUTE,
    DAILY_PIPELINE_TARGET_SECONDS,
    FEISHU_WEBHOOK_SECRET,
    FEISHU_WEBHOOK_URL,
    FFMPEG_BIN,
    PIPELINE_DIR,
    PIPELINE_LOGS_DIR,
    PIPELINE_RUNS_DIR,
    PROJECTS_DIR,
    RENDERS_DIR,
    ensure_dirs,
)
from . import hotspot
from .hotspot_sources import PLATFORM_NAMES

CONFIG_PATH = PIPELINE_DIR / "config.json"
STATE_PATH = PIPELINE_DIR / "state.json"

# 已用选题去重窗口（天）：同一热点一周内不重复出片
USED_KEEP_DAYS = 7
# 批次心跳：执行/待确认进程每 60s touch 运行记录；超过该秒数视为尸体
HEARTBEAT_STALE_SECONDS = 300
# 调度器轮询间隔（秒）
TICK_SECONDS = 60
MIN_FINAL_BYTES = 100_000
CANDIDATE_COUNT = 10  # 每日推送候选条数
# 方向搜索结果的站点首页/导航类标题过滤（这些不是可拍的事件）
_SEARCH_SITE_HINTS = (
    "官网", "门户", "首页", "主页", "登录", "下载", "招聘", "排行榜",
    "大全", "官方网址", " - 最", "最全", "官方网站", "app下载", "客户端",
    "有限公司", "数据中心", "专注服务", "赛事直播", "平台",
)

DEFAULT_EXCLUDE_PLATFORMS = ["github"]  # github 榜偏工具分享，不做口播选题

# 账号风格硬约束默认值（可在配置里追加/覆盖，注入每份任务书）
DEFAULT_STYLE_PROMPT = (
    "数据一定要准确：所有数字/事实必须来自权威来源并可溯源，宁缺毋滥，"
    "查不到出处的数字不上屏，不编造不夸大；"
    "动画动效优美、有层次有节奏，能吸引观众留存与互动；"
    "竖屏 1080×1920 发抖音平台；"
    "画面浅色明亮，严禁深色 AI 味背景（深色底/紫色渐变/霓虹灯管）。"
)

_CONFIG_DEFAULTS = {
    "enabled": DAILY_PIPELINE_ENABLED,
    # 推送时间：每天这个时刻推送当日候选（一天一次）
    "push_hour": 12,
    "push_minute": 0,
    # 排产制作时间：已确认的批次在每天凌晨这个时刻自动制作（env DAILY_PIPELINE_HOUR/MINUTE 可覆盖默认）
    "produce_hour": DAILY_PIPELINE_HOUR,
    "produce_minute": DAILY_PIPELINE_MINUTE,
    # 候选确认窗口（分钟；当前流程未确认=当日不做，此值作为窗口参考展示）
    "confirm_minutes": DAILY_PIPELINE_CONFIRM_MINUTES,
    "count": DAILY_PIPELINE_COUNT,
    "target_seconds": DAILY_PIPELINE_TARGET_SECONDS,
    # 事实审计硬闸门：审计不过自动派返修会话的最大重试次数
    "facts_retries": DAILY_FACTS_RETRIES,
    # 制作结果/告警推送飞书（候选推送不受影响）
    "notify_results": DAILY_NOTIFY_RESULTS,
    "exclude_platforms": list(DEFAULT_EXCLUDE_PLATFORMS),
    "agent_cmd": DAILY_AGENT_CMD,
    "agent_profile": DAILY_AGENT_PROFILE,
    "agent_timeout": DAILY_AGENT_TIMEOUT,
    # 飞书群自定义机器人 webhook/签名；page_url 供卡片按钮跳转
    "feishu_webhook": FEISHU_WEBHOOK_URL,
    "feishu_secret": FEISHU_WEBHOOK_SECRET,
    "page_url": "http://localhost:5173",
    # 我的方向：[{name, keywords}]，命中关键词的热点优先入选
    "themes": [],
    # 账号风格硬约束（注入任务书；默认即账号底线要求，可追加）
    "style_prompt": DEFAULT_STYLE_PROMPT,
    # 亮度闸门（0~1）：成片抽帧灰度均值双双低于该值判失败
    "min_brightness": DAILY_PIPELINE_MIN_BRIGHTNESS,
    # 方向搜索补齐（实验性）：热点池方向命中不足时用 Bing 网页搜索补候选。
    # 默认关——泛方向查询返回的多是百科/官网页，质量不稳；候选不足时回落全站热度。
    "theme_search_fill": False,
}


def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def next_run_at(hour: int, minute: int, now: datetime | None = None) -> datetime:
    """下一次 HH:MM 的本地时刻（已过则顺延到明天）。"""
    now = now or datetime.now()
    target = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if target <= now:
        target += timedelta(days=1)
    return target


def _hot_topic_lines(brief: dict) -> list[str]:
    """热点选题的题面（原有行为，保持字段顺序不变）。"""
    lines = [
        "【今日选题（按第一波流量潜力选出）】",
        f"- 热点标题：{brief.get('title', '')}",
        f"- 来源平台：{brief.get('platform_name') or brief.get('platform', '')}"
        f"（热度 {brief.get('hot', 0)}，第一波指数 {brief.get('burst', 0)}）",
    ]
    if brief.get("tag"):
        lines.append(f"- 标签：{brief['tag']}")
    if brief.get("summary"):
        lines.append(f"- 摘要：{brief['summary']}")
    if brief.get("theme_name"):
        lines.append(f"- 命中主题：{brief['theme_name']}")
    if brief.get("column"):
        lines.append(f"- 所属栏目：{brief['column']}（只讲这个栏目该讲的东西，不跑题）")
    if brief.get("opening_number"):
        lines.append(
            f"- 开场数字（写进第一句）：{brief['opening_number']}"
            "（第一句给这个数字，第二句给反差，第三句给代价；前 5 秒不许自我介绍）"
        )
    else:
        lines.append(
            "- 开场数字：未取到 → 你必须先找到一个可核实的数字再写第一句；"
            "找不到就换角度，不许用「今天我们来聊聊」开场。"
        )
    return lines


def _company_topic_lines(brief: dict) -> list[str]:
    """「每日一家公司」选题的题面：公司档案 + 初稿提纲 + 系列约束。"""
    c = brief.get("company") or {}
    draft = brief.get("draft") or {}
    lines = [
        "【今日选题（每日一家公司系列）】",
        f"- 公司：{c.get('name', '')}（{c.get('name_en', '')}）",
        f"- 国家/地区：{c.get('country', '')}｜总部：{c.get('hq', '')}｜行业：{c.get('sector', '')}",
        f"- 成立：{c.get('founded', '')} 年｜创始人：{c.get('founder', '')}",
        f"- 一句话：{c.get('one_liner', '')}",
    ]
    if brief.get("series_date"):
        lines.append(f"- 系列排期：{brief['series_date']}（固定栏目，片头必须带「每日一家公司」标识）")
    lines += [
        "- 开场硬规则（每一期都必须遵守）：0–5 秒 = 数字 → 反差 → 代价；前 5 秒禁止自我介绍、"
        "「本期/今天」、栏目名。「每日一家公司」标识放画面字幕，不占口播开场。",
        "- 结构硬规则：45~60 秒；3 台阶 × 15 秒（起家 / 关键转折 / 靠什么赚钱），每台阶结论先行；"
        "第 10 秒前必须交付第一个完整价值。全片不写固定开场白/结束语，不出现「我是阿扎」。",
    ]
    lines.append("- 内容初稿（提纲级，可优化；但事实必须逐条核验，不得照抄未经核实的数字）：")
    if draft.get("title"):
        lines.append(f"  标题参考：{draft['title']}")
    for b in (draft.get("beats") or [])[:8]:
        if not isinstance(b, dict):
            continue
        lines.append(f"  · {b.get('label', '')}（{b.get('sec', '')}）：{b.get('text', '')}")
    if draft.get("cta"):
        lines.append(f"  · 结尾互动：{draft['cta']}")
    if draft.get("notes"):
        lines.append(f"  · 备注：{draft['notes']}")
    lines += [
        "- 系列定位：45~60 秒一家公司一期；讲清「靠什么起家 / 关键转折 / 靠什么赚钱」，",
        "  不做财报朗读、不堆年份；开场用具体数字 + 反差做钩子，结尾留一句互动提问。",
        "- 公司介绍与渲染引擎内置领域模板无关：按 AGENTS.md ★ 规则一律 from_scratch，"
        "禁止注入行星/宇宙等无关动效；公司信息（成立年份/创始人/总部/关键事件/数字）"
        "必须逐条查证并落 research.json。",
    ]
    return lines


def build_agent_prompt(pid: str, brief: dict, target_seconds: int = 60,
                       theme: dict | None = None, style_prompt: str = "",
                       repair: dict | None = None) -> str:
    """派给 dsh 会话的任务书：热选题/公司选题 + 硬性契约 + 风格硬约束 + 收尾标记。

    repair 非空时为「事实审计返修」任务书：附带上一轮失败明细与修复指令（前置在收尾前）。
    """
    lines = [
        "你是 video-workflow 工作区的自动化视频制作 agent。今天是 "
        + date.today().isoformat()
        + "，请独立完成一条竖屏短视频的全部制作。",
        "",
        "【第一步（必须）】先读工作区根目录的 AGENTS.md 与 .agents/skills/video-producer/SKILL.md，"
        "严格按其中的流程、目录契约与产物 schema 制作（需要时再读对应阶段 skill）。",
        "",
    ]
    if brief.get("source") == "company":
        lines += _company_topic_lines(brief)
    else:
        lines += _hot_topic_lines(brief)
    lines += [
        "",
        "【硬性要求（逐条遵守）】",
        f"1. 本条视频的项目 pid 固定为 {pid}，全程不得更改（所有产物目录都以它命名）。",
        "2. 按 skill 六阶段走完整流程：选题细化（标题/角度/钩子）→ 文案 script.json → BGM →"
        " 配音 TTS → 风格 plan.json（含模板相关性判定）→ 渲染成片 → 自检。",
        f"3. 口播文案每句 ≤20 字，成片时长约 {target_seconds} 秒；开场 0–5 秒必须「数字 → 反差 → 代价」，"
        "前 5 秒禁止自我介绍/「本期/今天/大家好」/栏目名；落盘后必须跑 "
        "`python -X utf8 backend/tools/check_opening.py --script backend/storage/projects/" + pid + "/script.json`，"
        "退出码为 0 才能继续（不通过就回改首镜，不要改选题）。",
        "4. 模板相关性判定（AGENTS.md ★ 规则）必须执行，结论落 plan.json 的 template 字段；"
        "热点时事类选题一律按「无关 → from_scratch」处理，禁止注入行星/宇宙等领域动效。",
        "5. 夜间无人值守：不要编写 gen 场景（remotion-engine/src/gen/），画面用渲染引擎内置排版/渐变；"
        "不得改动仓库既有共享文件（remotion-engine 源码、backend 代码、其他项目目录），"
        "只允许创建本 pid 相关的新文件。",
        "6. 确定性步骤使用 backend/tools 的 CLI：tts_gen.py / premix_track.py / render_video.py"
        "（用法见 skill 文档；命令行建议 python -X utf8 执行）。",
        "7. 交付标准：backend/storage/renders/" + pid + "/final.mp4 渲染成功，"
        "且 backend/storage/projects/" + pid + "/ 下 meta.json、settings.json、script.json、"
        "plan.json、research.json 齐全；事实审计由流水线闸门复核（见第 11 条），"
        "视觉自查结果落 backend/storage/renders/" + pid + "/acceptance.json（见第 12 条）。",
        "8. 单点失败（TTS 网络错误等）可重试 1~2 次；渲染失败先看日志修 props 再重渲；不要中途放弃。",
        "9. 权限/沙箱纪律：遇到 PermissionError、拒绝访问或写入失败时，**绝对不要**去诊断或探测"
        " dsh 沙箱、Windows ACL/权限、系统服务或注册表（那是钻牛角尖）——直接换一种做法："
        "换目录重写、重试一次、改走本机后端 API（http://localhost:8000，它有写权限），"
        "或改用该环节的备选路线。",
        "10. BGM 备选路线：程序化生成（gen_event_bgm.py）失败时，立即改走曲库选曲"
        "（public/bgm 现有曲目按气质选 + beat_analyze.py 分析节拍），不要反复排查生成失败的原因。",
        "11. 事实审计（硬性闸门，渲 final 前必须通过）：写完 script.json 并完成调研落 research.json 后，"
        "在仓库根目录运行 python -X utf8 backend/tools/facts_audit.py --script backend/storage/projects/"
        + pid + "/script.json --research backend/storage/projects/" + pid
        + "/research.json --strict 自检；出现 unverifiable 的数字：要么改 script.json 删掉该数字/"
        "改成定性表述，要么把含该数字的权威事实连同来源补进 research.json 的 nodes（what/sources），"
        "然后重跑直到 unverifiable=0。文案改动后必须重跑（配音/props/渲染同步更新）。"
        "流水线闸门会按最终 script.json+research.json 重算复核，不要试图伪造审计结果。",
        "12. 视觉自查（建议级，严格控 token）：final 渲完后运行 python -X utf8 backend/tools/"
        "acceptance_frames.py --video backend/storage/renders/" + pid + "/final.mp4 --props "
        "backend/storage/renders/" + pid + "/props.json --out backend/storage/renders/" + pid
        + "/acceptance（≤6 帧，前 2 张镜内帧含抖音裁切模拟版），然后用 Read 一次性看完所有图片，"
        "对照 .agents/skills/video-production/references/acceptance.md 检查：字幕贴边/被裁、"
        "乱码、黑屏、构图崩坏、深色背景。能小修的（配色/字幕位置）改后重渲一次，只重读失败的 1~2 帧"
        "复检，不要逐帧反复看图。把结果写成 backend/storage/renders/" + pid
        + "/acceptance.json：{\"verdict\":\"pass|warn|fail\",\"frames\":[{\"file\":\"...\","
        "\"ok\":true,\"issues\":[]}],\"notes\":\"...\",\"video_size\":<final.mp4 字节数>,"
        "\"duration_seconds\":<成片秒数>}。",
        "",
        "【风格硬性要求（逐条遵守，违反任何一条即返工）】",
        "A. 数据准确：所有数字/事实必须来自权威来源并可溯源（落 research.json），"
        "宁缺毋滥——查不到出处的数字不上屏，不编造、不夸大。",
        "B. 浅色明亮画面：背景必须浅色明亮（米白/浅纸纹/明亮品牌色渐变），"
        "严禁深色底（如 #0d1117）、紫色渐变、霓虹灯管、深色 AI 味；文字对比清晰；调色明快通透。",
        "C. 动效优美抓留存：每镜入场→展开→收束有层次，关键数字/转折点有强调动效，切镜卡 BGM 拍点；"
        "开场 3 秒必须有强钩子；结尾必须有互动引导（提问/评论/点赞关注 CTA）。",
        "D. 竖屏抖音：1080×1920 竖屏构图，字幕排版避开抖音右侧点赞区（右侧留白 ≥ 140px）。",
        "E. 亮度自检：渲 preview 后立即抽 2 帧用 PIL 算灰度均值（应 ≥ 0.5），"
        "过暗先改配色再渲整片；整片渲完跑 python -X utf8 tools/qa_report.py 自检。",
    ]
    if theme and (theme.get("name") or theme.get("keywords")):
        kws = "、".join(theme.get("keywords") or [])
        lines.append(
            "F. 账号主题方向：" + (theme.get("name") or "")
            + (f"（关键词：{kws}）" if kws else "")
            + "——选题角度必须贴合该方向展开（确属大热点的可自然带出）。"
        )
    if style_prompt.strip():
        lines.append("G. 账号补充风格要求：" + style_prompt.strip())
    if repair:
        items = repair.get("items") or []
        detail = "\n".join(
            f"- 「{it.get('value')}」@{it.get('line_id')}（台词：{it.get('text')}）"
            for it in items[:12]
        )
        lines += [
            "",
            f"【返修说明（第 {repair.get('attempt', 1)} 次尝试；上一轮事实审计未通过）】",
            f"失败原因：{repair.get('reason', '')}",
            "无来源数字明细：",
            detail or "（见上轮日志）",
            "请按以下顺序修复：",
            "① 逐条处理明细数字——改 script.json 删掉/换成定性表述，或把含该数字的权威事实"
            "连同来源补进 research.json（nodes[].what + sources[].url，来源必须真实可查）；",
            "② 文案改动后重新走受影响环节：tts_gen.py 重新配音 → build_props/组装 props → "
            "premix_track.py 预混 → 重渲 final.mp4；",
            "③ 重跑 facts_audit.py 自检直到 unverifiable=0；",
            "④ 重做第 12 条视觉自查并更新 acceptance.json。其余硬性要求照旧。",
        ]
    lines += [
        "",
        "【收尾】全部完成后，回答的最后一行原样打印：",
        '===DAILY_RESULT{"pid":"' + pid + '","title":"<最终视频标题>","duration_seconds":<成片秒数>}',
    ]
    return "\n".join(lines)


def _parse_daily_result(final_text: str) -> dict:
    """从 final 回答里解析 ===DAILY_RESULT 标记行（容忍尾随反引号/空白）。"""
    for line in reversed((final_text or "").splitlines()):
        s = line.strip()
        if s.startswith("===DAILY_RESULT"):
            try:
                data = json.loads(s[len("===DAILY_RESULT"):].strip().strip("`"))
                if isinstance(data, dict):
                    return data
            except ValueError:
                pass
    return {}


def _is_retryable_error(err: str) -> bool:
    """网关过载/限流类瞬态错误值得重试。"""
    low = (err or "").lower()
    return "rate_limit" in low or "429" in low or "overloaded" in low


def _frame_luminance(png_bytes: bytes) -> float:
    """PNG 帧的灰度均值（0~1）。"""
    from PIL import Image

    img = Image.open(io.BytesIO(png_bytes)).convert("L").resize((48, 48))
    px = list(img.getdata())
    return sum(px) / (255.0 * len(px))


def _extract_frame(mp4: Path, at_sec: float) -> bytes | None:
    """ffmpeg 抽单帧 PNG 字节（-ss 放 -i 前走关键帧快照，够验收用）。"""
    cmd = (
        f'"{FFMPEG_BIN}" -ss {max(0.0, at_sec):.2f} -i "{mp4}" '
        f"-frames:v 1 -f image2pipe -vcodec png -"
    )
    try:
        proc = subprocess.run(cmd, shell=True, capture_output=True, timeout=60)
    except (subprocess.TimeoutExpired, OSError):
        return None
    return proc.stdout if proc.returncode == 0 and proc.stdout else None


def _mp4_duration(mp4: Path) -> float | None:
    try:
        from mutagen.mp4 import MP4

        return float(MP4(str(mp4)).info.duration)
    except Exception:  # noqa: BLE001 — 读不出时长就用固定抽帧点
        return None


def verify_render(pid: str, min_brightness: float = DAILY_PIPELINE_MIN_BRIGHTNESS) -> tuple[bool, str]:
    """验收成片：项目文件齐全 + final.mp4 存在非空 + 亮度闸门（守住浅色背景要求）。"""
    if not (PROJECTS_DIR / pid / "meta.json").exists():
        return False, "项目 meta.json 缺失（agent 未完成建项）"
    final = RENDERS_DIR / pid / "final.mp4"
    if not final.exists():
        return False, "final.mp4 未生成（渲染未完成）"
    size = final.stat().st_size
    if size < MIN_FINAL_BYTES:
        return False, f"final.mp4 过小（{size} 字节）"
    dur = _mp4_duration(final)
    points = [min(8.0, dur * 0.25), dur * 0.7] if dur and dur > 20 else [8.0, 30.0]
    lums: list[float] = []
    for t in points:
        raw = _extract_frame(final, t)
        if raw:
            try:
                lums.append(_frame_luminance(raw))
            except Exception:  # noqa: BLE001 — 坏帧跳过
                pass
    if len(lums) == len(points) and max(lums) < min_brightness:
        return False, (
            f"画面过暗（抽帧亮度 {lums[0]:.2f}/{lums[1]:.2f} 均低于 {min_brightness:.2f}），"
            "违反「不要深色 AI 味背景」要求"
        )
    return True, ""


_FACTS_MOD: object | None = None


def _facts_module():
    """延迟加载 backend/tools/facts_audit.py（stdlib-only，importlib 按路径载入）。"""
    global _FACTS_MOD
    if _FACTS_MOD is None:
        import importlib.util

        spec = importlib.util.spec_from_file_location(
            "facts_audit", BACKEND_DIR / "tools" / "facts_audit.py")
        if spec is None or spec.loader is None:
            raise RuntimeError("facts_audit.py 无法加载")
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        _FACTS_MOD = mod
    return _FACTS_MOD


def verify_facts(pid: str) -> tuple[bool, str, list[dict]]:
    """事实审计硬闸门：按当前 script.json+research.json **重算**（不信任落盘快照）。

    返回 (ok, 失败原因, unverifiable 明细)。失败原因与明细用于生成返修任务书。
    """
    pdir = PROJECTS_DIR / pid
    script = pdir / "script.json"
    research = pdir / "research.json"
    if not script.exists():
        return False, "script.json 缺失（无法做事实审计）", []
    if not research.exists():
        return False, "research.json 缺失（事实底座缺失，违反任务书 A 条：查不到出处的数字不上屏）", []
    try:
        result = _facts_module().audit(script, research)
    except Exception as e:  # noqa: BLE001 — 审计执行异常按不过关处理
        return False, f"事实审计执行失败：{e}", []
    # 服务端重算结果落库（权威快照，供前端/返修查看）
    try:
        (pdir / "facts_audit.json").write_text(
            json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
    except OSError:
        pass  # 落库失败不拦闸门：重算结果已在内存
    bad = int(result.get("summary", {}).get("unverifiable") or 0)
    if bad:
        items = [it for it in result.get("items", []) if it.get("status") == "unverifiable"]
        head = "；".join(f"「{it.get('value')}」@{it.get('line_id')}" for it in items[:8])
        return False, f"{bad} 个数字查无来源（{head}）", items
    return True, "", []


def collect_advisory(pid: str) -> dict:
    """建议级验收收集（不拦截交付）：qa_report 机检 + agent 视觉自查结果。

    返回 {"qa": {verdict, issues}, "acceptance": {verdict, issues, notes, stale}}；
    缺文件/执行失败都收敛为可记录的结构，绝不抛异常影响生产线。
    """
    out: dict = {}
    final = RENDERS_DIR / pid / "final.mp4"
    props = RENDERS_DIR / pid / "props.json"
    if final.exists():
        cmd = [sys.executable, "-X", "utf8", str(BACKEND_DIR / "tools" / "qa_report.py"),
               "--video", str(final)]
        if props.exists():
            cmd += ["--props", str(props)]
        try:
            p = subprocess.run(cmd, cwd=str(BACKEND_DIR), capture_output=True, text=True,
                               encoding="utf-8", errors="replace", timeout=300)
            data = json.loads(p.stdout) if (p.stdout or "").strip().startswith("{") else {}
            out["qa"] = {
                "verdict": data.get("verdict") or ("error" if p.returncode else "pass"),
                "issues": [str(x)[:200] for x in (data.get("issues") or [])[:6]],
            }
        except Exception as e:  # noqa: BLE001 — 机检失败只记录
            out["qa"] = {"verdict": "error", "issues": [str(e)[:200]]}
    acc_path = RENDERS_DIR / pid / "acceptance.json"
    if acc_path.exists():
        try:
            acc = json.loads(acc_path.read_text(encoding="utf-8"))
            size = final.stat().st_size if final.exists() else 0
            issues = []
            for fr in acc.get("frames") or []:
                issues += [str(x)[:120] for x in (fr.get("issues") or []) if not fr.get("ok", True)]
            out["acceptance"] = {
                "verdict": str(acc.get("verdict") or "unknown"),
                "issues": issues[:6],
                "notes": str(acc.get("notes") or "")[:200],
                "stale": bool(acc.get("video_size") not in (None, "", size)),
            }
        except Exception as e:  # noqa: BLE001 — 解析失败只记录
            out["acceptance"] = {"verdict": "error", "issues": [str(e)[:200]]}
    else:
        out["acceptance"] = {"verdict": "missing", "issues": [], "notes": "agent 未落视觉自查结果", "stale": False}
    return out


def _theme_search(query: str, max_results: int = 6) -> list[dict]:
    """按方向抓近期资讯：cn.bing.com 完整搜索页（RSS 端点只会返回官网/百科）。

    解析逻辑源自 tools/fetch_auto_trend_data.py::bing（run_auto_trend 实测可拿到
    真实文章标题+摘要）；返回 [{"title", "url", "snippet"}]，失败返回空列表。
    """
    import html as _h
    import re as _re
    import urllib.parse

    url = "https://cn.bing.com/search?q=" + urllib.parse.quote(query) + "&setlang=zh-CN"
    try:
        resp = httpx.get(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept-Language": "zh-CN,zh;q=0.9",
            },
            timeout=15,
            follow_redirects=True,
        )
        html_text = resp.text
    except Exception:  # noqa: BLE001 — 搜索失败只损失该方向的补齐
        return []
    out: list[dict] = []
    for blk in _re.findall(r'<li class="b_algo".*?</li>', html_text, _re.S)[: max_results * 2]:
        a = _re.search(r'<h2[^>]*>.*?<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', blk, _re.S)
        if not a:
            continue
        title = _h.unescape(_re.sub(r"<[^>]+>", "", a.group(2))).strip()
        p = _re.search(r'<p[^>]*>(.*?)</p>', blk, _re.S)
        snippet = _h.unescape(_re.sub(r"<[^>]+>", "", p.group(1))).strip() if p else ""
        out.append({"title": title, "url": a.group(1).replace("&amp;", "&"), "snippet": snippet})
        if len(out) >= max_results:
            break
    return out


class DailyPipelineService:
    """调度（分钟级 tick）+ 两阶段批次：中午推送候选 → 确认排产 → 凌晨制作。"""

    def __init__(self) -> None:
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None
        self._run_lock = threading.Lock()  # 生产阶段互斥（同时只跑一批）
        self._current_run_id: str | None = None
        self._awaiting_run_id: str | None = None
        self._last_run: dict | None = None
        self._producing_now = False

    # ---------- 配置 ----------

    def get_config(self) -> dict:
        cfg = dict(_CONFIG_DEFAULTS)
        if CONFIG_PATH.exists():
            try:
                stored = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
                if isinstance(stored, dict):
                    for k in cfg:
                        if k in stored and stored[k] is not None:
                            cfg[k] = stored[k]
                    # 旧配置迁移：老 hour/minute 是凌晨制作时间
                    if "hour" in stored and "produce_hour" not in stored:
                        cfg["produce_hour"] = int(stored.get("hour", 3))
                        cfg["produce_minute"] = int(stored.get("minute", 30))
            except (ValueError, OSError):
                pass
        return cfg

    def update_config(self, **kw) -> dict:
        cfg = self.get_config()
        if "enabled" in kw and kw["enabled"] is not None:
            cfg["enabled"] = bool(kw["enabled"])
        for k in ("push_hour", "push_minute", "produce_hour", "produce_minute",
                  "count", "target_seconds", "agent_timeout", "facts_retries"):
            if kw.get(k) is not None:
                cfg[k] = int(kw[k])
        if kw.get("min_brightness") is not None:
            cfg["min_brightness"] = max(0.0, min(1.0, float(kw["min_brightness"])))
        if kw.get("notify_results") is not None:
            cfg["notify_results"] = bool(kw["notify_results"])
        if kw.get("exclude_platforms") is not None:
            cfg["exclude_platforms"] = [str(p) for p in kw["exclude_platforms"]]
        if kw.get("themes") is not None:
            themes = []
            for t in kw["themes"][:10]:
                if not isinstance(t, dict):
                    continue
                name = str(t.get("name") or "").strip()[:20]
                kws = [str(k).strip()[:30] for k in (t.get("keywords") or []) if str(k).strip()]
                if name or kws:
                    themes.append({"name": name, "keywords": kws[:12]})
            cfg["themes"] = themes
        for k in ("agent_cmd", "agent_profile", "feishu_webhook", "feishu_secret",
                  "page_url", "style_prompt"):
            if kw.get(k) is not None:
                cfg[k] = str(kw[k])[: (4000 if k == "style_prompt" else 500)]
        if kw.get("theme_search_fill") is not None:
            cfg["theme_search_fill"] = bool(kw["theme_search_fill"])
        # 合法性
        cfg["push_hour"] = max(0, min(23, int(cfg["push_hour"])))
        cfg["push_minute"] = max(0, min(59, int(cfg["push_minute"])))
        cfg["produce_hour"] = max(0, min(23, int(cfg["produce_hour"])))
        cfg["produce_minute"] = max(0, min(59, int(cfg["produce_minute"])))
        cfg["count"] = max(1, min(5, int(cfg["count"])))
        cfg["target_seconds"] = max(15, min(240, int(cfg["target_seconds"])))
        cfg["agent_timeout"] = max(600, min(14400, int(cfg["agent_timeout"])))
        cfg["facts_retries"] = max(0, min(5, int(cfg["facts_retries"])))
        PIPELINE_DIR.mkdir(parents=True, exist_ok=True)
        CONFIG_PATH.write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")
        return cfg

    # ---------- 生命周期 ----------

    def startup(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        ensure_dirs()
        self._heal_stranded_runs()
        self._thread = threading.Thread(target=self._loop, daemon=True, name="daily-pipeline")
        self._thread.start()

    def shutdown(self) -> None:
        self._stop.set()

    def _loop(self) -> None:
        """分钟级 tick：到点推送（一天一次）/ 到点制作已排产批次 / 过期未确认收敛。"""
        if self._stop.wait(20):
            return
        while not self._stop.is_set():
            try:
                self._tick()
            except Exception as e:  # noqa: BLE001 — 调度线程兜底
                print(f"[daily] tick 异常: {e}\n{traceback.format_exc()[-600:]}", flush=True)
            if self._stop.wait(TICK_SECONDS):
                return

    def _tick(self) -> None:
        cfg = self.get_config()
        now = datetime.now()
        today = now.strftime("%Y-%m-%d")
        state = self._load_state()

        # 0) 过期待确认批次收敛：昨天及更早仍 awaiting → skipped（默认不做）
        self._sweep_expired_awaiting()

        if not cfg["enabled"]:
            return

        # 1) 推送事件：每天一次（按 state.last_push_date 防重）
        push_hm = f"{int(cfg['push_hour']):02d}:{int(cfg['push_minute']):02d}"
        if state.get("last_push_date") != today and now.strftime("%H:%M") >= push_hm:
            if self._awaiting_run_id or self._run_lock.locked():
                print("[daily] 已有待确认/生产中批次，今日推送跳过", flush=True)
                state["last_push_date"] = today
                self._save_state(state)
            else:
                try:
                    self.prepare_batch("auto")
                    state = self._load_state()
                    state["last_push_date"] = today
                    self._save_state(state)
                except Exception as e:  # noqa: BLE001
                    print(f"[daily] 自动推送失败: {e}", flush=True)

        # 2) 制作事件：已排产批次到点生产（一天一次防重）
        produce_hm = f"{int(cfg['produce_hour']):02d}:{int(cfg['produce_minute']):02d}"
        if state.get("last_produce_date") != today and now.strftime("%H:%M") >= produce_hm:
            scheduled = self._scheduled_runs_due()
            state["last_produce_date"] = today
            self._save_state(state)
            for run in scheduled:
                try:
                    self._begin_production(run)
                except Exception as e:  # noqa: BLE001
                    print(f"[daily] 排产制作失败: {e}", flush=True)

    def _scheduled_runs_due(self) -> list[dict]:
        """所有「已排产」的批次（按确认时间先后，逐批串行制作）。"""
        if not PIPELINE_RUNS_DIR.exists():
            return []
        due = []
        for path in PIPELINE_RUNS_DIR.glob("*.json"):
            try:
                run = json.loads(path.read_text(encoding="utf-8"))
            except (ValueError, OSError):
                continue
            if run.get("status") == "scheduled":
                due.append(run)
        due.sort(key=lambda r: r.get("confirmed", {}).get("at", ""))
        return due

    def _sweep_expired_awaiting(self) -> None:
        """昨天及更早仍在等待确认的批次 → skipped（当日 24:00 未确认默认不做）。"""
        today_prefix = date.today().strftime("%Y%m%d")
        if not PIPELINE_RUNS_DIR.exists():
            return
        for path in PIPELINE_RUNS_DIR.glob("*.json"):
            try:
                run = json.loads(path.read_text(encoding="utf-8"))
            except (ValueError, OSError):
                continue
            if run.get("status") != "awaiting_confirm":
                continue
            if str(run.get("id", "")).startswith(today_prefix):
                continue  # 今天推送的还有机会确认
            run["status"] = "skipped"
            run["error"] = "当日未确认，按「默认不做」跳过"
            run["finished_at"] = now_iso()
            self._save_run(run)
            if self._awaiting_run_id == run.get("id"):
                self._awaiting_run_id = None
            print(f"[daily] 批次 {run.get('id')} 过期未确认，已跳过", flush=True)

    # ---------- 状态 ----------

    def status(self) -> dict:
        self._heal_stranded_runs()
        cfg = self.get_config()
        return {
            **cfg,
            "agent_available": Path(cfg["agent_cmd"]).exists(),
            "running": self._run_lock.locked(),
            "awaiting_run_id": self._awaiting_run_id,
            "current_run_id": self._current_run_id,
            "last_run": self._last_run,
            "next_push_at": next_run_at(int(cfg["push_hour"]), int(cfg["push_minute"])).isoformat(timespec="seconds"),
            "next_produce_at": next_run_at(int(cfg["produce_hour"]), int(cfg["produce_minute"])).isoformat(timespec="seconds"),
        }

    # ---------- 选题（方向优先 + 第一波指数）----------

    def _pick_candidates(self, count: int, exclude_platforms: list[str], themes: list[dict],
                         theme_search_fill: bool = False) -> list[dict]:
        """候选 = 热点池方向命中 → （可选）方向网络搜索补齐 → 全站热度兜底。

        两道闸门（2026-11-13）：
        1. 栏目闸门：每条必须先归到「ai干活 / 公司大赏」，命中黑名单或归不进的直接丢弃；
        2. 配额闸门：每天最多 DAILY_HOTSPOT_QUOTA 条热点，其中至少 DAILY_AI_COLUMN_QUOTA 条来自 ai干活。
        热点只是原料，不能让泛资讯选题把账号标签冲散。
        """
        cap = max(1, min(count, DAILY_HOTSPOT_QUOTA))
        hs = hotspot.service
        items = hs.get_items(sort="burst", limit=60)
        if not items:
            try:
                hs.refresh()
                items = hs.get_items(sort="burst", limit=60)
            except Exception:  # noqa: BLE001 — 抓取失败用现有池兜底
                items = []
        excl = {p.strip().lower() for p in exclude_platforms if p.strip()}
        used = self._load_state().get("used", {})

        def _column(it) -> tuple[str, str, str]:
            return hotspot.classify_column(it.title, it.summary or "")

        def _ok(it) -> bool:
            return _column(it)[0] != hotspot.COLUMN_REJECT

        def _brief(it, theme_name: str = "") -> dict:
            column, opening_number, reject_reason = _column(it)
            return {
                "title": it.title,
                "platform": it.platform,
                "platform_name": PLATFORM_NAMES.get(it.platform, it.platform),
                "tag": it.tag or "",
                "summary": (it.summary or "")[:300],
                "hot": it.hot,
                "burst": it.burst,
                "url": it.url,
                "theme_name": theme_name,
                "source": "hot",
                "column": column,
                "opening_number": opening_number,
                "reject_reason": reject_reason,
            }

        picked: list[dict] = []
        seen: set[str] = set()

        def _usable(title: str) -> bool:
            key = hotspot.normalize_title(title)
            return key not in seen and key not in used

        # 1) 热点池方向命中（保持候选的主题归属；一个热点只归最先命中的主题）
        for theme in themes or []:
            kws = [k.strip().lower() for k in (theme.get("keywords") or []) if k.strip()]
            if not kws:
                continue
            for it in items:
                if len(picked) >= cap:
                    break
                if not _usable(it.title) or it.platform.lower() in excl or not _ok(it):
                    continue
                hay = f"{it.title} {it.tag or ''} {it.summary or ''}".lower()
                if any(k in hay for k in kws):
                    picked.append(_brief(it, theme.get("name") or ""))
                    seen.add(hotspot.normalize_title(it.title))
            if len(picked) >= cap:
                break

        # 2) 方向网络搜索补齐（实验性，默认关）：泛方向查询返回的多是百科/官网
        active_themes = [t for t in (themes or []) if (t.get("name") or t.get("keywords"))]
        if theme_search_fill and active_themes and len(picked) < cap:
            for theme in active_themes:
                if len(picked) >= cap:
                    break
                name = theme.get("name") or ""
                kws = [k for k in (theme.get("keywords") or []) if k][:2]
                query = " ".join([name, *kws, "最新进展"]).strip()
                try:
                    results = _theme_search(query, max_results=6)
                except Exception as e:  # noqa: BLE001 — 搜索失败只损失该方向的补齐
                    print(f"[daily] 方向搜索失败（{query}）: {e}", flush=True)
                    continue
                for res in results:
                    if len(picked) >= cap:
                        break
                    title = str(res.get("title") or "").strip()
                    if (
                        not title
                        or len(title) < 6
                        or any(h in title for h in _SEARCH_SITE_HINTS)
                        or not _usable(title)
                    ):
                        continue
                    column, opening_number, reject_reason = hotspot.classify_column(
                        title, str(res.get("snippet") or "")
                    )
                    if column == hotspot.COLUMN_REJECT:
                        continue
                    picked.append({
                        "title": title[:120],
                        "platform": "web",
                        "platform_name": "搜索",
                        "tag": name,
                        "summary": str(res.get("snippet") or "")[:300],
                        "hot": 0,
                        "burst": 60.0,
                        "url": str(res.get("url") or ""),
                        "theme_name": name,
                        "source": "search",
                        "column": column,
                        "opening_number": opening_number,
                        "reject_reason": reject_reason,
                    })
                    seen.add(hotspot.normalize_title(title))

        # 3) 全站热度兜底（仅当仍有缺口）
        for it in items:
            if len(picked) >= cap:
                break
            if not _usable(it.title) or it.platform.lower() in excl or not _ok(it):
                continue
            picked.append(_brief(it))
            seen.add(hotspot.normalize_title(it.title))

        # 4) 栏目配额：保证至少 N 条 ai干活（不足时用热点池里的 ai 条目顶上非 ai 的末位）
        need = DAILY_AI_COLUMN_QUOTA - sum(1 for c in picked if c.get("column") == hotspot.COLUMN_AI)
        if need > 0:
            for it in items:
                if need <= 0:
                    break
                column, _, _ = _column(it)
                if column != hotspot.COLUMN_AI:
                    continue
                key = hotspot.normalize_title(it.title)
                if key in seen or key in used:
                    continue
                candidate = _brief(it)
                slot = next(
                    (i for i in range(len(picked) - 1, -1, -1)
                     if picked[i].get("column") != hotspot.COLUMN_AI),
                    None,
                )
                if slot is None:
                    picked.append(candidate)
                else:
                    picked[slot] = candidate
                seen.add(key)
                need -= 1

        return picked

    def _load_state(self) -> dict:
        if STATE_PATH.exists():
            try:
                data = json.loads(STATE_PATH.read_text(encoding="utf-8"))
                if isinstance(data, dict):
                    return data
            except (ValueError, OSError):
                pass
        return {"used": {}}

    def _save_state(self, state: dict) -> None:
        PIPELINE_DIR.mkdir(parents=True, exist_ok=True)
        STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")

    def _mark_used(self, title: str) -> None:
        state = self._load_state()
        used: dict = state.get("used") or {}
        used[hotspot.normalize_title(title)] = date.today().isoformat()
        # 清理窗口外记录
        cutoff = (date.today() - timedelta(days=USED_KEEP_DAYS)).isoformat()
        state["used"] = {k: v for k, v in used.items() if str(v) >= cutoff}
        self._save_state(state)

    def _allocate_pid(self, taken: set[str] | None = None, prefix: str = "hot") -> str:
        """分配本批次可用的 pid；taken 为批内已分配集合（前一条失败未落盘也能错开）。"""
        taken = taken or set()
        base = f"{prefix}-" + date.today().strftime("%Y%m%d")
        for i in range(1, 21):
            pid = f"{base}-{i}"
            if pid in taken:
                continue
            if not (PROJECTS_DIR / pid).exists() and not (RENDERS_DIR / pid).exists():
                return pid
        return f"{base}-{int(time.time())}"

    # ---------- 阶段 1：每日推送候选 ----------

    def trigger_manual(self, count: int | None = None) -> str:
        """手动立即推送一批候选（一天一次的自动推送之外的主动触发）。"""
        if self._run_lock.locked():
            raise RuntimeError("流水线正在制作中")
        if self._awaiting_run_id:
            raise RuntimeError("已有待确认批次（先确认或等它过期）")
        threading.Thread(
            target=self._manual_prepare, args=(count,), daemon=True, name="daily-pipeline-manual"
        ).start()
        return "started"

    def _manual_prepare(self, count: int | None) -> None:
        try:
            self.prepare_batch("manual", count)
        except Exception as e:  # noqa: BLE001 — 手动线程兜底
            print(f"[daily] 手动推送失败: {e}", flush=True)

    def prepare_batch(self, trigger: str = "auto", count: int | None = None) -> dict:
        """按方向+热度挑候选 → 落 awaiting 记录 → 推飞书；等用户确认（排产/立即做）。"""
        if self._run_lock.locked() or self._awaiting_run_id:
            raise RuntimeError("流水线已在运行中或等待确认")
        cfg = self.get_config()
        topics = self._pick_candidates(CANDIDATE_COUNT, cfg["exclude_platforms"], cfg["themes"],
                                       bool(cfg.get("theme_search_fill")))
        if not topics:
            raise RuntimeError("热点池为空，无法选题")
        run_id = datetime.now().strftime("%Y%m%d-%H%M%S")
        run: dict = {
            "id": run_id,
            "trigger": trigger,
            "started_at": now_iso(),
            "finished_at": None,
            "status": "awaiting_confirm",
            "target_seconds": cfg["target_seconds"],
            "count": int(cfg["count"]),
            "candidates": topics,
            "confirm_deadline": f"{date.today().isoformat()} 24:00（未确认则不做）",
            "notify": self._notify_feishu(run_id, topics, cfg),
            "confirmed": None,
            "videos": [],
        }
        self._save_run(run)
        self._last_run = self._run_summary(run)
        self._awaiting_run_id = run_id
        # 待确认期间保持心跳（防止被空闲自愈误判）
        threading.Thread(
            target=self._heartbeat_until, args=(run_id,),
            daemon=True, name="daily-pipeline-heartbeat",
        ).start()
        return run

    def _heartbeat_until(self, run_id: str) -> None:
        """只要 run_id 仍是待确认批次就每 60s touch 一次它的 mtime。"""
        while not self._stop.is_set() and self._awaiting_run_id == run_id:
            try:
                self._touch_run(run_id)
            except OSError:
                pass
            self._stop.wait(60)

    # ---------- 公司系列：直接排产（无需候选确认） ----------

    def enqueue_company(self, entry: dict, company: dict, now: bool = False) -> dict:
        """把一条「每日一家公司」档期排进流水线。

        与热点批次共用同一套制作/审计/验收/日志能力，但跳过「推送候选 → 勾选确认」：
        公司是用户自己选的，直接生成一个 kind=company 的已排产批次。
        默认排到下一个凌晨制作时间；now=True 立即制作。
        """
        if now and self._run_lock.locked():
            raise RuntimeError("流水线正在制作中，暂时无法立即制作")
        for old in self.list_runs(100):
            if old.get("kind") == "company" and old.get("status") in ("scheduled", "running"):
                day = old.get("company_date") or old.get("id")
                raise RuntimeError(f"已有公司期数在排产/制作中（{day}），先完成它再排下一期")
        cfg = self.get_config()
        draft = entry.get("draft") or {}
        day = str(entry.get("date") or "")
        name = str(company.get("name") or "")
        title = str(draft.get("title") or company.get("one_liner") or name)
        brief = {
            "title": title if title.startswith(name) else f"{name}：{title}",
            "platform": "company",
            "platform_name": "每日公司",
            "tag": str(company.get("sector") or ""),
            "summary": str(company.get("one_liner") or ""),
            "hot": 0,
            "burst": 0,
            "url": "",
            "theme_name": "每日一家公司",
            "source": "company",
            "pid_prefix": "co",
            "company": company,
            "draft": draft,
            "series_date": day,
        }
        base = datetime.now().strftime("%Y%m%d-%H%M%S")
        run_id = f"{base}-c"
        for n in range(2, 20):
            if not (PIPELINE_RUNS_DIR / f"{run_id}.json").exists():
                break
            run_id = f"{base}-c{n}"
        produce_at = next_run_at(int(cfg["produce_hour"]), int(cfg["produce_minute"]))
        now_stamp = now_iso()
        run: dict = {
            "id": run_id,
            "trigger": "manual",
            "kind": "company",
            "company_date": day,
            "started_at": now_stamp,
            "finished_at": None,
            "status": "scheduled",
            "target_seconds": int(cfg["target_seconds"]),
            "count": 1,
            "candidates": [brief],
            "confirm_deadline": "",
            "produce_at": now_stamp if now else produce_at.isoformat(timespec="seconds"),
            "notify": {"ok": False, "error": "公司期数由档期板手动选定，不走候选推送"},
            "confirmed": {"indices": [1], "source": "user", "at": now_stamp},
            "videos": [],
        }
        self._save_run(run)
        self._last_run = self._run_summary(run)
        if now:
            self._begin_production(run, [brief])
            return self.get_run(run_id) or run
        return run

    # ---------- 阶段 2：确认排产 / 立即制作 ----------

    def confirm_batch(self, run_id: str, indices: list[int] | None,
                      schedule: bool = True) -> dict:
        """确认勾选的候选：schedule=True 排产到凌晨制作时间；False 立即开始制作。"""
        run = self.get_run(run_id)
        if not run:
            raise LookupError("运行记录不存在")
        if run.get("status") != "awaiting_confirm":
            raise RuntimeError("该批次不在等待确认状态")
        max_i = len(run.get("candidates") or [])
        chosen_idx = sorted({int(i) for i in (indices or []) if 1 <= int(i) <= max_i})[:5]
        if not chosen_idx:
            raise ValueError("请先勾选要制作的条目")
        cfg = self.get_config()
        topics = [run["candidates"][i - 1] for i in chosen_idx]
        run["confirmed"] = {"indices": chosen_idx, "source": "user", "at": now_iso()}
        if schedule:
            produce_at = next_run_at(int(cfg["produce_hour"]), int(cfg["produce_minute"]))
            run["status"] = "scheduled"
            run["produce_at"] = produce_at.isoformat(timespec="seconds")
            run["error"] = ""
            if self._awaiting_run_id == run_id:
                self._awaiting_run_id = None
            self._save_run(run)
            self._last_run = self._run_summary(run)
            return run
        # 立即制作
        if self._awaiting_run_id == run_id:
            self._awaiting_run_id = None
        self._begin_production(run, topics)
        return self.get_run(run_id) or run

    def produce_now(self, run_id: str) -> dict:
        """已排产批次立即开始制作（不必等凌晨）。"""
        run = self.get_run(run_id)
        if not run:
            raise LookupError("运行记录不存在")
        if run.get("status") != "scheduled":
            raise RuntimeError("该批次不在已排产状态")
        topics = self._confirmed_topics(run)
        self._begin_production(run, topics)
        return self.get_run(run_id) or run

    def _confirmed_topics(self, run: dict) -> list[dict]:
        idx = (run.get("confirmed") or {}).get("indices") or []
        cands = run.get("candidates") or []
        return [cands[i - 1] for i in idx if 1 <= i <= len(cands)]

    def _begin_production(self, run: dict, topics: list[dict] | None = None) -> None:
        """进入生产阶段（占用互斥锁；被占用则把本批标记失败）。topics 缺省时用已确认选题。"""
        if self._awaiting_run_id == run["id"]:
            self._awaiting_run_id = None
        if not self._run_lock.acquire(blocking=False):
            run["status"] = "failed"
            run["error"] = "另一批次正在制作，本批未执行"
            run["finished_at"] = now_iso()
            self._save_run(run)
            self._last_run = self._run_summary(run)
            return
        threading.Thread(
            target=self._produce_wrapped, args=(run, topics), daemon=True, name="daily-pipeline-produce"
        ).start()

    def _produce_wrapped(self, run: dict, topics: list[dict] | None) -> None:
        try:
            self._produce(run, topics)
        except Exception as e:  # noqa: BLE001 — 生产线程兜底
            run["status"] = "failed"
            run["error"] = f"{e}"
            run["finished_at"] = now_iso()
            self._save_run(run)
            self._last_run = self._run_summary(run)
            print(f"[daily] 生产异常: {e}\n{traceback.format_exc()[-800:]}", flush=True)
            try:  # 异常告警推飞书（失败不影响流程）
                self._notify_feishu_text(
                    "⚠️ 每日流水线 · 生产异常",
                    f"批次 {run.get('id')} 异常终止：{str(e)[:300]}",
                    self.get_config(),
                )
            except Exception:  # noqa: BLE001
                pass
        finally:
            self._run_lock.release()

    def _produce(self, run: dict, topics: list[dict] | None) -> None:
        ensure_dirs()
        cfg = self.get_config()
        if not topics:
            topics = self._confirmed_topics(run) or None
        if not topics:
            run.update(status="failed", error="没有已确认的选题", finished_at=now_iso())
            self._save_run(run)
            self._last_run = self._run_summary(run)
            return
        run["status"] = "running"
        run["started_at"] = now_iso()
        self._current_run_id = run["id"]
        self._save_run(run)
        # 心跳：每 60s touch 记录 mtime，让其他进程（后端 status 轮询）知道本批次还活着
        hb_stop = threading.Event()
        hb = threading.Thread(
            target=self._heartbeat_loop, args=(run["id"], hb_stop),
            daemon=True, name="daily-pipeline-heartbeat",
        )
        hb.start()
        try:
            allocated: set[str] = set()
            for i, brief in enumerate(topics, 1):
                pid = self._allocate_pid(allocated, prefix=str(brief.get("pid_prefix") or "hot"))
                allocated.add(pid)
                video: dict = {
                    "index": i,
                    "pid": pid,
                    "topic_title": brief["title"],
                    "platform": brief["platform"],
                    "hot": brief["hot"],
                    "burst": brief["burst"],
                    "theme_name": brief.get("theme_name") or "",
                    "status": "running",
                    "started_at": now_iso(),
                    "finished_at": None,
                    "exit_code": None,
                    "title": None,
                    "duration_seconds": None,
                    "final_text": "",
                    "error": "",
                    "log": "",
                }
                run["videos"].append(video)
                self._save_run(run)

                prompt = build_agent_prompt(
                    pid, brief, int(cfg["target_seconds"]),
                    theme=({"name": brief["theme_name"]} if brief.get("theme_name") else None),
                    style_prompt=str(cfg.get("style_prompt") or ""),
                )
                log_path = PIPELINE_LOGS_DIR / f"{run['id']}-{pid}.log"
                video["log"] = str(log_path)
                self._save_run(run)  # 先落库日志路径，运行中前端才能实时 tail

                # 事实审计硬闸门：不过关派返修会话重做（最多 facts_retries 次重试）；
                # 非 facts 失败（渲染缺失/过暗等）不重试，直接落 failed。
                facts: dict = {"attempts": 0, "ok": False}
                max_attempts = 1 + max(0, int(cfg.get("facts_retries") or 0))
                append_log = False
                while True:
                    facts["attempts"] += 1
                    rc, final_text, err = self._agent_session(
                        prompt, log_path, int(cfg["agent_timeout"]),
                        cfg["agent_cmd"], cfg["agent_profile"], append=append_log,
                    )
                    append_log = True
                    video["exit_code"] = rc
                    video["final_text"] = final_text[-2000:]
                    ok, reason = verify_render(pid, float(cfg.get("min_brightness") or 0.45))
                    if not ok:
                        video["status"] = "failed"
                        video["error"] = err or reason
                        break
                    fok, freason, fitems = verify_facts(pid)
                    facts["ok"] = fok
                    if fok:
                        result = _parse_daily_result(final_text)
                        video["status"] = "done"
                        video["title"] = result.get("title") or brief["title"]
                        video["duration_seconds"] = result.get("duration_seconds")
                        self._mark_used(brief["title"])
                        break
                    if facts["attempts"] >= max_attempts:
                        video["status"] = "failed"
                        video["error"] = (
                            f"事实审计未通过（共尝试 {facts['attempts']} 次）：{freason}"
                        )
                        break
                    print(f"[daily] {pid} 事实审计未通过"
                          f"（第 {facts['attempts']}/{max_attempts} 轮），派返修会话", flush=True)
                    prompt = build_agent_prompt(
                        pid, brief, int(cfg["target_seconds"]),
                        theme=({"name": brief["theme_name"]} if brief.get("theme_name") else None),
                        style_prompt=str(cfg.get("style_prompt") or ""),
                        repair={"attempt": facts["attempts"], "reason": freason, "items": fitems},
                    )

                video["facts"] = facts
                # 建议级验收（不拦截交付）：机检 + 视觉自查结果只记录，汇入飞书结果卡
                advice = collect_advisory(pid)
                video["qa"] = advice.get("qa")
                video["acceptance"] = advice.get("acceptance")
                if (video["status"] == "done" and video.get("acceptance", {}).get("verdict") in ("fail", "missing")):
                    print(f"[daily] {pid} 视觉自查建议：{video['acceptance'].get('verdict')}"
                          f"（建议级，不拦截交付）{video['acceptance'].get('issues') or ''}", flush=True)
                video["finished_at"] = now_iso()
                self._save_run(run)

            done = sum(1 for v in run["videos"] if v["status"] == "done")
            run["status"] = "done" if done == len(run["videos"]) else ("partial" if done else "failed")
            run["finished_at"] = now_iso()
            self._save_run(run)
            # 制作结果推飞书（可配置关闭；推送失败不影响流程）
            try:
                run["notify_result"] = self._notify_feishu_result(run, cfg)
                self._save_run(run)
            except Exception as e:  # noqa: BLE001 — 通知失败只记录
                print(f"[daily] 结果推送失败: {e}", flush=True)
        finally:
            hb_stop.set()
            self._current_run_id = None
            self._last_run = self._run_summary(run)

    # ---------- 飞书推送 ----------

    @staticmethod
    def _feishu_sign(secret: str, timestamp: int) -> str:
        """飞书自定义机器人签名校验：HMAC-SHA256(key=f"{ts}\\n{secret}", msg=f"{ts}\\n{secret}") → base64。"""
        string_to_sign = f"{timestamp}\n{secret}"
        hmac_code = hmac.new(string_to_sign.encode("utf-8"), digestmod=hashlib.sha256).digest()
        return base64.b64encode(hmac_code).decode("utf-8")

    def _notify_feishu(self, run_id: str, topics: list[dict], cfg: dict) -> dict:
        """推候选卡片到飞书群机器人（未配置/失败都只记录，不阻断流程）。"""
        webhook = str(cfg.get("feishu_webhook") or "").strip()
        if not webhook:
            return {"ok": False, "error": "未配置飞书 webhook（仅本地候选）"}
        if not topics:
            return {"ok": False, "error": "候选为空未推送"}
        produce_hm = f"{int(cfg['produce_hour']):02d}:{int(cfg['produce_minute']):02d}"
        lead = (f"**勾选后「确认并排产」**，将于每日凌晨 {produce_hm} 自动制作；"
                f"也可「立即制作」。今日未确认则不做。")
        lines = [lead, ""]
        for i, t in enumerate(topics, 1):
            theme = f"｜{t['theme_name']}" if t.get("theme_name") else ""
            lines.append(
                f"**{i}.** [{t['platform_name']}] {t['title']}"
                f"（波 {t['burst']:.0f}{theme}）"
            )
        page = str(cfg.get("page_url") or "http://localhost:5173").rstrip("/")
        # 深链：点击卡片直达流水线页的候选勾选区（前端读 ?tab= 初始化标签页）；
        # 开启了访问口令时链接自带 token，手机点开免输入
        link = f"{page}/?tab=pipeline&run={run_id}"
        access_token = (os.getenv("ACCESS_TOKEN") or "").strip()
        if access_token:
            link += f"&token={access_token}"
        card = {
            "config": {"wide_screen_mode": True},
            "header": {"template": "blue", "title": {"tag": "plain_text",
                                                      "content": f"🎬 视频流水线 · 今日候选 {len(topics)} 条"}},
            "elements": [
                {"tag": "div", "text": {"tag": "lark_md", "content": "\n".join(lines)}},
                {"tag": "hr"},
                {"tag": "action", "actions": [{
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "去勾选做哪几条"},
                    "type": "primary",
                    "url": link,
                }]},
                {"tag": "note", "elements": [{
                    "tag": "plain_text",
                    "content": f"批次 {run_id}｜链接需在本机/局域网打开｜当日未确认则不做",
                }]},
            ],
        }
        payload: dict = {"msg_type": "interactive", "card": card}
        return self._post_feishu(payload, cfg)

    def _post_feishu(self, payload: dict, cfg: dict) -> dict:
        """飞书 webhook 统一推送入口（附签名校验）；失败只返回错误，不抛异常。"""
        webhook = str(cfg.get("feishu_webhook") or "").strip()
        if not webhook:
            return {"ok": False, "error": "未配置飞书 webhook（仅本地候选）"}
        secret = str(cfg.get("feishu_secret") or "").strip()
        if secret:  # 机器人开启签名校验：顶层附加 timestamp + sign
            ts = int(time.time())
            payload["timestamp"] = ts
            payload["sign"] = self._feishu_sign(secret, ts)
        try:
            resp = httpx.post(webhook, json=payload, timeout=10)
            ok = resp.status_code == 200
            err = "" if ok else f"HTTP {resp.status_code}: {resp.text[:120]}"
            try:
                data = resp.json()
            except ValueError:
                data = {}
            code = data.get("code", data.get("StatusCode"))
            if ok and code not in (0, None):
                ok = False  # 飞书业务错误（如签名错/被限流）：HTTP 200 但 code≠0
                err = f"code={code}: {data.get('msg') or data.get('StatusMessage') or ''}"[:160]
        except Exception as e:  # noqa: BLE001 — 推送失败不阻断
            ok, err = False, str(e)[:200]
        return {"ok": ok, "error": err}

    def _notify_feishu_text(self, title: str, text: str, cfg: dict) -> dict:
        """简易文本告警（结果/异常/自愈通知）；notify_results=0 时静默跳过。"""
        if not cfg.get("notify_results", True):
            return {"ok": False, "error": "notify_results 已关闭"}
        payload = {"msg_type": "text", "content": {"text": f"{title}\n{text}"[:4000]}}
        return self._post_feishu(payload, cfg)

    def _notify_feishu_result(self, run: dict, cfg: dict) -> dict:
        """批次制作结果卡：成功/失败、事实审计轮次、视觉建议问题摘要。"""
        if not cfg.get("notify_results", True):
            return {"ok": False, "error": "notify_results 已关闭"}
        lines = [f"批次 {run.get('id')} ｜ 状态 {run.get('status')}"]
        for v in run.get("videos") or []:
            icon = "✅" if v.get("status") == "done" else "❌"
            seg = f"{icon} [{v.get('pid')}] {v.get('topic_title')}"
            if v.get("duration_seconds"):
                seg += f"（{v.get('duration_seconds')}s）"
            if v.get("status") != "done" and v.get("error"):
                seg += f"｜{str(v.get('error'))[:150]}"
            fa = (v.get("facts") or {}).get("attempts") or 0
            if v.get("status") == "done" and fa > 1:
                seg += f"｜事实审计返修 {fa - 1} 次后通过"
            acc = v.get("acceptance") or {}
            if acc.get("verdict") in ("warn", "fail"):
                seg += f"｜视觉建议:{acc.get('verdict')}"
            qa = v.get("qa") or {}
            if qa.get("verdict") == "fail":
                seg += "｜机检:fail"
            lines.append(seg)
        return self._notify_feishu_text("🎬 每日流水线 · 制作结果", "\n".join(lines), cfg)

    # ---------- 运行记录 ----------

    @staticmethod
    def _run_summary(run: dict) -> dict:
        return {
            "id": run.get("id"),
            "trigger": run.get("trigger"),
            "status": run.get("status"),
            "started_at": run.get("started_at"),
            "finished_at": run.get("finished_at"),
            "done": sum(1 for v in run.get("videos", []) if v.get("status") == "done"),
            "total": len(run.get("videos", [])),
        }

    def _save_run(self, run: dict) -> None:
        PIPELINE_RUNS_DIR.mkdir(parents=True, exist_ok=True)
        path = PIPELINE_RUNS_DIR / f"{run['id']}.json"
        # tmp 带线程 id：心跳线程与生产线程并发写同一记录时不会互踩；
        # Windows 上并发 replace 同一目标仍会瞬时互斥，退避重试兜底
        tmp = path.with_suffix(f".{threading.get_ident()}.tmp")
        tmp.write_text(json.dumps(run, ensure_ascii=False, indent=2), encoding="utf-8")
        for i in range(5):
            try:
                tmp.replace(path)
                return
            except PermissionError:
                time.sleep(0.05 * (i + 1))
        try:
            tmp.unlink(missing_ok=True)
        except OSError:
            pass  # 放弃本次写入：磁盘上仍是上一次快照，无损

    def list_runs(self, limit: int = 20) -> list[dict]:
        if not PIPELINE_RUNS_DIR.exists():
            return []
        runs = []
        for path in sorted(PIPELINE_RUNS_DIR.glob("*.json"), reverse=True)[: max(1, limit)]:
            try:
                run = json.loads(path.read_text(encoding="utf-8"))
            except (ValueError, OSError):
                continue
            for v in run.get("videos", []):
                v["has_video"] = (RENDERS_DIR / v.get("pid", "") / "final.mp4").exists()
            runs.append(run)
        return runs

    def get_run(self, run_id: str) -> dict | None:
        path = PIPELINE_RUNS_DIR / f"{run_id}.json"
        if not path.exists():
            return None
        try:
            run = json.loads(path.read_text(encoding="utf-8"))
        except (ValueError, OSError):
            return None
        for v in run.get("videos", []):
            v["has_video"] = (RENDERS_DIR / v.get("pid", "") / "final.mp4").exists()
        return run

    def _touch_run(self, run_id: str) -> None:
        path = PIPELINE_RUNS_DIR / f"{run_id}.json"
        if path.exists():
            os.utime(path, None)

    def _heartbeat_loop(self, run_id: str, stop: threading.Event) -> None:
        """每 60s touch 一次运行记录的 mtime（不重写内容，避免覆盖其他进程的写入）。"""
        while not stop.wait(60):
            try:
                self._touch_run(run_id)
            except OSError:
                pass

    def _heal_stranded_runs(self) -> None:
        """把无主且心跳过期的 running/awaiting/scheduled 批次收敛（会话已随旧进程消亡）。

        批次进程每 60s touch 运行记录作为心跳；心跳新鲜（<5min）的记录可能属于
        别的活进程，绝不收敛。scheduled 的排产信息在记录里，重启后 tick 会继续执行。
        """
        if self._current_run_id is not None or self._run_lock.locked():
            return
        if not PIPELINE_RUNS_DIR.exists():
            return
        for path in PIPELINE_RUNS_DIR.glob("*.json"):
            try:
                if time.time() - path.stat().st_mtime < HEARTBEAT_STALE_SECONDS:
                    continue  # 心跳新鲜：可能正被其他进程执行
                run = json.loads(path.read_text(encoding="utf-8"))
            except (ValueError, OSError):
                continue
            if run.get("status") == "awaiting_confirm":
                run.update(status="skipped", error="确认窗口未处理（进程重启丢失），默认不做",
                           finished_at=now_iso())
            elif run.get("status") == "running":
                for v in run.get("videos", []):
                    if v.get("status") in ("running", "pending"):
                        v["status"] = "failed"
                        v["error"] = "会话中断（后端重启），本次未完成"
                        v["finished_at"] = now_iso()
                run["status"] = "failed"
                run["error"] = "后端中途重启，批次中断"
                run["finished_at"] = now_iso()
            else:
                continue
            self._save_run(run)
            print(f"[daily] 已收敛中断批次 {run.get('id')}", flush=True)
            try:  # 自愈告警推飞书（startup/status 时触发，失败不影响）
                self._notify_feishu_text(
                    "🩹 每日流水线 · 中断批次已收敛",
                    f"批次 {run.get('id')} 因后端重启/进程消亡被收敛为 {run.get('status')}："
                    f"{run.get('error')}",
                    self.get_config(),
                )
            except Exception:  # noqa: BLE001
                pass

    # ---------- dsh 会话 ----------

    def _agent_session(
        self, prompt: str, log_path: Path, timeout: int, agent_cmd: str, agent_profile: str,
        append: bool = False,
    ) -> tuple[int, str, str]:
        """跑一次 dsh headless 会话；网关限流类瞬态错误自动重试。

        append=True 时事件流追加到既有日志（事实审计返修轮共用同一份日志）。
        """
        rc, final_text, err = "", "", ""
        for attempt in range(1, 4):
            rc, final_text, err = self._agent_once(
                prompt, log_path, timeout, agent_cmd, agent_profile,
                append=append or attempt > 1,
            )
            if rc == 0:
                return rc, final_text, ""
            if not _is_retryable_error(err):
                return rc, final_text, err
            print(f"[daily] dsh 网关限流（第 {attempt} 次），30s 后重试", flush=True)
            time.sleep(30)
        return rc, final_text, err

    def _agent_once(
        self, prompt: str, log_path: Path, timeout: int, agent_cmd: str, agent_profile: str, append: bool
    ) -> tuple[int, str, str]:
        """spawn `dsh --profile <p> --json -`，stdin 投任务书，stdout 事件流落日志。

        返回 (退出码, final 文本, 错误摘要)。超时杀整棵进程树（dsh.cmd → cmd.exe → node）。
        """
        log_path.parent.mkdir(parents=True, exist_ok=True)
        cmd = f'"{agent_cmd}" --profile {agent_profile} --json -'
        final_text = ""
        last_error = ""
        with open(log_path, "a" if append else "w", encoding="utf-8") as lf:
            lf.write(f"\n===== 会话 {now_iso()} =====\n")
            proc = subprocess.Popen(  # noqa: S603 — 受控白名单命令
                cmd,
                cwd=str(BACKEND_DIR.parent),
                shell=True,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding="utf-8",
                errors="replace",
            )
            killed = threading.Event()

            def _kill() -> None:
                killed.set()
                subprocess.run(  # noqa: S603
                    ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                    capture_output=True,
                    timeout=30,
                )

            timer = threading.Timer(timeout, _kill)
            timer.daemon = True
            timer.start()
            try:
                assert proc.stdin is not None
                try:
                    proc.stdin.write(prompt)
                    proc.stdin.close()
                except (BrokenPipeError, OSError):
                    pass  # dsh 提前退出（如参数错误）：从 stdout 循环收集诊断后原样返回
                assert proc.stdout is not None
                for line in proc.stdout:
                    lf.write(line)
                    lf.flush()
                    s = line.strip()
                    if not s.startswith("{"):
                        continue
                    try:
                        ev = json.loads(s)
                    except ValueError:
                        continue
                    ev_type = ev.get("type")
                    if ev_type == "final":
                        final_text = str(ev.get("text") or "")
                    elif ev_type == "status" and (ev.get("phase") == "turn_end"):
                        reason = ev.get("reason") or {}
                        if reason.get("kind") == "error":
                            e = reason.get("error") or {}
                            last_error = f"{e.get('code', '')}: {e.get('message', '')}"[:500]
            finally:
                timer.cancel()
            rc = proc.wait()
        if killed.is_set():
            return rc, final_text, f"TIMEOUT: 会话超过 {timeout // 60} 分钟，已终止"
        return rc, final_text, last_error


service = DailyPipelineService()
