@echo off
echo Starting Admin Web Dashboard...
echo.

cd /d "%~dp0"

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo.
echo Starting development server...
echo Dashboard will be available at: http://localhost:5173
echo.

call npm run dev

pause
