@echo off
echo ========================================
echo  IQ Campus System - Full Stack
echo ========================================
echo.
echo Starting all services...
echo.

REM Start Supabase
echo [1/3] Starting Supabase...
cd supabase
start cmd /k "supabase start"
timeout /t 5 /nobreak >nul
cd ..

REM Start AI Model Service
echo [2/3] Starting AI Model Service...
cd ai-model
start cmd /k "call start_ai_service.bat"
timeout /t 3 /nobreak >nul
cd ..

REM Backend is deployed on Vercel - no need to start locally
echo [3/3] Backend deployed on Vercel (https://iq-backend.vercel.app)
timeout /t 1 /nobreak >nul

REM Start Admin Dashboard
echo [4/3] Starting Admin Dashboard...
cd admin-web
start cmd /k "call start_admin_web.bat"
cd ..

echo.
echo ========================================
echo  All services started!
echo ========================================
echo.
echo Services running at:
echo  - Supabase Studio: http://localhost:54323
echo  - AI Service: http://localhost:8000
echo  - Backend API: https://iq-backend.vercel.app (Deployed)
echo  - Admin Dashboard: http://localhost:5173
echo.
echo Press any key to exit...
pause >nul
