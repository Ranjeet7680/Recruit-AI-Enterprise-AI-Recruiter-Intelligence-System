@echo off
title RecruitAI - Next.js Enterprise (v2.0 New Version)
echo ===================================================
echo   RecruitAI - Next.js Enterprise (v2.0 New Version)
echo ===================================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH!
    pause
    exit /b
)

echo Starting FastAPI Backend on http://localhost:8000 ...
start "RecruitAI FastAPI" cmd /k "python -m uvicorn src.api:app --port 8000"

echo Starting Next.js 16 Frontend on http://localhost:3000 ...
start "RecruitAI Next.js" cmd /k "npm run dev"

timeout /t 5 >nul
explorer "http://localhost:3000"
echo [SUCCESS] Launched Next.js v2.0 Enterprise Version.
pause
