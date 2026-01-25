<#
.SYNOPSIS
    Start custom nodes on specified ports

.PARAMETER Ports
    Array of ports to start nodes on

.EXAMPLE
    .\start_nodes.ps1 5000, 5001, 5002
    # Or via main controller: .\blockchain.ps1 start-nodes -Ports 5000, 5001, 5002
#>

param(
  [int[]]$Ports = @(5000, 5001, 5002)
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

foreach ($p in $Ports) {
  Write-Host "Starting node on http://localhost:$p" 
  Start-Process -FilePath "python" -ArgumentList @(
    (Join-Path $root 'run_node.py'),
    $p
  ) -WorkingDirectory $root | Out-Null
}

Write-Host "Done. Nodes running on:"
foreach ($p in $Ports) {
  Write-Host "  http://localhost:$p" 
}
