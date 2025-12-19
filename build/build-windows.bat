@echo off
REM Build script for Windows
REM Run this script from the project root: build\build-windows.bat

echo ================================================
echo   SOTI Custom Data Importer - Windows Build
echo ================================================
echo.

REM Navigate to project root
cd /d "%~dp0\.."

REM Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo X Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

echo Installing dependencies...
call npm install

echo.
echo Building Windows application...
call npm run build:win

echo.
echo Build complete!
echo Output location: dist\
echo.
echo The .exe installer is ready for distribution.
pause

