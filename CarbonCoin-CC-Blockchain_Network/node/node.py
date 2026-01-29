import requests
import threading
import time
import os
import logging
from blockchain.block import Block
from blockchain.blockchain import Blockchain
from wallet.wallet import Wallet
from transaction.transaction import Transaction
from storage.storage import Storage
from config import (
    NodeType, MINER_AUTO_TRANSFER_THRESHOLD, MINING_REWARD,
    get_node_type_from_port, COIN_SYMBOL, TransactionType,
    COLLECTION_PORT, BOOTSTRAP_PEERS, AUTO_TRANSFER_ALL
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class Node:
    def __init__(self, port: int = 5000, private_key: str = None):
        """
        Initialize a blockchain node.
        
        Args:
            port: Port number to run the node on
            private_key: Optional private key hex to authenticate with existing wallet.
                        If not provided, creates a new wallet.
        """
        self.port = port
        self.node_type = get_node_type_from_port(port)
        
        # Initialize storage for persistence (shared across nodes)
        self.storage = Storage(port)
        
        # Initialize wallet based on authentication
        self.wallet = self._init_wallet(private_key)
        
        # Start session (validates port availability and wallet not already active)
        success, error = self.storage.start_session(port, self.wallet.address())
        if not success:
            raise RuntimeError(f"Failed to start node: {error}")
        
        # Register wallet in shared registry
        label = self._get_wallet_label()
        self.storage.register_wallet(
            self.wallet.get_private_key_hex(),
            self.wallet.address(),
            label=label
        )
        
        # Load shared blockchain (same for all nodes) - with version tracking
        chain_data, self._chain_version = self.storage.load_blockchain()
        if chain_data:
            self.blockchain = Blockchain(chain_data=chain_data)
            logger.info(f"[Node] Loaded shared blockchain: {len(self.blockchain.chain)} blocks (v{self._chain_version})")
        else:
            self.blockchain = Blockchain()
            self._chain_version = 0
            logger.info("[Node] Started fresh blockchain with genesis block")
        
        # Load shared pending transactions - with version tracking
        pending_tx, self._pending_version = self.storage.load_pending_transactions()
        if pending_tx:
            self.blockchain.pending_transactions = pending_tx
            logger.info(f"[Node] Loaded {len(pending_tx)} pending transactions (v{self._pending_version})")
        
        # Peers are discovered dynamically via BOOTSTRAP_PEERS
        self.peers = set()
        
        # Thread safety
        self._peers_lock = threading.RLock()
        self._sync_lock = threading.RLock()
        
        # Mining service state (only for miners)
        self.mining_active = False
        self._mining_thread = None
        
        # Auto-transfer service state (only for miners)
        self.auto_transfer_active = False
        self._auto_transfer_thread = None
        
        # Sync service state
        self.sync_active = False
        self._sync_thread = None
        
        # Collection node address (set when collection node registers)
        self.collection_node_address = None
        self.collection_node_url = os.getenv("COLLECTION_NODE_URL", f"http://localhost:{COLLECTION_PORT}")
        
        # Track last sync time
        self._last_sync_time = 0
        self._sync_interval = 2  # seconds
        
        logger.info(f"[Node] Initialized as {self.node_type.upper()} on port {port}")
        logger.info(f"[Node] Wallet address: {self.wallet.address()[:16]}...")
    
    def _init_wallet(self, private_key: str = None) -> Wallet:
        """
        Initialize wallet based on authentication.
        
        Args:
            private_key: Optional private key hex for authentication.
                        If provided, it MUST exist in the wallet registry.
            
        Returns:
            Wallet instance
            
        Raises:
            RuntimeError: If private key is provided but not found in registry
        """
        if private_key:
            # Authenticate with existing wallet - private key MUST exist
            wallet_data = self.storage.get_wallet_by_private_key(private_key)
            if wallet_data:
                logger.info(f"[Node] Authenticated with existing wallet: {wallet_data['address'][:16]}... (label: {wallet_data.get('label')})")
                return Wallet(private_key_hex=private_key)
            else:
                # Private key not found - raise error instead of creating new wallet
                logger.error(f"[Node] Private key not found in wallet registry!")
                raise RuntimeError(
                    "Invalid private key. The provided private key does not exist in the wallet registry. "
                    "Please use a valid private key or create a new wallet without providing a key."
                )
        else:
            # Create new wallet
            wallet = Wallet()
            logger.info(f"[Node] Created new wallet: {wallet.address()[:16]}...")
            return wallet
    
    def _get_wallet_label(self) -> str:
        """
        Get label for the wallet.
        - If wallet already exists in storage, return existing label (don't overwrite)
        - Otherwise generate a new label based on node type
        """
        # First check if wallet already has a label in storage
        existing_wallet = self.storage.get_wallet_by_address(self.wallet.address())
        if existing_wallet and existing_wallet.get("label"):
            return existing_wallet.get("label")
        
        # Generate new label based on node type
        if self.node_type == NodeType.COLLECTION:
            return "collection"
        elif self.node_type == NodeType.MINER:
            # Count existing miner wallets to get next number
            existing_miners = self.storage.get_miner_count()
            return f"miner_{existing_miners + 1}"
        else:
            # Count existing user wallets to get next number
            existing_users = self.storage.get_user_count()
            return f"user_{existing_users + 1}"

    def is_miner(self) -> bool:
        return self.node_type == NodeType.MINER

    def is_collection(self) -> bool:
        return self.node_type == NodeType.COLLECTION

    def is_user(self) -> bool:
        return self.node_type == NodeType.USER

    def get_balance(self) -> float:
        """Get current wallet balance."""
        return self.blockchain.get_balance(self.wallet.address())

    # =========================================================================
    # PERSISTENCE - WITH VERSION CONTROL
    # =========================================================================

    def save_state(self) -> bool:
        """
        Save shared blockchain and pending transactions to disk.
        Uses versioned saving to prevent data loss from race conditions.
        Called before shutting down to persist data.
        
        Returns:
            True if successful, False otherwise
        """
        logger.info(f"[Node] Saving state for port {self.port}...")
        
        # Use save_all which handles version conflicts and retries
        success = self.storage.save_all(
            chain=self.blockchain.chain,
            pending_tx=self.blockchain.pending_transactions,
            max_retries=5  # Retry up to 5 times on conflict
        )
        
        if success:
            logger.info(f"[Node] State saved successfully for port {self.port}")
        else:
            logger.error(f"[Node] Failed to save state for port {self.port}")
        
        return success
    
    def reload_from_disk(self) -> bool:
        """
        Reload blockchain and pending transactions from disk.
        Call this when you detect version has changed.
        
        Returns:
            True if reloaded successfully
        """
        try:
            chain_data, self._chain_version = self.storage.load_blockchain()
            if chain_data:
                # Only replace if loaded chain is valid and longer/equal
                if len(chain_data) >= len(self.blockchain.chain):
                    self.blockchain = Blockchain(chain_data=chain_data)
                    logger.info(f"[Node] Reloaded blockchain: {len(self.blockchain.chain)} blocks (v{self._chain_version})")
            
            pending_tx, self._pending_version = self.storage.load_pending_transactions()
            # Merge pending transactions (don't lose any)
            existing_ids = {tx.get('tx_id') for tx in self.blockchain.pending_transactions}
            for tx in pending_tx:
                if tx.get('tx_id') not in existing_ids:
                    self.blockchain.pending_transactions.append(tx)
            logger.info(f"[Node] Reloaded pending transactions (v{self._pending_version})")
            
            return True
        except Exception as e:
            logger.error(f"[Node] Failed to reload from disk: {e}")
            return False
    
    def end_session(self) -> bool:
        """
        End the wallet session for this node.
        Called when shutting down to release the port.
        
        Returns:
            True if session ended, False otherwise
        """
        return self.storage.end_session(self.port)

    # =========================================================================
    # PEER MANAGEMENT & AUTO-DISCOVERY
    # =========================================================================

    def add_peer(self, peer_url: str, propagate: bool = True) -> bool:
        """
        Add a peer to the network (thread-safe).
        
        Args:
            peer_url: URL of the peer to add
            propagate: If True, announce this peer to all other peers
        """
        try:
            # Validate peer URL format
            if not peer_url or not isinstance(peer_url, str):
                return False
            
            # Must start with http:// or https://
            if not peer_url.startswith("http://") and not peer_url.startswith("https://"):
                return False
            
            with self._peers_lock:
                # Don't add self
                if self._is_me(peer_url):
                    return False
                
                # Check if already exists
                if peer_url in self.peers:
                    return True  # Already a peer
                
                self.peers.add(peer_url)
                logger.info(f"[Peers] Added peer: {peer_url}")
            
            # Propagate new peer to network (in background)
            if propagate:
                threading.Thread(
                    target=self._propagate_peer,
                    args=(peer_url,),
                    daemon=True
                ).start()
            
            return True
        except Exception as e:
            logger.error(f"[Peers] Error adding peer: {e}")
            return False

    def _propagate_peer(self, new_peer_url: str):
        """
        Announce a new peer to all existing peers.
        This spreads peer information across the network.
        """
        host_ip = os.getenv("HOST_IP", "localhost")
        my_url = f"http://{host_ip}:{self.port}"
        
        with self._peers_lock:
            peers_copy = set(self.peers)
        
        for peer in peers_copy:
            if peer == new_peer_url:
                continue  # Don't send peer info back to itself
            try:
                # Tell this peer about the new peer
                requests.post(
                    f"{peer}/announce_peer",
                    json={"peer": new_peer_url, "from": my_url},
                    timeout=2
                )
            except:
                pass
        
        # Also tell the new peer about us and our other peers
        try:
            # Register ourselves with the new peer
            requests.post(
                f"{new_peer_url}/announce_peer",
                json={"peer": my_url, "from": my_url},
                timeout=2
            )
            # Share our peer list with them
            for peer in peers_copy:
                if peer != new_peer_url:
                    requests.post(
                        f"{new_peer_url}/announce_peer",
                        json={"peer": peer, "from": my_url},
                        timeout=2
                    )
        except:
            pass

    def _is_me(self, url: str) -> bool:
        """Check if a URL refers to this node."""
        if not url:
            return False
            
        host_ip = os.getenv("HOST_IP", "localhost")
        identifiers = [
            f"localhost:{self.port}",
            f"127.0.0.1:{self.port}",
            f"0.0.0.0:{self.port}",
            f"{host_ip}:{self.port}"
        ]
        
        return any(x in url for x in identifiers)

    def connect_to_bootstrap_peers(self):
        """
        Connect to bootstrap peers on startup.
        This allows new nodes to join the network automatically.
        """
        connected = 0
        
        for peer_url in BOOTSTRAP_PEERS:
            # Skip self
            if self._is_me(peer_url):
                continue
            
            try:
                # Check if peer is online
                response = requests.get(peer_url, timeout=2)
                if response.status_code == 200:
                    # Add peer locally
                    self.add_peer(peer_url, propagate=True)
                    connected += 1
            except:
                pass  # Peer not available
        
        if connected > 0:
            logger.info(f"[Bootstrap] Connected to {connected} bootstrap peers")
        
        return connected

    def remove_peer(self, peer_url: str) -> bool:
        """Remove a peer from the network."""
        with self._peers_lock:
            if peer_url in self.peers:
                self.peers.discard(peer_url)
                logger.info(f"[Peers] Removed peer: {peer_url}")
                return True
            return False

    def discover_peers_from_network(self) -> int:
        """
        Discover new peers from existing peers.
        Returns number of new peers discovered.
        """
        new_peers = set()
        
        with self._peers_lock:
            current_peers = set(self.peers)
        
        for peer in current_peers:
            try:
                response = requests.get(f"{peer}/peers", timeout=3)
                if response.status_code == 200:
                    data = response.json()
                    # Get the peers list from the response dict
                    peer_list = data.get("peers", [])
                    for p in peer_list:
                        # Validate it's a proper URL before adding
                        if isinstance(p, str) and (p.startswith("http://") or p.startswith("https://")):
                            if p not in current_peers and not self._is_me(p):
                                new_peers.add(p)
            except Exception:
                pass
        
        # Add discovered peers (without propagation since they already exist)
        with self._peers_lock:
            for p in new_peers:
                if p not in self.peers:
                    self.peers.add(p)
        
        if new_peers:
            logger.info(f"[Peers] Discovered {len(new_peers)} new peers")
        
        return len(new_peers)

    def register_with_network(self, known_peer: str = None) -> bool:
        """
        Register this node with the network.
        Connects to known peer and discovers other peers.
        """
        try:
            host_ip = os.getenv("HOST_IP", "localhost")
            my_url = f"http://{host_ip}:{self.port}"
            
            # If no known peer, try default network nodes
            if not known_peer:
                # Use configured BOOTSTRAP_PEERS instead of hardcoded list
                known_peers = BOOTSTRAP_PEERS
            else:
                known_peers = [known_peer]
            
            connected = False
            
            # Track peers we've already registered with to avoid duplicates
            registered_with = set()
            
            for peer in known_peers:
                if self._is_me(peer):
                    continue
                if peer in registered_with:
                    continue
                    
                try:
                    # Register self with the peer
                    response = requests.post(
                        f"{peer}/register_node",
                        json={"node_url": my_url},
                        timeout=5
                    )
                    
                    if response.status_code in [200, 201]:
                        self.add_peer(peer)
                        registered_with.add(peer)
                        connected = True
                        logger.info(f"[Network] Registered with {peer}")
                        
                        # Get their peers too and register with them
                        data = response.json()
                        for p in data.get("peers", []):
                            if not self._is_me(p) and p not in registered_with:
                                self.add_peer(p)
                                # Register with discovered peer (one-time, no cascade)
                                try:
                                    requests.post(
                                        f"{p}/register_node",
                                        json={"node_url": my_url},
                                        timeout=3
                                    )
                                    registered_with.add(p)
                                except:
                                    pass
                except Exception as e:
                    logger.debug(f"[Network] Could not connect to {peer}: {e}")
            
            if connected:
                # Sync blockchain after joining
                self.sync_with_network()
                logger.info(f"[Network] Successfully joined network with {len(self.peers)} peers")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"[Network] Registration failed: {e}")
            return False

    # =========================================================================
    # CONSENSUS & SYNC
    # =========================================================================

    def resolve_conflicts(self) -> bool:
        """
        Resolve conflicts by adopting the longest valid chain.
        Implements the longest chain rule for consensus.
        
        Returns:
            True if our chain was replaced
        """
        with self._sync_lock:
            try:
                longest_chain = None
                max_length = len(self.blockchain.chain)
                replaced = False
                
                with self._peers_lock:
                    peers_copy = set(self.peers)
                
                for peer in peers_copy:
                    try:
                        response = requests.get(f"{peer}/chain", timeout=10)
                        if response.status_code != 200:
                            continue
                            
                        data = response.json()
                        chain_length = data.get('length', 0)
                        
                        # Only process if longer
                        if chain_length <= max_length:
                            continue
                        
                        peer_chain = []
                        for b in data['chain']:
                            block = Block(
                                b['index'],
                                b['timestamp'],
                                b['data'],
                                b['previous_hash'],
                                b['nonce']
                            )
                            block.hash = b['hash']
                            peer_chain.append(block)
                        
                        # Validate the chain
                        if self.blockchain.is_valid_chain(peer_chain):
                            max_length = len(peer_chain)
                            longest_chain = peer_chain
                            
                    except requests.exceptions.RequestException:
                        continue
                    except Exception as e:
                        logger.debug(f"[Consensus] Error processing peer chain: {e}")
                        continue
                
                if longest_chain:
                    self.blockchain.chain = longest_chain
                    with self.blockchain._lock:
                        self.blockchain._invalidate_cache()
                    # CRITICAL: Clean up pending transactions after chain replacement
                    # This removes any transactions that are now in the new chain
                    self.blockchain.cleanup_pending_transactions()
                    replaced = True
                    logger.info(f"[Consensus] Chain replaced. New length: {len(self.blockchain.chain)}")
                
                return replaced
                
            except Exception as e:
                logger.error(f"[Consensus] Error: {e}")
                return False

    def sync_with_network(self) -> bool:
        """
        Full sync with network - chain, pending transactions, and peers.
        """
        try:
            # 1. Sync blockchain (consensus)
            self.resolve_conflicts()
            
            # 2. Clean up pending transactions (remove already-mined ones)
            self.blockchain.cleanup_pending_transactions()
            
            # 3. Sync pending transactions from peers
            self._sync_pending_transactions()
            
            # 4. Discover new peers
            self.discover_peers_from_network()
            
            self._last_sync_time = time.time()
            return True
            
        except Exception as e:
            logger.error(f"[Sync] Error: {e}")
            return False

    def _sync_pending_transactions(self):
        """
        Sync pending transactions from peers.
        CRITICAL: Also checks that transactions aren't already mined.
        """
        with self._peers_lock:
            peers_copy = set(self.peers)
        
        # First, clean up our own pending transactions
        self.blockchain.cleanup_pending_transactions()
        
        # Get existing tx IDs (both pending AND mined)
        existing_tx_ids = {tx.get("tx_id") for tx in self.blockchain.pending_transactions}
        mined_tx_ids = self.blockchain.get_mined_transaction_ids()
        
        for peer in peers_copy:
            try:
                response = requests.get(f"{peer}/mempool", timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    for tx in data.get("transactions", []):
                        tx_id = tx.get("tx_id")
                        # Skip if already in pending OR already mined
                        if tx_id and tx_id not in existing_tx_ids and tx_id not in mined_tx_ids:
                            # Validate before adding (this also checks chain)
                            is_valid, error = self.blockchain.validate_transaction(tx)
                            if is_valid:
                                self.blockchain.pending_transactions.append(tx)
                                existing_tx_ids.add(tx_id)
            except:
                pass

    def start_sync_service(self):
        """Start background sync service."""
        if self.sync_active:
            return False
        
        self.sync_active = True
        self._sync_thread = threading.Thread(target=self._sync_loop, daemon=True)
        self._sync_thread.start()
        logger.info("[Sync] Background sync service started")
        return True

    def stop_sync_service(self):
        """Stop background sync service."""
        self.sync_active = False
        logger.info("[Sync] Background sync service stopped")

    def _sync_loop(self):
        """Background sync loop."""
        while self.sync_active:
            try:
                self.sync_with_network()
                time.sleep(self._sync_interval)
            except Exception as e:
                logger.error(f"[Sync] Loop error: {e}")
                time.sleep(5)

    # =========================================================================
    # MINING SERVICE (Only for Miner nodes)
    # =========================================================================

    def start_mining_service(self):
        """Start the background mining service."""
        if not self.is_miner():
            logger.warning(f"[Node] Only miner nodes can mine. This is a {self.node_type} node.")
            return False
        
        if self.mining_active:
            logger.info("[Mining] Mining service already running")
            return False
        
        self.mining_active = True
        self._mining_thread = threading.Thread(target=self._mining_loop, daemon=True)
        self._mining_thread.start()
        logger.info("[Mining] Mining service started")
        return True

    def stop_mining_service(self):
        """Stop the background mining service."""
        if not self.mining_active:
            return False
        
        self.mining_active = False
        logger.info("[Mining] Mining service stopped")
        return True

    def _mining_loop(self):
        """
        Background mining loop - mines blocks continuously.
        Implements proper consensus check before mining.
        """
        while self.mining_active:
            try:
                # STEP 1: Sync with network before mining (consensus)
                # This prevents mining on an outdated chain
                self.resolve_conflicts()
                
                # STEP 2: Mine block
                block = self.blockchain.mine_block(self.wallet.address())
                
                if block:
                    # STEP 3: Verify we still have the longest chain after mining
                    # (another miner might have broadcasted while we were mining)
                    pre_broadcast_length = len(self.blockchain.chain)
                    
                    balance = self.get_balance()
                    tx_count = len(block.data) - 1  # Exclude coinbase
                    logger.info(f"[Mining] ⛏️  Block #{block.index} mined! "
                                f"Reward: {MINING_REWARD} {COIN_SYMBOL}, "
                                f"Transactions: {tx_count}, "
                                f"Balance: {balance:.2f} {COIN_SYMBOL}")
                    
                    # STEP 4: Broadcast block to peers immediately
                    accepted_count = self._broadcast_block(block)
                    
                    # STEP 5: Quick sync to handle any conflicts
                    self.resolve_conflicts()
                    
                    # Check if our block was accepted (chain length should be same or greater)
                    if len(self.blockchain.chain) < pre_broadcast_length:
                        logger.warning(f"[Mining] Block may have been orphaned (chain replaced)")
                
                # Small delay between mining attempts
                time.sleep(0.1)
                
            except Exception as e:
                logger.error(f"[Mining] Error: {e}")
                time.sleep(1)

    def _broadcast_block(self, block) -> int:
        """
        Broadcast mined block to all peers.
        Returns number of peers that accepted the block.
        """
        block_dict = {
            "index": block.index,
            "timestamp": block.timestamp,
            "data": block.data,
            "previous_hash": block.previous_hash,
            "nonce": block.nonce,
            "hash": block.hash
        }
        
        accepted_count = 0
        
        with self._peers_lock:
            peers_copy = set(self.peers)
        
        for peer in peers_copy:
            try:
                response = requests.post(
                    f"{peer}/receive_block", 
                    json=block_dict, 
                    timeout=5
                )
                if response.status_code in [200, 201]:
                    accepted_count += 1
            except Exception as e:
                logger.debug(f"[Broadcast] Failed to send block to {peer}: {e}")
        
        logger.debug(f"[Broadcast] Block accepted by {accepted_count}/{len(peers_copy)} peers")
        return accepted_count

    def _broadcast_transaction(self, tx_dict: dict) -> int:
        """
        Broadcast transaction to all peers.
        Returns number of peers that received it.
        """
        received_count = 0
        
        with self._peers_lock:
            peers_copy = set(self.peers)
        
        for peer in peers_copy:
            try:
                response = requests.post(
                    f"{peer}/receive_transaction",
                    json=tx_dict,
                    timeout=5
                )
                if response.status_code in [200, 201]:
                    received_count += 1
            except Exception:
                pass
        
        return received_count

    # =========================================================================
    # AUTO-TRANSFER SERVICE (Only for Miner nodes)
    # =========================================================================

    def start_auto_transfer_service(self):
        """Start the auto-transfer service (transfers to collection when balance > threshold)."""
        if not self.is_miner():
            logger.warning(f"[Node] Only miner nodes need auto-transfer. This is a {self.node_type} node.")
            return False
        
        if self.auto_transfer_active:
            logger.info("[AutoTransfer] Service already running")
            return False
        
        self.auto_transfer_active = True
        self._auto_transfer_thread = threading.Thread(target=self._auto_transfer_loop, daemon=True)
        self._auto_transfer_thread.start()
        logger.info(f"[AutoTransfer] Service started (threshold: {MINER_AUTO_TRANSFER_THRESHOLD} {COIN_SYMBOL})")
        return True

    def stop_auto_transfer_service(self):
        """Stop the auto-transfer service."""
        if not self.auto_transfer_active:
            return False
        
        self.auto_transfer_active = False
        logger.info("[AutoTransfer] Service stopped")
        return True

    def _auto_transfer_loop(self):
        """Background loop to check balance and auto-transfer to collection."""
        while self.auto_transfer_active:
            try:
                # Sync with network first
                self.resolve_conflicts()
                
                balance = self.get_balance()
                
                # Check if we have pending auto-transfers already
                pending_auto_transfers = sum(
                    float(tx.get("amount", 0)) 
                    for tx in self.blockchain.pending_transactions 
                    if tx.get("sender") == self.wallet.address() and tx.get("tx_type") == "auto_transfer"
                )
                
                # Available balance = balance - pending outgoing transfers
                available_balance = balance - pending_auto_transfers
                
                if available_balance >= MINER_AUTO_TRANSFER_THRESHOLD:
                    # First check if collection node is online
                    if not self._is_collection_node_online():
                        logger.warning("[AutoTransfer] Collection node is offline. Keeping coins safe with miner.")
                    else:
                        # Get collection node address
                        collection_address = self._get_collection_address()
                        
                        if collection_address:
                            # Determine transfer amount
                            if AUTO_TRANSFER_ALL:
                                # Transfer ALL available balance (leaves 0)
                                transfer_amount = available_balance
                            else:
                                # Transfer only threshold amount
                                transfer_amount = MINER_AUTO_TRANSFER_THRESHOLD
                            
                            success = self.create_transfer(
                                receiver=collection_address,
                                amount=transfer_amount,
                                tx_type=TransactionType.AUTO_TRANSFER
                            )
                            
                            if success:
                                logger.info(f"[AutoTransfer] 💰 Transferred {transfer_amount:.2f} {COIN_SYMBOL} "
                                            f"to Collection Node. Remaining: {available_balance - transfer_amount:.2f} {COIN_SYMBOL}")
                        else:
                            logger.warning("[AutoTransfer] Collection node address not available")
                
                # Check every 5 seconds
                time.sleep(5)
                
            except Exception as e:
                logger.error(f"[AutoTransfer] Error: {e}")
                time.sleep(5)

    def _get_collection_address(self) -> str:
        """Get the collection node's wallet address."""
        if self.collection_node_address:
            return self.collection_node_address
        
        # Try to fetch from collection node
        try:
            response = requests.get(f"{self.collection_node_url}/address", timeout=5)
            if response.status_code == 200:
                data = response.json()
                self.collection_node_address = data.get("address")
                return self.collection_node_address
        except requests.exceptions.RequestException as e:
            logger.debug(f"[AutoTransfer] Could not fetch collection address: {e}")
        except Exception as e:
            logger.error(f"[AutoTransfer] Error getting collection address: {e}")
        
        return None

    def _is_collection_node_online(self) -> bool:
        """
        Check if collection node is reachable and healthy.
        
        This prevents auto-transfers when collection node is down,
        ensuring miner's coins remain safe.
        
        Returns:
            True if collection node is online and responding
        """
        try:
            response = requests.get(f"{self.collection_node_url}/health", timeout=3)
            if response.status_code == 200:
                return True
            # If health endpoint doesn't exist, try the address endpoint as fallback
            response = requests.get(f"{self.collection_node_url}/address", timeout=3)
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False
        except Exception as e:
            logger.debug(f"[AutoTransfer] Error checking collection node health: {e}")
            return False

    # =========================================================================
    # TRANSACTION HANDLING
    # =========================================================================

    def get_available_balance(self) -> float:
        """Get balance minus pending outgoing transactions."""
        balance = self.get_balance()
        
        # Subtract pending outgoing transactions
        pending_outgoing = sum(
            float(tx.get("amount", 0)) 
            for tx in self.blockchain.pending_transactions 
            if tx.get("sender") == self.wallet.address()
        )
        
        return max(0.0, balance - pending_outgoing)

    def create_transfer(self, receiver: str, amount: float, 
                       tx_type: str = TransactionType.TRANSFER) -> bool:
        """
        Create and broadcast a transfer transaction.
        
        Args:
            receiver: Receiver's wallet address
            amount: Amount to transfer
            tx_type: Transaction type
            
        Returns:
            True if successful
            
        Raises:
            InsufficientBalanceError: If balance is insufficient
            ValueError: If amount is invalid
        """
        try:
            # Validate amount
            if amount <= 0:
                raise ValueError("Amount must be positive")
            
            if receiver == self.wallet.address():
                raise ValueError("Cannot send to yourself")
            
            # Check available balance (balance minus pending outgoing)
            available_balance = self.get_available_balance()
            if available_balance < amount:
                logger.warning(f"[Transfer] Insufficient balance. Available: {available_balance:.2f} {COIN_SYMBOL}, "
                               f"Need: {amount:.2f} {COIN_SYMBOL}")
                return False
            
            # Create and sign transaction
            tx = Transaction(
                sender=self.wallet.address(),
                receiver=receiver,
                amount=amount,
                tx_type=tx_type
            )
            tx.sign(self.wallet)
            
            tx_dict = tx.to_dict()
            
            # Add to pending transactions
            self.blockchain.pending_transactions.append(tx_dict)
            
            # Broadcast to peers
            broadcast_count = self._broadcast_transaction(tx_dict)
            
            logger.info(f"[Transfer] Created transaction: {amount} {COIN_SYMBOL} to {receiver[:16]}... "
                        f"(broadcast to {broadcast_count} peers)")
            return True
            
        except ValueError as e:
            logger.error(f"[Transfer] Validation error: {e}")
            return False
        except Exception as e:
            logger.error(f"[Transfer] Error: {e}")
            return False

    # =========================================================================
    # COLLECTION NODE FUNCTIONS
    # =========================================================================
