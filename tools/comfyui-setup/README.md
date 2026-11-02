# 3060 生成节点：ComfyUI 一键安装与接入

这个目录给 **RTX 3060 12G 那台 Windows 主机** 用。装好之后，本机的
`video-workflow` 后端通过 HTTP 调用它生成配图/短片素材，渲染仍在视频机完成。

```
┌──────────────────────┐        HTTP (局域网)        ┌──────────────────────────┐
│ 视频机 (本机)         │  COMFYUI_URL=http://…:8188 │ 3060 主机                 │
│ FastAPI + Remotion   │ ─────────────────────────> │ ComfyUI portable         │
│ 素材缓存/回退         │ <───────────────────────── │ SDXL / FLUX / Wan2.1     │
└──────────────────────┘         生成结果图片/片段    └──────────────────────────┘
```

## 前提

- Windows 10/11 64 位，NVIDIA 驱动已装（能跑 `nvidia-smi`）
- 磁盘预留约 **40 GB**（ComfyUI 本体 ~4GB + SDXL 7GB + FLUX 12GB + Wan 10GB）
- 两台机器在同一局域网；建议在路由器给 3060 主机做 **固定 IP / DHCP 保留**

## 第一步：安装 ComfyUI

把整个 `comfyui-setup` 文件夹拷到 3060 主机，然后在文件夹里打开 PowerShell：

```powershell
powershell -ExecutionPolicy Bypass -File .\install-comfyui.ps1 -OpenFirewall
```

或直接双击 **`install-and-start.bat`**（安装完自动启动）。

脚本会：
1. 下载官方 `ComfyUI_windows_portable_nvidia.7z`（约 2GB，断点续传）
2. 解压到 `%USERPROFILE%\ComfyUI`（可用 `-InstallDir D:\ComfyUI` 改）
3. 安装 `ComfyUI-Manager`
4. 建好 `models\checkpoints` / `diffusion_models` / `text_encoders` / `vae` / `upscale_models`
5. 生成 `start-comfyui.bat`
6. `-OpenFirewall` 时放行 TCP 8188（需要管理员）

## 第二步：下载模型

```powershell
# 先装 SDXL（7GB，摄影感配图，最稳）
powershell -ExecutionPolicy Bypass -File .\download-models.ps1 -Sdxl

# 可选：FLUX schnell（12GB，图形/文字类画面；12G 显存偏紧，会走内存卸载）
powershell -ExecutionPolicy Bypass -File .\download-models.ps1 -Flux

# 可选：Wan2.1 1.3B（约 10GB，2–4 秒 B-roll 短片）
powershell -ExecutionPolicy Bypass -File .\download-models.ps1 -Wan
```

默认走 `hf-mirror.com`（HF 直连在国内多数网络不通）。有直连条件可加
`-Endpoint https://huggingface.co`。

| 模型 | 文件 | 放哪里 | 体积 | 许可证 |
|---|---|---|---|---|
| SDXL base 1.0 | `sd_xl_base_1.0.safetensors` | `models/checkpoints` | ~6.9 GB | OpenRAIL++-M |
| FLUX.1 schnell fp8 | `flux1-schnell-fp8.safetensors` | `models/checkpoints` | ~11.9 GB | Apache-2.0 |
| Wan2.1 T2V 1.3B | `wan2.1_t2v_1.3B_fp16.safetensors` | `models/diffusion_models` | ~2.8 GB | Apache-2.0 |
| Wan2.1 文本编码器 | `umt5_xxl_fp8_e4m3fn_scaled.safetensors` | `models/text_encoders` | ~5.0 GB | Apache-2.0 |
| Wan2.1 VAE | `wan_2.1_vae.safetensors` | `models/vae` | ~250 MB | Apache-2.0 |

> 3060 12G 建议：SDXL 用 832×1216（9:16）；FLUX fp8 首次加载慢属正常；Wan2.1 只跑 1.3B，
> 不要下 14B。

## 第三步：启动

```powershell
powershell -ExecutionPolicy Bypass -File .\start-comfyui.ps1
```

看到 `To see the GUI go to: http://0.0.0.0:8188` 即成功。记下打印的局域网地址，
例如 `http://192.168.1.50:8188`。

## 第四步：在视频机（本机）接入

1. 编辑 `backend/.env`，加入：

```env
COMFYUI_URL=http://192.168.1.50:8188
COMFYUI_TIMEOUT=600
```

2. 自检（在 video-workflow 根目录）：

```bash
python backend/tools/comfyui_check.py
```

期望输出：GPU 型号、显存、ComfyUI 版本、checkpoints 列表。若连不上，按提示检查
启动状态 / 防火墙 / IP。

## 常见问题

- **连不上 8188**：3060 上 `start-comfyui.ps1` 是否在跑；Windows 防火墙是否放行
  `Private` 网络的 TCP 8188；两台机器是否同网段。
- **HF 下载 403/超时**：脚本已默认 hf-mirror；仍失败可用 ComfyUI-Manager 的
  Model Manager 手动装。
- **显存不足（OOM）**：SDXL 降分辨率到 768×1152；FLUX 换 GGUF Q4；Wan 只跑 1.3B。
- **安全**：`--listen 0.0.0.0` 仅限可信局域网，不要把 8188 映射到公网。

## 后续

机器上线并通过自检后，我再把 `backend/app/services/media/` 的 ComfyUI provider
接到六步流程第 3 步（配图），做「生成 → 回退图库 → 占位」链路和缓存清单。
