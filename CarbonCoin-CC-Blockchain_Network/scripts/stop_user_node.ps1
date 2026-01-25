<#
.SYNOPSIS
    Stop a specific user node gracefully.

.DESCRIPTION
    This script stops a user node running on a specified port.
    It sends a shutdown signal to the node, which will:
    - End the session in active_sessions.json
    - Save wallet state
    - Close all connections

.PARAMETER Port
    The port number of the user node to stop.

.EXAMPLE
    .\stop_user_node.ps1 -Port 5000
#>

param(
    [Parameter(Mandatory = $true)]
    [int]$Port
)

$scriptDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "             Stopping User Node on Port $Port               " -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

# First check if any process is using this port
$portConnection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }

if (-not $portConnection) {
    Write-Host "[ERROR] No process found listening on port $Port" -ForegroundColor Red
    Write-Host ""
    exit 1
}

$processId = $portConnection.OwningProcess
Write-Host "[INFO] Found process $processId listening on port $Port" -ForegroundColor Green

# Try to call shutdown endpoint if available (graceful shutdown)
$nodeResponding = $false
try {
    $response = Invoke-RestMethod -Uri "http://localhost:$Port/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
    $nodeResponding = $true
    Write-Host "[INFO] Node is responding on port $Port" -ForegroundColor Green
}
catch {
    Write-Host "[INFO] Node not responding to health check, will force stop" -ForegroundColor Yellow
}

if ($nodeResponding) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$Port/shutdown" -Method POST -TimeoutSec 5 -ErrorAction Stop
        Write-Host "[SUCCESS] Node shutdown signal sent" -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
    catch {
        Write-Host "[INFO] Shutdown endpoint not available, stopping process..." -ForegroundColor Yellow
    }
}

# Check if process is still running and kill it
$processStillRunning = Get-Process -Id $processId -ErrorAction SilentlyContinue
if ($processStillRunning) {
    Write-Host "[INFO] Stopping process $processId..." -ForegroundColor Yellow
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Write-Host "[SUCCESS] Process $processId stopped" -ForegroundColor Green
} else {
    Write-Host "[INFO] Process already stopped" -ForegroundColor Green
}

# Update active sessions to remove this port
Push-Location $scriptDir
try {
    python -c @"
import json
import os

sessions_file = 'data/active_sessions.json'
if os.path.exists(sessions_file):
    with open(sessions_file, 'r') as f:
        sessions = json.load(f)
    
    # Remove session for this port
    port_str = '$Port'
    if port_str in sessions:
        del sessions[port_str]
        with open(sessions_file, 'w') as f:
            json.dump(sessions, f, indent=2)
        print(f'[INFO] Session for port {port_str} removed from active_sessions.json')
    else:
        print(f'[INFO] No session found for port {port_str}')
"@
}
catch {
    Write-Host "[WARN] Could not update sessions file" -ForegroundColor Yellow
}
Pop-Location

# Verify node is stopped
Start-Sleep -Seconds 1
try {
    $response = Invoke-RestMethod -Uri "http://localhost:$Port/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "[WARN] Node may still be running on port $Port" -ForegroundColor Yellow
}
catch {
    Write-Host "[SUCCESS] Node stopped successfully" -ForegroundColor Green
}

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "                    Node Stopped                           " -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""
