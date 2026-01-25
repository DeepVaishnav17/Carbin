<#
.SYNOPSIS
    Create and start a new user node that auto-joins the network

.PARAMETER Port
    The port for the new node (default: auto-select starting from 5000)

.PARAMETER PrivateKey
    (Optional) Private key hex to authenticate with existing wallet.
    If not provided, a new wallet will be created.

.DESCRIPTION
    This script creates a user node with the following logic:
    - If no port specified: auto-selects first available port from 5000+
    - If no wallet specified: creates a new wallet
    - If wallet specified: authenticates with existing wallet
    - Validates port availability and wallet session status

.EXAMPLE
    .\create_user_node.ps1                               # New wallet, auto port
    .\create_user_node.ps1 -Port 5005                    # New wallet, specific port
    .\create_user_node.ps1 -PrivateKey "abc123..."       # Existing wallet, auto port
    .\create_user_node.ps1 -Port 5005 -PrivateKey "abc123..."  # Both specified
#>

param(
    [int]$Port = 0,
    [string]$PrivateKey = ""
)

$rootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$dataDir = Join-Path $rootDir "data"
$sessionsFile = Join-Path $dataDir "active_sessions.json"
$walletsFile = Join-Path $dataDir "wallets.json"

Write-Host ''
Write-Host '==============================================================' -ForegroundColor Cyan
Write-Host '           CarbonCoin - Create User Node                      ' -ForegroundColor Cyan
Write-Host '==============================================================' -ForegroundColor Cyan
Write-Host ''

# Function to check if a port is actually listening
function Test-PortListening {
    param([int]$PortNumber)
    $listening = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | 
                 Where-Object { $_.LocalPort -eq $PortNumber }
    return $null -ne $listening
}

# Function to clean up stale session
function Remove-StaleSession {
    param([string]$PortToRemove)
    if (Test-Path $sessionsFile) {
        try {
            $sessions = Get-Content $sessionsFile -Raw | ConvertFrom-Json
            $newSessions = @{}
            $sessions.PSObject.Properties | ForEach-Object {
                if ($_.Name -ne $PortToRemove) {
                    $newSessions[$_.Name] = $_.Value
                }
            }
            $newSessions | ConvertTo-Json | Set-Content $sessionsFile
            Write-Host "[INFO] Cleaned up stale session for port $PortToRemove" -ForegroundColor Gray
        }
        catch {
            # Ignore errors
        }
    }
}

# Check if wallet is already active (if private key specified)
if ($PrivateKey) {
    Write-Host 'Mode: Using existing wallet (authentication)' -ForegroundColor Yellow
    
    # Check if this wallet is already active on another port
    if (Test-Path $sessionsFile) {
        try {
            $sessions = Get-Content $sessionsFile -Raw | ConvertFrom-Json
            
            # Find wallet address for this private key
            if (Test-Path $walletsFile) {
                $wallets = Get-Content $walletsFile -Raw | ConvertFrom-Json
                $wallets.PSObject.Properties | ForEach-Object {
                    $address = $_.Name
                    $data = $_.Value
                    if ($data.private_key -eq $PrivateKey) {
                        # Check if this address is in active sessions
                        $sessions.PSObject.Properties | ForEach-Object {
                            if ($_.Value -eq $address) {
                                $sessionPort = [int]$_.Name
                                # Verify if the port is actually listening
                                if (Test-PortListening -PortNumber $sessionPort) {
                                    Write-Host ''
                                    Write-Host "[ERROR] This wallet is already active on port $sessionPort" -ForegroundColor Red
                                    Write-Host 'Stop that node first or use a different wallet.' -ForegroundColor Yellow
                                    Write-Host ''
                                    exit 1
                                }
                                else {
                                    # Port is not listening - stale session, clean it up
                                    Write-Host ''
                                    Write-Host "[INFO] Found stale session on port $sessionPort (not running), cleaning up..." -ForegroundColor Gray
                                    Remove-StaleSession -PortToRemove $_.Name
                                }
                            }
                        }
                    }
                }
            }
        }
        catch {
            # Ignore parsing errors, let the node handle it
        }
    }
}
else {
    Write-Host 'Mode: Creating new wallet' -ForegroundColor Yellow
}
Write-Host ''

# Auto-select port if not specified
if ($Port -eq 0) {
    $basePort = 5000
    $maxPort = 5100
    
    # Get all ports currently in use
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
    
    Write-Host "Auto-selected port: $Port" -ForegroundColor Gray
}
else {
    # Check if specified port is available
    $listening = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | 
                 Where-Object { $_.LocalPort -eq $Port }
    
    if ($listening) {
        Write-Host "[ERROR] Port $Port is already in use" -ForegroundColor Red
        Write-Host 'Choose a different port or stop the process using it.' -ForegroundColor Yellow
        Write-Host ''
        exit 1
    }
    
    Write-Host "Using specified port: $Port" -ForegroundColor Gray
}

Write-Host ''
Write-Host "Starting user node on port $Port..." -ForegroundColor Yellow

# Build arguments
$nodeArgs = "run_node.py $Port"
if ($PrivateKey) {
    $nodeArgs = "run_node.py $Port $PrivateKey"
}

# Start the node process with visible window
$process = Start-Process -FilePath 'python' -ArgumentList $nodeArgs -WorkingDirectory $rootDir -PassThru

# Wait for the node to actually start listening (up to 60 seconds)
$maxWait = 60
$waited = 0
$nodeStarted = $false

Write-Host "Waiting for node to start..." -ForegroundColor Gray
while ($waited -lt $maxWait) {
    Start-Sleep -Seconds 1
    $waited++
    
    # Check if process has exited prematurely (error case)
    if ($process.HasExited) {
        Write-Host ''
        Write-Host '[ERROR] Node failed to start!' -ForegroundColor Red
        Write-Host ''
        
        # Check common error cases by examining what might have gone wrong
        if ($PrivateKey) {
            Write-Host '[ERROR] The node process exited unexpectedly.' -ForegroundColor Red
            Write-Host 'Possible causes:' -ForegroundColor Yellow
            Write-Host '  - Invalid private key (does not exist in wallet registry)' -ForegroundColor Gray
            Write-Host '  - Wallet already active on another port' -ForegroundColor Gray
            Write-Host '  - Port already in use' -ForegroundColor Gray
            Write-Host '' 
            Write-Host 'Check the node window for detailed error messages.' -ForegroundColor Yellow
        }
        else {
            Write-Host '[ERROR] The node process exited unexpectedly.' -ForegroundColor Red
            Write-Host 'Check the node window for detailed error messages.' -ForegroundColor Yellow
        }
        Write-Host ''
        exit 1
    }
    
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
    # Process might still be running but port not listening
    Write-Host ''
    Write-Host "[WARNING] Node may not have started properly on port $Port" -ForegroundColor Yellow
    Write-Host 'Check the node window for errors or if initialization is slow.' -ForegroundColor Yellow
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
Write-Host "Process ID: $($process.Id)" -ForegroundColor Gray
Write-Host ''
Write-Host 'The node has automatically joined the network!' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Quick commands:' -ForegroundColor Yellow
Write-Host "  Get balance:    Invoke-RestMethod -Uri 'http://localhost:$Port/balance'" -ForegroundColor Gray
Write-Host "  Get address:    Invoke-RestMethod -Uri 'http://localhost:$Port/address'" -ForegroundColor Gray
Write-Host "  Check peers:    Invoke-RestMethod -Uri 'http://localhost:$Port/peers'" -ForegroundColor Gray
Write-Host "  List wallets:   Invoke-RestMethod -Uri 'http://localhost:$Port/wallets'" -ForegroundColor Gray
Write-Host "  List sessions:  Invoke-RestMethod -Uri 'http://localhost:$Port/sessions'" -ForegroundColor Gray
Write-Host "  Stop node:      .\blockchain.ps1 stop-user -Port $Port" -ForegroundColor Gray
Write-Host ''
