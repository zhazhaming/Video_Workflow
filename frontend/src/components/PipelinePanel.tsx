import { STAGE_LABEL, type Activity, type TaskStatus } from "../types";

interface Props {
  activity: Activity;
  task: TaskStatus | null;
  dirty: boolean;
  shotCount: number;
  promptCount: number;
}

type StepState = "done" | "active" | "pending" | "error";

const RENDER_ORDER = ["queued", "voice", "images", "directing", "rendering", "done"];

const ACTIVITY_LABEL: Record<Activity, string> = {
  idle: "空闲",
  generating: "AI 生成脚本中",
  saving: "保存中",
  prompting: "生成图片提示词中",
  optimizing: "AI 优化脚本中",
};

export const PipelinePanel: React.FC<Props> = ({
  activity,
  task,
  dirty,
  shotCount,
  promptCount,
}) => {
  const stage = task?.stage ?? "";
  const cur = RENDER_ORDER.indexOf(stage);

  const renderStep = (target: string): StepState => {
    if (stage === "error") return "error";
    const t = RENDER_ORDER.indexOf(target);
    if (cur === -1) return "pending";
    if (cur === t) return "active";
    return cur > t ? "done" : "pending";
  };

  const steps: { label: string; state: StepState; detail?: string }[] = [
    {
      label: "AI 生成脚本",
      state: activity === "generating" ? "active" : shotCount > 0 ? "done" : "pending",
      detail:
        activity === "generating" ? "生成中，可点击「停止生成」中断" : shotCount > 0 ? `${shotCount} 个分镜` : undefined,
    },
    {
      label: "保存落库",
      state: activity === "saving" ? "active" : dirty ? "pending" : shotCount > 0 ? "done" : "pending",
      detail: activity === "saving" ? "保存中..." : dirty ? "有未保存修改" : undefined,
    },
    {
      label: "图片提示词",
      state: activity === "prompting" ? "active" : promptCount > 0 ? "done" : "pending",
      detail:
        activity === "prompting"
          ? "生成中..."
          : promptCount > 0
            ? `已生成 ${promptCount} 条`
            : "可选，用于豆包出图",
    },
    { label: "配音", state: renderStep("voice"), detail: stage === "voice" ? task?.message : undefined },
    { label: "画面素材", state: renderStep("images"), detail: stage === "images" ? task?.message : undefined },
    { label: "AI 导演", state: renderStep("directing"), detail: stage === "directing" ? task?.message : undefined },
    { label: "渲染视频", state: renderStep("rendering"), detail: stage === "rendering" ? task?.message : undefined },
    { label: "完成", state: stage === "done" ? "done" : stage === "error" ? "error" : "pending" },
  ];

  return (
    <div className="panel">
      <h3>执行流程</h3>
      <div className="pipeline">
        {steps.map((s, i) => (
          <div className={`step ${s.state}`} key={i}>
            <span className="step-dot" />
            <div className="step-body">
              <div className="step-label">{s.label}</div>
              {s.detail && <div className="step-detail">{s.detail}</div>}
            </div>
          </div>
        ))}
      </div>
      {task?.error && <div className="error">{task.error}</div>}
      <p className="hint">
        当前：
        {activity !== "idle"
          ? ACTIVITY_LABEL[activity]
          : stage
            ? (STAGE_LABEL[stage] ?? stage)
            : "空闲"}
      </p>
    </div>
  );
};
