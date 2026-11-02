import { useEffect, useRef, useState } from "react";
import { getActiveTask, getTask, startRender, videoUrl } from "../api";
import { STAGE_LABEL, type TaskStatus } from "../types";

interface Props {
  pid: string;
  /** 渲染前自动保存脚本（App 注入），失败会中断渲染 */
  onBeforeRender: () => Promise<void>;
  /** 上报渲染任务状态（用于右侧执行流程面板） */
  onTaskChange?: (t: TaskStatus | null) => void;
}

const RUNNING = new Set(["queued", "voice", "images", "directing", "rendering"]);

export const RenderPanel: React.FC<Props> = ({ pid, onBeforeRender, onTaskChange }) => {
  const [task, setTask] = useState<TaskStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showLog, setShowLog] = useState(false);
  const [videoKey, setVideoKey] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);

  // 页面刷新/切回时恢复进行中的渲染任务（后端任务线程不会因前端刷新中断）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await getActiveTask(pid);
        if (cancelled) return;
        if (r.task && RUNNING.has(r.task.stage)) {
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

  const poll = (taskId: string) => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(async () => {
      try {
        const t = await getTask(taskId);
        setTask(t);
        onTaskChange?.(t);
        if (!RUNNING.has(t.stage)) {
          if (timer.current) window.clearInterval(timer.current);
          setBusy(false);
          if (t.stage === "done") setVideoKey((k) => k + 1);
        }
      } catch (e) {
        setErr((e as Error).message);
        if (timer.current) window.clearInterval(timer.current);
        setBusy(false);
      }
    }, 1500);
  };

  const render = async () => {
    setErr("");
    setBusy(true);
    try {
      await onBeforeRender();
      const { task_id } = await startRender(pid);
      setTask(null);
      onTaskChange?.(null);
      poll(task_id);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  const stageLabel = task ? (STAGE_LABEL[task.stage] ?? task.stage) : "";

  return (
    <div className="panel">
      <h3>渲染</h3>
      <p className="hint">
        流程：自动保存脚本 → edge-tts 配音 → 生成占位画面 → Remotion 本地渲染。
        竖屏 1080×1920，普通长度的视频大约需要几分钟。
      </p>
      <button className="btn primary wide" disabled={busy} onClick={render}>
        {busy ? "进行中..." : "开始渲染"}
      </button>

      {err && <div className="error">{err}</div>}

      {task && (
        <div className="task-box">
          <div>
            状态：
            <b className={task.stage === "error" ? "bad" : task.stage === "done" ? "good" : ""}>
              {stageLabel}
            </b>
            {task.message && <span> · {task.message}</span>}
          </div>
          {task.error && <div className="error">{task.error}</div>}
          {task.stage === "done" && (
            <div className="video-box">
              <video key={videoKey} controls src={videoUrl(pid)} />
              <a className="btn wide" href={videoUrl(pid)} download>
                下载 MP4
              </a>
            </div>
          )}
          {task.log_tail && (
            <div>
              <button className="btn small" onClick={() => setShowLog((v) => !v)}>
                {showLog ? "隐藏" : "显示"}渲染日志
              </button>
              {showLog && <pre className="log">{task.log_tail}</pre>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
