<#
.SYNOPSIS
    Start mining on all miner nodes

.DESCRIPTION
    This script starts the mining service on all 3 miner nodes.
    Mining will continue in the background until stopped.

.EXAMPLE
    .\mining_start.ps1
    # Or via main controller: .\blockchain.ps1 start-mining
#>

Write-Host ""
Write-Host "Starting mining on all miner nodes..." -ForegroundColor Cyan
Write-Host ""

$minerUrls = @(
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002"
)

foreach ($minerUrl in $minerUrls) {
    try {
        $response = Invoke-RestMethod -Uri "$minerUrl/miner/start" -Method POST
        Write-Host "[OK] Mining started on $minerUrl" -ForegroundColor Green
        Write-Host "     Reward: $($response.mining_reward)" -ForegroundColor Gray
    }
    catch {
        Write-Host "[FAIL] Could not start mining on $minerUrl" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "All miners are now mining CarbonCoins!" -ForegroundColor Green
Write-Host ""
Write-Host "Monitor progress:" -ForegroundColor Yellow
Write-Host '  Invoke-RestMethod -Uri "http://localhost:7000/balance"  # Collection balance' -ForegroundColor Gray
Write-Host '  Invoke-RestMethod -Uri "http://localhost:7000/stats"    # Network stats' -ForegroundColor Gray
Write-Host ""
