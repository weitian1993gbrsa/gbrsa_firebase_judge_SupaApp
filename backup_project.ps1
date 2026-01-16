$sourceDir = "C:\Users\nagas\Documents\GitHub"
$folderToZip = "gbrsa_firebase_judge_SupaApp"
$fullSourcePath = Join-Path $sourceDir $folderToZip

$backupRoot = "C:\Users\nagas\Documents\GitHub\backup"
$stagingBase = Join-Path $backupRoot "temp_staging"
$stagingTarget = Join-Path $stagingBase $folderToZip
$destFile = Join-Path $backupRoot "gbrsa-vue_backup.zip"

Write-Host "Starting Optimized Backup..."
Write-Host "Source: $fullSourcePath"
Write-Host "Destination: $destFile"

# 1. Setup Directories
if (-not (Test-Path -Path $backupRoot)) {
    New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
}
# Clean Staging
if (Test-Path -Path $stagingBase) {
    Remove-Item -Path $stagingBase -Recurse -Force | Out-Null
}
New-Item -ItemType Directory -Path $stagingTarget -Force | Out-Null

# 2. Smart Copy (Robocopy) to Staging
# /E = recursive, /XD = exclude directories
Write-Host "Copying files (Skipping .git, node_modules)..."
$logFile = Join-Path $backupRoot "robo_log.txt"
robocopy $fullSourcePath $stagingTarget /E /XD ".git" "node_modules" ".gemini" "backup" "dist" /NFL /NDL /NJH /NJS /NC /NS > $logFile

# Robocopy exit codes: 0-7 are success. >=8 is failure.
if ($LASTEXITCODE -ge 8) {
    Write-Error "Robocopy failed with code $LASTEXITCODE"
    exit
}

# 3. Compress Staging Folder
# Removing old zip
if (Test-Path $destFile) { Remove-Item $destFile -Force }

Write-Host "Compressing..."
Compress-Archive -Path $stagingTarget -DestinationPath $destFile -Force

# 4. Cleanup Staging
Remove-Item -Path $stagingBase -Recurse -Force | Out-Null
if (Test-Path $logFile) { Remove-Item $logFile -Force }

# 5. Verify
if (Test-Path $destFile) {
    $size = (Get-Item $destFile).Length / 1MB
    Write-Host "--------------------------------"
    Write-Host "Backup Success!"
    Write-Host "Saved to: $destFile"
    Write-Host "Size: $('{0:N2}' -f $size) MB"
    Write-Host "--------------------------------"
}
else {
    Write-Error "Backup failed. Zip file not created."
}
