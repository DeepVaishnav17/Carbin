<#
.SYNOPSIS
    Create and start a new user node that auto-joins the network

.PARAMETER Port
    The port for the new node (default: auto-select starting from 5000)

.EXAMPLE
    .\create_user_node.ps1
    .\create_user_node.ps1 5005
#>

param(
    [int]$Port = 0
)

$rootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host ''
Write-Host '==============================================================' -ForegroundColor Cyan
Write-Host '           CarbonCoin - Create New User Node                  ' -ForegroundColor Cyan
Write-Host '==============================================================' -ForegroundColor Cyan
Write-Host ''

# Auto-select port if not specified
if ($Port -eq 0) {
    $basePort = 5000
    $maxPort = 5100
    
    # Get all ports currently in use (faster than Test-NetConnection)
    $usedPorts = @()
    try {
        $usedPorts = (Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | 
                      Select-Object -ExpandProperty LocalPort -Unique)
    }
    catch {
        # Fallback: use netstat if Get-NetTCPConnection fails
        $usedPorts = netstat -an | Select-String 'LISTENING' | ForEach-Object {
            if ($_ -match ':(\d+)\s') { [int]$matches[1] }
        }
    }
    
    for ($p = $basePort; $p -lt $maxPort; $p++) {
        if ($p -notin $usedPorts) {
            $Port = $p
            break
        }
    }
    
    if ($Port -eq 0) {
        Write-Host '[ERROR] No available ports found in range 5000-5100' -ForegroundColor Red
        exit 1
    }
}

Write-Host "Starting new user node on port $Port..." -ForegroundColor Yellow

# Start the node
Start-Process -FilePath 'python' -ArgumentList "run_node.py $Port" -WorkingDirectory $rootDir

# Wait for the node to actually start listening (up to 60 seconds)
$maxWait = 60
$waited = 0
$nodeStarted = $false

Write-Host "Waiting for node to start..." -ForegroundColor Gray
while ($waited -lt $maxWait) {
    Start-Sleep -Seconds 1
    $waited++
    
    # Check if port is now listening
    $listening = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | 
                 Where-Object { $_.LocalPort -eq $Port }
    
    if ($listening) {
        $nodeStarted = $true
        break
    }
    
    # Show progress every 5 seconds
    if ($waited % 5 -eq 0) {
        Write-Host "  Still waiting... ($waited seconds)" -ForegroundColor Gray
    }
}

if (-not $nodeStarted) {
    Write-Host ''
    Write-Host "[WARNING] Node may not have started properly on port $Port" -ForegroundColor Yellow
    Write-Host 'Check if another process is using the port or if there was an error.' -ForegroundColor Yellow
    Write-Host ''
    exit 1
}

# The node will auto-register with the network (handled in app.py create_app)
Write-Host ''
Write-Host '==============================================================' -ForegroundColor Green
Write-Host ' User Node Created Successfully!' -ForegroundColor Green
Write-Host '==============================================================' -ForegroundColor Green
Write-Host ''
Write-Host "Node URL: http://localhost:$Port" -ForegroundColor White
Write-Host ''
Write-Host 'The node has automatically joined the network!' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Quick commands:' -ForegroundColor Yellow
Write-Host "  Get balance:    Invoke-RestMethod -Uri 'http://localhost:$Port/balance'" -ForegroundColor Gray
Write-Host "  Get address:    Invoke-RestMethod -Uri 'http://localhost:$Port/address'" -ForegroundColor Gray
Write-Host "  Check peers:    Invoke-RestMethod -Uri 'http://localhost:$Port/peers'" -ForegroundColor Gray
Write-Host ''
