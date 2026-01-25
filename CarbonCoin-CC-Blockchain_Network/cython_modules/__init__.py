# Cython optimized modules for blockchain
# These modules provide high-performance implementations of critical functions

try:
    from .crypto_utils import fast_sha256, fast_double_sha256, validate_proof
    from .block_utils import calculate_block_hash, mine_block_hash
    CYTHON_AVAILABLE = True
except ImportError:
    CYTHON_AVAILABLE = False
    print("Warning: Cython modules not compiled. Using pure Python fallback.")
    print("Run 'python setup.py build_ext --inplace' to compile for better performance.")
