<#
.SYNOPSIS
    CarbonCoin Blockchain - Main Controller Script

.DESCRIPTION
    This is the main entry point for managing the CarbonCoin blockchain network.
    It provides a unified interface to all blockchain operations.
    Nodes automatically discover and connect to peers on startup.

.PARAMETER Command
    The command to execute. Available commands:
    - start-network   : Start all nodes (collection + miners) - peers auto-connect
    - stop-network    : Stop all running nodes
    - start-mining    : Start mining on all miner nodes
    - stop-mining     : Stop mining on all miner nodes
    - create-user     : Create a new user node
    - stop-user       : Stop a specific user node
    - start-gateway   : Start the Gateway API service (port 8000)
    - stop-gateway    : Stop the Gateway API service
    - build           : Build Cython extensions
    - status          : Check status of all nodes
    - clear-data      : Clear all storage data for fresh start
    - help            : Show this help message
    - list            : List all available scripts

.PARAMETER Port
    Optional port number for create-user or stop-user commands.
    If not specified, an available port will be auto-selected.

.PARAMETER PrivateKey
    Optional private key hex string for create-user command.
    Use this to restore an existing wallet on a new user node.

.EXAMPLE
    .\blockchain.ps1 start-network
    .\blockchain.ps1 start-mining
    .\blockchain.ps1 create-user
    .\blockchain.ps1 create-user -Port 5000
    .\blockchain.ps1 create-user -PrivateKey "abc123..."
    .\blockchain.ps1 create-user -Port 5000 -PrivateKey "abc123..."
    .\blockchain.ps1 stop-user -Port 5000
    .\blockchain.ps1 start-gateway
    .\blockchain.ps1 stop-gateway
    .\blockchain.ps1 stop-network
    .\blockchain.ps1 status
    .\blockchain.ps1 clear-data
    .\blockchain.ps1 build

#>

param(
    [Parameter(Position = 0)]
    [ValidateSet('start-network', 'stop-network',
                 'start-mining', 'stop-mining', 'build', 'status', 'help', 'list',
                 'create-user', 'new-user', 'stop-user', 'clear-data',
                 'start-gateway', 'stop-gateway')]
    [string]$Command = 'help',
    
    [Parameter()]
    [int]$Port = 0,
    
    [Parameter()]
    [string]$PrivateKey = ""
)

$scriptDir = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'scripts'

function Show-Banner {
    Write-Host ''
    Write-Host '==============================================================' -ForegroundColor Cyan
    Write-Host '           CarbonCoin (CC) Blockchain Controller              ' -ForegroundColor Cyan
    Write-Host '==============================================================' -ForegroundColor Cyan
    Write-Host ''
}

function Show-Help {
    Show-Banner
    Write-Host 'USAGE:' -ForegroundColor Yellow
    Write-Host '  .\blockchain.ps1 [command] [options]' -ForegroundColor White
    Write-Host ''
    Write-Host 'COMMANDS:' -ForegroundColor Yellow
    Write-Host '  start-network   ' -ForegroundColor Green -NoNewline
    Write-Host 'Start all nodes (collection + 3 miners)' -ForegroundColor White
    Write-Host '  stop-network    ' -ForegroundColor Green -NoNewline
    Write-Host 'Stop all running blockchain nodes' -ForegroundColor White
    Write-Host '  start-mining    ' -ForegroundColor Green -NoNewline
    Write-Host 'Start mining on all miner nodes' -ForegroundColor White
    Write-Host '  stop-mining     ' -ForegroundColor Green -NoNewline
    Write-Host 'Stop mining on all miner nodes' -ForegroundColor White
    Write-Host '  create-user     ' -ForegroundColor Green -NoNewline
    Write-Host 'Create new user node (auto-joins network)' -ForegroundColor White
    Write-Host '  stop-user       ' -ForegroundColor Green -NoNewline
    Write-Host 'Stop a specific user node by port' -ForegroundColor White
    Write-Host '  start-gateway   ' -ForegroundColor Green -NoNewline
    Write-Host 'Start Gateway API service (port 8000)' -ForegroundColor White
    Write-Host '  stop-gateway    ' -ForegroundColor Green -NoNewline
    Write-Host 'Stop Gateway API service' -ForegroundColor White
    Write-Host '  clear-data      ' -ForegroundColor Green -NoNewline
    Write-Host 'Clear all storage data for fresh start' -ForegroundColor White
    Write-Host '  build           ' -ForegroundColor Green -NoNewline
    Write-Host 'Build Cython extensions for performance' -ForegroundColor White
    Write-Host '  status          ' -ForegroundColor Green -NoNewline
    Write-Host 'Check status of all nodes' -ForegroundColor White
    Write-Host '  list            ' -ForegroundColor Green -NoNewline
    Write-Host 'List all available scripts' -ForegroundColor White
    Write-Host '  help            ' -ForegroundColor Green -NoNewline
    Write-Host 'Show this help message' -ForegroundColor White
    Write-Host ''
    Write-Host 'OPTIONS:' -ForegroundColor Yellow
    Write-Host '  -Port           ' -ForegroundColor Cyan -NoNewline
    Write-Host 'Port number for create-user/stop-user' -ForegroundColor White
    Write-Host '  -PrivateKey     ' -ForegroundColor Cyan -NoNewline
    Write-Host 'Private key hex to restore existing wallet' -ForegroundColor White
    Write-Host ''
    Write-Host 'EXAMPLES:' -ForegroundColor Yellow
    Write-Host '  .\blockchain.ps1 start-network' -ForegroundColor Gray
    Write-Host '  .\blockchain.ps1 create-user' -ForegroundColor Gray
    Write-Host '  .\blockchain.ps1 create-user -Port 5000' -ForegroundColor Gray
    Write-Host '  .\blockchain.ps1 create-user -PrivateKey "abc123..."' -ForegroundColor Gray
    Write-Host '  .\blockchain.ps1 stop-user -Port 5000' -ForegroundColor Gray
    Write-Host '  .\blockchain.ps1 status' -ForegroundColor Gray
    Write-Host ''
    Write-Host 'QUICK START:' -ForegroundColor Yellow
    Write-Host '  1. .\blockchain.ps1 start-network    (peers auto-connect)' -ForegroundColor Gray
    Write-Host '  2. .\blockchain.ps1 start-mining' -ForegroundColor Gray
    Write-Host '  3. .\blockchain.ps1 create-user      (optional - add user nodes)' -ForegroundColor Gray
    Write-Host ''
}

function Show-Status {
    Show-Banner
    Write-Host 'Checking node status...' -ForegroundColor Cyan
    Write-Host ''
    
    Write-Host 'Core Nodes:' -ForegroundColor Yellow
    $nodes = @(
        @{ Name = 'Collection'; Url = 'http://localhost:7000' },
        @{ Name = 'Miner 1'; Url = 'http://localhost:3000' },
        @{ Name = 'Miner 2'; Url = 'http://localhost:3001' },
        @{ Name = 'Miner 3'; Url = 'http://localhost:3002' },
        @{ Name = 'Gateway'; Url = 'http://localhost:8000' }
    )
    
    foreach ($node in $nodes) {
        try {
            $response = Invoke-RestMethod -Uri "$($node.Url)/stats" -Method GET -TimeoutSec 2
            Write-Host '  [ONLINE]  ' -ForegroundColor Green -NoNewline
            Write-Host "$($node.Name) - $($node.Url)" -ForegroundColor White -NoNewline
            Write-Host " (Blocks: $($response.chain_length))" -ForegroundColor Gray
        }
        catch {
            Write-Host '  [OFFLINE] ' -ForegroundColor Red -NoNewline
            Write-Host "$($node.Name) - $($node.Url)" -ForegroundColor White
        }
    }
    
    # Check for user nodes from active sessions
    $sessionsFile = Join-Path $PSScriptRoot 'data\active_sessions.json'
    
    if (Test-Path $sessionsFile) {
        $sessions = Get-Content $sessionsFile -Raw | ConvertFrom-Json
        $userPorts = $sessions.PSObject.Properties | Where-Object { [int]$_.Name -ge 5000 } | Select-Object -ExpandProperty Name
        
        if ($userPorts.Count -gt 0) {
            Write-Host ''
            Write-Host 'User Nodes:' -ForegroundColor Yellow
            $userIndex = 1
            foreach ($port in $userPorts) {
                try {
                    $response = Invoke-RestMethod -Uri "http://localhost:$port/stats" -Method GET -TimeoutSec 2
                    Write-Host '  [ONLINE]  ' -ForegroundColor Green -NoNewline
                    Write-Host "User $userIndex - http://localhost:$port" -ForegroundColor White -NoNewline
                    Write-Host " (Balance: $($response.balance))" -ForegroundColor Gray
                }
                catch {
                    Write-Host '  [OFFLINE] ' -ForegroundColor Red -NoNewline
                    Write-Host "User $userIndex - http://localhost:$port (stale session)" -ForegroundColor White
                }
                $userIndex++
            }
        }
    }
    
    Write-Host ''
}

function List-Scripts {
    Show-Banner
    Write-Host 'Available scripts in ./scripts folder:' -ForegroundColor Cyan
    Write-Host ''
    
    Get-ChildItem -Path $scriptDir -Filter '*.ps1' | ForEach-Object {
        $scriptName = $_.BaseName
        Write-Host "  - $scriptName" -ForegroundColor Green
    }
    Write-Host ''
    Write-Host 'Run directly: .\scripts\{script-name}.ps1' -ForegroundColor Gray
    Write-Host 'Or via controller: .\blockchain.ps1 {command}' -ForegroundColor Gray
    Write-Host ''
}

# Main command dispatcher
switch ($Command) {
    'start-network' {
        & (Join-Path $scriptDir 'network_start.ps1')
    }
    'stop-network' {
        & (Join-Path $scriptDir 'network_stop.ps1')
    }
    'start-mining' {
        & (Join-Path $scriptDir 'mining_start.ps1')
    }
    'stop-mining' {
        & (Join-Path $scriptDir 'mining_stop.ps1')
    }
    'create-user' {
        $params = @{}
        if ($Port -gt 0) { $params['Port'] = $Port }
        if ($PrivateKey) { $params['PrivateKey'] = $PrivateKey }
        & (Join-Path $scriptDir 'create_user_node.ps1') @params
    }
    'new-user' {
        $params = @{}
        if ($Port -gt 0) { $params['Port'] = $Port }
        if ($PrivateKey) { $params['PrivateKey'] = $PrivateKey }
        & (Join-Path $scriptDir 'create_user_node.ps1') @params
    }
    'stop-user' {
        if ($Port -eq 0) {
            Write-Host ""
            Write-Host "ERROR: Port is required for stop-user command" -ForegroundColor Red
            Write-Host "Usage: .\blockchain.ps1 stop-user -Port <port_number>" -ForegroundColor Yellow
            Write-Host ""
            exit 1
        }
        & (Join-Path $scriptDir 'stop_user_node.ps1') -Port $Port
    }
    'build' {
        & (Join-Path $scriptDir 'build_cython.ps1')
    }
    'start-gateway' {
        & (Join-Path $scriptDir 'gateway_start.ps1')
    }
    'stop-gateway' {
        & (Join-Path $scriptDir 'gateway_stop.ps1')
    }
    'clear-data' {
        & (Join-Path $scriptDir 'clear_storage.ps1')
    }
    'status' {
        Show-Status
    }
    'list' {
        List-Scripts
    }
    'help' {
        Show-Help
    }
    default {
        Show-Help
    }
}
