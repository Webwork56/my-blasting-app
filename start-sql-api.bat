@echo off
title IBTIKAR BMS - SQL Server API
cd /d "%~dp0"

echo ============================================
echo   IBTIKAR SQL Server API
echo ============================================
echo.
echo Your SQL instance example:
echo   Server: DESKTOP-9T4EOHQ\WINCC
echo   Database: IBTIKAR_BlastingDB
echo   User: sa
echo   Password: Krypton
echo.
echo API URL for the app must be:
echo   http://localhost:3001
echo.
echo Make sure:
echo  1) SQL Server service is running
echo  2) database\IBTIKAR_BlastingDB.sql already executed in SSMS
echo  3) .env and db-config.json have correct settings
echo.

if not exist ".env" (
  echo Creating .env ...
  (
    echo SQL_AUTH_TYPE=sql
    echo SQL_SERVER=DESKTOP-9T4EOHQ\WINCC
    echo SQL_DATABASE=IBTIKAR_BlastingDB
    echo SQL_USER=sa
    echo SQL_PASSWORD=Krypton
    echo SQL_PORT=1433
    echo SQL_ENCRYPT=false
    echo SQL_TRUST_CERT=true
    echo API_PORT=3001
    echo VITE_API_URL=http://localhost:3001
  ) > .env
)

call npm install
echo.
echo Starting API on http://localhost:3001 ...
echo Keep this window OPEN.
echo.
node server/index.js
pause
