# ComfyUI one-click installer for Windows + NVIDIA (RTX 3060 12GB friendly)
# ASCII-only on purpose: Windows PowerShell 5.1 misreads UTF-8 without BOM.
#
# Usage (on the 3060 machine):
#   powershell -ExecutionPolicy Bypass -File .\install-comfyui.ps1
#   powershell -ExecutionPolicy Bypass -File .\install-comfyui.ps1 -InstallDir D:\ComfyUI -OpenFirewall
#
# What it does:
#   1. downloads the official ComfyUI Windows portable (NVIDIA) archive
#   2. extracts it with 7zr.exe (downloaded if missing)
#   3. installs ComfyUI-Manager into custom_nodes
#   4. creates the model folders
#   5. writes start-comfyui.bat inside the install root
#   6. optionally opens TCP 8188 in Windows Firewall (needs admin)

param(
    [string]$InstallDir = "$env:USERPROFILE\ComfyUI",
    [switch]$OpenFirewall,
    [switch]$SkipManager
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$AssetUrl = "https://github.com/Comfy-Org/ComfyUI/releases/latest/download/ComfyUI_windows_portable_nvidia.7z"
$SevenZipUrl = "https://www.7-zip.org/a/7zr.exe"
$Archive = Join-Path $env:TEMP "ComfyUI_windows_portable_nvidia.7z"
$SevenZip = Join-Path $env:TEMP "7zr.exe"

function Step([string]$Text) {
    Write-Host ""
    Write-Host "== $Text" -ForegroundColor Cyan
}

function Fail([string]$Text) {
    Write-Host "[ERROR] $Text" -ForegroundColor Red
    exit 1
}

Step "Checking prerequisites"
if (-not [Environment]::Is64BitOperatingSystem) { Fail "64-bit Windows is required." }
if (-not (Get-Command curl.exe -ErrorAction SilentlyContinue)) {
    Fail "curl.exe not found. Windows 10 1803+ ships it; install curl or use a newer Windows."
}
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
Write-Host "Install dir: $InstallDir"
$free = (Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Name -eq (Split-Path $InstallDir -Qualifier).TrimEnd(':') }).Free
Write-Host ("Free space: {0:N1} GB (need ~40 GB with models)" -f ($free / 1GB))

Step "Downloading 7zr.exe (small extractor)"
if (-not (Test-Path $SevenZip)) {
    & curl.exe -L --retry 3 -o $SevenZip $SevenZipUrl
    if ($LASTEXITCODE -ne 0) { Fail "Failed to download 7zr.exe" }
}

Step "Downloading ComfyUI portable (~2.0 GB, resumable)"
if (-not (Test-Path $Archive)) {
    & curl.exe -L --retry 3 --retry-delay 5 -C - -o $Archive $AssetUrl
    if ($LASTEXITCODE -ne 0) { Fail "Failed to download ComfyUI portable archive." }
} else {
    Write-Host "Archive already exists: $Archive"
}

Step "Extracting"
& $SevenZip x $Archive "-o$InstallDir" -y | Out-Null
if ($LASTEXITCODE -ne 0) { Fail "7z extraction failed." }

$Root = Join-Path $InstallDir "ComfyUI_windows_portable"
if (-not (Test-Path (Join-Path $Root "python_embeded\python.exe"))) {
    $candidate = Get-ChildItem $InstallDir -Recurse -Filter "python.exe" -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -like "*python_embeded*" } | Select-Object -First 1
    if ($candidate) {
        $Root = Split-Path (Split-Path $candidate.FullName -Parent) -Parent
    }
}
if (-not (Test-Path (Join-Path $Root "ComfyUI\main.py"))) {
    Fail "Could not locate ComfyUI inside $InstallDir"
}
Write-Host "ComfyUI root: $Root"

Step "Creating model folders"
$ModelDirs = @("checkpoints", "diffusion_models", "text_encoders", "vae", "loras", "upscale_models")
foreach ($d in $ModelDirs) {
    New-Item -ItemType Directory -Force -Path (Join-Path $Root "ComfyUI\models\$d") | Out-Null
}

if (-not $SkipManager) {
    Step "Installing ComfyUI-Manager"
    $customNodes = Join-Path $Root "ComfyUI\custom_nodes"
    $managerDir = Join-Path $customNodes "ComfyUI-Manager"
    New-Item -ItemType Directory -Force -Path $customNodes | Out-Null
    if (Test-Path $managerDir) {
        Write-Host "ComfyUI-Manager already installed."
    } else {
        if (Get-Command git.exe -ErrorAction SilentlyContinue) {
            & git.exe clone --depth 1 https://github.com/ltdrdata/ComfyUI-Manager.git $managerDir
            if ($LASTEXITCODE -ne 0) { Write-Warning "git clone failed; trying zip fallback." }
        }
        if (-not (Test-Path $managerDir)) {
            $zip = Join-Path $env:TEMP "ComfyUI-Manager.zip"
            & curl.exe -L --retry 3 -o $zip "https://github.com/ltdrdata/ComfyUI-Manager/archive/refs/heads/main.zip"
            if ($LASTEXITCODE -ne 0) { Write-Warning "Manager download failed; skipping." }
            else {
                Expand-Archive -Path $zip -DestinationPath $customNodes -Force
                Move-Item (Join-Path $customNodes "ComfyUI-Manager-main") $managerDir -Force
            }
        }
    }
    $req = Join-Path $managerDir "requirements.txt"
    if (Test-Path $req) {
        & (Join-Path $Root "python_embeded\python.exe") -m pip install -r $req
    }
}

Step "Writing start script"
$bat = @"
@echo off
cd /d "%~dp0"
echo Starting ComfyUI on http://0.0.0.0:8188 ...
python_embeded\python.exe -s ComfyUI\main.py --listen 0.0.0.0 --port 8188 --preview-method auto
pause
"@
Set-Content -Path (Join-Path $Root "start-comfyui.bat") -Value $bat -Encoding ASCII

if ($OpenFirewall) {
    Step "Opening TCP 8188 (private/domain networks)"
    try {
        Get-NetFirewallRule -DisplayName "ComfyUI 8188" -ErrorAction SilentlyContinue | Remove-NetFirewallRule
        New-NetFirewallRule -DisplayName "ComfyUI 8188" -Direction Inbound -Protocol TCP -LocalPort 8188 -Action Allow -Profile Private,Domain | Out-Null
        Write-Host "Firewall rule added."
    } catch {
        Write-Warning "Could not add firewall rule (run as Administrator): $($_.Exception.Message)"
    }
}

$ips = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -ne "WellKnown" } |
    Select-Object -ExpandProperty IPAddress
Step "Done"
Write-Host "Install root : $Root"
Write-Host "Start with   : $Root\start-comfyui.bat"
Write-Host "Local URL    : http://127.0.0.1:8188"
foreach ($ip in $ips) { Write-Host "LAN URL      : http://${ip}:8188" }
Write-Host ""
Write-Host "Next: run .\download-models.ps1 -Sdxl   (then optionally -Flux / -Wan)"
