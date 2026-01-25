<#
.SYNOPSIS
    Stop all running blockchain nodes

.DESCRIPTION
    This script stops all Python processes running blockchain nodes.

.EXAMPLE
    .\network_stop.ps1
    # Or via main controller: .\blockchain.ps1 stop-network
#>

Write-Host ""
Write-Host "Stopping all blockchain nodes..." -ForegroundColor Cyan
Write-Host ""

# Find Python processes running run_node.py using CIM (CommandLine is not available via Get-Process)
$pythonProcesses = Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -match "run_node\.py"
}

$stoppedCount = 0

if ($pythonProcesses) {
    $pythonProcesses | ForEach-Object {
        try {
            Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop
            Write-Host "[OK] Stopped node (PID: $($_.ProcessId))" -ForegroundColor Green
            $stoppedCount++
        }
        catch {
            Write-Host "[FAIL] Could not stop process $($_.ProcessId): $_" -ForegroundColor Red
        }
    }
    Write-Host ""
    Write-Host "Stopped $stoppedCount node(s)." -ForegroundColor Green
}
else {
    Write-Host "No running blockchain nodes found." -ForegroundColor Yellow
}

Write-Host ""
