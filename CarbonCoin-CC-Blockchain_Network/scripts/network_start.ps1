<#
.SYNOPSIS
    Start the complete CarbonCoin network (3 miners + 1 collection node)

.DESCRIPTION
    This script starts the core network nodes:
    - 1 Collection Node (port 7000)
    - 3 Miner Nodes (ports 3000, 3001, 3002)
    
    If existing wallet data is found (wallets.json), it will restore wallets:
    - Collection wallet -> port 7000
    - Miner wallets -> any available miner port (loose coupling)
    
    If no data exists, fresh wallets are created for each node.

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
$dataDir = Join-Path $scriptDir "data"
$walletsFile = Join-Path $dataDir "wallets.json"

# Check if we have existing wallet data
$hasExistingData = Test-Path $walletsFile
$collectionKey = $null
$minerKeys = @()

if ($hasExistingData) {
    Write-Host "Found existing wallet data. Restoring network..." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        $walletsData = Get-Content $walletsFile -Raw | ConvertFrom-Json
        
        # Convert PSObject to hashtable for easier iteration
        $walletsData.PSObject.Properties | ForEach-Object {
            $address = $_.Name
            $data = $_.Value
            $label = $data.label
            $privateKey = $data.private_key
            
            if ($label -eq "collection") {
                $collectionKey = $privateKey
                Write-Host "  [FOUND] Collection wallet" -ForegroundColor Green
            }
            elseif ($label -match "^miner_") {
                $minerKeys += $privateKey
                Write-Host "  [FOUND] Miner wallet ($label)" -ForegroundColor Green
            }
        }
        Write-Host ""
    }
    catch {
        Write-Host "  [WARN] Could not parse wallets.json, starting fresh" -ForegroundColor Yellow
        $hasExistingData = $false
    }
}
else {
    Write-Host "No existing data found. Starting fresh network..." -ForegroundColor Yellow
    Write-Host ""
}

# Clear any stale sessions before starting
Write-Host "Clearing stale sessions..." -ForegroundColor Gray
Push-Location $scriptDir
try {
    python -c "from storage.storage import Storage; Storage()" 2>$null
}
catch {
    # Ignore errors, storage init will clean up anyway
}
Pop-Location

# Start all 4 nodes quickly
Write-Host ""
Write-Host "Starting all nodes..." -ForegroundColor Yellow

# Start Collection Node (port 7000)
Write-Host "[1/4] Collection Node on port 7000" -ForegroundColor Cyan -NoNewline
$args7000 = if ($collectionKey) { "run_node.py 7000 $collectionKey" } else { "run_node.py 7000" }
Start-Process -FilePath "python" -ArgumentList $args7000 -WorkingDirectory $scriptDir
if ($collectionKey) { Write-Host " (restored)" -ForegroundColor Gray } else { Write-Host " (new)" -ForegroundColor Gray }

# Start Miner 1 (port 3000)
Write-Host "[2/4] Miner Node on port 3000" -ForegroundColor Cyan -NoNewline
$args3000 = if ($minerKeys.Count -gt 0) { "run_node.py 3000 $($minerKeys[0])" } else { "run_node.py 3000" }
Start-Process -FilePath "python" -ArgumentList $args3000 -WorkingDirectory $scriptDir
if ($minerKeys.Count -gt 0) { Write-Host " (restored)" -ForegroundColor Gray } else { Write-Host " (new)" -ForegroundColor Gray }

# Start Miner 2 (port 3001)
Write-Host "[3/4] Miner Node on port 3001" -ForegroundColor Cyan -NoNewline
$args3001 = if ($minerKeys.Count -gt 1) { "run_node.py 3001 $($minerKeys[1])" } else { "run_node.py 3001" }
Start-Process -FilePath "python" -ArgumentList $args3001 -WorkingDirectory $scriptDir
if ($minerKeys.Count -gt 1) { Write-Host " (restored)" -ForegroundColor Gray } else { Write-Host " (new)" -ForegroundColor Gray }

# Start Miner 3 (port 3002)
Write-Host "[4/4] Miner Node on port 3002" -ForegroundColor Cyan -NoNewline
$args3002 = if ($minerKeys.Count -gt 2) { "run_node.py 3002 $($minerKeys[2])" } else { "run_node.py 3002" }
Start-Process -FilePath "python" -ArgumentList $args3002 -WorkingDirectory $scriptDir
if ($minerKeys.Count -gt 2) { Write-Host " (restored)" -ForegroundColor Gray } else { Write-Host " (new)" -ForegroundColor Gray }

# Brief wait for nodes to initialize
Write-Host ""
Write-Host "Waiting for nodes to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 8

# Quick status check
Write-Host ""
$onlineCount = 0
@(7000, 3000, 3001, 3002) | ForEach-Object {
    try {
        $null = Invoke-RestMethod -Uri "http://localhost:$_/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
        $onlineCount++
    }
    catch { }
}
Write-Host "Nodes online: $onlineCount/4" -ForegroundColor $(if ($onlineCount -eq 4) { "Green" } else { "Yellow" })

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Green
Write-Host " All nodes started!" -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Green
Write-Host ""

if ($hasExistingData -and ($collectionKey -or $minerKeys.Count -gt 0)) {
    Write-Host "Mode: RESTORED from existing data" -ForegroundColor Cyan
}
else {
    Write-Host "Mode: FRESH network started" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Node URLs:" -ForegroundColor Cyan
Write-Host "   Collection: http://localhost:7000" -ForegroundColor White
Write-Host "   Miner 1:    http://localhost:3000" -ForegroundColor White
Write-Host "   Miner 2:    http://localhost:3001" -ForegroundColor White
Write-Host "   Miner 3:    http://localhost:3002" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. Run: .\blockchain.ps1 start-mining" -ForegroundColor White
Write-Host "   2. Run: .\blockchain.ps1 create-user   (optional)" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "   .\blockchain.ps1 status      - Check node status" -ForegroundColor Gray
Write-Host "   .\blockchain.ps1 clear-data  - Reset everything" -ForegroundColor Gray
Write-Host ""
