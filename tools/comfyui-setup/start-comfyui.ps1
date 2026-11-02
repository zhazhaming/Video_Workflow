# Start ComfyUI for LAN access (video-workflow backend calls it over HTTP).
# ASCII-only on purpose (Windows PowerShell 5.1 encoding).
#
# Usage: powershell -ExecutionPolicy Bypass -File .\start-comfyui.ps1
#        powershell -ExecutionPolicy Bypass -File .\start-comfyui.ps1 -Root D:\ComfyUI\ComfyUI_windows_portable

param(
    [string]$Root = "$env:USERPROFILE\ComfyUI\ComfyUI_windows_portable",
    [int]$Port = 8188
)

$ErrorActionPreference = "Stop"
$python = Join-Path $Root "python_embeded\python.exe"
$main = Join-Path $Root "ComfyUI\main.py"

if (-not (Test-Path $python)) {
    Write-Host "[ERROR] python_embeded not found under $Root" -ForegroundColor Red
    Write-Host "Run install-comfyui.ps1 first, or pass -Root <path>."
    exit 1
}
if (-not (Test-Path $main)) {
    Write-Host "[ERROR] ComfyUI\main.py not found under $Root" -ForegroundColor Red
    exit 1
}

$ips = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -ne "WellKnown" } |
    Select-Object -ExpandProperty IPAddress

Write-Host "ComfyUI listening on 0.0.0.0:$Port" -ForegroundColor Cyan
Write-Host "Local: http://127.0.0.1:$Port"
foreach ($ip in $ips) { Write-Host "LAN  : http://${ip}:$Port" }
Write-Host ""

& $python -s $main --listen 0.0.0.0 --port $Port --preview-method auto
