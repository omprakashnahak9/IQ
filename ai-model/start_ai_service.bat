@echo off
echo Starting AI Model Service on port 8000...
echo.
echo Setting DeepFace models location to D:\deepface_models
set DEEPFACE_HOME=D:\deepface_models
echo.
python api.py
pause
