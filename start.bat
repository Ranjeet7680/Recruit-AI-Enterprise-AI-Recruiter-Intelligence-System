@echo off
title RecruitAI Launcher
echo ===================================================
echo   RecruitAI (TalentMind AI) Launcher
echo ===================================================
echo.
echo Starting Python FastAPI backend on port 8000...
start "RecruitAI Backend (FastAPI)" cmd /k "python -m uvicorn src.api:app --port 8000"

echo Starting Next.js frontend on port 3000...
start "RecruitAI Frontend (Next.js)" cmd /k "npm run dev"

echo.
echo ===================================================
echo   System launched successfully!
echo   - Frontend: http://localhost:3000
echo   - Backend: http://localhost:8000
echo ===================================================
echo.
pause
