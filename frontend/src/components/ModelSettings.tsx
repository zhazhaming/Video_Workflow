import { useEffect, useRef, useState } from "react";
import { getModelConfigs, saveModelConfigs, testModel } from "../api";
import type { ModelConfig, ModelTestResult } from "../types";

/** 弹窗内每行一个稳定 uid（id 可编辑，不能当 key）；headersText 为请求头的多行文本形态 */
type Row = ModelConfig & { uid: number; headersText: string };
/** 单行连通性测试状态 */
type TestState = { busy: boolean; result: ModelTestResult | null };

/** Record<string,string> → 每行 "Key: Value" 的文本 */
const headersToText = (h?: Record<string, string>) =>
  Object.entries(h ?? {})
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

/** 每行 "Key: Value" 文本 → Record；无冒号的行忽略 */
const textToHeaders = (text: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const i = line.indexOf(":");
    if (i <= 0) continue;
    const k = line.slice(0, i).trim();
    if (k) out[k] = line.slice(i + 1).trim();
  }
  return out;
};

const blankRow = (uid: number, n: number): Row => ({
  uid,
  id: `custom-${n}`,
  name: "",
  base_url: "",
  api_key: "",
  model: "",
  default: false,
  extra_headers: {},
  headersText: "",
  available: false,
});

/** base_url / api_key / model 齐全才算可用（与后端 ModelEntry.available 一致） */
const filled = (m: ModelConfig) =>
  [m.base_url, m.api_key, m.model].every((v) => v.trim().length > 0);

/** 模型 API 设置弹窗：编辑模型列表 → 保存写回 backend/models.json，立即生效。 */
export function ModelSettings({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (models: ModelConfig[]) => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedTip, setSavedTip] = useState("");
  const [tests, setTests] = useState<Record<number, TestState>>({});
  const [showKeys, setShowKeys] = useState<Record<number, boolean>>({});
  const nextUid = useRef(1);
  const nextCustom = useRef(1);

  useEffect(() => {
    getModelConfigs()
      .then((r) => {
        setRows(
          r.models.map((m, i) => ({ ...m, uid: i + 1, headersText: headersToText(m.extra_headers) }))
        );
        nextUid.current = r.models.length + 1;
      })
      .catch((e) => setErr(`加载失败：${(e as Error).message}`))
      .finally(() => setLoading(false));
  }, []);

  // ESC 关闭
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const patch = (uid: number, p: Partial<Row>) =>
    setRows((rs) => rs.map((m) => (m.uid === uid ? { ...m, ...p } : m)));

  const addRow = () => {
    setRows((rs) => [...rs, blankRow(nextUid.current++, nextCustom.current++)]);
  };

  const removeRow = (uid: number) => {
    setRows((rs) => rs.filter((m) => m.uid !== uid));
    setTests((t) => {
      const rest = { ...t };
      delete rest[uid];
      return rest;
    });
  };

  const setDefault = (uid: number) =>
    setRows((rs) => rs.map((m) => ({ ...m, default: m.uid === uid })));

  const runTest = async (row: Row) => {
    setTests((t) => ({ ...t, [row.uid]: { busy: true, result: null } }));
    try {
      const result = await testModel({
        base_url: row.base_url,
        api_key: row.api_key,
        model: row.model,
        extra_headers: textToHeaders(row.headersText),
      });
      setTests((t) => ({ ...t, [row.uid]: { busy: false, result } }));
    } catch (e) {
      setTests((t) => ({
        ...t,
        [row.uid]: { busy: false, result: { ok: false, latency_ms: 0, error: (e as Error).message } },
      }));
    }
  };

  const save = async () => {
    setErr("");
    setSavedTip("");
    setSaving(true);
    try {
      const payload: ModelConfig[] = rows.map((m) => ({
        id: m.id.trim(),
        name: m.name.trim(),
        base_url: m.base_url.trim(),
        api_key: m.api_key.trim(),
        model: m.model.trim(),
        default: m.default,
        extra_headers: textToHeaders(m.headersText),
        available: filled(m),
      }));
      const r = await saveModelConfigs(payload);
      onSaved(r.models);
      setSavedTip("已保存，立即生效");
      window.setTimeout(() => setSavedTip(""), 2500);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal model-cfg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 className="modal-title">⚙ 模型 API 配置</h3>
          <button className="btn small" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="hint">
          OpenAI 兼容接口。保存后写入 backend/models.json（旧文件备份 .bak），立即生效，无需重启后端。
        </p>
        {err && <div className="error">{err}</div>}
        {loading ? (
          <div className="muted" style={{ padding: 24, textAlign: "center" }}>
            加载中…
          </div>
        ) : (
          <div className="model-cfg-list">
            {rows.map((m) => {
              const t = tests[m.uid];
              const ok = filled(m);
              return (
                <div className="model-cfg-card" key={m.uid}>
                  <div className="model-cfg-top">
                    <input
                      className="model-cfg-name"
                      value={m.name}
                      placeholder="显示名称"
                      onChange={(e) => patch(m.uid, { name: e.target.value })}
                    />
                    <label className="model-cfg-def" title="脚本生成默认使用的模型">
                      <input
                        type="radio"
                        name="model-cfg-default"
                        checked={m.default}
                        onChange={() => setDefault(m.uid)}
                      />
                      默认
                    </label>
                    <span className={`model-cfg-badge ${ok ? "on" : "off"}`}>{ok ? "已配齐" : "未配齐"}</span>
                    <button className="btn tiny" disabled={!!t?.busy} onClick={() => runTest(m)}>
                      {t?.busy ? "测试中…" : "测试"}
                    </button>
                    <button className="btn tiny danger" onClick={() => removeRow(m.uid)}>
                      删除
                    </button>
                  </div>
                  <div className="model-cfg-grid">
                    <label>
                      接口地址 base_url
                      <input
                        value={m.base_url}
                        placeholder="https://api.deepseek.com/v1"
                        onChange={(e) => patch(m.uid, { base_url: e.target.value })}
                      />
                    </label>
                    <label>
                      模型名 model
                      <input
                        value={m.model}
                        placeholder="deepseek-chat"
                        onChange={(e) => patch(m.uid, { model: e.target.value })}
                      />
                    </label>
                    <label className="model-cfg-key-label">
                      API Key
                      <div className="model-cfg-key">
                        <input
                          type={showKeys[m.uid] ? "text" : "password"}
                          value={m.api_key}
                          placeholder="sk-…"
                          autoComplete="off"
                          onChange={(e) => patch(m.uid, { api_key: e.target.value })}
                        />
                        <button
                          className="btn tiny"
                          onClick={() => setShowKeys((s) => ({ ...s, [m.uid]: !s[m.uid] }))}
                        >
                          {showKeys[m.uid] ? "隐藏" : "显示"}
                        </button>
                      </div>
                    </label>
                    <label>
                      ID
                      <input
                        value={m.id}
                        placeholder="项目里引用的模型 id"
                        onChange={(e) => patch(m.uid, { id: e.target.value })}
                      />
                    </label>
                    <label className="full">
                      自定义请求头（可选，每行 Key: Value）
                      <textarea
                        className="model-cfg-headers"
                        rows={2}
                        value={m.headersText}
                        placeholder={"例如 opencode Go 必填：\nx-opencode-session: 任意稳定会话ID"}
                        onChange={(e) => patch(m.uid, { headersText: e.target.value })}
                      />
                    </label>
                  </div>
                  {t?.result &&
                    (t.result.ok ? (
                      <div className="model-cfg-test ok">
                        ✓ 连通正常 · {t.result.latency_ms}ms
                        {t.result.reply ? ` · ${t.result.reply}` : ""}
                      </div>
                    ) : (
                      <div className="model-cfg-test fail">✕ {t.result.error || "测试失败"}</div>
                    ))}
                </div>
              );
            })}
          </div>
        )}
        <button className="btn small" disabled={loading} onClick={addRow}>
          + 添加模型
        </button>
        <div className="modal-actions">
          <span className="good">{savedTip}</span>
          <button className="btn" onClick={onClose}>
            取消
          </button>
          <button className="btn primary" disabled={saving || loading} onClick={save}>
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
