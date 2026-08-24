@echo off
title RecruitAI - Classic Streamlit (v1.0 Old Version)
echo ===================================================
echo   RecruitAI - Classic Streamlit UI (v1.0 Old Version)
echo ===================================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH!
    pause
    exit /b
)

python -c "import streamlit" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing Streamlit dependencies...
    python -m pip install streamlit -r requirements-streamlit.txt
)

echo Starting Classic Streamlit UI on http://localhost:8501 ...
start "RecruitAI Classic (Streamlit)" cmd /k "streamlit run streamlit_app/main.py --server.port 8501"

timeout /t 3 >nul
explorer "http://localhost:8501"
echo [SUCCESS] Launched Streamlit v1.0 Old Version.
pause
