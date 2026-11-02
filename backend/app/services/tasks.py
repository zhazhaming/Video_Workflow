# -*- coding: utf-8 -*-
"""任务管理：内存注册表 + 后台线程执行渲染流水线。

Phase 1 用进程内字典足够；若以后多进程部署，换成 Redis/DB 即可，接口不变。
"""
import threading
import traceback
import uuid

from ..config import (
    BGM_PUBLIC_SUBDIR,
    PROJECTS_DIR,
    REMOTION_PUBLIC,
    RENDERS_DIR,
    composition_for,
    ensure_dirs,
)
from ..schemas import BgmSpec, MarketData, ProjectSettings, ScriptDraft, TaskStatus, now_iso
from . import beat, bgm as bgm_svc, brief, director, images, llm, music, renderer, voice
from .pipeline import assemble_props, bind_project

# 每个项目的活跃任务（同一项目同时只允许一个渲染）
_active_by_project: dict[str, str] = {}
_tasks: dict[str, dict] = {}
_lock = threading.Lock()


class TaskManager:
    def get(self, task_id: str) -> dict | None:
        with _lock:
            t = _tasks.get(task_id)
            return dict(t) if t else None

    def active_task_of(self, project_id: str) -> str | None:
        with _lock:
            tid = _active_by_project.get(project_id)
            if tid and _tasks.get(tid, {}).get("finished_at") is None:
                return tid
            return None

    def _seed_task(self, project_id: str, kind: str | None) -> str:
        if self.active_task_of(project_id):
            raise RuntimeError("该项目已有任务在进行中")
        task_id = uuid.uuid4().hex[:12]
        with _lock:
            _tasks[task_id] = {
                "id": task_id,
                "project_id": project_id,
                "kind": kind,
                "stage": "queued",
                "message": "排队中",
                "video_url": None,
                "error": None,
                "log_tail": None,
                "started_at": now_iso(),
                "finished_at": None,
            }
            _active_by_project[project_id] = task_id
        return task_id

    def start_render(self, project_id: str, script: ScriptDraft) -> str:
        task_id = self._seed_task(project_id, "render")
        thread = threading.Thread(
            target=self._run, args=(task_id, project_id, script), daemon=True
        )
        thread.start()
        return task_id

    def start_task(self, project_id: str, kind: str, fn) -> str:
        """六步流程的通用任务：fn(update) 在后台线程执行。

        fn 通过 update(stage=..., message=..., video_url=..., log_tail=..., error=...)
        汇报进度；正常返回即视为成功（stage 置 done），抛异常则置 error。
        """
        task_id = self._seed_task(project_id, kind)
        thread = threading.Thread(
            target=self._run_generic, args=(task_id, project_id, fn), daemon=True
        )
        thread.start()
        return task_id

    def _run_generic(self, task_id: str, project_id: str, fn) -> None:
        ensure_dirs()
        try:
            def update(**kw) -> None:
                self._update(task_id, **kw)

            fn(update)
            self._update(task_id, stage="done", finished_at=now_iso())  # 保留 fn 的最后消息
        except Exception as e:  # noqa: BLE001 — 后台线程兜底
            self._update(
                task_id,
                stage="error",
                error=str(e),
                message=f"失败：{e}",
                log_tail=traceback.format_exc()[-2000:],
                finished_at=now_iso(),
            )
        finally:
            self._finish(task_id, project_id)

    def _update(self, task_id: str, **kw) -> None:
        with _lock:
            if task_id in _tasks:
                _tasks[task_id].update(kw)

    def _finish(self, task_id: str, project_id: str) -> None:
        with _lock:
            if _active_by_project.get(project_id) == task_id:
                del _active_by_project[project_id]

    def _run(self, task_id: str, project_id: str, script: ScriptDraft) -> None:
        ensure_dirs()
        try:
            settings = load_settings(project_id)

            # 1. 配音（按项目设置选择音色/语速）
            self._update(
                task_id,
                stage="voice",
                message=f"正在生成配音（{settings.voice}）...",
            )
            durations = voice.generate_script_voices(
                project_id, script.shots, voice=settings.voice, rate=settings.tts_rate
            )

            # 2. 画面：自定义图优先，缺失补占位图
            self._update(task_id, stage="images", message="准备画面素材...")
            image_rels = images.ensure_images(project_id, script.shots)

            # 3. AI 导演（多阶段 Agent：风格定调 → 分批逐镜编排 → 节奏审查；失败逐级降级）
            plan = None
            grain_opacity = None
            if settings.ai_director and llm.llm_available():
                self._update(task_id, stage="directing", message="AI 导演启动…")
                try:
                    bgm_dir0 = REMOTION_PUBLIC / BGM_PUBLIC_SUBDIR
                    track_metas = bgm_svc.list_tracks() if bgm_dir0.exists() else []
                    model_id = settings.model_id
                    style_box: dict = {}  # 阶段 1 产出，供阶段 2 的批次闭包引用
                    mode_box: dict = {}  # 阶段 0 判定结论，供风格/逐镜闭包注入 from_scratch 禁令

                    def _progress(msg: str) -> None:
                        self._update(task_id, stage="directing", message=msg)
                        print(f"[director] {msg}", flush=True)

                    def _judge():
                        # 工作区规则（AGENTS.md）：先判定选题与模板库是否相关
                        return llm.judge_template_relevance(script, model_id)

                    def _gen_style():
                        out = llm.generate_style_bible(
                            script, settings.style, settings.prompt, track_metas, model_id,
                            template_mode=mode_box.get("mode"),
                        )
                        style_box["v"] = out
                        return out

                    def _gen_batch(start: int, end: int, tail: list[dict]):
                        return llm.generate_shot_plans(
                            script, style_box.get("v") or {}, start, end, tail, model_id,
                            template_mode=mode_box.get("mode"),
                        )

                    def _critic(shot_plans: list[dict]):
                        return llm.critic_rhythm(script, shot_plans, model_id)

                    plan = director.create_plan(
                        project_id,
                        script,
                        settings.style,
                        settings.prompt,
                        track_metas,
                        _gen_style,
                        _gen_batch,
                        _critic,
                        _progress,
                        _judge,
                        mode_box,
                    )
                    shot_plans = [item.get("plan") or {} for item in plan.get("shots", [])]
                    grain_opacity = (
                        sum(s["grain"] for s in shot_plans) / len(shot_plans)
                        if shot_plans
                        else None
                    )
                    st = plan.get("_stats") or {}
                    ai_track = (plan.get("bgm") or {}).get("track") or ""
                    print(
                        f"[director] plan ready: {st.get('shots_total')} shots "
                        f"(reused {st.get('shots_reused')}, batches {st.get('batches')}, "
                        f"style_ok={st.get('style_ok')}, critic={st.get('critic_used')}), "
                        f"bgm={ai_track!r}",
                        flush=True,
                    )
                    # 工作区规则：模板无关选题 → 自动产出从零创作提示词包
                    if (plan.get("template") or {}).get("mode") == "from_scratch":
                        try:
                            brief.write_prompt_pack(project_id, script, plan, durations)
                            self._update(
                                task_id,
                                stage="directing",
                                message="选题与模板无关：已生成从零创作提示词包 prompt_pack.md",
                            )
                        except Exception as pe:  # noqa: BLE001 — 简报失败不阻断出片
                            print(f"[brief] prompt pack 生成失败: {pe}", flush=True)
                except Exception as e:  # noqa: BLE001 — 导演失败不阻断出片
                    plan = None
                    grain_opacity = None
                    self._update(task_id, stage="directing", message="AI 导演失败，整体回退内置规则")
                    print(f"[director] 生成失败，回退固定规则: {e}", flush=True)
            elif settings.ai_director:
                self._update(task_id, message="跳过 AI 导演（未配置可用模型），使用内置规则")

            # 4. BGM 选择：AI 导演选曲 > 项目指定 > 情绪关键词自动匹配
            bgm_dir = REMOTION_PUBLIC / BGM_PUBLIC_SUBDIR
            available = (
                [f.stem for f in bgm_dir.iterdir() if f.suffix.lower() in (".mp3", ".wav")]
                if bgm_dir.exists()
                else []
            )
            bgm_name = settings.bgm
            ai_bgm = (plan or {}).get("bgm", {}) or {}
            ai_track = ai_bgm.get("track") or ""
            if bgm_name == "auto":
                if ai_track == "__search__":
                    # AI 指定在线搜曲：按风格关键词搜 CC 曲目并导入曲库（幂等）
                    query = ai_bgm.get("query") or music.bgm_query_for(script, settings.style)
                    self._update(task_id, stage="directing", message=f"在线搜索 BGM：{query}…")
                    print(f"[bgm] 在线搜曲: {query}", flush=True)
                    searched = music.auto_search_track(query, available)
                    if searched:
                        bgm_name = searched
                        self._update(task_id, stage="directing", message=f"在线搜曲导入：{bgm_name}")
                    else:
                        self._update(task_id, message="在线搜曲失败，回退本地曲库匹配")
                        bgm_name = music.pick_track(script, available)
                        self._update(task_id, stage="images", message=f"自动匹配 BGM：{bgm_name}")
                elif ai_track and ai_track in available:
                    bgm_name = ai_track
                    self._update(task_id, stage="directing", message=f"AI 导演选曲：{bgm_name}")
                else:
                    if ai_track:
                        # AI 编造了曲库外的曲名 → 按题材在线搜曲（幂等），再失败才关键词匹配
                        query = ai_bgm.get("query") or music.bgm_query_for(script, settings.style)
                        self._update(task_id, stage="directing", message=f"AI 选曲 {ai_track} 不在曲库，在线搜索：{query}…")
                        searched = music.auto_search_track(query, available)
                        if searched:
                            bgm_name = searched
                            self._update(task_id, stage="directing", message=f"在线搜曲导入：{bgm_name}")
                        else:
                            bgm_name = music.pick_track(script, available)
                            self._update(task_id, stage="images", message=f"自动匹配 BGM：{bgm_name}")
                    else:
                        bgm_name = music.pick_track(script, available)
                        self._update(task_id, stage="images", message=f"自动匹配 BGM：{bgm_name}")
            elif ai_track and ai_track in available:
                self._update(task_id, message=f"提示：AI 选曲 {ai_track} 被项目固定 BGM（{bgm_name}）覆盖")

            bgm = None
            if bgm_name:
                for ext in (".mp3", ".wav"):
                    f = bgm_dir / f"{bgm_name}{ext}"
                    if f.exists():
                        meta = beat.analyze(f)
                        bgm = BgmSpec(
                            src=f"{BGM_PUBLIC_SUBDIR}/{bgm_name}{ext}",
                            bpm=meta["bpm"],
                            beats=meta["beats"][:400],
                        )
                        ai_volume = ai_bgm.get("volume")
                        ai_picked = bgm_name == ai_track or (ai_track == "__search__" and bgm_name.startswith("auto_"))
                        if ai_volume and ai_picked:
                            bgm.volume = ai_volume  # AI 导演对自选曲目的音量判断
                        print(f"[bgm] {bgm_name} bpm={meta['bpm']} beats={len(meta['beats'])}", flush=True)
                        break
            market = None
            market_path = PROJECTS_DIR / project_id / "market.json"
            if market_path.exists():
                try:
                    market = MarketData.model_validate_json(market_path.read_text(encoding="utf-8"))
                except Exception:  # noqa: BLE001 — 行情数据损坏不阻断普通项目
                    market = None
            props = bind_project(
                assemble_props(
                    script, durations, image_rels,
                    bgm=bgm, plan=plan, grain_opacity=grain_opacity, market=market,
                ),
                project_id,
            )
            if (settings.template or "").strip().lower() == "motionshow":
                props = voice.apply_motion_track(project_id, props)
            else:
                props = voice.apply_mixed_track(project_id, props)
            render_dir = RENDERS_DIR / project_id
            render_dir.mkdir(parents=True, exist_ok=True)
            props_path = render_dir / "props.json"
            props_path.write_text(props.to_props_json(), encoding="utf-8")

            # 4. Remotion 渲染（子进程，耗时最长）
            self._update(task_id, stage="rendering", message="Remotion 渲染中...")
            out_path = render_dir / "final.mp4"
            log_path = render_dir / "render.log"
            rc = renderer.render_video(
                props_path,
                out_path,
                log_path,
                composition=composition_for(settings.template),
            )
            log_tail = renderer.tail_log(log_path)

            if rc != 0 or not out_path.exists():
                self._update(
                    task_id,
                    stage="error",
                    error=f"渲染进程退出码 {rc}",
                    log_tail=log_tail,
                    message="渲染失败",
                )
                return

            self._update(
                task_id,
                stage="done",
                message="完成",
                video_url=f"/api/projects/{project_id}/video",
                log_tail=log_tail,
                finished_at=now_iso(),
            )
        except Exception as e:  # noqa: BLE001 — 任务线程兜底
            self._update(
                task_id,
                stage="error",
                error=f"{e}",
                log_tail=traceback.format_exc()[-2000:],
                message="失败",
            )
        finally:
            self._finish(task_id, project_id)


def load_script(project_id: str) -> ScriptDraft:
    path = PROJECTS_DIR / project_id / "script.json"
    return ScriptDraft.model_validate_json(path.read_text(encoding="utf-8"))


def load_settings(project_id: str) -> ProjectSettings:
    path = PROJECTS_DIR / project_id / "settings.json"
    if not path.exists():
        return ProjectSettings()
    return ProjectSettings.model_validate_json(path.read_text(encoding="utf-8"))


task_manager = TaskManager()
