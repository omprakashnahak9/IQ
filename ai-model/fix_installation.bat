@echo off
echo ========================================
echo  Fixing TensorFlow/DeepFace Installation
echo ========================================
echo.

echo [1/3] Uninstalling conflicting packages...
pip uninstall -y tensorflow tf-keras keras deepface

echo.
echo [2/3] Installing compatible versions...
pip install tensorflow==2.15.0
pip install protobuf==3.20.3
pip install deepface==0.0.75

echo.
echo [3/3] Installing remaining requirements...
pip install -r requirements.txt

echo.
echo ========================================
echo  Testing Installation...
echo ========================================
echo.

python -c "from deepface import DeepFace; print('✓ DeepFace installed successfully!')"

echo.
echo ========================================
echo  Installation Fixed!
echo ========================================
echo.
pause
