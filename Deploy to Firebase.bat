@echo off
echo.
echo ========================================
echo   GBRSA - Deploying to Firebase
echo ========================================
echo.

echo STEP 0: Updating Build Timestamp...
call node scripts/update_build_time.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to update build timestamp! Aborting.
    pause
    exit /b %ERRORLEVEL%
)

echo STEP 1: Building the application...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build failed! Aborting deployment.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo STEP 2: Deploying to Firebase Hosting...
call firebase deploy

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Deployment failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================
echo   DEPLOYMENT SUCCESSFUL!
echo ========================================
echo.
echo Closing in 3 seconds...
timeout /t 3
exit
