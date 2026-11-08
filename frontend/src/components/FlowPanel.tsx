import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  approveFlowCopy,
  approveFlowImages,
  approveFlowPreview,
  approveFlowResearch,
  approveFlowStyles,
  comfyStatus,
  confirmFlowReview,
  deleteFlowAudio,
  flowAudioUrl,
  flowPreviewUrl,
  flowUploadAudio,
  flowUploadSceneImage,
  getActiveTask,
  getFlowImages,
  getFlowResearch,
  getFlowReview,
  getFlowState,
  getFlowStoryboard,
  getFlowStyles,
  getProject,
  getProjectSettings,
  getTask,
  saveFlowResearch,
  saveProjectSettings,
  saveScript,
  selectFlowImage,
  selectFlowStyle,
  setFlowAudioMode,
  startFlowAiImages,
  startFlowCopy,
  startFlowFull,
  startFlowImages,
  startFlowPreview,
  startFlowResearch,
  startFlowReview,
  startFlowStyles,
  styleSampleUrl,
  videoUrl,
} from "../api";
import { ScriptEditor } from "./ScriptEditor";
import {
  STAGE_LABEL,
  type ComfyStatus,
  type FlowState,
  type ProjectSettings,
  type ResearchArticle,
  type ResearchNode,
  type ReviewReport,
  type SceneImages,
  type ScriptDraft,
  type StoryboardShot,
  type StyleProposal,
  type TaskStatus,
} from "../types";

interface Props {
  pid: string;
  modelId?: string;
  /** 上报任务状态（App 用于标题/桌面通知） */
  onTaskChange?: (t: TaskStatus | null) => void;
}

interface StylesData {
  proposals: StyleProposal[];
  chosen: number | null;
}

interface StoryboardData {
  shot_count: number;
  shots: StoryboardShot[];
}

const STEPS = [
  { n: 1, title: "搜索" },
  { n: 2, title: "编排" },
  { n: 3, title: "找图" },
  { n: 4, title: "定样式" },
  { n: 5, title: "检查" },
  { n: 6, title: "直出" },
];

const TTS_VOICES = [
  { id: "zh-CN-YunxiNeural", name: "云希 · 自然青年男声" },
  { id: "zh-CN-XiaoxiaoNeural", name: "晓晓 · 温柔女声" },
  { id: "zh-CN-YunjianNeural", name: "云健 · 沉稳男声" },
];

const SEV_LABEL: Record<string, string> = { high: "高", medium: "中", low: "低" };

/** 任务类型 → 所属步骤 */
const TASK_STEP: Record<string, number> = {
  research: 1,
  copy: 2,
  images: 3,
  styles: 4,
  storyboard: 4,
  review: 5,
  preview: 6,
  full: 6,
};

/** 任务是否仍在进行（flow 任务阶段命名不定，用终态判断） */
const isRunning = (t: TaskStatus) =>
  t.stage !== "done" && t.stage !== "error" && !t.finished_at;

const fmtDur = (s?: number) =>
  !s
    ? ""
    : s < 60
      ? `${Math.round(s)} 秒`
      : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

export const FlowPanel: React.FC<Props> = ({ pid, modelId, onTaskChange }) => {
  const [flowState, setFlowState] = useState<FlowState | null>(null);
  const [research, setResearch] = useState<ResearchArticle | null>(null);
  const [researchMsg, setResearchMsg] = useState("");
  const [script, setScript] = useState<ScriptDraft | null>(null);
  const [scriptDirty, setScriptDirty] = useState(false);
  const [scriptMsg, setScriptMsg] = useState("");
  const [settings, setSettings] = useState<ProjectSettings | null>(null);
  const [images, setImages] = useState<SceneImages[]>([]);
  const [styles, setStyles] = useState<StylesData>({ proposals: [], chosen: null });
  const [storyboard, setStoryboard] = useState<StoryboardData>({ shot_count: 0, shots: [] });
  const [review, setReview] = useState<ReviewReport | null>(null);
  const [task, setTask] = useState<TaskStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [expanded, setExpanded] = useState<number | null>(1);
  const [topic, setTopic] = useState("");
  const [previewKey, setPreviewKey] = useState(0);
  const [fullKey, setFullKey] = useState(0);
  const [stylesKey, setStylesKey] = useState(0);
  const [audioBusy, setAudioBusy] = useState(false);
  const [brokenThumbs, setBrokenThumbs] = useState<Record<string, boolean>>({});
  const [showShots, setShowShots] = useState(false);
  // ComfyUI AI 生图服务状态
  const [comfy, setComfy] = useState<ComfyStatus | null>(null);

  const timer = useRef<number | null>(null);
  const focusDone = useRef(false);
  const scriptDirtyRef = useRef(false);

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);

  // ---- 数据加载（各产物独立容错：缺失时静默置空） ----

  const loadState = useCallback(async () => {
    try {
      const st = await getFlowState(pid);
      setFlowState(st);
      setTopic((prev) => prev || st.topic || st.script_title || "");
      if (!focusDone.current) {
        focusDone.current = true;
        setExpanded(Math.min(6, Math.max(1, st.step || 1)));
      }
    } catch (e) {
      setErr(`加载流程状态失败：${(e as Error).message}`);
    }
  }, [pid]);

  const loadResearch = useCallback(async () => {
    try {
      setResearch(await getFlowResearch(pid));
    } catch {
      /* 尚未生成 */
    }
  }, [pid]);

  const loadScript = useCallback(async () => {
    try {
      const p = await getProject(pid);
      // 本地有未保存修改时不覆盖（避免轮询完成刷新把编辑冲掉）
      setScript((prev) => (prev && scriptDirtyRef.current ? prev : p.script));
    } catch {
      /* ignore */
    }
  }, [pid]);

  const loadSettings = useCallback(async () => {
    try {
      setSettings(await getProjectSettings(pid));
    } catch {
      /* ignore */
    }
  }, [pid]);

  const loadImages = useCallback(async () => {
    try {
      const r = await getFlowImages(pid);
      setImages(r.scenes ?? []);
    } catch {
      setImages([]);
    }
  }, [pid]);

  const loadStyles = useCallback(async () => {
    try {
      setStyles(await getFlowStyles(pid));
    } catch {
      setStyles({ proposals: [], chosen: null });
    }
  }, [pid]);

  const loadStoryboard = useCallback(async () => {
    try {
      setStoryboard(await getFlowStoryboard(pid));
    } catch {
      setStoryboard({ shot_count: 0, shots: [] });
    }
  }, [pid]);

  const loadReview = useCallback(async () => {
    try {
      setReview(await getFlowReview(pid));
    } catch {
      setReview(null);
    }
  }, [pid]);

  const loadComfy = useCallback(async () => {
    try {
      setComfy(await comfyStatus());
    } catch {
      setComfy({ reachable: false, reason: "状态获取失败（后端未启动？）" });
    }
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([
      loadState(),
      loadResearch(),
      loadScript(),
      loadSettings(),
      loadImages(),
      loadStyles(),
      loadStoryboard(),
      loadReview(),
      loadComfy(),
    ]);
  }, [loadState, loadResearch, loadScript, loadSettings, loadImages, loadStyles, loadStoryboard, loadReview, loadComfy]);

  // ---- 任务轮询（同 RenderPanel：1500ms，挂载时恢复进行中的任务） ----

  const poll = (taskId: string) => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(async () => {
      try {
        const t = await getTask(taskId);
        setTask(t);
        onTaskChange?.(t);
        if (!isRunning(t)) {
          if (timer.current) window.clearInterval(timer.current);
          setBusy(false);
          await loadAll();
          if (!t.error && t.stage !== "error") {
            if (t.kind === "preview") setPreviewKey((k) => k + 1);
            if (t.kind === "full") setFullKey((k) => k + 1);
            if (t.kind === "styles") setStylesKey((k) => k + 1);
          }
        }
      } catch (e) {
        setErr((e as Error).message);
        if (timer.current) window.clearInterval(timer.current);
        setBusy(false);
      }
    }, 1500);
  };

  useEffect(() => {
    let cancelled = false;
    // 切换项目：重置本地状态
    if (timer.current) window.clearInterval(timer.current);
    setFlowState(null);
    setResearch(null);
    setScript(null);
    setScriptDirty(false);
    scriptDirtyRef.current = false;
    setImages([]);
    setStyles({ proposals: [], chosen: null });
    setStoryboard({ shot_count: 0, shots: [] });
    setReview(null);
    setTask(null);
    setBusy(false);
    setErr("");
    setTopic("");
    focusDone.current = false;
    loadAll();
    (async () => {
      try {
        const r = await getActiveTask(pid);
        if (cancelled) return;
        if (r.task && isRunning(r.task)) {
          setTask(r.task);
          setBusy(true);
          onTaskChange?.(r.task);
          poll(r.task.id);
        }
      } catch {
        /* 查询失败不阻塞面板 */
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  const startTask = async (fn: () => Promise<{ task_id: string }>) => {
    setErr("");
    setBusy(true);
    try {
      const { task_id } = await fn();
      setTask(null);
      onTaskChange?.(null);
      poll(task_id);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  // ---- 派生状态 / 闸门 ----

  const gates = flowState?.gates;
  const open = (n: number): boolean => {
    switch (n) {
      case 1: return true;
      case 2: return !!gates?.research;
      case 3: return !!gates?.copy;
      case 4: return !!gates?.images;
      case 5: return !!gates?.styles;
      case 6: return !!gates?.review;
      default: return false;
    }
  };

  const stepDone = (n: number): boolean => {
    switch (n) {
      case 1: return !!gates?.research;
      case 2: return !!gates?.copy;
      case 3: return !!gates?.images;
      case 4: return !!gates?.styles;
      case 5: return !!gates?.review;
      case 6: return !!flowState?.has_video;
      default: return false;
    }
  };

  const runningStep = busy && task ? TASK_STEP[task.kind ?? ""] : undefined;
  const audioMode = flowState?.audio_mode ?? "tts";
  const fullAudio = flowState?.custom_audio?.full ?? null;
  const shotAudios = flowState?.custom_audio?.shots ?? {};
  const shotCount = flowState?.shot_count ?? script?.shots.length ?? 0;
  const shotRows = Array.from({ length: shotCount }, (_, i) => i + 1);

  // 媒体地址按 key 记忆，避免轮询重渲染时 cache-buster 变化导致 audio/video 反复重载
  const previewSrc = useMemo(() => flowPreviewUrl(pid), [pid, previewKey]);
  const fullSrc = useMemo(() => videoUrl(pid), [pid, fullKey]);
  const styleSrcs = useMemo(
    () => [1, 2, 3].map((i) => styleSampleUrl(pid, i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pid, stylesKey]
  );
  const audioUrls = useMemo(() => {
    const m: Record<string, string> = {};
    if (fullAudio) m.full = flowAudioUrl(pid, fullAudio.file);
    for (const k of Object.keys(shotAudios)) m[`shot-${k}`] = flowAudioUrl(pid, shotAudios[k].file);
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid, flowState?.custom_audio]);

  const badge = (n: number) => {
    const mk = (k: string, label: string) => (
      <span className={`flow-badge ${k}`}>{label}</span>
    );
    if (runningStep === n) return mk("warn", "进行中…");
    switch (n) {
      case 1:
        if (gates?.research) return mk("done", "已完成 ✓");
        return research && (research.nodes.length > 0 || research.generated_at)
          ? mk("pending", "待确认")
          : mk("idle", "未开始");
      case 2:
        if (gates?.copy) return mk("done", "已完成 ✓");
        return shotCount > 0 ? mk("pending", "待确认") : mk("idle", "未开始");
      case 3:
        if (gates?.images) return mk("done", "已完成 ✓");
        return images.length > 0 ? mk("pending", "待确认") : mk("idle", "未开始");
      case 4:
        if (gates?.styles) return mk("done", "已完成 ✓");
        if (storyboard.shots.length > 0) return mk("pending", "待确认");
        return styles.proposals.length > 0 ? mk("pending", "待选择") : mk("idle", "未开始");
      case 5:
        if (gates?.review) return mk("done", "已完成 ✓");
        return review
          ? review.passed
            ? mk("pending", "待确认")
            : mk("warn", "有问题待处理")
          : mk("idle", "未开始");
      case 6:
        if (flowState?.has_video) return mk("done", "已完成 ✓");
        if (flowState?.has_preview) return mk("pending", "待确认");
        return gates?.review ? mk("idle", "可出片") : mk("idle", "未开始");
      default:
        return mk("idle", "未开始");
    }
  };

  const summary = (n: number): string => {
    switch (n) {
      case 1: return research?.nodes.length ? `${research.nodes.length} 个资料节点` : "";
      case 2: return shotCount > 0 ? `${shotCount} 镜 · ${flowState?.line_count ?? 0} 句` : "";
      case 3: return images.length > 0 ? `${images.length} 幕画面` : "";
      case 4: return storyboard.shots.length > 0 ? `分镜 ${storyboard.shot_count || storyboard.shots.length} 幕` : "";
      case 5: return review ? (review.passed ? "审查通过" : "存在待处理问题") : "";
      case 6: return flowState?.has_video ? "成片已就绪" : flowState?.has_preview ? "预览已生成" : "";
      default: return "";
    }
  };

  // ---- 步骤 1：搜索 ----

  const patchNode = (i: number, partial: Partial<ResearchNode>) => {
    setResearch((prev) =>
      prev
        ? { ...prev, nodes: prev.nodes.map((nd, idx) => (idx === i ? { ...nd, ...partial } : nd)) }
        : prev
    );
  };

  const removeNode = (i: number) => {
    setResearch((prev) =>
      prev ? { ...prev, nodes: prev.nodes.filter((_, idx) => idx !== i) } : prev
    );
  };

  const addNode = () => {
    setResearch((prev) =>
      prev
        ? { ...prev, nodes: [...prev.nodes, { year: "", title: "", what: "", why: "", sources: [] }] }
        : prev
    );
  };

  const saveResearch = async () => {
    if (!research) return;
    setErr("");
    try {
      const r = await saveFlowResearch(pid, research.topic, research.nodes);
      setResearch(r);
      setResearchMsg("已保存");
      window.setTimeout(() => setResearchMsg(""), 2000);
    } catch (e) {
      setErr(`保存失败：${(e as Error).message}`);
    }
  };

  const approveResearch = async () => {
    setErr("");
    try {
      await approveFlowResearch(pid);
      await loadState();
      setExpanded(2);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  // ---- 步骤 2：编排 ----

  const markScriptDirty = (s: ScriptDraft) => {
    setScript(s);
    setScriptDirty(true);
    scriptDirtyRef.current = true;
    setScriptMsg("");
  };

  const saveScriptNow = async () => {
    if (!script) return;
    setErr("");
    try {
      await saveScript(pid, script);
      setScriptDirty(false);
      scriptDirtyRef.current = false;
      setScriptMsg("文案已保存");
      window.setTimeout(() => setScriptMsg(""), 2500);
      await loadState();
    } catch (e) {
      setErr(`保存失败：${(e as Error).message}`);
    }
  };

  const approveCopy = async () => {
    setErr("");
    try {
      if (script) await saveScript(pid, script); // 先落库文案再过闸
      setScriptDirty(false);
      scriptDirtyRef.current = false;
      await approveFlowCopy(pid);
      await loadState();
      setExpanded(3);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const switchAudioMode = async (mode: "tts" | "custom" | "none") => {
    setErr("");
    try {
      const st = await setFlowAudioMode(pid, mode);
      setFlowState(st);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const saveVoiceCfg = async (v: string, rate: string) => {
    if (!settings) return;
    const next = { ...settings, voice: v, tts_rate: rate };
    setSettings(next);
    try {
      await saveProjectSettings(pid, next);
    } catch (e) {
      setErr(`保存配音设置失败：${(e as Error).message}`);
    }
  };

  const toggleGenScenes = async (on: boolean) => {
    if (!settings) return;
    const next = { ...settings, gen_scenes: on };
    setSettings(next);
    try {
      await saveProjectSettings(pid, next);
    } catch (e) {
      setErr(`保存设置失败：${(e as Error).message}`);
    }
  };

  const saveTemplate = async (template: "datavideo" | "motionshow") => {
    if (!settings) return;
    const next = { ...settings, template };
    setSettings(next);
    try {
      await saveProjectSettings(pid, next);
    } catch (e) {
      setErr(`保存成片模板失败：${(e as Error).message}`);
    }
  };

  const uploadAudio = async (kind: "full" | "shot", index: number | undefined, file: File) => {
    setAudioBusy(true);
    setErr("");
    try {
      await flowUploadAudio(pid, file, kind, index);
      await loadState();
    } catch (e) {
      setErr(`上传失败：${(e as Error).message}`);
    } finally {
      setAudioBusy(false);
    }
  };

  const removeAudio = async (kind: "full" | "shot", index?: number) => {
    setAudioBusy(true);
    setErr("");
    try {
      const st = await deleteFlowAudio(pid, kind, index);
      setFlowState(st);
    } catch (e) {
      setErr(`删除失败：${(e as Error).message}`);
    } finally {
      setAudioBusy(false);
    }
  };

  // ---- 步骤 3：找图 ----

  const pickImage = async (sceneIdx: number, candidateId?: string) => {
    setErr("");
    try {
      const r = await selectFlowImage(pid, sceneIdx, candidateId);
      setImages(r.scenes ?? []);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const uploadSceneImage = async (sceneIdx: number, file: File) => {
    setErr("");
    try {
      const r = await flowUploadSceneImage(pid, sceneIdx, file);
      setImages(r.scenes ?? []);
    } catch (e) {
      setErr(`上传失败：${(e as Error).message}`);
    }
  };

  const approveImages = async () => {
    setErr("");
    try {
      await approveFlowImages(pid);
      await loadState();
      setExpanded(4);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const shotLabel = (idx: number) => script?.shots[idx - 1]?.label ?? "";

  // ---- 步骤 4：定样式 ----

  const chooseStyle = async (index: number) => {
    setErr("");
    try {
      const { task_id } = await selectFlowStyle(pid, index);
      setTask(null);
      onTaskChange?.(null);
      setBusy(true);
      poll(task_id);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const approveStyles = async () => {
    setErr("");
    try {
      await approveFlowStyles(pid);
      await loadState();
      setExpanded(5);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  // ---- 步骤 5 / 6 ----

  const confirmReview = async () => {
    if (review && !review.passed && !window.confirm("审查存在未处理问题，确认仍要继续出片？")) return;
    setErr("");
    try {
      await confirmFlowReview(pid);
      await loadState();
      setExpanded(6);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const approvePreview = async () => {
    setErr("");
    try {
      await approveFlowPreview(pid);
      await loadState();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  // ---- 各步渲染 ----

  const renderStep1 = () => (
    <>
      <div className="field">
        <span>研究主题（AI 会围绕它搜集资料节点）</span>
        <div className="row">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="如：一个外卖骑手的前世今生"
            style={{ flex: 1 }}
          />
          <button
            className="btn primary"
            disabled={busy || !topic.trim()}
            onClick={() => startTask(() => startFlowResearch(pid, topic.trim(), modelId))}
          >
            {research && research.nodes.length > 0 ? "重新搜索" : "开始搜索"}
          </button>
        </div>
      </div>

      {research && research.nodes.length > 0 && (
        <>
          <div className="row" style={{ justifyContent: "space-between", margin: "4px 0 10px", flexWrap: "wrap" }}>
            <span className="hint">
              共 {research.nodes.length} 个节点{research.generated_at ? ` · 生成于 ${research.generated_at}` : ""}
            </span>
            <div className="row">
              {researchMsg && <span className="good">{researchMsg}</span>}
              <button className="btn small" disabled={busy} onClick={addNode}>+ 添加节点</button>
              <button className="btn small primary" disabled={busy} onClick={saveResearch}>保存修改</button>
            </div>
          </div>
          {research.nodes.map((nd, i) => (
            <div className="flow-node" key={i}>
              <div className="row">
                <input
                  value={nd.year}
                  onChange={(e) => patchNode(i, { year: e.target.value })}
                  placeholder="年份"
                  style={{ width: 90, flex: "none" }}
                />
                <input
                  value={nd.title}
                  onChange={(e) => patchNode(i, { title: e.target.value })}
                  placeholder="节点标题"
                  style={{ flex: 1 }}
                />
                <button className="btn small danger" disabled={busy} onClick={() => removeNode(i)}>
                  删除
                </button>
              </div>
              <textarea
                rows={2}
                value={nd.what}
                onChange={(e) => patchNode(i, { what: e.target.value })}
                placeholder="发生了什么"
              />
              <textarea
                rows={2}
                value={nd.why}
                onChange={(e) => patchNode(i, { why: e.target.value })}
                placeholder="为什么重要"
              />
              {nd.sources.length > 0 && (
                <div className="flow-sources">
                  <span className="muted">来源：</span>
                  {nd.sources.map((s, si) => (
                    <a key={si} href={s.url} target="_blank" rel="noreferrer">
                      {s.title || s.url}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button className="btn primary wide" disabled={busy} onClick={approveResearch}>
            确认，进入编排 →
          </button>
        </>
      )}
      {research && research.nodes.length === 0 && (
        <p className="hint">还没有资料节点——填好主题点「开始搜索」；也可以跳过搜索直接手动编排。</p>
      )}
    </>
  );

  const renderShotAudioRow = (i: number) => {
    const sa = shotAudios[String(i)];
    return (
      <div className="audio-row" key={i}>
        <b style={{ width: 52, flex: "none" }}>第 {i} 幕</b>
        {sa ? (
          <>
            <span className="flow-audio-name" title={sa.file}>{sa.file}</span>
            <span className="muted">{fmtDur(sa.duration)}</span>
            <audio controls preload="none" src={audioUrls[`shot-${i}`]} style={{ height: 32 }} />
            <button className="btn small danger" disabled={audioBusy} onClick={() => removeAudio("shot", i)}>
              删除
            </button>
          </>
        ) : (
          <span className="muted">未上传</span>
        )}
        <label className="btn small" style={{ cursor: audioBusy ? "wait" : "pointer", margin: 0 }}>
          上传
          <input
            type="file"
            accept="audio/*,video/*"
            style={{ display: "none" }}
            disabled={audioBusy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadAudio("shot", i, f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    );
  };

  const renderStep2 = () => (
    <>
      <div className="row" style={{ flexWrap: "wrap" }}>
        <button
          className="btn primary"
          disabled={busy}
          onClick={() => startTask(() => startFlowCopy(pid, modelId))}
        >
          {shotCount > 0 ? "重新生成文案" : "AI 生成文案"}
        </button>
        <button className="btn" disabled={busy || !scriptDirty} onClick={saveScriptNow}>
          保存文案
        </button>
        {scriptMsg && <span className="good">{scriptMsg}</span>}
        <span className="hint">生成后可在下方直接编辑；确认进入下一步前会自动保存。</span>
      </div>

      {script && script.shots.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <ScriptEditor
            pid={pid}
            script={script}
            modelId={modelId}
            showImages={false}
            onChange={markScriptDirty}
          />
        </div>
      )}

      <div className="field" style={{ marginTop: 12 }}>
        <span>配音方式</span>
        <div className="row" style={{ flexWrap: "wrap", gap: 16 }}>
          <label className="agg-toggle">
            <input type="radio" checked={audioMode === "tts"} onChange={() => switchAudioMode("tts")} />
            TTS 配音（默认）
          </label>
          <label className="agg-toggle">
            <input type="radio" checked={audioMode === "custom"} onChange={() => switchAudioMode("custom")} />
            自己配音
          </label>
          <label className="agg-toggle">
            <input type="radio" checked={audioMode === "none"} onChange={() => switchAudioMode("none")} />
            纯字幕 + 音乐
          </label>
        </div>
      </div>

      {audioMode === "tts" && (
        <div className="row" style={{ flexWrap: "wrap" }}>
          {settings ? (
            <>
              <select
                value={settings.voice}
                onChange={(e) => saveVoiceCfg(e.target.value, settings.tts_rate)}
                style={{ flex: 1, minWidth: 180 }}
                title="音色"
              >
                {TTS_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
                {settings.voice && !TTS_VOICES.some((v) => v.id === settings.voice) && (
                  <option value={settings.voice}>{settings.voice}（当前项目配置）</option>
                )}
              </select>
              <input
                value={settings.tts_rate}
                onChange={(e) => setSettings({ ...settings, tts_rate: e.target.value })}
                onBlur={() => saveVoiceCfg(settings.voice, settings.tts_rate)}
                style={{ width: 90 }}
                title="语速，如 +6%"
                placeholder="+6%"
              />
            </>
          ) : (
            <span className="muted">配音设置加载中…</span>
          )}
        </div>
      )}

      {audioMode === "custom" && (
        <div className="flow-audio">
          <div className="field">
            <span>整段口播（一条音频配全片）</span>
            <div className="audio-row">
              {fullAudio ? (
                <>
                  <span className="flow-audio-name" title={fullAudio.file}>{fullAudio.file}</span>
                  <span className="muted">{fmtDur(fullAudio.duration)}</span>
                  <audio controls preload="none" src={audioUrls.full} style={{ height: 32 }} />
                  <button className="btn small danger" disabled={audioBusy} onClick={() => removeAudio("full")}>
                    删除
                  </button>
                </>
              ) : (
                <span className="muted">未上传</span>
              )}
              <label className="btn small" style={{ cursor: audioBusy ? "wait" : "pointer", margin: 0 }}>
                {audioBusy ? "上传中..." : "⬆ 上传整段口播"}
                <input
                  type="file"
                  accept="audio/*,video/*"
                  style={{ display: "none" }}
                  disabled={audioBusy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadAudio("full", undefined, f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          <div className="field">
            <span>分幕配音（每幕一条，按幕号对应；需先有文案分镜）</span>
            {shotRows.map((i) => renderShotAudioRow(i))}
            {shotRows.length === 0 && <div className="hint">还没有文案分镜——先在上方生成或保存文案。</div>}
          </div>
        </div>
      )}

      {audioMode === "none" && (
        <p className="hint">纯字幕 + 背景音乐模式：不需要配音，渲染时以字幕呈现文案。</p>
      )}

      <button className="btn primary wide" disabled={busy} onClick={approveCopy}>
        确认，进入找图 →
      </button>
    </>
  );

  const renderStep3 = () => (
    <>
      <div className="row" style={{ flexWrap: "wrap" }}>
        <button
          className="btn primary"
          disabled={busy}
          onClick={() => startTask(() => startFlowImages(pid, modelId))}
        >
          {images.length > 0 ? "重新找图" : "AI 找图"}
        </button>
        <button
          className="btn"
          disabled={busy || !comfy?.reachable}
          title={
            comfy?.reachable
              ? `ComfyUI 生图（${comfy.checkpoint || "默认模型"}），中文提示词自动翻译成英文`
              : comfy?.reason || "ComfyUI 不可用"
          }
          onClick={() => startTask(() => startFlowAiImages(pid, modelId))}
        >
          🎨 AI 生图{comfy?.reachable ? "（全部幕）" : "（不可用）"}
        </button>
        <span className="hint">
          按幕搜索可商用图片，或局域网 ComfyUI 生成；也可上传本地图，或不配图走代码动画。
          {comfy?.reachable && comfy.gpu ? ` · ${comfy.gpu.split("=").pop()}` : ""}
          {comfy?.reachable && !comfy.checkpoints?.length ? " · 未检测到 checkpoint" : ""}
        </span>
      </div>

      {images.map((sc) => (
        <div className="flow-scene" key={sc.index}>
          <div className="flow-scene-head">
            <b>第 {sc.index} 幕{shotLabel(sc.index) ? ` · ${shotLabel(sc.index)}` : ""}</b>
            {sc.custom_file ? (
              <span className="good">本地图：{sc.custom_file}</span>
            ) : sc.selected ? (
              <span className="good">已选图</span>
            ) : (
              <span className="muted">未配图（代码动画）</span>
            )}
            <button
              className="btn small"
              style={{ marginLeft: "auto" }}
              disabled={busy || !comfy?.reachable}
              title={comfy?.reachable ? `只用 ComfyUI 重新生成第 ${sc.index} 幕候选` : comfy?.reason || "ComfyUI 不可用"}
              onClick={() => startTask(() => startFlowAiImages(pid, modelId, [sc.index]))}
            >
              🎨 AI 生图
            </button>
            <label className="btn small" style={{ cursor: "pointer" }}>
              上传本地图
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadSceneImage(sc.index, f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <div className="hint">
            EN: {sc.query_en || "—"}
            <br />
            中文：{sc.query_zh || "—"}
            {sc.prompt_cn ? (
              <>
                <br />
                生图提示词：{sc.prompt_cn}
              </>
            ) : null}
            {sc.note ? (
              <>
                <br />
                备注：{sc.note}
              </>
            ) : null}
          </div>
          {sc.error && <div className="error">{sc.error}</div>}
          {sc.ai_error && <div className="error">{sc.ai_error}</div>}
          {sc.candidates.length > 0 ? (
            <div className="cand-grid">
              {sc.candidates.map((c) => (
                <div className={`cand-card${sc.selected === c.id ? " picked" : ""}`} key={c.id}>
                  {!brokenThumbs[c.id] && (
                    <img
                      src={c.thumb_url}
                      alt={c.title}
                      loading="lazy"
                      onError={() => setBrokenThumbs((m) => ({ ...m, [c.id]: true }))}
                    />
                  )}
                  <div className="cand-title" title={c.title}>{c.title || "（无标题）"}</div>
                  <div className="cand-meta">
                    <span className="muted" title={c.creator}>{c.creator || c.provider}</span>
                    {c.license && <span className="cand-license">{c.license}</span>}
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    <a className="btn small" href={c.page_url} target="_blank" rel="noreferrer">
                      来源
                    </a>
                    <button
                      className="btn small primary"
                      disabled={busy}
                      onClick={() => pickImage(sc.index, c.id)}
                    >
                      {sc.selected === c.id ? "已选用" : "用这张"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !sc.custom_file && <div className="muted" style={{ margin: "6px 0" }}>没有候选图。</div>
          )}
          <button className="btn small" disabled={busy} onClick={() => pickImage(sc.index)}>
            不用图（代码动画）
          </button>
        </div>
      ))}

      {images.length === 0 && (
        <p className="hint">还没有分镜画面数据——先完成上一步编排确认，再点「AI 找图」。</p>
      )}

      <button
        className="btn primary wide"
        disabled={busy || images.length === 0}
        onClick={approveImages}
      >
        确认，进入定样式 →
      </button>
    </>
  );

  const renderStep4 = () => (
    <>
      <div className="row" style={{ flexWrap: "wrap" }}>
        <button
          className="btn primary"
          disabled={busy}
          onClick={() => startTask(() => startFlowStyles(pid, modelId))}
        >
          {styles.proposals.length > 0 ? "重新生成风格样图" : "生成 3 个风格样图"}
        </button>
        <span className="hint">约 1–2 分钟：AI 产出 3 套视觉方案并各出一张样图。</span>
      </div>

      <label className="row" style={{ alignItems: "center", gap: 8, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={settings?.gen_scenes !== false}
          disabled={busy}
          onChange={(e) => toggleGenScenes(e.target.checked)}
        />
        <span>
          选定风格后由本地 coding agent 现场编写 3~5 个定制动画场景
          <span className="hint">（每个项目多花约 5–15 分钟；失败自动回退内置场景库）</span>
        </span>
      </label>

      <label className="field">
        <span>成片模板（渲染时生效）</span>
        <select
          value={settings?.template ?? "datavideo"}
          disabled={busy || !settings}
          onChange={(e) => saveTemplate(e.target.value as "datavideo" | "motionshow")}
        >
          <option value="datavideo">DataVideo · 现有竖屏模板</option>
          <option value="motionshow">MotionShow · 纸感/编辑排版（新版）</option>
        </select>
        <span className="hint">
          MotionShow 使用设计令牌（纸感/编辑/电影/图形）与左对齐版式，需导演方案里带 layout；
          旧项目可先渲染样片对比。
        </span>
      </label>

      {styles.proposals.length > 0 && (
        <div className="style-cards">
          {styles.proposals.map((p, i) => (
            <div className={`style-card${styles.chosen === i + 1 ? " selected" : ""}`} key={i}>
              <img src={styleSrcs[i]} alt={p.name} />
              <b>{p.name}</b>
              {p.kicker && <div className="muted">{p.kicker}</div>}
              <div className="style-why">{p.why}</div>
              <button className="btn small primary" disabled={busy} onClick={() => chooseStyle(i + 1)}>
                {styles.chosen === i + 1 ? "重新选择此风格" : "选这个风格"}
              </button>
            </div>
          ))}
        </div>
      )}

      {storyboard.shots.length > 0 && (
        <>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn" onClick={() => setShowShots((v) => !v)}>
              {showShots ? "收起分镜" : `查看分镜（${storyboard.shot_count || storyboard.shots.length} 幕）`}
            </button>
          </div>
          {showShots && (
            <div className="flow-shots">
              {storyboard.shots.map((s) => (
                <div className="flow-shot-row" key={s.index}>
                  <b>第 {s.index} 幕</b>
                  <span>{s.label || "—"}</span>
                  <span className="muted">运镜：{s.camera || "—"}</span>
                  <span className="muted">转场：{s.transition || "—"}</span>
                  <span className={s.has_image ? "good" : "muted"}>
                    {s.has_image ? "已有图" : "代码动画"}
                  </span>
                  {s.scene && <span className="hint" style={{ flexBasis: "100%" }}>{s.scene}</span>}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <button
        className="btn primary wide"
        disabled={busy || storyboard.shots.length === 0}
        onClick={approveStyles}
      >
        确认分镜，进入检查 →
      </button>
    </>
  );

  const renderStep5 = () => (
    <>
      <button
        className="btn primary"
        disabled={busy}
        onClick={() => startTask(() => startFlowReview(pid, modelId))}
      >
        {review ? "重新审查" : "开始审查"}
      </button>

      {review && (
        <div style={{ marginTop: 12 }}>
          <div className={`review-banner ${review.passed ? "good" : "warn"}`}>
            {review.passed ? "✓ 审查通过" : "⚠ 审查发现待处理问题（确认前请过一遍）"}
          </div>
          {review.summary && <p className="hint">{review.summary}</p>}
          {review.off_topic.length > 0 && (
            <div className="review-offtopic">
              <b className="bad">疑似跑题：</b>
              <ul>
                {review.off_topic.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          {review.issues.map((it, i) => (
            <div className="review-issue" key={i}>
              <span className={`sev sev-${it.severity}`}>{SEV_LABEL[it.severity] ?? it.severity}</span>
              <div>
                <b>{it.where || "全局"}</b>
                <div>{it.problem}</div>
                {it.suggestion && <div className="muted">建议：{it.suggestion}</div>}
              </div>
            </div>
          ))}
          <div className="muted">审查时间：{review.generated_at}</div>
        </div>
      )}

      {!review && (
        <p className="hint" style={{ marginTop: 10 }}>
          审查会检查跑题、事实与结构问题；通过后才能进入直出。
        </p>
      )}

      <button className="btn primary wide" disabled={busy || !review} onClick={confirmReview}>
        确认无误，去出片 →
      </button>
    </>
  );

  const renderStep6 = () => (
    <>
      <div className="row" style={{ flexWrap: "wrap" }}>
        <button
          className="btn primary"
          disabled={busy}
          onClick={() => startTask(() => startFlowPreview(pid))}
        >
          {flowState?.has_preview ? "重新渲染预览" : "渲染前 10 秒预览"}
        </button>
        <button
          className="btn"
          disabled={busy || !flowState?.has_preview || !!gates?.preview}
          onClick={approvePreview}
        >
          {gates?.preview ? "已确认预览 ✓" : "满意，确认预览"}
        </button>
      </div>

      {(flowState?.has_preview || previewKey > 0) && (
        <div className="video-box">
          <video key={previewKey} controls src={previewSrc} />
          <div className="hint">预览约 10 秒，用于快速确认节奏与样式；可随时重新渲染。</div>
        </div>
      )}

      <div className="row" style={{ marginTop: 8 }}>
        <button
          className="btn primary"
          disabled={busy || !gates?.preview}
          onClick={() => startTask(() => startFlowFull(pid))}
        >
          渲染整片
        </button>
        {!gates?.preview && <span className="hint">先确认预览后解锁整片渲染。</span>}
      </div>

      {flowState?.has_video && (
        <div className="video-box">
          <video key={fullKey} controls src={fullSrc} />
          <a className="btn wide" href={fullSrc} download>
            下载 MP4
          </a>
          <div className="hint">成片已就绪，可在右侧发布面板推送到抖音 / 小红书。</div>
        </div>
      )}
    </>
  );

  const renderBody = (n: number) => {
    switch (n) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep6();
    }
  };

  const stageLabel = task ? STAGE_LABEL[task.stage] ?? task.stage : "";

  return (
    <div className="flow">
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0 }}>六步视频流水线</h3>
        <span className="muted">
          搜索 → 编排 → 找图 → 定样式 → 检查 → 直出
          {flowState ? ` · 当前第 ${flowState.step} 步` : ""}
        </span>
      </div>

      {err && <div className="error">{err}</div>}
      {busy && task && (
        <div className="flow-taskbar">
          ⏳ {stageLabel}
          {task.message ? ` · ${task.message}` : ""}
        </div>
      )}
      {task?.error && <div className="error">任务失败：{task.error}（可点上方按钮重试）</div>}

      {STEPS.map((s) => {
        const unlocked = open(s.n);
        const isOpen = expanded === s.n;
        return (
          <div
            className={`flow-step${stepDone(s.n) ? " done" : ""}${unlocked ? "" : " disabled"}`}
            key={s.n}
          >
            <div
              className="flow-step-head"
              onClick={() => setExpanded(isOpen ? null : s.n)}
              title={unlocked ? (isOpen ? "收起" : "展开") : "先完成上一步确认"}
            >
              <span className="flow-step-num">{s.n}</span>
              <b className="flow-step-title">{s.title}</b>
              {badge(s.n)}
              <span className="flow-step-summary">{summary(s.n)}</span>
              <span className="flow-step-toggle">{isOpen ? "收起 ▲" : "展开 ▼"}</span>
            </div>
            {!unlocked ? (
              <div className="flow-step-body flow-step-locked">
                <span className="hint">🔒 先完成上一步确认，再解锁这一步。</span>
              </div>
            ) : (
              isOpen && <div className="flow-step-body">{renderBody(s.n)}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};
