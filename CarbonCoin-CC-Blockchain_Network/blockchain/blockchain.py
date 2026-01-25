import time
import threading
from blockchain.block import Block
from config import (
    MINING_REWARD, MAX_TRANSACTIONS_PER_BLOCK, COINBASE_ADDRESS,
    TransactionType, COIN_SYMBOL
)

# Try to use Cython-optimized mining
try:
    from cython_modules.block_utils import mine_block_hash
    USE_CYTHON = True
except ImportError:
    USE_CYTHON = False

GENESIS_BLOCK = Block(
    index=0,
    timestamp=0,
    data=[],  # Empty transaction list for genesis
    previous_hash="0"
)

class Blockchain:
    def __init__(self):
        self.chain = [GENESIS_BLOCK]
        self.pending_transactions = []
        self.difficulty = 3
        self._balance_cache = {}  # Cache for balance lookups
        self._cache_chain_length = 1  # Track chain length when cache was built
        self._mined_tx_cache = set()  # Cache for mined transaction IDs
        self._lock = threading.RLock()  # Thread safety for balance operations

    def get_latest_block(self):
        return self.chain[-1]

    def _invalidate_cache(self):
        """Invalidate balance cache when chain changes."""
        self._balance_cache = {}
        self._mined_tx_cache = set()
        self._cache_chain_length = len(self.chain)

    def get_mined_transaction_ids(self) -> set:
        """
        Get all transaction IDs that have been mined into blocks.
        Uses caching for performance.
        """
        with self._lock:
            if not self._mined_tx_cache or self._cache_chain_length != len(self.chain):
                self._rebuild_caches()
            return self._mined_tx_cache.copy()

    def is_transaction_mined(self, tx_id: str) -> bool:
        """Check if a transaction has already been mined into the chain."""
        return tx_id in self.get_mined_transaction_ids()

    def _rebuild_caches(self):
        """Rebuild both balance cache and mined tx cache from the chain."""
        balances = {}
        mined_tx_ids = set()
        
        for block in self.chain:
            if not isinstance(block.data, list):
                continue
                
            for tx in block.data:
                if isinstance(tx, dict):
                    tx_id = tx.get("tx_id")
                    
                    # Skip duplicate transactions (already processed)
                    if tx_id and tx_id in mined_tx_ids:
                        continue
                    
                    if tx_id:
                        mined_tx_ids.add(tx_id)
                    
                    receiver = tx.get("receiver")
                    sender = tx.get("sender")
                    amount = float(tx.get("amount", 0))
                    
                    if receiver:
                        balances[receiver] = balances.get(receiver, 0.0) + amount
                    if sender and sender != COINBASE_ADDRESS:
                        balances[sender] = balances.get(sender, 0.0) - amount
        
        self._balance_cache = balances
        self._mined_tx_cache = mined_tx_ids
        self._cache_chain_length = len(self.chain)

    def _rebuild_all_balances(self) -> dict:
        """
        Rebuild all balances from scratch (called when cache is invalid).
        This scans the entire chain once and caches all balances.
        Now also deduplicates transactions to prevent double-counting.
        """
        self._rebuild_caches()
        return self._balance_cache

    def get_balance(self, address: str) -> float:
        """
        Get the balance of an address using cached values.
        
        Thread-safe and uses caching for performance.
        Cache is invalidated when new blocks are added.
        
        Args:
            address: Wallet address to check
            
        Returns:
            Current balance in CC
        """
        with self._lock:
            # Check if cache needs rebuilding (chain has grown or cache is empty)
            if not self._balance_cache or self._cache_chain_length != len(self.chain):
                self._balance_cache = self._rebuild_all_balances()
                self._cache_chain_length = len(self.chain)
            
            return self._balance_cache.get(address, 0.0)

    def has_sufficient_balance(self, address: str, amount: float) -> bool:
        """Check if address has sufficient balance for transfer (thread-safe)."""
        with self._lock:
            return self.get_balance(address) >= amount

    def validate_transaction(self, tx_dict: dict, check_chain: bool = True) -> tuple:
        """
        Validate a transaction before adding to pending.
        
        Args:
            tx_dict: Transaction dictionary
            check_chain: If True, also check if tx already exists in chain
        
        Returns:
            (is_valid, error_message)
        """
        from transaction.transaction import Transaction
        
        tx = Transaction.from_dict(tx_dict)
        tx_id = tx_dict.get("tx_id")
        
        # Check if transaction already mined in chain
        if check_chain and tx_id and self.is_transaction_mined(tx_id):
            return (False, "Transaction already mined in blockchain")
        
        # Check if transaction already in pending
        if tx_id and any(t.get("tx_id") == tx_id for t in self.pending_transactions):
            return (False, "Transaction already in pending pool")
        
        # Coinbase transactions are only created during mining
        if tx.is_coinbase():
            return (False, "Cannot submit coinbase transactions")
        
        # Check amount is positive
        if tx.amount <= 0:
            return (False, "Amount must be positive")
        
        # Check sender != receiver
        if tx.sender == tx.receiver:
            return (False, "Cannot send to yourself")
        
        # Check sufficient balance
        if not self.has_sufficient_balance(tx.sender, tx.amount):
            current_balance = self.get_balance(tx.sender)
            return (False, f"Insufficient balance. Have: {current_balance:.2f} {COIN_SYMBOL}, Need: {tx.amount:.2f} {COIN_SYMBOL}")
        
        # Verify signature
        if not tx.is_valid():
            return (False, "Invalid transaction signature")
        
        return (True, "")

    def _python_proof_of_work(self, block):
        """Pure Python proof-of-work implementation."""
        while block.hash[:self.difficulty] != "0" * self.difficulty:
            block.nonce += 1
            block.hash = block.calculate_hash()

    def proof_of_work(self, block):
        # Use Cython-optimized mining if available, with runtime fallback
        cython_success = False
        
        if USE_CYTHON:
            try:
                block.hash, block.nonce = mine_block_hash(
                    block.index,
                    float(block.timestamp),
                    block.data,
                    block.previous_hash,
                    self.difficulty,
                    block.nonce
                )
                cython_success = True
            except Exception:
                # Cython failed at runtime, will fall back to Python
                cython_success = False
        
        if not cython_success:
            # Fallback to pure Python
            self._python_proof_of_work(block)

    def cleanup_pending_transactions(self):
        """
        Remove any pending transactions that have already been mined.
        This prevents duplicate transactions from being included in new blocks.
        """
        with self._lock:
            mined_ids = self.get_mined_transaction_ids()
            original_count = len(self.pending_transactions)
            self.pending_transactions = [
                tx for tx in self.pending_transactions
                if tx.get("tx_id") not in mined_ids
            ]
            removed = original_count - len(self.pending_transactions)
            if removed > 0:
                import logging
                logging.getLogger(__name__).info(f"[Cleanup] Removed {removed} already-mined transactions from pending")
            return removed

    def mine_block(self, miner_address: str) -> Block:
        """
        Mine a new block with pending transactions.
        
        Args:
            miner_address: Address to receive mining reward
            
        Returns:
            Mined block or None if no transactions
        """
        from transaction.transaction import Transaction
        
        # CRITICAL: Clean up pending transactions before mining
        # This removes any transactions that have already been mined (from sync)
        self.cleanup_pending_transactions()
        
        # Get transactions for this block (limit to MAX_TRANSACTIONS_PER_BLOCK)
        # Also double-check that no transaction is already mined
        mined_ids = self.get_mined_transaction_ids()
        valid_pending = [
            tx for tx in self.pending_transactions 
            if tx.get("tx_id") not in mined_ids
        ]
        transactions_for_block = valid_pending[:MAX_TRANSACTIONS_PER_BLOCK]
        
        # Create coinbase (mining reward) transaction
        coinbase_tx = Transaction.create_coinbase(miner_address, MINING_REWARD)
        
        # Block data: coinbase first, then regular transactions
        block_data = [coinbase_tx.to_dict()] + transactions_for_block
        
        block = Block(
            index=len(self.chain),
            timestamp=time.time(),
            data=block_data,
            previous_hash=self.get_latest_block().hash
        )

        self.proof_of_work(block)
        self.chain.append(block)
        
        # Remove mined transactions from pending
        mined_tx_ids = {tx.get("tx_id") for tx in transactions_for_block}
        self.pending_transactions = [
            tx for tx in self.pending_transactions 
            if tx.get("tx_id") not in mined_tx_ids
        ]
        
        # Invalidate balance cache after mining (thread-safe)
        with self._lock:
            self._invalidate_cache()
        
        return block

    def add_block(self, block):
        """Add a block received from peers (thread-safe)."""
        with self._lock:
            if block.previous_hash != self.get_latest_block().hash:
                return False

            if block.hash != block.calculate_hash():
                return False
            
            # Verify proof of work
            if block.hash[:self.difficulty] != "0" * self.difficulty:
                return False

            self.chain.append(block)
            self._invalidate_cache()  # Thread-safe cache invalidation
            return True

    def replace_chain(self, new_chain) -> bool:
        """
        Replace the chain with a new one if it's valid and longer.
        Used for consensus/fork resolution.
        
        Args:
            new_chain: List of Block objects
            
        Returns:
            True if chain was replaced
        """
        with self._lock:
            if len(new_chain) <= len(self.chain):
                return False
            
            if not self.is_valid_chain(new_chain):
                return False
            
            # Verify all blocks have valid proof of work
            for block in new_chain[1:]:  # Skip genesis
                if block.hash[:self.difficulty] != "0" * self.difficulty:
                    return False
            
            self.chain = new_chain
            self._invalidate_cache()
            return True

    def is_valid_chain(self, chain):
        """Validate entire chain integrity."""
        if not chain:
            return False
            
        # Check genesis block
        if chain[0].hash != GENESIS_BLOCK.hash:
            return False
        
        for i in range(1, len(chain)):
            current = chain[i]
            previous = chain[i - 1]

            if current.hash != current.calculate_hash():
                return False

            if current.previous_hash != previous.hash:
                return False

        return True

    def get_all_balances(self) -> dict:
        """Get balances of all addresses in the blockchain (uses cache)."""
        with self._lock:
            # Ensure cache is up to date
            if not self._balance_cache or self._cache_chain_length != len(self.chain):
                self._balance_cache = self._rebuild_all_balances()
                self._cache_chain_length = len(self.chain)
            
            # Return a copy to prevent external modification
            return dict(self._balance_cache)

    def get_transactions(self, address: str, tx_filter: str = "all", 
                         include_pending: bool = True) -> dict:
        """
        Get all transactions for a specific wallet address.
        
        Args:
            address: Wallet address to get transactions for
            tx_filter: Filter type - "all", "sent", or "received"
            include_pending: Whether to include pending transactions
            
        Returns:
            Dictionary with transactions and summary
        """
        transactions = []
        
        # Scan blockchain for confirmed transactions
        for block in self.chain:
            if not isinstance(block.data, list):
                continue
            
            for tx in block.data:
                if not isinstance(tx, dict):
                    continue
                
                sender = tx.get("sender", "")
                receiver = tx.get("receiver", "")
                
                # Check if address is involved
                is_sender = sender == address
                is_receiver = receiver == address
                
                if not (is_sender or is_receiver):
                    continue
                
                # Apply filter
                if tx_filter == "sent" and not is_sender:
                    continue
                if tx_filter == "received" and not is_receiver:
                    continue
                
                # Determine direction
                direction = "sent" if is_sender else "received"
                
                transactions.append({
                    "tx_id": tx.get("tx_id", ""),
                    "tx_type": tx.get("tx_type", ""),
                    "direction": direction,
                    "sender": sender,
                    "receiver": receiver,
                    "amount": tx.get("amount", 0),
                    "timestamp": tx.get("timestamp", 0),
                    "block_index": block.index,
                    "status": "confirmed"
                })
        
        # Include pending transactions if requested
        if include_pending:
            for tx in self.pending_transactions:
                sender = tx.get("sender", "")
                receiver = tx.get("receiver", "")
                
                is_sender = sender == address
                is_receiver = receiver == address
                
                if not (is_sender or is_receiver):
                    continue
                
                if tx_filter == "sent" and not is_sender:
                    continue
                if tx_filter == "received" and not is_receiver:
                    continue
                
                direction = "sent" if is_sender else "received"
                
                transactions.append({
                    "tx_id": tx.get("tx_id", ""),
                    "tx_type": tx.get("tx_type", ""),
                    "direction": direction,
                    "sender": sender,
                    "receiver": receiver,
                    "amount": tx.get("amount", 0),
                    "timestamp": tx.get("timestamp", 0),
                    "block_index": None,
                    "status": "pending"
                })
        
        # Sort by timestamp (newest first)
        transactions.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
        
        # Calculate summary (confirmed transactions only)
        total_sent = sum(
            tx["amount"] for tx in transactions 
            if tx["direction"] == "sent" and tx["status"] == "confirmed"
        )
        total_received = sum(
            tx["amount"] for tx in transactions 
            if tx["direction"] == "received" and tx["status"] == "confirmed"
        )
        
        return {
            "address": address,
            "balance": self.get_balance(address),
            "total_transactions": len(transactions),
            "total_sent": total_sent,
            "total_received": total_received,
            "transactions": transactions
        }
