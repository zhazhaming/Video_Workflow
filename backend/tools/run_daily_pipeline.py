# -*- coding: utf-8 -*-
"""每日视频流水线 CLI（包装 services/daily.py，供手动触发 / Windows 计划任务兜底）。

每日节奏：12:00 推送候选 → 白天勾选确认（排产到凌晨 / 立即制作）→ 24:00 未确认不做。

用法（在 backend/ 目录下执行，或任意目录 python -X utf8 backend/tools/...）:
    # 只选候选 + 打印任务书（不推送不生产）
    python -X utf8 tools/run_daily_pipeline.py --dry-run
    # 立即推送一批候选到飞书（不等 12:00），推送后即退出
    python -X utf8 tools/run_daily_pipeline.py --run-now
    # 立即执行所有「已排产」批次的制作（凌晨 schtasks 兜底；前台等待完成）
    python -X utf8 tools/run_daily_pipeline.py --produce
    # 推送 + 自动确认前 N 条 + 立即制作（跳过确认，老行为兜底；前台等待完成）
    python -X utf8 tools/run_daily_pipeline.py --immediate [--count 3]
    # 打印当前状态
    python -X utf8 tools/run_daily_pipeline.py --status

Windows 计划任务注册示例（后端没开时的兜底）:
    schtasks /Create /TN "VideoDailyPush"   /SC DAILY /ST 12:00 /TR "cmd /c cd /d D:\\Work\\video-workflow\\backend && python -X utf8 tools\\run_daily_pipeline.py --run-now"
    schtasks /Create /TN "VideoDailyMake"   /SC DAILY /ST 03:30 /TR "cmd /c cd /d D:\\Work\\video-workflow\\backend && python -X utf8 tools\\run_daily_pipeline.py --produce"
"""
import argparse
import json
import sys
import time
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(BACKEND_DIR / ".env")

from app.services import daily  # noqa: E402


def _wait_run(run_id: str, cfg: dict) -> int:
    """前台等待批次终态（生产在本进程的守护线程里）。"""
    budget = int(cfg["agent_timeout"]) * 5 + 1800
    deadline = time.time() + budget
    while time.time() < deadline:
        run = daily.service.get_run(run_id)
        if run and run.get("status") in ("done", "partial", "failed", "skipped"):
            print(json.dumps(daily.service._run_summary(run), ensure_ascii=False, indent=2))
            return 0 if run["status"] == "done" else 1
        time.sleep(10)
    print(f"超时（{budget // 60} 分钟）未完成，请到流水线页查看")
    return 1


def main() -> int:
    ap = argparse.ArgumentParser(description="每日热点自动出片流水线（dsh 无头会话）")
    ap.add_argument("--run-now", action="store_true", help="立即推送一批候选到飞书（推送后退出）")
    ap.add_argument("--produce", action="store_true", help="立即制作所有已排产批次（前台等待）")
    ap.add_argument("--immediate", action="store_true", help="推送+自动确认前 N 条+立即制作（跳过确认）")
    ap.add_argument("--dry-run", action="store_true", help="只选候选+打印任务书，不推送不生产")
    ap.add_argument("--status", action="store_true", help="打印当前状态与配置")
    ap.add_argument("--count", type=int, default=None, help="条数（默认读配置）")
    args = ap.parse_args()

    if args.status:
        print(json.dumps(daily.service.status(), ensure_ascii=False, indent=2))
        return 0

    if args.dry_run:
        cfg = daily.service.get_config()
        topics = daily.service._pick_candidates(10, cfg["exclude_platforms"], cfg["themes"],
                                                bool(cfg.get("theme_search_fill")))
        if not topics:
            print("热点池为空，无法选题（可先启动后端让热点雷达抓取，或稍后重试）")
            return 1
        print(f"=== 候选 {len(topics)} 条（方向命中优先）===")
        for i, t in enumerate(topics, 1):
            theme = f"｜{t['theme_name']}" if t.get("theme_name") else ""
            print(f"[{i}] {t['title']}  ({t['platform_name']} burst={t['burst']:.0f}{theme})")
        print()
        for i, t in enumerate(topics[: int(cfg["count"])], 1):
            pid = daily.service._allocate_pid()
            print(f"===== 任务书 {i}（pid={pid}）=====")
            print(daily.build_agent_prompt(pid, t, int(cfg["target_seconds"]),
                                           theme=({"name": t["theme_name"]} if t.get("theme_name") else None),
                                           style_prompt=str(cfg.get("style_prompt") or "")))
            print()
        return 0

    cfg = daily.service.get_config()

    if args.run_now:
        try:
            run = daily.service.prepare_batch("manual")
        except RuntimeError as e:
            print(f"推送失败：{e}")
            return 1
        push = "已推飞书" if run["notify"]["ok"] else f"飞书未推（{run['notify']['error']}）"
        print(f"候选 {len(run['candidates'])} 条 {push}。到流水线页勾选并确认（排产到凌晨 "
              f"{int(cfg['produce_hour']):02d}:{int(cfg['produce_minute']):02d} 或立即制作）。")
        return 0

    if args.produce:
        due = daily.service._scheduled_runs_due()
        if not due:
            print("没有已排产的批次。")
            return 0
        print(f"开始制作 {len(due)} 个已排产批次…")
        for run in due:
            daily.service._begin_production(run)
        codes = [_wait_run(r["id"], cfg) for r in due]
        return 0 if all(c == 0 for c in codes) else 1

    if args.immediate:
        try:
            run = daily.service.prepare_batch("manual", args.count)
        except RuntimeError as e:
            print(f"推送失败：{e}")
            return 1
        n = min(len(run["candidates"]), int(run.get("count") or cfg["count"]))
        indices = list(range(1, n + 1))
        daily.service.confirm_batch(run["id"], indices, schedule=False)
        print(f"已自动确认前 {n} 条并立即开始制作…")
        return _wait_run(run["id"], cfg)

    ap.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
