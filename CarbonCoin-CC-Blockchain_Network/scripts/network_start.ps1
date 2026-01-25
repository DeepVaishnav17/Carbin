<#
.SYNOPSIS
    Start the complete CarbonCoin network (3 miners + 1 collection node)

.EXAMPLE
    .\network_start.ps1
    # Or via main controller: .\blockchain.ps1 start-network
#>

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "         CarbonCoin (CC) Network Launcher                  " -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

# Start Collection Node first (port 7000)
Write-Host "[1/4] Starting Collection Node on port 7000..." -ForegroundColor Yellow
Start-Process -FilePath "python" -ArgumentList "run_node.py 7000" -WorkingDirectory $scriptDir

Start-Sleep -Seconds 2

# Start Miner Nodes (ports 3000, 3001, 3002)
Write-Host "[2/4] Starting Miner Node 1 on port 3000..." -ForegroundColor Yellow
Start-Process -FilePath "python" -ArgumentList "run_node.py 3000" -WorkingDirectory $scriptDir

Start-Sleep -Seconds 1

Write-Host "[3/4] Starting Miner Node 2 on port 3001..." -ForegroundColor Yellow
Start-Process -FilePath "python" -ArgumentList "run_node.py 3001" -WorkingDirectory $scriptDir

Start-Sleep -Seconds 1

Write-Host "[4/4] Starting Miner Node 3 on port 3002..." -ForegroundColor Yellow
Start-Process -FilePath "python" -ArgumentList "run_node.py 3002" -WorkingDirectory $scriptDir

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Green
Write-Host " All nodes started!" -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Node URLs:" -ForegroundColor Cyan
Write-Host "   Collection: http://localhost:7000" -ForegroundColor White
Write-Host "   Miner 1:    http://localhost:3000" -ForegroundColor White
Write-Host "   Miner 2:    http://localhost:3001" -ForegroundColor White
Write-Host "   Miner 3:    http://localhost:3002" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. Run: .\blockchain.ps1 start-mining" -ForegroundColor White
Write-Host ""
