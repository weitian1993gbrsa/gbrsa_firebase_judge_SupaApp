@echo off
setlocal
cd /d "%~dp0"
title GBRSA SupaApp Launcher

echo Starting GBRSA SupaApp...
echo Current Directory: %CD%
echo.

:: 1. Check if Node.js/NPM is available
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    echo  ERROR: Node.js is NOT installed.
    echo  Please install Node.js from https://nodejs.org/
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    pause
    exit /b
)

:: 2. Check and Install Dependencies
if not exist node_modules (
    echo.
    echo ---------------------------------------------------
    echo  First time setup detected!
    echo  Installing dependencies...
    echo ---------------------------------------------------
    call npm install
    if errorlevel 1 (
        echo.
        echo  ERROR: 'npm install' failed.
        echo  Check your internet connection.
        pause
        exit /b
    )
    echo  Installation Complete!
    echo.
)

echo ---------------------------------------------------
echo  This will start the server on your LOCAL NETWORK.
echo  You can connect other phones/laptops to the IP shown below.
echo ---------------------------------------------------

:: 3. Launch Browser in Background (Delayed)
:: We use port 5174 for this project to avoid conflicts with other apps on 5173
start "" /b cmd /c "timeout /t 5 /nobreak >nul & start http://localhost:5174"

:: 4. Start Server (Using CALL to prevent script exit)
echo Starting Vite Server on Port 5174...
call npm run dev -- --host --port 5174 --strictPort

:: 5. If Server stops, Pause so user can see error
echo.
echo Server stopped.
pause
