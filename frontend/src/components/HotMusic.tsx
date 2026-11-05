import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addCustomItem,
  createCustomBoard,
  deleteCustomBoard,
  musicChartBoards,
  musicChartExportUrl,
  musicChartItems,
  musicChartRefresh,
  musicChartStatus,
  removeCustomItem,
} from "../api";
import type { MusicBoardInfo, MusicChartStatus, MusicItem } from "../types";

const GROUP_LABEL: Record<string, string> = {
  "推荐": "推荐",
  "抖音": "抖音官方",
  "实时": "实时榜（每日更新）",
  "流派": "流派榜",
  "我的榜单": "我的榜单",
};

const TREND_META: Record<string, { icon: string; label: string; cls: string }> = {
  new: { icon: "🚀", label: "新上榜", cls: "trend-new" },
  up: { icon: "📈", label: "上升", cls: "trend-up" },
  flat: { icon: "➖", label: "持平", cls: "trend-flat" },
  down: { icon: "📉", label: "下降", cls: "trend-down" },
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

const fmtDuration = (sec: number) => (sec > 0 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}` : "");

const normKey = (s: string) => s.replace(/\s+/g, "").toLowerCase();
const songKey = (title: string, artist: string) => `${normKey(title)}|${normKey(artist)}`;

/** 名次徽标：前三名高亮 */
function rankCls(rank: number): string {
  if (rank <= 3) return "music-rank top";
  return "music-rank";
}

export const HotMusic = () => {
  const [status, setStatus] = useState<MusicChartStatus | null>(null);
  const [boards, setBoards] = useState<MusicBoardInfo[]>([]);
  const [items, setItems] = useState<MusicItem[]>([]);
  const [board, setBoard] = useState(() => localStorage.getItem("vw.musicBoard") ?? "bgm_hot");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"rank" | "trend">(
    () => (localStorage.getItem("vw.musicSort") === "trend" ? "trend" : "rank")
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");

  // 收藏（自定义策展榜）
  const [collectTarget, setCollectTarget] = useState(() => localStorage.getItem("vw.musicCollect") ?? "");
  const [collected, setCollected] = useState<Set<string>>(new Set());
  const [manualAdd, setManualAdd] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2600);
  }, []);

  const load = useCallback(async (bid: string) => {
    setLoading(true);
    setErr("");
    try {
      const [st, bs, its] = await Promise.all([
        musicChartStatus(),
        musicChartBoards(),
        musicChartItems({ board: bid === "all" ? "" : bid, limit: 1200 }),
      ]);
      setStatus(st);
      setBoards(bs);
      setItems(its);
    } catch (e) {
      setErr(`加载失败：${(e as Error).message}（后端是否已启动？）`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(board);
  }, [board, load]);

  // 收藏目标榜的在册歌曲集合（用于按钮「已藏」态）
  const refreshCollected = useCallback(async (target: string) => {
    if (!target) {
      setCollected(new Set());
      return;
    }
    try {
      const its = await musicChartItems({ board: target, limit: 500 });
      setCollected(new Set(its.map((i) => songKey(i.title, i.artist))));
    } catch {
      setCollected(new Set());
    }
  }, []);

  useEffect(() => {
    refreshCollected(collectTarget);
  }, [collectTarget, refreshCollected]);

  const doRefresh = async () => {
    setRefreshing(true);
    setErr("");
    try {
      await musicChartRefresh();
      await load(board);
      await refreshCollected(collectTarget);
    } catch (e) {
      setErr(`刷新失败：${(e as Error).message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const switchBoard = (bid: string) => {
    setBoard(bid);
    localStorage.setItem("vw.musicBoard", bid);
  };

  const switchSort = (s: "rank" | "trend") => {
    setSort(s);
    localStorage.setItem("vw.musicSort", s);
  };

  const boardMap = useMemo(() => {
    const m: Record<string, MusicBoardInfo> = {};
    for (const b of boards) m[b.id] = b;
    return m;
  }, [boards]);

  const customBoards = useMemo(() => boards.filter((b) => b.group === "我的榜单"), [boards]);
  const isCustomView = !!boardMap[board] && boardMap[board].group === "我的榜单";

  // 默认收藏目标：第一个自定义榜（预置 Vibe 知识大赏 BGM）
  useEffect(() => {
    if (customBoards.length && !customBoards.some((b) => b.id === collectTarget)) {
      setCollectTarget(customBoards[0].id);
      localStorage.setItem("vw.musicCollect", customBoards[0].id);
    }
  }, [customBoards, collectTarget]);

  const collect = async (it: MusicItem) => {
    if (!collectTarget) {
      showToast("请先在右侧选择收藏目标榜单");
      return;
    }
    const targetName = boardMap[collectTarget]?.name || "自定义榜单";
    try {
      const r = await addCustomItem(collectTarget, {
        title: it.title,
        artist: it.artist,
        album: it.album,
        cover: it.cover,
        url: it.url,
      });
      setCollected((prev) => new Set([...prev, songKey(it.title, it.artist)]));
      showToast(r.added ? `已收藏到「${targetName}」` : `「${targetName}」里已有这首歌`);
      load(board); // 刷新榜签计数
    } catch (e) {
      showToast(`收藏失败：${(e as Error).message}`);
    }
  };

  const uncollect = async (it: MusicItem) => {
    try {
      await removeCustomItem(board, it.title, it.artist);
      setCollected((prev) => {
        const next = new Set(prev);
        next.delete(songKey(it.title, it.artist));
        return next;
      });
      showToast(`已从「${boardMap[board]?.name}」移除`);
      load(board);
    } catch (e) {
      showToast(`移除失败：${(e as Error).message}`);
    }
  };

  const doCreateBoard = async () => {
    const name = window.prompt("新榜单名称（如：Vibe 知识大赏 BGM）");
    if (!name || !name.trim()) return;
    try {
      const cb = await createCustomBoard(name.trim());
      setCollectTarget(cb.id);
      localStorage.setItem("vw.musicCollect", cb.id);
      showToast(`已创建「${cb.name}」`);
      load(board);
    } catch (e) {
      showToast(`创建失败：${(e as Error).message}`);
    }
  };

  const doDeleteBoard = async () => {
    const info = boardMap[board];
    if (!info) return;
    if (!window.confirm(`删除自定义榜单「${info.name}」（共 ${info.count} 首）？不可恢复。`)) return;
    try {
      await deleteCustomBoard(board);
      showToast(`已删除「${info.name}」`);
      switchBoard("bgm_hot");
    } catch (e) {
      showToast(`删除失败：${(e as Error).message}`);
    }
  };

  const doManualAdd = async () => {
    const raw = manualAdd.trim();
    if (!raw) return;
    const [t, ...rest] = raw.split(/\s*-\s*/);
    try {
      const r = await addCustomItem(board, { title: (t || "").trim(), artist: rest.join(" - ").trim() });
      showToast(r.added ? "已添加" : "榜单里已有这首歌");
      setManualAdd("");
      refreshCollected(board);
      load(board);
    } catch (e) {
      showToast(`添加失败：${(e as Error).message}`);
    }
  };

  // 搜索过滤 + 排序（客户端做，切榜才重新请求）
  const visible = useMemo(() => {
    let list = items;
    const key = q.trim().toLowerCase();
    if (key) {
      const kws = key.split(/\s+/).filter(Boolean);
      list = list.filter((i) => {
        const hay = `${normKey(i.title)} ${normKey(i.artist)} ${normKey(i.album)}`;
        return kws.some((k) => hay.includes(k));
      });
    }
    if (sort === "trend") {
      const order: Record<string, number> = { new: 0, up: 1, flat: 2, down: 3 };
      list = [...list].sort(
        (a, b) => (order[a.trend] ?? 2) - (order[b.trend] ?? 2) || b.rank_diff - a.rank_diff || a.rank - b.rank
      );
    }
    return list;
  }, [items, q, sort]);

  // 分组板签（每组独占一行：组名 + 榜签），「全部」并入推荐行
  const grouped = useMemo(() => {
    const groups: { group: string; boards: MusicBoardInfo[] }[] = [];
    for (const b of boards) {
      let g = groups.find((x) => x.group === b.group);
      if (!g) {
        g = { group: b.group, boards: [] };
        groups.push(g);
      }
      g.boards.push(b);
    }
    return groups;
  }, [boards]);
  const recoRow = grouped.find((g) => g.group === "推荐");
  const restRows = grouped.filter((g) => g.group !== "推荐");

  const chip = (b: MusicBoardInfo) => (
    <button
      key={b.id}
      className={`music-chip ${board === b.id ? "music-chip-active" : ""} ${b.ok ? "" : "music-chip-dead"}`}
      onClick={() => switchBoard(b.id)}
      title={`${b.desc}${b.period ? ` · 期号 ${b.period}` : ""}${b.update_time ? ` · 更新于 ${b.update_time}` : ""}${b.error ? ` · ${b.error}` : ""}`}
    >
      {b.name}
      <span className="music-chip-count">{b.ok ? b.count : "✕"}</span>
    </button>
  );

  const curBoard = board !== "all" ? boardMap[board] : undefined;
  const dataFresh = curBoard?.update_time || curBoard?.fetched_at || status?.last_refresh || "";

  return (
    <div>
      {/* 栏目说明 */}
      <div className="panel">
        <div className="panel-head">
          <h3>🎵 热门歌曲 · 抖音 BGM 风向标</h3>
          <div className="row">
            <button className="btn small" onClick={() => window.open(musicChartExportUrl(board === "all" ? undefined : board), "_blank")}>
              导出 CSV
            </button>
            <button className="btn small primary" disabled={refreshing} onClick={doRefresh}>
              {refreshing ? "刷新中..." : "↻ 立即刷新"}
            </button>
          </div>
        </div>
        <div className="music-head-stats">
          <span className="muted">
            {status
              ? `在榜 ${status.song_count} 首 · 榜 ${status.boards_ok}/${status.board_count} 在线 · 后端每 ${status.refresh_minutes} 分钟自动抓取`
              : "加载中..."}
          </span>
          {dataFresh && (
            <span className="muted">
              · 榜单数据：{curBoard?.update_time || "本轮抓取"}（{relTime(dataFresh)}）
              {curBoard?.update_tips ? ` · ${curBoard.update_tips}` : ""}
            </span>
          )}
          {status?.last_refresh && <span className="muted">· 上次抓取 {relTime(status.last_refresh)}</span>}
        </div>
        <div className="hint">
          抖音官方网页端音乐榜已停更，本栏目采用可公开获取的最接近数据源：QQ
          音乐官方榜单（含×抖音官方合作的「抖音热歌榜」，每周四更新 TOP100）、每日实时子榜与流派榜，以及抖音音乐人平台站内热歌。「最热BGM榜」由多榜共鸣实时合成（命中榜越多、名次越靠前越热）；「我的榜单」可从任意榜单一键收藏（已预置
          Vibe 知识大赏 BGM）。跨轮抓取自动对比名次，标注 🚀 新上榜 / 📈 上升 / 📉 下降。
        </div>
        {err && <div className="error">{err}</div>}
        {toast && <div className="music-toast">{toast}</div>}
      </div>

      {/* 榜单切换：分组行布局 */}
      <div className="music-board-groups">
        <div className="music-board-row">
          <span className="music-board-row-label">推荐</span>
          <button
            className={`music-chip ${board === "all" ? "music-chip-active" : ""}`}
            onClick={() => switchBoard("all")}
            title="全部榜单混排"
          >
            全部
          </button>
          {recoRow?.boards.map(chip)}
        </div>
        {restRows.map(({ group, boards: bs }) => (
          <div className="music-board-row" key={group}>
            <span className="music-board-row-label">{GROUP_LABEL[group] || group}</span>
            {bs.map(chip)}
            {group === "我的榜单" && (
              <button className="music-chip music-chip-new" onClick={doCreateBoard} title="新建自定义榜单">
                ＋ 新建榜单
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 工具行 */}
      <div className="music-toolbar">
        <input
          className="proj-search"
          placeholder="搜索歌名 / 歌手 / 专辑…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={sort} onChange={(e) => switchSort(e.target.value as "rank" | "trend")} title="排序">
          <option value="rank">榜单顺序</option>
          <option value="trend">趋势优先（新上榜/上升在前）</option>
        </select>
        {!isCustomView && (
          <select
            value={collectTarget}
            onChange={(e) => {
              setCollectTarget(e.target.value);
              localStorage.setItem("vw.musicCollect", e.target.value);
            }}
            title="点歌曲行的「＋」收藏到该榜单"
          >
            {customBoards.length === 0 && <option value="">收藏到…（先新建榜单）</option>}
            {customBoards.map((b) => (
              <option key={b.id} value={b.id}>
                收藏到：{b.name}
              </option>
            ))}
          </select>
        )}
        <span className="muted">{visible.length} 首</span>
      </div>

      {/* 自定义榜视图：手动添加 + 删除榜单 */}
      {isCustomView && (
        <div className="music-manual-row">
          <input
            className="proj-search"
            placeholder="手动添加：歌名 - 歌手（回车确认）"
            value={manualAdd}
            onChange={(e) => setManualAdd(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") doManualAdd();
            }}
          />
          <button className="btn small" disabled={!manualAdd.trim()} onClick={doManualAdd}>
            添加
          </button>
          <button className="btn small danger" onClick={doDeleteBoard} title="删除整个自定义榜单">
            删除本榜
          </button>
          <span className="muted">提示：在热歌榜等其他榜单点歌曲行的「＋」即可收藏进来</span>
        </div>
      )}

      {/* 歌曲列表 */}
      {loading ? (
        <div className="muted">加载中...</div>
      ) : visible.length === 0 ? (
        <div className="muted">
          {err
            ? "加载失败，请检查后端服务。"
            : q
              ? "没有匹配的歌曲。"
              : isCustomView
                ? "榜单还是空的：在其他榜单点歌曲行的「＋」收藏，或在上方手动添加。"
                : "暂无数据：后端首次抓取约需十几秒，请点「立即刷新」或稍候。"}
        </div>
      ) : (
        <div className="music-list">
          {visible.map((it) => {
            const tm = TREND_META[it.trend] || TREND_META.flat;
            const key = songKey(it.title, it.artist);
            const fromBoards = it.from_boards ?? [];
            return (
              <div className="music-row" key={`${it.board}-${it.id}`}>
                <span className={rankCls(it.rank)}>{it.rank}</span>
                {it.cover ? (
                  <img
                    className="music-cover"
                    src={it.cover}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.visibility = "hidden";
                    }}
                  />
                ) : (
                  <span className="music-cover music-cover-empty">♪</span>
                )}
                <div className="music-main">
                  <div className="music-title">
                    {it.search_url ? (
                      <a href={it.search_url} target="_blank" rel="noreferrer" title="在抖音搜索这首歌（看 BGM 玩法）">
                        {it.title}
                      </a>
                    ) : (
                      it.title
                    )}
                    {fromBoards.length > 1 && (
                      <span className="hot-tag" title={`同时命中：${fromBoards.join("、")}`}>
                        {fromBoards.length}榜共鸣
                      </span>
                    )}
                    {it.raw_hot && <span className="hot-tag">{it.raw_hot}</span>}
                  </div>
                  <div className="music-sub">
                    {it.artist || "未知歌手"}
                    {it.album ? ` · 《${it.album}》` : ""}
                  </div>
                </div>
                <span className={`music-trend ${tm.cls}`} title={`较上轮抓取${tm.label}`}>
                  {tm.icon}
                  {it.trend === "up" && it.rank_diff > 0 && `↑${it.rank_diff}`}
                  {it.trend === "down" && it.rank_diff < 0 && `${it.rank_diff}`}
                  {it.trend === "new" && "新上榜"}
                </span>
                <span className="music-dur">{fmtDuration(it.duration)}</span>
                {it.url && (
                  <a
                    className="music-link"
                    href={it.url}
                    target="_blank"
                    rel="noreferrer"
                    title={it.url.includes("douyin") ? "打开抖音站内歌曲页" : "打开 QQ 音乐歌曲页"}
                  >
                    试听 ↗
                  </a>
                )}
                {isCustomView ? (
                  <button
                    className="music-collect"
                    onClick={() => uncollect(it)}
                    title="从本榜单移除"
                  >
                    ✕
                  </button>
                ) : (
                  <button
                    className={`music-collect ${collected.has(key) ? "collected" : ""}`}
                    disabled={!collectTarget}
                    onClick={() => collect(it)}
                    title={
                      collected.has(key)
                        ? `已在「${boardMap[collectTarget]?.name || ""}」中`
                        : `收藏到「${boardMap[collectTarget]?.name || "自定义榜单"}」`
                    }
                  >
                    {collected.has(key) ? "已藏 ✓" : "＋ 收藏"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
