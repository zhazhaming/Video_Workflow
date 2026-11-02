import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createProject,
  deleteProject,
  generateScript,
  getProject,
  getProjectSettings,
  listModels,
  listProjects,
  listPromptTemplates,
  saveProjectSettings,
  saveScript,
} from "./api";
import { FlowPanel } from "./components/FlowPanel";
import { HotspotRadar } from "./components/HotspotRadar";
import { PublishPanel } from "./components/PublishPanel";
import type {
  ModelInfo,
  ProjectMeta,
  ScriptDraft,
  TaskStatus,
} from "./types";

type View = { kind: "list" } | { kind: "detail"; pid: string };
type ListTab = "projects" | "radar";

// ---- 本地编辑草稿（刷新/误关保护）：按项目存 localStorage ----

type DraftPayload = {
  script: ScriptDraft;
  topic: string;
  style: string;
  prompt: string;
  seconds: number;
  modelId: string;
  voice: string;
  ttsRate: string;
  bgmName: string;
  aiDirector: boolean;
  savedAt: string;
};

const draftKey = (pid: string) => `vw.draft.${pid}`;
const nowStamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

const readDraft = (pid: string): DraftPayload | null => {
  try {
    const raw = localStorage.getItem(draftKey(pid));
    return raw ? (JSON.parse(raw) as DraftPayload) : null;
  } catch {
    return null;
  }
};

const writeDraft = (pid: string, d: DraftPayload) => {
  try {
    localStorage.setItem(draftKey(pid), JSON.stringify(d));
  } catch {
    /* 存储满/隐私模式时静默失败 */
  }
};

const clearDraft = (pid: string) => {
  try {
    localStorage.removeItem(draftKey(pid));
  } catch {
    /* ignore */
  }
};

const hasDraft = (pid: string) => !!readDraft(pid);

const SECONDS_MIN = 15;
const SECONDS_MAX = 240;

const clampSeconds = (n: number) =>
  Math.min(SECONDS_MAX, Math.max(SECONDS_MIN, Math.round(n)));

export const App = () => {
  const [view, setView] = useState<View>({ kind: "list" });
  const [listTab, setListTab] = useState<ListTab>("projects");
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [projQuery, setProjQuery] = useState("");
  const [projSort, setProjSort] = useState<"updated" | "created" | "title">("updated");
  const [radarAlerts, setRadarAlerts] = useState(0);
  const [listErr, setListErr] = useState("");
  const [creating, setCreating] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelId, setModelId] = useState("");
  const [prompt, setPrompt] = useState(() => localStorage.getItem("vw.prompt") ?? "");

  // detail 状态
  const [script, setScript] = useState<ScriptDraft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [detailErr, setDetailErr] = useState("");
  // 本地草稿恢复提示（warn 条，带「放弃草稿」按钮）
  const [draftNotice, setDraftNotice] = useState("");

  // 项目级设置（随「保存脚本」与雷达 AI 生成落库，保持与后端字段一致）
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("故事向竖屏短视频，第一人称，口语化，开头有钩子，结尾有互动引导");
  const [seconds, setSeconds] = useState(180);
  const [voice, setVoice] = useState("zh-CN-YunxiNeural");
  const [ttsRate, setTtsRate] = useState("+6%");
  const [bgmName, setBgmName] = useState("auto");
  const [aiDirector, setAiDirector] = useState(true);

  // 渲染任务状态 → 标签页标题 + 桌面通知（用户切走也能知道出片了）
  const [renderTask, setRenderTask] = useState<TaskStatus | null>(null);
  const prevStageRef = useRef("");

  useEffect(() => {
    if (!renderTask) return;
    const stage = renderTask.stage;
    if (stage === "done" && prevStageRef.current !== "done") {
      document.title = "✅ 渲染完成 - Video Workflow";
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("🎬 渲染完成", {
            body: `${renderTask.message || "成片已就绪"}，打开 Video Workflow 预览下载`,
          });
        } catch {
          /* 通知失败不影响流程 */
        }
      }
    } else if (["queued", "voice", "images", "rendering"].includes(stage)) {
      document.title = `⏳ ${renderTask.message || "渲染中"} - Video Workflow`;
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    } else if (stage === "error") {
      document.title = "❌ 渲染失败 - Video Workflow";
    }
    prevStageRef.current = stage;
  }, [renderTask]);

  // 用户回到页面时恢复标题
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") document.title = "🎬 Video Workflow";
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // ---- 本地编辑草稿：刷新/误关后可恢复未保存的工作区 ----
  const draftTimer = useRef<number | null>(null);
  useEffect(() => {
    if (view.kind !== "detail" || !dirty || !script) return;
    const pid = view.pid;
    if (draftTimer.current) window.clearTimeout(draftTimer.current);
    draftTimer.current = window.setTimeout(() => {
      writeDraft(pid, {
        script,
        topic,
        style,
        prompt,
        seconds,
        modelId,
        voice,
        ttsRate,
        bgmName,
        aiDirector,
        savedAt: nowStamp(),
      });
    }, 800);
    return () => {
      if (draftTimer.current) window.clearTimeout(draftTimer.current);
    };
  }, [view, dirty, script, topic, style, prompt, seconds, modelId, voice, ttsRate, bgmName, aiDirector]);

  // 保存成功（dirty 归零）即清草稿
  useEffect(() => {
    if (view.kind === "detail" && !dirty) clearDraft(view.pid);
  }, [dirty, view]);

  // 有未保存修改时，关闭/刷新页面前提醒
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty && view.kind === "detail") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, view]);

  const refreshList = useCallback(async () => {
    try {
      setProjects(await listProjects());
      setListErr("");
    } catch (e) {
      setListErr(`加载失败：${(e as Error).message}（后端是否已启动？）`);
    }
  }, []);

  useEffect(() => {
    refreshList();
    listModels()
      .then((r) => {
        setModels(r.models);
        const def = r.models.find((m) => m.is_default) ?? r.models.find((m) => m.available);
        if (def) setModelId(def.id);
      })
      .catch(() => setModels([]));
    listPromptTemplates()
      .then((r) => {
        const saved = localStorage.getItem("vw.prompt");
        if (saved) {
          setPrompt(saved);
        } else {
          const story = r.templates.find((t) => t.id === "story") ?? r.templates[0];
          if (story) setPrompt(story.content);
        }
      })
      .catch(() => {});
  }, [refreshList]);

  const applySeconds = (value: number) => {
    setSeconds(clampSeconds(value));
  };

  const openDetail = async (pid: string, opts?: { forceServer?: boolean }) => {
    try {
      const [p, st] = await Promise.all([getProject(pid), getProjectSettings(pid)]);
      setScript(p.script);
      setDirty(false);
      setDetailErr("");
      setSaveMsg("");
      // 恢复项目级设置（落库保存的模型/风格/提示词/时长）
      applySeconds(st.target_seconds || 180);
      if (st.style) setStyle(st.style);
      if (st.prompt) setPrompt(st.prompt);
      if (st.model_id) setModelId(st.model_id);
      if (st.voice) setVoice(st.voice);
      setTtsRate(st.tts_rate || "+6%");
      setBgmName(st.bgm ?? "auto");
      setAiDirector(st.ai_director !== false);
      setTopic(st.topic ?? "");
      setRenderTask(null);
      setDraftNotice("");
      // 本地草稿保护：刷新/误关后恢复未保存的工作区
      if (!opts?.forceServer) {
        const draft = readDraft(pid);
        if (draft) {
          if (draft.savedAt >= p.updated_at) {
            setScript(draft.script);
            setTopic(draft.topic);
            applySeconds(draft.seconds);
            setStyle(draft.style);
            setPrompt(draft.prompt);
            if (draft.modelId) setModelId(draft.modelId);
            setVoice(draft.voice);
            setTtsRate(draft.ttsRate);
            setBgmName(draft.bgmName);
            setAiDirector(draft.aiDirector);
            setDirty(true);
            setDraftNotice(
              `已恢复上次未保存的编辑（${draft.savedAt} 本地留存）。确认无误后请点「保存脚本」落库，或点「放弃草稿」还原为服务器版本。`
            );
          } else {
            clearDraft(pid); // 云端版本更新，本地草稿过期
          }
        }
      }
      setView({ kind: "detail", pid });
    } catch (e) {
      setListErr((e as Error).message);
    }
  };

  const newProject = async () => {
    setCreating(true);
    try {
      const p = await createProject();
      await refreshList();
      await openDetail(p.id);
    } catch (e) {
      setListErr((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const removeProject = async (
    pid: string,
    title: string,
    onErr: (msg: string) => void
  ): Promise<boolean> => {
    if (
      !window.confirm(
        `删除项目「${title}」？\n将同时删除其脚本、设置、配音、画面素材与成片，不可恢复。`
      )
    ) {
      return false;
    }
    try {
      await deleteProject(pid);
      refreshList();
      return true;
    } catch (e) {
      onErr(`删除失败：${(e as Error).message}`);
      return false;
    }
  };

  /** 热点雷达：用 AI 选题一键创建新项目，选题落库为项目标题与研究主题；返回项目 id 供选题工作台回填 */
  const useTopicInNewProject = async (topic: string) => {
    setCreating(true);
    try {
      const p = await createProject(topic);
      await refreshList();
      setListTab("projects");
      await openDetail(p.id);
      return p.id;
    } catch (e) {
      setListErr((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  /** 热点雷达选题工作台：一键建项目 + AI 生成脚本（全自动流水线） */
  const generateScriptFromTopic = async (topic: string) => {
    const pid = await useTopicInNewProject(topic);
    if (!pid) return;
    const ok = await aiGenerate({ pid, topic });
    return { pid, ok };
  };

  const settingsPayload = () => ({
    model_id: modelId || null,
    style,
    prompt,
    target_seconds: seconds,
    voice,
    tts_rate: ttsRate,
    bgm: bgmName,
    ai_director: aiDirector,
  });

  const doSave = async (pid: string) => {
    if (!script) return;
    try {
      await saveScript(pid, script);
      await saveProjectSettings(pid, settingsPayload());
      setDirty(false);
      setSaveMsg("已保存");
      setTimeout(() => setSaveMsg(""), 2000);
      refreshList();
    } catch (e) {
      setDetailErr(`保存失败：${(e as Error).message}`);
    }
  };

  /** 雷达一键生成：建项目 → 生成脚本 → 落库；返回是否成功（失败时脚本保持项目现有内容） */
  const aiGenerate = async (opts?: { pid?: string; topic?: string }): Promise<boolean> => {
    const genPid = opts?.pid ?? (view.kind === "detail" ? view.pid : "");
    const genTopic = (opts?.topic ?? topic).trim();
    if (!genTopic || !genPid) return false;
    setDetailErr("");
    try {
      if (dirty || !script) await doSave(genPid);
      const s = await generateScript(genTopic, style, seconds, modelId, prompt);
      setScript(s);
      await saveScript(genPid, s);
      await saveProjectSettings(genPid, settingsPayload());
      setDirty(false);
      setSaveMsg("已自动保存");
      setTimeout(() => setSaveMsg(""), 2000);
      refreshList();
      return true;
    } catch (e) {
      setDetailErr(`AI 生成失败：${(e as Error).message}`);
      return false;
    }
  };

  const anyModelAvailable = models.some((m) => m.available);

  // 项目列表：搜索 + 排序
  const visibleProjects = useMemo(() => {
    const q = projQuery.trim().toLowerCase();
    const list = q
      ? projects.filter((p) => p.title.toLowerCase().includes(q))
      : [...projects];
    if (projSort === "title") list.sort((a, b) => a.title.localeCompare(b.title, "zh"));
    else if (projSort === "created") list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    else list.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    return list;
  }, [projects, projQuery, projSort]);

  // ---- 列表页 ----
  if (view.kind === "list") {
    return (
      <div className="page">
        <header className="topbar">
          <div className="view-tabs">
            <button
              className={`tab ${listTab === "projects" ? "tab-active" : ""}`}
              onClick={() => setListTab("projects")}
            >
              📁 视频项目
            </button>
            <button
              className={`tab ${listTab === "radar" ? "tab-active" : ""}`}
              onClick={() => setListTab("radar")}
            >
              🔥 热点雷达
              {radarAlerts > 0 && <span className="tab-dot" title={`${radarAlerts} 条新爆热点`} />}
            </button>
          </div>
          <button className="btn primary" disabled={creating} onClick={newProject}>
            {creating ? "创建中..." : "+ 新建视频项目"}
          </button>
        </header>
        {models.length > 0 && !anyModelAvailable && (
          <div className="warn">
            模型均未配置：在 backend/.env 填写任一模型的密钥与接口地址后可使用 AI 生成/优化脚本（当前仅支持手动编辑）。
          </div>
        )}
        {listTab === "projects" ? (
          <>
            {listErr && <div className="error">{listErr}</div>}
            <div className="proj-toolbar">
              <input
                className="proj-search"
                placeholder="搜索项目标题…"
                value={projQuery}
                onChange={(e) => setProjQuery(e.target.value)}
              />
              <select
                value={projSort}
                onChange={(e) => setProjSort(e.target.value as typeof projSort)}
                title="排序"
              >
                <option value="updated">按更新时间</option>
                <option value="created">按创建时间</option>
                <option value="title">按标题</option>
              </select>
              <span className="muted">{visibleProjects.length} 个项目</span>
            </div>
            <div className="grid">
              {visibleProjects.map((p) => (
                <div
                  className="card"
                  key={p.id}
                  onClick={() => openDetail(p.id)}
                  style={{ position: "relative" }}
                >
                  <button
                    className="btn small danger"
                    title="删除项目"
                    style={{ position: "absolute", top: 8, right: 8 }}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (await removeProject(p.id, p.title, setListErr)) {
                        clearDraft(p.id);
                        setProjects((prev) => prev.filter((x) => x.id !== p.id));
                      }
                    }}
                  >
                    ✕
                  </button>
                  <h3>{p.title}</h3>
                  {hasDraft(p.id) && (
                    <div className="draft-row">
                      <span className="draft-badge">💾 有本地草稿（未保存）</span>
                    </div>
                  )}
                  {typeof p.shot_count === "number" && (
                    <div className="proj-stats">
                      <span>{p.shot_count} 镜</span>
                      {typeof p.line_count === "number" && <span>· {p.line_count} 句</span>}
                      {p.has_video && <span className="vid-badge">✓ 已出片</span>}
                    </div>
                  )}
                  <div className="muted">更新于 {p.updated_at}</div>
                  <div className="muted mono">{p.id}</div>
                </div>
              ))}
              {visibleProjects.length === 0 && !listErr && (
                <div className="muted">
                  {projQuery ? "没有匹配的项目。" : "还没有项目，点右上角新建一个。"}
                </div>
              )}
            </div>
          </>
        ) : (
          <HotspotRadar
            models={models}
            onUseTopic={useTopicInNewProject}
            onOpenProject={(pid) => openDetail(pid)}
            onAlertCount={setRadarAlerts}
            onGenerateScript={generateScriptFromTopic}
          />
        )}
      </div>
    );
  }

  // ---- 详情页 ----
  const pid = view.pid;
  return (
    <div className="page">
      <header className="topbar">
        <button className="btn" onClick={() => { setView({ kind: "list" }); refreshList(); }}>
          ← 返回
        </button>
        <h1>{script?.title ?? "加载中..."}</h1>
        <div className="row">
          {saveMsg && <span className="good">{saveMsg}</span>}
          {dirty && <span className="muted">有未保存修改</span>}
          <button className="btn primary" disabled={!script || !dirty} onClick={() => doSave(pid)}>
            保存脚本
          </button>
          <button
            className="btn danger"
            disabled={!!renderTask && ["queued", "voice", "images", "rendering"].includes(renderTask.stage)}
            title="删除整个项目（含脚本、配音、素材与成片）"
            onClick={async () => {
              if (await removeProject(pid, script?.title ?? pid, setDetailErr)) {
                setView({ kind: "list" });
              }
            }}
          >
            删除项目
          </button>
        </div>
      </header>

      {detailErr && <div className="error">{detailErr}</div>}
      {draftNotice && (
        <div
          className="warn"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}
        >
          <span>💾 {draftNotice}</span>
          <button
            className="btn small"
            onClick={() => {
              clearDraft(pid);
              openDetail(pid, { forceServer: true });
            }}
          >
            放弃草稿，还原服务器版本
          </button>
        </div>
      )}
      {models.length > 0 && !anyModelAvailable && (
        <div className="warn">模型均未配置，流水线中的 AI 步骤不可用；可在第 2 步编排里手动编辑脚本。</div>
      )}

      <div className="columns">
        <div className="col-main">
          <FlowPanel pid={pid} modelId={modelId} onTaskChange={setRenderTask} />
        </div>

        <div className="col-side">
          <PublishPanel pid={pid} modelId={modelId} />
        </div>
      </div>
    </div>
  );
};
