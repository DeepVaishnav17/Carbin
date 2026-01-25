# Gateway Stop Script
# Stops the Gateway Query Service running on port 8000

param(
    [int]$Port = 8000
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Stopping Gateway Query Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if gateway is running on the port
$connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue

if (-not $connection) {
    Write-Host "[INFO] No service running on port $Port" -ForegroundColor Yellow
    exit 0
}

# Get the process ID
$processId = $connection.OwningProcess | Select-Object -First 1

if ($processId) {
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    
    if ($process) {
        Write-Host "[INFO] Found process: $($process.ProcessName) (PID: $processId)" -ForegroundColor Yellow
        
        # Stop the process
        try {
            Stop-Process -Id $processId -Force
            Write-Host "[OK] Gateway service stopped successfully" -ForegroundColor Green
        } catch {
            Write-Host "[ERROR] Failed to stop process: $_" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "[WARNING] Could not find process with PID $processId" -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] No process found listening on port $Port" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[DONE] Gateway stop complete" -ForegroundColor Green
