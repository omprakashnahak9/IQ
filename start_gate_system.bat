@echo off
echo ========================================
echo  Gate Verification System - Local
echo ========================================
echo.
echo Starting services for gate verification...
echo.

REM Start Supabase
echo [1/3] Starting Supabase...
cd supabase
start "Supabase" cmd /k "supabase start"
timeout /t 5 /nobreak >nul
cd ..

REM Start AI Model Service
echo [2/3] Starting AI Model Service...
cd ai-model
start "AI Service" cmd /k "call start_ai_service.bat"
timeout /t 3 /nobreak >nul
cd ..

REM Start Backend API (Local)
echo [3/3] Starting Backend API (Local)...
cd backend
start "Backend API" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul
cd ..

echo.
echo ========================================
echo  Gate System Started!
echo ========================================
echo.
echo Service URLs:
echo  - Supabase Studio: http://localhost:54323
echo  - AI Service: http://localhost:8000
echo  - Backend API: http://localhost:3000 (LOCAL)
echo  - Your PC IP: 192.168.100.153
echo.
echo Gate Verification App Configuration:
echo  - Backend URL: http://192.168.100.153:3000
echo  - Make sure phone is on same WiFi network!
echo.
echo IQ Campus Connect App:
echo  - Uses Vercel: https://iq-backend.vercel.app
echo  - Works from anywhere!
echo.
echo Press any key to exit...
pause >nul
