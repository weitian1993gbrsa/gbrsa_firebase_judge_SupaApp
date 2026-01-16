@echo off
setlocal

:: Configuration
set "SOURCE_DIR=%~dp0"
set "SOURCE_DIR=%SOURCE_DIR:~0,-1%"
set "BACKUP_DIR=C:\Users\nagas\Documents\GitHub\backup"

:: Generate Timestamp (YYYYMMDD_HHMMSS)
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set "dt=%%I"
set "TIMESTAMP=%dt:~0,4%%dt:~4,2%%dt:~6,2%_%dt:~8,6%"
set "ZIP_NAME=gbrsa-supa-app_backup_%TIMESTAMP%.zip"

echo ========================================
echo GBRSA Vue Project Backup
echo ========================================
echo Source: %SOURCE_DIR%
echo Target: %BACKUP_DIR%\%ZIP_NAME%
echo.

    echo Creating backup directory...
    mkdir "%BACKUP_DIR%"
)

echo Updating Build Timestamp...
call node scripts/update_build_time.js
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Failed to update build timestamp. Continuing with backup...
)

:: Run PowerShell to compress, excluding node_modules, .git, and backup folders
echo Compressing files (excluding node_modules, .git, backup)...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$src='%SOURCE_DIR%'; $dst='%BACKUP_DIR%\%ZIP_NAME%'; " ^
    "$exclude = @('node_modules', '.git', 'backup', 'backup script', 'dist'); " ^
    "$items = Get-ChildItem -Path $src | Where-Object { $_.Name -notin $exclude }; " ^
    "if ($items) { Compress-Archive -Path $items.FullName -DestinationPath $dst -Force } else { throw 'No items found to compress' }"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS: Backup saved to %BACKUP_DIR%\%ZIP_NAME%
    echo.
    echo Closing in 3 seconds...
    timeout /t 3
    exit
) else (
    echo.
    echo ERROR: Backup failed.
    echo.
    pause
    exit /b %ERRORLEVEL%
)
