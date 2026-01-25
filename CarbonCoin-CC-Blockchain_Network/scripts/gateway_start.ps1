# Gateway Start Script
# Starts the centralized Gateway Query Service on port 8000
# This service fetches data from collection node (7000) and provides API for frontend

param(
    [int]$Port = 8000
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CarbonCoin Gateway Query Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if port is already in use
$existingProcess = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($existingProcess) {
    Write-Host "[ERROR] Port $Port is already in use!" -ForegroundColor Red
    Write-Host "Stop the existing process first or use a different port." -ForegroundColor Yellow
    exit 1
}

# Check if collection node is running
Write-Host "[INFO] Checking collection node (port 7000)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:7000/health" -Method Get -TimeoutSec 3
    Write-Host "[OK] Collection node is online" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Collection node (port 7000) is not reachable!" -ForegroundColor Yellow
    Write-Host "Gateway will start but won't be able to fetch blockchain data." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "[INFO] Starting Gateway on port $Port..." -ForegroundColor Yellow
Write-Host ""

# Change to project directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
Set-Location $projectDir

# Start gateway service
python -c "from gateway.query_service import run_gateway; run_gateway($Port)"
