@echo off
REM Starts the backend and frontend in separate windows.

echo Starting servers...
echo.

REM Find Python: prefer "python", then the "py" launcher.
set "PYTHON="
where python >nul 2>nul && set "PYTHON=python"
if not defined PYTHON ( where py >nul 2>nul && set "PYTHON=py" )
if not defined PYTHON (
    echo [ERROR] Python not found. Install it from https://python.org
    pause
    exit /b 1
)

start "Backend" cmd /k "cd /d "%~dp0backend" && %PYTHON% -m uvicorn main:app --reload --port 8000"
start "Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Two windows have opened. Close them to stop the servers.
