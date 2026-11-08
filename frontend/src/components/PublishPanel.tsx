import { useCallback, useEffect, useState } from "react";
import {
  douyinExchange,
  generatePublishCopy,
  getDouyinAuthorizeUrl,
  getDouyinStatus,
  getPublishPackage,
  publishCoverUrl,
  publishDouyin,
  videoUrl,
} from "../api";
import type { DouyinStatus, PublishCopy, PublishPackage } from "../types";

interface Props {
  pid: string;
  modelId: string | null;
  /** 跳转到「发布」Tab 预约发布（创作者中心自动化） */
  onSchedulePublish?: (pid: string) => void;
}

type Platform = "douyin" | "xhs";

const PLATFORM_LABEL: Record<Platform, string> = { douyin: "抖音", xhs: "小红书" };

/** 平台发布面板：AI 文案 + 封面预览 + 抖音官方 API 推送 / 双平台半自动推送 */
export const PublishPanel: React.FC<Props> = ({ pid, modelId, onSchedulePublish }) => {
  const [pkg, setPkg] = useState<PublishPackage | null>(null);
  const [dyStatus, setDyStatus] = useState<DouyinStatus | null>(null);
  const [platform, setPlatform] = useState<Platform>("douyin");
  const [draft, setDraft] = useState<PublishCopy | null>(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [publishedId, setPublishedId] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [p, st] = await Promise.all([getPublishPackage(pid), getDouyinStatus()]);
      setPkg(p);
      setDyStatus(st);
      setDraft(p.copies[platform] ?? null);
    } catch {
      /* 面板静默降级 */
    }
  }, [pid, platform]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const switchPlatform = (p: Platform) => {
    setPlatform(p);
    setDraft(pkg?.copies[p] ?? null);
    setErr("");
    setMsg("");
  };

  const genCopy = async () => {
    setErr("");
    setMsg("");
    setBusy("copy");
    try {
      const copy = await generatePublishCopy(pid, platform, modelId);
      setDraft(copy);
      setPkg((prev) =>
        prev ? { ...prev, copies: { ...prev.copies, [platform]: copy } } : prev
      );
      setMsg(`${PLATFORM_LABEL[platform]}文案已生成`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy("");
    }
  };

  const copyText = (c: PublishCopy) =>
    [c.title, c.desc, c.tags.map((t) => "#" + t).join(" ")].filter(Boolean).join("\n");

  const semiAutoPublish = async () => {
    if (!draft) {
      setErr("先点「AI 生成文案」");
      return;
    }
    try {
      await navigator.clipboard.writeText(copyText(draft));
      window.open(pkg?.upload_pages[platform], "_blank");
      setMsg(`文案已复制，已打开${PLATFORM_LABEL[platform]}创作者上传页：上传 ${pkg?.has_video ? "成片和封面" : "视频"}后手动发布`);
    } catch {
      setErr("复制失败：请手动选择文案复制（浏览器可能未授权剪贴板）");
    }
  };

  const startAuthorize = async () => {
    setErr("");
    try {
      const { url } = await getDouyinAuthorizeUrl();
      window.open(url, "_blank");
      setShowAuth(true);
      setMsg("授权页已打开：登录并同意后，把跳转地址里的 code 参数粘贴到下面");
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const exchange = async () => {
    setErr("");
    setBusy("auth");
    try {
      await douyinExchange(authCode.trim());
      setDyStatus((s) => (s ? { ...s, authorized: true } : s));
      setShowAuth(false);
      setAuthCode("");
      setMsg("抖音授权成功，可以推送了");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy("");
    }
  };

  const pushDouyin = async () => {
    if (!draft) {
      setErr("先点「AI 生成文案」");
      return;
    }
    if (!window.confirm("将上传成片并发布到抖音，确认继续？")) return;
    setErr("");
    setMsg("");
    setBusy("push");
    try {
      const r = await publishDouyin(pid, {
        title: draft.title,
        desc: draft.desc,
        tags: draft.tags,
      });
      setPublishedId(r.item_id || r.video_id);
      setMsg("已提交到抖音（审核通过后可见）");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy("");
    }
  };

  const canPushDouyin = Boolean(dyStatus?.configured && dyStatus?.authorized && pkg?.has_video);

  return (
    <div className="panel">
      <h3>发布</h3>
      {!pkg?.has_video ? (
        <p className="hint">成片渲染完成后可在此推送到抖音 / 小红书。</p>
      ) : (
        <>
          <div className="publish-cover">
            {pkg.cover_url && <img src={publishCoverUrl(pid)} alt="封面" />}
            <div className="hint">封面自动截取自成片</div>
          </div>

          <div className="tab-row">
            {(["douyin", "xhs"] as Platform[]).map((p) => (
              <button
                key={p}
                className={`btn small ${platform === p ? "primary" : ""}`}
                onClick={() => switchPlatform(p)}
              >
                {PLATFORM_LABEL[p]}
              </button>
            ))}
          </div>

          <button className="btn wide" disabled={busy === "copy"} onClick={genCopy}>
            {busy === "copy" ? "生成中..." : draft ? "重新生成 AI 文案" : "AI 生成文案"}
          </button>

          {draft && (
            <div className="copy-box">
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="标题"
              />
              <textarea
                value={draft.desc}
                onChange={(e) => setDraft({ ...draft, desc: e.target.value })}
                rows={4}
                placeholder="正文"
              />
              <input
                value={draft.tags.join(" ")}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    tags: e.target.value.split(/[\s,，]+/).filter(Boolean),
                  })
                }
                placeholder="话题（空格分隔）"
              />
            </div>
          )}

          {platform === "douyin" && dyStatus && (
            <div className="hint">
              抖音开放平台：
              {!dyStatus.configured
                ? "未配置凭证（.env 里填 DOUYIN_CLIENT_KEY/SECRET/REDIRECT_URI），当前只能半自动推送"
                : dyStatus.authorized
                  ? "✅ 已授权"
                  : "已配置，尚未授权"}
            </div>
          )}

          <div className="btn-row">
            {onSchedulePublish && (
              <button className="btn primary wide" onClick={() => onSchedulePublish(pid)}>
                📅 预约发布（自动上传：标题/简介/双封面/合集/声明）
              </button>
            )}
            <button className="btn wide" disabled={!draft} onClick={semiAutoPublish}>
              复制文案并打开{PLATFORM_LABEL[platform]}上传页
            </button>
            {platform === "douyin" && dyStatus?.configured && (
              <button
                className="btn primary wide"
                disabled={!canPushDouyin || busy === "push"}
                onClick={pushDouyin}
              >
                {busy === "push" ? "上传发布中（大文件需数分钟）..." : "推送到抖音（官方 API）"}
              </button>
            )}
            {platform === "douyin" && dyStatus?.configured && !dyStatus.authorized && (
              <button className="btn wide" onClick={startAuthorize}>
                去授权抖音账号
              </button>
            )}
          </div>

          {showAuth && (
            <div className="copy-box">
              <input
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="粘贴授权后跳转地址里的 code"
              />
              <button className="btn wide" disabled={busy === "auth" || !authCode.trim()} onClick={exchange}>
                {busy === "auth" ? "验证中..." : "完成授权"}
              </button>
            </div>
          )}

          {publishedId && <div className="hint">item_id: {publishedId} · 成片: {videoUrl(pid)}</div>}
          {msg && <div className="ok">{msg}</div>}
          {err && <div className="error">{err}</div>}
        </>
      )}
    </div>
  );
};
