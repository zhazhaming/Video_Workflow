@echo off
title Video Workflow Watchdog
REM 后端看护：每 60s 探活 /api/health，挂了就清残留进程并按 launch.bat 同款命令拉起。
REM 日志：backend\storage\logs\watchdog.log（含每次重启记录）
cd /d "%~dp0"
set "LOG=%~dp0backend\storage\logs\watchdog.log"
if not exist "%~dp0backend\storage\logs" mkdir "%~dp0backend\storage\logs"

echo [%date% %time%] watchdog started >> "%LOG%"

:loop
curl -s -o nul -m 5 http://127.0.0.1:8000/api/health >nul 2>&1
if errorlevel 1 (
  echo [%date% %time%] backend down, cleaning port 8000 and restarting... >> "%LOG%"
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":8000 .*LISTENING"') do taskkill /F /PID %%a >nul 2>&1
  cd /d "%~dp0backend"
  start "video-workflow-backend" cmd /k "python -m uvicorn app.main:app --port 8000"
  cd /d "%~dp0"
  echo [%date% %time%] backend restart issued >> "%LOG%"
)
timeout /t 60 /nobreak >nul
goto loop
