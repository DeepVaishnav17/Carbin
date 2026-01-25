<#
.SYNOPSIS
    Stop all running blockchain nodes

.DESCRIPTION
    This script saves all node data to disk before stopping nodes.
    Data includes: blockchain, wallet, pending transactions, and peers.

.EXAMPLE
    .\network_stop.ps1
    # Or via main controller: .\blockchain.ps1 stop-network
#>

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "         Stopping CarbonCoin Network                       " -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

# Define known node ports
$nodePorts = @(7000, 3000, 3001, 3002)

# Also check for any user nodes (5000+)
$userPorts = @()
for ($p = 5000; $p -le 5010; $p++) {
    $userPorts += $p
}
$allPorts = $nodePorts + $userPorts

Write-Host "[1/2] Saving node data to disk..." -ForegroundColor Yellow
Write-Host ""

$savedCount = 0
foreach ($port in $allPorts) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$port/shutdown" -Method POST -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.success) {
            Write-Host "  [SAVED] Node on port $port - Chain: $($response.chain_length) blocks" -ForegroundColor Green
            $savedCount++
        }
    }
    catch {
        # Node not running on this port, skip silently
    }
}

if ($savedCount -eq 0) {
    Write-Host "  No running nodes found to save." -ForegroundColor Yellow
}
else {
    Write-Host ""
    Write-Host "  Saved data for $savedCount node(s)." -ForegroundColor Green
}

Write-Host ""
Write-Host "[2/2] Stopping node processes..." -ForegroundColor Yellow
Write-Host ""

# Give a moment for save operations to complete
Start-Sleep -Seconds 1

# Find Python processes running run_node.py using CIM (CommandLine is not available via Get-Process)
$pythonProcesses = Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -match "run_node\.py"
}

$stoppedCount = 0

if ($pythonProcesses) {
    $pythonProcesses | ForEach-Object {
        try {
            Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop
            Write-Host "  [STOPPED] Process PID: $($_.ProcessId)" -ForegroundColor Green
            $stoppedCount++
        }
        catch {
            Write-Host "  [FAIL] Could not stop process $($_.ProcessId): $_" -ForegroundColor Red
        }
    }
    Write-Host ""
    Write-Host "  Stopped $stoppedCount process(es)." -ForegroundColor Green
}
else {
    Write-Host "  No running blockchain processes found." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Green
Write-Host " Network stopped. Data saved to ./data/ directory.         " -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Green
Write-Host ""
