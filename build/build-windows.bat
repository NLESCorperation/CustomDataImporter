@echo off
REM Build script for Windows
REM Run this script from the project root: build\build-windows.bat

setlocal

echo ================================================
echo   SOTI Custom Data Importer - Windows Build
echo ================================================
echo.

REM Navigate to project root
cd /d "%~dp0\.."

REM Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

echo Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%

echo.
echo Building Windows x64 application...
call npm run build:win
if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%

echo.
echo Build complete!
echo Output location: dist\
echo.
echo The Windows x64 installer is ready for distribution.

endlocal
