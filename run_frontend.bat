@echo off
title CardioTwin - Frontend Dashboard (:5173)
setlocal enabledelayedexpansion

:: Determine frontend directory
cd /d "%~dp0"
if exist "CardioTwin\frontend\package.json" (
    set "FRONTEND_DIR=%~dp0CardioTwin\frontend"
) else if exist "frontend\package.json" (
    set "FRONTEND_DIR=%~dp0frontend"
) else (
    echo [ERROR] Could not locate frontend directory.
    pause
    exit /b 1
)

cd /d "!FRONTEND_DIR!"

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js / npm is not installed or not in PATH!
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [INFO] node_modules not detected. Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

echo ========================================================
echo  Starting CardioTwin React Dashboard
echo  URL: http://localhost:5173
echo ========================================================
echo.

call npm run dev
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Frontend server crashed or exited with error code %ERRORLEVEL%.
    pause
)
