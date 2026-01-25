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
    - start-nodes     : Start custom nodes on specified ports
    - start-mining    : Start mining on all miner nodes
    - stop-mining     : Stop mining on all miner nodes
    - create-user     : Create a new user node
    - build           : Build Cython extensions
    - status          : Check status of all nodes
    - help            : Show this help message
    - list            : List all available scripts

.EXAMPLE
    .\blockchain.ps1 start-network
    .\blockchain.ps1 start-mining
    .\blockchain.ps1 create-user
    .\blockchain.ps1 stop-network
    .\blockchain.ps1 status
    .\blockchain.ps1 build

.EXAMPLE
    .\blockchain.ps1 start-nodes -Ports 5000, 5001, 5002
#>

param(
    [Parameter(Position = 0)]
    [ValidateSet('start-network', 'stop-network', 'start-nodes',
                 'start-mining', 'stop-mining', 'build', 'status', 'help', 'list',
                 'create-user', 'new-user')]
    [string]$Command = 'help',
    
    [Parameter(Position = 1, ValueFromRemainingArguments = $true)]
    [int[]]$Ports
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
    Write-Host '  start-nodes     ' -ForegroundColor Green -NoNewline
    Write-Host 'Start custom nodes (use -Ports 5000, 5001)' -ForegroundColor White
    Write-Host '  start-mining    ' -ForegroundColor Green -NoNewline
    Write-Host 'Start mining on all miner nodes' -ForegroundColor White
    Write-Host '  stop-mining     ' -ForegroundColor Green -NoNewline
    Write-Host 'Stop mining on all miner nodes' -ForegroundColor White
    Write-Host '  create-user     ' -ForegroundColor Green -NoNewline
    Write-Host 'Create new user node (auto-joins network)' -ForegroundColor White
    Write-Host '  build           ' -ForegroundColor Green -NoNewline
    Write-Host 'Build Cython extensions for performance' -ForegroundColor White
    Write-Host '  status          ' -ForegroundColor Green -NoNewline
    Write-Host 'Check status of all nodes' -ForegroundColor White
    Write-Host '  list            ' -ForegroundColor Green -NoNewline
    Write-Host 'List all available scripts' -ForegroundColor White
    Write-Host '  help            ' -ForegroundColor Green -NoNewline
    Write-Host 'Show this help message' -ForegroundColor White
    Write-Host ''
    Write-Host 'EXAMPLES:' -ForegroundColor Yellow
    Write-Host '  .\blockchain.ps1 start-network' -ForegroundColor Gray
    Write-Host '  .\blockchain.ps1 start-nodes -Ports 5000, 5001, 5002' -ForegroundColor Gray
    Write-Host '  .\blockchain.ps1 create-user' -ForegroundColor Gray
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
    
    $nodes = @(
        @{ Name = 'Collection'; Url = 'http://localhost:7000' },
        @{ Name = 'Miner 1'; Url = 'http://localhost:3000' },
        @{ Name = 'Miner 2'; Url = 'http://localhost:3001' },
        @{ Name = 'Miner 3'; Url = 'http://localhost:3002' }
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
    'start-nodes' {
        if ($Ports.Count -gt 0) {
            & (Join-Path $scriptDir 'start_nodes.ps1') -Ports $Ports
        }
        else {
            & (Join-Path $scriptDir 'start_nodes.ps1')
        }
    }
    'start-mining' {
        & (Join-Path $scriptDir 'mining_start.ps1')
    }
    'stop-mining' {
        & (Join-Path $scriptDir 'mining_stop.ps1')
    }
    'create-user' {
        if ($Ports.Count -gt 0) {
            & (Join-Path $scriptDir 'create_user_node.ps1') -Port $Ports[0]
        }
        else {
            & (Join-Path $scriptDir 'create_user_node.ps1')
        }
    }
    'new-user' {
        if ($Ports.Count -gt 0) {
            & (Join-Path $scriptDir 'create_user_node.ps1') -Port $Ports[0]
        }
        else {
            & (Join-Path $scriptDir 'create_user_node.ps1')
        }
    }
    'build' {
        & (Join-Path $scriptDir 'build_cython.ps1')
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
