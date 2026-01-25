"""
CarbonCoin Gateway Query Service

Centralized API gateway for frontend queries.
Fetches blockchain data from collection node (port 7000) and returns JSON responses.

Port: 8000
Endpoints:
    GET  /api/balance?wallet=<address>      - Get wallet balance
    GET  /api/transactions?wallet=<address> - Get wallet transactions
    GET  /api/wallet/info?wallet=<address>  - Get full wallet info
    GET  /api/sessions                      - Get all active user sessions
    POST /create_wallet                     - Create a new user wallet
    GET  /health                            - Health check
"""

from flask import Flask, request, jsonify
import requests
import json
import os
import time
import logging
from typing import Dict, List, Any, Optional

# Import wallet and storage modules
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from wallet.wallet import Wallet
from storage.mongo_storage import mongo_storage

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
GATEWAY_PORT = 8000
COLLECTION_NODE_URL = "http://localhost:7000"
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
SESSIONS_FILE = os.path.join(DATA_DIR, "active_sessions.json")
WALLETS_FILE = os.path.join(DATA_DIR, "wallets.json")


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def fetch_blockchain_from_collection() -> Optional[Dict]:
    """
    Fetch the latest blockchain from collection node.
    
    Returns:
        Blockchain data or None if failed
    """
    try:
        response = requests.get(f"{COLLECTION_NODE_URL}/chain", timeout=5)
        if response.status_code == 200:
            return response.json()
        logger.error(f"Failed to fetch blockchain: HTTP {response.status_code}")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to connect to collection node: {e}")
        return None


def load_active_sessions() -> Dict[str, str]:
    """
    Load active sessions from file.
    
    Returns:
        Dict mapping port -> wallet_address
    """
    try:
        if os.path.exists(SESSIONS_FILE):
            with open(SESSIONS_FILE, 'r') as f:
                return json.load(f)
        return {}
    except Exception as e:
        logger.error(f"Failed to load sessions: {e}")
        return {}


def load_wallets() -> Dict:
    """
    Load wallets from local wallets.json file.
    
    Returns:
        Dict of wallet_address -> wallet_data
    """
    try:
        if os.path.exists(WALLETS_FILE):
            with open(WALLETS_FILE, 'r') as f:
                return json.load(f)
        return {}
    except Exception as e:
        logger.error(f"Failed to load wallets: {e}")
        return {}


def save_wallets(wallets: Dict) -> bool:
    """
    Save wallets to local wallets.json file.
    
    Args:
        wallets: Dict of wallet_address -> wallet_data
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Ensure data directory exists
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(WALLETS_FILE, 'w') as f:
            json.dump(wallets, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Failed to save wallets: {e}")
        return False


def username_exists_in_local(username: str) -> tuple:
    """
    Check if username/email already has a wallet assigned in local wallets.json.
    Comparison is case-insensitive.
    
    Args:
        username: The username/email to check
        
    Returns:
        (exists: bool, wallet_address: str or None)
    """
    wallets = load_wallets()
    username_lower = username.lower()
    for address, data in wallets.items():
        label = data.get("label", "")
        if label.lower() == username_lower:
            return True, address
    return False, None


def calculate_balance(chain: List[Dict], wallet_address: str) -> float:
    """
    Calculate wallet balance from blockchain.
    
    Args:
        chain: List of blocks
        wallet_address: Wallet address to check
        
    Returns:
        Current balance
    """
    balance = 0.0
    
    for block in chain:
        # Transactions can be in "data" or "transactions" field
        transactions = block.get("data", []) or block.get("transactions", [])
        for tx in transactions:
            # Check if receiving (field can be "receiver" or "recipient")
            receiver = tx.get("receiver") or tx.get("recipient")
            if receiver == wallet_address:
                balance += float(tx.get("amount", 0))
            # Check if sending
            if tx.get("sender") == wallet_address:
                balance -= float(tx.get("amount", 0))
    
    return balance


def get_wallet_transactions(chain: List[Dict], wallet_address: str) -> List[Dict]:
    """
    Get all transactions involving a wallet.
    
    Args:
        chain: List of blocks
        wallet_address: Wallet address to check
        
    Returns:
        List of transactions with block info
    """
    transactions = []
    
    for block in chain:
        block_index = block.get("index", 0)
        block_timestamp = block.get("timestamp", "")
        
        # Transactions can be in "data" or "transactions" field
        block_txs = block.get("data", []) or block.get("transactions", [])
        
        for tx in block_txs:
            # Handle both "receiver" and "recipient" field names
            receiver = tx.get("receiver") or tx.get("recipient")
            sender = tx.get("sender", "")
            
            if sender == wallet_address or receiver == wallet_address:
                tx_info = {
                    "block_index": block_index,
                    "block_timestamp": block_timestamp,
                    "sender": sender,
                    "recipient": receiver,
                    "amount": tx.get("amount", 0),
                    "tx_type": tx.get("tx_type", "transfer"),
                    "tx_id": tx.get("tx_id", ""),
                    "timestamp": tx.get("timestamp", ""),
                    "direction": "received" if receiver == wallet_address else "sent"
                }
                transactions.append(tx_info)
    
    # Sort by block index descending (newest first)
    transactions.sort(key=lambda x: x["block_index"], reverse=True)
    return transactions


def find_wallet_port(wallet_address: str, sessions: Dict) -> Optional[int]:
    """
    Find which port a wallet is active on.
    
    Args:
        wallet_address: Wallet address to find
        sessions: Active sessions dict
        
    Returns:
        Port number or None if not active
    """
    for port, addr in sessions.items():
        if addr == wallet_address:
            return int(port)
    return None


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    # Also check if collection node is reachable
    collection_status = "online"
    try:
        resp = requests.get(f"{COLLECTION_NODE_URL}/health", timeout=2)
        if resp.status_code != 200:
            collection_status = "error"
    except:
        collection_status = "offline"
    
    return jsonify({
        "status": "healthy",
        "service": "gateway",
        "port": GATEWAY_PORT,
        "collection_node": collection_status
    })


@app.route('/api/balance', methods=['GET'])
def get_balance():
    """
    Get wallet balance.
    
    Query params:
        wallet: Wallet address (required)
    """
    wallet_address = request.args.get('wallet')
    
    if not wallet_address:
        return jsonify({
            "success": False,
            "error": "Missing 'wallet' parameter"
        }), 400
    
    # Fetch blockchain from collection node
    blockchain_data = fetch_blockchain_from_collection()
    if not blockchain_data:
        return jsonify({
            "success": False,
            "error": "Could not fetch blockchain from collection node"
        }), 503
    
    chain = blockchain_data.get("chain", [])
    balance = calculate_balance(chain, wallet_address)
    
    return jsonify({
        "success": True,
        "wallet": wallet_address,
        "balance": balance,
        "symbol": "CC",
        "chain_length": len(chain)
    })


@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """
    Get wallet transactions.
    
    Query params:
        wallet: Wallet address (required)
        limit: Max transactions to return (optional, default 50)
    """
    wallet_address = request.args.get('wallet')
    limit = request.args.get('limit', 50, type=int)
    
    if not wallet_address:
        return jsonify({
            "success": False,
            "error": "Missing 'wallet' parameter"
        }), 400
    
    # Fetch blockchain from collection node
    blockchain_data = fetch_blockchain_from_collection()
    if not blockchain_data:
        return jsonify({
            "success": False,
            "error": "Could not fetch blockchain from collection node"
        }), 503
    
    chain = blockchain_data.get("chain", [])
    transactions = get_wallet_transactions(chain, wallet_address)
    
    # Apply limit
    transactions = transactions[:limit]
    
    return jsonify({
        "success": True,
        "wallet": wallet_address,
        "transactions": transactions,
        "count": len(transactions),
        "chain_length": len(chain)
    })


@app.route('/api/wallet/info', methods=['GET'])
def get_wallet_info():
    """
    Get full wallet information including balance, transactions, and session status.
    
    Query params:
        wallet: Wallet address (required)
    """
    wallet_address = request.args.get('wallet')
    
    if not wallet_address:
        return jsonify({
            "success": False,
            "error": "Missing 'wallet' parameter"
        }), 400
    
    # Fetch blockchain from collection node
    blockchain_data = fetch_blockchain_from_collection()
    if not blockchain_data:
        return jsonify({
            "success": False,
            "error": "Could not fetch blockchain from collection node"
        }), 503
    
    chain = blockchain_data.get("chain", [])
    balance = calculate_balance(chain, wallet_address)
    transactions = get_wallet_transactions(chain, wallet_address)
    
    # Check if wallet is active
    sessions = load_active_sessions()
    active_port = find_wallet_port(wallet_address, sessions)
    
    # Calculate stats
    total_received = sum(tx["amount"] for tx in transactions if tx["direction"] == "received")
    total_sent = sum(tx["amount"] for tx in transactions if tx["direction"] == "sent")
    
    return jsonify({
        "success": True,
        "wallet": wallet_address,
        "balance": balance,
        "symbol": "CC",
        "is_active": active_port is not None,
        "active_port": active_port,
        "stats": {
            "total_transactions": len(transactions),
            "total_received": total_received,
            "total_sent": total_sent
        },
        "recent_transactions": transactions[:10],  # Last 10 transactions
        "chain_length": len(chain)
    })


@app.route('/api/sessions', methods=['GET'])
def get_sessions():
    """
    Get all active user sessions (excludes miners and collection node info).
    Returns only user sessions (ports 5000+).
    """
    sessions = load_active_sessions()
    
    # Filter to only user sessions (ports >= 5000, exclude 7000)
    user_sessions = []
    for port_str, wallet_addr in sessions.items():
        port = int(port_str)
        # Include only user ports (5000+) and collection (7000)
        if port >= 5000:
            user_sessions.append({
                "port": port,
                "wallet": wallet_addr,
                "type": "collection" if port == 7000 else "user"
            })
    
    return jsonify({
        "success": True,
        "sessions": user_sessions,
        "count": len(user_sessions)
    })


@app.route('/api/chain/info', methods=['GET'])
def get_chain_info():
    """
    Get blockchain information from collection node.
    """
    blockchain_data = fetch_blockchain_from_collection()
    if not blockchain_data:
        return jsonify({
            "success": False,
            "error": "Could not fetch blockchain from collection node"
        }), 503
    
    chain = blockchain_data.get("chain", [])
    
    # Get latest block info
    latest_block = chain[-1] if chain else None
    
    return jsonify({
        "success": True,
        "chain_length": len(chain),
        "latest_block": {
            "index": latest_block.get("index") if latest_block else None,
            "hash": latest_block.get("hash") if latest_block else None,
            "timestamp": latest_block.get("timestamp") if latest_block else None,
            "transactions_count": len(latest_block.get("transactions", [])) if latest_block else 0
        }
    })


# =============================================================================
# POST ENDPOINTS (for JSON body requests)
# =============================================================================

@app.route('/api/query', methods=['POST'])
def query_wallet():
    """
    Query wallet information via POST with JSON body.
    
    JSON body:
        wallet: Wallet address (required)
        include_transactions: Boolean (optional, default true)
        transaction_limit: Integer (optional, default 50)
    """
    data = request.get_json()
    
    if not data:
        return jsonify({
            "success": False,
            "error": "Missing JSON body"
        }), 400
    
    wallet_address = data.get('wallet')
    include_transactions = data.get('include_transactions', True)
    transaction_limit = data.get('transaction_limit', 50)
    
    if not wallet_address:
        return jsonify({
            "success": False,
            "error": "Missing 'wallet' in request body"
        }), 400
    
    # Fetch blockchain from collection node
    blockchain_data = fetch_blockchain_from_collection()
    if not blockchain_data:
        return jsonify({
            "success": False,
            "error": "Could not fetch blockchain from collection node"
        }), 503
    
    chain = blockchain_data.get("chain", [])
    balance = calculate_balance(chain, wallet_address)
    
    response = {
        "success": True,
        "wallet": wallet_address,
        "balance": balance,
        "symbol": "CC",
        "chain_length": len(chain)
    }
    
    if include_transactions:
        transactions = get_wallet_transactions(chain, wallet_address)
        response["transactions"] = transactions[:transaction_limit]
        response["transaction_count"] = len(transactions)
    
    # Check session status
    sessions = load_active_sessions()
    active_port = find_wallet_port(wallet_address, sessions)
    response["is_active"] = active_port is not None
    response["active_port"] = active_port
    
    return jsonify(response)


# =============================================================================
# WALLET CREATION ENDPOINT
# =============================================================================

@app.route('/create_wallet', methods=['POST'])
def create_wallet():
    """
    Create a new user wallet.
    
    This endpoint creates a wallet for website users.
    - Wallet is stored in local wallets.json (with username/email as label)
    - Wallet is also stored in MongoDB Wallets collection for website integration
    - Only the wallet is created, NOT started on any port
    
    JSON body:
        userName: Username or email for the wallet (required, must be unique)
        
    Returns:
        wallet_address: The new wallet's public address
        private_key: The wallet's private key (user must save this!)
    """
    data = request.get_json()
    
    if not data:
        return jsonify({
            "success": False,
            "error": "Missing JSON body"
        }), 400
    
    username = data.get('userName')
    
    if not username:
        return jsonify({
            "success": False,
            "error": "userName is required"
        }), 400
    
    # Validate username/email (basic validation)
    username = str(username).strip().lower()  # Normalize to lowercase for consistency
    if len(username) < 3:
        return jsonify({
            "success": False,
            "error": "userName must be at least 3 characters"
        }), 400
    
    if len(username) > 254:  # RFC 5321 email max length
        return jsonify({
            "success": False,
            "error": "userName must be less than 254 characters"
        }), 400
    
    # Check if username already has a wallet assigned (check local storage)
    exists_local, existing_address = username_exists_in_local(username)
    if exists_local:
        return jsonify({
            "success": False,
            "error": f"User '{username}' already has a wallet assigned",
            "existing_wallet": existing_address
        }), 409  # Conflict
    
    # Also check MongoDB if connected
    # Get optional userId (ObjectId from Users collection) - only stored in MongoDB, not local
    user_id = data.get('userId')  # ObjectId string from main website's Users collection
    
    if mongo_storage.is_connected():
        if mongo_storage.username_exists(username):
            return jsonify({
                "success": False,
                "error": f"Username '{username}' already has a wallet assigned in database"
            }), 409  # Conflict
    
    try:
        # Create new wallet
        wallet = Wallet()
        wallet_address = wallet.address()
        private_key = wallet.get_private_key_hex()
        created_at = time.time()
        
        # Store in local wallets.json (WITHOUT userId - that's only for MongoDB)
        wallets = load_wallets()
        wallets[wallet_address] = {
            "private_key": private_key,
            "created_at": created_at,
            "label": username
        }
        
        if not save_wallets(wallets):
            return jsonify({
                "success": False,
                "error": "Failed to save wallet to local storage"
            }), 500
        
        # Store in MongoDB for website integration (WITH userId for optimized queries)
        mongo_success = False
        mongo_error = None
        
        if mongo_storage.is_connected():
            mongo_success, mongo_error = mongo_storage.store_wallet(
                wallet_address=wallet_address,
                created_at=created_at,
                label=username,
                user_id=user_id  # Pass userId to MongoDB only
            )
            if not mongo_success:
                logger.warning(f"[Gateway] Failed to store wallet in MongoDB: {mongo_error}")
        else:
            logger.warning("[Gateway] MongoDB not connected, wallet only stored locally")
        
        logger.info(f"[Gateway] Created wallet for user '{username}': {wallet_address[:16]}...")
        
        return jsonify({
            "success": True,
            "message": f"Wallet created for user '{username}'",
            "wallet_address": wallet_address,
            "private_key": private_key,
            "created_at": created_at,
            "userName": username,
            "stored_in_mongodb": mongo_success,
            "note": "IMPORTANT: Save your private_key securely! You will need it to access your wallet."
        }), 201
        
    except Exception as e:
        logger.error(f"[Gateway] Error creating wallet: {e}")
        return jsonify({
            "success": False,
            "error": f"Failed to create wallet: {str(e)}"
        }), 500


# =============================================================================
# MAIN
# =============================================================================

def create_app():
    """Create and configure the Flask app."""
    return app


def run_gateway(port: int = GATEWAY_PORT):
    """Run the gateway service."""
    logger.info(f"Starting Gateway Query Service on port {port}")
    logger.info(f"Collection node: {COLLECTION_NODE_URL}")
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)


if __name__ == '__main__':
    run_gateway()
