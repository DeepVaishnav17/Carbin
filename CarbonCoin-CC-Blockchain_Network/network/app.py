"""
CarbonCoin Blockchain Network - Flask API

This module provides the REST API endpoints for the blockchain network.
Different endpoints are available based on node type (Miner, Collection, User).
"""

from flask import Flask, request, jsonify
from functools import wraps
import requests
import sys
import logging
import traceback

from node.node import Node
from blockchain.block import Block
from transaction.transaction import Transaction
from config import (
    NodeType, COIN_SYMBOL, MINING_REWARD, MINER_AUTO_TRANSFER_THRESHOLD,
    get_node_type_from_port, COINBASE_ADDRESS, ASSIGN_REWARD, TransactionType
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Node will be initialized in create_app()
node = None


# ==============================================================================
# ERROR HANDLING
# ==============================================================================

class APIError(Exception):
    """Base API Error."""
    def __init__(self, message, status_code=400, payload=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['error'] = self.message
        rv['success'] = False
        return rv


@app.errorhandler(APIError)
def handle_api_error(error):
    """Handle custom API errors."""
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


@app.errorhandler(400)
def handle_bad_request(error):
    """Handle bad request errors."""
    return jsonify({
        "error": "Bad request",
        "message": str(error),
        "success": False
    }), 400


@app.errorhandler(404)
def handle_not_found(error):
    """Handle not found errors."""
    return jsonify({
        "error": "Not found",
        "message": "The requested resource was not found",
        "success": False
    }), 404


@app.errorhandler(500)
def handle_internal_error(error):
    """Handle internal server errors."""
    logger.error(f"Internal error: {error}\n{traceback.format_exc()}")
    return jsonify({
        "error": "Internal server error",
        "message": "An unexpected error occurred",
        "success": False
    }), 500


def handle_exceptions(f):
    """Decorator to handle exceptions in routes."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except APIError:
            raise
        except ValueError as e:
            return jsonify({"error": str(e), "success": False}), 400
        except Exception as e:
            logger.error(f"Error in {f.__name__}: {e}\n{traceback.format_exc()}")
            return jsonify({
                "error": "Internal server error",
                "message": str(e),
                "success": False
            }), 500
    return decorated_function


def create_app(port: int = 5000, private_key: str = None):
    """
    Create and configure the Flask app with the node.
    
    Args:
        port: Port number to run the node on
        private_key: Optional private key hex to authenticate with existing wallet
        
    Returns:
        Node instance
        
    Raises:
        RuntimeError: If port is in use or wallet is already active
    """
    global node
    node = Node(port=port, private_key=private_key)
    
    # Connect to bootstrap peers on startup (all nodes)
    # This ensures new nodes discover the network automatically
    node.connect_to_bootstrap_peers()
    
    # Start background sync service for all nodes
    node.start_sync_service()
    
    # Auto-register with network if not a core node
    if port not in [7000, 3000, 3001, 3002]:
        node.register_with_network()
    
    return node

# ==============================================================================
# BASIC INFO
# ==============================================================================

@app.route('/', methods=['GET'])
@handle_exceptions
def home():
    """Get node information."""
    wallet_label = node._get_wallet_label() if hasattr(node, '_get_wallet_label') else None
    return jsonify({
        "success": True,
        "name": "CarbonCoin Node",
        "symbol": COIN_SYMBOL,
        "node_type": node.node_type,
        "port": node.port,
        "address": node.wallet.address(),
        "wallet_label": wallet_label,
        "balance": node.get_balance(),
        "chain_length": len(node.blockchain.chain),
        "pending_transactions": len(node.blockchain.pending_transactions),
        "peers_count": len(node.peers),
        "sync_active": node.sync_active,
        "mining_active": node.mining_active if node.is_miner() else None,
        "auto_transfer_active": node.auto_transfer_active if node.is_miner() else None
    })

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint for monitoring."""
    return jsonify({
        "success": True,
        "status": "healthy",
        "node_type": node.node_type,
        "port": node.port
    })

@app.route('/address', methods=['GET'])
@handle_exceptions
def get_address():
    """Get node's wallet address."""
    return jsonify({
        "success": True,
        "address": node.wallet.address(),
        "public_key": node.wallet.get_public_key_hex()
    })

@app.route('/balance', methods=['GET'])
@handle_exceptions
def get_balance():
    """Get node's wallet balance."""
    address = request.args.get('address', node.wallet.address())
    balance = node.blockchain.get_balance(address)
    available = node.get_available_balance() if address == node.wallet.address() else balance
    return jsonify({
        "success": True,
        "address": address,
        "balance": balance,
        "available_balance": available,
        "formatted": f"{balance:.2f} {COIN_SYMBOL}"
    })

@app.route('/balances', methods=['GET'])
@handle_exceptions
def get_all_balances():
    """Get all wallet balances in the network."""
    balances = node.blockchain.get_all_balances()
    formatted = {addr: f"{bal:.2f} {COIN_SYMBOL}" for addr, bal in balances.items() if bal > 0}
    return jsonify({
        "success": True,
        "balances": formatted,
        "total_supply": sum(balances.values())
    })

@app.route('/wallets', methods=['GET'])
@handle_exceptions
def get_all_wallets():
    """
    Get all registered wallets in the system.
    Useful for testing - shows all wallets with their private keys.
    """
    from storage.storage import Storage
    storage = Storage()
    wallets = storage.load_wallets()
    sessions = storage.load_sessions()
    
    # Build wallet info list
    wallet_list = []
    for address, data in wallets.items():
        # Find if wallet is active on any port
        active_port = None
        for port_str, active_addr in sessions.items():
            if active_addr == address:
                active_port = int(port_str)
                break
        
        wallet_list.append({
            "address": address,
            "private_key": data.get("private_key"),
            "label": data.get("label", ""),
            "created_at": data.get("created_at"),
            "active_on_port": active_port
        })
    
    return jsonify({
        "success": True,
        "wallets": wallet_list,
        "total_wallets": len(wallet_list)
    })

@app.route('/sessions', methods=['GET'])
@handle_exceptions
def get_active_sessions():
    """
    Get all active sessions (port-wallet mappings).
    Shows which wallets are currently running on which ports.
    """
    from storage.storage import Storage
    storage = Storage()
    sessions = storage.load_sessions()
    
    session_list = []
    for port_str, address in sessions.items():
        session_list.append({
            "port": int(port_str),
            "wallet_address": address
        })
    
    return jsonify({
        "success": True,
        "sessions": session_list,
        "active_count": len(session_list)
    })

@app.route('/peers', methods=['GET'])
@handle_exceptions
def get_peers():
    """Get list of connected peers."""
    return jsonify({
        "success": True,
        "count": len(node.peers),
        "peers": list(node.peers)
    })

@app.route('/add_peer', methods=['POST'])
@handle_exceptions
def add_peer():
    """Add a peer node (manually)."""
    data = request.json or {}
    peer = data.get("peer")
    
    if not peer:
        raise APIError("Peer URL is required", 400)
    
    success = node.add_peer(peer, propagate=True)
    
    return jsonify({
        "success": success,
        "message": "Peer added" if success else "Failed to add peer",
        "peers": list(node.peers)
    })

@app.route('/announce_peer', methods=['POST'])
@handle_exceptions
def announce_peer():
    """
    Receive peer announcement from network (auto-propagation).
    This endpoint is called automatically when new peers join.
    """
    data = request.json or {}
    peer = data.get("peer")
    from_peer = data.get("from", "unknown")
    
    if not peer:
        return jsonify({"success": False, "message": "Peer URL required"}), 400
    
    # Add peer without propagating again (prevents loops)
    success = node.add_peer(peer, propagate=False)
    
    return jsonify({
        "success": success,
        "message": f"Peer {peer} announced from {from_peer}"
    })

@app.route('/register_node', methods=['POST'])
@handle_exceptions
def register_node():
    """
    Register a new node with this node.
    This enables auto-discovery for new nodes joining the network.
    NOTE: Do NOT broadcast here to avoid infinite loops.
    Broadcasting only happens when a node initiates joining.
    """
    data = request.json or {}
    new_node_url = data.get("node_url")
    
    if not new_node_url:
        raise APIError("node_url is required", 400)
    
    # Add the new node as peer (no broadcast to avoid infinite loop)
    node.add_peer(new_node_url)
    
    # Return our peer list so the new node can connect to everyone
    return jsonify({
        "success": True,
        "message": f"Node {new_node_url} registered",
        "peers": list(node.peers),
        "chain_length": len(node.blockchain.chain)
    }), 201

# ==============================================================================
# TRANSACTIONS
# ==============================================================================

@app.route('/transaction', methods=['POST'])
@handle_exceptions
def create_transaction():
    """Create a new transaction."""
    data = request.json or {}
    
    sender = data.get('sender', node.wallet.address())
    receiver = data.get('receiver')
    amount = data.get('amount')
    
    if not receiver:
        raise APIError("Receiver address is required", 400)
    
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        raise APIError("Invalid amount", 400)
    
    if amount <= 0:
        raise APIError("Amount must be positive", 400)
    
    # If sender is this node, create and sign the transaction
    if sender == node.wallet.address():
        success = node.create_transfer(receiver, amount)
        if success:
            return jsonify({
                "success": True,
                "message": "Transaction submitted (pending confirmation)",
                "status": "pending",
                "amount": f"{amount} {COIN_SYMBOL}",
                "receiver": receiver,
                "note": "Balance will update after transaction is mined into a block"
            }), 201
        else:
            balance = node.get_balance()
            raise APIError(f"Insufficient balance. Have: {balance:.2f} {COIN_SYMBOL}", 400)
    
    # External transaction with signature
    signature = data.get('signature')
    public_key = data.get('public_key')
    
    if not signature or not public_key:
        raise APIError("Signature and public_key required for external transactions", 400)
    
    tx = Transaction(
        sender=sender,
        receiver=receiver,
        amount=amount,
        signature=signature,
        public_key=public_key
    )
    
    tx_dict = tx.to_dict()
    
    # Validate transaction
    is_valid, error = node.blockchain.validate_transaction(tx_dict)
    if not is_valid:
        raise APIError(error, 400)
    
    # Check for duplicates
    tx_id = tx.hash_hex()
    if any(t.get("tx_id") == tx_id for t in node.blockchain.pending_transactions):
        raise APIError("Duplicate transaction", 400)
    
    # Add to pending
    node.blockchain.pending_transactions.append(tx_dict)
    
    # Broadcast to peers
    node._broadcast_transaction(tx_dict)
    
    return jsonify({
        "success": True,
        "message": "Transaction added",
        "tx_id": tx_id
    }), 201

@app.route('/receive_transaction', methods=['POST'])
@handle_exceptions
def receive_transaction():
    """Receive a transaction from a peer."""
    tx = request.json or {}
    tx_id = tx.get("tx_id")
    
    if not tx_id:
        raise APIError("Invalid transaction", 400)
    
    # CRITICAL: Check if transaction is already mined in blockchain
    if node.blockchain.is_transaction_mined(tx_id):
        return jsonify({"success": True, "message": "Transaction already mined"}), 200
    
    # Check if already in pending
    if any(t.get("tx_id") == tx_id for t in node.blockchain.pending_transactions):
        return jsonify({"success": True, "message": "Transaction already pending"}), 200
    
    # Validate before adding (this also checks chain)
    is_valid, error = node.blockchain.validate_transaction(tx)
    if is_valid:
        node.blockchain.pending_transactions.append(tx)
    elif tx.get("tx_type") == "auto_transfer":
        # Auto-transfers may bypass some validation but still check for duplicates
        if not node.blockchain.is_transaction_mined(tx_id):
            node.blockchain.pending_transactions.append(tx)
    
    return jsonify({"success": True, "message": "Transaction received"}), 201

@app.route('/transfer', methods=['POST'])
@handle_exceptions
def transfer():
    """Quick transfer from this node's wallet."""
    data = request.json or {}
    receiver = data.get('receiver')
    amount = data.get('amount')
    
    if not receiver:
        raise APIError("Receiver address is required", 400)
    
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        raise APIError("Invalid amount", 400)
    
    if amount <= 0:
        raise APIError("Amount must be positive", 400)
    
    success = node.create_transfer(receiver, amount)
    
    if success:
        return jsonify({
            "success": True,
            "message": "Transfer submitted (pending confirmation)",
            "status": "pending",
            "amount": f"{amount} {COIN_SYMBOL}",
            "receiver": receiver,
            "note": "Balance will update after transaction is mined into a block"
        }), 201
    else:
        raise APIError(f"Insufficient balance. Have: {node.get_balance():.2f} {COIN_SYMBOL}", 400)

# ==============================================================================
# MINING (Only for Miner nodes)
# ==============================================================================

@app.route('/mine', methods=['GET'])
@handle_exceptions
def mine_once():
    """Mine a single block (manual mining)."""
    if not node.is_miner():
        raise APIError(f"Only miner nodes can mine. This is a {node.node_type} node.", 403)
    
    # Sync before mining
    node.resolve_conflicts()
    
    block = node.blockchain.mine_block(node.wallet.address())
    
    if block:
        # Broadcast block
        accepted = node._broadcast_block(block)
        
        return jsonify({
            "success": True,
            "message": "Block mined",
            "block_index": block.index,
            "block_hash": block.hash,
            "reward": f"{MINING_REWARD} {COIN_SYMBOL}",
            "transactions_included": len(block.data) - 1,
            "balance": f"{node.get_balance():.2f} {COIN_SYMBOL}",
            "peers_accepted": accepted
        })
    
    raise APIError("Mining failed", 500)

# ==============================================================================
# MINER SERVICES (Mining + Auto-Transfer together)
# ==============================================================================

@app.route('/miner/start', methods=['POST'])
@handle_exceptions
def miner_start():
    """Start all miner services (mining + auto-transfer)."""
    if not node.is_miner():
        raise APIError(f"Only miner nodes can start mining. This is a {node.node_type} node.", 403)
    
    mining_started = node.start_mining_service()
    auto_transfer_started = node.start_auto_transfer_service()
    
    return jsonify({
        "success": True,
        "message": "Miner services started",
        "mining": node.mining_active,
        "auto_transfer": node.auto_transfer_active,
        "mining_reward": f"{MINING_REWARD} {COIN_SYMBOL}",
        "auto_transfer_threshold": f"{MINER_AUTO_TRANSFER_THRESHOLD} {COIN_SYMBOL}"
    })

@app.route('/miner/stop', methods=['POST'])
@handle_exceptions
def miner_stop():
    """Stop all miner services (mining + auto-transfer)."""
    if not node.is_miner():
        raise APIError("Not a miner node", 403)
    
    node.stop_mining_service()
    node.stop_auto_transfer_service()
    
    return jsonify({
        "success": True,
        "message": "Miner services stopped",
        "mining": node.mining_active,
        "auto_transfer": node.auto_transfer_active,
        "final_balance": f"{node.get_balance():.2f} {COIN_SYMBOL}"
    })

@app.route('/miner/status', methods=['GET'])
@handle_exceptions
def miner_status():
    """Get miner services status (mining + auto-transfer)."""
    if not node.is_miner():
        raise APIError("Not a miner node", 403)
    
    balance = node.get_balance()
    
    return jsonify({
        "success": True,
        "mining_active": node.mining_active,
        "auto_transfer_active": node.auto_transfer_active,
        "balance": f"{balance:.2f} {COIN_SYMBOL}",
        "blocks_in_chain": len(node.blockchain.chain),
        "auto_transfer_threshold": f"{MINER_AUTO_TRANSFER_THRESHOLD} {COIN_SYMBOL}",
        "will_auto_transfer": balance >= MINER_AUTO_TRANSFER_THRESHOLD
    })

# ==============================================================================
# COLLECTION NODE FUNCTIONS
# ==============================================================================

@app.route('/assign_reward', methods=['POST'])
@handle_exceptions
def assign_reward():
    """
    Collection node assigns reward to a user's wallet address.
    Only the collection node can call this endpoint.
    Reward amount defaults to ASSIGN_REWARD (5 CC) from config, but can be customized.
    
    POST /assign_reward
    Body: {
        "user_address": "wallet_address_here",
        "amount": 10.0  (optional, defaults to 5 CC if not provided)
    }
    """
    # Only collection node can assign rewards
    if not node.is_collection():
        raise APIError("Only collection node can assign rewards. This is a {node.node_type} node.", 403)
    
    data = request.json or {}
    user_address = data.get('user_address')
    
    if not user_address:
        raise APIError("user_address is required", 400)
    
    # Get amount from request, default to ASSIGN_REWARD if not provided
    amount = data.get('amount')
    if amount is None:
        # Use default reward amount from config
        amount = ASSIGN_REWARD
    else:
        # Validate custom amount
        try:
            amount = float(amount)
        except (TypeError, ValueError):
            raise APIError("Invalid amount value. Must be a number.", 400)
        
        if amount <= 0:
            raise APIError("Amount must be greater than 0", 400)
    
    # Check collection has enough balance
    collection_balance = node.get_balance()
    if collection_balance < amount:
        raise APIError(f"Collection has insufficient balance. Has: {collection_balance:.2f} {COIN_SYMBOL}, Need: {amount} {COIN_SYMBOL}", 400)
    
    # Create transfer from collection to user
    from transaction.transaction import Transaction
    import threading
    
    tx = Transaction(
        sender=node.wallet.address(),
        receiver=user_address,
        amount=amount,
        tx_type=TransactionType.TRANSFER
    )
    tx.sign(node.wallet)
    tx_dict = tx.to_dict()
    
    # Add to pending
    node.blockchain.pending_transactions.append(tx_dict)
    
    # Broadcast in background thread (don't block response)
    threading.Thread(
        target=node._broadcast_transaction, 
        args=(tx_dict,), 
        daemon=True
    ).start()
    
    logger.info(f"[Reward] Assigned {amount} {COIN_SYMBOL} to {user_address[:16]}...")
    
    return jsonify({
        "success": True,
        "message": f"Reward of {amount} {COIN_SYMBOL} assigned to user",
        "tx_id": tx_dict.get("tx_id"),
        "amount": f"{amount} {COIN_SYMBOL}",
        "recipient": user_address
    }), 201

# ==============================================================================
# BLOCK HANDLING
# ==============================================================================

@app.route('/receive_block', methods=['POST'])
@handle_exceptions
def receive_block():
    """Receive a block from a peer."""
    data = request.json or {}
    
    try:
        block = Block(
            data['index'],
            data['timestamp'],
            data['data'],
            data['previous_hash'],
            data['nonce']
        )
        block.hash = data['hash']
    except KeyError as e:
        raise APIError(f"Missing block field: {e}", 400)
    
    last_block = node.blockchain.get_latest_block()
    
    # Case 1: Block is next in sequence - try to add directly
    if block.index == last_block.index + 1:
        if node.blockchain.add_block(block):
            # CRITICAL: Clean up ALL already-mined transactions from pending
            # This uses the proper deduplication method
            node.blockchain.cleanup_pending_transactions()
            
            logger.info(f"[Block] Accepted block #{block.index} from peer")
            return jsonify({
                "success": True,
                "message": "Block accepted",
                "block_index": block.index
            }), 201
    
    # Case 2: Block is ahead or conflicts - need to sync
    if block.index > last_block.index + 1:
        # We're behind, sync with network
        node.resolve_conflicts()
        # After syncing, clean up pending transactions
        node.blockchain.cleanup_pending_transactions()
        return jsonify({
            "success": True,
            "message": "Chain synced",
            "chain_length": len(node.blockchain.chain)
        }), 200
    
    # Case 3: Block already exists or is old
    return jsonify({
        "success": True,
        "message": "Block already processed",
        "chain_length": len(node.blockchain.chain)
    }), 200

# ==============================================================================
# STATE & CHAIN
# ==============================================================================

@app.route('/chain', methods=['GET'])
@handle_exceptions
def chain():
    """Get the full blockchain."""
    return jsonify({
        "success": True,
        "length": len(node.blockchain.chain),
        "chain": [b.__dict__ for b in node.blockchain.chain]
    })

@app.route('/mempool', methods=['GET'])
@handle_exceptions
def mempool():
    """Get pending transactions."""
    return jsonify({
        "success": True,
        "count": len(node.blockchain.pending_transactions),
        "transactions": node.blockchain.pending_transactions
    })

@app.route('/transactions', methods=['GET'])
@handle_exceptions
def get_transactions():
    """
    Get all transactions for this node's wallet address.
    
    Query params:
        include_pending: true/false (default: true) - Include pending transactions
        type: all/sent/received (default: all) - Filter by transaction direction
    """
    include_pending = request.args.get('include_pending', 'true').lower() == 'true'
    tx_filter = request.args.get('type', 'all').lower()
    
    # Use reusable method from blockchain
    result = node.blockchain.get_transactions(
        address=node.wallet.address(),
        tx_filter=tx_filter,
        include_pending=include_pending
    )
    
    return jsonify({
        "success": True,
        "address": result["address"],
        "balance": f"{result['balance']:.2f} {COIN_SYMBOL}",
        "total_transactions": result["total_transactions"],
        "total_sent": f"{result['total_sent']:.2f} {COIN_SYMBOL}",
        "total_received": f"{result['total_received']:.2f} {COIN_SYMBOL}",
        "transactions": result["transactions"]
    })

@app.route('/transactions/<address>', methods=['GET'])
@handle_exceptions
def get_transactions_by_address(address):
    """
    Get all transactions for a specific wallet address.
    
    Query params:
        include_pending: true/false (default: true) - Include pending transactions
        type: all/sent/received (default: all) - Filter by transaction direction
    """
    include_pending = request.args.get('include_pending', 'true').lower() == 'true'
    tx_filter = request.args.get('type', 'all').lower()
    
    # Use reusable method from blockchain
    result = node.blockchain.get_transactions(
        address=address,
        tx_filter=tx_filter,
        include_pending=include_pending
    )
    
    return jsonify({
        "success": True,
        "address": result["address"],
        "balance": f"{result['balance']:.2f} {COIN_SYMBOL}",
        "total_transactions": result["total_transactions"],
        "total_sent": f"{result['total_sent']:.2f} {COIN_SYMBOL}",
        "total_received": f"{result['total_received']:.2f} {COIN_SYMBOL}",
        "transactions": result["transactions"]
    })

@app.route('/consensus', methods=['GET'])
@handle_exceptions
def consensus():
    """Run consensus algorithm."""
    replaced = node.resolve_conflicts()
    return jsonify({
        "success": True,
        "message": "Consensus executed",
        "chain_replaced": replaced,
        "chain_length": len(node.blockchain.chain)
    })

@app.route('/sync', methods=['POST'])
@handle_exceptions
def full_sync():
    """Perform full network sync (chain + transactions + peers)."""
    success = node.sync_with_network()
    return jsonify({
        "success": success,
        "message": "Full sync completed" if success else "Sync failed",
        "chain_length": len(node.blockchain.chain),
        "pending_transactions": len(node.blockchain.pending_transactions),
        "peers_count": len(node.peers)
    })

@app.route('/stats', methods=['GET'])
@handle_exceptions
def stats():
    """Get network statistics."""
    total_blocks = len(node.blockchain.chain)
    total_transactions = sum(
        len(b.data) if isinstance(b.data, list) else 0 
        for b in node.blockchain.chain
    )
    total_supply = sum(node.blockchain.get_all_balances().values())
    
    return jsonify({
        "success": True,
        "total_blocks": total_blocks,
        "total_transactions": total_transactions,
        "total_supply": f"{total_supply:.2f} {COIN_SYMBOL}",
        "difficulty": node.blockchain.difficulty,
        "pending_transactions": len(node.blockchain.pending_transactions),
        "peers_count": len(node.peers),
        "sync_active": node.sync_active
    })

# ==============================================================================
# PERSISTENCE
# ==============================================================================

@app.route('/save', methods=['POST'])
@handle_exceptions
def save_state():
    """
    Save all node data to disk (blockchain, wallet, pending transactions, peers).
    Should be called before shutting down the node to preserve data.
    """
    success = node.save_state()
    
    return jsonify({
        "success": success,
        "message": "State saved to disk" if success else "Failed to save state",
        "port": node.port,
        "chain_length": len(node.blockchain.chain),
        "pending_transactions": len(node.blockchain.pending_transactions),
        "peers_count": len(node.peers)
    })

@app.route('/shutdown', methods=['POST'])
@handle_exceptions
def shutdown():
    """
    Save state and prepare for shutdown.
    This endpoint saves all data and stops background services.
    Also ends the session (frees up the port and wallet).
    """
    # Stop all services first
    if node.is_miner():
        node.stop_mining_service()
        node.stop_auto_transfer_service()
    
    node.stop_sync_service()
    
    # Save state to disk
    success = node.save_state()
    
    # End the session (free up port and wallet)
    node.end_session()
    
    return jsonify({
        "success": success,
        "message": "Node ready for shutdown" if success else "Shutdown preparation failed",
        "port": node.port,
        "data_saved": success
    })

# ==============================================================================

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
    create_app(port)
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
