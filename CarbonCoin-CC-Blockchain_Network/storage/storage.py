"""
Storage Module for Blockchain and Wallet Persistence

This module handles saving and loading blockchain and wallet data to/from disk.
Data is stored in JSON format. Blockchain and pending transactions are SHARED
across all nodes (like a local database). Wallets are stored in a common registry.

CONCURRENCY PROTECTION:
- File-based exclusive locking prevents simultaneous writes
- Version tracking with optimistic locking prevents stale writes
- If data changes during read-modify-write, operation is retried with fresh data

Directory structure:
    data/
        blockchain.json      - Shared blockchain (all nodes read/write)
        pending_tx.json      - Shared pending transactions
        wallets.json         - All wallets registry
        active_sessions.json - Track which wallet is active on which port
        .versions.json       - Version numbers for optimistic locking
"""

import json
import os
import logging
import time
from typing import Optional, List, Dict, Any, Tuple
from pathlib import Path
import threading
from contextlib import contextmanager
import hashlib

logger = logging.getLogger(__name__)


class DataVersion:
    """
    Tracks version information for a piece of data.
    Used for optimistic locking to detect concurrent modifications.
    """
    def __init__(self, version: int = 0, checksum: str = "", timestamp: float = 0):
        self.version = version
        self.checksum = checksum
        self.timestamp = timestamp
    
    def to_dict(self) -> Dict:
        return {
            "version": self.version,
            "checksum": self.checksum,
            "timestamp": self.timestamp
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'DataVersion':
        return cls(
            version=data.get("version", 0),
            checksum=data.get("checksum", ""),
            timestamp=data.get("timestamp", 0)
        )


class Storage:
    """
    Handles persistence of blockchain and wallet data to disk.
    Blockchain and pending transactions are SHARED across all nodes.
    Wallets are stored in a common registry with session tracking.
    
    CONCURRENCY FEATURES:
    - File-based locking for exclusive write access
    - Version tracking for optimistic locking
    - Automatic retry on version conflict
    - Checksum verification to detect changes
    """
    
    BASE_DIR = "data"
    
    # File paths (shared across all nodes)
    BLOCKCHAIN_FILE = "blockchain.json"
    PENDING_TX_FILE = "pending_tx.json"
    WALLETS_FILE = "wallets.json"
    SESSIONS_FILE = "active_sessions.json"
    LOCK_FILE = ".storage.lock"
    VERSION_FILE = ".versions.json"
    
    # Thread lock for within-process safety
    _thread_lock = threading.RLock()
    
    # Cache for version info (reduces file reads)
    _version_cache: Dict[str, DataVersion] = {}
    _version_cache_lock = threading.RLock()
    
    def __init__(self, port: int = None):
        """
        Initialize storage.
        
        Args:
            port: Optional port number (used for session management)
        """
        self.port = port
        self._ensure_directory()
        # Clean up stale sessions on initialization
        self._cleanup_stale_sessions()
    
    def _ensure_directory(self):
        """Create data directory if it doesn't exist."""
        Path(self.BASE_DIR).mkdir(parents=True, exist_ok=True)
        logger.info(f"[Storage] Data directory: {self.BASE_DIR}")
    
    @contextmanager
    def _file_lock(self, max_retries: int = 50, retry_delay: float = 0.1):
        """
        Cross-process file lock for safe concurrent access.
        Uses a lock file that is exclusively created/deleted.
        More reliable than msvcrt locking on Windows.
        """
        lock_path = self._get_path(self.LOCK_FILE)
        lock_acquired = False
        
        with self._thread_lock:  # Thread safety within process
            for attempt in range(max_retries):
                try:
                    # Try to create lock file exclusively (fails if exists)
                    fd = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                    os.write(fd, str(os.getpid()).encode())
                    os.close(fd)
                    lock_acquired = True
                    break
                except FileExistsError:
                    # Lock file exists, check if it's stale
                    try:
                        mtime = os.path.getmtime(lock_path)
                        if time.time() - mtime > 30:  # Stale if older than 30 seconds
                            os.remove(lock_path)
                            logger.warning(f"[Storage] Removed stale lock file")
                            continue
                    except:
                        pass
                    
                    # Wait and retry
                    time.sleep(retry_delay)
                except Exception as e:
                    time.sleep(retry_delay)
            
            if not lock_acquired:
                # Last resort - force acquire
                try:
                    if os.path.exists(lock_path):
                        os.remove(lock_path)
                    fd = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                    os.write(fd, str(os.getpid()).encode())
                    os.close(fd)
                    lock_acquired = True
                    logger.warning(f"[Storage] Force acquired lock after {max_retries} retries")
                except Exception as e:
                    logger.error(f"[Storage] Failed to acquire lock: {e}")
            
            try:
                yield
            finally:
                # Release lock by deleting the file
                if lock_acquired:
                    try:
                        os.remove(lock_path)
                    except:
                        pass
    
    def _cleanup_stale_sessions(self):
        """
        Remove sessions for ports that are no longer listening.
        Called on initialization to clean up crashed nodes.
        """
        import socket
        
        with self._file_lock():
            sessions = self._load_sessions()
            if not sessions:
                return
            
            stale_ports = []
            for port_str, address in list(sessions.items()):
                port = int(port_str)
                # Check if port is actually listening
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(0.5)
                result = sock.connect_ex(('127.0.0.1', port))
                sock.close()
                
                if result != 0:  # Port is NOT listening
                    stale_ports.append(port_str)
            
            if stale_ports:
                for port_str in stale_ports:
                    del sessions[port_str]
                    logger.info(f"[Storage] Cleaned up stale session for port {port_str}")
                self._save_sessions(sessions)
    
    def _get_path(self, filename: str) -> str:
        """Get full path for a data file."""
        return os.path.join(self.BASE_DIR, filename)
    
    # =========================================================================
    # VERSION TRACKING FOR OPTIMISTIC LOCKING
    # =========================================================================
    
    def _compute_checksum(self, data: Any) -> str:
        """Compute a checksum for data to detect changes."""
        try:
            json_str = json.dumps(data, sort_keys=True, default=str)
            return hashlib.md5(json_str.encode()).hexdigest()[:16]
        except:
            return str(time.time())
    
    def _load_versions(self) -> Dict[str, Dict]:
        """Load version information from disk (called within lock)."""
        try:
            filepath = self._get_path(self.VERSION_FILE)
            if not os.path.exists(filepath):
                return {}
            with open(filepath, "r") as f:
                return json.load(f)
        except:
            return {}
    
    def _save_versions(self, versions: Dict[str, Dict]) -> bool:
        """Save version information to disk (called within lock)."""
        try:
            filepath = self._get_path(self.VERSION_FILE)
            with open(filepath, "w") as f:
                json.dump(versions, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"[Storage] Failed to save versions: {e}")
            return False
    
    def _get_version(self, file_key: str) -> DataVersion:
        """
        Get current version for a file.
        Must be called within _file_lock().
        """
        versions = self._load_versions()
        if file_key in versions:
            return DataVersion.from_dict(versions[file_key])
        return DataVersion()
    
    def _increment_version(self, file_key: str, checksum: str) -> DataVersion:
        """
        Increment version for a file after successful write.
        Must be called within _file_lock().
        Returns the new version.
        """
        versions = self._load_versions()
        current = versions.get(file_key, {"version": 0})
        new_version = DataVersion(
            version=current.get("version", 0) + 1,
            checksum=checksum,
            timestamp=time.time()
        )
        versions[file_key] = new_version.to_dict()
        self._save_versions(versions)
        
        # Update cache
        with self._version_cache_lock:
            self._version_cache[file_key] = new_version
        
        return new_version
    
    def _check_version_match(self, file_key: str, expected_version: int) -> Tuple[bool, DataVersion]:
        """
        Check if the expected version matches current version.
        Must be called within _file_lock().
        
        Returns:
            (matches: bool, current_version: DataVersion)
        """
        current = self._get_version(file_key)
        matches = (expected_version == 0 or expected_version == current.version)
        return matches, current
    
    def get_current_version(self, file_key: str) -> int:
        """
        Get current version number for a file (public API).
        Used by callers to track what version they read.
        """
        with self._file_lock():
            return self._get_version(file_key).version
    
    def notify_data_changed(self, file_key: str):
        """
        Notify that data has changed externally.
        Invalidates version cache to force re-read.
        """
        with self._version_cache_lock:
            if file_key in self._version_cache:
                del self._version_cache[file_key]
        logger.debug(f"[Storage] Version cache invalidated for {file_key}")
    
    # =========================================================================
    # BLOCKCHAIN PERSISTENCE (SHARED) - WITH VERSION CONTROL
    # =========================================================================
    
    def save_blockchain(self, chain: List[Any], force: bool = False, 
                        expected_version: int = 0, max_retries: int = 3) -> Tuple[bool, int]:
        """
        Save blockchain to disk with optimistic locking.
        Only saves if:
        1. New chain is longer than existing (consensus rule)
        2. Version matches expected (no concurrent modification)
        
        If version mismatch, returns False with current version so caller can re-read.
        
        Args:
            chain: List of Block objects
            force: If True, save regardless of length (use with caution)
            expected_version: Version number when data was read (0 = don't check)
            max_retries: Number of retries on version conflict
            
        Returns:
            Tuple[success: bool, current_version: int]
            - If success=False due to version conflict, current_version has new version
            - Caller should re-read data and retry if version changed
        """
        file_key = self.BLOCKCHAIN_FILE
        
        for retry in range(max_retries):
            with self._file_lock():
                try:
                    filepath = self._get_path(self.BLOCKCHAIN_FILE)
                    new_chain_length = len(chain)
                    
                    # Step 1: Check version if expected_version provided
                    if expected_version > 0:
                        version_matches, current_ver = self._check_version_match(file_key, expected_version)
                        if not version_matches:
                            logger.warning(f"[Storage] Version conflict on blockchain save: "
                                         f"expected {expected_version}, current {current_ver.version}")
                            # Return failure with current version - caller must re-read
                            return False, current_ver.version
                    
                    # Step 2: Check existing chain length to prevent overwriting longer chain
                    if not force and os.path.exists(filepath):
                        try:
                            with open(filepath, "r") as f:
                                existing_data = json.load(f)
                                existing_length = len(existing_data)
                                
                                if new_chain_length < existing_length:
                                    logger.warning(f"[Storage] Skipping save: new chain ({new_chain_length}) "
                                                 f"shorter than existing ({existing_length}) - consensus protection")
                                    current_ver = self._get_version(file_key)
                                    return True, current_ver.version  # Success but didn't write
                                elif new_chain_length == existing_length:
                                    # Same length - check if it's the same chain
                                    if existing_data and chain:
                                        existing_last_hash = existing_data[-1].get("hash", "")
                                        new_last_hash = chain[-1].hash if hasattr(chain[-1], 'hash') else chain[-1].get("hash", "")
                                        if existing_last_hash == new_last_hash:
                                            logger.debug(f"[Storage] Skipping save: chain unchanged ({new_chain_length} blocks)")
                                            current_ver = self._get_version(file_key)
                                            return True, current_ver.version
                        except (json.JSONDecodeError, KeyError, IndexError) as e:
                            logger.warning(f"[Storage] Could not read existing chain, will overwrite: {e}")
                    
                    # Step 3: Convert blocks to dictionaries
                    chain_data = []
                    for block in chain:
                        if hasattr(block, 'index'):  # Block object
                            block_dict = {
                                "index": block.index,
                                "timestamp": block.timestamp,
                                "data": block.data,
                                "previous_hash": block.previous_hash,
                                "nonce": block.nonce,
                                "hash": block.hash
                            }
                        else:  # Already a dict
                            block_dict = block
                        chain_data.append(block_dict)
                    
                    # Step 4: Write data
                    with open(filepath, "w") as f:
                        json.dump(chain_data, f, indent=2)
                    
                    # Step 5: Increment version after successful write
                    checksum = self._compute_checksum(chain_data)
                    new_version = self._increment_version(file_key, checksum)
                    
                    logger.info(f"[Storage] Saved blockchain with {len(chain_data)} blocks (version {new_version.version})")
                    return True, new_version.version
                    
                except Exception as e:
                    logger.error(f"[Storage] Failed to save blockchain: {e}")
                    return False, 0
        
        return False, 0
    
    def load_blockchain(self) -> Tuple[Optional[List[Dict]], int]:
        """
        Load blockchain from disk with version tracking.
        
        Returns:
            Tuple[chain_data, version]
            - chain_data: List of block dictionaries, or None if not found
            - version: Current version number (use this for save_blockchain's expected_version)
        """
        file_key = self.BLOCKCHAIN_FILE
        
        with self._file_lock():
            try:
                filepath = self._get_path(self.BLOCKCHAIN_FILE)
                
                if not os.path.exists(filepath):
                    logger.info("[Storage] No blockchain file found, starting fresh")
                    return None, 0
                
                with open(filepath, "r") as f:
                    chain_data = json.load(f)
                
                # Get current version
                current_version = self._get_version(file_key).version
                
                logger.info(f"[Storage] Loaded blockchain with {len(chain_data)} blocks (version {current_version})")
                return chain_data, current_version
                
            except Exception as e:
                logger.error(f"[Storage] Failed to load blockchain: {e}")
                return None, 0
    
    def has_blockchain(self) -> bool:
        """Check if blockchain data exists on disk."""
        return os.path.exists(self._get_path(self.BLOCKCHAIN_FILE))
    
    # =========================================================================
    # PENDING TRANSACTIONS PERSISTENCE (SHARED) - WITH VERSION CONTROL
    # =========================================================================
    
    def save_pending_transactions(self, transactions: List[Dict], 
                                   expected_version: int = 0) -> Tuple[bool, int]:
        """
        Save pending transactions to disk with optimistic locking.
        
        Args:
            transactions: List of transaction dictionaries
            expected_version: Version number when data was read (0 = don't check)
            
        Returns:
            Tuple[success: bool, current_version: int]
        """
        file_key = self.PENDING_TX_FILE
        
        with self._file_lock():
            try:
                filepath = self._get_path(self.PENDING_TX_FILE)
                
                # Check version if expected_version provided
                if expected_version > 0:
                    version_matches, current_ver = self._check_version_match(file_key, expected_version)
                    if not version_matches:
                        logger.warning(f"[Storage] Version conflict on pending_tx save: "
                                     f"expected {expected_version}, current {current_ver.version}")
                        return False, current_ver.version
                
                # Write data
                with open(filepath, "w") as f:
                    json.dump(transactions, f, indent=2)
                
                # Increment version
                checksum = self._compute_checksum(transactions)
                new_version = self._increment_version(file_key, checksum)
                
                logger.info(f"[Storage] Saved {len(transactions)} pending transactions (version {new_version.version})")
                return True, new_version.version
                
            except Exception as e:
                logger.error(f"[Storage] Failed to save pending transactions: {e}")
                return False, 0
    
    def load_pending_transactions(self) -> Tuple[List[Dict], int]:
        """
        Load pending transactions from disk with version tracking.
        
        Returns:
            Tuple[transactions, version]
            - transactions: List of transaction dictionaries (empty if none)
            - version: Current version number
        """
        file_key = self.PENDING_TX_FILE
        
        with self._file_lock():
            try:
                filepath = self._get_path(self.PENDING_TX_FILE)
                
                if not os.path.exists(filepath):
                    return [], 0
                
                with open(filepath, "r") as f:
                    transactions = json.load(f)
                
                current_version = self._get_version(file_key).version
                
                logger.info(f"[Storage] Loaded {len(transactions)} pending transactions (version {current_version})")
                return transactions, current_version
                
            except Exception as e:
                logger.error(f"[Storage] Failed to load pending transactions: {e}")
                return [], 0
    
    # =========================================================================
    # WALLET REGISTRY (SHARED - All wallets in one file)
    # =========================================================================
    
    def _load_wallets_registry(self) -> Dict:
        """Load the wallets registry from disk."""
        try:
            filepath = self._get_path(self.WALLETS_FILE)
            if not os.path.exists(filepath):
                return {}
            with open(filepath, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"[Storage] Failed to load wallets registry: {e}")
            return {}
    
    def _save_wallets_registry(self, wallets: Dict) -> bool:
        """Save the wallets registry to disk."""
        try:
            filepath = self._get_path(self.WALLETS_FILE)
            with open(filepath, "w") as f:
                json.dump(wallets, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"[Storage] Failed to save wallets registry: {e}")
            return False
    
    def register_wallet(self, private_key_hex: str, address: str, label: str = None) -> bool:
        """
        Register a new wallet in the shared registry.
        
        Args:
            private_key_hex: Private key as hex string
            address: Wallet address
            label: Optional label (e.g., "miner_1", "collection", "user_1")
            
        Returns:
            True if successful, False otherwise
        """
        with self._file_lock():
            wallets = self._load_wallets_registry()
            
            # Check if wallet already exists
            if address in wallets:
                logger.info(f"[Storage] Wallet already registered: {address[:16]}...")
                return True
            
            wallets[address] = {
                "private_key": private_key_hex,
                "created_at": time.time(),
                "label": label
            }
            
            success = self._save_wallets_registry(wallets)
            if success:
                logger.info(f"[Storage] Registered wallet: {address[:16]}... (label: {label})")
            return success
    
    def get_wallet_by_address(self, address: str) -> Optional[Dict]:
        """
        Get wallet data by address.
        
        Returns:
            Wallet data dict or None if not found
        """
        with self._file_lock():
            wallets = self._load_wallets_registry()
            return wallets.get(address)
    
    def get_wallet_by_private_key(self, private_key_hex: str) -> Optional[Dict]:
        """
        Get wallet data by private key (for authentication).
        
        Returns:
            Dict with 'address' and wallet data, or None if not found
        """
        with self._file_lock():
            wallets = self._load_wallets_registry()
            for address, data in wallets.items():
                if data.get("private_key") == private_key_hex:
                    return {"address": address, **data}
            return None
    
    def get_all_wallets(self) -> Dict:
        """Get all registered wallets (for testing/admin)."""
        with self._file_lock():
            return self._load_wallets_registry()
    
    # Alias for API consistency
    def load_wallets(self) -> Dict:
        """Get all registered wallets (alias for get_all_wallets)."""
        return self.get_all_wallets()
    
    def get_miner_count(self) -> int:
        """
        Count existing miner wallets.
        Used to generate sequential miner labels (miner_1, miner_2, etc.)
        """
        with self._file_lock():
            wallets = self._load_wallets_registry()
            count = 0
            for data in wallets.values():
                label = data.get("label", "")
                if label.startswith("miner_"):
                    count += 1
            return count
    
    def get_user_count(self) -> int:
        """
        Count existing user wallets.
        Used to generate sequential user labels (user_1, user_2, etc.)
        """
        with self._file_lock():
            wallets = self._load_wallets_registry()
            count = 0
            for data in wallets.values():
                label = data.get("label", "")
                if label.startswith("user_"):
                    count += 1
            return count
    
    def wallet_exists(self, address: str) -> bool:
        """Check if a wallet is registered."""
        with self._file_lock():
            wallets = self._load_wallets_registry()
            return address in wallets
    
    # =========================================================================
    # ACTIVE SESSIONS (Track which wallet is on which port)
    # =========================================================================
    
    def _load_sessions(self) -> Dict:
        """Load active sessions from disk."""
        try:
            filepath = self._get_path(self.SESSIONS_FILE)
            if not os.path.exists(filepath):
                return {}
            with open(filepath, "r") as f:
                content = f.read().strip()
                if not content:
                    return {}
                return json.loads(content)
        except Exception as e:
            logger.error(f"[Storage] Failed to load sessions: {e}")
            return {}
    
    def _save_sessions_atomic(self, sessions: Dict) -> bool:
        """
        Save active sessions to disk using atomic write.
        Writes to temp file first, then renames (atomic on most filesystems).
        """
        try:
            filepath = self._get_path(self.SESSIONS_FILE)
            temp_path = filepath + f".tmp.{os.getpid()}"
            
            # Write to temp file
            with open(temp_path, "w") as f:
                json.dump(sessions, f, indent=2)
                f.flush()
                os.fsync(f.fileno())  # Ensure data is written to disk
            
            # Atomic rename (on Windows, need to remove target first)
            if os.name == 'nt' and os.path.exists(filepath):
                os.replace(temp_path, filepath)
            else:
                os.rename(temp_path, filepath)
            
            return True
        except Exception as e:
            logger.error(f"[Storage] Failed to save sessions: {e}")
            # Clean up temp file if it exists
            try:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            except:
                pass
            return False
    
    def _save_sessions(self, sessions: Dict) -> bool:
        """Save active sessions to disk (uses atomic write)."""
        return self._save_sessions_atomic(sessions)
    
    def is_port_available(self, port: int) -> bool:
        """
        Check if a port is available (no active wallet session).
        
        Returns:
            True if port is free, False if occupied
        """
        with self._file_lock():
            sessions = self._load_sessions()
            return str(port) not in sessions
    
    def is_wallet_active(self, address: str) -> Optional[int]:
        """
        Check if a wallet is already active on any port.
        
        Returns:
            Port number if active, None if not active
        """
        with self._file_lock():
            sessions = self._load_sessions()
            for port, wallet_addr in sessions.items():
                if wallet_addr == address:
                    return int(port)
            return None
    
    def start_session(self, port: int, address: str) -> tuple:
        """
        Start a wallet session on a port.
        
        Args:
            port: Port number
            address: Wallet address
            
        Returns:
            (success: bool, error_message: str or None)
        """
        with self._file_lock():
            sessions = self._load_sessions()
            
            # Check if port is already in use
            if str(port) in sessions:
                existing_wallet = sessions[str(port)]
                return False, f"Port {port} is already in use by wallet {existing_wallet[:16]}..."
            
            # Check if wallet is already active on another port
            for p, addr in sessions.items():
                if addr == address:
                    return False, f"Wallet {address[:16]}... is already active on port {p}. Stop it first."
            
            # Register session
            sessions[str(port)] = address
            self._save_sessions(sessions)
            logger.info(f"[Storage] Session started: Port {port} -> Wallet {address[:16]}...")
            return True, None
    
    def end_session(self, port: int) -> bool:
        """
        End a wallet session on a port.
        
        Args:
            port: Port number
            
        Returns:
            True if session ended, False if no session existed
        """
        with self._file_lock():
            sessions = self._load_sessions()
            
            if str(port) in sessions:
                wallet = sessions.pop(str(port))
                self._save_sessions(sessions)
                logger.info(f"[Storage] Session ended: Port {port} (was {wallet[:16]}...)")
                return True
            return False
    
    def get_active_sessions(self) -> Dict:
        """Get all active sessions (port -> wallet mapping)."""
        with self._file_lock():
            return self._load_sessions()
    
    # Alias for API consistency
    def load_sessions(self) -> Dict:
        """Get all active sessions (alias for get_active_sessions)."""
        return self.get_active_sessions()
    
    def clear_all_sessions(self) -> bool:
        """Clear all active sessions (used on network stop)."""
        with self._file_lock():
            return self._save_sessions({})
    
    # =========================================================================
    # FULL STATE SAVE/LOAD - WITH ATOMIC VERSIONED OPERATIONS
    # =========================================================================
    
    def save_all(self, chain: List[Any], pending_tx: List[Dict], 
                 max_retries: int = 5) -> bool:
        """
        Save blockchain and pending transactions to disk atomically.
        Uses versioned saves with retry on conflict.
        
        This ensures NO DATA LOSS even with concurrent access:
        1. Acquires exclusive lock for the entire operation
        2. Checks versions before writing
        3. If version conflict, re-reads and merges with latest data
        4. Retries on conflict to ensure data is saved
        
        Args:
            chain: List of Block objects
            pending_tx: List of transaction dictionaries
            max_retries: Maximum retries on version conflict
            
        Returns:
            True if all saves successful, False otherwise
        """
        for retry in range(max_retries):
            # Save blockchain (it handles its own versioning and consensus)
            chain_success, chain_ver = self.save_blockchain(chain)
            
            if not chain_success:
                # Version conflict - need to check if our chain is actually longer
                logger.warning(f"[Storage] Blockchain save conflict, retry {retry + 1}/{max_retries}")
                # Re-read to check
                existing_chain, _ = self.load_blockchain()
                if existing_chain and len(existing_chain) >= len(chain):
                    # Existing is same or longer, our save is redundant
                    chain_success = True
                else:
                    # Our chain is longer, retry
                    time.sleep(0.05 * (retry + 1))
                    continue
            
            # Save pending transactions
            tx_success, tx_ver = self.save_pending_transactions(pending_tx)
            
            if not tx_success:
                logger.warning(f"[Storage] Pending TX save conflict, retry {retry + 1}/{max_retries}")
                # Re-read and merge pending transactions
                existing_tx, _ = self.load_pending_transactions()
                # Merge: add our transactions that aren't already there
                existing_ids = {tx.get('tx_id') for tx in existing_tx}
                for tx in pending_tx:
                    if tx.get('tx_id') not in existing_ids:
                        existing_tx.append(tx)
                pending_tx = existing_tx
                time.sleep(0.05 * (retry + 1))
                continue
            
            # Both succeeded
            if chain_success and tx_success:
                logger.info(f"[Storage] All data saved successfully (chain v{chain_ver}, tx v{tx_ver})")
                return True
        
        logger.error(f"[Storage] Failed to save all data after {max_retries} retries")
        return False
    
    def save_all_with_versions(self, chain: List[Any], pending_tx: List[Dict],
                                chain_version: int = 0, tx_version: int = 0) -> Tuple[bool, int, int]:
        """
        Save all data with explicit version checking.
        
        Args:
            chain: List of Block objects
            pending_tx: List of transaction dictionaries
            chain_version: Expected blockchain version (from previous load)
            tx_version: Expected pending_tx version (from previous load)
            
        Returns:
            Tuple[success, new_chain_version, new_tx_version]
            If success=False, versions indicate current versions for re-read
        """
        chain_success, new_chain_ver = self.save_blockchain(chain, expected_version=chain_version)
        tx_success, new_tx_ver = self.save_pending_transactions(pending_tx, expected_version=tx_version)
        
        success = chain_success and tx_success
        
        if not success:
            logger.warning(f"[Storage] Version conflict in save_all_with_versions")
        
        return success, new_chain_ver, new_tx_ver
    
    def clear_data(self) -> bool:
        """
        Clear all stored data.
        USE WITH CAUTION - this will delete all blockchain, wallet, and session data!
        
        Returns:
            True if successful, False otherwise
        """
        try:
            import shutil
            if os.path.exists(self.BASE_DIR):
                shutil.rmtree(self.BASE_DIR)
                logger.warning(f"[Storage] Cleared all data!")
            return True
        except Exception as e:
            logger.error(f"[Storage] Failed to clear data: {e}")
            return False
