"""
CarbonCoin (CC) Configuration and Constants

This module defines all the core constants for the CarbonCoin blockchain network.
All values can be overridden via .env file. If .env is absent, defaults are used.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file (if exists)
load_dotenv()


def _get_env_float(key: str, default: float) -> float:
    """Get float from environment variable with fallback to default."""
    try:
        return float(os.getenv(key, default))
    except (TypeError, ValueError):
        return default


def _get_env_int(key: str, default: int) -> int:
    """Get int from environment variable with fallback to default."""
    try:
        return int(os.getenv(key, default))
    except (TypeError, ValueError):
        return default


def _get_env_list(key: str, default: list) -> list:
    """Get list of ints from comma-separated environment variable."""
    value = os.getenv(key)
    if value:
        try:
            return [int(x.strip()) for x in value.split(',')]
        except (TypeError, ValueError):
            return default
    return default


# =============================================================================
# COIN CONFIGURATION
# =============================================================================

COIN_NAME = "CarbonCoin"
COIN_SYMBOL = "CC"  # Like BTC, ETH, etc.

# Mining reward - amount of CC given to miner for each block mined
MINING_REWARD = _get_env_float("MINING_REWARD", 10.0)

# Mining difficulty - number of leading zeros required in block hash
# Higher = harder mining, slower block times
# 2 = very easy (~instant), 3 = easy (~1-5 seconds), 4 = medium (~10-30 seconds), 5 = hard (~1-5 minutes)
MINING_DIFFICULTY = _get_env_int("MINING_DIFFICULTY", 4)

# Assign reward - fixed amount given to user when collection node assigns reward
ASSIGN_REWARD = _get_env_float("ASSIGN_REWARD", 5.0)

# Auto-transfer threshold - when miner reaches this amount, auto-transfer to collection
MINER_AUTO_TRANSFER_THRESHOLD = _get_env_float("MINER_AUTO_TRANSFER_THRESHOLD", 100.0)

# Auto-transfer transfers ALL balance when threshold is reached (not just threshold amount)
# This prevents leftover coins from accumulating
AUTO_TRANSFER_ALL = True

# Maximum transactions per block (excluding coinbase/reward transaction)
MAX_TRANSACTIONS_PER_BLOCK = _get_env_int("MAX_TRANSACTIONS_PER_BLOCK", 1)

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
MINER_PORTS = _get_env_list("MINER_PORTS", [3000, 3001, 3002])

# Collection node: 7000
COLLECTION_PORT = _get_env_int("COLLECTION_PORT", 7000)

# Gateway API: 8000 (centralized query service for frontend)
GATEWAY_PORT = _get_env_int("GATEWAY_PORT", 8000)

# User nodes start from: 5000+
USER_PORT_START = _get_env_int("USER_PORT_START", 5000)

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
# MONGODB CONFIGURATION
# =============================================================================

MONGO_URI = os.getenv("MONGO_URI", "")
MONGO_DATABASE = os.getenv("MONGO_DATABASE", "User")
MONGO_WALLETS_COLLECTION = os.getenv("MONGO_WALLETS_COLLECTION", "Wallets")

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
