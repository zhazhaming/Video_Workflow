# -*- coding: utf-8 -*-
"""渲染服务：子进程调用 remotion-engine 的 Remotion CLI。"""
import re
import subprocess
from pathlib import Path

from ..config import COMPOSITION_ID, REMOTION_DIR, RENDER_TIMEOUT_SECONDS

_STILL_TIMEOUT_SECONDS = 300


def _safe_composition(composition: str | None) -> str:
    """只保留 composition id 允许的字符，避免拼进 shell 命令时被注入。"""
    return re.sub(r"[^A-Za-z0-9_]", "", composition or COMPOSITION_ID) or COMPOSITION_ID


def render_video(
    props_path: Path,
    out_path: Path,
    log_path: Path,
    frames: tuple[int, int] | None = None,
    composition: str | None = None,
) -> int:
    """同步渲染。返回进程退出码（0 成功）。日志写入 log_path。

    frames: (起始帧, 结束帧) 闭区间；传 (0, 299) 即渲染前 10 秒预览，None 渲整片。
    composition: 成片模板（DataVideo / MotionShow），缺省用全局默认。
    """
    out_path.parent.mkdir(parents=True, exist_ok=True)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    comp = _safe_composition(composition)
    frames_part = f" --frames={frames[0]}-{frames[1]}" if frames else ""
    # GPU 优先：h264 编码走 NVENC（无 N 卡自动回退软件编码），Chrome 合成走 ANGLE
    cmd = (
        f'npx remotion render {comp} "{out_path}" '
        f'--props="{props_path}"{frames_part} --codec=h264 --hardware-acceleration=if-possible '
        f'--gl=angle --log=info --overwrite'
    )
    with open(log_path, "w", encoding="utf-8") as log:
        log.write(f"$ {cmd}\n(cwd={REMOTION_DIR})\n\n")
        log.flush()
        proc = subprocess.run(
            cmd,
            cwd=str(REMOTION_DIR),
            shell=True,
            stdout=log,
            stderr=subprocess.STDOUT,
            timeout=RENDER_TIMEOUT_SECONDS,
        )
    return proc.returncode


def render_still(props_path: Path, frame: int, out_path: Path, log_path: Path | None = None, composition: str | None = None) -> int:
    """渲染单帧 PNG（六步流程第 4 步的样式样图）。返回进程退出码。"""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = (
        f'npx remotion still {_safe_composition(composition) or COMPOSITION_ID} "{out_path}" '
        f'--props="{props_path}" --frame={frame} --overwrite'
    )
    if log_path is None:
        proc = subprocess.run(
            cmd,
            cwd=str(REMOTION_DIR),
            shell=True,
            capture_output=True,
            timeout=_STILL_TIMEOUT_SECONDS,
        )
        return proc.returncode
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with open(log_path, "w", encoding="utf-8") as log:
        log.write(f"$ {cmd}\n(cwd={REMOTION_DIR})\n\n")
        log.flush()
        proc = subprocess.run(
            cmd,
            cwd=str(REMOTION_DIR),
            shell=True,
            stdout=log,
            stderr=subprocess.STDOUT,
            timeout=_STILL_TIMEOUT_SECONDS,
        )
    return proc.returncode


def tail_log(log_path: Path, max_lines: int = 25) -> str:
    if not log_path.exists():
        return ""
    try:
        lines = log_path.read_text(encoding="utf-8", errors="replace").splitlines()
        return "\n".join(lines[-max_lines:])
    except OSError:
        return ""
