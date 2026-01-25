"""
CarbonCoin (CC) Configuration and Constants

This module defines all the core constants for the CarbonCoin blockchain network.
"""

# =============================================================================
# COIN CONFIGURATION
# =============================================================================

COIN_NAME = "CarbonCoin"
COIN_SYMBOL = "CC"  # Like BTC, ETH, etc.

# Mining reward - amount of CC given to miner for each block mined
MINING_REWARD = 10.0  # 10 CC per block

# Assign reward - fixed amount given to user when collection node assigns reward
ASSIGN_REWARD = 5.0  # 5 CC per reward assignment

# Auto-transfer threshold - when miner reaches this amount, auto-transfer to collection
MINER_AUTO_TRANSFER_THRESHOLD = 100.0  # 100 CC

# Maximum transactions per block (excluding coinbase/reward transaction)
MAX_TRANSACTIONS_PER_BLOCK = 1

# =============================================================================
# NODE TYPES
# =============================================================================

class NodeType:
    MINER = "miner"           # Can mine blocks, earns rewards
    COLLECTION = "collection"  # Receives auto-transfers from miners
    USER = "user"             # Normal users, receive rewards from events

# =============================================================================
# PORT CONFIGURATION
# =============================================================================

# Miner nodes: 3000-3002
MINER_PORTS = [3000, 3001, 3002]

# Collection node: 7000
COLLECTION_PORT = 7000

# User nodes start from: 5000+
USER_PORT_START = 5000

# =============================================================================
# BOOTSTRAP PEERS (Known nodes to connect to on startup)
# =============================================================================

# These are the initial peers a new node will try to connect to
# The node will then discover more peers from these
BOOTSTRAP_PEERS = [
    "http://localhost:3000",
    "http://localhost:3001", 
    "http://localhost:3002",
    "http://localhost:7000",
]

# =============================================================================
# SPECIAL ADDRESSES
# =============================================================================

# System address for coinbase transactions (mining rewards come from here)
COINBASE_ADDRESS = "COINBASE_SYSTEM"

# =============================================================================
# TRANSACTION TYPES
# =============================================================================

class TransactionType:
    COINBASE = "coinbase"      # Mining reward (creates new coins)
    TRANSFER = "transfer"      # Normal transfer between wallets
    AUTO_TRANSFER = "auto_transfer"  # Automatic transfer from miner to collection

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_node_type_from_port(port: int) -> str:
    """Determine node type based on port number."""
    if port in MINER_PORTS:
        return NodeType.MINER
    elif port == COLLECTION_PORT:
        return NodeType.COLLECTION
    else:
        return NodeType.USER
