@echo off
title IBTIKAR BMS - Network Server
cd /d "%~dp0"

echo ============================================
echo   IBTIKAR BMS - Office Network Deploy
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed.
  echo Download from https://nodejs.org and install, then run again.
  pause
  exit /b 1
)

echo [1/3] Installing dependencies (first time may take a minute)...
call npm install
if errorlevel 1 (
  echo ERROR: npm install failed.
  pause
  exit /b 1
)

echo.
echo [2/3] Building production app...
call npm run build
if errorlevel 1 (
  echo ERROR: build failed.
  pause
  exit /b 1
)

echo.
echo [3/3] Starting network server on port 5000...
echo.
echo --------------------------------------------
echo   On THIS PC open:   http://localhost:5000
echo.
echo   On OTHER PCs open: http://YOUR-PC-IP:5000
echo   Example:           http://192.168.1.20:5000
echo.
echo   Login: admin@ibtikar.com
echo   Password: any
echo.
echo   Keep this window OPEN while people use the app.
echo   Press Ctrl+C to stop the server.
echo --------------------------------------------
echo.

REM Show this PC IPv4 addresses
echo Your network IP address(es):
ipconfig | findstr /i "IPv4"
echo.

npx --yes serve dist -l 5000
pause
