# -*- coding: utf-8 -*-
"""全局配置：路径与环境变量。"""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BACKEND_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = Path(os.getenv("STORAGE_DIR") or (BACKEND_DIR / "storage"))
PROJECTS_DIR = STORAGE_DIR / "projects"
RENDERS_DIR = STORAGE_DIR / "renders"

# 热点雷达（媒体搜索引擎）：抓取快照、状态、自定义搜索方向
HOTSPOT_DIR = Path(os.getenv("HOTSPOT_DIR") or (STORAGE_DIR / "hotspot"))
HOTSPOT_SNAPSHOTS_DIR = HOTSPOT_DIR / "snapshots"
# 自动抓取间隔（分钟），最小 5，对源保持礼貌
HOTSPOT_REFRESH_MINUTES = max(5, int(os.getenv("HOTSPOT_REFRESH_MINUTES", "10")))
HOTSPOT_TIMEOUT_SECONDS = int(os.getenv("HOTSPOT_TIMEOUT_SECONDS", "12"))
HOTSPOT_SNAPSHOT_KEEP_HOURS = int(os.getenv("HOTSPOT_SNAPSHOT_KEEP_HOURS", "72"))

# 热门歌曲（抖音热歌 / 音乐榜单聚合）：榜单快照与状态
MUSIC_CHART_DIR = Path(os.getenv("MUSIC_CHART_DIR") or (STORAGE_DIR / "music_chart"))
MUSIC_CHART_SNAPSHOTS_DIR = MUSIC_CHART_DIR / "snapshots"
# 榜单本身日更/周更，抓取间隔无需太密（最小 10 分钟，对源保持礼貌）
MUSIC_CHART_REFRESH_MINUTES = max(10, int(os.getenv("MUSIC_CHART_REFRESH_MINUTES", "30")))
MUSIC_CHART_TIMEOUT_SECONDS = int(os.getenv("MUSIC_CHART_TIMEOUT_SECONDS", "12"))
MUSIC_CHART_SNAPSHOT_KEEP_HOURS = int(os.getenv("MUSIC_CHART_SNAPSHOT_KEEP_HOURS", "336"))

# 视频流水线（每日热点自动出片）：配置/运行记录/状态与 agent 日志
PIPELINE_DIR = Path(os.getenv("PIPELINE_DIR") or (STORAGE_DIR / "pipeline"))
PIPELINE_RUNS_DIR = PIPELINE_DIR / "runs"
PIPELINE_LOGS_DIR = PIPELINE_DIR / "logs"
# 每天 HH:MM 自动跑一批；count=每批条数；target_seconds=单条目标时长
DAILY_PIPELINE_ENABLED = os.getenv("DAILY_PIPELINE_ENABLED", "1") not in ("0", "false", "no")
DAILY_PIPELINE_HOUR = int(os.getenv("DAILY_PIPELINE_HOUR", "3"))
DAILY_PIPELINE_MINUTE = int(os.getenv("DAILY_PIPELINE_MINUTE", "30"))
DAILY_PIPELINE_COUNT = int(os.getenv("DAILY_PIPELINE_COUNT", "3"))
DAILY_PIPELINE_TARGET_SECONDS = int(os.getenv("DAILY_PIPELINE_TARGET_SECONDS", "60"))
# 候选确认：先把 10 条候选推飞书，窗口内可点选做哪几条，超时按默认前 count 条开做
DAILY_PIPELINE_CONFIRM_MINUTES = int(os.getenv("DAILY_PIPELINE_CONFIRM_MINUTES", "20"))
# 飞书群自定义机器人 webhook（空=不推送仅本地候选）；开了签名校验的机器人需再配 SECRET
FEISHU_WEBHOOK_URL = os.getenv("FEISHU_WEBHOOK_URL", "")
FEISHU_WEBHOOK_SECRET = os.getenv("FEISHU_WEBHOOK_SECRET", "")
# 成片画面亮度闸门（0~1，抽帧灰度均值双双低于该值判失败——守住「不要深色 AI 味背景」）
DAILY_PIPELINE_MIN_BRIGHTNESS = float(os.getenv("DAILY_PIPELINE_MIN_BRIGHTNESS", "0.45"))
# 派题执行体：本地 DeepSeek Harness（dsh）桌面端无头模式
DAILY_AGENT_CMD = os.getenv(
    "DAILY_AGENT_CMD",
    str(BACKEND_DIR.parent / "dsh-desktop" / "resources" / "runtime" / "cli" / "bin" / "dsh.cmd")
    if (BACKEND_DIR.parent / "dsh-desktop" / "DeepSeek Harness.exe").exists()
    else r"D:\Software\dsh-desktop\resources\runtime\cli\bin\dsh.cmd",
)
DAILY_AGENT_PROFILE = os.getenv("DAILY_AGENT_PROFILE", "headless")
DAILY_AGENT_TIMEOUT = int(os.getenv("DAILY_AGENT_TIMEOUT", "5400"))  # 单会话上限（秒）
# 事实审计硬闸门：审计不过自动派返修会话的最大重试次数（0=不重试直接失败）
DAILY_FACTS_RETRIES = max(0, int(os.getenv("DAILY_FACTS_RETRIES", "3")))
# 制作结果/异常告警推送飞书（0=关闭；候选推送不受此开关影响）
DAILY_NOTIFY_RESULTS = os.getenv("DAILY_NOTIFY_RESULTS", "1") not in ("0", "false", "no")

REMOTION_DIR = Path(
    os.getenv("REMOTION_DIR") or (BACKEND_DIR.parent / "remotion-engine")
)
REMOTION_PUBLIC = REMOTION_DIR / "public"
VOICE_PUBLIC_SUBDIR = "voice/projects"  # public 下的相对目录
PIC_PUBLIC_SUBDIR = "pic/projects"
BGM_PUBLIC_SUBDIR = "bgm"
COMPOSITION_ID = "DataVideo"
# 成片模板 → Remotion composition
COMPOSITIONS = {"datavideo": "DataVideo", "motionshow": "MotionShow"}
DEFAULT_TEMPLATE = "datavideo"


def composition_for(template: str | None) -> str:
    """项目设置里的 template 名 → composition id（非法回退 DataVideo）。"""
    key = (template or DEFAULT_TEMPLATE).strip().lower()
    return COMPOSITIONS.get(key, COMPOSITION_ID)

# Remotion 自带的精简版 ffmpeg（用于人声响度归一）
FFMPEG_BIN = Path(
    os.getenv("FFMPEG_BIN")
    or (REMOTION_DIR / "node_modules" / "@remotion" / "compositor-win32-x64-msvc" / "ffmpeg.exe")
)

# 多模型注册表（见 backend/models.json；密钥与地址通过 .env 的 ${VAR} 注入）
MODELS_CONFIG = Path(os.getenv("MODELS_CONFIG") or (BACKEND_DIR / "models.json"))

# 脚本生成提示词模板（见 backend/prompts.json）
PROMPTS_CONFIG = Path(os.getenv("PROMPTS_CONFIG") or (BACKEND_DIR / "prompts.json"))

TTS_VOICE = os.getenv("TTS_VOICE", "zh-CN-YunxiNeural")
TTS_RATE = os.getenv("TTS_RATE", "+6%")

RENDER_TIMEOUT_SECONDS = int(os.getenv("RENDER_TIMEOUT_SECONDS", "1800"))

# ComfyUI 文生图（局域网 3060 机器，SDXL 系；中文提示词由 LLM 翻成英文后提交）
COMFYUI_URL = (os.getenv("COMFYUI_URL") or "").rstrip("/")
COMFYUI_TIMEOUT = float(os.getenv("COMFYUI_TIMEOUT") or 600)
# 空 = 自动挑：优先含 "juggernaut" 的微调模型，否则第一个可用 checkpoint
COMFYUI_CHECKPOINT = os.getenv("COMFYUI_CHECKPOINT", "")
COMFYUI_NEGATIVE = os.getenv(
    "COMFYUI_NEGATIVE",
    "text, watermark, logo, signature, lowres, blurry, jpeg artifacts, "
    "deformed, bad anatomy, extra limbs, extra fingers",
)

# ---- 发布中心（创作者中心自动化：扫码登录 + 预约发布）----
# 任务/截图/登录会话/临时文件全部落本仓库（D 盘），不得写 C 盘
PUBLISH_DIR = Path(os.getenv("PUBLISH_DIR") or (STORAGE_DIR / "publish"))
PUBLISH_TASKS_FILE = PUBLISH_DIR / "tasks.json"
PUBLISH_SCREENSHOTS_DIR = PUBLISH_DIR / "screenshots"
# 调度 tick（秒）
PUBLISH_TICK_SECONDS = max(10, int(os.getenv("PUBLISH_TICK_SECONDS", "30")))
# 错过排期（后端没开机）的补发宽限（小时），超过转 overdue 待人工处理
PUBLISH_MISSED_GRACE_HOURS = float(os.getenv("PUBLISH_MISSED_GRACE_HOURS", "24"))
# 两次上传之间的最小间隔（分钟），降低创作者中心风控风险
PUBLISH_MIN_INTERVAL_MINUTES = max(0, int(os.getenv("PUBLISH_MIN_INTERVAL_MINUTES", "10")))
# 创作者中心登录会话（Playwright storage_state，含 cookie；只存本机）
CREATOR_STATE_FILE = Path(
    os.getenv("CREATOR_STATE_FILE") or (STORAGE_DIR / "tokens" / "creator_douyin_state.json")
)
# Playwright 浏览器二进制目录（默认仓库内，防止装进 C 盘 AppData；安装与运行时都要用它）
PLAYWRIGHT_BROWSERS_PATH = Path(
    os.getenv("PLAYWRIGHT_BROWSERS_PATH") or (BACKEND_DIR / ".pw-browsers")
)
# 浏览器/驱动临时文件目录（默认在 C 盘 %TEMP%，重定向到仓库内）
APP_TMP_DIR = Path(os.getenv("APP_TMP_DIR") or (BACKEND_DIR / ".tmp"))
# 新建发布任务的默认合集名（空=不设合集；可在前端按任务覆盖）
DOUYIN_COLLECTION = os.getenv("DOUYIN_COLLECTION", "").strip()
# 新建发布任务的默认自主声明（逗号分隔，如「内容由AI生成」）
DOUYIN_DECLARATIONS = [
    s.strip() for s in os.getenv("DOUYIN_DECLARATIONS", "内容由AI生成").replace("，", ",").split(",")
    if s.strip()
]
# 每日自动回流作品表现数据（0=关闭；需创作者中心已扫码登录，登录态失效自动跳过）
PUBLISH_STATS_SYNC = os.getenv("PUBLISH_STATS_SYNC", "1") not in ("0", "false", "no")


def ensure_dirs() -> None:
    PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
    RENDERS_DIR.mkdir(parents=True, exist_ok=True)
    HOTSPOT_SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    MUSIC_CHART_SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    (REMOTION_PUBLIC / VOICE_PUBLIC_SUBDIR).mkdir(parents=True, exist_ok=True)
    (REMOTION_PUBLIC / PIC_PUBLIC_SUBDIR).mkdir(parents=True, exist_ok=True)
    PUBLISH_DIR.mkdir(parents=True, exist_ok=True)
    PUBLISH_SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    CREATOR_STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    APP_TMP_DIR.mkdir(parents=True, exist_ok=True)
