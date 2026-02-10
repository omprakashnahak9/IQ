@echo off
echo ========================================
echo  Rebuilding Gate Verification App
echo ========================================
echo.
echo New PC IP: 10.122.185.39
echo Backend URL: http://10.122.185.39:3000
echo.
echo This will:
echo  1. Clean previous build
echo  2. Build new APK
echo  3. Install on connected device
echo.
pause

echo.
echo [1/3] Cleaning previous build...
call gradlew clean

echo.
echo [2/3] Building APK...
call gradlew assembleDebug

echo.
echo [3/3] Installing on device...
adb install -r app\build\outputs\apk\debug\app-debug.apk

echo.
echo ========================================
echo  Installation Complete!
echo ========================================
echo.
echo Now test from phone browser first:
echo http://10.122.185.39:3000/health
echo.
echo Then open the Gate Verification app.
echo.
pause
