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

where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in PATH!
    pause
    exit /b 1
)

:: Auto-activate virtual environment if one exists
if exist ".venv\Scripts\activate.bat" (
    echo [INFO] Activating virtual environment (.venv)...
    call .venv\Scripts\activate.bat
) else if exist "venv\Scripts\activate.bat" (
    echo [INFO] Activating virtual environment (venv)...
    call venv\Scripts\activate.bat
)

:: Check if dependencies are installed, auto-install if missing
python -c "import uvicorn, fastapi, joblib, sklearn, pandas" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Missing Python dependencies detected.
    echo [INFO] Installing required packages from requirements.txt...
    python -m pip install -r requirements.txt
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] pip install failed. Please check your Python environment.
        pause
        exit /b 1
    )
)

echo ========================================================
echo  Starting CardioTwin Backend API
echo  URL: http://127.0.0.1:8000
echo  Swagger Docs: http://127.0.0.1:8000/docs
echo ========================================================
echo.

python -m uvicorn cardiotwin.api.app:app --host 127.0.0.1 --port 8000 --reload
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Backend crashed or exited with error code %ERRORLEVEL%.
    pause
)
