@echo off
setlocal
cd /d "%~dp0"
set "PORT=%~1"
if not defined PORT set "PORT=18798"
echo Document Studio 3.7.0
where py >nul 2>nul
if not errorlevel 1 (
  py -3 serve.py %PORT%
  goto end
)
where python >nul 2>nul
if not errorlevel 1 (
  python serve.py %PORT%
  goto end
)
echo Python 3 was not found. Install it from https://www.python.org/downloads/
echo Then double-click this file again.
:end
echo.
pause
