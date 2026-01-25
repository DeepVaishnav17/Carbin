<#
.SYNOPSIS
    Stop mining on all miner nodes

.EXAMPLE
    .\mining_stop.ps1
    # Or via main controller: .\blockchain.ps1 stop-mining
#>

Write-Host ""
Write-Host "Stopping mining on all miner nodes..." -ForegroundColor Cyan
Write-Host ""

$minerUrls = @(
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002"
)

foreach ($minerUrl in $minerUrls) {
    try {
        $response = Invoke-RestMethod -Uri "$minerUrl/miner/stop" -Method POST
        Write-Host "[OK] Mining stopped on $minerUrl" -ForegroundColor Green
        Write-Host "     Final balance: $($response.final_balance)" -ForegroundColor Gray
    }
    catch {
        Write-Host "[FAIL] Could not stop mining on $minerUrl" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "All miners stopped." -ForegroundColor Yellow
Write-Host ""
