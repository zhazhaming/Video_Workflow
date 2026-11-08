@echo off
title Video Workflow Launcher
cd /d "%~dp0"

echo ============================================
echo   Video Workflow - one-click launcher
echo ============================================
echo Backend : http://localhost:8000
echo Frontend: http://localhost:5173
echo.

if not exist "backend\app\main.py" (
  echo [ERROR] backend\app\main.py not found.
  echo Put this file in the video-workflow root folder.
  pause
  exit /b 1
)

REM ---- clean start: stop anything already listening on our ports ----
echo [0/3] Cleaning previous instances on ports 8000/5173/5174...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":8000 .*LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":5173 .*LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":5174 .*LISTENING"') do taskkill /F /PID %%a >nul 2>&1

python -c "import fastapi, uvicorn, edge_tts, mutagen, PIL, multipart" >nul 2>&1
if errorlevel 1 (
  echo [deps] Installing backend Python dependencies...
  pushd backend
  python -m pip install -r requirements.txt
  popd
)

if not exist "frontend\node_modules" (
  echo [deps] Installing frontend npm dependencies...
  pushd frontend
  call npm install
  popd
)

echo [1/3] Starting backend in a new window...
cd /d "%~dp0backend"
start "video-workflow-backend" cmd /k "python -m uvicorn app.main:app --port 8000"

echo [2/3] Starting frontend in a new window...
cd /d "%~dp0frontend"
start "video-workflow-frontend" cmd /k "npm run dev"

echo [3/3] Starting backend watchdog in a new window...
REM 看护：每 60s 探活 /api/health，后端挂掉自动重启（每日流水线依赖后端常驻）
start "video-workflow-watchdog" cmd /k "%~dp0watchdog.bat"

echo Waiting for services...
ping -n 6 127.0.0.1 >nul
start "" "http://localhost:5173"

echo.
echo Done. Browser will open http://localhost:5173
echo To stop: run stop.bat or close the three service windows (backend/frontend/watchdog).
ping -n 4 127.0.0.1 >nul

REM ---- 可选：开机自启 / 睡眠唤醒兜底（需要时手动执行一次，按需取消注释）----
REM 开机自启（ONSTART 需管理员权限的终端执行）：
REM schtasks /Create /F /TN "VideoWorkflowBoot" /SC ONSTART /TR "\"D:\Work\video-workflow\launch.bat\""
REM 每天凌晨 03:00 拉起一次兜底（机器睡眠中不会执行；需唤醒执行请在「任务计划程序」里
REM 打开该任务的「唤醒计算机运行此任务」和「不管用户是否登录都要运行」）：
REM schtasks /Create /F /TN "VideoWorkflowDaily" /SC DAILY /ST 03:00 /TR "\"D:\Work\video-workflow\launch.bat\""
