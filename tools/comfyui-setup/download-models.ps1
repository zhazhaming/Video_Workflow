# Download the model files the video-workflow uses.
# ASCII-only on purpose (Windows PowerShell 5.1 + UTF-8 without BOM issue).
#
# Usage (on the 3060 machine, after install-comfyui.ps1):
#   powershell -ExecutionPolicy Bypass -File .\download-models.ps1 -Sdxl
#   powershell -ExecutionPolicy Bypass -File .\download-models.ps1 -Flux
#   powershell -ExecutionPolicy Bypass -File .\download-models.ps1 -Wan
#   powershell -ExecutionPolicy Bypass -File .\download-models.ps1 -All
#
# HF direct is often blocked in mainland China; hf-mirror.com is used by default.
# Override with -Endpoint https://huggingface.co if you have direct access.

param(
    [switch]$Sdxl,
    [switch]$Flux,
    [switch]$Wan,
    [switch]$All,
    [string]$Root = "$env:USERPROFILE\ComfyUI\ComfyUI_windows_portable",
    [string]$Endpoint = "https://hf-mirror.com"
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

if (-not ($Sdxl -or $Flux -or $Wan -or $All)) {
    Write-Host "Nothing selected. Use -Sdxl, -Flux, -Wan or -All."
    exit 1
}
if ($All) { $Sdxl = $true; $Flux = $true; $Wan = $true }

if (-not (Test-Path (Join-Path $Root "ComfyUI\main.py"))) {
    Write-Host "[ERROR] ComfyUI not found at $Root" -ForegroundColor Red
    exit 1
}

$Targets = @()
if ($Sdxl) {
    $Targets += @{ Name = "SDXL base 1.0 (~6.9 GB, photos)"; Repo = "stabilityai/stable-diffusion-xl-base-1.0"; File = "sd_xl_base_1.0.safetensors"; Dest = "checkpoints" }
}
if ($Flux) {
    $Targets += @{ Name = "FLUX.1 schnell fp8 (~11.9 GB, graphics/text)"; Repo = "Comfy-Org/flux1-schnell"; File = "flux1-schnell-fp8.safetensors"; Dest = "checkpoints" }
}
if ($Wan) {
    $Targets += @{ Name = "Wan2.1 T2V 1.3B (~2.8 GB)"; Repo = "Comfy-Org/Wan-2.1"; File = "split_files/diffusion_models/wan2.1_t2v_1.3B_fp16.safetensors"; Dest = "diffusion_models" }
    $Targets += @{ Name = "Wan2.1 text encoder (~5.0 GB)"; Repo = "Comfy-Org/Wan-2.1"; File = "split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors"; Dest = "text_encoders" }
    $Targets += @{ Name = "Wan2.1 VAE (~250 MB)"; Repo = "Comfy-Org/Wan-2.1"; File = "split_files/vae/wan_2.1_vae.safetensors"; Dest = "vae" }
}

Write-Host "Endpoint: $Endpoint"
foreach ($t in $Targets) {
    $destDir = Join-Path $Root "ComfyUI\models\$($t.Dest)"
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    $dest = Join-Path $destDir (Split-Path $t.File -Leaf)
    $url = "$Endpoint/$($t.Repo)/resolve/main/$($t.File)"
    Write-Host ""
    Write-Host "== $($t.Name)" -ForegroundColor Cyan
    Write-Host "   $url"
    Write-Host "   -> $dest"
    if ((Test-Path $dest) -and ((Get-Item $dest).Length -gt 100MB)) {
        Write-Host "   already present, skipping."
        continue
    }
    & curl.exe -L --retry 3 --retry-delay 5 -C - -o $dest $url
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   [WARN] download failed: $($t.Name)" -ForegroundColor Yellow
        continue
    }
    Write-Host ("   done: {0:N1} MB" -f ((Get-Item $dest).Length / 1MB))
}

Write-Host ""
Write-Host "Model summary:" -ForegroundColor Cyan
foreach ($d in @("checkpoints", "diffusion_models", "text_encoders", "vae")) {
    $dir = Join-Path $Root "ComfyUI\models\$d"
    $files = Get-ChildItem $dir -File -ErrorAction SilentlyContinue
    if ($files) {
        Write-Host "  [$d]"
        foreach ($f in $files) { Write-Host ("    {0}  ({1:N1} MB)" -f $f.Name, ($f.Length / 1MB)) }
    }
}
