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

REMOTION_DIR = Path(os.getenv("REMOTION_DIR") or r"D:\Work\remotion-life-sim")
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


def ensure_dirs() -> None:
    PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
    RENDERS_DIR.mkdir(parents=True, exist_ok=True)
    HOTSPOT_SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    (REMOTION_PUBLIC / VOICE_PUBLIC_SUBDIR).mkdir(parents=True, exist_ok=True)
    (REMOTION_PUBLIC / PIC_PUBLIC_SUBDIR).mkdir(parents=True, exist_ok=True)
