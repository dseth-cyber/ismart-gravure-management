<#
.SYNOPSIS
    Health monitoring script for Gravure Management System.
    Checks API health, DB connectivity, disk usage, and sends alerts.

.PARAMETER HealthEndpoint
    Health check URL. Default: http://localhost:5000/health

.PARAMETER AlertWebhook
    Optional webhook URL for alerts (Teams/Slack/Discord).

.PARAMETER DiskThresholdPercent
    Disk usage alert threshold. Default: 90

.PARAMETER MemoryThresholdPercent
    Memory usage alert threshold. Default: 90
#>

param(
    [string]$HealthEndpoint = "http://localhost:5000/health",
    [string]$AlertWebhook = "",
    [int]$DiskThresholdPercent = 90,
    [int]$MemoryThresholdPercent = 90
)

function Send-Alert {
    param([string]$Subject, [string]$Body)
    
    Write-Host "[ALERT] $Subject - $Body"
    
    if ($AlertWebhook) {
        $payload = @{
            text = "[Gravure Monitor] $Subject`n$Body`nTime: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        } | ConvertTo-Json
        
        try {
            Invoke-RestMethod -Uri $AlertWebhook -Method Post -Body $payload -ContentType "application/json" -ErrorAction Stop
            Write-Host "[Monitor] Alert sent to webhook"
        } catch {
            Write-Warning "[Monitor] Failed to send alert: $_"
        }
    }
}

Write-Host "========================================"
Write-Host " Gravure Management System Monitor"
Write-Host " $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "========================================"

# 1. Check API health endpoint
$healthy = $false
try {
    $response = Invoke-RestMethod -Uri $HealthEndpoint -TimeoutSec 10 -ErrorAction Stop
    $healthy = $response.status -eq "healthy"
    
    Write-Host "[Health] Status: $($response.status)"
    Write-Host "[Health] DB: $($response.database)"
    Write-Host "[Health] Redis: $($response.redis)"
    Write-Host "[Health] Uptime: $($response.uptime)s"
    
    if (-not $healthy) {
        Send-Alert -Subject "System Unhealthy" -Body "Health check returned: $($response.status). DB: $($response.database), Redis: $($response.redis)"
    }
} catch {
    Write-Host "[Health] FAILED - $($_.Exception.Message)"
    Send-Alert -Subject "Health Check Failed" -Body "Cannot reach $HealthEndpoint : $($_.Exception.Message)"
    $healthy = $false
}

# 2. Check disk usage
try {
    $drives = Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Used -gt 0 }
    foreach ($drive in $drives) {
        $percentUsed = [math]::Round(($drive.Used / $drive.Free) * 100, 1)
        Write-Host "[Disk] $($drive.Root) ${percentUsed}% used"
        
        if ($percentUsed -ge $DiskThresholdPercent) {
            $usedGB = [math]::Round($drive.Used / 1GB, 2)
            $freeGB = [math]::Round($drive.Free / 1GB, 2)
            Send-Alert -Subject "Disk Usage Alert: $($drive.Root) at ${percentUsed}%" -Body "Used: ${usedGB}GB, Free: ${freeGB}GB, Threshold: ${DiskThresholdPercent}%"
        }
    }
} catch {
    Write-Warning "[Disk] Could not check disk usage: $_"
}

# 3. Check Docker containers
try {
    $containers = docker ps --filter "name=gravure" --format "{{.Names}}\t{{.Status}}" 2>$null
    if ($containers) {
        Write-Host "[Docker]"
        foreach ($line in $containers) {
            Write-Host "         $line"
            if ($line -match "gravure-(postgres|redis|backend|frontend)" -and $line -notmatch "Up") {
                Send-Alert -Subject "Container Down" -Body "Container: $line"
            }
        }
    }
} catch {
    Write-Warning "[Docker] Could not check containers: $_"
}

# 4. Check memory with health endpoint data
if ($healthy -and $response.memoryUsage) {
    $memFree = $response.memoryUsage.freeMemory
    $memTotal = $response.memoryUsage.totalMemory
    if ($memTotal -gt 0) {
        $memPercent = [math]::Round((($memTotal - $memFree) / $memTotal) * 100, 1)
        Write-Host "[Memory] ${memPercent}% used"
        
        if ($memPercent -ge $MemoryThresholdPercent) {
            Send-Alert -Subject "Memory Alert" -Body "Memory usage at ${memPercent}% (Threshold: ${MemoryThresholdPercent}%)"
        }
    }
}

Write-Host "========================================"
Write-Host " Monitor check completed."
Write-Host "========================================"
