import hashlib
import json
import time

# Try to use Cython-optimized functions
try:
    from cython_modules.block_utils import fast_transaction_hash_bytes
    USE_CYTHON = True
except ImportError:
    USE_CYTHON = False

from config import TransactionType, COINBASE_ADDRESS, COIN_SYMBOL

class Transaction:
    def __init__(self, sender: str, receiver: str, amount: float, 
                 signature: str = "", tx_type: str = TransactionType.TRANSFER,
                 public_key: str = "", timestamp: float = None):
        """
        Create a transaction.
        
        Args:
            sender: Sender's wallet address
            receiver: Receiver's wallet address
            amount: Amount of CC to transfer
            signature: Digital signature of the transaction
            tx_type: Type of transaction (coinbase, transfer, auto_transfer)
            public_key: Sender's public key (for signature verification)
            timestamp: Transaction timestamp
        """
        self.sender = sender
        self.receiver = receiver
        self.amount = float(amount)
        self.signature = signature
        self.tx_type = tx_type
        self.public_key = public_key
        self.timestamp = timestamp or time.time()

    def _python_hash(self):
        """Pure Python hash calculation."""
        tx_string = json.dumps({
            "sender": self.sender,
            "receiver": self.receiver,
            "amount": self.amount,
            "timestamp": self.timestamp
        }, sort_keys=True)
        return hashlib.sha256(tx_string.encode()).digest()

    def hash(self) -> bytes:
        """Calculate transaction hash."""
        # Use Cython-optimized version if available, with runtime fallback
        cython_success = False
        result = None
        
        if USE_CYTHON:
            try:
                result = fast_transaction_hash_bytes(self.sender, self.receiver, float(self.amount), float(self.timestamp))
                cython_success = True
            except Exception:
                # Cython failed at runtime, will fall back to Python
                cython_success = False
        
        if not cython_success:
            # Fallback to pure Python
            result = self._python_hash()
        
        return result

    def hash_hex(self) -> str:
        """Get transaction hash as hex string."""
        return self.hash().hex()

    def is_coinbase(self) -> bool:
        """Check if this is a coinbase (mining reward) transaction."""
        return self.tx_type == TransactionType.COINBASE or self.sender == COINBASE_ADDRESS

    def is_valid(self) -> bool:
        """
        Validate transaction.
        
        Returns:
            True if transaction is valid
        """
        # Coinbase transactions don't need signature verification
        if self.is_coinbase():
            return self.amount > 0 and self.receiver != ""
        
        # Normal transactions need signature verification
        if not self.signature or not self.public_key:
            return False
        
        # Amount must be positive
        if self.amount <= 0:
            return False
        
        # Sender and receiver must be different
        if self.sender == self.receiver:
            return False
        
        # Verify signature
        from wallet.wallet import Wallet
        return Wallet.verify_signature(
            self.public_key,
            self.hash(),
            self.signature
        )

    def sign(self, wallet) -> 'Transaction':
        """
        Sign this transaction with the given wallet.
        
        Args:
            wallet: Wallet object to sign with
            
        Returns:
            Self for chaining
        """
        self.public_key = wallet.get_public_key_hex()
        self.signature = wallet.sign(self.hash())
        return self

    def to_dict(self) -> dict:
        """Convert transaction to dictionary."""
        return {
            "sender": self.sender,
            "receiver": self.receiver,
            "amount": self.amount,
            "signature": self.signature,
            "tx_type": self.tx_type,
            "public_key": self.public_key,
            "timestamp": self.timestamp,
            "tx_id": self.hash_hex()
        }

    @staticmethod
    def from_dict(data: dict) -> 'Transaction':
        """Create Transaction from dictionary."""
        return Transaction(
            sender=data.get("sender", ""),
            receiver=data.get("receiver", ""),
            amount=data.get("amount", 0),
            signature=data.get("signature", ""),
            tx_type=data.get("tx_type", TransactionType.TRANSFER),
            public_key=data.get("public_key", ""),
            timestamp=data.get("timestamp")
        )

    @staticmethod
    def create_coinbase(receiver: str, amount: float) -> 'Transaction':
        """
        Create a coinbase (mining reward) transaction.
        
        Args:
            receiver: Miner's wallet address
            amount: Reward amount
            
        Returns:
            Coinbase transaction
        """
        return Transaction(
            sender=COINBASE_ADDRESS,
            receiver=receiver,
            amount=amount,
            tx_type=TransactionType.COINBASE,
            signature="",
            public_key=""
        )

    def __repr__(self):
        return f"Transaction({self.sender[:8]}... -> {self.receiver[:8]}..., {self.amount} {COIN_SYMBOL})"
