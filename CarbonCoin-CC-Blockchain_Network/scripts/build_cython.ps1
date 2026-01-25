<# 
.SYNOPSIS
    Build script for Cython extensions on Windows

.DESCRIPTION
    This script builds the Cython extensions for the blockchain network.
    It requires Python and Cython to be installed.
    
    For compilation, you need one of:
    - Visual Studio Build Tools (recommended)
    - MinGW-w64

.EXAMPLE
    .\build_cython.ps1
    # Or via main controller: .\blockchain.ps1 build
#>

$rootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Push-Location $rootDir

Write-Host "=== Blockchain Network - Cython Build Script ===" -ForegroundColor Cyan
Write-Host ""

# Check Python
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Python not found in PATH" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "Found: $pythonVersion" -ForegroundColor Green

# Check Cython
$cythonCheck = python -c "import Cython; print(f'Cython {Cython.__version__}')" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Cython not found. Installing..." -ForegroundColor Yellow
    pip install Cython>=3.0.0
}
else {
    Write-Host "Found: $cythonCheck" -ForegroundColor Green
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt

Write-Host ""
Write-Host "Building Cython extensions..." -ForegroundColor Cyan

# Build the extensions
python setup.py build_ext --inplace

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== Build Successful! ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Cython modules compiled and ready to use." -ForegroundColor Green
    Write-Host "The blockchain will automatically use optimized C extensions." -ForegroundColor Green
    Write-Host ""
    Write-Host "To verify, run:" -ForegroundColor Cyan
    Write-Host "  python -c `"from cython_modules import CYTHON_AVAILABLE; print(f'Cython: {CYTHON_AVAILABLE}')`""
}
else {
    Write-Host ""
    Write-Host "=== Build Failed ===" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "1. Install Visual Studio Build Tools:"
    Write-Host "   https://visualstudio.microsoft.com/visual-cpp-build-tools/"
    Write-Host ""
    Write-Host "2. Or install MinGW-w64 and configure distutils"
    Write-Host ""
    Write-Host "The blockchain will still work with pure Python (slower)." -ForegroundColor Yellow
}

Pop-Location
