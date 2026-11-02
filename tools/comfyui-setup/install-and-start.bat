@echo off
setlocal
cd /d "%~dp0"
echo ============================================
echo   ComfyUI one-click install (RTX 3060)
echo ============================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-comfyui.ps1" -OpenFirewall
if errorlevel 1 (
  echo.
  echo [ERROR] Install failed. See the messages above.
  pause
  exit /b 1
)
echo.
set /p DL=Download SDXL model now (~7 GB)? [y/N]:
if /i "%DL%"=="y" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0download-models.ps1" -Sdxl
)
echo.
echo Starting ComfyUI...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-comfyui.ps1"
pause
