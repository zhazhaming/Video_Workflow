# -*- coding: utf-8 -*-
"""发布调度器：预约任务存储（storage/publish/tasks.json）+ 分钟级 tick + 串行执行。

- 到点执行：scheduled 且 scheduled_at 到点 → 状态转 uploading → 独立线程跑
  creator_douyin.publish（同时只有一个浏览器任务，串行队列）。
- 补发与过期：后端没开机错过的任务，在 PUBLISH_MISSED_GRACE_HOURS 宽限内启动即补发；
  超过宽限转 overdue 待人工重新排期。
- 频率保护：两次上传间隔不小于 PUBLISH_MIN_INTERVAL_MINUTES 分钟。
- 状态机：scheduled → uploading → published / failed；failed →(retry) scheduled；
  错过超宽限 → overdue。published 作品抖音不支持编辑，「再次发布」= republish 复制新任务。
"""
import json
import threading
import time
import traceback
import uuid
from datetime import datetime, timedelta

from .. import config
from . import creator_douyin as cd
from . import publish_stats
from .publish import extract_covers

TIME_FMT = "%Y-%m-%d %H:%M:%S"
EDITABLE_STATUSES = ("scheduled", "failed")
HISTORY_LIMIT = 20


def _now() -> datetime:
    return datetime.now()


def _fmt(dt: datetime) -> str:
    return dt.strftime(TIME_FMT)


def parse_time(raw: str | None) -> datetime | None:
    """兼容 'YYYY-MM-DD HH:MM:SS' / 'YYYY-MM-DD HH:MM' / ISO 'T' 分隔。"""
    if not raw:
        return None
    s = str(raw).strip().replace("T", " ")
    for fmt in (TIME_FMT, "%Y-%m-%d %H:%M"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None


class PublishScheduler:
    """任务存储 + 调度线程 + 串行执行器。模块级单例 service。"""

    def __init__(self) -> None:
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None
        self._io_lock = threading.Lock()    # tasks.json 串行读写
        self._exec_lock = threading.Lock()  # 浏览器自动化串行（同时只跑一个任务）
        self._stats_lock = threading.Lock()  # 数据回流互斥（手动触发 vs 每日自动）
        self._last_upload_ts = 0.0
        self._account_cache: dict = {"ts": 0.0, "data": {"logged_in": False, "message": "尚未检查"}}

    # ---------- 生命周期 ----------

    def startup(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        config.PUBLISH_DIR.mkdir(parents=True, exist_ok=True)
        config.PUBLISH_SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
        self._thread = threading.Thread(target=self._loop, daemon=True, name="publish-scheduler")
        self._thread.start()

    def shutdown(self) -> None:
        self._stop.set()

    def _loop(self) -> None:
        if self._stop.wait(5):
            return
        while not self._stop.is_set():
            try:
                self._tick()
            except Exception as e:  # noqa: BLE001 — 调度线程兜底
                print(f"[publish] tick 异常: {e}\n{traceback.format_exc()[-600:]}", flush=True)
            if self._stop.wait(config.PUBLISH_TICK_SECONDS):
                return

    # ---------- 存储 ----------

    def _load_tasks(self) -> list[dict]:
        p = config.PUBLISH_TASKS_FILE
        if not p.exists():
            return []
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            return data if isinstance(data, list) else []
        except (ValueError, OSError):
            return []

    def _save_tasks(self, tasks: list[dict]) -> None:
        config.PUBLISH_TASKS_FILE.parent.mkdir(parents=True, exist_ok=True)
        tmp = config.PUBLISH_TASKS_FILE.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(tasks, ensure_ascii=False, indent=1), encoding="utf-8")
        tmp.replace(config.PUBLISH_TASKS_FILE)

    def _mutate(self, fn) -> None:
        """fn(tasks) 原地修改列表后统一落盘（io_lock 内）。"""
        with self._io_lock:
            tasks = self._load_tasks()
            fn(tasks)
            self._save_tasks(tasks)

    def _get(self, task_id: str) -> dict | None:
        with self._io_lock:
            for t in self._load_tasks():
                if t.get("id") == task_id:
                    return t
        return None

    def _set(self, task_id: str, **fields) -> None:
        def _apply(tasks: list[dict]) -> None:
            for t in tasks:
                if t.get("id") == task_id:
                    t.update(fields)
                    break
        self._mutate(_apply)

    def _append_history(self, task_id: str, action: str, note: str = "") -> None:
        def _apply(tasks: list[dict]) -> None:
            for t in tasks:
                if t.get("id") == task_id:
                    hist = t.setdefault("history", [])
                    hist.append({"at": _fmt(_now()), "action": action, "note": note[:300]})
                    del hist[:-HISTORY_LIMIT]
                    break
        self._mutate(_apply)

    # ---------- 对外 API（路由层调用） ----------

    def create_task(
        self,
        pid: str,
        title: str,
        desc: str = "",
        tags: list[str] | None = None,
        collection: str | None = None,
        declarations: list[str] | None = None,
        scheduled_at: str | None = None,
    ) -> dict:
        """新建发布任务。scheduled_at 空 = 立即发布。文案/合集/声明缺省用全局默认。"""
        video = config.RENDERS_DIR / pid / "final.mp4"
        if not video.exists():
            raise ValueError(f"项目 {pid} 没有可发布的成片（final.mp4），请先渲染")
        sat = _now()
        if scheduled_at:
            sat = parse_time(scheduled_at)
            if sat is None:
                raise ValueError("排期时间格式应为 YYYY-MM-DD HH:MM:SS")
        task = {
            "id": f"pub-{_now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}",
            "pid": pid,
            "platform": "douyin",
            "title": (title or "").strip()[:60],
            "desc": (desc or "").strip()[:1000],
            "tags": [str(t).strip().lstrip("#") for t in (tags or []) if str(t).strip()][:6],
            "collection": (collection if collection is not None else config.DOUYIN_COLLECTION).strip(),
            "declarations": list(declarations if declarations is not None else config.DOUYIN_DECLARATIONS),
            "scheduled_at": _fmt(sat),
            "status": "scheduled",
            "created_at": _fmt(_now()),
            "published_at": "",
            "item_id": "",
            "error": "",
            "warnings": [],
            "attempts": 0,
            "last_message": "",
            "source_task_id": "",
            "history": [{"at": _fmt(_now()), "action": "create", "note": ""}],
        }
        if not task["title"]:
            raise ValueError("发布标题不能为空")
        with self._io_lock:
            tasks = self._load_tasks()
            tasks.insert(0, task)
            self._save_tasks(tasks)
        return dict(task)

    def update_task(self, task_id: str, **fields) -> dict:
        """修改标题/简介/话题/合集/声明/排期。仅 scheduled / failed 可改。"""
        task = self._get(task_id)
        if not task:
            raise ValueError("任务不存在")
        if task["status"] not in EDITABLE_STATUSES:
            raise ValueError(f"当前状态（{task['status']}）不可编辑")
        patch: dict = {}
        if fields.get("title") is not None:
            title = str(fields["title"]).strip()[:60]
            if not title:
                raise ValueError("发布标题不能为空")
            patch["title"] = title
        if fields.get("desc") is not None:
            patch["desc"] = str(fields["desc"]).strip()[:1000]
        if fields.get("tags") is not None:
            patch["tags"] = [str(t).strip().lstrip("#") for t in fields["tags"] if str(t).strip()][:6]
        if fields.get("collection") is not None:
            patch["collection"] = str(fields["collection"]).strip()
        if fields.get("declarations") is not None:
            patch["declarations"] = [str(d).strip() for d in fields["declarations"] if str(d).strip()]
        if fields.get("scheduled_at") is not None:
            sat = parse_time(fields["scheduled_at"])
            if sat is None:
                raise ValueError("排期时间格式应为 YYYY-MM-DD HH:MM:SS")
            patch["scheduled_at"] = _fmt(sat)
        if patch:
            patch["error"] = ""  # 编辑视为人工介入，清掉旧错误
            self._set(task_id, **patch)
            self._append_history(task_id, "update", ",".join(patch.keys()))
        return self._get(task_id)  # type: ignore[return-value]

    def publish_now(self, task_id: str) -> dict:
        """立即执行（scheduled / failed / overdue 均可）。"""
        task = self._get(task_id)
        if not task:
            raise ValueError("任务不存在")
        if task["status"] not in ("scheduled", "failed", "overdue"):
            raise ValueError(f"当前状态（{task['status']}）不能立即发布")
        self._set(task_id, status="uploading", scheduled_at=_fmt(_now()),
                  error="", warnings=[], last_message="已加入执行队列…")
        self._append_history(task_id, "publish-now")
        threading.Thread(target=self._execute, args=(task_id,), daemon=True).start()
        return self._get(task_id)  # type: ignore[return-value]

    def retry_task(self, task_id: str) -> dict:
        task = self._get(task_id)
        if not task:
            raise ValueError("任务不存在")
        if task["status"] not in ("failed", "overdue"):
            raise ValueError(f"当前状态（{task['status']}）无需重试")
        self._set(task_id, status="scheduled", scheduled_at=_fmt(_now()),
                  error="", warnings=[], last_message="已重新排期（马上执行）")
        self._append_history(task_id, "retry")
        return self._get(task_id)  # type: ignore[return-value]

    def cancel_task(self, task_id: str) -> dict:
        task = self._get(task_id)
        if not task:
            raise ValueError("任务不存在")
        if task["status"] != "scheduled":
            raise ValueError(f"当前状态（{task['status']}）不能取消")
        self._set(task_id, status="cancelled", last_message="已取消")
        self._append_history(task_id, "cancel")
        return self._get(task_id)  # type: ignore[return-value]

    def delete_task(self, task_id: str) -> None:
        task = self._get(task_id)
        if not task:
            raise ValueError("任务不存在")
        if task["status"] == "uploading":
            raise ValueError("任务执行中，不能删除")

        def _apply(tasks: list[dict]) -> None:
            tasks[:] = [t for t in tasks if t.get("id") != task_id]
        self._mutate(_apply)

    def republish_task(self, task_id: str) -> dict:
        """再次发布：复制原任务为新的排期任务（抖音不支持编辑已发布作品）。"""
        task = self._get(task_id)
        if not task:
            raise ValueError("任务不存在")
        if task["status"] not in ("published", "failed", "overdue", "cancelled"):
            raise ValueError(f"当前状态（{task['status']}）没有再发布的意义")
        new = self.create_task(
            pid=task["pid"], title=task["title"], desc=task["desc"], tags=task["tags"],
            collection=task["collection"], declarations=task["declarations"],
            scheduled_at=None,
        )
        self._set(new["id"], source_task_id=task_id)
        self._append_history(new["id"], "republish", f"源自 {task_id}")
        return self._get(new["id"])  # type: ignore[return-value]

    def invalidate_account(self) -> None:
        """登录态变化（登录成功/登出）后清缓存，下次 overview 强制重查。"""
        self._account_cache = {"ts": 0.0, "data": {"logged_in": False, "message": "尚未检查"}}

    def overview(self, refresh_account: bool = False) -> dict:
        """发布中心总览：账号状态（带缓存）+ 任务列表（联项目标题）。"""
        now = time.time()
        if refresh_account or now - self._account_cache["ts"] > 300:
            try:
                self._account_cache["data"] = cd.check_status()
            except Exception as e:  # noqa: BLE001
                self._account_cache["data"] = {"logged_in": False, "message": f"登录态检查失败：{e}"}
            self._account_cache["ts"] = now
        tasks = []
        with self._io_lock:
            raw = self._load_tasks()
        for t in raw:
            t = dict(t)
            t["project_title"] = _project_title(t.get("pid", ""))
            tasks.append(t)
        return {
            "account": self._account_cache["data"],
            "tasks": tasks,
            "defaults": {
                "collection": config.DOUYIN_COLLECTION,
                "declarations": config.DOUYIN_DECLARATIONS,
            },
            "stats_sync": self._load_stats_state(),
        }

    # ---------- 调度与执行 ----------

    def _tick(self) -> None:
        now = _now()
        grace = timedelta(hours=config.PUBLISH_MISSED_GRACE_HOURS)
        due: list[str] = []
        with self._io_lock:
            tasks = self._load_tasks()
            changed = False
            for t in tasks:
                if t.get("status") != "scheduled":
                    continue
                sat = parse_time(t.get("scheduled_at"))
                if sat is None:
                    t["status"] = "failed"
                    t["error"] = "排期时间无法解析，请重新编辑"
                    changed = True
                    continue
                if sat <= now:
                    if now - sat > grace:
                        t["status"] = "overdue"
                        t["error"] = "错过排期且超过补发宽限期，请人工重新排期"
                        t["last_message"] = "已过期"
                        changed = True
                    else:
                        t["status"] = "uploading"
                        t["last_message"] = "排队执行…"
                        due.append(t["id"])
                        changed = True
            if changed:
                self._save_tasks(tasks)
        for tid in due:
            threading.Thread(target=self._execute, args=(tid,), daemon=True).start()
        self._maybe_sync_stats()

    # ---------- 数据回流（作品表现数据） ----------

    def _stats_state_path(self):
        return config.PUBLISH_DIR / "stats_state.json"

    def _load_stats_state(self) -> dict:
        p = self._stats_state_path()
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            return data if isinstance(data, dict) else {}
        except (ValueError, OSError):
            return {}

    def _save_stats_state(self, st: dict) -> None:
        self._stats_state_path().parent.mkdir(parents=True, exist_ok=True)
        tmp = self._stats_state_path().with_suffix(".json.tmp")
        tmp.write_text(json.dumps(st, ensure_ascii=False, indent=1), encoding="utf-8")
        tmp.replace(self._stats_state_path())

    def _maybe_sync_stats(self) -> None:
        """每日一次：有已发布任务且开关打开时，后台抓取表现数据回填台账。"""
        if not config.PUBLISH_STATS_SYNC:
            return
        state = self._load_stats_state()
        today = _fmt(_now())[:10]
        if state.get("last_sync_date") == today:
            return
        if not any(t.get("status") == "published" for t in self._load_tasks()):
            return  # 还没发过东西，不用回访
        if not self._stats_lock.acquire(blocking=False):
            return
        threading.Thread(target=self._stats_sync_job, daemon=True,
                         name="publish-stats-sync").start()

    def _stats_sync_job(self) -> None:
        """抓取 + 回填（浏览器与上传任务互斥）；结果记录在 stats_state.json 供 overview 展示。"""
        try:
            state = self._load_stats_state()
            state["last_sync_date"] = _fmt(_now())[:10]
            self._save_stats_state(state)
            with self._exec_lock:
                if self._stop.is_set():
                    return
                rows = cd.collect_stats()
            summary = publish_stats.backfill(rows)
            state = self._load_stats_state()
            state["last_result"] = {"at": _fmt(_now()), **summary}
            self._save_stats_state(state)
            print(f"[publish] 表现数据回流完成: {summary}", flush=True)
        except Exception as e:  # noqa: BLE001 — 回流失败不拦调度
            print(f"[publish] 表现数据回流失败: {e}\n{traceback.format_exc()[-400:]}", flush=True)
            try:
                state = self._load_stats_state()
                state["last_result"] = {"at": _fmt(_now()), "error": str(e)[:200]}
                self._save_stats_state(state)
            except Exception:  # noqa: BLE001
                pass
        finally:
            self._stats_lock.release()

    def sync_stats_now(self) -> dict:
        """手动触发一次表现数据回流（后台执行；进行中返回冲突）。"""
        if not self._stats_lock.acquire(blocking=False):
            raise ValueError("数据回流正在执行中")
        self._stats_lock.release()
        threading.Thread(target=self._stats_sync_job, daemon=True,
                         name="publish-stats-sync-manual").start()
        return {"started": True}

    def _wait_min_interval(self, task_id: str) -> bool:
        """两次上传之间的频率保护。返回 False 表示因服务停止而中止。"""
        interval = config.PUBLISH_MIN_INTERVAL_MINUTES * 60
        while not self._stop.is_set():
            wait = interval - (time.time() - self._last_upload_ts)
            if wait <= 0:
                return True
            self._set(task_id, last_message=f"发布限频：等待 {int(wait)} 秒…")
            if self._stop.wait(min(wait, 10)):
                return False
        return False

    def _execute(self, task_id: str) -> None:
        """执行一个 uploading 任务（串行）。成功转 published，失败转 failed。"""
        with self._exec_lock:
            task = self._get(task_id)
            if not task or task.get("status") != "uploading":
                return
            if not self._wait_min_interval(task_id):
                self._set(task_id, status="scheduled", scheduled_at=_fmt(_now()),
                          last_message="服务停止，已回排")
                return
            pid = task["pid"]
            video = config.RENDERS_DIR / pid / "final.mp4"
            try:
                if not video.exists():
                    raise RuntimeError(f"成片不存在：{video}（项目可能被重渲中或删除）")
                progress = lambda msg: self._set(task_id, last_message=str(msg)[:200])  # noqa: E731
                progress("准备封面…")
                covers = extract_covers(pid)
                if not (covers.get("vertical") and covers.get("horizontal")):
                    raise RuntimeError("封面生成失败（需要竖版+横版两张），请重试或检查 ffmpeg")
                self._append_history(task_id, "execute", f"attempt {task.get('attempts', 0) + 1}")
                result = cd.publish(
                    task_id=task_id,
                    video=video,
                    title=task["title"],
                    desc=task["desc"],
                    tags=task["tags"],
                    collection=task["collection"],
                    declarations=task["declarations"],
                    cover_v=covers["vertical"],
                    cover_h=covers["horizontal"],
                    progress=progress,
                )
                self._set(task_id, status="published", published_at=_fmt(_now()),
                          item_id=result.get("item_id", ""), error="",
                          warnings=result.get("warnings", []), last_message="发布成功")
                self._append_history(task_id, "published")
                self._last_upload_ts = time.time()
                try:  # 发布成功自动登记进回流台账（按 task_id 去重，失败不影响状态机）
                    publish_stats.register_published(
                        pid, "douyin", task["title"], task_id=task_id)
                except Exception as e:  # noqa: BLE001
                    print(f"[publish] 台账自动登记失败: {e}", flush=True)
            except Exception as e:  # noqa: BLE001 — 执行失败落状态，可重试
                print(f"[publish] 任务 {task_id} 执行失败: {e}\n{traceback.format_exc()[-600:]}", flush=True)
                self._set(task_id, status="failed", error=str(e)[:500],
                          attempts=int(task.get("attempts", 0)) + 1, last_message="发布失败")
                self._append_history(task_id, "failed", str(e)[:200])


def _project_title(pid: str) -> str:
    p = config.PROJECTS_DIR / pid / "meta.json"
    try:
        return str(json.loads(p.read_text(encoding="utf-8")).get("title") or pid)
    except (ValueError, OSError):
        return pid


service = PublishScheduler()
