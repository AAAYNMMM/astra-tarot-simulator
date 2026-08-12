@echo off
setlocal
cd /d "%~dp0"

where py.exe >nul 2>&1
if errorlevel 1 goto try_python
py -3 --version >nul 2>&1
if not errorlevel 1 goto use_py

:try_python
where python.exe >nul 2>&1
if errorlevel 1 goto no_python
python --version >nul 2>&1
if not errorlevel 1 goto use_python

:no_python
echo Python 3 is required to start Astra Tarot.
pause
exit /b 1

:use_py
py -3 run.py %*
goto after_run

:use_python
python run.py %*

:after_run
if not errorlevel 1 goto done
echo.
echo Failed to start Astra Tarot. Verify that Python 3 is installed and available.
pause
exit /b 1

:done
endlocal
exit /b 0
