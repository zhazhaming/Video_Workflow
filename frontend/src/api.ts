import type {
  AiTopic,
  BgmTrack,
  Briefing,
  BriefingComment,
  FlowAudioInfo,
  FlowGates,
  FlowState,
  HotDirection,
  HotItem,
  HotspotStatus,
  ModelInfo,
  MusicBoardInfo,
  MusicChartStatus,
  MusicItem,
  ProjectDetail,
  ProjectMeta,
  ProjectSettings,
  PromptTemplate,
  ResearchArticle,
  ResearchNode,
  ReviewReport,
  SavedTopic,
  DouyinStatus,
  PublishCopy,
  PublishPackage,
  SceneImages,
  ScriptDraft,
  StoryboardShot,
  StyleProposal,
  TaskStatus,
} from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!r.ok) {
    let detail = `${r.status}`;
    try {
      const data = await r.json();
      detail = data.detail ?? JSON.stringify(data);
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return r.json() as Promise<T>;
}

export const listProjects = () => request<ProjectMeta[]>("/api/projects");

export const createProject = (topic?: string) =>
  request<ProjectDetail>("/api/projects", {
    method: "POST",
    body: JSON.stringify(topic ? { topic } : {}),
  });

export const deleteProject = (pid: string) =>
  request<{ deleted: string; removed: string[] }>(`/api/projects/${pid}`, { method: "DELETE" });

export const getProject = (pid: string) => request<ProjectDetail>(`/api/projects/${pid}`);

export const saveScript = (pid: string, script: ScriptDraft) =>
  request<ProjectDetail>(`/api/projects/${pid}/script`, {
    method: "PUT",
    body: JSON.stringify({ script }),
  });

export const listModels = () =>
  request<{ models: ModelInfo[] }>("/api/scripts/models");

export const listPromptTemplates = () =>
  request<{ templates: PromptTemplate[] }>("/api/scripts/prompts");

export const generateScript = (
  topic: string,
  style: string,
  targetSeconds: number,
  modelId?: string,
  prompt?: string,
  signal?: AbortSignal
) =>
  request<ScriptDraft>("/api/scripts/generate", {
    method: "POST",
    signal,
    body: JSON.stringify({
      topic,
      style,
      target_seconds: targetSeconds,
      model_id: modelId || null,
      prompt: prompt || null,
    }),
  });

export const getProjectSettings = (pid: string) =>
  request<ProjectSettings>(`/api/projects/${pid}/settings`);

export const saveProjectSettings = (pid: string, settings: ProjectSettings) =>
  request<ProjectSettings>(`/api/projects/${pid}/settings`, {
    method: "PUT",
    body: JSON.stringify(settings),
  });

export const listBgm = () =>
  request<{ tracks: { name: string; file: string; bpm?: number }[] }>("/api/scripts/bgm");

// ---- BGM 曲库管理（选择 / 上传导入 / 本机路径导入 / 试听）----

export const listBgmTracks = () => request<{ tracks: BgmTrack[] }>("/api/bgm/tracks");

export const importBgmFile = async (file: File): Promise<BgmTrack> => {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch("/api/bgm/import", { method: "POST", body: fd });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.detail ?? `${r.status}`);
  }
  return r.json() as Promise<BgmTrack>;
};

export const importBgmPath = (path: string, name?: string) =>
  request<BgmTrack>("/api/bgm/import-path", {
    method: "POST",
    body: JSON.stringify({ path, name: name || null, tags: [] }),
  });

export const analyzeBgm = (name: string) =>
  request<{ name: string; bpm: number; beat_count: number }>(`/api/bgm/analyze/${encodeURIComponent(name)}`, {
    method: "POST",
  });

export const bgmAudioUrl = (name: string) =>
  `/api/bgm/audio/${encodeURIComponent(name)}?t=${Date.now()}`;

// ---- 在线免版权曲库（Openverse / Jamendo，结果自带许可证）----

export interface OnlineTrack {
  id: string;
  title: string;
  creator: string;
  duration: number;
  license: string;
  url: string;
  landing_url: string;
  provider: string;
}

export const searchOnlineBgm = (q: string, limit = 20) =>
  request<{ results: OnlineTrack[]; providers: Record<string, string | null> }>(
    `/api/bgm/online-search?q=${encodeURIComponent(q)}&limit=${limit}`
  );

export const importOnlineBgm = (t: OnlineTrack) =>
  request<BgmTrack>("/api/bgm/online-import", {
    method: "POST",
    body: JSON.stringify({
      url: t.url,
      name: null,
      title: t.title,
      creator: t.creator,
      license: t.license,
      provider: t.provider,
      landing_url: t.landing_url,
    }),
  });

export const ttsSampleUrl = (voice: string) =>
  `/api/scripts/tts-sample?voice=${encodeURIComponent(voice)}&t=${Date.now()}`;

export const optimizeScript = (script: ScriptDraft, instruction: string, modelId?: string) =>
  request<ScriptDraft>("/api/scripts/optimize", {
    method: "POST",
    body: JSON.stringify({ script, instruction, model_id: modelId || null }),
  });

export const startRender = (pid: string) =>
  request<{ task_id: string }>(`/api/projects/${pid}/render`, { method: "POST" });

export const getActiveTask = (pid: string) =>
  request<{ task: TaskStatus | null }>(`/api/projects/${pid}/task/active`);

export const getTask = (taskId: string) => request<TaskStatus>(`/api/tasks/${taskId}`);

export const videoUrl = (pid: string) => `/api/projects/${pid}/video?t=${Date.now()}`;

// ---- 自定义分镜图 ----

export interface ImageSlot {
  shot_index: number;
  custom: string | null;
  url: string | null;
}

export const listProjectImages = (pid: string) =>
  request<{ manual_dir: string; items: ImageSlot[] }>(`/api/projects/${pid}/images`);

export const uploadShotImage = async (pid: string, idx: number, file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch(`/api/projects/${pid}/images/${idx}`, { method: "POST", body: fd });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.detail ?? `${r.status}`);
  }
  return r.json() as Promise<ImageSlot>;
};

export const deleteShotImage = (pid: string, idx: number) =>
  request<ImageSlot>(`/api/projects/${pid}/images/${idx}`, { method: "DELETE" });

// ---- 分镜图片提示词（给豆包出图用）----

export const getImagePrompts = (pid: string) =>
  request<{ prompts: string[] }>(`/api/projects/${pid}/image-prompts`);

export const generateImagePrompts = (pid: string, modelId?: string) =>
  request<{ prompts: string[] }>(`/api/projects/${pid}/image-prompts`, {
    method: "POST",
    body: JSON.stringify({ model_id: modelId || null }),
  });

// ---- 热点雷达（媒体搜索引擎）----

export const hotspotStatus = () => request<HotspotStatus>("/api/hotspot/status");

export const hotspotItems = (params: {
  direction_id?: string;
  platform?: string;
  q?: string;
  sort?: string;
  limit?: number;
}) => {
  const usp = new URLSearchParams();
  if (params.direction_id) usp.set("direction_id", params.direction_id);
  if (params.platform) usp.set("platform", params.platform);
  if (params.q) usp.set("q", params.q);
  usp.set("sort", params.sort || "burst");
  usp.set("limit", String(params.limit ?? 100));
  return request<HotItem[]>(`/api/hotspot/items?${usp.toString()}`);
};

export const hotspotRefresh = (sources: string[] = []) =>
  request<{ refreshed_at: string; items: number }>(
    "/api/hotspot/refresh",
    { method: "POST", body: JSON.stringify({ sources }) }
  );

export const listDirections = () => request<HotDirection[]>("/api/hotspot/directions");

export const createDirection = (d: { name: string; keywords: string[]; exclude: string[] }) =>
  request<HotDirection>("/api/hotspot/directions", {
    method: "POST",
    body: JSON.stringify(d),
  });

export const updateDirection = (id: string, d: { name: string; keywords: string[]; exclude: string[] }) =>
  request<HotDirection>(`/api/hotspot/directions/${id}`, {
    method: "PUT",
    body: JSON.stringify(d),
  });

export const deleteDirection = (id: string) =>
  request<{ ok: boolean }>(`/api/hotspot/directions/${id}`, { method: "DELETE" });

export const generateAiTopics = (
  itemIds: string[],
  opts: { direction_id?: string; count?: number; model_id?: string } = {}
) =>
  request<{ topics: AiTopic[]; saved: SavedTopic[]; ref_counts: Record<string, number>; source_titles: string[] }>(
    "/api/hotspot/ai-topics",
    {
      method: "POST",
      body: JSON.stringify({
        item_ids: itemIds,
        direction_id: opts.direction_id || null,
        count: opts.count ?? 4,
        model_id: opts.model_id || null,
      }),
    }
  );

// ---- 今日选题工作台 ----

/** 早报每栏目展示条数（15 行，方便逐条筛选做内容）；与后端 BRIEF_TOP_N 保持一致 */
export const BRIEF_TOP_N = 15;

export const hotspotBriefing = (topN = BRIEF_TOP_N) =>
  request<Briefing>(`/api/hotspot/briefing?top_n=${topN}`);

export const aiBriefing = (topN = BRIEF_TOP_N, section: "hot" | "science" = "hot") =>
  request<Briefing & { comments: BriefingComment[] }>(
    `/api/hotspot/ai-briefing?top_n=${topN}&section=${section}`,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );

/** 工具栏目 AI 解读：GitHub 仓库标注职场受众/用途/提效点（后端按仓库缓存） */
export const aiTools = (modelId?: string | null) =>
  request<{ tools: Briefing["tools"]; classified: number }>("/api/hotspot/ai-tools", {
    method: "POST",
    body: JSON.stringify({ model_id: modelId || null }),
  });

export const listTopics = () => request<SavedTopic[]>("/api/hotspot/topics");

export const updateTopic = (id: string, patch: { status?: string; project_id?: string; note?: string }) =>
  request<SavedTopic>(`/api/hotspot/topics/${id}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });

/** 选题 → 视频制作简报（喂给 video-producer skill） */
export const topicBrief = (id: string) =>
  request<Record<string, unknown>>(`/api/hotspot/topics/${id}/brief`, { method: "POST", body: JSON.stringify({}) });

export const deleteTopic = (id: string) =>
  request<{ ok: boolean }>(`/api/hotspot/topics/${id}`, { method: "DELETE" });

export const clearTopics = (statuses: string[]) =>
  request<{ removed: number }>("/api/hotspot/topics/clear", {
    method: "POST",
    body: JSON.stringify({ statuses }),
  });

// ---- 热门歌曲（抖音热歌 / 音乐榜单聚合） ----

export const musicChartStatus = () => request<MusicChartStatus>("/api/music-chart/status");

export const musicChartBoards = () => request<MusicBoardInfo[]>("/api/music-chart/boards");

export const musicChartItems = (params: { board?: string; q?: string; sort?: string; limit?: number }) => {
  const usp = new URLSearchParams();
  if (params.board) usp.set("board", params.board);
  if (params.q) usp.set("q", params.q);
  usp.set("sort", params.sort || "rank");
  usp.set("limit", String(params.limit ?? 300));
  return request<MusicItem[]>(`/api/music-chart/items?${usp.toString()}`);
};

export const musicChartRefresh = (boards: string[] = []) =>
  request<{ refreshed_at: string; items: number }>(
    "/api/music-chart/refresh",
    { method: "POST", body: JSON.stringify({ boards }) }
  );

export const musicChartExportUrl = (board?: string) =>
  `/api/music-chart/export.csv${board ? `?board=${encodeURIComponent(board)}` : ""}`;

// 自定义策展榜（我的榜单）
export const createCustomBoard = (name: string, desc = "") =>
  request<{ id: string; name: string; desc: string }>("/api/music-chart/custom-boards", {
    method: "POST",
    body: JSON.stringify({ name, desc }),
  });

export const deleteCustomBoard = (id: string) =>
  request<{ ok: boolean }>(`/api/music-chart/custom-boards/${encodeURIComponent(id)}`, { method: "DELETE" });

export const addCustomItem = (
  id: string,
  item: { title: string; artist?: string; album?: string; cover?: string; url?: string; note?: string }
) =>
  request<{ board: { id: string; name: string }; added: boolean }>(
    `/api/music-chart/custom-boards/${encodeURIComponent(id)}/items`,
    { method: "POST", body: JSON.stringify(item) }
  );

export const removeCustomItem = (id: string, title: string, artist = "") =>
  request<{ ok: boolean }>(
    `/api/music-chart/custom-boards/${encodeURIComponent(id)}/items?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`,
    { method: "DELETE" }
  );

// ---------- 发布 ----------
export const getPublishPackage = (pid: string) =>
  request<PublishPackage>(`/api/projects/${pid}/publish/package`);

export const generatePublishCopy = (pid: string, platform: "douyin" | "xhs", modelId?: string | null) =>
  request<PublishCopy>(`/api/projects/${pid}/publish/copy`, {
    method: "POST",
    body: JSON.stringify({ platform, model_id: modelId ?? null }),
  });

export const getDouyinStatus = () =>
  request<DouyinStatus>("/api/publish/douyin/status");

export const getDouyinAuthorizeUrl = () =>
  request<{ url: string; state: string }>("/api/publish/douyin/authorize-url", { method: "POST" });

export const douyinExchange = (code: string) =>
  request<{ authorized: boolean; open_id: string }>("/api/publish/douyin/exchange", {
    method: "POST",
    body: JSON.stringify({ code }),
  });

export const publishDouyin = (
  pid: string,
  payload: { title: string; desc: string; tags: string[] }
) =>
  request<{ item_id: string; video_id: string }>(`/api/projects/${pid}/publish/douyin`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const publishCoverUrl = (pid: string) => `/api/projects/${pid}/publish/cover`;

// ---------- 六步视频流水线（flow） ----------

export const getFlowState = (pid: string) =>
  request<FlowState>(`/api/projects/${pid}/flow/state`);

export const getFlowResearch = (pid: string) =>
  request<ResearchArticle>(`/api/projects/${pid}/flow/research`);

export const saveFlowResearch = (pid: string, topic: string, nodes: ResearchNode[]) =>
  request<ResearchArticle>(`/api/projects/${pid}/flow/research`, {
    method: "PUT",
    body: JSON.stringify({ topic, nodes }),
  });

export const startFlowResearch = (pid: string, topic: string, modelId?: string) =>
  request<{ task_id: string }>(`/api/projects/${pid}/flow/research`, {
    method: "POST",
    body: JSON.stringify({ topic, model_id: modelId || null }),
  });

export const approveFlowResearch = (pid: string) =>
  request<{ gates: FlowGates }>(`/api/projects/${pid}/flow/research/approve`, { method: "POST" });

export const startFlowCopy = (pid: string, modelId?: string) =>
  request<{ task_id: string }>(`/api/projects/${pid}/flow/copy`, {
    method: "POST",
    body: JSON.stringify({ model_id: modelId || null }),
  });

export const approveFlowCopy = (pid: string) =>
  request<{ gates: FlowGates }>(`/api/projects/${pid}/flow/copy/approve`, { method: "POST" });

export const setFlowAudioMode = (pid: string, mode: "tts" | "custom" | "none") =>
  request<FlowState>(`/api/projects/${pid}/flow/audio-mode`, {
    method: "POST",
    body: JSON.stringify({ mode }),
  });

export const flowUploadAudio = async (
  pid: string,
  file: File,
  kind: "full" | "shot",
  index?: number
): Promise<FlowAudioInfo> => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("kind", kind);
  if (index != null) fd.append("index", String(index));
  const r = await fetch(`/api/projects/${pid}/flow/audio/upload`, { method: "POST", body: fd });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.detail ?? `${r.status}`);
  }
  return r.json() as Promise<FlowAudioInfo>;
};

export const deleteFlowAudio = (pid: string, kind: "full" | "shot", index?: number) =>
  request<FlowState>(`/api/projects/${pid}/flow/audio`, {
    method: "DELETE",
    body: JSON.stringify({ kind, index }),
  });

export const flowAudioUrl = (pid: string, path: string) =>
  `/api/projects/${pid}/flow/audio-file?path=${encodeURIComponent(path)}&t=${Date.now()}`;

export const getFlowImages = (pid: string) =>
  request<{ scenes: SceneImages[] }>(`/api/projects/${pid}/flow/images`);

export const startFlowImages = (pid: string, modelId?: string) =>
  request<{ task_id: string }>(`/api/projects/${pid}/flow/images/search`, {
    method: "POST",
    body: JSON.stringify({ model_id: modelId || null }),
  });

export const selectFlowImage = (pid: string, sceneIdx: number, candidateId?: string) =>
  request<{ scenes: SceneImages[] }>(`/api/projects/${pid}/flow/images/select`, {
    method: "POST",
    body: JSON.stringify({ scene_idx: sceneIdx, candidate_id: candidateId }),
  });

export const flowUploadSceneImage = async (pid: string, sceneIdx: number, file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("scene_idx", String(sceneIdx));
  const r = await fetch(`/api/projects/${pid}/flow/images/upload`, { method: "POST", body: fd });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.detail ?? `${r.status}`);
  }
  return r.json() as Promise<{ scenes: SceneImages[] }>;
};

export const approveFlowImages = (pid: string) =>
  request<{ gates: FlowGates }>(`/api/projects/${pid}/flow/images/approve`, { method: "POST" });

export const getFlowStyles = (pid: string) =>
  request<{ proposals: StyleProposal[]; chosen: number | null }>(
    `/api/projects/${pid}/flow/styles`
  );

export const startFlowStyles = (pid: string, modelId?: string) =>
  request<{ task_id: string }>(`/api/projects/${pid}/flow/styles`, {
    method: "POST",
    body: JSON.stringify({ model_id: modelId || null }),
  });

export const styleSampleUrl = (pid: string, i: number) =>
  `/api/projects/${pid}/flow/style-sample/${i}?t=${Date.now()}`;

export const selectFlowStyle = (pid: string, index: number) =>
  request<{ task_id: string }>(`/api/projects/${pid}/flow/styles/select`, {
    method: "POST",
    body: JSON.stringify({ index }),
  });

export const getFlowStoryboard = (pid: string) =>
  request<{ shot_count: number; shots: StoryboardShot[] }>(
    `/api/projects/${pid}/flow/storyboard`
  );

export const approveFlowStyles = (pid: string) =>
  request<{ gates: FlowGates }>(`/api/projects/${pid}/flow/styles/approve`, { method: "POST" });

export const getFlowReview = (pid: string) =>
  request<ReviewReport | null>(`/api/projects/${pid}/flow/review`);

export const startFlowReview = (pid: string, modelId?: string) =>
  request<{ task_id: string }>(`/api/projects/${pid}/flow/review`, {
    method: "POST",
    body: JSON.stringify({ model_id: modelId || null }),
  });

export const confirmFlowReview = (pid: string) =>
  request<{ gates: FlowGates }>(`/api/projects/${pid}/flow/review/confirm`, { method: "POST" });

export const startFlowPreview = (pid: string) =>
  request<{ task_id: string }>(`/api/projects/${pid}/flow/render/preview`, { method: "POST" });

export const flowPreviewUrl = (pid: string) =>
  `/api/projects/${pid}/flow/video-preview?t=${Date.now()}`;

export const approveFlowPreview = (pid: string) =>
  request<{ gates: FlowGates }>(`/api/projects/${pid}/flow/render/preview/approve`, {
    method: "POST",
  });

export const startFlowFull = (pid: string) =>
  request<{ task_id: string }>(`/api/projects/${pid}/flow/render/full`, { method: "POST" });
