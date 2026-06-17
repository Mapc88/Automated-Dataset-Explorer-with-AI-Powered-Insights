@echo off
REM Installs backend (Python) and frontend (Node) dependencies.

echo ====================================
echo   Installing dependencies
echo ====================================
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

where npm >nul 2>nul
if not %errorlevel%==0 (
    echo [ERROR] Node.js / npm not found.
    echo Install it from https://nodejs.org then run this again.
    echo.
    pause
    exit /b 1
)

echo [1/2] Installing backend dependencies...
cd /d "%~dp0backend"
%PYTHON% -m pip install -r requirements.txt
if not %errorlevel%==0 (
    echo [ERROR] Backend install failed.
    pause
    exit /b 1
)
echo Backend done.
echo.

echo [2/2] Installing frontend dependencies...
cd /d "%~dp0frontend"
call npm install
if not %errorlevel%==0 (
    echo [ERROR] Frontend install failed.
    pause
    exit /b 1
)
echo Frontend done.
echo.

cd /d "%~dp0backend"
if not exist ".env" (
    copy ".env.example" ".env" >nul
    echo Created backend\.env  -  add your GEMINI_API_KEY to enable AI insights.
    echo (optional - the app works without it^)
    echo.
)

echo ====================================
echo   Setup complete!
echo   Run start.bat to launch the app.
echo ====================================
echo.
pause
