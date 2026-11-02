import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  aiBriefing,
  clearTopics,
  createDirection,
  deleteDirection,
  deleteTopic,
  generateAiTopics,
  hotspotBriefing,
  hotspotItems,
  hotspotRefresh,
  hotspotStatus,
  listDirections,
  listTopics,
  updateDirection,
  updateTopic,
} from "../api";
import type {
  AiTopic,
  Briefing,
  BriefingComment,
  HotDirection,
  HotItem,
  HotspotStatus,
  ModelInfo,
  SavedTopic,
} from "../types";

const PLATFORM_NAMES: Record<string, string> = {
  douyin: "抖音",
  toutiao: "头条",
  baidu: "百度",
  zhihu: "知乎",
  bilibili: "B站",
  weibo: "微博",
  xiaohongshu: "小红书",
  kuaishou: "快手",
};

/** 无榜单但可搜的平台：详情弹窗用于多平台分发前调研 */
const CROSS_SEARCH: Record<string, string> = {
  xiaohongshu: "https://www.xiaohongshu.com/search_result?keyword={}",
  kuaishou: "https://www.kuaishou.com/search/video?searchKey={}",
  weibo: "https://s.weibo.com/weibo?q={}",
};

const TREND_META: Record<string, { icon: string; label: string; cls: string }> = {
  new: { icon: "🚀", label: "新上榜", cls: "trend-new" },
  up: { icon: "📈", label: "上升", cls: "trend-up" },
  flat: { icon: "➖", label: "持平", cls: "trend-flat" },
  down: { icon: "📉", label: "降温", cls: "trend-down" },
};

/** 相对时间：几分钟前 / 几小时前 / 日期 */
function relTime(s: string): string {
  if (!s) return "";
  const t = new Date(s.replace(" ", "T"));
  if (isNaN(t.getTime())) return s;
  const diff = (Date.now() - t.getTime()) / 1000;
  if (diff < 60) return "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return s.slice(5, 16);
}

/** 第一波指数分档配色：越高越红（越要马上做） */
function burstTier(burst: number): string {
  if (burst >= 85) return "burst-fire";
  if (burst >= 70) return "burst-hot";
  if (burst >= 50) return "burst-warm";
  return "burst-cool";
}

/** 选题状态展示与流转 */
const TOPIC_STATUS: Record<string, { label: string; cls: string; next: string }> = {
  todo: { label: "待拍", cls: "st-todo", next: "doing" },
  doing: { label: "拍摄中", cls: "st-doing", next: "done" },
  done: { label: "已完成", cls: "st-done", next: "todo" },
  dropped: { label: "已弃", cls: "st-dropped", next: "todo" },
};

const normKey = (s: string) => s.replace(/\s+/g, "").toLowerCase();

/** 一夜热度走势迷你曲线（大图模式带面积填充） */
const Sparkline = ({
  data,
  w = 88,
  h = 18,
  fillArea = false,
}: {
  data: number[];
  w?: number;
  h?: number;
  fillArea?: boolean;
}) => {
  if (data.length < 2) return null;
  const mx = Math.max(...data);
  const mn = Math.min(...data);
  const span = mx - mn || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * (w - 2) + 1},${h - 2 - ((v - mn) / span) * (h - 4)}`)
    .join(" ");
  const lastUp = data[data.length - 1] >= data[data.length - 2];
  const color = lastUp ? "#3fb950" : "#a3717a";
  return (
    <span title="热度走势（最近若干轮抓取）" style={{ lineHeight: 0 }}>
      <svg width={w} height={h} className="spark">
        {fillArea && <polygon points={`${pts} ${w - 1},${h - 1} 1,${h - 1}`} fill={color} opacity={0.12} />}
        <polyline
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth={fillArea ? 2 : 1.5}
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};

export const HotspotRadar = ({
  models,
  onUseTopic,
  onOpenProject,
  onAlertCount,
  onGenerateScript,
}: {
  models: ModelInfo[];
  onUseTopic: (topic: string) => Promise<string | void> | string | void;
  onOpenProject: (pid: string) => void;
  onAlertCount?: (n: number) => void;
  onGenerateScript?: (
    topic: string
  ) => Promise<{ pid: string; ok: boolean } | void> | { pid: string; ok: boolean } | void;
}) => {
  const [status, setStatus] = useState<HotspotStatus | null>(null);
  const [directions, setDirections] = useState<HotDirection[]>([]);
  const [items, setItems] = useState<HotItem[]>([]);
  const [brief, setBrief] = useState<Briefing | null>(null);
  const [briefComments, setBriefComments] = useState<BriefingComment[] | null>(null);
  const [briefAiBusy, setBriefAiBusy] = useState(false);
  const [briefOpen, setBriefOpen] = useState(() => localStorage.getItem("vw.briefOpen") !== "0");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");

  // 筛选
  const [directionId, setDirectionId] = useState("");
  const [platform, setPlatform] = useState(() => localStorage.getItem("vw.pf") ?? "");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState(() => localStorage.getItem("vw.sort") ?? "burst");
  const [aggregated, setAggregated] = useState(
    () => localStorage.getItem("vw.agg") === "1"
  );
  const [copiedId, setCopiedId] = useState("");

  // 方向新建/编辑表单
  const [dirFormOpen, setDirFormOpen] = useState(false);
  const [editingDirId, setEditingDirId] = useState("");
  const [newName, setNewName] = useState("");
  const [newKeywords, setNewKeywords] = useState("");
  const [newExclude, setNewExclude] = useState("");
  const [dirBusy, setDirBusy] = useState(false);

  // 选中与 AI 选题
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [aiBusy, setAiBusy] = useState(false);
  const [aiModel, setAiModel] = useState("");
  const [topics, setTopics] = useState<AiTopic[]>([]);
  const [savedTopics, setSavedTopics] = useState<SavedTopic[]>([]);
  const [refCounts, setRefCounts] = useState<Record<string, number>>({});
  const [dupHint, setDupHint] = useState("");
  // 赛道预警：最近 2h 内、命中我的方向、新上榜/上升且 burst≥70 的热点
  const [alertIds, setAlertIds] = useState<string[]>([]);
  // 热点详情弹窗
  const [detail, setDetail] = useState<HotItem | null>(null);
  // 选题工作台：状态筛选 + 备注编辑
  const [topicFilter, setTopicFilter] = useState("");
  const [noteEditing, setNoteEditing] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  // 一键生成脚本进行中的选题 id
  const [genBusyId, setGenBusyId] = useState("");
  const [seenIds, setSeenIds] = useState<Set<string>>(
    () => new Set(JSON.parse(localStorage.getItem("vw.alertSeen") ?? "[]") as string[])
  );
  const freshAlerts = alertIds.filter((id) => !seenIds.has(id));

  const ackAlerts = () => {
    const merged = [...new Set([...Array.from(seenIds), ...alertIds])].slice(-300);
    localStorage.setItem("vw.alertSeen", JSON.stringify(merged));
    setSeenIds(new Set(merged));
    onAlertCount?.(0);
  };

  // 未读预警数变化 → 同步到 Tab 红点
  useEffect(() => {
    onAlertCount?.(freshAlerts.length);
  }, [freshAlerts.length, onAlertCount]);

  // 筛选条件记忆（下次打开保持）
  useEffect(() => {
    localStorage.setItem("vw.agg", aggregated ? "1" : "0");
  }, [aggregated]);

  // 详情弹窗：ESC 关闭
  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetail(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail]);
  useEffect(() => {
    localStorage.setItem("vw.sort", sort);
  }, [sort]);
  useEffect(() => {
    localStorage.setItem("vw.pf", platform);
  }, [platform]);

  const filterRef = useRef({ directionId, platform, q, sort });
  filterRef.current = { directionId, platform, q, sort };
  const qInputRef = useRef<HTMLInputElement | null>(null);

  // 快捷键：/ 聚焦关键词搜索框；输入框内 Escape 清空并失焦
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField =
        target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if (e.key === "/" && !inField) {
        e.preventDefault();
        qInputRef.current?.focus();
      } else if (e.key === "Escape" && target === qInputRef.current) {
        setQ("");
        qInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const loadAll = useCallback(async () => {
    const f = filterRef.current;
    try {
      const [items, status, brief] = await Promise.all([
        hotspotItems({ direction_id: f.directionId, platform: f.platform, q: f.q, sort: f.sort }),
        hotspotStatus(),
        hotspotBriefing(5),
      ]);
      setItems(items);
      setStatus(status);
      setBrief(brief);
      setErr("");
      // 赛道预警计算：命中方向 + 新爆（2h 内 + trend new/up + burst≥70）
      try {
        const nowMs = Date.now();
        const alerts = items
          .filter((i) => {
            if (i.direction_ids.length === 0 || (i.burst ?? 0) < 70) return false;
            if (i.trend !== "new" && i.trend !== "up") return false;
            const t = new Date((i.first_seen || "").replace(" ", "T")).getTime();
            return !isNaN(t) && nowMs - t < 2 * 3600 * 1000;
          })
          .map((i) => i.id);
        setAlertIds(alerts);
      } catch {
        /* 预警失败不影响主流程 */
      }
    } catch (e) {
      setErr(`热点加载失败：${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    listDirections()
      .then(setDirections)
      .catch(() => setDirections([]));
    listTopics()
      .then(setSavedTopics)
      .catch(() => setSavedTopics([]));
    const def = models.find((m) => m.is_default && m.available) ?? models.find((m) => m.available);
    if (def) setAiModel(def.id);
  }, [models]);

  useEffect(() => {
    setLoading(true);
    loadAll();
  }, [directionId, platform, sort, loadAll]);

  // 关键词防抖搜索
  useEffect(() => {
    const t = setTimeout(() => loadAll(), 350);
    return () => clearTimeout(t);
  }, [q, loadAll]);

  // 静默自动轮询（后端每 N 分钟抓一次，前端 90s 拉最新结果）
  useEffect(() => {
    const t = setInterval(() => loadAll(), 90000);
    return () => clearInterval(t);
  }, [loadAll]);

  const doRefresh = async () => {
    setRefreshing(true);
    setErr("");
    try {
      await hotspotRefresh();
      await loadAll();
    } catch (e) {
      setErr(`刷新失败：${(e as Error).message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const addDirection = async () => {
    if (!newName.trim()) return;
    setDirBusy(true);
    try {
      const payload = {
        name: newName.trim(),
        keywords: newKeywords.split(/[,，\s]+/).map((s) => s.trim()).filter(Boolean),
        exclude: newExclude.split(/[,，\s]+/).map((s) => s.trim()).filter(Boolean),
      };
      if (editingDirId) {
        const upd = await updateDirection(editingDirId, payload);
        setDirections((prev) => prev.map((d) => (d.id === upd.id ? upd : d)));
      } else {
        const d = await createDirection(payload);
        setDirections((prev) => [...prev, d]);
      }
      setDirFormOpen(false);
      setEditingDirId("");
      setNewName("");
      setNewKeywords("");
      setNewExclude("");
    } catch (e) {
      setErr(`保存方向失败：${(e as Error).message}`);
    } finally {
      setDirBusy(false);
    }
  };

  const startEditDirection = (d: HotDirection) => {
    setEditingDirId(d.id);
    setNewName(d.name);
    setNewKeywords(d.keywords.join(", "));
    setNewExclude(d.exclude.join(", "));
    setDirFormOpen(true);
  };

  const removeDirection = async (id: string) => {
    if (!window.confirm("删除该搜索方向？热点会立即按新规则重新归类。")) return;
    try {
      await deleteDirection(id);
      setDirections((prev) => prev.filter((d) => d.id !== id));
      if (directionId === id) setDirectionId("");
    } catch (e) {
      setErr(`删除失败：${(e as Error).message}`);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const doAiTopics = async () => {
    if (selected.size === 0) return;
    setAiBusy(true);
    setErr("");
    setDupHint("");
    try {
      const selTitles = items.filter((i) => selected.has(i.id)).map((i) => normKey(i.title));
      const dupCount = selTitles.filter((t) => (refCounts[t] ?? 0) > 0).length;
      const r = await generateAiTopics([...selected], {
        direction_id: directionId || undefined,
        count: 4,
        model_id: aiModel || undefined,
      });
      setTopics(r.topics);
      setSavedTopics((prev) => [...(r.saved ?? []), ...prev]);
      setRefCounts(r.ref_counts ?? {});
      setDupHint(
        dupCount > 0
          ? `提示：${dupCount} 条热点此前已生成过选题，本次结果可能重复，可在下方「今日选题」中取舍。`
          : ""
      );
    } catch (e) {
      setErr(`AI 选题失败：${(e as Error).message}`);
    } finally {
      setAiBusy(false);
    }
  };

  const cycleTopicStatus = async (t: SavedTopic) => {
    const next = TOPIC_STATUS[t.status]?.next ?? "todo";
    try {
      const upd = await updateTopic(t.id, { status: next });
      setSavedTopics((prev) => prev.map((x) => (x.id === t.id ? upd : x)));
    } catch (e) {
      setErr(`状态更新失败：${(e as Error).message}`);
    }
  };

  const removeTopic = async (id: string) => {
    try {
      await deleteTopic(id);
      setSavedTopics((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setErr(`删除失败：${(e as Error).message}`);
    }
  };

  const buildProjectFromTopic = async (t: SavedTopic) => {
    try {
      const pid = await onUseTopic(t.title);
      if (pid) {
        const upd = await updateTopic(t.id, { project_id: String(pid) });
        setSavedTopics((prev) => prev.map((x) => (x.id === t.id ? upd : x)));
      }
    } catch (e) {
      setErr(`创建项目失败：${(e as Error).message}`);
    }
  };

  /** 一键生成脚本：建项目 + AI 生成分镜（全自动），完成后回填项目 id */
  const genScriptFromTopic = async (t: SavedTopic) => {
    if (!onGenerateScript) return;
    setGenBusyId(t.id);
    setErr("");
    try {
      const res = await onGenerateScript(t.title);
      if (res) {
        const upd = await updateTopic(t.id, {
          project_id: String(res.pid),
          ...(res.ok ? { status: "doing" } : {}),
        });
        setSavedTopics((prev) => prev.map((x) => (x.id === t.id ? upd : x)));
      }
    } catch (e) {
      setErr(`生成脚本失败：${(e as Error).message}`);
    } finally {
      setGenBusyId("");
    }
  };

  const copyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(""), 1500);
    } catch {
      setErr("复制失败：浏览器剪贴板不可用");
    }
  };

  /** 早报条目 → 选中该热点并滚动到列表 */
  const pickFromBrief = (id: string) => {
    setSelected((prev) => new Set(prev).add(id));
    document.querySelector(".hot-list")?.scrollIntoView({ behavior: "smooth" });
  };

  /** 早报 AI 深度点评（后端按轮次缓存，省 token） */
  const doBriefAi = async () => {
    setBriefAiBusy(true);
    setErr("");
    try {
      const r = await aiBriefing(5);
      setBriefComments(r.comments ?? []);
      if (r.generated_at !== brief?.generated_at) await loadAll();
    } catch (e) {
      setErr(`AI 点评失败：${(e as Error).message}`);
    } finally {
      setBriefAiBusy(false);
    }
  };

  const saveNote = async (t: SavedTopic) => {
    try {
      const upd = await updateTopic(t.id, { note: noteDraft });
      setSavedTopics((prev) => prev.map((x) => (x.id === t.id ? upd : x)));
      setNoteEditing("");
    } catch (e) {
      setErr(`备注保存失败：${(e as Error).message}`);
    }
  };

  const clearByStatus = async (statuses: string[], label: string) => {
    if (!window.confirm(`确定清空「${label}」的选题？此操作不可恢复。`)) return;
    try {
      await clearTopics(statuses);
      setSavedTopics((prev) => prev.filter((t) => !statuses.includes(t.status)));
    } catch (e) {
      setErr(`清理失败：${(e as Error).message}`);
    }
  };

  const visibleTopics = useMemo(
    () => (topicFilter === "" ? savedTopics.filter((t) => t.status !== "dropped") : savedTopics.filter((t) => t.status === topicFilter)),
    [savedTopics, topicFilter]
  );

  /** 跨平台同事件聚合：normalize 标题相同的条目合并为一行 */
  const displayItems = useMemo(() => {
    if (!aggregated) return items;
    const map = new Map<string, HotItem>();
    for (const it of items) {
      const key = it.title.replace(/\s+/g, "").toLowerCase();
      const prev = map.get(key);
      if (!prev) {
        map.set(key, { ...it });
        continue;
      }
      prev.platforms = [...new Set([...prev.platforms, ...it.platforms])];
      prev.cross_platform = prev.platforms.length >= 2;
      if (it.burst > prev.burst) prev.burst = it.burst;
      if (it.hot > prev.hot) {
        prev.hot = it.hot;
        prev.raw_hot = it.raw_hot || prev.raw_hot;
      }
      if (it.history.length > prev.history.length) prev.history = it.history;
      prev.url = prev.url || it.url;
      prev.rank = Math.min(prev.rank, it.rank);
    }
    return [...map.values()];
  }, [items, aggregated]);

  const dirName = useMemo(() => {
    const m: Record<string, string> = {};
    directions.forEach((d) => (m[d.id] = d.name));
    return m;
  }, [directions]);

  const platformOptions = useMemo(() => {
    const ps = new Set<string>();
    items.forEach((i) => ps.add(i.platform));
    return [...ps];
  }, [items]);

  return (
    <div>
      {/* 今日早报 */}
      {brief && brief.items.length > 0 && (
        <div className={`brief-card ${briefOpen ? "" : "brief-closed"}`}>
          <div className="brief-head" onClick={() => {
            setBriefOpen((v) => {
              localStorage.setItem("vw.briefOpen", v ? "0" : "1");
              return !v;
            });
          }}>
            <span className="brief-title">
              🌅 今日早报 · 10 秒决定拍什么
            </span>
            <span className="muted" style={{ fontSize: 12 }}>
              共 {brief.stats.total} 条热点 · 24h 内新见 {brief.stats.fresh_24h} 条
              {typeof brief.stats.overlap_pct === "number" &&
                ` · 与上轮重合 ${brief.stats.overlap_pct}%`}
              · 源 {brief.stats.sources_ok}/{brief.stats.sources_total} 在线 · {brief.generated_at.slice(11, 16)} 生成
            </span>
            <button
              className="btn small"
              disabled={briefAiBusy}
              onClick={(e) => {
                e.stopPropagation();
                doBriefAi();
              }}
              title="AI 逐条给出适合形式/拍摄角度/风险提示"
            >
              {briefAiBusy ? "点评中..." : briefComments ? "🤖 已点评" : "🤖 AI 点评"}
            </button>
            <span className="brief-toggle">{briefOpen ? "收起 ▴" : "展开 ▾"}</span>
          </div>
          {briefOpen && (
            <>
              {brief.stats.platforms && brief.stats.platforms.length > 0 && (
                <div className="brief-insight">
                  {brief.stats.platforms.map((p) => (
                    <span
                      key={p.platform}
                      className={`pf-badge pf-${p.platform}`}
                      title={`${p.name} 在榜 ${p.count} 条`}
                    >
                      {p.name} {p.count}
                    </span>
                  ))}
                  {brief.stats.directions?.map((d) => (
                    <span key={d.id} className="insight-dir" title={`方向「${d.name}」命中 ${d.count} 条`}>
                      🎯 {d.name} {d.count}
                    </span>
                  ))}
                  {typeof brief.stats.avg_burst === "number" && (
                    <span className="insight-avg">平均第一波指数 {brief.stats.avg_burst}</span>
                  )}
                </div>
              )}
              <ol className="brief-list">
              {brief.items.map((b) => {
                const cm = briefComments?.find((c) => c.ref === b.title);
                return (
                  <li key={b.id} className="brief-item">
                    <span className={`burst-num small ${burstTier(b.burst)}`}>{Math.round(b.burst)}</span>
                    <div className="brief-main">
                      <div className="brief-row1">
                        {b.search_url ? (
                          <a href={b.search_url} target="_blank" rel="noreferrer">{b.title}</a>
                        ) : (
                          b.title
                        )}
                        <span className="muted" style={{ fontSize: 12 }}>
                          [{b.platform}]
                          {b.cross ? " 🔗共振" : ""}
                        </span>
                        <button
                          className={`btn tiny ${selected.has(b.id) ? "picked" : ""}`}
                          onClick={() => pickFromBrief(b.id)}
                          title="选中该热点，下方列表可直接 AI 选题"
                        >
                          {selected.has(b.id) ? "已选 ✓" : "＋ 选题"}
                        </button>
                      </div>
                      <div className="brief-reason">{b.reason}</div>
                      {cm && (
                        <div className="brief-ai">
                          <span>🎬 {cm.form}</span>
                          <span>💡 {cm.angle}</span>
                          {cm.risk && cm.risk !== "无" && <span className="brief-risk">⚠️ {cm.risk}</span>}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
              </ol>
            </>
          )}
        </div>
      )}

      {/* 赛道预警横幅 */}
      {freshAlerts.length > 0 && (
        <div className="alert-banner">
          <span>
            🚨 赛道预警：你关注的方向有 <b>{freshAlerts.length}</b> 条新爆热点（首见 2
            小时内，正在冲榜）——第一波窗口正在打开。
          </span>
          <div className="row">
            <button
              className="btn small primary"
              onClick={() => {
                setDirectionId("");
                setSort("burst");
                document.querySelector(".hot-list")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              立即查看
            </button>
            <button className="btn small" onClick={ackAlerts}>
              知道了
            </button>
          </div>
        </div>
      )}

      {/* 状态条 */}
      <div className="radar-status">
        <div className="row" style={{ flex: 1, flexWrap: "wrap" }}>
          <span className="muted">
            {status?.last_refresh
              ? `上次抓取 ${relTime(status.last_refresh)} · 共 ${status.item_count} 条热点`
              : "尚未抓取过热点"}
            {status?.refresh_minutes ? ` · 每 ${status.refresh_minutes} 分钟自动抓取` : ""}
          </span>
          {status?.sources.map((s) => (
            <span
              key={s.platform}
              className={`src-badge ${s.ok ? "ok" : "bad"}`}
              title={s.error || `已抓取 ${s.count} 条`}
            >
              {s.name} {s.ok ? `✓${s.count}` : "✗"}
            </span>
          ))}
          {status?.pending_platforms.map((p) => (
            <span key={p.platform} className="src-badge pending" title="反爬限制，暂未接入">
              {p.name} 待接入
            </span>
          ))}
        </div>
        <button className="btn primary" disabled={refreshing} onClick={doRefresh}>
          {refreshing ? "抓取中..." : "🔄 立即抓取"}
        </button>
        <a className="btn" href="/api/hotspot/export.csv" download title="当前全部热点导出为 CSV（Excel 可直接打开）">
          ⬇ 导出 CSV
        </a>
      </div>

      {err && <div className="error">{err}</div>}
      {loading && <div className="muted" style={{ padding: "20px 0" }}>加载热点中...</div>}

      {!loading && (
        <>
          {/* 自定义搜索方向 */}
          <div className="panel">
            <div className="panel-head">
              <h3>🎯 我的搜索方向</h3>
              <button className="btn small" onClick={() => setDirFormOpen((v) => !v)}>
                {dirFormOpen ? "收起" : "+ 新建方向"}
              </button>
            </div>
            <div className="hint" style={{ marginBottom: 10 }}>
              方向 = 关键词规则。热点标题命中关键词即自动归入该方向，方便只盯自己的赛道。
            </div>
            <div className="dir-chips">
              <button
                className={`chip ${directionId === "" ? "chip-active" : ""}`}
                onClick={() => setDirectionId("")}
              >
                全部
              </button>
              {directions.map((d) => (
                <button
                  key={d.id}
                  className={`chip ${directionId === d.id ? "chip-active" : ""}`}
                  onClick={() => setDirectionId(directionId === d.id ? "" : d.id)}
                  title={d.keywords.join("、") || "（无关键词，不会命中任何热点）"}
                >
                  {d.name}
                  <span
                    className="chip-x"
                    title="编辑方向"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditDirection(d);
                    }}
                  >
                    ✎
                  </span>
                  <span
                    className="chip-x"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDirection(d.id);
                    }}
                  >
                    ×
                  </span>
                </button>
              ))}
              <button
                className={`chip ${directionId === "__none__" ? "chip-active" : ""}`}
                onClick={() => setDirectionId(directionId === "__none__" ? "" : "__none__")}
              >
                未分类
              </button>
            </div>
            {dirFormOpen && (
              <div className="dir-form">
                <input
                  placeholder="方向名称，如：AI科技"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={30}
                />
                <input
                  placeholder="关键词（逗号分隔），如：AI, 大模型, 机器人"
                  value={newKeywords}
                  onChange={(e) => setNewKeywords(e.target.value)}
                />
                <input
                  placeholder="排除词（可选），如：广告"
                  value={newExclude}
                  onChange={(e) => setNewExclude(e.target.value)}
                />
                <button className="btn primary small" disabled={dirBusy || !newName.trim()} onClick={addDirection}>
                  {dirBusy ? "保存中..." : editingDirId ? "保存修改" : "创建"}
                </button>
              </div>
            )}
          </div>

          {/* 筛选行 */}
          <div className="radar-filter">
            <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
              <option value="">全部平台</option>
              {platformOptions.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_NAMES[p] ?? p}
                </option>
              ))}
            </select>
            <input
              ref={qInputRef}
              className="radar-q"
              placeholder="关键词过滤热点标题（可多个，空格分隔，按 / 快速聚焦）"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select value={sort} onChange={(e) => setSort(e.target.value)} title="排序方式">
              <option value="burst">第一波指数（推荐抢首发）</option>
              <option value="hot">当前热度</option>
              <option value="fresh">最新发现</option>
            </select>
            <label className="agg-toggle" title="同一事件在多个平台的热点合并为一行展示">
              <input
                type="checkbox"
                checked={aggregated}
                onChange={(e) => setAggregated(e.target.checked)}
              />
              聚合同事件
            </label>
          </div>

          {/* 热点列表 */}
          <div className="hot-list">
            {displayItems.map((it) => {
              const tm = TREND_META[it.trend] ?? TREND_META.flat;
              const platforms = aggregated
                ? [...new Set(it.platforms.length ? it.platforms : [it.platform])]
                : [it.platform];
              return (
                <div key={it.id} className={`hot-row ${selected.has(it.id) ? "hot-sel" : ""}`}>
                  <input
                    type="checkbox"
                    checked={selected.has(it.id)}
                    onChange={() => toggleSelect(it.id)}
                    title="勾选后可让 AI 生成蹭热点选题"
                  />
                  <span className="hot-rank">#{it.rank}</span>
                  <div className="pf-stack">
                    {platforms.map((p) => (
                      <span key={p} className={`pf-badge pf-${p}`}>
                        {PLATFORM_NAMES[p] ?? p}
                      </span>
                    ))}
                  </div>
                  <div className="hot-main">
                    <div className="hot-title">
                      {it.url ? (
                        <a href={it.url} target="_blank" rel="noreferrer" title="打开原页面">
                          {it.title}
                        </a>
                      ) : (
                        it.title
                      )}
                      {it.tag && <span className="hot-tag">{it.tag}</span>}
                      {it.cross_platform && (
                        <span className="hot-cross" title={`同标题在 ${it.platforms.map((p) => PLATFORM_NAMES[p] ?? p).join("、")} 同时上榜`}>
                          🔗 多平台共振
                        </span>
                      )}
                    </div>
                    <div className="hot-sub">
                      <span className={tm.cls}>
                        {tm.icon} {tm.label}
                        {it.trend !== "new" && it.trend !== "flat" && Math.abs(it.trend_delta) >= 1
                          ? ` ${it.trend_delta > 0 ? "+" : ""}${it.trend_delta}%`
                          : ""}
                      </span>
                      <span>首见 {relTime(it.first_seen)}</span>
                      {it.match_keywords.length > 0 && (
                        <span className="hot-hits" title={`命中方向：${it.direction_ids.map((i) => dirName[i] ?? i).join("、")}`}>
                          🎯 {dirName[it.direction_ids[0]] ?? it.direction_ids[0]}
                          {it.direction_ids.length > 1 ? ` +${it.direction_ids.length - 1}` : ""}
                        </span>
                      )}
                      <a
                        className="hot-search"
                        onClick={(e) => {
                          e.preventDefault();
                          setDetail(it);
                        }}
                        href="#"
                      >
                        详情
                      </a>
                      {it.search_url && (
                        <a href={it.search_url} target="_blank" rel="noreferrer" className="hot-search">
                          去{PLATFORM_NAMES[it.platform] ?? "平台"}搜同款 →
                        </a>
                      )}
                      <a
                        className="hot-search"
                        onClick={(e) => {
                          e.preventDefault();
                          copyText(it.id, it.title);
                        }}
                        href="#"
                      >
                        {copiedId === it.id ? "已复制 ✓" : "复制标题"}
                      </a>
                    </div>
                    {it.summary && <div className="hot-summary">{it.summary}</div>}
                  </div>
                  <div className="hot-heat" title={`热度 ${it.raw_hot || Math.round(it.hot)}`}>
                    <Sparkline data={it.history ?? []} />
                    <div className="heat-bar">
                      <div className="heat-fill" style={{ width: `${it.hot}%` }} />
                    </div>
                    <span className="muted">{it.raw_hot || Math.round(it.hot)}</span>
                  </div>
                  <div className="hot-burst" title="第一波指数：越高越要马上做">
                    <div className={`burst-num ${burstTier(it.burst)}`}>{Math.round(it.burst)}</div>
                    <div className="muted">第一波</div>
                  </div>
                </div>
              );
            })}
            {displayItems.length === 0 && (
              <div className="muted" style={{ padding: "24px 0" }}>
                没有匹配的热点。试试清空筛选，或点「立即抓取」。
              </div>
            )}
          </div>

          {/* AI 选题面板 */}
          <div className="panel ai-topic-panel">
            <div className="panel-head">
              <h3>🤖 AI 选题（把热点变成你的视频）</h3>
              <span className="muted">已选 {selected.size} 条</span>
            </div>
            <div className="ai-row">
              <select value={aiModel} onChange={(e) => setAiModel(e.target.value)}>
                {models.length === 0 && <option value="">（无可用模型）</option>}
                {models.map((m) => (
                  <option key={m.id} value={m.id} disabled={!m.available}>
                    {m.name}
                    {m.is_default ? "（默认）" : ""}
                    {!m.available ? " — 未配置" : ""}
                  </option>
                ))}
              </select>
              <button
                className="btn primary"
                disabled={selected.size === 0 || aiBusy || !aiModel}
                onClick={doAiTopics}
              >
                {aiBusy ? "生成中..." : `AI 生成选题建议（${selected.size} 条热点）`}
              </button>
              {selected.size > 0 && (
                <button className="btn small" onClick={() => setSelected(new Set())}>
                  清空选择
                </button>
              )}
            </div>
            <div className="hint">
              勾选热点后点生成，AI 会按「新上榜/上升」优先的角度，给出可直接开拍的选题（标题/切入角度/开场钩子）。
              生成结果自动进入下方「今日选题」。
            </div>
            {dupHint && <div className="warn" style={{ marginTop: 10 }}>{dupHint}</div>}
            {topics.length > 0 && (
              <div className="topic-grid">
                {topics.map((t, idx) => (
                  <div className="topic-card" key={idx}>
                    <div className="topic-title">{t.title}</div>
                    {t.ref && <div className="muted" style={{ fontSize: 12 }}>蹭热点：{t.ref}</div>}
                    <div className="topic-line">
                      <b>角度</b> {t.angle}
                    </div>
                    <div className="topic-line">
                      <b>钩子</b>「{t.hook}」
                    </div>
                    {t.why && (
                      <div className="topic-line">
                        <b>流量点</b> {t.why}
                      </div>
                    )}
                    <div className="row" style={{ gap: 6, marginTop: 8 }}>
                      <button
                        className="btn primary small"
                        style={{ flex: 1 }}
                        onClick={() => onUseTopic(t.title)}
                      >
                        用此选题新建视频项目 →
                      </button>
                      <button
                        className="btn small"
                        title="复制选题文案（标题+角度+钩子）"
                        onClick={() =>
                          copyText(`t-${idx}`, `${t.title}\n角度：${t.angle}\n开场钩子：${t.hook}`)
                        }
                      >
                        {copiedId === `t-${idx}` ? "已复制 ✓" : "复制"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 今日选题工作台：落库的选题，可流转状态 / 建项目 / 备注 / 批量清理 */}
            <div className="topic-board">
              <div className="panel-head" style={{ marginTop: 16 }}>
                <h3>📋 今日选题（{savedTopics.filter((t) => t.status !== "dropped").length}）</h3>
                <div className="row">
                  {savedTopics.some((t) => t.status !== "dropped") && (
                    <button
                      className="btn small"
                      title="复制选题清单，方便贴到手机或备忘录"
                      onClick={() =>
                        copyText(
                          "topic-all",
                          savedTopics
                            .filter((t) => t.status !== "dropped")
                            .map(
                              (t, i) =>
                                `${i + 1}. [${TOPIC_STATUS[t.status]?.label ?? t.status}] ${t.title}${t.hook ? `\n   钩子：${t.hook}` : ""}`
                            )
                            .join("\n")
                        )
                      }
                    >
                      {copiedId === "topic-all" ? "已复制 ✓" : "复制清单"}
                    </button>
                  )}
                  {savedTopics.some((t) => t.status === "done") && (
                    <button
                      className="btn small"
                      onClick={() => clearByStatus(["done"], "已完成")}
                    >
                      清空已完成
                    </button>
                  )}
                  {savedTopics.some((t) => t.status === "dropped") && (
                    <button
                      className="btn small danger"
                      onClick={() => clearByStatus(["dropped"], "已弃")}
                    >
                      清空已弃
                    </button>
                  )}
                </div>
              </div>
              {savedTopics.length > 0 && (
                <div className="dir-chips" style={{ marginBottom: 10 }}>
                  {[
                    ["", "全部"],
                    ["todo", "待拍"],
                    ["doing", "拍摄中"],
                    ["done", "已完成"],
                    ["dropped", "已弃"],
                  ].map(([key, label]) => {
                    const n = key === "" ? savedTopics.length : savedTopics.filter((t) => t.status === key).length;
                    if (key !== "" && n === 0) return null;
                    return (
                      <button
                        key={key || "all"}
                        className={`chip ${topicFilter === key ? "chip-active" : ""}`}
                        onClick={() => setTopicFilter(key)}
                      >
                        {label} {n}
                      </button>
                    );
                  })}
                </div>
              )}
              {visibleTopics.length === 0 ? (
                savedTopics.length === 0 ? (
                  <div className="topic-guide">
                    <span className="muted" style={{ width: "100%" }}>
                      还没有落库选题。三步把热点变成你的视频：
                    </span>
                    <div className="guide-step">
                      <b>1</b> 在上方列表勾选热点（🎯 命中你方向的优先）
                    </div>
                    <span className="guide-arrow">→</span>
                    <div className="guide-step">
                      <b>2</b> 点「AI 生成选题建议」，挑选合适的切入角度
                    </div>
                    <span className="guide-arrow">→</span>
                    <div className="guide-step">
                      <b>3</b> 点「⚡ 生成脚本」，一键建项目并自动出分镜
                    </div>
                  </div>
                ) : (
                  <div className="muted" style={{ padding: "8px 0" }}>
                    该状态下没有选题。
                  </div>
                )
              ) : (
                <div className="topic-rows">
                  {visibleTopics.map((t) => {
                    const st = TOPIC_STATUS[t.status] ?? TOPIC_STATUS.todo;
                    return (
                      <div key={t.id} className={`topic-row topic-row-${t.status}`}>
                        <button
                          className={`st-chip ${st.cls}`}
                          onClick={() => cycleTopicStatus(t)}
                          title="点击流转到下一状态"
                        >
                          {st.label}
                        </button>
                        <div className="topic-row-main">
                          <div className="topic-row-title">{t.title}</div>
                          <div className="muted" style={{ fontSize: 12 }}>
                            {t.ref_platforms.length > 0 &&
                              `${t.ref_platforms.join("/")} · `}
                            {t.ref ? `蹭「${t.ref}」` : "自定义选题"}
                            {t.hook ? ` · 钩子「${t.hook}」` : ""}
                            {t.created_at ? ` · ${t.created_at.slice(5, 16)}` : ""}
                          </div>
                          {t.note && !noteEditing.startsWith(t.id) && (
                            <div className="topic-note">📝 {t.note}</div>
                          )}
                          {noteEditing === t.id ? (
                            <div className="row" style={{ marginTop: 6 }}>
                              <input
                                className="note-input"
                                value={noteDraft}
                                maxLength={300}
                                placeholder="备注：排期、素材位置、出镜人…"
                                autoFocus
                                onChange={(e) => setNoteDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveNote(t);
                                  if (e.key === "Escape") setNoteEditing("");
                                }}
                              />
                              <button className="btn small primary" onClick={() => saveNote(t)}>
                                保存
                              </button>
                              <button className="btn small" onClick={() => setNoteEditing("")}>
                                取消
                              </button>
                            </div>
                          ) : null}
                        </div>
                          <div className="topic-row-actions">
                            {t.project_id ? (
                              <button className="btn small" onClick={() => onOpenProject(t.project_id)}>
                                已建项目 →
                              </button>
                            ) : (
                              <>
                                <button
                                  className="btn primary small"
                                  disabled={genBusyId === t.id}
                                  onClick={() => genScriptFromTopic(t)}
                                  title="建项目 + AI 自动生成分镜脚本，一步到位"
                                >
                                  {genBusyId === t.id ? "生成中..." : "⚡ 生成脚本"}
                                </button>
                                <button
                                  className="btn small"
                                  disabled={genBusyId === t.id}
                                  onClick={() => buildProjectFromTopic(t)}
                                  title="只建项目，不生成脚本"
                                >
                                  建项目
                                </button>
                              </>
                            )}
                          <button
                            className="btn small"
                            onClick={() => {
                              setNoteEditing(t.id);
                              setNoteDraft(t.note ?? "");
                            }}
                            title="编辑备注"
                          >
                            📝
                          </button>
                          <button
                            className="btn small"
                            onClick={() => cycleTopicStatus({ ...t, status: "dropped" })}
                            title="移入已弃"
                          >
                            弃
                          </button>
                          <button className="btn small danger" onClick={() => removeTopic(t.id)}>
                            删
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 热点详情弹窗 */}
      {detail && (
        <div className="modal-mask" onClick={() => setDetail(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="pf-stack">
                {[...new Set(detail.platforms.length ? detail.platforms : [detail.platform])].map((p) => (
                  <span key={p} className={`pf-badge pf-${p}`}>
                    {PLATFORM_NAMES[p] ?? p}
                  </span>
                ))}
              </div>
              <h3 className="modal-title">
                {detail.title}
                {detail.tag && <span className="hot-tag">{detail.tag}</span>}
                {detail.cross_platform && <span className="hot-cross">🔗 多平台共振</span>}
              </h3>
              <button className="btn small" onClick={() => setDetail(null)}>
                ✕
              </button>
            </div>

            <div className="modal-hero">
              <div className="modal-chart">
                {(detail.history?.length ?? 0) >= 2 ? (
                  <Sparkline data={detail.history} w={460} h={92} fillArea />
                ) : (
                  <div className="muted" style={{ padding: 30 }}>
                    只抓取过 1 轮，再等一轮就有走势了（每 {status?.refresh_minutes ?? 10} 分钟自动抓取）
                  </div>
                )}
                <div className="muted" style={{ fontSize: 11, textAlign: "center" }}>
                  热度走势 · 归一化（当前 {Math.round(detail.hot)}）
                </div>
              </div>
              <div className="modal-burst">
                <div className={`burst-num ${burstTier(detail.burst)}`} style={{ fontSize: 40 }}>
                  {Math.round(detail.burst)}
                </div>
                <div className="muted">第一波指数</div>
                <div className={TREND_META[detail.trend]?.cls ?? ""} style={{ fontSize: 13, marginTop: 6 }}>
                  {TREND_META[detail.trend]?.icon} {TREND_META[detail.trend]?.label}
                  {detail.trend !== "new" && detail.trend !== "flat" && Math.abs(detail.trend_delta) >= 1
                    ? ` ${detail.trend_delta > 0 ? "+" : ""}${detail.trend_delta}%`
                    : ""}
                </div>
              </div>
            </div>

            <dl className="modal-facts">
              <div>
                <dt>原始热度</dt>
                <dd>{detail.raw_hot || Math.round(detail.hot)}</dd>
              </div>
              <div>
                <dt>平台内排名</dt>
                <dd>#{detail.rank}</dd>
              </div>
              <div>
                <dt>首次发现</dt>
                <dd>{detail.first_seen || "—"}</dd>
              </div>
              <div>
                <dt>最近在榜</dt>
                <dd>{detail.last_seen || "—"}</dd>
              </div>
              {detail.direction_ids.length > 0 && (
                <div>
                  <dt>命中方向</dt>
                  <dd className="hot-hits">
                    {detail.direction_ids.map((i) => dirName[i] ?? i).join("、")}（
                    {detail.match_keywords.join("、")}）
                  </dd>
                </div>
              )}
            </dl>

            {detail.summary && <p className="modal-summary">{detail.summary}</p>}

            <div className="row modal-actions">
              <label className="row" style={{ gap: 6, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selected.has(detail.id)}
                  onChange={() => toggleSelect(detail.id)}
                />
                <span style={{ fontSize: 13 }}>加入 AI 选题</span>
              </label>
              <button className="btn small" onClick={() => copyText(detail.id, detail.title)}>
                {copiedId === detail.id ? "已复制 ✓" : "复制标题"}
              </button>
              {detail.url && (
                <a className="btn small" href={detail.url} target="_blank" rel="noreferrer">
                  打开原页面 ↗
                </a>
              )}
              {detail.search_url && (
                <a className="btn small primary" href={detail.search_url} target="_blank" rel="noreferrer">
                  去{PLATFORM_NAMES[detail.platform] ?? "平台"}搜同款 →
                </a>
              )}
            </div>

            <div className="row modal-cross">
              <span className="muted" style={{ fontSize: 12 }}>多平台分发调研：</span>
              {Object.entries(CROSS_SEARCH).map(([p, tpl]) => (
                <a
                  key={p}
                  className="hot-search"
                  href={tpl.replace("{}", encodeURIComponent(detail.title))}
                  target="_blank"
                  rel="noreferrer"
                  title={`在${PLATFORM_NAMES[p] ?? p}搜索该热点，看分发竞争度`}
                >
                  {PLATFORM_NAMES[p] ?? p} ↗
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
