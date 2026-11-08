import { useState } from "react";
import { accessLogin, setToken } from "../api";

/** 远程访问锁屏：输入访问口令（.env 的 ACCESS_TOKEN），通过后进入应用 */
export const AccessGate = ({ onOk }: { onOk: () => void }) => {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!value.trim()) return;
    setBusy(true);
    setErr("");
    try {
      await accessLogin(value.trim());
      setToken(value.trim());
      onOk();
    } catch (e) {
      setErr((e as Error).message || "口令错误");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="gate-mask">
      <div className="gate-card">
        <h3>🔒 视频流水线</h3>
        <p className="muted">请输入访问口令（backend/.env 的 ACCESS_TOKEN）</p>
        <input
          type="password"
          autoFocus
          placeholder="访问口令"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        {err && <div className="bad">{err}</div>}
        <button className="btn primary wide" disabled={busy || !value.trim()} onClick={submit}>
          {busy ? "校验中…" : "进入"}
        </button>
      </div>
    </div>
  );
};
