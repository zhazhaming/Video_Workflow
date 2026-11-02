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
echo [0/2] Cleaning previous instances on ports 8000/5173/5174...
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

echo [1/2] Starting backend in a new window...
cd /d "%~dp0backend"
start "video-workflow-backend" cmd /k "python -m uvicorn app.main:app --port 8000"

echo [2/2] Starting frontend in a new window...
cd /d "%~dp0frontend"
start "video-workflow-frontend" cmd /k "npm run dev"

echo Waiting for services...
ping -n 6 127.0.0.1 >nul
start "" "http://localhost:5173"

echo.
echo Done. Browser will open http://localhost:5173
echo To stop: run stop.bat or close the two service windows.
ping -n 4 127.0.0.1 >nul
