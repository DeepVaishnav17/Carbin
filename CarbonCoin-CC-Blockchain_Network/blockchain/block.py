import hashlib
import json

# Try to use Cython-optimized functions
try:
    from cython_modules.block_utils import calculate_block_hash
    USE_CYTHON = True
except ImportError:
    USE_CYTHON = False

class Block:
    def __init__(self, index, timestamp, data, previous_hash, nonce=0):
        self.index = index
        self.timestamp = timestamp
        self.data = data
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.hash = self.calculate_hash()

    def _python_calculate_hash(self):
        """Pure Python hash calculation."""
        block_string = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()

    def calculate_hash(self):
        # Use Cython-optimized version if available, with runtime fallback
        cython_success = False
        result = None
        
        if USE_CYTHON:
            try:
                result = calculate_block_hash(
                    self.index, 
                    float(self.timestamp), 
                    self.data, 
                    self.previous_hash, 
                    self.nonce
                )
                cython_success = True
            except Exception:
                # Cython failed at runtime, will fall back to Python
                cython_success = False
        
        if not cython_success:
            # Fallback to pure Python
            result = self._python_calculate_hash()
        
        return result
