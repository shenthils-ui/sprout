@echo off
title Sprout server
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js is not installed. Please install it from https://nodejs.org
  echo   ^(the LTS version^), then double-click start.bat again.
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing Sprout's packages - this only happens the first time...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo npm install failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)

if not exist dist (
  echo Building the app - this only happens the first time or after updates...
  call npm run build
  if errorlevel 1 (
    echo Build failed.
    pause
    exit /b 1
  )
)

echo.
echo   Starting Sprout... keep this window open while using the app.
echo.
start "" http://localhost:3000
node server\index.js
pause
