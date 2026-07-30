@echo off
chcp 65001 >nul
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 run.py
) else (
  python run.py
)
if errorlevel 1 (
  echo.
  echo 启动失败：请确认已经安装 Python 3。
  pause
)
