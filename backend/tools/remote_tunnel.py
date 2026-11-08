# -*- coding: utf-8 -*-
"""远程访问：把本机的视频流水线前端通过 SSH 反向隧道暴露到公网服务器。

架构（生产链路全部留在本地，服务器只做公网入口）：

    手机/外地浏览器
        ↓ http://<服务器IP>:<remote_port>/?tab=pipeline
    服务器（SSH -R 反向隧道端口）
        ↓ 隧道
    本机 vite preview（dist 生产构建，:5173，/api 代理到本机 8000 后端）
        ↓
    本机 FastAPI + dsh agent + 渲染

用法：
    # 首次/日常：构建前端 + 起 preview + 建隧道（断线自动重连，Ctrl+C 退出）
    python -X utf8 tools/remote_tunnel.py --server user@1.2.3.4 --remote-port 8090
    # 已在跑前端时：只建隧道
    python -X utf8 tools/remote_tunnel.py --server user@1.2.3.4 --remote-port 8090 --no-frontend
    # 指定私钥/自定义本地端口
    python -X utf8 tools/remote_tunnel.py --server user@1.2.3.4 --remote-port 8090 --ssh-key D:\\keys\\id_rsa --local-port 5173

隧道跑起来后，把流水线 ⚙配置 里的「卡片链接」改成 http://<服务器IP>:<remote_port>
飞书卡片深链即从任何网络可达。生产/渲染仍在本地执行。

安全提醒：该 URL 打开后可触发渲染/删除项目，建议在服务器上加 nginx Basic Auth，
或把 remote_port 换成非显而易见的高位端口。
"""
import argparse
import subprocess
import sys
import time
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BACKEND_DIR.parent / "frontend"


def sh(cmd: list[str] | str, **kw) -> int:
    print(f"$ {cmd}", flush=True)
    return subprocess.call(cmd, shell=isinstance(cmd, str), **kw)


def port_listening(port: int) -> bool:
    """探测本地端口是否有 HTTP 服务在跑。"""
    import httpx

    try:
        r = httpx.get(f"http://127.0.0.1:{port}/", timeout=3)
        return r.status_code < 500
    except Exception:  # noqa: BLE001 — 连不上就是没起
        return False


def ensure_frontend(build: bool, local_port: int) -> bool:
    """确保本机前端服务在跑（vite preview 服务 dist；已有则复用）。"""
    if port_listening(local_port):
        print(f"[tunnel] 本地端口 {local_port} 已有服务，复用")
        return True
    if build:
        print("[tunnel] 构建前端（npm run build）…", flush=True)
        if sh("npm run build", cwd=str(FRONTEND_DIR)) != 0:
            print("[tunnel] 前端构建失败", flush=True)
            return False
    print(f"[tunnel] 启动 vite preview（dist，端口 {local_port}）…", flush=True)
    subprocess.Popen(
        f'npx vite preview --host --port {local_port} --strictPort',
        cwd=str(FRONTEND_DIR), shell=True,
    )
    for _ in range(20):
        time.sleep(1)
        if port_listening(local_port):
            return True
    print("[tunnel] preview 启动失败", flush=True)
    return False


def tunnel_loop(server: str, remote_port: int, local_port: int, ssh_key: str) -> None:
    """反向隧道 + 断线自动重连（前台运行，Ctrl+C 退出）。"""
    key = f' -i "{ssh_key}"' if ssh_key else ""
    bind = f"0.0.0.0:{remote_port}:127.0.0.1:{local_port}"
    cmd = (
        f'ssh -N -R {bind} {key} -o ServerAliveInterval=30 -o ServerAliveCountMax=3 '
        f'-o ExitOnForwardFailure=yes -o StrictHostKeyChecking=accept-new {server}'
    )
    print(f"[tunnel] 反向隧道：服务器:{remote_port} → 本机:{local_port}（断线 5s 重连）", flush=True)
    print(f"[tunnel] 远程访问地址: http://<服务器IP>:{remote_port}/?tab=pipeline", flush=True)
    while True:
        rc = sh(cmd)
        print(f"[tunnel] ssh 退出（rc={rc}），5 秒后重连…", flush=True)
        time.sleep(5)


def main() -> int:
    ap = argparse.ArgumentParser(description="远程访问：SSH 反向隧道暴露本地流水线前端")
    ap.add_argument("--server", required=True, help="SSH 目标，如 user@1.2.3.4")
    ap.add_argument("--remote-port", type=int, default=8090, help="服务器上暴露的端口")
    ap.add_argument("--local-port", type=int, default=5173, help="本地前端端口")
    ap.add_argument("--ssh-key", default="", help="SSH 私钥路径（可选）")
    ap.add_argument("--no-build", dest="build", action="store_false",
                    help="跳过前端构建（端口无服务时直接报错，不自动起 preview）")
    args = ap.parse_args()

    if not port_listening(args.local_port):
        if not args.build:
            print(f"[tunnel] 本地端口 {args.local_port} 没有服务，请先启动前端或去掉 --no-build")
            return 1
        if not ensure_frontend(True, args.local_port):
            return 1
    else:
        print(f"[tunnel] 本地端口 {args.local_port} 已有服务，复用")
    try:
        tunnel_loop(args.server, args.remote_port, args.local_port, args.ssh_key)
    except KeyboardInterrupt:
        print("\n[tunnel] 已退出")
    return 0


if __name__ == "__main__":
    sys.exit(main())
