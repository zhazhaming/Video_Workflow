import { useEffect, useState } from "react";
import {
  deleteShotImage,
  generateImagePrompts,
  getImagePrompts,
  listProjectImages,
  uploadShotImage,
  type ImageSlot,
} from "../api";
import type { ScriptDraft, Shot } from "../types";

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

const DEFAULT_COLORS: [string, string] = ["#1a1a2e", "#16213e"];

const newShot = (): Shot => ({
  year: "",
  label: "新分镜",
  colors: [...DEFAULT_COLORS] as [string, string],
  lines: [{ text: "" }],
});

interface Props {
  pid: string;
  script: ScriptDraft;
  modelId?: string;
  /** 生成图片提示词前先保存脚本，保证提示词与当前分镜内容一致 */
  onBeforeGeneratePrompts?: () => Promise<void>;
  /** 上报当前活动状态（用于右侧执行流程面板） */
  onActivity?: (a: "idle" | "prompting") => void;
  /** 上报提示词条数 */
  onPromptsChange?: (n: number) => void;
  /** 是否显示分镜图片槽位与图片提示词 UI（六步流水线下传 false 关闭） */
  showImages?: boolean;
  onChange: (s: ScriptDraft) => void;
}

export const ScriptEditor: React.FC<Props> = ({
  pid,
  script,
  modelId,
  onBeforeGeneratePrompts,
  onActivity,
  onPromptsChange,
  showImages = true,
  onChange,
}) => {
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonErr, setJsonErr] = useState("");
  const [imgSlots, setImgSlots] = useState<Record<number, ImageSlot>>({});
  const [imgVer, setImgVer] = useState(0);
  const [manualDir, setManualDir] = useState("");
  const [imgErr, setImgErr] = useState("");
  const [imgPrompts, setImgPrompts] = useState<string[]>([]);
  const [promptsBusy, setPromptsBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const refreshImages = async () => {
    try {
      const r = await listProjectImages(pid);
      setManualDir(r.manual_dir);
      setImgSlots(Object.fromEntries(r.items.map((it) => [it.shot_index, it])));
      setImgVer(Date.now());
      setImgErr("");
    } catch (e) {
      setImgErr((e as Error).message);
    }
  };

  useEffect(() => {
    if (!showImages) {
      setImgSlots({});
      setImgPrompts([]);
      return;
    }
    refreshImages();
    getImagePrompts(pid)
      .then((r) => {
        setImgPrompts(r.prompts);
        onPromptsChange?.(r.prompts.length);
      })
      .catch(() => setImgPrompts([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid, script.shots.length, showImages]);

  const generateAllPrompts = async () => {
    setPromptsBusy(true);
    setImgErr("");
    try {
      // 先落库当前脚本，再生成——否则后端会用旧脚本生成，导致后面的镜头没有提示词
      await onBeforeGeneratePrompts?.();
      onActivity?.("prompting");
      const r = await generateImagePrompts(pid, modelId);
      setImgPrompts(r.prompts);
      onPromptsChange?.(r.prompts.length);
    } catch (e) {
      setImgErr(`图片提示词生成失败：${(e as Error).message}`);
    } finally {
      setPromptsBusy(false);
      onActivity?.("idle");
    }
  };

  const doCopy = async (key: string, text: string) => {
    await copyText(text);
    setCopied(key);
    window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
  };

  const copyAllPrompts = () => {
    if (!imgPrompts.length) return;
    const text = script.shots
      .map((s, i) => `镜头${i + 1}${s.label ? `（${s.label}）` : ""}：\n${imgPrompts[i] ?? ""}`)
      .join("\n\n");
    doCopy("all", text);
  };

  const onUpload = async (idx: number, file: File | undefined) => {
    if (!file) return;
    try {
      await uploadShotImage(pid, idx, file);
      await refreshImages();
    } catch (e) {
      setImgErr(`上传失败：${(e as Error).message}`);
    }
  };

  const onDeleteImage = async (idx: number) => {
    try {
      await deleteShotImage(pid, idx);
      await refreshImages();
    } catch (e) {
      setImgErr(`删除失败：${(e as Error).message}`);
    }
  };

  const patch = (partial: Partial<ScriptDraft>) => onChange({ ...script, ...partial });

  const patchShot = (i: number, partial: Partial<Shot>) => {
    const shots = script.shots.map((s, idx) => (idx === i ? { ...s, ...partial } : s));
    patch({ shots });
  };

  const moveShot = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= script.shots.length) return;
    const shots = [...script.shots];
    [shots[i], shots[j]] = [shots[j], shots[i]];
    patch({ shots });
  };

  const removeShot = (i: number) => {
    if (script.shots.length <= 1) return;
    patch({ shots: script.shots.filter((_, idx) => idx !== i) });
  };

  const enterJsonMode = () => {
    setJsonText(JSON.stringify(script, null, 2));
    setJsonErr("");
    setJsonMode(true);
  };

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.title || !Array.isArray(parsed.shots) || parsed.shots.length === 0) {
        throw new Error("需要 title 和非空 shots 数组");
      }
      for (const s of parsed.shots) {
        if (!Array.isArray(s.lines) || s.lines.length === 0) throw new Error("每个分镜需要非空 lines");
        if (!Array.isArray(s.colors) || s.colors.length !== 2) s.colors = DEFAULT_COLORS;
        s.year = s.year ?? "";
        s.label = s.label ?? "";
      }
      onChange(parsed as ScriptDraft);
      setJsonMode(false);
      setJsonErr("");
    } catch (e) {
      setJsonErr(`JSON 解析失败：${(e as Error).message}`);
    }
  };

  if (jsonMode) {
    return (
      <div className="panel">
        <div className="panel-head">
          <h3>脚本 JSON</h3>
          <div className="row">
            <button className="btn" onClick={() => setJsonMode(false)}>取消</button>
            <button className="btn primary" onClick={applyJson}>应用</button>
          </div>
        </div>
        <textarea className="json-area" value={jsonText} onChange={(e) => setJsonText(e.target.value)} spellCheck={false} />
        {jsonErr && <div className="error">{jsonErr}</div>}
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>分镜脚本</h3>
        <div className="row">
          {showImages && (
            <>
              <button className="btn" disabled={promptsBusy} onClick={generateAllPrompts}>
                {promptsBusy ? "生成中..." : "生成全部图片提示词"}
              </button>
              <button className="btn" disabled={!imgPrompts.length} onClick={copyAllPrompts}>
                {copied === "all" ? "已复制" : "复制全部提示词"}
              </button>
            </>
          )}
          <button className="btn" onClick={enterJsonMode}>JSON 模式</button>
        </div>
      </div>

      <label className="field">
        <span>视频标题</span>
        <input value={script.title} onChange={(e) => patch({ title: e.target.value })} maxLength={60} />
      </label>

      {imgErr && <div className="error">{imgErr}</div>}
      {manualDir && (
        <p className="hint">
          自定义画面：在此上传，或把豆包/任何工具生成的图片命名为
          <b> custom_01.png、custom_02.png…</b>（序号对应分镜）放入：
          <br />
          <code className="mono">{manualDir}</code>
          <br />
          有自定义图的分镜渲染时将直接使用，否则生成渐变占位图。
        </p>
      )}

      {script.shots.map((shot, i) => (
        <div className="shot" key={i}>
          <div className="shot-head">
            <b>分镜 {i + 1}</b>
            <div className="row">
              <button className="btn small" onClick={() => moveShot(i, -1)} title="上移">↑</button>
              <button className="btn small" onClick={() => moveShot(i, 1)} title="下移">↓</button>
              <button className="btn small danger" onClick={() => removeShot(i)} title="删除">删</button>
            </div>
          </div>
          <div className="shot-meta">
            <label className="field mini">
              <span>年份</span>
              <input value={shot.year} onChange={(e) => patchShot(i, { year: e.target.value })} placeholder="2026，可空" maxLength={16} />
            </label>
            <label className="field mini">
              <span>占位图文字</span>
              <input value={shot.label} onChange={(e) => patchShot(i, { label: e.target.value })} placeholder="4-8 字" maxLength={40} />
            </label>
            <div className="field mini">
              <span>占位色</span>
              <div className="row">
                <input type="color" value={shot.colors[0]} onChange={(e) => patchShot(i, { colors: [e.target.value, shot.colors[1]] })} />
                <input type="color" value={shot.colors[1]} onChange={(e) => patchShot(i, { colors: [shot.colors[0], e.target.value] })} />
              </div>
            </div>
          </div>
          {showImages && (
          <div className="img-slot">
            {imgSlots[i]?.custom ? (
              <>
                <img src={`${imgSlots[i]!.url}?t=${imgVer}`} alt={`分镜${i + 1}自定义图`} />
                <div className="img-slot-info">
                  <span className="good">自定义图：{imgSlots[i]!.custom}</span>
                  <label className="btn small">
                    更换
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      style={{ display: "none" }}
                      onChange={(e) => onUpload(i, e.target.files?.[0])}
                    />
                  </label>
                  <button className="btn small danger" onClick={() => onDeleteImage(i)}>
                    移除
                  </button>
                </div>
              </>
            ) : (
              <div className="img-slot-info">
                <span className="muted">画面：占位图（渐变）</span>
                <label className="btn small">
                  上传自定义图
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    style={{ display: "none" }}
                    onChange={(e) => onUpload(i, e.target.files?.[0])}
                  />
                </label>
              </div>
            )}
          </div>
          )}
          {showImages && (imgPrompts[i] ? (
            <div className="img-prompt">
              <div className="img-prompt-head">
                <span className="muted">图片提示词（复制给豆包出图）</span>
                <button className="btn small" onClick={() => doCopy(`shot-${i}`, imgPrompts[i])}>
                  {copied === `shot-${i}` ? "已复制" : "复制"}
                </button>
              </div>
              <div className="img-prompt-text">{imgPrompts[i]}</div>
            </div>
          ) : (
            <div className="img-prompt img-prompt-empty">
              <span className="muted">
                本镜暂无图片提示词——点上方「生成全部图片提示词」（会先自动保存当前脚本）
              </span>
            </div>
          ))}
          {shot.lines.map((line, li) => (
            <div className="line-row" key={li}>
              <textarea
                value={line.text}
                rows={2}
                placeholder={`第 ${li + 1} 句台词（≤28字）`}
                onChange={(e) => {
                  const lines = shot.lines.map((l, idx) => (idx === li ? { text: e.target.value } : l));
                  patchShot(i, { lines });
                }}
              />
              <button
                className="btn small danger"
                disabled={shot.lines.length <= 1}
                onClick={() => patchShot(i, { lines: shot.lines.filter((_, idx) => idx !== li) })}
              >
                删句
              </button>
            </div>
          ))}
          <button
            className="btn small"
            onClick={() => patchShot(i, { lines: [...shot.lines, { text: "" }] })}
          >
            + 加一句
          </button>
        </div>
      ))}

      <button className="btn" onClick={() => patch({ shots: [...script.shots, newShot()] })}>
        + 加一个分镜
      </button>
    </div>
  );
};
