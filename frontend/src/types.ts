export interface Line {
  text: string;
}

export interface Shot {
  year: string;
  label: string;
  colors: [string, string];
  lines: Line[];
}

export interface ScriptDraft {
  title: string;
  shots: Shot[];
}

export interface ProjectMeta {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  /** 列表页轻量统计（后端 list 填充） */
  shot_count?: number | null;
  line_count?: number | null;
  has_video?: boolean;
}

export interface ProjectDetail extends ProjectMeta {
  script: ScriptDraft;
}

export interface TaskStatus {
  id: string;
  project_id: string;
  stage: string;
  message: string;
  video_url: string | null;
  error: string | null;
  log_tail: string | null;
  started_at: string;
  finished_at: string | null;
  /** 任务类型（六步流水线）：research|copy|images|styles|storyboard|review|preview|full|render */
  kind?: string | null;
}

export interface ModelInfo {
  id: string;
  name: string;
  available: boolean;
  is_default: boolean;
}

/** 模型 API 配置（/api/models/config，设置弹窗编辑用） */
export interface ModelConfig {
  id: string;
  name: string;
  base_url: string;
  api_key: string;
  model: string;
  default: boolean;
  /** 附加请求头（如 opencode Go 的 x-opencode-session） */
  extra_headers: Record<string, string>;
  available: boolean;
}

/** 连通性测试结果（/api/models/test） */
export interface ModelTestResult {
  ok: boolean;
  latency_ms: number;
  reply?: string;
  error?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
}

export interface ProjectSettings {
  /** 建项目时的选题（第 1 步研究主题预填） */
  topic?: string;
  model_id: string | null;
  style: string;
  prompt: string;
  target_seconds: number;
  voice: string;
  tts_rate: string;
  bgm: string;
  /** AI 导演：渲染时由 AI 决定运镜/转场/调色/颗粒/BGM */
  ai_director?: boolean;
  gen_scenes?: boolean;
  /** 成片模板：datavideo=现有 DataVideo；motionshow=设计令牌驱动的 MotionShow */
  template?: "datavideo" | "motionshow";
}

/** 曲库条目（/api/bgm/tracks） */
export interface BgmTrack {
  name: string;
  file: string;
  title?: string;
  tags?: string[];
  duration?: number;
  bpm?: number;
  builtin?: boolean;
}

/** 页面当前执行状态（用于右侧流程面板） */
export type Activity = "idle" | "generating" | "optimizing" | "saving" | "prompting";

/** 热点雷达：单条热点（已归一化 + 趋势 + 第一波指数） */
export interface HotItem {
  id: string;
  platform: string;
  title: string;
  url: string;
  search_url: string;
  hot: number;
  raw_hot: string;
  rank: number;
  tag: string;
  summary: string;
  first_seen: string;
  last_seen: string;
  trend: "new" | "up" | "flat" | "down";
  trend_delta: number;
  /** 最近若干轮的归一化热度（含本轮），用于 sparkline */
  history: number[];
  burst: number;
  cross_platform: boolean;
  platforms: string[];
  direction_ids: string[];
  match_keywords: string[];
}

/** 自定义搜索方向（关键词规则） */
export interface HotDirection {
  id: string;
  name: string;
  keywords: string[];
  exclude: string[];
  enabled: boolean;
}

export interface HotspotStatus {
  last_refresh: string;
  last_error: string;
  refresh_minutes: number;
  item_count: number;
  sources: {
    platform: string;
    name: string;
    ok: boolean;
    count: number;
    error: string;
    fetched_at: string;
  }[];
  pending_platforms: { platform: string; name: string }[];
}

/** 早报 AI 点评（一条热点一条） */
export interface BriefingComment {
  ref: string;
  form: string;
  angle: string;
  risk: string;
}

/** 今日早报条目 */
export interface BriefingItem {
  id: string;
  title: string;
  platform: string;
  burst: number;
  trend: string;
  trend_delta: number;
  raw_hot: string;
  first_seen: string;
  cross: boolean;
  platforms: string[];
  search_url: string;
  reason: string;
  /** 科普栏目条目携带：命中的内置子话题 */
  subtopics?: string[];
}

/** 早报栏目条目：科普栏目复用热点字段；工具栏目额外携带仓库解读字段 */
export interface BriefingSectionItem extends BriefingItem {
  url?: string;
  summary?: string;
  /** 仓库描述的中文介绍（AI 解读缓存，可能为空——空则回退英文 summary） */
  summary_cn?: string;
  language?: string;
  stars?: string;
  audience?: string[];
  use?: string;
  why?: string;
  ai_done?: boolean;
}

/** 早报栏目（科普/工具） */
export interface BriefingSection {
  generated_at: string;
  total: number;
  items: BriefingSectionItem[];
  /** 科普栏目：子话题命中分布 */
  subtopics?: { name: string; count: number }[];
  /** 工具栏目：GitHub 源是否在线 */
  source_ok?: boolean;
}

export interface Briefing {
  generated_at: string;
  items: BriefingItem[];
  science?: BriefingSection;
  tools?: BriefingSection;
  stats: {
    total: number;
    fresh_24h: number;
    sources_ok: number;
    sources_total: number;
    avg_burst?: number;
    /** 与上一份快照的在榜重合率（%）；不足两轮快照时省略 */
    overlap_pct?: number;
    science_total?: number;
    tools_total?: number;
    directions?: { id: string; name: string; count: number }[];
    platforms?: { platform: string; name: string; count: number }[];
  };
}

/** AI 选题建议 */
export interface AiTopic {
  title: string;
  angle: string;
  hook: string;
  why?: string;
  ref?: string;
  column?: string;
  opening_number?: string;
  reject_reason?: string;
}

/** 落库的选题（今日选题工作台） */
export interface SavedTopic {
  id: string;
  title: string;
  angle: string;
  hook: string;
  why: string;
  ref: string;
  ref_platforms: string[];
  created_at: string;
  status: "todo" | "doing" | "done" | "dropped";
  project_id: string;
  note: string;
  column?: string;
  opening_number?: string;
  reject_reason?: string;
}

export const STAGE_LABEL: Record<string, string> = {
  queued: "排队中",
  voice: "配音",
  images: "生成画面中",
  directing: "AI 导演编排中",
  rendering: "Remotion 渲染中",
  done: "完成",
  error: "失败",
  // 六步流水线阶段
  search: "搜索",
  compose: "编排",
  imagery: "找图",
  styling: "定样式",
  storyboard: "写分镜",
  review: "审查",
  props: "组装",
  bgm: "配乐",
};

// ---------- 六步视频流水线（flow） ----------

export type FlowAudioMode = "tts" | "custom" | "none";

/** 自定义配音信息（整段口播或分幕） */
export interface FlowAudioInfo {
  file: string;
  duration: number;
}

/** 流水线阶段闸门：true = 该步已确认，可进入下一步 */
export interface FlowGates {
  research: boolean;
  copy: boolean;
  images: boolean;
  styles: boolean;
  review: boolean;
  preview: boolean;
}

/** GET /flow/state：流水线总状态 */
export interface FlowState {
  pid: string;
  step: number;
  audio_mode: FlowAudioMode;
  custom_audio: {
    full?: FlowAudioInfo;
    shots?: Record<string, FlowAudioInfo>;
  };
  gates: FlowGates;
  /** 研究主题（research.json 优先，其次建项目时存的选题） */
  topic?: string;
  script_title: string;
  shot_count: number;
  line_count: number;
  has_preview: boolean;
  has_video: boolean;
}

/** 步骤 1：资料节点 */
export interface ResearchSource {
  title: string;
  url: string;
}

export interface ResearchNode {
  year: string;
  title: string;
  what: string;
  why: string;
  sources: ResearchSource[];
}

export interface ResearchArticle {
  topic: string;
  nodes: ResearchNode[];
  generated_at?: string | null;
}

/** 步骤 3：候选图片 */
export interface ImageCandidate {
  id: string;
  provider: string;
  title: string;
  creator: string;
  license: string;
  page_url: string;
  thumb_url: string;
  image_url: string;
  width: number;
  height: number;
}

export interface SceneImages {
  index: number;
  query_en: string;
  query_zh: string;
  note: string;
  candidates: ImageCandidate[];
  selected: string | null;
  custom_file: string | null;
  downloaded: boolean;
  error?: string;
  /** AI 生图（ComfyUI）：中文提示词 / 英文译文 / 单幕错误 */
  prompt_cn?: string;
  prompt_en_ai?: string;
  ai_error?: string;
}

/** ComfyUI 服务状态（/api/comfy/status） */
export interface ComfyStatus {
  reachable: boolean;
  reason?: string;
  url?: string;
  gpu?: string;
  version?: string;
  checkpoints?: string[];
  checkpoint?: string;
}

/** 步骤 4：风格提案（look 为渲染端样式参数，前端仅展示文字） */
export interface StyleProposal {
  name: string;
  why: string;
  kicker: string;
  look: Record<string, unknown>;
}

export interface StoryboardShot {
  index: number;
  label: string;
  year: string;
  camera: string;
  transition: string;
  scene: string;
  overlay: string;
  has_image: boolean;
}

/** 步骤 5：审查报告 */
export interface ReviewIssue {
  severity: "high" | "medium" | "low";
  where: string;
  problem: string;
  suggestion: string;
}

export interface ReviewReport {
  passed: boolean;
  off_topic: string[];
  issues: ReviewIssue[];
  summary: string;
  generated_at: string;
}

// ---------- 发布 ----------
export interface PublishCopy {
  title: string;
  desc: string;
  tags: string[];
}

export interface PublishPackage {
  has_video: boolean;
  video_url: string | null;
  cover_url: string | null;
  cover_v_url?: string | null;
  cover_h_url?: string | null;
  copies: { douyin?: PublishCopy; xhs?: PublishCopy };
  upload_pages: { douyin: string; xhs: string };
}

export interface DouyinStatus {
  configured: boolean;
  authorized: boolean;
}

// ---------- 发布中心（创作者中心自动化：扫码登录 + 预约发布） ----------
export type PublishTaskStatus =
  | "scheduled"
  | "uploading"
  | "published"
  | "failed"
  | "overdue"
  | "cancelled";

export interface PublishTask {
  id: string;
  pid: string;
  platform: string;
  title: string;
  desc: string;
  tags: string[];
  collection: string;
  declarations: string[];
  scheduled_at: string;
  status: PublishTaskStatus;
  created_at: string;
  published_at: string;
  item_id: string;
  error: string;
  warnings: string[];
  attempts: number;
  last_message: string;
  source_task_id: string;
  history: { at: string; action: string; note: string }[];
  project_title?: string;
}

export interface PublishAccount {
  logged_in: boolean;
  message: string;
  saved_at?: number;
  age_days?: number;
}

export interface PublishCenterOverview {
  account: PublishAccount;
  tasks: PublishTask[];
  defaults: { collection: string; declarations: string[] };
}

export interface PublishTaskCreateInput {
  pid: string;
  title: string;
  /** "YYYY-MM-DD HH:MM:SS"；空 = 立即发布 */
  scheduled_at?: string | null;
  desc?: string;
  tags?: string[];
  /** null = 用全局默认；"" = 不设合集 */
  collection?: string | null;
  declarations?: string[] | null;
}

export interface PublishTaskUpdateInput {
  title?: string;
  desc?: string;
  tags?: string[];
  collection?: string;
  declarations?: string[];
  scheduled_at?: string;
}

export type PublishTaskAction = "publish-now" | "retry" | "cancel" | "republish";

export interface CreatorLoginPoll {
  state: "idle" | "waiting" | "success" | "expired" | "ok" | "already_logged_in";
  message?: string;
}

// ---------- 热门歌曲（抖音热歌 / 音乐榜单聚合） ----------

/** 单个榜单元信息（/api/music-chart/boards） */
export interface MusicBoardInfo {
  id: string;
  name: string;
  /** 抖音 | 实时 | 流派 */
  group: string;
  desc: string;
  source: string;
  /** 榜单期号（周榜 2026_44 / 日榜日期） */
  period: string;
  /** 榜单数据自身的更新时间 */
  update_time: string;
  update_tips: string;
  intro: string;
  listen_num: number;
  count: number;
  ok: boolean;
  error: string;
  fetched_at: string;
}

/** 单首在榜歌曲（已含跨轮名次趋势） */
export interface MusicItem {
  id: string;
  board: string;
  rank: number;
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover: string;
  url: string;
  search_url: string;
  raw_hot: string;
  hot: number;
  first_seen: string;
  last_seen: string;
  trend: "new" | "up" | "flat" | "down";
  /** 与上轮相比的名次变化（正=上升） */
  rank_diff: number;
  history: number[];
  /** 合成榜（最热BGM榜）专用：命中的来源榜 id 列表 */
  from_boards?: string[];
}

export interface MusicChartStatus {
  last_refresh: string;
  last_error: string;
  refresh_minutes: number;
  board_count: number;
  song_count: number;
  boards_ok: number;
}

// ---- 每日一家公司（系列档期板）----

export interface CompanyProfile {
  id: string;
  name: string;
  name_en: string;
  country: string;
  region: "国内" | "海外";
  track: string;
  sector: string;
  founded: number;
  founder: string;
  hq: string;
  one_liner: string;
  hook: string;
  tags: string[];
}

export interface CompanyDraftBeat {
  label: string;
  sec: string;
  text: string;
}

export interface CompanyDraft {
  title: string;
  angle: string;
  beats: CompanyDraftBeat[];
  cta: string;
  notes: string;
}

export interface CompanyPlanEntry {
  date: string;
  weekday: string;
  is_today: boolean;
  status: "empty" | "planned" | "scheduled" | "producing" | "done" | "partial" | "failed";
  status_label: string;
  company: CompanyProfile | null;
  draft: CompanyDraft | null;
  suggestion?: CompanyProfile | null;
  run_id: string | null;
  run_status: string | null;
  pid: string | null;
  produce_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CompanyPlan {
  today: string;
  days: number;
  entries: CompanyPlanEntry[];
}

export interface CompanyPool {
  companies: CompanyProfile[];
  tracks: string[];
  countries: string[];
  updated_at: string;
  count: number;
}

// ---- 视频流水线（每日热点自动出片）----

export interface PipelineTheme {
  name: string;
  keywords: string[];
}

export interface PipelineCandidate {
  title: string;
  platform: string;
  platform_name: string;
  tag: string;
  summary: string;
  hot: number;
  burst: number;
  url: string;
  theme_name: string;
  column?: string;
  opening_number?: string;
  reject_reason?: string;
}

export interface PipelineConfirmInfo {
  indices: number[];
  source: "user" | "default";
  at: string;
}

export interface PipelineVideo {
  index: number;
  pid: string;
  topic_title: string;
  platform: string;
  hot: number;
  burst: number;
  theme_name?: string;
  status: "pending" | "running" | "done" | "failed";
  started_at: string | null;
  finished_at: string | null;
  exit_code: number | null;
  title: string | null;
  duration_seconds: number | null;
  final_text: string;
  error: string;
  log: string;
  /** 后端注入：成片是否已存在 */
  has_video?: boolean;
}

export interface PipelineRun {
  id: string;
  trigger: "auto" | "manual";
  /** company = 每日一家公司档期批次（用户选定，无需候选确认） */
  kind?: "company" | string;
  company_date?: string;
  started_at: string;
  finished_at: string | null;
  status: "awaiting_confirm" | "scheduled" | "running" | "done" | "partial" | "failed" | "skipped";
  target_seconds: number;
  /** 候选确认（awaiting_confirm 阶段有效） */
  count?: number;
  candidates?: PipelineCandidate[];
  default_plan?: number[];
  confirm_deadline?: string;
  /** 已排产：预计制作时刻 */
  produce_at?: string;
  notify?: { ok: boolean; error: string };
  confirmed?: PipelineConfirmInfo | null;
  error?: string;
  videos: PipelineVideo[];
}

export interface PipelineStatus extends Record<string, unknown> {
  enabled: boolean;
  hour: number;
  minute: number;
  count: number;
  target_seconds: number;
  exclude_platforms: string[];
  agent_cmd: string;
  agent_profile: string;
  agent_timeout: number;
  agent_available: boolean;
  running: boolean;
  awaiting_run_id: string | null;
  current_run_id: string | null;
  /** v3：中午推送 / 凌晨排产制作 */
  push_hour: number;
  push_minute: number;
  produce_hour: number;
  produce_minute: number;
  next_push_at: string;
  next_produce_at: string;
  last_run: {
    id: string;
    trigger: string;
    status: string;
    started_at: string | null;
    finished_at: string | null;
    done: number;
    total: number;
  } | null;
  next_run_at: string;
  feishu_webhook: string;
  feishu_secret: string;
  page_url: string;
  themes: PipelineTheme[];
  style_prompt: string;
  min_brightness: number;
}

export interface PipelineConfigUpdate {
  enabled?: boolean;
  hour?: number;
  minute?: number;
  count?: number;
  target_seconds?: number;
  exclude_platforms?: string[];
  agent_cmd?: string;
  agent_profile?: string;
  agent_timeout?: number;
  push_hour?: number;
  push_minute?: number;
  produce_hour?: number;
  produce_minute?: number;
  theme_search_fill?: boolean;
  feishu_webhook?: string;
  feishu_secret?: string;
  page_url?: string;
  themes?: PipelineTheme[];
  style_prompt?: string;
  min_brightness?: number;
}

// ---- 视频流水线 v2：主题 / 候选确认 / 飞书 ----

export interface PipelineTheme {
  name: string;
  keywords: string[];
}

export interface PipelineCandidate {
  title: string;
  platform: string;
  platform_name: string;
  tag: string;
  summary: string;
  hot: number;
  burst: number;
  url: string;
  theme_name: string;
  column?: string;
  opening_number?: string;
  reject_reason?: string;
}

export interface PipelineConfirmInfo {
  indices: number[];
  source: "user" | "default";
  at: string;
}
