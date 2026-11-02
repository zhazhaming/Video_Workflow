# -*- coding: utf-8 -*-
"""Pydantic 数据模型：脚本草稿、渲染数据、项目与任务。"""
from datetime import datetime, timezone
from typing import Annotated, Optional

from pydantic import AliasGenerator, BeforeValidator, BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


def _line_from_str(v):
    """LLM 常把 lines 返回成纯字符串数组，自动包装成 {"text": ...}。"""
    if isinstance(v, str):
        return {"text": v}
    return v


class Line(BaseModel):
    text: str = Field(min_length=1, max_length=300)


LineLike = Annotated[Line, BeforeValidator(_line_from_str)]


class Shot(BaseModel):
    year: str = Field(default="", max_length=16)
    label: str = Field(default="", max_length=40)
    colors: tuple[str, str] = ("#1a1a2e", "#16213e")
    lines: list[LineLike] = Field(min_length=1, max_length=8)


class ScriptDraft(BaseModel):
    title: str = Field(min_length=1, max_length=60)
    shots: list[Shot] = Field(min_length=1, max_length=40)


class GenRequest(BaseModel):
    topic: str = Field(min_length=2, max_length=800)
    style: str = Field(default="故事向竖屏短视频，第一人称，口语化，开头有钩子，结尾有互动引导", max_length=500)
    target_seconds: int = Field(default=60, ge=15, le=240)
    model_id: Optional[str] = None  # models.json 里的模型 id；空则用默认
    prompt: Optional[str] = Field(default=None, max_length=4000)  # 脚本生成提示词指引（模板或自定义）


class OptimizeRequest(BaseModel):
    script: ScriptDraft
    instruction: str = Field(min_length=1, max_length=800)
    model_id: Optional[str] = None


# ---- 渲染阶段（配音后生成，含实测时长与素材路径）----
# 这三个模型直接喂给 Remotion（TS 端），序列化时输出 camelCase（durationSec 等）。


class _CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class TimedLine(_CamelModel):
    id: str
    text: str
    duration_sec: float
    audio: Optional[str] = None  # 相对 public/ 的路径
    pause_after: float = 0.35  # 本句结束后的停顿（秒），按标点自适应
    emphasis: Optional[list[str]] = None  # 本句强调关键词（金色高亮；缺省走数字/引语自动识别）


class GradeSpec(_CamelModel):
    """单镜调色参数（AI 导演可覆盖，None 用模板默认）。"""

    contrast: Optional[float] = None
    saturate: Optional[float] = None
    brightness: Optional[float] = None
    tint_opacity: Optional[float] = None


class OverlaySpec(_CamelModel):
    """逐镜动效浮层，与 Remotion 端 DVOverlay 严格对齐（kind 决定哪些字段有效）。"""

    kind: str  # counter|typewriter|chat|stat|toast|terminal
    value: Optional[float] = None  # counter
    label: Optional[str] = None  # counter/stat
    unit: Optional[str] = None  # counter/stat
    text: Optional[str] = None  # typewriter/chat/toast
    side: Optional[str] = None  # chat: left|right
    name: Optional[str] = None  # chat 说话人
    stat_from: Optional[float] = Field(default=None, alias="from")  # stat 起始值（显式别名覆盖 to_camel）
    stat_to: Optional[float] = Field(default=None, alias="to")  # stat 目标值
    tone: Optional[str] = None  # toast: error|info|success
    lines: Optional[list[str]] = None  # terminal 逐行文本


class AtmosphereSpec(_CamelModel):
    """氛围粒子层（与 Remotion 端 DVAtmosphere 对齐）。"""

    kind: str  # none|stars|rain|dust|embers
    opacity: Optional[float] = None  # 0~1


class SceneSpec(_CamelModel):
    """代码绘制动画场景（与 Remotion 端 dv/scenes.tsx 的 DVScene 对齐）。"""

    kind: str  # nebula|accretion|impact|moonform|solar|ocean|volcano|ice|meteor|life|city
    palette: Optional[tuple[str, str]] = None  # 场景主色
    accent: Optional[str] = None  # 发光强调色
    speed: Optional[float] = None  # 动画速度倍率 0.5~2


class TypeSpec(_CamelModel):
    """字体族（设计令牌）：名称需与 Remotion 端 system/fonts.ts 注册的一致。"""

    display: Optional[str] = None
    body: Optional[str] = None
    mono: Optional[str] = None


class GridSpec(_CamelModel):
    """版式网格（9:16 安全区）。"""

    margin: Optional[int] = None  # 左右安全边距 px
    columns: Optional[int] = None  # 栏数
    baseline: Optional[int] = None  # 基线网格 px


class TextureSpec(_CamelModel):
    """材质层强度 0~1（纸纹/网点/颗粒）。"""

    grain: Optional[float] = None
    paper: Optional[float] = None
    halftone: Optional[float] = None
    vignette: Optional[float] = None


class MotionSpec(_CamelModel):
    """动效节奏令牌。"""

    tempo: Optional[float] = None  # 0.5~2
    easing: Optional[str] = None  # editorial|snappy|soft|linear
    stagger: Optional[int] = None  # 逐字/逐行错帧数


class Scene3DSpec(_CamelModel):
    """3D 图层（Phase 3；未实现时渲染端忽略）。"""

    kind: Optional[str] = None  # type-orbit|grid-field|card-stack|orbit-object|none
    intensity: Optional[float] = None  # 0~1


class LookSpec(_CamelModel):
    """全局视觉风格（AI 导演"风格圣经"的 props 载体）。"""

    accent: Optional[str] = None  # 强调色 hex
    palette: Optional[tuple[str, str]] = None  # 全局色调 [背景, 次色]
    vignette: Optional[float] = None  # 暗角强度倍率 0~1.5
    subtitle_style: Optional[str] = None  # bold|pill
    bg: Optional[str] = None  # dark|paper（paper=浅色纸感，默认）
    atmosphere: Optional[AtmosphereSpec] = None  # 全片默认氛围层
    # ---- 设计令牌 v2（缺省时渲染端用 preset 推导）----
    preset: Optional[str] = None  # paper|editorial|cinema|graphic|dark
    mode: Optional[str] = None  # light|dark
    ink: Optional[str] = None  # 正文字色
    support: Optional[str] = None  # 辅助色
    type: Optional[TypeSpec] = None
    grid: Optional[GridSpec] = None
    texture: Optional[TextureSpec] = None
    motion: Optional[MotionSpec] = None


class NarrationAudioSpec(_CamelModel):
    """顶层整段旁白音频（六步流程"自带配音-整段口播"模式）。"""

    src: str  # 相对 public/ 的路径
    volume: float = 1.0


class ToolSpec(_CamelModel):
    """开源工具卡片（MotionShow tools 版式）。stars 为制作时的 GitHub 快照。"""

    index: int = Field(ge=1, le=99)
    name: str = Field(min_length=1, max_length=40)
    repo: str = Field(min_length=1, max_length=80)
    stars: int = Field(ge=0)
    license: str = Field(default="开源", max_length=24)
    category: str = Field(default="", max_length=24)
    tagline: str = Field(min_length=1, max_length=80)
    platform: str = Field(default="", max_length=40)
    icon: str = Field(default="spark", max_length=24)


class MarketMeta(_CamelModel):
    """行情数据来源与口径说明。"""

    start: str
    end: str
    source: str = "Yahoo Finance"
    note: str = "月末收盘，价格指数，不含股息"


class MarketPoint(_CamelModel):
    """单月收盘；sse_n / spx_n 为 2006-01 起点 = 100 的归一化值。"""

    date: str
    sse: float
    spx: float
    sse_n: float
    spx_n: float


class MarketAnnual(_CamelModel):
    year: int
    sse_ret: float
    spx_ret: float


class MarketEvent(_CamelModel):
    """可引用的关键事件；百分比与极值均来自同一份行情快照。"""

    id: str = Field(min_length=1, max_length=24)
    year: int
    date: str
    title: str = Field(min_length=1, max_length=40)
    short: str = Field(min_length=1, max_length=12)
    cause: str = Field(min_length=1, max_length=120)
    sse: str = Field(min_length=1, max_length=24)
    spx: str = Field(min_length=1, max_length=24)
    sse_detail: str = Field(default="", max_length=48)
    spx_detail: str = Field(default="", max_length=48)
    note: str = Field(default="", max_length=60)


class MarketMarker(_CamelModel):
    year: int
    text: str = Field(min_length=1, max_length=12)
    side: str = Field(default="up", pattern="^(up|down)$")


class MarketShot(_CamelModel):
    """单镜行情图配置：overview=20 年全程，zoom=事件窗口，finale=总结。"""

    mode: str = Field(pattern="^(overview|zoom|finale)$")
    start: Optional[str] = None
    end: Optional[str] = None
    event_id: Optional[str] = None
    markers: Optional[list[MarketMarker]] = None
    kicker: Optional[str] = None
    title: Optional[str] = None
    takeaway: Optional[str] = None


class MarketData(_CamelModel):
    meta: MarketMeta
    points: list[MarketPoint]
    annual: list[MarketAnnual]
    events: list[MarketEvent]


class RenderShot(_CamelModel):
    year: str = ""
    label: str = ""
    image: Optional[str] = None  # 相对 public/ 的路径
    audio: Optional[str] = None  # 本镜整段配音（自带配音-分幕模式），相对 public/
    colors: tuple[str, str] = ("#1a1a2e", "#16213e")
    lines: list[TimedLine]
    tail: float = 0.6
    duration_sec: Optional[float] = Field(default=None, ge=0.5, le=30)  # 卡点用的镜长下限
    # ---- AI 导演参数（缺省时模板用内置规则）----
    camera: Optional[str] = None  # push|pull|pan_left|pan_right|tilt_up|tilt_down|diag_in|diag_out|dolly_zoom|handheld|still
    cam_intensity: Optional[float] = None  # 运镜幅度倍率 0.6~1.6
    enter_transition: Optional[str] = None  # dissolve|whip|zoom|flash|cut|glitch|slide
    camera_per_line: Optional[list[str]] = None  # 逐句运镜（下标对齐 lines）
    grade: Optional[GradeSpec] = None
    grain_opacity: Optional[float] = None  # 全片颗粒由 props 顶层控制；此字段保留逐镜扩展位
    overlay: Optional[OverlaySpec] = None  # 本镜动效浮层
    sfx_moment: Optional[str] = None  # impact|riser|whoosh 高潮点音效
    atmosphere: Optional[AtmosphereSpec] = None  # 本镜氛围层（覆盖 look.atmosphere）
    scene: Optional[SceneSpec] = None  # 代码绘制动画场景（优先于 image）
    # ---- 版式系统 v2（MotionShow；缺省时按镜头内容推导）----
    layout: Optional[str] = None  # cover|statement|quote|list|data|photo-full|photo-inset|comparison|caption-bottom|chapter
    align: Optional[str] = None  # left|center|right（默认 left）
    focal: Optional[tuple[float, float]] = None  # 图片焦点 0~1
    text_style: Optional[str] = None  # display|body|mono
    scene3d: Optional[Scene3DSpec] = None
    tool: Optional[ToolSpec] = None  # 开源工具卡片（MotionShow tools 版式）
    market: Optional[MarketShot] = None  # 行情图单镜配置（MotionShow market 版式）


class BgmSpec(_CamelModel):
    src: str  # 相对 public/ 的路径，如 "bgm/warm_piano.mp3"
    volume: float = 0.75
    bpm: float = 0.0
    beats: list[float] = []  # 节拍时间点（秒），用于卡点切镜


class RenderProps(_CamelModel):
    title: str
    shots: list[RenderShot]
    bgm: Optional[BgmSpec] = None
    title_card: bool = True  # 开场标题序列
    grain_opacity: Optional[float] = None  # 全片胶片颗粒强度（AI 导演可控）
    look: Optional[LookSpec] = None  # 全局视觉风格
    kicker: Optional[str] = None  # 开场标题上方小字
    sfx: Optional[bool] = None  # 转场/高潮音效开关（缺省 true）
    narration_audio: Optional[NarrationAudioSpec] = None  # 整段口播旁白（自带配音模式）
    market: Optional[MarketData] = None  # 行情图全局数据（MotionShow market 版式）

    def to_props_json(self) -> str:
        """写给 Remotion --props 的 JSON（camelCase）。"""
        return self.model_dump_json(by_alias=True, indent=1, exclude_none=True)


# ---- 项目与任务 ----

class ProjectMeta(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    # 列表页展示用的轻量统计（list_projects 填充，其余接口可为空）
    shot_count: Optional[int] = None
    line_count: Optional[int] = None
    has_video: bool = False


class ProjectDetail(ProjectMeta):
    script: ScriptDraft


class ProjectCreate(BaseModel):
    script: Optional[ScriptDraft] = None
    topic: Optional[str] = Field(default=None, max_length=200)


class ScriptUpdate(BaseModel):
    script: ScriptDraft


class ImagePromptRequest(BaseModel):
    model_id: Optional[str] = None


class ProjectSettings(BaseModel):
    """项目级 AI 设置（落库保存，打开项目时恢复）。"""

    topic: str = Field(default="", max_length=200)  # 建项目时的选题，第 1 步研究主题预填
    model_id: Optional[str] = None
    style: str = Field(
        default="故事向竖屏短视频，第一人称，口语化，开头有钩子，结尾有互动引导",
        max_length=500,
    )
    prompt: str = Field(default="", max_length=4000)
    target_seconds: int = Field(default=180, ge=15, le=240)
    voice: str = "zh-CN-YunxiNeural"
    tts_rate: str = "+6%"
    bgm: str = "auto"  # public/bgm 下的文件名（不含扩展名）；"auto"=按剧情自动匹配；空串=无 BGM
    # 成片模板：datavideo=现有 DataVideo；motionshow=设计令牌驱动的 MotionShow
    template: str = "datavideo"
    ai_director: bool = True  # AI 导演：渲染时由 AI 决定运镜/转场/调色/颗粒/BGM（失败自动回退固定规则）
    gen_scenes: bool = False  # 六步流程第4步：分镜后由本地 coding agent 现场编写 3~5 个定制场景（慢，失败回退内置词库）


class TaskStatus(BaseModel):
    id: str
    project_id: str
    stage: str  # queued | voice | images | directing | rendering | done | error | 六步流程的自由 stage
    kind: Optional[str] = None  # render | research | copy | images | styles | storyboard | review | preview | full
    message: str = ""
    video_url: Optional[str] = None
    error: Optional[str] = None
    log_tail: Optional[str] = None
    started_at: str = ""
    finished_at: Optional[str] = None


def now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d %H:%M:%S")
