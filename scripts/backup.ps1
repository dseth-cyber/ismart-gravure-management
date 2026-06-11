<#
.SYNOPSIS
    Automated PostgreSQL backup script for Gravure Management System.
    Supports daily, weekly, monthly rotation with configurable retention.

.DESCRIPTION
    This script creates timestamped dumps using pg_dump via Docker.
    It manages retention: keeps N daily, N weekly, N monthly backups.
    Weekly = Sunday, Monthly = 1st day of month.

.PARAMETER BackupDir
    Directory where backups are stored. Default: ./backups

.PARAMETER ContainerName
    PostgreSQL container name. Default: gravure-postgres

.PARAMETER DbUser
    Database user. Default: gravure_user

.PARAMETER DbName
    Database name. Default: gravure_db

.PARAMETER RetentionDaily
    Number of daily backups to keep. Default: 7

.PARAMETER RetentionWeekly
    Number of weekly backups to keep. Default: 4

.PARAMETER RetentionMonthly
    Number of monthly backups to keep. Default: 3

.EXAMPLE
    .\backup.ps1 -BackupDir "D:\backups\gravure"
#>

param(
    [string]$BackupDir = ".\backups",
    [string]$ContainerName = "gravure-postgres",
    [string]$DbUser = "gravure_user",
    [string]$DbName = "gravure_db",
    [int]$RetentionDaily = 7,
    [int]$RetentionWeekly = 4,
    [int]$RetentionMonthly = 3
)

# Ensure backup directory exists
if (-not (Test-Path -LiteralPath $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "[Backup] Created directory: $BackupDir"
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$dayOfWeek = (Get-Date).DayOfWeek
$dayOfMonth = (Get-Date).Day

# Determine backup type
$backupType = "daily"
if ($dayOfWeek -eq "Sunday") { $backupType = "weekly" }
if ($dayOfMonth -eq 1) { $backupType = "monthly" }

$filename = "gravure_${backupType}_${timestamp}.dump"
$filepath = Join-Path -Path $BackupDir -ChildPath $filename

Write-Host "[Backup] Starting ${backupType} backup..."

# Step 1: Run pg_dump inside container
$dumpFile = "/var/lib/postgresql/${filename}"
$dockerExec = "docker", "exec", "-t", $ContainerName, "pg_dump", "-U", $DbUser, "-d", $DbName, "-F", "c", "-b", "-v", "-f", $dumpFile

Write-Host "[Backup] Executing pg_dump..."
$process = Start-Process -FilePath "docker" -ArgumentList $dockerExec -NoNewWindow -Wait -PassThru
if ($process.ExitCode -ne 0) {
    Write-Error "[Backup] pg_dump failed with exit code $($process.ExitCode)"
    exit 1
}

# Step 2: Copy dump from container to host
Write-Host "[Backup] Copying backup to host..."
$dockerCp = "docker", "cp", "${ContainerName}:${dumpFile}", $filepath
$cpProcess = Start-Process -FilePath "docker" -ArgumentList $dockerCp -NoNewWindow -Wait -PassThru
if ($cpProcess.ExitCode -ne 0) {
    Write-Error "[Backup] docker cp failed"
    exit 1
}

# Step 3: Remove dump from container
$dockerRm = "docker", "exec", "-t", $ContainerName, "rm", $dumpFile
Start-Process -FilePath "docker" -ArgumentList $dockerRm -NoNewWindow -Wait | Out-Null

# Verify backup file
if (-not (Test-Path -LiteralPath $filepath)) {
    Write-Error "[Backup] Backup file not found: $filepath"
    exit 1
}

$fileSize = (Get-Item -LiteralPath $filepath).Length
Write-Host "[Backup] Created: $filename ($([math]::Round($fileSize / 1MB, 2)) MB)"

# Step 4: Retention cleanup
Write-Host "[Backup] Cleaning up old backups..."

function Get-BackupFiles {
    param([string]$Type)
    $pattern = "gravure_${type}_*.dump"
    return Get-ChildItem -Path $BackupDir -Filter $pattern | Sort-Object Name -Descending
}

# Daily retention
$dailyFiles = Get-BackupFiles -Type "daily"
if ($dailyFiles.Count -gt $RetentionDaily) {
    $toRemove = $dailyFiles | Select-Object -Skip $RetentionDaily
    foreach ($f in $toRemove) {
        Remove-Item -LiteralPath $f.FullName -Force
        Write-Host "[Backup] Removed old daily: $($f.Name)"
    }
}

# Weekly retention
$weeklyFiles = Get-BackupFiles -Type "weekly"
if ($weeklyFiles.Count -gt $RetentionWeekly) {
    $toRemove = $weeklyFiles | Select-Object -Skip $RetentionWeekly
    foreach ($f in $toRemove) {
        Remove-Item -LiteralPath $f.FullName -Force
        Write-Host "[Backup] Removed old weekly: $($f.Name)"
    }
}

# Monthly retention
$monthlyFiles = Get-BackupFiles -Type "monthly"
if ($monthlyFiles.Count -gt $RetentionMonthly) {
    $toRemove = $monthlyFiles | Select-Object -Skip $RetentionMonthly
    foreach ($f in $toRemove) {
        Remove-Item -LiteralPath $f.FullName -Force
        Write-Host "[Backup] Removed old monthly: $($f.Name)"
    }
}

Write-Host "[Backup] Completed successfully: $filename"
