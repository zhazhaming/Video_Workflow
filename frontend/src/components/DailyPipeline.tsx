import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  pipelineConfirmRun,
  pipelineProduceNow,
  pipelineRunLog,
  pipelineRuns,
  pipelineRunNow,
  pipelineStatus,
  pipelineUpdateConfig,
  projectCoverUrl,
  videoUrl,
} from "../api";
import type {
  PipelineRun,
  PipelineStatus,
  PipelineTheme,
  PipelineVideo,
} from "../types";
import { CompanySeries } from "./CompanySeries";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  awaiting_confirm: { label: "待确认", cls: "dp-chip warn" },
  scheduled: { label: "已排产", cls: "dp-chip manual" },
  running: { label: "运行中", cls: "dp-chip run" },
  done: { label: "全部完成", cls: "dp-chip ok" },
  partial: { label: "部分完成", cls: "dp-chip warn" },
  failed: { label: "失败", cls: "dp-chip bad" },
  skipped: { label: "未制作", cls: "dp-chip" },
};

const VIDEO_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "排队中", cls: "dp-chip" },
  running: { label: "制作中", cls: "dp-chip run" },
  done: { label: "已出片", cls: "dp-chip ok" },
  failed: { label: "失败", cls: "dp-chip bad" },
};

/** 历史默认展示最近几天的批次，更早的走「查看更多」 */
const RECENT_DAYS = 3;

const fmtBurst = (n: number) => Math.round(n);
const fmtSecs = (n: number | null) =>
  typeof n === "number" && n > 0 ? `${Math.round(n)}s` : "";

/** 批次按天分组（新→旧）：run.id 形如 20261107-212035 */
function groupByDay(runs: PipelineRun[]): { key: string; label: string; runs: PipelineRun[] }[] {
  const map = new Map<string, PipelineRun[]>();
  for (const r of runs) {
    const key = r.id.slice(0, 8);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return [...map.entries()].map(([key, rs]) => {
    const label = `${key.slice(4, 6)}月${key.slice(6, 8)}日`;
    return { key, label, runs: rs };
  });
}

type CfgDraft = {
  push_hour: number;
  push_minute: number;
  produce_hour: number;
  produce_minute: number;
  count: number;
  target_seconds: number;
  feishu_webhook: string;
  feishu_secret: string;
  page_url: string;
  style_prompt: string;
};

export const DailyPipeline = ({
  onOpenProject,
}: {
  onOpenProject: (pid: string) => void;
}) => {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  // 两条轨道：热点自动出片 / 每日一家公司（公司档期板）
  const [track, setTrack] = useState<"hot" | "company">(() =>
    new URLSearchParams(window.location.search).get("track") === "company" ? "company" : "hot"
  );
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState(false);
  const [draftCfg, setDraftCfg] = useState<CfgDraft | null>(null);
  // 我的方向（主题）：主页面直接编辑；关键词编辑期间保留原文，保存时才解析
  const [dirEditing, setDirEditing] = useState(false);
  const [dirDraft, setDirDraft] = useState<PipelineTheme[]>([]);
  const [dirRaw, setDirRaw] = useState<string[]>([]);
  const [dirSaving, setDirSaving] = useState(false);
  const dirEditingRef = useRef(false);
  useEffect(() => {
    dirEditingRef.current = dirEditing;
  }, [dirEditing]);
  // 历史查看：查看更多（全部日期、默认收起）
  const [historyFull, setHistoryFull] = useState(false);
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [logView, setLogView] = useState<{ runId: string; pid: string } | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [playingPid, setPlayingPid] = useState("");
  // 候选勾选（无默认勾选：确认了哪几条才做哪几条）
  const [picks, setPicks] = useState<Record<string, number[]>>({});

  const load = useCallback(async () => {
    try {
      const [st, rs] = await Promise.all([pipelineStatus(), pipelineRuns(60)]);
      setStatus(st);
      setRuns(rs);
      setErr("");
      setDraftCfg((cur) =>
        cur ?? {
          push_hour: st.push_hour,
          push_minute: st.push_minute,
          produce_hour: st.produce_hour,
          produce_minute: st.produce_minute,
          count: st.count,
          target_seconds: st.target_seconds,
          feishu_webhook: st.feishu_webhook,
          feishu_secret: st.feishu_secret,
          page_url: st.page_url,
          style_prompt: st.style_prompt,
        }
      );
      setDirDraft((cur) => (dirEditingRef.current ? cur : st.themes));
      setDirRaw((cur) =>
        dirEditingRef.current ? cur : st.themes.map((t) => t.keywords.join(","))
      );
    } catch (e) {
      setErr(`加载失败：${(e as Error).message}（后端是否已启动？）`);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = status?.running || status?.awaiting_run_id;
  useEffect(() => {
    const t = window.setInterval(load, active ? 5000 : 30000);
    return () => window.clearInterval(t);
  }, [active, load]);

  useEffect(() => {
    if (!logView) return;
    let alive = true;
    const fetchLog = async () => {
      try {
        const r = await pipelineRunLog(logView.runId, logView.pid, 60);
        if (alive) setLogLines(r.lines);
      } catch {
        /* 日志丢失不影响主流程 */
      }
    };
    fetchLog();
    const t = window.setInterval(fetchLog, 5000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [logView, status?.running]);

  const runNow = async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await pipelineRunNow(draftCfg?.count);
      setMsg(r.message || "候选已就绪");
      setTimeout(() => setMsg(""), 4000);
      await load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const toggleEnabled = async () => {
    if (!status) return;
    try {
      setStatus(await pipelineUpdateConfig({ enabled: !status.enabled }));
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const saveCfg = async () => {
    if (!draftCfg) return;
    try {
      setStatus(await pipelineUpdateConfig(draftCfg));
      setEditing(false);
      setMsg("配置已保存（下批生效）");
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const startDirEdit = () => {
    setDirDraft(status?.themes ?? []);
    setDirRaw((status?.themes ?? []).map((t) => t.keywords.join(",")));
    setDirEditing(true);
  };

  const saveDirs = async () => {
    setDirSaving(true);
    try {
      const themes = dirDraft.map((t, i) => ({
        name: t.name,
        keywords: dirRaw[i]
          .split(/[,，]/)
          .map((k) => k.trim())
          .filter(Boolean),
      }));
      setStatus(await pipelineUpdateConfig({ themes }));
      setDirEditing(false);
      setMsg("方向已保存（下批候选生效）");
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setDirSaving(false);
    }
  };

  const doConfirm = async (runId: string, indices: number[], schedule: boolean) => {
    setBusy(true);
    try {
      const r = await pipelineConfirmRun(runId, { indices, schedule });
      setMsg(schedule ? `已排产，将于 ${r.produce_at?.slice(5, 16)} 自动制作` : "已开始制作");
      setTimeout(() => setMsg(""), 4000);
      await load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const doProduceNow = async (runId: string) => {
    setBusy(true);
    try {
      await pipelineProduceNow(runId);
      setMsg("已开始制作");
      setTimeout(() => setMsg(""), 3000);
      await load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const togglePick = (runId: string, idx: number) => {
    setPicks((cur) => {
      const curPicks = cur[runId] ?? [];
      const next = curPicks.includes(idx)
        ? curPicks.filter((x) => x !== idx)
        : [...curPicks, idx].sort((a, b) => a - b);
      return { ...cur, [runId]: next.slice(0, 5) };
    });
  };

  const toggleLog = (runId: string, pid: string) => {
    setPlayingPid("");
    if (logView && logView.runId === runId && logView.pid === pid) setLogView(null);
    else setLogView({ runId, pid });
  };

  const togglePlay = (pid: string) => {
    setLogView(null);
    setPlayingPid((cur) => (cur === pid ? "" : pid));
  };

  const toggleDay = (key: string) => {
    setCollapsedDays((cur) => {
      const next = new Set(cur);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const awaitingRun = useMemo(() => runs.find((r) => r.status === "awaiting_confirm"), [runs]);
  const historyRuns = useMemo(
    () => runs.filter((r) => r.status !== "awaiting_confirm"),
    [runs]
  );
  const dayGroups = useMemo(() => groupByDay(historyRuns), [historyRuns]);

  const renderRunBlock = (run: PipelineRun) => {
    const meta = STATUS_META[run.status] ?? STATUS_META.failed;
    return (
      <div className="panel dp-run" key={run.id}>
        <div className="dp-status-row">
          <strong title={run.id}>{run.id.slice(9, 11)}:{run.id.slice(11, 13)}</strong>
          <span className={`dp-chip ${run.trigger === "manual" ? "manual" : ""}`}>
            {run.trigger === "manual" ? "手动" : "定时"}
          </span>
          {run.kind === "company" && <span className="dp-chip manual">公司</span>}
          <span className={meta.cls}>{meta.label}</span>
          {run.confirmed && (
            <span className="muted">
              做 {run.confirmed.indices.join("、")}
            </span>
          )}
          {run.status === "scheduled" && run.produce_at && (
            <span className="muted">将于 {run.produce_at.slice(5, 16)} 制作</span>
          )}
          {run.status === "scheduled" && (
            <button className="btn tiny primary" disabled={busy} onClick={() => doProduceNow(run.id)}>
              ▶ 立即制作
            </button>
          )}
          <span className="muted">
            {run.finished_at ? `完成于 ${run.finished_at.slice(5, 16)}` : "进行中…"}
          </span>
        </div>
        {run.error && <div className="bad" style={{ margin: "6px 0" }}>{run.error}</div>}
        {/* 未制作的批次展示错过/可选的候选内容 */}
        {run.status === "skipped" && !!run.candidates?.length && (
          <SkippedCandidates candidates={run.candidates} />
        )}
        <div className="dp-videos">
          {run.videos.map((v) => (
            <VideoCard
              key={v.pid}
              v={v}
              playing={playingPid === v.pid}
              onPlay={() => togglePlay(v.pid)}
              onOpen={() => onOpenProject(v.pid)}
              onLog={() => toggleLog(run.id, v.pid)}
              logActive={!!logView && logView.runId === run.id && logView.pid === v.pid}
            />
          ))}
        </div>
        {logView && logView.runId === run.id && (
          <pre className="log dp-log">
            {logLines.length ? logLines.join("\n") : "（等待会话输出…）"}
          </pre>
        )}
      </div>
    );
  };

  // ---- 公司轨道：档期板（选公司 / 初稿 / 排产）----
  if (track === "company") {
    return (
      <div className="dp">
        <TrackTabs track={track} onChange={setTrack} />
        <CompanySeries onOpenProject={onOpenProject} />
      </div>
    );
  }

  // ---- 查看更多：全量历史，默认全部收起 ----
  if (historyFull) {
    return (
      <div className="dp">
        <div className="panel dp-status">
          <div className="dp-status-row">
            <button className="btn small" onClick={() => setHistoryFull(false)}>← 返回</button>
            <h3>📜 全部历史</h3>
            <span className="muted">{dayGroups.length} 天 · 默认收起，点日期展开</span>
          </div>
        </div>
        {dayGroups.map((g) => (
          <div className="panel dp-day" key={g.key}>
            <button className="dp-day-head" onClick={() => toggleDay(g.key)}>
              <span>{collapsedDays.has(g.key) ? "▸" : "▾"} {g.label}</span>
              <span className="muted">{g.runs.length} 批</span>
            </button>
            {!collapsedDays.has(g.key) && g.runs.map(renderRunBlock)}
          </div>
        ))}
        {!dayGroups.length && <div className="panel"><div className="muted">还没有历史批次。</div></div>}
      </div>
    );
  }

  return (
    <div className="dp">
      <TrackTabs track={track} onChange={setTrack} />
      {err && <div className="error">{err}</div>}
      {/* 状态卡 */}
      <div className="panel dp-status">
        <div className="dp-status-row">
          <h3>🎬 视频流水线</h3>
          <span className="muted">
            {status
              ? `每日 ${String(status.push_hour).padStart(2, "0")}:${String(status.push_minute).padStart(2, "0")} 推送候选 · 凌晨 ${String(status.produce_hour).padStart(2, "0")}:${String(status.produce_minute).padStart(2, "0")} 制作 · 每批 ${status.count} 条`
              : "加载中…"}
          </span>
          <span className="dp-chips">
            {status?.running && <span className="dp-chip run">制作中</span>}
            {status?.awaiting_run_id && <span className="dp-chip warn">待确认</span>}
            {status && !status.agent_available && (
              <span className="dp-chip bad" title={status.agent_cmd}>
                dsh agent 未找到
              </span>
            )}
          </span>
          <span style={{ flex: 1 }} />
          <button className="btn small" onClick={toggleEnabled} disabled={!status || busy}>
            {status?.enabled ? "⏸ 停用定时" : "▶ 启用定时"}
          </button>
          <button className="btn small" onClick={() => setEditing((v) => !v)} disabled={!status}>
            {editing ? "收起配置" : "⚙ 配置"}
          </button>
          <button
            className="btn small primary"
            disabled={busy || status?.running || !!status?.awaiting_run_id}
            onClick={runNow}
            title="选一批候选并推送确认（已有待确认批次时不可重复发起）"
          >
            {status?.running ? "制作中…" : status?.awaiting_run_id ? "候选待确认" : busy ? "启动中…" : "▶ 立即生成"}
          </button>
        </div>
        {msg && <div className="good" style={{ marginTop: 8 }}>{msg}</div>}
        {status?.running && status.last_run && (
          <div className="hint" style={{ marginTop: 8 }}>
            批次 {status.last_run.id} 制作中：已完成 {status.last_run.done}/{status.last_run.total}
            （单条约 20~60 分钟，可展开卡片看实时日志）
          </div>
        )}
        {editing && status && draftCfg && (
          <div className="dp-cfg">
            <div className="dp-cfg-row">
              <label>
                每天
                <input type="number" min={0} max={23} value={draftCfg.push_hour}
                  onChange={(e) => setDraftCfg({ ...draftCfg, push_hour: Number(e.target.value) })} />
                点
                <input type="number" min={0} max={59} value={draftCfg.push_minute}
                  onChange={(e) => setDraftCfg({ ...draftCfg, push_minute: Number(e.target.value) })} />
                分推送候选（一天一次）；凌晨
                <input type="number" min={0} max={23} value={draftCfg.produce_hour}
                  onChange={(e) => setDraftCfg({ ...draftCfg, produce_hour: Number(e.target.value) })} />
                点
                <input type="number" min={0} max={59} value={draftCfg.produce_minute}
                  onChange={(e) => setDraftCfg({ ...draftCfg, produce_minute: Number(e.target.value) })} />
                分制作已排产批次
              </label>
            </div>
            <div className="dp-cfg-row">
              <label>
                每批
                <input type="number" min={1} max={5} value={draftCfg.count}
                  onChange={(e) => setDraftCfg({ ...draftCfg, count: Number(e.target.value) })} />
                条 · 单条约
                <input type="number" min={15} max={240} step={5} value={draftCfg.target_seconds}
                  onChange={(e) => setDraftCfg({ ...draftCfg, target_seconds: Number(e.target.value) })} />
                秒（当日 24:00 前未确认则不做）
              </label>
            </div>
            <div className="dp-cfg-row">
              <label>
                飞书 webhook
                <input className="dp-cfg-wide" placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/…（群机器人）"
                  value={draftCfg.feishu_webhook}
                  onChange={(e) => setDraftCfg({ ...draftCfg, feishu_webhook: e.target.value })} />
              </label>
              <label>
                签名密钥
                <input className="dp-cfg-mid" placeholder="机器人开了签名校验才需要"
                  value={draftCfg.feishu_secret}
                  onChange={(e) => setDraftCfg({ ...draftCfg, feishu_secret: e.target.value })} />
              </label>
              <label>
                卡片链接
                <input className="dp-cfg-mid" placeholder="http://局域网IP:5173"
                  value={draftCfg.page_url}
                  onChange={(e) => setDraftCfg({ ...draftCfg, page_url: e.target.value })} />
              </label>
            </div>
            <div className="dp-cfg-row">
              <label className="dp-cfg-col">
                <span className="muted">账号风格硬约束（注入每份任务书；默认含 数据准确/浅色背景/留存动效/抖音竖屏）</span>
                <textarea className="dp-cfg-area" rows={3} value={draftCfg.style_prompt}
                  onChange={(e) => setDraftCfg({ ...draftCfg, style_prompt: e.target.value })} />
              </label>
            </div>
            <div className="dp-cfg-row">
              <button className="btn small primary" onClick={saveCfg}>保存配置</button>
              <span className="muted mono">执行体: dsh {status.agent_profile}（{status.agent_cmd}）</span>
            </div>
          </div>
        )}
      </div>

      {/* 我的方向：候选内容跟着这里定义的方向走 */}
      <div className="panel dp-status">
        <div className="dp-status-row">
          <h3>🎯 我的方向</h3>
          <span className="muted">候选优先从这些方向出；未定义则纯按全站热度</span>
          <span style={{ flex: 1 }} />
          {!dirEditing && (
            <button className="btn small" onClick={startDirEdit}>✎ 编辑方向</button>
          )}
        </div>
        {!dirEditing ? (
          <div className="dp-dir-view">
            {(status?.themes ?? []).length ? (
              (status?.themes ?? []).map((t, i) => (
                <span className="dp-cand" style={{ cursor: "default" }} key={i}>
                  <strong>{t.name || "未命名"}</strong>
                  <span className="muted">{t.keywords.join(" / ") || "（无关键词）"}</span>
                </span>
              ))
            ) : (
              <span className="muted">还没有定义方向 —— 定义后（如「电竞：英雄联盟,BLG」）候选会优先推你感兴趣的内容</span>
            )}
          </div>
        ) : (
          <div className="dp-cfg">
            {dirDraft.map((t, i) => (
              <div className="dp-cfg-row dp-theme" key={i}>
                <input className="dp-cfg-theme-name" placeholder="方向名"
                  value={t.name}
                  onChange={(e) => {
                    const themes = dirDraft.slice();
                    themes[i] = { ...t, name: e.target.value };
                    setDirDraft(themes);
                  }} />
                {/* 关键词保留原文输入（逗号自然键入），保存时才按逗号解析 */}
                <input className="dp-cfg-wide" placeholder="关键词，用逗号分隔（如：英雄联盟,BLG,S15）"
                  value={dirRaw[i] ?? ""}
                  onChange={(e) => {
                    const raw = dirRaw.slice();
                    raw[i] = e.target.value;
                    setDirRaw(raw);
                  }} />
                <button className="btn tiny danger" onClick={() => {
                  setDirDraft(dirDraft.filter((_, j) => j !== i));
                  setDirRaw(dirRaw.filter((_, j) => j !== i));
                }}>
                  ✕
                </button>
              </div>
            ))}
            <div className="dp-cfg-row">
              <button className="btn tiny" onClick={() => {
                setDirDraft([...dirDraft, { name: "", keywords: [] }]);
                setDirRaw([...dirRaw, ""]);
              }}>
                ＋ 加方向
              </button>
              <span style={{ flex: 1 }} />
              <button className="btn small" onClick={() => setDirEditing(false)} disabled={dirSaving}>取消</button>
              <button className="btn small primary" onClick={saveDirs} disabled={dirSaving}>
                {dirSaving ? "保存中…" : "保存方向"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 候选确认（无默认勾选：勾了哪几条才做哪几条） */}
      {awaitingRun && (
        <div className="panel dp-run dp-awaiting">
          <div className="dp-status-row">
            <strong>候选确认</strong>
            <span className="dp-chip warn">待确认</span>
            <span className="muted">
              {awaitingRun.trigger === "manual" ? "手动" : "定时"} · {awaitingRun.candidates?.length ?? 0} 条候选 ·
              {awaitingRun.confirm_deadline || "当日 24:00 前未确认则不做"}
            </span>
            <span style={{ flex: 1 }} />
            <button className="btn small primary" disabled={busy || !(picks[awaitingRun.id]?.length)}
              onClick={() => doConfirm(awaitingRun.id, picks[awaitingRun.id] ?? [], true)}
              title="排产到凌晨制作时间自动制作">
              ✓ 确认并排产{picks[awaitingRun.id]?.length ? `（${picks[awaitingRun.id].length}）` : ""}
            </button>
            <button className="btn small" disabled={busy || !(picks[awaitingRun.id]?.length)}
              onClick={() => doConfirm(awaitingRun.id, picks[awaitingRun.id] ?? [], false)}
              title="跳过排产，立刻开始制作所选条目">
              ▶ 立即制作
            </button>
          </div>
          {awaitingRun.notify && !awaitingRun.notify.ok && (
            <div className="muted" style={{ marginTop: 6 }}>
              飞书推送：{awaitingRun.notify.error}
            </div>
          )}
          <div className="dp-cands">
            {(awaitingRun.candidates ?? []).map((c, i) => {
              const idx = i + 1;
              const checked = (picks[awaitingRun.id] ?? []).includes(idx);
              return (
                <label className={`dp-cand ${checked ? "picked" : ""}`} key={idx}>
                  <input type="checkbox" checked={checked} disabled={c.column === "淘汰"}
                    onChange={() => togglePick(awaitingRun.id, idx)} />
                  <span className="dp-cand-idx">{idx}</span>
                  <span className="dp-cand-title" title={c.title}>{c.title}</span>
                  {c.column && (
                    <span
                      className="chip"
                      style={
                        c.column === "淘汰"
                          ? { background: "#fde8e8", color: "#b42318" }
                          : { background: "#e8f2ff", color: "#175cd3" }
                      }
                    >
                      {c.column}
                    </span>
                  )}
                  {c.opening_number && <span className="chip">开场 {c.opening_number}</span>}
                  <span className="muted">
                    {c.platform_name} · 波 {fmtBurst(c.burst)}
                    {c.theme_name && <span className="dp-cand-theme">｜{c.theme_name}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* 历史批次：默认展示最近 3 天（可折叠），更早的走「查看更多」 */}
      {dayGroups.slice(0, RECENT_DAYS).map((g) => (
        <div className="panel dp-day" key={g.key}>
          <button className="dp-day-head" onClick={() => toggleDay(g.key)}>
            <span>{collapsedDays.has(g.key) ? "▸" : "▾"} {g.label}</span>
            <span className="muted">{g.runs.length} 批</span>
          </button>
          {!collapsedDays.has(g.key) && g.runs.map(renderRunBlock)}
        </div>
      ))}
      {dayGroups.length > RECENT_DAYS && (
        <button className="btn dp-more" onClick={() => { setCollapsedDays(new Set(dayGroups.map((g) => g.key))); setHistoryFull(true); }}>
          查看更多历史（{dayGroups.length - RECENT_DAYS} 天）
        </button>
      )}
      {!runs.length && !err && (
        <div className="panel">
          <div className="muted">
            还没有运行记录。定义好方向后点「▶ 立即生成」试跑一批：每天最多出 2 条热点候选（其中至少 1 条来自 ai干活），推飞书/本页勾选，
            确认后才制作（每条约 20~60 分钟）。
          </div>
        </div>
      )}
    </div>
  );
};

/** 未制作批次的候选清单：默认只显示条数，展开看具体内容 */
const SkippedCandidates = ({ candidates }: { candidates: PipelineRun["candidates"] }) => {
  const [open, setOpen] = useState(false);
  if (!candidates?.length) return null;
  return (
    <div className="dp-skip-cands">
      <button className="dp-skip-toggle" onClick={() => setOpen(!open)}>
        {open ? "▾" : "▸"} 当时推送的候选（{candidates.length} 条，未确认未制作）
      </button>
      {open && (
        <div className="dp-cands">
          {candidates.map((c, i) => (
            <div className="dp-cand" style={{ cursor: "default" }} key={i}>
              <span className="dp-cand-idx">{i + 1}</span>
              <span className="dp-cand-title" title={c.title}>{c.title}</span>
              <span className="muted">
                {c.platform_name} · 波 {fmtBurst(c.burst)}
                {c.theme_name && <span className="dp-cand-theme">｜{c.theme_name}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TrackTabs = ({
  track,
  onChange,
}: {
  track: "hot" | "company";
  onChange: (t: "hot" | "company") => void;
}) => (
  <div className="dp-tracks">
    <button className={`tab ${track === "hot" ? "tab-active" : ""}`} onClick={() => onChange("hot")}>
      🔥 热点流水线
    </button>
    <button
      className={`tab ${track === "company" ? "tab-active" : ""}`}
      onClick={() => onChange("company")}
    >
      🏢 每日公司
      <span className="dp-chip manual" style={{ marginLeft: 6 }}>系列</span>
    </button>
  </div>
);

const VideoCard = ({
  v,
  playing,
  logActive,
  onPlay,
  onOpen,
  onLog,
}: {
  v: PipelineVideo;
  playing: boolean;
  logActive: boolean;
  onPlay: () => void;
  onOpen: () => void;
  onLog: () => void;
}) => {
  const [coverOk, setCoverOk] = useState(true);
  const meta = VIDEO_META[v.status] ?? VIDEO_META.pending;
  const showCover = v.status === "done" && v.has_video && coverOk;
  return (
    <div className={`dp-video ${v.status}`}>
      <div className="dp-thumb">
        {showCover ? (
          <img src={projectCoverUrl(v.pid)} alt="" onError={() => setCoverOk(false)} />
        ) : (
          <div className="dp-thumb-empty">{v.status === "running" ? "⏳" : "🎬"}</div>
        )}
        <span className={meta.cls}>{meta.label}</span>
      </div>
      <div className="dp-video-main">
        <div className="dp-video-title" title={v.title || v.topic_title}>
          {v.title || v.topic_title}
        </div>
        <div className="muted mono">
          {v.pid} · {v.platform === "company" ? "每日公司" : `${fmtBurst(v.burst)} 波`} ·{" "}
          {fmtSecs(v.duration_seconds)}
          {v.theme_name ? ` · ${v.theme_name}` : ""}
        </div>
        {v.status === "failed" && v.error && <div className="bad dp-err">{v.error}</div>}
        <div className="dp-video-ops">
          {v.status === "done" && v.has_video && (
            <button className="btn tiny" onClick={onPlay}>
              {playing ? "收起" : "▶ 播放"}
            </button>
          )}
          <button className="btn tiny" onClick={onLog}>
            {logActive ? "收起日志" : "📜 日志"}
          </button>
          <button className="btn tiny" onClick={onOpen} title="打开项目详情">
            📂 详情
          </button>
        </div>
      </div>
      {playing && <video className="dp-player" src={videoUrl(v.pid)} controls autoPlay />}
    </div>
  );
};
