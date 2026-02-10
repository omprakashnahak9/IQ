@echo off
echo ========================================
echo  Installing AI Model Dependencies
echo ========================================
echo.
echo This will install DeepFace and dependencies
echo No C++ Build Tools required!
echo.

REM Upgrade pip first
echo [1/2] Upgrading pip...
python -m pip install --upgrade pip

echo.
echo [2/2] Installing requirements...
echo This may take a few minutes...
echo.

pip install -r requirements.txt

echo.
echo ========================================
echo  Installation Complete!
echo ========================================
echo.
echo You can now start the AI service with:
echo   python api.py
echo.
pause
