@echo off
title Video Workflow Watchdog
REM Backend watchdog: probes /api/health every 60s; on failure it cleans port
REM 8000 and relaunches the backend the same way launch.bat does.
REM Log: backend\storage\logs\watchdog.log (records every restart)
REM NOTE: System32 is spelled out for timeout.exe so a dev-shell PATH (Git Bash
REM / MSYS2 puts GNU coreutils timeout.exe ahead of System32) cannot shadow it.
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
%SystemRoot%\System32\timeout.exe /t 60 /nobreak >nul
goto loop
