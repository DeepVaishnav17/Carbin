# Cython Optimization Module

This directory contains Cython-optimized implementations of performance-critical blockchain operations.

## What's Included

| Module             | Functions                                   | Purpose                           |
| ------------------ | ------------------------------------------- | --------------------------------- |
| `crypto_utils.pyx` | `fast_sha256`, `validate_proof`             | Hash calculations, PoW validation |
| `block_utils.pyx`  | `calculate_block_hash`, `mine_block_hash`   | Block operations, mining          |
| `wallet_utils.pyx` | `generate_address`, `verify_address_format` | Wallet address generation         |

## Building

### Windows (PowerShell)

```powershell
.\build_cython.ps1
```

### Linux/Mac (Bash)

```bash
chmod +x build_cython.sh
./build_cython.sh
```

### Manual Build

```bash
pip install Cython
python setup.py build_ext --inplace
```

## Requirements

### Windows

- Python 3.8+
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
  - Select "Desktop development with C++" workload

### Linux

```bash
sudo apt install build-essential python3-dev
```

### Mac

```bash
xcode-select --install
```

## Verification

```python
from cython_modules import CYTHON_AVAILABLE
print(f"Cython optimizations: {CYTHON_AVAILABLE}")
```

## Performance

Run the benchmark to see the improvement:

```bash
python benchmark.py
```

Expected improvements:

- **SHA256 hashing**: 1.5-2x faster
- **Block mining**: 2-5x faster (main benefit)
- **Chain validation**: 1.5-3x faster

## How It Works

1. The `.pyx` files contain Cython code (Python-like syntax with C types)
2. Building compiles them to `.c` files, then to native `.pyd` (Windows) or `.so` (Linux/Mac) files
3. Python imports these as regular modules but runs native machine code

## Fallback

If Cython modules aren't built, the blockchain automatically falls back to pure Python:

```python
try:
    from cython_modules.block_utils import mine_block_hash
    USE_CYTHON = True
except ImportError:
    USE_CYTHON = False  # Falls back to pure Python
```

## Troubleshooting

### "error: Microsoft Visual C++ 14.0 or greater is required"

Install Visual Studio Build Tools with C++ workload.

### "fatal error: Python.h: No such file or directory"

Install Python development headers:

```bash
sudo apt install python3-dev  # Ubuntu/Debian
```

### Module not found after build

Make sure you're running from the project root directory where `cython_modules/` exists.
