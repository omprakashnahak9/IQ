@echo off
echo ========================================
echo Building IQ App with Updated IP
echo ========================================
echo.
echo New IP: 10.168.120.39 (Phone Hotspot)
echo.

REM Set JAVA_HOME to correct JDK
set JAVA_HOME=C:\Program Files\Java\jdk-17
set PATH=%JAVA_HOME%\bin;%PATH%

echo Cleaning previous build...
call gradlew.bat clean

echo.
echo Building APK...
call gradlew.bat assembleDebug

if %errorlevel% == 0 (
    echo.
    echo ========================================
    echo ✅ BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo APK Location:
    echo app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo Installing on connected device...
    call gradlew.bat installDebug
    
    if %errorlevel% == 0 (
        echo.
        echo ========================================
        echo ✅ APP INSTALLED SUCCESSFULLY!
        echo ========================================
        echo.
        echo You can now open the IQ app on your phone!
        echo.
    ) else (
        echo.
        echo ⚠️ Install failed. Please install manually:
        echo 1. Copy app\build\outputs\apk\debug\app-debug.apk to phone
        echo 2. Open the APK file on phone
        echo 3. Install
        echo.
    )
) else (
    echo.
    echo ========================================
    echo ❌ BUILD FAILED!
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo.
    echo Common fixes:
    echo 1. Make sure Android Studio is closed
    echo 2. Delete .gradle folder and try again
    echo 3. Run: gradlew.bat clean
    echo.
)

pause
