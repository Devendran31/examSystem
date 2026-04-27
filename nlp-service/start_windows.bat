@echo off
echo ============================================
echo  CloudExam NLP Service - Windows Startup
echo ============================================

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.9+
    pause
    exit /b 1
)

echo [1/3] Installing dependencies...
pip install flask flask-cors nltk "scikit-learn>=1.5.0" "numpy>=2.0.0"
if errorlevel 1 (
    echo ERROR: pip install failed. See above for details.
    pause
    exit /b 1
)

echo.
echo [2/3] Downloading NLTK data...
python download_nltk_data.py

echo.
echo [3/3] Starting NLP Flask server on http://localhost:5000
echo Press Ctrl+C to stop.
echo.
python app.py

pause
