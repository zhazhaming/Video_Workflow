@echo off
title Video Workflow Stopper
echo Stopping video-workflow services (ports 8000 / 5173 / 5174)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":8000 .*LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":5173 .*LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":5174 .*LISTENING"') do taskkill /F /PID %%a >nul 2>&1
echo Done. If nothing was found, the services were not running.
ping -n 3 127.0.0.1 >nul
