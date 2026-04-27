@echo off
echo ============================================
echo  Upload exam-system to GitHub
echo ============================================

echo.
echo Step 1: Initialize git repo
git init

echo.
echo Step 2: Add all files
git add .

echo.
echo Step 3: Commit
git commit -m "Initial commit: Cloud Exam System with NLP Auto-Evaluation"

echo.
echo Step 4: Set branch to main
git branch -M main

echo.
set /p REPO_URL="Paste your GitHub repo URL (e.g. https://github.com/username/repo.git): "
git remote add origin %REPO_URL%

echo.
echo Step 5: Push to GitHub
git push -u origin main

echo.
echo ============================================
echo  Done! Check your GitHub repo.
echo ============================================
pause
