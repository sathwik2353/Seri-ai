@echo off
title SERI AI Platform & Desktop Voice Assistant
color 0A

echo ===================================================
echo     Starting SERI AI Platform & Desktop Assistant
echo ===================================================
echo.

:: 1. Start Backend Server (FastAPI)
echo [1/3] Starting FastAPI Backend on port 8000...
start "SERI Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload"

:: 2. Start Frontend Web App (Vite)
echo [2/3] Starting Vite Frontend on port 5173...
start "SERI Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

:: 3. Start System-Wide Desktop Voice Assistant ("SERI" Anywhere)
echo [3/3] Starting Desktop Voice Assistant ("SERI")...
start "SERI Desktop Assistant" cmd /k "cd /d %~dp0desktop_assistant && python seri_desktop.py"

:: 4. Wait for servers to initialize and open localhost in browser
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ============================================================
echo SUCCESS: SERI AI Platform & Voice Assistant are Running!
echo.
echo - Web App:   http://localhost:5173
echo - Backend:   http://localhost:8000
echo - Voice:     Say "SERI" anywhere in Chrome, WhatsApp, etc.
echo ============================================================
echo.
echo Press any key to close this launcher window.
pause >nul
