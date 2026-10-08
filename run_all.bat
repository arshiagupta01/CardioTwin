@echo off
title CardioTwin - Unified Launcher
setlocal

cd /d "%~dp0"

echo ========================================================
echo       Starting CardioTwin Full Stack Application
echo ========================================================
echo.
echo [1/2] Starting Backend API in a separate terminal...
start "CardioTwin Backend (:8000)" cmd /k call "%~dp0run_backend.bat"

echo Waiting 3 seconds for Backend to initialize...
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Dashboard in a separate terminal...
start "CardioTwin Frontend (:5173)" cmd /k call "%~dp0run_frontend.bat"

echo.
echo ========================================================
echo  All services launched successfully!
echo.
echo  - Backend API:       http://127.0.0.1:8000
echo  - Interactive Docs:  http://127.0.0.1:8000/docs
echo  - Frontend UI:       http://localhost:5173
echo ========================================================
echo.
echo You may close this launcher window at any time.
pause
