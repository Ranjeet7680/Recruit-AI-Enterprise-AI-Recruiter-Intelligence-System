@echo off
title RecruitAI Launcher
echo ===================================================
echo   RecruitAI (TalentMind AI) Launcher
echo ===================================================
echo.

:: Verify Python is installed and accessible
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not configured in your system PATH!
    echo Please install Python 3.10+ and select "Add Python to PATH" during installation.
    echo.
    pause
    exit /b
)

:: Verify dependencies and auto-install if fastapi is missing
python -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Missing Python dependencies. Installing required packages from requirements.txt...
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies! Please run 'pip install -r requirements.txt' manually.
        echo.
        pause
        exit /b
    )
    echo [SUCCESS] Dependencies installed successfully.
    echo.
)

echo Starting Python FastAPI backend on port 8000...
start "RecruitAI Backend (FastAPI)" cmd /k "python -m uvicorn src.api:app --port 8000"

echo.
echo ===================================================
echo   System launched successfully!
echo   - URL: http://localhost:8000
echo ===================================================
echo.
explorer "http://localhost:8000"
pause
