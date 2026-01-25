from ecdsa import SigningKey, VerifyingKey, SECP256k1, BadSignatureError
import hashlib

# Try to use Cython-optimized functions
try:
    from cython_modules.wallet_utils import generate_address
    USE_CYTHON = True
except ImportError:
    USE_CYTHON = False

class Wallet:
    def __init__(self, private_key_hex: str = None):
        """
        Initialize wallet with optional existing private key.
        
        Args:
            private_key_hex: Hex string of existing private key (for restoring wallet)
        """
        if private_key_hex:
            # Restore from existing key
            self.private_key = SigningKey.from_string(
                bytes.fromhex(private_key_hex), 
                curve=SECP256k1
            )
        else:
            # Generate new key pair
            self.private_key = SigningKey.generate(curve=SECP256k1)
        
        self.public_key = self.private_key.get_verifying_key()
        self._cached_address = None

    def _python_address(self):
        """Pure Python address generation."""
        return hashlib.sha256(self.public_key.to_string()).hexdigest()

    def address(self):
        """Get wallet address (cached for performance)."""
        if self._cached_address:
            return self._cached_address
        
        # Use Cython-optimized version if available, with runtime fallback
        cython_success = False
        result = None
        
        if USE_CYTHON:
            try:
                result = generate_address(self.public_key.to_string())
                cython_success = True
            except Exception:
                # Cython failed at runtime, will fall back to Python
                cython_success = False
        
        if not cython_success:
            # Fallback to pure Python
            result = self._python_address()
        
        self._cached_address = result
        return result

    def sign(self, message_hash: bytes) -> str:
        """
        Sign a message hash.
        
        Args:
            message_hash: The hash bytes to sign
            
        Returns:
            Hex string of signature
        """
        return self.private_key.sign(message_hash).hex()

    def get_public_key_hex(self) -> str:
        """Get public key as hex string for verification."""
        return self.public_key.to_string().hex()

    @staticmethod
    def verify_signature(public_key_hex: str, message_hash: bytes, signature_hex: str) -> bool:
        """
        Verify a signature using public key.
        
        Args:
            public_key_hex: Hex string of public key
            message_hash: The hash that was signed
            signature_hex: Hex string of signature
            
        Returns:
            True if signature is valid, False otherwise
        """
        try:
            public_key = VerifyingKey.from_string(
                bytes.fromhex(public_key_hex),
                curve=SECP256k1
            )
            signature = bytes.fromhex(signature_hex)
            return public_key.verify(signature, message_hash)
        except (BadSignatureError, Exception):
            return False
