import { useCallback, useEffect, useState } from "react";
import {
  createPublishTask,
  creatorLoginCancel,
  creatorLoginPoll,
  creatorLoginStart,
  creatorLogout,
  creatorQrUrl,
  deletePublishTask,
  getPublishPackage,
  listProjects,
  publishCenterOverview,
  publishScreenshotUrl,
  publishTaskAction,
  updatePublishTask,
  withToken,
} from "../api";
import type {
  ProjectMeta,
  PublishCenterOverview,
  PublishPackage,
  PublishTask,
  PublishTaskStatus,
} from "../types";

// ---------- 工具 ----------

/** "YYYY-MM-DD HH:MM:SS" → datetime-local 的 "YYYY-MM-DDTHH:MM" */
const toLocalInput = (s: string) => (s ? s.replace(" ", "T").slice(0, 16) : "");

/** datetime-local 的值 → "YYYY-MM-DD HH:MM:SS" */
const fromLocalInput = (s: string) => (s ? s.replace("T", " ") + ":00" : "");

const fmtCountdown = (target: string) => {
  const t = new Date(target.replace(" ", "T")).getTime();
  if (Number.isNaN(t)) return "";
  const diff = t - Date.now();
  if (diff <= 0) return "即将执行";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "1 分钟内";
  if (m < 60) return `${m} 分钟后`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} 小时 ${m % 60} 分后`;
  return `${Math.floor(h / 24)} 天后`;
};

const STATUS_META: Record<PublishTaskStatus, { label: string; cls: string }> = {
  scheduled: { label: "已排期", cls: "info" },
  uploading: { label: "发布中", cls: "warn" },
  published: { label: "已发布", cls: "ok" },
  failed: { label: "失败", cls: "err" },
  overdue: { label: "已过期", cls: "err" },
  cancelled: { label: "已取消", cls: "muted" },
};

// ---------- 新建/编辑表单 ----------

type FormState = {
  id: string; // 空 = 新建
  pid: string;
  title: string;
  desc: string;
  tags: string;
  collection: string;
  declarations: string;
  scheduleMode: "now" | "later";
  when: string;
};

const emptyForm = (): FormState => ({
  id: "",
  pid: "",
  title: "",
  desc: "",
  tags: "",
  collection: "",
  declarations: "",
  scheduleMode: "now",
  when: "",
});

interface Props {
  /** 深链/详情页跳转过来时预选的项目 id */
  initialPid?: string;
  onConsumeInitialPid?: () => void;
}

/** 发布中心：抖音创作者中心扫码登录 + 预约发布任务管理 */
export const PublishCenter: React.FC<Props> = ({ initialPid, onConsumeInitialPid }) => {
  const [overview, setOverview] = useState<PublishCenterOverview | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  // 扫码登录
  const [showQr, setShowQr] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [qrMsg, setQrMsg] = useState("");

  // 新建/编辑弹窗
  const [form, setForm] = useState<FormState | null>(null);
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [pkg, setPkg] = useState<PublishPackage | null>(null);
  const [formErr, setFormErr] = useState("");
  const [formBusy, setFormBusy] = useState(false);

  const load = useCallback(async (refreshAccount = false) => {
    try {
      const o = await publishCenterOverview(refreshAccount);
      setOverview(o);
      setErr("");
    } catch (e) {
      setErr((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 轮询：有排队/执行中的任务 3s，空闲 15s
  const active = overview?.tasks.some((t) => t.status === "uploading" || t.status === "scheduled");
  useEffect(() => {
    const iv = setInterval(() => load(), active ? 3000 : 15000);
    return () => clearInterval(iv);
  }, [load, active]);

  // 详情页/深链带 pid 进来：直接打开新建弹窗
  useEffect(() => {
    if (initialPid) {
      openCreate(initialPid);
      onConsumeInitialPid?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPid]);

  // ---------- 扫码登录 ----------

  const startLogin = async () => {
    setErr("");
    setMsg("");
    setBusy("login");
    try {
      const st = await creatorLoginStart();
      if (st.state === "already_logged_in") {
        setMsg("已有有效登录会话");
        await load(true);
      } else {
        setQrUrl(creatorQrUrl());
        setQrMsg("请用抖音 App 扫码登录");
        setShowQr(true);
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy("");
    }
  };

  useEffect(() => {
    if (!showQr) return;
    // 二维码定时刷新（后端检测到过期会自动点刷新）
    setQrUrl(creatorQrUrl());
    const qrIv = setInterval(() => setQrUrl(creatorQrUrl()), 3000);
    const pollIv = setInterval(async () => {
      try {
        const st = await creatorLoginPoll();
        setQrMsg(st.message ?? "");
        if (st.state === "success") {
          setShowQr(false);
          setMsg("登录成功，可以预约发布了");
          await load(true);
        } else if (st.state === "expired") {
          setShowQr(false);
          setErr("二维码已过期，请重新点「扫码登录」");
        }
      } catch {
        /* 轮询失败下次再试 */
      }
    }, 2000);
    return () => {
      clearInterval(qrIv);
      clearInterval(pollIv);
    };
  }, [showQr, load]);

  const logout = async () => {
    if (!window.confirm("确认退出抖音创作者中心登录？（不影响已排期任务，但发布前需重新扫码）")) return;
    try {
      await creatorLogout();
      setMsg("已退出登录");
      await load(true);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  // ---------- 新建 / 编辑 ----------

  const openCreate = async (pid = "") => {
    setFormErr("");
    try {
      const list = await listProjects();
      const withVideo = list.filter((p) => p.has_video);
      setProjects(withVideo);
      const f = emptyForm();
      f.pid = pid && withVideo.some((p) => p.id === pid) ? pid : pid;
      setForm(f);
      setPkg(null);
      if (f.pid) await loadPackage(f.pid);
      // 全局默认预填
      if (overview) {
        setForm((prev) =>
          prev
            ? {
                ...prev,
                collection: overview.defaults.collection ?? "",
                declarations: (overview.defaults.declarations ?? []).join("，"),
              }
            : prev,
        );
      }
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const loadPackage = async (pid: string) => {
    setPkg(null);
    if (!pid) return;
    try {
      const p = await getPublishPackage(pid);
      setPkg(p);
      const dy = p.copies.douyin;
      setForm((prev) =>
        prev
          ? {
              ...prev,
              title: prev.title || dy?.title || "",
              desc: prev.desc || dy?.desc || "",
              tags: prev.tags || (dy?.tags ?? []).join(" "),
            }
          : prev,
      );
    } catch {
      /* 无成片/包缺失：表单照常可填 */
    }
  };

  const openEdit = (t: PublishTask) => {
    setFormErr("");
    setPkg(null);
    setForm({
      id: t.id,
      pid: t.pid,
      title: t.title,
      desc: t.desc,
      tags: t.tags.join(" "),
      collection: t.collection,
      declarations: t.declarations.join("，"),
      scheduleMode: "later",
      when: toLocalInput(t.scheduled_at),
    });
  };

  const submitForm = async () => {
    if (!form) return;
    if (!form.title.trim()) {
      setFormErr("标题不能为空");
      return;
    }
    if (form.scheduleMode === "later" && !form.when) {
      setFormErr("请选择发布时间");
      return;
    }
    setFormErr("");
    setFormBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        desc: form.desc.trim(),
        tags: form.tags.split(/[\s,，]+/).filter(Boolean),
        collection: form.collection.trim(),
        declarations: form.declarations
          .split(/[，,]+/)
          .map((s) => s.trim())
          .filter(Boolean),
        scheduled_at: form.scheduleMode === "later" ? fromLocalInput(form.when) : undefined,
      };
      if (form.id) {
        await updatePublishTask(form.id, payload);
        setMsg("任务已更新");
      } else {
        if (!form.pid) {
          setFormErr("请选择要发布的项目");
          setFormBusy(false);
          return;
        }
        await createPublishTask({
          pid: form.pid,
          title: payload.title,
          desc: payload.desc,
          tags: payload.tags,
          collection: payload.collection,
          declarations: payload.declarations,
          scheduled_at: form.scheduleMode === "later" ? payload.scheduled_at : null,
        });
        setMsg(
          form.scheduleMode === "later"
            ? `已排期：${fromLocalInput(form.when)} 自动发布`
            : "已提交，正在发布",
        );
      }
      setForm(null);
      await load();
    } catch (e) {
      setFormErr((e as Error).message);
    } finally {
      setFormBusy(false);
    }
  };

  // ---------- 任务操作 ----------

  const act = async (t: PublishTask, action: "publish-now" | "retry" | "cancel" | "republish") => {
    if (action === "publish-now" && !window.confirm(`立即发布「${t.title}」到抖音？`)) return;
    if (action === "republish" && !window.confirm("基于该任务创建一份新的可编辑发布任务？")) return;
    setBusy(t.id + action);
    setErr("");
    try {
      await publishTaskAction(t.id, action);
      const tips: Record<string, string> = {
        "publish-now": "已加入发布队列",
        retry: "已重新排期，马上执行",
        cancel: "已取消排期",
        republish: "已创建新的发布任务，可编辑后发布",
      };
      setMsg(tips[action]);
      await load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy("");
    }
  };

  const remove = async (t: PublishTask) => {
    if (!window.confirm(`删除发布任务「${t.title}」？（仅删除任务记录，不影响成片与已发布内容）`)) return;
    try {
      await deletePublishTask(t.id);
      await load();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const account = overview?.account;

  return (
    <div className="publish-center">
      {err && <div className="error">{err}</div>}
      {msg && <div className="ok">{msg}</div>}

      {/* 账号卡 */}
      <div className="panel publish-account">
        <div className="publish-account-row">
          <span className={`publish-chip ${account?.logged_in ? "ok" : "muted"}`}>
            {account?.logged_in ? "● 已登录" : "○ 未登录"}
          </span>
          <span className="muted">
            抖音创作者中心{account?.logged_in && account.age_days != null ? ` · 会话已保存 ${account.age_days} 天` : ""}
            {account?.message ? ` · ${account.message}` : ""}
          </span>
          <span className="flex1" />
          <button className="btn small" disabled={busy === "login"} onClick={startLogin}>
            {busy === "login" ? "启动中…" : account?.logged_in ? "重新扫码登录" : "扫码登录"}
          </button>
          {account?.logged_in && (
            <button className="btn small" onClick={logout}>
              退出登录
            </button>
          )}
          <button className="btn small primary" onClick={() => openCreate()}>
            + 预约发布
          </button>
        </div>
        {!account?.logged_in && (
          <p className="hint">
            发布前需要登录：点「扫码登录」→ 用抖音 App 扫码。系统不会接触你的账号密码，会话只保存在本机。
          </p>
        )}
      </div>

      {/* 任务列表 */}
      {!overview?.tasks.length ? (
        <div className="muted" style={{ padding: 24 }}>
          还没有发布任务。成片渲染完成后，点「+ 预约发布」创建一个（可选立即发布或任意未来时间）。
        </div>
      ) : (
        <div className="publish-list">
          {overview.tasks.map((t) => {
            const meta = STATUS_META[t.status];
            return (
              <div className="panel publish-task" key={t.id}>
                <div className="publish-task-head">
                  <span className={`publish-chip ${meta.cls}`}>{meta.label}</span>
                  <strong className="publish-task-title">{t.title}</strong>
                  <span className="muted">
                    {t.project_title ?? t.pid} · {t.scheduled_at}
                    {t.status === "scheduled" ? `（${fmtCountdown(t.scheduled_at)}）` : ""}
                  </span>
                  <span className="flex1" />
                  {t.status === "published" && t.published_at && (
                    <span className="publish-ok-line">✓ {t.published_at} 已发布</span>
                  )}
                </div>
                {(t.desc || t.tags.length > 0) && (
                  <div className="publish-task-copy">
                    {t.desc && <div className="hint">{t.desc}</div>}
                    {t.tags.length > 0 && (
                      <div className="publish-tags">{t.tags.map((x) => `#${x}`).join(" ")}</div>
                    )}
                  </div>
                )}
                <div className="publish-task-meta">
                  {t.collection && <span className="publish-kv">合集：{t.collection}</span>}
                  {t.declarations.length > 0 && (
                    <span className="publish-kv">声明：{t.declarations.join("、")}</span>
                  )}
                  {t.attempts > 0 && <span className="publish-kv">尝试 {t.attempts} 次</span>}
                </div>
                {t.status === "uploading" && t.last_message && (
                  <div className="publish-progress">⏳ {t.last_message}</div>
                )}
                {t.error && (
                  <div className="error publish-error">
                    {t.error}
                    {t.status === "failed" && (
                      <a className="publish-shot-link" href={publishScreenshotUrl(t.id)} target="_blank" rel="noreferrer">
                        查看失败截图
                      </a>
                    )}
                  </div>
                )}
                {t.warnings.map((w, i) => (
                  <div className="warn" key={i}>
                    ⚠ {w}
                  </div>
                ))}
                <div className="btn-row publish-actions">
                  {t.status === "scheduled" && (
                    <>
                      <button className="btn small primary" disabled={busy === t.id + "publish-now"} onClick={() => act(t, "publish-now")}>
                        立即发布
                      </button>
                      <button className="btn small" onClick={() => openEdit(t)}>
                        编辑
                      </button>
                      <button className="btn small" onClick={() => act(t, "cancel")}>
                        取消排期
                      </button>
                    </>
                  )}
                  {t.status === "uploading" && <span className="muted">执行中，请勿关闭后端…</span>}
                  {(t.status === "failed" || t.status === "overdue") && (
                    <>
                      <button className="btn small primary" onClick={() => act(t, "retry")}>
                        {t.status === "overdue" ? "按原时间补发" : "重试"}
                      </button>
                      <button className="btn small" onClick={() => openEdit(t)}>
                        编辑
                      </button>
                      <button className="btn small" onClick={() => act(t, "republish")}>
                        再次发布
                      </button>
                    </>
                  )}
                  {(t.status === "published" || t.status === "cancelled") && (
                    <button className="btn small" onClick={() => act(t, "republish")}>
                      再次发布
                    </button>
                  )}
                  {t.status !== "uploading" && (
                    <button className="btn small danger" onClick={() => remove(t)}>
                      删除
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 扫码登录弹窗 */}
      {showQr && (
        <div className="modal-mask" onClick={() => setShowQr(false)}>
          <div className="modal publish-qr" onClick={(e) => e.stopPropagation()}>
            <h3>抖音扫码登录</h3>
            {qrUrl ? (
              <img className="publish-qr-img" src={qrUrl} alt="二维码" />
            ) : (
              <div className="muted" style={{ padding: 24 }}>二维码加载中…</div>
            )}
            <p className="hint">{qrMsg || "请用抖音 App 扫码并确认登录"}</p>
            <button
              className="btn wide"
              onClick={async () => {
                await creatorLoginCancel().catch(() => {});
                setShowQr(false);
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 新建/编辑弹窗 */}
      {form && (
        <div className="modal-mask" onClick={() => setForm(null)}>
          <div className="modal publish-form" onClick={(e) => e.stopPropagation()}>
            <h3>{form.id ? "编辑发布任务" : "预约发布到抖音"}</h3>

            {!form.id && (
              <label className="publish-field">
                <span>项目（仅列出已出片的）</span>
                <select
                  value={form.pid}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setForm({ ...form, pid });
                    if (pid) loadPackage(pid);
                  }}
                >
                  <option value="">— 选择项目 —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                  {form.pid && !projects.some((p) => p.id === form.pid) && (
                    <option value={form.pid}>{form.pid}</option>
                  )}
                </select>
              </label>
            )}

            {pkg?.cover_v_url || pkg?.cover_h_url ? (
              <div className="publish-covers">
                {pkg?.cover_v_url && (
                  <figure>
                    <img src={withToken(pkg.cover_v_url)} alt="竖版封面" />
                    <figcaption className="muted">竖版封面 3:4</figcaption>
                  </figure>
                )}
                {pkg?.cover_h_url && (
                  <figure>
                    <img src={withToken(pkg.cover_h_url)} alt="横版封面" />
                    <figcaption className="muted">横版封面 16:9</figcaption>
                  </figure>
                )}
              </div>
            ) : (
              form.pid && <p className="hint">封面将发布时自动从成片截取（竖版+横版）</p>
            )}

            <label className="publish-field">
              <span>标题 *</span>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="发布标题（≤24 字更有利完播）"
                maxLength={60}
              />
            </label>
            <label className="publish-field">
              <span>视频简介</span>
              <textarea
                value={form.desc}
                onChange={(e) => setForm({ ...form, desc: e.target.value })}
                rows={3}
                placeholder="简介 / 互动引导（可空）"
              />
            </label>
            <label className="publish-field">
              <span>话题（空格分隔）</span>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="科普 智能 教程"
              />
            </label>
            <label className="publish-field">
              <span>合集（留空 = 不加入合集）</span>
              <input
                value={form.collection}
                onChange={(e) => setForm({ ...form, collection: e.target.value })}
                placeholder="需已在创作者中心创建该合集"
              />
            </label>
            <label className="publish-field">
              <span>自主声明（逗号分隔，勾选页面上的声明项）</span>
              <input
                value={form.declarations}
                onChange={(e) => setForm({ ...form, declarations: e.target.value })}
                placeholder="内容由AI生成"
              />
            </label>

            <div className="publish-field">
              <span>发布时间</span>
              <div className="publish-schedule">
                <label className="radio">
                  <input
                    type="radio"
                    checked={form.scheduleMode === "now"}
                    onChange={() => setForm({ ...form, scheduleMode: "now" })}
                  />{" "}
                  立即发布
                </label>
                <label className="radio">
                  <input
                    type="radio"
                    checked={form.scheduleMode === "later"}
                    onChange={() => setForm({ ...form, scheduleMode: "later" })}
                  />{" "}
                  定时发布
                </label>
                {form.scheduleMode === "later" && (
                  <input
                    type="datetime-local"
                    value={form.when}
                    onChange={(e) => setForm({ ...form, when: e.target.value })}
                  />
                )}
              </div>
              <p className="hint">
                定时发布由本系统到点自动执行：到点时后端程序需在运行（错过会在下次启动时按宽限期补发）。
              </p>
            </div>

            {formErr && <div className="error">{formErr}</div>}
            <div className="btn-row">
              <button className="btn wide" onClick={() => setForm(null)}>
                取消
              </button>
              <button className="btn primary wide" disabled={formBusy} onClick={submitForm}>
                {formBusy ? "提交中…" : form.id ? "保存修改" : form.scheduleMode === "now" ? "立即发布" : "创建排期"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
