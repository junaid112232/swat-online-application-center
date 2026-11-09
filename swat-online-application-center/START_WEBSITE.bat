@echo off
cd /d "%~dp0"
where python >nul 2>nul || (echo Python install nahi hai. python.org se install karein ^(Add Python to PATH ticked^). & pause & exit /b)
python server.py
pause
