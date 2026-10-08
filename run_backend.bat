@echo off
title CardioTwin - Backend API (:8000)
setlocal enabledelayedexpansion

:: Determine project root
cd /d "%~dp0"
if exist "CardioTwin\cardiotwin\api\app.py" (
    set "PROJECT_ROOT=%~dp0CardioTwin"
) else if exist "cardiotwin\api\app.py" (
    set "PROJECT_ROOT=%~dp0"
) else (
    echo [ERROR] Could not locate CardioTwin project root.
    pause
    exit /b 1
)

cd /d "!PROJECT_ROOT!"

echo ========================================================
echo  Starting CardioTwin Backend API
echo  URL: http://127.0.0.1:8000
echo  Swagger Docs: http://127.0.0.1:8000/docs
echo ========================================================
echo.

where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in PATH!
    pause
    exit /b 1
)

python -m uvicorn cardiotwin.api.app:app --host 127.0.0.1 --port 8000 --reload
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Backend crashed or exited with error code %ERRORLEVEL%.
    pause
)
