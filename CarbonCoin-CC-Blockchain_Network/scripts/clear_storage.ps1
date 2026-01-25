<#
.SYNOPSIS
    Clear all blockchain storage data for a fresh start

.DESCRIPTION
    This script removes all data files:
    - blockchain.json (shared blockchain)
    - pending_tx.json (pending transactions)
    - wallets.json (all registered wallets)
    - active_sessions.json (port-wallet mappings)

.PARAMETER Force
    Skip confirmation prompt

.EXAMPLE
    .\clear_storage.ps1           # With confirmation
    .\clear_storage.ps1 -Force    # Skip confirmation
    # Or via main controller: .\blockchain.ps1 clear-data
#>

param(
    [switch]$Force
)

$rootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$dataDir = Join-Path $rootDir "data"

Write-Host ''
Write-Host '==============================================================' -ForegroundColor Cyan
Write-Host '           CarbonCoin - Clear Storage Data                    ' -ForegroundColor Cyan
Write-Host '==============================================================' -ForegroundColor Cyan
Write-Host ''

if (-not (Test-Path $dataDir)) {
    Write-Host 'No data directory found. Nothing to clear.' -ForegroundColor Yellow
    Write-Host ''
    exit 0
}

# Show what will be deleted
$files = Get-ChildItem -Path $dataDir -File -ErrorAction SilentlyContinue
if ($files.Count -eq 0) {
    Write-Host 'Data directory is empty. Nothing to clear.' -ForegroundColor Yellow
    Write-Host ''
    exit 0
}

Write-Host 'The following files will be deleted:' -ForegroundColor Yellow
Write-Host ''
foreach ($file in $files) {
    $size = '{0:N2} KB' -f ($file.Length / 1KB)
    Write-Host "  - $($file.Name) ($size)" -ForegroundColor Gray
}
Write-Host ''

# Confirmation
if (-not $Force) {
    $confirm = Read-Host 'Are you sure you want to delete all blockchain data? (y/N)'
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Host ''
        Write-Host 'Cancelled. No data was deleted.' -ForegroundColor Yellow
        Write-Host ''
        exit 0
    }
}

# Delete files
Write-Host ''
Write-Host 'Clearing storage data...' -ForegroundColor Yellow

try {
    Remove-Item -Path "$dataDir\*" -Force -ErrorAction Stop
    Write-Host ''
    Write-Host '==============================================================' -ForegroundColor Green
    Write-Host ' Storage cleared successfully!' -ForegroundColor Green
    Write-Host '==============================================================' -ForegroundColor Green
    Write-Host ''
    Write-Host 'Next time you start the network, it will begin fresh.' -ForegroundColor Cyan
    Write-Host ''
}
catch {
    Write-Host ''
    Write-Host "[ERROR] Failed to clear storage: $_" -ForegroundColor Red
    Write-Host ''
    exit 1
}
