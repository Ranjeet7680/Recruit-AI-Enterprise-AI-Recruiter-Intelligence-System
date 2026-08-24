@echo off
title RecruitAI Version Switcher & Launcher
:MENU
cls
echo ================================================================
echo          RECRUIT-AI / NEXORA VERSION SWITCHER & LAUNCHER
echo ================================================================
echo.
echo   [1] Launch Modern Next.js Enterprise System (v2.0 - Active)
echo       - Next.js 16 Frontend (Port 3000) + FastAPI Backend (Port 8000)
echo       - Multi-Agent Studio, Live Video Interview, 3D Tilt UI
echo.
echo   [2] Launch Classic Streamlit Version (v1.0 - Old Version)
echo       - Streamlit Python Dashboard (Port 8501)
echo       - Original single-page recruiter view
echo.
echo   [3] Launch FastAPI Backend Only (Port 8000)
echo.
echo   [4] Launch Production Web App in Browser
echo       - https://recruit-ai-enterprise-ai-recruiter.vercel.app
echo.
echo   [5] Exit
echo.
echo ================================================================
set /p choice="Select an option [1-5]: "

if "%choice%"=="1" goto NEW_VER
if "%choice%"=="2" goto OLD_VER
if "%choice%"=="3" goto BACKEND_ONLY
if "%choice%"=="4" goto PROD_WEB
if "%choice%"=="5" exit /b
echo Invalid option, please try again.
timeout /t 2 >nul
goto MENU

:NEW_VER
cls
echo Starting Modern Next.js Enterprise System (v2.0)...
start "RecruitAI FastAPI" cmd /k "python -m uvicorn src.api:app --port 8000"
start "RecruitAI Next.js" cmd /k "npm run dev"
timeout /t 4 >nul
explorer "http://localhost:3000"
pause
goto MENU

:OLD_VER
cls
echo Starting Classic Streamlit Version (v1.0 Old)...
python -c "import streamlit" >nul 2>&1
if errorlevel 1 (
    echo Installing Streamlit...
    python -m pip install streamlit -r requirements-streamlit.txt
)
start "RecruitAI Streamlit Classic" cmd /k "streamlit run streamlit_app/main.py --server.port 8501"
timeout /t 3 >nul
explorer "http://localhost:8501"
pause
goto MENU

:BACKEND_ONLY
cls
echo Starting FastAPI Backend...
start "RecruitAI FastAPI" cmd /k "python -m uvicorn src.api:app --port 8000"
timeout /t 2 >nul
explorer "http://localhost:8000/docs"
pause
goto MENU

:PROD_WEB
cls
echo Opening Production Deployment...
explorer "https://recruit-ai-enterprise-ai-recruiter.vercel.app"
goto MENU
