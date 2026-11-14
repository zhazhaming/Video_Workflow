import { useCallback, useEffect, useMemo, useState } from "react";
import {
  companyCancelPlan,
  companyPick,
  companyPlan,
  companyPool,
  companyRegenerateDraft,
  companySaveDraft,
  companySchedule,
  videoUrl,
} from "../api";
import type {
  CompanyDraft,
  CompanyDraftBeat,
  CompanyPlanEntry,
  CompanyPool,
  CompanyProfile,
} from "../types";

const STATUS: Record<string, { label: string; cls: string }> = {
  empty: { label: "未选", cls: "" },
  planned: { label: "待排产", cls: "warn" },
  scheduled: { label: "已排产", cls: "manual" },
  producing: { label: "制作中", cls: "run" },
  done: { label: "已出片", cls: "ok" },
  partial: { label: "部分完成", cls: "warn" },
  failed: { label: "失败", cls: "bad" },
};

const cloneDraft = (d: CompanyDraft): CompanyDraft => JSON.parse(JSON.stringify(d));

const fmtAt = (iso: string | null) =>
  iso ? iso.slice(5, 16).replace("T", " ") : "";

export const CompanySeries = ({
  onOpenProject,
}: {
  onOpenProject: (pid: string) => void;
}) => {
  const [pool, setPool] = useState<CompanyPool | null>(null);
  const [entries, setEntries] = useState<CompanyPlanEntry[]>([]);
  const [activeDate, setActiveDate] = useState("");
  const [draft, setDraft] = useState<CompanyDraft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");
  const [track, setTrack] = useState("全部");
  const [region, setRegion] = useState("全部");

  const load = useCallback(async (keepDate?: string) => {
    try {
      const [p, pl] = await Promise.all([companyPool(), companyPlan(7)]);
      setPool(p);
      setEntries(pl.entries);
      setActiveDate((cur) => keepDate || cur || pl.today);
      setErr("");
    } catch (e) {
      setErr(`加载失败：${(e as Error).message}（后端是否已启动？）`);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = useMemo(
    () => entries.find((e) => e.date === activeDate) ?? null,
    [entries, activeDate]
  );

  // 切换日期 / 排产状态变化时同步编辑区；有未保存修改时不动，避免覆盖用户输入
  useEffect(() => {
    if (dirty) return;
    setDraft(active?.draft ? cloneDraft(active.draft) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.date, active?.updated_at, active?.status, dirty]);

  // 有已排产/制作中的期数时轮询状态，其余时候低频刷新
  const live = entries.some((e) => e.status === "scheduled" || e.status === "producing");
  useEffect(() => {
    const t = window.setInterval(() => load(), live ? 15000 : 60000);
    return () => window.clearInterval(t);
  }, [live, load]);

  const mergeEntry = (e: CompanyPlanEntry) => {
    setEntries((cur) =>
      cur.map((x) =>
        x.date === e.date ? { ...x, ...e, weekday: x.weekday, is_today: x.is_today } : x
      )
    );
  };

  const flash = (text: string) => {
    setMsg(text);
    window.setTimeout(() => setMsg(""), 4000);
  };

  const switchDate = (d: string) => {
    if (d === activeDate) return;
    if (dirty && !window.confirm("当前初稿还没保存，切换日期会丢失修改，继续？")) return;
    setDirty(false);
    setDraft(null);
    setActiveDate(d);
  };

  const pick = async (c: CompanyProfile) => {
    if (busy || !active) return;
    setBusy(true);
    setErr("");
    try {
      const e = await companyPick(active.date, c.id);
      mergeEntry(e);
      setDraft(e.draft ? cloneDraft(e.draft) : null);
      setDirty(false);
      flash(`已选「${c.name}」，六段式初稿已生成`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const save = async (silent = false): Promise<boolean> => {
    if (!draft || !active) return false;
    setBusy(true);
    setErr("");
    try {
      const e = await companySaveDraft(active.date, draft);
      mergeEntry(e);
      setDirty(false);
      if (!silent) flash("初稿已保存");
      return true;
    } catch (e) {
      setErr((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const regenerate = async () => {
    if (!active) return;
    if (dirty && !window.confirm("重新生成会覆盖当前修改，继续？")) return;
    setBusy(true);
    setErr("");
    try {
      const e = await companyRegenerateDraft(active.date);
      mergeEntry(e);
      setDraft(e.draft ? cloneDraft(e.draft) : null);
      setDirty(false);
      flash("已按候选库素材重新生成初稿");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const schedule = async (now: boolean) => {
    if (!active) return;
    const ok = window.confirm(
      now
        ? "立即开始制作这一期？会占用制作队列，通常需要 20~60 分钟。"
        : "排进视频流水线？默认在下一个凌晨制作时间自动出片，排产后初稿锁定。"
    );
    if (!ok) return;
    if (dirty) {
      const saved = await save(true);
      if (!saved) return;
    }
    setBusy(true);
    setErr("");
    try {
      const e = await companySchedule(active.date, now);
      mergeEntry(e);
      flash(
        now
          ? "已开始制作，状态与日志可在「视频流水线」历史批次里看"
          : `已排产${e.produce_at ? `，将于 ${fmtAt(e.produce_at)} 自动制作` : ""}`
      );
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (skipConfirm = false) => {
    if (!active) return;
    if (!skipConfirm && !window.confirm("撤下这一期的计划？初稿会一起删除。")) return;
    setBusy(true);
    setErr("");
    try {
      await companyCancelPlan(active.date);
      setDirty(false);
      setDraft(null);
      await load(active.date);
      flash("已撤下，可重新选一家");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const changeCompany = async () => {
    if (!active) return;
    if (!window.confirm(`撤下「${active.company?.name ?? ""}」，重新选一家？`)) return;
    await cancel(true);
  };

  const patchDraft = (patch: Partial<CompanyDraft>) => {
    setDraft((cur) => (cur ? { ...cur, ...patch } : cur));
    setDirty(true);
  };

  const patchBeat = (i: number, patch: Partial<CompanyDraftBeat>) => {
    setDraft((cur) =>
      cur
        ? { ...cur, beats: cur.beats.map((b, j) => (j === i ? { ...b, ...patch } : b)) }
        : cur
    );
    setDirty(true);
  };

  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return (pool?.companies ?? []).filter((c) => {
      if (track !== "全部" && c.track !== track) return false;
      if (region !== "全部" && c.region !== region) return false;
      if (!qq) return true;
      const hay = `${c.name} ${c.name_en} ${c.sector} ${c.country} ${c.tags.join(" ")}`.toLowerCase();
      return hay.includes(qq);
    });
  }, [pool, q, track, region]);

  const st = active ? STATUS[active.status] ?? STATUS.empty : STATUS.empty;
  const canEdit = active?.status === "planned";
  const plannedCount = entries.filter((e) => e.status === "planned").length;
  const liveCount = entries.filter((e) => e.status === "scheduled" || e.status === "producing").length;
  const doneCount = entries.filter((e) => e.status === "done").length;

  return (
    <div className="co">
      {err && <div className="error">{err}</div>}
      {msg && <div className="good">{msg}</div>}

      <div className="panel co-head">
        <div className="dp-status-row">
          <h3>🏢 每日一家公司</h3>
          <span className="muted">一天一期 · 选公司 → 改初稿 → 排产 · 到点自动出片</span>
          <span style={{ flex: 1 }} />
          <span className="muted">
            {plannedCount} 期待排产 · {liveCount} 期制作中 · {doneCount} 期已出片
          </span>
        </div>
        <div className="co-dates">
          {entries.map((e) => {
            const meta = STATUS[e.status] ?? STATUS.empty;
            return (
              <button
                key={e.date}
                className={`co-date ${e.date === activeDate ? "active" : ""} ${e.status}`}
                onClick={() => switchDate(e.date)}
                title={e.pid ? `项目 ${e.pid}` : undefined}
              >
                <span className="co-date-day">{e.is_today ? "今天" : `周${e.weekday}`}</span>
                <span className="co-date-num">{e.date.slice(5).replace("-", "/")}</span>
                <span className={`dp-chip ${meta.cls}`}>{meta.label}</span>
                <span className="co-date-co">
                  {e.company?.name ??
                    (e.suggestion ? `推荐 · ${e.suggestion.name}` : "＋ 选公司")}
                </span>
              </button>
            );
          })}
        </div>
        <div className="muted co-hint">
          排产队列一次只跑一期（出片后再排下一期，避免同刻多批并发）；空档的「推荐」按最近
          30 天未用过的公司轮换。
        </div>
      </div>

      {active?.company ? (
        <>
          <div className="panel co-company">
            <div className="co-company-head">
              <div>
                <h3>
                  {active.company.name}{" "}
                  <span className="muted co-en">{active.company.name_en}</span>
                </h3>
                <div className="co-meta">
                  <span className="dp-chip">{active.company.region}</span>
                  <span className="dp-chip">{active.company.track}</span>
                  <span className="muted">
                    {active.company.sector} · {active.company.country} ·{" "}
                    {active.company.founded} 年 · {active.company.founder} ·{" "}
                    {active.company.hq}
                  </span>
                </div>
              </div>
              <div className="co-company-status">
                <span className={`dp-chip ${st.cls}`}>{st.label}</span>
                {active.run_id && <span className="muted mono">{active.run_id}</span>}
              </div>
            </div>
            <p className="co-hook">🪝 {active.company.hook}</p>
            {active.status === "scheduled" && (
              <div className="co-status-line">
                📅 已排产{active.produce_at ? `：${fmtAt(active.produce_at)} 自动制作` : ""}
                （需流水线定时开启；也可现在就做）
              </div>
            )}
            {active.status === "producing" && (
              <div className="co-status-line">
                ⏳ 制作中，通常 20~60 分钟；完成后可打开项目看成片，日志在「视频流水线」历史批次里
              </div>
            )}
            {active.status === "done" && (
              <div className="co-status-line good">
                ✅ 已出片{active.pid ? `（项目 ${active.pid}）` : ""}
              </div>
            )}
            {active.status === "failed" && (
              <div className="co-status-line bad">
                ❌ 制作失败，可「重新排产」再试一次，或换一家公司
              </div>
            )}
            <div className="co-actions">
              {active.status === "planned" && (
                <button className="btn small primary" disabled={busy} onClick={() => schedule(false)}>
                  📅 排产到下一档
                </button>
              )}
              {["planned", "scheduled", "failed"].includes(active.status) && (
                <button className="btn small" disabled={busy} onClick={() => schedule(true)}>
                  ▶ 立即制作
                </button>
              )}
              {active.pid && (
                <button className="btn small" onClick={() => onOpenProject(active.pid as string)}>
                  📂 打开项目
                </button>
              )}
              {(active.status === "planned" || active.status === "failed") && (
                <button className="btn small" disabled={busy} onClick={changeCompany}>
                  🔄 换一家
                </button>
              )}
              {["planned", "failed"].includes(active.status) && (
                <button className="btn small danger" disabled={busy} onClick={() => cancel()}>
                  ✕ 撤下
                </button>
              )}
            </div>
            {active.status === "done" && active.pid && (
              <video className="co-player" src={videoUrl(active.pid)} controls />
            )}
          </div>

          <div className="panel co-draft">
            <div className="dp-status-row">
              <h3>📝 内容初稿</h3>
              <span className="muted">
                提纲级：可改；制作期会核验事实，再拆成每句 ≤20 字的口播稿
              </span>
              <span style={{ flex: 1 }} />
              {dirty && <span className="muted">有未保存修改</span>}
              <button className="btn small" disabled={!dirty || busy} onClick={() => save()}>
                保存初稿
              </button>
              <button className="btn small" disabled={busy || !canEdit} onClick={regenerate}>
                ↻ 重生成
              </button>
            </div>
            {draft ? (
              <>
                <label className="co-field">
                  <span className="muted">标题参考</span>
                  <input
                    value={draft.title}
                    readOnly={!canEdit}
                    onChange={(e) => patchDraft({ title: e.target.value })}
                  />
                </label>
                <div className="co-beats">
                  {draft.beats.map((b, i) => (
                    <div className="co-beat" key={i}>
                      <div className="co-beat-head">
                        <input
                          className="co-beat-label"
                          value={b.label}
                          readOnly={!canEdit}
                          onChange={(e) => patchBeat(i, { label: e.target.value })}
                        />
                        <input
                          className="co-beat-sec"
                          value={b.sec}
                          readOnly={!canEdit}
                          onChange={(e) => patchBeat(i, { sec: e.target.value })}
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={b.text}
                        readOnly={!canEdit}
                        onChange={(e) => patchBeat(i, { text: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
                <label className="co-field">
                  <span className="muted">结尾互动</span>
                  <input
                    value={draft.cta}
                    readOnly={!canEdit}
                    onChange={(e) => patchDraft({ cta: e.target.value })}
                  />
                </label>
                <div className="co-note">ℹ️ {draft.notes}</div>
                {!canEdit && (
                  <div className="muted" style={{ fontSize: 12 }}>
                    已排产/已出片，初稿只读。想改内容请等这一期完成后再开下一期，或撤下重排。
                  </div>
                )}
              </>
            ) : (
              <div className="muted">选中公司后自动生成六段式初稿。</div>
            )}
          </div>
        </>
      ) : (
        <div className="panel co-picker">
          <div className="dp-status-row">
            <h3>选一家公司</h3>
            <span className="muted">
              从 {pool?.count ?? 0} 家里选一家；选中即生成初稿，先排产再制作
            </span>
          </div>
          {active?.suggestion && (
            <div className="co-suggest">
              <span>
                这天推荐：<strong>{active.suggestion.name}</strong>{" "}
                <span className="muted">{active.suggestion.one_liner}</span>
              </span>
              <button
                className="btn small primary"
                disabled={busy}
                onClick={() => pick(active.suggestion as CompanyProfile)}
              >
                采用推荐
              </button>
            </div>
          )}
          <div className="co-filters">
            <input
              className="co-search"
              placeholder="搜公司名 / 行业 / 标签…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select value={track} onChange={(e) => setTrack(e.target.value)}>
              <option value="全部">全部赛道</option>
              {(pool?.tracks ?? []).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="全部">国内外</option>
              <option value="国内">国内</option>
              <option value="海外">海外</option>
            </select>
            <span className="muted">{list.length} 家</span>
          </div>
          <div className="co-grid">
            {list.map((c) => (
              <button className="co-card" key={c.id} disabled={busy} onClick={() => pick(c)}>
                <div className="co-card-name">
                  {c.name} <span>{c.name_en}</span>
                </div>
                <div className="co-card-meta">
                  {c.region} · {c.sector} · {c.founded}
                </div>
                <div className="co-card-hook">{c.hook}</div>
              </button>
            ))}
            {!list.length && <div className="muted">没有匹配的公司，换个关键词试试。</div>}
          </div>
        </div>
      )}

      <div className="panel co-series">
        <div>
          <strong>系列格式</strong>
          <span className="muted">
            {" "}
            0-5s 钩子 · 5-15s 起点 · 15-40s 转折 · 40-60s 生意 · 60-75s 记忆点 · 结尾 CTA
          </span>
        </div>
        <div className="muted">
          公司介绍与渲染引擎内置模板无关：制作时按 from_scratch 走，禁止行星/宇宙类动效；
          所有数字与事件必须可溯源，查不到出处就不上屏。
        </div>
      </div>
    </div>
  );
};
